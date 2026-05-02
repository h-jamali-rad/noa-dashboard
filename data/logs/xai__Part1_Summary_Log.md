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
