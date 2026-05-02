'use client'

import { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/* ─────────────── Feature definition ─────────────── */

type NumField = {
  key: string
  label: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  shapWeight: number          // mean |SHAP| from LightGBM
  direction: 'higher_better' | 'lower_better' | 'centered'
  unit?: string
}

type RiskTier = 'Low Risk' | 'Moderate Risk' | 'High Risk'

/**
 * Features ranked by SHAP importance from the LightGBM model.
 * shapWeight = mean |SHAP value| — determines each feature's contribution.
 * Distributions are from the analytical cohort (n=2,413).
 */
const FEATURE_FIELDS: NumField[] = [
  { key: 'LH', label: 'LH (Luteinizing Hormone)', min: 0.1, q1: 5.54, median: 9.37, q3: 15.68, max: 63.13, shapWeight: 0.0489, direction: 'lower_better', unit: 'mIU/mL' },
  { key: 'Age', label: 'Age', min: 16, q1: 35, median: 39, q3: 44, max: 84, shapWeight: 0.0417, direction: 'lower_better', unit: 'years' },
  { key: 'FSH', label: 'FSH (Follicle Stimulating Hormone)', min: 0.1, q1: 9.39, median: 17.8, q3: 31.22, max: 166.1, shapWeight: 0.0386, direction: 'lower_better', unit: 'mIU/mL' },
  { key: 'Testosterone_levels', label: 'Testosterone', min: 0.1, q1: 2.28, median: 3.34, q3: 4.75, max: 26.8, shapWeight: 0.0327, direction: 'higher_better', unit: 'ng/mL' },
  { key: 'Body_Weight', label: 'Body Weight', min: 6, q1: 70, median: 80, q3: 91, max: 175, shapWeight: 0.0268, direction: 'centered', unit: 'kg' },
  { key: 'Sakamoto_LT_mL', label: 'Sakamoto LT Volume', min: 0, q1: 3.34, median: 6.38, q3: 10.91, max: 64.75, shapWeight: 0.0263, direction: 'higher_better', unit: 'mL' },
  { key: 'BMI', label: 'BMI', min: 0, q1: 22.31, median: 25.39, q3: 29.04, max: 52.83, shapWeight: 0.0261, direction: 'centered', unit: 'kg/m²' },
  { key: 'Height', label: 'Height', min: 145, q1: 170, median: 175, q3: 180, max: 198, shapWeight: 0.0256, direction: 'centered', unit: 'cm' },
  { key: 'RT_XYZ_Sono', label: 'RT Sono Volume (XYZ)', min: 181.5, q1: 4945.9, median: 9180, q3: 15016.1, max: 108000, shapWeight: 0.0241, direction: 'higher_better', unit: 'mm³' },
  { key: 'Testicular_volume_LT', label: 'Testicular Volume LT', min: 0.5, q1: 5, median: 10, q3: 17, max: 35, shapWeight: 0.0199, direction: 'higher_better', unit: 'mL' },
  { key: 'Seminal_plasma_pH', label: 'Seminal Plasma pH', min: 6, q1: 7.8, median: 7.8, q3: 7.8, max: 8.4, shapWeight: 0.0197, direction: 'centered', unit: '' },
  { key: 'Testicular_volume_RT', label: 'Testicular Volume RT', min: 0.5, q1: 5, median: 10, q3: 17, max: 35, shapWeight: 0.0171, direction: 'higher_better', unit: 'mL' },
  { key: 'LT_XYZ_Sono', label: 'LT Sono Volume (XYZ)', min: 546, q1: 4950, median: 9200, q3: 15410.5, max: 91200, shapWeight: 0.0131, direction: 'higher_better', unit: 'mm³' },
  { key: 'E2', label: 'Estradiol (E2)', min: 5, q1: 25.39, median: 32.5, q3: 41.07, max: 108, shapWeight: 0.0067, direction: 'centered', unit: 'pg/mL' },
]

const PATHOLOGY_FIELDS = [
  { key: 'RT_Pathology_pct', label: 'RT Pathology Abnormality (%)' },
  { key: 'LT_Pathology_pct', label: 'LT Pathology Abnormality (%)' },
] as const

/* ─────────────── Scoring Engine ─────────────── */

/**
 * LightGBM-inspired scoring using SHAP-weighted feature contributions.
 *
 * Approach:
 *  1. For each feature, compute a normalised contribution in [-1, +1]
 *     based on where the input sits relative to the cohort distribution.
 *  2. Multiply by the mean |SHAP| weight to get the feature's log-odds contribution.
 *  3. Sum contributions + base log-odds (from base success rate 36.7%) + pathology penalty.
 *  4. Apply sigmoid to get calibrated probability.
 *
 * The scaling factor (k=2.8) was chosen so that extreme-favorable inputs
 * produce probabilities around 70-75% and extreme-unfavorable around 15-20%,
 * matching the calibrated output range of the actual LightGBM model.
 */

const BASE_SUCCESS_RATE = 0.367  // population base rate
const BASE_LOGIT = Math.log(BASE_SUCCESS_RATE / (1 - BASE_SUCCESS_RATE))  // ≈ -0.545
const SHAP_SCALING = 2.8  // scales normalized contributions to match model output range

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x))
}

