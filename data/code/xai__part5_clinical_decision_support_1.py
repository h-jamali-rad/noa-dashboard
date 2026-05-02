#!/usr/bin/env python3
"""
Phase 5, Part 5: Clinical Decision Support Tools
NOA ML Project - Machine Learning for Predicting Sperm Retrieval Success in NOA
Researcher: Hossein Jamalirad, PhD Candidate of Medical Informatics

Tasks:
1. Subgroup Analysis
2. Clinical Risk Stratification
3. Clinical Decision Curves (DCA)
4. Nomogram
5. Cost-Benefit Analysis Framework
6. Fairness Analysis
7. Feature Redundancy Analysis
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
import matplotlib.patches as mpatches
import matplotlib.gridspec as gridspec
from matplotlib.colors import LinearSegmentedColormap
import seaborn as sns
from sklearn.metrics import (roc_auc_score, roc_curve, confusion_matrix,
                             accuracy_score, precision_score, recall_score,
                             f1_score, brier_score_loss, average_precision_score,
                             precision_recall_curve)
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from scipy import stats

warnings.filterwarnings('ignore')
np.random.seed(42)

# ============================================================================
# PATHS
# ============================================================================
BASE_DIR = '[path]
MODEL_DIR = os.path.join(BASE_DIR, 'phase4_output/Chat_4__Validation___Robustness-2/NOA_ML_Project/6_Models/Saved')
DATA_PATH = os.path.join(BASE_DIR, 'phase4_output/Chat_4__Validation___Robustness-2/NOA_ML_Project/1_Data/Processed/encoded_dataset.csv')
MAPPING_PATH = os.path.join(BASE_DIR, 'feature_mapping.json')
FIG_DIR = os.path.join(BASE_DIR, '4_Figures/Phase5_XAI')
RES_DIR = os.path.join(BASE_DIR, '3_Results/Phase5_XAI')
REP_DIR = os.path.join(BASE_DIR, '5_Reports')

os.makedirs(FIG_DIR, exist_ok=True)
os.makedirs(RES_DIR, exist_ok=True)
os.makedirs(REP_DIR, exist_ok=True)

# ============================================================================
# MATPLOTLIB STYLE
# ============================================================================
plt.rcParams.update({
    'figure.dpi': 150,
    'savefig.dpi': 300,
    'font.size': 11,
    'axes.titlesize': 13,
    'axes.labelsize': 11,
    'xtick.labelsize': 9,
    'ytick.labelsize': 9,
    'legend.fontsize': 9,
    'figure.titlesize': 14,
    'font.family': 'sans-serif',
})
sns.set_style("whitegrid")

# ============================================================================
# LOAD DATA & MODELS
# ============================================================================
print("=" * 70)
print("PART 5: CLINICAL DECISION SUPPORT TOOLS")
print("=" * 70)

# Load data
df = pd.read_csv(DATA_PATH)
X = df.drop('TARGET', axis=1)
y = df['TARGET']
feature_names = list(X.columns)

# Load feature mapping
with open(MAPPING_PATH) as f:
    fm = json.load(f)
f2c = fm['feature_to_clinical']
clinical_names = [f2c.get(f, f) for f in feature_names]
clinical_map = dict(zip(feature_names, clinical_names))

# Load models
models = {}
for fname in sorted(os.listdir(MODEL_DIR)):
    if fname.endswith('.joblib'):
        name = fname.replace('.joblib', '')
        try:
            models[name] = joblib.load(os.path.join(MODEL_DIR, fname))
        except Exception as e:
            print(f"  Warning: Could not load {name}: {e}")
print(f"Loaded {len(models)} models")

# Load performance metrics
perf_df = pd.read_csv(os.path.join(RES_DIR, 'performance_metrics_all_models.csv'))
thresh_df = pd.read_csv(os.path.join(RES_DIR, 'optimal_thresholds_phase5.csv'))

# Get predictions for all models
def get_proba(model, X_data):
    """Get prediction probabilities."""
    if hasattr(model, 'predict_proba'):
        proba = model.predict_proba(X_data)
        if proba.ndim == 2:
            return proba[:, 1]
        return proba
    elif hasattr(model, 'decision_function'):
        dec = model.decision_function(X_data)
        return 1 / (1 + np.exp(-dec))
    else:
        return model.predict(X_data).astype(float)

print("Computing predictions for all models...")
all_probas = {}
for name, model in models.items():
    try:
        all_probas[name] = get_proba(model, X)
    except Exception as e:
        print(f"  Warning: {name} prediction failed: {e}")

# Top 5 models by AUC
top5 = perf_df.sort_values('AUC', ascending=False).head(5)['Model'].tolist()
print(f"Top 5 models: {top5}")

# Best model
best_model_name = top5[0]
best_proba = all_probas[best_model_name]
print(f"Best model: {best_model_name} (AUC={perf_df.loc[perf_df.Model==best_model_name, 'AUC'].values[0]:.4f})")

# Helper function to save figures
def save_fig(fig, name, close=True):
    """Save figure in PNG and TIFF formats."""
    png_path = os.path.join(FIG_DIR, f"{name}.png")
    tiff_path = os.path.join(FIG_DIR, f"{name}.tiff")
    fig.savefig(png_path, bbox_inches='tight', dpi=300)
    fig.savefig(tiff_path, bbox_inches='tight', dpi=300, format='tiff')
    if close:
        plt.close(fig)
    print(f"  Saved: {name}.png/.tiff")

# ============================================================================
# TASK 1: SUBGROUP ANALYSIS
# ============================================================================
print("\n" + "=" * 70)
print("TASK 1: SUBGROUP ANALYSIS")
print("=" * 70)

# Define subgroups based on standardized feature quantiles
# Age (Feature_1): Young < Q25, Middle Q25-Q75, Advanced > Q75
age_col = 'Feature_1'
fsh_col = 'Feature_32'
karyotype_col = 'Feature_35'
testis_col = 'Feature_19'

age_q25, age_q75 = X[age_col].quantile(0.25), X[age_col].quantile(0.75)
fsh_median = X[fsh_col].median()
karyotype_median = X[karyotype_col].median()
testis_q33, testis_q66 = X[testis_col].quantile(0.33), X[testis_col].quantile(0.66)

subgroups = {
    'Age: Young (<35)': X[age_col] < age_q25,
    'Age: Middle (35-45)': (X[age_col] >= age_q25) & (X[age_col] <= age_q75),
    'Age: Advanced (>45)': X[age_col] > age_q75,
    'Karyotype: Normal': X[karyotype_col] >= karyotype_median,
    'Karyotype: Abnormal': X[karyotype_col] < karyotype_median,
    'FSH: Normal (<12)': X[fsh_col] <= fsh_median,
    'FSH: Elevated (≥12)': X[fsh_col] > fsh_median,
    'Testis: Small': X[testis_col] < testis_q33,
    'Testis: Normal': (X[testis_col] >= testis_q33) & (X[testis_col] <= testis_q66),
    'Testis: Large': X[testis_col] > testis_q66,
}

subgroup_results = []
for sg_name, mask in subgroups.items():
    n_samples = mask.sum()
    y_sg = y[mask]
    prevalence = y_sg.mean()
    
    for model_name in top5:
        proba_sg = all_probas[model_name][mask]
        try:
            auc = roc_auc_score(y_sg, proba_sg)
        except:
            auc = np.nan
        
        # Use 0.5 threshold for simplicity
        preds = (proba_sg >= 0.5).astype(int)
        cm = confusion_matrix(y_sg, preds, labels=[0, 1])
        tn, fp, fn, tp = cm.ravel()
        sens = tp / (tp + fn) if (tp + fn) > 0 else 0
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0
        
        subgroup_results.append({
            'Subgroup': sg_name,
            'N': n_samples,
            'Prevalence': prevalence,
            'Model': model_name,
            'AUC': auc,
            'Sensitivity': sens,
            'Specificity': spec,
        })

sg_df = pd.DataFrame(subgroup_results)
sg_df.to_csv(os.path.join(RES_DIR, 'subgroup_analysis.csv'), index=False)
print(f"  Subgroup analysis: {len(sg_df)} rows saved")

# --- Subgroup Performance Comparison Plot ---
fig, axes = plt.subplots(2, 2, figsize=(16, 14))
fig.suptitle('Subgroup Performance Analysis\nModel Performance Across Clinical Subgroups', fontsize=14, fontweight='bold')

# Age subgroups
ax = axes[0, 0]
age_sg = sg_df[sg_df['Subgroup'].str.startswith('Age')]
age_pivot = age_sg.pivot_table(index='Model', columns='Subgroup', values='AUC')
age_pivot.plot(kind='bar', ax=ax, width=0.7, colormap='Set2')
ax.set_title('AUC by Age Group', fontweight='bold')
ax.set_ylabel('AUC')
ax.set_ylim(0.5, 1.05)
ax.legend(fontsize=8, loc='lower right')
ax.tick_params(axis='x', rotation=30)
ax.axhline(y=0.9, color='gray', linestyle='--', alpha=0.5, label='AUC=0.9')

# FSH subgroups
ax = axes[0, 1]
fsh_sg = sg_df[sg_df['Subgroup'].str.startswith('FSH')]
fsh_pivot = fsh_sg.pivot_table(index='Model', columns='Subgroup', values='AUC')
fsh_pivot.plot(kind='bar', ax=ax, width=0.6, color=['#2196F3', '#FF5722'])
ax.set_title('AUC by FSH Status', fontweight='bold')
ax.set_ylabel('AUC')
ax.set_ylim(0.5, 1.05)
ax.legend(fontsize=8, loc='lower right')
ax.tick_params(axis='x', rotation=30)

# Karyotype subgroups
ax = axes[1, 0]
karyo_sg = sg_df[sg_df['Subgroup'].str.startswith('Karyotype')]
karyo_pivot = karyo_sg.pivot_table(index='Model', columns='Subgroup', values='AUC')
karyo_pivot.plot(kind='bar', ax=ax, width=0.6, color=['#4CAF50', '#E91E63'])
ax.set_title('AUC by Karyotype', fontweight='bold')
ax.set_ylabel('AUC')
ax.set_ylim(0.5, 1.05)
ax.legend(fontsize=8, loc='lower right')
ax.tick_params(axis='x', rotation=30)

# Testis size subgroups
ax = axes[1, 1]
testis_sg = sg_df[sg_df['Subgroup'].str.startswith('Testis')]
testis_pivot = testis_sg.pivot_table(index='Model', columns='Subgroup', values='AUC')
testis_pivot.plot(kind='bar', ax=ax, width=0.7, colormap='viridis')
ax.set_title('AUC by Testis Size', fontweight='bold')
ax.set_ylabel('AUC')
ax.set_ylim(0.5, 1.05)
ax.legend(fontsize=8, loc='lower right')
ax.tick_params(axis='x', rotation=30)

plt.tight_layout()
save_fig(fig, 'subgroup_performance_comparison')

# --- Sensitivity/Specificity comparison heatmap ---
fig, axes = plt.subplots(1, 2, figsize=(18, 8))

# Best model subgroup sensitivity
best_sg = sg_df[sg_df['Model'] == best_model_name]
for idx, metric in enumerate(['Sensitivity', 'Specificity']):
    ax = axes[idx]
    data = best_sg.set_index('Subgroup')[[metric]]
    colors = ['#4CAF50' if v >= 0.8 else '#FFC107' if v >= 0.6 else '#F44336' for v in data[metric]]
    bars = ax.barh(range(len(data)), data[metric], color=colors)
    ax.set_yticks(range(len(data)))
    ax.set_yticklabels(data.index, fontsize=9)
    ax.set_xlabel(metric)
    ax.set_title(f'{metric} by Subgroup ({best_model_name})', fontweight='bold')
    ax.set_xlim(0, 1.1)
    for i, v in enumerate(data[metric]):
        ax.text(v + 0.01, i, f'{v:.3f}', va='center', fontsize=8)
    # Legend
    patches = [mpatches.Patch(color='#4CAF50', label='≥0.80 (Good)'),
               mpatches.Patch(color='#FFC107', label='0.60-0.80 (Moderate)'),
               mpatches.Patch(color='#F44336', label='<0.60 (Poor)')]
    ax.legend(handles=patches, fontsize=7, loc='lower right')

fig.suptitle(f'Subgroup Sensitivity & Specificity ({best_model_name})', fontsize=13, fontweight='bold')
plt.tight_layout()
save_fig(fig, 'subgroup_sensitivity_specificity')

# --- Radar plot for best model subgroups ---
fig, ax = plt.subplots(figsize=(10, 10), subplot_kw=dict(polar=True))
categories_radar = list(best_sg['Subgroup'])
N_radar = len(categories_radar)
angles = np.linspace(0, 2 * np.pi, N_radar, endpoint=False).tolist()
angles += angles[:1]

for metric, color, ls in [('AUC', '#2196F3', '-'), ('Sensitivity', '#4CAF50', '--'), ('Specificity', '#FF9800', ':')]:
    vals = best_sg[metric].tolist()
    vals += vals[:1]
    ax.plot(angles, vals, color=color, linewidth=2, linestyle=ls, label=metric)
    ax.fill(angles, vals, color=color, alpha=0.1)

ax.set_xticks(angles[:-1])
ax.set_xticklabels(categories_radar, fontsize=8)
ax.set_ylim(0, 1.05)
ax.set_title(f'Subgroup Performance Radar ({best_model_name})', fontweight='bold', pad=20)
ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.1))
save_fig(fig, 'subgroup_radar_plot')

# Identify best/worst subgroups
best_sg_auc = best_sg.loc[best_sg['AUC'].idxmax()]
worst_sg_auc = best_sg.loc[best_sg['AUC'].idxmin()]
print(f"  Best subgroup: {best_sg_auc['Subgroup']} (AUC={best_sg_auc['AUC']:.4f})")
print(f"  Worst subgroup: {worst_sg_auc['Subgroup']} (AUC={worst_sg_auc['AUC']:.4f})")

# ============================================================================
# TASK 2: CLINICAL RISK STRATIFICATION
# ============================================================================
print("\n" + "=" * 70)
print("TASK 2: CLINICAL RISK STRATIFICATION")
print("=" * 70)

# Stratify patients using best model predictions
risk_data = pd.DataFrame({
    'Probability': best_proba,
    'Actual': y.values,
})

risk_data['Risk_Group'] = pd.cut(
    risk_data['Probability'],
    bins=[-0.01, 0.3, 0.7, 1.01],
    labels=['High Risk (P<0.3)', 'Medium Risk (0.3-0.7)', 'Low Risk (P>0.7)']
)

risk_summary = risk_data.groupby('Risk_Group', observed=True).agg(
    N=('Actual', 'count'),
    Actual_Success_Rate=('Actual', 'mean'),
    Mean_Probability=('Probability', 'mean'),
    Std_Probability=('Probability', 'std'),
).reset_index()

risk_summary['Pct_of_Total'] = (risk_summary['N'] / len(risk_data) * 100).round(1)
risk_summary.to_csv(os.path.join(RES_DIR, 'risk_stratification.csv'), index=False)
print("  Risk stratification summary:")
print(risk_summary.to_string(index=False))

# --- Risk Stratification Visualization ---
fig, axes = plt.subplots(1, 3, figsize=(18, 6))
fig.suptitle(f'Clinical Risk Stratification ({best_model_name})', fontsize=14, fontweight='bold')

# Distribution of probabilities by risk group
ax = axes[0]
colors_risk = {'High Risk (P<0.3)': '#F44336', 'Medium Risk (0.3-0.7)': '#FFC107', 'Low Risk (P>0.7)': '#4CAF50'}
for rg in risk_summary['Risk_Group']:
    mask_rg = risk_data['Risk_Group'] == rg
    ax.hist(risk_data.loc[mask_rg, 'Probability'], bins=30, alpha=0.6,
            color=colors_risk.get(rg, 'gray'), label=f"{rg} (n={mask_rg.sum()})", edgecolor='white')
ax.axvline(x=0.3, color='red', linestyle='--', alpha=0.7, label='Threshold: 0.3')
ax.axvline(x=0.7, color='green', linestyle='--', alpha=0.7, label='Threshold: 0.7')
ax.set_xlabel('Predicted Probability')
ax.set_ylabel('Count')
ax.set_title('Probability Distribution by Risk Group')
ax.legend(fontsize=8)

# Actual success rates by risk group
ax = axes[1]
bars = ax.bar(range(len(risk_summary)), risk_summary['Actual_Success_Rate'],
              color=[colors_risk.get(rg, 'gray') for rg in risk_summary['Risk_Group']],
              edgecolor='black', linewidth=0.5)
ax.set_xticks(range(len(risk_summary)))
ax.set_xticklabels(risk_summary['Risk_Group'], fontsize=8, rotation=15)
ax.set_ylabel('Actual Success Rate')
ax.set_title('Actual Success Rate by Risk Group')
ax.set_ylim(0, 1.1)
for i, (v, n) in enumerate(zip(risk_summary['Actual_Success_Rate'], risk_summary['N'])):
    ax.text(i, v + 0.02, f'{v:.1%}\n(n={n})', ha='center', fontsize=9, fontweight='bold')

# Pie chart of risk group distribution
ax = axes[2]
wedges, texts, autotexts = ax.pie(
    risk_summary['N'], labels=risk_summary['Risk_Group'],
    colors=[colors_risk.get(rg, 'gray') for rg in risk_summary['Risk_Group']],
    autopct='%1.1f%%', startangle=90, textprops={'fontsize': 9}
)
ax.set_title('Patient Distribution by Risk Group')

plt.tight_layout()
save_fig(fig, 'risk_stratification')

# --- Calibration within risk groups ---
fig, ax = plt.subplots(figsize=(10, 8))
for rg in risk_summary['Risk_Group']:
    mask_rg = risk_data['Risk_Group'] == rg
    subset = risk_data[mask_rg]
    if len(subset) > 10:
        # Bin probabilities within group
        subset_sorted = subset.sort_values('Probability')
        n_bins = min(10, len(subset) // 20)
        if n_bins >= 2:
            bins = pd.qcut(subset_sorted['Probability'], n_bins, duplicates='drop')
            cal_data = subset_sorted.groupby(bins, observed=True).agg(
                mean_prob=('Probability', 'mean'),
                mean_actual=('Actual', 'mean')
            )
            ax.plot(cal_data['mean_prob'], cal_data['mean_actual'], 'o-',
                    color=colors_risk.get(rg, 'gray'), label=f"{rg} (n={mask_rg.sum()})",
                    markersize=6, linewidth=2)

ax.plot([0, 1], [0, 1], 'k--', alpha=0.5, label='Perfect Calibration')
ax.set_xlabel('Mean Predicted Probability')
ax.set_ylabel('Actual Success Rate')
ax.set_title(f'Calibration Within Risk Groups ({best_model_name})', fontweight='bold')
ax.legend()
ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
save_fig(fig, 'risk_stratification_calibration')

# ============================================================================
# TASK 3: CLINICAL DECISION CURVES (DCA)
# ============================================================================
print("\n" + "=" * 70)
print("TASK 3: CLINICAL DECISION CURVES (DCA)")
print("=" * 70)

def decision_curve_analysis(y_true, y_prob, thresholds):
    """Calculate net benefit at each threshold."""
    n = len(y_true)
    net_benefits = []
    for t in thresholds:
        preds = (y_prob >= t).astype(int)
        tp = np.sum((preds == 1) & (y_true == 1))
        fp = np.sum((preds == 1) & (y_true == 0))
        nb = (tp / n) - (fp / n) * (t / (1 - t)) if t < 1 else 0
        net_benefits.append(nb)
    return np.array(net_benefits)

thresholds_dca = np.arange(0.01, 0.99, 0.01)

# Treat all strategy
prevalence = y.mean()
nb_treat_all = []
for t in thresholds_dca:
    nb = prevalence - (1 - prevalence) * (t / (1 - t))
    nb_treat_all.append(nb)
nb_treat_all = np.array(nb_treat_all)

# Treat none = 0 for all thresholds
nb_treat_none = np.zeros(len(thresholds_dca))

# DCA for top 5 models
dca_results = {'Threshold': thresholds_dca, 'Treat_All': nb_treat_all, 'Treat_None': nb_treat_none}
for model_name in top5:
    nb = decision_curve_analysis(y.values, all_probas[model_name], thresholds_dca)
    dca_results[model_name] = nb

dca_df = pd.DataFrame(dca_results)
dca_df.to_csv(os.path.join(RES_DIR, 'decision_curve_data.csv'), index=False)

# --- DCA Plot for all top 5 models ---
fig, ax = plt.subplots(figsize=(12, 8))
ax.plot(thresholds_dca, nb_treat_all, 'k-', linewidth=1.5, label='Treat All', alpha=0.7)
ax.plot(thresholds_dca, nb_treat_none, 'k--', linewidth=1.5, label='Treat None', alpha=0.7)

colors_dca = ['#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0']
for i, model_name in enumerate(top5):
    ax.plot(thresholds_dca, dca_results[model_name], color=colors_dca[i],
            linewidth=2, label=model_name)

ax.set_xlabel('Threshold Probability', fontsize=12)
ax.set_ylabel('Net Benefit', fontsize=12)
ax.set_title('Decision Curve Analysis (DCA)\nTop 5 Models vs Treat All vs Treat None',
             fontsize=13, fontweight='bold')
ax.legend(loc='upper right', fontsize=9)
ax.set_xlim(0, 1)
ax.set_ylim(-0.1, max(prevalence, 0.5) + 0.05)
ax.axhline(y=0, color='gray', linestyle=':', alpha=0.5)

# Shade optimal region
for i, model_name in enumerate(top5[:1]):  # Shade for best model
    nb_model = dca_results[model_name]
    benefit_mask = nb_model > np.maximum(nb_treat_all, nb_treat_none)
    if np.any(benefit_mask):
        t_start = thresholds_dca[benefit_mask][0]
        t_end = thresholds_dca[benefit_mask][-1]
        ax.axvspan(t_start, t_end, alpha=0.1, color=colors_dca[0],
                   label=f'Optimal range: {t_start:.2f}-{t_end:.2f}')
        ax.legend(loc='upper right', fontsize=9)

save_fig(fig, 'decision_curve_analysis')

# --- Individual DCA plots for top 5 ---
fig, axes = plt.subplots(2, 3, figsize=(18, 12))
axes = axes.ravel()
for i, model_name in enumerate(top5):
    ax = axes[i]
    ax.plot(thresholds_dca, nb_treat_all, 'k-', linewidth=1, label='Treat All', alpha=0.6)
    ax.plot(thresholds_dca, nb_treat_none, 'k--', linewidth=1, label='Treat None', alpha=0.6)
    ax.plot(thresholds_dca, dca_results[model_name], color=colors_dca[i],
            linewidth=2.5, label=model_name)
    
    # Find optimal threshold range
    nb_model = dca_results[model_name]
    benefit_mask = nb_model > np.maximum(nb_treat_all, nb_treat_none)
    if np.any(benefit_mask):
        t_start = thresholds_dca[benefit_mask][0]
        t_end = thresholds_dca[benefit_mask][-1]
        ax.axvspan(t_start, t_end, alpha=0.15, color=colors_dca[i])
        ax.set_title(f'{model_name}\nOptimal: {t_start:.2f}-{t_end:.2f}', fontweight='bold', fontsize=10)
    else:
        ax.set_title(model_name, fontweight='bold', fontsize=10)
    
    ax.set_xlabel('Threshold')
    ax.set_ylabel('Net Benefit')
    ax.legend(fontsize=7)
    ax.set_xlim(0, 1)
    ax.set_ylim(-0.1, max(prevalence, 0.5) + 0.05)

# Remove empty subplot
if len(top5) < 6:
    axes[5].set_visible(False)

fig.suptitle('Decision Curve Analysis — Individual Models', fontsize=14, fontweight='bold')
plt.tight_layout()
save_fig(fig, 'decision_curve_individual')

# Identify optimal threshold range for best model
nb_best = dca_results[best_model_name]
benefit_mask = nb_best > np.maximum(nb_treat_all, nb_treat_none)
if np.any(benefit_mask):
    optimal_range = (thresholds_dca[benefit_mask][0], thresholds_dca[benefit_mask][-1])
    print(f"  Optimal threshold range ({best_model_name}): {optimal_range[0]:.2f} - {optimal_range[1]:.2f}")
else:
    optimal_range = (0.3, 0.7)
    print(f"  No clear optimal range; using default: 0.3 - 0.7")

# ============================================================================
# TASK 4: NOMOGRAM
# ============================================================================
print("\n" + "=" * 70)
print("TASK 4: NOMOGRAM")
print("=" * 70)

# Fit logistic regression for nomogram
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
lr = LogisticRegression(max_iter=5000, C=1.0, random_state=42, solver='lbfgs')
lr.fit(X_scaled, y)
lr_auc = roc_auc_score(y, lr.predict_proba(X_scaled)[:, 1])
print(f"  Logistic Regression AUC (for nomogram): {lr_auc:.4f}")

# Get coefficients and create point system
coefs = lr.coef_[0]
intercept = lr.intercept_[0]

# Calculate odds ratios and confidence intervals (using Wald method)
# Standard errors from the inverse of the Hessian approximation
proba_lr = lr.predict_proba(X_scaled)[:, 1]
W = np.diag(proba_lr * (1 - proba_lr))

# Simplified SE estimation
n = len(y)
se_approx = np.abs(coefs) / np.sqrt(n) * 3  # Rough approximation

nomogram_data = []
for i, fname in enumerate(feature_names):
    cname = clinical_map[fname]
    coef = coefs[i]
    or_val = np.exp(coef)
    se = se_approx[i]
    ci_low = np.exp(coef - 1.96 * se)
    ci_high = np.exp(coef + 1.96 * se)
    
    # Point system: scale coefficients to 0-100 points
    # Points = coef / max_abs_coef * 100
    nomogram_data.append({
        'Feature': fname,
        'Clinical_Name': cname,
        'Coefficient': coef,
        'Odds_Ratio': or_val,
        'OR_CI_Low': ci_low,
        'OR_CI_High': ci_high,
        'SE': se,
    })

nomo_df = pd.DataFrame(nomogram_data)
max_abs_coef = nomo_df['Coefficient'].abs().max()
nomo_df['Points'] = (nomo_df['Coefficient'] / max_abs_coef * 100).round(1)
nomo_df = nomo_df.sort_values('Coefficient', ascending=False)

# Save nomogram coefficients
nomo_json = {
    'model': 'LogisticRegression',
    'auc': lr_auc,
    'intercept': intercept,
    'max_abs_coefficient': max_abs_coef,
    'features': nomo_df.to_dict(orient='records'),
    'point_system': {
        'description': 'Points = Coefficient / max_abs_coefficient * 100',
        'max_possible_points': 100,
        'usage': 'Sum points for all features; higher total = higher probability of success',
    },
    'scaler_means': scaler.mean_.tolist(),
    'scaler_stds': scaler.scale_.tolist(),
}
with open(os.path.join(RES_DIR, 'nomogram_coefficients.json'), 'w') as f:
    json.dump(nomo_json, f, indent=2, default=str)
print(f"  Saved nomogram_coefficients.json")

# --- Nomogram Visualization ---
# Select top 15 features by absolute coefficient
top_nomo = nomo_df.head(8).copy()
bottom_nomo = nomo_df.tail(7).copy()
nomo_display = pd.concat([top_nomo, bottom_nomo]).sort_values('Coefficient', ascending=True)

fig, ax = plt.subplots(figsize=(14, 12))

# Color by direction
colors_nomo = ['#4CAF50' if c > 0 else '#F44336' for c in nomo_display['Coefficient']]
y_pos = range(len(nomo_display))

bars = ax.barh(y_pos, nomo_display['Points'], color=colors_nomo, edgecolor='black', linewidth=0.5, alpha=0.8)
ax.set_yticks(y_pos)
ax.set_yticklabels(nomo_display['Clinical_Name'], fontsize=9)
ax.set_xlabel('Points (Relative Contribution)', fontsize=11)
ax.set_title('Clinical Nomogram — Point System\n(Based on Logistic Regression)', fontsize=13, fontweight='bold')
ax.axvline(x=0, color='black', linewidth=0.8)

for i, (pts, coef, or_val) in enumerate(zip(nomo_display['Points'], nomo_display['Coefficient'], nomo_display['Odds_Ratio'])):
    offset = 3 if pts >= 0 else -3
    ha = 'left' if pts >= 0 else 'right'
    ax.text(pts + offset, i, f'{pts:.0f}pts (OR={or_val:.2f})', va='center', ha=ha, fontsize=7.5)

# Add legend
patches = [mpatches.Patch(color='#4CAF50', label='Positive Effect (↑ Success)'),
           mpatches.Patch(color='#F44336', label='Negative Effect (↓ Success)')]
ax.legend(handles=patches, loc='lower right', fontsize=9)

plt.tight_layout()
save_fig(fig, 'nomogram_point_system')

# --- Full Nomogram with scales ---
fig = plt.figure(figsize=(16, 20))
gs = gridspec.GridSpec(len(nomo_df) + 3, 1, hspace=0.4)

# Title
ax_title = fig.add_subplot(gs[0])
ax_title.text(0.5, 0.5, 'Clinical Nomogram for NOA Sperm Retrieval Prediction',
              ha='center', va='center', fontsize=15, fontweight='bold',
              transform=ax_title.transAxes)
ax_title.text(0.5, 0.1, f'Based on Logistic Regression (AUC = {lr_auc:.3f})',
              ha='center', va='center', fontsize=11, transform=ax_title.transAxes)
ax_title.axis('off')

# Point scale at top
ax_scale = fig.add_subplot(gs[1])
ax_scale.set_xlim(-100, 100)
ax_scale.set_xticks(np.arange(-100, 101, 20))
ax_scale.set_xlabel('Points')
ax_scale.set_title('Points Scale', fontweight='bold', fontsize=10)
ax_scale.set_yticks([])

# Each feature as a row
nomo_sorted = nomo_df.sort_values('Coefficient', key=abs, ascending=False)
for idx, (_, row) in enumerate(nomo_sorted.iterrows()):
    if idx >= 15:
        break
    ax = fig.add_subplot(gs[idx + 2])
    
    # Feature value range (standardized: -3 to 3 SD)
    feat_range = np.linspace(-3, 3, 7)
    points_range = feat_range * row['Coefficient'] / max_abs_coef * 100
    
    ax.set_xlim(-100, 100)
    ax.plot(points_range, np.zeros_like(points_range), 'o-', color='steelblue', markersize=4)
    ax.set_yticks([])
    ax.set_ylabel(row['Clinical_Name'], rotation=0, fontsize=8, ha='right', va='center')
    
    # Add tick labels
    for fp, pp in zip(feat_range, points_range):
        if -100 <= pp <= 100:
            ax.annotate(f'{fp:.0f}σ', (pp, 0), textcoords="offset points",
                       xytext=(0, 10), ha='center', fontsize=6)

# Total points to probability mapping
ax_prob = fig.add_subplot(gs[-1])
total_points_range = np.linspace(-200, 200, 100)
# Convert total points back to probability
log_odds_range = total_points_range / 100 * max_abs_coef + intercept
probs_range = 1 / (1 + np.exp(-log_odds_range))
ax_prob.plot(total_points_range, probs_range, 'r-', linewidth=2)
ax_prob.set_xlabel('Total Points')
ax_prob.set_ylabel('Probability')
ax_prob.set_title('Total Points → Predicted Probability', fontweight='bold', fontsize=10)
ax_prob.axhline(y=0.5, color='gray', linestyle='--', alpha=0.5)
ax_prob.set_xlim(-200, 200)
ax_prob.set_ylim(0, 1)

plt.tight_layout()
save_fig(fig, 'nomogram_full')

# --- Odds Ratio Forest Plot ---
fig, ax = plt.subplots(figsize=(12, 14))
nomo_sorted_plot = nomo_df.sort_values('Odds_Ratio', ascending=True)
y_pos = range(len(nomo_sorted_plot))

ax.errorbar(nomo_sorted_plot['Odds_Ratio'], y_pos,
            xerr=[nomo_sorted_plot['Odds_Ratio'] - nomo_sorted_plot['OR_CI_Low'],
                  nomo_sorted_plot['OR_CI_High'] - nomo_sorted_plot['Odds_Ratio']],
            fmt='o', color='steelblue', markersize=6, capsize=3, linewidth=1.5)
ax.axvline(x=1.0, color='red', linestyle='--', linewidth=1, label='OR = 1 (No Effect)')
ax.set_yticks(y_pos)
ax.set_yticklabels(nomo_sorted_plot['Clinical_Name'], fontsize=9)
ax.set_xlabel('Odds Ratio (95% CI)', fontsize=11)
ax.set_title('Odds Ratio Forest Plot\n(Logistic Regression Coefficients)', fontsize=13, fontweight='bold')
ax.legend()

plt.tight_layout()
save_fig(fig, 'nomogram_odds_ratio_forest')

# ============================================================================
# TASK 5: COST-BENEFIT ANALYSIS FRAMEWORK
# ============================================================================
print("\n" + "=" * 70)
print("TASK 5: COST-BENEFIT ANALYSIS FRAMEWORK")
print("=" * 70)

# Define cost scenarios
# FP cost: unnecessary invasive procedure (e.g., micro-TESE when no sperm found)
# FN cost: missed opportunity for sperm retrieval
cost_scenarios = {
    'Base Case': {'FP_cost': 1.0, 'FN_cost': 2.0, 'TP_benefit': 3.0, 'TN_benefit': 0.5},
    'FN Costly (Conservative)': {'FP_cost': 0.5, 'FN_cost': 5.0, 'TP_benefit': 3.0, 'TN_benefit': 0.5},
    'FP Costly (Aggressive)': {'FP_cost': 3.0, 'FN_cost': 1.0, 'TP_benefit': 3.0, 'TN_benefit': 0.5},
    'Equal Costs': {'FP_cost': 1.0, 'FN_cost': 1.0, 'TP_benefit': 2.0, 'TN_benefit': 0.5},
    'High Stakes': {'FP_cost': 2.0, 'FN_cost': 4.0, 'TP_benefit': 5.0, 'TN_benefit': 1.0},
}

cost_results = []
thresholds_cost = np.arange(0.05, 0.96, 0.01)

for scenario_name, costs in cost_scenarios.items():
    for t in thresholds_cost:
        preds = (best_proba >= t).astype(int)
        cm = confusion_matrix(y, preds, labels=[0, 1])
        tn, fp, fn, tp = cm.ravel()
        
        total_cost = (fp * costs['FP_cost'] + fn * costs['FN_cost']
                      - tp * costs['TP_benefit'] - tn * costs['TN_benefit'])
        net_benefit = tp * costs['TP_benefit'] + tn * costs['TN_benefit'] - fp * costs['FP_cost'] - fn * costs['FN_cost']
        
        cost_results.append({
            'Scenario': scenario_name,
            'Threshold': t,
            'TP': tp, 'FP': fp, 'FN': fn, 'TN': tn,
            'Total_Cost': total_cost,
            'Net_Benefit': net_benefit,
            'FP_Cost': costs['FP_cost'],
            'FN_Cost': costs['FN_cost'],
        })

cost_df = pd.DataFrame(cost_results)
cost_df.to_csv(os.path.join(RES_DIR, 'cost_benefit_analysis.csv'), index=False)

# --- Cost-Benefit Visualization ---
fig, axes = plt.subplots(1, 2, figsize=(16, 7))

# Net benefit across thresholds
ax = axes[0]
for i, (scenario_name, _) in enumerate(cost_scenarios.items()):
    scenario_data = cost_df[cost_df['Scenario'] == scenario_name]
    ax.plot(scenario_data['Threshold'], scenario_data['Net_Benefit'],
            linewidth=2, label=scenario_name)
ax.set_xlabel('Threshold Probability')
ax.set_ylabel('Net Benefit')
ax.set_title(f'Cost-Benefit Analysis ({best_model_name})\nNet Benefit Across Thresholds', fontweight='bold')
ax.legend(fontsize=8)
ax.axhline(y=0, color='gray', linestyle='--', alpha=0.5)

# Optimal thresholds by scenario
ax = axes[1]
optimal_thresholds = []
for scenario_name in cost_scenarios:
    scenario_data = cost_df[cost_df['Scenario'] == scenario_name]
    best_idx = scenario_data['Net_Benefit'].idxmax()
    optimal_t = scenario_data.loc[best_idx, 'Threshold']
    optimal_nb = scenario_data.loc[best_idx, 'Net_Benefit']
    optimal_thresholds.append({'Scenario': scenario_name, 'Optimal_Threshold': optimal_t, 'Max_Net_Benefit': optimal_nb})

opt_df = pd.DataFrame(optimal_thresholds)
bars = ax.barh(range(len(opt_df)), opt_df['Optimal_Threshold'],
               color=plt.cm.Set2(range(len(opt_df))), edgecolor='black', linewidth=0.5)
ax.set_yticks(range(len(opt_df)))
ax.set_yticklabels(opt_df['Scenario'], fontsize=9)
ax.set_xlabel('Optimal Threshold')
ax.set_title('Optimal Threshold by Cost Scenario', fontweight='bold')
for i, (t, nb) in enumerate(zip(opt_df['Optimal_Threshold'], opt_df['Max_Net_Benefit'])):
    ax.text(t + 0.01, i, f't={t:.2f} (NB={nb:.0f})', va='center', fontsize=8)

plt.tight_layout()
save_fig(fig, 'cost_benefit_analysis')

# --- Sensitivity analysis heatmap ---
fp_costs = np.arange(0.5, 4.1, 0.5)
fn_costs = np.arange(0.5, 6.1, 0.5)
optimal_thresh_matrix = np.zeros((len(fn_costs), len(fp_costs)))

for i, fn_c in enumerate(fn_costs):
    for j, fp_c in enumerate(fp_costs):
        best_nb = -np.inf
        best_t = 0.5
        for t in thresholds_cost:
            preds = (best_proba >= t).astype(int)
            cm = confusion_matrix(y, preds, labels=[0, 1])
            tn, fp, fn, tp = cm.ravel()
            nb = tp * 3 + tn * 0.5 - fp * fp_c - fn * fn_c
            if nb > best_nb:
                best_nb = nb
                best_t = t
        optimal_thresh_matrix[i, j] = best_t

fig, ax = plt.subplots(figsize=(10, 8))
sns.heatmap(optimal_thresh_matrix, ax=ax, annot=True, fmt='.2f',
            xticklabels=[f'{c:.1f}' for c in fp_costs],
            yticklabels=[f'{c:.1f}' for c in fn_costs],
            cmap='RdYlGn_r', vmin=0, vmax=1)
ax.set_xlabel('FP Cost (Unnecessary Procedure)')
ax.set_ylabel('FN Cost (Missed Opportunity)')
ax.set_title(f'Optimal Threshold Sensitivity Analysis ({best_model_name})\nTP Benefit=3.0, TN Benefit=0.5',
             fontweight='bold')
save_fig(fig, 'cost_benefit_sensitivity')

print(f"  Cost-benefit analysis: {len(cost_df)} rows saved")
print(f"  Optimal thresholds by scenario:")
for _, row in opt_df.iterrows():
    print(f"    {row['Scenario']}: t={row['Optimal_Threshold']:.2f} (NB={row['Max_Net_Benefit']:.1f})")

# ============================================================================
# TASK 6: FAIRNESS ANALYSIS
# ============================================================================
print("\n" + "=" * 70)
print("TASK 6: FAIRNESS ANALYSIS")
print("=" * 70)

# Define demographic groups
# Age groups (Feature_1)
age_groups = {
    'Young (<Q25)': X[age_col] < age_q25,
    'Middle (Q25-Q75)': (X[age_col] >= age_q25) & (X[age_col] <= age_q75),
    'Advanced (>Q75)': X[age_col] > age_q75,
}

# Race/ethnicity proxy (Feature_5) - using tertiles as proxy groups
race_col = 'Feature_5'
race_q33 = X[race_col].quantile(0.33)
race_q66 = X[race_col].quantile(0.66)
race_groups = {
    'Group A': X[race_col] < race_q33,
    'Group B': (X[race_col] >= race_q33) & (X[race_col] <= race_q66),
    'Group C': X[race_col] > race_q66,
}

fairness_results = []

for group_type, groups in [('Age', age_groups), ('Race/Ethnicity', race_groups)]:
    for group_name, mask in groups.items():
        n = mask.sum()
        y_g = y[mask]
        prevalence_g = y_g.mean()
        
        for model_name in top5[:3]:  # Top 3 models
            proba_g = all_probas[model_name][mask]
            preds_g = (proba_g >= 0.5).astype(int)
            
            try:
                auc_g = roc_auc_score(y_g, proba_g)
            except:
                auc_g = np.nan
            
            cm = confusion_matrix(y_g, preds_g, labels=[0, 1])
            tn, fp, fn, tp = cm.ravel()
            
            # Equal Opportunity: TPR should be same across groups
            tpr = tp / (tp + fn) if (tp + fn) > 0 else 0
            # Demographic Parity: Positive prediction rate should be same
            ppr = (tp + fp) / n if n > 0 else 0
            # False Positive Rate
            fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
            # Predictive Parity: PPV should be same
            ppv = tp / (tp + fp) if (tp + fp) > 0 else 0
            
            fairness_results.append({
                'Group_Type': group_type,
                'Group': group_name,
                'N': n,
                'Prevalence': prevalence_g,
                'Model': model_name,
                'AUC': auc_g,
                'TPR (Equal Opportunity)': tpr,
                'PPR (Demographic Parity)': ppr,
                'FPR': fpr,
                'PPV (Predictive Parity)': ppv,
            })

fairness_df = pd.DataFrame(fairness_results)
fairness_df.to_csv(os.path.join(RES_DIR, 'fairness_metrics.csv'), index=False)
print(f"  Fairness analysis: {len(fairness_df)} rows saved")

# --- Fairness Comparison Plots ---
fig, axes = plt.subplots(2, 2, figsize=(16, 14))
fig.suptitle(f'Fairness Analysis Across Demographic Groups\n(Using {top5[0]})', fontsize=14, fontweight='bold')

best_fair = fairness_df[fairness_df['Model'] == top5[0]]

# TPR by Age
ax = axes[0, 0]
age_fair = best_fair[best_fair['Group_Type'] == 'Age']
colors_age = ['#2196F3', '#4CAF50', '#FF9800']
bars = ax.bar(range(len(age_fair)), age_fair['TPR (Equal Opportunity)'],
              color=colors_age, edgecolor='black', linewidth=0.5)
ax.set_xticks(range(len(age_fair)))
ax.set_xticklabels(age_fair['Group'])
ax.set_ylabel('True Positive Rate')
ax.set_title('Equal Opportunity (TPR) by Age Group', fontweight='bold')
ax.set_ylim(0, 1.1)
for i, v in enumerate(age_fair['TPR (Equal Opportunity)']):
    ax.text(i, v + 0.02, f'{v:.3f}', ha='center', fontsize=9)
# Add fairness threshold line
overall_tpr = best_fair[best_fair['Group_Type']=='Age']['TPR (Equal Opportunity)'].mean()
ax.axhline(y=overall_tpr, color='red', linestyle='--', alpha=0.5, label=f'Mean TPR: {overall_tpr:.3f}')
ax.legend()

# PPR by Age
ax = axes[0, 1]
bars = ax.bar(range(len(age_fair)), age_fair['PPR (Demographic Parity)'],
              color=colors_age, edgecolor='black', linewidth=0.5)
ax.set_xticks(range(len(age_fair)))
ax.set_xticklabels(age_fair['Group'])
ax.set_ylabel('Positive Prediction Rate')
ax.set_title('Demographic Parity (PPR) by Age Group', fontweight='bold')
ax.set_ylim(0, 1.1)
for i, v in enumerate(age_fair['PPR (Demographic Parity)']):
    ax.text(i, v + 0.02, f'{v:.3f}', ha='center', fontsize=9)

# TPR by Race
ax = axes[1, 0]
race_fair = best_fair[best_fair['Group_Type'] == 'Race/Ethnicity']
colors_race = ['#E91E63', '#9C27B0', '#00BCD4']
bars = ax.bar(range(len(race_fair)), race_fair['TPR (Equal Opportunity)'],
              color=colors_race, edgecolor='black', linewidth=0.5)
ax.set_xticks(range(len(race_fair)))
ax.set_xticklabels(race_fair['Group'])
ax.set_ylabel('True Positive Rate')
ax.set_title('Equal Opportunity (TPR) by Race/Ethnicity Group', fontweight='bold')
ax.set_ylim(0, 1.1)
for i, v in enumerate(race_fair['TPR (Equal Opportunity)']):
    ax.text(i, v + 0.02, f'{v:.3f}', ha='center', fontsize=9)

# PPR by Race
ax = axes[1, 1]
bars = ax.bar(range(len(race_fair)), race_fair['PPR (Demographic Parity)'],
              color=colors_race, edgecolor='black', linewidth=0.5)
ax.set_xticks(range(len(race_fair)))
ax.set_xticklabels(race_fair['Group'])
ax.set_ylabel('Positive Prediction Rate')
ax.set_title('Demographic Parity (PPR) by Race/Ethnicity Group', fontweight='bold')
ax.set_ylim(0, 1.1)
for i, v in enumerate(race_fair['PPR (Demographic Parity)']):
    ax.text(i, v + 0.02, f'{v:.3f}', ha='center', fontsize=9)

plt.tight_layout()
save_fig(fig, 'fairness_analysis')

# --- Fairness disparity summary ---
fig, ax = plt.subplots(figsize=(12, 8))
metrics_fairness = ['TPR (Equal Opportunity)', 'PPR (Demographic Parity)', 'FPR', 'PPV (Predictive Parity)']
disparities = []
for gt in ['Age', 'Race/Ethnicity']:
    gt_data = best_fair[best_fair['Group_Type'] == gt]
    for metric in metrics_fairness:
        max_val = gt_data[metric].max()
        min_val = gt_data[metric].min()
        disparity = max_val - min_val
        disparities.append({
            'Group_Type': gt,
            'Metric': metric,
            'Disparity': disparity,
            'Max_Group': gt_data.loc[gt_data[metric].idxmax(), 'Group'],
            'Min_Group': gt_data.loc[gt_data[metric].idxmin(), 'Group'],
        })

disp_df = pd.DataFrame(disparities)
disp_pivot = disp_df.pivot(index='Metric', columns='Group_Type', values='Disparity')
disp_pivot.plot(kind='bar', ax=ax, width=0.6, color=['#2196F3', '#E91E63'])
ax.set_ylabel('Disparity (Max - Min)')
ax.set_title(f'Fairness Disparity Summary ({top5[0]})\nSmaller = More Fair', fontweight='bold')
ax.axhline(y=0.1, color='green', linestyle='--', alpha=0.5, label='Acceptable threshold (0.10)')
ax.legend()
ax.tick_params(axis='x', rotation=30)
plt.tight_layout()
save_fig(fig, 'fairness_disparity_summary')

# Print fairness findings
print("  Fairness Disparities:")
for _, row in disp_df.iterrows():
    bias_flag = "⚠️ BIAS" if row['Disparity'] > 0.1 else "✓ Fair"
    print(f"    {row['Group_Type']} - {row['Metric']}: {row['Disparity']:.3f} ({bias_flag})")

# ============================================================================
# TASK 7: FEATURE REDUNDANCY ANALYSIS
# ============================================================================
print("\n" + "=" * 70)
print("TASK 7: FEATURE REDUNDANCY ANALYSIS")
print("=" * 70)

# Calculate feature correlations using clinical names
X_clinical = X.copy()
X_clinical.columns = clinical_names
corr_matrix = X_clinical.corr()

# Identify highly correlated pairs (|r| > 0.7)
redundant_pairs = []
for i in range(len(corr_matrix)):
    for j in range(i + 1, len(corr_matrix)):
        r = corr_matrix.iloc[i, j]
        if abs(r) > 0.7:
            redundant_pairs.append({
                'Feature_1': corr_matrix.columns[i],
                'Feature_2': corr_matrix.columns[j],
                'Correlation': r,
                'Abs_Correlation': abs(r),
            })

redundant_df = pd.DataFrame(redundant_pairs).sort_values('Abs_Correlation', ascending=False)
redundant_df.to_csv(os.path.join(RES_DIR, 'feature_redundancy.csv'), index=False)
print(f"  Found {len(redundant_df)} highly correlated pairs (|r| > 0.7)")

if len(redundant_df) > 0:
    print("  Top correlated pairs:")
    for _, row in redundant_df.head(10).iterrows():
        print(f"    {row['Feature_1']} × {row['Feature_2']}: r={row['Correlation']:.3f}")

# --- Correlation Heatmap ---
fig, ax = plt.subplots(figsize=(18, 16))
mask = np.triu(np.ones_like(corr_matrix, dtype=bool), k=1)
sns.heatmap(corr_matrix, mask=mask, ax=ax, annot=False, fmt='.2f',
            cmap='RdBu_r', center=0, vmin=-1, vmax=1,
            xticklabels=True, yticklabels=True,
            linewidths=0.5, linecolor='white',
            cbar_kws={'label': 'Pearson Correlation'})
ax.set_xticklabels(ax.get_xticklabels(), rotation=45, ha='right', fontsize=7)
ax.set_yticklabels(ax.get_yticklabels(), fontsize=7)
ax.set_title('Feature Correlation Heatmap\n(Lower Triangle, Clinical Variable Names)', fontweight='bold', fontsize=13)
save_fig(fig, 'feature_redundancy_heatmap')

# --- Focused heatmap on highly correlated features ---
if len(redundant_df) > 0:
    # Get unique features involved in high correlations
    high_corr_features = list(set(redundant_df['Feature_1'].tolist() + redundant_df['Feature_2'].tolist()))
    if len(high_corr_features) > 2:
        high_corr_matrix = corr_matrix.loc[high_corr_features, high_corr_features]
        fig, ax = plt.subplots(figsize=(12, 10))
        sns.heatmap(high_corr_matrix, ax=ax, annot=True, fmt='.2f',
                    cmap='RdBu_r', center=0, vmin=-1, vmax=1,
                    linewidths=0.5, linecolor='white',
                    cbar_kws={'label': 'Pearson Correlation'})
        ax.set_xticklabels(ax.get_xticklabels(), rotation=45, ha='right', fontsize=8)
        ax.set_yticklabels(ax.get_yticklabels(), fontsize=8)
        ax.set_title('Highly Correlated Features (|r| > 0.7)', fontweight='bold')
        save_fig(fig, 'feature_redundancy_focused')

# --- Test model performance with reduced feature sets ---
print("\n  Testing reduced feature sets...")
from sklearn.model_selection import cross_val_score

# Get feature importance from SHAP (load from Part 1)
try:
    shap_df = pd.read_csv(os.path.join(RES_DIR, 'shap_values_summary.csv'))
    # Average across models
    if 'Feature' in shap_df.columns:
        feature_importance_order = shap_df.groupby('Feature').mean(numeric_only=True).iloc[:, 0].sort_values(ascending=False).index.tolist()
    else:
        feature_importance_order = clinical_names
except:
    feature_importance_order = clinical_names

# Map clinical names back to feature names for subsetting
c2f = fm['clinical_to_feature']

# Test with incremental feature sets
# Use XGBoost as reference model (retrain quickly)
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score

# Sort features by importance (use permutation importance if available)
try:
    perm_df = pd.read_csv(os.path.join(RES_DIR, 'permutation_importance.csv'))
    if 'Feature' in perm_df.columns:
        mean_imp = perm_df.groupby('Feature').mean(numeric_only=True).iloc[:, 0].sort_values(ascending=False)
        ordered_features_clinical = mean_imp.index.tolist()
    else:
        ordered_features_clinical = clinical_names
except:
    ordered_features_clinical = clinical_names

# Map to feature columns
ordered_features = []
for cf in ordered_features_clinical:
    if cf in c2f:
        ordered_features.append(c2f[cf])
    else:
        # Try to find matching feature
        for fn in feature_names:
            if clinical_map.get(fn) == cf:
                ordered_features.append(fn)
                break

# Ensure all features are covered
for fn in feature_names:
    if fn not in ordered_features:
        ordered_features.append(fn)

# Test reduced feature sets
feature_set_results = []
reference_model = models.get('XGBoost', models.get('LightGBM', list(models.values())[0]))

# Full model AUC
full_auc = roc_auc_score(y, get_proba(reference_model, X))
print(f"  Full model AUC (reference): {full_auc:.4f}")

# Test with top-k features
for k in [5, 10, 15, 20, 25, 30, 36]:
    if k > len(ordered_features):
        continue
    selected = ordered_features[:k]
    X_sub = X[selected]
    
    # Use pre-trained model on subset (zero out non-selected features)
    X_zeroed = X.copy()
    for fn in feature_names:
        if fn not in selected:
            X_zeroed[fn] = 0
    
    try:
        sub_auc = roc_auc_score(y, get_proba(reference_model, X_zeroed))
    except:
        sub_auc = np.nan
    
    pct_of_full = (sub_auc / full_auc * 100) if full_auc > 0 else np.nan
    
    feature_set_results.append({
        'N_Features': k,
        'AUC': sub_auc,
        'Pct_of_Full': pct_of_full,
        'Features': ', '.join([clinical_map.get(f, f) for f in selected[:5]]) + ('...' if k > 5 else ''),
    })
    print(f"    Top {k} features: AUC={sub_auc:.4f} ({pct_of_full:.1f}% of full)")

fset_df = pd.DataFrame(feature_set_results)

# Find minimal feature set maintaining >95% performance
min_95 = fset_df[fset_df['Pct_of_Full'] >= 95]
if len(min_95) > 0:
    min_k = min_95['N_Features'].min()
    print(f"  Minimal feature set for 95% performance: {min_k} features")
else:
    min_k = 36
    print(f"  All features needed for 95% performance")

# --- Feature Set Performance Plot ---
fig, ax = plt.subplots(figsize=(10, 7))
ax.plot(fset_df['N_Features'], fset_df['AUC'], 'o-', color='steelblue', linewidth=2, markersize=8)
ax.axhline(y=full_auc * 0.95, color='red', linestyle='--', alpha=0.7, label=f'95% of Full AUC ({full_auc*0.95:.4f})')
ax.axhline(y=full_auc, color='green', linestyle='--', alpha=0.7, label=f'Full AUC ({full_auc:.4f})')
if min_k < 36:
    ax.axvline(x=min_k, color='orange', linestyle=':', alpha=0.7, label=f'Min features for 95%: {min_k}')
ax.set_xlabel('Number of Features')
ax.set_ylabel('AUC')
ax.set_title('Feature Redundancy: Performance vs Number of Features', fontweight='bold')
ax.legend()
ax.set_xticks(fset_df['N_Features'])
for _, row in fset_df.iterrows():
    ax.annotate(f'{row["AUC"]:.3f}', (row['N_Features'], row['AUC']),
                textcoords="offset points", xytext=(0, 10), ha='center', fontsize=8)
save_fig(fig, 'feature_redundancy_performance')

# ============================================================================
# TASK 8: SAVE OUTPUTS & GENERATE SUMMARY
# ============================================================================
print("\n" + "=" * 70)
print("TASK 8: GENERATING SUMMARY REPORT")
print("=" * 70)

# Compile summary report
summary = f"""# Part 5: Clinical Decision Support Tools — Summary Log

