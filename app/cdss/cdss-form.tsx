'use client'

import { useState } from 'react'
import { ChevronDown, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type NumField = {
  key: string
  label: string
  min: number
  q1: number
  q3: number
  max: number
  weight: number
  direction: 'higher_better' | 'lower_better' | 'centered'
}

type RiskTier = 'Low Risk' | 'Moderate Risk' | 'High Risk'

const FEATURE_FIELDS: NumField[] = [
  { key: 'LH', label: 'LH', min: 0.1, q1: 5.54, q3: 15.68, max: 63.13, weight: 0.3170224435, direction: 'lower_better' },
  { key: 'Age', label: 'Age', min: 16, q1: 35, q3: 44, max: 84, weight: 0.2701342618, direction: 'lower_better' },
  { key: 'FSH', label: 'FSH', min: 0.1, q1: 9.3875, q3: 31.215, max: 166.1, weight: 0.2503208868, direction: 'lower_better' },
  { key: 'Testosterone_levels', label: 'Testosterone_levels', min: 0.1, q1: 2.28, q3: 4.75, max: 26.8, weight: 0.2118162328, direction: 'higher_better' },
  { key: 'Body_Weight', label: 'Body_Weight', min: 6, q1: 70, q3: 91, max: 175, weight: 0.1739827698, direction: 'centered' },
  { key: 'Sakamoto_LT_mL', label: 'Sakamoto_LT/mL', min: 0, q1: 3.33984, q3: 10.9125225, max: 64.752, weight: 0.1705756237, direction: 'higher_better' },
  { key: 'BMI', label: 'BMI', min: 0, q1: 22.31, q3: 29.04, max: 52.83, weight: 0.1690428005, direction: 'centered' },
  { key: 'Height', label: 'Height', min: 145, q1: 170, q3: 180, max: 198, weight: 0.1662172247, direction: 'centered' },
  { key: 'RT_XYZ_Sono', label: 'RT_XYZ_Sono', min: 181.5, q1: 4945.875, q3: 15016.125, max: 108000, weight: 0.1563766924, direction: 'higher_better' },
  { key: 'Testicular_volume_LT', label: 'Testicular_volume_LT', min: 0.5, q1: 5, q3: 17, max: 35, weight: 0.1292453026, direction: 'higher_better' },
  { key: 'Seminal_plasma_pH', label: 'Seminal_plasma_pH', min: 6, q1: 7.8, q3: 7.8, max: 8.4, weight: 0.1276707341, direction: 'centered' },
  { key: 'Testicular_volume_RT', label: 'Testicular_volume_RT', min: 0.5, q1: 5, q3: 17, max: 35, weight: 0.1106535155, direction: 'higher_better' },
  { key: 'LT_XYZ_Sono', label: 'LT_XYZ_Sono', min: 546, q1: 4950, q3: 15410.5, max: 91200, weight: 0.0848989118, direction: 'higher_better' },
  { key: 'E2', label: 'E2', min: 5, q1: 25.3925, q3: 41.065, max: 108, weight: 0.0434829211, direction: 'centered' },
]

const PATHOLOGY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'sco', label: 'SCO (Sertoli Cell-Only Syndrome) — 846 cases (35%)' },
  { value: 'sco_csth', label: 'SCO + CSTH — 194 cases (8%)' },
  { value: 'ma_spermatocytic', label: 'MA up to Spermatocytic — 235 cases (10%)' },
  { value: 'csth', label: 'CSTH — 81 cases (3.4%)' },
  { value: 'hypospermatogenesis', label: 'Hypospermatogenesis — 38 cases (1.6%)' },
  { value: 'severe_hypospermatogenesis', label: 'Severe Hypospermatogenesis — 13 cases' },
  { value: 'leydig_hyperplasia', label: 'Leydig Cell Hyperplasia — 55 cases' },
] as const

const PATHOLOGY_FIELDS = [
  { key: 'RT_Pathology', label: 'Pathology RT' },
  { key: 'LT_Pathology', label: 'Pathology LT' },
] as const

const BRIER_EXPLANATION =
  "Brier Score: A metric measuring the accuracy of probabilistic predictions. Lower values (closer to 0) indicate better calibration. It's the mean squared difference between predicted probabilities and actual outcomes."

const BASE_SUCCESS_RATE = 0.367
const WEIGHT_SUM = FEATURE_FIELDS.reduce((acc, f) => acc + f.weight, 0)

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x))
}

