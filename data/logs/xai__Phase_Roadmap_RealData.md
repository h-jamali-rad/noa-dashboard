# 🗺️ Phase Roadmap — NOA ML Project (Real Data Transition)

This document provides a complete roadmap of all 5 phases of the NOA ML project architecture, explains the inputs/outputs/tasks of each phase, and gives a **clear recommendation** on which phases must be re-executed when switching from synthetic data to real clinical data.

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5
 Setup      Data         Stats &      Model        Cross-Val    Explainable
 & Init     Cleaning     Feature      Training     & Robust     AI (XAI)
                         Engineering
```

**⚠️ Every phase depends on the previous phase's output. They MUST be executed sequentially.**

# 📋 Phase 0: Project Setup & Initialization

### 🇬🇧 English

| Item | Details |
|------|---------|

| **Purpose** | Create project folder structure, install dependencies, copy raw dataset |
| **Tasks** | 1. Create standardized folder structure (`1_Data/`, `2_Code/`, `3_Results/`, `4_Figures/`, `5_Reports/`, `6_Models/`) — 2. Install all Python packages (scikit-learn, xgboost, shap, etc.) — 3. Create `requirements.txt` — 4. Copy dataset to `1_Data/Raw/` — 5. Initial dataset preview (shape, columns, dtypes) |
| **Inputs** | Raw dataset file (`.csv` or `.xlsx`) uploaded by user |
| **Outputs** | `requirements.txt`, `1_Data/Raw/original_dataset.csv`, `Phase0_Setup_Report.md` |

# 📋 Phase 1: Data Understanding & Cleaning

### 🇬🇧 English

| Item | Details |
|------|---------|

| **Purpose** | Thoroughly understand, clean, and prepare the raw dataset for analysis. This is the foundation — "Garbage In, Garbage Out." |
| **Tasks** | **Task 1:** Read & understand dataset (shape, columns, dtypes, memory) — **Task 2:** Intelligent data type detection (Binary, Categorical, Numerical Continuous/Discrete, Text, DateTime) — **Task 3:** Missing values analysis & imputation (median for skewed, mean for normal, mode for categorical; drop columns >50% missing) — **Task 4:** Outlier detection & handling (IQR method, Z-score; winsorize or cap) — **Task 5:** Duplicate & inconsistency check — **Task 6:** Data type corrections — **Task 7:** Initial Feature Engineering (ratios, age groups, binary indicators, interaction features) — **Task 8:** Encoding categorical variables (Label, One-Hot, Target encoding) — **Task 9:** Scaling numerical features (StandardScaler, RobustScaler, MinMaxScaler) — **Task 10:** Save cleaned dataset & report |
| **Inputs** | `1_Data/Raw/original_dataset.csv` |
| **Outputs** | `1_Data/Cleaned/cleaned_dataset.csv` — `1_Data/Processed/encoded_dataset.csv` — `3_Results/Phase1_DataCleaning/Phase1_Report.md` — Figures: `missing_values_analysis`, `outliers_boxplot`, `data_types_summary` (PNG + TIFF) |

# 📋 Phase 2: Advanced Statistical Analysis

### 🇬🇧 English

| Item | Details |
|------|---------|

| **Purpose** | Scientific statistical foundation before any modeling. Understand distributions, relationships, group differences, and statistical power. Essential for peer-reviewed publication. |
| **Tasks** | **Task 1:** Comprehensive descriptive statistics (mean, std, median, IQR, CI — overall & by target group) — **Task 2:** Distribution / normality analysis (Shapiro-Wilk, K-S, D'Agostino; Q-Q plots, histograms) — **Task 3:** Correlation analysis (Pearson, Spearman, Point-biserial; heatmaps) — **Task 4:** Group comparison tests (t-test or Mann-Whitney U for 2 groups, with effect sizes) — **Task 5:** ANOVA / Kruskal-Wallis (for multi-group comparisons) — **Task 6:** Statistical power analysis — **Task 7:** Class imbalance analysis (ratio, visualization, SMOTE strategy) — **Task 8:** Multicollinearity check (VIF) |
| **Inputs** | `1_Data/Cleaned/cleaned_dataset.csv` — `Phase1_Report.md` |
| **Outputs** | `3_Results/Phase2_Statistics/Phase2_Report.md` — `descriptive_stats.csv` — `normality_tests.csv` — `group_comparison.csv` — `correlation_matrix.csv` — Figures: `distribution_analysis`, `pearson_heatmap`, `spearman_heatmap`, `class_distribution` (PNG + TIFF) |

> **Feature Engineering is split between Phase 1 and Phase 2:**
> - **Phase 1 (Task 7):** *Initial* feature engineering — creating domain-specific features like FSH/LH ratio, age groups, binary indicators (e.g., Low_Testosterone), interaction features. These are created based on **domain knowledge** before any statistical analysis.
> - **Phase 2 (Tasks 3, 7, 8):** *Informed* feature decisions — After correlation analysis, VIF check, and class imbalance analysis, you decide which features to **keep, remove, or transform**. Multicollinearity removal (VIF > 10) effectively reshapes the feature set. Class imbalance handling (SMOTE) also modifies the training data.
> **In summary:** Phase 1 = **create** features. Phase 2 = **evaluate & refine** features.

# 📋 Phase 3: Intelligent Model Selection & Training

### 🇬🇧 English

| Item | Details |
|------|---------|

| **Purpose** | Select, tune, and train the best ML models based on dataset characteristics. Binary classification (sperm retrieval success/failure). |
| **Tasks** | **Task 1:** Dataset analysis for model selection (sample size, feature count, class balance → model recommendations) — **Task 2:** Data preparation (train/test split 80/20 stratified, StandardScaler fit on train only) — **Task 3:** Class imbalance handling (SMOTE, ADASYN, class weights) — **Task 4:** Define models with scientific justification (Logistic Regression, Decision Tree, Random Forest, XGBoost, LightGBM, CatBoost, SVM, KNN, Naive Bayes, Gradient Boosting) — **Task 5:** Hyperparameter tuning (Optuna/Bayesian optimization) — **Task 6:** Train all models & evaluate (Accuracy, Precision, Recall, F1, AUC-ROC, MCC) — **Task 7:** Ensemble methods (Voting, Stacking, Blending) — **Task 8:** Deep Learning optional (MLP, TabNet for large datasets) |
| **Inputs** | `1_Data/Processed/encoded_dataset.csv` — `Phase2_Report.md` |
| **Outputs** | `3_Results/Phase3_Models/Phase3_Report.md` — `model_comparison.csv` — `6_Models/Saved/*.joblib` (all trained models) — `hyperparameter_results.csv` |

# 📋 Phase 4: Cross-Validation & Robustness Testing

### 🇬🇧 English

| Item | Details |
|------|---------|

| **Purpose** | Ensure models are generalizable, stable, not overfitting, and reliable for clinical use. Peer reviewers require this. |
| **Tasks** | **Task 1:** K-Fold Cross-Validation (5-Fold, 10-Fold) — **Task 2:** Stratified K-Fold — **Task 3:** Leave-One-Out Cross-Validation (LOOCV) — **Task 4:** Repeated K-Fold — **Task 5:** Bootstrap Validation — **Task 6:** Nested Cross-Validation — **Task 7:** Overfitting detection (train vs. test gap analysis) — **Task 8:** Learning curves — **Task 9:** Stability analysis — **Task 10:** Robustness testing (noise & perturbation) |
| **Inputs** | `1_Data/Processed/encoded_dataset.csv` — `6_Models/Saved/*.joblib` — `Phase3_Report.md` |
| **Outputs** | `3_Results/Phase4_Validation/Phase4_Report.md` — `kfold_results.csv` — `loocv_results.csv` — `bootstrap_results.csv` — `overfitting_analysis.csv` — `stability_analysis.csv` — `robustness_results.csv` — Figures: `learning_curves` (PNG + TIFF) |

# 📋 Phase 5: Explainable AI (XAI) & Clinical Interpretation

### 🇬🇧 English

| Item | Details |
|------|---------|

| **Purpose** | Make models interpretable for clinicians. Without XAI, ML models won't be used in clinical practice. Required by regulatory bodies (FDA, EMA). |
| **Tasks** | **Task 1:** Feature importance (all models) — **Task 2:** Permutation importance — **Task 3:** SHAP analysis (global & local: summary, bar, waterfall, dependence plots) — **Task 4:** Partial Dependence Plots (PDP) & ICE — **Task 5:** LIME explanations — **Task 6:** ROC curves (standard + with CI) — **Task 7:** Precision-Recall curves — **Task 8:** Calibration curves — **Task 9:** Confusion matrices — **Task 10:** Clinical interpretation & actionable insights |
| **Inputs** | `1_Data/Processed/encoded_dataset.csv` — `6_Models/Saved/*.joblib` — `Phase4_Report.md` |
| **Outputs** | `Phase5_Report.md` — Figures: feature importance, SHAP (summary, bar, waterfall, dependence), PDP, ICE, LIME, ROC curves (with CI), PR curves, calibration curves, confusion matrices (all PNG + TIFF) — `clinical_interpretation.md` — `Final_Research_Findings.md` |
| **Status** | ✅ **Already completed** with synthetic data |

```
│                         DATA FLOW BETWEEN PHASES                        │
│  [Raw Dataset]                                                           │
│  ┌─────────┐   cleaned_dataset.csv    ┌─────────┐                       │
│  │ Phase 0 │ ─── original_dataset ──→ │ Phase 1 │                       │
│  │  Setup  │                          │ Cleaning│                       │
│                              cleaned_dataset.csv                         │
│                              encoded_dataset.csv                         │
│                                       │ Phase 2 │                       │
│                                       │  Stats  │                       │
│                              encoded_dataset.csv                         │
│                              Phase2_Report.md                            │
│                                       │ Phase 3 │                       │
│                                       │ Models  │                       │
│                              encoded_dataset.csv                         │
│                              *.joblib (trained models)                   │
│                              Phase3_Report.md                            │
│                                       │ Phase 4 │                       │
│                                       │ Valid.  │                       │
│                              encoded_dataset.csv                         │
│                              *.joblib (trained models)                   │
│                              Phase4_Report.md                            │
│                                       │ Phase 5 │                       │
│                                   Final Research Report                  │
```

# ⚠️ CRITICAL: Which Phases Must Be Redone with Real Data?

## 🔴 Answer: ALL phases (1 through 5) must be re-executed

| Phase | Must Redo? | Why? |

| **Phase 0** | ✅ Yes (minor) | Only need to replace the dataset file. Folder structure and dependencies remain the same. |
| **Phase 1** | 🔴 **YES — FULL REDO** | Real data will have completely different missing value patterns, outliers, data types, inconsistencies, and feature distributions. Every cleaning decision is data-dependent. Feature engineering ratios/thresholds change. |
| **Phase 2** | 🔴 **YES — FULL REDO** | All statistics (descriptive, normality, correlations, group comparisons, power analysis, VIF) are 100% data-dependent. Synthetic data statistics are meaningless for real clinical interpretation. |
| **Phase 3** | 🔴 **YES — FULL REDO** | Models must be retrained from scratch. Hyperparameters tuned on synthetic data are irrelevant. Class imbalance ratios will differ. Model selection recommendations change with real data characteristics. |
| **Phase 4** | 🔴 **YES — FULL REDO** | Cross-validation, bootstrap, LOOCV, learning curves, stability, and robustness results are all model+data dependent. Old validation is invalid. |
| **Phase 5** | 🔴 **YES — FULL REDO** | SHAP values, feature importance, PDP, LIME, ROC curves, calibration — everything is derived from the trained models. New models = all new XAI analysis. Clinical interpretation completely changes. |

## ✅ Recommended Execution Plan for Real Data

```
Step 1: Phase 0 — Replace dataset file (quick, ~5 min)

Step 2: Phase 1 — Full data cleaning with real data
           ⚡ Ask user: target column, columns to drop, domain-specific thresholds

Step 3: Phase 2 — Full statistical analysis
           ⚡ Clinical significance matters more than p-values
 ⚡ p-value

Step 4: Phase 3 — Train all models from scratch
           ⚡ Model selection based on REAL data characteristics

Step 5: Phase 4 — Full validation suite
           ⚡ This is what reviewers look at most carefully

Step 6: Phase 5 — Complete XAI analysis
           ⚡ Clinical interpretation is the key deliverable
```

## 💡 What Can Be Reused from Phase 5 (Current Work)?

| Reusable | Not Reusable |

| ✅ Code structure & methodology | ❌ All numerical results |
| ✅ Architecture/prompt templates | ❌ All figures & plots |
| ✅ Report templates & format | ❌ SHAP values & feature rankings |
| ✅ Visualization code/style | ❌ Clinical interpretations |
| ✅ Pipeline design patterns | ❌ Model performance metrics |

| ✅ | ❌ SHAP |

> **The architecture files (Phase 1–5 `.md` files) are your blueprints — they do NOT need to change.** Simply re-execute each phase with the real dataset as input. The intelligent decision-making logic in each phase will adapt to the real data automatically.

*Generated: March 13, 2026*
*Project: NOA ML — Non-Obstructive Azoospermia Sperm Retrieval Prediction*