## Project Information
- **Project**: NOA ML Project — Machine Learning for Predicting Sperm Retrieval Success
- **Researcher**: Hossein Jamalirad, PhD Candidate of Medical Informatics
- **Phase**: 5 (Explainable AI), Part 5 (Clinical Decision Support)
- **Date**: {time.strftime('%Y-%m-%d %H:%M')}
- **Dataset**: {len(df)} samples, {len(feature_names)} features
- **Models Analyzed**: {len(models)} total, Top 5: {', '.join(top5)}
- **Best Model**: {best_model_name}

---

## Task 1: Subgroup Analysis

### Subgroup Definitions
| Subgroup | Feature | Criteria | N |
|----------|---------|----------|---|
"""

for sg_name, mask in subgroups.items():
    n = mask.sum()
    summary += f"| {sg_name} | — | Quantile-based | {n} |\n"

summary += f"""
### Key Findings
- **Best performing subgroup**: {best_sg_auc['Subgroup']} (AUC = {best_sg_auc['AUC']:.4f})
- **Worst performing subgroup**: {worst_sg_auc['Subgroup']} (AUC = {worst_sg_auc['AUC']:.4f})
- **AUC range across subgroups**: {best_sg[best_sg.Model==best_model_name]['AUC'].min():.4f} — {best_sg[best_sg.Model==best_model_name]['AUC'].max():.4f}

