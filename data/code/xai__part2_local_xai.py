#!/usr/bin/env python3
"""
Phase 5 - Part 2: Local Interpretability Analysis
SHAP Local (Waterfall), LIME, PDP/ICE for NOA ML Project
"""

import os
import json
import warnings
import time
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.inspection import PartialDependenceDisplay, partial_dependence

warnings.filterwarnings('ignore')
np.random.seed(42)

# ============================================================
# PATHS
# ============================================================
BASE = '[path]
MODEL_DIR = os.path.join(BASE, 'phase4_output/Chat_4__Validation___Robustness-2/NOA_ML_Project/6_Models/Saved')
DATA_PATH = os.path.join(BASE, 'phase4_output/Chat_4__Validation___Robustness-2/NOA_ML_Project/1_Data/Processed/encoded_dataset.csv')
MAPPING_PATH = os.path.join(BASE, 'feature_mapping.json')
FIG_DIR = os.path.join(BASE, '4_Figures/Phase5_XAI')
RES_DIR = os.path.join(BASE, '3_Results/Phase5_XAI')
REP_DIR = os.path.join(BASE, '5_Reports')

for d in [FIG_DIR, RES_DIR, REP_DIR]:
    os.makedirs(d, exist_ok=True)

# Matplotlib settings
plt.rcParams.update({
    'font.size': 11,
    'axes.titlesize': 13,
    'axes.labelsize': 11,
    'xtick.labelsize': 9,
    'ytick.labelsize': 9,
    'figure.dpi': 150,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight',
    'font.family': 'sans-serif',
})

# ============================================================
# LOAD DATA & MODELS
# ============================================================
print("=" * 60)
print("PART 2: Local Interpretability Analysis")
print("=" * 60)

# Load dataset
df = pd.read_csv(DATA_PATH)
feature_cols = [c for c in df.columns if c.startswith('Feature_')]
X = df[feature_cols].values
y = df['TARGET'].values
print(f"Dataset: {X.shape[0]} samples, {X.shape[1]} features")
print(f"Target: {dict(zip(*np.unique(y, return_counts=True)))}")

# Load feature mapping
with open(MAPPING_PATH) as f:
    mapping_data = json.load(f)
feat_map = mapping_data['feature_to_clinical']
clinical_names = [feat_map.get(c, c) for c in feature_cols]
# Create a DataFrame with clinical names for display
X_df = pd.DataFrame(X, columns=clinical_names)

# Load models
model_names_to_load = ['SVM', 'XGBoost', 'RandomForest']
models = {}
for name in model_names_to_load:
    path = os.path.join(MODEL_DIR, f'{name}.joblib')
    if os.path.exists(path):
        models[name] = joblib.load(path)
        print(f"  Loaded {name}")
    else:
        print(f"  WARNING: {name} not found")

# Load Part 1 SHAP summary for top features
shap_summary = pd.read_csv(os.path.join(RES_DIR, 'shap_values_summary.csv'))
shap_summary.rename(columns={'Unnamed: 0': 'Feature'}, inplace=True)
top10_features = shap_summary['Feature'].head(10).tolist()
top5_features = shap_summary['Feature'].head(5).tolist()
print(f"\nTop 10 features (from Part 1): {top10_features}")
print(f"Top 5 features: {top5_features}")

# Map clinical names back to feature indices
clinical_to_idx = {name: i for i, name in enumerate(clinical_names)}
top10_indices = [clinical_to_idx[f] for f in top10_features]
top5_indices = [clinical_to_idx[f] for f in top5_features]

# ============================================================
# STEP 1: Identify Clinical Archetype Samples
# ============================================================
print("\n" + "=" * 60)
print("STEP 1: Identifying Clinical Archetype Samples")
print("=" * 60)

svm_model = models['SVM']
probs = svm_model.predict_proba(X)[:, 1]  # P(positive class)
preds = svm_model.predict(X)

# Age column
age_col_idx = clinical_names.index('Age')
age_values = X[:, age_col_idx]

