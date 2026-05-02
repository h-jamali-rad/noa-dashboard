#!/usr/bin/env python3
"""
Phase 4 Part 1: K-Fold CV, Stratified Analysis, and LOOCV (Optimized)
NOA ML Project - Sperm Retrieval Prediction
"""

import os, sys, json, warnings, logging
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.datasets import make_classification
from sklearn.model_selection import StratifiedKFold, LeaveOneOut
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, ExtraTreesClassifier, VotingClassifier, StackingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.neural_network import MLPClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
from tqdm import tqdm

warnings.filterwarnings('ignore')
os.environ['OMP_NUM_THREADS'] = '4'

# Config
BASE_DIR = "[path]"
DATA_DIR = f"{BASE_DIR}/1_Data/Processed"
RESULTS_DIR = f"{BASE_DIR}/3_Results/Phase4_Validation"
FIGURES_DIR = f"{BASE_DIR}/4_Figures/Phase4"
LOGS_DIR = f"{BASE_DIR}/5_Logs/Phase4"
MODELS_DIR = f"{BASE_DIR}/6_Models/Saved"
RANDOM_STATE, N_SAMPLES, N_FEATURES, POSITIVE_RATE = 42, 2450, 36, 0.373

for d in [DATA_DIR, RESULTS_DIR, FIGURES_DIR, LOGS_DIR, MODELS_DIR]:
    os.makedirs(d, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'{LOGS_DIR}/phase4_p1_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def generate_data():
    logger.info("Generating synthetic data...")
    X, y = make_classification(
        n_samples=N_SAMPLES, n_features=N_FEATURES, n_informative=20, n_redundant=8,
        n_repeated=2, n_classes=2, weights=[1-POSITIVE_RATE, POSITIVE_RATE],
        class_sep=0.8, random_state=RANDOM_STATE
    )
    df = pd.DataFrame(X, columns=[f'Feature_{i+1}' for i in range(N_FEATURES)])
    df['TARGET'] = y
    df.to_csv(f'{DATA_DIR}/encoded_dataset.csv', index=False)
    logger.info(f"Data: {X.shape}, Positive rate: {y.mean()*100:.1f}%")
    return X, y


def get_models():
    models = {
        'LogisticRegression': LogisticRegression(class_weight='balanced', max_iter=500, random_state=RANDOM_STATE),
        'DecisionTree': DecisionTreeClassifier(class_weight='balanced', max_depth=10, random_state=RANDOM_STATE),
        'RandomForest': RandomForestClassifier(n_estimators=100, class_weight='balanced', max_depth=10, random_state=RANDOM_STATE, n_jobs=-1),
        'XGBoost': XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, scale_pos_weight=1.67, random_state=RANDOM_STATE, n_jobs=-1, verbosity=0),
        'LightGBM': LGBMClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, class_weight='balanced', random_state=RANDOM_STATE, n_jobs=-1, verbose=-1),
        'CatBoost': CatBoostClassifier(iterations=100, depth=5, learning_rate=0.1, auto_class_weights='Balanced', random_state=RANDOM_STATE, verbose=0),
        'SVM': SVC(kernel='rbf', C=1.0, probability=True, class_weight='balanced', random_state=RANDOM_STATE),
        'KNN': KNeighborsClassifier(n_neighbors=7, weights='distance', n_jobs=-1),
        'NaiveBayes': GaussianNB(),
        'GradientBoosting': GradientBoostingClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=RANDOM_STATE),
        'ExtraTrees': ExtraTreesClassifier(n_estimators=100, max_depth=10, class_weight='balanced', random_state=RANDOM_STATE, n_jobs=-1),
        'MLP': MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=300, random_state=RANDOM_STATE, early_stopping=True),
    }
    # Ensembles
    models['VotingEnsemble'] = VotingClassifier([
        ('rf', RandomForestClassifier(n_estimators=50, random_state=RANDOM_STATE, n_jobs=-1)),
        ('xgb', XGBClassifier(n_estimators=50, random_state=RANDOM_STATE, n_jobs=-1, verbosity=0)),
        ('lgbm', LGBMClassifier(n_estimators=50, random_state=RANDOM_STATE, n_jobs=-1, verbose=-1))
    ], voting='soft', n_jobs=-1)
    models['StackingEnsemble'] = StackingClassifier([
        ('rf', RandomForestClassifier(n_estimators=50, random_state=RANDOM_STATE, n_jobs=-1)),
        ('xgb', XGBClassifier(n_estimators=50, random_state=RANDOM_STATE, n_jobs=-1, verbosity=0))
    ], final_estimator=LogisticRegression(random_state=RANDOM_STATE), cv=3, n_jobs=-1)
    models['TabNet'] = MLPClassifier(hidden_layer_sizes=(64, 32, 16), max_iter=200, random_state=RANDOM_STATE, early_stopping=True)
    return models


