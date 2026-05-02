# Phase 5: Explainable AI & Clinical Interpretation — Analysis Summary

**Generated:** 2026-03-13  
**Project:** NOA ML Prediction System  
**Source Architecture:** `NOA_ML_Architecture_Final.zip → Phase5_ExplainableAI.md`  
**Source Phase 4 Data:** `Chat_4__Validation___Robustness-2.zip`

---

## 1. Phase 5 Tasks Defined in the Architecture

The architecture defines **10 tasks** for Phase 5, grouped into four logical categories:

### A. Feature-Level Explanations
| Task | Description | Methods |
|------|-------------|---------|
| **Task 1** — Feature Importance | Extract native feature importance from all models (tree-based `feature_importances_`, linear `coef_`), normalize, compare top-N across models | Horizontal bar charts, 2×2 subplot comparison |
| **Task 2** — Permutation Importance | Model-agnostic importance via `sklearn.inspection.permutation_importance` (30 repeats, `roc_auc` scorer) for all models | Mean ± std ranking per model |
| **Task 3** — SHAP Analysis (Global & Local) | `TreeExplainer` for tree models, `KernelExplainer` for others. Global: beeswarm summary + bar plot. Local: waterfall plots for 3 archetypes (high-positive, high-negative, borderline). Dependence plots for top-4 features | Per-model SHAP figures |
| **Task 4** — PDP & ICE Plots | `PartialDependenceDisplay` for top-4 features per model (average + individual conditional expectation) | 2×2 subplot grids |
| **Task 5** — LIME Explanations | `lime.lime_tabular` local explanations for 5 sample archetypes (high-pos, high-neg, borderline, true-positive, false-negative) on XGBoost | Per-sample bar charts |

### B. Model Performance Visualization
| Task | Description |
|------|-------------|
| **Task 6** — ROC Curves | Standard multi-model ROC overlay + Bootstrap ROC with 95% CI (1000 iterations) for top-4 models |
| **Task 7** — Precision-Recall Curves | All models on single plot with Average Precision scores and no-skill baseline |
| **Task 8** — Calibration Curves | Reliability diagrams (10 bins) comparing predicted probability vs. fraction of positives |
| **Task 9** — Confusion Matrices | 2×2 matrices at threshold=0.5 with Sensitivity, Specificity, PPV, NPV annotations |

### C. Clinical Synthesis
| Task | Description |
|------|-------------|
| **Task 10** — Clinical Interpretation & Actionable Insights | Aggregate consensus features across models, produce clinical implications text (in Farsi), identify best model, write Final Research Findings |

### D. Expected Outputs (16 deliverables)
- `Phase5_Report.md` → `3_Results/Phase5_XAI/`
- 13 figure types (PNG + TIFF each) → `4_Figures/`
- `clinical_interpretation.md` + `Final_Research_Findings.md` → `5_Reports/`

---

## 2. Phase 4 Outputs Available as Phase 5 Inputs

### 2.1 Critical Input Files (directly referenced by Phase 5 architecture)

| Required Input | Path in Phase 4 Archive | Status |
|---|---|---|
| `encoded_dataset.csv` | `NOA_ML_Project/1_Data/Processed/encoded_dataset.csv` | ✅ Present (2450 rows × 36 features + TARGET) |
| `*.joblib` saved models | `NOA_ML_Project/6_Models/Saved/` | ✅ **27 files** present (see details below) |
| `Phase4_Report.md` | Referenced as `Phase4_Report.md` in architecture | ⚠️ **Name mismatch** — actual files are `Phase4_Validation_Report.md`, `Phase4_Executive_Summary.md`, `Phase4_Summary_FA.md` |

### 2.2 Saved Models Inventory (27 .joblib files)

**15 base models:**
LogisticRegression, DecisionTree, RandomForest, XGBoost, LightGBM, CatBoost, SVM, KNN, NaiveBayes, GradientBoosting, ExtraTrees, MLP, TabNet, VotingEnsemble, StackingEnsemble

**12 adjusted (regularized) variants:**
All of the above except LogisticRegression, NaiveBayes, and SVM have `_adjusted` counterparts.

### 2.3 Phase 4 Validation Results (context for interpretation)

| File | Contents |
|------|----------|
| `Phase4_Final_Results.json` | Full validation summary — best model: **SVM (AUC 0.984)**, 15 models, 10 validation methods |
| `kfold_cv_results.csv` | 5-fold and 10-fold CV metrics per model |
| `repeated_kfold_results.csv` | Repeated k-fold stability data |
| `bootstrap_validation_results.csv` | Bootstrap CI results |
| `nested_cv_results.csv` | Nested CV for hyperparameter bias assessment |
| `loocv_results.csv` | Leave-one-out CV results |
| `overfitting_analysis.csv` + `overfitting_adjustments.csv` | Overfitting detection and regularization records |
| `stability_analysis.csv` + `stability_seeds_analysis.csv` | Multi-seed stability |
| `robustness_noise_results.csv` | Noise injection robustness |
| `learning_curves_data.csv` | Bias-variance learning curves |

### 2.4 Phase 4 Figures (14 figure pairs, PNG + TIFF)
Bootstrap distributions, CI comparisons, k-fold heatmaps, learning curves, model performance comparison, nested CV, overfitting analysis, radar charts, repeated k-fold, robustness heatmaps, noise degradation, stability plots.

### 2.5 Phase 4 Code Scripts (7 Python files)
`phase4_part1_complete.py`, `phase4_part1_optimized.py`, `phase4_part1_validation.py`, `phase4_part2_tasks5_8.py`, `phase4_part2_validation.py`, `phase4_tasks5_8_fast.py`, `phase4_tasks5_8_optimized.py`, `phase4_tasks9_10.py`, `phase4_tasks9_10_fast.py`, `phase4_loocv_only.py`

