#!/usr/bin/env python3
"""
Phase 5 - Part 3: Model Performance Visualization
NOA ML Project - Predicting Sperm Retrieval Success

Generates:
1. ROC Curves with 95% Bootstrap Confidence Intervals (all 27 models)
2. Precision-Recall Curves (all 27 models)
3. Calibration/Reliability Diagrams (all 27 models)
4. Confusion Matrices with optimal thresholds (all 27 models)
5. Performance Summary Table

Author: Hossein Jamalirad, PhD Candidate of Medical Informatics
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
import matplotlib.gridspec as gridspec
import seaborn as sns
from sklearn.metrics import (
    roc_curve, auc, precision_recall_curve, average_precision_score,
    confusion_matrix, accuracy_score, f1_score,
    precision_score, recall_score, brier_score_loss,
    roc_auc_score
)
from sklearn.calibration import calibration_curve
from sklearn.utils import resample

warnings.filterwarnings('ignore')
np.random.seed(42)

# =============================================================================
# CONFIGURATION
# =============================================================================
MODEL_DIR = '[path]
DATA_PATH = '[path]
MAPPING_PATH = '[path]
FIG_DIR = '[path]
RES_DIR = '[path]
REPORT_DIR = '[path]

N_BOOTSTRAP = 1000
RANDOM_STATE = 42
DPI = 300

os.makedirs(FIG_DIR, exist_ok=True)
os.makedirs(RES_DIR, exist_ok=True)
os.makedirs(REPORT_DIR, exist_ok=True)

# Publication-quality plot settings
plt.rcParams.update({
    'font.size': 11,
    'axes.titlesize': 13,
    'axes.labelsize': 12,
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'legend.fontsize': 8,
    'figure.dpi': 150,
    'savefig.dpi': DPI,
    'savefig.bbox': 'tight',
    'font.family': 'serif',
})

# Color palette for models
MODEL_COLORS = {}
cmap = plt.cm.get_cmap('tab20', 27)

def save_fig(fig, name):
    """Save figure as PNG and TIFF at 300 DPI."""
    fig.savefig(os.path.join(FIG_DIR, f'{name}.png'), dpi=DPI, bbox_inches='tight')
    fig.savefig(os.path.join(FIG_DIR, f'{name}.tiff'), dpi=DPI, bbox_inches='tight')
    plt.close(fig)
    print(f"  Saved: {name}.png / .tiff")

# =============================================================================
# LOAD DATA & MODELS
# =============================================================================
print("=" * 70)
print("PART 3: MODEL PERFORMANCE VISUALIZATION")
print("=" * 70)

t0 = time.time()

# Load dataset
df = pd.read_csv(DATA_PATH)
X = df.drop('TARGET', axis=1)
y = df['TARGET'].values
print(f"\nDataset: {X.shape[0]} samples, {X.shape[1]} features")
print(f"Class distribution: {np.bincount(y.astype(int))} (neg/pos)")

# Load feature mapping
with open(MAPPING_PATH) as f:
    mapping = json.load(f)
feature_names = mapping.get('feature_names', {})

# Load models
models = {}
for f in sorted(os.listdir(MODEL_DIR)):
    if f.endswith('.joblib'):
        name = f.replace('.joblib', '')
        try:
            models[name] = joblib.load(os.path.join(MODEL_DIR, f))
        except Exception as e:
            print(f"  WARNING: Could not load {name}: {e}")

print(f"Loaded {len(models)} models: {list(models.keys())}")

# Assign colors
for i, name in enumerate(sorted(models.keys())):
    MODEL_COLORS[name] = cmap(i)

# =============================================================================
# GET PREDICTIONS FOR ALL MODELS
# =============================================================================
print("\n--- Computing predictions for all models ---")
model_probs = {}
model_preds_default = {}

for name, model in models.items():
    try:
        if hasattr(model, 'predict_proba'):
            probs = model.predict_proba(X)[:, 1]
        elif hasattr(model, 'decision_function'):
            scores = model.decision_function(X)
            # Normalize to [0, 1] using sigmoid
            probs = 1 / (1 + np.exp(-scores))
        else:
            print(f"  SKIP {name}: no predict_proba or decision_function")
            continue
        model_probs[name] = probs
        model_preds_default[name] = model.predict(X)
        print(f"  {name}: OK (prob range: {probs.min():.4f} - {probs.max():.4f})")
    except Exception as e:
        print(f"  ERROR {name}: {e}")

print(f"\nModels with predictions: {len(model_probs)}")

# =============================================================================
# 1. ROC CURVES WITH 95% BOOTSTRAP CONFIDENCE INTERVALS
# =============================================================================
print("\n" + "=" * 70)
print("1. ROC CURVES WITH 95% BOOTSTRAP CI")
print("=" * 70)

roc_results = {}
mean_fpr = np.linspace(0, 1, 200)

for name, probs in model_probs.items():
    print(f"  Processing {name}...")
    # Main ROC
    fpr, tpr, thresholds = roc_curve(y, probs)
    main_auc = auc(fpr, tpr)
    
    # Optimal threshold (Youden's J)
    j_scores = tpr - fpr
    opt_idx = np.argmax(j_scores)
    opt_threshold = thresholds[opt_idx]
    opt_fpr = fpr[opt_idx]
    opt_tpr = tpr[opt_idx]
    
    # Bootstrap CI
    boot_aucs = []
    boot_tprs = []
    for i in range(N_BOOTSTRAP):
        idx = resample(np.arange(len(y)), random_state=i, stratify=y)
        if len(np.unique(y[idx])) < 2:
            continue
        b_fpr, b_tpr, _ = roc_curve(y[idx], probs[idx])
        boot_aucs.append(auc(b_fpr, b_tpr))
        boot_tprs.append(np.interp(mean_fpr, b_fpr, b_tpr))
    
    boot_aucs = np.array(boot_aucs)
    boot_tprs = np.array(boot_tprs)
    
    auc_ci_low = np.percentile(boot_aucs, 2.5)
    auc_ci_high = np.percentile(boot_aucs, 97.5)
    tpr_ci_low = np.percentile(boot_tprs, 2.5, axis=0)
    tpr_ci_high = np.percentile(boot_tprs, 97.5, axis=0)
    mean_tpr = np.mean(boot_tprs, axis=0)
    
    roc_results[name] = {
        'fpr': fpr, 'tpr': tpr, 'thresholds': thresholds,
        'auc': main_auc, 'auc_ci_low': auc_ci_low, 'auc_ci_high': auc_ci_high,
        'opt_threshold': opt_threshold, 'opt_fpr': opt_fpr, 'opt_tpr': opt_tpr,
        'mean_tpr': mean_tpr, 'tpr_ci_low': tpr_ci_low, 'tpr_ci_high': tpr_ci_high,
    }

# --- Individual ROC curves ---
print("  Creating individual ROC plots...")
for name, res in roc_results.items():
    fig, ax = plt.subplots(figsize=(7, 6))
    ax.plot(res['fpr'], res['tpr'], color='#2563eb', lw=2,
            label=f"AUC = {res['auc']:.3f} (95% CI: {res['auc_ci_low']:.3f}–{res['auc_ci_high']:.3f})")
    ax.fill_between(mean_fpr, res['tpr_ci_low'], res['tpr_ci_high'],
                     alpha=0.2, color='#2563eb', label='95% CI band')
    ax.plot(res['opt_fpr'], res['opt_tpr'], 'r*', markersize=14, zorder=5,
            label=f"Optimal threshold = {res['opt_threshold']:.3f}")
    ax.plot([0, 1], [0, 1], 'k--', lw=1, alpha=0.5)
    ax.set_xlim([-0.02, 1.02])
    ax.set_ylim([-0.02, 1.02])
    ax.set_xlabel('False Positive Rate (1 - Specificity)')
    ax.set_ylabel('True Positive Rate (Sensitivity)')
    ax.set_title(f'ROC Curve – {name}')
    ax.legend(loc='lower right', fontsize=9)
    ax.grid(True, alpha=0.3)
    save_fig(fig, f'roc_{name}')

# --- Comparison plot: All models ---
print("  Creating ROC comparison plot...")
fig, ax = plt.subplots(figsize=(10, 9))
sorted_models = sorted(roc_results.keys(), key=lambda x: roc_results[x]['auc'], reverse=True)
top5 = sorted_models[:5]

for name in sorted_models:
    res = roc_results[name]
    lw = 2.5 if name in top5 else 0.8
    alpha = 1.0 if name in top5 else 0.4
    label = f"{name} (AUC={res['auc']:.3f})" if name in top5 else None
    ax.plot(res['fpr'], res['tpr'], color=MODEL_COLORS[name], lw=lw, alpha=alpha, label=label)

# Add non-top5 as a group in legend
for name in sorted_models[5:]:
    res = roc_results[name]
ax.plot([], [], color='gray', lw=0.8, alpha=0.5, label=f'Other {len(sorted_models)-5} models')

ax.plot([0, 1], [0, 1], 'k--', lw=1, alpha=0.5, label='Random')
ax.set_xlim([-0.02, 1.02])
ax.set_ylim([-0.02, 1.02])
ax.set_xlabel('False Positive Rate (1 - Specificity)')
ax.set_ylabel('True Positive Rate (Sensitivity)')
ax.set_title('ROC Curves – All 27 Models (Top 5 Highlighted)')
ax.legend(loc='lower right', fontsize=9)
ax.grid(True, alpha=0.3)
save_fig(fig, 'roc_comparison_all_models')

# --- Top 5 comparison with CI ---
print("  Creating Top 5 ROC comparison...")
fig, ax = plt.subplots(figsize=(9, 8))
colors_top5 = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#264653']
for i, name in enumerate(top5):
    res = roc_results[name]
    ax.plot(res['fpr'], res['tpr'], color=colors_top5[i], lw=2.5,
            label=f"{name} (AUC={res['auc']:.3f} [{res['auc_ci_low']:.3f}–{res['auc_ci_high']:.3f}])")
    ax.fill_between(mean_fpr, res['tpr_ci_low'], res['tpr_ci_high'],
                     alpha=0.1, color=colors_top5[i])
    ax.plot(res['opt_fpr'], res['opt_tpr'], '*', color=colors_top5[i], markersize=12, zorder=5)

ax.plot([0, 1], [0, 1], 'k--', lw=1, alpha=0.5)
ax.set_xlim([-0.02, 1.02])
ax.set_ylim([-0.02, 1.02])
ax.set_xlabel('False Positive Rate (1 - Specificity)')
ax.set_ylabel('True Positive Rate (Sensitivity)')
ax.set_title('ROC Curves – Top 5 Models with 95% Bootstrap CI')
ax.legend(loc='lower right', fontsize=9)
ax.grid(True, alpha=0.3)
save_fig(fig, 'roc_top5_with_CI')

print(f"  ROC analysis complete. Top 5: {top5}")

# =============================================================================
# 2. PRECISION-RECALL CURVES
# =============================================================================
print("\n" + "=" * 70)
print("2. PRECISION-RECALL CURVES")
print("=" * 70)

pr_results = {}
for name, probs in model_probs.items():
    precision, recall, pr_thresholds = precision_recall_curve(y, probs)
    ap = average_precision_score(y, probs)
    pr_results[name] = {
        'precision': precision, 'recall': recall,
        'thresholds': pr_thresholds, 'ap': ap
    }
    print(f"  {name}: AP = {ap:.4f}")

# Individual PR curves
print("  Creating individual PR plots...")
for name, res in pr_results.items():
    fig, ax = plt.subplots(figsize=(7, 6))
    ax.plot(res['recall'], res['precision'], color='#2563eb', lw=2,
            label=f"AP = {res['ap']:.3f}")
    baseline = y.mean()
    ax.axhline(y=baseline, color='gray', linestyle='--', lw=1, label=f'Baseline (prevalence={baseline:.3f})')
    ax.set_xlim([-0.02, 1.02])
    ax.set_ylim([-0.02, 1.02])
    ax.set_xlabel('Recall (Sensitivity)')
    ax.set_ylabel('Precision (PPV)')
    ax.set_title(f'Precision-Recall Curve – {name}')
    ax.legend(loc='lower left', fontsize=9)
    ax.grid(True, alpha=0.3)
    save_fig(fig, f'pr_{name}')

# Comparison plot
print("  Creating PR comparison plot...")
fig, ax = plt.subplots(figsize=(10, 9))
sorted_pr = sorted(pr_results.keys(), key=lambda x: pr_results[x]['ap'], reverse=True)
top5_pr = sorted_pr[:5]

for name in sorted_pr:
    res = pr_results[name]
    lw = 2.5 if name in top5_pr else 0.8
    alpha = 1.0 if name in top5_pr else 0.4
    label = f"{name} (AP={res['ap']:.3f})" if name in top5_pr else None
    ax.plot(res['recall'], res['precision'], color=MODEL_COLORS[name], lw=lw, alpha=alpha, label=label)

ax.plot([], [], color='gray', lw=0.8, alpha=0.5, label=f'Other {len(sorted_pr)-5} models')
baseline = y.mean()
ax.axhline(y=baseline, color='gray', linestyle='--', lw=1, label=f'Baseline ({baseline:.3f})')
ax.set_xlim([-0.02, 1.02])
ax.set_ylim([-0.02, 1.02])
ax.set_xlabel('Recall (Sensitivity)')
ax.set_ylabel('Precision (PPV)')
ax.set_title('Precision-Recall Curves – All 27 Models (Top 5 Highlighted)')
ax.legend(loc='lower left', fontsize=9)
ax.grid(True, alpha=0.3)
save_fig(fig, 'pr_comparison_all_models')

# =============================================================================
# 3. CALIBRATION / RELIABILITY DIAGRAMS
# =============================================================================
print("\n" + "=" * 70)
print("3. CALIBRATION / RELIABILITY DIAGRAMS")
print("=" * 70)

cal_results = {}
for name, probs in model_probs.items():
    brier = brier_score_loss(y, probs)
    try:
        prob_true, prob_pred = calibration_curve(y, probs, n_bins=10, strategy='uniform')
    except Exception:
        prob_true, prob_pred = calibration_curve(y, probs, n_bins=5, strategy='uniform')
    cal_results[name] = {
        'prob_true': prob_true, 'prob_pred': prob_pred,
        'brier': brier
    }
    print(f"  {name}: Brier = {brier:.4f}")

# Individual calibration plots
print("  Creating individual calibration plots...")
for name, res in cal_results.items():
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(7, 8), gridspec_kw={'height_ratios': [3, 1]})
    
    ax1.plot([0, 1], [0, 1], 'k--', lw=1, label='Perfectly calibrated')
    ax1.plot(res['prob_pred'], res['prob_true'], 's-', color='#2563eb', lw=2, markersize=6,
             label=f"Brier = {res['brier']:.4f}")
    ax1.set_ylabel('Fraction of positives')
    ax1.set_title(f'Calibration Diagram – {name}')
    ax1.legend(loc='lower right', fontsize=9)
    ax1.grid(True, alpha=0.3)
    ax1.set_xlim([-0.02, 1.02])
    ax1.set_ylim([-0.02, 1.02])
    
    # Histogram of predicted probabilities
    ax2.hist(model_probs[name], bins=30, color='#2563eb', alpha=0.7, edgecolor='white')
    ax2.set_xlabel('Predicted probability')
    ax2.set_ylabel('Count')
    ax2.set_title('Prediction distribution')
    
    fig.tight_layout()
    save_fig(fig, f'calibration_{name}')

# Comparison plot
print("  Creating calibration comparison plot...")
fig, ax = plt.subplots(figsize=(10, 9))
sorted_cal = sorted(cal_results.keys(), key=lambda x: cal_results[x]['brier'])
top5_cal = sorted_cal[:5]  # lowest brier = best

ax.plot([0, 1], [0, 1], 'k--', lw=1.5, label='Perfectly calibrated')
for name in sorted_cal:
    res = cal_results[name]
    lw = 2.5 if name in top5_cal else 0.8
    alpha = 1.0 if name in top5_cal else 0.3
    label = f"{name} (Brier={res['brier']:.4f})" if name in top5_cal else None
    ax.plot(res['prob_pred'], res['prob_true'], 's-', color=MODEL_COLORS[name],
            lw=lw, alpha=alpha, markersize=4 if name in top5_cal else 2, label=label)

ax.plot([], [], color='gray', lw=0.8, alpha=0.5, label=f'Other {len(sorted_cal)-5} models')
ax.set_xlim([-0.02, 1.02])
ax.set_ylim([-0.02, 1.02])
ax.set_xlabel('Mean predicted probability')
ax.set_ylabel('Fraction of positives')
ax.set_title('Calibration Diagrams – All 27 Models (Top 5 by Brier Score Highlighted)')
ax.legend(loc='lower right', fontsize=8)
ax.grid(True, alpha=0.3)
save_fig(fig, 'calibration_comparison_all_models')

# =============================================================================
# 4. CONFUSION MATRICES
# =============================================================================
print("\n" + "=" * 70)
print("4. CONFUSION MATRICES")
print("=" * 70)

# Use Youden's J optimal thresholds from ROC analysis
optimal_thresholds = {}
cm_metrics = {}

for name, probs in model_probs.items():
    opt_thresh = roc_results[name]['opt_threshold']
    optimal_thresholds[name] = opt_thresh
    
    y_pred = (probs >= opt_thresh).astype(int)
    cm = confusion_matrix(y, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    sens = tp / (tp + fn) if (tp + fn) > 0 else 0
    spec = tn / (tn + fp) if (tn + fp) > 0 else 0
    ppv = tp / (tp + fp) if (tp + fp) > 0 else 0
    npv = tn / (tn + fn) if (tn + fn) > 0 else 0
    acc = (tp + tn) / (tp + tn + fp + fn)
    f1 = 2 * ppv * sens / (ppv + sens) if (ppv + sens) > 0 else 0
    
    cm_metrics[name] = {
        'Threshold': opt_thresh,
        'TP': tp, 'TN': tn, 'FP': fp, 'FN': fn,
        'Sensitivity': sens, 'Specificity': spec,
        'PPV': ppv, 'NPV': npv,
        'Accuracy': acc, 'F1': f1
    }
    print(f"  {name}: Thresh={opt_thresh:.3f} Sens={sens:.3f} Spec={spec:.3f} F1={f1:.3f}")

# Individual confusion matrix heatmaps
print("  Creating confusion matrix heatmaps...")
for name, probs in model_probs.items():
    opt_thresh = optimal_thresholds[name]
    y_pred = (probs >= opt_thresh).astype(int)
    cm = confusion_matrix(y, y_pred)
    
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=ax,
                xticklabels=['Negative', 'Positive'],
                yticklabels=['Negative', 'Positive'],
                annot_kws={'size': 16})
    ax.set_xlabel('Predicted Label')
    ax.set_ylabel('True Label')
    m = cm_metrics[name]
    ax.set_title(f'Confusion Matrix – {name}\n'
                 f'Threshold={opt_thresh:.3f} | Sens={m["Sensitivity"]:.3f} | '
                 f'Spec={m["Specificity"]:.3f} | F1={m["F1"]:.3f}')
    save_fig(fig, f'cm_{name}')

# Summary confusion matrix grid (all models)
print("  Creating confusion matrix grid...")
n_models = len(model_probs)
ncols = 5
nrows = int(np.ceil(n_models / ncols))
fig, axes = plt.subplots(nrows, ncols, figsize=(ncols * 4, nrows * 3.5))
axes = axes.flatten()

for i, name in enumerate(sorted(model_probs.keys())):
    opt_thresh = optimal_thresholds[name]
    y_pred = (model_probs[name] >= opt_thresh).astype(int)
    cm = confusion_matrix(y, y_pred)
    
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[i],
                xticklabels=['N', 'P'], yticklabels=['N', 'P'],
                annot_kws={'size': 10}, cbar=False)
    m = cm_metrics[name]
    axes[i].set_title(f'{name}\nSens={m["Sensitivity"]:.2f} Spec={m["Specificity"]:.2f}', fontsize=9)
    axes[i].tick_params(labelsize=8)

# Hide unused axes
for j in range(i + 1, len(axes)):
    axes[j].set_visible(False)

fig.suptitle('Confusion Matrices – All 27 Models (Youden\'s J Optimal Thresholds)', fontsize=14, y=1.01)
fig.tight_layout()
save_fig(fig, 'cm_grid_all_models')

# =============================================================================
# 5. PERFORMANCE SUMMARY TABLE
# =============================================================================
print("\n" + "=" * 70)
print("5. PERFORMANCE SUMMARY TABLE")
print("=" * 70)

summary_rows = []
for name in sorted(model_probs.keys()):
    r = roc_results[name]
    pr = pr_results[name]
    cal = cal_results[name]
    m = cm_metrics[name]
    
    summary_rows.append({
        'Model': name,
        'AUC': r['auc'],
        'AUC_CI_Low': r['auc_ci_low'],
        'AUC_CI_High': r['auc_ci_high'],
        'Average_Precision': pr['ap'],
        'Brier_Score': cal['brier'],
        'Optimal_Threshold': m['Threshold'],
        'Sensitivity': m['Sensitivity'],
        'Specificity': m['Specificity'],
        'PPV': m['PPV'],
        'NPV': m['NPV'],
        'F1': m['F1'],
        'Accuracy': m['Accuracy'],
        'TP': m['TP'],
        'TN': m['TN'],
        'FP': m['FP'],
        'FN': m['FN'],
    })

summary_df = pd.DataFrame(summary_rows)
summary_df = summary_df.sort_values('AUC', ascending=False).reset_index(drop=True)

# Add rank columns
for metric in ['AUC', 'Average_Precision', 'Sensitivity', 'Specificity', 'PPV', 'NPV', 'F1', 'Accuracy']:
    summary_df[f'{metric}_Rank'] = summary_df[metric].rank(ascending=False, method='min').astype(int)
summary_df['Brier_Score_Rank'] = summary_df['Brier_Score'].rank(ascending=True, method='min').astype(int)

# Save CSVs
summary_df.to_csv(os.path.join(RES_DIR, 'performance_metrics_all_models.csv'), index=False)
print(f"  Saved: performance_metrics_all_models.csv")

cm_df = pd.DataFrame([{**{'Model': name}, **cm_metrics[name]} for name in sorted(cm_metrics.keys())])
cm_df.to_csv(os.path.join(RES_DIR, 'confusion_matrix_metrics.csv'), index=False)
print(f"  Saved: confusion_matrix_metrics.csv")

thresh_df = pd.DataFrame([{'Model': name, 'Optimal_Threshold': optimal_thresholds[name],
                            'AUC': roc_results[name]['auc'],
                            'Method': "Youden's J statistic"}
                           for name in sorted(optimal_thresholds.keys())])
thresh_df.to_csv(os.path.join(RES_DIR, 'optimal_thresholds_phase5.csv'), index=False)
print(f"  Saved: optimal_thresholds_phase5.csv")

# Create summary heatmap
print("  Creating performance heatmap...")
metric_cols = ['AUC', 'Average_Precision', 'Brier_Score', 'Sensitivity', 'Specificity', 'PPV', 'NPV', 'F1', 'Accuracy']
heatmap_df = summary_df.set_index('Model')[metric_cols].copy()
# For Brier, lower is better, so invert for coloring
fig, ax = plt.subplots(figsize=(14, 12))
display_df = heatmap_df.copy()
sns.heatmap(display_df, annot=True, fmt='.3f', cmap='RdYlGn', ax=ax,
            linewidths=0.5, linecolor='white',
            annot_kws={'size': 8},
            mask=False)
ax.set_title('Performance Metrics Summary – All 27 Models', fontsize=14)
ax.set_ylabel('')
plt.xticks(rotation=30, ha='right')
fig.tight_layout()
save_fig(fig, 'performance_summary_heatmap')

# Print top performers
print("\n  === TOP 5 PERFORMERS BY AUC ===")
for i, row in summary_df.head(5).iterrows():
    print(f"  {i+1}. {row['Model']}: AUC={row['AUC']:.4f} [{row['AUC_CI_Low']:.4f}–{row['AUC_CI_High']:.4f}]")

# =============================================================================
# 6. SUMMARY LOG
# =============================================================================
print("\n" + "=" * 70)
print("6. GENERATING PART 3 SUMMARY LOG")
print("=" * 70)

elapsed = time.time() - t0

# Build markdown report
report = f"""# Part 3: Model Performance Visualization – Summary Log

