'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import BiomarkerDistributionChart, {
  type BiomarkerDistribution,
} from './biomarker-distribution-chart'
import ShapWaterfall, { type ShapContribution } from './cdss-shap-waterfall'
import ThresholdEqualizer from './cdss-threshold-equalizer'
import BinaryOutcomeCard from './cdss-binary-outcome'
import ModelInterpretation from './cdss-model-interpretation'
import ClinicalInterpretation from './cdss-clinical-interpretation'
// Cohort distribution data (n=2,408 NOA patients, v3 leak-free dataset). The
// full JSON lives at public/data/biomarker_distributions.json so it is also
// fetchable at runtime; here we statically import it so the values arrays are
// bundled and the KDE renders without a loading state.
import biomarkerDistributionsJson from '@/public/data/biomarker_distributions.json'

const BIOMARKER_DISTRIBUTIONS: Record<string, BiomarkerDistribution> =
  biomarkerDistributionsJson as Record<string, BiomarkerDistribution>

// ---------------------------------------------------------------------------
// Feature catalogue (v3 — 42 SHAP features grouped into 6 clinical sections)
// ---------------------------------------------------------------------------

type Direction = 'higher_better' | 'lower_better' | 'centered'
type SectionId =
  | 'genetic'
  | 'hormonal'
  | 'volume'
  | 'pathology'
  | 'demographic'
  | 'other'

type SelectOption = { value: string; label: string }

type Feature = {
  key: string
  label: string
  section: SectionId
  unit?: string
  weight: number
  direction: Direction
  kind: 'number' | 'select'
  options?: SelectOption[]
}

type RiskTier = 'Low Risk' | 'Moderate Risk' | 'High Risk'

const SECTIONS: { id: SectionId; icon: string; title: string }[] = [
  { id: 'genetic', icon: '🧬', title: 'Genetic' },
  { id: 'hormonal', icon: '💉', title: 'Hormonal' },
  { id: 'volume', icon: '📏', title: 'Volume / Physical' },
  { id: 'pathology', icon: '🔬', title: 'Pathology' },
  { id: 'demographic', icon: '👤', title: 'Demographic' },
  { id: 'other', icon: '🧪', title: 'Other Clinical' },
]

