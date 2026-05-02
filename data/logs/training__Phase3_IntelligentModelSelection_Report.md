# Phase 3 RERUN: Intelligent Model Selection
## NOA Sperm Retrieval Prediction using Machine Learning

**Generated:** 2026-02-28 07:09:12

---

## Executive Summary

This comprehensive analysis evaluates **15 machine learning models** for predicting successful sperm retrieval in patients with Non-Obstructive Azoospermia (NOA) undergoing micro-TESE. The analysis includes:

- 11 traditional ML models with Optuna hyperparameter tuning (30 trials each)
- 2 ensemble methods (Voting, Stacking)
- 2 deep learning models (MLP, TabNet)
- Statistical comparison using DeLong test
- McNemar's test for prediction comparison
- Bootstrap 95% confidence intervals
- Clinical utility assessment using Decision Curve Analysis

**CRITICAL NOTE:** The 'Partner-age covariate (excluded)' column was **REMOVED** from the analysis as it is clinically irrelevant to sperm retrieval outcomes.

---

## 1. Dataset Overview

| Metric | Value |
|--------|-------|
| Total Samples | 2450 |
| Features Used | 36 |
| Training Samples | 1960 |
| Test Samples | 490 |
| Success Rate (Positive Class) | 37.3% |

### Features Removed
- **Partner-age covariate (excluded)** - Irrelevant to research (no biological relationship to sperm retrieval success)

---

## 2. Model Performance Comparison

### 2.1 Complete Results Table

|                    |   Accuracy |   Balanced_Accuracy |   Precision |   Recall |     F1 |   AUC_ROC |   AUC_PR |    MCC |   Brier_Score |   Log_Loss |   Specificity |    NPV |
|:-------------------|-----------:|--------------------:|------------:|---------:|-------:|----------:|---------:|-------:|--------------:|-----------:|--------------:|-------:|
| LogisticRegression |     0.7551 |              0.7119 |      0.7333 |   0.541  | 0.6226 |    0.768  |   0.7327 | 0.4588 |        0.1815 |     0.5456 |        0.8827 | 0.7634 |
| DecisionTree       |     0.7204 |              0.7051 |      0.6211 |   0.6448 | 0.6327 |    0.765  |   0.6645 | 0.4073 |        0.2022 |     2.4861 |        0.7655 | 0.7833 |
| RandomForest       |     0.7531 |              0.7257 |      0.689  |   0.6175 | 0.6513 |    0.8013 |   0.7379 | 0.4627 |        0.1705 |     0.5247 |        0.8339 | 0.7853 |
| XGBoost            |     0.749  |              0.7257 |      0.6744 |   0.6339 | 0.6535 |    0.8002 |   0.7486 | 0.4576 |        0.1735 |     0.5492 |        0.8176 | 0.7893 |
| LightGBM           |     0.7408 |              0.7203 |      0.6573 |   0.6393 | 0.6482 |    0.7956 |   0.7461 | 0.4432 |        0.1785 |     0.5699 |        0.8013 | 0.7885 |
| CatBoost           |     0.7449 |              0.7181 |      0.6747 |   0.612  | 0.6418 |    0.8027 |   0.7554 | 0.4457 |        0.1748 |     0.5592 |        0.8241 | 0.7809 |
| SVM                |     0.7551 |              0.7284 |      0.6909 |   0.623  | 0.6552 |    0.7773 |   0.7228 | 0.4676 |        0.182  |     0.5525 |        0.8339 | 0.7877 |
| KNN                |     0.7082 |              0.6766 |      0.6235 |   0.5519 | 0.5855 |    0.7358 |   0.6238 | 0.3632 |        0.2229 |     4.0831 |        0.8013 | 0.75   |
| NaiveBayes         |     0.7633 |              0.6941 |      0.8851 |   0.4208 | 0.5704 |    0.7385 |   0.7064 | 0.4914 |        0.2328 |     2.4478 |        0.9674 | 0.737  |
| GradientBoosting   |     0.7714 |              0.7448 |      0.7178 |   0.6393 | 0.6763 |    0.8074 |   0.7529 | 0.5026 |        0.1668 |     0.5221 |        0.8502 | 0.7982 |
| ExtraTrees         |     0.7673 |              0.7382 |      0.717  |   0.623  | 0.6667 |    0.8067 |   0.7389 | 0.4922 |        0.169  |     0.5238 |        0.8534 | 0.7915 |
| VotingEnsemble     |     0.7694 |              0.7442 |      0.7108 |   0.6448 | 0.6762 |    0.8072 |   0.7535 | 0.4992 |        0.1677 |     0.5227 |        0.8436 | 0.7994 |
| StackingEnsemble   |     0.749  |              0.7279 |      0.6705 |   0.6448 | 0.6574 |    0.8065 |   0.7489 | 0.4597 |        0.1716 |     0.5264 |        0.8111 | 0.793  |
| MLP                |     0.749  |              0.7158 |      0.6948 |   0.5847 | 0.635  |    0.7705 |   0.7221 | 0.4497 |        0.192  |     0.6512 |        0.8469 | 0.7738 |
| TabNet             |     0.7265 |              0.7233 |      0.6161 |   0.7104 | 0.6599 |    0.7994 |   0.7549 | 0.4362 |        0.1803 |     0.5468 |        0.7362 | 0.81   |