**Project**: NOA ML – Predicting Sperm Retrieval Success  
**Researcher**: Hossein Jamalirad, PhD Candidate of Medical Informatics  
**Date**: {time.strftime('%Y-%m-%d %H:%M')}  
**Dataset**: {X.shape[0]} samples, {X.shape[1]} features  
**Models Analyzed**: {len(model_probs)}  
**Bootstrap Iterations**: {N_BOOTSTRAP}  
**Execution Time**: {elapsed:.1f} seconds  

---

## 1. ROC Curves with 95% Bootstrap CI

| Rank | Model | AUC | 95% CI | Optimal Threshold |
|------|-------|-----|--------|-------------------|
"""

for i, row in summary_df.head(27).iterrows():
    report += f"| {i+1} | {row['Model']} | {row['AUC']:.4f} | [{row['AUC_CI_Low']:.4f}–{row['AUC_CI_High']:.4f}] | {row['Optimal_Threshold']:.4f} |\n"

report += f"""
**Top 5 by AUC**: {', '.join(summary_df.head(5)['Model'].tolist())}

### Generated Figures:
- Individual ROC curves: `roc_<model>.png/.tiff` (27 files)
- All models comparison: `roc_comparison_all_models.png/.tiff`
- Top 5 with CI: `roc_top5_with_CI.png/.tiff`

