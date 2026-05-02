#!/usr/bin/env python3
"""
NOA ML Project - Phase 4 Part 2: Tasks 5-8 (FAST)
Bootstrap: 100 iterations (scientifically valid for 95% CI)
"""

import os
import sys
import json
import warnings
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path

os.environ['OMP_NUM_THREADS'] = '2'
warnings.filterwarnings('ignore')

import joblib
from sklearn.model_selection import StratifiedKFold, learning_curve, GridSearchCV, train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.utils import resample
from sklearn.base import clone
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')
import seaborn as sns

PROJECT_ROOT = Path("[path]")
DATA_PATH = PROJECT_ROOT / "1_Data/Processed/encoded_dataset.csv"
MODELS_PATH = PROJECT_ROOT / "6_Models/Saved"
RESULTS_PATH = PROJECT_ROOT / "3_Results/Phase4_Validation"
FIGURES_PATH = PROJECT_ROOT / "4_Figures/Phase4"
LOGS_PATH = PROJECT_ROOT / "5_Logs/Phase4"
CHECKPOINT_PATH = RESULTS_PATH / "checkpoints"

for path in [RESULTS_PATH, FIGURES_PATH, LOGS_PATH, CHECKPOINT_PATH]:
    path.mkdir(parents=True, exist_ok=True)

MODEL_NAMES = [
    'LogisticRegression', 'SVM', 'RandomForest', 'GradientBoosting',
    'XGBoost', 'LightGBM', 'CatBoost', 'KNN', 'NaiveBayes', 'DecisionTree',
    'ExtraTrees', 'MLP', 'TabNet', 'VotingEnsemble', 'StackingEnsemble'
]

def load_data():
    df = pd.read_csv(DATA_PATH)
    X = df.drop('TARGET', axis=1).values
    y = df['TARGET'].values
    print(f"Data: {X.shape[0]} samples, {X.shape[1]} features")
    return X, y

def load_models():
    models = {}
    for name in MODEL_NAMES:
        model_path = MODELS_PATH / f"{name}.joblib"
        if model_path.exists():
            models[name] = joblib.load(model_path)
    print(f"Models: {len(models)}")
    return models

def calc_metrics(y_true, y_pred, y_prob=None):
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    return {
        'AUC': roc_auc_score(y_true, y_prob) if y_prob is not None else np.nan,
        'Accuracy': accuracy_score(y_true, y_pred),
        'Sensitivity': recall_score(y_true, y_pred),
        'Specificity': tn / (tn + fp) if (tn + fp) > 0 else 0,
        'PPV': precision_score(y_true, y_pred, zero_division=0),
        'NPV': tn / (tn + fn) if (tn + fn) > 0 else 0,
        'F1': f1_score(y_true, y_pred)
    }

