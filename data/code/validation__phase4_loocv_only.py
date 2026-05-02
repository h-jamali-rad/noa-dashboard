#!/usr/bin/env python3
"""Phase 4: LOOCV and final summary generation"""

import os, json, warnings, logging
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import joblib

warnings.filterwarnings('ignore')

BASE_DIR = "[path]"
RESULTS_DIR = f"{BASE_DIR}/3_Results/Phase4_Validation"
FIGURES_DIR = f"{BASE_DIR}/4_Figures/Phase4"
LOGS_DIR = f"{BASE_DIR}/5_Logs/Phase4"
MODELS_DIR = f"{BASE_DIR}/6_Models/Saved"
DATA_DIR = f"{BASE_DIR}/1_Data/Processed"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load data
df = pd.read_csv(f'{DATA_DIR}/encoded_dataset.csv')
X = df.drop(columns=['TARGET']).values
y = df['TARGET'].values

model_names = ['LogisticRegression', 'DecisionTree', 'RandomForest', 'XGBoost', 'LightGBM',
               'CatBoost', 'SVM', 'KNN', 'NaiveBayes', 'GradientBoosting', 'ExtraTrees',
               'MLP', 'VotingEnsemble', 'StackingEnsemble', 'TabNet']

logger.info("=" * 60)
logger.info("TASK 3: LOOCV (100-Fold Approximation)")
logger.info("=" * 60)

n_folds = 100
skf = StratifiedKFold(n_splits=n_folds, shuffle=True, random_state=42)

loocv_results = []
for name in model_names:
    logger.info(f"Processing {name}...")
    model = joblib.load(f'{MODELS_DIR}/{name}.joblib')
    
    try:
        y_prob = cross_val_predict(model, X, y, cv=skf, method='predict_proba', n_jobs=-1)[:, 1]
        y_pred = (y_prob > 0.5).astype(int)
        
        auc = roc_auc_score(y, y_prob)
        acc = accuracy_score(y, y_pred)
        prec = precision_score(y, y_pred, zero_division=0)
        rec = recall_score(y, y_pred, zero_division=0)
        f1s = f1_score(y, y_pred, zero_division=0)
        cm = confusion_matrix(y, y_pred)
        tn, fp, fn, tp = cm.ravel()
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0
        npv = tn / (tn + fn) if (tn + fn) > 0 else 0
        
        loocv_results.append({
            'Model': name, 'LOOCV_AUC': auc, 'LOOCV_Accuracy': acc, 
            'LOOCV_Precision': prec, 'LOOCV_Recall': rec, 'LOOCV_F1': f1s, 
            'LOOCV_Specificity': spec, 'LOOCV_NPV': npv, 'LOOCV_PPV': prec,
            'LOOCV_Sensitivity': rec, 'Approximation_Method': f'{n_folds}-Fold CV'
        })
        logger.info(f"  {name}: AUC = {auc:.4f}")
    except Exception as e:
        logger.error(f"  Error with {name}: {e}")

loocv_df = pd.DataFrame(loocv_results)
loocv_df.to_csv(f'{RESULTS_DIR}/loocv_results.csv', index=False)
logger.info("LOOCV results saved!")

# Load K-Fold results
kfold_df = pd.read_csv(f'{RESULTS_DIR}/kfold_cv_results.csv')
stability_df = pd.read_csv(f'{RESULTS_DIR}/stability_analysis.csv')

# Comparison
logger.info("=" * 60)
logger.info("K-Fold vs LOOCV Comparison")
logger.info("=" * 60)

kf10 = kfold_df[kfold_df['K'] == 10][['Model', 'AUC_Mean']].rename(columns={'AUC_Mean': 'KFold_10_AUC'})
comp = kf10.merge(loocv_df[['Model', 'LOOCV_AUC']], on='Model')
comp['Difference'] = comp['KFold_10_AUC'] - comp['LOOCV_AUC']
comp['Absolute_Diff'] = comp['Difference'].abs()
comp['Agreement'] = comp['Absolute_Diff'] < 0.02
comp.to_csv(f'{RESULTS_DIR}/kfold_loocv_comparison.csv', index=False)

for _, r in comp.iterrows():
    status = 'OK' if r['Agreement'] else 'WARN'
    logger.info(f"  {r['Model']:22} 10-Fold: {r['KFold_10_AUC']:.4f}, LOOCV: {r['LOOCV_AUC']:.4f}, Diff: {r['Difference']:+.4f} [{status}]")

# Generate figures
logger.info("Generating figures...")

# Model Performance Comparison
fig, axes = plt.subplots(1, 2, figsize=(16, 8))
kf10_sorted = kfold_df[kfold_df['K'] == 10].sort_values('AUC_Mean', ascending=True)
colors = plt.cm.RdYlGn(np.linspace(0.2, 0.8, len(kf10_sorted)))

ax = axes[0]
ax.barh(kf10_sorted['Model'], kf10_sorted['AUC_Mean'], xerr=kf10_sorted['AUC_Std'], 
        color=colors, capsize=3, edgecolor='black', linewidth=0.5)
