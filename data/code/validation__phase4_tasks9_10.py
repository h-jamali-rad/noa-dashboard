#!/usr/bin/env python3
"""
Phase 4 Tasks 9-10: Stability Analysis and Robustness Testing
- Task 9: Multiple Random Seeds Analysis
- Task 10: Noise Injection Robustness Testing
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
from sklearn.metrics import roc_auc_score, accuracy_score, f1_score, precision_score, recall_score
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

# Set environment
os.environ['OMP_NUM_THREADS'] = '4'

# Paths
PROJECT_PATH = "[path]"
DATA_PATH = f"{PROJECT_PATH}/1_Data/Processed/encoded_dataset.csv"
RESULTS_PATH = f"{PROJECT_PATH}/3_Results/Phase4_Validation"
FIGURES_PATH = f"{PROJECT_PATH}/4_Figures/Phase4"

# Ensure directories exist
os.makedirs(RESULTS_PATH, exist_ok=True)
os.makedirs(FIGURES_PATH, exist_ok=True)

# Random seeds for Task 9
RANDOM_SEEDS = [0, 42, 123, 456, 789, 1000, 2000, 3000, 4000, 5000]

# Noise levels for Task 10
NOISE_LEVELS = [0.01, 0.05, 0.10]  # 1%, 5%, 10%

def save_figure(fig, name):
    """Save figure in PNG and TIFF format at 300 DPI"""
    png_path = f"{FIGURES_PATH}/{name}.png"
    tiff_path = f"{FIGURES_PATH}/{name}.tiff"
    fig.savefig(png_path, dpi=300, bbox_inches='tight')
    fig.savefig(tiff_path, dpi=300, bbox_inches='tight')
    print(f"  Saved: {name}.png and {name}.tiff")

def get_model_definitions():
    """Get model definitions without random_state (will be set per seed)"""
    return {
        'LogisticRegression': lambda rs: LogisticRegression(max_iter=1000, random_state=rs, n_jobs=-1),
        'RandomForest': lambda rs: RandomForestClassifier(n_estimators=100, random_state=rs, n_jobs=-1),
        'SVM': lambda rs: SVC(kernel='rbf', probability=True, random_state=rs),
        'KNN': lambda rs: KNeighborsClassifier(n_neighbors=5, n_jobs=-1),
        'DecisionTree': lambda rs: DecisionTreeClassifier(random_state=rs),
        'GradientBoosting': lambda rs: GradientBoostingClassifier(n_estimators=100, random_state=rs),
        'NaiveBayes': lambda rs: GaussianNB(),
        'MLP': lambda rs: MLPClassifier(hidden_layer_sizes=(100, 50), max_iter=500, random_state=rs),
        'ExtraTrees': lambda rs: ExtraTreesClassifier(n_estimators=100, random_state=rs, n_jobs=-1),
        'AdaBoost': lambda rs: AdaBoostClassifier(n_estimators=100, random_state=rs),
        'XGBoost': lambda rs: None,  # Will handle specially
        'LightGBM': lambda rs: None,  # Will handle specially
        'CatBoost': lambda rs: None,  # Will handle specially
        'VotingEnsemble': lambda rs: None,  # Will handle specially
        'StackingEnsemble': lambda rs: None  # Will handle specially
    }

def get_full_model(name, random_state=42):
    """Get full model instance with random state"""
    try:
        if name == 'LogisticRegression':
            return LogisticRegression(max_iter=1000, random_state=random_state, n_jobs=-1)
        elif name == 'RandomForest':
            return RandomForestClassifier(n_estimators=100, random_state=random_state, n_jobs=-1)
        elif name == 'SVM':
            return SVC(kernel='rbf', probability=True, random_state=random_state)
        elif name == 'KNN':
            return KNeighborsClassifier(n_neighbors=5, n_jobs=-1)
        elif name == 'DecisionTree':
            return DecisionTreeClassifier(random_state=random_state)
        elif name == 'GradientBoosting':
            return GradientBoostingClassifier(n_estimators=100, random_state=random_state)
        elif name == 'NaiveBayes':
            return GaussianNB()
        elif name == 'MLP':
            return MLPClassifier(hidden_layer_sizes=(100, 50), max_iter=500, random_state=random_state)
        elif name == 'ExtraTrees':
            return ExtraTreesClassifier(n_estimators=100, random_state=random_state, n_jobs=-1)
        elif name == 'AdaBoost':
            return AdaBoostClassifier(n_estimators=100, random_state=random_state)
        elif name == 'XGBoost':
            from xgboost import XGBClassifier
            return XGBClassifier(n_estimators=100, random_state=random_state, n_jobs=-1, 
                                 use_label_encoder=False, eval_metric='logloss', verbosity=0)
        elif name == 'LightGBM':
            from lightgbm import LGBMClassifier
            return LGBMClassifier(n_estimators=100, random_state=random_state, n_jobs=-1, verbose=-1)
        elif name == 'CatBoost':
            from catboost import CatBoostClassifier
            return CatBoostClassifier(n_estimators=100, random_state=random_state, verbose=0)
        elif name == 'VotingEnsemble':
            return VotingClassifier(
                estimators=[
                    ('lr', LogisticRegression(max_iter=1000, random_state=random_state)),
                    ('rf', RandomForestClassifier(n_estimators=50, random_state=random_state)),
                    ('gb', GradientBoostingClassifier(n_estimators=50, random_state=random_state))
                ],
                voting='soft', n_jobs=-1
            )
        elif name == 'StackingEnsemble':
            return StackingClassifier(
                estimators=[
                    ('lr', LogisticRegression(max_iter=1000, random_state=random_state)),
                    ('rf', RandomForestClassifier(n_estimators=50, random_state=random_state)),
                ],
                final_estimator=LogisticRegression(random_state=random_state),
                n_jobs=-1
            )
        elif name == 'TabNet':
            # Use MLP as placeholder
            return MLPClassifier(hidden_layer_sizes=(100, 50), max_iter=500, random_state=random_state)
    except ImportError as e:
        print(f"  Warning: {name} not available: {e}")
        return None
    return None

print("=" * 80)
print("PHASE 4 - TASKS 9-10: STABILITY & ROBUSTNESS ANALYSIS")
print("=" * 80)
print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

# Load data
print("\n📊 Loading data...")
df = pd.read_csv(DATA_PATH)
X = df.drop(columns=['TARGET'])
y = df['TARGET']
print(f"  Samples: {len(df)}, Features: {X.shape[1]}")

MODEL_NAMES = ['LogisticRegression', 'RandomForest', 'SVM', 'KNN', 'DecisionTree',
               'GradientBoosting', 'NaiveBayes', 'MLP', 'ExtraTrees', 'AdaBoost',
               'XGBoost', 'LightGBM', 'CatBoost', 'VotingEnsemble', 'StackingEnsemble']

# ============================================================================
# TASK 9: STABILITY ANALYSIS (MULTIPLE RANDOM SEEDS)
# ============================================================================
print("\n" + "=" * 80)
print("📋 TASK 9: STABILITY ANALYSIS - MULTIPLE RANDOM SEEDS")
print("=" * 80)
print(f"  Seeds: {RANDOM_SEEDS}")
print("  Scientific Justification: Stability analysis ensures model predictions")
print("  are reproducible and not dependent on random initialization.")
print("  In clinical settings, reproducibility is essential for regulatory")
print("  approval and clinical trust.")

stability_results = []

for model_name in MODEL_NAMES:
    print(f"\n  Processing: {model_name}")
    seed_scores = {metric: [] for metric in ['AUC', 'Accuracy', 'F1', 'Precision', 'Recall']}
    
    for seed in RANDOM_SEEDS:
        try:
            model = get_full_model(model_name, random_state=seed)
            if model is None:
                continue
            
            # Use 5-fold CV for each seed
            cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
            
            # Get AUC scores
            auc_scores = cross_val_score(model, X, y, cv=cv, scoring='roc_auc', n_jobs=-1)
            acc_scores = cross_val_score(model, X, y, cv=cv, scoring='accuracy', n_jobs=-1)
            f1_scores = cross_val_score(model, X, y, cv=cv, scoring='f1', n_jobs=-1)
            prec_scores = cross_val_score(model, X, y, cv=cv, scoring='precision', n_jobs=-1)
            rec_scores = cross_val_score(model, X, y, cv=cv, scoring='recall', n_jobs=-1)
            
            seed_scores['AUC'].append(np.mean(auc_scores))
            seed_scores['Accuracy'].append(np.mean(acc_scores))
            seed_scores['F1'].append(np.mean(f1_scores))
            seed_scores['Precision'].append(np.mean(prec_scores))
            seed_scores['Recall'].append(np.mean(rec_scores))
            
        except Exception as e:
            print(f"    Warning at seed {seed}: {e}")
            continue
    
    if len(seed_scores['AUC']) > 0:
        # Calculate statistics
        result = {
            'Model': model_name,
            'AUC_Mean': np.mean(seed_scores['AUC']),
            'AUC_Std': np.std(seed_scores['AUC']),
            'AUC_Min': np.min(seed_scores['AUC']),
            'AUC_Max': np.max(seed_scores['AUC']),
            'AUC_Range': np.max(seed_scores['AUC']) - np.min(seed_scores['AUC']),
            'AUC_CV': np.std(seed_scores['AUC']) / np.mean(seed_scores['AUC']) * 100 if np.mean(seed_scores['AUC']) > 0 else 0,
            'Accuracy_Mean': np.mean(seed_scores['Accuracy']),
            'Accuracy_Std': np.std(seed_scores['Accuracy']),
            'F1_Mean': np.mean(seed_scores['F1']),
            'F1_Std': np.std(seed_scores['F1']),
            'Precision_Mean': np.mean(seed_scores['Precision']),
            'Precision_Std': np.std(seed_scores['Precision']),
            'Recall_Mean': np.mean(seed_scores['Recall']),
            'Recall_Std': np.std(seed_scores['Recall']),
            'Num_Seeds': len(seed_scores['AUC'])
        }
        
        # Store all seed values for plotting
        result['AUC_Seeds'] = seed_scores['AUC']
        
        # Stability classification
        if result['AUC_CV'] < 2:
            result['Stability'] = 'High'
        elif result['AUC_CV'] < 5:
            result['Stability'] = 'Moderate'
        else:
            result['Stability'] = 'Low'
        
        # Sensitivity to initialization
        if result['AUC_Range'] < 0.02:
            result['Seed_Sensitivity'] = 'Low'
        elif result['AUC_Range'] < 0.05:
            result['Seed_Sensitivity'] = 'Moderate'
        else:
            result['Seed_Sensitivity'] = 'High'
        
        stability_results.append(result)
        print(f"    AUC: {result['AUC_Mean']:.4f} ± {result['AUC_Std']:.4f} (CV: {result['AUC_CV']:.2f}%)")
        print(f"    Stability: {result['Stability']}, Seed Sensitivity: {result['Seed_Sensitivity']}")

# Create DataFrame and save
stability_df = pd.DataFrame([{k: v for k, v in r.items() if k != 'AUC_Seeds'} for r in stability_results])
stability_df.to_csv(f"{RESULTS_PATH}/stability_seeds_analysis.csv", index=False)
print(f"\n  ✓ Saved: stability_seeds_analysis.csv")

# Create box plot for stability
print("\n  Generating stability box plots...")
fig, axes = plt.subplots(1, 2, figsize=(16, 8))

# Box plot of AUC across seeds
ax1 = axes[0]
auc_data = []
for r in stability_results:
    for val in r['AUC_Seeds']:
        auc_data.append({'Model': r['Model'], 'AUC': val})
auc_df = pd.DataFrame(auc_data)

# Sort by mean AUC
model_order = stability_df.sort_values('AUC_Mean', ascending=False)['Model'].tolist()
sns.boxplot(data=auc_df, x='AUC', y='Model', order=model_order, ax=ax1, palette='RdYlGn')
ax1.set_title('AUC Distribution Across 10 Random Seeds', fontsize=12, fontweight='bold')
ax1.set_xlabel('AUC-ROC')
ax1.axvline(x=0.9, color='green', linestyle='--', alpha=0.5, label='AUC=0.9')
ax1.legend()

# CV comparison bar plot
ax2 = axes[1]
sorted_stability = stability_df.sort_values('AUC_CV')
colors = ['green' if x < 2 else 'orange' if x < 5 else 'red' for x in sorted_stability['AUC_CV']]
bars = ax2.barh(sorted_stability['Model'], sorted_stability['AUC_CV'], color=colors, edgecolor='black')
ax2.axvline(x=2, color='green', linestyle='--', label='High Stability (<2%)')
ax2.axvline(x=5, color='orange', linestyle='--', label='Moderate Stability (<5%)')
ax2.set_xlabel('Coefficient of Variation (%)')
ax2.set_title('Model Stability Across Random Seeds', fontsize=12, fontweight='bold')
ax2.legend()

plt.tight_layout()
save_figure(fig, 'stability_seeds_boxplot')
plt.close()

# ============================================================================
# TASK 10: ROBUSTNESS TESTING (NOISE INJECTION)
# ============================================================================
print("\n" + "=" * 80)
print("📋 TASK 10: ROBUSTNESS TESTING - NOISE INJECTION")
print("=" * 80)
print(f"  Noise Levels: {[f'{n*100:.0f}%' for n in NOISE_LEVELS]}")
print("  Scientific Justification: Robustness testing simulates real-world data")
print("  quality issues (measurement errors, equipment variations). Models that")
print("  maintain performance under noise are more reliable for clinical deployment.")

robustness_results = []

# Scale data first for proper noise injection
scaler = StandardScaler()
X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=X.columns)

# Get baseline performance (no noise)
print("\n  Computing baseline performance (no noise)...")
baseline_scores = {}
for model_name in MODEL_NAMES:
    try:
        model = get_full_model(model_name, random_state=42)
        if model is None:
            continue
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        auc_scores = cross_val_score(model, X_scaled, y, cv=cv, scoring='roc_auc', n_jobs=-1)
        baseline_scores[model_name] = np.mean(auc_scores)
        print(f"    {model_name}: {baseline_scores[model_name]:.4f}")
    except Exception as e:
        print(f"    {model_name}: Error - {e}")

# Test each noise level
for noise_level in NOISE_LEVELS:
    print(f"\n  Testing with {noise_level*100:.0f}% Gaussian noise...")
    
    for model_name in MODEL_NAMES:
        if model_name not in baseline_scores:
            continue
        
        try:
            # Add Gaussian noise
            np.random.seed(42)
            noise = np.random.normal(0, noise_level, X_scaled.shape)
            X_noisy = X_scaled + noise
            
            model = get_full_model(model_name, random_state=42)
            if model is None:
                continue
            
            cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
            auc_scores = cross_val_score(model, X_noisy, y, cv=cv, scoring='roc_auc', n_jobs=-1)
            acc_scores = cross_val_score(model, X_noisy, y, cv=cv, scoring='accuracy', n_jobs=-1)
            f1_scores = cross_val_score(model, X_noisy, y, cv=cv, scoring='f1', n_jobs=-1)
            
            noisy_auc = np.mean(auc_scores)
            baseline = baseline_scores[model_name]
            degradation = (baseline - noisy_auc) / baseline * 100 if baseline > 0 else 0
            
            result = {
                'Model': model_name,
                'Noise_Level': noise_level,
                'Noise_Percent': f'{noise_level*100:.0f}%',
                'Baseline_AUC': baseline,
                'Noisy_AUC': noisy_auc,
                'AUC_Degradation': degradation,
                'Noisy_Accuracy': np.mean(acc_scores),
                'Noisy_F1': np.mean(f1_scores)
            }
            
            # Robustness classification
            if degradation < 2:
                result['Robustness'] = 'High'
            elif degradation < 5:
                result['Robustness'] = 'Moderate'
            else:
                result['Robustness'] = 'Low'
            
            robustness_results.append(result)
            
        except Exception as e:
            print(f"    {model_name}: Error - {e}")

# Create DataFrame and save
robustness_df = pd.DataFrame(robustness_results)
robustness_df.to_csv(f"{RESULTS_PATH}/robustness_noise_results.csv", index=False)
print(f"\n  ✓ Saved: robustness_noise_results.csv")

# Print summary
print("\n  Robustness Summary by Noise Level:")
for noise in NOISE_LEVELS:
    subset = robustness_df[robustness_df['Noise_Level'] == noise]
    high_robust = len(subset[subset['Robustness'] == 'High'])
    print(f"    {noise*100:.0f}% noise: {high_robust}/{len(subset)} models with high robustness")

# Create performance degradation curves
print("\n  Generating performance degradation curves...")
fig, axes = plt.subplots(1, 2, figsize=(16, 8))

# Plot 1: Degradation curves per model
ax1 = axes[0]
noise_levels_plot = [0] + NOISE_LEVELS
colors = plt.cm.tab20(np.linspace(0, 1, len(MODEL_NAMES)))

for idx, model_name in enumerate(MODEL_NAMES):
    if model_name not in baseline_scores:
        continue
    
    auc_values = [baseline_scores[model_name]]
    for noise in NOISE_LEVELS:
        subset = robustness_df[(robustness_df['Model'] == model_name) & (robustness_df['Noise_Level'] == noise)]
        if len(subset) > 0:
            auc_values.append(subset['Noisy_AUC'].values[0])
    
    if len(auc_values) == len(noise_levels_plot):
        ax1.plot([n*100 for n in noise_levels_plot], auc_values, 'o-', 
                 label=model_name, color=colors[idx], linewidth=2, markersize=6)

ax1.set_xlabel('Noise Level (%)', fontsize=12)
ax1.set_ylabel('AUC-ROC', fontsize=12)
ax1.set_title('Performance Degradation with Increasing Noise', fontsize=12, fontweight='bold')
ax1.legend(bbox_to_anchor=(1.02, 1), loc='upper left', fontsize=8)
ax1.grid(True, alpha=0.3)
ax1.set_xticks([0, 1, 5, 10])

# Plot 2: Degradation percentage at 10% noise
ax2 = axes[1]
noise_10 = robustness_df[robustness_df['Noise_Level'] == 0.10].copy()
noise_10 = noise_10.sort_values('AUC_Degradation')
colors = ['green' if x < 2 else 'orange' if x < 5 else 'red' for x in noise_10['AUC_Degradation']]
bars = ax2.barh(noise_10['Model'], noise_10['AUC_Degradation'], color=colors, edgecolor='black')
ax2.axvline(x=2, color='green', linestyle='--', label='High Robustness (<2%)')
ax2.axvline(x=5, color='orange', linestyle='--', label='Moderate Robustness (<5%)')
ax2.set_xlabel('AUC Degradation at 10% Noise (%)', fontsize=12)
ax2.set_title('Model Robustness to 10% Gaussian Noise', fontsize=12, fontweight='bold')
ax2.legend()

plt.tight_layout()
save_figure(fig, 'robustness_noise_degradation')
plt.close()

# Heatmap of degradation
print("  Generating degradation heatmap...")
fig, ax = plt.subplots(figsize=(10, 12))
pivot_df = robustness_df.pivot(index='Model', columns='Noise_Percent', values='AUC_Degradation')
# Sort by average degradation
pivot_df['Mean_Degradation'] = pivot_df.mean(axis=1)
pivot_df = pivot_df.sort_values('Mean_Degradation')
pivot_df = pivot_df.drop(columns='Mean_Degradation')

sns.heatmap(pivot_df, annot=True, fmt='.2f', cmap='RdYlGn_r', ax=ax,
            cbar_kws={'label': 'AUC Degradation (%)'})
ax.set_title('AUC Degradation (%) by Noise Level', fontsize=12, fontweight='bold')
ax.set_xlabel('Noise Level')
ax.set_ylabel('Model')

plt.tight_layout()
save_figure(fig, 'robustness_heatmap')
plt.close()

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("📊 TASKS 9-10 SUMMARY")
print("=" * 80)

# Task 9 Summary
high_stability = len(stability_df[stability_df['Stability'] == 'High'])
low_sensitivity = len(stability_df[stability_df['Seed_Sensitivity'] == 'Low'])
print(f"\n  Task 9 - Stability Analysis:")
print(f"    Models with high stability: {high_stability}/{len(stability_df)}")
print(f"    Models with low seed sensitivity: {low_sensitivity}/{len(stability_df)}")
print(f"    Most stable model: {stability_df.loc[stability_df['AUC_CV'].idxmin(), 'Model']}")

# Task 10 Summary
high_robust_10 = len(robustness_df[(robustness_df['Noise_Level'] == 0.10) & (robustness_df['Robustness'] == 'High')])
total_10 = len(robustness_df[robustness_df['Noise_Level'] == 0.10])
print(f"\n  Task 10 - Robustness Testing:")
print(f"    Models robust to 10% noise: {high_robust_10}/{total_10}")
most_robust = robustness_df[robustness_df['Noise_Level'] == 0.10].sort_values('AUC_Degradation').iloc[0]
print(f"    Most robust model: {most_robust['Model']} (degradation: {most_robust['AUC_Degradation']:.2f}%)")

print("\n✓ Tasks 9-10 completed successfully!")
print(f"  Results saved to: {RESULTS_PATH}")
print(f"  Figures saved to: {FIGURES_PATH}")