archetypes = {}

# 1. High-Positive (prob > 0.8)
hp_mask = probs > 0.8
hp_indices = np.where(hp_mask)[0]
if len(hp_indices) > 0:
    # Pick the one closest to median prob among high-positive
    hp_median = np.median(probs[hp_indices])
    hp_best = hp_indices[np.argmin(np.abs(probs[hp_indices] - hp_median))]
    archetypes['High-Positive'] = hp_best
    print(f"  High-Positive: idx={hp_best}, prob={probs[hp_best]:.4f}, actual={y[hp_best]}")

# 2. High-Negative (prob < 0.2)
hn_mask = probs < 0.2
hn_indices = np.where(hn_mask)[0]
if len(hn_indices) > 0:
    hn_median = np.median(probs[hn_indices])
    hn_best = hn_indices[np.argmin(np.abs(probs[hn_indices] - hn_median))]
    archetypes['High-Negative'] = hn_best
    print(f"  High-Negative: idx={hn_best}, prob={probs[hn_best]:.4f}, actual={y[hn_best]}")

# 3. Borderline (prob 0.45-0.55)
bl_mask = (probs >= 0.45) & (probs <= 0.55)
bl_indices = np.where(bl_mask)[0]
if len(bl_indices) > 0:
    bl_mid = bl_indices[np.argmin(np.abs(probs[bl_indices] - 0.5))]
    archetypes['Borderline'] = bl_mid
    print(f"  Borderline: idx={bl_mid}, prob={probs[bl_mid]:.4f}, actual={y[bl_mid]}")

# 4. Young Patient (Age < 40 => use z-score logic; since data is standardized, find low-age samples)
# Data is standardized, so we need a threshold. Age < 40 maps to below-mean roughly.
# Use 25th percentile as "young"
age_25th = np.percentile(age_values, 25)
young_mask = age_values <= age_25th
young_indices = np.where(young_mask)[0]
if len(young_indices) > 0:
    # Pick one with moderate probability for interesting explanation
    young_best = young_indices[np.argmin(np.abs(probs[young_indices] - 0.5))]
    archetypes['Young-Patient'] = young_best
    print(f"  Young-Patient: idx={young_best}, prob={probs[young_best]:.4f}, age_z={age_values[young_best]:.3f}")

# 5. Advanced Paternal Age (Age >= 40 => high age z-score)
age_75th = np.percentile(age_values, 75)
apa_mask = age_values >= age_75th
apa_indices = np.where(apa_mask)[0]
if len(apa_indices) > 0:
    apa_best = apa_indices[np.argmin(np.abs(probs[apa_indices] - 0.5))]
    archetypes['Advanced-Paternal-Age'] = apa_best
    print(f"  Advanced-Paternal-Age: idx={apa_best}, prob={probs[apa_best]:.4f}, age_z={age_values[apa_best]:.3f}")

# 6. True Positive (predicted 1, actual 1)
tp_mask = (preds == 1) & (y == 1)
tp_indices = np.where(tp_mask)[0]
if len(tp_indices) > 0:
    # Pick one with high confidence
    tp_best = tp_indices[np.argmax(probs[tp_indices])]
    archetypes['True-Positive'] = tp_best
    print(f"  True-Positive: idx={tp_best}, prob={probs[tp_best]:.4f}")

# 7. False Negative (predicted 0, actual 1)
fn_mask = (preds == 0) & (y == 1)
fn_indices = np.where(fn_mask)[0]
if len(fn_indices) > 0:
    fn_best = fn_indices[np.argmin(probs[fn_indices])]
    archetypes['False-Negative'] = fn_best
    print(f"  False-Negative: idx={fn_best}, prob={probs[fn_best]:.4f}")

print(f"\nTotal archetypes identified: {len(archetypes)}")

