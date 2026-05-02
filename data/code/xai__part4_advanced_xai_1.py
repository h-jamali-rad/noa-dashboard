#!/usr/bin/env python3
"""
Part 4: Advanced XAI Analysis
NOA ML Project – Phase 5 XAI
Tasks: Uncertainty Quantification, Feature Interaction Analysis,
       Counterfactual Explanations, Clinical Rules (Anchors),
       Model Agreement Analysis, Prediction Stability Analysis
"""

import os, json, warnings, time, traceback
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.utils import resample
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.metrics import accuracy_score, roc_auc_score
import shap

warnings.filterwarnings('ignore')
np.random.seed(42)

# ── Paths ──────────────────────────────────────────────────────────
BASE = '[path]
MODEL_DIR = os.path.join(BASE, 'phase4_output/Chat_4__Validation___Robustness-2/NOA_ML_Project/6_Models/Saved')
DATA_PATH = os.path.join(BASE, 'phase4_output/Chat_4__Validation___Robustness-2/NOA_ML_Project/1_Data/Processed/encoded_dataset.csv')
MAPPING_PATH = os.path.join(BASE, 'feature_mapping.json')
FIG_DIR = os.path.join(BASE, '4_Figures/Phase5_XAI')
RES_DIR = os.path.join(BASE, '3_Results/Phase5_XAI')
REP_DIR = os.path.join(BASE, '5_Reports')
os.makedirs(FIG_DIR, exist_ok=True)
os.makedirs(RES_DIR, exist_ok=True)
os.makedirs(REP_DIR, exist_ok=True)

# ── Plot style ─────────────────────────────────────────────────────
plt.rcParams.update({
    'figure.dpi': 150, 'savefig.dpi': 300,
    'font.size': 11, 'axes.titlesize': 13,
    'axes.labelsize': 11, 'xtick.labelsize': 9,
    'ytick.labelsize': 9, 'legend.fontsize': 9,
    'figure.figsize': (10, 7)
})

def save_fig(fig, name):
    fig.savefig(os.path.join(FIG_DIR, f'{name}.png'), dpi=300, bbox_inches='tight')
    fig.savefig(os.path.join(FIG_DIR, f'{name}.tiff'), dpi=300, bbox_inches='tight')
    plt.close(fig)
    print(f'  Saved: {name}.png/tiff')

# ── Load data & models ─────────────────────────────────────────────
print('='*60)
print('Part 4: Advanced XAI Analysis')
print('='*60)

df = pd.read_csv(DATA_PATH)
X = df.drop('TARGET', axis=1)
y = df['TARGET'].values
feature_cols = list(X.columns)

with open(MAPPING_PATH) as f:
    mapping = json.load(f)
f2c = mapping['feature_to_clinical']
clinical_names = [f2c.get(c, c) for c in feature_cols]
X_clinical = X.copy()
X_clinical.columns = clinical_names

# Load models
models = {}
for fn in sorted(os.listdir(MODEL_DIR)):
    if fn.endswith('.joblib'):
        name = fn.replace('.joblib', '')
        try:
            models[name] = joblib.load(os.path.join(MODEL_DIR, fn))
        except Exception as e:
            print(f'  Warning: could not load {fn}: {e}')
print(f'Loaded {len(models)} models')
print(f'Dataset: {X.shape[0]} samples, {X.shape[1]} features')

# Helper: get prediction probabilities
def get_proba(model, X_data):
    """Return probability of positive class."""
    if hasattr(model, 'predict_proba'):
        return model.predict_proba(X_data)[:, 1]
    elif hasattr(model, 'decision_function'):
        from scipy.special import expit
        return expit(model.decision_function(X_data))
    else:
        return model.predict(X_data).astype(float)

# Tree-based model names
TREE_MODELS = ['XGBoost', 'LightGBM', 'RandomForest', 'GradientBoosting',
               'ExtraTrees', 'CatBoost', 'DecisionTree']

# =====================================================================
# SECTION 1: UNCERTAINTY QUANTIFICATION
# =====================================================================
print('\n' + '='*60)
print('Section 1: Uncertainty Quantification')
print('='*60)
t0 = time.time()

N_BOOTSTRAP = 100
n_samples = len(X)

# 1a. Bootstrap prediction uncertainty for top models
top_models_unc = ['SVM', 'XGBoost', 'LightGBM', 'RandomForest', 'GradientBoosting',
                  'VotingEnsemble', 'StackingEnsemble', 'KNN']
top_models_unc = [m for m in top_models_unc if m in models]

uncertainty_results = {}
print(f'Bootstrap uncertainty ({N_BOOTSTRAP} iterations) for {len(top_models_unc)} models...')

for mname in top_models_unc:
    print(f'  Processing {mname}...')
    model = models[mname]
    base_proba = get_proba(model, X)

    boot_preds = np.zeros((N_BOOTSTRAP, n_samples))
    for i in range(N_BOOTSTRAP):
        idx = resample(np.arange(n_samples), n_samples=n_samples, random_state=i)
        X_boot = X.iloc[idx]
        proba_boot = get_proba(model, X_boot)
        # Map back to original indices
        for j, orig_idx in enumerate(idx):
            boot_preds[i, orig_idx] = proba_boot[j]

    # For samples not sampled in a bootstrap iteration, they get 0 → use mask
    boot_counts = np.zeros(n_samples)
    boot_sums = np.zeros(n_samples)
    boot_sq_sums = np.zeros(n_samples)

    for i in range(N_BOOTSTRAP):
        idx = resample(np.arange(n_samples), n_samples=n_samples, random_state=i)
        X_boot = X.iloc[idx]
        proba_boot = get_proba(model, X_boot)
        for j, orig_idx in enumerate(idx):
            boot_counts[orig_idx] += 1
            boot_sums[orig_idx] += proba_boot[j]
            boot_sq_sums[orig_idx] += proba_boot[j]**2

    mean_pred = boot_sums / np.maximum(boot_counts, 1)
    var_pred = boot_sq_sums / np.maximum(boot_counts, 1) - mean_pred**2
    std_pred = np.sqrt(np.maximum(var_pred, 0))

    ci_low = np.clip(mean_pred - 1.96 * std_pred, 0, 1)
    ci_high = np.clip(mean_pred + 1.96 * std_pred, 0, 1)
    ci_width = ci_high - ci_low

    uncertainty_results[mname] = {
        'base_proba': base_proba,
        'mean_pred': mean_pred,
        'std_pred': std_pred,
        'ci_low': ci_low,
        'ci_high': ci_high,
        'ci_width': ci_width
    }

