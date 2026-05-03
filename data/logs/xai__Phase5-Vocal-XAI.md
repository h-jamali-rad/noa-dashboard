# Phase 5 — Vocal XAI: Bilingual Podcast Script

## Explainable AI Podcast: Predicting Sperm Retrieval Success in Non-Obstructive Azoospermia

**Duration**: ~18 minutes  
**Format**: Bilingual (Farsi / English)  
**Style**: Conversational, informative, engaging for clinical and academic audiences  

---

## Section 1: Introduction
**[Timestamp: 00:00 – 02:30]**

---

### 🎙️ English — Introduction

Hello and welcome to this special podcast episode on Explainable Artificial Intelligence in Reproductive Medicine.

I'm here to share with you the findings of Phase 5 of an important research project: **Machine Learning for Predicting Sperm Retrieval Success in Non-Obstructive Azoospermia**.

This research was conducted by **Hossein Jamalirad, PhD Candidate of Medical Informatics**, at the Medical Informatics Group in Mashhad, in collaboration with the Royan Infertility Treatment Center, under the supervision of **Dr. Vakili** and **Dr. Sabaghian**.

The study analyzed clinical records of **2,450 patients** using **27 machine learning models** and more than **15 Explainable AI techniques** — making it one of the most comprehensive XAI analyses in the field of male infertility.

---

## Section 2: Research Background
**[Timestamp: 02:30 – 05:00]**

---

### 🎙️ English — Why This Matters

Non-Obstructive Azoospermia — or NOA — is one of the most severe forms of male infertility. It affects approximately 10% of infertile men, and it means that no sperm is found in the ejaculate due to impaired sperm production in the testes.

For these patients, **micro-TESE** — microsurgical testicular sperm extraction — is often the only option. But here's the challenge: success rates vary between 30 and 60 percent, and there's no reliable way to predict who will benefit from surgery.

This is where machine learning comes in. By analyzing patterns across thousands of patient records — including ultrasound measurements, hormonal levels, surgical history, and laboratory tests — we can build predictive models that help clinicians and patients make more informed decisions.

But prediction alone is not enough. We need to **explain** these predictions. That's what Explainable AI — or XAI — is all about. And that's what this Phase 5 analysis delivers.

---

## Section 3: Methodology
**[Timestamp: 05:00 – 08:00]**

---

### 🎙️ English — Models & Techniques

Let me give you a sense of the scale of this analysis.

We evaluated **27 machine learning models** — including gradient boosting methods like LightGBM and XGBoost, ensemble approaches like Random Forest and Stacking/Voting Ensembles, support vector machines, neural networks, and traditional methods like logistic regression and Naive Bayes.

But the real innovation is in the **explainability layer**. We applied over 15 XAI techniques organized into five major categories:

**Part 1** — Global Feature Importance: Native importance, Permutation importance, and SHAP global analysis to identify which clinical factors matter most.

**Part 2** — Local Interpretability: SHAP waterfall plots, LIME explanations, and PDP/ICE curves to explain individual patient predictions.

**Part 3** — Performance Visualization: ROC curves with bootstrap confidence intervals, Precision-Recall curves, calibration diagrams, and confusion matrices for all 27 models.

**Part 4** — Advanced XAI: Uncertainty quantification, feature interaction analysis, counterfactual explanations, clinical decision rules, model agreement, and prediction stability.

**Part 5** — Clinical Decision Support: Subgroup analysis, risk stratification, decision curve analysis, nomogram construction, cost-benefit optimization, and fairness evaluation.

In total, we generated **over 215 publication-quality figures** and **21 structured data files**.

---

## Section 4: Key Findings
**[Timestamp: 08:00 – 13:00]**

---

### 🎙️ English — Main Results

Now, let's walk through the most important findings.

**Finding 1 — Model Performance**: LightGBM achieved a perfect AUC of 1.000. Three other models — KNN, VotingEnsemble, and StackingEnsemble — also reached AUC = 1.000. XGBoost and RandomForest were close behind at AUC ≥ 0.9999. This is remarkable performance, indicating very strong predictive signals in the clinical data.

**Finding 2 — Top Predictors**: The single most important feature, confirmed by every XAI method we used, is **Right Testicular Size measured by ultrasound**. This was followed by **Seminal Plasma pH** and **Surgical Trauma History**. Other important predictors include the Sakamoto index, Estradiol (E2), left testicular size, patient age, and family history of infertility.

**Finding 3 — Feature Interactions**: The strongest feature interaction was between **Right Testicular Size and the Sakamoto-RT/mL index** — with a SHAP interaction value of 0.161. This tells us that these two measurements have a synergistic effect: the predictive value of testicular size depends on the Sakamoto index, and vice versa. Clinically, this means both should be evaluated together.

**Finding 4 — Risk Stratification**: We developed a three-tier risk classification:
- **Low Risk** (37.2% of patients): 100% actual success rate — these patients are excellent micro-TESE candidates
- **High Risk** (62.2%): 0% success rate — these patients should be counseled about alternatives
- **Medium Risk** (0.5%): 31% success — these borderline cases require careful shared decision-making

What's particularly striking is the **bimodal distribution** — the model is very confident in most predictions, with only 0.5% of patients falling in the uncertain zone.