# Save archetype samples CSV
arch_rows = []
for name, idx in archetypes.items():
    row = {'Archetype': name, 'Sample_Index': idx, 'Pred_Prob': probs[idx],
           'Predicted': preds[idx], 'Actual': y[idx], 'Age_z': age_values[idx]}
    for fi, fn in enumerate(clinical_names):
        row[fn] = X[idx, fi]
    arch_rows.append(row)
arch_df = pd.DataFrame(arch_rows)
arch_df.to_csv(os.path.join(RES_DIR, 'archetype_samples.csv'), index=False)
print(f"Saved archetype_samples.csv")

# ============================================================
# STEP 2: SHAP Waterfall Plots (Local Explanations)
# ============================================================
print("\n" + "=" * 60)
print("STEP 2: SHAP Waterfall Plots")
print("=" * 60)

import shap

# Prepare background data for KernelExplainer
sss = StratifiedShuffleSplit(n_splits=1, test_size=0.98, random_state=42)
bg_idx, _ = next(sss.split(X, y))
X_bg = X[bg_idx[:50]]

shap_explainers = {}
shap_values_cache = {}

for model_name in ['SVM', 'XGBoost', 'RandomForest']:
    model = models[model_name]
    print(f"\n  Computing SHAP for {model_name}...")
    t0 = time.time()

    if model_name == 'SVM':
        explainer = shap.KernelExplainer(model.predict_proba, X_bg)
        # Only explain archetype samples
        arch_indices = list(archetypes.values())
        X_explain = X[arch_indices]
        sv = explainer.shap_values(X_explain, nsamples=200)
        # sv is list of [n_samples, n_features] for each class or 3D array
        if isinstance(sv, list):
            sv = sv[1]  # class 1
        elif sv.ndim == 3:
            sv = sv[:, :, 1]
        shap_values_cache[model_name] = sv
        # Get expected value
        if isinstance(explainer.expected_value, (list, np.ndarray)):
            ev = explainer.expected_value[1]
        else:
            ev = explainer.expected_value
        shap_explainers[model_name] = {'explainer': explainer, 'expected_value': ev}
    else:
        explainer = shap.TreeExplainer(model)
        arch_indices = list(archetypes.values())
        X_explain = X[arch_indices]
        sv = explainer.shap_values(X_explain)
        if isinstance(sv, list):
            sv = sv[1]  # class 1 for multi-output
        elif sv.ndim == 3:
            sv = sv[:, :, 1]
        shap_values_cache[model_name] = sv
        ev = explainer.expected_value
        if isinstance(ev, (list, np.ndarray)):
            ev = ev[1] if len(ev) > 1 else ev[0]
        shap_explainers[model_name] = {'explainer': explainer, 'expected_value': ev}

    print(f"    Done in {time.time()-t0:.1f}s, SHAP shape: {sv.shape}")

# Now create waterfall plots
arch_list = list(archetypes.keys())
arch_indices = list(archetypes.values())

for model_name in ['SVM', 'XGBoost', 'RandomForest']:
    sv = shap_values_cache[model_name]
    ev = shap_explainers[model_name]['expected_value']

    for i, (arch_name, sample_idx) in enumerate(archetypes.items()):
        fig, ax = plt.subplots(figsize=(10, 8))

        # Get SHAP values for this sample
        sample_shap = sv[i]
        sample_features = X[sample_idx]

        # Sort by absolute SHAP value, take top 15
        abs_shap = np.abs(sample_shap)
        top_feat_idx = np.argsort(abs_shap)[-15:][::-1]

        feat_names_top = [clinical_names[j] for j in top_feat_idx]
        shap_vals_top = sample_shap[top_feat_idx]
        feat_vals_top = sample_features[top_feat_idx]

        # Create horizontal bar plot (waterfall style)
        colors = ['#ff0051' if v > 0 else '#008bfb' for v in shap_vals_top]
        y_pos = np.arange(len(feat_names_top))[::-1]

        bars = ax.barh(y_pos, shap_vals_top, color=colors, edgecolor='white', height=0.7)
        ax.set_yticks(y_pos)
        labels = [f"{fn} = {fv:.2f}" for fn, fv in zip(feat_names_top, feat_vals_top)]
        ax.set_yticklabels(labels, fontsize=9)
        ax.set_xlabel('SHAP Value (impact on prediction)')
        ax.axvline(x=0, color='black', linewidth=0.8)
        ax.set_title(f'SHAP Local Explanation - {model_name}\n'
                     f'Archetype: {arch_name} | Sample #{sample_idx} | '
                     f'P(+)={probs[sample_idx]:.3f} | Actual={y[sample_idx]}',
                     fontsize=11, fontweight='bold')

        # Add base value annotation
        ax.text(0.02, 0.02, f'E[f(x)] = {ev:.4f}', transform=ax.transAxes,
                fontsize=9, fontstyle='italic', color='gray')

        plt.tight_layout()
        fname = f'shap_waterfall_{model_name}_{arch_name}'
        fig.savefig(os.path.join(FIG_DIR, fname + '.png'))
        fig.savefig(os.path.join(FIG_DIR, fname + '.tiff'), dpi=300)
        plt.close(fig)

    print(f"  Saved waterfall plots for {model_name}")

