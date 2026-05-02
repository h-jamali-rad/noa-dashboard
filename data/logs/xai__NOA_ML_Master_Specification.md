# 📋 NOA ML Master Specification Document
## Predicting Sperm Retrieval Success in Non-Obstructive Azoospermia (NOA) Patients
### Complete Evidence-Based Machine Learning Pipeline — Publication-Ready

**Version:** 1.0  
**Created:** 2026-03-14  
**Project:** PhD/Medical Thesis — NOA Sperm Retrieval Prediction  
**Target:** Peer-reviewed journal publication (high-impact urology/andrology/AI-in-medicine)  
**Language:** All code & reports in English; clinical interpretation also in Farsi  

---

# TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Dataset Specification](#2-dataset-specification)
3. [Evidence-Based Decisions with References](#3-evidence-based-decisions-with-references)
4. [Feature Engineering (60+ Features)](#4-feature-engineering-60-features)
5. [Model Selection (20+ Models)](#5-model-selection-20-models)
6. [Hyperparameter Tuning](#6-hyperparameter-tuning)
7. [Validation Strategy](#7-validation-strategy)
8. [Explainable AI (XAI) Methods](#8-explainable-ai-xai-methods)
9. [Output Requirements](#9-output-requirements)
10. [Double-Check Points](#10-double-check-points)
11. [Phase-by-Phase Breakdown](#11-phase-by-phase-breakdown)
12. [Quality Requirements](#12-quality-requirements)
13. [Technical Specifications](#13-technical-specifications)
14. [Clinical Context & Domain Knowledge](#14-clinical-context--domain-knowledge)

---

# 1. PROJECT OVERVIEW

## 1.1 Goal
Predict **sperm retrieval success** in patients with **Non-Obstructive Azoospermia (NOA)** undergoing micro-TESE (Testicular Sperm Extraction) surgery, using machine learning with full explainability for clinical decision support.

## 1.2 Scope
- **Primary Outcome ONLY:** Outcome 1 (first sperm retrieval attempt success/failure)
- Outcomes 2, 3, 4 (salvage mTESE) are **excluded** from this project — reserved for future publications
- Binary classification: Success (1) vs. Failure (0)

## 1.3 Why Outcome 1 Only?
- Higher quality with focused analysis on one outcome
- Potential for 3-4 separate publications from the same dataset (one per outcome)
- Avoids complexity explosion from multi-outcome modeling
- Cleaner clinical narrative for reviewers

## 1.4 Target Audience
- **Primary:** Physicians, urologists, andrologists, surgeons
- **Secondary:** Peer reviewers, journal editors
- **Tertiary:** Medical center for clinical deployment (CDSS — future phase)

## 1.5 Key Principles
1. **Evidence-based**: Every decision backed by scientific references (preferably 2015-2025)
2. **Publication-ready**: All outputs formatted for direct journal submission
3. **Novelty-aware**: Test novel approaches; if they outperform established methods, document as contribution
4. **Double-checked**: Validate after every phase before proceeding
5. **Logged**: Complete decision logger with references for thesis/article writing
6. **Clinically grounded**: Statistical + clinical significance both matter

---

# 2. DATASET SPECIFICATION

## 2.1 Source File
- **Filename:** `Book_11.17.2025_Dr. Rad_Final ID.xlsb`
- **Location:** `[path] Rad_Final ID.xlsb`
- **Format:** Excel Binary (.xlsb)
- **Sheet:** `Final Sheet`

## 2.2 Dataset Dimensions
- **Rows:** 2,450 patients
- **Total Columns:** 55
- **Usable Feature Columns:** 36 (after exclusions)
- **Target Column:** `Outcome1` (binary: 0 = Failure, 1 = Success)

## 2.3 Class Distribution (from original data)
- **Failure (0):** ~62.7% (1,534 samples)
- **Success (1):** ~37.3% (916 samples)
- **Imbalance Ratio:** ~1.67:1

## 2.4 Complete Column Inventory (55 columns)

### Identifier Columns (EXCLUDE from modeling)
| # | Column | Action |
|---|--------|--------|
| 0 | ID | Drop |
| 1 | Roy-ID | Drop |

### Feature Columns (36 features for modeling)

| Feature_N | Clinical Variable | Category | Original dtype | % Missing | Unique Values |
|-----------|------------------|----------|---------------|-----------|---------------|
| Feature_1 | Age | Demographics | int64 | 0.0% | 58 |
| Feature_2 | Pathology-RT | Pathology | object | 22.2% | 772 |
| Feature_3 | Pathology-LT | Pathology | object | 49.0% | 519 |
| Feature_4 | Partner-age covariate (excluded) | Demographics | float64 | 8.6% | 42 |
| Feature_5 | Race | Demographics | object | 0.0% | 13 |
| Feature_6 | Infertile family members | Lifestyle/Environmental | object | 95.8% | 10 |
| Feature_7 | Habits | Lifestyle/Environmental | object | 42.2% | 30 |
| Feature_8 | Height | Anthropometrics | float64 | 67.2% | 45 |
| Feature_9 | Body Weight | Anthropometrics | float64 | 67.2% | 84 |
| Feature_10 | BMI | Anthropometrics | float64 | 64.1% | 529 |
| Feature_11 | Occupation (Toxic Exposure) | Lifestyle/Environmental | object | 94.4% | 7 |
| Feature_12 | Diabetes | Comorbidities | float64 | 99.1% | 1 |
| Feature_13 | Hypertension | Comorbidities | float64 | 99.8% | 1 |
| Feature_14 | Surgery trauma(s) | Surgical/Urological | object | 82.0% | 163 |
| Feature_15 | Varicocele | Surgical/Urological | object | 97.1% | 11 |
| Feature_16 | T.BX (Testicular Biopsy) | Surgical/Urological | float64 | 95.6% | 1 |
| Feature_17 | Inguinal hernia | Surgical/Urological | object | 98.7% | 3 |
| Feature_18 | Orchiopexy | Surgical/Urological | object | 97.7% | 3 |
| Feature_19 | Testis Size right (Sono) | Testicular Measurements | object | 82.8% | 408 |
| Feature_20 | RT Size (Orchidometer) | Testicular Measurements | object | 73.8% | 31 |
| Feature_21 | RT-XYZ (Sono) | Testicular Measurements | float64 | 83.0% | 386 |
| Feature_22 | Testis Size left (Sono) | Testicular Measurements | object | 82.7% | 408 |
| Feature_23 | LT Size (Orchidometer) | Testicular Measurements | object | 73.6% | 34 |
| Feature_24 | LT-XYZ (Sono) | Testicular Measurements | float64 | 83.0% | 381 |
| Feature_25 | Sakamoto-RT/mL | Testicular Measurements | float64 | 82.3% | 387 |
| Feature_26 | Sakamoto-LT/mL | Testicular Measurements | float64 | 82.8% | 382 |
| Feature_27 | Testicular volume_RT (Guess) | Testicular Measurements | float64 | 62.9% | 28 |
| Feature_28 | Testicular volume_LT (Guess) | Testicular Measurements | float64 | 62.7% | 26 |
| Feature_29 | Seminal plasma pH | Semen Parameters | float64 | 67.9% | 15 |
| Feature_30 | Testosterone levels | Hormonal Profile | object | 22.6% | 578 |
| Feature_31 | LH | Hormonal Profile | object | 25.1% | 1034 |
| Feature_32 | FSH | Hormonal Profile | object | 22.2% | 1259 |
| Feature_33 | Prolactin | Hormonal Profile | object | 40.4% | 163 |
| Feature_34 | E2 (Estradiol) | Hormonal Profile | object | 41.6% | 103 |
| Feature_35 | Karyotype | Genetic Factors | object | 62.3% | 26 |
| Feature_36 | Y chromosome microdeletion (AZFa, AZFb, AZFc) | Genetic Factors | object | 62.4% | 4 |

### Excluded Columns (all-null or irrelevant)
- **All-null columns (drop):** Torsion of spermatic cord, Cancer Type, Cancer Treatment, Infertility length, TSH, Sex Hormone-Binding Globulin (SHBG), Inhibin B, AMH, Surgery Therapeutic
- **Other outcome columns (drop for Outcome 1 focus):** Successful Sperm Retrieval-1 (text), Successful Sperm Retrieval-2 (text), Outcome2, Successful Sperm Retrieval-3 (text), Outcome3, Successful Sperm Retrieval-4 (text), Outcome4

### Feature Categories Summary
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

# 3. EVIDENCE-BASED DECISIONS WITH REFERENCES

> **CRITICAL PRINCIPLE:** Every methodological decision must cite a scientific reference. Prefer references from 2015-2025. The decision logger must record: (1) what was decided, (2) why, (3) the reference, (4) whether it was the best approach or if a novel approach outperformed it.

## 3.1 Missing Data Handling

### Threshold for Dropping Columns
- **Decision:** Drop columns with >50% missing values
- **Rationale:** EMA (European Medicines Agency, 2010) ICH E9(R1) guideline recommends that variables with excessive missingness (>40-50%) introduce unacceptable imputation uncertainty and should be excluded. TRIPOD (Transparent Reporting of a Multivariable Prediction Model, 2015) also recommends reporting and justifying missingness thresholds.
- **References:**
  - EMA ICH E9(R1) Addendum on Estimands (2010/2020)
  - Collins GS et al. "TRIPOD Statement" BMJ (2015)
  - Sterne JAC et al. "Multiple imputation for missing data in epidemiological studies" BMJ (2009)
- **⚠️ IMPORTANT:** Before dropping, check if the column has clinical importance. If a column is >50% missing but clinically critical (e.g., Karyotype at 62.3%), discuss with the medical team. Create a **missingness indicator variable** (binary: 1=missing, 0=present) before dropping.

### Imputation Strategy
- **Decision:** MissForest (Random Forest-based multiple imputation) as primary method
- **Rationale:** MissForest handles mixed data types (continuous + categorical), captures non-linear relationships, and outperforms MICE/mean/median imputation in clinical datasets.
- **References:**
  - Stekhoven DJ & Bühlmann P. "MissForest—non-parametric missing value imputation for mixed-type data" Bioinformatics (2012)
  - Waljee AK et al. "Comparison of imputation methods for missing laboratory data in medicine" BMJ Open (2013)
  - Shah AD et al. "Comparison of random forest and parametric imputation models" Am J Epidemiol (2014)
- **Fallback:** MICE (Multiple Imputation by Chained Equations) if MissForest fails
- **For categorical variables:** Mode imputation with missingness indicator
- **For numerical variables:** MissForest → MICE → KNN Imputation (in order of preference)

### Implementation Notes
- Always create **missingness indicator columns** before imputation (feature: `{column}_missing` = 0/1)
- Perform imputation **ONLY on training set**, then apply to test set
- Report percentage of imputed values per column in final report

## 3.2 Class Imbalance Handling

### Decision: SMOTE + Class Weights (Combined)
- **SMOTE:** Applied to training set only (never test set)
- **Class Weights:** Set in model parameters (`class_weight='balanced'` or computed weights)
- **Rationale:** The combination addresses imbalance at both the data level (SMOTE) and algorithm level (class weights), providing superior performance to either method alone.
- **References:**
  - Chawla NV et al. "SMOTE: Synthetic Minority Over-sampling Technique" JAIR (2002)
  - Fernández A et al. "Learning from Imbalanced Data Sets" Springer (2018) — Chapter on hybrid approaches
  - He H & Garcia EA "Learning from Imbalanced Data" IEEE TKDE (2009)
- **Novelty Check:** After implementing SMOTE+Weights, also test:
  - ADASYN (Adaptive Synthetic Sampling)
  - SMOTETomek (SMOTE + Tomek links cleaning)
  - Borderline-SMOTE
  - If any novel combination outperforms SMOTE+Weights → document as a contribution

## 3.3 Feature Selection Strategy

### Decision: Combined Statistical + Technical Approach (3-Stage Pipeline)
1. **Stage 1 — Statistical Filter:** Univariate tests (t-test/Mann-Whitney U for numerical, Chi-square for categorical) with p < 0.05 threshold
2. **Stage 2 — Recursive Feature Elimination (RFE):** Using Random Forest/XGBoost as estimator, with cross-validation (RFECV)
3. **Stage 3 — Feature Importance Ranking:** Aggregate importance from multiple models

- **Rationale:** This combined approach satisfies both clinical reviewers (who value p-values and statistical significance) and ML best practices (which prioritize predictive importance). Statistical filtering removes noise; RFE finds optimal subset; importance ranking confirms consensus.
- **References:**
  - Guyon I & Elisseeff A "An Introduction to Variable and Feature Selection" JMLR (2003)
  - Saeys Y et al. "A review of feature selection techniques in bioinformatics" Bioinformatics (2007)
  - Chandrashekar G & Sahin F "A survey on feature selection methods" Computers & Electrical Engineering (2014)
- **CRITICAL:** Do NOT blindly drop features based on importance alone. Some clinically important features (e.g., Karyotype, Y chromosome microdeletion) MUST be included regardless of statistical significance. Flag these as "clinically mandated features."
- **Also run:** Include ALL features in one model run (no feature selection) to compare — this tests whether feature selection actually helps.

## 3.4 Outlier Detection & Handling

### Decision: IQR Method + Clinical Review
- **Detection:** IQR method (Q1 - 1.5×IQR, Q3 + 1.5×IQR) for numerical features
- **Supplementary:** Z-score method (|Z| > 3) for confirmation
- **Handling:** Do NOT automatically remove outliers. Instead:
  1. Flag all detected outliers
  2. Document which variable, value, and detection method
  3. Create an **outlier report** for clinical review by the medical team
  4. Only remove/winsorize after clinical confirmation
  5. If medical team is not available: Winsorize (cap at 1st/99th percentile) rather than delete
- **Rationale:** In clinical data, outliers may represent real biological extremes (e.g., very high FSH in Klinefelter patients). Removing them without clinical input introduces bias.
- **References:**
  - Aguinis H, Gottfredson RK, Joo H "Best-Practice Recommendations for Defining, Identifying, and Handling Outliers" Organizational Research Methods (2013)
  - Osborne JW & Overbay A "The power of outliers (and why researchers should ALWAYS check for them)" Practical Assessment, Research & Evaluation (2004)
- **Output:** Generate `outlier_report.csv` listing all detected outliers with: patient_index, variable, value, IQR_flag, Z_flag, clinical_action_needed

## 3.5 Random Seeds for Reproducibility

### Decision: Multiple Seeds (5-10 seeds)
- **Seeds to use:** [42, 123, 456, 789, 1024, 2023, 2024, 3141]  (8 seeds)
- **Report:** Mean ± standard deviation across all seeds for every metric
- **Rationale:** Single-seed results can be misleading due to data split variance. Multiple seeds provide confidence intervals and demonstrate robustness.
- **References:**
  - Bouthillier X et al. "Accounting for Variance in Machine Learning Benchmarks" MLSys (2021)
  - Picard RR & Cook RD "Cross-Validation of Regression Models" JASA (1984)
  - Henderson P et al. "Deep Reinforcement Learning that Matters" AAAI (2018) — on seed sensitivity
- **Implementation:** For each model, train with all 8 seeds, report mean ± SD of AUC, F1, Accuracy, MCC

## 3.6 Train/Test Split Strategy

### Decision: Both 80/20 AND 70/30 splits
- **Primary:** 80/20 stratified split (standard)
- **Secondary:** 70/30 stratified split (more conservative, better for small datasets)
- **Compare:** Report metrics for both splits; discuss which provides better generalization
- **Always:** Stratified splitting to maintain class distribution
- **References:**
  - Hastie T, Tibshirani R, Friedman J "The Elements of Statistical Learning" (2009)
  - Vabalas A et al. "Machine learning algorithm validation with a limited sample size" PLoS ONE (2019)

## 3.7 Scaling Strategy

### Decision: Multiple scalers, compare
- **StandardScaler:** Primary (zero mean, unit variance) — for SVM, Logistic Regression, KNN, MLP
- **RobustScaler:** For datasets with outliers (uses IQR)
- **MinMaxScaler:** For tree-based models (optional, trees are scale-invariant)
- **Fit on training set ONLY**, transform both train and test
- **Reference:** Zheng A & Casari A "Feature Engineering for Machine Learning" O'Reilly (2018)

---

# 4. FEATURE ENGINEERING (60+ Features)

> **CRITICAL:** Create ALL possible clinically meaningful features. Phase 1 creates them; Phase 2 evaluates and refines.

## 4.1 Ratio Features (Hormonal)
| Feature Name | Formula | Clinical Rationale |
|---|---|---|
| FSH_LH_Ratio | FSH / LH | Key indicator of gonadal function; elevated ratio suggests primary testicular failure |
| Testosterone_FSH_Ratio | Testosterone / FSH | Lower ratio = worse spermatogenesis prognosis |
| Testosterone_LH_Ratio | Testosterone / LH | Leydig cell function indicator |
| LH_FSH_Ratio | LH / FSH | Inverse gonadal indicator |
| E2_Testosterone_Ratio | E2 / Testosterone | Estrogen dominance indicator |
| Prolactin_Testosterone_Ratio | Prolactin / Testosterone | Hyperprolactinemia impact |
| FSH_Testosterone_Ratio | FSH / Testosterone | Combined gonadal stress |

## 4.2 Ratio Features (Testicular)
| Feature Name | Formula | Clinical Rationale |
|---|---|---|
| RT_LT_Volume_Ratio | Testicular_volume_RT / Testicular_volume_LT | Testicular asymmetry indicator |
| RT_LT_Orchidometer_Ratio | RT_Size_Orchidometer / LT_Size_Orchidometer | Clinical asymmetry |
| RT_LT_Sakamoto_Ratio | Sakamoto_RT / Sakamoto_LT | Ultrasound-based asymmetry |
| Total_Testicular_Volume | Testicular_volume_RT + Testicular_volume_LT | Total gonadal volume |
| Mean_Testicular_Volume | (volume_RT + volume_LT) / 2 | Average testicular size |
| Total_Sakamoto | Sakamoto_RT + Sakamoto_LT | Total Sakamoto score |
| Mean_Sakamoto | (Sakamoto_RT + Sakamoto_LT) / 2 | Average density |
| Volume_Difference | |volume_RT - volume_LT| | Absolute asymmetry |

## 4.3 Anthropometric Ratios
| Feature Name | Formula | Clinical Rationale |
|---|---|---|
| BMI_Age_Interaction | BMI × Age | Metabolic-age combined effect |
| Weight_Height_Ratio | Weight / Height | Alternative to BMI |

## 4.4 Clinical Binary Indicators
| Feature Name | Condition | Clinical Rationale |
|---|---|---|
| Low_Testosterone | Testosterone < 300 ng/dL | Hypogonadism indicator |
| High_FSH | FSH > 12 IU/L | Primary testicular failure |
| Very_High_FSH | FSH > 20 IU/L | Severe testicular failure |
| Normal_Karyotype | Karyotype == "46,XY" | Genetic normality flag |
| Klinefelter | Karyotype contains "47,XXY" | Klinefelter syndrome |
| AZF_Deletion_Present | Y_microdeletion != "Normal" / "None" | AZF deletion presence |
| AZFc_Only | Y_microdeletion == "AZFc" | Isolated AZFc (better prognosis) |
| Elevated_Prolactin | Prolactin > 25 ng/mL | Hyperprolactinemia |
| Low_E2 | E2 < 10 pg/mL | Estrogen deficiency |
| Has_Varicocele | Varicocele != null/none | Varicocele presence |
| Has_Surgery_History | Surgery_trauma != null/none | Prior surgical intervention |
| Has_Orchiopexy | Orchiopexy != null/none | History of undescended testis |
| Small_Testes_RT | Testicular_volume_RT < 4 mL | Right testicular atrophy |
| Small_Testes_LT | Testicular_volume_LT < 4 mL | Left testicular atrophy |
| Bilateral_Small_Testes | Both RT and LT < 4 mL | Severe bilateral atrophy |

## 4.5 Age-Based Features
| Feature Name | Definition | Reference |
|---|---|---|
| Age_Group | <35=Young, 35-39=Middle, 40-44=APA, ≥45=Elderly | AUA/ASRM guidelines |
| Age_Binary_40 | Age < 40 vs ≥ 40 | Most common binary cutoff in NOA literature |
| Age_Squared | Age² | Non-linear age effect |
| Partner-age covariate (excluded)_Group | Similar categorization | Partner age impact |
| Age_Difference | Age - Partner-age covariate (excluded) | Couple age gap |

## 4.6 Interaction Features
| Feature Name | Formula | Clinical Rationale |
|---|---|---|
| Age_x_FSH | Age × FSH | Age-modulated hormonal effect |
| Age_x_Testosterone | Age × Testosterone | Age-hormone interaction |
| BMI_x_Testosterone | BMI × Testosterone | Metabolic-hormonal axis |
| FSH_x_TesticularVolume | FSH × Mean_Volume | Hormonal-structural interaction |
| Age_x_Volume | Age × Mean_Volume | Age-structural interaction |
| Karyotype_x_FSH | Normal_Karyotype × FSH | Genetic-hormonal interaction |

## 4.7 Polynomial Features
| Feature Name | Formula | Rationale |
|---|---|---|
| Age_Squared | Age² | Capture non-linear age effects |
| FSH_Squared | FSH² | Non-linear hormonal effect |
| BMI_Squared | BMI² | Non-linear metabolic effect |
| Testosterone_Squared | Testosterone² | Non-linear hormonal effect |
| Volume_Squared | Mean_Volume² | Non-linear size effect |

## 4.8 Domain-Specific Composite Scores
| Feature Name | Formula | Clinical Rationale |
|---|---|---|
| Hormonal_Score | Weighted combination of FSH, LH, Testosterone, E2, Prolactin | Overall endocrine status |
| Testicular_Score | Weighted combination of volume, Sakamoto, orchidometer | Overall testicular health |
| Genetic_Risk_Score | Combine Karyotype + AZF status | Overall genetic risk |
| Surgical_History_Score | Count of previous surgeries | Surgical burden |
| Comorbidity_Score | Sum of Diabetes + Hypertension + other comorbidities | Overall health status |
| Favorable_Prognostic_Score | Composite of positive predictors | Overall prognosis indicator |

## 4.9 Statistical Transformations
| Transformation | Applied To | Rationale |
|---|---|---|
| Log transformation | Right-skewed numerical (FSH, LH, Testosterone, Prolactin) | Normalize distributions |
| Square root | Count variables | Variance stabilization |
| Box-Cox | All continuous numerical | Optimal normalization |

## 4.10 Missingness Features
| Feature Name | Definition | Rationale |
|---|---|---|
| {col}_missing | 1 if original value was missing, 0 otherwise | Missingness may itself be informative |
| Missing_Count | Total missing values per patient | Overall data completeness |
| Hormonal_Missing_Count | Missing count in hormonal features | Hormonal data availability |
| Testicular_Missing_Count | Missing count in testicular features | Structural data availability |

---

# 5. MODEL SELECTION (20+ Models)

> **All models must have scientific justification for inclusion.**

## 5.1 Classical Machine Learning Models (10 models)

| # | Model | Library | Why Include | Key Considerations |
|---|-------|---------|-------------|-------------------|
| 1 | **Logistic Regression** | sklearn | Interpretable baseline; gold standard for clinical prediction | Regularization: L1, L2, ElasticNet |
| 2 | **Decision Tree** | sklearn | Full interpretability; generates clinical rules | Prone to overfitting; use max_depth |
| 3 | **Random Forest** | sklearn | Robust ensemble; built-in feature importance | n_estimators, max_depth tuning |
| 4 | **XGBoost** | xgboost | State-of-art for tabular data; handles imbalance | scale_pos_weight, regularization |
| 5 | **LightGBM** | lightgbm | Faster than XGBoost; memory efficient | is_unbalance parameter |
| 6 | **CatBoost** | catboost | Native categorical handling; ordered boosting | auto_class_weights |
| 7 | **SVM** | sklearn | Excellent for moderate-sized data; kernel trick | Kernel: RBF, linear; C, gamma |
| 8 | **KNN** | sklearn | Non-parametric; intuitive | n_neighbors, distance metric |
| 9 | **Naive Bayes** | sklearn | Fast baseline; works with small data | GaussianNB, BernoulliNB |
| 10 | **Gradient Boosting** | sklearn | Standard sklearn boosting | n_estimators, learning_rate |

## 5.2 Additional Tree-Based Models (2 models)

| # | Model | Library | Why Include |
|---|-------|---------|-------------|
| 11 | **Extra Trees** | sklearn | More randomization than RF; may reduce overfitting |
| 12 | **AdaBoost** | sklearn | Adaptive boosting; good for weak learners |

## 5.3 Deep Learning Models (3 models)

| # | Model | Library | Why Include |
|---|-------|---------|-------------|
| 13 | **MLP (Multi-Layer Perceptron)** | sklearn/PyTorch | Universal approximator; neural baseline |
| 14 | **TabNet** | pytorch-tabnet | Attention-based; interpretable deep learning for tabular |
| 15 | **Wide & Deep** | Custom/TF | Combines memorization and generalization (optional if time permits) |

## 5.4 Ensemble Methods (4 models)

| # | Model | Library | Why Include |
|---|-------|---------|-------------|
| 16 | **Soft Voting Ensemble** | sklearn | Combine top-5 models by probability averaging |
| 17 | **Hard Voting Ensemble** | sklearn | Majority vote from top-5 models |
| 18 | **Stacking Ensemble** | sklearn | Meta-learner on base model predictions |
| 19 | **Blending Ensemble** | Custom | Holdout-based stacking alternative |

## 5.5 Specialized Models (2+ models)

| # | Model | Library | Why Include |
|---|-------|---------|-------------|
| 20 | **Elastic Net** | sklearn | Combines L1+L2; good for correlated features |
| 21 | **Ridge Classifier** | sklearn | L2-regularized linear model |
| 22 | **Balanced Random Forest** | imblearn | Imbalance-aware RF variant |
| 23 | **EasyEnsemble** | imblearn | Ensemble of under-sampled subsets |

**Total: 20-23 models** (depending on feasibility)

---

# 6. HYPERPARAMETER TUNING

## 6.1 Primary Method: Optuna (Bayesian Optimization)

### Why Optuna?
- **Bayesian optimization** is more efficient than Grid Search (exhaustive but expensive) and Random Search (better than grid but still random)
- **Optuna advantages:**
  - Tree-structured Parzen Estimator (TPE) sampler → intelligent search
  - Pruning of unpromising trials → faster convergence
  - Built-in visualization of optimization history
  - Handles conditional hyperparameters elegantly
- **References:**
  - Akiba T et al. "Optuna: A Next-generation Hyperparameter Optimization Framework" KDD (2019)
  - Bergstra J et al. "Algorithms for Hyper-Parameter Optimization" NIPS (2011)
  - Snoek J et al. "Practical Bayesian Optimization of Machine Learning Algorithms" NIPS (2012)

### Configuration
- **Trials per model:** 100-200 (depending on model complexity)
- **Sampler:** TPE (Tree-structured Parzen Estimator)
- **Pruner:** MedianPruner (prune after 5 warmup steps)
- **Objective:** Maximize AUC-ROC (primary), with F1 as secondary
- **CV within tuning:** 5-fold stratified cross-validation

### Comparison Requirement
- **Also run:** Grid Search and Random Search on 2-3 representative models (e.g., XGBoost, Random Forest)
- **Document:** Show that Optuna converges faster and finds better parameters
- **This comparison itself is a contribution** if properly documented

## 6.2 Hyperparameter Spaces (Per Model)

### Logistic Regression
```
C: [0.001, 0.01, 0.1, 1, 10, 100]
penalty: ['l1', 'l2', 'elasticnet']
solver: ['lbfgs', 'saga', 'liblinear']
max_iter: [1000, 5000, 10000]
```

### Random Forest
```
n_estimators: [100, 200, 300, 500, 1000]
max_depth: [3, 5, 7, 10, 15, 20, None]
min_samples_split: [2, 5, 10, 20]
min_samples_leaf: [1, 2, 4, 8]
max_features: ['sqrt', 'log2', 0.3, 0.5, 0.7]
class_weight: ['balanced', 'balanced_subsample']
```

### XGBoost
```
n_estimators: [100, 200, 300, 500, 1000]
max_depth: [3, 5, 7, 9, 11]
learning_rate: [0.01, 0.05, 0.1, 0.2, 0.3]
min_child_weight: [1, 3, 5, 7]
subsample: [0.6, 0.7, 0.8, 0.9, 1.0]
colsample_bytree: [0.6, 0.7, 0.8, 0.9, 1.0]
gamma: [0, 0.1, 0.2, 0.5, 1]
reg_alpha: [0, 0.001, 0.01, 0.1, 1]
reg_lambda: [0, 0.001, 0.01, 0.1, 1]
scale_pos_weight: [auto-calculated from class ratio]
```

### SVM
```
C: [0.01, 0.1, 1, 10, 100]
kernel: ['rbf', 'linear', 'poly', 'sigmoid']
gamma: ['scale', 'auto', 0.001, 0.01, 0.1, 1]
class_weight: ['balanced']
probability: [True]  # Required for AUC calculation
```

### LightGBM
```
n_estimators: [100, 200, 300, 500, 1000]
max_depth: [-1, 3, 5, 7, 9]
learning_rate: [0.01, 0.05, 0.1, 0.2]
num_leaves: [15, 31, 63, 127]
min_child_samples: [5, 10, 20, 50]
subsample: [0.6, 0.7, 0.8, 0.9, 1.0]
colsample_bytree: [0.6, 0.7, 0.8, 0.9, 1.0]
is_unbalance: [True]
```

### CatBoost
```
iterations: [100, 200, 500, 1000]
depth: [4, 6, 8, 10]
learning_rate: [0.01, 0.05, 0.1, 0.2]
l2_leaf_reg: [1, 3, 5, 7, 9]
auto_class_weights: ['Balanced', 'SqrtBalanced']
```

---

# 7. VALIDATION STRATEGY

> **CRITICAL:** This is what reviewers scrutinize most. Must be comprehensive.

## 7.1 Primary Validation Methods

| # | Method | Configuration | Purpose |
|---|--------|---------------|---------|
| 1 | **10-Fold Stratified CV** | 10 folds, stratified, multiple seeds | Standard validation gold standard |
| 2 | **5-Fold Stratified CV** | 5 folds, stratified | Comparison with 10-fold |
| 3 | **Leave-One-Out CV (LOOCV)** | N iterations (N=2450) | Maximum use of data; unbiased but high variance |
| 4 | **Nested CV** | Outer: 5-fold, Inner: 3-fold | Unbiased performance estimation WITH hyperparameter tuning |
| 5 | **Repeated K-Fold** | 10-fold × 10 repeats = 100 total folds | Stability across random splits |
| 6 | **Bootstrap Validation** | 1000 iterations with replacement | 95% confidence intervals for all metrics |
| 7 | **80/20 Stratified Split** | Primary holdout evaluation | Standard split |
| 8 | **70/30 Stratified Split** | Secondary holdout evaluation | Conservative split comparison |

## 7.2 Robustness Testing

| # | Test | Configuration | Purpose |
|---|------|---------------|---------|
| 9 | **Noise Injection** | Add 5%, 10%, 15% Gaussian noise | Performance degradation analysis |
| 10 | **Feature Perturbation** | Randomly shuffle one feature at a time | Feature sensitivity analysis |
| 11 | **Stability Analysis** | Train on 8 different random seeds | Seed sensitivity |
| 12 | **Learning Curves** | Train sizes: 10%, 20%, 30%, ..., 100% | Bias-variance tradeoff |

## 7.3 Overfitting Detection

| # | Check | Threshold | Action |
|---|-------|-----------|--------|
| 13 | **Train-Test AUC Gap** | Gap > 5% → suspect | Apply regularization, reduce complexity |
| 14 | **Cross-Validation Variance** | SD > 0.05 → unstable | Simplify model, increase regularization |
| 15 | **Perfect Train AUC (1.0)** | Always suspicious | Create adjusted/regularized model variant |

## 7.4 Statistical Significance Testing

| # | Test | Purpose |
|---|------|---------|
| 16 | **DeLong Test** | Compare AUCs between models (DeLong et al., 1988) |
| 17 | **McNemar's Test** | Compare classification accuracy between models |
| 18 | **Paired t-test on CV folds** | Compare metrics across CV folds |
| 19 | **Friedman Test** | Compare multiple classifiers simultaneously |

## 7.5 Temporal Validation (if time column available)
- **Decision:** If surgery dates are available in the dataset, split by time (train on earlier cases, test on later)
- **If no time column:** Note as limitation; recommend for future work

## 7.6 Metrics to Report for ALL Models

| Metric | Formula/Description | Why |
|--------|-------------------|-----|
| **AUC-ROC** | Area Under ROC Curve | Primary metric — discrimination ability |
| **Accuracy** | (TP+TN)/(TP+TN+FP+FN) | Overall correctness |
| **Sensitivity (Recall)** | TP/(TP+FN) | Clinically critical — don't miss positive cases |
| **Specificity** | TN/(TN+FP) | Avoid false positives |
| **Precision (PPV)** | TP/(TP+FP) | Positive predictive value |
| **NPV** | TN/(TN+FN) | Negative predictive value |
| **F1 Score** | 2×(Precision×Recall)/(Precision+Recall) | Balance of precision and recall |
| **MCC** | Matthews Correlation Coefficient | Best single metric for imbalanced data |
| **Brier Score** | Mean squared difference between predicted prob and actual | Calibration quality |
| **Cohen's Kappa** | Agreement beyond chance | Inter-rater agreement |
| **Log Loss** | Negative log-likelihood | Probability quality |
| **Balanced Accuracy** | (Sensitivity + Specificity) / 2 | Imbalance-adjusted accuracy |

---

# 8. EXPLAINABLE AI (XAI) METHODS

## 8.1 Feature-Level Explanations

| # | Method | Scope | Models | Details |
|---|--------|-------|--------|---------|
| 1 | **Native Feature Importance** | Global | All tree-based + Logistic Regression | `feature_importances_` / `|coef_|`, normalized |
| 2 | **Permutation Importance** | Global | All models | 30 repeats, `roc_auc` scorer |
| 3 | **SHAP (Global)** | Global | XGBoost, RF, LightGBM, CatBoost, SVM, LR | TreeExplainer for trees, KernelExplainer for others; beeswarm + bar plots |
| 4 | **SHAP (Local)** | Local | Top-5 models | Waterfall plots for 3 archetypes: High-Positive, High-Negative, Borderline |
| 5 | **SHAP Dependence** | Global | Top-5 models | Top-4 features per model with interaction coloring |
| 6 | **SHAP Interaction** | Global | XGBoost | SHAP interaction values matrix |
| 7 | **PDP (Partial Dependence)** | Global | XGBoost, RF | Top-4 features, 2×2 grid |
| 8 | **ICE (Individual Conditional)** | Global+Local | XGBoost, RF | ICE + PDP overlay, top-4 features |
| 9 | **LIME** | Local | XGBoost, SVM (best model) | 5 archetype samples: High-Pos, High-Neg, Borderline, True-Pos, False-Neg |
| 10 | **ELI5** | Global | All models | Quick importance + weights overview |
| 11 | **Accumulated Local Effects (ALE)** | Global | Top-3 models | Alternative to PDP that handles correlated features |

## 8.2 Model Performance Visualization

| # | Visualization | Details |
|---|---------------|---------|
| 12 | **ROC Curves (Standard)** | All models overlaid on single plot with AUC in legend |
| 13 | **ROC Curves (with 95% CI)** | Bootstrap 1000 iterations; shaded CI bands; per-model subplot |
| 14 | **Precision-Recall Curves** | All models with Average Precision; no-skill baseline |
| 15 | **Calibration Curves** | Reliability diagrams (10 bins); perfect calibration reference |
| 16 | **Confusion Matrices** | All models at threshold=0.5 AND at optimal threshold (from Youden's J) |
| 17 | **Decision Curve Analysis (DCA)** | Clinical utility across threshold probabilities |
| 18 | **Net Benefit Curves** | Compared to "treat all" and "treat none" strategies |

## 8.3 Clinical Synthesis

| # | Deliverable | Details |
|---|-------------|---------|
| 19 | **Consensus Feature Ranking** | Aggregate top features across all models + all XAI methods |
| 20 | **Clinical Interpretation Report** | In English + Farsi; what features matter, clinical implications |
| 21 | **Final Research Findings** | Best model, top predictors, clinical recommendations |
| 22 | **Literature Comparison** | Compare results with published NOA prediction studies |

## 8.4 Sample Archetype Definitions for Local XAI

| Archetype | Selection Criterion |
|-----------|-------------------|
| **High-Positive** | Highest predicted probability of success |
| **High-Negative** | Lowest predicted probability (near-zero) |
| **Borderline** | Predicted probability closest to 0.5 |
| **True-Positive** | Actual=1 AND predicted probability > 0.7 |
| **False-Negative** | Actual=1 AND predicted probability < 0.3 |

---

# 9. OUTPUT REQUIREMENTS

## 9.1 Report Files

| # | File | Location | Description |
|---|------|----------|-------------|
| 1 | `Phase{N}_Report.md` | `3_Results/Phase{N}/` | Detailed technical report per phase |
| 2 | `clinical_interpretation.md` | `5_Reports/` | Clinical interpretation (English + Farsi) |
| 3 | `Final_Research_Findings.md` | `5_Reports/` | Final summary for publication |
| 4 | `Decision_Logger.md` | `5_Reports/` | ALL decisions with references — for thesis writing |
| 5 | `Literature_Comparison.md` | `5_Reports/` | Comparison with published NOA ML studies |
| 6 | `Executive_Summary.md` | `5_Reports/` | Non-technical summary |
| 7 | `Phase{N}_Summary_FA.md` | `5_Reports/` | Farsi summary per phase |
| 8 | `outlier_report.csv` | `3_Results/Phase1/` | Detected outliers for clinical review |
| 9 | `Overall_Comprehensive_Report.md` | `5_Reports/` | Single consolidated report across all phases |

## 9.2 Decision Logger Requirements
The `Decision_Logger.md` must contain for EVERY decision:
1. **Decision ID** (sequential)
2. **Phase** (which phase)
3. **Category** (e.g., Missing Data, Feature Selection, Model Selection)
4. **Decision** (what was decided)
5. **Rationale** (why)
6. **Reference** (APA format citation)
7. **Alternative Considered** (what else was considered)
8. **Novelty Flag** (if our approach outperformed the reference method)
9. **Outcome** (what happened after implementing)

## 9.3 Data Files

| # | File | Location | Description |
|---|------|----------|-------------|
| 1 | `original_dataset.csv` | `1_Data/Raw/` | Original converted from .xlsb |
| 2 | `cleaned_dataset.csv` | `1_Data/Cleaned/` | After cleaning (Phase 1) |
| 3 | `encoded_dataset.csv` | `1_Data/Processed/` | After encoding + scaling (Phase 1) |
| 4 | `feature_engineered_dataset.csv` | `1_Data/Processed/` | After feature engineering |
| 5 | `descriptive_stats.csv` | `3_Results/Phase2/` | Descriptive statistics |
| 6 | `normality_tests.csv` | `3_Results/Phase2/` | Normality test results |
| 7 | `group_comparison.csv` | `3_Results/Phase2/` | Group comparison results |
| 8 | `correlation_matrix.csv` | `3_Results/Phase2/` | Correlation matrices |
| 9 | `model_comparison.csv` | `3_Results/Phase3/` | All model metrics comparison |
| 10 | `hyperparameter_results.csv` | `3_Results/Phase3/` | Optuna tuning results |
| 11 | `optimal_thresholds.csv` | `3_Results/Phase3/` | Per-model optimal thresholds |
| 12 | `kfold_results.csv` | `3_Results/Phase4/` | K-Fold CV results |
| 13 | `loocv_results.csv` | `3_Results/Phase4/` | LOOCV results |
| 14 | `bootstrap_results.csv` | `3_Results/Phase4/` | Bootstrap validation results |
| 15 | `delong_test_results.csv` | `3_Results/Phase4/` | DeLong test results |

## 9.4 Model Files

| Location | Format | Description |
|----------|--------|-------------|
| `6_Models/Saved/` | `.joblib` | All trained models (base + adjusted) |
| `6_Models/Saved/` | `.json` | Hyperparameter configurations |
| `6_Models/Saved/` | `.pkl` | Scalers, encoders |

## 9.5 Figure Specifications

- **Format:** BOTH PNG (for reports) AND TIFF (for journal submission)
- **DPI:** 300 minimum (publication quality)
- **Location:** `4_Figures/Phase{N}/`
- **Naming:** `{figure_type}_{model_name}.{png|tiff}`
- **Color scheme:** Consistent across all figures (use seaborn/plotly professional palettes)
- **Font size:** Minimum 12pt for labels, 10pt for tick marks
- **Figure size:** Minimum 10×8 inches for single plots, 14×12 for grids

## 9.6 Literature Comparison Requirements

The `Literature_Comparison.md` must include:
1. **Search:** PubMed/Google Scholar for "NOA sperm retrieval prediction machine learning" (2015-2025)
2. **Table:** Compare our results with published studies:
   - Study (Author, Year)
   - Sample Size
   - Features Used
   - Models Used
   - Best AUC
   - Our AUC
   - Key Differences
3. **Discussion:** Where we improve, where we're comparable, limitations
4. **Novelty Claims:** What's new in our approach

---

# 10. DOUBLE-CHECK POINTS

> **After EACH phase, before proceeding, perform these checks:**

## 10.1 After Phase 1 (Data Cleaning)

| # | Check | How |
|---|-------|-----|
| 1 | No data leakage | Verify target column is not used in feature engineering |
| 2 | Missing values handled correctly | Verify imputation was on train only |
| 3 | No duplicate rows | `df.duplicated().sum() == 0` |
| 4 | Data types correct | All numerical features are float/int, categoricals encoded |
| 5 | Outlier report generated | `outlier_report.csv` exists with all flagged outliers |
| 6 | Feature engineering produces valid values | No NaN, no Inf in engineered features |
| 7 | Target distribution preserved | Class ratio matches original after cleaning |
| 8 | Column exclusions documented | Verify correct columns were dropped |
| 9 | Shape is reasonable | n_samples matches expectation after row drops |
| 10 | Decision logger updated | All Phase 1 decisions logged with references |

## 10.2 After Phase 2 (Statistical Analysis)

| # | Check | How |
|---|-------|-----|
| 1 | Normality tests run for all numerical | Shapiro-Wilk, K-S results logged |
| 2 | Correct test selection | Parametric vs non-parametric based on normality |
| 3 | VIF calculated | Multicollinearity check; flag VIF > 10 |
| 4 | Correlations computed | Pearson AND Spearman (based on normality) |
| 5 | Group comparisons significant features | List features with p < 0.05 between outcome groups |
| 6 | Power analysis adequate | Statistical power ≥ 0.80 |
| 7 | Class imbalance documented | Ratio, visualization, strategy defined |
| 8 | Effect sizes reported | Cohen's d / rank-biserial for all comparisons |
| 9 | Feature selection results | Which features survived each stage |
| 10 | Decision logger updated | All Phase 2 decisions logged with references |

## 10.3 After Phase 3 (Model Training)

| # | Check | How |
|---|-------|-----|
| 1 | All models trained | 20+ models × 8 seeds = 160+ runs |
| 2 | SMOTE on train only | Verify SMOTE was NOT applied to test data |
| 3 | Scaling on train only | Verify scaler fit on train, transform on test |
| 4 | Optuna completed | 100-200 trials per model |
| 5 | Model comparison table | All metrics for all models |
| 6 | No impossible metrics | No AUC = 1.0 on test set (suspicious) |
| 7 | Models saved | All `.joblib` files exist |
| 8 | Hyperparameters documented | All final parameters logged |
| 9 | Ensemble models created | Voting + Stacking at minimum |
| 10 | Decision logger updated | All Phase 3 decisions logged with references |

## 10.4 After Phase 4 (Validation)

| # | Check | How |
|---|-------|-----|
| 1 | All CV methods run | 10-fold, 5-fold, LOOCV, Nested, Repeated, Bootstrap |
| 2 | Both splits tested | 80/20 AND 70/30 results |
| 3 | Overfitting detected and addressed | Train-test gap < 5% for final models |
| 4 | Learning curves plotted | Bias-variance analyzed |
| 5 | Stability verified | Seed sensitivity < 2% variation |
| 6 | Robustness tested | Performance under noise documented |
| 7 | Statistical significance | DeLong test between top models |
| 8 | Adjusted models created | For any overfitting models |
| 9 | Bootstrap CIs | 95% CI for all metrics |
| 10 | Decision logger updated | All Phase 4 decisions logged with references |

## 10.5 After Phase 5 (XAI)

| # | Check | How |
|---|-------|-----|
| 1 | SHAP for all required models | TreeExplainer + KernelExplainer as needed |
| 2 | LIME for multiple models | At least XGBoost + best model |
| 3 | PDP/ICE plots generated | Top-4 features per model |
| 4 | ROC with CI | Bootstrap 1000 iterations |
| 5 | Confusion matrices at optimal threshold | Not just 0.5 |
| 6 | Clinical interpretation written | English + Farsi |
| 7 | Literature comparison complete | At least 10 published studies compared |
| 8 | Consensus feature ranking | Aggregated across all models & XAI methods |
| 9 | All figures publication-quality | 300 DPI, PNG + TIFF |
| 10 | Decision logger complete | ALL decisions across all phases |

---

# 11. PHASE-BY-PHASE BREAKDOWN

## 11.1 PHASE 0: Project Setup & Initialization

### Tasks
1. Create standardized folder structure
2. Install all Python dependencies
3. Create `requirements.txt`
4. Convert `.xlsb` to `.csv` and save to `1_Data/Raw/`
5. Initial dataset preview (shape, columns, dtypes)
6. Initialize Decision Logger

### Inputs
- Raw dataset: `[path] Rad_Final ID.xlsb`
- This specification document

### Outputs
```
NOA_ML_Project/
├── 1_Data/
│   ├── Raw/original_dataset.csv
│   ├── Cleaned/          (empty, populated in Phase 1)
│   └── Processed/        (empty, populated in Phase 1)
├── 2_Code/
├── 3_Results/
│   └── Phase0/Phase0_Setup_Report.md
├── 4_Figures/
├── 5_Reports/
│   └── Decision_Logger.md    (initialized)
├── 6_Models/
│   └── Saved/
└── requirements.txt
```

### Folder Structure
```
NOA_ML_Project/
├── 1_Data/
│   ├── Raw/                    # Original unchanged data
│   ├── Cleaned/                # After Phase 1 cleaning
│   └── Processed/              # After encoding, scaling, feature engineering
├── 2_Code/
│   ├── phase0_setup.py
│   ├── phase1_cleaning.py
│   ├── phase2_statistics.py
│   ├── phase3_modeling.py
│   ├── phase4_validation.py
│   └── phase5_xai.py
├── 3_Results/
│   ├── Phase0/
│   ├── Phase1_DataCleaning/
│   ├── Phase2_Statistics/
│   ├── Phase3_Models/
│   ├── Phase4_Validation/
│   └── Phase5_XAI/
├── 4_Figures/
│   ├── Phase1/
│   ├── Phase2/
│   ├── Phase3/
│   ├── Phase4/
│   └── Phase5/
├── 5_Reports/
│   ├── Decision_Logger.md
│   ├── clinical_interpretation.md
│   ├── Final_Research_Findings.md
│   ├── Literature_Comparison.md
│   └── Overall_Comprehensive_Report.md
├── 6_Models/
│   └── Saved/
└── requirements.txt
```

---

## 11.2 PHASE 1: Data Understanding & Cleaning

### Tasks (10 tasks)

**Task 1: Read & Understand Dataset**
- Load `.xlsb` file, identify all columns, dtypes, shape, memory
- Preview first/last rows, check for obvious issues
- Document: column count, row count, target variable

**Task 2: Intelligent Data Type Detection**
- Classify each column: Binary, Categorical (Nominal/Ordinal), Numerical (Continuous/Discrete), Text, DateTime
- Create `data_type_classification.csv`

**Task 3: Missing Values Analysis & Imputation**
- Calculate missing % per column
- Apply >50% threshold (with clinical exceptions) — Reference: EMA ICH E9(R1)
- Create missingness indicator variables
- Apply MissForest imputation — Reference: Stekhoven & Bühlmann (2012)
- Fallback: MICE if MissForest fails
- Document every imputation decision with reference

**Task 4: Outlier Detection & Documentation**
- IQR method for all numerical features — Reference: Aguinis et al. (2013)
- Z-score (|Z| > 3) for confirmation
- Generate `outlier_report.csv` — DO NOT auto-remove
- Winsorize (cap at 1st/99th percentile) unless clinical review says otherwise
- Flag for medical team review

**Task 5: Duplicate & Inconsistency Check**
- Check exact duplicates
- Check near-duplicates (same patient, different rows)
- Verify logical consistency (e.g., BMI matches Height/Weight)

**Task 6: Data Type Corrections**
- Convert `object` columns that should be numeric (e.g., Testosterone stored as string)
- Parse compound values (e.g., ranges like "10-15" → midpoint)
- Handle encoding issues (Farsi characters, special symbols)

**Task 7: Feature Engineering (see Section 4)**
- Create ALL 60+ features from Section 4
- All ratio features, binary indicators, interactions, polynomial, composite scores
- Missingness indicator features
- Statistical transformations (log, sqrt, Box-Cox)

**Task 8: Encoding Categorical Variables**
- Label Encoding for ordinal variables
- One-Hot Encoding for nominal variables with ≤10 categories
- Target Encoding for high-cardinality categorical (Pathology-RT with 772 values)
- Reference: Potdar et al. "A Comparative Study of Categorical Variable Encoding Techniques" (2017)

**Task 9: Scaling Numerical Features**
- StandardScaler as primary
- RobustScaler as alternative for features with outliers
- **FIT ON TRAINING SET ONLY**

**Task 10: Save & Report**
- Save `cleaned_dataset.csv`, `encoded_dataset.csv`, `feature_engineered_dataset.csv`
- Generate `Phase1_Report.md` with all decisions documented
- Update Decision Logger

### Inputs
- `1_Data/Raw/original_dataset.csv`

### Outputs
- `1_Data/Cleaned/cleaned_dataset.csv`
- `1_Data/Processed/encoded_dataset.csv`
- `1_Data/Processed/feature_engineered_dataset.csv`
- `3_Results/Phase1_DataCleaning/Phase1_Report.md`
- `3_Results/Phase1_DataCleaning/outlier_report.csv`
- `3_Results/Phase1_DataCleaning/data_type_classification.csv`
- `3_Results/Phase1_DataCleaning/missing_values_analysis.csv`
- `4_Figures/Phase1/missing_values_analysis.{png,tiff}`
- `4_Figures/Phase1/outliers_boxplot.{png,tiff}`
- `4_Figures/Phase1/data_types_summary.{png,tiff}`
- `4_Figures/Phase1/correlation_initial.{png,tiff}`

---

## 11.3 PHASE 2: Advanced Statistical Analysis

### Tasks (8 tasks)

**Task 1: Comprehensive Descriptive Statistics**
- Mean, SD, Median, IQR, 95% CI — overall AND by target group (Success vs. Failure)
- For categorical: frequencies, proportions, chi-square tests
- Output: `descriptive_stats.csv`

**Task 2: Distribution / Normality Analysis**
- Shapiro-Wilk, Kolmogorov-Smirnov, D'Agostino tests
- Q-Q plots, histograms per feature
- Skewness and kurtosis for all numerical features
- This determines parametric vs non-parametric test selection
- Output: `normality_tests.csv`

**Task 3: Correlation Analysis**
- Pearson (for normally distributed numerical features)
- Spearman (for non-normal / ordinal features)
- Point-biserial (for binary-continuous pairs)
- Heatmaps for both Pearson and Spearman
- Output: `correlation_matrix.csv`

**Task 4: Group Comparison Tests**
- For numerical features: Independent t-test (if normal) OR Mann-Whitney U (if non-normal)
- For categorical features: Chi-square test OR Fisher's exact test
- Report: test statistic, p-value, effect size (Cohen's d or rank-biserial correlation)
- Bonferroni correction for multiple comparisons
- Output: `group_comparison.csv`

**Task 5: ANOVA / Kruskal-Wallis**
- For multi-group comparisons (e.g., Age Groups vs. outcome)
- Post-hoc: Tukey HSD or Dunn's test
- Report effect sizes (η²)

**Task 6: Statistical Power Analysis**
- Calculate achieved power for each significant feature
- Report minimum detectable effect size
- Ensure power ≥ 0.80 for primary comparisons
- Reference: Cohen J "Statistical Power Analysis for the Behavioral Sciences" (1988)

**Task 7: Class Imbalance Analysis**
- Visualize class distribution
- Calculate imbalance ratio
- Document SMOTE + Class Weights strategy (see Section 3.2)
- Test SMOTE variants (ADASYN, Borderline-SMOTE, SMOTETomek) and document

**Task 8: Multicollinearity Check (VIF)**
- Calculate Variance Inflation Factor for all features
- Flag features with VIF > 10 (severe multicollinearity)
- Flag features with VIF > 5 (moderate multicollinearity)
- Decision: Remove or combine correlated features
- Reference: James G et al. "ISLR" (2013)

### Inputs
- `1_Data/Cleaned/cleaned_dataset.csv`
- `1_Data/Processed/feature_engineered_dataset.csv`
- `Phase1_Report.md`

### Outputs
- `3_Results/Phase2_Statistics/Phase2_Report.md`
- `3_Results/Phase2_Statistics/descriptive_stats.csv`
- `3_Results/Phase2_Statistics/normality_tests.csv`
- `3_Results/Phase2_Statistics/group_comparison.csv`
- `3_Results/Phase2_Statistics/correlation_matrix.csv`
- `3_Results/Phase2_Statistics/vif_analysis.csv`
- `3_Results/Phase2_Statistics/power_analysis.csv`
- `4_Figures/Phase2/distribution_analysis.{png,tiff}`
- `4_Figures/Phase2/pearson_heatmap.{png,tiff}`
- `4_Figures/Phase2/spearman_heatmap.{png,tiff}`
- `4_Figures/Phase2/class_distribution.{png,tiff}`
- `4_Figures/Phase2/qq_plots.{png,tiff}`
- `4_Figures/Phase2/group_comparison_boxplots.{png,tiff}`

---

## 11.4 PHASE 3: Intelligent Model Selection & Training

### Tasks (8 tasks)

**Task 1: Dataset Analysis for Model Selection**
- Analyze: sample size, feature count, sample-to-feature ratio, class balance
- Auto-recommend models based on dataset characteristics
- Document reasoning

**Task 2: Data Preparation**
- Train/test split: 80/20 stratified (primary) AND 70/30 stratified (secondary)
- Apply StandardScaler (fit on train only)
- Apply SMOTE on training set only
- Save splits for reproducibility

**Task 3: Class Imbalance Handling**
- Apply SMOTE + Class Weights (Section 3.2)
- Also test: ADASYN, SMOTETomek, Borderline-SMOTE
- Document which works best with each model

**Task 4: Define & Justify All Models**
- All 20+ models from Section 5
- For each: scientific justification, strengths, weaknesses
- Reference for each model selection decision

**Task 5: Hyperparameter Tuning (Optuna)**
- 100-200 Optuna trials per model (Section 6)
- Also run Grid/Random on 2-3 models for comparison
- Document Optuna vs Grid vs Random Search results
- Save Optuna study objects for visualization

**Task 6: Train & Evaluate All Models**
- Train all models with optimized hyperparameters
- Evaluate on test set: all metrics from Section 7.6
- Generate model comparison table
- Report with 8 random seeds (mean ± SD)

**Task 7: Ensemble Methods**
- Build Voting (Soft + Hard), Stacking, Blending ensembles
- Use top-5 base models as ensemble components
- Evaluate ensembles with same metrics

**Task 8: Deep Learning (MLP, TabNet)**
- Train MLP and TabNet
- Compare with classical models
- Document if deep learning provides improvement

### Inputs
- `1_Data/Processed/encoded_dataset.csv` (or feature_engineered version)
- `3_Results/Phase2_Statistics/Phase2_Report.md`

### Outputs
- `3_Results/Phase3_Models/Phase3_Report.md`
- `3_Results/Phase3_Models/model_comparison.csv`
- `3_Results/Phase3_Models/hyperparameter_results.csv`
- `3_Results/Phase3_Models/optimal_thresholds.csv`
- `3_Results/Phase3_Models/optuna_vs_grid_random.csv`
- `6_Models/Saved/*.joblib` (all trained models)
- `6_Models/Saved/hyperparameters.json`
- `4_Figures/Phase3/model_comparison_bar.{png,tiff}`
- `4_Figures/Phase3/optuna_optimization_history.{png,tiff}`

---

## 11.5 PHASE 4: Cross-Validation & Robustness Testing

### Tasks (10 tasks)

**Task 1: K-Fold Cross-Validation**
- 5-Fold AND 10-Fold Stratified CV
- Report: mean ± SD for all metrics

**Task 2: Stratified K-Fold**
- Verify stratification maintains class distribution

**Task 3: Leave-One-Out Cross-Validation (LOOCV)**
- N=2450 iterations
- Report: accuracy, AUC (from collected predictions)

**Task 4: Repeated K-Fold**
- 10-Fold × 10 repeats = 100 total folds
- Provides most stable estimate

**Task 5: Bootstrap Validation**
- 1000 bootstrap iterations with replacement
- Report: mean, SD, 95% CI for all metrics

**Task 6: Nested Cross-Validation**
- Outer: 5-fold, Inner: 3-fold
- Unbiased estimate with hyperparameter tuning
- Compare with non-nested to quantify optimistic bias

**Task 7: Overfitting Detection**
- Train vs. test metric comparison
- Flag models with gap > 5%
- Create regularized/adjusted variants for overfitting models
- Save both original and adjusted models

**Task 8: Learning Curves**
- Train sizes: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
- Plot training score vs validation score
- Diagnose: high bias vs high variance

**Task 9: Stability Analysis**
- Run all models with 8 different random seeds
- Report variation (SD) per model
- Flag models with SD > 2%

**Task 10: Robustness Testing**
- Inject 5%, 10%, 15% Gaussian noise
- Measure performance degradation
- Feature perturbation analysis
- Rank models by robustness

### Inputs
- `1_Data/Processed/encoded_dataset.csv`
- `6_Models/Saved/*.joblib`
- `3_Results/Phase3_Models/Phase3_Report.md`

### Outputs
- `3_Results/Phase4_Validation/Phase4_Report.md`
- `3_Results/Phase4_Validation/kfold_cv_results.csv`
- `3_Results/Phase4_Validation/loocv_results.csv`
- `3_Results/Phase4_Validation/bootstrap_results.csv`
- `3_Results/Phase4_Validation/nested_cv_results.csv`
- `3_Results/Phase4_Validation/overfitting_analysis.csv`
- `3_Results/Phase4_Validation/stability_analysis.csv`
- `3_Results/Phase4_Validation/robustness_results.csv`
- `3_Results/Phase4_Validation/learning_curves_data.csv`
- `3_Results/Phase4_Validation/delong_test_results.csv`
- `6_Models/Saved/*_adjusted.joblib` (regularized variants)
- `4_Figures/Phase4/learning_curves.{png,tiff}`
- `4_Figures/Phase4/bootstrap_distributions.{png,tiff}`
- `4_Figures/Phase4/stability_comparison.{png,tiff}`
- `4_Figures/Phase4/robustness_heatmap.{png,tiff}`
- `4_Figures/Phase4/overfitting_analysis.{png,tiff}`
- `4_Figures/Phase4/nested_cv_comparison.{png,tiff}`

---

## 11.6 PHASE 5: Explainable AI (XAI) & Clinical Interpretation

### Tasks (10 tasks)

**Task 1: Feature Importance (All Models)**
- Native importance: `feature_importances_` for tree-based, `|coef_|` for linear
- Normalize to 0-100% scale
- Compare top-10 features across models
- Output: feature_importance_comparison figure

**Task 2: Permutation Importance**
- `sklearn.inspection.permutation_importance` (30 repeats, `roc_auc`)
- For ALL models
- Report: mean ± std per feature per model

**Task 3: SHAP Analysis (Global & Local)**
- **Global:** Summary beeswarm + bar plots per model
- **Local:** Waterfall plots for 3 archetypes (High-Pos, High-Neg, Borderline)
- **Dependence:** Top-4 features per model
- TreeExplainer: XGBoost, RF, LightGBM, CatBoost, GradientBoosting, ExtraTrees
- KernelExplainer: SVM, LogisticRegression
- **Include SVM** (best model from Phase 4 with synthetic data — may differ with real data)

**Task 4: PDP & ICE Plots**
- Partial Dependence: top-4 features, 2×2 grid per model
- ICE overlay: individual + average lines
- For: XGBoost, RandomForest, and best model

**Task 5: LIME Explanations**
- 5 archetype samples (High-Pos, High-Neg, Borderline, True-Pos, False-Neg)
- For: XGBoost + best model (not just XGBoost)
- `num_features=10`

**Task 6: ROC Curves**
- Standard: all models overlaid, AUC in legend
- With CI: bootstrap 1000 iterations, 95% CI shaded bands
- Individual per-model ROC subplot

**Task 7: Precision-Recall Curves**
- All models on single plot
- Average Precision (AP) in legend
- No-skill baseline at class prevalence

**Task 8: Calibration Curves**
- Reliability diagrams (10 bins)
- Perfect calibration reference line
- For all models

**Task 9: Confusion Matrices**
- At threshold = 0.5 AND at optimal threshold (Youden's J)
- Report: Sensitivity, Specificity, PPV, NPV per model
- Use clinical variable names (not Feature_N)

**Task 10: Clinical Interpretation & Research Findings**
- Consensus feature ranking across all models + all XAI methods
- Clinical implications (what do top features mean for patient counseling?)
- Best model recommendation with justification
- Limitations section
- Future work recommendations (including external validation, temporal validation, CDSS)
- Literature comparison with published NOA prediction studies
- **Write in both English and Farsi**

### Inputs
- `1_Data/Processed/encoded_dataset.csv`
- `6_Models/Saved/*.joblib`
- `3_Results/Phase4_Validation/Phase4_Report.md`
- `feature_mapping.json` (Feature_N → clinical variable mapping)

### Outputs
- `3_Results/Phase5_XAI/Phase5_Report.md`
- `5_Reports/clinical_interpretation.md` (English + Farsi)
- `5_Reports/Final_Research_Findings.md`
- `5_Reports/Literature_Comparison.md`
- `5_Reports/Decision_Logger.md` (complete)
- `5_Reports/Overall_Comprehensive_Report.md`
- 16+ figure files (PNG + TIFF) in `4_Figures/Phase5/`:
  - `feature_importance_comparison`
  - `shap_summary_{model}` (per model)
  - `shap_bar_{model}` (per model)
  - `shap_waterfall_{model}_{case}` (per model × 3 cases)
  - `shap_dependence_{model}` (per model)
  - `pdp_{model}` (per model)
  - `ice_{model}` (per model)
  - `lime_{model}_{case}` (per model × 5 cases)
  - `roc_curves_comparison`
  - `roc_curves_with_ci`
  - `precision_recall_curves`
  - `calibration_curves`
  - `confusion_matrices`
  - `confusion_matrices_optimal_threshold`
  - `consensus_feature_ranking`

---

# 12. QUALITY REQUIREMENTS

## 12.1 Publication-Ready Standards
- All figures at ≥300 DPI in both PNG and TIFF
- All tables formatted for journal submission
- Statistical reporting follows APA/STARD/TRIPOD guidelines
- Confidence intervals reported for ALL primary metrics
- Effect sizes alongside p-values
- Sample size justification documented
- TRIPOD checklist compliance

## 12.2 Evidence-Based
- Every methodological decision cites a reference
- Prefer references from 2015-2025 (recent)
- Use landmark/seminal papers where appropriate (even if older)
- Decision Logger captures everything for thesis writing

## 12.3 Novelty Testing
- For every established method used, also test an alternative/novel approach
- If novel approach outperforms: document as a contribution
- If established method is better: document that we validated it
- This creates potential for publication novelty claims

## 12.4 Complete Documentation
- Every phase has its own report
- Overall comprehensive report at the end
- Decision Logger with ALL decisions + references
- Code is commented and documented
- Reproducibility: any researcher can re-run with the same results

## 12.5 Clinical Validity
- Use clinical variable names (not Feature_N) in all patient-facing reports
- Feature mapping JSON must be used to translate
- Clinical interpretation reviewed for medical accuracy
- Outlier decisions flagged for clinical team review

---

# 13. TECHNICAL SPECIFICATIONS

## 13.1 Python Environment

### Required Packages
```
# Core
pandas>=2.0
numpy>=1.24
scipy>=1.10
scikit-learn>=1.3

# Gradient Boosting
xgboost>=2.0
lightgbm>=4.0
catboost>=1.2

# Deep Learning
pytorch-tabnet>=4.0
torch>=2.0

# Imbalanced Learning
imbalanced-learn>=0.11

# Imputation
missingpy  # MissForest
sklearn  # IterativeImputer (MICE)

# XAI
shap>=0.43
lime>=0.2
eli5>=0.13

# Optimization
optuna>=3.0

# Visualization
matplotlib>=3.7
seaborn>=0.12
plotly>=5.15

# Statistical
statsmodels>=0.14
pingouin  # Effect sizes, power analysis

# Utilities
joblib
tqdm
openpyxl
pyxlsb  # For reading .xlsb files
```

## 13.2 Hardware Requirements
- **RAM:** ≥16 GB (for LOOCV with 2450 iterations)
- **Storage:** ≥10 GB (for models, figures, results)
- **CPU:** Multi-core recommended (for parallel CV)

## 13.3 Random State Convention
- **Primary seed:** 42
- **All seeds:** [42, 123, 456, 789, 1024, 2023, 2024, 3141]
- Always set `random_state` in all functions that accept it

## 13.4 Data Leakage Prevention Checklist
- ☐ SMOTE applied ONLY to training set
- ☐ Scaler fit ONLY on training set
- ☐ Imputation fit ONLY on training set
- ☐ Feature selection ONLY on training set
- ☐ Target variable NEVER used in feature engineering
- ☐ Test set NEVER seen during model tuning
- ☐ Outcome 2/3/4 columns DROPPED before any analysis

---

# 14. CLINICAL CONTEXT & DOMAIN KNOWLEDGE

## 14.1 What is NOA?
- **Non-Obstructive Azoospermia (NOA):** Complete absence of sperm in the ejaculate due to impaired spermatogenesis (not blockage)
- **Prevalence:** ~1% of all men, ~10% of infertile men
- **Treatment:** Micro-TESE (Microsurgical Testicular Sperm Extraction)
- **Success rate:** ~40-60% depending on etiology (matches our ~37.3% positive class)

## 14.2 Key Clinical Variables
- **FSH:** Elevated FSH (>12 IU/L) indicates primary testicular failure; very high FSH (>20) = severe
- **Testosterone:** Low (<300 ng/dL) indicates hypogonadism; may benefit from treatment before TESE
- **Testicular Volume:** Smaller testes = less spermatogenic tissue; bilateral atrophy (<4 mL each) = poor prognosis
- **Karyotype:** 46,XY = normal; 47,XXY = Klinefelter syndrome (most common genetic cause)
- **Y Chromosome Microdeletion:** AZFa/b deletions = very poor prognosis; AZFc = some chance of retrieval
- **Pathology (RT/LT):** Histopathological findings from testicular biopsy
- **Sakamoto Score:** Ultrasound-based testicular tissue characterization

## 14.3 Age Thresholds for NOA
| Age Group | Range | Clinical Significance |
|-----------|-------|----------------------|
| Young | <35 years | Optimal; baseline reference |
| Middle-aged | 35-39 years | Morphology decline begins |
| Advanced Paternal Age (APA) | 40-44 years | AUA/ASRM counseling threshold |
| Elderly | ≥45 years | Significantly reduced success rates |
| **Binary cutoff** | **40 years** | Most common in literature (AUA/ASRM) |

## 14.4 Expected Important Features (from literature)
Based on published NOA prediction studies, these features are typically most important:
1. FSH level (most consistently reported)
2. Testicular volume / size
3. Histopathology pattern
4. Karyotype / genetic status
5. Age
6. Testosterone level
7. Y chromosome microdeletion status
8. LH level
9. Inhibin B (excluded in our dataset — too many missing)
10. BMI (emerging evidence)

## 14.5 Future Work (to mention in reports)
- External validation on independent cohort
- Temporal validation (train on earlier, test on later patients)
- Web-based CDSS (Clinical Decision Support System) deployment
- Usability testing with physicians
- Cost-effectiveness analysis
- Multi-center validation study
- Prospective validation

---

# APPENDIX A: Feature Mapping JSON Reference

The complete mapping from `Feature_N` → clinical variable name is stored in:
```
[path]
```

This MUST be used in all XAI outputs and clinical reports to replace generic feature names with clinical variable names.

---

# APPENDIX B: Previous Work Status

### Synthetic Data Run (Completed — NOT valid for publication)
- Phases 1-5 were previously executed with **synthetic data** generated by `sklearn.make_classification()`
- All results are artificial and must be discarded
- The architecture, code structure, and methodology can be reused
- **AUC scores of 0.98+ were artifacts of synthetic data separability, not real clinical performance**

### What Must Be Redone from Scratch
| Phase | Must Redo? | Reason |
|-------|-----------|--------|
| Phase 0 | ✅ Minor | Replace dataset file only |
| Phase 1 | 🔴 FULL REDO | Real data has different patterns, missing values, outliers |
| Phase 2 | 🔴 FULL REDO | All statistics are data-dependent |
| Phase 3 | 🔴 FULL REDO | Models must be trained on real data |
| Phase 4 | 🔴 FULL REDO | Validation depends on trained models |
| Phase 5 | 🔴 FULL REDO | XAI depends on trained models |

### What CAN Be Reused
- ✅ Code structure & methodology
- ✅ Architecture templates
- ✅ Report templates & format
- ✅ Visualization code/style
- ✅ Pipeline design patterns
- ❌ All numerical results
- ❌ All figures & plots
- ❌ Feature rankings
- ❌ Clinical interpretations

---

# APPENDIX C: Key References Library

| # | Reference | Used For |
|---|-----------|----------|
| 1 | Chawla NV et al. "SMOTE" JAIR (2002) | Class imbalance - SMOTE |
| 2 | Fernández A et al. "Learning from Imbalanced Data Sets" Springer (2018) | Class imbalance - combined approach |
| 3 | He H & Garcia EA "Learning from Imbalanced Data" IEEE TKDE (2009) | Class imbalance overview |
| 4 | Stekhoven DJ & Bühlmann P. "MissForest" Bioinformatics (2012) | Missing data imputation |
| 5 | EMA ICH E9(R1) (2010/2020) | Missing data threshold |
| 6 | Collins GS et al. "TRIPOD" BMJ (2015) | Prediction model reporting |
| 7 | Guyon I & Elisseeff A. "Feature Selection" JMLR (2003) | Feature selection methodology |
| 8 | Aguinis H et al. "Outliers" ORM (2013) | Outlier detection and handling |
| 9 | Bouthillier X et al. "Variance in ML Benchmarks" MLSys (2021) | Multiple random seeds |
| 10 | Akiba T et al. "Optuna" KDD (2019) | Hyperparameter optimization |
| 11 | Bergstra J et al. "Hyper-Parameter Optimization" NIPS (2011) | Bayesian optimization |
| 12 | Cohen J "Statistical Power Analysis" (1988) | Power analysis |
| 13 | DeLong ER et al. "Comparing AUCs" Biometrics (1988) | AUC comparison |
| 14 | Lundberg SM & Lee SI "SHAP" NIPS (2017) | SHAP explanations |
| 15 | Ribeiro MT et al. "LIME" KDD (2016) | LIME explanations |
| 16 | Saeys Y et al. "Feature Selection in Bioinformatics" Bioinformatics (2007) | Feature selection |
| 17 | Vabalas A et al. "ML Validation with Limited Sample" PLoS ONE (2019) | Validation strategy |
| 18 | Hastie T et al. "ESL" (2009) | Train/test split |
| 19 | James G et al. "ISLR" (2013) | VIF / multicollinearity |
| 20 | Potdar K et al. "Categorical Encoding" (2017) | Encoding strategy |

---

# APPENDIX D: Execution Instructions for New AI agents trained by Hossein Jamalirad Chat

### How to Start a New Phase

1. **Upload this document** to the new AI agents trained by Hossein Jamalirad chat
2. **State:** "Execute Phase {N} of the NOA ML Master Specification"
3. **Provide:** The dataset file path (for Phase 0/1) or previous phase outputs
4. **The agent should:**
   - Read this entire specification
   - Follow the exact tasks defined for that phase
   - Use the evidence-based decisions and references specified
   - Generate all required outputs
   - Run the double-check points
   - Update the Decision Logger

### Phase Dependencies (Data Flow)
```
Phase 0 → 1_Data/Raw/original_dataset.csv
    ↓
Phase 1 → 1_Data/Cleaned/cleaned_dataset.csv + 1_Data/Processed/encoded_dataset.csv
    ↓
Phase 2 → 3_Results/Phase2_Statistics/ (all stats CSVs)
    ↓
Phase 3 → 6_Models/Saved/*.joblib + 3_Results/Phase3_Models/
    ↓
Phase 4 → 3_Results/Phase4_Validation/ (all validation CSVs)
    ↓
Phase 5 → 5_Reports/ (all final reports + figures)
```

### Critical Reminders for Each Phase
- **Always read this specification document first**
- **Always use clinical variable names** (not Feature_N) in reports
- **Always save figures as BOTH PNG and TIFF at 300 DPI**
- **Always update the Decision Logger with references**
- **Always run double-check points before moving to next phase**
- **Never apply SMOTE/scaling/imputation to test data**
- **Never use Outcome 2/3/4 — Outcome 1 only**
- **Target column name:** `Outcome1`
- **Dataset file:** `Book_11.17.2025_Dr. Rad_Final ID.xlsb` → Sheet: `Final Sheet`

---

*End of Master Specification Document*  
*Version 1.0 — Generated 2026-03-14*  
*Project: NOA ML — Non-Obstructive Azoospermia Sperm Retrieval Prediction*