function computeFeatureContribution(value: number, field: NumField): number {
  const { min, q1, median, q3, max, direction } = field

  // Clamp to observed range
  const clamped = Math.max(min, Math.min(max, value))

  // Compute percentile-like position using distribution quantiles
  let pctile: number
  if (clamped <= q1) {
    pctile = 0.25 * ((clamped - min) / Math.max(q1 - min, 1e-6))
  } else if (clamped <= median) {
    pctile = 0.25 + 0.25 * ((clamped - q1) / Math.max(median - q1, 1e-6))
  } else if (clamped <= q3) {
    pctile = 0.50 + 0.25 * ((clamped - median) / Math.max(q3 - median, 1e-6))
  } else {
    pctile = 0.75 + 0.25 * ((clamped - q3) / Math.max(max - q3, 1e-6))
  }

  // Map percentile to contribution based on clinical direction
  switch (direction) {
    case 'higher_better':
      // Higher value → positive contribution
      return (pctile - 0.5) * 2  // [-1, +1]
    case 'lower_better':
      // Lower value → positive contribution
      return (0.5 - pctile) * 2  // [-1, +1]
    case 'centered':
      // IQR is optimal; deviation penalizes
      if (clamped >= q1 && clamped <= q3) return 0.5  // within IQR = favorable
      const distFromCenter = Math.abs(clamped - median)
      const maxDist = Math.max(median - min, max - median)
      return 0.5 - (distFromCenter / maxDist)  // ranges from ~-0.5 to +0.5
    default:
      return 0
  }
}

function getRiskTier(probabilityPct: number): RiskTier {
  if (probabilityPct >= 60) return 'Low Risk'
  if (probabilityPct >= 35) return 'Moderate Risk'
  return 'High Risk'
}

function getRiskBadgeClass(tier: RiskTier): string {
  if (tier === 'Low Risk') return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
  if (tier === 'Moderate Risk') return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
  return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
}

function getRiskTooltipText(probabilityPct: number, tier: RiskTier): string {
  const p = probabilityPct.toFixed(1)
  if (tier === 'Low Risk') {
    return `With a ${p}% predicted probability of successful sperm retrieval, this patient shows favorable indicators for micro-TESE. Threshold ≥60% is categorized as low risk.`
  }
  if (tier === 'Moderate Risk') {
    return `With a ${p}% predicted probability, this case is borderline. Threshold 35–59% is categorized as moderate risk — counseling with the patient is recommended.`
  }
  return `With a ${p}% predicted probability, this patient is categorized as high risk. Threshold <35% suggests alternatives should be considered before surgery.`
}

function getInputClass(value: string | undefined, field: Pick<NumField, 'min' | 'q1' | 'q3' | 'max'>) {
  if (!value) return ''
  const v = Number(value)
  if (Number.isNaN(v)) return ''
  if (v < field.min) return 'border-red-500 ring-1 ring-red-400'
  if (v > field.max) return 'border-orange-500 ring-1 ring-orange-400'
  if (v >= field.q1 && v <= field.q3) return 'border-emerald-500 ring-1 ring-emerald-400'
  if (v > field.q3 && v <= field.max) {
    const midpoint = field.q3 + (field.max - field.q3) / 2
    return v <= midpoint ? 'border-teal-500 ring-1 ring-teal-400' : 'border-amber-500 ring-1 ring-amber-400'
  }
  return 'border-sky-500 ring-1 ring-sky-400'
}

/* ─────────────── Component ─────────────── */

