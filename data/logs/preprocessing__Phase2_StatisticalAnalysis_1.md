# 📊 Phase 2: Advanced Statistical Analysis

═══════════════════════════════════════════════════════════════════════════════
## CONTEXT - این فاز چیست و چرا مهم است
═══════════════════════════════════════════════════════════════════════════════

**تحلیل آماری پیشرفته** پایه علمی پروژه ML پزشکی است. قبل از هر مدل‌سازی، باید:
- توزیع متغیرها را بشناسیم
- روابط بین متغیرها را بفهمیم
- تفاوت‌های گروهی را بسنجیم
- قدرت آماری مطالعه را ارزیابی کنیم

**اهمیت در پزشکی:**
- Peer reviewers انتظار تحلیل آماری کامل دارند
- Clinical significance بیشتر از statistical significance اهمیت دارد
- Effect size برای تصمیم‌گیری بالینی ضروری است

═══════════════════════════════════════════════════════════════════════════════
## INPUTS - فایل‌های ورودی
═══════════════════════════════════════════════════════════════════════════════

```
[path]
[path]
```

═══════════════════════════════════════════════════════════════════════════════
## TASKS - کارهایی که باید انجام دهی
═══════════════════════════════════════════════════════════════════════════════

---
### 📋 TASK 1: Descriptive Statistics کامل
---

```python
import pandas as pd
import numpy as np
from scipy import stats

df = pd.read_csv("[path]")

def comprehensive_descriptive_stats(df, target_col):
    """آمار توصیفی جامع"""
    
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    
    # Overall statistics
    print("=" * 80)
    print("📊 DESCRIPTIVE STATISTICS - OVERALL")
    print("=" * 80)
    
    stats_df = pd.DataFrame()
    
    for col in numerical_cols:
        stats_df[col] = pd.Series({
            'N': df[col].count(),
            'Mean': df[col].mean(),
            'Std': df[col].std(),
            'Median': df[col].median(),
            'Q1': df[col].quantile(0.25),
            'Q3': df[col].quantile(0.75),
            'IQR': df[col].quantile(0.75) - df[col].quantile(0.25),
            'Min': df[col].min(),
            'Max': df[col].max(),
            'Skewness': df[col].skew(),
            'Kurtosis': df[col].kurtosis(),
            '95% CI Lower': df[col].mean() - 1.96 * df[col].std() / np.sqrt(len(df)),
            '95% CI Upper': df[col].mean() + 1.96 * df[col].std() / np.sqrt(len(df))
        })
    
    print(stats_df.T.to_string())
    
    # By group (target)
    print("\n" + "=" * 80)
    print(f"📊 DESCRIPTIVE STATISTICS - BY {target_col.upper()}")
    print("=" * 80)
    
    for group in df[target_col].unique():
        print(f"\n--- Group: {group} ---")
        group_df = df[df[target_col] == group]
        
        for col in numerical_cols:
            if col != target_col:
                print(f"{col}: {group_df[col].mean():.2f} ± {group_df[col].std():.2f}")
    
    return stats_df.T

descriptive_stats = comprehensive_descriptive_stats(df, target_col='YOUR_TARGET')
```

---
### 📋 TASK 2: Distribution Analysis (Normality Tests)
---

```python
from scipy.stats import shapiro, kstest, normaltest, anderson

def normality_analysis(df):
    """تحلیل نرمالیتی توزیع‌ها"""
    
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    normality_results = []
    
    print("=" * 80)
    print("📊 NORMALITY TESTS")
    print("=" * 80)
    
    for col in numerical_cols:
        data = df[col].dropna()
        
        # Shapiro-Wilk test (best for n < 5000)
        if len(data) < 5000:
            shapiro_stat, shapiro_p = shapiro(data)
        else:
            shapiro_stat, shapiro_p = np.nan, np.nan
        
        # Kolmogorov-Smirnov test
        ks_stat, ks_p = kstest(data, 'norm', args=(data.mean(), data.std()))
        
        # D'Agostino-Pearson test
        try:
            dagostino_stat, dagostino_p = normaltest(data)
        except:
            dagostino_stat, dagostino_p = np.nan, np.nan
        
        # Skewness and Kurtosis
        skewness = data.skew()
        kurtosis = data.kurtosis()
        
        # Decision
        is_normal = shapiro_p > 0.05 if not np.isnan(shapiro_p) else ks_p > 0.05
        
        normality_results.append({
            'Column': col,
            'Shapiro_W': shapiro_stat,
            'Shapiro_p': shapiro_p,
            'KS_stat': ks_stat,
            'KS_p': ks_p,
            'Skewness': skewness,
            'Kurtosis': kurtosis,
            'Is_Normal': 'Yes' if is_normal else 'No',
            'Recommended_Test': 'Parametric' if is_normal else 'Non-Parametric'
        })
        
        status = "✓ Normal" if is_normal else "✗ Non-Normal"
        print(f"{col}: {status} (Shapiro p={shapiro_p:.4f}, Skew={skewness:.2f})")
    
    return pd.DataFrame(normality_results)

normality_df = normality_analysis(df)
```