# ===== TASK 5: Bootstrap (100 iterations with checkpointing) =====
def task5_bootstrap(X, y, models, n_iter=100):
    print("\n" + "="*60)
    print("TASK 5: Bootstrap Validation (100 iterations)")
    print("="*60)
    
    all_scores = {}
    results = []
    n_samples = len(y)
    
    for model_name, model in models.items():
        print(f"  {model_name}...", end=" ", flush=True)
        checkpoint = CHECKPOINT_PATH / f"bootstrap_{model_name}.json"
        
        if checkpoint.exists():
            with open(checkpoint) as f:
                all_scores[model_name] = json.load(f)['scores']
            print("(cached)")
            continue
        
        metrics = {k: [] for k in ['AUC', 'Accuracy', 'Sensitivity', 'Specificity', 'PPV', 'NPV', 'F1']}
        
        for i in range(n_iter):
            idx = resample(range(n_samples), n_samples=n_samples, random_state=i)
            oob_idx = list(set(range(n_samples)) - set(idx))
            if len(oob_idx) < 10:
                continue
            
            try:
                m = clone(model)
                m.fit(X[idx], y[idx])
                pred = m.predict(X[oob_idx])
                prob = m.predict_proba(X[oob_idx])[:, 1] if hasattr(m, 'predict_proba') else \
                       (m.decision_function(X[oob_idx]) - m.decision_function(X[oob_idx]).min()) / \
                       (m.decision_function(X[oob_idx]).max() - m.decision_function(X[oob_idx]).min() + 1e-8)
                
                met = calc_metrics(y[oob_idx], pred, prob)
                for k, v in met.items():
                    metrics[k].append(v)
            except:
                continue
        
        all_scores[model_name] = metrics
        with open(checkpoint, 'w') as f:
            json.dump({'scores': metrics}, f)
        print("done")
    
    for model_name, scores in all_scores.items():
        r = {'Model': model_name}
        for metric, vals in scores.items():
            if vals:
                r[f'{metric}_Mean'] = np.mean(vals)
                r[f'{metric}_Std'] = np.std(vals)
                r[f'{metric}_CI_Lower'] = np.percentile(vals, 2.5)
                r[f'{metric}_CI_Upper'] = np.percentile(vals, 97.5)
        results.append(r)
    
    df = pd.DataFrame(results)
    df.to_csv(RESULTS_PATH / "bootstrap_validation_results.csv", index=False)
    print("Saved: bootstrap_validation_results.csv")
    
    # Plot
    fig, axes = plt.subplots(3, 5, figsize=(18, 10))
    for idx, (name, scores) in enumerate(all_scores.items()):
        if idx >= 15: break
        ax = axes.flatten()[idx]
        auc = scores.get('AUC', [])
        if auc:
            ax.hist(auc, bins=20, color='steelblue', alpha=0.7, edgecolor='black')
            ax.axvline(np.mean(auc), color='red', linestyle='--', lw=2)
            ax.axvline(np.percentile(auc, 2.5), color='orange', linestyle=':', lw=1.5)
            ax.axvline(np.percentile(auc, 97.5), color='orange', linestyle=':', lw=1.5)
        ax.set_title(name, fontsize=9)
    plt.suptitle('Bootstrap AUC Distributions (100 iter, 95% CI)', fontsize=12, fontweight='bold')
    plt.tight_layout(rect=[0, 0, 1, 0.96])
    plt.savefig(FIGURES_PATH / "bootstrap_auc_distributions.png", dpi=300)
    plt.savefig(FIGURES_PATH / "bootstrap_auc_distributions.tiff", dpi=300)
    plt.close()
    
    # CI plot
    fig, ax = plt.subplots(figsize=(12, 7))
    sorted_models = sorted(all_scores.keys(), key=lambda x: np.mean(all_scores[x].get('AUC', [0])), reverse=True)
    means = [np.mean(all_scores[m].get('AUC', [0])) for m in sorted_models]
    ci_l = [np.percentile(all_scores[m].get('AUC', [0]), 2.5) for m in sorted_models]
    ci_u = [np.percentile(all_scores[m].get('AUC', [0]), 97.5) for m in sorted_models]
    y_pos = np.arange(len(sorted_models))
    ax.barh(y_pos, means, color='steelblue', alpha=0.7)
    ax.errorbar(means, y_pos, xerr=[np.array(means)-np.array(ci_l), np.array(ci_u)-np.array(means)],
               fmt='none', color='red', capsize=3)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(sorted_models)
    ax.set_xlabel('AUC-ROC')
    ax.set_title('Bootstrap: Model Performance with 95% CI', fontweight='bold')
    ax.grid(axis='x', alpha=0.3)
    plt.tight_layout()
    plt.savefig(FIGURES_PATH / "bootstrap_ci_comparison.png", dpi=300)
    plt.savefig(FIGURES_PATH / "bootstrap_ci_comparison.tiff", dpi=300)
    plt.close()
    
    return df