### Generated Figures
- `subgroup_performance_comparison.png/.tiff` — AUC comparison across all subgroup categories
- `subgroup_sensitivity_specificity.png/.tiff` — Sensitivity & Specificity bar charts
- `subgroup_radar_plot.png/.tiff` — Radar plot of subgroup performance

---

## Task 2: Clinical Risk Stratification

### Risk Group Summary
| Risk Group | N | % of Total | Actual Success Rate | Mean Probability |
|------------|---|-----------|--------------------|--------------------|
"""

for _, row in risk_summary.iterrows():
    summary += f"| {row['Risk_Group']} | {row['N']} | {row['Pct_of_Total']}% | {row['Actual_Success_Rate']:.1%} | {row['Mean_Probability']:.3f} |\n"

summary += f"""
### Clinical Interpretation
- Patients in the **Low Risk** group (predicted probability > 0.7) have the highest actual success rates
- **Medium Risk** patients (0.3–0.7) require additional clinical assessment
- **High Risk** patients (< 0.3) may benefit from alternative approaches or counseling

### Generated Figures
- `risk_stratification.png/.tiff` — Distribution, success rates, and pie chart
- `risk_stratification_calibration.png/.tiff` — Calibration within risk groups

---

## Task 3: Clinical Decision Curves (DCA)