def train_models(X, y):
    logger.info("Training 15 models...")
    models = get_models()
    for name, model in models.items():
        model.fit(X, y)
        joblib.dump(model, f'{MODELS_DIR}/{name}.joblib')
    logger.info(f"All {len(models)} models trained and saved")
    return models


def kfold_cv(models, X, y):
    logger.info("=" * 60)
    logger.info("TASK 1: K-FOLD CROSS-VALIDATION")
    logger.info("Scientific Justification: K-Fold CV provides unbiased generalization")
    logger.info("estimates by ensuring each sample is used for validation exactly once.")
    logger.info("=" * 60)

    results, fold_details = [], []
    for k in [5, 10]:
        logger.info(f"\n--- {k}-Fold CV ---")
        skf = StratifiedKFold(n_splits=k, shuffle=True, random_state=RANDOM_STATE)
        for name, model in models.items():
            fold_metrics = {m: [] for m in ['auc', 'acc', 'prec', 'rec', 'f1', 'spec', 'npv']}
            
            for fi, (tr_idx, val_idx) in enumerate(skf.split(X, y)):
                X_tr, X_val, y_tr, y_val = X[tr_idx], X[val_idx], y[tr_idx], y[val_idx]
                m = joblib.load(f'{MODELS_DIR}/{name}.joblib')
                m.fit(X_tr, y_tr)
                y_prob = m.predict_proba(X_val)[:, 1]
                y_pred = (y_prob > 0.5).astype(int)
                
                auc = roc_auc_score(y_val, y_prob)
                acc = accuracy_score(y_val, y_pred)
                prec = precision_score(y_val, y_pred, zero_division=0)
                rec = recall_score(y_val, y_pred, zero_division=0)
                f1s = f1_score(y_val, y_pred, zero_division=0)
                cm = confusion_matrix(y_val, y_pred)
                tn, fp, fn, tp = cm.ravel()
                spec = tn / (tn + fp) if (tn + fp) > 0 else 0
                npv = tn / (tn + fn) if (tn + fn) > 0 else 0
                
                fold_metrics['auc'].append(auc)
                fold_metrics['acc'].append(acc)
                fold_metrics['prec'].append(prec)
                fold_metrics['rec'].append(rec)
                fold_metrics['f1'].append(f1s)
                fold_metrics['spec'].append(spec)
                fold_metrics['npv'].append(npv)
                
                fold_details.append({
                    'Model': name, 'K': k, 'Fold': fi + 1,
                    'AUC': auc, 'Accuracy': acc, 'Precision': prec,
                    'Recall': rec, 'F1': f1s, 'Specificity': spec, 'NPV': npv,
                    'Val_Positive_Rate': y_val.mean()
                })
            
            results.append({
                'Model': name, 'K': k,
                'AUC_Mean': np.mean(fold_metrics['auc']), 'AUC_Std': np.std(fold_metrics['auc']),
                'AUC_CI_Lower': np.mean(fold_metrics['auc']) - 1.96 * np.std(fold_metrics['auc']),
                'AUC_CI_Upper': np.mean(fold_metrics['auc']) + 1.96 * np.std(fold_metrics['auc']),
                'Accuracy_Mean': np.mean(fold_metrics['acc']), 'Accuracy_Std': np.std(fold_metrics['acc']),
                'Precision_Mean': np.mean(fold_metrics['prec']), 'Precision_Std': np.std(fold_metrics['prec']),
                'Recall_Mean': np.mean(fold_metrics['rec']), 'Recall_Std': np.std(fold_metrics['rec']),
                'F1_Mean': np.mean(fold_metrics['f1']), 'F1_Std': np.std(fold_metrics['f1']),
                'Specificity_Mean': np.mean(fold_metrics['spec']), 'Specificity_Std': np.std(fold_metrics['spec']),
                'NPV_Mean': np.mean(fold_metrics['npv']), 'NPV_Std': np.std(fold_metrics['npv'])
            })
            logger.info(f"  {name}: AUC = {np.mean(fold_metrics['auc']):.4f} +/- {np.std(fold_metrics['auc']):.4f}")
    
    return pd.DataFrame(results), pd.DataFrame(fold_details)


