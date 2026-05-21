'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import BiomarkerDistributionChart, {
  type BiomarkerDistribution,
} from './biomarker-distribution-chart'
import ShapWaterfall, { type ShapContribution } from './cdss-shap-waterfall'
import ThresholdEqualizer from './cdss-threshold-equalizer'
import BinaryOutcomeCard from './cdss-binary-outcome'
import ModelInterpretation from './cdss-model-interpretation'
// Cohort distribution data (n=2,413 NOA patients). The full JSON lives at
// public/data/biomarker_distributions.json so it is also fetchable at
// runtime; here we statically import it so the values arrays are bundled
// and the KDE renders without a loading state.
import biomarkerDistributionsJson from '@/public/data/biomarker_distributions.json'

const BIOMARKER_DISTRIBUTIONS: Record<string, BiomarkerDistribution> =
  biomarkerDistributionsJson as Record<string, BiomarkerDistribution>

type NumField = {
  key: string
  label: string
  unit?: string
  min: number
  q1: number
  q3: number
  max: number
  weight: number
  direction: 'higher_better' | 'lower_better' | 'centered'
}

type RiskTier = 'Low Risk' | 'Moderate Risk' | 'High Risk'

// Height and Body_Weight removed — BMI already captures body composition.
// Seminal_plasma_pH: q1/q3 corrected to physiological range 7.2–8.0
const FEATURE_FIELDS: NumField[] = [
  { key: 'LH', label: 'LH', unit: 'mIU/mL', min: 0.1, q1: 5.54, q3: 15.68, max: 63.13, weight: 0.3170224435, direction: 'lower_better' },
  { key: 'Age', label: 'Age', unit: 'years', min: 16, q1: 35, q3: 44, max: 84, weight: 0.2701342618, direction: 'lower_better' },
  { key: 'FSH', label: 'FSH', unit: 'mIU/mL', min: 0.1, q1: 9.3875, q3: 31.215, max: 166.1, weight: 0.2503208868, direction: 'lower_better' },
  { key: 'Testosterone_levels', label: 'Testosterone', unit: 'ng/mL', min: 0.1, q1: 2.28, q3: 4.75, max: 26.8, weight: 0.2118162328, direction: 'higher_better' },
  { key: 'Sakamoto_LT_mL', label: 'Sakamoto LT', unit: 'mL', min: 0, q1: 3.33984, q3: 10.9125225, max: 64.752, weight: 0.1705756237, direction: 'higher_better' },
  { key: 'BMI', label: 'BMI', unit: 'kg/m²', min: 0, q1: 22.31, q3: 29.04, max: 52.83, weight: 0.1690428005, direction: 'centered' },
  { key: 'RT_XYZ_Sono', label: 'RT XYZ Sono', unit: 'mm³', min: 181.5, q1: 4945.875, q3: 15016.125, max: 108000, weight: 0.1563766924, direction: 'higher_better' },
  { key: 'Testicular_volume_LT', label: 'Testicular Vol. LT', unit: 'mL', min: 0.5, q1: 5, q3: 17, max: 35, weight: 0.1292453026, direction: 'higher_better' },
  { key: 'Seminal_plasma_pH', label: 'Seminal Plasma pH', min: 6, q1: 7.2, q3: 8.0, max: 8.4, weight: 0.1276707341, direction: 'centered' },
  { key: 'Testicular_volume_RT', label: 'Testicular Vol. RT', unit: 'mL', min: 0.5, q1: 5, q3: 17, max: 35, weight: 0.1106535155, direction: 'higher_better' },
  { key: 'LT_XYZ_Sono', label: 'LT XYZ Sono', unit: 'mm³', min: 546, q1: 4950, q3: 15410.5, max: 91200, weight: 0.0848989118, direction: 'higher_better' },
  { key: 'E2', label: 'E2 (Estradiol)', unit: 'pg/mL', min: 5, q1: 25.3925, q3: 41.065, max: 108, weight: 0.0434829211, direction: 'centered' },
]

const PATHOLOGY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'sco', label: 'SCO (Sertoli Cell-Only Syndrome)' },
  { value: 'sco_csth', label: 'SCO + CSTH' },
  { value: 'ma_spermatocytic', label: 'Maturation Arrest (Spermatocytic)' },
  { value: 'ma_spermatogonial', label: 'Maturation Arrest (Spermatogonial)' },
  { value: 'ma_immature_round', label: 'Maturation Arrest (Immature Round)' },
  { value: 'ma_elongated', label: 'Maturation Arrest (Elongated)' },
  { value: 'hypospermatogenesis', label: 'Hypospermatogenesis' },
  { value: 'severe_hypospermatogenesis', label: 'Severe Hypospermatogenesis' },
  { value: 'csth', label: 'CSTH (Tubular Hyalinization)' },
] as const

