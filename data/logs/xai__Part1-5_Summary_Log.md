# Part 1: Core XAI Analysis — Summary Log

## Project: NOA ML - Phase 5 Explainable AI

- **Date**: 2026-03-13
- **Dataset**: 2450 samples, 36 features
- **Models loaded**: 27
- **Tree-based models (native FI)**: 14

---

## 1. Native Feature Importance (Tree-Based Models)

Models analyzed: CatBoost, CatBoost_adjusted, DecisionTree, DecisionTree_adjusted, ExtraTrees, ExtraTrees_adjusted, GradientBoosting, GradientBoosting_adjusted, LightGBM, LightGBM_adjusted, RandomForest, RandomForest_adjusted, XGBoost, XGBoost_adjusted

### Top 10 Features (by mean importance across tree-based models):

| Rank | Feature | Mean Importance |
|------|---------|----------------|
| 1 | Race | 16.3345 |
| 2 | Sakamoto-RT/mL | 14.9844 |
| 3 | Testis Size right (Sono) | 13.1681 |
| 4 | Testis Size left (Sono) | 12.4828 |
| 5 | Surgery trauma(s) | 11.8791 |
| 6 | Seminal plasma pH | 11.3254 |
| 7 | E2 | 11.2357 |
| 8 | Testosterone levels | 9.2648 |
| 9 | Pathology-RT | 9.2536 |
| 10 | Sakamoto-LT/mL | 9.2312 |

### Figures Generated:
- `native_fi_comparison.png/tiff` — Bar chart comparing all tree-based models
- `native_fi_average.png/tiff` — Average importance with std error bars
- `native_fi_heatmap.png/tiff` — Heatmap across all tree-based models

---

## 2. Permutation Importance (All Models)

Models analyzed: 27 (all loaded models)
Evaluation metric: ROC-AUC, n_repeats=30, subsample=500

### Top 10 Consensus Features:

| Rank | Feature | Mean Perm. Importance |
|------|---------|----------------------|
| 1 | Testis Size right (Sono) | 0.0399 |
| 2 | Seminal plasma pH | 0.0348 |
| 3 | Surgery trauma(s) | 0.0210 |
| 4 | Sakamoto-RT/mL | 0.0149 |
| 5 | E2 | 0.0134 |
| 6 | Race | 0.0118 |
| 7 | Testis Size left (Sono) | 0.0107 |
| 8 | Testosterone levels | 0.0085 |
| 9 | LH | 0.0084 |
| 10 | Age | 0.0082 |

### Figures Generated:
- `permutation_importance_heatmap.png/tiff` — Heatmap across all models
- `permutation_importance_boxplot.png/tiff` — Distribution boxplot for top 15 features

---

## 3. SHAP Global Analysis (Top 5 Models)

Models: SVM, XGBoost, LightGBM, RandomForest, GradientBoosting

### Top 10 Features by Mean |SHAP|:

| Rank | Feature | Mean |SHAP| |
|------|---------|-------------|
| 1 | Testis Size right (Sono) | 0.5238 |
| 2 | Seminal plasma pH | 0.3332 |
| 3 | Surgery trauma(s) | 0.3257 |
| 4 | Testis Size left (Sono) | 0.2508 |
| 5 | E2 | 0.2250 |
| 6 | Sakamoto-RT/mL | 0.2062 |
| 7 | Age | 0.1724 |
| 8 | Race | 0.1639 |
| 9 | infertile family members | 0.1472 |
| 10 | Hypertension | 0.1327 |

### Figures Generated (per model):
- `shap_beeswarm_SVM.png/tiff` — Beeswarm plot
- `shap_bar_SVM.png/tiff` — Bar plot
- `shap_beeswarm_XGBoost.png/tiff` — Beeswarm plot
- `shap_bar_XGBoost.png/tiff` — Bar plot
- `shap_beeswarm_LightGBM.png/tiff` — Beeswarm plot
- `shap_bar_LightGBM.png/tiff` — Bar plot
- `shap_beeswarm_RandomForest.png/tiff` — Beeswarm plot
- `shap_bar_RandomForest.png/tiff` — Bar plot
- `shap_beeswarm_GradientBoosting.png/tiff` — Beeswarm plot
- `shap_bar_GradientBoosting.png/tiff` — Bar plot
- `shap_comparison_top5.png/tiff` — Combined comparison
- `shap_heatmap_top5.png/tiff` — Heatmap comparison

---

## Output Files

### CSV Files (in 3_Results/Phase5_XAI/):
- `feature_importance_native.csv`
- `permutation_importance.csv`
- `shap_values_summary.csv`

### Figures (in 4_Figures/Phase5_XAI/):
- All figures saved in PNG (quick view) + TIFF (300 DPI, publication quality)


---


# Part 2: Local Interpretability - SHAP Local, LIME & PDP/ICE

## Project: NOA ML - Phase 5 XAI Analysis
**Date**: 2026-03-13 07:17
**Dataset**: 2450 samples, 36 features
**Models Analyzed**: SVM, XGBoost, RandomForest

---

## 1. Clinical Archetype Samples

| Archetype | Sample Index | Pred Prob | Predicted | Actual |
|-----------|-------------|-----------|-----------|--------|
| High-Positive | 296 | 0.9876 | 1 | 1 |
| High-Negative | 1110 | 0.0054 | 0 | 0 |
| Borderline | 1343 | 0.5000 | 1 | 0 |
| Young-Patient | 1343 | 0.5000 | 1 | 0 |
| Advanced-Paternal-Age | 50 | 0.5141 | 1 | 0 |
| True-Positive | 1588 | 1.0000 | 1 | 1 |
| False-Negative | 2001 | 0.0006 | 0 | 1 |