// Weights below are the v3 leak-free CatBoost mean |SHAP| importances. They are
// used (a) to weight each feature's contribution to the approximated logit and
// (b) to render the pathology feature-importance bar chart.
const FEATURES: Feature[] = [
  // 🧬 Genetic — entered as ordinal dropdowns (ml-encoded; -1 = not tested).
  {
    key: 'karyotype_severity',
    label: 'Karyotype Severity',
    section: 'genetic',
    weight: 0.157,
    direction: 'lower_better',
    kind: 'select',
    options: [
      { value: '-1', label: 'Not Tested (-1)' },
      { value: '0', label: 'Normal (0)' },
      { value: '1', label: 'Minor (1)' },
      { value: '2', label: 'Moderate (2)' },
      { value: '3', label: 'Significant (3)' },
      { value: '4', label: 'Severe (4)' },
      { value: '5', label: 'Klinefelter (5)' },
    ],
  },
  {
    key: 'azf_deletion_severity',
    label: 'AZF Deletion Severity',
    section: 'genetic',
    weight: 0.257,
    direction: 'lower_better',
    kind: 'select',
    options: [
      { value: '-1', label: 'Not Tested (-1)' },
      { value: '0', label: 'No Deletion (0)' },
      { value: '1', label: 'Partial (1)' },
      { value: '2', label: 'Complete (2)' },
    ],
  },

  // 💉 Hormonal
  { key: 'testosterone', label: 'Testosterone', unit: 'ng/mL', section: 'hormonal', weight: 0.096, direction: 'higher_better', kind: 'number' },
  { key: 'lh', label: 'LH', unit: 'mIU/mL', section: 'hormonal', weight: 0.129, direction: 'lower_better', kind: 'number' },
  { key: 'fsh', label: 'FSH', unit: 'mIU/mL', section: 'hormonal', weight: 0.143, direction: 'lower_better', kind: 'number' },
  { key: 'prolactin', label: 'Prolactin', unit: 'mIU/L', section: 'hormonal', weight: 0.038, direction: 'centered', kind: 'number' },
  { key: 'e2', label: 'E2 (Estradiol)', unit: 'pg/mL', section: 'hormonal', weight: 0.016, direction: 'centered', kind: 'number' },
  { key: 't_e2_ratio', label: 'T / E2 Ratio', unit: 'z-score', section: 'hormonal', weight: 0.287, direction: 'higher_better', kind: 'number' },

  // 📏 Volume / Physical
  { key: 'sono_vol_rt', label: 'Sono Volume RT', unit: 'mL', section: 'volume', weight: 0.044, direction: 'higher_better', kind: 'number' },
  { key: 'sono_vol_lt', label: 'Sono Volume LT', unit: 'mL', section: 'volume', weight: 0.050, direction: 'higher_better', kind: 'number' },
  { key: 'orchidometer_rt', label: 'Orchidometer RT', unit: 'mL', section: 'volume', weight: 0.065, direction: 'higher_better', kind: 'number' },
  { key: 'orchidometer_lt', label: 'Orchidometer LT', unit: 'mL', section: 'volume', weight: 0.051, direction: 'higher_better', kind: 'number' },
  { key: 'testicular_vol_rt_guess', label: 'Testicular Vol. RT (estimate)', unit: 'mL', section: 'volume', weight: 0.076, direction: 'higher_better', kind: 'number' },
  { key: 'testicular_vol_lt_guess', label: 'Testicular Vol. LT (estimate)', unit: 'mL', section: 'volume', weight: 0.059, direction: 'higher_better', kind: 'number' },
  { key: 'rt_volume_unified', label: 'RT Volume (unified)', unit: 'z-score', section: 'volume', weight: 0.173, direction: 'higher_better', kind: 'number' },
  { key: 'lt_volume_unified', label: 'LT Volume (unified)', unit: 'z-score', section: 'volume', weight: 0.191, direction: 'higher_better', kind: 'number' },
  { key: 'total_testicular_volume', label: 'Total Testicular Volume', unit: 'z-score', section: 'volume', weight: 0.136, direction: 'higher_better', kind: 'number' },

  // 🔬 Pathology — only relevant for salvage (repeat) mTESE.
  { key: 'rt_severity_score', label: 'RT Severity Score', section: 'pathology', weight: 0.491, direction: 'higher_better', kind: 'number' },
  { key: 'rt_dominant_pattern', label: 'RT Dominant Pattern', section: 'pathology', weight: 0.272, direction: 'higher_better', kind: 'number' },
  { key: 'rt_pct_favorable', label: 'RT % Favorable', unit: '%', section: 'pathology', weight: 0.123, direction: 'higher_better', kind: 'number' },
  { key: 'rt_tissue_heterogeneity', label: 'RT Tissue Heterogeneity', section: 'pathology', weight: 0.489, direction: 'centered', kind: 'number' },
  { key: 'rt_has_leydig', label: 'RT Has Leydig (0/1)', section: 'pathology', weight: 0.034, direction: 'higher_better', kind: 'number' },
  { key: 'lt_severity_score', label: 'LT Severity Score', section: 'pathology', weight: 0.458, direction: 'higher_better', kind: 'number' },
  { key: 'lt_dominant_pattern', label: 'LT Dominant Pattern', section: 'pathology', weight: 0.114, direction: 'higher_better', kind: 'number' },
  { key: 'lt_pct_favorable', label: 'LT % Favorable', unit: '%', section: 'pathology', weight: 0.042, direction: 'higher_better', kind: 'number' },
  { key: 'lt_tissue_heterogeneity', label: 'LT Tissue Heterogeneity', section: 'pathology', weight: 0.165, direction: 'centered', kind: 'number' },
  { key: 'lt_has_leydig', label: 'LT Has Leydig (0/1)', section: 'pathology', weight: 0.070, direction: 'higher_better', kind: 'number' },

  // 👤 Demographic
  { key: 'age', label: 'Age', unit: 'years', section: 'demographic', weight: 0.192, direction: 'lower_better', kind: 'number' },
  { key: 'bmi', label: 'BMI', unit: 'kg/m²', section: 'demographic', weight: 0.105, direction: 'centered', kind: 'number' },

  // 🧪 Other Clinical
  { key: 'seminal_ph', label: 'Seminal pH', section: 'other', weight: 0.145, direction: 'centered', kind: 'number' },
  { key: 'diabetes', label: 'Diabetes (0/1)', section: 'other', weight: 0.002, direction: 'lower_better', kind: 'number' },
  { key: 'tbx', label: 'Tuberculosis Hx (0/1)', section: 'other', weight: 0.003, direction: 'lower_better', kind: 'number' },
  { key: 'surgery_severity', label: 'Surgery Severity', section: 'other', weight: 0.041, direction: 'lower_better', kind: 'number' },
  { key: 'surgery_count', label: 'Surgery Count', section: 'other', weight: 0.014, direction: 'lower_better', kind: 'number' },
  { key: 'substance_severity', label: 'Substance Severity', section: 'other', weight: 0.034, direction: 'lower_better', kind: 'number' },
  { key: 'substance_count', label: 'Substance Count', section: 'other', weight: 0.017, direction: 'lower_better', kind: 'number' },
  { key: 'varicocele_grade', label: 'Varicocele Grade', section: 'other', weight: 0.018, direction: 'lower_better', kind: 'number' },
  { key: 'occupation_risk', label: 'Occupation Risk', section: 'other', weight: 0.028, direction: 'lower_better', kind: 'number' },
  { key: 'has_infertile_family', label: 'Infertile Family Hx (0/1)', section: 'other', weight: 0.007, direction: 'lower_better', kind: 'number' },
  { key: 'is_iranian', label: 'Iranian Ethnicity (0/1)', section: 'other', weight: 0.065, direction: 'centered', kind: 'number' },
  { key: 'inguinal_hernia', label: 'Inguinal Hernia (0/1)', section: 'other', weight: 0.001, direction: 'lower_better', kind: 'number' },
  { key: 'orchiopexy', label: 'Orchiopexy (0/1)', section: 'other', weight: 0.008, direction: 'lower_better', kind: 'number' },
]

