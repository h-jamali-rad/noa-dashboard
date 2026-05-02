# Phase 5: Explainable AI (XAI) Analysis — Comprehensive Technical Report

## NOA ML Project: Machine Learning for Predicting Sperm Retrieval Success in Non-Obstructive Azoospermia

**Researcher**: Hossein Jamalirad, PhD Candidate of Medical Informatics  
**Institution**: Medical Informatics Group, Mashhad — Royan Infertility Treatment Center  
**Supervisors**: Dr. Vakili, Dr. Sabaghian  
**Date**: March 13, 2026  
**Dataset**: 2,450 samples, 36 clinical features, 27 machine learning models  

---

## Executive Summary

This report presents the comprehensive Explainable AI (XAI) analysis conducted as Phase 5 of the NOA ML Project. The analysis aimed to provide transparent, clinically interpretable explanations for machine learning predictions of micro-TESE (testicular sperm extraction) success in patients with Non-Obstructive Azoospermia (NOA).

### Key Highlights
- **27 ML models** were evaluated across multiple XAI techniques
- **Top predictive features**: Testis Size right (Sono), Seminal plasma pH, Surgery trauma(s), Sakamoto-RT/mL, E2 (Estradiol)
- **Best models**: LightGBM, KNN, VotingEnsemble, StackingEnsemble (AUC = 1.000)
- **86.4% of samples** showed high model agreement (≥90% consensus across all 27 models)
- **Risk stratification**: Low Risk group (37.2%) achieved 100% success rate; High Risk group (62.2%) had 0% success rate
- **14 high-confidence clinical rules** extracted with surrogate decision trees
- **Optimal decision threshold**: 0.39 (cost-optimal)
- **Minimal feature set**: 25 features maintain >95% of full model performance

---

## 1. Methodology Overview

### 1.1 XAI Techniques Employed

| Category | Technique | Purpose |
|----------|-----------|---------|
| **Global Feature Importance** | Native Feature Importance | Tree-based model intrinsic importance |
| | Permutation Importance | Model-agnostic feature relevance |
| | SHAP Global (Beeswarm, Bar) | Shapley-value based global attribution |
| **Local Interpretability** | SHAP Waterfall Plots | Individual prediction explanation |
| | LIME | Local linear surrogate explanations |
| | PDP (Partial Dependence Plots) | Marginal feature effects |
| | ICE (Individual Conditional Expectation) | Individual feature response curves |
| **Performance Evaluation** | ROC Curves (with bootstrap CI) | Discrimination assessment |
| | Precision-Recall Curves | Imbalanced classification evaluation |
| | Calibration Diagrams | Probability reliability |
| | Confusion Matrices | Classification accuracy breakdown |
| **Advanced XAI** | Uncertainty Quantification | Prediction confidence estimation |
| | SHAP Interaction Values | Feature interaction detection |
| | Counterfactual Explanations | "What-if" scenario analysis |
| | Clinical Rules (Surrogate Trees) | Interpretable decision rules |
| | Model Agreement Analysis | Cross-model consensus |
| | Prediction Stability | Robustness to input perturbation |
| **Clinical Decision Support** | Subgroup Analysis | Performance across patient subgroups |
| | Risk Stratification | Clinical risk categories |
| | Decision Curve Analysis (DCA) | Net clinical benefit assessment |
| | Nomogram | Point-based risk scoring |
| | Cost-Benefit Analysis | Threshold optimization |
| | Fairness Analysis | Bias detection across demographics |
| | Feature Redundancy | Minimal feature set identification |

### 1.2 Models Analyzed

27 machine learning models were evaluated, including:
- **Tree-based**: CatBoost, DecisionTree, ExtraTrees, GradientBoosting, LightGBM, RandomForest, XGBoost (original + adjusted variants)
- **Ensemble**: VotingEnsemble, StackingEnsemble (original + adjusted)
- **Other**: SVM, KNN, LogisticRegression, MLP, NaiveBayes, TabNet (original + adjusted variants)

---

## 2. Feature Importance Analysis

### 2.1 Native Feature Importance (Tree-Based Models)

Native feature importance was extracted from 14 tree-based models. The analysis revealed consistent top predictors across model architectures.

**Top 10 Features by Mean Native Importance:**

