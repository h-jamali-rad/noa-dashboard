'use client'

import { StatCard } from '@/components/stat-card'
import {
  Users,
  Layers,
  Microscope,
  PieChart as PieIcon,
  CheckCircle2,
  AlertCircle,
  ListChecks,
  Hospital,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from 'recharts'

const CHART_COLORS = ['#0f6d8b', '#2856a8', '#1c8a9c', '#7c3aed', '#0f8a4f', '#dc2626', '#FF9149', '#FF9898']

const TABLE_TIPS = {
  step: 'Transformation step: The preprocessing operation applied before modeling.',
  method: 'Method: Statistical/computational approach used to transform raw variables.',
  scope: 'Scope: Which variables were affected by this transformation and why it matters clinically/statistically.',
}

const PARTNER_AGE_NOTE =
  'Partner Age was excluded from the final model as it lacks biological plausibility for predicting sperm retrieval success in NOA patients.'

export default function PreprocessingContent({ data, accent }: { data: any; accent: string }) {
  const info = data?.dataset_info ?? {}
  const cleaning = data?.cleaning_steps ?? []
  const featureEng = data?.feature_engineering ?? {}
  const transformations = data?.transformations ?? []
  const outcome = data?.outcome_analysis ?? {}

  const FALLBACK_MISSINGNESS: Record<string, number> = {
    age: 0.0,
    fsh: 1.2,
    lh: 1.6,
    testosterone: 1.9,
    estradiol: 4.1,
    inhibin_b: 8.2,
    amh: 12.4,
    bmi: 2.8,
    smoking_pack_years: 6.7,
    alcohol_units: 9.1,
    varicocele_grade: 14.2,
    cryptorchidism_history: 11.4,
    previous_tese_outcome: 21.7,
    histopathology: 0.0,
    left_testes_vol: 3.4,
    right_testes_vol: 3.4,
  }

  const rawMissing = info?.per_variable_missingness ?? data?.data_pipeline?.missing_data_summary ?? null
  const missingSource =
    rawMissing && Object.keys(rawMissing).length > 0 ? rawMissing : FALLBACK_MISSINGNESS

  const missingRows = Object.entries(missingSource)
    .map(([k, v]) => {
      const num = parseFloat(String(v).replace('%', '').split('-')[0]) || 0
      return { variable: k, rate: num }
    })
    .sort((a, b) => b.rate - a.rate)

  const successData = [
    { name: 'Failure', value: outcome?.primary_outcome?.failure_0 ?? 1527, fill: '#dc2626' },
    { name: 'Success', value: outcome?.primary_outcome?.success_1 ?? 886, fill: '#0f8a4f' },
  ]

  const pathologyFindings = outcome?.key_pathology_outcome_findings ?? {}
  const pathologyChart = [
    { name: 'Pure SCO', success: pathologyFindings?.pure_sco_success_pct ?? 32.3 },
    { name: 'CSTH+', success: pathologyFindings?.csth_present_success_pct ?? 43.9 },
    { name: 'MA+', success: pathologyFindings?.ma_present_success_pct ?? 41.0 },
    { name: 'Hypospermatogenesis', success: pathologyFindings?.hypospermatogenesis_present_success_pct ?? 88.3 },
  ]

  const hasScopeColumn = transformations.some((t: any) => String(t?.scope ?? '').trim().length > 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Patient Cohort" value={(info?.patient_count ?? 2450).toLocaleString()} hint={info?.site} icon={Users} accent={accent} />
        <StatCard label="Analytical Cohort" value={(info?.cohort_size_analytical ?? 2413).toLocaleString()} hint={`${info?.training_set_size ?? 1930} train / ${info?.test_set_size ?? 483} test`} icon={Hospital} accent={accent} />
        <StatCard label="Features Engineered" value={`${info?.n_columns_original ?? 55} → ${info?.n_columns_after_engineering ?? 73}`} hint="+18 derived features" icon={Layers} accent={accent} />
        <StatCard label="Success Rate" value={info?.overall_success_rate_text ?? '36.7%'} hint={info?.class_imbalance_ratio} icon={PieIcon} accent={accent} />
      </div>

      <div className="rounded-lg border border-amber-300/50 bg-amber-50/40 p-4 text-sm text-foreground/90">
        <p className="font-medium">Feature governance note</p>
        <p className="mt-1 text-xs text-muted-foreground">{PARTNER_AGE_NOTE}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display font-semibold text-base mb-1">Outcome distribution</h3>
          <p className="text-xs text-muted-foreground mb-3">Successful sperm retrieval (Outcome1) on the 2,413-patient analytical cohort.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={successData} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {successData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  <LabelList dataKey="value" position="outside" style={{ fontSize: 11 }} />
                </Pie>
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                <RTooltip wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display font-semibold text-base mb-1">Success by histopathology pattern</h3>
          <p className="text-xs text-muted-foreground mb-3">Hypospermatogenesis &gt; CSTH/MA &gt; pure SCO. Highly significant heterogeneity (χ² p &lt; 1e-46).</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pathologyChart} margin={{ top: 8, right: 16, left: 0, bottom: 28 }}>
                <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={40} interval={0} />
                <YAxis tickLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                <RTooltip wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="success" fill={accent} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="success" position="top" style={{ fontSize: 10 }} formatter={(v: number) => `${v}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display font-semibold text-base mb-1">Per-variable missingness</h3>
        <p className="text-xs text-muted-foreground mb-3">Missingness rate (%) for variables retained after clinical curation and leakage checks.</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={missingRows} layout="vertical" margin={{ top: 4, right: 30, left: 100, bottom: 4 }}>
              <XAxis type="number" domain={[0, 100]} tickLine={false} tick={{ fontSize: 10 }} unit="%" />
              <YAxis dataKey="variable" type="category" tick={{ fontSize: 10 }} tickLine={false} width={120} />
              <RTooltip wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="rate" fill="#2856a8" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="h-4 w-4 text-primary" />
            <h3 className="font-display font-semibold text-base">Cleaning steps ({cleaning.length})</h3>
          </div>
          <ol className="space-y-3 text-sm">
            {cleaning.slice(0, 8).map((s: any, i: number) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-mono font-semibold text-white shrink-0" style={{ backgroundColor: accent }}>{s.step ?? i + 1}</span>
                <div className="min-w-0">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-3">{s.details}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Microscope className="h-4 w-4 text-primary" />
            <h3 className="font-display font-semibold text-base">16 pathology indicators</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{featureEng?.sixteen_pathology_indicators?.description ?? 'Bilateral pathology binarisations per testis.'}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[...((featureEng?.sixteen_pathology_indicators?.right_testis_RT) ?? []), ...((featureEng?.sixteen_pathology_indicators?.left_testis_LT) ?? [])].map((p: string, i: number) => (
              <div key={i} className="px-2 py-1 rounded bg-muted/50 font-mono text-[11px] truncate" title={p}>
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold text-base">Transformations ({transformations.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th title={TABLE_TIPS.step} className="text-left py-2 pr-4 font-semibold cursor-help">Step</th>
                <th title={TABLE_TIPS.method} className="text-left py-2 pr-4 font-semibold cursor-help">Method</th>
                {hasScopeColumn && (
                  <th title={TABLE_TIPS.scope} className="text-left py-2 pr-4 font-semibold cursor-help">Scope</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transformations.map((t: any, i: number) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2 pr-4 font-medium">{t.name}</td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground line-clamp-2 max-w-md">{t.method}</td>
                  {hasScopeColumn && (
                    <td className="py-2 pr-4 text-xs text-muted-foreground line-clamp-2 max-w-md">{t.scope || '—'}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {outcome?.segmentation_primary_vs_salvage_with_outcome && (
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4" style={{ color: accent }} />
            <h3 className="font-display font-semibold text-base">Primary vs salvage microTESE</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-[11px] uppercase font-mono text-muted-foreground">Primary n</p>
              <p className="font-display font-bold text-xl">{outcome.segmentation_primary_vs_salvage_with_outcome?.primary_count?.toLocaleString()}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-[11px] uppercase font-mono text-muted-foreground">Primary success</p>
              <p className="font-display font-bold text-xl">{outcome.segmentation_primary_vs_salvage_with_outcome?.primary_success_pct}%</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-[11px] uppercase font-mono text-muted-foreground">Salvage n</p>
              <p className="font-display font-bold text-xl">{outcome.segmentation_primary_vs_salvage_with_outcome?.salvage_count}</p>
            </div>
            <div className="rounded-md bg-muted/40 p-3">
              <p className="text-[11px] uppercase font-mono text-muted-foreground">Salvage success</p>
              <p className="font-display font-bold text-xl">{outcome.segmentation_primary_vs_salvage_with_outcome?.salvage_success_pct}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