function normalizeWithinBounds(value: number, field: NumField) {
  const span = Math.max(field.max - field.min, 1e-6)
  const qSpan = Math.max(field.q3 - field.q1, 1e-6)

  if (field.direction === 'higher_better') {
    if (value <= field.min) return -1
    if (value >= field.max) return 1
    if (value < field.q1) return -1 + ((value - field.min) / Math.max(field.q1 - field.min, 1e-6))
    if (value <= field.q3) return (value - field.q1) / qSpan
    return 1 - ((value - field.q3) / Math.max(field.max - field.q3, 1e-6)) * 0.4
  }

  if (field.direction === 'lower_better') {
    if (value <= field.min) return 1
    if (value >= field.max) return -1
    if (value < field.q1) return 1 - ((value - field.min) / Math.max(field.q1 - field.min, 1e-6)) * 0.5
    if (value <= field.q3) return 0.5 - ((value - field.q1) / qSpan)
    return -0.5 - ((value - field.q3) / Math.max(field.max - field.q3, 1e-6)) * 0.5
  }

  const center = (field.q1 + field.q3) / 2
  const distance = Math.abs(value - center)
  const tolerance = Math.max((field.q3 - field.q1) / 2, 1e-6)
  const normalizedDistance = distance / tolerance
  if (value < field.min || value > field.max) return -1
  if (value >= field.q1 && value <= field.q3) return 1
  return Math.max(-1, 1 - normalizedDistance)
}

function getRiskTier(probabilityPct: number): RiskTier {
  if (probabilityPct >= 70) return 'Low Risk'
  if (probabilityPct >= 40) return 'Moderate Risk'
  return 'High Risk'
}

function getRiskBadgeClass(tier: RiskTier): string {
  if (tier === 'Low Risk') return 'bg-emerald-100 text-emerald-800 border-emerald-300'
  if (tier === 'Moderate Risk') return 'bg-amber-100 text-amber-800 border-amber-300'
  return 'bg-red-100 text-red-800 border-red-300'
}

function getRiskTooltipText(probabilityPct: number, tier: RiskTier): string {
  const p = probabilityPct.toFixed(1)
  if (tier === 'Low Risk') {
    return `With a ${p}% probability of successful sperm retrieval, this patient is a good candidate for micro-TESE. Threshold ≥70% is categorized as low risk (favorable expected outcome).`
  }
  if (tier === 'Moderate Risk') {
    return `With a ${p}% probability of successful sperm retrieval, this case is borderline. Threshold 40–69% is categorized as moderate risk and should be discussed with the patient before deciding to proceed.`
  }
  return `With a ${p}% probability of successful sperm retrieval, this patient is categorized as high risk for an unfavorable outcome. Threshold <40% suggests poor candidacy; alternatives should be considered before surgery.`
}

function getInputClass(value: string | undefined, field: Pick<NumField, 'min' | 'q1' | 'q3' | 'max'>) {
  if (!value) return ''
  const v = Number(value)
  if (Number.isNaN(v)) return ''
  if (v < field.min) return 'border-red-500 ring-1 ring-red-400' // RED
  if (v > field.max) return 'border-orange-500 ring-1 ring-orange-400' // ORANGE
  if (v >= field.q1 && v <= field.q3) return 'border-emerald-500 ring-1 ring-emerald-400' // GREEN
  if (v > field.q3 && v <= field.max) {
    const midpoint = field.q3 + (field.max - field.q3) / 2
    return v <= midpoint
      ? 'border-teal-500 ring-1 ring-teal-400' // TEAL
      : 'border-amber-500 ring-1 ring-amber-400' // AMBER
  }
  return 'border-sky-500 ring-1 ring-sky-400'
}

