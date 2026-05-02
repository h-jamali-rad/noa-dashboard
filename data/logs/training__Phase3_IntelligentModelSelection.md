# 🤖 Phase 3: Intelligent Model Selection & Training

═══════════════════════════════════════════════════════════════════════════════
## CONTEXT - این فاز چیست و چرا مهم است
═══════════════════════════════════════════════════════════════════════════════

**انتخاب هوشمند مدل** مهم‌ترین تصمیم در پروژه ML است. مدل باید بر اساس:
- ویژگی‌های دیتاست (اندازه، نوع، توزیع)
- نوع مسئله (binary classification)
- نیاز به interpretability
- محدودیت‌های محاسباتی

**مدل‌ها نباید محدود باشند** - از ساده‌ترین تا پیشرفته‌ترین را بررسی می‌کنیم.

═══════════════════════════════════════════════════════════════════════════════
## INPUTS - فایل‌های ورودی
═══════════════════════════════════════════════════════════════════════════════

```
[path]
[path]
```

═══════════════════════════════════════════════════════════════════════════════
## 🎯 COMPLETE MODEL LIBRARY
═══════════════════════════════════════════════════════════════════════════════

### Classical Machine Learning Models

| مدل | مزایا | معایب | بهترین برای |
|-----|-------|-------|------------|
| **Logistic Regression** | Interpretable, Fast, Baseline | Linear only | Small data, Interpretability needed |
| **Decision Tree** | Interpretable, Non-linear | Overfitting | Feature importance |
| **Random Forest** | Robust, Feature importance | Less interpretable | Medium-large data |
| **XGBoost** | State-of-art, Fast | Hyperparameter sensitive | Tabular data |
| **LightGBM** | Faster than XGB, Memory efficient | May overfit small data | Large data |
| **CatBoost** | Handles categorical, No encoding needed | Slower training | Mixed data types |
| **SVM** | Good margins, Kernel trick | Slow for large n | Small-medium data |
| **KNN** | Simple, No training | Slow prediction, Curse of dimensionality | Small data |
| **Naive Bayes** | Fast, Works with small data | Feature independence assumption | Text, Baseline |
| **Gradient Boosting** | Flexible, Good performance | Slow | General |

### Deep Learning Models

| مدل | مزایا | معایب | بهترین برای |
|-----|-------|-------|------------|
| **MLP** | Universal approximator | Needs tuning | Sufficient data |
| **TabNet** | Attention mechanism, Interpretable | Complex | Large tabular data |
| **Wide & Deep** | Combines memorization & generalization | Complex | Sparse features |
| **NODE** | Decision tree-like neural network | New, Less tested | Research |

### Ensemble Methods

| مدل | مزایا | معایب | بهترین برای |
|-----|-------|-------|------------|
| **Voting** | Simple, Robust | Limited improvement | Quick ensemble |
| **Stacking** | Best performance usually | Complex, Overfitting risk | Competitions |
| **Blending** | Simpler than stacking | Needs holdout | Final submission |

═══════════════════════════════════════════════════════════════════════════════
## TASKS - کارهایی که باید انجام دهی
═══════════════════════════════════════════════════════════════════════════════

---
### 📋 TASK 1: تحلیل ویژگی‌های دیتاست برای انتخاب مدل
---

