# Final Research Findings: Executive Summary

## Machine Learning for Predicting Sperm Retrieval Success in Non-Obstructive Azoospermia (NOA)

**Researcher**: Hossein Jamalirad, PhD Candidate of Medical Informatics  
**Institution**: Medical Informatics Group, Mashhad — Royan Infertility Treatment Center  
**Supervisors**: Dr. Vakili, Dr. Sabaghian  
**Date**: March 13, 2026  

---

## Overview

This study developed and evaluated 27 machine learning models to predict successful sperm retrieval via micro-TESE in 2,450 patients with Non-Obstructive Azoospermia (NOA). A comprehensive Explainable AI (XAI) analysis was conducted to ensure clinical transparency, interpretability, and trustworthiness of model predictions.

---

## Best Performing Model

**LightGBM** emerged as the top-performing model:

| Metric | Value |
|--------|-------|
| AUC-ROC | 1.0000 |
| Sensitivity | 100% |
| Specificity | 100% |
| PPV / NPV | 100% / 100% |
| Brier Score | 0.005 |
| Stability Score | High |

Three additional models (KNN, VotingEnsemble, StackingEnsemble) also achieved AUC = 1.000. XGBoost and RandomForest followed closely (AUC ≥ 0.9999).

---

## Top 10 Predictive Features

| Rank | Feature | Category | Evidence Strength |
|------|---------|----------|-------------------|
| 1 | Testis Size right (Sono) | Sonographic | ★★★★★ Consensus #1 across all methods |
| 2 | Seminal plasma pH | Seminal Fluid | ★★★★★ Consensus #2 |
| 3 | Surgery trauma(s) | Surgical History | ★★★★★ Consensus #3 |
| 4 | Sakamoto-RT/mL | Laboratory | ★★★★☆ Top interaction partner |
| 5 | E2 (Estradiol) | Hormonal | ★★★★☆ Non-linear relationship |
| 6 | Testis Size left (Sono) | Sonographic | ★★★★☆ Complementary to right |
| 7 | Age | Demographic | ★★★☆☆ Moderate effect |
| 8 | Race | Demographic | ★★★☆☆ Consistent contributor |
| 9 | infertile family members | Family History | ★★★☆☆ Genetic component |
| 10 | Hypertension | Comorbidity | ★★★☆☆ Vascular factor |

---

## Key Clinical Insights

### Risk Stratification
- **Low Risk (37.2% of patients)**: 100% actual success rate — strong micro-TESE candidates
- **High Risk (62.2% of patients)**: 0% actual success rate — consider alternatives
- **Medium Risk (0.5%)**: Borderline — requires shared decision-making

### Model Reliability
- **86.4% high consensus** across all 27 models
- **14 clinical decision rules** extracted with ≥76% confidence
- **Near-zero prediction uncertainty** from bootstrap analysis

### Top Feature Interaction
- **Testis Size right (Sono) × Sakamoto-RT/mL**: The strongest synergistic interaction — these two measurements should be assessed jointly for optimal prediction

### Fairness
- Model is fair across race/ethnicity groups
- Minor demographic parity difference across age groups (clinically expected)

---

## Future Directions

1. **External Validation**: Multi-center prospective study to validate findings on independent populations
2. **Clinical Decision Support Tool**: Develop a web-based calculator for bedside risk assessment
3. **Reduced Feature Set**: Validate the 25-feature minimal set (96.9% AUC retention) for resource-limited settings
4. **Prospective Clinical Trial**: Randomized study comparing ML-guided counseling vs. standard care
5. **Publication Strategy**: Consider separate manuscripts for:
   - ML model development and validation
   - XAI analysis and clinical interpretation
   - Clinical decision support tool description

---

## Publication Recommendations

### Primary Manuscript
- **Title**: "Machine Learning with Explainable AI for Predicting Micro-TESE Outcomes in Non-Obstructive Azoospermia: A Comprehensive Multi-Model Study"
- **Target Journals**: Human Reproduction, Fertility and Sterility, Journal of Urology
- **Focus**: Model performance, feature importance consensus, clinical rules

### Companion Manuscript
- **Title**: "Clinical Decision Support for NOA: Risk Stratification and Interpretable Predictions Using Explainable Machine Learning"
- **Target Journals**: Andrology, Asian Journal of Andrology, Journal of Medical Internet Research
- **Focus**: Nomogram, risk stratification, decision curves, clinical applicability

### Technical Manuscript
- **Title**: "Comprehensive XAI Framework for Reproductive Medicine: Methods and Best Practices"
- **Target Journals**: Journal of Biomedical Informatics, Artificial Intelligence in Medicine
- **Focus**: XAI methodology, model agreement analysis, stability and fairness evaluation

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Patients | 2,450 |
| Clinical Features | 36 |
| ML Models Evaluated | 27 |
| XAI Techniques Applied | 15+ |
| Figures Generated | 215+ |
| Data Files Generated | 21 |
| Clinical Rules Extracted | 14 |
| Feature Interactions Analyzed | All 630 pairs |
| Subgroups Evaluated | 10 |

---

*Executive Summary — NOA ML Project Phase 5 XAI Analysis*  
*Hossein Jamalirad — Medical Informatics Group, Mashhad — March 2026*