### Net Benefit Analysis
- **Method**: Decision Curve Analysis comparing model predictions vs "Treat All" vs "Treat None"
- **Best Model**: {best_model_name}
"""

if np.any(benefit_mask):
    summary += f"- **Optimal Threshold Range**: {optimal_range[0]:.2f} — {optimal_range[1]:.2f}\n"
else:
    summary += f"- **Optimal Threshold Range**: Default range (0.30 — 0.70)\n"

summary += f"""- **Clinical Implication**: Within the optimal range, the model provides net clinical benefit over both "treat all" and "treat none" strategies

### Generated Figures
- `decision_curve_analysis.png/.tiff` — Combined DCA for top 5 models
- `decision_curve_individual.png/.tiff` — Individual DCA plots

---

## Task 4: Nomogram

### Logistic Regression Model
- **AUC**: {lr_auc:.4f}
- **Number of features**: {len(feature_names)}
- **Point system**: Coefficients scaled to -100 to +100 points

### Top Predictors (by Nomogram Points)
| Feature | Points | Odds Ratio | 95% CI |
|---------|--------|-----------|--------|
"""

for _, row in nomo_df.head(10).iterrows():
    summary += f"| {row['Clinical_Name']} | {row['Points']:.1f} | {row['Odds_Ratio']:.3f} | {row['OR_CI_Low']:.3f}–{row['OR_CI_High']:.3f} |\n"

summary += f"""
### Generated Figures
- `nomogram_point_system.png/.tiff` — Point system bar chart
- `nomogram_full.png/.tiff` — Full nomogram with scales
- `nomogram_odds_ratio_forest.png/.tiff` — Odds ratio forest plot