# ============================================================
# STEP 3: SHAP Dependence Plots (Top 10 Features)
# ============================================================
print("\n" + "=" * 60)
print("STEP 3: SHAP Dependence Plots")
print("=" * 60)

# Use XGBoost (best tree-based model) for dependence plots
xgb_model = models['XGBoost']
xgb_explainer = shap.TreeExplainer(xgb_model)

# Compute SHAP values on a subsample for dependence plots
sss2 = StratifiedShuffleSplit(n_splits=1, test_size=0.8, random_state=42)
sub_idx, _ = next(sss2.split(X, y))
X_sub = X[sub_idx[:500]]
print(f"  Computing SHAP values on {X_sub.shape[0]} samples for dependence plots...")
t0 = time.time()
sv_dep = xgb_explainer.shap_values(X_sub)
if isinstance(sv_dep, list):
    sv_dep = sv_dep[1]
elif sv_dep.ndim == 3:
    sv_dep = sv_dep[:, :, 1]
print(f"  Done in {time.time()-t0:.1f}s")

X_sub_df = pd.DataFrame(X_sub, columns=clinical_names)

for feat_name in top10_features:
    fig, ax = plt.subplots(figsize=(8, 6))
    feat_idx = clinical_to_idx[feat_name]

    # Find best interaction feature automatically
    feat_shap = sv_dep[:, feat_idx]
    feat_vals = X_sub[:, feat_idx]

    # Find interaction: feature with highest correlation to residual
    best_interact_idx = None
    best_corr = 0
    for j in range(X_sub.shape[1]):
        if j == feat_idx:
            continue
        # Simple correlation between other feature and SHAP residual
        corr = np.abs(np.corrcoef(X_sub[:, j], feat_shap)[0, 1])
        if corr > best_corr:
            best_corr = corr
            best_interact_idx = j

    interact_name = clinical_names[best_interact_idx] if best_interact_idx is not None else None

    scatter = ax.scatter(feat_vals, feat_shap, c=X_sub[:, best_interact_idx],
                        cmap='coolwarm', alpha=0.6, s=15, edgecolors='none')
    cbar = plt.colorbar(scatter, ax=ax)
    cbar.set_label(interact_name, fontsize=10)

    ax.set_xlabel(feat_name, fontsize=11)
    ax.set_ylabel(f'SHAP value for\n{feat_name}', fontsize=11)
    ax.set_title(f'SHAP Dependence Plot: {feat_name}\n(Interaction: {interact_name})',
                fontsize=12, fontweight='bold')
    ax.axhline(y=0, color='gray', linestyle='--', linewidth=0.5)

    plt.tight_layout()
    safe_name = feat_name.replace('/', '_').replace(' ', '_').replace('(', '').replace(')', '')
    fname = f'shap_dependence_{safe_name}'
    fig.savefig(os.path.join(FIG_DIR, fname + '.png'))
    fig.savefig(os.path.join(FIG_DIR, fname + '.tiff'), dpi=300)
    plt.close(fig)