const PATHOLOGY_FIELDS = [
  { key: 'RT_Pathology', label: 'Pathology RT' },
  { key: 'LT_Pathology', label: 'Pathology LT' },
] as const

const BRIER_EXPLANATION =
  "Brier Score: A metric measuring the accuracy of probabilistic predictions. Lower values (closer to 0) indicate better calibration."

const BASE_SUCCESS_RATE = 0.367
const CATBOOST_AUC = 0.8306
const CATBOOST_CI = '0.823–0.845'
// RETRIEVAL_THRESHOLD removed — superseded by the user-adjustable
// ThresholdEqualizer slider, which is the single source of truth for the
// LIKELY/UNLIKELY cutoff used by BinaryOutcomeCard.
const WEIGHT_SUM = FEATURE_FIELDS.reduce((acc, f) => acc + f.weight, 0)

const PATHOLOGY_SCORE: Record<string, number> = {
  normal: 0.08,
  sco: -0.14,
  sco_csth: -0.08,
  ma_spermatogonial: -0.12,
  ma_spermatocytic: -0.06,
  ma_immature_round: -0.02,
  ma_elongated: 0.03,
  hypospermatogenesis: 0.12,
  severe_hypospermatogenesis: 0.18,
  csth: -0.04,
}

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x))
}