# 1b. Ensemble variance (for ensemble/tree models with estimators)
ensemble_variance = {}
for mname in ['RandomForest', 'ExtraTrees']:
    if mname not in models:
        continue
    model = models[mname]
    if hasattr(model, 'estimators_'):
        est_preds = np.array([est.predict(X.values if hasattr(X, 'values') else X)
                              for est in model.estimators_])
        ensemble_variance[mname] = {
            'mean': est_preds.mean(axis=0),
            'std': est_preds.std(axis=0),
            'n_estimators': len(model.estimators_)
        }
        print(f'  {mname} ensemble variance computed ({len(model.estimators_)} estimators)')

# 1c. Build uncertainty CSV
unc_records = []
for mname in top_models_unc:
    r = uncertainty_results[mname]
    for i in range(n_samples):
        unc_records.append({
            'Model': mname,
            'Sample_Index': i,
            'Base_Prob': r['base_proba'][i],
            'Boot_Mean': r['mean_pred'][i],
            'Boot_Std': r['std_pred'][i],
            'CI_Low': r['ci_low'][i],
            'CI_High': r['ci_high'][i],
            'CI_Width': r['ci_width'][i],
            'Actual': y[i]
        })
unc_df = pd.DataFrame(unc_records)
unc_df.to_csv(os.path.join(RES_DIR, 'uncertainty_analysis.csv'), index=False)
print(f'  Saved uncertainty_analysis.csv ({len(unc_df)} rows)')

# 1d. Identify high-uncertainty (borderline) samples
borderline_threshold = 0.15  # CI width > this
for mname in top_models_unc[:3]:
    r = uncertainty_results[mname]
    high_unc = np.where(r['ci_width'] > borderline_threshold)[0]
    print(f'  {mname}: {len(high_unc)} high-uncertainty samples (CI width > {borderline_threshold})')

# 1e. Plots
# Uncertainty distribution for each model
fig, axes = plt.subplots(2, 4, figsize=(18, 9))
axes = axes.flatten()
for i, mname in enumerate(top_models_unc):
    if i >= 8:
        break
    ax = axes[i]
    r = uncertainty_results[mname]
    ax.hist(r['std_pred'], bins=50, color='steelblue', alpha=0.7, edgecolor='white')
    ax.set_title(mname)
    ax.set_xlabel('Bootstrap Std Dev')
    ax.set_ylabel('Count')
    ax.axvline(np.median(r['std_pred']), color='red', ls='--', label=f'Median={np.median(r["std_pred"]):.4f}')
    ax.legend(fontsize=7)
for j in range(i+1, 8):
    axes[j].set_visible(False)
fig.suptitle('Prediction Uncertainty Distribution (Bootstrap)', fontsize=14, fontweight='bold')
fig.tight_layout()
save_fig(fig, 'uncertainty_distribution')

# CI width by actual class
fig, axes = plt.subplots(2, 4, figsize=(18, 9))
axes = axes.flatten()
for i, mname in enumerate(top_models_unc):
    if i >= 8:
        break
    ax = axes[i]
    r = uncertainty_results[mname]
    for cls, color, label in [(0, 'blue', 'Negative'), (1, 'red', 'Positive')]:
        mask = y == cls
        ax.hist(r['ci_width'][mask], bins=40, alpha=0.5, color=color, label=label, edgecolor='white')
    ax.set_title(mname)
    ax.set_xlabel('CI Width')
    ax.legend(fontsize=7)
for j in range(i+1, 8):
    axes[j].set_visible(False)
fig.suptitle('Confidence Interval Width by True Class', fontsize=14, fontweight='bold')
fig.tight_layout()
save_fig(fig, 'uncertainty_ci_by_class')

# Calibrated confidence: scatter of base proba vs CI width
fig, axes = plt.subplots(2, 4, figsize=(18, 9))
axes = axes.flatten()
for i, mname in enumerate(top_models_unc):
    if i >= 8:
        break
    ax = axes[i]
    r = uncertainty_results[mname]
    sc = ax.scatter(r['base_proba'], r['ci_width'], c=y, cmap='RdYlBu_r',
                    alpha=0.3, s=5)
    ax.set_title(mname)
    ax.set_xlabel('Predicted Probability')
    ax.set_ylabel('CI Width')
for j in range(i+1, 8):
    axes[j].set_visible(False)
fig.suptitle('Prediction Probability vs Uncertainty', fontsize=14, fontweight='bold')
fig.tight_layout()
save_fig(fig, 'uncertainty_prob_vs_ci')

# Ensemble variance plot
if ensemble_variance:
    fig, axes = plt.subplots(1, len(ensemble_variance), figsize=(7*len(ensemble_variance), 6))
    if len(ensemble_variance) == 1:
        axes = [axes]
    for ax, (mname, ev) in zip(axes, ensemble_variance.items()):
        ax.hist(ev['std'], bins=50, color='darkorange', alpha=0.7, edgecolor='white')
        ax.set_title(f'{mname} Ensemble Variance ({ev["n_estimators"]} estimators)')
        ax.set_xlabel('Std Dev across estimators')
        ax.set_ylabel('Count')
    fig.tight_layout()
    save_fig(fig, 'ensemble_variance_distribution')

print(f'Section 1 completed in {time.time()-t0:.1f}s')

# =====================================================================
# SECTION 2: FEATURE INTERACTION ANALYSIS
# =====================================================================
print('\n' + '='*60)
print('Section 2: Feature Interaction Analysis')
print('='*60)
t0 = time.time()

# Use XGBoost for SHAP interaction values (most efficient)
# Subsample for speed
sss = StratifiedShuffleSplit(n_splits=1, test_size=0.8, random_state=42)
sub_idx, _ = next(sss.split(X, y))
X_sub = X.iloc[sub_idx]
y_sub = y[sub_idx]
print(f'Using {len(X_sub)} samples for interaction analysis')

