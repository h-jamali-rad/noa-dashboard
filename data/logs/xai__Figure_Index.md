# Figure Index — Phase 5 XAI Analysis

## NOA ML Project — Complete Figure Catalog

**Total Figures**: 215 PNG + corresponding TIFF (300 DPI)  
**Location**: `4_Figures/Phase5_XAI/`  
**Date**: March 13, 2026  

---

## Category 1: Native Feature Importance (Part 1)

| # | Filename | Description |
|---|----------|-------------|
| 1 | `native_fi_comparison.png` | Bar chart comparing native importance across 14 tree-based models |
| 2 | `native_fi_average.png` | Average native importance with standard deviation bars |
| 3 | `native_fi_heatmap.png` | Heatmap of native importance (features × models) |

---

## Category 2: Permutation Importance (Part 1)

| # | Filename | Description |
|---|----------|-------------|
| 4 | `permutation_importance_heatmap.png` | Heatmap of permutation importance (features × 27 models) |
| 5 | `permutation_importance_boxplot.png` | Boxplot of permutation importance distributions |

---

## Category 3: SHAP Global Analysis (Part 1)

| # | Filename | Description |
|---|----------|-------------|
| 6 | `shap_beeswarm_SVM.png` | SHAP beeswarm plot — SVM model |
| 7 | `shap_beeswarm_XGBoost.png` | SHAP beeswarm plot — XGBoost model |
| 8 | `shap_beeswarm_LightGBM.png` | SHAP beeswarm plot — LightGBM model |
| 9 | `shap_beeswarm_RandomForest.png` | SHAP beeswarm plot — RandomForest model |
| 10 | `shap_beeswarm_GradientBoosting.png` | SHAP beeswarm plot — GradientBoosting model |
| 11 | `shap_bar_SVM.png` | SHAP bar plot — SVM model |
| 12 | `shap_bar_XGBoost.png` | SHAP bar plot — XGBoost model |
| 13 | `shap_bar_LightGBM.png` | SHAP bar plot — LightGBM model |
| 14 | `shap_bar_RandomForest.png` | SHAP bar plot — RandomForest model |
| 15 | `shap_bar_GradientBoosting.png` | SHAP bar plot — GradientBoosting model |
| 16 | `shap_comparison_top5.png` | Combined SHAP comparison bar chart (top 5 models) |
| 17 | `shap_heatmap_top5.png` | SHAP heatmap comparison (top 5 models) |

---

## Category 4: SHAP Waterfall Plots — Local Explanations (Part 2)

### SVM Model
| # | Filename | Description |
|---|----------|-------------|
| 18 | `shap_waterfall_SVM_High-Positive.png` | SHAP waterfall — SVM, High-Positive archetype |
| 19 | `shap_waterfall_SVM_High-Negative.png` | SHAP waterfall — SVM, High-Negative archetype |
| 20 | `shap_waterfall_SVM_Borderline.png` | SHAP waterfall — SVM, Borderline archetype |
| 21 | `shap_waterfall_SVM_Young-Patient.png` | SHAP waterfall — SVM, Young Patient |
| 22 | `shap_waterfall_SVM_Advanced-Paternal-Age.png` | SHAP waterfall — SVM, Advanced Paternal Age |
| 23 | `shap_waterfall_SVM_True-Positive.png` | SHAP waterfall — SVM, True Positive |
| 24 | `shap_waterfall_SVM_False-Negative.png` | SHAP waterfall — SVM, False Negative |