**Notes on Age Archetype Selection:**
- Since the dataset uses standardized features, Young Patient = Age z-score ≤ 25th percentile
- Advanced Paternal Age = Age z-score ≥ 75th percentile

---

## 2. SHAP Waterfall Plots (Local Explanations)

For each of the 7 clinical archetypes, SHAP waterfall plots were generated using 3 models:
- **SVM** (Best overall model, AUC: 0.984)
- **XGBoost** (Best tree-based model)
- **RandomForest**

Each plot shows the top 15 features contributing to the individual prediction,
with red bars indicating features pushing toward positive prediction (sperm retrieval success)
and blue bars indicating features pushing toward negative prediction.

### Generated Files:
- `shap_waterfall_SVM_High-Positive.png/.tiff`
- `shap_waterfall_SVM_High-Negative.png/.tiff`
- `shap_waterfall_SVM_Borderline.png/.tiff`
- `shap_waterfall_SVM_Young-Patient.png/.tiff`
- `shap_waterfall_SVM_Advanced-Paternal-Age.png/.tiff`
- `shap_waterfall_SVM_True-Positive.png/.tiff`
- `shap_waterfall_SVM_False-Negative.png/.tiff`
- `shap_waterfall_XGBoost_High-Positive.png/.tiff`
- `shap_waterfall_XGBoost_High-Negative.png/.tiff`
- `shap_waterfall_XGBoost_Borderline.png/.tiff`
- `shap_waterfall_XGBoost_Young-Patient.png/.tiff`
- `shap_waterfall_XGBoost_Advanced-Paternal-Age.png/.tiff`
- `shap_waterfall_XGBoost_True-Positive.png/.tiff`
- `shap_waterfall_XGBoost_False-Negative.png/.tiff`
- `shap_waterfall_RandomForest_High-Positive.png/.tiff`
- `shap_waterfall_RandomForest_High-Negative.png/.tiff`
- `shap_waterfall_RandomForest_Borderline.png/.tiff`
- `shap_waterfall_RandomForest_Young-Patient.png/.tiff`
- `shap_waterfall_RandomForest_Advanced-Paternal-Age.png/.tiff`
- `shap_waterfall_RandomForest_True-Positive.png/.tiff`
- `shap_waterfall_RandomForest_False-Negative.png/.tiff`

---

## 3. SHAP Dependence Plots

SHAP dependence plots for the top 10 most important features (from Part 1):

| Feature | Interaction Feature |
|---------|-------------------|
| Testis Size right (Sono) | Surgery trauma(s) |
| Seminal plasma pH | Prolactin |
| Surgery trauma(s) | Pathology-RT |
| Testis Size left (Sono) | Seminal plasma pH |
| E2 | RT-XYZ (Sono) |
| Sakamoto-RT/mL | infertile family members |
| Age | Prolactin |
| Race | Sakamoto-LT/mL |
| infertile family members | Karyotype |
| Hypertension | Surgery trauma(s) |

### Generated Files:
- `shap_dependence_Testis_Size_right_Sono.png/.tiff`
- `shap_dependence_Seminal_plasma_pH.png/.tiff`
- `shap_dependence_Surgery_traumas.png/.tiff`
- `shap_dependence_Testis_Size_left_Sono.png/.tiff`
- `shap_dependence_E2.png/.tiff`
- `shap_dependence_Sakamoto-RT_mL.png/.tiff`
- `shap_dependence_Age.png/.tiff`
- `shap_dependence_Race.png/.tiff`
- `shap_dependence_infertile_family_members.png/.tiff`
- `shap_dependence_Hypertension.png/.tiff`

---

## 4. LIME Explanations

LIME (Local Interpretable Model-agnostic Explanations) was applied to each archetype
sample using the SVM model with 5000 perturbation samples and 15 features.

### Key LIME Findings:

- **High-Positive**: Top contributors: Prolactin > 3.47 (-0.1397), Race > 1.85 (-0.0840), -1.05 < Surgery trauma(s) <= 3.24 (+0.0763)
- **High-Negative**: Top contributors: -8.17 < Seminal plasma pH <= -2.61 (-0.1245), LH > 4.30 (+0.1007), Testis Size right (Sono) > 2.01 (-0.0883)
- **Borderline**: Top contributors: -8.17 < Seminal plasma pH <= -2.61 (-0.1247), Prolactin <= -5.40 (+0.1227), Testis Size left (Sono) > 2.36 (+0.0898)
- **Young-Patient**: Top contributors: -8.17 < Seminal plasma pH <= -2.61 (-0.1306), Testis Size left (Sono) > 2.36 (+0.1283), Prolactin <= -5.40 (+0.0962)
- **Advanced-Paternal-Age**: Top contributors: Seminal plasma pH > 2.78 (+0.3541), Age > 1.24 (+0.0971), Sakamoto-LT/mL <= -1.84 (-0.0686)
- **True-Positive**: Top contributors: Seminal plasma pH > 2.78 (+0.3625), Testis Size left (Sono) > 2.36 (+0.1203), Testosterone levels <= -5.57 (+0.0879)
- **False-Negative**: Top contributors: Seminal plasma pH <= -8.17 (-0.2978), Surgery trauma(s) <= -5.45 (-0.1542), Testis Size right (Sono) > 2.01 (-0.0956)

### LIME vs SHAP Agreement:
- A comparison plot (`shap_vs_lime_comparison.png`) shows side-by-side SHAP and LIME
  explanations for all archetypes.
- Both methods generally agree on top contributing features, with some differences
  in magnitude and ranking due to their different methodological approaches.

