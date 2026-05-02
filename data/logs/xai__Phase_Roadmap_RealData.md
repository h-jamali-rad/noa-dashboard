# 🗺️ Phase Roadmap — NOA ML Project (Real Data Transition)
# نقشه راه فازها — پروژه ML بیماری NOA (انتقال به داده واقعی)

---

## 📌 Overview / خلاصه کلی

This document provides a complete roadmap of all 5 phases of the NOA ML project architecture, explains the inputs/outputs/tasks of each phase, and gives a **clear recommendation** on which phases must be re-executed when switching from synthetic data to real clinical data.

این سند نقشه راه کامل ۵ فاز معماری پروژه ML بیماری NOA را ارائه می‌دهد، ورودی‌ها/خروجی‌ها/وظایف هر فاز را توضیح می‌دهد، و **توصیه مشخصی** درباره اینکه کدام فازها باید با داده واقعی بالینی مجدداً اجرا شوند ارائه می‌کند.

---

## 🔄 Execution Order / ترتیب اجرا

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5
 Setup      Data         Stats &      Model        Cross-Val    Explainable
 & Init     Cleaning     Feature      Training     & Robust     AI (XAI)
                         Engineering
```

**⚠️ Every phase depends on the previous phase's output. They MUST be executed sequentially.**

**⚠️ هر فاز به خروجی فاز قبل وابسته است. اجرای ترتیبی الزامی است.**

---

---

# 📋 Phase 0: Project Setup & Initialization
# فاز ۰: راه‌اندازی و آماده‌سازی پروژه

### 🇬🇧 English

| Item | Details |
|------|---------|
| **Purpose** | Create project folder structure, install dependencies, copy raw dataset |
| **Tasks** | 1. Create standardized folder structure (`1_Data/`, `2_Code/`, `3_Results/`, `4_Figures/`, `5_Reports/`, `6_Models/`) — 2. Install all Python packages (scikit-learn, xgboost, shap, etc.) — 3. Create `requirements.txt` — 4. Copy dataset to `1_Data/Raw/` — 5. Initial dataset preview (shape, columns, dtypes) |
| **Inputs** | Raw dataset file (`.csv` or `.xlsx`) uploaded by user |
| **Outputs** | `requirements.txt`, `1_Data/Raw/original_dataset.csv`, `Phase0_Setup_Report.md` |

### 🇮🇷 فارسی

| مورد | جزئیات |
|------|---------|
| **هدف** | ایجاد ساختار پوشه‌های پروژه، نصب وابستگی‌ها، کپی دیتاست خام |
| **وظایف** | ۱. ایجاد ساختار پوشه‌های استاندارد — ۲. نصب تمام پکیج‌های پایتون — ۳. ایجاد `requirements.txt` — ۴. کپی دیتاست به `1_Data/Raw/` — ۵. بررسی اولیه دیتاست |
| **ورودی‌ها** | فایل دیتاست خام (`.csv` یا `.xlsx`) آپلود شده توسط کاربر |
| **خروجی‌ها** | `requirements.txt`، `original_dataset.csv`، `Phase0_Setup_Report.md` |

---

---

# 📋 Phase 1: Data Understanding & Cleaning
# فاز ۱: درک داده و پاکسازی

### 🇬🇧 English

| Item | Details |
|------|---------|
| **Purpose** | Thoroughly understand, clean, and prepare the raw dataset for analysis. This is the foundation — "Garbage In, Garbage Out." |
| **Tasks** | **Task 1:** Read & understand dataset (shape, columns, dtypes, memory) — **Task 2:** Intelligent data type detection (Binary, Categorical, Numerical Continuous/Discrete, Text, DateTime) — **Task 3:** Missing values analysis & imputation (median for skewed, mean for normal, mode for categorical; drop columns >50% missing) — **Task 4:** Outlier detection & handling (IQR method, Z-score; winsorize or cap) — **Task 5:** Duplicate & inconsistency check — **Task 6:** Data type corrections — **Task 7:** Initial Feature Engineering (ratios, age groups, binary indicators, interaction features) — **Task 8:** Encoding categorical variables (Label, One-Hot, Target encoding) — **Task 9:** Scaling numerical features (StandardScaler, RobustScaler, MinMaxScaler) — **Task 10:** Save cleaned dataset & report |
| **Inputs** | `1_Data/Raw/original_dataset.csv` |
| **Outputs** | `1_Data/Cleaned/cleaned_dataset.csv` — `1_Data/Processed/encoded_dataset.csv` — `3_Results/Phase1_DataCleaning/Phase1_Report.md` — Figures: `missing_values_analysis`, `outliers_boxplot`, `data_types_summary` (PNG + TIFF) |

### 🇮🇷 فارسی

| مورد | جزئیات |
|------|---------|
| **هدف** | درک کامل، پاکسازی و آماده‌سازی دیتاست خام. اساس کار — «داده کثیف = مدل نادرست» |
| **وظایف** | **تسک ۱:** خواندن و درک کامل دیتاست — **تسک ۲:** شناسایی هوشمند نوع داده‌ها — **تسک ۳:** تحلیل و مدیریت مقادیر گمشده — **تسک ۴:** شناسایی و مدیریت دورافتاده‌ها (Outliers) — **تسک ۵:** بررسی تکراری‌ها و ناسازگاری‌ها — **تسک ۶:** تصحیح نوع داده‌ها — **تسک ۷:** مهندسی ویژگی اولیه (نسبت‌ها، گروه‌بندی سنی، شاخص‌های باینری، ویژگی‌های تعاملی) — **تسک ۸:** رمزگذاری متغیرهای دسته‌ای — **تسک ۹:** مقیاس‌بندی ویژگی‌های عددی — **تسک ۱۰:** ذخیره دیتاست تمیز و گزارش |
| **ورودی‌ها** | `1_Data/Raw/original_dataset.csv` |
| **خروجی‌ها** | `cleaned_dataset.csv` — `encoded_dataset.csv` — `Phase1_Report.md` — نمودارها: تحلیل گمشده‌ها، باکس‌پلات دورافتاده‌ها، خلاصه نوع داده‌ها |

---

---

# 📋 Phase 2: Advanced Statistical Analysis
# فاز ۲: تحلیل آماری پیشرفته

### 🇬🇧 English

| Item | Details |
|------|---------|
| **Purpose** | Scientific statistical foundation before any modeling. Understand distributions, relationships, group differences, and statistical power. Essential for peer-reviewed publication. |
| **Tasks** | **Task 1:** Comprehensive descriptive statistics (mean, std, median, IQR, CI — overall & by target group) — **Task 2:** Distribution / normality analysis (Shapiro-Wilk, K-S, D'Agostino; Q-Q plots, histograms) — **Task 3:** Correlation analysis (Pearson, Spearman, Point-biserial; heatmaps) — **Task 4:** Group comparison tests (t-test or Mann-Whitney U for 2 groups, with effect sizes) — **Task 5:** ANOVA / Kruskal-Wallis (for multi-group comparisons) — **Task 6:** Statistical power analysis — **Task 7:** Class imbalance analysis (ratio, visualization, SMOTE strategy) — **Task 8:** Multicollinearity check (VIF) |
| **Inputs** | `1_Data/Cleaned/cleaned_dataset.csv` — `Phase1_Report.md` |
| **Outputs** | `3_Results/Phase2_Statistics/Phase2_Report.md` — `descriptive_stats.csv` — `normality_tests.csv` — `group_comparison.csv` — `correlation_matrix.csv` — Figures: `distribution_analysis`, `pearson_heatmap`, `spearman_heatmap`, `class_distribution` (PNG + TIFF) |

### 🇮🇷 فارسی

| مورد | جزئیات |
|------|---------|
| **هدف** | پایه‌گذاری آماری علمی قبل از هر مدل‌سازی. درک توزیع‌ها، روابط، تفاوت‌های گروهی، و قدرت آماری. ضروری برای انتشار در ژورنال. |
| **وظایف** | **تسک ۱:** آمار توصیفی جامع — **تسک ۲:** تحلیل توزیع و نرمالیتی — **تسک ۳:** تحلیل همبستگی — **تسک ۴:** آزمون‌های مقایسه گروهی — **تسک ۵:** آنوا / کروسکال-والیس — **تسک ۶:** تحلیل قدرت آماری — **تسک ۷:** تحلیل عدم توازن کلاس — **تسک ۸:** بررسی هم‌خطی (VIF) |
| **ورودی‌ها** | `cleaned_dataset.csv` — `Phase1_Report.md` |
| **خروجی‌ها** | `Phase2_Report.md` — فایل‌های CSV آمار توصیفی، نرمالیتی، مقایسه گروهی، ماتریس همبستگی — نمودارهای توزیع، هیت‌مپ، توزیع کلاس |

### 🔧 Where is Feature Engineering? / مهندسی ویژگی کجاست؟

> **Feature Engineering is split between Phase 1 and Phase 2:**
>
> - **Phase 1 (Task 7):** *Initial* feature engineering — creating domain-specific features like FSH/LH ratio, age groups, binary indicators (e.g., Low_Testosterone), interaction features. These are created based on **domain knowledge** before any statistical analysis.
>
> - **Phase 2 (Tasks 3, 7, 8):** *Informed* feature decisions — After correlation analysis, VIF check, and class imbalance analysis, you decide which features to **keep, remove, or transform**. Multicollinearity removal (VIF > 10) effectively reshapes the feature set. Class imbalance handling (SMOTE) also modifies the training data.
>
> **In summary:** Phase 1 = **create** features. Phase 2 = **evaluate & refine** features.

> **مهندسی ویژگی بین فاز ۱ و فاز ۲ تقسیم شده:**
>
> - **فاز ۱ (تسک ۷):** مهندسی ویژگی *اولیه* — ایجاد ویژگی‌های تخصصی حوزه مثل نسبت FSH/LH، گروه‌بندی سنی، شاخص‌های باینری. بر اساس **دانش حوزه** و قبل از تحلیل آماری.
>
> - **فاز ۲ (تسک‌های ۳، ۷، ۸):** تصمیمات *آگاهانه* درباره ویژگی‌ها — پس از تحلیل همبستگی، بررسی VIF، و تحلیل عدم توازن، تصمیم گرفته می‌شود کدام ویژگی‌ها **حفظ، حذف، یا تبدیل** شوند.
>
> **خلاصه:** فاز ۱ = **ایجاد** ویژگی‌ها. فاز ۲ = **ارزیابی و اصلاح** ویژگی‌ها.

---

---

# 📋 Phase 3: Intelligent Model Selection & Training
# فاز ۳: انتخاب هوشمند مدل و آموزش

### 🇬🇧 English

| Item | Details |
|------|---------|
| **Purpose** | Select, tune, and train the best ML models based on dataset characteristics. Binary classification (sperm retrieval success/failure). |
| **Tasks** | **Task 1:** Dataset analysis for model selection (sample size, feature count, class balance → model recommendations) — **Task 2:** Data preparation (train/test split 80/20 stratified, StandardScaler fit on train only) — **Task 3:** Class imbalance handling (SMOTE, ADASYN, class weights) — **Task 4:** Define models with scientific justification (Logistic Regression, Decision Tree, Random Forest, XGBoost, LightGBM, CatBoost, SVM, KNN, Naive Bayes, Gradient Boosting) — **Task 5:** Hyperparameter tuning (Optuna/Bayesian optimization) — **Task 6:** Train all models & evaluate (Accuracy, Precision, Recall, F1, AUC-ROC, MCC) — **Task 7:** Ensemble methods (Voting, Stacking, Blending) — **Task 8:** Deep Learning optional (MLP, TabNet for large datasets) |
| **Inputs** | `1_Data/Processed/encoded_dataset.csv` — `Phase2_Report.md` |
| **Outputs** | `3_Results/Phase3_Models/Phase3_Report.md` — `model_comparison.csv` — `6_Models/Saved/*.joblib` (all trained models) — `hyperparameter_results.csv` |

### 🇮🇷 فارسی

| مورد | جزئیات |
|------|---------|
| **هدف** | انتخاب، تنظیم و آموزش بهترین مدل‌های ML بر اساس ویژگی‌های دیتاست. طبقه‌بندی دودویی (موفقیت/عدم موفقیت بازیابی اسپرم). |
| **وظایف** | **تسک ۱:** تحلیل دیتاست برای انتخاب مدل — **تسک ۲:** آماده‌سازی داده (تقسیم ۸۰/۲۰ طبقه‌بندی شده) — **تسک ۳:** مدیریت عدم توازن کلاس — **تسک ۴:** تعریف مدل‌ها با دلایل علمی (LR، DT، RF، XGBoost، LightGBM، CatBoost، SVM، KNN، NB، GB) — **تسک ۵:** تنظیم هایپرپارامترها (Optuna) — **تسک ۶:** آموزش و ارزیابی تمام مدل‌ها — **تسک ۷:** روش‌های ترکیبی (Voting، Stacking) — **تسک ۸:** یادگیری عمیق (اختیاری) |
| **ورودی‌ها** | `encoded_dataset.csv` — `Phase2_Report.md` |
| **خروجی‌ها** | `Phase3_Report.md` — `model_comparison.csv` — مدل‌های ذخیره شده `*.joblib` — `hyperparameter_results.csv` |

---

---

# 📋 Phase 4: Cross-Validation & Robustness Testing
# فاز ۴: اعتبارسنجی متقابل و آزمون پایداری

### 🇬🇧 English

| Item | Details |
|------|---------|
| **Purpose** | Ensure models are generalizable, stable, not overfitting, and reliable for clinical use. Peer reviewers require this. |
| **Tasks** | **Task 1:** K-Fold Cross-Validation (5-Fold, 10-Fold) — **Task 2:** Stratified K-Fold — **Task 3:** Leave-One-Out Cross-Validation (LOOCV) — **Task 4:** Repeated K-Fold — **Task 5:** Bootstrap Validation — **Task 6:** Nested Cross-Validation — **Task 7:** Overfitting detection (train vs. test gap analysis) — **Task 8:** Learning curves — **Task 9:** Stability analysis — **Task 10:** Robustness testing (noise & perturbation) |
| **Inputs** | `1_Data/Processed/encoded_dataset.csv` — `6_Models/Saved/*.joblib` — `Phase3_Report.md` |
| **Outputs** | `3_Results/Phase4_Validation/Phase4_Report.md` — `kfold_results.csv` — `loocv_results.csv` — `bootstrap_results.csv` — `overfitting_analysis.csv` — `stability_analysis.csv` — `robustness_results.csv` — Figures: `learning_curves` (PNG + TIFF) |

### 🇮🇷 فارسی

| مورد | جزئیات |
|------|---------|
| **هدف** | اطمینان از تعمیم‌پذیری، پایداری، عدم بیش‌برازش، و قابلیت اطمینان مدل‌ها برای استفاده بالینی. |
| **وظایف** | **تسک ۱:** اعتبارسنجی متقابل K-Fold — **تسک ۲:** K-Fold طبقه‌بندی شده — **تسک ۳:** LOOCV — **تسک ۴:** K-Fold تکراری — **تسک ۵:** اعتبارسنجی بوت‌استرپ — **تسک ۶:** اعتبارسنجی متقابل تودرتو — **تسک ۷:** تشخیص بیش‌برازش — **تسک ۸:** منحنی‌های یادگیری — **تسک ۹:** تحلیل پایداری — **تسک ۱۰:** آزمون استحکام (نویز و اختلال) |
| **ورودی‌ها** | `encoded_dataset.csv` — مدل‌های ذخیره شده `*.joblib` — `Phase3_Report.md` |
| **خروجی‌ها** | `Phase4_Report.md` — نتایج K-Fold، LOOCV، بوت‌استرپ، بیش‌برازش، پایداری، استحکام — نمودار منحنی‌های یادگیری |

---

---

# 📋 Phase 5: Explainable AI (XAI) & Clinical Interpretation
# فاز ۵: هوش مصنوعی قابل تفسیر و تفسیر بالینی

### 🇬🇧 English

| Item | Details |
|------|---------|
| **Purpose** | Make models interpretable for clinicians. Without XAI, ML models won't be used in clinical practice. Required by regulatory bodies (FDA, EMA). |
| **Tasks** | **Task 1:** Feature importance (all models) — **Task 2:** Permutation importance — **Task 3:** SHAP analysis (global & local: summary, bar, waterfall, dependence plots) — **Task 4:** Partial Dependence Plots (PDP) & ICE — **Task 5:** LIME explanations — **Task 6:** ROC curves (standard + with CI) — **Task 7:** Precision-Recall curves — **Task 8:** Calibration curves — **Task 9:** Confusion matrices — **Task 10:** Clinical interpretation & actionable insights |
| **Inputs** | `1_Data/Processed/encoded_dataset.csv` — `6_Models/Saved/*.joblib` — `Phase4_Report.md` |
| **Outputs** | `Phase5_Report.md` — Figures: feature importance, SHAP (summary, bar, waterfall, dependence), PDP, ICE, LIME, ROC curves (with CI), PR curves, calibration curves, confusion matrices (all PNG + TIFF) — `clinical_interpretation.md` — `Final_Research_Findings.md` |
| **Status** | ✅ **Already completed** with synthetic data |

### 🇮🇷 فارسی

| مورد | جزئیات |
|------|---------|
| **هدف** | قابل تفسیر کردن مدل‌ها برای پزشکان. بدون XAI، مدل‌های ML در عمل بالینی استفاده نمی‌شوند. الزامات نهادهای نظارتی. |
| **وظایف** | **تسک ۱:** اهمیت ویژگی‌ها — **تسک ۲:** اهمیت جایگشتی — **تسک ۳:** تحلیل SHAP — **تسک ۴:** نمودارهای وابستگی جزئی (PDP) و ICE — **تسک ۵:** توضیحات LIME — **تسک ۶:** منحنی‌های ROC — **تسک ۷:** منحنی‌های Precision-Recall — **تسک ۸:** منحنی‌های کالیبراسیون — **تسک ۹:** ماتریس‌های سردرگمی — **تسک ۱۰:** تفسیر بالینی |
| **ورودی‌ها** | `encoded_dataset.csv` — مدل‌های ذخیره شده — `Phase4_Report.md` |
| **خروجی‌ها** | `Phase5_Report.md` — تمام نمودارهای XAI — `clinical_interpretation.md` — `Final_Research_Findings.md` |
| **وضعیت** | ✅ **قبلاً با داده مصنوعی انجام شده** |

---

---

# 🔁 Data Flow Diagram / نمودار جریان داده

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW BETWEEN PHASES                        │
│                      جریان داده بین فازها                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Raw Dataset]                                                           │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────┐   cleaned_dataset.csv    ┌─────────┐                       │
│  │ Phase 0 │ ─── original_dataset ──→ │ Phase 1 │                       │
│  │  Setup  │                          │ Cleaning│                       │
│  └─────────┘                          └────┬────┘                       │
│                                            │                             │
│                              cleaned_dataset.csv                         │
│                              encoded_dataset.csv                         │
│                                            │                             │
│                                            ▼                             │
│                                       ┌─────────┐                       │
│                                       │ Phase 2 │                       │
│                                       │  Stats  │                       │
│                                       └────┬────┘                       │
│                                            │                             │
│                              encoded_dataset.csv                         │
│                              Phase2_Report.md                            │
│                                            │                             │
│                                            ▼                             │
│                                       ┌─────────┐                       │
│                                       │ Phase 3 │                       │
│                                       │ Models  │                       │
│                                       └────┬────┘                       │
│                                            │                             │
│                              encoded_dataset.csv                         │
│                              *.joblib (trained models)                   │
│                              Phase3_Report.md                            │
│                                            │                             │
│                                            ▼                             │
│                                       ┌─────────┐                       │
│                                       │ Phase 4 │                       │
│                                       │ Valid.  │                       │
│                                       └────┬────┘                       │
│                                            │                             │
│                              encoded_dataset.csv                         │
│                              *.joblib (trained models)                   │
│                              Phase4_Report.md                            │
│                                            │                             │
│                                            ▼                             │
│                                       ┌─────────┐                       │
│                                       │ Phase 5 │                       │
│                                       │  XAI    │                       │
│                                       └─────────┘                       │
│                                            │                             │
│                                            ▼                             │
│                                   Final Research Report                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

---

# ⚠️ CRITICAL: Which Phases Must Be Redone with Real Data?
# ⚠️ بحرانی: کدام فازها باید با داده واقعی مجدداً اجرا شوند؟

## 🔴 Answer: ALL phases (1 through 5) must be re-executed
## 🔴 پاسخ: تمام فازها (۱ تا ۵) باید مجدداً اجرا شوند

### Detailed Justification / توجیه تفصیلی

| Phase | Must Redo? | Why? |
|-------|-----------|------|
| **Phase 0** | ✅ Yes (minor) | Only need to replace the dataset file. Folder structure and dependencies remain the same. |
| **Phase 1** | 🔴 **YES — FULL REDO** | Real data will have completely different missing value patterns, outliers, data types, inconsistencies, and feature distributions. Every cleaning decision is data-dependent. Feature engineering ratios/thresholds change. |
| **Phase 2** | 🔴 **YES — FULL REDO** | All statistics (descriptive, normality, correlations, group comparisons, power analysis, VIF) are 100% data-dependent. Synthetic data statistics are meaningless for real clinical interpretation. |
| **Phase 3** | 🔴 **YES — FULL REDO** | Models must be retrained from scratch. Hyperparameters tuned on synthetic data are irrelevant. Class imbalance ratios will differ. Model selection recommendations change with real data characteristics. |
| **Phase 4** | 🔴 **YES — FULL REDO** | Cross-validation, bootstrap, LOOCV, learning curves, stability, and robustness results are all model+data dependent. Old validation is invalid. |
| **Phase 5** | 🔴 **YES — FULL REDO** | SHAP values, feature importance, PDP, LIME, ROC curves, calibration — everything is derived from the trained models. New models = all new XAI analysis. Clinical interpretation completely changes. |

### 🇮🇷 توجیه فارسی

| فاز | نیاز به اجرای مجدد؟ | چرا؟ |
|-----|---------------------|------|
| **فاز ۰** | ✅ بله (جزئی) | فقط جایگزینی فایل دیتاست. ساختار پوشه‌ها و وابستگی‌ها همان هستند. |
| **فاز ۱** | 🔴 **بله — کامل** | داده واقعی الگوهای گمشدگی، دورافتاده‌ها، نوع داده‌ها و ناسازگاری‌های کاملاً متفاوتی دارد. تمام تصمیمات پاکسازی وابسته به داده هستند. |
| **فاز ۲** | 🔴 **بله — کامل** | تمام آمارها (توصیفی، نرمالیتی، همبستگی، مقایسه گروهی، قدرت آماری، VIF) ۱۰۰٪ وابسته به داده هستند. آمار داده مصنوعی برای تفسیر بالینی واقعی بی‌معناست. |
| **فاز ۳** | 🔴 **بله — کامل** | مدل‌ها باید از صفر آموزش ببینند. هایپرپارامترهای تنظیم شده روی داده مصنوعی بی‌ربط هستند. |
| **فاز ۴** | 🔴 **بله — کامل** | اعتبارسنجی متقابل، بوت‌استرپ، منحنی‌های یادگیری — همه وابسته به مدل و داده هستند. |
| **فاز ۵** | 🔴 **بله — کامل** | مقادیر SHAP، اهمیت ویژگی‌ها، PDP، LIME، منحنی‌های ROC — همه از مدل‌های آموزش‌دیده مشتق می‌شوند. مدل‌های جدید = تحلیل XAI کاملاً جدید. |

---

## ✅ Recommended Execution Plan for Real Data
## ✅ برنامه اجرایی پیشنهادی برای داده واقعی

```
Step 1: Phase 0 — Replace dataset file (quick, ~5 min)
           فاز ۰ — جایگزینی فایل دیتاست (سریع، ~۵ دقیقه)

Step 2: Phase 1 — Full data cleaning with real data
           فاز ۱ — پاکسازی کامل داده با داده واقعی
           ⚡ Ask user: target column, columns to drop, domain-specific thresholds
           ⚡ از کاربر بپرسید: ستون هدف، ستون‌های حذفی، آستانه‌های تخصصی

Step 3: Phase 2 — Full statistical analysis
           فاز ۲ — تحلیل آماری کامل
           ⚡ Clinical significance matters more than p-values
           ⚡ اهمیت بالینی مهم‌تر از p-value است

Step 4: Phase 3 — Train all models from scratch
           فاز ۳ — آموزش تمام مدل‌ها از صفر
           ⚡ Model selection based on REAL data characteristics
           ⚡ انتخاب مدل بر اساس ویژگی‌های داده واقعی

Step 5: Phase 4 — Full validation suite
           فاز ۴ — مجموعه اعتبارسنجی کامل
           ⚡ This is what reviewers look at most carefully
           ⚡ این چیزی است که داوران با دقت بیشتری بررسی می‌کنند

Step 6: Phase 5 — Complete XAI analysis
           فاز ۵ — تحلیل XAI کامل
           ⚡ Clinical interpretation is the key deliverable
           ⚡ تفسیر بالینی مهم‌ترین خروجی است
```

---

## 💡 What Can Be Reused from Phase 5 (Current Work)?
## 💡 چه چیزی از فاز ۵ فعلی قابل استفاده مجدد است؟

| Reusable | Not Reusable |
|----------|-------------|
| ✅ Code structure & methodology | ❌ All numerical results |
| ✅ Architecture/prompt templates | ❌ All figures & plots |
| ✅ Report templates & format | ❌ SHAP values & feature rankings |
| ✅ Visualization code/style | ❌ Clinical interpretations |
| ✅ Pipeline design patterns | ❌ Model performance metrics |

| قابل استفاده مجدد | غیرقابل استفاده مجدد |
|-------------------|---------------------|
| ✅ ساختار کد و روش‌شناسی | ❌ تمام نتایج عددی |
| ✅ قالب‌های معماری/پرامپت | ❌ تمام نمودارها |
| ✅ قالب‌های گزارش و فرمت | ❌ مقادیر SHAP و رتبه‌بندی ویژگی‌ها |
| ✅ کد/سبک بصری‌سازی | ❌ تفسیرهای بالینی |
| ✅ الگوهای طراحی پایپلاین | ❌ معیارهای عملکرد مدل |

---

## 📝 Final Note / یادداشت نهایی

> **The architecture files (Phase 1–5 `.md` files) are your blueprints — they do NOT need to change.** Simply re-execute each phase with the real dataset as input. The intelligent decision-making logic in each phase will adapt to the real data automatically.

> **فایل‌های معماری (فایل‌های `.md` فاز ۱ تا ۵) نقشه‌های ساختمانی شما هستند — نیازی به تغییر ندارند.** فقط هر فاز را با دیتاست واقعی به عنوان ورودی مجدداً اجرا کنید. منطق تصمیم‌گیری هوشمند در هر فاز به طور خودکار با داده واقعی تطبیق پیدا می‌کند.

---

*Generated: March 13, 2026*
*Project: NOA ML — Non-Obstructive Azoospermia Sperm Retrieval Prediction*
