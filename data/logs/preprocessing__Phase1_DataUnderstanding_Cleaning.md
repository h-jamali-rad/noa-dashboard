# 🔬 Phase 1: Data Understanding & Cleaning

═══════════════════════════════════════════════════════════════════════════════
## CONTEXT - این فاز چیست و چرا مهم است
═══════════════════════════════════════════════════════════════════════════════

**Data Cleaning** مهم‌ترین مرحله در هر پروژه ML است. داده‌های کثیف منجر به مدل‌های نادرست می‌شوند (Garbage In, Garbage Out).

**اهمیت در پزشکی:**
- داده‌های پزشکی معمولاً پر از missing values هستند
- Outliers ممکن است biological باشند نه error
- Data quality مستقیماً بر clinical decisions تأثیر می‌گذارد

**این فاز شامل:**
1. درک کامل ساختار داده
2. شناسایی و مدیریت Missing Values
3. تشخیص و برخورد با Outliers
4. بررسی Duplicates و Inconsistencies
5. Feature Engineering اولیه
6. Encoding و Scaling

═══════════════════════════════════════════════════════════════════════════════
## INPUTS - فایل‌های ورودی
═══════════════════════════════════════════════════════════════════════════════

**فایل‌های ضروری:**
```
[path]
```

**فایل‌های اختیاری:**
- `Phase0_Setup_Report.md` - گزارش فاز قبلی

═══════════════════════════════════════════════════════════════════════════════
## TASKS - کارهایی که باید انجام دهی
═══════════════════════════════════════════════════════════════════════════════

---
### 📋 TASK 1: خواندن و درک کامل دیتاست
---

```python
import pandas as pd
import numpy as np

# Load data
df = pd.read_csv("[path]")

print("=" * 80)
print("📊 COMPREHENSIVE DATA UNDERSTANDING")
print("=" * 80)

# Basic info
print(f"\n📐 Shape: {df.shape[0]} rows × {df.shape[1]} columns")
print(f"\n📝 Column Names:\n{list(df.columns)}")

# First few rows
print(f"\n🔍 First 5 Rows:")
display(df.head())

# Data types
print(f"\n📊 Data Types:")
print(df.dtypes)

# Memory usage
print(f"\n💾 Memory Usage: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
```

---
### 📋 TASK 2: شناسایی هوشمند نوع داده‌ها
---

**برای هر ستون تعیین کن:**
- **Numerical Continuous**: سن، هورمون‌ها، اندازه‌گیری‌ها
- **Numerical Discrete**: تعداد، شمارش
- **Categorical Nominal**: جنسیت، نژاد، نوع بیماری
- **Categorical Ordinal**: درجه، سطح، stage
- **Binary**: Yes/No، 0/1، Success/Failure
- **Text**: توضیحات، نام‌ها
- **Date/Time**: تاریخ‌ها

```python
def intelligent_dtype_detection(df):
    """شناسایی هوشمند نوع داده‌ها"""
    dtype_info = {}
    
    for col in df.columns:
        unique_count = df[col].nunique()
        total_count = len(df[col].dropna())
        unique_ratio = unique_count / total_count if total_count > 0 else 0
        
        # Check for binary
        if unique_count == 2:
            dtype_info[col] = "Binary"
        # Check for categorical
        elif unique_count <= 10 or unique_ratio < 0.05:
            dtype_info[col] = "Categorical"
        # Check for text
        elif df[col].dtype == 'object' and df[col].str.len().mean() > 20:
            dtype_info[col] = "Text"
        # Check for date
        elif df[col].dtype == 'object':
            try:
                pd.to_datetime(df[col].dropna().iloc[0])
                dtype_info[col] = "DateTime"
            except:
                dtype_info[col] = "Categorical"
        # Numerical
        else:
            if df[col].dtype in ['int64', 'int32']:
                dtype_info[col] = "Numerical_Discrete"
            else:
                dtype_info[col] = "Numerical_Continuous"
    
    return dtype_info

dtype_info = intelligent_dtype_detection(df)
print("\n📊 Intelligent Data Type Detection:")
for col, dtype in dtype_info.items():
    print(f"  • {col}: {dtype}")
```