interaction_model_name = 'XGBoost'
if interaction_model_name in models:
    print(f'Computing SHAP interaction values for {interaction_model_name}...')
    model_int = models[interaction_model_name]
    explainer = shap.TreeExplainer(model_int)
    shap_interaction = explainer.shap_interaction_values(X_sub)

    # Handle multi-output
    if isinstance(shap_interaction, list):
        shap_interaction = shap_interaction[1]
    if shap_interaction.ndim == 4:
        shap_interaction = shap_interaction[:, :, :, 1]

    print(f'  SHAP interaction shape: {shap_interaction.shape}')

    # Mean absolute interaction values
    n_feat = shap_interaction.shape[1]
    mean_interaction = np.mean(np.abs(shap_interaction), axis=0)

    # Zero out diagonal (main effects)
    np.fill_diagonal(mean_interaction, 0)

    # Create interaction DataFrame with clinical names
    interaction_df = pd.DataFrame(mean_interaction, index=clinical_names, columns=clinical_names)

    # Top 10 feature pairs
    pairs = []
    for i in range(n_feat):
        for j in range(i+1, n_feat):
            pairs.append({
                'Feature_1': clinical_names[i],
                'Feature_2': clinical_names[j],
                'Mean_Abs_Interaction': mean_interaction[i, j]
            })
    pairs_df = pd.DataFrame(pairs).sort_values('Mean_Abs_Interaction', ascending=False)
    top10_pairs = pairs_df.head(10)
    print('\nTop 10 Feature Interaction Pairs:')
    print(top10_pairs.to_string(index=False))

    pairs_df.to_csv(os.path.join(RES_DIR, 'feature_interactions.csv'), index=False)
    print(f'  Saved feature_interactions.csv ({len(pairs_df)} pairs)')

    # 2a. Interaction heatmap (top 15 features by interaction strength)
    feat_interaction_sum = interaction_df.sum(axis=1).sort_values(ascending=False)
    top15_feats = feat_interaction_sum.head(15).index.tolist()
    sub_df = interaction_df.loc[top15_feats, top15_feats]

    fig, ax = plt.subplots(figsize=(12, 10))
    sns.heatmap(sub_df, annot=True, fmt='.3f', cmap='YlOrRd', ax=ax,
                linewidths=0.5, square=True, cbar_kws={'label': 'Mean |SHAP Interaction|'})
    ax.set_title(f'SHAP Feature Interaction Heatmap – {interaction_model_name}\n(Top 15 Features)', fontweight='bold')
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    fig.tight_layout()
    save_fig(fig, 'interaction_heatmap')

    # 2b. Top 5 interaction pair detailed plots
    for rank, (_, row) in enumerate(top10_pairs.head(5).iterrows()):
        f1_name = row['Feature_1']
        f2_name = row['Feature_2']
        f1_idx = clinical_names.index(f1_name)
        f2_idx = clinical_names.index(f2_name)

        fig, axes2 = plt.subplots(1, 2, figsize=(14, 5))

        # SHAP dependence with interaction coloring
        shap_vals = explainer.shap_values(X_sub)
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[1]
        if shap_vals.ndim == 3:
            shap_vals = shap_vals[:, :, 1]

        ax = axes2[0]
        sc = ax.scatter(X_sub.iloc[:, f1_idx], shap_vals[:, f1_idx],
                        c=X_sub.iloc[:, f2_idx], cmap='coolwarm', alpha=0.6, s=15)
        ax.set_xlabel(f1_name)
        ax.set_ylabel(f'SHAP value for {f1_name}')
        plt.colorbar(sc, ax=ax, label=f2_name)
        ax.set_title(f'{f1_name} (colored by {f2_name})')

        ax = axes2[1]
        sc = ax.scatter(X_sub.iloc[:, f2_idx], shap_vals[:, f2_idx],
                        c=X_sub.iloc[:, f1_idx], cmap='coolwarm', alpha=0.6, s=15)
        ax.set_xlabel(f2_name)
        ax.set_ylabel(f'SHAP value for {f2_name}')
        plt.colorbar(sc, ax=ax, label=f1_name)
        ax.set_title(f'{f2_name} (colored by {f1_name})')

        fig.suptitle(f'Interaction #{rank+1}: {f1_name} × {f2_name}\n'
                     f'(Mean |Interaction| = {row["Mean_Abs_Interaction"]:.4f})',
                     fontweight='bold', fontsize=12)
        fig.tight_layout()
        fname = f'interaction_pair_{rank+1}_{f1_name[:15]}_{f2_name[:15]}'.replace(' ', '_').replace('/', '_')
        save_fig(fig, fname)

else:
    print(f'  {interaction_model_name} not available, skipping interaction analysis')
    pairs_df = pd.DataFrame()

print(f'Section 2 completed in {time.time()-t0:.1f}s')

# =====================================================================
# SECTION 3: COUNTERFACTUAL EXPLANATIONS
# =====================================================================
print('\n' + '='*60)
print('Section 3: Counterfactual Explanations')
print('='*60)
t0 = time.time()

# Load archetype samples from Part 2
archetype_path = os.path.join(RES_DIR, 'archetype_samples.csv')
if os.path.exists(archetype_path):
    archetypes_df = pd.read_csv(archetype_path)
    print(f'Loaded {len(archetypes_df)} archetype samples')
else:
    print('No archetype_samples.csv found, creating archetypes...')
    archetypes_df = None

# Use XGBoost as primary model for counterfactuals
cf_model_name = 'XGBoost'
cf_model = models.get(cf_model_name)

# Manual perturbation approach for counterfactuals
# Focus on: High-Negative, Borderline, False Negative
target_archetypes = ['High-Negative', 'Borderline', 'False-Negative']

counterfactual_results = {}

