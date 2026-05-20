'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Globe,
  List,
  ArrowUp,
  Download,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ──────────────────────── Types ──────────────────────── */
interface Abbreviation {
  abbreviation: string
  full_form: string
}

interface ThesisData {
  english_abstract: string
  persian_abstract: string
  abbreviations: Array<string | Abbreviation>
  chapter_1_introduction: string
  chapter_2_literature_review: string
  chapter_3_methods: string
  chapter_4_results: string
  chapter_5_discussion: string
  references: string[]
  table_of_contents: string
  list_of_tables: string[]
  list_of_figures: string[]
}

interface ChapterInfo {
  key: keyof ThesisData
  num: number
  title: string
  icon: string
}

const CHAPTERS: ChapterInfo[] = [
  { key: 'chapter_1_introduction', num: 1, title: 'Introduction', icon: '📖' },
  { key: 'chapter_2_literature_review', num: 2, title: 'Literature Review', icon: '📚' },
  { key: 'chapter_3_methods', num: 3, title: 'Materials and Methods', icon: '🔬' },
  { key: 'chapter_4_results', num: 4, title: 'Results', icon: '📊' },
  { key: 'chapter_5_discussion', num: 5, title: 'Discussion & Conclusion', icon: '💡' },
]

/* ──────────────────── Figure definitions ──────────────────── */
/*
 * Each figure is placed AFTER its target section's content (just before
 * the next sub-section heading or the end of the chapter). MUMS formatting:
 *   - numbered "Figure C-N" where C = chapter, N = sequence within chapter
 *   - caption sits BELOW the figure, italic, 2pt smaller than body text
 *   - >= 2 blank lines of vertical padding around the figure block
 *   - each figure is referenced in the surrounding text before it appears
 */
interface ThesisFigure {
  chapter: number
  section: string // e.g. "3.3" — figure is rendered after this section
  figNum: string  // e.g. "3-1"
  src: string     // path under public/, e.g. /images/foo.png
  caption: string
}