### XGBoost Model
| # | Filename | Description |
|---|----------|-------------|
| 25 | `shap_waterfall_XGBoost_High-Positive.png` | SHAP waterfall — XGBoost, High-Positive |
| 26 | `shap_waterfall_XGBoost_High-Negative.png` | SHAP waterfall — XGBoost, High-Negative |
| 27 | `shap_waterfall_XGBoost_Borderline.png` | SHAP waterfall — XGBoost, Borderline |
| 28 | `shap_waterfall_XGBoost_Young-Patient.png` | SHAP waterfall — XGBoost, Young Patient |
| 29 | `shap_waterfall_XGBoost_Advanced-Paternal-Age.png` | SHAP waterfall — XGBoost, Advanced Paternal Age |
| 30 | `shap_waterfall_XGBoost_True-Positive.png` | SHAP waterfall — XGBoost, True Positive |
| 31 | `shap_waterfall_XGBoost_False-Negative.png` | SHAP waterfall — XGBoost, False Negative |

### RandomForest Model
| # | Filename | Description |
|---|----------|-------------|
| 32 | `shap_waterfall_RandomForest_High-Positive.png` | SHAP waterfall — RF, High-Positive |
| 33 | `shap_waterfall_RandomForest_High-Negative.png` | SHAP waterfall — RF, High-Negative |
| 34 | `shap_waterfall_RandomForest_Borderline.png` | SHAP waterfall — RF, Borderline |
| 35 | `shap_waterfall_RandomForest_Young-Patient.png` | SHAP waterfall — RF, Young Patient |
| 36 | `shap_waterfall_RandomForest_Advanced-Paternal-Age.png` | SHAP waterfall — RF, Advanced Paternal Age |
| 37 | `shap_waterfall_RandomForest_True-Positive.png` | SHAP waterfall — RF, True Positive |
| 38 | `shap_waterfall_RandomForest_False-Negative.png` | SHAP waterfall — RF, False Negative |

---

## Category 5: SHAP Dependence Plots (Part 2)

| # | Filename | Description |
|---|----------|-------------|
| 39 | `shap_dependence_Testis_Size_right_Sono.png` | SHAP dependence — Testis Size right (Sono) |
| 40 | `shap_dependence_Seminal_plasma_pH.png` | SHAP dependence — Seminal plasma pH |
| 41 | `shap_dependence_Surgery_traumas.png` | SHAP dependence — Surgery trauma(s) |
| 42 | `shap_dependence_E2.png` | SHAP dependence — E2 (Estradiol) |
| 43 | `shap_dependence_Sakamoto-RT_mL.png` | SHAP dependence — Sakamoto-RT/mL |
| 44 | `shap_dependence_Age.png` | SHAP dependence — Age |
| 45 | `shap_dependence_Race.png` | SHAP dependence — Race |
| 46 | `shap_dependence_Testis_Size_left_Sono.png` | SHAP dependence — Testis Size left (Sono) |
| 47 | `shap_dependence_infertile_family_members.png` | SHAP dependence — infertile family members |
| 48 | `shap_dependence_Hypertension.png` | SHAP dependence — Hypertension |

---

## Category 6: LIME Explanations (Part 2)

| # | Filename | Description |
|---|----------|-------------|
| 49 | `lime_High-Positive.png` | LIME explanation — High-Positive archetype |
| 50 | `lime_High-Negative.png` | LIME explanation — High-Negative archetype |
| 51 | `lime_Borderline.png` | LIME explanation — Borderline archetype |
| 52 | `lime_Young-Patient.png` | LIME explanation — Young Patient |
| 53 | `lime_Advanced-Paternal-Age.png` | LIME explanation — Advanced Paternal Age |
| 54 | `lime_True-Positive.png` | LIME explanation — True Positive |
| 55 | `lime_False-Negative.png` | LIME explanation — False Negative |
| 56 | `shap_vs_lime_comparison.png` | SHAP vs LIME comparison across archetypes |

---

## Category 7: PDP & ICE Plots (Part 2)

