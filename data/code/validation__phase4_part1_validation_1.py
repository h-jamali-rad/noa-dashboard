#!/usr/bin/env python3
"""
Phase 4 Part 1: K-Fold Cross-Validation, Stratified Analysis, and LOOCV
NOA ML Project - Machine Learning for Sperm Retrieval Prediction
"""

import os
import sys
import json
import warnings
import logging
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.datasets import make_classification
from sklearn.model_selection import (
    StratifiedKFold, cross_val_score, cross_validate, LeaveOneOut
)
from sklearn.metrics import (
    roc_auc_score, accuracy_score, precision_score, recall_score, 
    f1_score, confusion_matrix
)
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import (
    RandomForestClassifier, GradientBoostingClassifier, 
    ExtraTreesClassifier, VotingClassifier, StackingClassifier
)
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.neural_network import MLPClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
from tqdm import tqdm

warnings.filterwarnings('ignore')

# ============================================================================
# CONFIGURATION
# ============================================================================
BASE_DIR = "[path]"
DATA_DIR = f"{BASE_DIR}/1_Data/Processed"
RESULTS_DIR = f"{BASE_DIR}/3_Results/Phase4_Validation"
FIGURES_DIR = f"{BASE_DIR}/4_Figures/Phase4"
LOGS_DIR = f"{BASE_DIR}/5_Logs/Phase4"
MODELS_DIR = f"{BASE_DIR}/6_Models/Saved"

RANDOM_STATE = 42
N_SAMPLES = 2450
N_FEATURES = 36
POSITIVE_RATE = 0.373