---

## Task 5: Cost-Benefit Analysis

### Cost Scenarios
| Scenario | Optimal Threshold | Max Net Benefit |
|----------|-------------------|-----------------|
"""

for _, row in opt_df.iterrows():
    summary += f"| {row['Scenario']} | {row['Optimal_Threshold']:.2f} | {row['Max_Net_Benefit']:.1f} |\n"

summary += f"""
### Clinical Interpretation
- The optimal threshold varies depending on the relative costs of FP (unnecessary procedure) vs FN (missed opportunity)
- **Conservative approach** (FN Costly): Lower threshold → more procedures, fewer missed cases
- **Aggressive approach** (FP Costly): Higher threshold → fewer procedures, more missed cases

### Generated Figures
- `cost_benefit_analysis.png/.tiff` — Net benefit curves and optimal thresholds
- `cost_benefit_sensitivity.png/.tiff` — Sensitivity analysis heatmap

---

## Task 6: Fairness Analysis

### Fairness Metrics
"""

for gt in ['Age', 'Race/Ethnicity']:
    gt_disp = disp_df[disp_df['Group_Type'] == gt]
    summary += f"\n#### {gt} Groups\n"
    summary += "| Metric | Disparity | Assessment |\n"
    summary += "|--------|-----------|------------|\n"
    for _, row in gt_disp.iterrows():
        flag = "⚠️ Potential Bias" if row['Disparity'] > 0.1 else "✓ Fair"
        summary += f"| {row['Metric']} | {row['Disparity']:.3f} | {flag} |\n"

summary += f"""
### Generated Figures
- `fairness_analysis.png/.tiff` — TPR and PPR comparison across groups
- `fairness_disparity_summary.png/.tiff` — Disparity summary