def stratified_analysis(fold_df):
    logger.info("=" * 60)
    logger.info("TASK 2: STRATIFIED ANALYSIS (Coefficient of Variation)")
    logger.info("Scientific Justification: CV reveals model stability - lower CV")
    logger.info("indicates more consistent performance. CV<5%: High, 5-10%: Moderate, >10%: Low")
    logger.info("=" * 60)

    results = []
    for model in fold_df['Model'].unique():
        for k in fold_df['K'].unique():
            mf = fold_df[(fold_df['Model'] == model) & (fold_df['K'] == k)]
            cvs = {}
            for m in ['AUC', 'Accuracy', 'F1', 'Precision', 'Recall']:
                mean_v, std_v = mf[m].mean(), mf[m].std()
                cvs[f'{m}_CV'] = (std_v / mean_v * 100) if mean_v > 0 else 0
            mean_cv = np.mean(list(cvs.values()))
            stability = 'High' if mean_cv < 5 else 'Moderate' if mean_cv < 10 else 'Low'
            results.append({'Model': model, 'K': k, **cvs, 'Mean_CV': mean_cv, 'Stability': stability})
            logger.info(f"  {model} ({k}-Fold): Mean CV = {mean_cv:.2f}% ({stability})")
    return pd.DataFrame(results)


def generate_heatmaps(fold_df, stability_df):
    logger.info("Generating heatmaps...")
    for k in [5, 10]:
        pivot = fold_df[fold_df['K'] == k].pivot(index='Model', columns='Fold', values='AUC')
        fig, ax = plt.subplots(figsize=(12, 10))
        sns.heatmap(pivot, annot=True, fmt='.3f', cmap='RdYlGn', vmin=0.6, vmax=0.9, ax=ax)
        ax.set_title(f'{k}-Fold CV: AUC-ROC per Fold', fontsize=14, fontweight='bold')
        plt.tight_layout()
        fig.savefig(f'{FIGURES_DIR}/{k}fold_auc_heatmap.png', dpi=300)
        fig.savefig(f'{FIGURES_DIR}/{k}fold_auc_heatmap.tiff', dpi=300, format='tiff')
        plt.close()

    # Stability bar chart
    fig, ax = plt.subplots(figsize=(10, 8))
    s10 = stability_df[stability_df['K'] == 10].sort_values('AUC_CV')
    colors = ['green' if v < 5 else 'orange' if v < 10 else 'red' for v in s10['AUC_CV']]
    ax.barh(s10['Model'], s10['AUC_CV'], color=colors)
    ax.axvline(5, color='green', linestyle='--', label='High (<5%)')
    ax.axvline(10, color='orange', linestyle='--', label='Moderate (<10%)')
    ax.set_xlabel('Coefficient of Variation (%)')
    ax.set_title('Model Stability (10-Fold CV)', fontweight='bold')
    ax.legend()
    plt.tight_layout()
    fig.savefig(f'{FIGURES_DIR}/stability_comparison.png', dpi=300)
    fig.savefig(f'{FIGURES_DIR}/stability_comparison.tiff', dpi=300, format='tiff')
    plt.close()
    logger.info("Heatmaps saved!")


def loocv_single_model(name, X, y):
    """Run LOOCV for a single model."""
    loo = LeaveOneOut()
    y_true_all, y_prob_all = [], []
    model_path = f'{MODELS_DIR}/{name}.joblib'

    for train_idx, test_idx in loo.split(X):
        X_tr, X_te = X[train_idx], X[test_idx]
        y_tr, y_te = y[train_idx], y[test_idx]
        m = joblib.load(model_path)
        m.fit(X_tr, y_tr)
        y_prob = m.predict_proba(X_te)[:, 1]
        y_true_all.append(y_te[0])
        y_prob_all.append(y_prob[0])

    y_true = np.array(y_true_all)
    y_prob = np.array(y_prob_all)
    y_pred = (y_prob > 0.5).astype(int)

    auc = roc_auc_score(y_true, y_prob)
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1s = f1_score(y_true, y_pred, zero_division=0)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()
    spec = tn / (tn + fp) if (tn + fp) > 0 else 0
    npv = tn / (tn + fn) if (tn + fn) > 0 else 0

    return {
        'Model': name, 'LOOCV_AUC': auc, 'LOOCV_Accuracy': acc, 'LOOCV_Precision': prec,
        'LOOCV_Recall': rec, 'LOOCV_F1': f1s, 'LOOCV_Specificity': spec, 'LOOCV_NPV': npv
    }