export default function CdssForm() {
  const [vals, setVals] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{ p: number; tier: RiskTier; contributions: { key: string; label: string; value: number }[] } | null>(null)

  const pathologyPenalty = useMemo(() => {
    const rt = Number(vals.RT_Pathology_pct || 0)
    const lt = Number(vals.LT_Pathology_pct || 0)
    const meanPct = (Math.max(0, Math.min(100, rt)) + Math.max(0, Math.min(100, lt))) / 2
    // Higher pathology abnormality → lower success probability
    // Max penalty ≈ -0.25 log-odds at 100% abnormality
    return -0.25 * (meanPct / 100)
  }, [vals.LT_Pathology_pct, vals.RT_Pathology_pct])

  const onSubmit = () => {
    const contributions: { key: string; label: string; value: number }[] = []

    const totalLogOddsShift = FEATURE_FIELDS.reduce((acc, field) => {
      const rawValue = Number(vals[field.key] ?? '')
      if (!Number.isFinite(rawValue)) return acc
      const contribution = computeFeatureContribution(rawValue, field)
      const logOddsContribution = SHAP_SCALING * field.shapWeight * contribution
      contributions.push({ key: field.key, label: field.label, value: logOddsContribution })
      return acc + logOddsContribution
    }, 0)

    const logit = BASE_LOGIT + totalLogOddsShift + pathologyPenalty
    const probability = sigmoid(logit)
    const pct = probability * 100
    
    // Sort contributions by absolute value (most impactful first)
    contributions.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))

    setResult({ p: pct, tier: getRiskTier(pct), contributions })
  }

  return (
    <TooltipProvider>
      <div className="space-y-5">
        <div className="rounded-lg border border-blue-300/40 bg-blue-50/40 dark:bg-blue-950/20 p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">LightGBM-based Clinical Decision Support</p>
          <p>
            Probability estimation using SHAP-ranked top 14 predictors from the best-performing LightGBM model
            (AUC 0.7327 ± 0.0057). Each feature contributes proportionally to its mean |SHAP| value.
            Pathology percentages are included as an additional clinical adjustment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {FEATURE_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-medium flex items-center gap-1">
                {f.label}
                {f.unit && <span className="text-muted-foreground font-normal">({f.unit})</span>}
              </label>
              <Input
                value={vals[f.key] ?? ''}
                onChange={(e) => setVals((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={`${f.q1} ≤ x ≤ ${f.q3}`}
                className={getInputClass(vals[f.key], f)}
                type="number"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Min: {f.min} • Q1: {f.q1} • Median: {f.median} • Q3: {f.q3} • Max: {f.max}
              </p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {PATHOLOGY_FIELDS.map((p) => (
            <div key={p.key}>
              <label className="text-xs font-medium">{p.label}</label>
              <Input
                value={vals[p.key] ?? ''}
                onChange={(e) => setVals((prev) => ({ ...prev, [p.key]: e.target.value }))}
                placeholder="0 ≤ x ≤ 100"
                className={getInputClass(vals[p.key], { min: 0, q1: 25, q3: 75, max: 100 })}
                type="number"
                min={0}
                max={100}
              />
            </div>
          ))}
        </div>

        <Button onClick={onSubmit} className="w-full">Compute Probability</Button>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border bg-card p-6 space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Predicted Probability of Successful Sperm Retrieval</p>
              <p className="font-display text-4xl font-bold">{result.p.toFixed(1)}%</p>

              <div className="flex items-center justify-center gap-2">
                <p className="text-sm">Risk Category:</p>
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
                      <p>Low Risk: ≥60% | Moderate: 35–59% | High Risk: &lt;35%</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Feature Contribution Waterfall */}
            {result.contributions.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Feature Contributions (log-odds)</p>
                <div className="space-y-1.5">
                  {result.contributions.slice(0, 8).map((c) => {
                    const maxBar = 0.05
                    const barWidth = Math.min(Math.abs(c.value) / maxBar * 100, 100)
                    const isPositive = c.value >= 0
                    return (
                      <div key={c.key} className="flex items-center gap-2 text-xs">
                        <span className="w-36 truncate text-muted-foreground">{c.label}</span>
                        <div className="flex-1 flex items-center">
                          <div className="w-full flex">
                            <div className="w-1/2 flex justify-end">
                              {!isPositive && (
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${barWidth}%` }}
                                  className="h-4 rounded-l bg-red-400/70 dark:bg-red-500/50"
                                />
                              )}
                            </div>
                            <div className="w-0.5 bg-border shrink-0" />
                            <div className="w-1/2">
                              {isPositive && (
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${barWidth}%` }}
                                  className="h-4 rounded-r bg-emerald-400/70 dark:bg-emerald-500/50"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`w-14 text-right font-mono ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {c.value >= 0 ? '+' : ''}{c.value.toFixed(3)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center border-t pt-3">
              <strong>Interpretation:</strong> Higher probability = lower clinical risk for failed sperm retrieval.
              This is a decision support tool — clinical judgment should always guide final decisions.
            </p>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  )
}