function normalizeWithinBounds(value: number, field: NumField) {
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

function getRiskEmoji(tier: RiskTier): string {
  if (tier === 'Low Risk') return '😊'
  if (tier === 'Moderate Risk') return '😐'
  return '😟'
}

function getRiskBadgeClass(tier: RiskTier): string {
  if (tier === 'Low Risk') return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
  if (tier === 'Moderate Risk') return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
  return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-700'
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

/**
 * Tailwind input border colour reflecting where the user-entered value
 * falls relative to the cohort's min/Q1/Q3/max. The biomarker chart below
 * the input gives the richer signal; this keeps a fast at-a-glance cue
 * directly on the field itself.
 */
function getInputClass(value: string | undefined, field: Pick<NumField, 'min' | 'q1' | 'q3' | 'max'>) {
  if (!value) return ''
  const v = Number(value)
  if (Number.isNaN(v)) return ''
  if (v < field.min) return 'border-red-500 ring-1 ring-red-400'
  if (v > field.max) return 'border-orange-500 ring-1 ring-orange-400'
  if (v >= field.q1 && v <= field.q3) return 'border-emerald-500 ring-1 ring-emerald-400'
  if (v > field.q3) return 'border-amber-500 ring-1 ring-amber-400'
  return 'border-sky-500 ring-1 ring-sky-400'
}


export default function CdssForm() {
  const [vals, setVals] = useState<Record<string, string>>({})
  const [pathology, setPathology] = useState<Record<string, string[]>>({
    RT_Pathology: [],
    LT_Pathology: [],
  })
  // `result.contributions` is the SHAP-style per-feature decomposition of
  // the logit (same numbers fed into the sigmoid in onSubmit). It is
  // consumed by ShapWaterfall and ModelInterpretation; storing it on the
  // result object means a re-render of either component cannot drift
  // away from the displayed probability.
  const [result, setResult] = useState<{
    p: number
    tier: RiskTier
    contributions: ShapContribution[]
  } | null>(null)
  // User-adjustable decision threshold for the binary outcome card. The
  // default 0.50 matches the Youden-aligned cutoff used in the thesis.
  const [threshold, setThreshold] = useState(0.5)

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
    // Per-feature contributions accumulated as we sum the weighted signal.
    // We record *what each feature added to the logit* so the SHAP
    // waterfall and the interpretation panel display exactly the same
    // numbers the model used. (Biomarker contribution = field.weight ·
    // normalised feature score; pathology contribution = the clamped
    // aggregated pathology signal.)
    const contributions: ShapContribution[] = []

    const weightedSignal = FEATURE_FIELDS.reduce((acc, field) => {
      const rawValue = Number(vals[field.key] ?? '')
      if (!Number.isFinite(rawValue)) return acc
      const featureScore = normalizeWithinBounds(rawValue, field)
      const contribution = field.weight * featureScore
      contributions.push({
        key: field.key,
        label: field.label,
        contribution,
      })
      return acc + contribution
    }, 0)

    const pathologySelections = [...(pathology.RT_Pathology ?? []), ...(pathology.LT_Pathology ?? [])]
    const pathologySignalRaw = pathologySelections.reduce((acc, key) => acc + (PATHOLOGY_SCORE[key] ?? 0), 0)
    const pathologySignal = Math.max(-0.35, Math.min(0.35, pathologySignalRaw / 2))

    // Aggregate the histopathology contribution into a single SHAP row so
    // it's directly comparable to the biomarker rows. Only added when the
    // clinician has actually selected at least one pathology pattern.
    if (pathologySelections.length > 0 && pathologySignal !== 0) {
      contributions.push({
        key: 'pathology',
        label: 'Histopathology',
        contribution: pathologySignal,
      })
    }

    const normalizedSignal = weightedSignal / WEIGHT_SUM
    const logit = Math.log(BASE_SUCCESS_RATE / (1 - BASE_SUCCESS_RATE)) + 2.1 * normalizedSignal + pathologySignal
    const probability = sigmoid(logit)
    const pct = probability * 100
    setResult({ p: pct, tier: getRiskTier(pct), contributions })
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-300/40 bg-blue-50/40 p-3 text-xs text-muted-foreground dark:bg-blue-950/20" title={BRIER_EXPLANATION}>
          CatBoost-v2-aligned CDSS approximation (AUC {CATBOOST_AUC.toFixed(4)}, 95% CI {CATBOOST_CI}; prevalence 36.7% in n=2,413). This UI demonstrates risk summarization and is not a direct model export.
        </div>

        {/* 3-column responsive grid of compact biomarker cards. The KDE
            distribution chart inside each card is hidden until the user
            has entered a valid number — typing draws the chart in with a
            short slide/fade so the form feels reactive without visual
            noise on empty cells. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURE_FIELDS.map((f) => {
            const rawVal = vals[f.key]
            const parsed =
              rawVal !== undefined && rawVal !== '' ? Number(rawVal) : NaN
            const hasValidValue = Number.isFinite(parsed)
            return (
              <div
                key={f.key}
                className="rounded-md border bg-card/40 p-2.5 space-y-1.5"
              >
                <label className="text-[11px] font-medium flex items-baseline gap-1">
                  {f.label}
                  {f.unit && (
                    <span className="text-[9px] text-muted-foreground/60 font-normal">
                      ({f.unit})
                    </span>
                  )}
                </label>
                <Input
                  value={vals[f.key] ?? ''}
                  onChange={(e) =>
                    setVals((p) => ({ ...p, [f.key]: e.target.value }))
                  }
                  placeholder={`${f.q1} – ${f.q3}`}
                  className={cn(
                    'h-8 text-xs placeholder:text-muted-foreground/30 placeholder:font-light',
                    getInputClass(vals[f.key], f),
                  )}
                  type="number"
                />
                <AnimatePresence initial={false}>
                  {hasValidValue && (
                    <motion.div
                      key="dist-chart"
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <BiomarkerDistributionChart
                        value={vals[f.key]}
                        distribution={BIOMARKER_DISTRIBUTIONS[f.key]}
                        label={f.label}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
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
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground/60">
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
                          selected.length === 0 && 'text-muted-foreground/40',
                        )}
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
            <strong>Note:</strong> Pathology is a meaningful signal in the finalized v2 pipeline (18 bilateral RT/LT pathology features). Select all histopathology patterns that apply for each side.
          </div>
        </div>

        <Button onClick={onSubmit} className="w-full">Compute Probability</Button>

        {result && (
          <div className="rounded-lg border bg-card p-5 space-y-4">
            {/* Probability */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Probability of Successful Sperm Retrieval</p>
              <p className="font-display text-4xl font-bold mt-1">{result.p.toFixed(1)}%</p>
            </div>

            {/* Risk tier with emoji */}
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">{getRiskEmoji(result.tier)}</span>
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

            <p className="text-center text-xs text-muted-foreground">
              Interpretation: <strong>higher probability = lower clinical risk</strong> for failed sperm retrieval.
            </p>
          </div>
        )}

        {/* Phase 2 explainability panels. Rendered as siblings below the
            top-level probability card so the user can compare them
            side-by-side with the headline number. Ordering is deliberate:
            (1) SHAP waterfall = global "where did this number come from?",
            (2) threshold equalizer = "what does this number mean for the
            binary cutoff?", (3) binary outcome = the answer to (2),
            (4) model interpretation = drill-down ranking for the curious. */}
        {result && (
          <>
            <ShapWaterfall
              baseRate={BASE_SUCCESS_RATE}
              probability={result.p / 100}
              contributions={result.contributions}
            />

            <ThresholdEqualizer
              threshold={threshold}
              onThresholdChange={setThreshold}
              probability={result.p / 100}
            />

            <BinaryOutcomeCard
              probability={result.p / 100}
              threshold={threshold}
            />

            <ModelInterpretation contributions={result.contributions} />
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