```python
import pandas as pd
import numpy as np

df = pd.read_csv("[path]")

def dataset_analysis_for_model_selection(df, target_col):
    """تحلیل دیتاست برای تصمیم‌گیری انتخاب مدل"""
    
    print("=" * 80)
    print("📊 DATASET ANALYSIS FOR MODEL SELECTION")
    print("=" * 80)
    
    n_samples = len(df)
    n_features = len(df.columns) - 1  # Exclude target
    
    # Basic metrics
    analysis = {
        'n_samples': n_samples,
        'n_features': n_features,
        'sample_to_feature_ratio': n_samples / n_features,
        'class_balance': df[target_col].value_counts(normalize=True).min(),
        'has_missing': df.isnull().any().any(),
        'n_categorical': len(df.select_dtypes(include=['object', 'category']).columns),
        'n_numerical': len(df.select_dtypes(include=[np.number]).columns) - 1
    }
    
    print(f"\n📐 Dataset Size:")
    print(f"   Samples: {n_samples}")
    print(f"   Features: {n_features}")
    print(f"   Sample/Feature Ratio: {analysis['sample_to_feature_ratio']:.1f}")
    
    print(f"\n📊 Feature Types:")
    print(f"   Numerical: {analysis['n_numerical']}")
    print(f"   Categorical: {analysis['n_categorical']}")
    
    print(f"\n⚖️ Class Balance:")
    print(f"   Minority class: {analysis['class_balance']*100:.1f}%")
    
    # Model recommendations
    print("\n" + "=" * 80)
    print("🎯 MODEL RECOMMENDATIONS")
    print("=" * 80)
    
    recommendations = []
    
    # Based on sample size
    if n_samples < 100:
        recommendations.append("⚠️ Very small sample: Use Logistic Regression, SVM, Naive Bayes")
        recommendations.append("⚠️ Avoid Deep Learning and complex ensembles")
    elif n_samples < 500:
        recommendations.append("✓ Small sample: Random Forest, XGBoost with regularization")
        recommendations.append("✓ Consider simpler models: Logistic Regression, SVM")
    elif n_samples < 5000:
        recommendations.append("✓ Medium sample: All classical ML models suitable")
        recommendations.append("✓ Can try LightGBM, CatBoost")
    else:
        recommendations.append("✓ Large sample: Deep Learning becomes viable")
        recommendations.append("✓ TabNet, MLP, Neural Networks")
    
    # Based on feature types
    if analysis['n_categorical'] > 0:
        recommendations.append("✓ Has categorical: CatBoost recommended (native handling)")
    
    # Based on class balance
    if analysis['class_balance'] < 0.3:
        recommendations.append("⚠️ Imbalanced: Use SMOTE, class weights, or ensemble with sampling")
    
    for rec in recommendations:
        print(f"   {rec}")
    
    return analysis, recommendations

analysis, recommendations = dataset_analysis_for_model_selection(df, 'TARGET')
```

---
### 📋 TASK 2: آماده‌سازی داده برای مدل‌سازی
---

```python
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

def prepare_data_for_modeling(df, target_col, test_size=0.2, random_state=42):
    """آماده‌سازی داده برای مدل‌سازی"""
    
    # Separate features and target
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    # Train-test split (stratified)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    
    print(f"Training set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    print(f"Class distribution in train: {y_train.value_counts(normalize=True).to_dict()}")
    print(f"Class distribution in test: {y_test.value_counts(normalize=True).to_dict()}")
    
    # Scale features (only fit on training data)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    return X_train, X_test, y_train, y_test, X_train_scaled, X_test_scaled, scaler

X_train, X_test, y_train, y_test, X_train_scaled, X_test_scaled, scaler = \
    prepare_data_for_modeling(df, 'TARGET')
```

---
### 📋 TASK 3: مدیریت Class Imbalance
---

```python
from imblearn.over_sampling import SMOTE, ADASYN
from imblearn.under_sampling import RandomUnderSampler
from imblearn.combine import SMOTETomek

def handle_class_imbalance(X_train, y_train, strategy='auto'):
    """
    استراتژی‌های مدیریت عدم توازن:
    1. SMOTE: Synthetic Minority Over-sampling
    2. ADASYN: Adaptive Synthetic Sampling
    3. RandomUnderSampler: Undersampling majority
    4. SMOTETomek: SMOTE + Tomek links
    5. Class Weights: در مدل اعمال می‌شود
    """
    
    imbalance_ratio = y_train.value_counts().max() / y_train.value_counts().min()
    
    print(f"\n⚖️ HANDLING CLASS IMBALANCE")
    print(f"   Original imbalance ratio: {imbalance_ratio:.2f}:1")
    print(f"   Original class distribution: {y_train.value_counts().to_dict()}")
    
    if strategy == 'auto':
        if imbalance_ratio > 5:
            strategy = 'smote_tomek'
        elif imbalance_ratio > 2:
            strategy = 'smote'
        else:
            strategy = 'none'
    
    if strategy == 'none':
        print("   ✓ No resampling needed (balanced enough)")
        return X_train, y_train, 'none'
    
    elif strategy == 'smote':
        sampler = SMOTE(random_state=42)
        X_resampled, y_resampled = sampler.fit_resample(X_train, y_train)
        
    elif strategy == 'adasyn':
        sampler = ADASYN(random_state=42)
        X_resampled, y_resampled = sampler.fit_resample(X_train, y_train)
        
    elif strategy == 'undersample':
        sampler = RandomUnderSampler(random_state=42)
        X_resampled, y_resampled = sampler.fit_resample(X_train, y_train)
        
    elif strategy == 'smote_tomek':
        sampler = SMOTETomek(random_state=42)
        X_resampled, y_resampled = sampler.fit_resample(X_train, y_train)
    
    print(f"   ✓ Applied {strategy.upper()}")
    print(f"   New class distribution: {pd.Series(y_resampled).value_counts().to_dict()}")
    
    return X_resampled, y_resampled, strategy

X_train_resampled, y_train_resampled, resampling_method = \
    handle_class_imbalance(X_train_scaled, y_train)
```