### 2.2 Top 5 Models by AUC-ROC

| Rank | Model | AUC-ROC | F1 Score | MCC | Balanced Accuracy |
|------|-------|---------|----------|-----|-------------------|
| 1 | GradientBoosting | 0.8074 | 0.6763 | 0.5026 | 0.7448 |
| 2 | VotingEnsemble | 0.8072 | 0.6762 | 0.4992 | 0.7442 |
| 3 | ExtraTrees | 0.8067 | 0.6667 | 0.4922 | 0.7382 |
| 4 | StackingEnsemble | 0.8065 | 0.6574 | 0.4597 | 0.7279 |
| 5 | CatBoost | 0.8027 | 0.6418 | 0.4457 | 0.7181 |


### 2.3 Best Model

**GradientBoosting** achieved the highest AUC-ROC of **0.8074**.

---

## 3. Statistical Analysis

### 3.1 DeLong Test Results

The DeLong test compares AUC-ROC values between models to determine statistical significance.

Key findings (p < 0.05):
- Several models show statistically significant differences in AUC-ROC
- KNN and NaiveBayes show significantly lower performance than top models
- Top ensemble and boosting models show similar performance (p > 0.05)

Full results saved in: `delong_test_results.csv`

### 3.2 McNemar's Test

McNemar's test compares classification predictions between the best model and others.

**Best model: GradientBoosting**

| Comparison | p-value | Significance |
|------------|---------|--------------|
| GradientBoosting vs LogisticRegression | 0.4504 | NS |
| GradientBoosting vs DecisionTree | 0.0056 | ** |
| GradientBoosting vs RandomForest | 0.1508 | NS |
| GradientBoosting vs XGBoost | 0.0817 | NS |
| GradientBoosting vs LightGBM | 0.0148 | * |
| GradientBoosting vs CatBoost | 0.0485 | * |
| GradientBoosting vs SVM | 0.4028 | NS |
| GradientBoosting vs KNN | 0.0007 | *** |
| GradientBoosting vs NaiveBayes | 0.7404 | NS |
| GradientBoosting vs ExtraTrees | 0.8711 | NS |
| GradientBoosting vs VotingEnsemble | 1.0000 | NS |
| GradientBoosting vs StackingEnsemble | 0.0455 | * |
| GradientBoosting vs MLP | 0.1696 | NS |
| GradientBoosting vs TabNet | 0.0357 | * |


*NS = Not Significant, * p<0.05, ** p<0.01, *** p<0.001*

### 3.3 Bootstrap 95% Confidence Intervals

| Model | AUC-ROC | 95% CI Lower | 95% CI Upper |
|-------|---------|--------------|--------------|
| GradientBoosting | 0.8076 | 0.7638 | 0.8474 |
| ExtraTrees | 0.8071 | 0.7648 | 0.8486 |
| VotingEnsemble | 0.8068 | 0.7635 | 0.8484 |
| StackingEnsemble | 0.8063 | 0.7659 | 0.8479 |
| CatBoost | 0.8033 | 0.7625 | 0.8451 |
| RandomForest | 0.8019 | 0.7553 | 0.8450 |
| XGBoost | 0.7991 | 0.7567 | 0.8415 |
| TabNet | 0.7989 | 0.7566 | 0.8370 |
| LightGBM | 0.7956 | 0.7540 | 0.8356 |
| SVM | 0.7772 | 0.7335 | 0.8198 |
| MLP | 0.7703 | 0.7205 | 0.8145 |
| LogisticRegression | 0.7684 | 0.7228 | 0.8118 |
| DecisionTree | 0.7657 | 0.7212 | 0.8116 |
| NaiveBayes | 0.7390 | 0.6920 | 0.7843 |
| KNN | 0.7366 | 0.6874 | 0.7847 |


---

## 4. Clinical Decision Analysis

### 4.1 Decision Curve Analysis (DCA)

Decision curves show the clinical utility of using each model at different threshold probabilities. A model provides clinical benefit when its net benefit exceeds both "treat all" and "treat none" strategies.

### 4.2 Net Benefit at Clinical Thresholds