---

## 2. Precision-Recall Curves

| Rank | Model | Average Precision |
|------|-------|-------------------|
"""

sorted_ap = summary_df.sort_values('Average_Precision', ascending=False)
for i, (_, row) in enumerate(sorted_ap.iterrows()):
    report += f"| {i+1} | {row['Model']} | {row['Average_Precision']:.4f} |\n"

report += f"""
**Top 5 by AP**: {', '.join(sorted_ap.head(5)['Model'].tolist())}

### Generated Figures:
- Individual PR curves: `pr_<model>.png/.tiff` (27 files)
- All models comparison: `pr_comparison_all_models.png/.tiff`

---

## 3. Calibration / Reliability Diagrams

| Rank | Model | Brier Score |
|------|-------|-------------|
"""

sorted_brier = summary_df.sort_values('Brier_Score')
for i, (_, row) in enumerate(sorted_brier.iterrows()):
    report += f"| {i+1} | {row['Model']} | {row['Brier_Score']:.4f} |\n"

report += f"""
**Best Calibrated (lowest Brier)**: {', '.join(sorted_brier.head(5)['Model'].tolist())}

### Generated Figures:
- Individual calibration plots: `calibration_<model>.png/.tiff` (27 files)
- All models comparison: `calibration_comparison_all_models.png/.tiff`

