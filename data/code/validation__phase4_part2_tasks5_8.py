#!/usr/bin/env python3
"""
NOA ML Project - Phase 4 Part 2: Tasks 5-8
=========================================
Task 5: Bootstrap Validation (500 iterations, checkpointing)
Task 6: Nested Cross-Validation (5-outer, 3-inner folds)
Task 7: Overfitting Detection
Task 8: Learning Curves

Scientific Justifications included for each method.
"""

import os
import sys
import json
import warnings
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path

# Set environment for reproducibility
os.environ['OMP_NUM_THREADS'] = '4'
warnings.filterwarnings('ignore')

import joblib
from sklearn.model_selection import (
    StratifiedKFold, cross_val_score, learning_curve, GridSearchCV
)
from sklearn.metrics import (
    roc_auc_score, accuracy_score, precision_score, recall_score, 
    f1_score, confusion_matrix
)
from sklearn.utils import resample
from sklearn.base import clone
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')
import seaborn as sns
from tqdm import tqdm

# Project paths
PROJECT_ROOT = Path("[path]")
DATA_PATH = PROJECT_ROOT / "1_Data/Processed/encoded_dataset.csv"
MODELS_PATH = PROJECT_ROOT / "6_Models/Saved"
RESULTS_PATH = PROJECT_ROOT / "3_Results/Phase4_Validation"
FIGURES_PATH = PROJECT_ROOT / "4_Figures/Phase4"
LOGS_PATH = PROJECT_ROOT / "5_Logs/Phase4"
CHECKPOINT_PATH = RESULTS_PATH / "checkpoints"

# Ensure directories exist
for path in [RESULTS_PATH, FIGURES_PATH, LOGS_PATH, CHECKPOINT_PATH]:
    path.mkdir(parents=True, exist_ok=True)

# Model names
MODEL_NAMES = [
    'LogisticRegression', 'SVM', 'RandomForest', 'GradientBoosting',
    'XGBoost', 'LightGBM', 'CatBoost', 'KNN', 'NaiveBayes', 'DecisionTree',
    'ExtraTrees', 'MLP', 'TabNet', 'VotingEnsemble', 'StackingEnsemble'
]