| # | Filename | Description |
|---|----------|-------------|
| 57 | `pdp_Testis_Size_right_Sono.png` | PDP — Testis Size right (Sono) |
| 58 | `pdp_Seminal_plasma_pH.png` | PDP — Seminal plasma pH |
| 59 | `pdp_Surgery_traumas.png` | PDP — Surgery trauma(s) |
| 60 | `pdp_Testis_Size_left_Sono.png` | PDP — Testis Size left (Sono) |
| 61 | `pdp_E2.png` | PDP — E2 |
| 62 | `ice_Testis_Size_right_Sono.png` | ICE — Testis Size right (Sono) |
| 63 | `ice_Seminal_plasma_pH.png` | ICE — Seminal plasma pH |
| 64 | `ice_Surgery_traumas.png` | ICE — Surgery trauma(s) |
| 65 | `ice_Testis_Size_left_Sono.png` | ICE — Testis Size left (Sono) |
| 66 | `ice_E2.png` | ICE — E2 |

---

## Category 8: ROC Curves (Part 3)

| # | Filename | Description |
|---|----------|-------------|
| 67 | `roc_comparison_all_models.png` | ROC comparison — all 27 models |
| 68 | `roc_top5_with_CI.png` | ROC top 5 with 95% bootstrap CI |
| 69–95 | `roc_<ModelName>.png` | Individual ROC curves (27 models) |

**Individual models**: CatBoost, CatBoost_adjusted, DecisionTree, DecisionTree_adjusted, ExtraTrees, ExtraTrees_adjusted, GradientBoosting, GradientBoosting_adjusted, KNN, KNN_adjusted, LightGBM, LightGBM_adjusted, LogisticRegression, MLP, MLP_adjusted, NaiveBayes, RandomForest, RandomForest_adjusted, SVM, StackingEnsemble, StackingEnsemble_adjusted, TabNet, TabNet_adjusted, VotingEnsemble, VotingEnsemble_adjusted, XGBoost, XGBoost_adjusted

---

## Category 9: Precision-Recall Curves (Part 3)

| # | Filename | Description |
|---|----------|-------------|
| 96 | `pr_comparison_all_models.png` | PR comparison — all 27 models |
| 97–123 | `pr_<ModelName>.png` | Individual PR curves (27 models) |

---

## Category 10: Calibration Diagrams (Part 3)

| # | Filename | Description |
|---|----------|-------------|
| 124 | `calibration_comparison_all_models.png` | Calibration comparison — all 27 models |
| 125–151 | `calibration_<ModelName>.png` | Individual calibration plots (27 models) |

---

## Category 11: Confusion Matrices (Part 3)

| # | Filename | Description |
|---|----------|-------------|
| 152 | `cm_grid_all_models.png` | Confusion matrix grid — all 27 models |
| 153–179 | `cm_<ModelName>.png` | Individual confusion matrix heatmaps (27 models) |

---

## Category 12: Performance Summary (Part 3)

| # | Filename | Description |
|---|----------|-------------|
| 180 | `performance_summary_heatmap.png` | Performance metrics heatmap (all models × all metrics) |

---

## Category 13: Uncertainty Quantification (Part 4)

| # | Filename | Description |
|---|----------|-------------|
| 181 | `uncertainty_distribution.png` | Bootstrap standard deviation distribution |
| 182 | `uncertainty_ci_by_class.png` | CI width by true class |
| 183 | `uncertainty_prob_vs_ci.png` | Predicted probability vs uncertainty scatter |
| 184 | `ensemble_variance_distribution.png` | Ensemble estimator variance distribution |

---

## Category 14: Feature Interactions (Part 4)

| # | Filename | Description |
|---|----------|-------------|
| 185 | `interaction_heatmap.png` | SHAP interaction heatmap (top 15 features) |
| 186 | `interaction_pair_1_Testis_Size_rig_Sakamoto-RT_mL.png` | Top interaction: Testis Size right × Sakamoto-RT/mL |
| 187 | `interaction_pair_2_Sakamoto-LT_mL_E2.png` | Interaction: Sakamoto-LT/mL × E2 |
| 188 | `interaction_pair_3_Testis_Size_rig_E2.png` | Interaction: Testis Size right × E2 |
| 189 | `interaction_pair_4_Seminal_plasma__Testosterone_le.png` | Interaction: Seminal plasma pH × Testosterone |
| 190 | `interaction_pair_5_Surgery_trauma(_Testis_Size_rig.png` | Interaction: Surgery trauma × Testis Size right |

