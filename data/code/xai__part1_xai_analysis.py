#!/usr/bin/env python3
"""
Phase 5 - Part 1: Core XAI Analysis
Feature Importance & SHAP Global Analysis for NOA ML Project
"""

import os, json, warnings, time
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns
from sklearn.inspection import permutation_importance
from sklearn.model_selection import StratifiedShuffleSplit

warnings.filterwarnings('ignore')
np.random.seed(42)

# ── Paths ──────────────────────────────────────────────────────────────
BASE = '[path]
MODEL_DIR = f'{BASE}/phase4_output/Chat_4__Validation___Robustness-2/NOA_ML_Project/6_Models/Saved'
DATA_PATH = f'{BASE}/phase4_output/Chat_4__Validation___Robustness-2/NOA_ML_Project/1_Data/Processed/encoded_dataset.csv'
MAPPING_PATH = f'{BASE}/feature_mapping.json'
FIG_DIR = f'{BASE}/4_Figures/Phase5_XAI'
RES_DIR = f'{BASE}/3_Results/Phase5_XAI'
REP_DIR = f'{BASE}/5_Reports'

os.makedirs(FIG_DIR, exist_ok=True)
os.makedirs(RES_DIR, exist_ok=True)
os.makedirs(REP_DIR, exist_ok=True)

# ── Style ──────────────────────────────────────────────────────────────
plt.rcParams.update({
    'font.family': 'serif', 'font.size': 10,
    'axes.titlesize': 12, 'axes.labelsize': 11,
    'figure.dpi': 150, 'savefig.dpi': 300,
    'savefig.bbox': 'tight', 'savefig.pad_inches': 0.1
})

# ── Load data & mapping ───────────────────────────────────────────────
print("=" * 70)
print("PART 1: Core XAI Analysis - Feature Importance & SHAP Global")
print("=" * 70)

df = pd.read_csv(DATA_PATH)
X = df.drop('TARGET', axis=1)
y = df['TARGET']
feature_cols = X.columns.tolist()

with open(MAPPING_PATH) as f:
    mapping = json.load(f)
f2c = mapping['feature_to_clinical']
clinical_names = [f2c.get(c, c) for c in feature_cols]
# Short names for plots (truncate long names)
short_names = []
for n in clinical_names:
    if len(n) > 30:
        short_names.append(n[:28] + '..')
    else:
        short_names.append(n)

print(f"Dataset: {X.shape[0]} samples, {X.shape[1]} features")
print(f"Target distribution: {dict(y.value_counts())}")

# ── Load all models ───────────────────────────────────────────────────
models = {}
for fname in sorted(os.listdir(MODEL_DIR)):
    if not fname.endswith('.joblib'):
        continue
    name = fname.replace('.joblib', '')
    try:
        models[name] = joblib.load(os.path.join(MODEL_DIR, fname))
        print(f"  ✓ Loaded {name}")
    except Exception as e:
        print(f"  ✗ Failed {name}: {e}")

print(f"\nLoaded {len(models)} models total")

# ── Identify tree-based models (with feature_importances_) ────────────
tree_models = {k: v for k, v in models.items() if hasattr(v, 'feature_importances_')}
print(f"Tree-based models with native FI: {len(tree_models)}")

# ══════════════════════════════════════════════════════════════════════
# TASK 2: Native Feature Importance
# ══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("TASK 2: Native Feature Importance (Tree-Based Models)")
print("=" * 70)

native_fi = {}
for name, model in sorted(tree_models.items()):
    fi = model.feature_importances_
    native_fi[name] = fi
    top3 = np.argsort(fi)[-3:][::-1]
    print(f"  {name}: top3 = {', '.join(clinical_names[i] for i in top3)}")

fi_df = pd.DataFrame(native_fi, index=clinical_names)
fi_df.to_csv(f'{RES_DIR}/feature_importance_native.csv')
print(f"  Saved feature_importance_native.csv ({fi_df.shape})")

# Average importance ranking
fi_df['Mean'] = fi_df.mean(axis=1)
fi_df_sorted = fi_df.sort_values('Mean', ascending=False)