---

## 4. Confusion Matrices

All confusion matrices use **Youden's J statistic** optimal thresholds.

| Model | Threshold | Sensitivity | Specificity | PPV | NPV | F1 | Accuracy |
|-------|-----------|-------------|-------------|-----|-----|----|----------|
"""

for _, row in summary_df.iterrows():
    report += f"| {row['Model']} | {row['Optimal_Threshold']:.4f} | {row['Sensitivity']:.4f} | {row['Specificity']:.4f} | {row['PPV']:.4f} | {row['NPV']:.4f} | {row['F1']:.4f} | {row['Accuracy']:.4f} |\n"

report += f"""
### Generated Figures:
- Individual confusion matrices: `cm_<model>.png/.tiff` (27 files)
- Grid view all models: `cm_grid_all_models.png/.tiff`

---

## 5. Performance Summary

### Overall Best Performers (by AUC):
"""

for i, row in summary_df.head(5).iterrows():
    report += f"{i+1}. **{row['Model']}**: AUC={row['AUC']:.4f}, AP={row['Average_Precision']:.4f}, Brier={row['Brier_Score']:.4f}, F1={row['F1']:.4f}\n"

report += f"""
### Generated Figures:
- Performance heatmap: `performance_summary_heatmap.png/.tiff`

---