---
### 📋 TASK 3: تحلیل Missing Values
---

```python
def comprehensive_missing_analysis(df):
    """تحلیل جامع Missing Values"""
    
    missing_df = pd.DataFrame({
        'Column': df.columns,
        'Missing_Count': df.isnull().sum().values,
        'Missing_Percent': (df.isnull().sum() / len(df) * 100).values,
        'Non_Missing': df.notnull().sum().values
    })
    
    missing_df = missing_df[missing_df['Missing_Count'] > 0].sort_values(
        'Missing_Percent', ascending=False
    )
    
    print("\n🔍 MISSING VALUES ANALYSIS")
    print("=" * 60)
    
    if len(missing_df) == 0:
        print("✅ No missing values found!")
    else:
        print(missing_df.to_string(index=False))
        
        # Severity classification
        critical = missing_df[missing_df['Missing_Percent'] > 50]
        high = missing_df[(missing_df['Missing_Percent'] > 20) & (missing_df['Missing_Percent'] <= 50)]
        moderate = missing_df[(missing_df['Missing_Percent'] > 5) & (missing_df['Missing_Percent'] <= 20)]
        low = missing_df[missing_df['Missing_Percent'] <= 5]
        
        print(f"\n⚠️ Severity Classification:")
        print(f"  🔴 Critical (>50%): {list(critical['Column'])}")
        print(f"  🟠 High (20-50%): {list(high['Column'])}")
        print(f"  🟡 Moderate (5-20%): {list(moderate['Column'])}")
        print(f"  🟢 Low (<5%): {list(low['Column'])}")
    
    return missing_df

missing_analysis = comprehensive_missing_analysis(df)
```

**استراتژی‌های مدیریت Missing Values:**

```python
def handle_missing_values(df, strategy='intelligent'):
    """
    استراتژی‌های مدیریت Missing Values:
    
    1. حذف (Deletion):
       - Listwise: حذف کل ردیف
       - Pairwise: حذف فقط برای تحلیل خاص
       - Column: حذف ستون با >50% missing
    
    2. جایگزینی (Imputation):
       - Mean/Median: برای numerical
       - Mode: برای categorical
       - KNN Imputation: based on similar samples
       - Multiple Imputation: MICE
       - Regression Imputation: predict missing values
    
    3. پیشرفته:
       - Indicator Variable: ایجاد ستون نشانگر missing
       - Domain Knowledge: بر اساس دانش پزشکی
    """
    
    df_clean = df.copy()
    
    for col in df.columns:
        if df[col].isnull().sum() == 0:
            continue
            
        missing_pct = df[col].isnull().sum() / len(df) * 100
        
        # Critical missing (>50%) - Consider dropping
        if missing_pct > 50:
            print(f"⚠️ {col}: {missing_pct:.1f}% missing - Consider dropping")
            # Create indicator before dropping
            df_clean[f'{col}_was_missing'] = df[col].isnull().astype(int)
            continue
        
        # Numerical columns
        if df[col].dtype in ['float64', 'int64']:
            # Use median for skewed, mean for normal
            if abs(df[col].skew()) > 1:
                df_clean[col].fillna(df[col].median(), inplace=True)
                print(f"✓ {col}: Filled with median (skewed distribution)")
            else:
                df_clean[col].fillna(df[col].mean(), inplace=True)
                print(f"✓ {col}: Filled with mean (normal distribution)")
        
        # Categorical columns
        else:
            df_clean[col].fillna(df[col].mode()[0], inplace=True)
            print(f"✓ {col}: Filled with mode")
    
    return df_clean

df_clean = handle_missing_values(df)
```

---
### 📋 TASK 4: شناسایی و مدیریت Outliers
---