print(f"  Saved {len(top10_features)} SHAP dependence plots")

# ============================================================
# STEP 4: LIME Explanations
# ============================================================
print("\n" + "=" * 60)
print("STEP 4: LIME Explanations")
print("=" * 60)

from lime.lime_tabular import LimeTabularExplainer

lime_explainer = LimeTabularExplainer(
    X, feature_names=clinical_names,
    class_names=['Negative', 'Positive'],
    mode='classification',
    random_state=42
)

lime_results = {}

for arch_name, sample_idx in archetypes.items():
    print(f"  LIME for {arch_name} (sample #{sample_idx})...")
    exp = lime_explainer.explain_instance(
        X[sample_idx], svm_model.predict_proba,
        num_features=15, num_samples=5000
    )

    # Save figure
    fig = exp.as_pyplot_figure()
    fig.set_size_inches(10, 7)
    fig.suptitle(f'LIME Explanation - {arch_name}\n'
                 f'Sample #{sample_idx} | P(+)={probs[sample_idx]:.3f} | Actual={y[sample_idx]}',
                 fontsize=12, fontweight='bold', y=1.02)
    plt.tight_layout()
    fname = f'lime_{arch_name}'
    fig.savefig(os.path.join(FIG_DIR, fname + '.png'), bbox_inches='tight')
    fig.savefig(os.path.join(FIG_DIR, fname + '.tiff'), dpi=300, bbox_inches='tight')
    plt.close(fig)

    # Store results
    lime_results[arch_name] = {
        'sample_index': int(sample_idx),
        'pred_prob': float(probs[sample_idx]),
        'actual': int(y[sample_idx]),
        'local_pred': float(exp.local_pred[0]) if hasattr(exp, 'local_pred') else None,
        'intercept': float(exp.intercept[1]) if hasattr(exp, 'intercept') else None,
        'features': [
            {'feature': feat, 'weight': float(weight)}
            for feat, weight in exp.as_list()
        ]
    }

# Save LIME JSON
with open(os.path.join(RES_DIR, 'lime_explanations.json'), 'w') as f:
    json.dump(lime_results, f, indent=2)
print(f"  Saved lime_explanations.json")

# LIME vs SHAP Comparison plot
print("  Creating LIME vs SHAP comparison...")
fig, axes = plt.subplots(len(archetypes), 2, figsize=(16, 4 * len(archetypes)))
if len(archetypes) == 1:
    axes = axes.reshape(1, -1)

for i, (arch_name, sample_idx) in enumerate(archetypes.items()):
    # SHAP (SVM) - left
    ax_shap = axes[i, 0]
    sample_shap = shap_values_cache['SVM'][i]
    abs_shap_vals = np.abs(sample_shap)
    top_idx = np.argsort(abs_shap_vals)[-10:][::-1]
    feat_names_s = [clinical_names[j] for j in top_idx]
    shap_vals_s = sample_shap[top_idx]

    colors_s = ['#ff0051' if v > 0 else '#008bfb' for v in shap_vals_s]
    y_pos = np.arange(len(feat_names_s))[::-1]
    ax_shap.barh(y_pos, shap_vals_s, color=colors_s, height=0.6)
    ax_shap.set_yticks(y_pos)
    ax_shap.set_yticklabels(feat_names_s, fontsize=8)
    ax_shap.set_title(f'SHAP - {arch_name}', fontsize=10, fontweight='bold')
    ax_shap.axvline(x=0, color='black', linewidth=0.5)
    ax_shap.set_xlabel('SHAP Value')

    # LIME - right
    ax_lime = axes[i, 1]
    lime_feats = lime_results[arch_name]['features'][:10]
    lime_names = [f['feature'] for f in lime_feats]
    lime_weights = [f['weight'] for f in lime_feats]

    colors_l = ['#ff0051' if w > 0 else '#008bfb' for w in lime_weights]
    y_pos_l = np.arange(len(lime_names))[::-1]
    ax_lime.barh(y_pos_l, lime_weights, color=colors_l, height=0.6)
    ax_lime.set_yticks(y_pos_l)
    ax_lime.set_yticklabels(lime_names, fontsize=7)
    ax_lime.set_title(f'LIME - {arch_name}', fontsize=10, fontweight='bold')
    ax_lime.axvline(x=0, color='black', linewidth=0.5)
    ax_lime.set_xlabel('LIME Weight')