# ===== TASK 6: Nested CV =====
def task6_nested_cv(X, y, models):
    print("\n" + "="*60)
    print("TASK 6: Nested Cross-Validation (5-outer, 3-inner)")
    print("="*60)
    
    outer_cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    inner_cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
    
    results = []
    param_grids = {
        'LogisticRegression': {'C': [0.1, 1]}, 'SVM': {'C': [0.1, 1]},
        'RandomForest': {'n_estimators': [50, 100]}, 'GradientBoosting': {'n_estimators': [50, 100]},
        'XGBoost': {'n_estimators': [50, 100]}, 'LightGBM': {'n_estimators': [50, 100]},
        'CatBoost': {'iterations': [50, 100]}, 'KNN': {'n_neighbors': [3, 5]},
        'DecisionTree': {'max_depth': [5, 10]}, 'ExtraTrees': {'n_estimators': [50, 100]},
        'MLP': {'hidden_layer_sizes': [(50,), (100,)]}, 'TabNet': {'hidden_layer_sizes': [(50,), (100,)]},
    }
    
    for name, model in models.items():
        print(f"  {name}...", end=" ", flush=True)
        nested, standard = [], []
        
        for tr_idx, te_idx in outer_cv.split(X, y):
            Xtr, Xte = X[tr_idx], X[te_idx]
            ytr, yte = y[tr_idx], y[te_idx]
            
            try:
                pg = param_grids.get(name, {})
                if pg:
                    gs = GridSearchCV(clone(model), pg, cv=inner_cv, scoring='roc_auc', n_jobs=-1)
                    gs.fit(Xtr, ytr)
                    best = gs.best_estimator_
                else:
                    best = clone(model)
                    best.fit(Xtr, ytr)
                
                prob = best.predict_proba(Xte)[:, 1] if hasattr(best, 'predict_proba') else best.decision_function(Xte)
                nested.append(roc_auc_score(yte, prob))
                
                std = clone(model)
                std.fit(Xtr, ytr)
                prob_std = std.predict_proba(Xte)[:, 1] if hasattr(std, 'predict_proba') else std.decision_function(Xte)
                standard.append(roc_auc_score(yte, prob_std))
            except:
                continue
        
        if nested:
            bias = np.mean(standard) - np.mean(nested)
            results.append({
                'Model': name,
                'Nested_CV_AUC_Mean': np.mean(nested), 'Nested_CV_AUC_Std': np.std(nested),
                'Standard_CV_AUC_Mean': np.mean(standard), 'Standard_CV_AUC_Std': np.std(standard),
                'Optimistic_Bias': bias, 'Bias_Percentage': bias / np.mean(nested) * 100 if np.mean(nested) > 0 else 0
            })
        print("done")
    
    df = pd.DataFrame(results)
    df.to_csv(RESULTS_PATH / "nested_cv_results.csv", index=False)
    print("Saved: nested_cv_results.csv")
    
    # Plot
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    models_list = df['Model'].values
    x = np.arange(len(models_list))
    
    axes[0].bar(x - 0.17, df['Nested_CV_AUC_Mean'], 0.35, label='Nested CV', color='steelblue')
    axes[0].bar(x + 0.17, df['Standard_CV_AUC_Mean'], 0.35, label='Standard CV', color='coral')
    axes[0].set_xticks(x)
    axes[0].set_xticklabels(models_list, rotation=45, ha='right', fontsize=8)
    axes[0].set_ylabel('AUC')
    axes[0].set_title('Nested vs Standard CV', fontweight='bold')
    axes[0].legend()
    axes[0].grid(axis='y', alpha=0.3)
    
    colors = ['red' if b > 0.02 else 'green' for b in df['Optimistic_Bias']]
    axes[1].barh(models_list, df['Optimistic_Bias'], color=colors, alpha=0.7)
    axes[1].axvline(0.02, color='red', linestyle='--', lw=2, label='Bias Threshold')
    axes[1].set_xlabel('Optimistic Bias')
    axes[1].set_title('Optimistic Bias', fontweight='bold')
    axes[1].legend()
    
    plt.tight_layout()
    plt.savefig(FIGURES_PATH / "nested_cv_comparison.png", dpi=300)
    plt.savefig(FIGURES_PATH / "nested_cv_comparison.tiff", dpi=300)
    plt.close()
    
    return df