**Visualization:**
```python
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import probplot

def plot_distributions(df, save_path):
    """نمودارهای توزیع"""
    
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    n_cols = len(numerical_cols)
    
    fig, axes = plt.subplots(n_cols, 3, figsize=(15, 4*n_cols))
    
    for idx, col in enumerate(numerical_cols):
        # Histogram
        axes[idx, 0].hist(df[col].dropna(), bins=30, edgecolor='black', alpha=0.7)
        axes[idx, 0].set_title(f'{col} - Histogram')
        axes[idx, 0].set_xlabel(col)
        axes[idx, 0].set_ylabel('Frequency')
        
        # Box plot
        axes[idx, 1].boxplot(df[col].dropna())
        axes[idx, 1].set_title(f'{col} - Box Plot')
        
        # Q-Q plot
        probplot(df[col].dropna(), dist="norm", plot=axes[idx, 2])
        axes[idx, 2].set_title(f'{col} - Q-Q Plot')
    
    plt.tight_layout()
    save_figure(fig, 'distribution_analysis')

plot_distributions(df, save_path)
```

---
### 📋 TASK 3: Correlation Analysis
---

```python
from scipy.stats import pearsonr, spearmanr, pointbiserialr

def comprehensive_correlation_analysis(df, target_col):
    """تحلیل همبستگی جامع"""
    
    numerical_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if target_col in numerical_cols:
        numerical_cols.remove(target_col)
    
    print("=" * 80)
    print("📊 CORRELATION ANALYSIS")
    print("=" * 80)
    
    # Pearson correlation matrix
    print("\n--- Pearson Correlation Matrix ---")
    pearson_corr = df[numerical_cols].corr(method='pearson')
    print(pearson_corr.round(3))
    
    # Spearman correlation matrix
    print("\n--- Spearman Correlation Matrix ---")
    spearman_corr = df[numerical_cols].corr(method='spearman')
    print(spearman_corr.round(3))
    
    # Correlation with target (Point-biserial if binary)
    print(f"\n--- Correlation with Target ({target_col}) ---")
    target_corr = []
    
    for col in numerical_cols:
        if df[target_col].nunique() == 2:  # Binary target
            r, p = pointbiserialr(df[target_col], df[col].fillna(df[col].mean()))
            corr_type = 'Point-biserial'
        else:
            r, p = spearmanr(df[target_col], df[col].fillna(df[col].mean()))
            corr_type = 'Spearman'
        
        target_corr.append({
            'Feature': col,
            'Correlation': r,
            'P-value': p,
            'Type': corr_type,
            'Significant': 'Yes' if p < 0.05 else 'No'
        })
        
        sig = "***" if p < 0.001 else "**" if p < 0.01 else "*" if p < 0.05 else ""
        print(f"  {col}: r={r:.3f}, p={p:.4f} {sig}")
    
    return pearson_corr, spearman_corr, pd.DataFrame(target_corr)

pearson_corr, spearman_corr, target_corr = comprehensive_correlation_analysis(df, 'TARGET')
```

**Heatmap:**
```python
def plot_correlation_heatmap(corr_matrix, title, save_name):
    """هیت‌مپ همبستگی"""
    
    fig, ax = plt.subplots(figsize=(12, 10))
    
    mask = np.triu(np.ones_like(corr_matrix, dtype=bool))
    
    sns.heatmap(corr_matrix, mask=mask, annot=True, fmt='.2f',
                cmap='RdBu_r', center=0, vmin=-1, vmax=1,
                square=True, linewidths=0.5,
                cbar_kws={'shrink': 0.8, 'label': 'Correlation'},
                ax=ax)
    
    ax.set_title(title, fontsize=14, fontweight='bold')
    plt.tight_layout()
    
    save_figure(fig, save_name)

plot_correlation_heatmap(pearson_corr, 'Pearson Correlation Matrix', 'pearson_heatmap')
plot_correlation_heatmap(spearman_corr, 'Spearman Correlation Matrix', 'spearman_heatmap')
```