if cf_model is not None:
    proba_all = get_proba(cf_model, X)

    # If archetypes not available, find samples
    if archetypes_df is not None:
        archetype_indices = {}
        for _, row in archetypes_df.iterrows():
            archetype_indices[row['Archetype']] = int(row['Sample_Index'])
    else:
        # Find samples manually
        archetype_indices = {}
        neg_mask = proba_all < 0.2
        if neg_mask.any():
            archetype_indices['High-Negative'] = np.where(neg_mask)[0][np.argmin(proba_all[neg_mask])]
        border_mask = np.abs(proba_all - 0.5) < 0.1
        if border_mask.any():
            archetype_indices['Borderline'] = np.where(border_mask)[0][0]
        fn_mask = (proba_all < 0.5) & (y == 1)
        if fn_mask.any():
            archetype_indices['False Negative'] = np.where(fn_mask)[0][0]

    # Clinically actionable features (continuous, modifiable or measurable)
    actionable_features = [
        'Testis Size right (Sono)', 'Testis Size left (Sono)',
        'RT Size (Orchidometer)', 'LT Size (Orchidometer)',
        'Sakamoto-RT/mL', 'Sakamoto-LT/mL',
        'Testosterone levels', 'FSH', 'LH', 'E2', 'Prolactin',
        'Seminal plasma pH', 'BMI'
    ]
    actionable_idx = [i for i, cn in enumerate(clinical_names) if cn in actionable_features]

    print(f'Actionable features: {len(actionable_idx)}')
    print(f'Target archetypes: {[a for a in target_archetypes if a in archetype_indices]}')

    for arch_name in target_archetypes:
        if arch_name not in archetype_indices:
            print(f'  Skipping {arch_name} (not found)')
            continue

        sample_idx = archetype_indices[arch_name]
        original = X.iloc[sample_idx:sample_idx+1].copy()
        orig_prob = get_proba(cf_model, original)[0]
        orig_pred = int(orig_prob >= 0.5)
        target_class = 1 - orig_pred  # Flip prediction

        print(f'\n  {arch_name} (sample {sample_idx}): prob={orig_prob:.4f}, pred={orig_pred}, target={target_class}')

        # Greedy perturbation: change one feature at a time toward target
        best_cf = original.copy()
        best_prob = orig_prob
        changes = []

        # Use feature importances to prioritize
        if hasattr(cf_model, 'feature_importances_'):
            feat_imp = cf_model.feature_importances_
        else:
            feat_imp = np.ones(X.shape[1])

        # Sort actionable features by importance
        sorted_actionable = sorted(actionable_idx, key=lambda i: feat_imp[i], reverse=True)

        for feat_idx in sorted_actionable:
            if (target_class == 1 and best_prob >= 0.5) or (target_class == 0 and best_prob < 0.5):
                break  # Already flipped

            feat_name = clinical_names[feat_idx]
            orig_val = original.iloc[0, feat_idx]

            # Try perturbations: use dataset percentiles
            feat_values = X.iloc[:, feat_idx].values
            percentiles = np.percentile(feat_values, [10, 25, 50, 75, 90])

            best_local_prob = best_prob
            best_local_val = orig_val

            for pval in percentiles:
                test = best_cf.copy()
                test.iloc[0, feat_idx] = pval
                test_prob = get_proba(cf_model, test)[0]

                if target_class == 1 and test_prob > best_local_prob:
                    best_local_prob = test_prob
                    best_local_val = pval
                elif target_class == 0 and test_prob < best_local_prob:
                    best_local_prob = test_prob
                    best_local_val = pval

            if best_local_val != orig_val:
                best_cf.iloc[0, feat_idx] = best_local_val
                best_prob = best_local_prob
                changes.append({
                    'Feature': feat_name,
                    'Original': float(orig_val),
                    'Counterfactual': float(best_local_val),
                    'Change': float(best_local_val - orig_val)
                })

        cf_prob = get_proba(cf_model, best_cf)[0]
        cf_pred = int(cf_prob >= 0.5)

        counterfactual_results[arch_name] = {
            'sample_index': int(sample_idx),
            'original_prob': float(orig_prob),
            'original_pred': orig_pred,
            'counterfactual_prob': float(cf_prob),
            'counterfactual_pred': cf_pred,
            'target_class': target_class,
            'flipped': cf_pred == target_class,
            'n_changes': len(changes),
            'changes': changes
        }
        print(f'    CF prob: {cf_prob:.4f}, flipped: {cf_pred == target_class}, changes: {len(changes)}')

    # Save counterfactuals
    with open(os.path.join(RES_DIR, 'counterfactual_explanations.json'), 'w') as f:
        json.dump(counterfactual_results, f, indent=2)
    print(f'\n  Saved counterfactual_explanations.json')

    # Visualization: original vs counterfactual
    n_archs = len(counterfactual_results)
    if n_archs > 0:
        fig, axes = plt.subplots(1, n_archs, figsize=(7*n_archs, 8))
        if n_archs == 1:
            axes = [axes]
        for ax, (arch_name, cfr) in zip(axes, counterfactual_results.items()):
            if not cfr['changes']:
                ax.text(0.5, 0.5, 'No changes needed', transform=ax.transAxes, ha='center')
                ax.set_title(arch_name)
                continue
            changes_df = pd.DataFrame(cfr['changes'])
            y_pos = range(len(changes_df))
            ax.barh(y_pos, changes_df['Original'], height=0.35, label='Original', color='steelblue', alpha=0.7)
            ax.barh([y+0.35 for y in y_pos], changes_df['Counterfactual'], height=0.35, label='Counterfactual', color='coral', alpha=0.7)
            ax.set_yticks([y+0.175 for y in y_pos])
            ax.set_yticklabels(changes_df['Feature'], fontsize=8)
            ax.legend(fontsize=8)
            status = '✓ Flipped' if cfr['flipped'] else '✗ Not flipped'
            ax.set_title(f'{arch_name}\nP: {cfr["original_prob"]:.3f}→{cfr["counterfactual_prob"]:.3f} {status}',
                        fontsize=10)
            ax.set_xlabel('Feature Value (standardized)')
        fig.suptitle(f'Counterfactual Explanations – {cf_model_name}\nMinimal Changes to Flip Prediction',
                     fontweight='bold', fontsize=13)
        fig.tight_layout()
        save_fig(fig, 'counterfactual_explanations')

print(f'Section 3 completed in {time.time()-t0:.1f}s')

# =====================================================================
# SECTION 4: ANCHORS / CLINICAL RULES
# =====================================================================
print('\n' + '='*60)
print('Section 4: Clinical Rules (Anchors via Surrogate Trees)')
print('='*60)
t0 = time.time()

clinical_rules = {}