```python
def comprehensive_outlier_detection(df, numerical_cols=None):
    """
    روش‌های تشخیص Outlier:
    1. IQR Method (1.5 × IQR)
    2. Z-Score (|z| > 3)
    3. Modified Z-Score (MAD-based)
    4. Clinical Thresholds (domain-specific)
    """
    
    if numerical_cols is None:
        numerical_cols = df.select_dtypes(include=[np.number]).columns
    
    outlier_summary = {}
    
    for col in numerical_cols:
        data = df[col].dropna()
        
        # IQR Method
        Q1 = data.quantile(0.25)
        Q3 = data.quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        iqr_outliers = ((data < lower_bound) | (data > upper_bound)).sum()
        
        # Z-Score Method
        z_scores = np.abs((data - data.mean()) / data.std())
        zscore_outliers = (z_scores > 3).sum()
        
        outlier_summary[col] = {
            'IQR_Outliers': iqr_outliers,
            'ZScore_Outliers': zscore_outliers,
            'Lower_Bound': lower_bound,
            'Upper_Bound': upper_bound,
            'Min': data.min(),
            'Max': data.max(),
            'Mean': data.mean(),
            'Median': data.median()
        }
        
        if iqr_outliers > 0 or zscore_outliers > 0:
            print(f"\n⚠️ {col}:")
            print(f"   IQR Outliers: {iqr_outliers}")
            print(f"   Z-Score Outliers: {zscore_outliers}")
            print(f"   Range: [{data.min():.2f}, {data.max():.2f}]")
            print(f"   Valid Range: [{lower_bound:.2f}, {upper_bound:.2f}]")
    
    return outlier_summary

outlier_summary = comprehensive_outlier_detection(df_clean)
```

**استراتژی‌های مدیریت Outliers:**

```python
def handle_outliers(df, strategy='winsorize', threshold=1.5):
    """
    استراتژی‌ها:
    1. حذف (Remove): حذف کامل ردیف
    2. Winsorize: محدود کردن به percentile
    3. Capping: محدود کردن به bounds
    4. Transform: log, sqrt transformation
    5. Keep: اگر biological باشد نگه دار
    """
    
    df_out = df.copy()
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    
    for col in numerical_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower = Q1 - threshold * IQR
        upper = Q3 + threshold * IQR
        
        outlier_count = ((df[col] < lower) | (df[col] > upper)).sum()
        
        if outlier_count > 0:
            if strategy == 'winsorize':
                df_out[col] = df[col].clip(lower=lower, upper=upper)
                print(f"✓ {col}: Winsorized {outlier_count} outliers")
            elif strategy == 'remove':
                df_out = df_out[(df_out[col] >= lower) & (df_out[col] <= upper)]
                print(f"✓ {col}: Removed {outlier_count} outliers")
    
    return df_out
```

---
### 📋 TASK 5: بررسی Duplicates و Inconsistencies
---

```python
def check_duplicates_and_inconsistencies(df):
    """بررسی تکراری‌ها و ناسازگاری‌ها"""
    
    print("\n🔍 DUPLICATES CHECK")
    print("=" * 60)
    
    # Exact duplicates
    exact_dups = df.duplicated().sum()
    print(f"Exact duplicates: {exact_dups}")
    
    # Partial duplicates (based on key columns)
    # This should be customized based on dataset
    
    # Show duplicates if exist
    if exact_dups > 0:
        print("\nDuplicate rows:")
        print(df[df.duplicated(keep=False)])
    
    # Inconsistencies check
    print("\n🔍 INCONSISTENCIES CHECK")
    print("=" * 60)
    
    # Check for negative values in columns that shouldn't have them
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    for col in numerical_cols:
        neg_count = (df[col] < 0).sum()
        if neg_count > 0:
            print(f"⚠️ {col}: {neg_count} negative values found")
    
    # Check for logical inconsistencies
    # This should be customized based on domain knowledge
    
    return exact_dups

duplicates = check_duplicates_and_inconsistencies(df_clean)

# Remove duplicates if found
if duplicates > 0:
    df_clean = df_clean.drop_duplicates()
    print(f"✓ Removed {duplicates} duplicate rows")
```

---
### 📋 TASK 6: Data Type Corrections
---