---

## Category 15: Counterfactual Explanations (Part 4)

| # | Filename | Description |
|---|----------|-------------|
| 191 | `counterfactual_explanations.png` | Counterfactual comparison (3 archetypes) |

---

## Category 16: Clinical Rules (Part 4)

| # | Filename | Description |
|---|----------|-------------|
| 192 | `clinical_rules_summary.png` | Rule summary with confidence scores |

---

## Category 17: Model Agreement (Part 4)

| # | Filename | Description |
|---|----------|-------------|
| 193 | `model_agreement_heatmap.png` | Prediction heatmap (100 samples × 27 models) |
| 194 | `model_agreement_distribution.png` | Agreement rate distribution |
| 195 | `agreement_feature_comparison.png` | Feature distributions by agreement level |

---

## Category 18: Prediction Stability (Part 4)

| # | Filename | Description |
|---|----------|-------------|
| 196 | `prediction_stability_comparison.png` | Stability score comparison across models |
| 197 | `feature_instability_ranking.png` | Feature instability ranking |
| 198 | `flip_rate_heatmap.png` | Flip rate heatmap across models and perturbation levels |

---

## Category 19: Subgroup Analysis (Part 5)

| # | Filename | Description |
|---|----------|-------------|
| 199 | `subgroup_performance_comparison.png` | AUC comparison across subgroups |
| 200 | `subgroup_sensitivity_specificity.png` | Sensitivity & Specificity by subgroup |
| 201 | `subgroup_radar_plot.png` | Radar plot of subgroup performance |

---

## Category 20: Risk Stratification (Part 5)

| # | Filename | Description |
|---|----------|-------------|
| 202 | `risk_stratification.png` | Risk group distribution, success rates, pie chart |
| 203 | `risk_stratification_calibration.png` | Calibration within risk groups |

---

## Category 21: Decision Curve Analysis (Part 5)

| # | Filename | Description |
|---|----------|-------------|
| 204 | `decision_curve_analysis.png` | Combined DCA for top 5 models |
| 205 | `decision_curve_individual.png` | Individual DCA plots |

---

## Category 22: Nomogram (Part 5)

| # | Filename | Description |
|---|----------|-------------|
| 206 | `nomogram_point_system.png` | Point system bar chart |
| 207 | `nomogram_full.png` | Full nomogram with probability scales |
| 208 | `nomogram_odds_ratio_forest.png` | Odds ratio forest plot |

---

## Category 23: Cost-Benefit Analysis (Part 5)

| # | Filename | Description |
|---|----------|-------------|
| 209 | `cost_benefit_analysis.png` | Net benefit curves and optimal thresholds |
| 210 | `cost_benefit_sensitivity.png` | Sensitivity analysis heatmap |

---

## Category 24: Fairness Analysis (Part 5)

| # | Filename | Description |
|---|----------|-------------|
| 211 | `fairness_analysis.png` | TPR and PPR comparison across demographic groups |
| 212 | `fairness_disparity_summary.png` | Disparity summary dashboard |

---

## Category 25: Feature Redundancy (Part 5)

| # | Filename | Description |
|---|----------|-------------|
| 213 | `feature_redundancy_heatmap.png` | Full correlation heatmap (36 features) |
| 214 | `feature_redundancy_focused.png` | Focused heatmap (high correlation pairs) |
| 215 | `feature_redundancy_performance.png` | AUC vs number of features curve |

---

## File Format Notes

- All figures are available in **PNG** (screen resolution) and **TIFF** (300 DPI, publication quality)
- TIFF files use the same filename with `.tiff` extension
- Total file count: **215 PNG + 215 TIFF = 430 figure files**

---

*Figure Index generated on March 13, 2026 — Phase 5 XAI Analysis*