ax.set_xlabel('AUC-ROC', fontsize=12)
ax.set_title('10-Fold Cross-Validation Results', fontsize=14, fontweight='bold')
ax.set_xlim(0.7, 1.0)
ax.axvline(0.8, color='gray', linestyle='--', alpha=0.5)

loocv_sorted = loocv_df.sort_values('LOOCV_AUC', ascending=True)
ax = axes[1]
ax.barh(loocv_sorted['Model'], loocv_sorted['LOOCV_AUC'], color=colors, edgecolor='black', linewidth=0.5)
ax.set_xlabel('AUC-ROC', fontsize=12)
ax.set_title('LOOCV (100-Fold Approximation) Results', fontsize=14, fontweight='bold')
ax.set_xlim(0.7, 1.0)
ax.axvline(0.8, color='gray', linestyle='--', alpha=0.5)

plt.tight_layout()
fig.savefig(f'{FIGURES_DIR}/model_performance_comparison.png', dpi=300, bbox_inches='tight')
fig.savefig(f'{FIGURES_DIR}/model_performance_comparison.tiff', dpi=300, format='tiff', bbox_inches='tight')
plt.close()

# Radar chart
kf10_data = kfold_df[kfold_df['K'] == 10]
top5 = kf10_data.nlargest(5, 'AUC_Mean')['Model'].values

fig, ax = plt.subplots(figsize=(10, 10), subplot_kw=dict(projection='polar'))
metrics = ['AUC_Mean', 'Accuracy_Mean', 'Precision_Mean', 'Recall_Mean', 'F1_Mean', 'Specificity_Mean']
metric_labels = ['AUC', 'Accuracy', 'Precision', 'Recall', 'F1', 'Specificity']
angles = np.linspace(0, 2*np.pi, len(metrics), endpoint=False).tolist()
angles += angles[:1]
colors_radar = plt.cm.Set2(np.linspace(0, 1, 5))

for i, model in enumerate(top5):
    model_data = kf10_data[kf10_data['Model'] == model]
    values = [model_data[m].values[0] for m in metrics]
    values += values[:1]
    ax.plot(angles, values, 'o-', linewidth=2, label=model, color=colors_radar[i])
    ax.fill(angles, values, alpha=0.1, color=colors_radar[i])

ax.set_xticks(angles[:-1])
ax.set_xticklabels(metric_labels, fontsize=11)
ax.set_ylim(0.6, 1.0)
ax.set_title('Top 5 Models: Performance Metrics Comparison', fontsize=14, fontweight='bold', y=1.08)
ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.0))
plt.tight_layout()
fig.savefig(f'{FIGURES_DIR}/top5_radar_comparison.png', dpi=300, bbox_inches='tight')
fig.savefig(f'{FIGURES_DIR}/top5_radar_comparison.tiff', dpi=300, format='tiff', bbox_inches='tight')
plt.close()

# Summary JSON
summary = {
    'execution_date': datetime.now().isoformat(),
    'n_samples': len(y),
    'n_features': X.shape[1],
    'n_models': 15,
    'validation_methods': {
        '5-Fold CV': 'Standard stratified 5-fold cross-validation',
        '10-Fold CV': 'Standard stratified 10-fold cross-validation',
        'LOOCV_Approximation': '100-fold stratified CV (near-LOOCV approximation)'
    },
    'scientific_justifications': {
        'K-Fold CV': 'Provides unbiased generalization estimates by ensuring each sample is used for validation exactly once.',
        'Stratified Analysis': 'Coefficient of Variation (CV) reveals model stability. CV<5%: High stability, 5-10%: Moderate, >10%: Low stability.',
        'LOOCV': 'High-fold (100-fold) CV approximates LOOCV with maximum training data utilization. As k approaches n, the estimate approaches true LOOCV.'
    },
    'results': {
        'best_model_10fold': kf10_data.sort_values('AUC_Mean', ascending=False).iloc[0]['Model'],
        'best_auc_10fold': float(kf10_data['AUC_Mean'].max()),
        'best_model_loocv': loocv_df.sort_values('LOOCV_AUC', ascending=False).iloc[0]['Model'],
        'best_auc_loocv': float(loocv_df['LOOCV_AUC'].max()),
        'models_high_stability': stability_df[(stability_df['Stability'] == 'High') & (stability_df['K'] == 10)]['Model'].tolist(),
        'mean_kfold_loocv_agreement': float(comp['Absolute_Diff'].mean())
    }
}

with open(f'{RESULTS_DIR}/phase4_part1_summary.json', 'w') as f:
    json.dump(summary, f, indent=2)

logger.info("=" * 60)
logger.info("PHASE 4 PART 1 COMPLETED!")
logger.info(f"Best Model (10-Fold): {summary['results']['best_model_10fold']} (AUC: {summary['results']['best_auc_10fold']:.4f})")
logger.info(f"Best Model (LOOCV): {summary['results']['best_model_loocv']} (AUC: {summary['results']['best_auc_loocv']:.4f})")
logger.info(f"High Stability Models: {len(summary['results']['models_high_stability'])}/15")
logger.info("=" * 60)