---
### 📋 TASK 4: تعریف مدل‌ها با دلایل علمی
---

```python
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier, StackingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostClassifier

def define_models_with_rationale(n_samples, n_features, class_balance):
    """تعریف مدل‌ها با دلایل علمی"""
    
    models = {}
    rationales = {}
    
    # 1. Logistic Regression - Baseline & Interpretable
    models['Logistic_Regression'] = LogisticRegression(
        max_iter=1000, 
        class_weight='balanced',
        solver='lbfgs',
        random_state=42
    )
    rationales['Logistic_Regression'] = """
    **دلیل انتخاب:** مدل پایه (baseline) برای classification با قابلیت تفسیر بالا.
    - قابل فهم برای پزشکان (odds ratios)
    - سریع و پایدار
    - مناسب برای مقایسه با مدل‌های پیچیده‌تر
    """
    
    # 2. Decision Tree
    models['Decision_Tree'] = DecisionTreeClassifier(
        max_depth=5,
        min_samples_split=10,
        class_weight='balanced',
        random_state=42
    )
    rationales['Decision_Tree'] = """
    **دلیل انتخاب:** ساده‌ترین مدل non-linear با قابلیت تفسیر.
    - قواعد تصمیم‌گیری شفاف
    - مناسب برای feature importance اولیه
    - محدودیت: prone to overfitting
    """
    
    # 3. Random Forest
    models['Random_Forest'] = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_split=5,
        class_weight='balanced',
        n_jobs=-1,
        random_state=42
    )
    rationales['Random_Forest'] = """
    **دلیل انتخاب:** Ensemble قدرتمند با مقاومت در برابر overfitting.
    - Bagging کاهش variance
    - Feature importance قابل اعتماد
    - مناسب برای tabular medical data
    """
    
    # 4. XGBoost
    models['XGBoost'] = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=1/class_balance if class_balance < 0.5 else 1,
        use_label_encoder=False,
        eval_metric='logloss',
        random_state=42
    )
    rationales['XGBoost'] = """
    **دلیل انتخاب:** State-of-the-art برای tabular data.
    - Gradient Boosting با regularization
    - Built-in handling برای imbalanced classes
    - عملکرد عالی در competitions
    """
    
    # 5. LightGBM
    models['LightGBM'] = lgb.LGBMClassifier(
        n_estimators=200,
        max_depth=8,
        learning_rate=0.1,
        num_leaves=31,
        class_weight='balanced',
        random_state=42,
        verbose=-1
    )
    rationales['LightGBM'] = """
    **دلیل انتخاب:** سریع‌تر از XGBoost با کارایی مشابه.
    - Memory efficient
    - Leaf-wise growth
    - مناسب برای datasets بزرگ
    """
    
    # 6. CatBoost
    models['CatBoost'] = CatBoostClassifier(
        iterations=200,
        depth=6,
        learning_rate=0.1,
        auto_class_weights='Balanced',
        random_state=42,
        verbose=False
    )
    rationales['CatBoost'] = """
    **دلیل انتخاب:** بهترین handling برای categorical features.
    - Ordered boosting (کاهش overfitting)
    - Native categorical support
    - Robust to hyperparameters
    """
    
    # 7. SVM
    models['SVM'] = SVC(
        kernel='rbf',
        C=1.0,
        class_weight='balanced',
        probability=True,
        random_state=42
    )
    rationales['SVM'] = """
    **دلیل انتخاب:** مدل کلاسیک با margin-based learning.
    - Kernel trick برای non-linearity
    - مناسب برای small-medium datasets
    - Robust to outliers
    """
    
    # 8. KNN
    models['KNN'] = KNeighborsClassifier(
        n_neighbors=5,
        weights='distance',
        n_jobs=-1
    )
    rationales['KNN'] = """
    **دلیل انتخاب:** Instance-based learning ساده.
    - No training phase
    - Intuitive interpretation
    - Baseline برای local patterns
    """
    
    # 9. Naive Bayes
    models['Naive_Bayes'] = GaussianNB()
    rationales['Naive_Bayes'] = """
    **دلیل انتخاب:** مدل probabilistic ساده.
    - بسیار سریع
    - Works well with small data
    - Baseline probability estimates
    """
    
    # 10. Gradient Boosting
    models['Gradient_Boosting'] = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.1,
        subsample=0.8,
        random_state=42
    )
    rationales['Gradient_Boosting'] = """
    **دلیل انتخاب:** Scikit-learn implementation of boosting.
    - Sequential learning
    - مقایسه با XGBoost/LightGBM
    """
    
    return models, rationales

models, rationales = define_models_with_rationale(
    n_samples=len(df),
    n_features=len(df.columns)-1,
    class_balance=df['TARGET'].value_counts(normalize=True).min()
)

# Print rationales
print("=" * 80)
print("📊 MODEL SELECTION RATIONALES")
print("=" * 80)
for name, rationale in rationales.items():
    print(f"\n### {name}")
    print(rationale)
```

