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