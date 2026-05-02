# Phase 5 – Input Inventory Report

## 1. Excel File: `Book_11.17.2025_Dr. Rad_Final ID.xlsb`

**Sheet:** `Final Sheet` | **Rows:** 2,450 patients | **Columns:** 55

This is the **original clinical dataset** with full variable names. It is the key to mapping the anonymised `Feature_1 … Feature_36` used in modelling back to their real clinical meaning.

### Complete Column Inventory

| Idx | Original Column Name | Category |
|-----|----------------------|----------|
| 0 | ID | Identifier |
| 1 | Roy-ID | Identifier |
| 2 | Age | Demographics |
| 3 | Pathology-RT | Pathology |
| 4 | Pathology-LT | Pathology |
| 5 | Partner-age covariate (excluded) | Demographics |
| 6 | Race | Demographics |
| 7 | Infertile family members | History |
| 8 | Habits | Lifestyle |
| 9 | Height | Anthropometrics |
| 10 | Body Weight | Anthropometrics |
| 11 | BMI | Anthropometrics |
| 12 | Occupation (Exposure to toxic substances) | Lifestyle / Exposure |
| 13 | Diabetes | Comorbidity |
| 14 | Hypertension | Comorbidity |
| 15 | Surgery trauma(s) | Surgical History |
| 16 | Varicocele | Surgical History |
| 17 | T.BX (Testicular Biopsy) | Surgical History |
| 18 | Inguinal hernia | Surgical History |
| 19 | Torsion of spermatic cord | Surgical History |
| 20 | Cancer Type | Oncology |
| 21 | Cancer Treatment | Oncology |
| 22 | Orchiopexy | Surgical History |
| 23 | Infertility length | Clinical |
| 24 | Testis Size right (Sono) | Imaging / Exam |
| 25 | RT Size (Orchidometer) | Imaging / Exam |
| 26 | RT-XYZ (Sono) | Imaging / Exam |
| 27 | Testis Size left (Sono) | Imaging / Exam |
| 28 | LT Size (Orchidometer) | Imaging / Exam |
| 29 | LT-XYZ (Sono) | Imaging / Exam |
| 30 | Sakamoto-RT/mL | Imaging / Exam |
| 31 | Sakamoto-LT/mL | Imaging / Exam |
| 32 | Testicular volume_RT (Guess) | Imaging / Exam |
| 33 | Testicular volume_LT (Guess) | Imaging / Exam |
| 34 | Seminal plasma pH | Lab Values |
| 35 | Testosterone levels | Hormonal |
| 36 | LH | Hormonal |
| 37 | FSH | Hormonal |
| 38 | Prolactin | Hormonal |
| 39 | TSH | Hormonal |
| 40 | E2 (Estradiol) | Hormonal |
| 41 | Sex Hormone-Binding Globulin | Hormonal |
| 42 | Inhibin B | Hormonal |
| 43 | AMH | Hormonal |
| 44 | Karyotype | Genetics |
| 45 | Y chromosome microdeletion (AZFa/b/c) | Genetics |
| 46 | Surgery Therapeutic | Outcome / Treatment |
| 47 | Successful Sperm Retrieval-1 | Outcome (text) |
| 48 | Outcome1 | **Target (binary)** |
| 49 | Successful Sperm Retrieval-2 | Outcome (text) |
| 50 | Outcome2 | Target (binary) |
| 51 | Successful Sperm Retrieval-3 | Outcome (text) |
| 52 | Outcome3 | Target (binary) |
| 53 | Successful Sperm Retrieval-4 | Outcome (text) |
| 54 | Outcome4 | Target (binary) |

### Feature Mapping Note
The encoded dataset uses **Feature_1 … Feature_36 + TARGET** (37 columns, 2,450 rows). The exact mapping from `Feature_N` → original column must be reconstructed by comparing value distributions, since the Excel has 55 columns (including IDs and multiple outcome columns) while the encoded set has 36 features + 1 target.

---

## 2. Chat_4 (Phase 4) Output Files

**Location:** `[path]`

### 2a. Data
| File | Description |
|------|-------------|
| `NOA_ML_Project/1_Data/Processed/encoded_dataset.csv` | Encoded dataset (2450 × 37): Feature_1–Feature_36 + TARGET |

### 2b. Code (Phase 4 Scripts)
| File | Description |
|------|-------------|
| `phase4_part1_complete.py` | Full Phase 4 Part 1 pipeline |
| `phase4_part1_optimized.py` | Optimized variant |
| `phase4_part1_validation.py` | Part 1 validation logic |
| `phase4_part2_tasks5_8.py` | Tasks 5–8 (robustness, noise, etc.) |
| `phase4_part2_validation.py` | Part 2 validation logic |
| `phase4_tasks5_8_fast.py` | Fast variant of tasks 5–8 |
| `phase4_tasks5_8_optimized.py` | Optimized variant |
| `phase4_tasks9_10.py` | Tasks 9–10 |
| `phase4_tasks9_10_fast.py` | Fast variant |
| `phase4_loocv_only.py` | LOOCV-specific script |