const THESIS_FIGURES: ThesisFigure[] = [
  // ════════════════════════════════════════════════════════════════════
  // Chapter 3 — Materials and Methods
  // ════════════════════════════════════════════════════════════════════
  {
    chapter: 3,
    section: '3.3',
    figNum: '3-1',
    src: '/images/prisma_paper_a.png',
    caption:
      'PRISMA 2020 flow diagram for the systematic review of clinical and hormonal predictors of micro-TESE outcomes in non-obstructive azoospermia. PubMed, Scopus, Web of Science and Embase were searched from inception to 30 June 2024. After deduplication, records were screened on title and abstract by two independent reviewers, then assessed in full text against the pre-registered inclusion criteria; studies finally included in the qualitative synthesis informed the candidate predictor set ultimately operationalised in the present cohort (n=2,413 NOA patients, Royan Institute, 2007–2022).',
  },
  {
    chapter: 3,
    section: '3.3',
    figNum: '3-2',
    src: '/images/prisma_paper_b.png',
    caption:
      'PRISMA 2020 flow diagram for the systematic review of machine-learning and explainable-AI approaches to micro-TESE outcome prediction. The search encompassed PubMed, Scopus, Web of Science and IEEE Xplore from inception to 30 June 2024 and used a controlled vocabulary covering "non-obstructive azoospermia", "micro-TESE", "machine learning", "deep learning" and "explainable AI". The included studies define the benchmarking landscape against which the present 16-model ensemble is compared.',
  },
  {
    chapter: 3,
    section: '3.6',
    figNum: '3-3',
    src: '/images/preprocessing/learning_curve.png',
    caption:
      'Representative learning curve produced during preprocessing pipeline development for the n=2,413 NOA cohort. Training and 5-fold cross-validated AUC are plotted as a function of training sample size; convergence of the two curves at the full sample size indicates that the available cohort is sufficient for stable model fitting and that further gains require additional data rather than model complexity.',
  },

  // ════════════════════════════════════════════════════════════════════
  // Chapter 4 — Results
  // ════════════════════════════════════════════════════════════════════

  // ── §4.3  Model Performance Comparison — Full 16-Model Benchmark ──
  {
    chapter: 4,
    section: '4.3',
    figNum: '4-1',
    src: '/images/training/roc_curves_all_models.png',
    caption:
      'Receiver Operating Characteristic (ROC) curves for the full 16-model benchmark on the held-out internal test cohort (20% of n=2,413 patients, stratified). Each curve corresponds to one candidate algorithm spanning all major ML paradigms (gradient boosting, ensemble bagging, kernel methods, neural networks, probabilistic and instance-based learners). The diagonal indicates a non-informative classifier (AUC=0.5). CatBoost v2 attained the highest AUC of 0.8306 (95% CI 0.7845–0.8767), confirming the a-priori hypothesis that gradient-boosted tree ensembles are best suited to mixed-type tabular clinical data.',
  },
  {
    chapter: 4,
    section: '4.3',
    figNum: '4-2',
    src: '/images/training/roc_curves_top_models_comparison.png',
    caption:
      'Magnified ROC comparison of the top-performing candidate algorithms on the held-out test cohort. Restricting the view to the leading models reveals the tight clustering of the gradient-boosting family (CatBoost v2, XGBoost v2, LightGBM v2, Gradient Boosting v2) and the Stacking Ensemble at AUCs in the 0.81–0.83 band, in contrast to the visibly inferior performance of the wider 16-model benchmark.',
  },
  {
    chapter: 4,
    section: '4.3',
    figNum: '4-3',
    src: '/images/training/precision_recall_curves_all_models.png',
    caption:
      'Precision-Recall (PR) curves for the full 16-model benchmark on the held-out test cohort. PR analysis is reported because the cohort exhibits a moderate class imbalance of approximately 1.72:1 (886 retrieval successes vs 1,527 failures, success rate 36.7%), under which AUC-PR characterises positive-class performance more faithfully than ROC. The champion CatBoost v2 model maintained the highest AUC-PR while preserving the rank-order observed in ROC space.',
  },
  {
    chapter: 4,
    section: '4.3',
    figNum: '4-4',
    src: '/images/validation/model_performance_comparison.png',
    caption:
      'Multi-metric performance comparison across all 16 candidate models on the held-out test cohort. The six panels show AUC-ROC, AUC-PR, accuracy, F1-score, sensitivity and specificity. CatBoost v2 leads on the discrimination metrics (AUC 0.8306, accuracy 0.769, F1 0.683) and Brier-derived calibration, while supporting roughly equipotent operating points across the recommended 10–60% probability threshold range used for the downstream Decision Curve Analysis.',
  },
  {
    chapter: 4,
    section: '4.3',
    figNum: '4-5',
    src: '/images/validation/top5_radar_comparison.png',
    caption:
      'Radar chart comparing the top five v2 models (CatBoost v2, XGBoost v2, LightGBM v2, Gradient Boosting v2, Stacking Ensemble) across seven complementary performance dimensions (AUC-ROC, AUC-PR, accuracy, F1, sensitivity, specificity, Brier score). The shape and area of each polygon visualise the well-roundedness of each candidate; CatBoost v2 covers the largest area and is the only model to lie on the outer envelope on more than four of the seven axes.',
  },
  {
    chapter: 4,
    section: '4.3',
    figNum: '4-6',
    src: '/images/xai/performance_summary_heatmap.png',
    caption:
      'Performance summary heatmap presenting the seven evaluation metrics (rows) by the 16 candidate models (columns) on the held-out test cohort, with cell colour encoding the standardised score. The heatmap demonstrates that the gradient-boosting family is consistently dominant across metrics, while the absence of any single metric on which a non-boosting model dominates supports the a-priori choice of CatBoost v2 as the champion.',
  },

  // ── §4.4  Champion Model: CatBoost v2 ──
  {
    chapter: 4,
    section: '4.4',
    figNum: '4-7',
    src: '/images/validation/confusion_matrix_CatBoost.png',
    caption:
      'Confusion matrix for the champion CatBoost v2 model evaluated on the held-out test cohort at the F1-optimal probability threshold. True-positive, false-positive, false-negative and true-negative cells are reported with both absolute counts and row-normalised proportions, supporting the sensitivity (0.678), specificity (0.822) and PPV (0.688) reported in the abstract.',
  },
  {
    chapter: 4,
    section: '4.4',
    figNum: '4-8',
    src: '/images/validation/nested_cv_comparison.png',
    caption:
      'Nested 5×5 cross-validation comparison of the top five v2 models. The outer 5-fold loop estimates generalisation error while the inner 5-fold loop performs Bayesian hyper-parameter search (50 iterations per model per fold). Box plots show the distribution of outer-fold AUC values, providing an unbiased estimate that is not subject to model-selection bias. CatBoost v2 maintains the highest median and one of the narrowest interquartile ranges.',
  },
  {
    chapter: 4,
    section: '4.4',
    figNum: '4-9',
    src: '/images/validation/bootstrap_ci_comparison.png',
    caption:
      'Bootstrap 95% confidence intervals for the test-set AUC of the top five v2 models, derived from 1,000 resamples with replacement of the held-out test cohort. CatBoost v2 (AUC 0.8306, CI 0.7845–0.8767) has the highest lower bound, supporting its selection as the deployment model.',
  },
  {
    chapter: 4,
    section: '4.4',
    figNum: '4-10',
    src: '/images/validation/bootstrap_auc_distributions.png',
    caption:
      'Bootstrap distributions of test-set AUC for the top five v2 models (1,000 resamples). The kernel density estimates allow pairwise visual comparison of distributional overlap and complement the point CIs reported in Figure 4-9; the limited overlap between CatBoost v2 and the next-best models corroborates the rank order obtained by nested cross-validation.',
  },
  {
    chapter: 4,
    section: '4.4',
    figNum: '4-11',
    src: '/images/validation/learning_curves_all_models.png',
    caption:
      'Learning curves for all 16 candidate models on the n=2,413 cohort. Training-set and 5-fold cross-validated AUC are plotted as a function of training sample size. The plateau of the cross-validation curve for the boosting family at the full sample size confirms convergence and indicates that the marginal gain from additional data would be modest.',
  },
  {
    chapter: 4,
    section: '4.4',
    figNum: '4-12',
    src: '/images/validation/learning_curves_bias_variance.png',
    caption:
      'Bias-variance decomposition derived from the learning curves of the top five v2 models. The gap between training and cross-validation AUC quantifies variance, while the deviation of the training curve from a perfect AUC of 1.0 quantifies bias. CatBoost v2 sits in the favourable low-bias, low-variance regime that motivated its selection as the champion deployment model.',
  },
  {
    chapter: 4,
    section: '4.4',
    figNum: '4-13',
    src: '/images/validation/stability_comparison.png',
    caption:
      'Cross-seed stability comparison of the top five v2 models. Each model was retrained with 30 distinct random seeds for the train/test split and stratified cross-validation; box plots summarise the resulting AUC distributions. The compactness of the CatBoost v2 box indicates that the reported performance is robust to seed selection and not an artefact of a fortuitous split.',
  },
  {
    chapter: 4,
    section: '4.4',
    figNum: '4-14',
    src: '/images/validation/stability_seeds_boxplot.png',
    caption:
      'Per-model seed-stability boxplots for all 16 candidates, complementing the focused comparison in Figure 4-13. Wider boxes (e.g. SVM, Naive Bayes) indicate sensitivity of the algorithm to data partitioning, whereas the gradient-boosting family demonstrates seed-invariance — an essential property for clinical deployment where the deployed model must behave deterministically.',
  },
  {
    chapter: 4,
    section: '4.4',
    figNum: '4-15',
    src: '/images/validation/robustness_heatmap.png',
    caption:
      'Robustness heatmap showing the relative AUC degradation of each candidate model under a battery of perturbations: feature dropout, additive Gaussian noise on continuous features, randomised categorical encoding, and missingness injection at 5/10/20% rates. Lower (greener) values indicate greater robustness; CatBoost v2 again ranks at the top, supporting its candidacy for real-world clinical use where input quality is heterogeneous.',
  },
  {
    chapter: 4,
    section: '4.4',
    figNum: '4-16',
    src: '/images/validation/robustness_noise_degradation.png',
    caption:
      'AUC degradation of the top five v2 models as a function of additive Gaussian noise on the continuous predictors (σ = 0.05, 0.10, 0.20, 0.30 in standardised units). CatBoost v2 retains a graceful, near-linear degradation, in contrast to the steeper drop observed for the kernel and neural models, suggesting that measurement error on hormonal and anthropometric inputs will not catastrophically impair real-world performance.',
  },
  {
    chapter: 4,
    section: '4.4',
    figNum: '4-17',
    src: '/images/validation/overfitting_analysis.png',
    caption:
      'Overfitting analysis comparing the train–test AUC gap of all 16 candidate models. Models above the diagonal exhibit positive train–test gaps indicative of overfitting; the gradient-boosting family with early-stopping regularisation (and CatBoost v2 in particular) sits near the diagonal, confirming that the Bayesian hyper-parameter search effectively prevented over-fitting under the nested 5×5 protocol.',
  },
  {
    chapter: 4,
    section: '4.4',
    figNum: '4-18',
    src: '/images/validation/5fold_auc_heatmap.png',
    caption:
      'Per-fold AUC heatmap for the 5-fold stratified outer cross-validation of all 16 candidate models. Each cell encodes the AUC achieved on the held-out outer fold (columns) by a given model (rows). The horizontal uniformity of the CatBoost v2 row reinforces the fold-to-fold stability evidence presented in Figure 4-13.',
  },

  // ── §4.8  Model Calibration Results ──
  {
    chapter: 4,
    section: '4.8',
    figNum: '4-19',
    src: '/images/validation/calibration_plots.png',
    caption:
      'Calibration curves (reliability diagrams) for the top v2 models before and after Platt scaling / isotonic recalibration. The 45° dashed line represents perfect calibration. After isotonic recalibration, CatBoost v2 attained a Brier score consistent with the abstract figures and a calibration slope close to unity, confirming that the predicted probabilities can be interpreted as well-calibrated risks suitable for clinical decision making.',
  },

  // ── §4.9  Decision Curve Analysis Results ──
  {
    chapter: 4,
    section: '4.9',
    figNum: '4-20',
    src: '/images/validation/decision_curve_analysis.png',
    caption:
      'Decision Curve Analysis (DCA) for the champion CatBoost v2 model against the treat-all and treat-none reference strategies across the clinically relevant probability threshold range (10–60%). The CatBoost v2 curve dominates both reference strategies over the entire range, demonstrating positive net benefit for any plausible patient or clinician preference and supporting the model as a clinically actionable predictive tool.',
  },

  // ════════════════════════════════════════════════════════════════════
  // Chapter 5 — Discussion & Conclusion
  // ════════════════════════════════════════════════════════════════════

  // ── §5.3  Interpretation of Feature Importance ──
  {
    chapter: 5,
    section: '5.3',
    figNum: '5-1',
    src: '/images/xai/shap_beeswarm_XGBoost.png',
    caption:
      'SHAP beeswarm plot of the top 20 predictors for a representative top-five v2 model (XGBoost v2; the CatBoost v2 beeswarm follows the same rank order). Each point is a patient; horizontal position is the per-patient SHAP value (impact on the log-odds of successful retrieval) and colour encodes the original feature value (red = high, blue = low). LH, age and FSH dominate the global importance, with the directional pattern (high LH → negative SHAP) recovering the clinical intuition that primary testicular failure suppresses spermatogenic reserve.',
  },
  {
    chapter: 5,
    section: '5.3',
    figNum: '5-2',
    src: '/images/xai/shap_bar_XGBoost.png',
    caption:
      'Mean absolute SHAP bar chart for the top 20 predictors of a representative top-five v2 model (XGBoost v2). The bar lengths quantify the average magnitude of each feature\'s contribution to model output across the held-out test cohort: LH (|SHAP|=0.317), Age (0.270), FSH (0.250) and Testicular volume (0.212) are the four dominant predictors, jointly accounting for more than half of the total explained variance.',
  },
  {
    chapter: 5,
    section: '5.3',
    figNum: '5-3',
    src: '/images/xai/shap_comparison_top5.png',
    caption:
      'Cross-model SHAP global feature importance comparison for the top five v2 models. The agreement of the top-ranked predictors (LH, Age, FSH, Testicular volume) across CatBoost v2, XGBoost v2, LightGBM v2, Gradient Boosting v2 and the Stacking Ensemble — observed in 100% of 200 bootstrap resamples — provides multi-method explainability evidence that the predictive signal is anchored in well-understood reproductive endocrinology rather than in algorithm-specific artefacts.',
  },
  {
    chapter: 5,
    section: '5.3',
    figNum: '5-4',
    src: '/images/xai/shap_heatmap_top5.png',
    caption:
      'SHAP heatmap of the top five v2 models against the top 20 predictors. Rows are models, columns are features; cell colour encodes the standardised mean absolute SHAP value. The uniformly bright top-four columns visualise the cross-model agreement on the dominance of LH, Age, FSH and Testicular volume reported in the abstract.',
  },
  {
    chapter: 5,
    section: '5.3',
    figNum: '5-5',
    src: '/images/xai/shap_vs_lime_comparison.png',
    caption:
      'Cross-method explainability concordance between SHAP and LIME for the champion CatBoost v2 model. Each point is a patient in the held-out test cohort; the X-axis is the SHAP-derived contribution of a feature and the Y-axis is the LIME-derived contribution. The strong linear concordance demonstrates that the global rank-ordering of predictors is invariant to the choice of explanation method, satisfying the multi-method explainability requirement of TRIPOD+AI 2024.',
  },
  {
    chapter: 5,
    section: '5.3',
    figNum: '5-6',
    src: '/images/xai/shap_dependence_Age.png',
    caption:
      'SHAP dependence plot for patient age (champion CatBoost v2). The X-axis is the patient age in years; the Y-axis is the per-patient SHAP value for the age feature; point colour encodes the patient\'s LH value (red = high LH) to visualise the documented age × LH interaction. The non-monotonic trend reveals a "young-but-azoospermic" subgroup (age < 30 years with high LH) that the model identifies as having a markedly lower probability of successful retrieval.',
  },
  {
    chapter: 5,
    section: '5.3',
    figNum: '5-7',
    src: '/images/xai/shap_dependence_Testis_Size_right_Sono.png',
    caption:
      'SHAP dependence plot for right testicular volume measured by sonography (champion CatBoost v2). The X-axis is the testicular volume in mL; the Y-axis is the per-patient SHAP value; point colour encodes age. The steep monotonic rise between 4 and 12 mL recovers the long-recognised clinical inflexion below which spermatogenic reserve is severely impaired.',
  },
  {
    chapter: 5,
    section: '5.3',
    figNum: '5-8',
    src: '/images/xai/native_fi_comparison.png',
    caption:
      'Native feature-importance comparison across the four gradient-boosting v2 models (CatBoost, XGBoost, LightGBM, Gradient Boosting). For each algorithm the model-internal importance metric (split-gain for boosting trees) is shown alongside the unified SHAP rank, demonstrating that the SHAP-derived rank order is consistent with the native importance signal and therefore a faithful, not contrived, summary.',
  },
  {
    chapter: 5,
    section: '5.3',
    figNum: '5-9',
    src: '/images/xai/permutation_importance_heatmap.png',
    caption:
      'Permutation-importance heatmap across the top five v2 models (rows) for the top 20 predictors (columns). Permutation importance, computed by the mean drop in test-set AUC after shuffling a single feature 100 times, provides a model-agnostic confirmation of the SHAP rankings. The bright LH, Age, FSH and Testicular-volume columns reproduce the four dominant predictors identified by SHAP, completing the triangulation across three independent importance metrics.',
  },
  {
    chapter: 5,
    section: '5.3',
    figNum: '5-10',
    src: '/images/xai/interaction_heatmap.png',
    caption:
      'SHAP feature-interaction heatmap for the champion CatBoost v2 model showing the top 15 features along both axes. Off-diagonal cell intensity quantifies the magnitude of the SHAP interaction value between each feature pair. The pattern reveals biologically plausible interactions — notably age × LH, age × FSH, and testicular-volume × LH — which underpin the non-additive components of the predictive signal.',
  },

  // ── §5.4  Comparison with Prior Studies (local explanations as cross-method comparison) ──
  {
    chapter: 5,
    section: '5.4',
    figNum: '5-11',
    src: '/images/xai/lime_True-Positive.png',
    caption:
      'LIME local explanation for an illustrative true-positive patient (predicted success, observed success) drawn from the held-out test cohort. The horizontal bars show the locally-linear contribution of each feature to the prediction; positive (green) bars push the model towards success and negative (red) bars towards failure. The dominance of normal-range LH and FSH together with above-cut-off testicular volume rationalises the high model confidence in this case.',
  },
  {
    chapter: 5,
    section: '5.4',
    figNum: '5-12',
    src: '/images/xai/lime_False-Negative.png',
    caption:
      'LIME local explanation for an illustrative false-negative patient (predicted failure, observed success) drawn from the held-out test cohort. The explanation reveals how the combination of borderline LH, advanced age and small testicular volume drives the model towards a failure prediction despite the eventual successful retrieval, exemplifying the residual uncertainty that motivates the calibrated probability output rather than a hard binary recommendation.',
  },
  {
    chapter: 5,
    section: '5.4',
    figNum: '5-13',
    src: '/images/xai/pdp_Testis_Size_right_Sono.png',
    caption:
      'Partial Dependence Plot (PDP) for right testicular volume (champion CatBoost v2), showing the marginal effect of the feature on the model-predicted probability of successful retrieval, averaged over all other features in the held-out test cohort. The PDP confirms the global monotonic positive relationship and the steep gain between 4 and 12 mL also visible in the SHAP dependence plot (Figure 5-7), validating the SHAP-derived shape with a fully model-agnostic technique.',
  },
  {
    chapter: 5,
    section: '5.4',
    figNum: '5-14',
    src: '/images/xai/ice_Testis_Size_right_Sono.png',
    caption:
      'Individual Conditional Expectation (ICE) plot for right testicular volume (champion CatBoost v2). Each thin line traces the predicted probability for a single patient as the testicular volume is hypothetically varied while all other features are held fixed; the bold yellow line is the PDP average. The strong line-by-line monotonicity confirms that the effect of testicular volume is consistent across patient subgroups and is not driven by an unrepresentative subset.',
  },

  // ── §5.5  The Data Leakage Lesson (Methodological Transparency) ──
  {
    chapter: 5,
    section: '5.5',
    figNum: '5-15',
    src: '/images/xai/calibration_CatBoost.png',
    caption:
      'Reliability diagram for the champion CatBoost v2 model on the held-out test cohort. Predicted probabilities are binned into deciles and the empirical observed frequency is plotted against the bin midpoint. The empirical curve closely tracks the 45° identity line, confirming that the v2 pipeline — which eliminates the data leakage present in the historical v1 pipeline — produces probabilities that are interpretable as well-calibrated risks suitable for shared decision-making.',
  },
  {
    chapter: 5,
    section: '5.5',
    figNum: '5-16',
    src: '/images/xai/calibration_comparison_all_models.png',
    caption:
      'Reliability-diagram comparison of all 16 candidate v2 models on the held-out test cohort, overlaid for direct visual contrast. The bunching of the boosting family close to the 45° identity line, in contrast to the visible over- and under-confidence of the kernel and instance-based learners, is one of the key methodological insights of this dissertation: data-leakage-free pipelines plus boosting calibrate well "out of the box", motivating the v2 selection.',
  },

  // ── §5.6  Clinical Implications ──
  {
    chapter: 5,
    section: '5.6',
    figNum: '5-17',
    src: '/images/xai/decision_curve_analysis.png',
    caption:
      'Decision Curve Analysis (DCA) of the champion CatBoost v2 model from a clinical-utility perspective, plotted against the treat-all and treat-none reference strategies across the 10–60% probability threshold range. The positive net-benefit gap over the reference strategies, sustained across all clinically reasonable preferences, supports the deployment of the model as an aid to the shared decision to proceed with micro-TESE.',
  },
  {
    chapter: 5,
    section: '5.6',
    figNum: '5-18',
    src: '/images/xai/nomogram_full.png',
    caption:
      'Clinical nomogram derived from the champion CatBoost v2 model. Each predictor (top axis) contributes a point score (0–100) determined by its observed value; the total points (bottom axis) are mapped to the predicted probability of successful micro-TESE retrieval. The nomogram is the paper-friendly artefact intended for delivery to clinicians who do not have access to the web-based CDSS, ensuring equitable access to model-guided decision support.',
  },
  {
    chapter: 5,
    section: '5.6',
    figNum: '5-19',
    src: '/images/xai/nomogram_odds_ratio_forest.png',
    caption:
      'Forest plot of adjusted odds ratios with 95% confidence intervals for the predictors retained in the clinical nomogram. The plot complements the nomogram (Figure 5-18) with a familiar epidemiological summary: odds ratios significantly different from unity (CI not crossing 1.0) confirm the independent contribution of each retained predictor after mutual adjustment.',
  },
  {
    chapter: 5,
    section: '5.6',
    figNum: '5-20',
    src: '/images/xai/cost_benefit_analysis.png',
    caption:
      'Cost-benefit analysis comparing the CatBoost v2 model-guided strategy against the conventional treat-all policy at clinically realistic prevalence (36.7% success rate) and a sweep of net-benefit weights reflecting the value placed on a successful retrieval against the cost of an avoidable procedure. The model-guided strategy yields positive net economic benefit across the entire policy-relevant weight range, demonstrating that the clinical value of the predictive model translates into a quantifiable health-economic gain.',
  },
  {
    chapter: 5,
    section: '5.6',
    figNum: '5-21',
    src: '/images/xai/risk_stratification.png',
    caption:
      'Three-band risk stratification of the held-out test cohort using the CatBoost v2 predicted probability (low <30%, intermediate 30–60%, high ≥60%). The observed micro-TESE success rate within each stratum closely tracks the predicted band, supporting the operational use of the model to triage patients into different counselling and surgical pathways.',
  },
  {
    chapter: 5,
    section: '5.6',
    figNum: '5-22',
    src: '/images/xai/clinical_rules_summary.png',
    caption:
      'Summary of the simple if-then clinical decision rules derived from the SHAP-explained CatBoost v2 model. Each rule is parameterised by a small number of routinely-collected variables (LH, age, testicular volume) and is intended for use in low-resource settings where the full CDSS interface is unavailable. The rules collectively replicate ~88% of the AUC of the full model on the held-out test cohort.',
  },
  {
    chapter: 5,
    section: '5.6',
    figNum: '5-23',
    src: '/images/xai/uncertainty_distribution.png',
    caption:
      'Distribution of model uncertainty (predictive entropy) across the held-out test cohort for the champion CatBoost v2 model. The bimodal shape highlights a confident high-probability mode and a smaller borderline mode (entropy > 0.6) that the CDSS surfaces with an explicit "uncertain — consider additional evaluation" advisory rather than committing to a confident recommendation.',
  },

  // ── §5.7  Strengths of the Study ──
  {
    chapter: 5,
    section: '5.7',
    figNum: '5-24',
    src: '/images/xai/fairness_analysis.png',
    caption:
      'Fairness analysis of the CatBoost v2 model across patient subgroups defined by age band (<35, 35–45, >45 years), body mass index category (normal, overweight, obese) and etiological category (genetic, idiopathic, post-surgical). Performance metrics shown are AUC, sensitivity, specificity and demographic parity differences. The absence of clinically meaningful disparities across subgroups (Δ AUC < 0.03 across all strata) is reported as one of the principal strengths of the study and constitutes a key prerequisite for equitable deployment.',
  },
]