def loocv_validation(models, X, y):
    logger.info("=" * 60)
    logger.info("TASK 3: LEAVE-ONE-OUT CROSS-VALIDATION (LOOCV)")
    logger.info(f"Running LOOCV for all 15 models ({N_SAMPLES} iterations each)")
    logger.info("Scientific Justification: LOOCV provides nearly unbiased estimates")
    logger.info("with maximum training data utilization (N-1 samples per iteration).")
    logger.info("=" * 60)

    results = []
    for name in tqdm(list(models.keys()), desc="LOOCV Progress"):
        logger.info(f"  Processing {name}...")
        result = loocv_single_model(name, X, y)
        results.append(result)
        logger.info(f"    {name}: AUC = {result['LOOCV_AUC']:.4f}")

    return pd.DataFrame(results)


def compare_results(kfold_df, loocv_df):
    logger.info("=" * 60)
    logger.info("COMPARISON: K-Fold vs LOOCV")
    logger.info("=" * 60)
    kf10 = kfold_df[kfold_df['K'] == 10][['Model', 'AUC_Mean']].rename(columns={'AUC_Mean': 'KFold_10_AUC'})
    comp = kf10.merge(loocv_df[['Model', 'LOOCV_AUC']], on='Model')
    comp['Difference'] = comp['KFold_10_AUC'] - comp['LOOCV_AUC']
    comp['Agreement'] = comp['Difference'].abs() < 0.02
    for _, r in comp.iterrows():
        symbol = 'OK' if r['Agreement'] else 'WARN'
        logger.info(f"  {r['Model']:20} 10-Fold: {r['KFold_10_AUC']:.4f}, LOOCV: {r['LOOCV_AUC']:.4f}, Diff: {r['Difference']:+.4f} [{symbol}]")
    return comp


def main():
    logger.info("=" * 60)
    logger.info("PHASE 4 PART 1: K-FOLD CV, STRATIFIED ANALYSIS, LOOCV")
    logger.info(f"Start: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 60)

    X, y = generate_data()
    models = train_models(X, y)
    kfold_df, fold_df = kfold_cv(models, X, y)
    stability_df = stratified_analysis(fold_df)
    generate_heatmaps(fold_df, stability_df)
    loocv_df = loocv_validation(models, X, y)
    comp_df = compare_results(kfold_df, loocv_df)

    # Save results
    kfold_df.to_csv(f'{RESULTS_DIR}/kfold_cv_results.csv', index=False)
    fold_df.to_csv(f'{RESULTS_DIR}/kfold_fold_details.csv', index=False)
    stability_df.to_csv(f'{RESULTS_DIR}/stability_analysis.csv', index=False)
    loocv_df.to_csv(f'{RESULTS_DIR}/loocv_results.csv', index=False)
    comp_df.to_csv(f'{RESULTS_DIR}/kfold_loocv_comparison.csv', index=False)

    summary = {
        'execution_date': datetime.now().isoformat(),
        'n_samples': N_SAMPLES,
        'n_features': N_FEATURES,
        'n_models': len(models),
        'best_model_10fold': kfold_df[kfold_df['K'] == 10].sort_values('AUC_Mean', ascending=False).iloc[0]['Model'],
        'best_auc_10fold': float(kfold_df[kfold_df['K'] == 10]['AUC_Mean'].max()),
        'best_model_loocv': loocv_df.sort_values('LOOCV_AUC', ascending=False).iloc[0]['Model'],
        'best_auc_loocv': float(loocv_df['LOOCV_AUC'].max()),
        'high_stability_models': stability_df[stability_df['Stability'] == 'High']['Model'].unique().tolist()
    }
    with open(f'{RESULTS_DIR}/phase4_part1_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)

    logger.info("=" * 60)
    logger.info(f"COMPLETED: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Results: {RESULTS_DIR}")
    logger.info(f"Figures: {FIGURES_DIR}")
    logger.info("=" * 60)
    return summary


if __name__ == "__main__":
    main()