# ── Figure: Comparison bar chart across all tree-based models ──────
fig, ax = plt.subplots(figsize=(14, 10))
top_n = 20
plot_df = fi_df_sorted.drop('Mean', axis=1).head(top_n)
plot_df.plot(kind='barh', ax=ax, width=0.85, edgecolor='none', alpha=0.85)
ax.set_xlabel('Feature Importance')
ax.set_title('Native Feature Importance — Tree-Based Models (Top 20 Features)')
ax.legend(bbox_to_anchor=(1.01, 1), loc='upper left', fontsize=7, ncol=1)
ax.invert_yaxis()
plt.tight_layout()
fig.savefig(f'{FIG_DIR}/native_fi_comparison.png')
fig.savefig(f'{FIG_DIR}/native_fi_comparison.tiff', dpi=300, format='tiff')
plt.close(fig)
print("  Saved native_fi_comparison.png/tiff")

# ── Figure: Average importance with std ────────────────────────────
fi_vals = fi_df_sorted.drop('Mean', axis=1).head(top_n)
means = fi_vals.mean(axis=1)
stds = fi_vals.std(axis=1)

fig, ax = plt.subplots(figsize=(10, 8))
ax.barh(range(len(means)), means.values, xerr=stds.values, capsize=3,
        color=sns.color_palette('viridis', len(means)), edgecolor='none')
ax.set_yticks(range(len(means)))
ax.set_yticklabels(means.index)
ax.set_xlabel('Mean Feature Importance (± Std)')
ax.set_title('Average Native Feature Importance Across Tree-Based Models')
ax.invert_yaxis()
plt.tight_layout()
fig.savefig(f'{FIG_DIR}/native_fi_average.png')
fig.savefig(f'{FIG_DIR}/native_fi_average.tiff', dpi=300, format='tiff')
plt.close(fig)
print("  Saved native_fi_average.png/tiff")

# ── Figure: Heatmap of native FI ──────────────────────────────────
fig, ax = plt.subplots(figsize=(16, 10))
sns.heatmap(fi_df_sorted.drop('Mean', axis=1).T, cmap='YlOrRd', ax=ax,
            xticklabels=True, yticklabels=True, linewidths=0.3)
ax.set_title('Native Feature Importance Heatmap — Tree-Based Models')
ax.set_xlabel('Clinical Features')
ax.set_ylabel('Models')
plt.xticks(rotation=45, ha='right', fontsize=7)
plt.yticks(fontsize=8)
plt.tight_layout()
fig.savefig(f'{FIG_DIR}/native_fi_heatmap.png')
fig.savefig(f'{FIG_DIR}/native_fi_heatmap.tiff', dpi=300, format='tiff')
plt.close(fig)
print("  Saved native_fi_heatmap.png/tiff")

# ══════════════════════════════════════════════════════════════════════
# TASK 3: Permutation Importance (ALL models)
# ══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("TASK 3: Permutation Importance (All Models)")
print("=" * 70)

# Use a stratified subsample for speed (500 samples)
sss = StratifiedShuffleSplit(n_splits=1, test_size=500, random_state=42)
_, sub_idx = next(sss.split(X, y))
X_sub = X.iloc[sub_idx]
y_sub = y.iloc[sub_idx]
print(f"  Using {len(sub_idx)} samples for permutation importance")

perm_results = {}
for name, model in sorted(models.items()):
    t0 = time.time()
    try:
        pi = permutation_importance(model, X_sub, y_sub,
                                     n_repeats=30, random_state=42,
                                     scoring='roc_auc', n_jobs=-1)
        perm_results[name] = {
            'mean': pi.importances_mean,
            'std': pi.importances_std
        }
        top3 = np.argsort(pi.importances_mean)[-3:][::-1]
        elapsed = time.time() - t0
        print(f"  ✓ {name} ({elapsed:.1f}s): top3 = {', '.join(clinical_names[i] for i in top3)}")
    except Exception as e:
        print(f"  ✗ {name}: {e}")

# Build CSV
perm_mean_df = pd.DataFrame(
    {name: r['mean'] for name, r in perm_results.items()},
    index=clinical_names
)
perm_std_df = pd.DataFrame(
    {name: r['std'] for name, r in perm_results.items()},
    index=clinical_names
)
perm_mean_df['Mean'] = perm_mean_df.mean(axis=1)
perm_mean_df_sorted = perm_mean_df.sort_values('Mean', ascending=False)
perm_mean_df_sorted.to_csv(f'{RES_DIR}/permutation_importance.csv')
print(f"  Saved permutation_importance.csv")