---
### 📋 TASK 5: Hyperparameter Tuning
---

```python
import optuna
from sklearn.model_selection import cross_val_score

def optuna_hyperparameter_tuning(X_train, y_train, model_name, n_trials=100):
    """Hyperparameter tuning با Optuna"""
    
    def objective(trial):
        if model_name == 'XGBoost':
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 50, 500),
                'max_depth': trial.suggest_int('max_depth', 3, 10),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
                'subsample': trial.suggest_float('subsample', 0.6, 1.0),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
                'reg_alpha': trial.suggest_float('reg_alpha', 1e-8, 10.0, log=True),
                'reg_lambda': trial.suggest_float('reg_lambda', 1e-8, 10.0, log=True),
            }
            model = xgb.XGBClassifier(**params, use_label_encoder=False, 
                                       eval_metric='logloss', random_state=42)
        
        elif model_name == 'LightGBM':
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 50, 500),
                'max_depth': trial.suggest_int('max_depth', 3, 15),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
                'num_leaves': trial.suggest_int('num_leaves', 20, 100),
                'min_child_samples': trial.suggest_int('min_child_samples', 5, 50),
                'subsample': trial.suggest_float('subsample', 0.6, 1.0),
            }
            model = lgb.LGBMClassifier(**params, random_state=42, verbose=-1)
        
        elif model_name == 'Random_Forest':
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 50, 500),
                'max_depth': trial.suggest_int('max_depth', 3, 20),
                'min_samples_split': trial.suggest_int('min_samples_split', 2, 20),
                'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 10),
                'max_features': trial.suggest_categorical('max_features', ['sqrt', 'log2', None]),
            }
            model = RandomForestClassifier(**params, class_weight='balanced', 
                                           n_jobs=-1, random_state=42)
        
        else:
            return 0
        
        # Cross-validation score
        scores = cross_val_score(model, X_train, y_train, cv=5, scoring='roc_auc')
        return scores.mean()
    
    # Run optimization
    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=n_trials, show_progress_bar=True)
    
    print(f"\n🎯 Best parameters for {model_name}:")
    print(f"   Best AUC: {study.best_value:.4f}")
    for key, value in study.best_params.items():
        print(f"   {key}: {value}")
    
    return study.best_params, study.best_value

# Tune top models
best_params = {}
for model_name in ['XGBoost', 'LightGBM', 'Random_Forest']:
    print(f"\n{'='*60}")
    print(f"Tuning {model_name}...")
    best_params[model_name], _ = optuna_hyperparameter_tuning(
        X_train_resampled, y_train_resampled, model_name, n_trials=50
    )
```