```python
def correct_data_types(df, dtype_mapping=None):
    """تصحیح نوع داده‌ها"""
    
    df_corrected = df.copy()
    
    # Auto-detect and correct
    for col in df.columns:
        # Try to convert object to numeric
        if df[col].dtype == 'object':
            try:
                df_corrected[col] = pd.to_numeric(df[col])
                print(f"✓ {col}: Converted to numeric")
            except:
                pass
        
        # Convert boolean-like to int
        if df[col].dtype == 'bool':
            df_corrected[col] = df[col].astype(int)
            print(f"✓ {col}: Converted bool to int")
    
    # Apply custom mapping if provided
    if dtype_mapping:
        for col, dtype in dtype_mapping.items():
            df_corrected[col] = df_corrected[col].astype(dtype)
            print(f"✓ {col}: Converted to {dtype}")
    
    return df_corrected

df_clean = correct_data_types(df_clean)
```

---
### 📋 TASK 7: Feature Engineering اولیه
---

```python
def initial_feature_engineering(df):
    """Feature Engineering اولیه بر اساس domain knowledge"""
    
    df_fe = df.copy()
    
    # این قسمت باید customize شود بر اساس دیتاست
    # مثال‌ها:
    
    # 1. Ratio features (نسبت‌ها)
    # if 'FSH' in df.columns and 'LH' in df.columns:
    #     df_fe['FSH_LH_ratio'] = df['FSH'] / (df['LH'] + 0.001)
    
    # 2. Age groups (دسته‌بندی سن)
    # if 'Age' in df.columns:
    #     df_fe['Age_Group'] = pd.cut(df['Age'], bins=[0, 30, 40, 50, 100], 
    #                                  labels=['<30', '30-40', '40-50', '>50'])
    
    # 3. Binary indicators
    # if 'Testosterone' in df.columns:
    #     df_fe['Low_Testosterone'] = (df['Testosterone'] < 300).astype(int)
    
    # 4. Interaction features
    # df_fe['Feature1_x_Feature2'] = df['Feature1'] * df['Feature2']
    
    print("\n🔧 Feature Engineering:")
    print(f"Original features: {len(df.columns)}")
    print(f"After engineering: {len(df_fe.columns)}")
    print(f"New features: {set(df_fe.columns) - set(df.columns)}")
    
    return df_fe

df_clean = initial_feature_engineering(df_clean)
```

---
### 📋 TASK 8: Encoding Categorical Variables
---

```python
from sklearn.preprocessing import LabelEncoder, OneHotEncoder

def encode_categorical_variables(df, target_col=None):
    """
    استراتژی‌های Encoding:
    1. Label Encoding: برای ordinal
    2. One-Hot Encoding: برای nominal با کم unique
    3. Target Encoding: برای nominal با زیاد unique
    4. Binary Encoding: برای binary
    """
    
    df_encoded = df.copy()
    encoding_info = {}
    
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns
    
    for col in categorical_cols:
        if col == target_col:
            continue
            
        unique_count = df[col].nunique()
        
        # Binary encoding
        if unique_count == 2:
            le = LabelEncoder()
            df_encoded[col] = le.fit_transform(df[col].astype(str))
            encoding_info[col] = {'method': 'LabelEncoder', 'classes': list(le.classes_)}
            print(f"✓ {col}: Label Encoded (binary)")
        
        # One-Hot for low cardinality
        elif unique_count <= 5:
            dummies = pd.get_dummies(df[col], prefix=col, drop_first=True)
            df_encoded = pd.concat([df_encoded.drop(col, axis=1), dummies], axis=1)
            encoding_info[col] = {'method': 'OneHot', 'new_cols': list(dummies.columns)}
            print(f"✓ {col}: One-Hot Encoded ({unique_count} categories)")
        
        # Label encoding for high cardinality
        else:
            le = LabelEncoder()
            df_encoded[col] = le.fit_transform(df[col].astype(str))
            encoding_info[col] = {'method': 'LabelEncoder', 'classes': list(le.classes_)}
            print(f"✓ {col}: Label Encoded (high cardinality)")
    
    return df_encoded, encoding_info

df_encoded, encoding_info = encode_categorical_variables(df_clean)
```

