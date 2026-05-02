#!/usr/bin/env python3
"""SHAP Global Analysis + Summary Report (Tasks 2&3 already done)"""

import os, json, warnings, time
import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import StratifiedShuffleSplit
import shap

warnings.filterwarnings('ignore')
np.random.seed(42)

BASE = '[path]
MODEL_DIR = f'{BASE}/phase4_output/Chat_4__Validation___Robustness-2/NOA_ML_Project/6_Models/Saved'
DATA_PATH = f'{BASE}/phase4_output/Chat_4__Validation___Robustness-2/NOA_ML_Project/1_Data/Processed/encoded_dataset.csv'
MAPPING_PATH = f'{BASE}/feature_mapping.json'
FIG_DIR = f'{BASE}/4_Figures/Phase5_XAI'
RES_DIR = f'{BASE}/3_Results/Phase5_XAI'
REP_DIR = f'{BASE}/5_Reports'

plt.rcParams.update({
    'font.family': 'serif', 'font.size': 10,
    'axes.titlesize': 12, 'axes.labelsize': 11,
    'figure.dpi': 150, 'savefig.dpi': 300,
    'savefig.bbox': 'tight', 'savefig.pad_inches': 0.1
})

# Load data
df = pd.read_csv(DATA_PATH)
X = df.drop('TARGET', axis=1)
y = df['TARGET']
with open(MAPPING_PATH) as f:
    mapping = json.load(f)
f2c = mapping['feature_to_clinical']
clinical_names = [f2c.get(c, c) for c in X.columns]

# Load models
models = {}
for fname in sorted(os.listdir(MODEL_DIR)):
    if fname.endswith('.joblib'):
        name = fname.replace('.joblib', '')
        try:
            models[name] = joblib.load(os.path.join(MODEL_DIR, fname))
        except:
            pass
print(f"Loaded {len(models)} models")

# Subsample
sss = StratifiedShuffleSplit(n_splits=1, test_size=500, random_state=42)
_, sub_idx = next(sss.split(X, y))
X_sub = X.iloc[sub_idx]

# Background for KernelExplainer
bg_idx = np.random.choice(len(X), 50, replace=False)
X_bg = X.iloc[bg_idx]
# Small sample for SVM
kernel_idx = np.random.choice(len(X_sub), 100, replace=False)
X_kernel = X_sub.iloc[kernel_idx]

top5 = ['SVM', 'XGBoost', 'LightGBM', 'RandomForest', 'GradientBoosting']
shap_summaries = {}

for mname in top5:
    if mname not in models:
        print(f"  ✗ {mname} not found"); continue
    model = models[mname]
    print(f"\nProcessing SHAP for {mname}...")
    t0 = time.time()
    try:
        if mname in ['XGBoost', 'LightGBM', 'RandomForest', 'GradientBoosting']:
            explainer = shap.TreeExplainer(model)
            sv = explainer.shap_values(X_sub)
            X_plot = X_sub
            if isinstance(sv, list):
                sv = sv[1]
            elif isinstance(sv, np.ndarray) and sv.ndim == 3:
                sv = sv[:, :, 1]  # class 1
        else:
            # SVM
            predict_fn = model.decision_function if hasattr(model, 'decision_function') else model.predict_proba
            explainer = shap.KernelExplainer(predict_fn, X_bg)
            sv = explainer.shap_values(X_kernel, nsamples=150)
            X_plot = X_kernel
            if isinstance(sv, list):
                sv = sv[1]

        elapsed = time.time() - t0
        print(f"  Done in {elapsed:.1f}s, shape: {np.array(sv).shape}")

        mean_abs = np.mean(np.abs(sv), axis=0)
        shap_summaries[mname] = mean_abs

        X_named = X_plot.copy()
        X_named.columns = clinical_names

        # Beeswarm
        plt.figure(figsize=(10, 10))
        shap.summary_plot(sv, X_named, show=False, max_display=20, plot_size=None)
        plt.title(f'SHAP Beeswarm — {mname}', fontsize=13)
        plt.tight_layout()
        plt.savefig(f'{FIG_DIR}/shap_beeswarm_{mname}.png')
        plt.savefig(f'{FIG_DIR}/shap_beeswarm_{mname}.tiff', dpi=300, format='tiff')
        plt.close('all')
        print(f"  Saved shap_beeswarm_{mname}")

        # Bar
        plt.figure(figsize=(10, 8))
        shap.summary_plot(sv, X_named, plot_type='bar', show=False, max_display=20, plot_size=None)
        plt.title(f'SHAP Feature Importance (Mean |SHAP|) — {mname}', fontsize=13)
        plt.tight_layout()
        plt.savefig(f'{FIG_DIR}/shap_bar_{mname}.png')
        plt.savefig(f'{FIG_DIR}/shap_bar_{mname}.tiff', dpi=300, format='tiff')
        plt.close('all')
        print(f"  Saved shap_bar_{mname}")

    except Exception as e:
        import traceback
        print(f"  ✗ Error: {e}")
        traceback.print_exc()