const PATHOLOGY_FEATURES = FEATURES.filter((f) => f.section === 'pathology')
const NON_PATHOLOGY_FEATURES = FEATURES.filter((f) => f.section !== 'pathology')

const BRIER_EXPLANATION =
  'Brier Score: A metric measuring the accuracy of probabilistic predictions. Lower values (closer to 0) indicate better calibration.'

const BASE_SUCCESS_RATE = 0.367
const CATBOOST_AUC = 0.7738
const CATBOOST_CI = '0.7606–0.7870'
const MODEL_HEADER = `CatBoost-v3 leak-free CDSS (AUC ${CATBOOST_AUC.toFixed(4)}, 95% CI ${CATBOOST_CI}; 5×5 nested CV; prevalence 36.7% in n=2,408)`

// Pathology feature-importance shares (percent of total pathology SHAP weight).
const PATHOLOGY_IMPORTANCE = (() => {
  const total = PATHOLOGY_FEATURES.reduce((acc, f) => acc + f.weight, 0)
  return PATHOLOGY_FEATURES.map((f) => ({
    key: f.key,
    label: f.label,
    weight: f.weight,
    pct: total > 0 ? (f.weight / total) * 100 : 0,
  })).sort((a, b) => b.pct - a.pct)
})()

type Bounds = { min: number; q1: number; q3: number; max: number }

function boundsFor(key: string): Bounds | null {
  const d = BIOMARKER_DISTRIBUTIONS[key]
  if (!d) return null
  return { min: d.min, q1: d.q1, q3: d.q3, max: d.max }
}

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x))
}

/**
 * Maps a raw feature value to a normalised [-1, 1] signal relative to the
 * cohort min/Q1/Q3/max, oriented by the feature's clinical direction.
 */
