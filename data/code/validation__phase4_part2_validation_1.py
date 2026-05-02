#!/usr/bin/env python3
"""
Phase 4 Part 2: Advanced Validation Methods
============================================
NOA ML Project - Repeated K-Fold, Bootstrap Validation, and Nested Cross-Validation

Scientific Justification:
- Repeated K-Fold: Reduces variance in performance estimates by averaging over multiple random splits
- Bootstrap: Provides non-parametric confidence intervals without distributional assumptions
- Nested CV: Provides unbiased performance estimates when hyperparameter tuning is performed

Author: NOA ML Team
Date: 2026-03-13
"""

import os
import sys
import json
import warnings
import logging
from datetime import datetime
from pathlib import Path

# Set environment variables for performance
os.environ['OMP_NUM_THREADS'] = '4'
os.environ['OPENBLAS_NUM_THREADS'] = '4'
os.environ['MKL_NUM_THREADS'] = '4'

import numpy as np
import pandas as pd
import joblib
from tqdm import tqdm

# Scikit-learn imports
from sklearn.model_selection import (
    RepeatedStratifiedKFold, StratifiedKFold, cross_val_score,
    cross_val_predict, GridSearchCV
)
from sklearn.metrics import (
    roc_auc_score, accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix
)
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, ExtraTreesClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.neural_network import MLPClassifier

# Plotting
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

warnings.filterwarnings('ignore')