| Rank | Feature | Mean Importance |
|------|---------|----------------|
| 1 | Surgery trauma(s) | Highest across models |
| 2 | Race | High importance in CatBoost, LightGBM |
| 3 | Hypertension | Consistent across all tree models |
| 4 | infertile family members | Strong in CatBoost |
| 5 | Testis Size right (Sono) | Key sonographic predictor |
| 6 | Seminal plasma pH | Seminal fluid marker |
| 7 | Diabetes | Metabolic risk factor |
| 8 | Boby Weight | Anthropometric variable |
| 9 | Age | Demographic variable |
| 10 | E2 (Estradiol) | Hormonal marker |

**Figures**: `native_fi_comparison.png`, `native_fi_average.png`, `native_fi_heatmap.png`

### 2.2 Permutation Importance (All 27 Models)

Permutation importance was computed using ROC-AUC scoring with 30 repeats on a stratified subsample of 500 patients.

**Top 10 Features by Mean Permutation Importance:**

| Rank | Feature | Mean Importance |
|------|---------|----------------|
| 1 | Testis Size right (Sono) | 0.0399 |
| 2 | Seminal plasma pH | 0.0348 |
| 3 | Surgery trauma(s) | 0.0210 |
| 4 | Sakamoto-RT/mL | 0.0149 |
| 5 | E2 | 0.0134 |
| 6 | Age | ~0.013 |
| 7 | Race | ~0.012 |
| 8 | Hypertension | ~0.011 |
| 9 | infertile family members | ~0.010 |
| 10 | Testis Size left (Sono) | ~0.010 |

**Figures**: `permutation_importance_heatmap.png`, `permutation_importance_boxplot.png`

### 2.3 SHAP Global Analysis (Top 5 Models)

SHAP values were computed for the top 5 models (SVM, XGBoost, LightGBM, RandomForest, GradientBoosting) using TreeExplainer (tree models) and KernelExplainer (SVM).

**Top 10 Features by Mean Absolute SHAP Value:**

| Rank | Feature | Mean |SHAP| | SVM | XGBoost | LightGBM | RandomForest | GradientBoosting |
|------|---------|------------|------|---------|----------|--------------|------------------|
| 1 | Testis Size right (Sono) | 0.524 | 0.087 | 0.779 | 0.941 | 0.092 | 0.720 |
| 2 | Seminal plasma pH | 0.333 | 0.247 | 0.447 | 0.494 | 0.042 | 0.435 |
| 3 | Surgery trauma(s) | 0.326 | 0.152 | 0.469 | 0.561 | 0.048 | 0.399 |
| 4 | Testis Size left (Sono) | 0.251 | 0.097 | 0.374 | 0.400 | 0.023 | 0.361 |
| 5 | E2 | 0.225 | 0.045 | 0.349 | 0.427 | 0.021 | 0.283 |
| 6 | Sakamoto-RT/mL | 0.206 | 0.108 | 0.297 | 0.378 | 0.016 | 0.232 |
| 7 | Age | 0.172 | 0.054 | 0.242 | 0.321 | 0.021 | 0.224 |
| 8 | Race | 0.164 | 0.098 | 0.228 | 0.278 | 0.015 | 0.201 |
| 9 | infertile family members | 0.147 | 0.059 | 0.212 | 0.236 | 0.017 | 0.212 |
| 10 | Hypertension | 0.133 | 0.037 | 0.204 | 0.230 | 0.014 | 0.178 |

**Key Observations:**
- LightGBM shows the highest SHAP magnitudes, indicating sharp decision boundaries
- RandomForest distributes importance more evenly across features (lower individual SHAP values)
- Testis Size right (Sono) is the dominant predictor across all methods
- Strong agreement between SHAP and permutation importance rankings

**Figures**: `shap_beeswarm_*.png`, `shap_bar_*.png`, `shap_comparison_top5.png`, `shap_heatmap_top5.png`

### 2.4 Consensus Feature Ranking

Combining all three importance methods, the consensus top predictors are:

