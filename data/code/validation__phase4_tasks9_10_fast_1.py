#!/usr/bin/env python3
"""
Phase 4 Tasks 9-10: Stability Analysis and Robustness Testing (Optimized)
"""

import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import json
from datetime import datetime
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import (RandomForestClassifier, GradientBoostingClassifier, 
                              ExtraTreesClassifier, AdaBoostClassifier, VotingClassifier, StackingClassifier)
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.neural_network import MLPClassifier
import warnings
warnings.filterwarnings('ignore')

os.environ['OMP_NUM_THREADS'] = '4'

PROJECT_PATH = "[path]"
DATA_PATH = f"{PROJECT_PATH}/1_Data/Processed/encoded_dataset.csv"
RESULTS_PATH = f"{PROJECT_PATH}/3_Results/Phase4_Validation"
FIGURES_PATH = f"{PROJECT_PATH}/4_Figures/Phase4"
os.makedirs(RESULTS_PATH, exist_ok=True)
os.makedirs(FIGURES_PATH, exist_ok=True)

RANDOM_SEEDS = [0, 42, 123, 456, 789, 1000, 2000, 3000, 4000, 5000]
NOISE_LEVELS = [0.01, 0.05, 0.10]

def save_figure(fig, name):
    fig.savefig(f"{FIGURES_PATH}/{name}.png", dpi=300, bbox_inches='tight')
    fig.savefig(f"{FIGURES_PATH}/{name}.tiff", dpi=300, bbox_inches='tight')
    print(f"  Saved: {name}")

def get_model(name, random_state=42):
    try:
        models_dict = {
            'LogisticRegression': LogisticRegression(max_iter=500, random_state=random_state, n_jobs=2),
            'RandomForest': RandomForestClassifier(n_estimators=50, random_state=random_state, n_jobs=2),
            'SVM': SVC(kernel='rbf', probability=True, random_state=random_state, cache_size=500),
            'KNN': KNeighborsClassifier(n_neighbors=5, n_jobs=2),
            'DecisionTree': DecisionTreeClassifier(random_state=random_state, max_depth=10),
            'GradientBoosting': GradientBoostingClassifier(n_estimators=50, random_state=random_state),
            'NaiveBayes': GaussianNB(),
            'MLP': MLPClassifier(hidden_layer_sizes=(50,), max_iter=200, random_state=random_state),
            'ExtraTrees': ExtraTreesClassifier(n_estimators=50, random_state=random_state, n_jobs=2),
            'AdaBoost': AdaBoostClassifier(n_estimators=50, random_state=random_state),
        }
        
        if name in models_dict:
            return models_dict[name]
        elif name == 'XGBoost':
            from xgboost import XGBClassifier
            return XGBClassifier(n_estimators=50, random_state=random_state, n_jobs=2, verbosity=0)
        elif name == 'LightGBM':
            from lightgbm import LGBMClassifier
            return LGBMClassifier(n_estimators=50, random_state=random_state, n_jobs=2, verbose=-1)
        elif name == 'CatBoost':
            from catboost import CatBoostClassifier
            return CatBoostClassifier(n_estimators=50, random_state=random_state, verbose=0)
        elif name == 'VotingEnsemble':
            return VotingClassifier(
                estimators=[('lr', LogisticRegression(max_iter=300, random_state=random_state)),
                           ('rf', RandomForestClassifier(n_estimators=30, random_state=random_state))],
                voting='soft', n_jobs=2)
        elif name == 'StackingEnsemble':
            return StackingClassifier(
                estimators=[('lr', LogisticRegression(max_iter=300, random_state=random_state)),
                           ('rf', RandomForestClassifier(n_estimators=30, random_state=random_state))],
                final_estimator=LogisticRegression(random_state=random_state), n_jobs=2)
        elif name == 'TabNet':
            return MLPClassifier(hidden_layer_sizes=(50,), max_iter=200, random_state=random_state)
    except ImportError:
        return None
    return None

print("=" * 80)
print("PHASE 4 - TASKS 9-10: STABILITY & ROBUSTNESS ANALYSIS")
print(f"Timestamp: {datetime.now()}")
print("=" * 80)

df = pd.read_csv(DATA_PATH)
X = df.drop(columns=['TARGET'])
y = df['TARGET']
print(f"Data: {len(df)} samples, {X.shape[1]} features")

MODEL_NAMES = ['LogisticRegression', 'RandomForest', 'SVM', 'KNN', 'DecisionTree',
               'GradientBoosting', 'NaiveBayes', 'MLP', 'ExtraTrees', 'AdaBoost',
               'XGBoost', 'LightGBM', 'CatBoost', 'VotingEnsemble', 'StackingEnsemble']