/* ──────────────────── Helpers ──────────────────── */
function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function countSections(text: string): number {
  return text.split('\n').filter((l) => {
    const t = l.trim()
    return /^#{1,4}\s/.test(t) || /^\d+\.\d+(\.\d+)?\s/.test(t)
  }).length
}

/**
 * Normalise chapter markdown so the chapters that use plain numbered
 * headings (e.g. "1.1 Title", "1.1.1 Title") also render as proper
 * markdown headings. Chapters 1 & 2 in the JSON use the plain style;
 * chapters 3-5 already use `## / ###`. This keeps both routes consistent.
 */
function normaliseChapterMarkdown(
  raw: string,
  chapterNum: number,
  figures?: ThesisFigure[]
): string {
  const lines = raw.split('\n')
  const out: string[] = []
  let inFence = false
  let inTable = false

  // Section-id -> ordered list of figures to inject AFTER that section's content
  const figMap = new Map<string, ThesisFigure[]>()
  if (figures) {
    for (const f of figures) {
      if (f.chapter !== chapterNum) continue
      if (!figMap.has(f.section)) figMap.set(f.section, [])
      figMap.get(f.section)!.push(f)
    }
  }
  const flushedSections = new Set<string>()

  // Current section we are accumulating content under (e.g. "3.3").
  let currentSection: string | null = null

  // Extract section id from a section heading line like "3.3 Title".
  const sectionIdOf = (headingText: string): string | null => {
    const m = /^(\d+\.\d+)(?!\.)\s+\S/.exec(headingText.trim())
    return m ? m[1] : null
  }

  // Emit FIG marker lines for the currently-open section before we close it
  // (either because a new section is starting or we reached end of input).
  const flushFigures = (sec: string | null) => {
    if (!sec || flushedSections.has(sec)) return
    const figs = figMap.get(sec)
    if (!figs || figs.length === 0) return
    out.push('')
    for (const f of figs) {
      // Marker: [[FIG:figNum|src|caption]] — pipe is reserved
      const safeCaption = f.caption.replace(/\|/g, '/')
      out.push(`[[FIG:${f.figNum}|${f.src}|${safeCaption}]]`)
    }
    out.push('')
    flushedSections.add(sec)
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (/^```/.test(trimmed)) {
      inFence = !inFence
      out.push(line)
      continue
    }
    if (inFence) {
      out.push(line)
      continue
    }

    // Track markdown tables — leave them alone
    if (trimmed.startsWith('|')) {
      inTable = true
      out.push(line)
      continue
    }
    if (inTable && trimmed === '') {
      inTable = false
    }

    // Already a markdown heading
    const existingH = /^(#{1,6})\s+(.+)$/.exec(trimmed)
    if (existingH) {
      const headingText = existingH[2].trim()
      // Chapter heading line — always h1
      if (new RegExp(`^Chapter\\s+${chapterNum}\\s*:`).test(headingText)) {
        out.push(`# ${headingText}`)
        continue
      }
      // Re-level numbered headings for TOC consistency:
      //   "X.X.X.X …" → h4   (NOT in TOC)
      //   "X.X.X …"   → h3   (NOT in TOC)
      //   "X.X …"     → h2   (level-1 in TOC)
      if (/^\d+\.\d+\.\d+\.\d+\s+\S/.test(headingText)) {
        out.push(`#### ${headingText}`)
        continue
      }
      if (/^\d+\.\d+\.\d+\s+\S/.test(headingText)) {
        out.push(`### ${headingText}`)
        continue
      }
      if (/^\d+\.\d+\s+\S/.test(headingText)) {
        // Section heading — flush figures of PREVIOUS section first.
        flushFigures(currentSection)
        currentSection = sectionIdOf(headingText)
        out.push(`## ${headingText}`)
        continue
      }
      out.push(line)
      continue
    }

    // "Chapter N: Title" → h1
    if (new RegExp(`^Chapter\\s+${chapterNum}\\s*:`).test(trimmed)) {
      out.push(`# ${trimmed}`)
      continue
    }

    // "X.X.X.X ..." → h4
    if (/^\d+\.\d+\.\d+\.\d+\s+\S/.test(trimmed)) {
      out.push(`#### ${trimmed}`)
      continue
    }
    // "X.X.X ..." → h3
    if (/^\d+\.\d+\.\d+\s+\S/.test(trimmed)) {
      out.push(`### ${trimmed}`)
      continue
    }
    // "X.X ..." → h2 (level-1 in TOC)
    if (/^\d+\.\d+\s+\S/.test(trimmed)) {
      flushFigures(currentSection)
      currentSection = sectionIdOf(trimmed)
      out.push(`## ${trimmed}`)
      continue
    }

    out.push(line)
  }

  // Flush trailing figures for the last open section
  flushFigures(currentSection)

  return out.join('\n')
}

