# Phase 5: Explainable AI — Output Format & Deliverables Summary

---

## 1. Exact Output Files & Deliverables

| # | File | Path | Format |
|---|------|------|--------|
| 1 | Phase5_Report.md | `3_Results/Phase5_XAI/` | Markdown |
| 2 | feature_importance_comparison.png/tiff | `4_Figures/` | PNG/TIFF |
| 3 | shap_summary_*.png/tiff | `4_Figures/` | PNG/TIFF (one per model: XGBoost, Random_Forest, LightGBM) |
| 4 | shap_bar_*.png/tiff | `4_Figures/` | PNG/TIFF (one per model) |
| 5 | shap_waterfall_*.png/tiff | `4_Figures/` | PNG/TIFF (3 per model: High_Positive, High_Negative, Borderline) |
| 6 | shap_dependence_*.png/tiff | `4_Figures/` | PNG/TIFF (one per model) |
| 7 | pdp_*.png/tiff | `4_Figures/` | PNG/TIFF (XGBoost, Random_Forest) |
| 8 | ice_*.png/tiff | `4_Figures/` | PNG/TIFF (XGBoost, Random_Forest) |
| 9 | lime_*.png/tiff | `4_Figures/` | PNG/TIFF (5 cases: High_Positive, High_Negative, Borderline, True_Positive, False_Negative — XGBoost only) |
| 10 | roc_curves_comparison.png/tiff | `4_Figures/` | PNG/TIFF |
| 11 | roc_curves_with_ci.png/tiff | `4_Figures/` | PNG/TIFF |
| 12 | precision_recall_curves.png/tiff | `4_Figures/` | PNG/TIFF |
| 13 | calibration_curves.png/tiff | `4_Figures/` | PNG/TIFF |
| 14 | confusion_matrices.png/tiff | `4_Figures/` | PNG/TIFF |
| 15 | clinical_interpretation.md | `5_Reports/` | Markdown |
| 16 | Final_Research_Findings.md | `5_Reports/` | Markdown |

**Base paths** (relative to `[path]`):
- Figures → `4_Figures/`
- Results → `3_Results/Phase5_XAI/`
- Reports → `5_Reports/`

---

## 2. Age Thresholds & Clinical Archetypes

### What the Architecture File Specifies
The architecture file does **not** explicitly define age thresholds or named clinical archetypes. However, TASK 10 (Clinical Interpretation) calls for "Actionable Insights" that translate model outputs into clinical guidance, and SHAP/LIME local explanations select archetypal patient cases by prediction confidence:

| Archetype (Prediction-Based) | Selection Criterion |
|------------------------------|---------------------|
| **High_Positive** | Highest predicted probability of success (sperm retrieval) |
| **High_Negative** | Lowest predicted probability (near-zero chance) |
| **Borderline** | Predicted probability closest to 0.5 |
| **True_Positive** | Actual success + predicted probability > 0.7 |
| **False_Negative** | Actual success + predicted probability < 0.3 |

### Evidence-Based Age Categorization for NOA/Male Infertility

Based on the literature, the following thresholds are well-supported for defining clinical age archetypes in male infertility research:

| Age Group | Range | Rationale & Key Evidence |
|-----------|-------|--------------------------|
| **Young** | **< 35 years** | Optimal sperm parameters; baseline reference group in most studies. Normal morphology still high; TMC ~126 million. |
| **Middle-aged** | **35–39 years** | Morphology decline begins sharply after 30; 50% lower chance of pregnancy within 12 months vs. men < 25 (Weill Cornell). Some studies use 35 as a first inflection point. |
| **Advanced Paternal Age (APA)** | **40–44 years** | AUA/ASRM counseling threshold. Semen parameters clearly declining (TMC drops to ~81 million; motility 44.9% → 34.7%). DFI rises significantly. Conception 30% less likely vs. men < 30. |
| **Elderly / Very Advanced** | **≥ 45 years** | Time-to-pregnancy rises sharply. 14% higher odds of premature birth. DFI avg ~23% (40–49) rising toward 50% (60–80). ART success rates notably reduced for men > 50. |

**Most commonly used binary cutoff in the literature: 40 years.**
- This is the AUA/ASRM recommended counseling threshold.
- Multiple large studies (>11,000 men) show clear semen parameter declines at this boundary.
- For a thesis on NOA (Non-Obstructive Azoospermia) and micro-TESE outcomes, **40 years** is the most defensible binary split between "young" and "advanced age" groups.

#### Key References
1. Maleinfertilityguide.com — Study of 11,000+ men showing TMC/motility decline at 40
2. PMC9957550 — Sharp morphology decline after age 30; progressive motility reduction
3. PMC10914128 — APA review; males > 50 with worse ART outcomes
4. Weill Cornell — Men > 35: 50% lower 12-month pregnancy rate; DFI escalation after 40
5. FertilityIQ — AUA/ASRM: counsel at 40+; fertility decline inflection at mid-40s
6. Frontiers in Aging (2025) — Chinese cohort (n=6,805): volume, motility, DFI all decline with age
7. UT Southwestern — Sperm cells undergo ~800 divisions by age 50; mutation accumulation

---

## 3. All Figure Types & Specifications