### Generated Files:
- `lime_High-Positive.png/.tiff`
- `lime_High-Negative.png/.tiff`
- `lime_Borderline.png/.tiff`
- `lime_Young-Patient.png/.tiff`
- `lime_Advanced-Paternal-Age.png/.tiff`
- `lime_True-Positive.png/.tiff`
- `lime_False-Negative.png/.tiff`
- `shap_vs_lime_comparison.png/.tiff`
- `lime_explanations.json`

---

## 5. Partial Dependence Plots (PDP)

PDP shows the average marginal effect of each feature on the predicted outcome.
Generated for the top 5 features using XGBoost model:

- Testis Size right (Sono)
- Seminal plasma pH
- Surgery trauma(s)
- Testis Size left (Sono)
- E2

### Generated Files:
- `pdp_Testis_Size_right_Sono.png/.tiff`
- `pdp_Seminal_plasma_pH.png/.tiff`
- `pdp_Surgery_traumas.png/.tiff`
- `pdp_Testis_Size_left_Sono.png/.tiff`
- `pdp_E2.png/.tiff`

---

## 6. ICE (Individual Conditional Expectation) Plots

ICE plots show individual prediction trajectories for 200 randomly selected samples,
with the PDP (average) overlaid in red. Generated for the top 5 features using XGBoost.

### Generated Files:
- `ice_Testis_Size_right_Sono.png/.tiff`
- `ice_Seminal_plasma_pH.png/.tiff`
- `ice_Surgery_traumas.png/.tiff`
- `ice_Testis_Size_left_Sono.png/.tiff`
- `ice_E2.png/.tiff`

---

## Summary of All Output Files

### Results (3_Results/Phase5_XAI/):
- `archetype_samples.csv` - Selected archetype samples with all feature values
- `lime_explanations.json` - Detailed LIME explanations for all archetypes

### Figures (4_Figures/Phase5_XAI/):
- 21 SHAP Waterfall plots (7 archetypes × 3 models)
- 10 SHAP Dependence plots (top 10 features)
- 7 LIME explanation plots
- 1 SHAP vs LIME comparison plot
- 5 PDP plots (top 5 features)
- 5 ICE plots (top 5 features)

All figures available in PNG and TIFF (300 DPI) formats.

---


# Part 3: Model Performance Visualization – Summary Log

**Project**: NOA ML – Predicting Sperm Retrieval Success  
**Researcher**: Hossein Jamalirad, PhD Candidate of Medical Informatics  
**Date**: 2026-03-13 07:22  
**Dataset**: 2450 samples, 36 features  
**Models Analyzed**: 27  
**Bootstrap Iterations**: 1000  
**Execution Time**: 71.7 seconds  

---

## 1. ROC Curves with 95% Bootstrap CI

| Rank | Model | AUC | 95% CI | Optimal Threshold |
|------|-------|-----|--------|-------------------|
| 1 | LightGBM | 1.0000 | [1.0000–1.0000] | 0.6055 |
| 2 | KNN | 1.0000 | [1.0000–1.0000] | 1.0000 |
| 3 | VotingEnsemble | 1.0000 | [1.0000–1.0000] | 0.5786 |
| 4 | StackingEnsemble | 1.0000 | [1.0000–1.0000] | 0.9045 |
| 5 | XGBoost | 1.0000 | [1.0000–1.0000] | 0.5005 |
| 6 | RandomForest | 1.0000 | [0.9999–1.0000] | 0.5073 |
| 7 | GradientBoosting | 0.9995 | [0.9991–0.9998] | 0.4587 |
| 8 | ExtraTrees | 0.9992 | [0.9986–0.9997] | 0.5120 |
| 9 | KNN_adjusted | 0.9988 | [0.9972–0.9997] | 0.4168 |
| 10 | StackingEnsemble_adjusted | 0.9987 | [0.9976–0.9994] | 0.3954 |
| 11 | VotingEnsemble_adjusted | 0.9985 | [0.9974–0.9993] | 0.3589 |
| 12 | TabNet | 0.9984 | [0.9970–0.9995] | 0.3725 |
| 13 | CatBoost | 0.9974 | [0.9957–0.9986] | 0.5141 |
| 14 | MLP | 0.9973 | [0.9949–0.9989] | 0.5033 |
| 15 | CatBoost_adjusted | 0.9955 | [0.9926–0.9975] | 0.5079 |
| 16 | DecisionTree | 0.9951 | [0.9932–0.9968] | 0.5012 |
| 17 | SVM | 0.9936 | [0.9899–0.9964] | 0.4359 |
| 18 | RandomForest_adjusted | 0.9907 | [0.9872–0.9933] | 0.4858 |
| 19 | TabNet_adjusted | 0.9879 | [0.9828–0.9923] | 0.3764 |
| 20 | MLP_adjusted | 0.9859 | [0.9803–0.9905] | 0.4542 |
| 21 | GradientBoosting_adjusted | 0.9845 | [0.9799–0.9884] | 0.3516 |
| 22 | XGBoost_adjusted | 0.9839 | [0.9794–0.9880] | 0.5359 |
| 23 | LightGBM_adjusted | 0.9837 | [0.9791–0.9875] | 0.4922 |
| 24 | ExtraTrees_adjusted | 0.9797 | [0.9743–0.9841] | 0.5113 |
| 25 | DecisionTree_adjusted | 0.9240 | [0.9114–0.9348] | 0.6260 |
| 26 | LogisticRegression | 0.8341 | [0.8165–0.8509] | 0.4773 |
| 27 | NaiveBayes | 0.8236 | [0.8063–0.8410] | 0.4195 |