---
### 📋 TASK 6: آموزش مدل‌ها و ارزیابی
---

```python
from sklearn.metrics import (accuracy_score, precision_score, recall_score, 
                             f1_score, roc_auc_score, confusion_matrix,
                             classification_report, roc_curve)
import joblib

def train_and_evaluate_models(models, X_train, y_train, X_test, y_test):
    """آموزش و ارزیابی تمام مدل‌ها"""
    
    results = []
    trained_models = {}
    
    print("=" * 80)
    print("📊 MODEL TRAINING AND EVALUATION")
    print("=" * 80)
    
    for name, model in models.items():
        print(f"\n--- Training {name} ---")
        
        # Train
        model.fit(X_train, y_train)
        trained_models[name] = model
        
        # Predict
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else y_pred
        
        # Metrics
        metrics = {
            'Model': name,
            'Accuracy': accuracy_score(y_test, y_pred),
            'Precision': precision_score(y_test, y_pred),
            'Recall': recall_score(y_test, y_pred),
            'F1': f1_score(y_test, y_pred),
            'AUC': roc_auc_score(y_test, y_prob)
        }
        
        results.append(metrics)
        
        print(f"   Accuracy: {metrics['Accuracy']:.4f}")
        print(f"   Precision: {metrics['Precision']:.4f}")
        print(f"   Recall: {metrics['Recall']:.4f}")
        print(f"   F1-Score: {metrics['F1']:.4f}")
        print(f"   AUC: {metrics['AUC']:.4f}")
        
        # Save model
        save_path = f"[path]"
        joblib.dump(model, save_path)
        print(f"   ✓ Saved to {save_path}")
    
    results_df = pd.DataFrame(results).sort_values('AUC', ascending=False)
    
    print("\n" + "=" * 80)
    print("📊 MODEL COMPARISON (Sorted by AUC)")
    print("=" * 80)
    print(results_df.to_string(index=False))
    
    return results_df, trained_models

results_df, trained_models = train_and_evaluate_models(
    models, X_train_resampled, y_train_resampled, X_test_scaled, y_test
)
```

---
### 📋 TASK 7: Ensemble Methods
---

```python
def create_ensemble_models(trained_models, X_train, y_train, X_test, y_test):
    """ایجاد مدل‌های Ensemble"""
    
    print("\n" + "=" * 80)
    print("📊 ENSEMBLE MODELS")
    print("=" * 80)
    
    # Select top 3 models for ensemble
    top_models = list(trained_models.items())[:3]
    
    # 1. Voting Classifier (Soft)
    voting_clf = VotingClassifier(
        estimators=[(name, model) for name, model in top_models],
        voting='soft'
    )
    voting_clf.fit(X_train, y_train)
    
    y_pred = voting_clf.predict(X_test)
    y_prob = voting_clf.predict_proba(X_test)[:, 1]
    
    voting_auc = roc_auc_score(y_test, y_prob)
    print(f"\n✓ Voting Classifier AUC: {voting_auc:.4f}")
    
    # 2. Stacking Classifier
    stacking_clf = StackingClassifier(
        estimators=[(name, model) for name, model in top_models],
        final_estimator=LogisticRegression(max_iter=1000),
        cv=5
    )
    stacking_clf.fit(X_train, y_train)
    
    y_pred = stacking_clf.predict(X_test)
    y_prob = stacking_clf.predict_proba(X_test)[:, 1]
    
    stacking_auc = roc_auc_score(y_test, y_prob)
    print(f"✓ Stacking Classifier AUC: {stacking_auc:.4f}")
    
    # Save ensemble models
    joblib.dump(voting_clf, "[path]")
    joblib.dump(stacking_clf, "[path]")
    
    return voting_clf, stacking_clf, voting_auc, stacking_auc

voting_clf, stacking_clf, voting_auc, stacking_auc = create_ensemble_models(
    trained_models, X_train_resampled, y_train_resampled, X_test_scaled, y_test
)
```

---
### 📋 TASK 8: Deep Learning (اختیاری برای دیتاست‌های بزرگ)
---