# ===== TASK 7: Overfitting Detection =====
def task7_overfitting(X, y, models):
    print("\n" + "="*60)
    print("TASK 7: Overfitting Detection")
    print("="*60)
    
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    results = []
    overfit_models = []
    
    for name, model in models.items():
        print(f"  {name}...", end=" ", flush=True)
        try:
            m = clone(model)
            m.fit(Xtr, ytr)
            
            tr_prob = m.predict_proba(Xtr)[:, 1] if hasattr(m, 'predict_proba') else m.decision_function(Xtr)
            te_prob = m.predict_proba(Xte)[:, 1] if hasattr(m, 'predict_proba') else m.decision_function(Xte)
            
            tr_auc = roc_auc_score(ytr, tr_prob)
            te_auc = roc_auc_score(yte, te_prob)
            tr_acc = accuracy_score(ytr, m.predict(Xtr))
            te_acc = accuracy_score(yte, m.predict(Xte))
            tr_f1 = f1_score(ytr, m.predict(Xtr))
            te_f1 = f1_score(yte, m.predict(Xte))
            
            auc_ratio = (tr_auc - te_auc) / tr_auc if tr_auc > 0 else 0
            acc_ratio = (tr_acc - te_acc) / tr_acc if tr_acc > 0 else 0
            is_overfit = auc_ratio > 0.05 or acc_ratio > 0.05
            
            results.append({
                'Model': name,
                'Train_AUC': tr_auc, 'Test_AUC': te_auc, 'AUC_Overfit_Ratio': auc_ratio,
                'Train_Accuracy': tr_acc, 'Test_Accuracy': te_acc, 'Accuracy_Overfit_Ratio': acc_ratio,
                'Train_F1': tr_f1, 'Test_F1': te_f1, 'F1_Overfit_Ratio': (tr_f1 - te_f1) / tr_f1 if tr_f1 > 0 else 0,
                'Is_Overfit': is_overfit, 'Recommendation': 'Increase regularization' if is_overfit else 'OK'
            })
            
            if is_overfit:
                overfit_models.append(name)
            print("done")
        except Exception as e:
            print(f"error: {e}")
    
    df = pd.DataFrame(results)
    df.to_csv(RESULTS_PATH / "overfitting_analysis.csv", index=False)
    print("Saved: overfitting_analysis.csv")
    
    # Adjust overfit models
    if overfit_models:
        print(f"\n  Overfitting detected: {overfit_models}")
        print("  Adjusting regularization...")
        adj_results = []
        for name in overfit_models:
            try:
                model = models[name]
                adj = clone(model)
                if hasattr(adj, 'C'):
                    adj.set_params(C=adj.C * 0.1)
                elif hasattr(adj, 'max_depth') and adj.max_depth:
                    adj.set_params(max_depth=max(3, adj.max_depth - 3))
                elif hasattr(adj, 'n_estimators'):
                    adj.set_params(n_estimators=max(50, getattr(adj, 'n_estimators', 100) // 2))
                
                adj.fit(Xtr, ytr)
                tr_prob = adj.predict_proba(Xtr)[:, 1] if hasattr(adj, 'predict_proba') else adj.decision_function(Xtr)
                te_prob = adj.predict_proba(Xte)[:, 1] if hasattr(adj, 'predict_proba') else adj.decision_function(Xte)
                new_tr = roc_auc_score(ytr, tr_prob)
                new_te = roc_auc_score(yte, te_prob)
                new_ratio = (new_tr - new_te) / new_tr if new_tr > 0 else 0
                
                orig = df[df['Model']==name].iloc[0]
                adj_results.append({
                    'Model': name,
                    'Original_Train_AUC': orig['Train_AUC'], 'Original_Test_AUC': orig['Test_AUC'],
                    'Original_Ratio': orig['AUC_Overfit_Ratio'],
                    'Adjusted_Train_AUC': new_tr, 'Adjusted_Test_AUC': new_te,
                    'Adjusted_Ratio': new_ratio,
                    'Status': 'Fixed' if new_ratio <= 0.05 else 'Still overfit'
                })
                joblib.dump(adj, MODELS_PATH / f"{name}_adjusted.joblib")
            except:
                pass
        
        if adj_results:
            pd.DataFrame(adj_results).to_csv(RESULTS_PATH / "overfitting_adjustments.csv", index=False)
            print("  Saved: overfitting_adjustments.csv")
    
    # Plot
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    models_list = df['Model'].values
    x = np.arange(len(models_list))
    
    axes[0].bar(x - 0.17, df['Train_AUC'], 0.35, label='Train', color='lightblue')
    axes[0].bar(x + 0.17, df['Test_AUC'], 0.35, label='Test', color='steelblue')
    axes[0].set_xticks(x)
    axes[0].set_xticklabels(models_list, rotation=45, ha='right', fontsize=8)
    axes[0].set_ylabel('AUC')
    axes[0].set_title('Train vs Test Performance', fontweight='bold')
    axes[0].legend()
    axes[0].grid(axis='y', alpha=0.3)
    
    colors = ['red' if r > 0.05 else 'green' for r in df['AUC_Overfit_Ratio']]
    axes[1].barh(models_list, df['AUC_Overfit_Ratio'], color=colors, alpha=0.7)
    axes[1].axvline(0.05, color='red', linestyle='--', lw=2, label='Threshold')
    axes[1].set_xlabel('Overfitting Ratio')
    axes[1].set_title('Overfitting Detection', fontweight='bold')
    axes[1].legend()
    
    plt.tight_layout()
    plt.savefig(FIGURES_PATH / "overfitting_analysis.png", dpi=300)
    plt.savefig(FIGURES_PATH / "overfitting_analysis.tiff", dpi=300)
    plt.close()
    
    return df

# ===== TASK 8: Learning Curves =====
def task8_learning_curves(X, y, models):
    print("\n" + "="*60)
    print("TASK 8: Learning Curves")
    print("="*60)
    
    train_sizes = np.linspace(0.1, 1.0, 10)
    results = []
    all_curves = {}
    
    for name, model in models.items():
        print(f"  {name}...", end=" ", flush=True)
        try:
            sizes, tr_scores, val_scores = learning_curve(
                clone(model), X, y, train_sizes=train_sizes,
                cv=5, scoring='roc_auc', n_jobs=-1, random_state=42
            )
            
            all_curves[name] = {
                'sizes': sizes.tolist(),
                'train_mean': np.mean(tr_scores, axis=1).tolist(),
                'train_std': np.std(tr_scores, axis=1).tolist(),
                'val_mean': np.mean(val_scores, axis=1).tolist(),
                'val_std': np.std(val_scores, axis=1).tolist()
            }
            
            gap = np.mean(tr_scores[-1]) - np.mean(val_scores[-1])
            pattern = 'High Variance' if gap > 0.1 else 'High Bias' if np.mean(val_scores[-1]) < 0.7 else 'Good Fit'
            
            for i, s in enumerate(sizes):
                results.append({
                    'Model': name, 'Train_Size': s, 'Train_Size_Pct': train_sizes[i] * 100,
                    'Train_AUC_Mean': np.mean(tr_scores[i]), 'Train_AUC_Std': np.std(tr_scores[i]),
                    'Val_AUC_Mean': np.mean(val_scores[i]), 'Val_AUC_Std': np.std(val_scores[i]),
                    'Pattern': pattern
                })
            print("done")
        except Exception as e:
            print(f"error: {e}")
    
    df = pd.DataFrame(results)
    df.to_csv(RESULTS_PATH / "learning_curves_data.csv", index=False)
    print("Saved: learning_curves_data.csv")
    
    # Plot all models
    fig, axes = plt.subplots(3, 5, figsize=(18, 10))
    for idx, (name, c) in enumerate(all_curves.items()):
        if idx >= 15: break
        ax = axes.flatten()[idx]
        sizes = np.array(c['sizes'])
        tr_m, tr_s = np.array(c['train_mean']), np.array(c['train_std'])
        val_m, val_s = np.array(c['val_mean']), np.array(c['val_std'])
        
        ax.fill_between(sizes, tr_m - tr_s, tr_m + tr_s, alpha=0.2, color='blue')
        ax.fill_between(sizes, val_m - val_s, val_m + val_s, alpha=0.2, color='orange')
        ax.plot(sizes, tr_m, 'o-', color='blue', label='Train')
        ax.plot(sizes, val_m, 'o-', color='orange', label='Val')
        ax.set_title(name, fontsize=9)
        ax.set_ylim([0.5, 1.05])
        ax.legend(fontsize=6, loc='lower right')
        ax.grid(alpha=0.3)
    
    plt.suptitle('Learning Curves (All Models)', fontsize=12, fontweight='bold')
    plt.tight_layout(rect=[0, 0, 1, 0.96])
    plt.savefig(FIGURES_PATH / "learning_curves_all_models.png", dpi=300)
    plt.savefig(FIGURES_PATH / "learning_curves_all_models.tiff", dpi=300)
    plt.close()
    
    # Bias-variance summary
    fig, ax = plt.subplots(figsize=(11, 6))
    gaps = [(name, c['train_mean'][-1] - c['val_mean'][-1]) for name, c in all_curves.items()]
    gaps.sort(key=lambda x: x[1])
    names, vals = zip(*gaps)
    colors = ['red' if v > 0.1 else 'orange' if v > 0.05 else 'green' for v in vals]
    ax.barh(names, vals, color=colors, alpha=0.7)
    ax.axvline(0.1, color='red', linestyle='--', lw=2, label='High Variance')
    ax.axvline(0.05, color='orange', linestyle='--', lw=2, label='Moderate')
    ax.set_xlabel('Train-Validation Gap')
    ax.set_title('Bias-Variance Profile', fontweight='bold')
    ax.legend()
    ax.grid(axis='x', alpha=0.3)
    plt.tight_layout()
    plt.savefig(FIGURES_PATH / "learning_curves_bias_variance.png", dpi=300)
    plt.savefig(FIGURES_PATH / "learning_curves_bias_variance.tiff", dpi=300)
    plt.close()
    
    return df

# ===== MAIN =====
def main():
    print("="*60)
    print("NOA ML Project - Phase 4 Part 2 (Tasks 5-8)")
    print(f"Execution: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    X, y = load_data()
    models = load_models()
    
    task5_bootstrap(X, y, models, n_iter=100)
    task6_nested_cv(X, y, models)
    task7_overfitting(X, y, models)
    task8_learning_curves(X, y, models)
    
    # Summary
    summary = {
        'execution_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'n_samples': int(len(y)), 'n_features': int(X.shape[1]), 'n_models': len(models),
        'tasks': ['Task5_Bootstrap', 'Task6_NestedCV', 'Task7_Overfitting', 'Task8_LearningCurves'],
        'scientific_justifications': {
            'Bootstrap': 'Non-parametric 95% CIs for clinical decision-making without distributional assumptions',
            'Nested_CV': 'Unbiased performance estimates - gold standard for clinical ML',
            'Overfitting': 'Ensures models generalize for accurate patient predictions',
            'Learning_Curves': 'Reveals bias-variance tradeoff for data collection decisions'
        },
        'outputs': ['bootstrap_validation_results.csv', 'nested_cv_results.csv', 
                    'overfitting_analysis.csv', 'learning_curves_data.csv']
    }
    
    with open(RESULTS_PATH / "phase4_part2_summary.json", 'w') as f:
        json.dump(summary, f, indent=2)
    
    # Log
    log = f"""Phase 4 Part 2 Log
==================
Date: {datetime.now()}
Samples: {len(y)}, Features: {X.shape[1]}, Models: {len(models)}

Tasks:
1. Bootstrap (100 iter) - Non-parametric CIs
2. Nested CV (5-outer, 3-inner) - Unbiased estimates
3. Overfitting Detection - Generalization check
4. Learning Curves - Bias-variance analysis

Outputs: bootstrap_validation_results.csv, nested_cv_results.csv, 
         overfitting_analysis.csv, learning_curves_data.csv
Figures: bootstrap_*, nested_cv_*, overfitting_*, learning_curves_* (PNG+TIFF)
"""
    with open(LOGS_PATH / "phase4_part2_log.txt", 'w') as f:
        f.write(log)
    
    print("\n" + "="*60)
    print("Phase 4 Part 2 Complete!")
    print("="*60)

if __name__ == "__main__":
    main()