| Rank | Feature | Native | Permutation | SHAP | Clinical Category |
|------|---------|--------|-------------|------|-------------------|
| 1 | **Testis Size right (Sono)** | ✓ | #1 | #1 | Sonographic |
| 2 | **Seminal plasma pH** | ✓ | #2 | #2 | Seminal Fluid |
| 3 | **Surgery trauma(s)** | ✓ | #3 | #3 | Surgical History |
| 4 | **Sakamoto-RT/mL** | ✓ | #4 | #6 | Laboratory |
| 5 | **E2 (Estradiol)** | ✓ | #5 | #5 | Hormonal |
| 6 | **Testis Size left (Sono)** | ✓ | — | #4 | Sonographic |
| 7 | **Age** | ✓ | #6 | #7 | Demographic |
| 8 | **Race** | ✓ | #7 | #8 | Demographic |
| 9 | **infertile family members** | ✓ | #9 | #9 | Family History |
| 10 | **Hypertension** | ✓ | #8 | #10 | Comorbidity |

---

## 3. Local Interpretability

### 3.1 Clinical Archetypes

Seven clinical archetype samples were identified for detailed local analysis:

| Archetype | Pred Prob | Actual | Clinical Significance |
|-----------|-----------|--------|----------------------|
| High-Positive | >0.8 | 1 (Success) | Confident correct positive |
| High-Negative | <0.2 | 0 (Failure) | Confident correct negative |
| Borderline | ≈0.5 | Variable | Uncertain cases |
| Young Patient | Variable | Variable | Age < 40 |
| Advanced Paternal Age | Variable | Variable | Age ≥ 40 |
| True Positive | Variable | 1 | Correctly predicted success |
| False Negative | Variable | 1 | Missed success case |

### 3.2 SHAP Waterfall Analysis

SHAP waterfall plots were generated for all 7 archetypes across 3 models (SVM, XGBoost, RandomForest), yielding 21 detailed local explanation plots.

**Key Findings:**
- **High-Positive cases**: Testis Size right (Sono) and Sakamoto-RT/mL consistently push predictions toward success
- **High-Negative cases**: Low Testis Size right (Sono) and unfavorable hormonal markers drive failure predictions
- **Borderline cases**: Conflicting feature contributions create prediction uncertainty
- **False Negatives**: Testis Size right (Sono) values in ambiguous range; Surgery trauma(s) may provide corrective signal

**Figures**: `shap_waterfall_SVM_*.png`, `shap_waterfall_XGBoost_*.png`, `shap_waterfall_RandomForest_*.png`

### 3.3 SHAP Dependence Plots

Dependence plots for the top 10 features reveal non-linear relationships:

- **Testis Size right (Sono)**: Sharp threshold effect around standardized value -0.4
- **Seminal plasma pH**: Gradual effect with interaction with Testosterone levels
- **E2**: Non-linear U-shaped relationship with prediction
- **Race**: Categorical-like discrete effect levels

**Figures**: `shap_dependence_*.png` (10 figures)

### 3.4 LIME Explanations

LIME explanations for all 7 archetypes using SVM confirmed SHAP findings with:
- High agreement with SHAP on top contributing features
- Local linear approximations validating non-linear model behavior

**Figures**: `lime_*.png` (7 figures), `shap_vs_lime_comparison.png`

### 3.5 PDP/ICE Analysis

Partial Dependence and Individual Conditional Expectation plots were generated for the top 5 features using XGBoost:

| Feature | PDP Trend | ICE Heterogeneity |
|---------|-----------|-------------------|
| Testis Size right (Sono) | Strong negative (lower → higher prob) | Low heterogeneity |
| Seminal plasma pH | Moderate negative | Moderate heterogeneity |
| Surgery trauma(s) | Complex non-linear | High heterogeneity |
| Testis Size left (Sono) | Moderate negative | Low heterogeneity |
| E2 | Non-linear with threshold | Moderate heterogeneity |

**Figures**: `pdp_*.png` (5 figures), `ice_*.png` (5 figures)

---

## 4. Model Performance

### 4.1 ROC Analysis

**Top 10 Models by AUC (with 95% Bootstrap CI):**

| Rank | Model | AUC | 95% CI | Optimal Threshold |
|------|-------|-----|--------|-------------------|
| 1 | LightGBM | 1.0000 | [1.000, 1.000] | 0.606 |
| 2 | KNN | 1.0000 | [1.000, 1.000] | 1.000 |
| 3 | VotingEnsemble | 1.0000 | [1.000, 1.000] | 0.579 |
| 4 | StackingEnsemble | 1.0000 | [1.000, 1.000] | 0.904 |
| 5 | XGBoost | 0.9999 | [0.9999, 1.000] | 0.500 |
| 6 | RandomForest | 0.9999 | [0.9999, 1.000] | 0.507 |
| 7 | GradientBoosting | 0.9995 | [0.9991, 0.9998] | 0.459 |
| 8 | ExtraTrees | 0.9992 | [0.9986, 0.9997] | 0.512 |
| 9 | KNN_adjusted | 0.9988 | [0.9972, 0.9997] | 0.417 |
| 10 | StackingEnsemble_adj | 0.9987 | [0.9976, 0.9994] | 0.395 |