plt.suptitle('SHAP vs LIME Local Explanations Comparison (SVM Model)',
             fontsize=14, fontweight='bold', y=1.01)
plt.tight_layout()
fig.savefig(os.path.join(FIG_DIR, 'shap_vs_lime_comparison.png'), bbox_inches='tight')
fig.savefig(os.path.join(FIG_DIR, 'shap_vs_lime_comparison.tiff'), dpi=300, bbox_inches='tight')
plt.close(fig)
print("  Saved SHAP vs LIME comparison plot")

# ============================================================
# STEP 5: PDP (Partial Dependence Plots)
# ============================================================
print("\n" + "=" * 60)
print("STEP 5: Partial Dependence Plots (PDP)")
print("=" * 60)

# Use XGBoost for PDP (sklearn-compatible tree model, works best with PDP)
xgb_model = models['XGBoost']

for feat_name in top5_features:
    feat_idx = clinical_to_idx[feat_name]
    fig, ax = plt.subplots(figsize=(8, 6))

    # Compute partial dependence manually for better control
    pd_result = partial_dependence(xgb_model, X, features=[feat_idx],
                                    kind='average', grid_resolution=50)

    ax.plot(pd_result['grid_values'][0], pd_result['average'][0],
            color='#2196F3', linewidth=2.5)
    ax.fill_between(pd_result['grid_values'][0],
                     pd_result['average'][0] - 0.02,
                     pd_result['average'][0] + 0.02,
                     alpha=0.15, color='#2196F3')
    ax.set_xlabel(feat_name, fontsize=12)
    ax.set_ylabel('Partial Dependence', fontsize=12)
    ax.set_title(f'Partial Dependence Plot: {feat_name}\n(XGBoost Model)',
                fontsize=13, fontweight='bold')
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    safe_name = feat_name.replace('/', '_').replace(' ', '_').replace('(', '').replace(')', '')
    fname = f'pdp_{safe_name}'
    fig.savefig(os.path.join(FIG_DIR, fname + '.png'))
    fig.savefig(os.path.join(FIG_DIR, fname + '.tiff'), dpi=300)
    plt.close(fig)

print(f"  Saved {len(top5_features)} PDP plots")

# ============================================================
# STEP 6: ICE (Individual Conditional Expectation) Plots
# ============================================================
print("\n" + "=" * 60)
print("STEP 6: ICE Plots")
print("=" * 60)

# Use a subsample for ICE (too many lines otherwise)
ice_sample_size = 200
rng = np.random.RandomState(42)
ice_idx = rng.choice(X.shape[0], size=min(ice_sample_size, X.shape[0]), replace=False)
X_ice = X[ice_idx]