# ============================================================================
# TASK 9: STABILITY ANALYSIS
# ============================================================================
print("\n" + "=" * 60)
print("TASK 9: STABILITY ANALYSIS (10 RANDOM SEEDS)")
print("=" * 60)

stability_results = []
auc_by_seed = {m: [] for m in MODEL_NAMES}

for model_name in MODEL_NAMES:
    print(f"  {model_name}...", end=" ", flush=True)
    seed_aucs = []
    
    for seed in RANDOM_SEEDS:
        try:
            model = get_model(model_name, random_state=seed)
            if model is None:
                continue
            cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=seed)
            scores = cross_val_score(model, X, y, cv=cv, scoring='roc_auc', n_jobs=2)
            seed_aucs.append(np.mean(scores))
        except Exception as e:
            continue
    
    if len(seed_aucs) >= 5:
        auc_by_seed[model_name] = seed_aucs
        cv_pct = np.std(seed_aucs) / np.mean(seed_aucs) * 100 if np.mean(seed_aucs) > 0 else 0
        auc_range = np.max(seed_aucs) - np.min(seed_aucs)
        
        result = {
            'Model': model_name,
            'AUC_Mean': np.mean(seed_aucs),
            'AUC_Std': np.std(seed_aucs),
            'AUC_Min': np.min(seed_aucs),
            'AUC_Max': np.max(seed_aucs),
            'AUC_Range': auc_range,
            'AUC_CV': cv_pct,
            'Num_Seeds': len(seed_aucs),
            'Stability': 'High' if cv_pct < 2 else ('Moderate' if cv_pct < 5 else 'Low'),
            'Seed_Sensitivity': 'Low' if auc_range < 0.02 else ('Moderate' if auc_range < 0.05 else 'High')
        }
        stability_results.append(result)
        print(f"AUC={result['AUC_Mean']:.4f}±{result['AUC_Std']:.4f} CV={cv_pct:.2f}%")
    else:
        print("SKIPPED")

stability_df = pd.DataFrame(stability_results)
stability_df.to_csv(f"{RESULTS_PATH}/stability_seeds_analysis.csv", index=False)
print(f"\nSaved: stability_seeds_analysis.csv")

# Plot stability
fig, axes = plt.subplots(1, 2, figsize=(16, 8))

# Box plot
ax1 = axes[0]
box_data = []
for m in MODEL_NAMES:
    for v in auc_by_seed.get(m, []):
        box_data.append({'Model': m, 'AUC': v})
if box_data:
    box_df = pd.DataFrame(box_data)
    order = stability_df.sort_values('AUC_Mean', ascending=False)['Model'].tolist()
    sns.boxplot(data=box_df, x='AUC', y='Model', order=order, ax=ax1, palette='RdYlGn')
    ax1.set_title('AUC Distribution Across 10 Random Seeds', fontsize=12, fontweight='bold')
    ax1.axvline(x=0.9, color='green', linestyle='--', alpha=0.5)

# CV bar plot
ax2 = axes[1]
sorted_s = stability_df.sort_values('AUC_CV')
colors = ['green' if x < 2 else 'orange' if x < 5 else 'red' for x in sorted_s['AUC_CV']]
ax2.barh(sorted_s['Model'], sorted_s['AUC_CV'], color=colors, edgecolor='black')
ax2.axvline(x=2, color='green', linestyle='--', label='High (<2%)')
ax2.axvline(x=5, color='orange', linestyle='--', label='Moderate (<5%)')
ax2.set_xlabel('Coefficient of Variation (%)')
ax2.set_title('Model Stability Across Seeds', fontsize=12, fontweight='bold')
ax2.legend()

plt.tight_layout()
save_figure(fig, 'stability_seeds_boxplot')
plt.close()

# ============================================================================
# TASK 10: ROBUSTNESS TESTING
# ============================================================================
print("\n" + "=" * 60)
print("TASK 10: ROBUSTNESS TESTING (NOISE INJECTION)")
print("=" * 60)

scaler = StandardScaler()
X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=X.columns)

# Baseline
print("Computing baseline...")
baseline_scores = {}
for model_name in MODEL_NAMES:
    try:
        model = get_model(model_name, random_state=42)
        if model is None:
            continue
        cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
        scores = cross_val_score(model, X_scaled, y, cv=cv, scoring='roc_auc', n_jobs=2)
        baseline_scores[model_name] = np.mean(scores)
    except:
        pass