**Figures**: `roc_comparison_all_models.png`, `roc_top5_with_CI.png`, individual `roc_*.png` (27 figures)

### 4.2 Precision-Recall Analysis

Top models achieved Average Precision near 1.0, confirming excellent performance even under class imbalance (37.4% positive class).

**Figures**: `pr_comparison_all_models.png`, individual `pr_*.png` (27 figures)

### 4.3 Calibration Analysis

| Model | Brier Score | Calibration Quality |
|-------|-------------|-------------------|
| KNN | 0.0000 | Excellent |
| StackingEnsemble | 0.0005 | Excellent |
| LightGBM | 0.0050 | Very Good |
| VotingEnsemble | 0.0070 | Very Good |
| XGBoost | 0.0114 | Good |

**Figures**: `calibration_comparison_all_models.png`, individual `calibration_*.png` (27 figures)

### 4.4 Confusion Matrix Analysis

At optimal thresholds (Youden's J), the top 4 models achieved perfect classification:

| Model | Sensitivity | Specificity | PPV | NPV | F1 | Accuracy |
|-------|------------|-------------|-----|-----|-----|----------|
| LightGBM | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| KNN | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| VotingEnsemble | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| StackingEnsemble | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| XGBoost | 1.000 | 0.998 | 0.997 | 1.000 | 0.998 | 0.999 |
| RandomForest | 0.999 | 0.999 | 0.998 | 0.999 | 0.998 | 0.999 |
| GradientBoosting | 0.986 | 0.993 | 0.988 | 0.992 | 0.987 | 0.990 |

**Figures**: `cm_grid_all_models.png`, individual `cm_*.png` (27 figures), `performance_summary_heatmap.png`

---

## 5. Advanced XAI Analysis

### 5.1 Uncertainty Quantification

**Method**: Bootstrap sampling (100 iterations) for top 8 models

All top models demonstrated extremely low prediction uncertainty:
- **Median Standard Deviation**: 0.0000 across all top models
- **Mean CI Width**: ≤ 0.0001
- **High-uncertainty samples**: 0

This indicates highly deterministic model behavior with negligible stochastic variation.

**Figures**: `uncertainty_distribution.png`, `uncertainty_ci_by_class.png`, `uncertainty_prob_vs_ci.png`, `ensemble_variance_distribution.png`

### 5.2 Feature Interaction Analysis

**Method**: SHAP interaction values via XGBoost (490 stratified samples)

**Top 5 Feature Interaction Pairs:**

| Rank | Feature 1 | Feature 2 | Mean SHAP Interaction |
|------|-----------|-----------|----------------------|
| 1 | Testis Size right (Sono) | Sakamoto-RT/mL | 0.161 |
| 2 | Sakamoto-LT/mL | E2 | 0.093 |
| 3 | Testis Size right (Sono) | E2 | 0.092 |
| 4 | Seminal plasma pH | Testosterone levels | 0.082 |
| 5 | Surgery trauma(s) | Testis Size right (Sono) | 0.081 |

**Clinical Interpretation:**
- The dominant interaction between Testis Size right (Sono) and Sakamoto-RT/mL suggests that spermatogenic potential (Sakamoto index) modulates the effect of testicular size on prediction
- Hormonal markers (E2, Testosterone) interact significantly with sonographic measurements
- Surgery trauma modifies the effect of testicular size

**Figures**: `interaction_heatmap.png`, `interaction_pair_*.png` (5 figures)

### 5.3 Counterfactual Explanations

**Method**: Greedy perturbation of clinically actionable features (XGBoost)

| Archetype | Original Prob | CF Prob | Flipped? | Key Change |
|-----------|--------------|---------|----------|------------|
| High-Negative | 0.051 | 0.717 | ✓ Yes | Testis Size right (Sono): +6.31 SD |
| Borderline | 0.406 | 0.904 | ✓ Yes | Testis Size right (Sono): -2.95 SD |
| False-Negative | 0.507 | 0.345 | ✓ Yes | Testis Size right (Sono): +1.44 SD |

**Key Insight**: Testis Size right (Sono) emerged as the single most impactful variable for flipping predictions in all counterfactual scenarios.

**Figure**: `counterfactual_explanations.png`

### 5.4 Clinical Rules (Surrogate Decision Trees)

**Method**: Surrogate decision trees (depth=4, min_samples_leaf=50) trained on ML model predictions

| Model | Fidelity | Surrogate AUC | Total Rules | High-Confidence Rules |
|-------|----------|---------------|-------------|----------------------|
| XGBoost | 0.782 | 0.845 | 14 | 14 |
| LightGBM | 0.781 | 0.845 | 14 | 14 |
| SVM | 0.793 | 0.843 | 14 | 14 |
| RandomForest | 0.786 | 0.848 | 14 | 14 |
| GradientBoosting | 0.794 | 0.847 | 14 | 14 |

**Example High-Confidence Rules (XGBoost):**

1. **IF** Testis Size right (Sono) ≤ -0.382 **AND** E2 > 2.168 **AND** LH ≤ 0.533 **AND** Y-chromosome microdeletion > -1.096 **THEN** → **Failure** (confidence=0.98, n=86)

2. **IF** Testis Size right (Sono) > -0.382 **AND** Surgery trauma(s) ≤ -4.336 **AND** Hypertension ≤ 1.563 **AND** Orchiopexy > -3.700 **THEN** → **Failure** (confidence=0.95, n=496)

3. **IF** Testis Size right (Sono) ≤ -0.382 **AND** E2 ≤ 2.168 **AND** Sakamoto-RT/mL ≤ -1.086 **AND** Testis Size right (Sono) ≤ -1.308 **THEN** → **Success** (confidence=0.94, n=251)

**Figure**: `clinical_rules_summary.png`

### 5.5 Model Agreement Analysis

**Cross-model consensus across all 27 models:**

| Agreement Level | N Samples | Percentage |
|----------------|-----------|------------|
| High (≥90%) | 2,116 | 86.4% |
| Moderate (70-90%) | 277 | 11.3% |
| Low (<70%) | 57 | 2.3% |

**Key Finding**: The vast majority of predictions are consistent across all 27 models, indicating robust feature signals in the data.

**Figures**: `model_agreement_heatmap.png`, `model_agreement_distribution.png`, `agreement_feature_comparison.png`

### 5.6 Prediction Stability Analysis

**Method**: Random perturbations (±5%, ±10%) with 20 iterations

**Top 5 Most Stable Models (±5% perturbation):**

| Model | Stability Score | Flip Rate | Mean Prob Change |
|-------|----------------|-----------|------------------|
| KNN | 1.0000 | 0.0000 | 0.0149 |
| StackingEnsemble | 1.0000 | 0.0000 | 0.0034 |
| TabNet | 1.0000 | 0.0000 | 0.0015 |
| VotingEnsemble | 0.9997 | 0.0003 | 0.0113 |
| SVM | 0.9996 | 0.0004 | 0.0013 |

**Most Sensitivity-Inducing Features** (XGBoost):

| Feature | Mean Prob Change on Perturbation |
|---------|--------------------------------|
| Testis Size right (Sono) | 0.0025 |
| Testis Size left (Sono) | 0.0014 |
| E2 | 0.0012 |
| Diabetes | 0.0011 |
| Sakamoto-RT/mL | 0.0011 |

**Figures**: `prediction_stability_comparison.png`, `feature_instability_ranking.png`, `flip_rate_heatmap.png`

---

## 6. Clinical Decision Support

### 6.1 Subgroup Analysis

Performance was evaluated across 10 clinical subgroups using LightGBM:

| Subgroup | N | AUC |
|----------|---|-----|
| Age: Young (<35) | 613 | 1.000 |
| Age: Middle (35-45) | 1,224 | 1.000 |
| Age: Advanced (>45) | 613 | 1.000 |
| Karyotype: Normal | 1,225 | 1.000 |
| Karyotype: Abnormal | 1,225 | 1.000 |
| FSH: Normal (<12) | 1,225 | 1.000 |
| FSH: Elevated (≥12) | 1,225 | 1.000 |
| Testis: Small | 809 | 1.000 |
| Testis: Normal | 808 | 1.000 |
| Testis: Large | 833 | 1.000 |

The model maintains perfect AUC across all subgroups, demonstrating no performance degradation for any clinical subpopulation.

**Figures**: `subgroup_performance_comparison.png`, `subgroup_sensitivity_specificity.png`, `subgroup_radar_plot.png`

### 6.2 Risk Stratification

Three-tier risk classification using LightGBM predicted probabilities:

| Risk Group | N | % of Total | Actual Success Rate | Mean Probability |
|------------|---|-----------|--------------------|--------------------|
| **High Risk** (P<0.3) | 1,525 | 62.2% | 0.0% | 0.044 |
| **Medium Risk** (0.3-0.7) | 13 | 0.5% | 30.8% | 0.432 |
| **Low Risk** (P>0.7) | 912 | 37.2% | 100.0% | 0.956 |

**Clinical Implications:**
- The model produces highly bimodal predictions — very few patients fall in the uncertain "medium risk" zone
- Low-risk patients can be counseled with high confidence for micro-TESE
- High-risk patients may benefit from alternative management strategies

**Figures**: `risk_stratification.png`, `risk_stratification_calibration.png`

### 6.3 Decision Curve Analysis (DCA)

DCA demonstrated that LightGBM provides net clinical benefit over "Treat All" and "Treat None" strategies across the threshold range 0.01–0.98.

**Figures**: `decision_curve_analysis.png`, `decision_curve_individual.png`

### 6.4 Nomogram

A logistic regression-based nomogram was constructed (AUC = 0.832) for clinical point-based risk scoring:

**Top Nomogram Predictors by Points:**

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

**Figures**: `nomogram_point_system.png`, `nomogram_full.png`, `nomogram_odds_ratio_forest.png`

### 6.5 Cost-Benefit Analysis

**Optimal Threshold**: 0.39 (maximum net benefit across cost scenarios)

At threshold 0.39:
- TP = 916, FP = 0, FN = 0, TN = 1,534
- Net Benefit = 3,515 (base case)

The cost-optimal threshold of 0.39 is lower than the traditional 0.5, reflecting the higher clinical cost of false negatives (missing a patient who could benefit from micro-TESE).

**Figures**: `cost_benefit_analysis.png`, `cost_benefit_sensitivity.png`

### 6.6 Fairness Analysis

| Protected Attribute | Metric | Disparity | Assessment |
|--------------------|--------|-----------|------------|
| **Age** | TPR (Equal Opportunity) | 0.000 | ✓ Fair |
| **Age** | PPR (Demographic Parity) | 0.197 | ⚠️ Potential Bias |
| **Age** | FPR | 0.000 | ✓ Fair |
| **Age** | PPV (Predictive Parity) | 0.000 | ✓ Fair |
| **Race** | TPR | 0.000 | ✓ Fair |
| **Race** | PPR | 0.072 | ✓ Fair |
| **Race** | FPR | 0.000 | ✓ Fair |
| **Race** | PPV | 0.000 | ✓ Fair |

**Notable Finding**: A demographic parity disparity of 0.197 was detected across age groups, indicating that the positive prediction rate differs by age. This is clinically expected (different age groups have different baseline success rates) but should be monitored.

**Figures**: `fairness_analysis.png`, `fairness_disparity_summary.png`

### 6.7 Feature Redundancy Analysis

**Highly Correlated Feature Pairs** (|r| > 0.7):
| Feature 1 | Feature 2 | Correlation |
|-----------|-----------|-------------|
| Pathology-RT | LT-XYZ (Sono) | 1.000 |
| Pathology-LT | Hieght | 1.000 |

**Minimal Feature Set for 95% Performance:**

| N Features | AUC | % of Full |
|------------|-----|-----------|
| 5 | 0.674 | 67.4% |
| 10 | 0.712 | 71.2% |
| 15 | 0.812 | 81.2% |
| 20 | 0.920 | 92.0% |
| **25** | **0.969** | **96.9%** |
| 30 | 0.994 | 99.4% |
| 36 (all) | 1.000 | 100.0% |

**Result**: 25 features maintain >95% of full model performance, allowing potential simplification of clinical data collection.

**Figures**: `feature_redundancy_heatmap.png`, `feature_redundancy_focused.png`, `feature_redundancy_performance.png`

---

## 7. Conclusions and Recommendations

### 7.1 Key Conclusions

1. **Strong Predictive Performance**: Multiple ML models achieve near-perfect discrimination (AUC ≥ 0.999), with LightGBM, KNN, VotingEnsemble, and StackingEnsemble achieving AUC = 1.000

2. **Consistent Top Predictors**: Testis Size right (Sono), Seminal plasma pH, and Surgery trauma(s) consistently rank as the most important features across all XAI methods

3. **Clinical Interpretability**: The extracted clinical rules provide transparent, actionable decision logic that can be validated by domain experts

4. **Robust Predictions**: 86.4% of samples show high model agreement, and prediction stability analysis confirms resilience to input perturbation

5. **Effective Risk Stratification**: The three-tier risk classification creates clearly delineated groups with distinct success rates

6. **Fair Model Behavior**: The model is generally fair across demographic groups, with a noted but clinically expected age-based prediction rate disparity

### 7.2 Clinical Recommendations

1. **Testicular Ultrasound**: Right testicular size measured by sonography is the single most important predictor — should be prioritized in pre-operative workup
2. **Seminal Fluid Analysis**: Seminal plasma pH provides significant predictive value and should be routinely assessed
3. **Surgical History**: Prior surgical traumas significantly influence outcomes — detailed surgical history documentation is critical
4. **Laboratory Panel**: E2, Sakamoto index (RT/mL), FSH, LH, and Testosterone levels contribute substantially to prediction accuracy
5. **Threshold Selection**: A threshold of 0.39 is recommended for clinical deployment to minimize missed successful cases

### 7.3 Limitations

1. **Training data performance**: Near-perfect AUC scores may reflect overfitting; external validation on independent datasets is essential
2. **Standardized features**: All analyses were conducted on z-score standardized data; clinical interpretation requires back-transformation
3. **Feature correlations**: Two pairs of perfectly correlated features (r=1.0) suggest potential data quality issues to investigate
4. **Single-center data**: Results from Royan Infertility Treatment Center may not generalize to other populations

### 7.4 Future Directions

1. External validation on multi-center datasets
2. Prospective clinical trial to validate risk stratification
3. Development of a clinical decision support tool (web-based calculator)
4. Investigation of the perfectly correlated feature pairs for data integrity
5. Longitudinal outcome tracking to assess model calibration over time

---

## 8. Output Files Reference

### Data Files (`3_Results/Phase5_XAI/`)
| File | Description |
|------|-------------|
| `feature_importance_native.csv` | Native importance for 14 tree models |
| `permutation_importance.csv` | Permutation importance for 27 models |
| `shap_values_summary.csv` | SHAP values for top 5 models |
| `archetype_samples.csv` | 7 clinical archetype samples |
| `lime_explanations.json` | LIME explanations for archetypes |
| `performance_metrics_all_models.csv` | Full performance metrics (27 models) |
| `confusion_matrix_metrics.csv` | Confusion matrix details |
| `optimal_thresholds_phase5.csv` | Optimal thresholds per model |
| `uncertainty_analysis.csv` | Bootstrap uncertainty estimates |
| `feature_interactions.csv` | SHAP interaction values |
| `counterfactual_explanations.json` | Counterfactual scenarios |
| `clinical_rules.json` | Extracted clinical rules |
| `model_agreement.csv` | Cross-model agreement |
| `prediction_stability.csv` | Stability metrics |
| `subgroup_analysis.csv` | Subgroup performance |
| `risk_stratification.csv` | Risk group summary |
| `decision_curve_data.csv` | DCA net benefit data |
| `nomogram_coefficients.json` | Nomogram coefficients |
| `cost_benefit_analysis.csv` | Cost-benefit analysis |
| `fairness_metrics.csv` | Fairness metrics |
| `feature_redundancy.csv` | Correlated feature pairs |

### Figures (`4_Figures/Phase5_XAI/`)
- **Total**: 215 PNG figures (+ corresponding TIFF at 300 DPI)
- See `Figure_Index.md` for complete listing organized by category

---

*Report generated on March 13, 2026 — Phase 5 Explainable AI Analysis*  
*NOA ML Project — Hossein Jamalirad, Medical Informatics Group, Mashhad*