# Use predictions from top models as targets for surrogate trees
surrogate_models = ['XGBoost', 'LightGBM', 'SVM', 'RandomForest', 'GradientBoosting']
surrogate_models = [m for m in surrogate_models if m in models]

for mname in surrogate_models:
    print(f'\n  Extracting rules for {mname}...')
    model = models[mname]
    proba = get_proba(model, X)
    pred = (proba >= 0.5).astype(int)

    # Fit surrogate decision tree
    dt = DecisionTreeClassifier(max_depth=4, min_samples_leaf=50, random_state=42)
    dt.fit(X, pred)

    # Evaluate fidelity
    dt_pred = dt.predict(X)
    fidelity = accuracy_score(pred, dt_pred)
    auc_surr = roc_auc_score(y, dt.predict_proba(X)[:, 1])

    # Extract rules as text
    tree_text = export_text(dt, feature_names=clinical_names, max_depth=4)

    # Extract leaf rules
    rules = []
    from sklearn.tree import _tree

    def extract_rules(tree, feature_names):
        tree_ = tree.tree_
        feature_name = [feature_names[i] if i != _tree.TREE_UNDEFINED else "undefined!" for i in tree_.feature]
        paths = []

        def recurse(node, path):
            if tree_.feature[node] == _tree.TREE_UNDEFINED:
                # Leaf node - values may be normalized (sum to 1) or counts
                value = tree_.value[node][0]
                pred_class = int(np.argmax(value))
                confidence = float(value[pred_class] / value.sum())
                n_node = int(tree_.n_node_samples[node])
                rules_list = path.copy()
                paths.append({
                    'rules': rules_list,
                    'prediction': pred_class,
                    'confidence': confidence,
                    'n_samples': n_node,
                    'class_distribution': [round(float(v), 4) for v in value]
                })
            else:
                name = feature_name[node]
                threshold = tree_.threshold[node]
                recurse(tree_.children_left[node], path + [f"{name} <= {threshold:.3f}"])
                recurse(tree_.children_right[node], path + [f"{name} > {threshold:.3f}"])

        recurse(0, [])
        return paths

    extracted = extract_rules(dt, clinical_names)

    # Filter for meaningful rules (confidence > 55%, enough samples)
    high_conf_rules = [r for r in extracted if r['confidence'] >= 0.55 and r['n_samples'] >= 50]
    high_conf_rules.sort(key=lambda x: x['confidence'], reverse=True)

    clinical_rules[mname] = {
        'fidelity': float(fidelity),
        'surrogate_auc': float(auc_surr),
        'tree_depth': 4,
        'n_rules': len(extracted),
        'n_high_confidence_rules': len(high_conf_rules),
        'tree_text': tree_text,
        'rules': high_conf_rules[:10]  # Top 10
    }

    print(f'    Fidelity: {fidelity:.3f}, Surrogate AUC: {auc_surr:.3f}')
    print(f'    Total rules: {len(extracted)}, High-confidence: {len(high_conf_rules)}')

    # Validate top rules against actual data
    for rule_info in high_conf_rules[:3]:
        rule_str = ' AND '.join(rule_info['rules'])
        pred_label = 'Success' if rule_info['prediction'] == 1 else 'Failure'
        print(f'    Rule: IF {rule_str} THEN {pred_label} (conf={rule_info["confidence"]:.2f}, n={rule_info["n_samples"]})')

# Save clinical rules
with open(os.path.join(RES_DIR, 'clinical_rules.json'), 'w') as f:
    json.dump(clinical_rules, f, indent=2)
print(f'\nSaved clinical_rules.json')

# Visualization: Rule summary
fig, axes = plt.subplots(len(surrogate_models), 1, figsize=(14, 4*len(surrogate_models)))
if len(surrogate_models) == 1:
    axes = [axes]
for ax, mname in zip(axes, surrogate_models):
    cr = clinical_rules[mname]
    rules = cr['rules'][:8]
    if not rules:
        ax.text(0.5, 0.5, 'No high-confidence rules', transform=ax.transAxes, ha='center')
        ax.set_title(mname)
        continue

    rule_labels = []
    confs = []
    n_samps = []
    colors = []
    for r in rules:
        short_rule = ' & '.join([c.split(' ')[0][:12] + c.split(' ')[1] + c.split(' ')[2][:6]
                                  for c in r['rules'][-2:]])  # Last 2 conditions
        pred_label = 'S' if r['prediction'] == 1 else 'F'
        rule_labels.append(f'{short_rule} → {pred_label}')
        confs.append(r['confidence'])
        n_samps.append(r['n_samples'])
        colors.append('green' if r['prediction'] == 1 else 'red')

    y_pos = range(len(rules))
    bars = ax.barh(y_pos, confs, color=colors, alpha=0.7, edgecolor='black')
    ax.set_yticks(y_pos)
    ax.set_yticklabels(rule_labels, fontsize=7)
    ax.set_xlabel('Confidence')
    ax.set_xlim(0, 1.15)
    for bar, n in zip(bars, n_samps):
        ax.text(bar.get_width() + 0.01, bar.get_y() + bar.get_height()/2,
                f'n={n}', va='center', fontsize=7)
    ax.set_title(f'{mname} (Fidelity: {cr["fidelity"]:.3f}, Surrogate AUC: {cr["surrogate_auc"]:.3f})')

fig.suptitle('Clinical Rules from Surrogate Decision Trees\n(Green=Success, Red=Failure)',
             fontweight='bold', fontsize=13)
fig.tight_layout()
save_fig(fig, 'clinical_rules_summary')

print(f'Section 4 completed in {time.time()-t0:.1f}s')

# =====================================================================
# SECTION 5: MODEL AGREEMENT ANALYSIS
# =====================================================================
print('\n' + '='*60)
print('Section 5: Model Agreement Analysis')
print('='*60)
t0 = time.time()

# Get predictions from all models
all_preds = {}
all_probas = {}
for mname, model in models.items():
    try:
        proba = get_proba(model, X)
        pred = (proba >= 0.5).astype(int)
        all_preds[mname] = pred
        all_probas[mname] = proba
    except Exception as e:
        print(f'  Warning: {mname} prediction failed: {e}')

pred_matrix = pd.DataFrame(all_preds)
proba_matrix = pd.DataFrame(all_probas)
print(f'Predictions from {len(all_preds)} models')