def load_data():
    """Load the dataset."""
    print("Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    X = df.drop('TARGET', axis=1).values
    y = df['TARGET'].values
    print(f"Dataset loaded: {X.shape[0]} samples, {X.shape[1]} features")
    return X, y

def load_models():
    """Load all trained models."""
    print("Loading models...")
    models = {}
    for name in MODEL_NAMES:
        model_path = MODELS_PATH / f"{name}.joblib"
        if model_path.exists():
            models[name] = joblib.load(model_path)
            print(f"  Loaded: {name}")
        else:
            print(f"  Warning: {name} not found")
    return models

def calculate_metrics(y_true, y_pred, y_prob=None):
    """Calculate all performance metrics."""
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    
    metrics = {
        'AUC': roc_auc_score(y_true, y_prob) if y_prob is not None else np.nan,
        'Accuracy': accuracy_score(y_true, y_pred),
        'Sensitivity': recall_score(y_true, y_pred),  # Same as Recall
        'Specificity': tn / (tn + fp) if (tn + fp) > 0 else 0,
        'PPV': precision_score(y_true, y_pred, zero_division=0),
        'NPV': tn / (tn + fn) if (tn + fn) > 0 else 0,
        'F1': f1_score(y_true, y_pred)
    }
    return metrics

# ============================================================================
# TASK 5: Bootstrap Validation
# ============================================================================
def task5_bootstrap_validation(X, y, models, n_iterations=500, checkpoint_freq=1):
    """
    Bootstrap Validation with 500 iterations and Out-of-Bag (OOB) samples.
    
    Scientific Justification:
    Bootstrap provides non-parametric confidence intervals without distributional 
    assumptions, essential for clinical decision-making where uncertainty 
    quantification is critical. The 95% CI allows clinicians to understand 
    the range of expected model performance.
    """
    print("\n" + "="*70)
    print("TASK 5: Bootstrap Validation")
    print("="*70)
    print(f"Iterations: {n_iterations}")
    print("Using Out-of-Bag (OOB) samples for validation")
    print("Scientific Justification: Non-parametric CIs for clinical decision-making")
    
    results = []
    all_bootstrap_scores = {}
    
    for model_name, model in tqdm(models.items(), desc="Bootstrap Validation"):
        # Check checkpoint
        checkpoint_file = CHECKPOINT_PATH / f"bootstrap_{model_name}.json"
        if checkpoint_file.exists():
            print(f"  Loading checkpoint for {model_name}")
            with open(checkpoint_file, 'r') as f:
                model_data = json.load(f)
            all_bootstrap_scores[model_name] = model_data['scores']
            continue
        
        # Run bootstrap iterations
        bootstrap_metrics = {key: [] for key in ['AUC', 'Accuracy', 'Sensitivity', 
                                                   'Specificity', 'PPV', 'NPV', 'F1']}
        
        n_samples = len(y)
        
        for i in range(n_iterations):
            # Bootstrap sample with replacement
            indices = resample(range(n_samples), n_samples=n_samples, random_state=i)
            oob_indices = list(set(range(n_samples)) - set(indices))
            
            if len(oob_indices) < 10:
                continue
            
            X_train, y_train = X[indices], y[indices]
            X_oob, y_oob = X[oob_indices], y[oob_indices]
            
            try:
                # Clone and train model
                model_clone = clone(model)
                model_clone.fit(X_train, y_train)
                
                y_pred = model_clone.predict(X_oob)
                if hasattr(model_clone, 'predict_proba'):
                    y_prob = model_clone.predict_proba(X_oob)[:, 1]
                else:
                    y_prob = model_clone.decision_function(X_oob)
                    y_prob = (y_prob - y_prob.min()) / (y_prob.max() - y_prob.min())
                
                metrics = calculate_metrics(y_oob, y_pred, y_prob)
                for key, value in metrics.items():
                    bootstrap_metrics[key].append(value)
            except Exception as e:
                continue
        
        all_bootstrap_scores[model_name] = bootstrap_metrics
        
        # Save checkpoint
        with open(checkpoint_file, 'w') as f:
            json.dump({'scores': bootstrap_metrics}, f)
        print(f"  Checkpoint saved: {model_name}")
    
    # Calculate statistics and CIs
    for model_name, scores in all_bootstrap_scores.items():
        result = {'Model': model_name}
        for metric, values in scores.items():
            if len(values) > 0:
                values = np.array(values)
                result[f'{metric}_Mean'] = np.mean(values)
                result[f'{metric}_Std'] = np.std(values)
                result[f'{metric}_CI_Lower'] = np.percentile(values, 2.5)
                result[f'{metric}_CI_Upper'] = np.percentile(values, 97.5)
        results.append(result)
    
    # Save results
    results_df = pd.DataFrame(results)
    results_df.to_csv(RESULTS_PATH / "bootstrap_validation_results.csv", index=False)
    print(f"\nSaved: bootstrap_validation_results.csv")
    
    # Generate plots
    generate_bootstrap_plots(all_bootstrap_scores)
    
    return results_df, all_bootstrap_scores

def generate_bootstrap_plots(bootstrap_scores):
    """Generate bootstrap distribution plots."""
    print("Generating bootstrap plots...")
    
    # AUC Distribution Plot
    fig, axes = plt.subplots(3, 5, figsize=(20, 12))
    axes = axes.flatten()
    
    for idx, (model_name, scores) in enumerate(bootstrap_scores.items()):
        if idx >= 15:
            break
        ax = axes[idx]
        auc_scores = scores.get('AUC', [])
        if len(auc_scores) > 0:
            ax.hist(auc_scores, bins=30, color='steelblue', alpha=0.7, edgecolor='black')
            ax.axvline(np.mean(auc_scores), color='red', linestyle='--', linewidth=2, label='Mean')
            ax.axvline(np.percentile(auc_scores, 2.5), color='orange', linestyle=':', linewidth=2, label='95% CI')
            ax.axvline(np.percentile(auc_scores, 97.5), color='orange', linestyle=':', linewidth=2)
            ax.set_title(f'{model_name}', fontsize=10)
            ax.set_xlabel('AUC')
            ax.set_ylabel('Frequency')
    
    plt.suptitle('Bootstrap AUC Distributions (500 iterations)', fontsize=14, fontweight='bold')
    plt.tight_layout(rect=[0, 0, 1, 0.96])
    plt.savefig(FIGURES_PATH / "bootstrap_auc_distributions.png", dpi=300, bbox_inches='tight')
    plt.savefig(FIGURES_PATH / "bootstrap_auc_distributions.tiff", dpi=300, bbox_inches='tight')
    plt.close()
    
    # CI Comparison Plot
    fig, ax = plt.subplots(figsize=(14, 8))
    
    models_sorted = sorted(bootstrap_scores.keys(), 
                          key=lambda x: np.mean(bootstrap_scores[x].get('AUC', [0])), reverse=True)
    
    y_pos = np.arange(len(models_sorted))
    means = [np.mean(bootstrap_scores[m].get('AUC', [0])) for m in models_sorted]
    ci_lower = [np.percentile(bootstrap_scores[m].get('AUC', [0]), 2.5) for m in models_sorted]
    ci_upper = [np.percentile(bootstrap_scores[m].get('AUC', [0]), 97.5) for m in models_sorted]
    
    ax.barh(y_pos, means, color='steelblue', alpha=0.7)
    ax.errorbar(means, y_pos, xerr=[np.array(means)-np.array(ci_lower), 
                                     np.array(ci_upper)-np.array(means)],
                fmt='none', color='red', capsize=3, capthick=1.5, linewidth=1.5)
    
    ax.set_yticks(y_pos)
    ax.set_yticklabels(models_sorted)
    ax.set_xlabel('AUC-ROC', fontsize=12)
    ax.set_title('Bootstrap Validation: Model Performance with 95% CI', fontsize=14, fontweight='bold')
    ax.grid(axis='x', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(FIGURES_PATH / "bootstrap_ci_comparison.png", dpi=300, bbox_inches='tight')
    plt.savefig(FIGURES_PATH / "bootstrap_ci_comparison.tiff", dpi=300, bbox_inches='tight')
    plt.close()
    
    print("  Saved: bootstrap_auc_distributions.png/tiff")
    print("  Saved: bootstrap_ci_comparison.png/tiff")

# ============================================================================
# TASK 6: Nested Cross-Validation
# ============================================================================
def task6_nested_cv(X, y, models):
    """
    Nested Cross-Validation with outer 5-fold and inner 3-fold.
    
    Scientific Justification:
    Nested CV provides unbiased performance estimates even when hyperparameter 
    tuning is performed, preventing optimistic bias from information leakage. 
    This is the gold standard for model selection in clinical ML.
    """
    print("\n" + "="*70)
    print("TASK 6: Nested Cross-Validation")
    print("="*70)
    print("Outer loop: 5-fold | Inner loop: 3-fold")
    print("Scientific Justification: Unbiased estimates, gold standard for clinical ML")
    
    outer_cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    inner_cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    
    results = []
    
    # Simple hyperparameter grids (reduced for efficiency)
    param_grids = {
        'LogisticRegression': {'C': [0.1, 1, 10]},
        'SVM': {'C': [0.1, 1, 10]},
        'RandomForest': {'n_estimators': [50, 100], 'max_depth': [5, 10]},
        'GradientBoosting': {'n_estimators': [50, 100], 'max_depth': [3, 5]},
        'XGBoost': {'n_estimators': [50, 100], 'max_depth': [3, 5]},
        'LightGBM': {'n_estimators': [50, 100], 'max_depth': [3, 5]},
        'CatBoost': {'iterations': [50, 100], 'depth': [4, 6]},
        'KNN': {'n_neighbors': [3, 5, 7]},
        'NaiveBayes': {},
        'DecisionTree': {'max_depth': [5, 10, 15]},
        'ExtraTrees': {'n_estimators': [50, 100], 'max_depth': [5, 10]},
        'MLP': {'hidden_layer_sizes': [(50,), (100,)]},
        'TabNet': {'hidden_layer_sizes': [(50,), (100,)]},  # MLP placeholder
        'VotingEnsemble': {},
        'StackingEnsemble': {}
    }
    
    for model_name, model in tqdm(models.items(), desc="Nested CV"):
        nested_scores = []
        standard_scores = []
        
        for fold_idx, (train_idx, test_idx) in enumerate(outer_cv.split(X, y)):
            X_train, X_test = X[train_idx], X[test_idx]
            y_train, y_test = y[train_idx], y[test_idx]
            
            try:
                # Inner CV for hyperparameter tuning
                param_grid = param_grids.get(model_name, {})
                
                if param_grid:
                    grid_search = GridSearchCV(
                        clone(model), param_grid, cv=inner_cv, 
                        scoring='roc_auc', n_jobs=-1
                    )
                    grid_search.fit(X_train, y_train)
                    best_model = grid_search.best_estimator_
                else:
                    best_model = clone(model)
                    best_model.fit(X_train, y_train)
                
                # Evaluate on outer test set
                if hasattr(best_model, 'predict_proba'):
                    y_prob = best_model.predict_proba(X_test)[:, 1]
                else:
                    y_prob = best_model.decision_function(X_test)
                
                nested_auc = roc_auc_score(y_test, y_prob)
                nested_scores.append(nested_auc)
                
                # Standard CV for comparison (without inner tuning)
                standard_model = clone(model)
                standard_model.fit(X_train, y_train)
                if hasattr(standard_model, 'predict_proba'):
                    y_prob_std = standard_model.predict_proba(X_test)[:, 1]
                else:
                    y_prob_std = standard_model.decision_function(X_test)
                standard_scores.append(roc_auc_score(y_test, y_prob_std))
                
            except Exception as e:
                print(f"  Error with {model_name}: {e}")
                continue
        
        if nested_scores:
            nested_mean = np.mean(nested_scores)
            nested_std = np.std(nested_scores)
            standard_mean = np.mean(standard_scores)
            standard_std = np.std(standard_scores)
            optimistic_bias = standard_mean - nested_mean
            
            results.append({
                'Model': model_name,
                'Nested_CV_AUC_Mean': nested_mean,
                'Nested_CV_AUC_Std': nested_std,
                'Standard_CV_AUC_Mean': standard_mean,
                'Standard_CV_AUC_Std': standard_std,
                'Optimistic_Bias': optimistic_bias,
                'Bias_Percentage': (optimistic_bias / nested_mean) * 100 if nested_mean > 0 else 0
            })
    
    results_df = pd.DataFrame(results)
    results_df.to_csv(RESULTS_PATH / "nested_cv_results.csv", index=False)
    print(f"\nSaved: nested_cv_results.csv")
    
    # Generate plots
    generate_nested_cv_plots(results_df)
    
    return results_df

def generate_nested_cv_plots(results_df):
    """Generate Nested vs Standard CV comparison plots."""
    print("Generating Nested CV plots...")
    
    fig, axes = plt.subplots(1, 2, figsize=(16, 6))
    
    # Plot 1: Nested vs Standard CV Comparison
    ax1 = axes[0]
    models = results_df['Model'].values
    x = np.arange(len(models))
    width = 0.35
    
    ax1.bar(x - width/2, results_df['Nested_CV_AUC_Mean'], width, 
            label='Nested CV', color='steelblue', alpha=0.8,
            yerr=results_df['Nested_CV_AUC_Std'], capsize=3)
    ax1.bar(x + width/2, results_df['Standard_CV_AUC_Mean'], width,
            label='Standard CV', color='coral', alpha=0.8,
            yerr=results_df['Standard_CV_AUC_Std'], capsize=3)
    
    ax1.set_xlabel('Model', fontsize=11)
    ax1.set_ylabel('AUC-ROC', fontsize=11)
    ax1.set_title('Nested vs Standard Cross-Validation', fontsize=12, fontweight='bold')
    ax1.set_xticks(x)
    ax1.set_xticklabels(models, rotation=45, ha='right', fontsize=8)
    ax1.legend()
    ax1.grid(axis='y', alpha=0.3)
    
    # Plot 2: Optimistic Bias
    ax2 = axes[1]
    colors = ['red' if b > 0.02 else 'green' for b in results_df['Optimistic_Bias']]
    ax2.barh(models, results_df['Optimistic_Bias'], color=colors, alpha=0.7)
    ax2.axvline(0, color='black', linestyle='-', linewidth=0.5)
    ax2.axvline(0.02, color='red', linestyle='--', linewidth=1, label='Significant Bias Threshold')
    ax2.set_xlabel('Optimistic Bias (Standard - Nested)', fontsize=11)
    ax2.set_title('Optimistic Bias Detection', fontsize=12, fontweight='bold')
    ax2.legend(loc='lower right')
    ax2.grid(axis='x', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(FIGURES_PATH / "nested_cv_comparison.png", dpi=300, bbox_inches='tight')
    plt.savefig(FIGURES_PATH / "nested_cv_comparison.tiff", dpi=300, bbox_inches='tight')
    plt.close()
    
    print("  Saved: nested_cv_comparison.png/tiff")

# ============================================================================
# TASK 7: Overfitting Detection
# ============================================================================
def task7_overfitting_detection(X, y, models):
    """
    Calculate training vs test performance and detect overfitting.
    
    Scientific Justification:
    Overfitting detection ensures models generalize to unseen data. In clinical 
    settings, overfit models may perform poorly on new patients, leading to 
    incorrect predictions.
    """
    print("\n" + "="*70)
    print("TASK 7: Overfitting Detection")
    print("="*70)
    print("Calculating training vs test performance")
    print("Overfitting threshold: ratio > 0.05")
    print("Scientific Justification: Ensures generalization for clinical use")
    
    from sklearn.model_selection import train_test_split
    
    results = []
    overfit_models = []
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    for model_name, model in tqdm(models.items(), desc="Overfitting Detection"):
        try:
            model_clone = clone(model)
            model_clone.fit(X_train, y_train)
            
            # Training performance
            if hasattr(model_clone, 'predict_proba'):
                train_prob = model_clone.predict_proba(X_train)[:, 1]
                test_prob = model_clone.predict_proba(X_test)[:, 1]
            else:
                train_prob = model_clone.decision_function(X_train)
                test_prob = model_clone.decision_function(X_test)
            
            train_auc = roc_auc_score(y_train, train_prob)
            test_auc = roc_auc_score(y_test, test_prob)
            
            train_pred = model_clone.predict(X_train)
            test_pred = model_clone.predict(X_test)
            
            train_acc = accuracy_score(y_train, train_pred)
            test_acc = accuracy_score(y_test, test_pred)
            
            train_f1 = f1_score(y_train, train_pred)
            test_f1 = f1_score(y_test, test_pred)
            
            # Calculate overfitting ratios
            auc_ratio = (train_auc - test_auc) / train_auc if train_auc > 0 else 0
            acc_ratio = (train_acc - test_acc) / train_acc if train_acc > 0 else 0
            f1_ratio = (train_f1 - test_f1) / train_f1 if train_f1 > 0 else 0
            
            is_overfit = auc_ratio > 0.05 or acc_ratio > 0.05
            
            result = {
                'Model': model_name,
                'Train_AUC': train_auc,
                'Test_AUC': test_auc,
                'AUC_Overfit_Ratio': auc_ratio,
                'Train_Accuracy': train_acc,
                'Test_Accuracy': test_acc,
                'Accuracy_Overfit_Ratio': acc_ratio,
                'Train_F1': train_f1,
                'Test_F1': test_f1,
                'F1_Overfit_Ratio': f1_ratio,
                'Is_Overfit': is_overfit,
                'Recommendation': 'Increase regularization' if is_overfit else 'OK'
            }
            results.append(result)
            
            if is_overfit:
                overfit_models.append(model_name)
                
        except Exception as e:
            print(f"  Error with {model_name}: {e}")
    
    results_df = pd.DataFrame(results)
    results_df.to_csv(RESULTS_PATH / "overfitting_analysis.csv", index=False)
    print(f"\nSaved: overfitting_analysis.csv")
    
    if overfit_models:
        print(f"\n⚠️ Overfitting detected in: {overfit_models}")
        print("Adjusting regularization for overfit models...")
        results_df = adjust_regularization(X, y, models, overfit_models, results_df)
    
    # Generate plots
    generate_overfitting_plots(results_df)
    
    return results_df

def adjust_regularization(X, y, models, overfit_models, original_results):
    """Adjust regularization for overfit models and retrain."""
    print("\nAdjusting regularization parameters...")
    
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    adjusted_results = []
    
    for model_name in overfit_models:
        model = models[model_name]
        
        try:
            # Adjust based on model type
            adjusted_model = clone(model)
            
            if hasattr(adjusted_model, 'C'):  # SVM, LogisticRegression
                adjusted_model.set_params(C=adjusted_model.C * 0.1)
            elif hasattr(adjusted_model, 'max_depth') and adjusted_model.max_depth:
                adjusted_model.set_params(max_depth=max(3, adjusted_model.max_depth - 3))
            elif hasattr(adjusted_model, 'n_estimators'):
                adjusted_model.set_params(n_estimators=max(50, adjusted_model.n_estimators // 2))
            elif hasattr(adjusted_model, 'alpha'):
                adjusted_model.set_params(alpha=adjusted_model.alpha * 2)
            
            adjusted_model.fit(X_train, y_train)
            
            if hasattr(adjusted_model, 'predict_proba'):
                test_prob = adjusted_model.predict_proba(X_test)[:, 1]
                train_prob = adjusted_model.predict_proba(X_train)[:, 1]
            else:
                test_prob = adjusted_model.decision_function(X_test)
                train_prob = adjusted_model.decision_function(X_train)
            
            new_train_auc = roc_auc_score(y_train, train_prob)
            new_test_auc = roc_auc_score(y_test, test_prob)
            new_ratio = (new_train_auc - new_test_auc) / new_train_auc
            
            adjusted_results.append({
                'Model': model_name,
                'Original_Train_AUC': original_results[original_results['Model']==model_name]['Train_AUC'].values[0],
                'Original_Test_AUC': original_results[original_results['Model']==model_name]['Test_AUC'].values[0],
                'Original_Overfit_Ratio': original_results[original_results['Model']==model_name]['AUC_Overfit_Ratio'].values[0],
                'Adjusted_Train_AUC': new_train_auc,
                'Adjusted_Test_AUC': new_test_auc,
                'Adjusted_Overfit_Ratio': new_ratio,
                'Adjustment': 'Increased regularization',
                'Status': 'Fixed' if new_ratio <= 0.05 else 'Still overfit'
            })
            
            # Save adjusted model
            joblib.dump(adjusted_model, MODELS_PATH / f"{model_name}_adjusted.joblib")
            
        except Exception as e:
            print(f"  Could not adjust {model_name}: {e}")
    
    if adjusted_results:
        adj_df = pd.DataFrame(adjusted_results)
        adj_df.to_csv(RESULTS_PATH / "overfitting_adjustments.csv", index=False)
        print("Saved: overfitting_adjustments.csv")
    
    return original_results

def generate_overfitting_plots(results_df):
    """Generate overfitting detection plots."""
    print("Generating overfitting plots...")
    
    fig, axes = plt.subplots(1, 2, figsize=(16, 6))
    
    # Plot 1: Train vs Test AUC
    ax1 = axes[0]
    models = results_df['Model'].values
    x = np.arange(len(models))
    width = 0.35
    
    colors_train = ['lightcoral' if o else 'lightblue' for o in results_df['Is_Overfit']]
    colors_test = ['darkred' if o else 'steelblue' for o in results_df['Is_Overfit']]
    
    ax1.bar(x - width/2, results_df['Train_AUC'], width, label='Train', color='lightblue', edgecolor='steelblue')
    ax1.bar(x + width/2, results_df['Test_AUC'], width, label='Test', color='steelblue', edgecolor='darkblue')
    
    ax1.set_xlabel('Model', fontsize=11)
    ax1.set_ylabel('AUC-ROC', fontsize=11)
    ax1.set_title('Training vs Test Performance', fontsize=12, fontweight='bold')
    ax1.set_xticks(x)
    ax1.set_xticklabels(models, rotation=45, ha='right', fontsize=8)
    ax1.legend()
    ax1.grid(axis='y', alpha=0.3)
    
    # Plot 2: Overfitting Ratio
    ax2 = axes[1]
    colors = ['red' if r > 0.05 else 'green' for r in results_df['AUC_Overfit_Ratio']]
    ax2.barh(models, results_df['AUC_Overfit_Ratio'], color=colors, alpha=0.7)
    ax2.axvline(0.05, color='red', linestyle='--', linewidth=2, label='Overfitting Threshold (0.05)')
    ax2.axvline(0, color='black', linestyle='-', linewidth=0.5)
    ax2.set_xlabel('Overfitting Ratio', fontsize=11)
    ax2.set_title('Overfitting Detection: AUC Ratio', fontsize=12, fontweight='bold')
    ax2.legend(loc='lower right')
    ax2.grid(axis='x', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(FIGURES_PATH / "overfitting_analysis.png", dpi=300, bbox_inches='tight')
    plt.savefig(FIGURES_PATH / "overfitting_analysis.tiff", dpi=300, bbox_inches='tight')
    plt.close()
    
    print("  Saved: overfitting_analysis.png/tiff")

# ============================================================================
# TASK 8: Learning Curves
# ============================================================================
def task8_learning_curves(X, y, models):
    """
    Generate learning curves for all models.
    
    Scientific Justification:
    Learning curves reveal whether models benefit from more data (high variance) 
    or need more complexity (high bias). This guides future data collection 
    and model selection decisions.
    """
    print("\n" + "="*70)
    print("TASK 8: Learning Curves")
    print("="*70)
    print("Training sizes: 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 100%")
    print("Scientific Justification: Reveals bias-variance tradeoff")
    
    train_sizes = np.linspace(0.1, 1.0, 10)
    
    results = []
    all_curves = {}
    
    for model_name, model in tqdm(models.items(), desc="Learning Curves"):
        try:
            train_sizes_abs, train_scores, val_scores = learning_curve(
                clone(model), X, y, 
                train_sizes=train_sizes,
                cv=5, scoring='roc_auc',
                n_jobs=-1, random_state=42
            )
            
            all_curves[model_name] = {
                'train_sizes': train_sizes_abs.tolist(),
                'train_scores_mean': np.mean(train_scores, axis=1).tolist(),
                'train_scores_std': np.std(train_scores, axis=1).tolist(),
                'val_scores_mean': np.mean(val_scores, axis=1).tolist(),
                'val_scores_std': np.std(val_scores, axis=1).tolist()
            }
            
            # Determine pattern
            train_final = np.mean(train_scores[-1])
            val_final = np.mean(val_scores[-1])
            gap = train_final - val_final
            
            if gap > 0.1:
                pattern = 'High Variance (Overfitting)'
            elif val_final < 0.7:
                pattern = 'High Bias (Underfitting)'
            else:
                pattern = 'Good Fit'
            
            for i, size in enumerate(train_sizes_abs):
                results.append({
                    'Model': model_name,
                    'Train_Size': size,
                    'Train_Size_Pct': train_sizes[i] * 100,
                    'Train_AUC_Mean': np.mean(train_scores[i]),
                    'Train_AUC_Std': np.std(train_scores[i]),
                    'Val_AUC_Mean': np.mean(val_scores[i]),
                    'Val_AUC_Std': np.std(val_scores[i]),
                    'Pattern': pattern
                })
                
        except Exception as e:
            print(f"  Error with {model_name}: {e}")
    
    results_df = pd.DataFrame(results)
    results_df.to_csv(RESULTS_PATH / "learning_curves_data.csv", index=False)
    print(f"\nSaved: learning_curves_data.csv")
    
    # Generate plots
    generate_learning_curve_plots(all_curves)
    
    return results_df, all_curves

def generate_learning_curve_plots(all_curves):
    """Generate learning curve plots for all models."""
    print("Generating learning curve plots...")
    
    # Individual model plots (combined figure)
    n_models = len(all_curves)
    n_cols = 5
    n_rows = (n_models + n_cols - 1) // n_cols
    
    fig, axes = plt.subplots(n_rows, n_cols, figsize=(20, 4*n_rows))
    axes = axes.flatten()
    
    for idx, (model_name, curves) in enumerate(all_curves.items()):
        ax = axes[idx]
        
        train_sizes = np.array(curves['train_sizes'])
        train_mean = np.array(curves['train_scores_mean'])
        train_std = np.array(curves['train_scores_std'])
        val_mean = np.array(curves['val_scores_mean'])
        val_std = np.array(curves['val_scores_std'])
        
        ax.fill_between(train_sizes, train_mean - train_std, train_mean + train_std, 
                        alpha=0.2, color='blue')
        ax.fill_between(train_sizes, val_mean - val_std, val_mean + val_std,
                        alpha=0.2, color='orange')
        ax.plot(train_sizes, train_mean, 'o-', color='blue', label='Training')
        ax.plot(train_sizes, val_mean, 'o-', color='orange', label='Validation')
        
        ax.set_xlabel('Training Size')
        ax.set_ylabel('AUC-ROC')
        ax.set_title(f'{model_name}', fontsize=10)
        ax.legend(loc='lower right', fontsize=8)
        ax.grid(alpha=0.3)
        ax.set_ylim([0.5, 1.05])
    
    # Hide unused axes
    for idx in range(len(all_curves), len(axes)):
        axes[idx].set_visible(False)
    
    plt.suptitle('Learning Curves for All Models', fontsize=14, fontweight='bold')
    plt.tight_layout(rect=[0, 0, 1, 0.97])
    plt.savefig(FIGURES_PATH / "learning_curves_all_models.png", dpi=300, bbox_inches='tight')
    plt.savefig(FIGURES_PATH / "learning_curves_all_models.tiff", dpi=300, bbox_inches='tight')
    plt.close()
    
    print("  Saved: learning_curves_all_models.png/tiff")
    
    # Summary pattern plot
    fig, ax = plt.subplots(figsize=(12, 6))
    
    final_gaps = []
    model_names = []
    for model_name, curves in all_curves.items():
        gap = curves['train_scores_mean'][-1] - curves['val_scores_mean'][-1]
        final_gaps.append(gap)
        model_names.append(model_name)
    
    sorted_idx = np.argsort(final_gaps)
    model_names = [model_names[i] for i in sorted_idx]
    final_gaps = [final_gaps[i] for i in sorted_idx]
    
    colors = ['red' if g > 0.1 else 'orange' if g > 0.05 else 'green' for g in final_gaps]
    ax.barh(model_names, final_gaps, color=colors, alpha=0.7)
    ax.axvline(0.1, color='red', linestyle='--', linewidth=2, label='High Variance Threshold')
    ax.axvline(0.05, color='orange', linestyle='--', linewidth=2, label='Moderate Gap')
    ax.set_xlabel('Training-Validation Gap', fontsize=11)
    ax.set_title('Model Bias-Variance Profile', fontsize=12, fontweight='bold')
    ax.legend(loc='lower right')
    ax.grid(axis='x', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(FIGURES_PATH / "learning_curves_bias_variance.png", dpi=300, bbox_inches='tight')
    plt.savefig(FIGURES_PATH / "learning_curves_bias_variance.tiff", dpi=300, bbox_inches='tight')
    plt.close()
    
    print("  Saved: learning_curves_bias_variance.png/tiff")

# ============================================================================
# MAIN EXECUTION
# ============================================================================
def main():
    """Main execution function."""
    print("="*70)
    print("NOA ML Project - Phase 4 Part 2: Tasks 5-8")
    print(f"Execution Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*70)
    
    # Load data and models
    X, y = load_data()
    models = load_models()
    
    # Execute tasks
    results = {}
    
    # Task 5: Bootstrap Validation
    bootstrap_results, bootstrap_scores = task5_bootstrap_validation(X, y, models)
    results['bootstrap'] = bootstrap_results
    
    # Task 6: Nested CV
    nested_results = task6_nested_cv(X, y, models)
    results['nested_cv'] = nested_results
    
    # Task 7: Overfitting Detection
    overfit_results = task7_overfitting_detection(X, y, models)
    results['overfitting'] = overfit_results
    
    # Task 8: Learning Curves
    learning_results, learning_curves = task8_learning_curves(X, y, models)
    results['learning_curves'] = learning_results
    
    # Summary
    summary = {
        'execution_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'n_samples': int(len(y)),
        'n_features': int(X.shape[1]),
        'n_models': len(models),
        'tasks_completed': ['Task5_Bootstrap', 'Task6_NestedCV', 'Task7_Overfitting', 'Task8_LearningCurves'],
        'output_files': [
            'bootstrap_validation_results.csv',
            'nested_cv_results.csv',
            'overfitting_analysis.csv',
            'learning_curves_data.csv'
        ],
        'figures': [
            'bootstrap_auc_distributions.png/tiff',
            'bootstrap_ci_comparison.png/tiff',
            'nested_cv_comparison.png/tiff',
            'overfitting_analysis.png/tiff',
            'learning_curves_all_models.png/tiff',
            'learning_curves_bias_variance.png/tiff'
        ]
    }
    
    with open(RESULTS_PATH / "phase4_part2_summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    print("\n" + "="*70)
    print("Phase 4 Part 2 Complete!")
    print("="*70)
    print(f"Results saved to: {RESULTS_PATH}")
    print(f"Figures saved to: {FIGURES_PATH}")
    
    return results

if __name__ == "__main__":
    main()