## Output Files

### Data Files (in `3_Results/Phase5_XAI/`):
- `performance_metrics_all_models.csv` – Complete metrics with rankings
- `confusion_matrix_metrics.csv` – Confusion matrix breakdown
- `optimal_thresholds_phase5.csv` – Optimal thresholds (Youden's J)

### Figures (in `4_Figures/Phase5_XAI/`, PNG + TIFF @ 300 DPI):
- 27 × ROC curves (`roc_<model>`)
- 27 × PR curves (`pr_<model>`)
- 27 × Calibration plots (`calibration_<model>`)
- 27 × Confusion matrices (`cm_<model>`)
- 1 × ROC comparison (`roc_comparison_all_models`)
- 1 × ROC top 5 with CI (`roc_top5_with_CI`)
- 1 × PR comparison (`pr_comparison_all_models`)
- 1 × Calibration comparison (`calibration_comparison_all_models`)
- 1 × CM grid (`cm_grid_all_models`)
- 1 × Performance heatmap (`performance_summary_heatmap`)
- **Total: ~116 figure files (58 PNG + 58 TIFF)**
"""

with open(os.path.join(REPORT_DIR, 'Part3_Summary_Log.md'), 'w') as f:
    f.write(report)
print(f"  Saved: Part3_Summary_Log.md")

print(f"\n{'=' * 70}")
print(f"PART 3 COMPLETE – {elapsed:.1f}s")
print(f"{'=' * 70}")