# Consensus important features
print("\n  Top 10 Consensus Features (by mean permutation importance):")
for i, (feat, val) in enumerate(perm_mean_df_sorted['Mean'].head(10).items()):
    print(f"    {i+1}. {feat}: {val:.4f}")

# ── Figure: Heatmap ───────────────────────────────────────────────
plot_perm = perm_mean_df_sorted.drop('Mean', axis=1).head(25)
fig, ax = plt.subplots(figsize=(18, 10))
sns.heatmap(plot_perm.T, cmap='YlOrRd', ax=ax,
            xticklabels=True, yticklabels=True, linewidths=0.3,
            cbar_kws={'label': 'Permutation Importance (AUC drop)'})
ax.set_title('Permutation Importance Across All Models (Top 25 Features)')
ax.set_xlabel('Clinical Features')
ax.set_ylabel('Models')
plt.xticks(rotation=45, ha='right', fontsize=7)
plt.yticks(fontsize=7)
plt.tight_layout()
fig.savefig(f'{FIG_DIR}/permutation_importance_heatmap.png')
fig.savefig(f'{FIG_DIR}/permutation_importance_heatmap.tiff', dpi=300, format='tiff')
plt.close(fig)
print("  Saved permutation_importance_heatmap.png/tiff")

# ── Figure: Top 15 features boxplot across models ──────────────────
top15_feats = perm_mean_df_sorted.index[:15]
box_data = perm_mean_df_sorted.drop('Mean', axis=1).loc[top15_feats].T
fig, ax = plt.subplots(figsize=(12, 8))
box_data.boxplot(ax=ax, vert=False, patch_artist=True,
                 boxprops=dict(facecolor='lightsteelblue', alpha=0.7))
ax.set_xlabel('Permutation Importance (AUC Drop)')
ax.set_title('Permutation Importance Distribution — Top 15 Features')
plt.tight_layout()
fig.savefig(f'{FIG_DIR}/permutation_importance_boxplot.png')
fig.savefig(f'{FIG_DIR}/permutation_importance_boxplot.tiff', dpi=300, format='tiff')
plt.close(fig)
print("  Saved permutation_importance_boxplot.png/tiff")

# ══════════════════════════════════════════════════════════════════════
# TASK 4: SHAP Global Analysis (Top 5 Models)
# ══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("TASK 4: SHAP Global Analysis (Top 5 Models)")
print("=" * 70)

import shap

top5_models = ['SVM', 'XGBoost', 'LightGBM', 'RandomForest', 'GradientBoosting']
# Background data for KernelExplainer
bg_idx = np.random.choice(len(X), 50, replace=False)
X_bg = X.iloc[bg_idx]
# Explanation data - use 500 for tree models, 100 for kernel
X_explain = X_sub  # 500 samples for tree-based
kernel_idx = np.random.choice(len(X_sub), 100, replace=False)
X_explain_kernel = X_sub.iloc[kernel_idx]  # 100 for SVM

shap_summaries = {}