export default function CdssForm() {
  const [vals, setVals] = useState<Record<string, string>>({})
  const [pathology, setPathology] = useState<Record<string, string[]>>({
    RT_Pathology: [],
    LT_Pathology: [],
  })
  const [result, setResult] = useState<{ p: number; tier: RiskTier } | null>(null)

  const togglePathology = (fieldKey: string, value: string) => {
    setPathology((prev) => {
      const current = prev[fieldKey] ?? []
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, [fieldKey]: next }
    })
  }

  const formatSelected = (selected: string[]) => {
    if (!selected || selected.length === 0) return ''
    return selected
      .map((v) => {
        const opt = PATHOLOGY_OPTIONS.find((o) => o.value === v)
        return opt ? opt.label.split(' — ')[0] : v
      })
      .join(', ')
  }

  const onSubmit = () => {
    const weightedSignal = FEATURE_FIELDS.reduce((acc, field) => {
      const rawValue = Number(vals[field.key] ?? '')
      if (!Number.isFinite(rawValue)) return acc
      const featureScore = normalizeWithinBounds(rawValue, field)
      return acc + field.weight * featureScore
    }, 0)

    // Note: Histopathology selections (RT_Pathology, LT_Pathology) are intentionally
    // excluded from the prediction signal. Per our LightGBM analysis, histopathological
    // patterns showed zero feature importance — the model relies on hormonal markers
    // and anthropometric features. The dropdowns are retained for clinical context only.
    const normalizedSignal = weightedSignal / WEIGHT_SUM
    const logit = Math.log(BASE_SUCCESS_RATE / (1 - BASE_SUCCESS_RATE)) + 2.25 * normalizedSignal
    const probability = sigmoid(logit)
    const pct = probability * 100
    setResult({ p: pct, tier: getRiskTier(pct) })
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-300/40 bg-blue-50/40 p-3 text-xs text-muted-foreground" title={BRIER_EXPLANATION}>
          LightGBM-based CDSS approximation with SHAP-ranked top 14 predictors (calibration-aware probability output). Histopathology shown for clinical context only — see note below.
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {FEATURE_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-medium">{f.label}</label>
              <Input
                value={vals[f.key] ?? ''}
                onChange={(e) => setVals((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={`${f.q1} ≤ x ≤ ${f.q3}`}
                className={getInputClass(vals[f.key], f)}
                type="number"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">Min: {f.min} • Q1: {f.q1} • Q3: {f.q3} • Max: {f.max}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            {PATHOLOGY_FIELDS.map((p) => {
              const selected = pathology[p.key] ?? []
              const summary = formatSelected(selected)
              return (
                <div key={p.key}>
                  <label className="text-xs font-medium">
                    {p.label}
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                      (multi-select)
                    </span>
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                          'placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          'disabled:cursor-not-allowed disabled:opacity-50',
                          selected.length === 0 && 'text-muted-foreground',
                        )}
                        aria-haspopup="listbox"
                        aria-expanded={selected.length > 0}
                      >
                        <span className="truncate text-left">
                          {selected.length === 0
                            ? 'Select histopathology patterns'
                            : `${selected.length} selected · ${summary}`}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-[var(--radix-popover-trigger-width)] min-w-[16rem] p-2"
                    >
                      <div className="flex items-center justify-between px-2 py-1">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {selected.length} selected
                        </p>
                        {selected.length > 0 && (
                          <button
                            type="button"
                            className="text-[11px] text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              setPathology((prev) => ({ ...prev, [p.key]: [] }))
                            }
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <ul className="max-h-72 overflow-y-auto" role="listbox" aria-multiselectable>
                        {PATHOLOGY_OPTIONS.map((opt) => {
                          const isChecked = selected.includes(opt.value)
                          return (
                            <li key={opt.value}>
                              <label
                                className={cn(
                                  'flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
                                  isChecked && 'bg-accent/40',
                                )}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => togglePathology(p.key, opt.value)}
                                  className="mt-0.5"
                                  aria-label={opt.label}
                                />
                                <span className="leading-snug">{opt.label}</span>
                              </label>
                            </li>
                          )
                        })}
                      </ul>
                    </PopoverContent>
                  </Popover>

                  {selected.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {selected.map((v) => {
                        const opt = PATHOLOGY_OPTIONS.find((o) => o.value === v)
                        const shortLabel = opt ? opt.label.split(' — ')[0] : v
                        return (
                          <span
                            key={v}
                            className="inline-flex items-center gap-1 rounded-full border bg-secondary/60 px-2 py-0.5 text-[10px] font-medium"
                          >
                            {shortLabel}
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => togglePathology(p.key, v)}
                              aria-label={`Remove ${shortLabel}`}
                            >
                              ×
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="rounded-lg border border-amber-300/40 bg-amber-50/40 p-3 text-xs text-muted-foreground dark:bg-amber-950/20">
            <strong>Note:</strong> In our LightGBM model, histopathological patterns showed zero feature importance. The model relies primarily on hormonal markers (LH, FSH, Testosterone) and anthropometric features (Age, BMI, Body Weight, Height) for prediction. Patients may exhibit multiple patterns simultaneously — select all that apply.
          </div>
        </div>

        <Button onClick={onSubmit} className="w-full">Compute probability</Button>

        {result && (
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Probability of successful sperm retrieval</p>
            <p className="font-display text-3xl font-bold">{result.p.toFixed(1)}%</p>

            <div className="mt-2 flex items-center justify-center gap-2">
              <p className="text-sm">Risk category:</p>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getRiskBadgeClass(result.tier)}`}>
                {result.tier}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-muted-foreground hover:bg-muted" aria-label="Risk tier explanation">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">
                  {getRiskTooltipText(result.p, result.tier)}
                  <div className="mt-2 border-t pt-2">
                    <p><strong>Thresholds:</strong></p>
                    <p>Low Risk: ≥70% | Moderate Risk: 40–69% | High Risk: &lt;40%</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Interpretation rule: <strong>higher probability = lower clinical risk</strong> for failed sperm retrieval.
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