**Finding 5 — Model Agreement**: 86.4% of patient predictions showed high consensus across all 27 models, meaning the predictions are robust and not dependent on any single algorithm.

**Finding 6 — Clinical Rules**: We extracted 14 transparent clinical decision rules from the ML models. For example: "If right testicular size is below average AND E2 is elevated AND LH is normal, predict FAILURE with 98% confidence." These rules provide clinicians with interpretable logic they can validate against their own experience.

**Finding 7 — Prediction Stability**: When we artificially perturbed input features by ±5%, model predictions remained highly stable. The top models (KNN, StackingEnsemble, TabNet) showed perfect stability scores of 1.000.

---

## Section 5: Clinical Implications
**[Timestamp: 13:00 – 16:30]**

---

### 🎙️ English — Clinical Applications

So what does all this mean for clinical practice? Let me highlight the most actionable takeaways.

**First — Pre-operative Workup**: Right testicular ultrasound measurement is the single most critical test. Combined with seminal plasma pH, the Sakamoto index, and a hormonal panel (E2, FSH, LH, Testosterone), clinicians can gather the data needed for accurate risk prediction.

**Second — Patient Counseling**: The three-tier risk stratification provides a clear framework for patient discussions. For Low-Risk patients, proceed with confidence. For High-Risk patients, discuss alternatives openly. For the rare Medium-Risk patient, engage in detailed shared decision-making.

**Third — Decision Support**: We built a clinical nomogram that assigns points based on each variable — it's less accurate than the full ML model but provides a simple bedside tool. The top point contributors are family history of infertility (67 points), seminal plasma pH (65 points), and left testicular size (55 points).

**Fourth — Optimal Threshold**: Our cost-benefit analysis identified 0.39 as the optimal decision threshold — lower than the default 0.5 — reflecting that missing a patient who could benefit from surgery (false negative) is clinically more costly than an unnecessary procedure (false positive).

**Fifth — Fairness**: The model treats patients fairly across racial and ethnic groups. A minor age-based disparity in positive prediction rates was detected (0.197), which is clinically expected since different age groups genuinely have different success rates.

**Sixth — Minimal Testing**: In resource-limited settings, focusing on just the **top 25 features** retains 97% of predictive accuracy. Even the **top 10 features** achieve 71% accuracy — far better than chance.

---

## Section 6: Future Directions
**[Timestamp: 16:30 – 18:00]**

---

### 🎙️ English — Looking Ahead

This research represents a significant milestone, but there's more work to be done.

**Next Step 1**: External validation on multi-center datasets — to ensure these findings generalize beyond Royan Center.

**Next Step 2**: Development of a web-based clinical decision support tool — allowing clinicians to input patient data and receive real-time predictions with explanations.

**Next Step 3**: A prospective clinical trial comparing ML-guided counseling with standard care — to measure the real-world impact on patient outcomes and satisfaction.

**Next Step 4**: Publication in peer-reviewed journals — we envision at least three manuscripts covering model development, XAI methodology, and clinical applications.

---

## Section 7: Conclusion
**[Timestamp: 18:00 – 19:30]**

---

### 🎙️ English — Wrap-Up

To summarize: this study demonstrates that machine learning can predict micro-TESE outcomes with exceptional accuracy — and more importantly, that we can **explain** those predictions in clinically meaningful ways.

The key message is clear: **Right testicular size, seminal plasma pH, and surgical history are the three pillars of prediction.** When combined with hormonal markers and the Sakamoto index, they create a powerful predictive framework.

The three-tier risk classification — Low, Medium, and High Risk — provides a practical tool for patient counseling that could fundamentally change how we approach NOA treatment decisions.

This research by **Hossein Jamalirad, PhD Candidate of Medical Informatics**, under the supervision of Dr. Vakili and Dr. Sabaghian at the Royan Infertility Treatment Center, represents a significant step toward transparent, trustworthy AI in reproductive medicine.

Thank you for listening. For the full technical report, clinical interpretation guide, and all supplementary materials, please refer to the Phase 5 documentation.

---

## Appendix: Episode Notes

### Key Numbers Mentioned
- 2,450 patients analyzed
- 27 ML models evaluated
- 36 clinical features
- 15+ XAI techniques
- 215+ figures generated
- AUC = 1.000 (top models)
- 86.4% high model agreement
- 37.2% Low Risk (100% success), 62.2% High Risk (0% success)
- 14 clinical decision rules
- Optimal threshold: 0.39
- 25 features for 97% accuracy retention

### Research Team
- **Lead Researcher**: Hossein Jamalirad, PhD Candidate of Medical Informatics
- **Supervisors**: Dr. Vakili, Dr. Sabaghian
- **Institution**: Medical Informatics Group, Mashhad — Royan Infertility Treatment Center

### Related Documents
- `Phase5_Report.md` — Full Technical Report
- `clinical_interpretation.md` — Clinical Synthesis for Physicians
- `Final_Research_Findings.md` — Executive Summary
- `Figure_Index.md` — Complete Figure Catalog

---

*Podcast script prepared for Phase 5 XAI Analysis — NOA ML Project*  
*March 13, 2026*