---
### 📋 TASK 9: Scaling Numerical Features
---

```python
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler

def scale_features(df, target_col=None, method='auto'):
    """
    روش‌های Scaling:
    1. StandardScaler: mean=0, std=1 (برای نرمال)
    2. MinMaxScaler: [0, 1] range (برای bounded)
    3. RobustScaler: resistant to outliers (برای skewed)
    """
    
    df_scaled = df.copy()
    numerical_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
    if target_col and target_col in numerical_cols:
        numerical_cols.remove(target_col)
    
    scaling_info = {}
    
    for col in numerical_cols:
        skewness = abs(df[col].skew())
        
        if method == 'auto':
            # Choose scaler based on distribution
            if skewness > 1:
                scaler = RobustScaler()
                scaler_name = 'RobustScaler'
            else:
                scaler = StandardScaler()
                scaler_name = 'StandardScaler'
        elif method == 'standard':
            scaler = StandardScaler()
            scaler_name = 'StandardScaler'
        elif method == 'minmax':
            scaler = MinMaxScaler()
            scaler_name = 'MinMaxScaler'
        elif method == 'robust':
            scaler = RobustScaler()
            scaler_name = 'RobustScaler'
        
        df_scaled[col] = scaler.fit_transform(df[[col]])
        scaling_info[col] = {'method': scaler_name, 'scaler': scaler}
        print(f"✓ {col}: {scaler_name} applied")
    
    return df_scaled, scaling_info

# Note: Scaling should be done AFTER train-test split in actual modeling
# Here we just demonstrate the method
```

---
### 📋 TASK 10: ذخیره دیتاست تمیز و گزارش
---

```python
# Save cleaned dataset
output_path = "[path]"
df_clean.to_csv(output_path, index=False)
print(f"\n✓ Cleaned dataset saved to: {output_path}")

# Save encoded dataset (for modeling)
encoded_path = "[path]"
df_encoded.to_csv(encoded_path, index=False)
print(f"✓ Encoded dataset saved to: {encoded_path}")
```

═══════════════════════════════════════════════════════════════════════════════
## INTELLIGENT DECISIONS - تصمیمات هوشمند
═══════════════════════════════════════════════════════════════════════════════

**در این نقاط باید هوشمند تصمیم بگیری:**

| موقعیت | تصمیم | معیار |
|--------|-------|-------|
| Missing >50% | حذف ستون | عدم امکان imputation معتبر |
| Missing <5% | Mean/Median | حفظ sample size |
| Outlier biological | نگه‌داری | domain knowledge |
| Outlier error | حذف/اصلاح | غیرممکن بودن مقدار |
| High cardinality | Target encoding | جلوگیری از sparse matrix |

═══════════════════════════════════════════════════════════════════════════════
## QUESTION MECHANISM - نحوه سوال پرسیدن
═══════════════════════════════════════════════════════════════════════════════

**سوالاتی که باید بپرسی:**

```
🤔 سوال از کاربر:
═══════════════════════════════════════════════════════════════
1. ستون target (هدف) شما کدام است؟
   گزینه‌ها: [لیست ستون‌های binary/categorical]

2. آیا ستون‌هایی هست که باید حذف شوند؟ (مثل ID)
   
3. آیا مقادیر negative برای این متغیرها معتبر است: [لیست]?

⏳ منتظر پاسخ شما هستم...
═══════════════════════════════════════════════════════════════
```

═══════════════════════════════════════════════════════════════════════════════
## OUTPUTS - خروجی‌های این فاز
═══════════════════════════════════════════════════════════════════════════════