---
### 📋 TASK 4: Group Comparison Tests
---

```python
from scipy.stats import ttest_ind, mannwhitneyu, chi2_contingency, fisher_exact

def group_comparison_tests(df, target_col):
    """تست‌های مقایسه گروهی"""
    
    results = []
    groups = df[target_col].unique()
    
    if len(groups) != 2:
        print("⚠️ Target should be binary for this analysis")
        return None
    
    group0 = df[df[target_col] == groups[0]]
    group1 = df[df[target_col] == groups[1]]
    
    print("=" * 80)
    print(f"📊 GROUP COMPARISON: {groups[0]} vs {groups[1]}")
    print("=" * 80)
    
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    
    for col in numerical_cols:
        if col == target_col:
            continue
        
        data0 = group0[col].dropna()
        data1 = group1[col].dropna()
        
        # Check normality
        _, p_norm0 = shapiro(data0) if len(data0) < 5000 else (0, 0.01)
        _, p_norm1 = shapiro(data1) if len(data1) < 5000 else (0, 0.01)
        is_normal = p_norm0 > 0.05 and p_norm1 > 0.05
        
        # Choose test
        if is_normal:
            stat, p_value = ttest_ind(data0, data1)
            test_name = "Independent t-test"
        else:
            stat, p_value = mannwhitneyu(data0, data1, alternative='two-sided')
            test_name = "Mann-Whitney U"
        
        # Effect size (Cohen's d)
        pooled_std = np.sqrt(((len(data0)-1)*data0.std()**2 + (len(data1)-1)*data1.std()**2) / (len(data0)+len(data1)-2))
        cohens_d = (data0.mean() - data1.mean()) / pooled_std if pooled_std > 0 else 0
        
        # Interpret effect size
        if abs(cohens_d) < 0.2:
            effect_interp = "Negligible"
        elif abs(cohens_d) < 0.5:
            effect_interp = "Small"
        elif abs(cohens_d) < 0.8:
            effect_interp = "Medium"
        else:
            effect_interp = "Large"
        
        results.append({
            'Feature': col,
            'Group0_Mean': data0.mean(),
            'Group0_SD': data0.std(),
            'Group1_Mean': data1.mean(),
            'Group1_SD': data1.std(),
            'Test': test_name,
            'Statistic': stat,
            'P-value': p_value,
            'Cohens_d': cohens_d,
            'Effect_Size': effect_interp,
            'Significant': 'Yes' if p_value < 0.05 else 'No'
        })
        
        sig = "***" if p_value < 0.001 else "**" if p_value < 0.01 else "*" if p_value < 0.05 else ""
        print(f"{col}: p={p_value:.4f} {sig}, Cohen's d={cohens_d:.2f} ({effect_interp})")
    
    return pd.DataFrame(results)

comparison_results = group_comparison_tests(df, 'TARGET')
```

---
### 📋 TASK 5: ANOVA / Kruskal-Wallis (برای چند گروه)
---

```python
from scipy.stats import f_oneway, kruskal

def multi_group_comparison(df, group_col, numerical_cols):
    """مقایسه چند گروهی"""
    
    groups = df[group_col].unique()
    
    if len(groups) < 3:
        print("Use t-test for 2 groups")
        return None
    
    print("=" * 80)
    print(f"📊 MULTI-GROUP COMPARISON BY {group_col}")
    print("=" * 80)
    
    results = []
    
    for col in numerical_cols:
        group_data = [df[df[group_col] == g][col].dropna() for g in groups]
        
        # Check normality of all groups
        all_normal = all(shapiro(g)[1] > 0.05 for g in group_data if len(g) < 5000)
        
        if all_normal:
            stat, p_value = f_oneway(*group_data)
            test_name = "One-way ANOVA"
        else:
            stat, p_value = kruskal(*group_data)
            test_name = "Kruskal-Wallis"
        
        # Effect size (eta-squared for ANOVA)
        grand_mean = df[col].mean()
        ss_between = sum(len(g) * (g.mean() - grand_mean)**2 for g in group_data)
        ss_total = sum((df[col] - grand_mean)**2)
        eta_squared = ss_between / ss_total if ss_total > 0 else 0
        
        results.append({
            'Feature': col,
            'Test': test_name,
            'Statistic': stat,
            'P-value': p_value,
            'Eta_Squared': eta_squared,
            'Significant': 'Yes' if p_value < 0.05 else 'No'
        })
        
        print(f"{col}: {test_name}, p={p_value:.4f}, η²={eta_squared:.3f}")
    
    return pd.DataFrame(results)
```