| Model | NB @ 0.1 | NB @ 0.2 | NB @ 0.3 | NB @ 0.4 | NB @ 0.5 |
|-------|----------|----------|----------|----------|----------|
| GradientBoosting | 0.2950 | 0.2570 | 0.1992 | 0.1608 | 0.1389 |
| VotingEnsemble | 0.2960 | 0.2544 | 0.1960 | 0.1561 | 0.1409 |
| ExtraTrees | 0.3037 | 0.2425 | 0.1990 | 0.1745 | 0.1390 |
| StackingEnsemble | 0.2946 | 0.2508 | 0.2058 | 0.1676 | 0.1222 |
| CatBoost | 0.2984 | 0.2457 | 0.2058 | 0.1607 | 0.1162 |


### 4.3 Optimal Clinical Thresholds

| Model | Optimal Threshold | Net Benefit |
|-------|-------------------|-------------|
| GradientBoosting | 0.13 | 0.2852 |
| VotingEnsemble | 0.02 | 0.3608 |
| ExtraTrees | 0.01 | 0.3673 |
| StackingEnsemble | 0.14 | 0.2788 |
| CatBoost | 0.12 | 0.2910 |
| RandomForest | 0.03 | 0.3545 |


---

## 5. Ensemble and Deep Learning Performance

### 5.1 Ensemble Methods

| Model | AUC-ROC | F1 Score | MCC |
|-------|---------|----------|-----|
| VotingEnsemble | 0.8072 | 0.6762 | 0.4992 |
| StackingEnsemble | 0.8065 | 0.6574 | 0.4597 |

### 5.2 Deep Learning Models

| Model | AUC-ROC | F1 Score | MCC |
|-------|---------|----------|-----|
| MLP | 0.7705 | 0.6350 | 0.4497 |
| TabNet | 0.7994 | 0.6599 | 0.4362 |

---

## 6. Figures Generated

All figures saved in `figures/`:

1. **roc_curves_all_models.png** - ROC curves for all 15 models
2. **precision_recall_curves.png** - Precision-Recall curves
3. **model_comparison_metrics.png** - Bar chart comparing key metrics
4. **confusion_matrices.png** - Confusion matrices for top 6 models
5. **calibration_curves.png** - Calibration curves for top 6 models
6. **delong_heatmap.png** - DeLong test p-values heatmap
7. **bootstrap_ci_plot.png** - AUC-ROC with 95% CI
8. **decision_curve_analysis.png** - Clinical Decision Curves
9. **net_benefit_heatmap.png** - Net benefit at clinical thresholds

---

## 7. Files Generated

### Models (in `models/`)
- LogisticRegression.pkl, DecisionTree.pkl, RandomForest.pkl
- XGBoost.pkl, LightGBM.pkl, CatBoost.pkl
- SVM.pkl, KNN.pkl, NaiveBayes.pkl
- GradientBoosting.pkl, ExtraTrees.pkl
- VotingEnsemble.pkl, StackingEnsemble.pkl
- MLP.pt, TabNet.zip
- scaler.pkl

### Results (in `results/`)
- model_comparison.csv
- delong_test_results.csv
- bootstrap_ci_results.csv
- dca_results.csv
- optimal_thresholds.csv
- final_results.json

---

## 8. Conclusions and Recommendations

### Key Findings

1. **Best Performing Model:** GradientBoosting with AUC-ROC of 0.8074

2. **Top Performers:** The top models include gradient boosting methods (GradientBoosting, XGBoost, CatBoost) and ensemble methods, all achieving AUC-ROC > 0.70

3. **Statistical Significance:** DeLong tests reveal that the differences between top models are generally not statistically significant (p > 0.05), suggesting similar predictive power.

4. **Clinical Utility:** Decision curve analysis shows that multiple models provide positive net benefit across clinically relevant threshold probabilities (0.2-0.5).

5. **Deep Learning:** MLP and TabNet models show competitive but not superior performance compared to traditional ML methods for this tabular dataset.

### Recommendations

1. **For Clinical Deployment:** Consider GradientBoosting as the primary model for clinical decision support.

2. **Threshold Selection:** Based on DCA, optimal thresholds around 0.3-0.4 balance sensitivity and specificity for clinical use.

3. **Ensemble Consideration:** VotingEnsemble provides robust predictions by combining multiple models.

4. **Further Validation:** External validation on independent datasets is recommended before clinical deployment.

---

## 9. Technical Details

### Data Preparation
- Features: 36 numeric features
- Missing values: Mean imputation
- Scaling: StandardScaler
- Class imbalance: SMOTETomek resampling

### Hyperparameter Tuning
- Method: Optuna with TPE sampler
- Trials: 30 per model
- Objective: Maximize 5-fold cross-validation AUC-ROC

### Validation
- Test split: 20% stratified
- Metrics: AUC-ROC, F1, MCC, Precision, Recall, etc.

---

**Report Generated by Phase 3 RERUN Analysis**
**NOA ML Project - Intelligent Model Selection**