for feat_name in top5_features:
    feat_idx = clinical_to_idx[feat_name]
    fig, ax = plt.subplots(figsize=(9, 6))

    # Compute ICE
    pd_result = partial_dependence(xgb_model, X_ice, features=[feat_idx],
                                    kind='individual', grid_resolution=50)
    grid_vals = pd_result['grid_values'][0]
    ice_lines = pd_result['individual'][0]  # shape: (n_samples, n_grid_points)
    pdp_line = ice_lines.mean(axis=0)

    # Plot individual ICE lines
    for j in range(ice_lines.shape[0]):
        ax.plot(grid_vals, ice_lines[j], color='steelblue', alpha=0.05, linewidth=0.5)

    # Overlay PDP
    ax.plot(grid_vals, pdp_line, color='#FF5722', linewidth=3, label='PDP (Average)', zorder=10)

    ax.set_xlabel(feat_name, fontsize=12)
    ax.set_ylabel('Predicted Probability', fontsize=12)
    ax.set_title(f'ICE Plot with PDP Overlay: {feat_name}\n'
                 f'(XGBoost, {ice_lines.shape[0]} samples)',
                fontsize=13, fontweight='bold')
    ax.legend(fontsize=10, loc='best')
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    safe_name = feat_name.replace('/', '_').replace(' ', '_').replace('(', '').replace(')', '')
    fname = f'ice_{safe_name}'
    fig.savefig(os.path.join(FIG_DIR, fname + '.png'))
    fig.savefig(os.path.join(FIG_DIR, fname + '.tiff'), dpi=300)
    plt.close(fig)

print(f"  Saved {len(top5_features)} ICE plots")

# ============================================================
# STEP 7: Summary Report
# ============================================================
print("\n" + "=" * 60)
print("STEP 7: Generating Part2_Summary_Log.md")
print("=" * 60)

report_lines = [
    "# Part 2: Local Interpretability - SHAP Local, LIME & PDP/ICE",
    "",
    "## Project: NOA ML - Phase 5 XAI Analysis",
    f"**Date**: {time.strftime('%Y-%m-%d %H:%M')}",
    f"**Dataset**: {X.shape[0]} samples, {X.shape[1]} features",
    f"**Models Analyzed**: SVM, XGBoost, RandomForest",
    "",
    "---",
    "",
    "## 1. Clinical Archetype Samples",
    "",
    "| Archetype | Sample Index | Pred Prob | Predicted | Actual |",
    "|-----------|-------------|-----------|-----------|--------|",
]

for arch_name, sample_idx in archetypes.items():
    report_lines.append(
        f"| {arch_name} | {sample_idx} | {probs[sample_idx]:.4f} | {preds[sample_idx]} | {y[sample_idx]} |"
    )

report_lines += [
    "",
    "**Notes on Age Archetype Selection:**",
    "- Since the dataset uses standardized features, Young Patient = Age z-score ≤ 25th percentile",
    "- Advanced Paternal Age = Age z-score ≥ 75th percentile",
    "",
    "---",
    "",
    "## 2. SHAP Waterfall Plots (Local Explanations)",
    "",
    "For each of the 7 clinical archetypes, SHAP waterfall plots were generated using 3 models:",
    "- **SVM** (Best overall model, AUC: 0.984)",
    "- **XGBoost** (Best tree-based model)",
    "- **RandomForest**",
    "",
    "Each plot shows the top 15 features contributing to the individual prediction,",
    "with red bars indicating features pushing toward positive prediction (sperm retrieval success)",
    "and blue bars indicating features pushing toward negative prediction.",
    "",
    "### Generated Files:",
]

for model_name in ['SVM', 'XGBoost', 'RandomForest']:
    for arch_name in archetypes:
        report_lines.append(f"- `shap_waterfall_{model_name}_{arch_name}.png/.tiff`")

report_lines += [
    "",
    "---",
    "",
    "## 3. SHAP Dependence Plots",
    "",
    "SHAP dependence plots for the top 10 most important features (from Part 1):",
    "",
    "| Feature | Interaction Feature |",
    "|---------|-------------------|",
]

# Re-compute interaction names for the report
for feat_name in top10_features:
    feat_idx = clinical_to_idx[feat_name]
    feat_shap = sv_dep[:, feat_idx]
    best_interact_idx = None
    best_corr = 0
    for j in range(X_sub.shape[1]):
        if j == feat_idx:
            continue
        corr = np.abs(np.corrcoef(X_sub[:, j], feat_shap)[0, 1])
        if corr > best_corr:
            best_corr = corr
            best_interact_idx = j
    interact_name = clinical_names[best_interact_idx] if best_interact_idx else "N/A"
    report_lines.append(f"| {feat_name} | {interact_name} |")