### 3.1 Feature Importance (TASK 1)
| Figure | Layout | Size | Details |
|--------|--------|------|---------|
| `feature_importance_comparison` | 2×2 subplot grid | 16×14 in | Horizontal bar charts; top 10 features per model; 4 colors (#2ecc71, #3498db, #e74c3c, #9b59b6); value labels as percentages; normalized importance |

### 3.2 SHAP Analysis (TASK 3)
| Figure | Layout | Size | Details |
|--------|--------|------|---------|
| `shap_summary_{model}` | Single plot (beeswarm) | 12×8 in | max_display=15 features; one per model (XGBoost, Random_Forest, LightGBM) |
| `shap_bar_{model}` | Single bar plot | 10×8 in | Mean |SHAP| values; max_display=15 |
| `shap_waterfall_{model}_{case}` | Single waterfall | 12×8 in | max_display=10 features; 3 cases per model (High_Positive, High_Negative, Borderline) |
| `shap_dependence_{model}` | 2×2 subplot grid | 14×12 in | Top 4 features by mean |SHAP|; interaction coloring auto-detected |

### 3.3 PDP & ICE (TASK 4)
| Figure | Layout | Size | Details |
|--------|--------|------|---------|
| `pdp_{model}` | 2×2 subplot grid | 14×12 in | kind='average'; blue line (#3498db, lw=2); top 4 features by importance |
| `ice_{model}` | 2×2 subplot grid | 14×12 in | kind='both' (PDP + ICE); gray ICE lines (α=0.2), red PDP line (lw=2) |

### 3.4 LIME (TASK 5)
| Figure | Layout | Size | Details |
|--------|--------|------|---------|
| `lime_{model}_{case}` | Single pyplot figure | default | 5 cases: High_Positive, High_Negative, Borderline, True_Positive, False_Negative; num_features=10; XGBoost only |

### 3.5 ROC Curves (TASK 6)
| Figure | Layout | Size | Details |
|--------|--------|------|---------|
| `roc_curves_comparison` | Single plot | 10×10 in | All models overlaid; 6-color palette; diagonal reference line; AUC in legend |
| `roc_curves_with_ci` | 2×2 subplot grid | 14×14 in | 1000 bootstrap iterations; 95% CI shaded band; per-model subplot |

### 3.6 Precision-Recall (TASK 7)
| Figure | Layout | Size | Details |
|--------|--------|------|---------|
| `precision_recall_curves` | Single plot | 10×8 in | All models overlaid; no-skill baseline (horizontal line at prevalence); AP in legend |

### 3.7 Calibration (TASK 8)
| Figure | Layout | Size | Details |
|--------|--------|------|---------|
| `calibration_curves` | Single plot | 10×8 in | n_bins=10; square markers with lines; perfect calibration diagonal |

### 3.8 Confusion Matrices (TASK 9)
| Figure | Layout | Size | Details |
|--------|--------|------|---------|
| `confusion_matrices` | 2×2 subplot grid | 14×12 in | Blues cmap; integer format; threshold=0.5; labels: Failure/Success |

---

## 4. Structure of the Final Report(s)

### 4.1 Phase5_Report.md (`3_Results/Phase5_XAI/`)
The main technical report covering all 10 tasks:
1. Feature Importance Analysis (all models)
2. Permutation Importance (30 repeats, ROC-AUC scoring)
3. SHAP Global Analysis (Summary beeswarm + Bar plots)
4. SHAP Local Analysis (Waterfall plots for 3 archetypal cases)
5. SHAP Dependence Plots (top 4 features)
6. Partial Dependence Plots
7. ICE Plots
8. LIME Explanations (5 diverse cases)
9. ROC Curves (standard comparison + bootstrap 95% CI)
10. Precision-Recall Curves
11. Calibration Curves
12. Confusion Matrices (with Sensitivity, Specificity, PPV, NPV)
13. Clinical Interpretation & Actionable Insights
14. Final Research Findings Summary

### 4.2 clinical_interpretation.md (`5_Reports/`)
- Consensus top features across all models (frequency ranking)
- Clinical implications:
  - Key predictive variables
  - Patient counseling applications
  - Clinical limitations (retrospective data, need for external validation)
  - Recommendations (decision-support, not replacement; qualitative factors; model updating)

### 4.3 Final_Research_Findings.md (`5_Reports/`)
- Best performing model name + AUC
- Top predictive features (consensus across models)
- Summary of all analyses conducted

---

## 5. Models Analyzed

| Model | Feature Importance | Permutation | SHAP | PDP/ICE | LIME | ROC/PR/Calibration/CM |
|-------|-------------------|-------------|------|---------|------|----------------------|
| XGBoost | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| LightGBM | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Random_Forest | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Logistic_Regression | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## 6. Completion Checklist (from architecture)

- [ ] Feature Importance for all models
- [ ] Permutation Importance
- [ ] SHAP Global Analysis (Summary, Bar)
- [ ] SHAP Local Analysis (Waterfall, Force)
- [ ] SHAP Dependence Plots
- [ ] Partial Dependence Plots
- [ ] ICE Plots
- [ ] LIME Explanations
- [ ] ROC Curves (Standard)
- [ ] ROC Curves (with CI)
- [ ] Precision-Recall Curves
- [ ] Calibration Curves
- [ ] Confusion Matrices
- [ ] Clinical Interpretation written
- [ ] Final Research Findings compiled
- [ ] Complete report written
- [ ] Project completed ✓