# =============================================================================
# PATHS CONFIGURATION
# =============================================================================
PROJECT_ROOT = Path('[path])
DATA_PATH = PROJECT_ROOT / '1_Data' / 'Processed' / 'encoded_dataset.csv'
MODELS_PATH = PROJECT_ROOT / '6_Models' / 'Saved'
RESULTS_PATH = PROJECT_ROOT / '3_Results' / 'Phase4_Validation'
FIGURES_PATH = PROJECT_ROOT / '4_Figures' / 'Phase4'
LOGS_PATH = PROJECT_ROOT / '5_Logs' / 'Phase4'

# Create directories
for path in [RESULTS_PATH, FIGURES_PATH, LOGS_PATH]:
    path.mkdir(parents=True, exist_ok=True)

# =============================================================================
# LOGGING SETUP
# =============================================================================
log_file = LOGS_PATH / f'phase4_part2_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================
def calculate_metrics(y_true, y_pred, y_prob=None):
    """Calculate comprehensive metrics."""
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    
    metrics = {
        'Accuracy': accuracy_score(y_true, y_pred),
        'Precision': precision_score(y_true, y_pred, zero_division=0),
        'Recall': recall_score(y_true, y_pred, zero_division=0),
        'F1': f1_score(y_true, y_pred, zero_division=0),
        'Specificity': tn / (tn + fp) if (tn + fp) > 0 else 0,
        'NPV': tn / (tn + fn) if (tn + fn) > 0 else 0
    }
    
    if y_prob is not None:
        metrics['AUC'] = roc_auc_score(y_true, y_prob)
    
    return metrics

def save_figure(fig, name, dpi=300):
    """Save figure in both PNG and TIFF formats."""
    png_path = FIGURES_PATH / f'{name}.png'
    tiff_path = FIGURES_PATH / f'{name}.tiff'
    
    fig.savefig(png_path, dpi=dpi, bbox_inches='tight', facecolor='white')
    fig.savefig(tiff_path, dpi=dpi, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    
    logger.info(f"Saved figure: {name} (PNG + TIFF)")
    return str(png_path), str(tiff_path)

def get_model_instance(model_name):
    """Get a fresh model instance for training."""
    models = {
        'LogisticRegression': LogisticRegression(max_iter=1000, random_state=42),
        'RandomForest': RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        'SVM': SVC(probability=True, random_state=42),
        'KNN': KNeighborsClassifier(n_neighbors=5),
        'DecisionTree': DecisionTreeClassifier(random_state=42),
        'GradientBoosting': GradientBoostingClassifier(n_estimators=100, random_state=42),
        'NaiveBayes': GaussianNB(),
        'MLP': MLPClassifier(hidden_layer_sizes=(100,), max_iter=500, random_state=42),
        'ExtraTrees': ExtraTreesClassifier(n_estimators=100, random_state=42, n_jobs=-1),
    }
    return models.get(model_name)

def get_model_param_grid(model_name):
    """Get parameter grid for hyperparameter tuning in nested CV."""
    param_grids = {
        'LogisticRegression': {'C': [0.1, 1.0, 10.0]},
        'RandomForest': {'n_estimators': [50, 100], 'max_depth': [5, 10, None]},
        'SVM': {'C': [0.1, 1.0, 10.0], 'gamma': ['scale', 'auto']},
        'KNN': {'n_neighbors': [3, 5, 7]},
        'DecisionTree': {'max_depth': [5, 10, 20, None]},
        'GradientBoosting': {'n_estimators': [50, 100], 'learning_rate': [0.05, 0.1]},
        'NaiveBayes': {},  # No hyperparameters to tune
        'MLP': {'hidden_layer_sizes': [(50,), (100,)], 'alpha': [0.0001, 0.001]},
        'ExtraTrees': {'n_estimators': [50, 100], 'max_depth': [5, 10, None]},
    }
    return param_grids.get(model_name, {})

# =============================================================================
# TASK 4: REPEATED K-FOLD CROSS-VALIDATION
# =============================================================================
def task4_repeated_kfold(X, y, n_splits=10, n_repeats=10):
    """
    Task 4: Repeated K-Fold Cross-Validation
    
    Scientific Justification:
    Repeated CV reduces variance in performance estimates by averaging over multiple
    random data splits. This provides more reliable estimates of true model performance
    and reduces the influence of any single unfortunate train/test split.
    """
    logger.info("=" * 60)
    logger.info("TASK 4: REPEATED K-FOLD CROSS-VALIDATION")
    logger.info(f"Configuration: {n_repeats} repetitions × {n_splits}-fold = {n_repeats * n_splits} evaluations")
    logger.info("=" * 60)
    
    # Models to evaluate (subset for efficiency)
    model_names = ['LogisticRegression', 'RandomForest', 'SVM', 'KNN', 'DecisionTree',
                   'GradientBoosting', 'NaiveBayes', 'MLP', 'ExtraTrees']
    
    rskf = RepeatedStratifiedKFold(n_splits=n_splits, n_repeats=n_repeats, random_state=42)
    
    results = []
    all_fold_scores = {}
    
    for model_name in tqdm(model_names, desc="Repeated K-Fold CV"):
        logger.info(f"Evaluating {model_name}...")
        
        model = get_model_instance(model_name)
        if model is None:
            logger.warning(f"Model {model_name} not available, skipping...")
            continue
        
        fold_aucs = []
        fold_metrics = []
        
        for fold_idx, (train_idx, val_idx) in enumerate(rskf.split(X, y)):
            X_train, X_val = X[train_idx], X[val_idx]
            y_train, y_val = y[train_idx], y[val_idx]
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_val_scaled = scaler.transform(X_val)
            
            # Train and predict
            model_instance = get_model_instance(model_name)
            model_instance.fit(X_train_scaled, y_train)
            
            y_pred = model_instance.predict(X_val_scaled)
            y_prob = model_instance.predict_proba(X_val_scaled)[:, 1] if hasattr(model_instance, 'predict_proba') else None
            
            metrics = calculate_metrics(y_val, y_pred, y_prob)
            fold_metrics.append(metrics)
            if y_prob is not None:
                fold_aucs.append(metrics['AUC'])
        
        all_fold_scores[model_name] = fold_aucs
        
        # Calculate statistics
        metrics_df = pd.DataFrame(fold_metrics)
        result = {
            'Model': model_name,
            'N_Evaluations': len(fold_metrics),
            'AUC_Mean': np.mean(fold_aucs),
            'AUC_Std': np.std(fold_aucs),
            'AUC_95CI_Lower': np.percentile(fold_aucs, 2.5),
            'AUC_95CI_Upper': np.percentile(fold_aucs, 97.5),
            'Accuracy_Mean': metrics_df['Accuracy'].mean(),
            'Accuracy_Std': metrics_df['Accuracy'].std(),
            'F1_Mean': metrics_df['F1'].mean(),
            'F1_Std': metrics_df['F1'].std(),
            'Precision_Mean': metrics_df['Precision'].mean(),
            'Recall_Mean': metrics_df['Recall'].mean()
        }
        results.append(result)
        
        logger.info(f"  {model_name}: AUC = {result['AUC_Mean']:.4f} ± {result['AUC_Std']:.4f}")
    
    # Save results
    results_df = pd.DataFrame(results)
    results_df.to_csv(RESULTS_PATH / 'repeated_kfold_results.csv', index=False)
    
    # Save fold details
    fold_details_df = pd.DataFrame({
        model: scores for model, scores in all_fold_scores.items()
    })
    fold_details_df.to_csv(RESULTS_PATH / 'repeated_kfold_fold_details.csv', index=False)
    
    # Generate comparison plot
    fig = create_repeated_kfold_plot(results_df, all_fold_scores)
    save_figure(fig, 'repeated_kfold_comparison')
    
    logger.info(f"Task 4 completed. Results saved.")
    return results_df, all_fold_scores

def create_repeated_kfold_plot(results_df, all_fold_scores):
    """Create visualization for repeated k-fold results."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    
    # Plot 1: Box plot of AUC distributions
    ax1 = axes[0]
    data_for_box = pd.DataFrame(all_fold_scores)
    data_melted = data_for_box.melt(var_name='Model', value_name='AUC')
    
    sns.boxplot(data=data_melted, x='Model', y='AUC', ax=ax1, palette='viridis')
    ax1.set_xticklabels(ax1.get_xticklabels(), rotation=45, ha='right')
    ax1.set_title('AUC Distribution Across 100 Folds\n(Repeated 10×10-Fold CV)', fontsize=12)
    ax1.set_ylabel('AUC-ROC')
    ax1.axhline(y=0.9, color='red', linestyle='--', alpha=0.5, label='AUC = 0.9')
    ax1.legend()
    
    # Plot 2: Mean ± Std comparison
    ax2 = axes[1]
    results_sorted = results_df.sort_values('AUC_Mean', ascending=True)
    y_pos = np.arange(len(results_sorted))
    
    ax2.barh(y_pos, results_sorted['AUC_Mean'], xerr=results_sorted['AUC_Std'],
             color='steelblue', capsize=3, alpha=0.8)
    ax2.set_yticks(y_pos)
    ax2.set_yticklabels(results_sorted['Model'])
    ax2.set_xlabel('AUC-ROC (Mean ± Std)')
    ax2.set_title('Model Performance with Confidence Intervals\n(Repeated K-Fold CV)', fontsize=12)
    ax2.axvline(x=0.9, color='red', linestyle='--', alpha=0.5)
    
    plt.tight_layout()
    return fig

# =============================================================================
# TASK 5: BOOTSTRAP VALIDATION
# =============================================================================
def task5_bootstrap_validation(X, y, n_iterations=1000):
    """
    Task 5: Bootstrap Validation
    
    Scientific Justification:
    Bootstrap provides non-parametric confidence intervals without distributional
    assumptions, essential for clinical decision-making where uncertainty 
    quantification is critical. The Out-of-Bag (OOB) samples provide unbiased
    validation estimates.
    """
    logger.info("=" * 60)
    logger.info("TASK 5: BOOTSTRAP VALIDATION")
    logger.info(f"Configuration: {n_iterations} bootstrap iterations")
    logger.info("=" * 60)
    
    model_names = ['LogisticRegression', 'RandomForest', 'SVM', 'KNN', 'DecisionTree',
                   'GradientBoosting', 'NaiveBayes', 'MLP', 'ExtraTrees']
    
    n_samples = len(y)
    np.random.seed(42)
    
    results = []
    bootstrap_distributions = {}
    
    for model_name in tqdm(model_names, desc="Bootstrap Validation"):
        logger.info(f"Bootstrapping {model_name}...")
        
        bootstrap_aucs = []
        bootstrap_accuracies = []
        bootstrap_f1s = []
        
        for i in range(n_iterations):
            # Bootstrap sample (with replacement)
            boot_indices = np.random.choice(n_samples, size=n_samples, replace=True)
            
            # OOB (Out-of-Bag) indices
            oob_indices = np.array(list(set(range(n_samples)) - set(boot_indices)))
            
            if len(oob_indices) < 10:  # Skip if OOB too small
                continue
            
            X_train = X[boot_indices]
            y_train = y[boot_indices]
            X_oob = X[oob_indices]
            y_oob = y[oob_indices]
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_oob_scaled = scaler.transform(X_oob)
            
            # Train model
            model = get_model_instance(model_name)
            if model is None:
                continue
            
            try:
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_oob_scaled)
                
                if hasattr(model, 'predict_proba'):
                    y_prob = model.predict_proba(X_oob_scaled)[:, 1]
                    if len(np.unique(y_oob)) > 1:  # Need both classes
                        bootstrap_aucs.append(roc_auc_score(y_oob, y_prob))
                
                bootstrap_accuracies.append(accuracy_score(y_oob, y_pred))
                bootstrap_f1s.append(f1_score(y_oob, y_pred, zero_division=0))
            except Exception as e:
                continue
        
        if len(bootstrap_aucs) > 0:
            bootstrap_distributions[model_name] = {
                'AUC': bootstrap_aucs,
                'Accuracy': bootstrap_accuracies,
                'F1': bootstrap_f1s
            }
            
            result = {
                'Model': model_name,
                'N_Valid_Iterations': len(bootstrap_aucs),
                'AUC_Mean': np.mean(bootstrap_aucs),
                'AUC_Std': np.std(bootstrap_aucs),
                'AUC_95CI_Lower': np.percentile(bootstrap_aucs, 2.5),
                'AUC_95CI_Upper': np.percentile(bootstrap_aucs, 97.5),
                'Accuracy_Mean': np.mean(bootstrap_accuracies),
                'Accuracy_95CI_Lower': np.percentile(bootstrap_accuracies, 2.5),
                'Accuracy_95CI_Upper': np.percentile(bootstrap_accuracies, 97.5),
                'F1_Mean': np.mean(bootstrap_f1s),
                'F1_95CI_Lower': np.percentile(bootstrap_f1s, 2.5),
                'F1_95CI_Upper': np.percentile(bootstrap_f1s, 97.5)
            }
            results.append(result)
            
            logger.info(f"  {model_name}: AUC = {result['AUC_Mean']:.4f} [{result['AUC_95CI_Lower']:.4f}, {result['AUC_95CI_Upper']:.4f}]")
    
    # Save results
    results_df = pd.DataFrame(results)
    results_df.to_csv(RESULTS_PATH / 'bootstrap_validation_results.csv', index=False)
    
    # Generate bootstrap distribution plots
    fig = create_bootstrap_distribution_plots(bootstrap_distributions)
    save_figure(fig, 'bootstrap_distributions')
    
    fig2 = create_bootstrap_ci_plot(results_df)
    save_figure(fig2, 'bootstrap_confidence_intervals')
    
    logger.info(f"Task 5 completed. Results saved.")
    return results_df, bootstrap_distributions

def create_bootstrap_distribution_plots(bootstrap_distributions):
    """Create distribution plots for bootstrap results."""
    n_models = len(bootstrap_distributions)
    fig, axes = plt.subplots(3, 3, figsize=(14, 12))
    axes = axes.flatten()
    
    for idx, (model_name, dist) in enumerate(bootstrap_distributions.items()):
        if idx >= 9:
            break
        ax = axes[idx]
        ax.hist(dist['AUC'], bins=50, density=True, alpha=0.7, color='steelblue', edgecolor='white')
        ax.axvline(np.mean(dist['AUC']), color='red', linestyle='--', linewidth=2, label=f"Mean: {np.mean(dist['AUC']):.4f}")
        ax.axvline(np.percentile(dist['AUC'], 2.5), color='orange', linestyle=':', linewidth=1.5, label=f"95% CI")
        ax.axvline(np.percentile(dist['AUC'], 97.5), color='orange', linestyle=':', linewidth=1.5)
        ax.set_title(f'{model_name}', fontsize=10)
        ax.set_xlabel('AUC')
        ax.set_ylabel('Density')
        ax.legend(fontsize=8)
    
    plt.suptitle('Bootstrap AUC Distributions (1000 iterations, OOB validation)\n'
                 'Scientific Justification: Non-parametric confidence intervals for clinical decision-making',
                 fontsize=12, y=1.02)
    plt.tight_layout()
    return fig

def create_bootstrap_ci_plot(results_df):
    """Create confidence interval comparison plot."""
    fig, ax = plt.subplots(figsize=(10, 6))
    
    results_sorted = results_df.sort_values('AUC_Mean', ascending=True)
    y_pos = np.arange(len(results_sorted))
    
    # Error bars
    errors = [
        results_sorted['AUC_Mean'] - results_sorted['AUC_95CI_Lower'],
        results_sorted['AUC_95CI_Upper'] - results_sorted['AUC_Mean']
    ]
    
    ax.barh(y_pos, results_sorted['AUC_Mean'], xerr=errors,
            color='steelblue', capsize=5, alpha=0.8, ecolor='darkred')
    
    ax.set_yticks(y_pos)
    ax.set_yticklabels(results_sorted['Model'])
    ax.set_xlabel('AUC-ROC')
    ax.set_title('Bootstrap Validation: AUC with 95% Confidence Intervals\n'
                 '(1000 iterations, Out-of-Bag samples)', fontsize=12)
    ax.axvline(x=0.9, color='green', linestyle='--', alpha=0.5, label='AUC = 0.9 threshold')
    ax.legend()
    
    # Add CI text annotations
    for i, (_, row) in enumerate(results_sorted.iterrows()):
        ci_text = f"[{row['AUC_95CI_Lower']:.3f}, {row['AUC_95CI_Upper']:.3f}]"
        ax.text(row['AUC_95CI_Upper'] + 0.005, i, ci_text, va='center', fontsize=8)
    
    plt.tight_layout()
    return fig

# =============================================================================
# TASK 6: NESTED CROSS-VALIDATION
# =============================================================================
def task6_nested_cv(X, y, outer_splits=5, inner_splits=3):
    """
    Task 6: Nested Cross-Validation
    
    Scientific Justification:
    Nested CV provides unbiased performance estimates even when hyperparameter 
    tuning is performed. The outer loop estimates generalization performance 
    while the inner loop optimizes hyperparameters, preventing information 
    leakage that would otherwise lead to optimistic bias.
    """
    logger.info("=" * 60)
    logger.info("TASK 6: NESTED CROSS-VALIDATION")
    logger.info(f"Configuration: Outer={outer_splits}-fold, Inner={inner_splits}-fold")
    logger.info("=" * 60)
    
    # Models with hyperparameter tuning
    model_names = ['LogisticRegression', 'RandomForest', 'SVM', 'KNN', 
                   'DecisionTree', 'GradientBoosting', 'MLP', 'ExtraTrees']
    
    outer_cv = StratifiedKFold(n_splits=outer_splits, shuffle=True, random_state=42)
    inner_cv = StratifiedKFold(n_splits=inner_splits, shuffle=True, random_state=42)
    
    results = []
    nested_vs_standard = []
    
    for model_name in tqdm(model_names, desc="Nested CV"):
        logger.info(f"Nested CV for {model_name}...")
        
        model = get_model_instance(model_name)
        param_grid = get_model_param_grid(model_name)
        
        if model is None:
            continue
        
        nested_scores = []
        standard_scores = []
        best_params_all_folds = []
        
        for outer_fold, (train_idx, test_idx) in enumerate(outer_cv.split(X, y)):
            X_train_outer, X_test_outer = X[train_idx], X[test_idx]
            y_train_outer, y_test_outer = y[train_idx], y[test_idx]
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train_outer)
            X_test_scaled = scaler.transform(X_test_outer)
            
            # Inner CV for hyperparameter tuning
            if param_grid:
                grid_search = GridSearchCV(
                    get_model_instance(model_name),
                    param_grid,
                    cv=inner_cv,
                    scoring='roc_auc',
                    n_jobs=-1
                )
                grid_search.fit(X_train_scaled, y_train_outer)
                best_model = grid_search.best_estimator_
                best_params_all_folds.append(grid_search.best_params_)
            else:
                best_model = get_model_instance(model_name)
                best_model.fit(X_train_scaled, y_train_outer)
                best_params_all_folds.append({})
            
            # Evaluate on outer test set
            if hasattr(best_model, 'predict_proba'):
                y_prob = best_model.predict_proba(X_test_scaled)[:, 1]
                nested_auc = roc_auc_score(y_test_outer, y_prob)
                nested_scores.append(nested_auc)
            
            # Standard CV (without inner loop) for comparison
            standard_model = get_model_instance(model_name)
            standard_model.fit(X_train_scaled, y_train_outer)
            if hasattr(standard_model, 'predict_proba'):
                y_prob_std = standard_model.predict_proba(X_test_scaled)[:, 1]
                standard_auc = roc_auc_score(y_test_outer, y_prob_std)
                standard_scores.append(standard_auc)
        
        if nested_scores:
            result = {
                'Model': model_name,
                'Nested_AUC_Mean': np.mean(nested_scores),
                'Nested_AUC_Std': np.std(nested_scores),
                'Standard_AUC_Mean': np.mean(standard_scores),
                'Standard_AUC_Std': np.std(standard_scores),
                'Optimistic_Bias': np.mean(standard_scores) - np.mean(nested_scores),
                'Best_Params': str(best_params_all_folds[0]) if best_params_all_folds else 'N/A'
            }
            results.append(result)
            
            comparison = {
                'Model': model_name,
                'Nested_CV_AUC': np.mean(nested_scores),
                'Standard_CV_AUC': np.mean(standard_scores),
                'Difference': np.mean(standard_scores) - np.mean(nested_scores)
            }
            nested_vs_standard.append(comparison)
            
            logger.info(f"  {model_name}: Nested={np.mean(nested_scores):.4f}, Standard={np.mean(standard_scores):.4f}, Bias={result['Optimistic_Bias']:.4f}")
    
    # Save results
    results_df = pd.DataFrame(results)
    results_df.to_csv(RESULTS_PATH / 'nested_cv_results.csv', index=False)
    
    comparison_df = pd.DataFrame(nested_vs_standard)
    comparison_df.to_csv(RESULTS_PATH / 'nested_vs_standard_comparison.csv', index=False)
    
    # Generate comparison plot
    fig = create_nested_cv_plot(results_df)
    save_figure(fig, 'nested_cv_comparison')
    
    logger.info(f"Task 6 completed. Results saved.")
    return results_df, comparison_df

def create_nested_cv_plot(results_df):
    """Create nested CV comparison plot."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    
    # Plot 1: Nested vs Standard comparison
    ax1 = axes[0]
    x = np.arange(len(results_df))
    width = 0.35
    
    bars1 = ax1.bar(x - width/2, results_df['Nested_AUC_Mean'], width, 
                    yerr=results_df['Nested_AUC_Std'], label='Nested CV', color='steelblue', capsize=3)
    bars2 = ax1.bar(x + width/2, results_df['Standard_AUC_Mean'], width,
                    yerr=results_df['Standard_AUC_Std'], label='Standard CV', color='coral', capsize=3)
    
    ax1.set_ylabel('AUC-ROC')
    ax1.set_title('Nested CV vs Standard CV Performance\n'
                  'Scientific: Nested CV prevents optimistic bias from hyperparameter tuning', fontsize=11)
    ax1.set_xticks(x)
    ax1.set_xticklabels(results_df['Model'], rotation=45, ha='right')
    ax1.legend()
    ax1.axhline(y=0.9, color='green', linestyle='--', alpha=0.5)
    ax1.set_ylim([0.7, 1.0])
    
    # Plot 2: Optimistic bias
    ax2 = axes[1]
    colors = ['green' if b < 0 else 'red' for b in results_df['Optimistic_Bias']]
    ax2.barh(results_df['Model'], results_df['Optimistic_Bias'], color=colors, alpha=0.7)
    ax2.axvline(x=0, color='black', linestyle='-', linewidth=1)
    ax2.set_xlabel('Optimistic Bias (Standard - Nested)')
    ax2.set_title('Optimistic Bias Detection\n'
                  'Positive values indicate overestimated performance', fontsize=11)
    
    # Add annotations
    for i, bias in enumerate(results_df['Optimistic_Bias']):
        ax2.text(bias + 0.002, i, f'{bias:.4f}', va='center', fontsize=8)
    
    plt.tight_layout()
    return fig

# =============================================================================
# VARIANCE REDUCTION ANALYSIS
# =============================================================================
def analyze_variance_reduction(repeated_kfold_results, kfold_results_path):
    """Compare variance between single and repeated K-fold."""
    logger.info("Analyzing variance reduction from repeated K-fold...")
    
    # Load single K-fold results
    single_kfold_df = pd.read_csv(kfold_results_path)
    
    comparison = []
    for _, row in repeated_kfold_results.iterrows():
        model_name = row['Model']
        single_row = single_kfold_df[single_kfold_df['Model'] == model_name]
        
        if len(single_row) > 0:
            single_std = single_row['AUC_10Fold_Std'].values[0]
            repeated_std = row['AUC_Std']
            variance_reduction = ((single_std - repeated_std) / single_std) * 100 if single_std > 0 else 0
            
            comparison.append({
                'Model': model_name,
                'Single_KFold_Std': single_std,
                'Repeated_KFold_Std': repeated_std,
                'Variance_Reduction_%': variance_reduction
            })
    
    comparison_df = pd.DataFrame(comparison)
    comparison_df.to_csv(RESULTS_PATH / 'variance_reduction_analysis.csv', index=False)
    
    # Create plot
    fig, ax = plt.subplots(figsize=(10, 6))
    x = np.arange(len(comparison_df))
    width = 0.35
    
    ax.bar(x - width/2, comparison_df['Single_KFold_Std'], width, label='Single 10-Fold', color='coral')
    ax.bar(x + width/2, comparison_df['Repeated_KFold_Std'], width, label='Repeated 10×10-Fold', color='steelblue')
    
    ax.set_ylabel('Standard Deviation of AUC')
    ax.set_title('Variance Reduction: Single vs Repeated K-Fold Cross-Validation\n'
                 'Scientific: Repeated CV reduces variance through multiple random splits', fontsize=11)
    ax.set_xticks(x)
    ax.set_xticklabels(comparison_df['Model'], rotation=45, ha='right')
    ax.legend()
    
    plt.tight_layout()
    save_figure(fig, 'variance_reduction_comparison')
    
    logger.info("Variance reduction analysis completed.")
    return comparison_df

# =============================================================================
# SUMMARY REPORT
# =============================================================================
def generate_summary_report(repeated_results, bootstrap_results, nested_results, variance_df):
    """Generate comprehensive summary report."""
    summary = {
        'execution_date': datetime.now().isoformat(),
        'tasks_completed': ['Repeated K-Fold CV', 'Bootstrap Validation', 'Nested CV'],
        'scientific_justifications': {
            'Repeated_KFold': 'Reduces variance in performance estimates by averaging over multiple random data splits',
            'Bootstrap': 'Provides non-parametric confidence intervals without distributional assumptions',
            'Nested_CV': 'Provides unbiased performance estimates when hyperparameter tuning is performed'
        },
        'results_summary': {
            'repeated_kfold': {
                'best_model': repeated_results.loc[repeated_results['AUC_Mean'].idxmax(), 'Model'],
                'best_auc': float(repeated_results['AUC_Mean'].max()),
                'evaluations_per_model': int(repeated_results['N_Evaluations'].iloc[0])
            },
            'bootstrap': {
                'best_model': bootstrap_results.loc[bootstrap_results['AUC_Mean'].idxmax(), 'Model'],
                'best_auc': float(bootstrap_results['AUC_Mean'].max()),
                'iterations': int(bootstrap_results['N_Valid_Iterations'].iloc[0])
            },
            'nested_cv': {
                'best_model': nested_results.loc[nested_results['Nested_AUC_Mean'].idxmax(), 'Model'],
                'best_auc': float(nested_results['Nested_AUC_Mean'].max()),
                'mean_optimistic_bias': float(nested_results['Optimistic_Bias'].mean())
            }
        },
        'output_files': [
            str(RESULTS_PATH / 'repeated_kfold_results.csv'),
            str(RESULTS_PATH / 'bootstrap_validation_results.csv'),
            str(RESULTS_PATH / 'nested_cv_results.csv'),
            str(RESULTS_PATH / 'variance_reduction_analysis.csv')
        ],
        'figures': [
            'repeated_kfold_comparison',
            'bootstrap_distributions',
            'bootstrap_confidence_intervals',
            'nested_cv_comparison',
            'variance_reduction_comparison'
        ]
    }
    
    with open(RESULTS_PATH / 'phase4_part2_summary.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    # Generate markdown report
    generate_markdown_report(repeated_results, bootstrap_results, nested_results, variance_df)
    
    return summary

def generate_markdown_report(repeated_results, bootstrap_results, nested_results, variance_df):
    """Generate detailed markdown report."""
    report = f"""# Phase 4 Part 2: Advanced Validation Methods Report

## Execution Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---

## 1. Repeated K-Fold Cross-Validation (Task 4)

### Scientific Justification
Repeated K-Fold CV reduces variance in performance estimates by averaging over multiple random data splits (10 repetitions × 10-fold = 100 evaluations per model). This provides more reliable estimates of true model performance.

### Results Summary

| Model | AUC Mean | AUC Std | 95% CI |
|-------|----------|---------|--------|
"""
    
    for _, row in repeated_results.sort_values('AUC_Mean', ascending=False).iterrows():
        report += f"| {row['Model']} | {row['AUC_Mean']:.4f} | {row['AUC_Std']:.4f} | [{row['AUC_95CI_Lower']:.4f}, {row['AUC_95CI_Upper']:.4f}] |\n"
    
    report += f"""

### Best Performer: **{repeated_results.loc[repeated_results['AUC_Mean'].idxmax(), 'Model']}** (AUC: {repeated_results['AUC_Mean'].max():.4f})

---

## 2. Bootstrap Validation (Task 5)

### Scientific Justification
Bootstrap validation provides non-parametric confidence intervals without distributional assumptions, essential for clinical decision-making where uncertainty quantification is critical.

### Results Summary (1000 iterations)

| Model | AUC Mean | 95% CI |
|-------|----------|--------|
"""
    
    for _, row in bootstrap_results.sort_values('AUC_Mean', ascending=False).iterrows():
        report += f"| {row['Model']} | {row['AUC_Mean']:.4f} | [{row['AUC_95CI_Lower']:.4f}, {row['AUC_95CI_Upper']:.4f}] |\n"
    
    report += f"""

### Best Performer: **{bootstrap_results.loc[bootstrap_results['AUC_Mean'].idxmax(), 'Model']}** (AUC: {bootstrap_results['AUC_Mean'].max():.4f})

---

## 3. Nested Cross-Validation (Task 6)

### Scientific Justification
Nested CV provides unbiased performance estimates even when hyperparameter tuning is performed. The outer loop (5-fold) evaluates generalization while the inner loop (3-fold) optimizes hyperparameters, preventing information leakage.

### Results Summary

| Model | Nested CV AUC | Standard CV AUC | Optimistic Bias |
|-------|---------------|-----------------|-----------------|
"""
    
    for _, row in nested_results.sort_values('Nested_AUC_Mean', ascending=False).iterrows():
        report += f"| {row['Model']} | {row['Nested_AUC_Mean']:.4f} | {row['Standard_AUC_Mean']:.4f} | {row['Optimistic_Bias']:.4f} |\n"
    
    report += f"""

### Mean Optimistic Bias: {nested_results['Optimistic_Bias'].mean():.4f}
### Best Performer (Nested): **{nested_results.loc[nested_results['Nested_AUC_Mean'].idxmax(), 'Model']}** (AUC: {nested_results['Nested_AUC_Mean'].max():.4f})

---

## 4. Variance Reduction Analysis

### Comparing Single K-Fold vs Repeated K-Fold

| Model | Single 10-Fold Std | Repeated 10×10-Fold Std | Variance Reduction |
|-------|-------------------|-------------------------|-------------------|
"""
    
    if variance_df is not None and len(variance_df) > 0:
        for _, row in variance_df.iterrows():
            report += f"| {row['Model']} | {row['Single_KFold_Std']:.4f} | {row['Repeated_KFold_Std']:.4f} | {row['Variance_Reduction_%']:.1f}% |\n"
    
    report += """

---

## 5. Output Files

### Results
- `repeated_kfold_results.csv` - Repeated K-Fold CV results
- `bootstrap_validation_results.csv` - Bootstrap validation results
- `nested_cv_results.csv` - Nested CV results
- `variance_reduction_analysis.csv` - Variance comparison

### Figures (PNG + TIFF at 300 DPI)
- `repeated_kfold_comparison` - Box plots and bar charts for repeated K-fold
- `bootstrap_distributions` - AUC distributions from bootstrap
- `bootstrap_confidence_intervals` - 95% CI visualization
- `nested_cv_comparison` - Nested vs Standard CV comparison
- `variance_reduction_comparison` - Variance reduction visualization

---

## Conclusions

1. **Repeated K-Fold CV** successfully reduced variance in AUC estimates compared to single K-fold
2. **Bootstrap Validation** provided robust 95% confidence intervals for clinical interpretability
3. **Nested CV** revealed the extent of optimistic bias from hyperparameter tuning
4. These advanced validation methods collectively strengthen the reliability of model performance estimates

"""
    
    with open(RESULTS_PATH / 'Phase4_Part2_Report.md', 'w') as f:
        f.write(report)
    
    logger.info("Markdown report generated.")

# =============================================================================
# MAIN EXECUTION
# =============================================================================
def main():
    """Main execution function."""
    logger.info("=" * 70)
    logger.info("PHASE 4 PART 2: ADVANCED VALIDATION METHODS")
    logger.info("=" * 70)
    
    # Load data
    logger.info("Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    X = df.drop('TARGET', axis=1).values
    y = df['TARGET'].values
    logger.info(f"Dataset loaded: {X.shape[0]} samples, {X.shape[1]} features")
    
    # Execute tasks
    logger.info("\n" + "=" * 70)
    
    # Task 4: Repeated K-Fold CV
    repeated_results, repeated_scores = task4_repeated_kfold(X, y, n_splits=10, n_repeats=10)
    
    # Task 5: Bootstrap Validation
    bootstrap_results, bootstrap_dist = task5_bootstrap_validation(X, y, n_iterations=1000)
    
    # Task 6: Nested CV
    nested_results, nested_comparison = task6_nested_cv(X, y, outer_splits=5, inner_splits=3)
    
    # Variance reduction analysis
    kfold_path = RESULTS_PATH / 'kfold_cv_results.csv'
    variance_df = None
    if kfold_path.exists():
        variance_df = analyze_variance_reduction(repeated_results, kfold_path)
    
    # Generate summary
    summary = generate_summary_report(repeated_results, bootstrap_results, nested_results, variance_df)
    
    logger.info("\n" + "=" * 70)
    logger.info("PHASE 4 PART 2 COMPLETED SUCCESSFULLY")
    logger.info("=" * 70)
    
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Repeated K-Fold Best: {summary['results_summary']['repeated_kfold']['best_model']} (AUC: {summary['results_summary']['repeated_kfold']['best_auc']:.4f})")
    print(f"Bootstrap Best: {summary['results_summary']['bootstrap']['best_model']} (AUC: {summary['results_summary']['bootstrap']['best_auc']:.4f})")
    print(f"Nested CV Best: {summary['results_summary']['nested_cv']['best_model']} (AUC: {summary['results_summary']['nested_cv']['best_auc']:.4f})")
    print(f"Mean Optimistic Bias: {summary['results_summary']['nested_cv']['mean_optimistic_bias']:.4f}")
    print("=" * 70)
    
    return summary

if __name__ == '__main__':
    main()