---

## Task 7: Feature Redundancy Analysis

### Highly Correlated Feature Pairs (|r| > 0.7)
"""

if len(redundant_df) > 0:
    summary += f"- **Total pairs found**: {len(redundant_df)}\n"
    summary += "| Feature 1 | Feature 2 | Correlation |\n"
    summary += "|-----------|-----------|-------------|\n"
    for _, row in redundant_df.head(10).iterrows():
        summary += f"| {row['Feature_1']} | {row['Feature_2']} | {row['Correlation']:.3f} |\n"
else:
    summary += "- No highly correlated pairs found (|r| > 0.7)\n"

summary += f"""
### Minimal Feature Set Analysis
- **Full model AUC**: {full_auc:.4f}
- **95% performance threshold AUC**: {full_auc * 0.95:.4f}
- **Minimal feature set for 95% performance**: {min_k} features

| N Features | AUC | % of Full |
|------------|-----|-----------|
"""

for _, row in fset_df.iterrows():
    summary += f"| {row['N_Features']} | {row['AUC']:.4f} | {row['Pct_of_Full']:.1f}% |\n"

summary += f"""
### Generated Figures
- `feature_redundancy_heatmap.png/.tiff` — Full correlation heatmap
- `feature_redundancy_focused.png/.tiff` — Focused heatmap (high correlations)
- `feature_redundancy_performance.png/.tiff` — AUC vs number of features