# Summary comparison
if shap_summaries:
    shap_df = pd.DataFrame(shap_summaries, index=clinical_names)
    shap_df['Mean'] = shap_df.mean(axis=1)
    shap_df_sorted = shap_df.sort_values('Mean', ascending=False)
    shap_df_sorted.to_csv(f'{RES_DIR}/shap_values_summary.csv')
    print(f"\nSaved shap_values_summary.csv")

    top20 = shap_df_sorted.drop('Mean', axis=1).head(20)

    # Comparison bar
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
    print("Saved shap_comparison_top5")

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
    print("Saved shap_heatmap_top5")

    print("\nTop 10 Features by Mean |SHAP|:")
    for i, (feat, val) in enumerate(shap_df_sorted['Mean'].head(10).items()):
        print(f"  {i+1}. {feat}: {val:.4f}")

# ── Generate Summary Report ──────────────────────────────────────────
print("\nGenerating Part1_Summary_Log.md...")

# Load previous results for the report
fi_df = pd.read_csv(f'{RES_DIR}/feature_importance_native.csv', index_col=0)
fi_df['Mean'] = fi_df.mean(axis=1)
fi_sorted = fi_df.sort_values('Mean', ascending=False)

perm_df = pd.read_csv(f'{RES_DIR}/permutation_importance.csv', index_col=0)
perm_sorted = perm_df.sort_values('Mean', ascending=False) if 'Mean' in perm_df.columns else perm_df

lines = []
lines.append("# Part 1: Core XAI Analysis — Summary Log\n")
lines.append("## Project: NOA ML - Phase 5 Explainable AI\n")
lines.append(f"- **Date**: 2026-03-13")
lines.append(f"- **Dataset**: {X.shape[0]} samples, {X.shape[1]} features")
lines.append(f"- **Models loaded**: {len(models)}")
lines.append(f"- **Tree-based models (native FI)**: {sum(1 for m in models.values() if hasattr(m, 'feature_importances_'))}\n")

lines.append("---\n")
lines.append("## 1. Native Feature Importance (Tree-Based Models)\n")
tree_names = [k for k in sorted(models.keys()) if hasattr(models[k], 'feature_importances_')]
lines.append(f"Models analyzed: {', '.join(tree_names)}\n")
lines.append("### Top 10 Features (by mean importance across tree-based models):\n")
lines.append("| Rank | Feature | Mean Importance |")
lines.append("|------|---------|----------------|")
for i, (feat, row) in enumerate(fi_sorted.head(10).iterrows()):
    lines.append(f"| {i+1} | {feat} | {row['Mean']:.4f} |")

lines.append("\n### Figures Generated:")
lines.append("- `native_fi_comparison.png/tiff` — Bar chart comparing all tree-based models")
lines.append("- `native_fi_average.png/tiff` — Average importance with std error bars")
lines.append("- `native_fi_heatmap.png/tiff` — Heatmap across all tree-based models\n")

lines.append("---\n")
lines.append("## 2. Permutation Importance (All Models)\n")
lines.append(f"Models analyzed: {len(models)} (all loaded models)")
lines.append(f"Evaluation metric: ROC-AUC, n_repeats=30, subsample=500\n")
lines.append("### Top 10 Consensus Features:\n")
lines.append("| Rank | Feature | Mean Perm. Importance |")
lines.append("|------|---------|----------------------|")
for i, (feat, row) in enumerate(perm_sorted.head(10).iterrows()):
    val = row['Mean'] if 'Mean' in perm_sorted.columns else row.mean()
    lines.append(f"| {i+1} | {feat} | {val:.4f} |")

lines.append("\n### Figures Generated:")
lines.append("- `permutation_importance_heatmap.png/tiff` — Heatmap across all models")
lines.append("- `permutation_importance_boxplot.png/tiff` — Distribution boxplot for top 15 features\n")

lines.append("---\n")
lines.append("## 3. SHAP Global Analysis (Top 5 Models)\n")
lines.append(f"Models: {', '.join(top5)}\n")
if shap_summaries:
    lines.append("### Top 10 Features by Mean |SHAP|:\n")
    lines.append("| Rank | Feature | Mean |SHAP| |")
    lines.append("|------|---------|-------------|")
    for i, (feat, val) in enumerate(shap_df_sorted['Mean'].head(10).items()):
        lines.append(f"| {i+1} | {feat} | {val:.4f} |")

lines.append("\n### Figures Generated (per model):")
for mname in top5:
    if mname in shap_summaries:
        lines.append(f"- `shap_beeswarm_{mname}.png/tiff` — Beeswarm plot")
        lines.append(f"- `shap_bar_{mname}.png/tiff` — Bar plot")
lines.append("- `shap_comparison_top5.png/tiff` — Combined comparison")
lines.append("- `shap_heatmap_top5.png/tiff` — Heatmap comparison\n")

lines.append("---\n")
lines.append("## Output Files\n")
lines.append("### CSV Files (in 3_Results/Phase5_XAI/):")
lines.append("- `feature_importance_native.csv`")
lines.append("- `permutation_importance.csv`")
lines.append("- `shap_values_summary.csv`\n")
lines.append("### Figures (in 4_Figures/Phase5_XAI/):")
lines.append("- All figures saved in PNG (quick view) + TIFF (300 DPI, publication quality)\n")

with open(f'{REP_DIR}/Part1_Summary_Log.md', 'w') as f:
    f.write('\n'.join(lines))
print(f"Saved Part1_Summary_Log.md")

print("\n" + "=" * 70)
print("PART 1 COMPLETE!")
print("=" * 70)
