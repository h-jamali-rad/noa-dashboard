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