/* ──────────────────── Markdown renderer (on-screen) ──────────────────── */
function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h2 className="font-display font-bold text-2xl mt-10 mb-4 pb-2 border-b-2 border-primary/30 scroll-mt-24 tracking-tight">
            {children}
          </h2>
        ),
        h2: ({ children }) => (
          <h3 className="font-display font-bold text-xl mt-8 mb-3 text-foreground scroll-mt-24 tracking-tight">
            {children}
          </h3>
        ),
        h3: ({ children }) => (
          <h4 className="font-display font-semibold text-lg mt-6 mb-2.5 text-foreground/95 scroll-mt-24">
            {children}
          </h4>
        ),
        h4: ({ children }) => (
          <h5 className="font-display font-semibold text-base mt-5 mb-2 text-foreground/90 scroll-mt-24">
            {children}
          </h5>
        ),
        h5: ({ children }) => (
          <h6 className="font-medium text-sm mt-4 mb-1.5 text-foreground/85 scroll-mt-24 uppercase tracking-wide">
            {children}
          </h6>
        ),
        p: ({ children }) => (
          <p className="text-[0.95rem] text-foreground/85 leading-[1.75] mb-4 text-justify">
            {children}
          </p>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
        ul: ({ children }) => (
          <ul className="list-disc list-outside ml-6 space-y-2 mb-4 text-foreground/85 text-[0.95rem] leading-relaxed">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside ml-6 space-y-2 mb-4 text-foreground/85 text-[0.95rem] leading-relaxed">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
        table: ({ children }) => (
          <div className="my-5 overflow-x-auto rounded-lg border border-border shadow-sm">
            <table className="w-full text-xs border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-primary/10 text-foreground font-semibold border-b-2 border-primary/30">
            {children}
          </thead>
        ),
        tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
        tr: ({ children }) => (
          <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-xs text-foreground/85 align-top">{children}</td>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/50 pl-4 my-4 text-foreground/75 italic bg-primary/5 py-2 rounded-r">
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isInline = !className
          if (isInline) {
            return (
              <code className="bg-muted px-1.5 py-0.5 rounded text-[0.85em] font-mono text-primary">
                {children}
              </code>
            )
          }
          return (
            <code className="block bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto my-3">
              {children}
            </code>
          )
        },
        hr: () => <hr className="my-8 border-border" />,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

/* ──────────────────── TOC sidebar ──────────────────── */
function TOCSidebar({
  activeChapter,
  onSelect,
}: {
  activeChapter: number | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="space-y-1">
      <button
        onClick={() => onSelect('english-abstract')}
        className="block w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        English Abstract
      </button>
      <button
        onClick={() => onSelect('persian-abstract')}
        className="block w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        Persian Abstract
      </button>
      <button
        onClick={() => onSelect('abbreviations')}
        className="block w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        Abbreviations
      </button>
      <div className="border-t border-border my-2" />
      {CHAPTERS.map((ch) => (
        <button
          key={ch.num}
          onClick={() => onSelect(`chapter-${ch.num}`)}
          className={cn(
            'block w-full text-left text-xs px-2 py-1.5 rounded transition-colors',
            activeChapter === ch.num
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <span className="mr-1">{ch.icon}</span> Ch. {ch.num}: {ch.title}
        </button>
      ))}
      <div className="border-t border-border my-2" />
      <button
        onClick={() => onSelect('references')}
        className="block w-full text-left text-xs px-2 py-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        References
      </button>
    </div>
  )
}

/* ──────────────────── Chapter section (on-screen) ──────────────────── */
function ChapterSection({ chapter, data }: { chapter: ChapterInfo; data: ThesisData }) {
  const [expanded, setExpanded] = useState(false)
  const raw = data[chapter.key] as string
  const content = normaliseChapterMarkdown(raw, chapter.num)
  const wc = wordCount(content)
  const sections = countSections(content)

  return (
    <section id={`chapter-${chapter.num}`} className="scroll-mt-24">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 rounded-lg border bg-card px-5 py-4 hover:border-primary/40 hover:shadow-sm transition-all group"
      >
        <span className="text-2xl">{chapter.icon}</span>
        <div className="text-left flex-1 min-w-0">
          <h2 className="font-display font-semibold text-lg tracking-tight">
            Chapter {chapter.num}: {chapter.title}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {wc.toLocaleString()} words • {sections} sections
          </p>
        </div>
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="rounded-b-lg border border-t-0 bg-card px-6 py-7 sm:px-10 sm:py-9 text-sm leading-relaxed">
              <article className="thesis-prose max-w-3xl mx-auto">
                <MarkdownContent content={content} />
              </article>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════
 *                            PDF EXPORT
 * ════════════════════════════════════════════════════════════════════════
 * Self-contained MUMS dissertation PDF generator using jsPDF + autotable +
 * html2canvas for Persian (RTL) text.
 *
 * Layout:
 *   1. Cover page (unnumbered) — MUMS logo top, Medical Informatics + Royan
 *      logos below, university/faculty/department, title, author, supervisors.
 *   2. Bismillah page (unnumbered).
 *   3. Roman-numeral front matter: TOC, List of Tables, List of Figures,
 *      English Abstract, Persian Abstract, Abbreviations.
 *   4. Arabic-numbered body: Chapters 1-5, References.
 * ──────────────────────────────────────────────────────────────────────── */

const PERSIAN_PLACEHOLDER = `چکیده

(چکیده فارسی در داده‌های ورودی موجود نیست. لطفاً متن چکیده فارسی پایان‌نامه را در فایل JSON قرار دهید.)`

interface SectionStart {
  label: string
  page: number
  level: number // 0=major, 1=sub
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = src
  })
}

function imageToDataURL(img: HTMLImageElement, format: 'JPEG' | 'PNG' = 'PNG'): string {
  const MAX_DIM = 2500
  let w = img.naturalWidth
  let h = img.naturalHeight
  if (w > MAX_DIM || h > MAX_DIM) {
    const scale = Math.min(MAX_DIM / w, MAX_DIM / h)
    w = Math.round(w * scale)
    h = Math.round(h * scale)
  }
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL(`image/${format.toLowerCase()}`, 0.92)
}

function toRoman(n: number): string {
  const romans: [number, string][] = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'],
    [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'],
    [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i'],
  ]
  let out = ''
  for (const [v, s] of romans) {
    while (n >= v) {
      out += s
      n -= v
    }
  }
  return out
}

/**
 * Render a Persian/Arabic text block as a transparent canvas image via
 * the browser's native RTL handling, so we can embed it in the PDF.
 */
async function renderRtlBlockAsImage(
  html2canvas: any,
  text: string,
  widthPx = 1400,
  fontSize = 22,
  isHeading = false
): Promise<{ dataUrl: string; widthPx: number; heightPx: number } | null> {
  const div = document.createElement('div')
  div.style.cssText = `
    position: fixed; left: -99999px; top: 0;
    width: ${widthPx}px; padding: 24px;
    font-family: 'Vazirmatn', 'Vazir', 'Tahoma', 'Iranian Sans', 'Arial', sans-serif;
    font-size: ${fontSize}px; line-height: ${isHeading ? 1.4 : 2.0};
    direction: rtl; text-align: ${isHeading ? 'center' : 'justify'};
    background: white; color: #111;
    font-weight: ${isHeading ? 700 : 400};
  `
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  div.innerHTML = escaped
    .split(/\n\n+/)
    .map((p) => `<p style="margin: 0 0 ${isHeading ? 0 : 14}px 0;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')

  document.body.appendChild(div)
  try {
    const canvas = await html2canvas(div, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
    })
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
    return { dataUrl, widthPx: canvas.width, heightPx: canvas.height }
  } catch (e) {
    console.error('RTL render failed', e)
    return null
  } finally {
    document.body.removeChild(div)
  }
}

/* Tokenise inline markdown into bold/italic/normal runs */
type InlineRun = { text: string; bold: boolean; italic: boolean }
function tokeniseInline(s: string): InlineRun[] {
  const runs: InlineRun[] = []
  // Order matters: handle bold first, then italic, then plain.
  // Use a simple state machine over the regex captures.
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(`([^`]+)`)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) {
      runs.push({ text: s.slice(last, m.index), bold: false, italic: false })
    }
    if (m[2] !== undefined) {
      runs.push({ text: m[2], bold: true, italic: false })
    } else if (m[4] !== undefined) {
      runs.push({ text: m[4], bold: false, italic: true })
    } else if (m[6] !== undefined) {
      runs.push({ text: m[6], bold: false, italic: true })
    } else if (m[8] !== undefined) {
      runs.push({ text: m[8], bold: false, italic: false })
    }
    last = re.lastIndex
  }
  if (last < s.length) {
    runs.push({ text: s.slice(last), bold: false, italic: false })
  }
  if (runs.length === 0) runs.push({ text: s, bold: false, italic: false })
  return runs
}

/* Sanitise text so it's safe for jsPDF's WinAnsi encoding */
function sanitiseForPdf(s: string): string {
  return s
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u2009\u200A\u200B\u200C\u200D\uFEFF]/g, '')
    .replace(/[\u00B1]/g, '+/-')
    .replace(/[\u00D7]/g, 'x')
    .replace(/[\u00F7]/g, '/')
    .replace(/[\u00B0]/g, ' deg ')
    .replace(/[\u2264]/g, '<=')
    .replace(/[\u2265]/g, '>=')
    .replace(/[\u2260]/g, '!=')
    .replace(/[\u2248]/g, '~=')
    .replace(/[\u00B5]/g, 'u')
    .replace(/[\u03B1]/g, 'alpha')
    .replace(/[\u03B2]/g, 'beta')
    .replace(/[\u03BB]/g, 'lambda')
    .replace(/[\u03C7]/g, 'chi')
    .replace(/[\u00B2]/g, '^2')
    .replace(/[\u00B3]/g, '^3')
    // Strip any remaining non-Latin-1 characters
    .replace(/[^\x00-\xFF]/g, '')
}

interface PdfContext {
  doc: any
  pageW: number
  pageH: number
  margin: { top: number; bottom: number; left: number; right: number }
  contentW: number
  cursorY: number
  pageNumberMap: Map<number, { type: 'roman' | 'arabic' | 'none'; n: number }>
  sectionStarts: SectionStart[]
  bodyFontSize: number
  lineHeight: number
}

function newPage(ctx: PdfContext, type: 'roman' | 'arabic' | 'none') {
  ctx.doc.addPage()
  ctx.cursorY = ctx.margin.top
  const pageIdx = ctx.doc.getNumberOfPages()
  // n is assigned later when we finalise numbering
  ctx.pageNumberMap.set(pageIdx, { type, n: 0 })
}

function ensureSpace(ctx: PdfContext, needed: number) {
  if (ctx.cursorY + needed > ctx.pageH - ctx.margin.bottom) {
    const current = ctx.pageNumberMap.get(ctx.doc.getNumberOfPages())
    newPage(ctx, current?.type ?? 'arabic')
  }
}

/* Draw a wrapped paragraph with inline bold/italic runs */
function drawParagraph(
  ctx: PdfContext,
  text: string,
  opts: { fontSize?: number; bold?: boolean; italic?: boolean; align?: 'left' | 'justify' | 'center'; indent?: number; spacingAfter?: number } = {}
) {
  const { doc, pageW, margin, contentW } = ctx
  const fontSize = opts.fontSize ?? ctx.bodyFontSize
  const lh = fontSize * ctx.lineHeight
  const indent = opts.indent ?? 0
  const align = opts.align ?? 'justify'
  const sanitised = sanitiseForPdf(text)
  const runs = tokeniseInline(sanitised)

  // Build a flat list of words with their formatting
  type Word = { text: string; bold: boolean; italic: boolean; isSpace: boolean }
  const words: Word[] = []
  for (const r of runs) {
    const bold = r.bold || !!opts.bold
    const italic = r.italic || !!opts.italic
    const parts = r.text.split(/(\s+)/)
    for (const p of parts) {
      if (!p) continue
      if (/^\s+$/.test(p)) {
        words.push({ text: ' ', bold, italic, isSpace: true })
      } else {
        words.push({ text: p, bold, italic, isSpace: false })
      }
    }
  }

  // Wrap words into lines
  const maxLineW = contentW - indent
  const setFontFor = (w: Word) => {
    const style = w.bold && w.italic ? 'bolditalic' : w.bold ? 'bold' : w.italic ? 'italic' : 'normal'
    doc.setFont('times', style)
    doc.setFontSize(fontSize)
  }

  const measure = (w: Word) => {
    setFontFor(w)
    return doc.getTextWidth(w.text)
  }

  type Line = { words: Word[]; widths: number[]; totalW: number; spaceCount: number }
  const lines: Line[] = []
  let cur: Line = { words: [], widths: [], totalW: 0, spaceCount: 0 }

  for (const w of words) {
    const wW = measure(w)
    // Trim leading spaces on a fresh line
    if (cur.words.length === 0 && w.isSpace) continue
    if (cur.totalW + wW <= maxLineW) {
      cur.words.push(w)
      cur.widths.push(wW)
      cur.totalW += wW
      if (w.isSpace) cur.spaceCount += 1
    } else {
      // push the current line and start a new one
      // strip trailing space
      while (cur.words.length && cur.words[cur.words.length - 1].isSpace) {
        cur.totalW -= cur.widths.pop()!
        cur.words.pop()
        cur.spaceCount -= 1
      }
      lines.push(cur)
      cur = { words: [], widths: [], totalW: 0, spaceCount: 0 }
      if (!w.isSpace) {
        cur.words.push(w)
        cur.widths.push(wW)
        cur.totalW = wW
      }
    }
  }
  // trailing line
  while (cur.words.length && cur.words[cur.words.length - 1].isSpace) {
    cur.totalW -= cur.widths.pop()!
    cur.words.pop()
    cur.spaceCount -= 1
  }
  if (cur.words.length) lines.push(cur)

  // Render lines
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]
    const isLast = li === lines.length - 1
    ensureSpace(ctx, lh)
    let x = margin.left + indent
    let extraSpace = 0
    if (align === 'justify' && !isLast && line.spaceCount > 0 && line.totalW < maxLineW) {
      extraSpace = (maxLineW - line.totalW) / line.spaceCount
      // Don't over-stretch
      if (extraSpace > fontSize * 0.6) extraSpace = 0
    }
    if (align === 'center') {
      x = margin.left + (contentW - line.totalW) / 2
    }
    const baselineY = ctx.cursorY + fontSize * 0.85
    for (let wi = 0; wi < line.words.length; wi++) {
      const w = line.words[wi]
      setFontFor(w)
      doc.text(w.text, x, baselineY)
      x += line.widths[wi]
      if (w.isSpace) x += extraSpace
    }
    ctx.cursorY += lh
  }
  if (opts.spacingAfter !== undefined) ctx.cursorY += opts.spacingAfter
}

function drawHeading(
  ctx: PdfContext,
  text: string,
  level: number, // 1..5
  opts: { recordTOC?: boolean; tocLabel?: string } = {}
) {
  const sizes = { 1: 20, 2: 16, 3: 13.5, 4: 12, 5: 11 } as Record<number, number>
  const spacingBefore = { 1: 24, 2: 18, 3: 14, 4: 10, 5: 8 } as Record<number, number>
  const spacingAfter = { 1: 14, 2: 10, 3: 8, 4: 6, 5: 5 } as Record<number, number>
  const fontSize = sizes[level] ?? 11
  // Level-1 starts a new page
  if (level === 1) {
    if (ctx.cursorY > ctx.margin.top + 1) {
      newPage(ctx, ctx.pageNumberMap.get(ctx.doc.getNumberOfPages())!.type)
    }
  } else {
    // For other headings, leave breathing room and keep some content on page
    ensureSpace(ctx, fontSize * 2.2 + spacingBefore[level])
    ctx.cursorY += spacingBefore[level]
  }

  if (opts.recordTOC) {
    ctx.sectionStarts.push({
      label: opts.tocLabel ?? text,
      page: ctx.doc.getNumberOfPages(),
      level: level === 1 ? 0 : level - 1,
    })
  }

  drawParagraph(ctx, text, {
    fontSize,
    bold: true,
    align: level === 1 ? 'center' : 'left',
    spacingAfter: spacingAfter[level],
  })
}

function drawHorizontalRule(ctx: PdfContext, opts: { spacing?: number } = {}) {
  const spacing = opts.spacing ?? 6
  ensureSpace(ctx, spacing * 2 + 1)
  ctx.cursorY += spacing
  ctx.doc.setDrawColor(180)
  ctx.doc.setLineWidth(0.5)
  ctx.doc.line(ctx.margin.left, ctx.cursorY, ctx.pageW - ctx.margin.right, ctx.cursorY)
  ctx.cursorY += spacing
}

/* Parse a markdown table from successive pipe lines. Returns rows. */
function parseMarkdownTable(lines: string[]): { head: string[]; body: string[][] } {
  // lines[0] is header, lines[1] is separator, rest are body
  const split = (l: string) => {
    let s = l.trim()
    if (s.startsWith('|')) s = s.slice(1)
    if (s.endsWith('|')) s = s.slice(0, -1)
    return s.split('|').map((c) => c.trim())
  }
  const head = split(lines[0])
  const body: string[][] = []
  for (let i = 2; i < lines.length; i++) {
    body.push(split(lines[i]))
  }
  return { head, body }
}

/**
 * Render an embedded figure with a MUMS-style caption underneath.
 *   - 2 blank lines of vertical padding above and below the figure block
 *   - figure centred horizontally, scaled to fit content width and ≤ 60 % page H
 *   - caption italic, centred, 2 pt smaller than body text, bold "Figure C-N:" label
 *   - if not enough space remains on the current page, the whole block is moved
 *     onto a new page so the figure and its caption are never split
 */
function drawFigure(
  ctx: PdfContext,
  img: HTMLImageElement | null,
  figNum: string,
  caption: string
) {
  const captionFontSize = Math.max(8, ctx.bodyFontSize - 2)
  const captionLineH = captionFontSize * 1.35
  const padBefore = ctx.bodyFontSize * ctx.lineHeight * 2 // ~2 blank lines
  const padAfter = ctx.bodyFontSize * ctx.lineHeight * 2

  // Compute layout
  const maxImgW = ctx.contentW
  const maxImgH = (ctx.pageH - ctx.margin.top - ctx.margin.bottom) * 0.6

  let drawW = maxImgW
  let drawH = maxImgH

  if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
    const aspect = img.naturalWidth / img.naturalHeight
    // Fit width first
    drawW = maxImgW
    drawH = drawW / aspect
    if (drawH > maxImgH) {
      drawH = maxImgH
      drawW = drawH * aspect
    }
  } else {
    // Placeholder if image failed to load
    drawW = Math.min(maxImgW, 360)
    drawH = 220
  }

  // Estimate caption block height (wrap conservatively)
  ctx.doc.setFont('times', 'italic')
  ctx.doc.setFontSize(captionFontSize)
  const captionFull = sanitiseForPdf(`Figure ${figNum}: ${caption}`)
  const captionLines = ctx.doc.splitTextToSize(captionFull, ctx.contentW)
  const captionH = captionLines.length * captionLineH

  const blockH = padBefore + drawH + 6 + captionH + padAfter

  // Move to next page if no room
  const usable = ctx.pageH - ctx.margin.bottom - ctx.cursorY
  if (blockH > usable && drawH + captionH + 12 < ctx.pageH - ctx.margin.top - ctx.margin.bottom) {
    const current = ctx.pageNumberMap.get(ctx.doc.getNumberOfPages())
    newPage(ctx, current?.type ?? 'arabic')
  } else {
    // Insert blank-line padding above
    ctx.cursorY += padBefore
  }

  // Centre horizontally
  const x = ctx.margin.left + (ctx.contentW - drawW) / 2

  if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
    try {
      const dataUrl = imageToDataURL(img, 'PNG')
      ctx.doc.addImage(dataUrl, 'PNG', x, ctx.cursorY, drawW, drawH)
    } catch {
      // Fallback box if PNG conversion fails
      ctx.doc.setDrawColor(180)
      ctx.doc.setLineWidth(0.4)
      ctx.doc.rect(x, ctx.cursorY, drawW, drawH)
    }
  } else {
    // Placeholder rectangle
    ctx.doc.setDrawColor(180)
    ctx.doc.setFillColor(245, 245, 245)
    ctx.doc.rect(x, ctx.cursorY, drawW, drawH, 'FD')
    ctx.doc.setTextColor(140)
    ctx.doc.setFont('times', 'italic')
    ctx.doc.setFontSize(captionFontSize)
    ctx.doc.text(
      '[Figure not available]',
      ctx.margin.left + ctx.contentW / 2,
      ctx.cursorY + drawH / 2,
      { align: 'center' }
    )
    ctx.doc.setTextColor(0)
  }
  ctx.cursorY += drawH + 6

  // Caption below
  ctx.doc.setFont('times', 'italic')
  ctx.doc.setFontSize(captionFontSize)
  ctx.doc.setTextColor(50)
  for (let li = 0; li < captionLines.length; li++) {
    const ln = captionLines[li]
    if (li === 0) {
      // Bold "Figure C-N:" prefix, italic for rest of caption
      const prefix = `Figure ${figNum}: `
      const prefixW = ctx.doc.getTextWidth(prefix)
      const restW = ctx.doc.getTextWidth(ln.slice(prefix.length))
      const total = prefixW + restW
      const startX = ctx.margin.left + (ctx.contentW - total) / 2
      ctx.doc.setFont('times', 'bold')
      ctx.doc.text(prefix, startX, ctx.cursorY + captionFontSize * 0.85)
      ctx.doc.setFont('times', 'italic')
      ctx.doc.text(
        ln.slice(prefix.length),
        startX + prefixW,
        ctx.cursorY + captionFontSize * 0.85
      )
    } else {
      ctx.doc.text(ln, ctx.margin.left + ctx.contentW / 2, ctx.cursorY + captionFontSize * 0.85, {
        align: 'center',
      })
    }
    ctx.cursorY += captionLineH
  }
  ctx.doc.setTextColor(0)

  // Trailing padding
  ctx.cursorY += padAfter
}