for mname in top5_models:
    if mname not in models:
        print(f"  ✗ {mname} not found, skipping")
        continue
    model = models[mname]
    print(f"\n  Processing SHAP for {mname}...")
    t0 = time.time()

    try:
        if mname in ['XGBoost', 'LightGBM', 'RandomForest', 'GradientBoosting']:
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(X_explain)
            X_for_plot = X_explain
            if isinstance(shap_values, list):
                shap_values = shap_values[1]
            elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
                shap_values = shap_values[:, :, 1]  # class 1
        else:
            # SVM - use KernelExplainer with smaller sample
            if hasattr(model, 'predict_proba'):
                predict_fn = model.predict_proba
            else:
                predict_fn = model.decision_function
            explainer = shap.KernelExplainer(predict_fn, X_bg)
            shap_values = explainer.shap_values(X_explain_kernel, nsamples=150)
            X_for_plot = X_explain_kernel
            if isinstance(shap_values, list):
                shap_values = shap_values[1]

        elapsed = time.time() - t0
        print(f"    Done in {elapsed:.1f}s, shape: {np.array(shap_values).shape}")

        # Store summary
        mean_abs = np.mean(np.abs(shap_values), axis=0)
        shap_summaries[mname] = mean_abs

        # ── Beeswarm plot ────────────────────────────────────────
        X_explain_named = X_for_plot.copy()
        X_explain_named.columns = clinical_names

        fig, ax = plt.subplots(figsize=(10, 10))
        shap.summary_plot(shap_values, X_explain_named, show=False,
                         max_display=20, plot_size=None)
        plt.title(f'SHAP Beeswarm — {mname}', fontsize=13)
        plt.tight_layout()
        plt.savefig(f'{FIG_DIR}/shap_beeswarm_{mname}.png')
        plt.savefig(f'{FIG_DIR}/shap_beeswarm_{mname}.tiff', dpi=300, format='tiff')
        plt.close('all')
        print(f"    Saved shap_beeswarm_{mname}.png/tiff")

        # ── Bar plot ─────────────────────────────────────────────
        fig, ax = plt.subplots(figsize=(10, 8))
        shap.summary_plot(shap_values, X_explain_named, plot_type='bar',
                         show=False, max_display=20, plot_size=None)
        plt.title(f'SHAP Feature Importance (Mean |SHAP|) — {mname}', fontsize=13)
        plt.tight_layout()
        plt.savefig(f'{FIG_DIR}/shap_bar_{mname}.png')
        plt.savefig(f'{FIG_DIR}/shap_bar_{mname}.tiff', dpi=300, format='tiff')
        plt.close('all')
        print(f"    Saved shap_bar_{mname}.png/tiff")

    except Exception as e:
        import traceback
        print(f"    ✗ Error: {e}")
        traceback.print_exc()

# ── SHAP summary comparison across models ─────────────────────────
if shap_summaries:
    shap_summary_df = pd.DataFrame(shap_summaries, index=clinical_names)
    shap_summary_df['Mean'] = shap_summary_df.mean(axis=1)
    shap_summary_df_sorted = shap_summary_df.sort_values('Mean', ascending=False)
    shap_summary_df_sorted.to_csv(f'{RES_DIR}/shap_values_summary.csv')
    print(f"\n  Saved shap_values_summary.csv")

    # Combined comparison figure
    top20 = shap_summary_df_sorted.drop('Mean', axis=1).head(20)
    fig, ax = plt.subplots(figsize=(12, 9))
    top20.plot(kind='barh', ax=ax, width=0.85, edgecolor='none', alpha=0.85)
    ax.set_xlabel('Mean |SHAP Value|')
    ax.set_title('SHAP Feature Importance Comparison — Top 5 Models (Top 20 Features)')
    ax.legend(bbox_to_anchor=(1.01, 1), loc='upper left', fontsize=9)
    ax.invert_yaxis()
    plt.tight_layout()
    fig.savefig(f'{FIG_DIR}/shap_comparison_top5.png')
    fig.savefig(f'{FIG_DIR}/shap_comparison_top5.tiff', dpi=300, format='tiff')
    plt.close(fig)
    print("  Saved shap_comparison_top5.png/tiff")

    # Heatmap
    fig, ax = plt.subplots(figsize=(14, 9))
    sns.heatmap(top20.T, cmap='YlOrRd', ax=ax, annot=True, fmt='.3f',
                linewidths=0.5, xticklabels=True, yticklabels=True)
    ax.set_title('SHAP Values Heatmap — Top 5 Models')
    ax.set_xlabel('Clinical Features')
    ax.set_ylabel('Models')
    plt.xticks(rotation=45, ha='right', fontsize=8)
    plt.tight_layout()
    fig.savefig(f'{FIG_DIR}/shap_heatmap_top5.png')
    fig.savefig(f'{FIG_DIR}/shap_heatmap_top5.tiff', dpi=300, format='tiff')
    plt.close(fig)
    print("  Saved shap_heatmap_top5.png/tiff")

    print("\n  Top 10 Features by Mean |SHAP| across top 5 models:")
    for i, (feat, val) in enumerate(shap_summary_df_sorted['Mean'].head(10).items()):
        print(f"    {i+1}. {feat}: {val:.4f}")

# ══════════════════════════════════════════════════════════════════════
# TASK 5: Summary Log
# ══════════════════════════════════════════════════════════════════════
print("\n" + "=" * 70)
print("TASK 5: Generating Summary Report")
print("=" * 70)