---

## Output Files Summary

### Data Files (in `3_Results/Phase5_XAI/`)
| File | Description |
|------|-------------|
| `subgroup_analysis.csv` | Subgroup performance metrics |
| `risk_stratification.csv` | Risk group summary |
| `decision_curve_data.csv` | DCA net benefit data |
| `nomogram_coefficients.json` | Nomogram coefficients and point system |
| `cost_benefit_analysis.csv` | Cost-benefit analysis results |
| `fairness_metrics.csv` | Fairness metrics across groups |
| `feature_redundancy.csv` | Highly correlated feature pairs |

### Figures (in `4_Figures/Phase5_XAI/`)
All figures saved in both PNG and TIFF (300 DPI) formats:
1. `subgroup_performance_comparison` — Subgroup AUC comparison
2. `subgroup_sensitivity_specificity` — Subgroup Sens/Spec
3. `subgroup_radar_plot` — Radar plot
4. `risk_stratification` — Risk stratification visualization
5. `risk_stratification_calibration` — Risk group calibration
6. `decision_curve_analysis` — Combined DCA
7. `decision_curve_individual` — Individual DCA plots
8. `nomogram_point_system` — Point system bar chart
9. `nomogram_full` — Full nomogram
10. `nomogram_odds_ratio_forest` — OR forest plot
11. `cost_benefit_analysis` — Cost-benefit curves
12. `cost_benefit_sensitivity` — Sensitivity analysis
13. `fairness_analysis` — Fairness comparison
14. `fairness_disparity_summary` — Disparity summary
15. `feature_redundancy_heatmap` — Correlation heatmap
16. `feature_redundancy_focused` — Focused heatmap
17. `feature_redundancy_performance` — AUC vs features

---

*Report generated automatically by Part 5 Clinical Decision Support Tools analysis.*
"""

with open(os.path.join(REP_DIR, 'Part5_Summary_Log.md'), 'w') as f:
    f.write(summary)
print(f"  Summary report saved: Part5_Summary_Log.md")

print("\n" + "=" * 70)
print("PART 5 COMPLETE!")
print("=" * 70)
print(f"  Data files: 7")
print(f"  Figures: 17 (PNG + TIFF)")
print(f"  Report: Part5_Summary_Log.md")