function drawTable(
  ctx: PdfContext,
  autoTable: any,
  head: string[],
  body: string[][],
  caption?: string
) {
  if (caption) {
    ensureSpace(ctx, 30)
    drawParagraph(ctx, caption, {
      fontSize: 10.5,
      bold: true,
      align: 'center',
      spacingAfter: 4,
    })
  }
  // Sanitise cells
  const cleanCell = (c: string) => {
    // Strip ** markers from cells but keep their boldness implicit
    return sanitiseForPdf(c.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1'))
  }
  const headRow = head.map(cleanCell)
  const bodyRows = body.map((r) => r.map(cleanCell))

  autoTable(ctx.doc, {
    startY: ctx.cursorY,
    head: [headRow],
    body: bodyRows,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 9,
      cellPadding: 4,
      lineColor: [120, 120, 120],
      lineWidth: 0.4,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [220, 230, 240],
      textColor: 30,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      textColor: 40,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: ctx.margin.left, right: ctx.margin.right },
    didDrawPage: (data: any) => {
      // ensure page entries exist for any new pages added by autoTable
      const pageIdx = ctx.doc.getNumberOfPages()
      if (!ctx.pageNumberMap.has(pageIdx)) {
        const current = ctx.pageNumberMap.get(pageIdx - 1)
        ctx.pageNumberMap.set(pageIdx, { type: current?.type ?? 'arabic', n: 0 })
      }
      ctx.cursorY = data.cursor.y
    },
  })
  // After autoTable, sync cursor
  const lastTable = (ctx.doc as any).lastAutoTable
  if (lastTable && typeof lastTable.finalY === 'number') {
    ctx.cursorY = lastTable.finalY + 10
  }
}

function isTableLine(l: string): boolean {
  const t = l.trim()
  return t.startsWith('|') && t.endsWith('|')
}

function isTableSeparator(l: string): boolean {
  const t = l.trim()
  return /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(t)
}

/**
 * Render a single chapter (or any markdown block) into the PDF.
 * Returns nothing — mutates the context.
 */
