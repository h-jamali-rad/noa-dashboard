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