**Top 5 by AUC**: LightGBM, KNN, VotingEnsemble, StackingEnsemble, XGBoost

### Generated Figures:
- Individual ROC curves: `roc_<model>.png/.tiff` (27 files)
- All models comparison: `roc_comparison_all_models.png/.tiff`
- Top 5 with CI: `roc_top5_with_CI.png/.tiff`

---

## 2. Precision-Recall Curves

| Rank | Model | Average Precision |
|------|-------|-------------------|
| 1 | LightGBM | 1.0000 |
| 2 | KNN | 1.0000 |
| 3 | VotingEnsemble | 1.0000 |
| 4 | StackingEnsemble | 1.0000 |
| 5 | XGBoost | 1.0000 |
| 6 | RandomForest | 1.0000 |
| 7 | GradientBoosting | 0.9993 |
| 8 | ExtraTrees | 0.9988 |
| 9 | KNN_adjusted | 0.9984 |
| 10 | TabNet | 0.9980 |
| 11 | StackingEnsemble_adjusted | 0.9980 |
| 12 | VotingEnsemble_adjusted | 0.9978 |
| 13 | MLP | 0.9968 |
| 14 | CatBoost | 0.9963 |
| 15 | CatBoost_adjusted | 0.9939 |
| 16 | SVM | 0.9918 |
| 17 | DecisionTree | 0.9890 |
| 18 | RandomForest_adjusted | 0.9870 |
| 19 | TabNet_adjusted | 0.9848 |
| 20 | MLP_adjusted | 0.9823 |
| 21 | GradientBoosting_adjusted | 0.9766 |
| 22 | XGBoost_adjusted | 0.9766 |
| 23 | LightGBM_adjusted | 0.9757 |
| 24 | ExtraTrees_adjusted | 0.9702 |
| 25 | DecisionTree_adjusted | 0.8666 |
| 26 | LogisticRegression | 0.7426 |
| 27 | NaiveBayes | 0.7219 |

**Top 5 by AP**: LightGBM, KNN, VotingEnsemble, StackingEnsemble, XGBoost

### Generated Figures:
- Individual PR curves: `pr_<model>.png/.tiff` (27 files)
- All models comparison: `pr_comparison_all_models.png/.tiff`

---

## 3. Calibration / Reliability Diagrams

| Rank | Model | Brier Score |
|------|-------|-------------|
| 1 | KNN | 0.0000 |
| 2 | StackingEnsemble | 0.0005 |
| 3 | LightGBM | 0.0050 |
| 4 | VotingEnsemble | 0.0070 |
| 5 | TabNet | 0.0091 |
| 6 | StackingEnsemble_adjusted | 0.0112 |
| 7 | XGBoost | 0.0114 |
| 8 | KNN_adjusted | 0.0119 |
| 9 | MLP | 0.0137 |
| 10 | VotingEnsemble_adjusted | 0.0188 |
| 11 | SVM | 0.0221 |
| 12 | DecisionTree | 0.0225 |
| 13 | GradientBoosting | 0.0225 |
| 14 | RandomForest | 0.0313 |
| 15 | TabNet_adjusted | 0.0344 |
| 16 | CatBoost | 0.0355 |
| 17 | CatBoost_adjusted | 0.0369 |
| 18 | MLP_adjusted | 0.0401 |
| 19 | GradientBoosting_adjusted | 0.0608 |
| 20 | XGBoost_adjusted | 0.0649 |
| 21 | LightGBM_adjusted | 0.0652 |
| 22 | RandomForest_adjusted | 0.0812 |
| 23 | ExtraTrees | 0.0919 |
| 24 | DecisionTree_adjusted | 0.0973 |
| 25 | ExtraTrees_adjusted | 0.1547 |
| 26 | LogisticRegression | 0.1661 |
| 27 | NaiveBayes | 0.1728 |

**Best Calibrated (lowest Brier)**: KNN, StackingEnsemble, LightGBM, VotingEnsemble, TabNet

### Generated Figures:
- Individual calibration plots: `calibration_<model>.png/.tiff` (27 files)
- All models comparison: `calibration_comparison_all_models.png/.tiff`

---

## 4. Confusion Matrices

All confusion matrices use **Youden's J statistic** optimal thresholds.