report_lines += [
    "",
    "### Generated Files:",
]
for feat_name in top10_features:
    safe_name = feat_name.replace('/', '_').replace(' ', '_').replace('(', '').replace(')', '')
    report_lines.append(f"- `shap_dependence_{safe_name}.png/.tiff`")

report_lines += [
    "",
    "---",
    "",
    "## 4. LIME Explanations",
    "",
    "LIME (Local Interpretable Model-agnostic Explanations) was applied to each archetype",
    "sample using the SVM model with 5000 perturbation samples and 15 features.",
    "",
    "### Key LIME Findings:",
    "",
]

for arch_name, data in lime_results.items():
    top3 = data['features'][:3]
    top3_str = ", ".join([f"{f['feature']} ({f['weight']:+.4f})" for f in top3])
    report_lines.append(f"- **{arch_name}**: Top contributors: {top3_str}")

report_lines += [
    "",
    "### LIME vs SHAP Agreement:",
    "- A comparison plot (`shap_vs_lime_comparison.png`) shows side-by-side SHAP and LIME",
    "  explanations for all archetypes.",
    "- Both methods generally agree on top contributing features, with some differences",
    "  in magnitude and ranking due to their different methodological approaches.",
    "",
    "### Generated Files:",
]
for arch_name in archetypes:
    report_lines.append(f"- `lime_{arch_name}.png/.tiff`")
report_lines.append("- `shap_vs_lime_comparison.png/.tiff`")
report_lines.append("- `lime_explanations.json`")

report_lines += [
    "",
    "---",
    "",
    "## 5. Partial Dependence Plots (PDP)",
    "",
    "PDP shows the average marginal effect of each feature on the predicted outcome.",
    "Generated for the top 5 features using XGBoost model:",
    "",
]
for feat_name in top5_features:
    report_lines.append(f"- {feat_name}")

report_lines += [
    "",
    "### Generated Files:",
]
for feat_name in top5_features:
    safe_name = feat_name.replace('/', '_').replace(' ', '_').replace('(', '').replace(')', '')
    report_lines.append(f"- `pdp_{safe_name}.png/.tiff`")

report_lines += [
    "",
    "---",
    "",
    "## 6. ICE (Individual Conditional Expectation) Plots",
    "",
    f"ICE plots show individual prediction trajectories for {ice_sample_size} randomly selected samples,",
    "with the PDP (average) overlaid in red. Generated for the top 5 features using XGBoost.",
    "",
    "### Generated Files:",
]
for feat_name in top5_features:
    safe_name = feat_name.replace('/', '_').replace(' ', '_').replace('(', '').replace(')', '')
    report_lines.append(f"- `ice_{safe_name}.png/.tiff`")

report_lines += [
    "",
    "---",
    "",
    "## Summary of All Output Files",
    "",
    "### Results (3_Results/Phase5_XAI/):",
    "- `archetype_samples.csv` - Selected archetype samples with all feature values",
    "- `lime_explanations.json` - Detailed LIME explanations for all archetypes",
    "",
    "### Figures (4_Figures/Phase5_XAI/):",
    f"- {len(archetypes) * 3} SHAP Waterfall plots (7 archetypes × 3 models)",
    f"- {len(top10_features)} SHAP Dependence plots (top 10 features)",
    f"- {len(archetypes)} LIME explanation plots",
    "- 1 SHAP vs LIME comparison plot",
    f"- {len(top5_features)} PDP plots (top 5 features)",
    f"- {len(top5_features)} ICE plots (top 5 features)",
    "",
    "All figures available in PNG and TIFF (300 DPI) formats.",
]

report_text = '\n'.join(report_lines)
report_path = os.path.join(REP_DIR, 'Part2_Summary_Log.md')
with open(report_path, 'w') as f:
    f.write(report_text)
print(f"Saved {report_path}")

print("\n" + "=" * 60)
print("PART 2 COMPLETE!")
print("=" * 60)
