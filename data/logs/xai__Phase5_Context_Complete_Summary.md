# Phase 5: Explainable AI — Complete Context & Phase 4 Results Summary

**Generated:** 2026-03-13  
**Project:** NOA ML Prediction System (Neonatal Outcome Analysis)

---

## 1. Phase 5 Architecture: 10 Tasks Overview

The Phase 5 architecture (`Phase5_ExplainableAI.md`) defines **10 tasks** for Explainable AI & Clinical Interpretation:

### Category A — Feature-Level Explanations

| Task | Title | Method | Scope |
|------|-------|--------|-------|
| **Task 1** | Feature Importance | Native `feature_importances_` / `coef_`, normalized, top-N comparison | All models — 2×2 bar chart grid |
| **Task 2** | Permutation Importance | `sklearn.inspection.permutation_importance` (30 repeats, `roc_auc`) | All models |
| **Task 3** | SHAP Analysis (Global & Local) | `TreeExplainer` for tree models, `KernelExplainer` for others. Beeswarm + bar (global), waterfall for 3 archetypes (local), dependence plots (top 4 features) | XGBoost, RandomForest, LightGBM |
| **Task 4** | PDP & ICE Plots | `PartialDependenceDisplay` for top-4 features, both average (PDP) and individual (ICE) | XGBoost, RandomForest |
| **Task 5** | LIME Explanations | `lime.lime_tabular` for 5 sample archetypes: high-pos, high-neg, borderline, true-positive, false-negative | XGBoost only |

### Category B — Model Performance Visualization

| Task | Title | Method |
|------|-------|--------|
| **Task 6** | ROC Curves | Standard multi-model overlay + Bootstrap ROC with 95% CI (1000 iterations) per model |
| **Task 7** | Precision-Recall Curves | All models on single plot with AP scores + no-skill baseline |
| **Task 8** | Calibration Curves | Reliability diagrams (10 bins) for all models |
| **Task 9** | Confusion Matrices | 2×2 matrices at threshold=0.5 with Sensitivity, Specificity, PPV, NPV |

### Category C — Clinical Synthesis

| Task | Title | Method |
|------|-------|--------|
| **Task 10** | Clinical Interpretation & Actionable Insights | Aggregate consensus features across models, clinical implications, best model summary, Final Research Findings |

### Expected Deliverables (16 files)
- `Phase5_Report.md` → `3_Results/Phase5_XAI/`
- 13+ figure types (PNG + TIFF at 300 DPI) → `4_Figures/`
- `clinical_interpretation.md` + `Final_Research_Findings.md` → `5_Reports/`

---

## 2. Phase 4 Final Results Summary

### 2.1 Metadata
| Item | Value |
|------|-------|
| Total Samples | **2,450** |
| Total Features | **36** (Feature_1 through Feature_36) |
| Target Distribution | 0 (Failure): 1,534 (62.6%) · 1 (Success): 916 (37.4%) |
| Total Models | **15 base + 12 adjusted = 27 saved models** |
| Validation Methods | **10** comprehensive methods |

### 2.2 Model Rankings by AUC (Bootstrap Validation)

| Rank | Model | AUC | 95% CI |
|------|-------|-----|--------|
| 🥇 1 | **SVM** | **0.984** | [0.976, 0.991] |
| 🥈 2 | **MLP** | **0.976** | [0.963, 0.985] |
| 🥉 3 | **TabNet** | **0.975** | [0.964, 0.985] |
| 4 | CatBoost | 0.970 | [0.961, 0.980] |
| 5 | StackingEnsemble | 0.968 | [0.956, 0.978] |
| 6 | VotingEnsemble | 0.966 | [0.953, 0.976] |
| 7 | LightGBM | 0.964 | [0.950, 0.974] |
| 8 | KNN | 0.962 | [0.949, 0.972] |
| 9 | XGBoost | 0.961 | [0.946, 0.972] |
| 10 | ExtraTrees | 0.955 | [0.939, 0.967] |
| 11 | RandomForest | 0.954 | [0.938, 0.966] |
| 12 | GradientBoosting | 0.952 | [0.936, 0.963] |
| 13 | LogisticRegression | 0.822 | [0.799, 0.844] |
| 14 | NaiveBayes | 0.812 | [0.784, 0.841] |
| 15 | DecisionTree | 0.744 | [0.695, 0.789] |

### 2.3 Key Phase 4 Findings