---
### 📋 TASK 6: Power Analysis
---

```python
from statsmodels.stats.power import TTestIndPower, NormalIndPower

def power_analysis(df, target_col, effect_size=None):
    """تحلیل قدرت آماری"""
    
    groups = df[target_col].unique()
    n1 = len(df[df[target_col] == groups[0]])
    n2 = len(df[df[target_col] == groups[1]])
    
    power_analyzer = TTestIndPower()
    
    print("=" * 80)
    print("📊 POWER ANALYSIS")
    print("=" * 80)
    
    # Calculate observed power for different effect sizes
    effect_sizes = [0.2, 0.5, 0.8]  # Small, Medium, Large
    
    print(f"\nSample sizes: n1={n1}, n2={n2}")
    print(f"Alpha: 0.05")
    print("\nPower for different effect sizes:")
    
    results = []
    for es in effect_sizes:
        power = power_analyzer.power(effect_size=es, nobs1=n1, ratio=n2/n1, alpha=0.05)
        results.append({
            'Effect_Size': es,
            'Effect_Type': 'Small' if es == 0.2 else 'Medium' if es == 0.5 else 'Large',
            'Power': power
        })
        print(f"  Cohen's d = {es}: Power = {power:.3f}")
    
    # Required sample size for 80% power
    print("\nRequired sample size for 80% power:")
    for es in effect_sizes:
        required_n = power_analyzer.solve_power(effect_size=es, power=0.8, ratio=1, alpha=0.05)
        print(f"  Cohen's d = {es}: n per group = {int(np.ceil(required_n))}")
    
    return pd.DataFrame(results)

power_results = power_analysis(df, 'TARGET')
```

---
### 📋 TASK 7: Class Imbalance Analysis
---

```python
def class_imbalance_analysis(df, target_col):
    """تحلیل عدم توازن کلاس‌ها"""
    
    print("=" * 80)
    print("📊 CLASS IMBALANCE ANALYSIS")
    print("=" * 80)
    
    class_counts = df[target_col].value_counts()
    class_props = df[target_col].value_counts(normalize=True)
    
    print("\nClass Distribution:")
    for cls in class_counts.index:
        print(f"  {cls}: {class_counts[cls]} ({class_props[cls]*100:.1f}%)")
    
    # Imbalance ratio
    majority_class = class_counts.max()
    minority_class = class_counts.min()
    imbalance_ratio = majority_class / minority_class
    
    print(f"\nImbalance Ratio: {imbalance_ratio:.2f}:1")
    
    # Severity assessment
    if imbalance_ratio < 1.5:
        severity = "Balanced"
        recommendation = "No special handling needed"
    elif imbalance_ratio < 3:
        severity = "Mild Imbalance"
        recommendation = "Consider class weights"
    elif imbalance_ratio < 10:
        severity = "Moderate Imbalance"
        recommendation = "Use SMOTE or class weights"
    else:
        severity = "Severe Imbalance"
        recommendation = "Use SMOTE + undersampling + class weights"
    
    print(f"\nSeverity: {severity}")
    print(f"Recommendation: {recommendation}")
    
    # Visualization
    fig, ax = plt.subplots(figsize=(8, 6))
    class_counts.plot(kind='bar', ax=ax, color=['#2ecc71', '#e74c3c'], edgecolor='black')
    ax.set_title('Class Distribution', fontsize=14, fontweight='bold')
    ax.set_xlabel(target_col)
    ax.set_ylabel('Count')
    
    for i, v in enumerate(class_counts):
        ax.text(i, v + 0.5, f'{v}\n({class_props.iloc[i]*100:.1f}%)', 
                ha='center', fontweight='bold')
    
    plt.tight_layout()
    save_figure(fig, 'class_distribution')
    
    return {
        'class_counts': class_counts.to_dict(),
        'imbalance_ratio': imbalance_ratio,
        'severity': severity,
        'recommendation': recommendation
    }

imbalance_info = class_imbalance_analysis(df, 'TARGET')
```

---
### 📋 TASK 8: Multicollinearity Check (VIF)
---