| Model | Threshold | Sensitivity | Specificity | PPV | NPV | F1 | Accuracy |
|-------|-----------|-------------|-------------|-----|-----|----|----------|
| LightGBM | 0.6055 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| KNN | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| VotingEnsemble | 0.5786 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| StackingEnsemble | 0.9045 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 |
| XGBoost | 0.5005 | 1.0000 | 0.9980 | 0.9967 | 1.0000 | 0.9984 | 0.9988 |
| RandomForest | 0.5073 | 0.9989 | 0.9987 | 0.9978 | 0.9993 | 0.9984 | 0.9988 |
| GradientBoosting | 0.4587 | 0.9858 | 0.9928 | 0.9880 | 0.9915 | 0.9869 | 0.9902 |
| ExtraTrees | 0.5120 | 0.9880 | 0.9902 | 0.9837 | 0.9928 | 0.9858 | 0.9894 |
| KNN_adjusted | 0.4168 | 0.9869 | 0.9870 | 0.9784 | 0.9921 | 0.9826 | 0.9869 |
| StackingEnsemble_adjusted | 0.3954 | 0.9858 | 0.9889 | 0.9815 | 0.9915 | 0.9837 | 0.9878 |
| VotingEnsemble_adjusted | 0.3589 | 0.9869 | 0.9857 | 0.9762 | 0.9921 | 0.9815 | 0.9861 |
| TabNet | 0.3725 | 0.9880 | 0.9922 | 0.9869 | 0.9928 | 0.9875 | 0.9906 |
| CatBoost | 0.5141 | 0.9771 | 0.9824 | 0.9707 | 0.9863 | 0.9739 | 0.9804 |
| MLP | 0.5033 | 0.9814 | 0.9922 | 0.9868 | 0.9890 | 0.9841 | 0.9882 |
| CatBoost_adjusted | 0.5079 | 0.9705 | 0.9811 | 0.9684 | 0.9824 | 0.9695 | 0.9771 |
| DecisionTree | 0.5012 | 0.9891 | 0.9602 | 0.9369 | 0.9933 | 0.9623 | 0.9710 |
| SVM | 0.4359 | 0.9727 | 0.9713 | 0.9529 | 0.9835 | 0.9627 | 0.9718 |
| RandomForest_adjusted | 0.4858 | 0.9487 | 0.9622 | 0.9374 | 0.9691 | 0.9430 | 0.9571 |
| TabNet_adjusted | 0.3764 | 0.9596 | 0.9602 | 0.9351 | 0.9755 | 0.9472 | 0.9600 |
| MLP_adjusted | 0.4542 | 0.9465 | 0.9648 | 0.9414 | 0.9680 | 0.9439 | 0.9580 |
| GradientBoosting_adjusted | 0.3516 | 0.9541 | 0.9348 | 0.8973 | 0.9715 | 0.9249 | 0.9420 |
| XGBoost_adjusted | 0.5359 | 0.9290 | 0.9583 | 0.9301 | 0.9577 | 0.9295 | 0.9473 |
| LightGBM_adjusted | 0.4922 | 0.9421 | 0.9465 | 0.9132 | 0.9648 | 0.9275 | 0.9449 |
| ExtraTrees_adjusted | 0.5113 | 0.9225 | 0.9355 | 0.8951 | 0.9529 | 0.9086 | 0.9306 |
| DecisionTree_adjusted | 0.6260 | 0.8974 | 0.8670 | 0.8012 | 0.9340 | 0.8465 | 0.8784 |
| LogisticRegression | 0.4773 | 0.7828 | 0.7425 | 0.6448 | 0.8513 | 0.7071 | 0.7576 |
| NaiveBayes | 0.4195 | 0.7336 | 0.7490 | 0.6358 | 0.8248 | 0.6812 | 0.7433 |

### Generated Figures:
- Individual confusion matrices: `cm_<model>.png/.tiff` (27 files)
- Grid view all models: `cm_grid_all_models.png/.tiff`

---

## 5. Performance Summary

### Overall Best Performers (by AUC):
1. **LightGBM**: AUC=1.0000, AP=1.0000, Brier=0.0050, F1=1.0000
2. **KNN**: AUC=1.0000, AP=1.0000, Brier=0.0000, F1=1.0000
3. **VotingEnsemble**: AUC=1.0000, AP=1.0000, Brier=0.0070, F1=1.0000
4. **StackingEnsemble**: AUC=1.0000, AP=1.0000, Brier=0.0005, F1=1.0000
5. **XGBoost**: AUC=1.0000, AP=1.0000, Brier=0.0114, F1=0.9984

### Generated Figures:
- Performance heatmap: `performance_summary_heatmap.png/.tiff`

---

## Output Files

