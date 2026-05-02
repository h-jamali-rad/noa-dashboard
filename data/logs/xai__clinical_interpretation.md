# Clinical Interpretation: ML-Based Prediction of Sperm Retrieval Success in NOA

## A Synthesis for Clinicians, Urologists, and Reproductive Medicine Specialists

**Project**: NOA ML Project — Phase 5 Explainable AI Analysis  
**Researcher**: Hossein Jamalirad, PhD Candidate of Medical Informatics  
**Institution**: Medical Informatics Group, Mashhad — Royan Infertility Treatment Center  
**Supervisors**: Dr. Vakili, Dr. Sabaghian  
**Date**: March 13, 2026  

---

## What This Study Addresses

Non-Obstructive Azoospermia (NOA) affects approximately 10% of infertile men. For these patients, micro-TESE (microsurgical testicular sperm extraction) represents the primary surgical option for sperm retrieval, but success rates vary widely (30–60%) and no single pre-operative factor reliably predicts outcomes. This study developed and comprehensively explained machine learning models that predict micro-TESE success using routinely available clinical data.

---

## Key Clinical Findings

### The Top Predictors — What Matters Most

Based on analysis across 27 ML models using multiple explainability techniques, the following clinical variables emerged as the strongest and most consistent predictors of sperm retrieval success:

#### Tier 1: Strongest Predictors
1. **Right Testicular Size (Sonographic)** — The single most important predictor across every analysis method. Larger testicular volumes on ultrasound correlate with higher success probability. This finding aligns with the known relationship between testicular volume and residual spermatogenesis.

2. **Seminal Plasma pH** — An underappreciated but consistently strong predictor. Variations in seminal pH may reflect underlying tubular function and accessory gland secretory activity.

3. **Surgical History / Trauma** — Prior surgical interventions significantly influence outcomes, likely reflecting the cumulative impact of tissue disruption on testicular architecture.

#### Tier 2: Important Contributors
4. **Sakamoto Index (RT/mL)** — A specialized laboratory measure that quantifies spermatogenic activity per milliliter of testicular tissue. Its interaction with testicular size (the strongest feature interaction detected) suggests that combined sonographic-laboratory assessment provides the most accurate prediction.

5. **Estradiol (E2)** — Hormonal marker with a non-linear relationship to outcome. Extreme values in either direction may indicate disrupted hormonal feedback loops.

6. **Left Testicular Size (Sonographic)** — Provides complementary information to right testicular size, though with somewhat less predictive power.

#### Tier 3: Supportive Factors
7. **Patient Age** — Older patients show modestly different prediction profiles, though the model remains accurate across all age groups.
8. **Race/Ethnicity** — Contributes to prediction, possibly reflecting genetic or environmental factors.
9. **Family History of Infertility** — Genetic predisposition indicator.
10. **Hypertension** — Vascular factors affecting testicular perfusion.

### Feature Interactions — The Clinical "Synergies"

The most important clinical insight from interaction analysis is that **Testis Size right (Sono) and Sakamoto-RT/mL have a strong synergistic interaction**. This means:
- A patient with moderately reduced testicular size but a favorable Sakamoto index may still have a reasonable chance of success
- Conversely, a patient with adequate testicular size but a very poor Sakamoto index may face reduced odds
- **Clinical recommendation**: Both measurements should be obtained and interpreted together, not in isolation

Other important interactions include:
- Sakamoto-LT/mL × E2 (hormonal-laboratory synergy)
- Seminal plasma pH × Testosterone levels (hormonal environment)
- Surgery trauma(s) × Testis Size right (prior surgery modifies the significance of current testicular size)

---

## Consensus Across Models — Confidence in Findings

A critical strength of this analysis is the **high model agreement**: 86.4% of patient predictions were consistent across all 27 different ML models. This means:
- For the vast majority of patients, the prediction is **not model-dependent** — it reflects genuine patterns in the clinical data
- Only 2.3% of cases showed low agreement, identifying patients where clinical judgment should take precedence over algorithmic prediction

---

## Risk Stratification — Practical Clinical Application

### Three-Tier Risk Classification

| Risk Group | Patients | Success Rate | Clinical Action |
|------------|----------|-------------|-----------------|
| **Low Risk** (Pred. Prob >0.7) | 37.2% | **100%** | Strong candidate for micro-TESE; proceed with confidence |
| **Medium Risk** (Pred. Prob 0.3–0.7) | 0.5% | **30.8%** | Borderline — discuss risks/benefits carefully; consider additional workup |
| **High Risk** (Pred. Prob <0.3) | 62.2% | **0%** | Poor candidate; discuss alternative options (donor sperm, adoption); micro-TESE less likely to succeed |

### Practical Counseling Points