```python
from statsmodels.stats.outliers_influence import variance_inflation_factor

def multicollinearity_check(df, target_col):
    """بررسی همخطی چندگانه"""
    
    print("=" * 80)
    print("📊 MULTICOLLINEARITY CHECK (VIF)")
    print("=" * 80)
    
    # Select numerical features only
    numerical_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if target_col in numerical_cols:
        numerical_cols.remove(target_col)
    
    X = df[numerical_cols].dropna()
    
    # Calculate VIF
    vif_data = []
    for i, col in enumerate(numerical_cols):
        vif = variance_inflation_factor(X.values, i)
        vif_data.append({
            'Feature': col,
            'VIF': vif,
            'Assessment': 'OK' if vif < 5 else 'Moderate' if vif < 10 else 'High'
        })
    
    vif_df = pd.DataFrame(vif_data).sort_values('VIF', ascending=False)
    
    print("\nVariance Inflation Factors:")
    print(vif_df.to_string(index=False))
    
    # Interpretation
    high_vif = vif_df[vif_df['VIF'] >= 10]
    if len(high_vif) > 0:
        print(f"\n⚠️ High multicollinearity detected in: {list(high_vif['Feature'])}")
        print("Consider removing or combining these features")
    else:
        print("\n✓ No severe multicollinearity detected")
    
    return vif_df

vif_results = multicollinearity_check(df, 'TARGET')
```

═══════════════════════════════════════════════════════════════════════════════
## INTELLIGENT DECISIONS - تصمیمات هوشمند
═══════════════════════════════════════════════════════════════════════════════

| موقعیت | تصمیم | معیار |
|--------|-------|-------|
| توزیع نرمال | Parametric test | Shapiro p > 0.05 |
| توزیع غیرنرمال | Non-parametric | Shapiro p ≤ 0.05 |
| VIF > 10 | حذف یکی از متغیرها | همخطی بالا |
| Power < 0.8 | هشدار | sample size کم |
| Imbalance > 3:1 | SMOTE/Weights | عدم توازن |

═══════════════════════════════════════════════════════════════════════════════
## QUESTION MECHANISM - نحوه سوال پرسیدن
═══════════════════════════════════════════════════════════════════════════════

```
🤔 سوال از کاربر:
═══════════════════════════════════════════════════════════════
1. سطح معناداری (alpha) مورد نظر شما چیست؟
   پیش‌فرض: 0.05
   
2. آیا متغیر گروه‌بندی دیگری (مثل جراح، مرکز) وجود دارد؟

3. آیا تصحیح Bonferroni برای multiple testing اعمال شود؟

⏳ منتظر پاسخ شما هستم...
═══════════════════════════════════════════════════════════════
```

═══════════════════════════════════════════════════════════════════════════════
## OUTPUTS - خروجی‌های این فاز
═══════════════════════════════════════════════════════════════════════════════

| فایل | مسیر | فرمت |
|------|------|------|
| Phase2_Report.md | `3_Results/Phase2_Statistics/` | Markdown |
| descriptive_stats.csv | `3_Results/Phase2_Statistics/` | CSV |
| normality_tests.csv | `3_Results/Phase2_Statistics/` | CSV |
| group_comparison.csv | `3_Results/Phase2_Statistics/` | CSV |
| correlation_matrix.csv | `3_Results/Phase2_Statistics/` | CSV |
| distribution_analysis.png/tiff | `4_Figures/` | PNG/TIFF |
| pearson_heatmap.png/tiff | `4_Figures/` | PNG/TIFF |
| spearman_heatmap.png/tiff | `4_Figures/` | PNG/TIFF |
| class_distribution.png/tiff | `4_Figures/` | PNG/TIFF |

═══════════════════════════════════════════════════════════════════════════════
## CHECKLIST - چک‌لیست تکمیل فاز
═══════════════════════════════════════════════════════════════════════════════

- [ ] Descriptive statistics کامل محاسبه شد
- [ ] Normality tests انجام شد
- [ ] Correlation analysis انجام شد
- [ ] Group comparison tests انجام شد
- [ ] Power analysis انجام شد
- [ ] Class imbalance بررسی شد
- [ ] Multicollinearity check (VIF) انجام شد
- [ ] تمام نمودارها ذخیره شدند
- [ ] گزارش کامل نوشته شد
- [ ] آماده برای Phase 3

═══════════════════════════════════════════════════════════════════════════════
⏳ وقتی آماده بودی، بگو "شروع کن" تا این فاز را اجرا کنم.
═══════════════════════════════════════════════════════════════════════════════