# Agreement rate for each sample
agreement_positive = pred_matrix.sum(axis=1)  # Number of models predicting positive
n_models = pred_matrix.shape[1]
agreement_rate = pred_matrix.apply(lambda row: max(row.sum(), n_models - row.sum()) / n_models, axis=1)

# Build agreement DataFrame
agreement_df = pd.DataFrame({
    'Sample_Index': range(n_samples),
    'Actual': y,
    'N_Positive': agreement_positive.values,
    'N_Negative': (n_models - agreement_positive).values,
    'Agreement_Rate': agreement_rate.values,
    'Mean_Prob': proba_matrix.mean(axis=1).values,
    'Std_Prob': proba_matrix.std(axis=1).values,
    'Consensus_Pred': (agreement_positive > n_models/2).astype(int).values
})
agreement_df.to_csv(os.path.join(RES_DIR, 'model_agreement.csv'), index=False)
print(f'Saved model_agreement.csv')

# Stats
high_agreement = agreement_df[agreement_df['Agreement_Rate'] >= 0.9]
low_agreement = agreement_df[agreement_df['Agreement_Rate'] < 0.7]
print(f'High agreement (≥90%): {len(high_agreement)} samples ({100*len(high_agreement)/n_samples:.1f}%)')
print(f'Low agreement (<70%): {len(low_agreement)} samples ({100*len(low_agreement)/n_samples:.1f}%)')

# 5a. Agreement heatmap (subsample for visibility)
np.random.seed(42)
heatmap_idx = np.random.choice(n_samples, min(100, n_samples), replace=False)
heatmap_idx = np.sort(heatmap_idx)

fig, ax = plt.subplots(figsize=(16, 10))
hm_data = pred_matrix.iloc[heatmap_idx].T
sns.heatmap(hm_data, cmap='RdYlBu_r', ax=ax, xticklabels=False,
            yticklabels=True, cbar_kws={'label': 'Prediction (0=Failure, 1=Success)'})
ax.set_xlabel('Samples (subset)')
ax.set_ylabel('Models')
ax.set_title('Model Agreement Heatmap (100 Random Samples)', fontweight='bold')
fig.tight_layout()
save_fig(fig, 'model_agreement_heatmap')

# 5b. Agreement distribution
fig, axes = plt.subplots(1, 3, figsize=(18, 5))

ax = axes[0]
ax.hist(agreement_df['Agreement_Rate'], bins=30, color='steelblue', edgecolor='white', alpha=0.8)
ax.set_xlabel('Agreement Rate')
ax.set_ylabel('Count')
ax.set_title('Distribution of Model Agreement Rate')
ax.axvline(0.9, color='green', ls='--', label='High (≥90%)')
ax.axvline(0.7, color='red', ls='--', label='Low (<70%)')
ax.legend()

ax = axes[1]
for cls, color, label in [(0, 'blue', 'Actual Negative'), (1, 'red', 'Actual Positive')]:
    mask = y == cls
    ax.hist(agreement_df.loc[mask, 'Agreement_Rate'], bins=30, alpha=0.5, color=color, label=label, edgecolor='white')
ax.set_xlabel('Agreement Rate')
ax.set_ylabel('Count')
ax.set_title('Agreement Rate by True Class')
ax.legend()

ax = axes[2]
ax.scatter(agreement_df['Mean_Prob'], agreement_df['Std_Prob'], c=y, cmap='RdYlBu_r', alpha=0.3, s=8)
ax.set_xlabel('Mean Predicted Probability')
ax.set_ylabel('Std Dev of Predictions')
ax.set_title('Prediction Consensus: Mean vs Variability')

fig.suptitle('Model Agreement Analysis', fontweight='bold', fontsize=14)
fig.tight_layout()
save_fig(fig, 'model_agreement_distribution')

# 5c. Characteristics of high vs low agreement
# Compare feature distributions
if len(low_agreement) > 0 and len(high_agreement) > 0:
    fig, axes = plt.subplots(3, 4, figsize=(18, 12))
    axes = axes.flatten()
    top_features_idx = list(range(min(12, X.shape[1])))
    # Use top features from importance
    shap_path = os.path.join(RES_DIR, 'shap_values_summary.csv')
    if os.path.exists(shap_path):
        shap_summary = pd.read_csv(shap_path)
        top_feat_names = shap_summary.columns[1:13].tolist()  # Top features from SHAP
    else:
        top_feat_names = clinical_names[:12]

    for i, fname in enumerate(top_feat_names[:12]):
        ax = axes[i]
        if fname in clinical_names:
            fidx = clinical_names.index(fname)
        else:
            fidx = i
        high_vals = X.iloc[high_agreement.index, fidx]
        low_vals = X.iloc[low_agreement.index, fidx]
        ax.hist(high_vals, bins=25, alpha=0.5, color='green', label='High Agree', density=True, edgecolor='white')
        ax.hist(low_vals, bins=25, alpha=0.5, color='red', label='Low Agree', density=True, edgecolor='white')
        ax.set_title(fname[:20], fontsize=8)
        ax.legend(fontsize=6)
    fig.suptitle('Feature Distributions: High vs Low Agreement Samples', fontweight='bold')
    fig.tight_layout()
    save_fig(fig, 'agreement_feature_comparison')

print(f'Section 5 completed in {time.time()-t0:.1f}s')

# =====================================================================
# SECTION 6: PREDICTION STABILITY ANALYSIS
# =====================================================================
print('\n' + '='*60)
print('Section 6: Prediction Stability Analysis')
print('='*60)
t0 = time.time()

perturbation_levels = [0.05, 0.10]  # 5% and 10%
n_perturb = 20  # Number of perturbation iterations per level

stability_results = []
stability_models = list(models.keys())

# Subsample for speed
np.random.seed(42)
stab_idx = np.random.choice(n_samples, min(500, n_samples), replace=False)
X_stab = X.iloc[stab_idx]
y_stab = y[stab_idx]