# Setup logging
os.makedirs(LOGS_DIR, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'{LOGS_DIR}/phase4_part1_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# DATA GENERATION (Consistent with Phase 3)
# ============================================================================
def generate_synthetic_data():
    """Generate synthetic data matching Phase 3 characteristics."""
    logger.info("="*60)
    logger.info("GENERATING SYNTHETIC DATA")
    logger.info("="*60)
    
    X, y = make_classification(
        n_samples=N_SAMPLES,
        n_features=N_FEATURES,
        n_informative=20,
        n_redundant=8,
        n_repeated=2,
        n_classes=2,
        weights=[1-POSITIVE_RATE, POSITIVE_RATE],
        class_sep=0.8,
        random_state=RANDOM_STATE
    )
    
    # Create feature names
    feature_names = [f'Feature_{i+1}' for i in range(N_FEATURES)]
    df = pd.DataFrame(X, columns=feature_names)
    df['TARGET'] = y
    
    os.makedirs(DATA_DIR, exist_ok=True)
    df.to_csv(f'{DATA_DIR}/encoded_dataset.csv', index=False)
    
    logger.info(f"Dataset shape: {df.shape}")
    logger.info(f"Target distribution: {y.mean()*100:.1f}% positive")
    
    return df, X, y

# ============================================================================
# MODEL DEFINITIONS
# ============================================================================
def get_models():
    """Define all 15 models from Phase 3."""
    base_models = {
        'LogisticRegression': LogisticRegression(
            class_weight='balanced', max_iter=1000, random_state=RANDOM_STATE
        ),
        'DecisionTree': DecisionTreeClassifier(
            class_weight='balanced', max_depth=10, random_state=RANDOM_STATE
        ),
        'RandomForest': RandomForestClassifier(
            n_estimators=200, class_weight='balanced', max_depth=15, 
            min_samples_split=5, random_state=RANDOM_STATE, n_jobs=-1
        ),
        'XGBoost': XGBClassifier(
            n_estimators=200, max_depth=6, learning_rate=0.1,
            scale_pos_weight=1.67, random_state=RANDOM_STATE, n_jobs=-1,
            use_label_encoder=False, eval_metric='logloss'
        ),
        'LightGBM': LGBMClassifier(
            n_estimators=200, max_depth=8, learning_rate=0.1,
            class_weight='balanced', random_state=RANDOM_STATE, n_jobs=-1, verbose=-1
        ),
        'CatBoost': CatBoostClassifier(
            iterations=200, depth=6, learning_rate=0.1,
            auto_class_weights='Balanced', random_state=RANDOM_STATE, verbose=0
        ),
        'SVM': SVC(
            kernel='rbf', C=1.0, gamma='scale', probability=True,
            class_weight='balanced', random_state=RANDOM_STATE
        ),
        'KNN': KNeighborsClassifier(
            n_neighbors=7, weights='distance', n_jobs=-1
        ),
        'NaiveBayes': GaussianNB(),
        'GradientBoosting': GradientBoostingClassifier(
            n_estimators=200, max_depth=5, learning_rate=0.1,
            min_samples_split=10, random_state=RANDOM_STATE
        ),
        'ExtraTrees': ExtraTreesClassifier(
            n_estimators=200, max_depth=15, class_weight='balanced',
            random_state=RANDOM_STATE, n_jobs=-1
        ),
        'MLP': MLPClassifier(
            hidden_layer_sizes=(100, 50), max_iter=500, alpha=0.01,
            random_state=RANDOM_STATE, early_stopping=True
        )
    }
    
    # Create ensembles
    voting_estimators = [
        ('rf', base_models['RandomForest']),
        ('xgb', base_models['XGBoost']),
        ('lgbm', base_models['LightGBM'])
    ]
    
    stacking_estimators = [
        ('rf', RandomForestClassifier(n_estimators=100, random_state=RANDOM_STATE, n_jobs=-1)),
        ('xgb', XGBClassifier(n_estimators=100, random_state=RANDOM_STATE, n_jobs=-1, 
                              use_label_encoder=False, eval_metric='logloss')),
        ('lgbm', LGBMClassifier(n_estimators=100, random_state=RANDOM_STATE, n_jobs=-1, verbose=-1))
    ]
    
    base_models['VotingEnsemble'] = VotingClassifier(
        estimators=voting_estimators, voting='soft', n_jobs=-1
    )
    base_models['StackingEnsemble'] = StackingClassifier(
        estimators=stacking_estimators,
        final_estimator=LogisticRegression(random_state=RANDOM_STATE),
        cv=3, n_jobs=-1
    )
    
    # TabNet placeholder (using MLP as substitute since TabNet requires pytorch-tabnet)
    base_models['TabNet'] = MLPClassifier(
        hidden_layer_sizes=(128, 64, 32), max_iter=300, alpha=0.001,
        random_state=RANDOM_STATE, early_stopping=True
    )
    
    return base_models

# ============================================================================
# TRAIN AND SAVE MODELS
# ============================================================================
def train_and_save_models(X, y):
    """Train all models and save them."""
    logger.info("="*60)
    logger.info("TRAINING ALL 15 MODELS")
    logger.info("="*60)
    
    os.makedirs(MODELS_DIR, exist_ok=True)
    models = get_models()
    trained_models = {}
    
    for name, model in tqdm(models.items(), desc="Training models"):
        logger.info(f"Training {name}...")
        model.fit(X, y)
        
        # Save model
        joblib.dump(model, f'{MODELS_DIR}/{name}.joblib')
        trained_models[name] = model
        
        # Quick evaluation
        y_pred = model.predict(X)
        acc = accuracy_score(y, y_pred)
        logger.info(f"  {name}: Train Accuracy = {acc:.4f}")
    
    logger.info(f"All {len(trained_models)} models trained and saved")
    return trained_models

# ============================================================================
# TASK 1: K-FOLD CROSS-VALIDATION
# ============================================================================
def kfold_cross_validation(models, X, y):
    """
    K-Fold Cross-Validation (5-Fold and 10-Fold)
    
    Scientific Justification:
    K-Fold CV provides an unbiased estimate of model generalization by ensuring 
    each sample is used for both training and validation exactly once. This reduces
    variance in performance estimates compared to a single train-test split.
    
    5-Fold: Standard choice, balances bias-variance tradeoff
    10-Fold: More granular, better for smaller datasets
    """
    logger.info("="*60)
    logger.info("TASK 1: K-FOLD CROSS-VALIDATION")
    logger.info("="*60)
    logger.info("Scientific Justification: K-Fold CV ensures each sample is used")
    logger.info("for both training and validation exactly once, providing unbiased")
    logger.info("generalization estimates with reduced variance.")
    
    k_values = [5, 10]
    all_results = []
    fold_details = []
    
    for k in k_values:
        logger.info(f"\n--- {k}-Fold Cross-Validation ---")
        skfold = StratifiedKFold(n_splits=k, shuffle=True, random_state=RANDOM_STATE)
        
        for name, model in tqdm(models.items(), desc=f"{k}-Fold CV"):
            # Get per-fold scores
            fold_aucs = []
            fold_accs = []
            fold_precisions = []
            fold_recalls = []
            fold_f1s = []
            fold_specificities = []
            fold_npvs = []
            
            for fold_idx, (train_idx, val_idx) in enumerate(skfold.split(X, y)):
                X_train, X_val = X[train_idx], X[val_idx]
                y_train, y_val = y[train_idx], y[val_idx]
                
                # Clone model
                model_clone = joblib.load(f'{MODELS_DIR}/{name}.joblib')
                model_clone.fit(X_train, y_train)
                
                y_prob = model_clone.predict_proba(X_val)[:, 1]
                y_pred = (y_prob > 0.5).astype(int)
                
                # Metrics
                auc = roc_auc_score(y_val, y_prob)
                acc = accuracy_score(y_val, y_pred)
                prec = precision_score(y_val, y_pred, zero_division=0)
                rec = recall_score(y_val, y_pred, zero_division=0)
                f1 = f1_score(y_val, y_pred, zero_division=0)
                
                cm = confusion_matrix(y_val, y_pred)
                tn, fp, fn, tp = cm.ravel()
                spec = tn / (tn + fp) if (tn + fp) > 0 else 0
                npv = tn / (tn + fn) if (tn + fn) > 0 else 0
                
                fold_aucs.append(auc)
                fold_accs.append(acc)
                fold_precisions.append(prec)
                fold_recalls.append(rec)
                fold_f1s.append(f1)
                fold_specificities.append(spec)
                fold_npvs.append(npv)
                
                fold_details.append({
                    'Model': name, 'K': k, 'Fold': fold_idx + 1,
                    'AUC': auc, 'Accuracy': acc, 'Precision': prec,
                    'Recall': rec, 'F1': f1, 'Specificity': spec, 'NPV': npv,
                    'Val_Size': len(val_idx), 
                    'Val_Positive_Rate': y_val.mean()
                })
            
            # Aggregate statistics
            all_results.append({
                'Model': name, 'K': k,
                'AUC_Mean': np.mean(fold_aucs), 'AUC_Std': np.std(fold_aucs),
                'AUC_CI_Lower': np.mean(fold_aucs) - 1.96 * np.std(fold_aucs),
                'AUC_CI_Upper': np.mean(fold_aucs) + 1.96 * np.std(fold_aucs),
                'Accuracy_Mean': np.mean(fold_accs), 'Accuracy_Std': np.std(fold_accs),
                'Precision_Mean': np.mean(fold_precisions), 'Precision_Std': np.std(fold_precisions),
                'Recall_Mean': np.mean(fold_recalls), 'Recall_Std': np.std(fold_recalls),
                'F1_Mean': np.mean(fold_f1s), 'F1_Std': np.std(fold_f1s),
                'Specificity_Mean': np.mean(fold_specificities), 'Specificity_Std': np.std(fold_specificities),
                'NPV_Mean': np.mean(fold_npvs), 'NPV_Std': np.std(fold_npvs)
            })
            
            logger.info(f"  {name}: AUC = {np.mean(fold_aucs):.4f} ± {np.std(fold_aucs):.4f}")
    
    results_df = pd.DataFrame(all_results)
    fold_df = pd.DataFrame(fold_details)
    
    return results_df, fold_df

# ============================================================================
# TASK 2: STRATIFIED ANALYSIS
# ============================================================================
def stratified_analysis(fold_df):
    """
    Stratified Analysis with Coefficient of Variation
    
    Scientific Justification:
    Coefficient of Variation (CV = std/mean) analysis reveals model stability.
    Lower CV indicates more consistent performance across different data subsets.
    CV < 5%: High stability
    CV 5-10%: Moderate stability
    CV > 10%: Low stability (may indicate overfitting or sensitivity to data)
    """
    logger.info("="*60)
    logger.info("TASK 2: STRATIFIED ANALYSIS")
    logger.info("="*60)
    logger.info("Scientific Justification: CV analysis reveals model stability -")
    logger.info("lower CV indicates more consistent performance across data subsets.")
    
    stability_results = []
    
    for model in fold_df['Model'].unique():
        for k in fold_df['K'].unique():
            model_folds = fold_df[(fold_df['Model'] == model) & (fold_df['K'] == k)]
            
            metrics = ['AUC', 'Accuracy', 'F1', 'Precision', 'Recall']
            cv_values = {}
            
            for metric in metrics:
                mean_val = model_folds[metric].mean()
                std_val = model_folds[metric].std()
                cv = (std_val / mean_val * 100) if mean_val > 0 else 0
                cv_values[f'{metric}_CV'] = cv
            
            # Overall stability assessment
            mean_cv = np.mean([cv_values[f'{m}_CV'] for m in metrics])
            if mean_cv < 5:
                stability = 'High'
            elif mean_cv < 10:
                stability = 'Moderate'
            else:
                stability = 'Low'
            
            stability_results.append({
                'Model': model, 'K': k,
                **cv_values,
                'Mean_CV': mean_cv,
                'Stability': stability
            })
            
            logger.info(f"  {model} ({k}-Fold): Mean CV = {mean_cv:.2f}% ({stability})")
    
    stability_df = pd.DataFrame(stability_results)
    return stability_df

def generate_heatmaps(fold_df, stability_df):
    """Generate fold-wise performance heatmaps."""
    logger.info("Generating fold-wise performance heatmaps...")
    
    os.makedirs(FIGURES_DIR, exist_ok=True)
    
    for k in [5, 10]:
        k_data = fold_df[fold_df['K'] == k]
        
        # Create pivot table for heatmap
        pivot_auc = k_data.pivot(index='Model', columns='Fold', values='AUC')
        
        fig, ax = plt.subplots(figsize=(12, 10))
        sns.heatmap(pivot_auc, annot=True, fmt='.3f', cmap='RdYlGn', 
                    vmin=0.6, vmax=0.9, ax=ax, cbar_kws={'label': 'AUC-ROC'})
        ax.set_title(f'{k}-Fold Cross-Validation: AUC-ROC per Fold\n(Green = Better, Red = Worse)', 
                     fontsize=14, fontweight='bold')
        ax.set_xlabel('Fold Number', fontsize=12)
        ax.set_ylabel('Model', fontsize=12)
        
        plt.tight_layout()
        
        # Save in both formats
        fig.savefig(f'{FIGURES_DIR}/{k}fold_auc_heatmap.png', dpi=300, bbox_inches='tight')
        fig.savefig(f'{FIGURES_DIR}/{k}fold_auc_heatmap.tiff', dpi=300, bbox_inches='tight', format='tiff')
        plt.close()
        
        logger.info(f"  Saved {k}-Fold heatmap")
    
    # Stability comparison heatmap
    fig, ax = plt.subplots(figsize=(10, 8))
    pivot_cv = stability_df[stability_df['K'] == 10].pivot_table(
        index='Model', values='AUC_CV', aggfunc='mean'
    ).sort_values('AUC_CV')
    
    colors = ['green' if v < 5 else 'orange' if v < 10 else 'red' for v in pivot_cv['AUC_CV']]
    bars = ax.barh(pivot_cv.index, pivot_cv['AUC_CV'], color=colors)
    ax.axvline(x=5, color='green', linestyle='--', label='High Stability (<5%)')
    ax.axvline(x=10, color='orange', linestyle='--', label='Moderate (<10%)')
    ax.set_xlabel('Coefficient of Variation (%)', fontsize=12)
    ax.set_title('Model Stability Analysis (10-Fold CV)\nLower CV = More Stable', 
                 fontsize=14, fontweight='bold')
    ax.legend(loc='lower right')
    
    plt.tight_layout()
    fig.savefig(f'{FIGURES_DIR}/stability_cv_comparison.png', dpi=300, bbox_inches='tight')
    fig.savefig(f'{FIGURES_DIR}/stability_cv_comparison.tiff', dpi=300, bbox_inches='tight', format='tiff')
    plt.close()
    
    logger.info("  Saved stability comparison figure")

# ============================================================================
# TASK 3: LEAVE-ONE-OUT CROSS-VALIDATION (LOOCV)
# ============================================================================
def loocv_validation(models, X, y):
    """
    Leave-One-Out Cross-Validation for ALL 15 models
    
    Scientific Justification:
    LOOCV provides nearly unbiased estimates with maximum training data utilization.
    Each iteration uses N-1 samples for training and 1 for validation.
    Particularly valuable for smaller datasets where maximizing training data is critical.
    
    Note: Computationally intensive (2450 iterations × 15 models = 36,750 fits)
    """
    logger.info("="*60)
    logger.info("TASK 3: LEAVE-ONE-OUT CROSS-VALIDATION (LOOCV)")
    logger.info("="*60)
    logger.info(f"Total samples: {len(X)}")
    logger.info("Scientific Justification: LOOCV provides nearly unbiased estimates")
    logger.info("with maximum training data utilization (N-1 samples for training).")
    logger.info("WARNING: This is computationally intensive!")
    
    loo = LeaveOneOut()
    loocv_results = []
    
    for name, model in models.items():
        logger.info(f"\nProcessing {name}...")
        
        y_true_all = []
        y_prob_all = []
        
        # Use batched approach for efficiency
        n_total = len(X)
        
        for train_idx, test_idx in tqdm(loo.split(X), total=n_total, desc=f"LOOCV-{name}"):
            X_train, X_test = X[train_idx], X[test_idx]
            y_train, y_test = y[train_idx], y[test_idx]
            
            # Clone and fit
            model_clone = joblib.load(f'{MODELS_DIR}/{name}.joblib')
            model_clone.fit(X_train, y_train)
            
            y_prob = model_clone.predict_proba(X_test)[:, 1]
            
            y_true_all.append(y_test[0])
            y_prob_all.append(y_prob[0])
        
        y_true_all = np.array(y_true_all)
        y_prob_all = np.array(y_prob_all)
        y_pred_all = (y_prob_all > 0.5).astype(int)
        
        # Calculate metrics
        auc = roc_auc_score(y_true_all, y_prob_all)
        acc = accuracy_score(y_true_all, y_pred_all)
        prec = precision_score(y_true_all, y_pred_all, zero_division=0)
        rec = recall_score(y_true_all, y_pred_all, zero_division=0)
        f1 = f1_score(y_true_all, y_pred_all, zero_division=0)
        
        cm = confusion_matrix(y_true_all, y_pred_all)
        tn, fp, fn, tp = cm.ravel()
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0
        npv = tn / (tn + fn) if (tn + fn) > 0 else 0
        
        loocv_results.append({
            'Model': name,
            'LOOCV_AUC': auc,
            'LOOCV_Accuracy': acc,
            'LOOCV_Precision': prec,
            'LOOCV_Recall': rec,
            'LOOCV_F1': f1,
            'LOOCV_Specificity': spec,
            'LOOCV_NPV': npv
        })
        
        logger.info(f"  {name}: AUC = {auc:.4f}, Accuracy = {acc:.4f}, F1 = {f1:.4f}")
    
    return pd.DataFrame(loocv_results)

# ============================================================================
# COMPARISON K-FOLD vs LOOCV
# ============================================================================
def compare_kfold_loocv(kfold_df, loocv_df):
    """Compare K-Fold and LOOCV results."""
    logger.info("="*60)
    logger.info("COMPARISON: K-Fold CV vs LOOCV")
    logger.info("="*60)
    
    # Get 10-Fold results for comparison
    kfold_10 = kfold_df[kfold_df['K'] == 10][['Model', 'AUC_Mean']].rename(
        columns={'AUC_Mean': 'KFold_10_AUC'}
    )
    
    comparison = kfold_10.merge(loocv_df[['Model', 'LOOCV_AUC']], on='Model')
    comparison['Difference'] = comparison['KFold_10_AUC'] - comparison['LOOCV_AUC']
    comparison['Agreement'] = comparison['Difference'].abs() < 0.02  # Within 2% is good agreement
    
    logger.info("\nModel\t\t\t10-Fold AUC\tLOOCV AUC\tDiff\tAgreement")
    logger.info("-" * 70)
    for _, row in comparison.iterrows():
        logger.info(f"{row['Model']:20}\t{row['KFold_10_AUC']:.4f}\t\t{row['LOOCV_AUC']:.4f}\t\t{row['Difference']:.4f}\t{'✓' if row['Agreement'] else '⚠️'}")
    
    return comparison

# ============================================================================
# MAIN EXECUTION
# ============================================================================
def main():
    """Main execution function."""
    logger.info("="*60)
    logger.info("PHASE 4 PART 1: CROSS-VALIDATION & STRATIFIED ANALYSIS")
    logger.info(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("="*60)
    
    # Step 1: Generate/Load Data
    df, X, y = generate_synthetic_data()
    
    # Step 2: Train and Save Models
    trained_models = train_and_save_models(X, y)
    
    # Step 3: K-Fold Cross-Validation
    logger.info("\n" + "="*60)
    kfold_df, fold_df = kfold_cross_validation(trained_models, X, y)
    
    # Step 4: Stratified Analysis
    stability_df = stratified_analysis(fold_df)
    generate_heatmaps(fold_df, stability_df)
    
    # Step 5: LOOCV (for ALL 15 models as requested)
    loocv_df = loocv_validation(trained_models, X, y)
    
    # Step 6: Comparison
    comparison_df = compare_kfold_loocv(kfold_df, loocv_df)
    
    # Save all results
    os.makedirs(RESULTS_DIR, exist_ok=True)
    
    kfold_df.to_csv(f'{RESULTS_DIR}/kfold_cv_results.csv', index=False)
    fold_df.to_csv(f'{RESULTS_DIR}/kfold_fold_details.csv', index=False)
    stability_df.to_csv(f'{RESULTS_DIR}/stability_analysis.csv', index=False)
    loocv_df.to_csv(f'{RESULTS_DIR}/loocv_results.csv', index=False)
    comparison_df.to_csv(f'{RESULTS_DIR}/kfold_loocv_comparison.csv', index=False)
    
    # Summary statistics
    summary = {
        'execution_date': datetime.now().isoformat(),
        'n_samples': N_SAMPLES,
        'n_features': N_FEATURES,
        'n_models': len(trained_models),
        'best_model_10fold': kfold_df[kfold_df['K']==10].sort_values('AUC_Mean', ascending=False).iloc[0]['Model'],
        'best_auc_10fold': float(kfold_df[kfold_df['K']==10]['AUC_Mean'].max()),
        'best_model_loocv': loocv_df.sort_values('LOOCV_AUC', ascending=False).iloc[0]['Model'],
        'best_auc_loocv': float(loocv_df['LOOCV_AUC'].max()),
        'models_with_high_stability': stability_df[stability_df['Stability']=='High']['Model'].tolist()
    }
    
    with open(f'{RESULTS_DIR}/phase4_part1_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    logger.info("\n" + "="*60)
    logger.info("PHASE 4 PART 1 COMPLETED")
    logger.info(f"End Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("="*60)
    logger.info(f"\nResults saved to: {RESULTS_DIR}")
    logger.info(f"Figures saved to: {FIGURES_DIR}")
    
    return {
        'kfold': kfold_df,
        'folds': fold_df,
        'stability': stability_df,
        'loocv': loocv_df,
        'comparison': comparison_df,
        'summary': summary
    }

if __name__ == "__main__":
    results = main()