| Analysis | Key Finding |
|----------|-------------|
| **Best Model** | SVM — AUC 0.984, stability CV 0.08%, no overfitting |
| **Most Robust** | MLP — only -0.21% degradation at 10% noise |
| **Stability** | 15/15 models showed "High" stability across 10 seeds |
| **Robustness** | 13/15 models showed "High" robustness to noise |
| **Overfitting** | 12/15 models flagged (train AUC ≈ 1.0 vs. test AUC < 0.97) — adjusted variants created |
| **Nested CV** | 0% optimistic bias across all models (validated hyperparameters) |

### 2.4 Phase 4 Recommendations for Phase 5
- **Primary**: SVM — highest AUC, exceptional stability, no overfitting
- **Secondary**: MLP (noise robust), CatBoost (strong gradient boosting), TabNet (interpretability potential)
- **Clinical Deployment**: Validated for clinical decision support pending external validation

---

## 3. Available Input Files for Phase 5

### Data
```
[path]
→ 2450 rows × 37 columns (36 features + TARGET)
```

### Saved Models (27 .joblib files)
```
[path]
├── LogisticRegression.joblib    ├── SVM.joblib
├── DecisionTree.joblib          ├── DecisionTree_adjusted.joblib
├── RandomForest.joblib          ├── RandomForest_adjusted.joblib
├── XGBoost.joblib               ├── XGBoost_adjusted.joblib
├── LightGBM.joblib              ├── LightGBM_adjusted.joblib
├── CatBoost.joblib              ├── CatBoost_adjusted.joblib
├── GradientBoosting.joblib      ├── GradientBoosting_adjusted.joblib
├── ExtraTrees.joblib            ├── ExtraTrees_adjusted.joblib
├── KNN.joblib                   ├── KNN_adjusted.joblib
├── NaiveBayes.joblib            ├── MLP.joblib
├── MLP_adjusted.joblib          ├── TabNet.joblib
├── TabNet_adjusted.joblib       ├── VotingEnsemble.joblib
├── VotingEnsemble_adjusted.joblib
├── StackingEnsemble.joblib      └── StackingEnsemble_adjusted.joblib
```

### Phase 4 Results Files
```
3_Results/Phase4_Validation/
├── Phase4_Final_Results.json
├── kfold_cv_results.csv
├── bootstrap_validation_results.csv
├── stability_seeds_analysis.csv
├── robustness_noise_results.csv
├── overfitting_analysis.csv
├── overfitting_adjustments.csv
├── nested_cv_results.csv
├── loocv_results.csv
├── learning_curves_data.csv
├── repeated_kfold_results.csv
└── stability_analysis.csv
```

### Phase 3 Carry-Forward (in Uploads/)
```
optimal_thresholds.csv          # Per-model optimal thresholds
model_comparison.csv            # Phase 3 model comparison
delong_test_results.csv         # Statistical significance tests
bootstrap_ci_results.csv        # CI results
dca_results.csv                 # Decision Curve Analysis
final_results.json              # Phase 3 final results
```

---

## 4. Feature Naming — Critical Gap

### ⚠️ No Clinical Feature Mapping Found

The dataset uses **generic names** (`Feature_1` through `Feature_36`). No feature mapping file, data dictionary, or clinical variable names were found anywhere in the project files.

**Impact**: Task 10 (Clinical Interpretation) requires knowing what these features represent clinically (e.g., age, BMI, hormone levels, sperm parameters, embryo quality scores, etc.) to produce meaningful clinical narratives.

**What's needed**: A mapping like:
```
Feature_1  → Patient Age
Feature_2  → BMI
Feature_3  → FSH Level
Feature_4  → AMH Level
...
Feature_36 → Embryo Quality Score
```

Without this mapping, all XAI outputs will reference generic `Feature_N` names, and clinical interpretation will be limited to describing importance rankings without clinical context.

---

## 5. Known Issues & Mismatches

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| **G1** | Model name mismatch in code | 🔴 Critical | Architecture code uses `Random_Forest`, `Logistic_Regression` (underscores) but .joblib files use `RandomForest`, `LogisticRegression` |
| **G2** | Architecture loads only 4 models | 🟡 Medium | Code loads 4 models but checklist says "all models" — Phase 4 has 15 base + 12 adjusted |
| **G3** | Missing `save_figure()` utility | 🔴 Critical | Called everywhere but never defined — must implement (PNG + TIFF at 300 DPI) |
| **G4** | Generic feature names | 🟡 Medium | No clinical variable mapping available — affects interpretability quality |
| **G5** | Threshold hardcoded at 0.5 | 🟡 Medium | `optimal_thresholds.csv` from Phase 3 exists but not referenced |
| **G6** | SHAP only on 3 models | 🟡 Medium | SVM (best model) not included in SHAP analysis — needs KernelExplainer |