function renderMarkdownBlock(
  ctx: PdfContext,
  autoTable: any,
  rawText: string,
  options: {
    sectionPrefix?: string
    recordSections?: boolean
    figureImages?: Map<string, HTMLImageElement | null>
  } = {}
) {
  const lines = rawText.split('\n')
  let i = 0
  let pendingCaption: string | undefined

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip blank lines (paragraph separators are handled by spacingAfter)
    if (trimmed === '') {
      i += 1
      continue
    }

    // Embedded figure marker: [[FIG:figNum|src|caption]]
    const figMatch = /^\[\[FIG:([^|]+)\|([^|]+)\|(.+)\]\]$/.exec(trimmed)
    if (figMatch) {
      const figNum = figMatch[1]
      const caption = figMatch[3]
      const img = options.figureImages?.get(figNum) ?? null
      drawFigure(ctx, img, figNum, caption)
      i += 1
      continue
    }

    // Markdown table
    if (isTableLine(line)) {
      const tableBlock: string[] = [line]
      let j = i + 1
      while (j < lines.length && (isTableLine(lines[j]) || isTableSeparator(lines[j]))) {
        tableBlock.push(lines[j])
        j += 1
      }
      if (tableBlock.length >= 2 && isTableSeparator(tableBlock[1])) {
        const { head, body } = parseMarkdownTable(tableBlock)
        drawTable(ctx, autoTable, head, body, pendingCaption)
        pendingCaption = undefined
        i = j
        continue
      }
    }

    // Heading detection
    const hMatch = /^(#{1,6})\s+(.+)$/.exec(trimmed)
    if (hMatch) {
      const level = Math.min(hMatch[1].length, 5)
      const title = hMatch[2].trim()
      drawHeading(ctx, title, level, {
        recordTOC: !!options.recordSections,
        tocLabel: title,
      })
      i += 1
      continue
    }

    // Plain numbered heading (legacy chapter 1/2 style)
    if (/^\d+\.\d+\.\d+\.\d+\s+\S/.test(trimmed)) {
      drawHeading(ctx, trimmed, 5, {
        recordTOC: !!options.recordSections,
      })
      i += 1
      continue
    }
    if (/^\d+\.\d+\.\d+\s+\S/.test(trimmed)) {
      drawHeading(ctx, trimmed, 4, {
        recordTOC: !!options.recordSections,
      })
      i += 1
      continue
    }
    if (/^\d+\.\d+\s+\S/.test(trimmed)) {
      drawHeading(ctx, trimmed, 3, {
        recordTOC: !!options.recordSections,
      })
      i += 1
      continue
    }

    // Standalone bold Table caption: **Table 4-1: ...**
    const captionMatch = /^\*\*(Table|Figure)\s+(\d+-\d+)\s*[:.]\s*([^*]+)\*\*$/.exec(trimmed)
    if (captionMatch) {
      pendingCaption = `${captionMatch[1]} ${captionMatch[2]}: ${captionMatch[3].trim()}`
      i += 1
      continue
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''))
        i += 1
      }
      const joined = quoteLines.join(' ')
      ensureSpace(ctx, ctx.bodyFontSize * 2)
      // Left vertical line
      const startY = ctx.cursorY
      drawParagraph(ctx, joined, {
        italic: true,
        indent: 14,
        align: 'justify',
        spacingAfter: 8,
      })
      ctx.doc.setDrawColor(120, 160, 200)
      ctx.doc.setLineWidth(2)
      ctx.doc.line(ctx.margin.left + 2, startY, ctx.margin.left + 2, ctx.cursorY - 8)
      ctx.doc.setDrawColor(0)
      ctx.doc.setLineWidth(0.2)
      continue
    }

    // Lists
    const ulMatch = /^[-*]\s+(.+)$/.exec(trimmed)
    const olMatch = /^(\d+)\.\s+(.+)$/.exec(trimmed)
    if (ulMatch || olMatch) {
      // Group consecutive list items
      const items: { marker: string; text: string }[] = []
      const isOrdered = !!olMatch
      let n = 1
      while (i < lines.length) {
        const t = lines[i].trim()
        if (!t) { i += 1; break }
        const u = /^[-*]\s+(.+)$/.exec(t)
        const o = /^(\d+)\.\s+(.+)$/.exec(t)
        if (isOrdered && o) {
          items.push({ marker: `${o[1]}.`, text: o[2] })
          n += 1
          i += 1
        } else if (!isOrdered && u) {
          items.push({ marker: '•', text: u[1] })
          i += 1
        } else {
          break
        }
      }
      for (const it of items) {
        ensureSpace(ctx, ctx.bodyFontSize * ctx.lineHeight)
        ctx.doc.setFont('times', 'normal')
        ctx.doc.setFontSize(ctx.bodyFontSize)
        ctx.doc.text(
          it.marker,
          ctx.margin.left + 6,
          ctx.cursorY + ctx.bodyFontSize * 0.85
        )
        drawParagraph(ctx, it.text, {
          indent: 24,
          align: 'left',
          spacingAfter: 2,
        })
      }
      ctx.cursorY += 4
      continue
    }

    // Horizontal rule
    if (/^[-_*]{3,}$/.test(trimmed)) {
      drawHorizontalRule(ctx)
      i += 1
      continue
    }

    // Default: paragraph (may span multiple consecutive non-blank lines)
    const paraLines: string[] = [line]
    let j = i + 1
    while (j < lines.length) {
      const t = lines[j].trim()
      if (t === '') break
      if (/^#{1,6}\s/.test(t)) break
      if (/^\d+\.\d+(\.\d+)?(\.\d+)?\s/.test(t)) break
      if (isTableLine(lines[j])) break
      if (/^[-*]\s/.test(t) || /^\d+\.\s/.test(t)) break
      if (t.startsWith('>')) break
      paraLines.push(lines[j])
      j += 1
    }
    const paragraph = paraLines.join(' ')
    drawParagraph(ctx, paragraph, { align: 'justify', spacingAfter: 6 })
    i = j
  }
}