| فایل | مسیر | فرمت |
|------|------|------|
| cleaned_dataset.csv | `1_Data/Cleaned/` | CSV |
| encoded_dataset.csv | `1_Data/Processed/` | CSV |
| Phase1_Report.md | `3_Results/Phase1_DataCleaning/` | Markdown |
| missing_values_analysis.png | `4_Figures/PNG/` | PNG 300DPI |
| missing_values_analysis.tiff | `4_Figures/TIFF/` | TIFF 300DPI |
| outliers_boxplot.png | `4_Figures/PNG/` | PNG 300DPI |
| data_types_summary.png | `4_Figures/PNG/` | PNG 300DPI |

═══════════════════════════════════════════════════════════════════════════════
## OUTPUT FORMAT - فرمت گزارش خروجی
═══════════════════════════════════════════════════════════════════════════════

فایل `Phase1_Report.md` باید شامل این بخش‌ها باشد:

```markdown
# Phase 1: Data Understanding & Cleaning Report

## Executive Summary
[خلاصه 2-3 خط از یافته‌های کلیدی]

## 1. Dataset Overview
- Original shape: X rows × Y columns
- Final shape: A rows × B columns
- Columns dropped: [list]
- Rows removed: [count]

## 2. Data Types Identified
| Column | Original Type | Detected Type | Final Type |
|--------|---------------|---------------|------------|

## 3. Missing Values Analysis
### 3.1 Before Cleaning
| Column | Missing Count | Missing % |
|--------|---------------|-----------|

### 3.2 Handling Strategy
| Column | Strategy | Justification |
|--------|----------|---------------|

### 3.3 After Cleaning
[Confirmation of no missing values]

## 4. Outlier Analysis
### 4.1 Detection Results
| Column | IQR Outliers | Z-Score Outliers |
|--------|--------------|------------------|

### 4.2 Handling Decision
| Column | Decision | Justification |
|--------|----------|---------------|

## 5. Duplicates & Inconsistencies
- Duplicate rows found: X
- Duplicate rows removed: Y
- Inconsistencies fixed: [list]

## 6. Feature Engineering
- New features created: [list]
- Rationale: [explanation]

## 7. Encoding Applied
| Column | Method | Details |
|--------|--------|---------|

## 8. Visualizations
[Include all generated figures]

## 9. Quality Assurance Checklist
- [x] No missing values
- [x] No duplicates
- [x] Data types correct
- [x] Outliers handled
- [x] Ready for analysis

## 10. Files Generated
[List of all output files with paths]

## Next Steps
→ Proceed to Phase 2: Statistical Analysis
```

═══════════════════════════════════════════════════════════════════════════════
## IMAGE FORMAT - فرمت تصاویر
═══════════════════════════════════════════════════════════════════════════════

```python
import matplotlib.pyplot as plt

def save_figure(fig, name, dpi=300):
    """ذخیره تصویر در هر دو فرمت"""
    
    png_path = f"[path]"
    tiff_path = f"[path]"
    
    fig.savefig(png_path, dpi=dpi, bbox_inches='tight', facecolor='white')
    fig.savefig(tiff_path, dpi=dpi, bbox_inches='tight', facecolor='white')
    
    print(f"✓ Saved: {png_path}")
    print(f"✓ Saved: {tiff_path}")
    
    plt.close(fig)
```

═══════════════════════════════════════════════════════════════════════════════
## CHECKLIST - چک‌لیست تکمیل فاز
═══════════════════════════════════════════════════════════════════════════════

- [ ] دیتاست خوانده شد
- [ ] نوع داده‌ها شناسایی شد
- [ ] Missing values تحلیل و مدیریت شد
- [ ] Outliers شناسایی و تصمیم‌گیری شد
- [ ] Duplicates بررسی و حذف شد
- [ ] Data types تصحیح شد
- [ ] Feature engineering انجام شد
- [ ] Encoding اعمال شد
- [ ] دیتاست تمیز ذخیره شد
- [ ] نمودارها ذخیره شدند (PNG + TIFF)
- [ ] گزارش کامل نوشته شد
- [ ] آماده برای Phase 2

═══════════════════════════════════════════════════════════════════════════════
⏳ وقتی آماده بودی، بگو "شروع کن" تا این فاز را اجرا کنم.
═══════════════════════════════════════════════════════════════════════════════