### Data Files (in `3_Results/Phase5_XAI/`):
- `performance_metrics_all_models.csv` – Complete metrics with rankings
- `confusion_matrix_metrics.csv` – Confusion matrix breakdown
- `optimal_thresholds_phase5.csv` – Optimal thresholds (Youden's J)

### Figures (in `4_Figures/Phase5_XAI/`, PNG + TIFF @ 300 DPI):
- 27 × ROC curves (`roc_<model>`)
- 27 × PR curves (`pr_<model>`)
- 27 × Calibration plots (`calibration_<model>`)
- 27 × Confusion matrices (`cm_<model>`)
- 1 × ROC comparison (`roc_comparison_all_models`)
- 1 × ROC top 5 with CI (`roc_top5_with_CI`)
- 1 × PR comparison (`pr_comparison_all_models`)
- 1 × Calibration comparison (`calibration_comparison_all_models`)
- 1 × CM grid (`cm_grid_all_models`)
- 1 × Performance heatmap (`performance_summary_heatmap`)
- **Total: ~116 figure files (58 PNG + 58 TIFF)**


---


# Part 4: Advanced XAI Analysis – Summary Log
## NOA ML Project – Phase 5

**Date**: 2026-03-13 07:32
**Dataset**: 2450 samples, 36 features
**Models**: 27 models analyzed

---

### 1. Uncertainty Quantification

**Method**: Bootstrap sampling (100 iterations) for 8 top models
**Metrics**: Prediction confidence intervals, calibrated confidence scores

| Model | Median Std | Mean CI Width | High-Uncertainty Samples |
|-------|-----------|---------------|------------------------|
| SVM | 0.0000 | 0.0000 | 0 |
| XGBoost | 0.0000 | 0.0001 | 0 |
| LightGBM | 0.0000 | 0.0000 | 0 |
| RandomForest | 0.0000 | 0.0000 | 0 |
| GradientBoosting | 0.0000 | 0.0000 | 0 |
| VotingEnsemble | 0.0000 | 0.0000 | 0 |
| StackingEnsemble | 0.0000 | 0.0000 | 0 |
| KNN | 0.0000 | 0.0000 | 0 |

**Ensemble Variance**: Computed for RandomForest, ExtraTrees using individual estimator predictions.

**Figures**:
- `uncertainty_distribution.png/tiff` – Bootstrap std dev distribution
- `uncertainty_ci_by_class.png/tiff` – CI width by true class
- `uncertainty_prob_vs_ci.png/tiff` – Probability vs uncertainty scatter
- `ensemble_variance_distribution.png/tiff` – Ensemble variance

---

### 2. Feature Interaction Analysis

**Method**: SHAP interaction values (XGBoost)
**Samples**: 490 (stratified subsample)

**Top 10 Feature Interaction Pairs**:

| Rank | Feature 1 | Feature 2 | Mean |SHAP Interaction| |
|------|-----------|-----------|---------------------|
| 1 | Testis Size right (Sono) | Sakamoto-RT/mL | 0.1612 |
| 2 | Sakamoto-LT/mL | E2 | 0.0934 |
| 3 | Testis Size right (Sono) | E2 | 0.0917 |
| 4 | Seminal plasma pH | Testosterone levels | 0.0821 |
| 5 | Surgery trauma(s) | Testis Size right (Sono) | 0.0814 |
| 6 | Race | Sakamoto-RT/mL | 0.0778 |
| 7 | Testis Size right (Sono) | Seminal plasma pH | 0.0761 |
| 8 | Race | Surgery trauma(s) | 0.0530 |
| 9 | Age | Race | 0.0528 |
| 10 | Pathology-RT | RT-XYZ (Sono) | 0.0498 |

**Figures**:
- `interaction_heatmap.png/tiff` – SHAP interaction heatmap (top 15 features)
- `interaction_pair_*.png/tiff` – Detailed plots for top 5 pairs

---

### 3. Counterfactual Explanations

**Model**: XGBoost
**Method**: Greedy perturbation of clinically actionable features
**Archetypes analyzed**: High-Negative, Borderline, False-Negative

| Archetype | Original Prob | CF Prob | Flipped | N Changes |
|-----------|--------------|---------|---------|-----------|
| High-Negative | 0.0514 | 0.7168 | Yes | 1 |
| Borderline | 0.4056 | 0.9040 | Yes | 1 |
| False-Negative | 0.5073 | 0.3445 | Yes | 1 |

**Key Changes**:

**High-Negative**:
- Testis Size right (Sono): 3.029 → -3.279 (Δ=-6.307)

**Borderline**:
- Testis Size right (Sono): -0.326 → -3.279 (Δ=-2.953)

**False-Negative**:
- Testis Size right (Sono): 2.074 → 3.516 (Δ=1.442)

**Figures**:
- `counterfactual_explanations.png/tiff` – Original vs counterfactual comparison

---

### 4. Clinical Rules (Anchors)

**Method**: Surrogate decision trees (depth=4, min_samples_leaf=50)

| Model | Fidelity | Surrogate AUC | Total Rules | High-Conf Rules |
|-------|----------|---------------|-------------|-----------------|
| XGBoost | 0.782 | 0.845 | 14 | 14 |
| LightGBM | 0.781 | 0.845 | 14 | 14 |
| SVM | 0.793 | 0.843 | 14 | 14 |
| RandomForest | 0.786 | 0.848 | 14 | 14 |
| GradientBoosting | 0.794 | 0.847 | 14 | 14 |

**Example Rules** (from XGBoost):
1. IF Testis Size right (Sono) <= -0.382 AND E2 > 2.168 AND LH <= 0.533 AND Y chromosome microdeletion (AZFa, AZFb, AZFc) > -1.096 THEN **Failure** (confidence=0.98, n=86)
2. IF Testis Size right (Sono) > -0.382 AND Surgery trauma(s) <= -4.336 AND Hypertension <= 1.563 AND Orchiopexy > -3.700 THEN **Failure** (confidence=0.95, n=496)
3. IF Testis Size right (Sono) <= -0.382 AND E2 <= 2.168 AND Sakamoto-RT/mL <= -1.086 AND Testis Size right (Sono) <= -1.308 THEN **Success** (confidence=0.94, n=251)
4. IF Testis Size right (Sono) > -0.382 AND Surgery trauma(s) > -4.336 AND Seminal plasma pH <= -2.713 AND Age <= 1.174 THEN **Failure** (confidence=0.83, n=399)
5. IF Testis Size right (Sono) > -0.382 AND Surgery trauma(s) <= -4.336 AND Hypertension <= 1.563 AND Orchiopexy <= -3.700 THEN **Failure** (confidence=0.76, n=58)

**Figures**:
- `clinical_rules_summary.png/tiff` – Rule summary with confidence scores

---

### 5. Model Agreement Analysis

**Models**: 27 models
**High agreement (≥90%)**: 2116 samples (86.4%)
**Low agreement (<70%)**: 57 samples (2.3%)

**Figures**:
- `model_agreement_heatmap.png/tiff` – Prediction heatmap (100 samples × 27 models)
- `model_agreement_distribution.png/tiff` – Agreement rate distribution
- `agreement_feature_comparison.png/tiff` – Feature distributions by agreement level

---

### 6. Prediction Stability Analysis

**Method**: Random perturbations (±5%, ±10%) with 20 iterations per level
**Samples**: 500 (random subsample)

**Top 5 Most Stable Models (±5%)**:

| Model | Stability Score | Flip Rate | Mean Prob Change |
|-------|----------------|-----------|------------------|
| KNN | 1.0000 | 0.0000 | 0.0149 |
| StackingEnsemble | 1.0000 | 0.0000 | 0.0034 |
| TabNet | 1.0000 | 0.0000 | 0.0015 |
| VotingEnsemble | 0.9997 | 0.0003 | 0.0113 |
| SVM | 0.9996 | 0.0004 | 0.0013 |

**Top 5 Most Unstable Features** (XGBoost):

| Feature | Mean Probability Change |
|---------|----------------------|
| Testis Size right (Sono) | 0.0025 |
| Testis Size left (Sono) | 0.0014 |
| E2 | 0.0012 |
| Diabetes | 0.0011 |
| Sakamoto-RT/mL | 0.0011 |

**Figures**:
- `prediction_stability_comparison.png/tiff` – Stability score comparison
- `feature_instability_ranking.png/tiff` – Feature instability ranking
- `flip_rate_heatmap.png/tiff` – Flip rate heatmap

---

### Output Files

**Data Files** (in `3_Results/Phase5_XAI/`):
- `uncertainty_analysis.csv` – Bootstrap uncertainty for all samples
- `feature_interactions.csv` – SHAP interaction values for all feature pairs
- `counterfactual_explanations.json` – Counterfactual scenarios
- `clinical_rules.json` – Extracted clinical rules
- `model_agreement.csv` – Model agreement for all samples
- `prediction_stability.csv` – Stability metrics for all models

**Figures** (in `4_Figures/Phase5_XAI/`, PNG + TIFF 300 DPI):
- Uncertainty: 4 figures
- Interactions: 6 figures (heatmap + 5 pair plots)
- Counterfactuals: 1 figure
- Clinical Rules: 1 figure
- Model Agreement: 3 figures
- Prediction Stability: 3 figures
- **Total new figures**: ~18 (36 files with PNG+TIFF)


---


# Part 5: Clinical Decision Support Tools — Summary Log

## Project Information
- **Project**: NOA ML Project — Machine Learning for Predicting Sperm Retrieval Success
- **Researcher**: Hossein Jamalirad, PhD Candidate of Medical Informatics
- **Phase**: 5 (Explainable AI), Part 5 (Clinical Decision Support)
- **Date**: 2026-03-13 07:39
- **Dataset**: 2450 samples, 36 features
- **Models Analyzed**: 27 total, Top 5: LightGBM, KNN, VotingEnsemble, StackingEnsemble, XGBoost
- **Best Model**: LightGBM

---

## Task 1: Subgroup Analysis

### Subgroup Definitions
| Subgroup | Feature | Criteria | N |
|----------|---------|----------|---|
| Age: Young (<35) | — | Quantile-based | 613 |
| Age: Middle (35-45) | — | Quantile-based | 1224 |
| Age: Advanced (>45) | — | Quantile-based | 613 |
| Karyotype: Normal | — | Quantile-based | 1225 |
| Karyotype: Abnormal | — | Quantile-based | 1225 |
| FSH: Normal (<12) | — | Quantile-based | 1225 |
| FSH: Elevated (≥12) | — | Quantile-based | 1225 |
| Testis: Small | — | Quantile-based | 809 |
| Testis: Normal | — | Quantile-based | 808 |
| Testis: Large | — | Quantile-based | 833 |

### Key Findings
- **Best performing subgroup**: Age: Young (<35) (AUC = 1.0000)
- **Worst performing subgroup**: Age: Young (<35) (AUC = 1.0000)
- **AUC range across subgroups**: 1.0000 — 1.0000

### Generated Figures
- `subgroup_performance_comparison.png/.tiff` — AUC comparison across all subgroup categories
- `subgroup_sensitivity_specificity.png/.tiff` — Sensitivity & Specificity bar charts
- `subgroup_radar_plot.png/.tiff` — Radar plot of subgroup performance

---

## Task 2: Clinical Risk Stratification

### Risk Group Summary
| Risk Group | N | % of Total | Actual Success Rate | Mean Probability |
|------------|---|-----------|--------------------|--------------------|
| High Risk (P<0.3) | 1525 | 62.2% | 0.0% | 0.044 |
| Medium Risk (0.3-0.7) | 13 | 0.5% | 30.8% | 0.432 |
| Low Risk (P>0.7) | 912 | 37.2% | 100.0% | 0.956 |

### Clinical Interpretation
- Patients in the **Low Risk** group (predicted probability > 0.7) have the highest actual success rates
- **Medium Risk** patients (0.3–0.7) require additional clinical assessment
- **High Risk** patients (< 0.3) may benefit from alternative approaches or counseling

### Generated Figures
- `risk_stratification.png/.tiff` — Distribution, success rates, and pie chart
- `risk_stratification_calibration.png/.tiff` — Calibration within risk groups

---

## Task 3: Clinical Decision Curves (DCA)

### Net Benefit Analysis
- **Method**: Decision Curve Analysis comparing model predictions vs "Treat All" vs "Treat None"
- **Best Model**: LightGBM
- **Optimal Threshold Range**: 0.01 — 0.98
- **Clinical Implication**: Within the optimal range, the model provides net clinical benefit over both "treat all" and "treat none" strategies

### Generated Figures
- `decision_curve_analysis.png/.tiff` — Combined DCA for top 5 models
- `decision_curve_individual.png/.tiff` — Individual DCA plots

---

## Task 4: Nomogram

### Logistic Regression Model
- **AUC**: 0.8319
- **Number of features**: 36
- **Point system**: Coefficients scaled to -100 to +100 points

### Top Predictors (by Nomogram Points)
| Feature | Points | Odds Ratio | 95% CI |
|---------|--------|-----------|--------|
| infertile family members | 67.2 | 1.638 | 1.545–1.737 |
| Seminal plasma pH | 65.0 | 1.613 | 1.524–1.707 |
| Testis Size left (Sono) | 54.7 | 1.494 | 1.425–1.567 |
| Age | 54.5 | 1.492 | 1.423–1.565 |
| FSH | 48.4 | 1.427 | 1.368–1.489 |
| LH | 33.9 | 1.283 | 1.245–1.321 |
| Hypertension | 33.7 | 1.281 | 1.244–1.319 |
| Diabetes | 26.4 | 1.214 | 1.186–1.242 |
| Testicular volume_RT (Guess) | 17.5 | 1.137 | 1.120–1.154 |
| Surgery trauma(s) | 14.8 | 1.115 | 1.101–1.129 |

### Generated Figures
- `nomogram_point_system.png/.tiff` — Point system bar chart
- `nomogram_full.png/.tiff` — Full nomogram with scales
- `nomogram_odds_ratio_forest.png/.tiff` — Odds ratio forest plot

---

## Task 5: Cost-Benefit Analysis

### Cost Scenarios
| Scenario | Optimal Threshold | Max Net Benefit |
|----------|-------------------|-----------------|
| Base Case | 0.39 | 3515.0 |
| FN Costly (Conservative) | 0.39 | 3515.0 |
| FP Costly (Aggressive) | 0.39 | 3515.0 |
| Equal Costs | 0.39 | 2599.0 |
| High Stakes | 0.39 | 6114.0 |

### Clinical Interpretation
- The optimal threshold varies depending on the relative costs of FP (unnecessary procedure) vs FN (missed opportunity)
- **Conservative approach** (FN Costly): Lower threshold → more procedures, fewer missed cases
- **Aggressive approach** (FP Costly): Higher threshold → fewer procedures, more missed cases

### Generated Figures
- `cost_benefit_analysis.png/.tiff` — Net benefit curves and optimal thresholds
- `cost_benefit_sensitivity.png/.tiff` — Sensitivity analysis heatmap

---

## Task 6: Fairness Analysis

### Fairness Metrics

#### Age Groups
| Metric | Disparity | Assessment |
|--------|-----------|------------|
| TPR (Equal Opportunity) | 0.000 | ✓ Fair |
| PPR (Demographic Parity) | 0.197 | ⚠️ Potential Bias |
| FPR | 0.000 | ✓ Fair |
| PPV (Predictive Parity) | 0.000 | ✓ Fair |

#### Race/Ethnicity Groups
| Metric | Disparity | Assessment |
|--------|-----------|------------|
| TPR (Equal Opportunity) | 0.000 | ✓ Fair |
| PPR (Demographic Parity) | 0.072 | ✓ Fair |
| FPR | 0.000 | ✓ Fair |
| PPV (Predictive Parity) | 0.000 | ✓ Fair |

### Generated Figures
- `fairness_analysis.png/.tiff` — TPR and PPR comparison across groups
- `fairness_disparity_summary.png/.tiff` — Disparity summary

---

## Task 7: Feature Redundancy Analysis

### Highly Correlated Feature Pairs (|r| > 0.7)
- **Total pairs found**: 2
| Feature 1 | Feature 2 | Correlation |
|-----------|-----------|-------------|
| Pathology-RT | LT-XYZ (Sono) | 1.000 |
| Pathology-LT | Hieght | 1.000 |

### Minimal Feature Set Analysis
- **Full model AUC**: 1.0000
- **95% performance threshold AUC**: 0.9500
- **Minimal feature set for 95% performance**: 25 features

| N Features | AUC | % of Full |
|------------|-----|-----------|
| 5 | 0.6741 | 67.4% |
| 10 | 0.7115 | 71.2% |
| 15 | 0.8121 | 81.2% |
| 20 | 0.9197 | 92.0% |
| 25 | 0.9685 | 96.9% |
| 30 | 0.9935 | 99.4% |
| 36 | 1.0000 | 100.0% |

### Generated Figures
- `feature_redundancy_heatmap.png/.tiff` — Full correlation heatmap
- `feature_redundancy_focused.png/.tiff` — Focused heatmap (high correlations)
- `feature_redundancy_performance.png/.tiff` — AUC vs number of features

---

## Output Files Summary

### Data Files (in `3_Results/Phase5_XAI/`)
| File | Description |
|------|-------------|
| `subgroup_analysis.csv` | Subgroup performance metrics |
| `risk_stratification.csv` | Risk group summary |
| `decision_curve_data.csv` | DCA net benefit data |
| `nomogram_coefficients.json` | Nomogram coefficients and point system |
| `cost_benefit_analysis.csv` | Cost-benefit analysis results |
| `fairness_metrics.csv` | Fairness metrics across groups |
| `feature_redundancy.csv` | Highly correlated feature pairs |

### Figures (in `4_Figures/Phase5_XAI/`)
All figures saved in both PNG and TIFF (300 DPI) formats:
1. `subgroup_performance_comparison` — Subgroup AUC comparison
2. `subgroup_sensitivity_specificity` — Subgroup Sens/Spec
3. `subgroup_radar_plot` — Radar plot
4. `risk_stratification` — Risk stratification visualization
5. `risk_stratification_calibration` — Risk group calibration
6. `decision_curve_analysis` — Combined DCA
7. `decision_curve_individual` — Individual DCA plots
8. `nomogram_point_system` — Point system bar chart
9. `nomogram_full` — Full nomogram
10. `nomogram_odds_ratio_forest` — OR forest plot
11. `cost_benefit_analysis` — Cost-benefit curves
12. `cost_benefit_sensitivity` — Sensitivity analysis
13. `fairness_analysis` — Fairness comparison
14. `fairness_disparity_summary` — Disparity summary
15. `feature_redundancy_heatmap` — Correlation heatmap
16. `feature_redundancy_focused` — Focused heatmap
17. `feature_redundancy_performance` — AUC vs features

---

*Report generated automatically by Part 5 Clinical Decision Support Tools analysis.*