robustness_results = []
for noise_level in NOISE_LEVELS:
    print(f"\nNoise level {noise_level*100:.0f}%:")
    np.random.seed(42)
    noise = np.random.normal(0, noise_level, X_scaled.shape)
    X_noisy = X_scaled + noise
    
    for model_name in MODEL_NAMES:
        if model_name not in baseline_scores:
            continue
        print(f"  {model_name}...", end=" ", flush=True)
        try:
            model = get_model(model_name, random_state=42)
            if model is None:
                continue
            cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
            scores = cross_val_score(model, X_noisy, y, cv=cv, scoring='roc_auc', n_jobs=2)
            noisy_auc = np.mean(scores)
            baseline = baseline_scores[model_name]
            degradation = (baseline - noisy_auc) / baseline * 100 if baseline > 0 else 0
            
            result = {
                'Model': model_name,
                'Noise_Level': noise_level,
                'Noise_Percent': f'{noise_level*100:.0f}%',
                'Baseline_AUC': baseline,
                'Noisy_AUC': noisy_auc,
                'AUC_Degradation': degradation,
                'Robustness': 'High' if degradation < 2 else ('Moderate' if degradation < 5 else 'Low')
            }
            robustness_results.append(result)
            print(f"AUC={noisy_auc:.4f} Deg={degradation:.2f}%")
        except Exception as e:
            print(f"Error: {e}")

robustness_df = pd.DataFrame(robustness_results)
robustness_df.to_csv(f"{RESULTS_PATH}/robustness_noise_results.csv", index=False)
print(f"\nSaved: robustness_noise_results.csv")

# Plot robustness
fig, axes = plt.subplots(1, 2, figsize=(16, 8))

# Degradation curves
ax1 = axes[0]
colors = plt.cm.tab20(np.linspace(0, 1, len(MODEL_NAMES)))
for idx, model_name in enumerate(MODEL_NAMES):
    if model_name not in baseline_scores:
        continue
    auc_vals = [baseline_scores[model_name]]
    for nl in NOISE_LEVELS:
        subset = robustness_df[(robustness_df['Model'] == model_name) & (robustness_df['Noise_Level'] == nl)]
        if len(subset) > 0:
            auc_vals.append(subset['Noisy_AUC'].values[0])
    if len(auc_vals) == 4:
        ax1.plot([0, 1, 5, 10], auc_vals, 'o-', label=model_name, color=colors[idx], linewidth=2)

ax1.set_xlabel('Noise Level (%)')
ax1.set_ylabel('AUC-ROC')
ax1.set_title('Performance Degradation with Noise', fontsize=12, fontweight='bold')
ax1.legend(bbox_to_anchor=(1.02, 1), loc='upper left', fontsize=8)
ax1.grid(True, alpha=0.3)

# 10% noise degradation
ax2 = axes[1]
n10 = robustness_df[robustness_df['Noise_Level'] == 0.10].sort_values('AUC_Degradation')
colors = ['green' if x < 2 else 'orange' if x < 5 else 'red' for x in n10['AUC_Degradation']]
ax2.barh(n10['Model'], n10['AUC_Degradation'], color=colors, edgecolor='black')
ax2.axvline(x=2, color='green', linestyle='--', label='High (<2%)')
ax2.axvline(x=5, color='orange', linestyle='--', label='Moderate (<5%)')
ax2.set_xlabel('AUC Degradation at 10% Noise (%)')
ax2.set_title('Model Robustness to 10% Noise', fontsize=12, fontweight='bold')
ax2.legend()

plt.tight_layout()
save_figure(fig, 'robustness_noise_degradation')
plt.close()

# Heatmap
fig, ax = plt.subplots(figsize=(10, 12))
pivot = robustness_df.pivot(index='Model', columns='Noise_Percent', values='AUC_Degradation')
pivot['Mean'] = pivot.mean(axis=1)
pivot = pivot.sort_values('Mean').drop(columns='Mean')
sns.heatmap(pivot, annot=True, fmt='.2f', cmap='RdYlGn_r', ax=ax, cbar_kws={'label': 'AUC Degradation (%)'})
ax.set_title('AUC Degradation by Noise Level', fontsize=12, fontweight='bold')
plt.tight_layout()
save_figure(fig, 'robustness_heatmap')
plt.close()

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print(f"\nTask 9 - Stability:")
print(f"  High stability models: {len(stability_df[stability_df['Stability'] == 'High'])}/{len(stability_df)}")
if len(stability_df) > 0:
    best_stable = stability_df.loc[stability_df['AUC_CV'].idxmin()]
    print(f"  Most stable: {best_stable['Model']} (CV: {best_stable['AUC_CV']:.2f}%)")

print(f"\nTask 10 - Robustness:")
n10_sub = robustness_df[robustness_df['Noise_Level'] == 0.10]
print(f"  High robustness (10% noise): {len(n10_sub[n10_sub['Robustness'] == 'High'])}/{len(n10_sub)}")
if len(n10_sub) > 0:
    best_robust = n10_sub.loc[n10_sub['AUC_Degradation'].idxmin()]
    print(f"  Most robust: {best_robust['Model']} (degradation: {best_robust['AUC_Degradation']:.2f}%)")

print("\n✓ Tasks 9-10 completed successfully!")