### 2c. Results CSVs
| File | Description |
|------|-------------|
| `bootstrap_validation_results.csv` | Bootstrap validation per model |
| `kfold_cv_results.csv` | K-fold cross-validation results |
| `kfold_fold_details.csv` | Per-fold breakdown |
| `kfold_loocv_comparison.csv` | K-fold vs LOOCV comparison |
| `learning_curves_data.csv` | Learning curve data points |
| `loocv_results.csv` | Leave-one-out CV results |
| `nested_cv_results.csv` | Nested CV results |
| `overfitting_analysis.csv` | Overfitting diagnostic |
| `overfitting_adjustments.csv` | Adjusted model parameters |
| `repeated_kfold_results.csv` | Repeated K-fold results |
| `repeated_kfold_fold_details.csv` | Per-fold details |
| `robustness_noise_results.csv` | Noise robustness testing |
| `stability_analysis.csv` | Model stability analysis |
| `stability_seeds_analysis.csv` | Seed-sensitivity analysis |
| `Phase4_Final_Results.json` | Master results JSON |
| `phase4_part1_summary.json` | Part 1 summary |
| `phase4_part2_summary.json` | Part 2 summary |

### 2d. Bootstrap Checkpoints (per model)
15 models: CatBoost, DecisionTree, ExtraTrees, GradientBoosting, KNN, LightGBM, LogisticRegression, MLP, NaiveBayes, RandomForest, SVM, StackingEnsemble, TabNet, VotingEnsemble, XGBoost

### 2e. Figures (PNG + TIFF pairs)
| Figure | Content |
|--------|---------|
| `5fold_auc_heatmap` | 5-fold AUC heatmap |
| `10fold_auc_heatmap` | 10-fold AUC heatmap |
| `bootstrap_auc_distributions` | Bootstrap AUC distributions |
| `bootstrap_ci_comparison` | Bootstrap CI comparison |
| `learning_curves_all_models` | Learning curves |
| `learning_curves_bias_variance` | Bias-variance decomposition |
| `model_performance_comparison` | Overall model comparison |
| `nested_cv_comparison` | Nested CV comparison |
| `overfitting_analysis` | Overfitting analysis |
| `repeated_kfold_comparison` | Repeated K-fold comparison |
| `robustness_heatmap` | Robustness heatmap |
| `robustness_noise_degradation` | Noise degradation curves |
| `stability_comparison` | Stability comparison |
| `stability_seeds_boxplot` | Seed stability boxplot |
| `top5_radar_comparison` | Top-5 model radar chart |

### 2f. Reports
| File | Description |
|------|-------------|
| `Phase4_Validation_Report.md / .pdf` | Full technical report |
| `Phase4_Executive_Summary.md / .pdf` | Executive summary |
| `Phase4_Summary_FA.md / .pdf` | Farsi summary |
| `Phase4_Part1_Report.md / .pdf` | Part 1 detailed report |
| `Phase4_Assessment_Report.md / .pdf` | Overall assessment |
| `Chat4_Tasks_Summary_FA.md / .pdf` | Farsi task summary |

### 2g. Saved Models (`.joblib`)
15 base models + 12 adjusted variants = **27 model files**

### 2h. Uploaded Inputs to Phase 4
| File | Description |
|------|-------------|
| `Phase3_IntelligentModelSelection_Report.md` | Phase 3 report |
| `bootstrap_ci_results.csv` | Phase 3 bootstrap CIs |
| `dca_results.csv` | Decision curve analysis |
| `delong_test_results.csv` | DeLong test results |
| `final_results.json` | Phase 3 final results |
| `model_comparison.csv` | Phase 3 model comparison |
| `optimal_thresholds.csv` | Optimal thresholds |
| `chat_architecture_summary.md` | Architecture summary |

---

## Key Takeaway for Phase 5

✅ **The Excel file IS the clinical feature dictionary.** It contains 55 original variable names (demographics, anthropometrics, hormonal, imaging, genetics, outcomes) that can map back to the 36 anonymised features in the encoded dataset.

✅ **Phase 4 provides a rich set of validated outputs**: cross-validation results, bootstrap CIs, robustness/stability analyses, learning curves, 27 saved models, and 15 publication-quality figures — all ready for Phase 5 interpretation and clinical translation.
