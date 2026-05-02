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