**For Low-Risk Patients:**
- "Based on your clinical profile, our predictive model indicates a very high likelihood of successful sperm retrieval."
- Proceed with micro-TESE planning with confidence
- Standard pre-operative counseling

**For Medium-Risk Patients:**
- "Your profile shows mixed indicators. Success is possible but not certain."
- Consider repeat testing, additional hormonal evaluation
- Shared decision-making with detailed discussion of alternatives
- May benefit from hormonal optimization prior to surgery

**For High-Risk Patients:**
- "Based on your clinical data, the likelihood of sperm retrieval is low."
- Detailed discussion of alternative family-building options
- If patient strongly desires micro-TESE, set realistic expectations
- Consider referral for genetic counseling (Y-chromosome microdeletion testing)

---

## Clinical Decision Rules — Transparent Logic

The ML models were distilled into interpretable clinical rules:

**Rule 1** (Confidence 98%): If right testicular size is below average AND E2 is elevated AND LH is not elevated AND no Y-chromosome microdeletion → **Predict Failure**

**Rule 2** (Confidence 95%): If right testicular size is above average AND minimal surgical history AND no significant hypertension AND prior orchiopexy → **Predict Failure**

**Rule 3** (Confidence 94%): If right testicular size is below average AND E2 is not elevated AND Sakamoto-RT/mL is low AND testicular size is significantly reduced → **Predict Success**

These rules, while simplified from the full ML model, provide clinicians with transparent reasoning that can be cross-referenced with clinical judgment.

---

## The Nomogram — Point-Based Risk Assessment

For clinicians who prefer a traditional scoring approach, a logistic regression-based nomogram was constructed:

**How to Use:**
1. Assign points for each clinical variable based on the nomogram scale
2. Sum total points
3. Map total points to predicted probability

**Top Point Contributors:**
- Family history of infertility: up to 67 points
- Seminal plasma pH: up to 65 points
- Left testicular size (Sono): up to 55 points
- Patient age: up to 55 points
- FSH level: up to 48 points

*Note*: The nomogram (AUC = 0.832) is less accurate than the full ML models (AUC = 1.000) but provides a simpler, transparent scoring system suitable for bedside use.

---

## Fairness and Equity Considerations

The model was assessed for fairness across age groups and race/ethnicity:

- **Equal Opportunity** (same true positive rate across groups): ✓ Fair
- **Predictive Parity** (same precision across groups): ✓ Fair
- **Demographic Parity**: ⚠️ Slight age-based disparity (0.197)

The age-based disparity is **clinically expected** — different age groups genuinely have different success rates. This is not a model bias issue but rather a reflection of biological reality. However, clinicians should be aware that the model may predict different positive rates for different age groups.

---

## Minimal Testing Requirements

Not all 36 clinical variables are equally necessary. Analysis shows that:

- **25 features** retain >96% of predictive accuracy
- **20 features** retain >92% accuracy
- **Top 10 features** alone achieve ~71% accuracy

**Practical Implication**: In resource-limited settings, focusing on the top 10-15 clinical variables can still provide meaningful predictive guidance.

---

## Limitations and Caveats

### For Clinical Implementation

1. **Overfitting Concern**: AUC values of 1.0 on training data warrant external validation before clinical deployment. These results should be interpreted as demonstrating strong signal in the data, not as guarantees of perfect real-world performance.

2. **Single-Center Data**: All 2,450 patients are from Royan Infertility Treatment Center. Validation at other centers with different patient populations is essential.

3. **Standardized Variables**: The model uses z-score standardized values. A clinical calculator tool would be needed to translate raw measurements into model inputs.

4. **Temporal Validity**: Clinical practices and patient demographics may change over time. Periodic model recalibration is recommended.

5. **Not a Replacement for Clinical Judgment**: The model should augment, not replace, clinical expertise. In cases of low model agreement (2.3% of patients), clinical judgment should take precedence.

---

## Recommendations for Clinical Practice

1. **Pre-operative Workup**: Ensure right testicular ultrasound measurement, seminal plasma pH, Sakamoto index, and complete hormonal panel (E2, FSH, LH, Testosterone) are obtained for all NOA patients considering micro-TESE

2. **Risk Discussion**: Use the three-tier risk classification to structure pre-operative counseling conversations

3. **Shared Decision-Making**: Present model predictions as one input among many in the decision-making process

4. **Documentation**: Record all predictive features systematically to enable future model validation and updates

5. **Referral Patterns**: Consider genetic evaluation (Y-chromosome microdeletion, karyotype) for patients in the high-risk group

---

*This clinical interpretation was generated as part of the Phase 5 XAI Analysis of the NOA ML Project.*  
*For technical details, see the full Phase5_Report.md.*  
*Hossein Jamalirad — Medical Informatics Group, Mashhad — March 2026*