for mname in stability_models:
    model = models[mname]
    try:
        base_proba = get_proba(model, X_stab)
    except:
        continue

    for level in perturbation_levels:
        pred_changes = np.zeros(len(X_stab))
        prob_diffs = np.zeros(len(X_stab))

        for iteration in range(n_perturb):
            noise = np.random.normal(0, level, X_stab.shape)
            X_perturbed = X_stab + noise
            perturbed_proba = get_proba(model, X_perturbed)

            prob_diffs += np.abs(perturbed_proba - base_proba)
            pred_changes += ((perturbed_proba >= 0.5).astype(int) !=
                            (base_proba >= 0.5).astype(int)).astype(float)

        mean_prob_diff = prob_diffs / n_perturb
        flip_rate = pred_changes / n_perturb

        stability_results.append({
            'Model': mname,
            'Perturbation_Level': level,
            'Mean_Prob_Change': float(np.mean(mean_prob_diff)),
            'Max_Prob_Change': float(np.max(mean_prob_diff)),
            'Median_Prob_Change': float(np.median(mean_prob_diff)),
            'Flip_Rate': float(np.mean(flip_rate)),
            'Stability_Score': float(1 - np.mean(flip_rate))
        })

    if mname in stability_models[:5]:
        print(f'  {mname}: done')

stability_df = pd.DataFrame(stability_results)
stability_df.to_csv(os.path.join(RES_DIR, 'prediction_stability.csv'), index=False)
print(f'Saved prediction_stability.csv ({len(stability_df)} rows)')

# Feature-level stability analysis (which features cause most instability)
print('  Computing feature-level stability...')
feat_instability = {}
ref_model_name = 'XGBoost'
ref_model = models.get(ref_model_name)
if ref_model:
    base_proba_ref = get_proba(ref_model, X_stab)
    for feat_idx in range(X.shape[1]):
        noise = np.zeros(X_stab.shape)
        noise[:, feat_idx] = np.random.normal(0, 0.1, len(X_stab))
        X_p = X_stab + noise
        p_proba = get_proba(ref_model, X_p)
        feat_instability[clinical_names[feat_idx]] = float(np.mean(np.abs(p_proba - base_proba_ref)))

    feat_instab_df = pd.DataFrame([{'Feature': k, 'Mean_Prob_Change': v}
                                    for k, v in feat_instability.items()])
    feat_instab_df = feat_instab_df.sort_values('Mean_Prob_Change', ascending=False)
    print(f'  Top 5 unstable features ({ref_model_name}):')
    print(feat_instab_df.head().to_string(index=False))

# Plots
# 6a. Stability comparison across models
fig, axes = plt.subplots(1, 2, figsize=(16, 7))
for ax, level in zip(axes, perturbation_levels):
    sub = stability_df[stability_df['Perturbation_Level'] == level].sort_values('Stability_Score', ascending=True)
    colors = plt.cm.RdYlGn(sub['Stability_Score'].values)
    ax.barh(range(len(sub)), sub['Stability_Score'], color=colors, edgecolor='black', linewidth=0.5)
    ax.set_yticks(range(len(sub)))
    ax.set_yticklabels(sub['Model'], fontsize=7)
    ax.set_xlabel('Stability Score (1 = perfectly stable)')
    ax.set_title(f'Perturbation ±{int(level*100)}%')
    ax.set_xlim(0, 1.05)
fig.suptitle('Prediction Stability Analysis – All Models', fontweight='bold', fontsize=14)
fig.tight_layout()
save_fig(fig, 'prediction_stability_comparison')

# 6b. Feature instability plot
if feat_instability:
    fig, ax = plt.subplots(figsize=(10, 8))
    top_instab = feat_instab_df.head(15)
    colors = plt.cm.Reds(np.linspace(0.3, 0.9, len(top_instab)))
    ax.barh(range(len(top_instab)), top_instab['Mean_Prob_Change'].values, color=colors, edgecolor='black')
    ax.set_yticks(range(len(top_instab)))
    ax.set_yticklabels(top_instab['Feature'].values, fontsize=9)
    ax.set_xlabel('Mean Probability Change (±10% perturbation)')
    ax.set_title(f'Feature Instability Ranking – {ref_model_name}', fontweight='bold')
    ax.invert_yaxis()
    fig.tight_layout()
    save_fig(fig, 'feature_instability_ranking')

# 6c. Flip rate heatmap
pivot = stability_df.pivot(index='Model', columns='Perturbation_Level', values='Flip_Rate')
fig, ax = plt.subplots(figsize=(8, 12))
sns.heatmap(pivot.sort_values(0.05), annot=True, fmt='.3f', cmap='YlOrRd', ax=ax,
            linewidths=0.5, cbar_kws={'label': 'Prediction Flip Rate'})
ax.set_title('Prediction Flip Rate by Model and Perturbation Level', fontweight='bold')
ax.set_xlabel('Perturbation Level')
fig.tight_layout()
save_fig(fig, 'flip_rate_heatmap')

print(f'Section 6 completed in {time.time()-t0:.1f}s')

# =====================================================================
# SECTION 7: SUMMARY REPORT
# =====================================================================
print('\n' + '='*60)
print('Section 7: Generating Summary Report')
print('='*60)

report = f"""# Part 4: Advanced XAI Analysis – Summary Log
## NOA ML Project – Phase 5

**Date**: {time.strftime('%Y-%m-%d %H:%M')}
**Dataset**: {n_samples} samples, {X.shape[1]} features
**Models**: {len(models)} models analyzed

---

### 1. Uncertainty Quantification

**Method**: Bootstrap sampling ({N_BOOTSTRAP} iterations) for {len(top_models_unc)} top models
**Metrics**: Prediction confidence intervals, calibrated confidence scores

| Model | Median Std | Mean CI Width | High-Uncertainty Samples |
|-------|-----------|---------------|------------------------|
"""

for mname in top_models_unc:
    r = uncertainty_results[mname]
    high_unc = np.sum(r['ci_width'] > borderline_threshold)
    report += f"| {mname} | {np.median(r['std_pred']):.4f} | {np.mean(r['ci_width']):.4f} | {high_unc} |\n"