function normalizeWithinBounds(value: number, b: Bounds, direction: Direction) {
  const qSpan = Math.max(b.q3 - b.q1, 1e-6)

  if (direction === 'higher_better') {
    if (value <= b.min) return -1
    if (value >= b.max) return 1
    if (value < b.q1) return -1 + (value - b.min) / Math.max(b.q1 - b.min, 1e-6)
    if (value <= b.q3) return (value - b.q1) / qSpan
    return 1 - ((value - b.q3) / Math.max(b.max - b.q3, 1e-6)) * 0.4
  }

  if (direction === 'lower_better') {
    if (value <= b.min) return 1
    if (value >= b.max) return -1
    if (value < b.q1) return 1 - ((value - b.min) / Math.max(b.q1 - b.min, 1e-6)) * 0.5
    if (value <= b.q3) return 0.5 - (value - b.q1) / qSpan
    return -0.5 - ((value - b.q3) / Math.max(b.max - b.q3, 1e-6)) * 0.5
  }

  const center = (b.q1 + b.q3) / 2
  const distance = Math.abs(value - center)
  const tolerance = Math.max((b.q3 - b.q1) / 2, 1e-6)
  const normalizedDistance = distance / tolerance
  if (value < b.min || value > b.max) return -1
  if (value >= b.q1 && value <= b.q3) return 1
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
 * Tailwind border colour reflecting where the user-entered value falls
 * relative to the cohort's min/Q1/Q3/max.
 */
function getInputClass(value: string | undefined, key: string) {
  if (!value) return ''
  const b = boundsFor(key)
  if (!b) return ''
  const v = Number(value)
  if (Number.isNaN(v)) return ''
  if (v < b.min) return 'border-red-500 ring-1 ring-red-400'
  if (v > b.max) return 'border-orange-500 ring-1 ring-orange-400'
  if (v >= b.q1 && v <= b.q3) return 'border-emerald-500 ring-1 ring-emerald-400'
  if (v > b.q3) return 'border-amber-500 ring-1 ring-amber-400'
  return 'border-sky-500 ring-1 ring-sky-400'
}

/** Border colour for the ordinal genetic dropdowns. */
function getSelectClass(value: string | undefined) {
  if (value === undefined || value === '') return ''
  if (value === '-1') return 'border-slate-400 ring-1 ring-slate-300'
  const v = Number(value)
  if (v === 0) return 'border-emerald-500 ring-1 ring-emerald-400'
  if (v === 1) return 'border-amber-500 ring-1 ring-amber-400'
  if (v >= 2) return 'border-red-500 ring-1 ring-red-400'
  return ''
}

const KDE_INPUT_PLACEHOLDER = (key: string) => {
  const b = boundsFor(key)
  return b ? `${b.q1} – ${b.q3}` : ''
}

// Adapts the v3 lowercase keys to the legacy keys ClinicalInterpretation reads
// so the andrology rule-engine panel keeps working unchanged.
function toClinicalVals(vals: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  if (vals.fsh) out.FSH = vals.fsh
  if (vals.lh) out.LH = vals.lh
  if (vals.testosterone) out.Testosterone_levels = vals.testosterone
  if (vals.testicular_vol_lt_guess) out.Testicular_volume_LT = vals.testicular_vol_lt_guess
  if (vals.testicular_vol_rt_guess) out.Testicular_volume_RT = vals.testicular_vol_rt_guess
  if (vals.e2) out.E2 = vals.e2
  if (vals.bmi) out.BMI = vals.bmi
  if (vals.age) out.Age = vals.age
  return out
}

// ---------------------------------------------------------------------------
// Field card (shared by every numeric / select input)
// ---------------------------------------------------------------------------

function FieldCard({
  feature,
  value,
  onChange,
}: {
  feature: Feature
  value: string | undefined
  onChange: (v: string) => void
}) {
  const rawVal = value
  const parsed = rawVal !== undefined && rawVal !== '' ? Number(rawVal) : NaN
  const hasValidValue = Number.isFinite(parsed)
  // For "not tested" selects we hide the KDE (the value is a sentinel).
  const showChart = hasValidValue && !(feature.kind === 'select' && rawVal === '-1')

  return (
    <div className="rounded-md border bg-card/40 p-2.5 space-y-1.5">
      <label className="text-[11px] font-medium flex items-baseline gap-1">
        {feature.label}
        {feature.unit && (
          <span className="text-[9px] text-muted-foreground/60 font-normal">
            ({feature.unit})
          </span>
        )}
      </label>

      {feature.kind === 'select' ? (
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'flex h-8 w-full items-center rounded-md border border-input bg-background px-2 text-xs ring-offset-background',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            value === undefined || value === '' ? 'text-muted-foreground/40' : '',
            getSelectClass(value),
          )}
        >
          <option value="" disabled>
            Select…
          </option>
          {feature.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={KDE_INPUT_PLACEHOLDER(feature.key)}
          className={cn(
            'h-8 text-xs placeholder:text-muted-foreground/30 placeholder:font-light',
            getInputClass(value, feature.key),
          )}
          type="number"
        />
      )}

      <AnimatePresence initial={false}>
        {showChart && (
          <motion.div
            key="dist-chart"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <BiomarkerDistributionChart
              value={value}
              distribution={BIOMARKER_DISTRIBUTIONS[feature.key]}
              label={feature.label}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pathology feature-importance horizontal bar chart
// ---------------------------------------------------------------------------

function PathologyImportanceChart() {
  const maxPct = Math.max(...PATHOLOGY_IMPORTANCE.map((d) => d.pct), 1)
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Pathology feature importance</h4>
        <span className="text-[10px] text-muted-foreground">
          share of pathology-group SHAP weight
        </span>
      </div>
      <ul className="space-y-1.5">
        {PATHOLOGY_IMPORTANCE.map((d, i) => (
          <li
            key={d.key}
            className="grid grid-cols-[9.5rem_1fr_2.75rem] items-center gap-2 text-[11px]"
          >
            <span className="truncate font-medium text-foreground/80" title={d.label}>
              {d.label}
            </span>
            <div className="relative h-3.5 w-full rounded-sm bg-muted/40">
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: `${(d.pct / maxPct) * 100}%`, opacity: 1 }}
                transition={{ duration: 0.45, delay: 0.04 * i, ease: 'easeOut' }}
                className="absolute left-0 top-0 h-full rounded-sm bg-indigo-500/80"
              />
            </div>
            <span className="text-right font-mono tabular-nums text-muted-foreground">
              {d.pct.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
        Pathology is only available for <strong>salvage (repeat) mTESE</strong>, when
        histopathology from the prior procedure is known. Bars show each pathology
        feature&apos;s share of the total pathology-group importance in the v3 model.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

export default function CdssForm() {
  const [vals, setVals] = useState<Record<string, string>>({})
  const [isSalvage, setIsSalvage] = useState(false)
  const [openSections, setOpenSections] = useState<string[]>(
    SECTIONS.map((s) => s.id),
  )
  const [result, setResult] = useState<{
    p: number
    tier: RiskTier
    contributions: ShapContribution[]
  } | null>(null)
  const [threshold, setThreshold] = useState(0.5)

  const setVal = (key: string, v: string) =>
    setVals((prev) => ({ ...prev, [key]: v }))

  // Features that participate in the current prediction. Pathology features are
  // excluded entirely for primary (first-time) mTESE.
  const activeFeatures = useMemo(
    () => (isSalvage ? FEATURES : NON_PATHOLOGY_FEATURES),
    [isSalvage],
  )

  const onSubmit = () => {
    const contributions: ShapContribution[] = []
    let weightedSignal = 0
    let enteredWeight = 0

    for (const f of activeFeatures) {
      const raw = vals[f.key]
      if (raw === undefined || raw === '') continue
      // "Not tested" genetic sentinel contributes nothing.
      if (f.kind === 'select' && raw === '-1') continue
      const num = Number(raw)
      if (!Number.isFinite(num)) continue
      const b = boundsFor(f.key)
      if (!b) continue
      const score = normalizeWithinBounds(num, b, f.direction)
      const contribution = f.weight * score
      weightedSignal += contribution
      enteredWeight += f.weight
      contributions.push({ key: f.key, label: f.label, contribution })
    }

    const normalizedSignal = weightedSignal / Math.max(enteredWeight, 1e-6)
    const logit = Math.log(BASE_SUCCESS_RATE / (1 - BASE_SUCCESS_RATE)) + 2.1 * normalizedSignal
    const probability = sigmoid(logit)
    const pct = probability * 100
    setResult({ p: pct, tier: getRiskTier(pct), contributions })
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div
          className="rounded-lg border border-blue-300/40 bg-blue-50/40 p-3 text-xs text-muted-foreground dark:bg-blue-950/20"
          title={BRIER_EXPLANATION}
        >
          {MODEL_HEADER}. This UI demonstrates risk summarization and is not a direct model export.
        </div>

        {/* Salvage mTESE toggle — controls whether the Pathology section and its
            inputs are shown and included in the prediction. */}
        <label className="flex items-start gap-3 rounded-lg border bg-card p-3 cursor-pointer">
          <Checkbox
            checked={isSalvage}
            onCheckedChange={(c) => {
              const next = c === true
              setIsSalvage(next)
              setOpenSections((prev) =>
                next
                  ? Array.from(new Set([...prev, 'pathology']))
                  : prev.filter((s) => s !== 'pathology'),
              )
            }}
            className="mt-0.5"
            aria-label="Salvage mTESE (repeat procedure)"
          />
          <span className="space-y-0.5">
            <span className="block text-sm font-semibold">Salvage mTESE (repeat procedure)</span>
            <span className="block text-xs text-muted-foreground">
              Enable when prior testicular histopathology is available. This reveals the
              🔬 Pathology section — the strongest predictor group in the v3 model.
              Leave off for a primary (first-time) mTESE.
            </span>
          </span>
        </label>

        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="w-full space-y-3"
        >
          {SECTIONS.map((section) => {
            if (section.id === 'pathology' && !isSalvage) return null
            const sectionFeatures = FEATURES.filter((f) => f.section === section.id)
            return (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="text-lg leading-none">{section.icon}</span>
                    {section.title}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      ({sectionFeatures.length} {sectionFeatures.length === 1 ? 'field' : 'fields'})
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {sectionFeatures.map((f) => (
                      <FieldCard
                        key={f.key}
                        feature={f}
                        value={vals[f.key]}
                        onChange={(v) => setVal(f.key, v)}
                      />
                    ))}
                  </div>

                  {section.id === 'pathology' && (
                    <div className="mt-4">
                      <PathologyImportanceChart />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>

        <Button onClick={onSubmit} className="w-full">
          Compute Probability
        </Button>

        {result && (
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Probability of Successful Sperm Retrieval
              </p>
              <p className="font-display text-4xl font-bold mt-1">{result.p.toFixed(1)}%</p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">{getRiskEmoji(result.tier)}</span>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getRiskBadgeClass(result.tier)}`}
              >
                {result.tier}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-muted-foreground hover:bg-muted"
                    aria-label="Risk tier explanation"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">
                  {getRiskTooltipText(result.p, result.tier)}
                  <div className="mt-2 border-t pt-2">
                    <p>
                      <strong>Thresholds:</strong>
                    </p>
                    <p>Low Risk: ≥70% | Moderate Risk: 40–69% | High Risk: &lt;40%</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Interpretation: <strong>higher probability = lower clinical risk</strong> for
              failed sperm retrieval.
            </p>
          </div>
        )}

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

            <BinaryOutcomeCard probability={result.p / 100} threshold={threshold} />

            <ModelInterpretation contributions={result.contributions} />

            <AnimatePresence>
              <motion.div
                key="clinical-interp"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <ClinicalInterpretation vals={toClinicalVals(vals)} />
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