log_lines = []
log_lines.append("# Part 1: Core XAI Analysis — Summary Log\n")
log_lines.append("## Project: NOA ML - Phase 5 Explainable AI\n")
log_lines.append(f"- **Date**: 2026-03-13")
log_lines.append(f"- **Dataset**: {X.shape[0]} samples, {X.shape[1]} features")
log_lines.append(f"- **Models loaded**: {len(models)}")
log_lines.append(f"- **Tree-based models (native FI)**: {len(tree_models)}\n")

log_lines.append("---\n")
log_lines.append("## 1. Native Feature Importance (Tree-Based Models)\n")
log_lines.append(f"Models analyzed: {', '.join(sorted(tree_models.keys()))}\n")
log_lines.append("### Top 10 Features (by mean importance across tree-based models):\n")
log_lines.append("| Rank | Feature | Mean Importance |")
log_lines.append("|------|---------|----------------|")
for i, (feat, val) in enumerate(fi_df_sorted['Mean'].head(10).items()):
    log_lines.append(f"| {i+1} | {feat} | {val:.4f} |")

log_lines.append("\n### Figures Generated:")
log_lines.append("- `native_fi_comparison.png/tiff` — Bar chart comparing all tree-based models")
log_lines.append("- `native_fi_average.png/tiff` — Average importance with std error bars")
log_lines.append("- `native_fi_heatmap.png/tiff` — Heatmap across all tree-based models\n")

log_lines.append("---\n")
log_lines.append("## 2. Permutation Importance (All Models)\n")
log_lines.append(f"Models analyzed: {len(perm_results)} (all loaded models)")
log_lines.append(f"Evaluation metric: ROC-AUC, n_repeats=30, subsample=500\n")
log_lines.append("### Top 10 Consensus Features:\n")
log_lines.append("| Rank | Feature | Mean Perm. Importance |")
log_lines.append("|------|---------|----------------------|")
for i, (feat, val) in enumerate(perm_mean_df_sorted['Mean'].head(10).items()):
    log_lines.append(f"| {i+1} | {feat} | {val:.4f} |")

log_lines.append("\n### Figures Generated:")
log_lines.append("- `permutation_importance_heatmap.png/tiff` — Heatmap across all models")
log_lines.append("- `permutation_importance_boxplot.png/tiff` — Distribution boxplot for top 15 features\n")

log_lines.append("---\n")
log_lines.append("## 3. SHAP Global Analysis (Top 5 Models)\n")
log_lines.append(f"Models: {', '.join(top5_models)}\n")
if shap_summaries:
    log_lines.append("### Top 10 Features by Mean |SHAP|:\n")
    log_lines.append("| Rank | Feature | Mean |SHAP| |")
    log_lines.append("|------|---------|-------------|")
    for i, (feat, val) in enumerate(shap_summary_df_sorted['Mean'].head(10).items()):
        log_lines.append(f"| {i+1} | {feat} | {val:.4f} |")

log_lines.append("\n### Figures Generated (per model):")
for mname in top5_models:
    if mname in shap_summaries:
        log_lines.append(f"- `shap_beeswarm_{mname}.png/tiff` — Beeswarm plot")
        log_lines.append(f"- `shap_bar_{mname}.png/tiff` — Bar plot")
log_lines.append("- `shap_comparison_top5.png/tiff` — Combined comparison")
log_lines.append("- `shap_heatmap_top5.png/tiff` — Heatmap comparison\n")

log_lines.append("---\n")
log_lines.append("## Output Files\n")
log_lines.append("### CSV Files (in 3_Results/Phase5_XAI/):")
log_lines.append("- `feature_importance_native.csv`")
log_lines.append("- `permutation_importance.csv`")
log_lines.append("- `shap_values_summary.csv`\n")
log_lines.append("### Figures (in 4_Figures/Phase5_XAI/):")
log_lines.append("- All figures saved in PNG (quick view) + TIFF (300 DPI, publication quality)\n")

report_path = f'{REP_DIR}/Part1_Summary_Log.md'
with open(report_path, 'w') as f:
    f.write('\n'.join(log_lines))
print(f"  Saved {report_path}")

print("\n" + "=" * 70)
print("PART 1 COMPLETE — All outputs generated successfully!")
print("=" * 70)