---

## 3. Gaps, Mismatches & Clarification Needed

### 🔴 Critical Issues

| # | Issue | Detail | Impact |
|---|-------|--------|--------|
| **G1** | **Model name mismatch in code** | Architecture code references `Random_Forest` and `Logistic_Regression` (with underscores), but Phase 4 `.joblib` files are named `RandomForest.joblib` and `LogisticRegression.joblib` (no underscores) | Code will crash on `joblib.load()` — filenames must be corrected |
| **G2** | **Architecture loads only 4 models** | Task 1 code loads only XGBoost, LightGBM, Random_Forest, Logistic_Regression. But Phase 4 produced **15 base + 12 adjusted = 27 models**. Phase 5 checklist says "Feature Importance for all models" | Need to decide: run all 15 base models? Include adjusted variants? |
| **G3** | **Missing `save_figure()` utility** | Every task calls `save_figure(fig, name)` but this function is never defined in the architecture | Must implement this helper (save PNG + TIFF to `4_Figures/Phase5/`) |
| **G4** | **Phase4_Report.md reference doesn't exist** | Architecture inputs list `Phase4_Report.md` but actual files are `Phase4_Validation_Report.md`, `Phase4_Executive_Summary.md`, etc. | Minor — just use the correct filenames |

### 🟡 Design Decisions Needed

| # | Question | Options |
|---|----------|---------|
| **D1** | **Which models to run SHAP on?** | Architecture runs SHAP only on XGBoost, Random_Forest, LightGBM. Should SVM (best AUC=0.984) be included? SVM requires KernelExplainer (slow). | 
| **D2** | **Base vs. Adjusted models?** | Phase 4 produced both original and `_adjusted` (regularized) models. Which set should Phase 5 interpret? Logically the adjusted ones (post-overfitting-fix), but architecture doesn't address this. |
| **D3** | **Feature names are generic** | Dataset columns are `Feature_1` through `Feature_36` — clinical interpretation (Task 10) requires knowing what these features actually represent (age, BMI, hormone levels, etc.). Without real feature names, the clinical narrative will be superficial. |
| **D4** | **LIME only on XGBoost?** | Architecture runs LIME only for XGBoost. Should it also cover SVM (best model) or at least the top-3? |
| **D5** | **Threshold for confusion matrices** | Architecture hardcodes threshold=0.5. Phase 3 likely produced optimal thresholds per model (file `optimal_thresholds.csv` exists in Uploads). Should those be used instead? |

### 🟢 Minor Notes

| # | Note |
|---|------|
| **N1** | KernelExplainer with 100 background samples on 2450-row dataset — may be slow but feasible |
| **N2** | Bootstrap ROC with 1000 iterations per model (Task 6) will take significant compute time for all 15 models |
| **N3** | Architecture includes Farsi text in clinical interpretation template — ensure UTF-8 encoding in all outputs |
| **N4** | TIFF format required alongside PNG for all figures (publication-quality) — need to set DPI ≥ 300 |

---

## 4. Recommended Execution Plan

```
Step 1: Setup & Utilities
  - Copy Phase 4 data into working NOA_ML_Project structure
  - Implement save_figure() helper (PNG 300dpi + TIFF 300dpi)
  - Fix model name references (no underscores)
  - Decide on base vs. adjusted models (recommend: adjusted)

Step 2: Tasks 1-2 (Feature Importance + Permutation)
  - Run on ALL 15 models (or at minimum the top-5: SVM, CatBoost, LightGBM, XGBoost, RandomForest)

Step 3: Task 3 (SHAP)
  - TreeExplainer: XGBoost, LightGBM, RandomForest, CatBoost, GradientBoosting, ExtraTrees
  - KernelExplainer: SVM, LogisticRegression (slower)
  - Skip: KNN, NaiveBayes, TabNet, MLP (or KernelExplainer if time permits)

Step 4: Tasks 4-5 (PDP/ICE + LIME)
  - PDP/ICE on tree-based models
  - LIME on at least XGBoost + SVM (best model)

Step 5: Tasks 6-9 (Performance Curves)
  - ROC, PR, Calibration, Confusion Matrices for all models

Step 6: Task 10 (Clinical Interpretation)
  - Synthesize consensus features
  - Write clinical narrative (requires real feature name mapping)
  - Produce Final Research Findings

Step 7: Report Assembly
  - Phase5_Report.md with all results
  - Clinical interpretation document
```

---

## 5. File Location Reference

All extracted files are at:
```
[path]
├── architecture/                          # Architecture documents
│   ├── Phase5_ExplainableAI.md           # ← Main Phase 5 specification
│   ├── Phase4_CrossValidation_Robustness.md
│   ├── Phase3_IntelligentModelSelection.md
│   ├── Phase2_StatisticalAnalysis.md
│   ├── Phase1_DataUnderstanding_Cleaning.md
│   ├── 00_Project_Setup.md
│   ├── README.md
│   └── Templates/
└── phase4_output/
    └── Chat_4__Validation___Robustness-2/
        ├── NOA_ML_Project/
        │   ├── 1_Data/Processed/encoded_dataset.csv
        │   ├── 2_Code/phase4_*.py
        │   ├── 3_Results/Phase4_Validation/
        │   ├── 4_Figures/Phase4/
        │   ├── 5_Reports/
        │   └── 6_Models/Saved/*.joblib (27 files)
        ├── Phase4_Assessment_Report.md/pdf
        ├── Chat4_Tasks_Summary_FA.md/pdf
        └── Uploads/ (Phase 3 carry-forward data)
```