report += f"""
**Ensemble Variance**: Computed for {', '.join(ensemble_variance.keys())} using individual estimator predictions.

**Figures**:
- `uncertainty_distribution.png/tiff` – Bootstrap std dev distribution
- `uncertainty_ci_by_class.png/tiff` – CI width by true class
- `uncertainty_prob_vs_ci.png/tiff` – Probability vs uncertainty scatter
- `ensemble_variance_distribution.png/tiff` – Ensemble variance

---

### 2. Feature Interaction Analysis

**Method**: SHAP interaction values ({interaction_model_name})
**Samples**: {len(X_sub)} (stratified subsample)

**Top 10 Feature Interaction Pairs**:

| Rank | Feature 1 | Feature 2 | Mean |SHAP Interaction| |
|------|-----------|-----------|---------------------|
"""

if len(pairs_df) > 0:
    for rank, (_, row) in enumerate(pairs_df.head(10).iterrows()):
        report += f"| {rank+1} | {row['Feature_1']} | {row['Feature_2']} | {row['Mean_Abs_Interaction']:.4f} |\n"

report += f"""
**Figures**:
- `interaction_heatmap.png/tiff` – SHAP interaction heatmap (top 15 features)
- `interaction_pair_*.png/tiff` – Detailed plots for top 5 pairs

---

### 3. Counterfactual Explanations

**Model**: {cf_model_name}
**Method**: Greedy perturbation of clinically actionable features
**Archetypes analyzed**: {', '.join(counterfactual_results.keys())}

| Archetype | Original Prob | CF Prob | Flipped | N Changes |
|-----------|--------------|---------|---------|-----------|
"""

for arch, cfr in counterfactual_results.items():
    report += f"| {arch} | {cfr['original_prob']:.4f} | {cfr['counterfactual_prob']:.4f} | {'Yes' if cfr['flipped'] else 'No'} | {cfr['n_changes']} |\n"

report += f"""
**Key Changes**:
"""
for arch, cfr in counterfactual_results.items():
    report += f"\n**{arch}**:\n"
    for ch in cfr['changes'][:5]:
        report += f"- {ch['Feature']}: {ch['Original']:.3f} → {ch['Counterfactual']:.3f} (Δ={ch['Change']:.3f})\n"

report += f"""
**Figures**:
- `counterfactual_explanations.png/tiff` – Original vs counterfactual comparison

---

### 4. Clinical Rules (Anchors)

**Method**: Surrogate decision trees (depth=4, min_samples_leaf=50)

| Model | Fidelity | Surrogate AUC | Total Rules | High-Conf Rules |
|-------|----------|---------------|-------------|-----------------|
"""

for mname in surrogate_models:
    cr = clinical_rules[mname]
    report += f"| {mname} | {cr['fidelity']:.3f} | {cr['surrogate_auc']:.3f} | {cr['n_rules']} | {cr['n_high_confidence_rules']} |\n"

report += f"""
**Example Rules** (from {surrogate_models[0]}):
"""
if surrogate_models and clinical_rules[surrogate_models[0]]['rules']:
    for i, rule in enumerate(clinical_rules[surrogate_models[0]]['rules'][:5]):
        pred_label = 'Success' if rule['prediction'] == 1 else 'Failure'
        conditions = ' AND '.join(rule['rules'])
        report += f"{i+1}. IF {conditions} THEN **{pred_label}** (confidence={rule['confidence']:.2f}, n={rule['n_samples']})\n"

report += f"""
**Figures**:
- `clinical_rules_summary.png/tiff` – Rule summary with confidence scores

---

### 5. Model Agreement Analysis

**Models**: {len(all_preds)} models
**High agreement (≥90%)**: {len(high_agreement)} samples ({100*len(high_agreement)/n_samples:.1f}%)
**Low agreement (<70%)**: {len(low_agreement)} samples ({100*len(low_agreement)/n_samples:.1f}%)

**Figures**:
- `model_agreement_heatmap.png/tiff` – Prediction heatmap (100 samples × {len(all_preds)} models)
- `model_agreement_distribution.png/tiff` – Agreement rate distribution
- `agreement_feature_comparison.png/tiff` – Feature distributions by agreement level

---

### 6. Prediction Stability Analysis

**Method**: Random perturbations (±5%, ±10%) with {n_perturb} iterations per level
**Samples**: {len(X_stab)} (random subsample)

**Top 5 Most Stable Models (±5%)**:

| Model | Stability Score | Flip Rate | Mean Prob Change |
|-------|----------------|-----------|------------------|
"""

stable_5 = stability_df[stability_df['Perturbation_Level'] == 0.05].sort_values('Stability_Score', ascending=False).head(5)
for _, row in stable_5.iterrows():
    report += f"| {row['Model']} | {row['Stability_Score']:.4f} | {row['Flip_Rate']:.4f} | {row['Mean_Prob_Change']:.4f} |\n"

report += f"""
**Top 5 Most Unstable Features** ({ref_model_name}):

| Feature | Mean Probability Change |
|---------|----------------------|
"""
if feat_instability:
    for _, row in feat_instab_df.head(5).iterrows():
        report += f"| {row['Feature']} | {row['Mean_Prob_Change']:.4f} |\n"

report += f"""
**Figures**:
- `prediction_stability_comparison.png/tiff` – Stability score comparison
- `feature_instability_ranking.png/tiff` – Feature instability ranking
- `flip_rate_heatmap.png/tiff` – Flip rate heatmap

---

### Output Files

**Data Files** (in `3_Results/Phase5_XAI/`):
- `uncertainty_analysis.csv` – Bootstrap uncertainty for all samples
- `feature_interactions.csv` – SHAP interaction values for all feature pairs
- `counterfactual_explanations.json` – Counterfactual scenarios
- `clinical_rules.json` – Extracted clinical rules
- `model_agreement.csv` – Model agreement for all samples
- `prediction_stability.csv` – Stability metrics for all models

**Figures** (in `4_Figures/Phase5_XAI/`, PNG + TIFF 300 DPI):
- Uncertainty: 4 figures
- Interactions: 6 figures (heatmap + 5 pair plots)
- Counterfactuals: 1 figure
- Clinical Rules: 1 figure
- Model Agreement: 3 figures
- Prediction Stability: 3 figures
- **Total new figures**: ~18 (36 files with PNG+TIFF)
"""

with open(os.path.join(REP_DIR, 'Part4_Summary_Log.md'), 'w') as f:
    f.write(report)
print('Saved Part4_Summary_Log.md')

print('\n' + '='*60)
print('Part 4: Advanced XAI Analysis – COMPLETE')
print('='*60)