/* ──────────────── Master PDF generator ──────────────── */
async function generateThesisPDF(
  data: ThesisData,
  setProgress: (s: string) => void
): Promise<void> {
  setProgress('Loading PDF engine…')
  const jsPDFModule: any = await import('jspdf')
  const jsPDF = jsPDFModule.jsPDF ?? jsPDFModule.default
  const autoTableModule: any = await import('jspdf-autotable')
  const autoTable = autoTableModule.default ?? autoTableModule.autoTable
  const html2canvasModule: any = await import('html2canvas')
  const html2canvas = html2canvasModule.default ?? html2canvasModule

  setProgress('Loading university logos…')
  const [mumsImg, medImg, royanImg] = await Promise.all([
    loadImage('/mums_logo.jpeg').catch(() => null),
    loadImage('/medical_informatics_logo.png').catch(() => null),
    loadImage('/royan_logo.png').catch(() => null),
  ])

  setProgress('Loading figures…')
  const figureImages = new Map<string, HTMLImageElement | null>()
  await Promise.all(
    THESIS_FIGURES.map(async (f) => {
      try {
        const img = await loadImage(f.src)
        figureImages.set(f.figNum, img)
      } catch {
        figureImages.set(f.figNum, null)
      }
    })
  )

  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = { top: 72, bottom: 80, left: 72, right: 72 } // 1in margins

  const ctx: PdfContext = {
    doc,
    pageW,
    pageH,
    margin,
    contentW: pageW - margin.left - margin.right,
    cursorY: margin.top,
    pageNumberMap: new Map(),
    sectionStarts: [],
    bodyFontSize: 11,
    lineHeight: 1.45,
  }

  /* ── 1. COVER PAGE ───────────────────────────────────── */
  setProgress('Composing cover page…')
  doc.setProperties({
    title: 'PhD Thesis — Machine Learning Prediction of micro-TESE Outcomes',
    author: 'Hossein JamaliRad',
    subject: 'Mashhad University of Medical Sciences — PhD Dissertation',
    keywords: 'NOA, micro-TESE, machine learning, CatBoost, explainable AI',
  })

  ctx.pageNumberMap.set(1, { type: 'none', n: 0 }) // page 1 = cover

  // Decorative top border
  doc.setDrawColor(14, 116, 144)
  doc.setLineWidth(3)
  doc.line(margin.left, margin.top - 30, pageW - margin.right, margin.top - 30)
  doc.setLineWidth(0.5)
  doc.line(margin.left, margin.top - 22, pageW - margin.right, margin.top - 22)

  // MUMS logo (centred at top)
  let y = margin.top - 5
  if (mumsImg) {
    const targetH = 75
    const targetW = (mumsImg.naturalWidth / mumsImg.naturalHeight) * targetH
    doc.addImage(
      imageToDataURL(mumsImg, 'JPEG'),
      'JPEG',
      (pageW - targetW) / 2,
      y,
      targetW,
      targetH
    )
    y += targetH + 12
  } else {
    y += 12
  }

  // "In the name of God" small line
  doc.setFont('times', 'italic')
  doc.setFontSize(10)
  doc.setTextColor(90)
  doc.text('In the Name of God', pageW / 2, y, { align: 'center' })
  y += 16
  doc.setTextColor(0)

  // University name
  doc.setFont('times', 'bold')
  doc.setFontSize(20)
  doc.text('Mashhad University of Medical Sciences', pageW / 2, y, { align: 'center' })
  y += 24
  doc.setFont('times', 'normal')
  doc.setFontSize(13)
  doc.text('Faculty of Medicine', pageW / 2, y, { align: 'center' })
  y += 18
  doc.setFontSize(12)
  doc.text('Department of Medical Informatics', pageW / 2, y, { align: 'center' })
  y += 28

  // Thesis "label"
  doc.setFont('times', 'italic')
  doc.setFontSize(11)
  doc.setTextColor(80)
  doc.text(
    'A dissertation submitted in partial fulfilment of the requirements',
    pageW / 2,
    y,
    { align: 'center' }
  )
  y += 14
  doc.text(
    'for the degree of Doctor of Philosophy (Ph.D.) in Medical Informatics',
    pageW / 2,
    y,
    { align: 'center' }
  )
  y += 26
  doc.setTextColor(0)

  // Title — wrap intelligently
  doc.setFont('times', 'bold')
  doc.setFontSize(15)
  const titleLines = doc.splitTextToSize(
    sanitiseForPdf(
      'Machine Learning-Based Prediction of Microdissection Testicular Sperm Extraction Outcomes in Non-Obstructive Azoospermia: A Comprehensive Framework with Explainable AI and Clinical Decision Support'
    ),
    ctx.contentW - 20
  )
  for (const tl of titleLines) {
    doc.text(tl, pageW / 2, y, { align: 'center' })
    y += 19
  }
  y += 14

  // Decorative separator
  doc.setDrawColor(14, 116, 144)
  doc.setLineWidth(1.2)
  doc.line(pageW / 2 - 80, y, pageW / 2 + 80, y)
  doc.setLineWidth(0.2)
  y += 22

  // Author
  doc.setFont('times', 'italic')
  doc.setFontSize(11)
  doc.text('By', pageW / 2, y, { align: 'center' })
  y += 16
  doc.setFont('times', 'bold')
  doc.setFontSize(15)
  doc.text('Hossein JamaliRad', pageW / 2, y, { align: 'center' })
  y += 28

  // Supervisors (اساتید راهنما)
  doc.setFont('times', 'italic')
  doc.setFontSize(11)
  doc.text('Supervisors', pageW / 2, y, { align: 'center' })
  y += 14
  doc.setFont('times', 'bold')
  doc.setFontSize(11.5)
  doc.text('Dr. Hassan Vakili Arki', pageW / 2, y, { align: 'center' })
  y += 14
  doc.text('Dr. Marjan Sabbaghian', pageW / 2, y, { align: 'center' })
  y += 14
  doc.text('Dr. Saeid Eslami', pageW / 2, y, { align: 'center' })
  y += 22

  // Advisor (استاد مشاور)
  doc.setFont('times', 'italic')
  doc.setFontSize(11)
  doc.text('Advisor', pageW / 2, y, { align: 'center' })
  y += 14
  doc.setFont('times', 'bold')
  doc.setFontSize(11.5)
  doc.text('Dr. Mohammad Ali Sadighi Gilani', pageW / 2, y, { align: 'center' })
  y += 24

  // Partner institutions: Medical Informatics + Royan logos side by side at bottom
  const bottomY = pageH - margin.bottom - 95
  const logoH = 60
  const gap = 60
  let totalLogosW = gap
  let medW = 0, royanW = 0
  if (medImg) {
    medW = (medImg.naturalWidth / medImg.naturalHeight) * logoH
    totalLogosW += medW
  }
  if (royanImg) {
    royanW = (royanImg.naturalWidth / royanImg.naturalHeight) * logoH
    totalLogosW += royanW
  }
  let lx = (pageW - totalLogosW) / 2
  if (medImg) {
    doc.addImage(imageToDataURL(medImg, 'PNG'), 'PNG', lx, bottomY, medW, logoH)
    lx += medW + gap
  }
  if (royanImg) {
    doc.addImage(imageToDataURL(royanImg, 'PNG'), 'PNG', lx, bottomY, royanW, logoH)
  }

  // Captions under logos
  doc.setFont('times', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80)
  if (medImg) {
    doc.text(
      'Department of Medical Informatics',
      (pageW - totalLogosW) / 2 + medW / 2,
      bottomY + logoH + 12,
      { align: 'center' }
    )
  }
  if (royanImg) {
    const royanCenter = (pageW - totalLogosW) / 2 + (medImg ? medW + gap : 0) + royanW / 2
    doc.text('Royan Institute', royanCenter, bottomY + logoH + 12, { align: 'center' })
  }
  doc.setTextColor(0)

  // Year at very bottom
  doc.setFont('times', 'bold')
  doc.setFontSize(11)
  const year = new Date().getFullYear()
  doc.text(`${year}`, pageW / 2, pageH - margin.bottom + 20, { align: 'center' })

  // Decorative bottom border
  doc.setDrawColor(14, 116, 144)
  doc.setLineWidth(0.5)
  doc.line(margin.left, pageH - margin.bottom + 32, pageW - margin.right, pageH - margin.bottom + 32)
  doc.setLineWidth(3)
  doc.line(margin.left, pageH - margin.bottom + 40, pageW - margin.right, pageH - margin.bottom + 40)
  doc.setDrawColor(0)
  doc.setLineWidth(0.2)

  /* ── 2. BISMILLAH PAGE ───────────────────────────────── */
  setProgress('Adding Bismillah page…')
  doc.addPage()
  ctx.pageNumberMap.set(doc.getNumberOfPages(), { type: 'none', n: 0 })
  ctx.cursorY = margin.top

  // Render Bismillah as RTL image (Arabic font handled by browser)
  const bismillah = await renderRtlBlockAsImage(
    html2canvas,
    'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    900,
    52,
    true
  )
  const centerY = pageH / 2 - 60
  if (bismillah) {
    const targetW = 360
    const targetH = (bismillah.heightPx / bismillah.widthPx) * targetW
    doc.addImage(
      bismillah.dataUrl,
      'JPEG',
      (pageW - targetW) / 2,
      centerY,
      targetW,
      targetH
    )
    // English translation underneath
    doc.setFont('times', 'italic')
    doc.setFontSize(11)
    doc.setTextColor(90)
    doc.text(
      'In the Name of God, the Most Gracious, the Most Merciful',
      pageW / 2,
      centerY + targetH + 24,
      { align: 'center' }
    )
    doc.setTextColor(0)
  } else {
    doc.setFont('times', 'italic')
    doc.setFontSize(14)
    doc.text(
      'In the Name of God, the Most Gracious, the Most Merciful',
      pageW / 2,
      centerY,
      { align: 'center' }
    )
  }

  /* ── 3. TOC PLACEHOLDER (reserve pages, fill at end) ─── */
  setProgress('Reserving Table of Contents pages…')
  // Reserve a generous upper-bound; surplus pages are deleted after rendering
  // based on the actual TOC line count.
  const TOC_RESERVED = 4
  const tocStartPage = doc.getNumberOfPages() + 1
  for (let p = 0; p < TOC_RESERVED; p++) {
    doc.addPage()
    ctx.pageNumberMap.set(doc.getNumberOfPages(), { type: 'roman', n: 0 })
  }

  /* ── 4. LIST OF TABLES ───────────────────────────────── */
  setProgress('Adding List of Tables…')
  newPage(ctx, 'roman')
  ctx.sectionStarts.push({ label: 'List of Tables', page: doc.getNumberOfPages(), level: 0 })
  drawHeading(ctx, 'List of Tables', 1)
  if (data.list_of_tables && data.list_of_tables.length > 0) {
    for (const t of data.list_of_tables) {
      drawParagraph(ctx, t, { fontSize: 10.5, align: 'left', spacingAfter: 4 })
    }
  } else {
    drawParagraph(ctx, '(No tables listed.)', { italic: true })
  }

  /* ── 5. LIST OF FIGURES ──────────────────────────────── */
  setProgress('Adding List of Figures…')
  ctx.sectionStarts.push({ label: 'List of Figures', page: doc.getNumberOfPages() + 1, level: 0 })
  drawHeading(ctx, 'List of Figures', 1)
  if (THESIS_FIGURES.length > 0) {
    for (const f of THESIS_FIGURES) {
      // Take only the first sentence of the caption for the list of figures
      const shortCaption = f.caption.split(/(?<=[.!?])\s+/)[0]
      drawParagraph(ctx, `Figure ${f.figNum}: ${shortCaption}`, {
        fontSize: 10.5,
        align: 'left',
        spacingAfter: 4,
      })
    }
  } else {
    drawParagraph(ctx, '(No figures listed.)', { italic: true })
  }

  /* ── 6. ABSTRACT (English) ───────────────────────────── */
  setProgress('Adding English abstract…')
  ctx.sectionStarts.push({ label: 'Abstract (English)', page: doc.getNumberOfPages() + 1, level: 0 })
  drawHeading(ctx, 'Abstract', 1)
  renderMarkdownBlock(ctx, autoTable, data.english_abstract)

  /* ── 7. ABSTRACT (Persian, RTL) ──────────────────────── */
  setProgress('Rendering Persian abstract (RTL)…')
  ctx.sectionStarts.push({ label: 'Abstract (Persian)', page: doc.getNumberOfPages() + 1, level: 0 })
  newPage(ctx, 'roman')
  drawHeading(ctx, 'Persian Abstract / چکیده', 1)

  const persianSource = data.persian_abstract && data.persian_abstract.trim().length > 50
    ? data.persian_abstract
    : PERSIAN_PLACEHOLDER

  const persianImg = await renderRtlBlockAsImage(html2canvas, persianSource, 1400, 24, false)
  if (persianImg) {
    const maxImgW = ctx.contentW
    const maxImgH = pageH - margin.top - margin.bottom - 80
    const naturalW = maxImgW
    const naturalH = (persianImg.heightPx / persianImg.widthPx) * naturalW
    if (naturalH <= maxImgH) {
      ensureSpace(ctx, naturalH + 10)
      doc.addImage(
        persianImg.dataUrl,
        'JPEG',
        margin.left,
        ctx.cursorY,
        naturalW,
        naturalH
      )
      ctx.cursorY += naturalH + 8
    } else {
      // Split across pages
      const slicesH = Math.ceil(naturalH / maxImgH)
      const sliceHpx = persianImg.heightPx / slicesH
      for (let s = 0; s < slicesH; s++) {
        // Render slice on canvas
        const tmp = document.createElement('canvas')
        const slicePxH = Math.min(sliceHpx, persianImg.heightPx - s * sliceHpx)
        tmp.width = persianImg.widthPx
        tmp.height = slicePxH
        const tmpCtx = tmp.getContext('2d')!
        const fullImg = new Image()
        fullImg.src = persianImg.dataUrl
        await new Promise<void>((res) => (fullImg.onload = () => res()))
        tmpCtx.drawImage(
          fullImg,
          0,
          -s * sliceHpx,
          persianImg.widthPx,
          persianImg.heightPx
        )
        const sliceUrl = tmp.toDataURL('image/jpeg', 0.85)
        const sliceH = (slicePxH / persianImg.widthPx) * naturalW
        if (s > 0) newPage(ctx, 'roman')
        doc.addImage(sliceUrl, 'JPEG', margin.left, ctx.cursorY, naturalW, sliceH)
        ctx.cursorY += sliceH + 8
      }
    }
  } else {
    drawParagraph(ctx, '(Persian abstract rendering failed; please regenerate.)', {
      italic: true,
    })
  }

  /* ── 8. LIST OF ABBREVIATIONS ────────────────────────── */
  setProgress('Adding list of abbreviations…')
  ctx.sectionStarts.push({ label: 'List of Abbreviations', page: doc.getNumberOfPages() + 1, level: 0 })
  drawHeading(ctx, 'List of Abbreviations', 1)
  const abbrRows: string[][] = []
  for (const a of data.abbreviations) {
    if (typeof a === 'string') {
      abbrRows.push([a, ''])
    } else {
      abbrRows.push([a.abbreviation, a.full_form])
    }
  }
  autoTable(doc, {
    startY: ctx.cursorY,
    head: [['Abbreviation', 'Full Form']],
    body: abbrRows,
    theme: 'plain',
    styles: {
      font: 'times',
      fontSize: 10,
      cellPadding: 3,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [240, 244, 248],
      textColor: 30,
      fontStyle: 'bold',
      lineWidth: { bottom: 0.6 },
      lineColor: [120, 120, 120],
    },
    columnStyles: {
      0: { cellWidth: 110, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
    },
    margin: { left: margin.left, right: margin.right },
    didDrawPage: (data: any) => {
      const pageIdx = doc.getNumberOfPages()
      if (!ctx.pageNumberMap.has(pageIdx)) {
        const current = ctx.pageNumberMap.get(pageIdx - 1)
        ctx.pageNumberMap.set(pageIdx, { type: current?.type ?? 'roman', n: 0 })
      }
      ctx.cursorY = data.cursor.y
    },
  })
  if ((doc as any).lastAutoTable?.finalY) {
    ctx.cursorY = (doc as any).lastAutoTable.finalY + 10
  }

  /* ── 9. CHAPTERS 1-5 ─────────────────────────────────── */
  for (const ch of CHAPTERS) {
    setProgress(`Typesetting Chapter ${ch.num}: ${ch.title}…`)
    // Start new page with arabic numbering
    newPage(ctx, 'arabic')
    ctx.sectionStarts.push({
      label: `Chapter ${ch.num}: ${ch.title}`,
      page: doc.getNumberOfPages(),
      level: 0,
    })
    drawHeading(ctx, `Chapter ${ch.num}`, 1)
    ctx.cursorY += 8
    drawHeading(ctx, ch.title, 2)
    ctx.cursorY += 6
    const normalised = normaliseChapterMarkdown(data[ch.key] as string, ch.num, THESIS_FIGURES)
    // Strip the first heading we already drew if it matches (handles #, ##, ###…)
    const stripped = normalised.replace(
      new RegExp(`^#{1,6}\\s+Chapter\\s+${ch.num}\\s*:[^\\n]*\\n+`, 'i'),
      ''
    )
    renderMarkdownBlock(ctx, autoTable, stripped, { recordSections: true, figureImages })
  }

  /* ── 10. REFERENCES ──────────────────────────────────── */
  setProgress('Adding references…')
  newPage(ctx, 'arabic')
  ctx.sectionStarts.push({
    label: 'References',
    page: doc.getNumberOfPages(),
    level: 0,
  })
  drawHeading(ctx, 'References', 1)
  for (let r = 0; r < data.references.length; r++) {
    const ref = data.references[r]
    // Strip leading "1. " if present (we'll add our own number for uniformity)
    const cleaned = ref.replace(/^\d+\.\s+/, '')
    const numbered = `[${r + 1}]  ${cleaned}`
    drawParagraph(ctx, numbered, {
      fontSize: 10,
      align: 'justify',
      indent: 18,
      spacingAfter: 4,
    })
    // hanging indent: re-draw first marker by overlaying — but our drawParagraph
    // does not natively support hanging indent. We approximate by simply using
    // the indent as the line indent. Visually acceptable.
  }

  /* ── 11. PRE-COMPUTE TOC PAGES & CLEAN UP RESERVED RANGE ─ */
  setProgress('Calibrating Table of Contents…')

  // Filter sectionStarts entries that will appear in the TOC (level 0 & 1)
  const tocVisibleEntries = ctx.sectionStarts.filter(
    (s) => s.level === 0 || s.level === 1
  )

  // Layout constants for TOC (must match render below)
  const tocFontSize = 11
  const tocLineH = tocFontSize * 1.6
  const tocHeadingSpace = 40 // heading + spacing on first TOC page

  // Compute pages needed for the TOC given the visible entries
  const firstPageUsableH = pageH - margin.top - margin.bottom - tocHeadingSpace
  const otherPageUsableH = pageH - margin.top - margin.bottom
  const firstPageLines = Math.floor(firstPageUsableH / tocLineH)
  const otherPageLines = Math.floor(otherPageUsableH / tocLineH)

  let tocPagesNeeded = 1
  let remainingEntries = tocVisibleEntries.length - firstPageLines
  while (remainingEntries > 0) {
    tocPagesNeeded += 1
    remainingEntries -= otherPageLines
  }
  // Safety cap — at most TOC_RESERVED
  if (tocPagesNeeded > TOC_RESERVED) tocPagesNeeded = TOC_RESERVED

  const tocPagesToDelete = TOC_RESERVED - tocPagesNeeded

  if (tocPagesToDelete > 0) {
    // Delete the surplus reserved TOC pages (from the end of the reserved range,
    // in reverse order so indices remain stable).
    for (let i = TOC_RESERVED - 1; i >= tocPagesNeeded; i--) {
      doc.deletePage(tocStartPage + i)
    }

    // Re-build pageNumberMap with shifted page indices
    const oldMap = ctx.pageNumberMap
    const newMap = new Map<number, { type: 'none' | 'roman' | 'arabic'; n: number }>()
    for (const [oldPage, meta] of oldMap.entries()) {
      if (oldPage < tocStartPage + tocPagesNeeded) {
        // Before deleted range — index unchanged
        newMap.set(oldPage, { type: meta.type, n: 0 })
      } else if (oldPage >= tocStartPage + TOC_RESERVED) {
        // After deleted range — shift down by number of deleted pages
        newMap.set(oldPage - tocPagesToDelete, { type: meta.type, n: 0 })
      }
      // pages within deleted range are dropped
    }
    ctx.pageNumberMap = newMap

    // Shift sectionStarts entries similarly
    for (const s of ctx.sectionStarts) {
      if (s.page >= tocStartPage + TOC_RESERVED) {
        s.page -= tocPagesToDelete
      }
    }
  }

  // Now assign final roman/arabic numbers in document order
  let romanCount = 0
  let arabicCount = 0
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    const meta = ctx.pageNumberMap.get(p)
    if (!meta) continue
    if (meta.type === 'roman') {
      romanCount += 1
      meta.n = romanCount
    } else if (meta.type === 'arabic') {
      arabicCount += 1
      meta.n = arabicCount
    }
  }

  /* ── 12. RENDER TOC ──────────────────────────────────── */
  setProgress('Composing Table of Contents…')
  // Build TOC entries from sectionStarts; map each section page → display label
  const tocEntries = ctx.sectionStarts.map((s) => {
    const meta = ctx.pageNumberMap.get(s.page)
    let display = ''
    if (meta && meta.type === 'roman') display = toRoman(meta.n)
    else if (meta && meta.type === 'arabic') display = String(meta.n)
    return { ...s, display }
  })

  // Draw TOC onto the (now correctly-sized) reserved pages
  doc.setPage(tocStartPage)
  ctx.cursorY = margin.top
  // Heading
  doc.setFont('times', 'bold')
  doc.setFontSize(20)
  doc.text('Table of Contents', pageW / 2, ctx.cursorY + 14, { align: 'center' })
  ctx.cursorY += tocHeadingSpace

  let tocPagePtr = tocStartPage
  const tocLastPage = tocStartPage + tocPagesNeeded - 1

  const renderTocEntry = (label: string, pageDisp: string, level: number) => {
    if (ctx.cursorY + tocLineH > pageH - margin.bottom) {
      tocPagePtr += 1
      if (tocPagePtr > tocLastPage) {
        // Out of pages — silently drop overflow (we estimated carefully so this
        // should be rare). Re-cap to last reserved page to avoid jsPDF errors.
        tocPagePtr = tocLastPage
        return
      }
      doc.setPage(tocPagePtr)
      ctx.cursorY = margin.top
    }
    const indent = level * 18
    doc.setFont('times', level === 0 ? 'bold' : 'normal')
    doc.setFontSize(level === 0 ? tocFontSize : tocFontSize - 0.5)
    const labelClean = sanitiseForPdf(label)
    // Truncate if too long
    const maxLabelW = ctx.contentW - indent - 50
    let drawn = labelClean
    while (doc.getTextWidth(drawn) > maxLabelW && drawn.length > 4) {
      drawn = drawn.slice(0, -4) + '…'
    }
    const baselineY = ctx.cursorY + tocFontSize * 0.85
    doc.text(drawn, margin.left + indent, baselineY)
    // Dotted leader
    const labelW = doc.getTextWidth(drawn)
    const pageNumStr = pageDisp
    const pageNumW = doc.getTextWidth(pageNumStr)
    const dotsStartX = margin.left + indent + labelW + 6
    const dotsEndX = pageW - margin.right - pageNumW - 4
    if (dotsEndX > dotsStartX + 8) {
      doc.setFont('times', 'normal')
      const dots = '.'.repeat(Math.max(0, Math.floor((dotsEndX - dotsStartX) / 2.5)))
      doc.setTextColor(150)
      doc.text(dots, dotsStartX, baselineY)
      doc.setTextColor(0)
    }
    doc.setFont('times', level === 0 ? 'bold' : 'normal')
    doc.text(pageNumStr, pageW - margin.right - pageNumW, baselineY)
    ctx.cursorY += tocLineH
  }

  // Pre-defined front matter entries first
  // The TOC itself should list:
  //   - List of Tables (roman)
  //   - List of Figures (roman)
  //   - Abstract (English) (roman)
  //   - Abstract (Persian) (roman)
  //   - List of Abbreviations (roman)
  //   - Chapter 1 .. 5 (arabic)
  //   - References (arabic)
  // We pull all top-level entries (level=0) and only sub-entries from chapters.
  for (const e of tocEntries) {
    if (e.level === 0) {
      renderTocEntry(e.label, e.display, 0)
    } else if (e.level === 1) {
      renderTocEntry(e.label, e.display, 1)
    }
    // skip deeper levels in TOC to keep it focused
  }

  /* ── 13. ADD PAGE NUMBER FOOTERS ─────────────────────── */
  setProgress('Adding page-number footers…')
  for (let p = 1; p <= totalPages; p++) {
    const meta = ctx.pageNumberMap.get(p)
    if (!meta || meta.type === 'none' || meta.n === 0) continue
    doc.setPage(p)
    doc.setFont('times', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(80)
    const label =
      meta.type === 'roman' ? toRoman(meta.n) : String(meta.n)
    doc.text(label, pageW / 2, pageH - margin.bottom / 2 + 8, { align: 'center' })

    // Running header (very subtle) for arabic pages = thesis title abbreviated
    if (meta.type === 'arabic') {
      doc.setFontSize(8.5)
      doc.setTextColor(120)
      doc.text(
        'Machine Learning Prediction of micro-TESE Outcomes in NOA',
        pageW / 2,
        margin.top - 40,
        { align: 'center' }
      )
      doc.setDrawColor(200)
      doc.setLineWidth(0.3)
      doc.line(
        margin.left,
        margin.top - 35,
        pageW - margin.right,
        margin.top - 35
      )
    }
    doc.setTextColor(0)
  }

  setProgress('Saving PDF…')
  doc.save('JamaliRad_PhD_Thesis_MUMS.pdf')
}

/* ════════════════════════════════════════════════════════════════════════
 *                         MAIN ON-SCREEN COMPONENT
 * ════════════════════════════════════════════════════════════════════════ */
export default function ThesisClient({ data }: { data: ThesisData }) {
  const [showTOC, setShowTOC] = useState(true)
  const [activeChapter, setActiveChapter] = useState<number | null>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  const totalWords = [
    data.english_abstract,
    data.persian_abstract,
    data.chapter_1_introduction,
    data.chapter_2_literature_review,
    data.chapter_3_methods,
    data.chapter_4_results,
    data.chapter_5_discussion,
  ].reduce((sum, t) => sum + wordCount(t), 0)

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleExport = useCallback(async () => {
    if (exporting) return
    setExporting(true)
    try {
      await generateThesisPDF(data, setExportProgress)
    } catch (e) {
      console.error('PDF export failed:', e)
      // eslint-disable-next-line no-alert
      alert(`PDF export failed: ${(e as Error).message ?? e}`)
    } finally {
      setExporting(false)
      setExportProgress('')
    }
  }, [data, exporting])

  return (
    <div className="relative">
      {/* Stats / actions bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{totalWords.toLocaleString()}</span>
          <span className="text-muted-foreground">words</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">5</span>
          <span className="text-muted-foreground">chapters</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs">
          <List className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{data.references.length}</span>
          <span className="text-muted-foreground">references</span>
        </div>

        <div className="ml-auto flex gap-2 items-center">
          {exporting && (
            <span className="text-xs text-muted-foreground hidden sm:inline-block max-w-[260px] truncate">
              {exportProgress}
            </span>
          )}
          <button
            onClick={() => setShowTOC(!showTOC)}
            className="flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs hover:bg-accent transition-colors"
          >
            <List className="h-3.5 w-3.5" />
            {showTOC ? 'Hide' : 'Show'} TOC
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors',
              exporting
                ? 'bg-muted text-muted-foreground cursor-wait'
                : 'border bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {exporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            {exporting ? 'Generating PDF…' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* TOC Sidebar */}
        {showTOC && (
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                Table of Contents
              </p>
              <TOCSidebar activeChapter={activeChapter} onSelect={scrollTo} />
            </div>
          </aside>
        )}

        {/* Main content */}
        <div ref={contentRef} className="flex-1 min-w-0 space-y-8">
          {/* English Abstract */}
          <section id="english-abstract" className="scroll-mt-24">
            <div className="rounded-lg border bg-card px-6 py-6 sm:px-10 sm:py-8 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-primary" />
                <h2 className="font-display font-semibold text-lg">Abstract (English)</h2>
              </div>
              <article className="thesis-prose max-w-3xl">
                <MarkdownContent content={data.english_abstract} />
              </article>
            </div>
          </section>

          {/* Persian Abstract */}
          <section id="persian-abstract" className="scroll-mt-24">
            <div className="rounded-lg border bg-card px-6 py-6 sm:px-10 sm:py-8 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-primary" />
                <h2 className="font-display font-semibold text-lg">Abstract (Persian)</h2>
              </div>
              <article
                className="thesis-prose max-w-3xl"
                dir="rtl"
                lang="fa"
                style={{
                  fontFamily: "'Vazirmatn', 'Vazir', 'Tahoma', 'Iranian Sans', Arial, sans-serif",
                  fontSize: '0.98rem',
                  lineHeight: 2,
                }}
              >
                <MarkdownContent content={data.persian_abstract} />
              </article>
            </div>
          </section>

          {/* Abbreviations */}
          <section id="abbreviations" className="scroll-mt-24">
            <div className="rounded-lg border bg-card px-6 py-6 sm:px-10 sm:py-8 space-y-3 shadow-sm">
              <h2 className="font-display font-semibold text-lg mb-1">List of Abbreviations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                {data.abbreviations.map((abbr, i) => (
                  <div
                    key={i}
                    className="flex items-baseline gap-2 px-2 py-1 rounded hover:bg-accent/40 transition-colors"
                  >
                    {typeof abbr === 'string' ? (
                      <span>{abbr}</span>
                    ) : (
                      <>
                        <span className="font-semibold text-primary min-w-[80px]">
                          {abbr.abbreviation}
                        </span>
                        <span className="text-muted-foreground">— {abbr.full_form}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Chapters */}
          {CHAPTERS.map((ch) => (
            <ChapterSection key={ch.num} chapter={ch} data={data} />
          ))}

          {/* References */}
          <section id="references" className="scroll-mt-24">
            <div className="rounded-lg border bg-card px-6 py-6 sm:px-10 sm:py-8 space-y-3 shadow-sm">
              <h2 className="font-display font-semibold text-lg">
                References ({data.references.length})
              </h2>
              <ol className="space-y-2 text-xs">
                {data.references.map((ref, i) => (
                  <li
                    key={i}
                    className="rounded px-2 py-1.5 hover:bg-accent/40 transition-colors leading-relaxed"
                  >
                    <span className="font-mono text-primary mr-2 font-semibold">
                      [{i + 1}]
                    </span>
                    {ref.replace(/^\d+\.\s+/, '')}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
      </div>

      {/* Back to top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs shadow-lg hover:bg-primary/90 transition-colors print:hidden"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Back to top
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
