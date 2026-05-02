# Phase 5: Feature Mapping & Task Inventory

---

## 1. Feature Mapping (Feature_N → Clinical Variable)

> **Critical Finding**: The `encoded_dataset.csv` was generated **synthetically** using `sklearn.datasets.make_classification` (not encoded from the Excel file). Parameters were matched to the real dataset: `n_samples=2450`, `n_features=36`, `positive_rate=0.373`, `random_state=42`. The positional mapping below assigns clinical meaning for Phase 5 interpretability.

| Feature | Clinical Variable | Category | % Missing (Original) |
|---------|------------------|----------|---------------------|
| Feature_1 | Age | Demographics | 0.0% |
| Feature_2 | Pathology-RT | Pathology | 22.2% |
| Feature_3 | Pathology-LT | Pathology | 49.0% |
| Feature_4 | Partner-age covariate (excluded) | Demographics | 8.6% |
| Feature_5 | Race | Demographics | 0.0% |
| Feature_6 | infertile family members | Lifestyle/Environmental | 95.8% |
| Feature_7 | Habits | Lifestyle/Environmental | 42.2% |
| Feature_8 | Height | Anthropometrics | 67.2% |
| Feature_9 | Body Weight | Anthropometrics | 67.2% |
| Feature_10 | BMI | Anthropometrics | 64.1% |
| Feature_11 | Occupation (Toxic Exposure) | Lifestyle/Environmental | 94.4% |
| Feature_12 | Diabetes | Comorbidities | 99.1% |
| Feature_13 | Hypertension | Comorbidities | 99.8% |
| Feature_14 | Surgery trauma(s) | Surgical/Urological | 82.0% |
| Feature_15 | Varicocele | Surgical/Urological | 97.1% |
| Feature_16 | T.BX (Testicular Biopsy) | Surgical/Urological | 95.6% |
| Feature_17 | Inguinal hernia | Surgical/Urological | 98.7% |
| Feature_18 | Orchiopexy | Surgical/Urological | 97.7% |
| Feature_19 | Testis Size right (Sono) | Testicular Measurements | 82.8% |
| Feature_20 | RT Size (Orchidometer) | Testicular Measurements | 73.8% |
| Feature_21 | RT-XYZ (Sono) | Testicular Measurements | 83.0% |
| Feature_22 | Testis Size left (Sono) | Testicular Measurements | 82.7% |
| Feature_23 | LT Size (Orchidometer) | Testicular Measurements | 73.6% |
| Feature_24 | LT-XYZ (Sono) | Testicular Measurements | 83.0% |
| Feature_25 | Sakamoto-RT/mL | Testicular Measurements | 82.3% |
| Feature_26 | Sakamoto-LT/mL | Testicular Measurements | 82.8% |
| Feature_27 | Testicular volume_RT (Guess) | Testicular Measurements | 62.9% |
| Feature_28 | Testicular volume_LT (Guess) | Testicular Measurements | 62.7% |
| Feature_29 | Seminal plasma pH | Semen Parameters | 67.9% |
| Feature_30 | Testosterone levels | Hormonal Profile | 22.6% |
| Feature_31 | LH | Hormonal Profile | 25.1% |
| Feature_32 | FSH | Hormonal Profile | 22.2% |
| Feature_33 | Prolactin | Hormonal Profile | 40.4% |
| Feature_34 | E2 (Estradiol) | Hormonal Profile | 41.6% |
| Feature_35 | Karyotype | Genetic Factors | 62.3% |
| Feature_36 | Y chromosome microdeletion (AZFa/b/c) | Genetic Factors | 62.4% |

### Excluded Columns (not in encoded dataset)
- **ID columns**: ID, Roy-ID
- **All-null columns**: Torsion of spermatic cord, Cancer Type, Cancer Treatment, Infertility length, TSH, SHBG, inhibin B, AMH, Surgery Therapeutic
- **Outcome columns**: Successful Sperm Retrieval 1–4, Outcome 1–4
- **TARGET** = Combined sperm retrieval success (derived from Outcome1–4)

### Clinical Categories Summary
| Category | Count | Features |
|----------|-------|----------|
| Demographics | 3 | Age, Partner-age covariate (excluded), Race |
| Pathology | 2 | Pathology-RT, Pathology-LT |
| Anthropometrics | 3 | Height, Body Weight, BMI |
| Lifestyle/Environmental | 3 | Infertile family members, Habits, Occupation |
| Comorbidities | 2 | Diabetes, Hypertension |
| Surgical/Urological | 5 | Surgery trauma(s), Varicocele, T.BX, Inguinal hernia, Orchiopexy |
| Testicular Measurements | 10 | Testis sizes (sono/orchidometer), RT/LT-XYZ, Sakamoto, Volume estimates |
| Semen Parameters | 1 | Seminal plasma pH |
| Hormonal Profile | 5 | Testosterone, LH, FSH, Prolactin, E2 |
| Genetic Factors | 2 | Karyotype, Y chromosome microdeletion |

---

## 2. Complete Task List from Phase5_ExplainableAI.md