```python
def train_deep_learning_models(X_train, y_train, X_test, y_test, n_samples):
    """آموزش مدل‌های Deep Learning (اگر sample size کافی باشد)"""
    
    if n_samples < 500:
        print("⚠️ Sample size too small for Deep Learning. Skipping...")
        return None, None
    
    print("\n" + "=" * 80)
    print("📊 DEEP LEARNING MODELS")
    print("=" * 80)
    
    # 1. MLP with PyTorch
    try:
        import torch
        import torch.nn as nn
        from torch.utils.data import DataLoader, TensorDataset
        
        class MLP(nn.Module):
            def __init__(self, input_dim):
                super(MLP, self).__init__()
                self.network = nn.Sequential(
                    nn.Linear(input_dim, 128),
                    nn.ReLU(),
                    nn.Dropout(0.3),
                    nn.Linear(128, 64),
                    nn.ReLU(),
                    nn.Dropout(0.3),
                    nn.Linear(64, 32),
                    nn.ReLU(),
                    nn.Linear(32, 1),
                    nn.Sigmoid()
                )
            
            def forward(self, x):
                return self.network(x)
        
        # Training code here...
        print("✓ MLP model training available")
        
    except ImportError:
        print("⚠️ PyTorch not available")
    
    # 2. TabNet
    try:
        from pytorch_tabnet.tab_model import TabNetClassifier
        
        tabnet = TabNetClassifier(
            n_d=8, n_a=8,
            n_steps=3,
            gamma=1.3,
            lambda_sparse=1e-3,
            optimizer_fn=torch.optim.Adam,
            optimizer_params=dict(lr=2e-2),
            scheduler_params={"step_size": 15, "gamma": 0.9},
            scheduler_fn=torch.optim.lr_scheduler.StepLR,
            mask_type='entmax',
            verbose=0
        )
        
        tabnet.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            max_epochs=100,
            patience=15,
            batch_size=256
        )
        
        y_prob = tabnet.predict_proba(X_test)[:, 1]
        tabnet_auc = roc_auc_score(y_test, y_prob)
        print(f"✓ TabNet AUC: {tabnet_auc:.4f}")
        
        return tabnet, tabnet_auc
        
    except ImportError:
        print("⚠️ TabNet not available. Install with: pip install pytorch-tabnet")
        return None, None

dl_model, dl_auc = train_deep_learning_models(
    X_train_resampled, y_train_resampled, X_test_scaled, y_test, len(df)
)
```

═══════════════════════════════════════════════════════════════════════════════
## INTELLIGENT DECISIONS - تصمیمات هوشمند
═══════════════════════════════════════════════════════════════════════════════

| موقعیت | تصمیم | معیار |
|--------|-------|-------|
| n < 100 | فقط مدل‌های ساده | Overfitting risk |
| n < 500 | Skip Deep Learning | نیاز به داده بیشتر |
| Imbalance > 3:1 | SMOTE + Class weights | عدم توازن |
| Top models close | Ensemble | بهبود performance |

═══════════════════════════════════════════════════════════════════════════════
## OUTPUTS - خروجی‌های این فاز
═══════════════════════════════════════════════════════════════════════════════

| فایل | مسیر |
|------|------|
| Phase3_Report.md | `3_Results/Phase3_Models/` |
| model_comparison.csv | `3_Results/Phase3_Models/` |
| *.joblib (trained models) | `6_Models/Saved/` |
| hyperparameter_results.csv | `3_Results/Phase3_Models/` |

═══════════════════════════════════════════════════════════════════════════════
## CHECKLIST - چک‌لیست تکمیل فاز
═══════════════════════════════════════════════════════════════════════════════

- [ ] تحلیل دیتاست انجام شد
- [ ] Class imbalance مدیریت شد
- [ ] حداقل 5 مدل مختلف آموزش دیده شد
- [ ] Hyperparameter tuning انجام شد
- [ ] Ensemble models ایجاد شد
- [ ] مدل‌ها ذخیره شدند
- [ ] مقایسه کامل انجام شد
- [ ] گزارش نوشته شد
- [ ] آماده برای Phase 4

═══════════════════════════════════════════════════════════════════════════════
⏳ وقتی آماده بودی، بگو "شروع کن" تا این فاز را اجرا کنم.
═══════════════════════════════════════════════════════════════════════════════