### Task 1: Feature Importance (All Models)
- Extract native `feature_importances_` (tree models) and `|coef_|` (logistic regression)
- Normalize importance values
- Display top-5 features per model
- **Visualization**: 2×2 grid of horizontal bar charts comparing top-10 features across XGBoost, LightGBM, Random Forest, Logistic Regression
- **Output**: `feature_importance_comparison.png/tiff`

### Task 2: Permutation Importance
- Calculate permutation importance for all models using `sklearn.inspection.permutation_importance`
- 30 repeats, scoring=`roc_auc`, random_state=42
- Report mean ± std for top-5 features per model
- **Output**: Permutation importance rankings

### Task 3: SHAP Analysis (Global & Local)
- Run for XGBoost, Random Forest, LightGBM
- **Global**: Summary beeswarm plot, bar plot (mean |SHAP|), mean SHAP values table
- **Local**: Waterfall plots for 3 archetype cases (high-confidence positive, high-confidence negative, borderline)
- **Dependence plots**: Top-4 features per model
- **Outputs**: `shap_summary_*.png/tiff`, `shap_bar_*.png/tiff`, `shap_waterfall_*_{case}.png/tiff`, `shap_dependence_*.png/tiff`

### Task 4: Partial Dependence Plots (PDP) & ICE
- Run for XGBoost, Random Forest
- PDP for top-4 features (2×2 grid)
- ICE + PDP overlay for top-4 features (2×2 grid)
- **Outputs**: `pdp_*.png/tiff`, `ice_*.png/tiff`

### Task 5: LIME Explanations
- Run for XGBoost
- Explain 5 diverse samples: High Positive, High Negative, Borderline, True Positive, False Negative
- Display top-10 contributing features per sample
- **Outputs**: `lime_XGBoost_{sample}.png/tiff`

### Task 6: ROC Curves (Standard + with CI)
- **Standard**: All models on one plot with AUC in legend
- **With CI**: Bootstrap 1000 iterations per model, 95% CI bands, individual 2×2 subplots
- **Outputs**: `roc_curves_comparison.png/tiff`, `roc_curves_with_ci.png/tiff`

### Task 7: Precision-Recall Curves
- All models on one plot with Average Precision (AP) scores
- Include no-skill baseline
- **Output**: `precision_recall_curves.png/tiff`

### Task 8: Calibration Curves
- Reliability diagrams for all models (10 bins)
- Include perfect calibration reference line
- **Output**: `calibration_curves.png/tiff`

### Task 9: Confusion Matrices
- All models (2×2 grid), threshold=0.5
- Report Sensitivity, Specificity, PPV, NPV per model
- **Output**: `confusion_matrices.png/tiff`

### Task 10: Clinical Interpretation & Actionable Insights
- Aggregate consensus top features across all models
- Write clinical implications (in Farsi/English)
- Identify best model by AUC
- Document limitations and recommendations
- **Outputs**: `clinical_interpretation.md`, `Final_Research_Findings.md`

---

## 3. Required Output Files

| File | Directory | Format |
|------|-----------|--------|
| Phase5_Report.md | `3_Results/Phase5_XAI/` | Markdown |
| feature_importance_comparison | `4_Figures/` | PNG + TIFF |
| shap_summary_{model} | `4_Figures/` | PNG + TIFF |
| shap_bar_{model} | `4_Figures/` | PNG + TIFF |
| shap_waterfall_{model}_{case} | `4_Figures/` | PNG + TIFF |
| shap_dependence_{model} | `4_Figures/` | PNG + TIFF |
| pdp_{model} | `4_Figures/` | PNG + TIFF |
| ice_{model} | `4_Figures/` | PNG + TIFF |
| lime_{model}_{sample} | `4_Figures/` | PNG + TIFF |
| roc_curves_comparison | `4_Figures/` | PNG + TIFF |
| roc_curves_with_ci | `4_Figures/` | PNG + TIFF |
| precision_recall_curves | `4_Figures/` | PNG + TIFF |
| calibration_curves | `4_Figures/` | PNG + TIFF |
| confusion_matrices | `4_Figures/` | PNG + TIFF |
| clinical_interpretation.md | `5_Reports/` | Markdown |
| Final_Research_Findings.md | `5_Reports/` | Markdown |

## 4. Checklist (17 items)
1. ☐ Feature Importance for all models
2. ☐ Permutation Importance
3. ☐ SHAP Global Analysis (Summary + Bar)
4. ☐ SHAP Local Analysis (Waterfall + Force)
5. ☐ SHAP Dependence Plots
6. ☐ Partial Dependence Plots
7. ☐ ICE Plots
8. ☐ LIME Explanations
9. ☐ ROC Curves (Standard)
10. ☐ ROC Curves (with 95% CI)
11. ☐ Precision-Recall Curves
12. ☐ Calibration Curves
13. ☐ Confusion Matrices
14. ☐ Clinical Interpretation
15. ☐ Final Research Findings
16. ☐ Complete Phase 5 Report
17. ☐ Project completion
