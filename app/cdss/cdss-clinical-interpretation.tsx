'use client'

/**
 * ClinicalInterpretation
 * --------------------------------------------------------------------------
 * Bridges the model's numeric output to *clinical mechanism*. Where
 * ModelInterpretation says "FSH pushed the prediction up by 0.31" (a
 * statement about the model), this panel says "FSH 18 mIU/mL with T 2.1
 * ng/mL is consistent with primary Leydig-cell dysfunction" (a statement
 * about the patient's HPG axis).
 *
 * Major redesign — anatomical SVG version
 * --------------------------------------------------------------------------
 * The diagram is a medically realistic Hypothalamic-Pituitary-Gonadal
 * axis schematic: brain cross-section with hypothalamus + pituitary,
 * descending bloodstream pathway, animated testis cross-section with
 * tunica albuginea, seminiferous tubules, Sertoli/Leydig labelling,
 * rete testis, epididymis, and curving feedback loops (Inhibin B and
 * Testosterone). Each anatomical structure is a discrete <g id="…">
 * group so Framer Motion can target it for state-dependent animation
 * (pulse, fade, dashed feedback, scale for atrophy, etc.).
 *
 * The narrative for each condition is *patient-specific* — values are
 * interpolated into the prose along with the literature reference range,
 * and a short prognosis sentence cites a relevant micro-TESE paper.
 *
 * A "Scientific Basis" collapsible at the bottom of the panel documents
 * the source of the decision threshold, the cohort base rate, and every
 * cut-off used by detectConditions.
 *
 * IMPORTANT — this is a research/teaching artefact, NOT a diagnostic
 * tool. The disclaimer card states that explicitly.
 * --------------------------------------------------------------------------
 */

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, ChevronDown, Info } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type ClinicalInterpretationProps = {
  /**
   * Raw form `vals` map (keys must match FEATURE_FIELDS keys in
   * cdss-form.tsx — LH, FSH, Testosterone_levels, Testicular_volume_LT,
   * Testicular_volume_RT, E2, BMI, Age). Values are strings (right from
   * the form inputs); we parse and validate inside.
   */
  vals: Record<string, string>
}

// ---------------------------------------------------------------------------
// Clinical reference ranges (used both for detection and for the
// patient-facing narrative — keep these as the single source of truth)
// ---------------------------------------------------------------------------

const REFERENCE = {
  fsh: { low: 1.5, high: 12.4, unit: 'mIU/mL', label: 'FSH' },
  lh: { low: 1.7, high: 8.6, unit: 'mIU/mL', label: 'LH' },
  t: { low: 2.8, high: 8.0, unit: 'ng/mL', label: 'Testosterone' },
  tv: { low: 12, high: 25, unit: 'mL', label: 'Testicular volume' },
  e2: { low: 10, high: 40, unit: 'pg/mL', label: 'Estradiol' },
  bmi: { low: 18.5, high: 24.9, unit: 'kg/m²', label: 'BMI' },
  age: { low: 18, high: 45, unit: 'years', label: 'Age' },
} as const

// Detection cut-offs — slightly relaxed vs. the upper reference bound to
// avoid lighting the panel for borderline values.
const THRESHOLDS = {
  fshHigh: 12, // mIU/mL — WHO 6th ed.
  lhHigh: 9, // mIU/mL — Endocrine Society
  tLow: 3, // ng/mL — Bhasin et al. 2018 (AUA / Endocrine Society)
  tvLow: 12, // mL — Carlsen et al. 2000 (Prader orchidometer)
  e2High: 50, // pg/mL — Pavlovich et al. 2001
  bmiHigh: 30, // kg/m² — WHO Class I obesity
  ageHigh: 45, // years
} as const

// ---------------------------------------------------------------------------
// Anatomical state machine — drives the SVG rendering
// ---------------------------------------------------------------------------

type AxisState = {
  hypothalamus: 'normal' | 'compensating' | 'faded'
  gnrh: 'normal' | 'pulsing' | 'faded' | 'suppressed'
  pituitary: 'normal' | 'compensating' | 'faded'
  fsh: 'normal' | 'pulsing' | 'faded' | 'weak'
  lh: 'normal' | 'pulsing' | 'faded' | 'weak'
  testis: 'normal' | 'atrophic' | 'damaged' | 'faded'
  tubules: 'normal' | 'damaged' | 'sparse'
  sertoli: 'normal' | 'damaged'
  leydig: 'normal' | 'damaged' | 'unresponsive'
  testosterone: 'normal' | 'weak' | 'broken' | 'absent' | 'faded'
  inhibinB: 'normal' | 'broken' | 'weak'
  epididymis: 'normal' | 'faded'
  vessels: 'normal' | 'faded'
  adipose: 'none' | 'present' | 'large'
  aromatase: 'none' | 'active'
}

const DEFAULT_AXIS: AxisState = {
  hypothalamus: 'normal',
  gnrh: 'normal',
  pituitary: 'normal',
  fsh: 'normal',
  lh: 'normal',
  testis: 'normal',
  tubules: 'normal',
  sertoli: 'normal',
  leydig: 'normal',
  testosterone: 'normal',
  inhibinB: 'normal',
  epididymis: 'normal',
  vessels: 'normal',
  adipose: 'none',
  aromatase: 'none',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function num(v: string | undefined): number | null {
  if (v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

type Severity = 'severe' | 'moderate' | 'mild'

type DetectedCondition = {
  id: string
  name: string
  severity: Severity
  /** Patient-specific narrative paragraphs (JSX-friendly strings). */
  narrative: string
  /** Literature citation for the micro-TESE prognosis. */
  prognosis: string
  /** Plain-text evidence (small mono lines under the narrative). */
  evidence: string[]
  /** SVG state applied to the diagram. */
  axisState: AxisState
}

// ---------------------------------------------------------------------------
// Condition detection — combinations first, then leftover singletons
// ---------------------------------------------------------------------------

function detectConditions(vals: Record<string, string>): DetectedCondition[] {
  const fsh = num(vals.FSH)
  const lh = num(vals.LH)
  const t = num(vals.Testosterone_levels)
  const tvL = num(vals.Testicular_volume_LT)
  const tvR = num(vals.Testicular_volume_RT)
  const e2 = num(vals.E2)
  const bmi = num(vals.BMI)
  const age = num(vals.Age)

  const fshHigh = fsh !== null && fsh > THRESHOLDS.fshHigh
  const lhHigh = lh !== null && lh > THRESHOLDS.lhHigh
  const tLow = t !== null && t < THRESHOLDS.tLow

  let tvMean: number | null = null
  if (tvL !== null && tvR !== null) tvMean = (tvL + tvR) / 2
  else if (tvL !== null) tvMean = tvL
  else if (tvR !== null) tvMean = tvR
  const tvLow = tvMean !== null && tvMean < THRESHOLDS.tvLow

  const e2High = e2 !== null && e2 > THRESHOLDS.e2High
  const bmiHigh = bmi !== null && bmi > THRESHOLDS.bmiHigh
  const ageHigh = age !== null && age > THRESHOLDS.ageHigh

  const conditions: DetectedCondition[] = []
  let fshConsumed = false
  let lhConsumed = false
  let tConsumed = false

  // ----- Severe combination ---------------------------------------------
  if (fshHigh && lhHigh && tLow) {
    conditions.push({
      id: 'severe-primary-failure',
      name: 'Severe Primary Testicular Failure',
      severity: 'severe',
      narrative:
        `Concurrent elevation of FSH (${fsh!.toFixed(1)} mIU/mL; reference ${REFERENCE.fsh.low}–${REFERENCE.fsh.high}) and LH (${lh!.toFixed(1)} mIU/mL; reference ${REFERENCE.lh.low}–${REFERENCE.lh.high}) with frank testosterone deficiency (${t!.toFixed(2)} ng/mL; reference ${REFERENCE.t.low}–${REFERENCE.t.high}) indicates simultaneous failure of both testicular compartments — the seminiferous (Sertoli-cell) tubules and the interstitial (Leydig-cell) compartment. The pituitary is driving the axis maximally but the testis is unresponsive at every level.`,
      prognosis:
        'Micro-TESE success in this profile is typically 15–25% (Bryson et al., 2014; Berookhim et al., 2014). Sperm retrieval should be considered a salvage attempt with thorough counselling on alternatives (donor sperm, adoption).',
      evidence: [
        `FSH ${fsh!.toFixed(1)} mIU/mL (>${THRESHOLDS.fshHigh})`,
        `LH ${lh!.toFixed(1)} mIU/mL (>${THRESHOLDS.lhHigh})`,
        `Testosterone ${t!.toFixed(2)} ng/mL (<${THRESHOLDS.tLow})`,
      ],
      axisState: {
        ...DEFAULT_AXIS,
        gnrh: 'pulsing',
        hypothalamus: 'compensating',
        pituitary: 'compensating',
        fsh: 'pulsing',
        lh: 'pulsing',
        testis: 'damaged',
        tubules: 'damaged',
        sertoli: 'damaged',
        leydig: 'damaged',
        testosterone: 'absent',
        inhibinB: 'broken',
      },
    })
    fshConsumed = lhConsumed = tConsumed = true
  } else if (fshHigh && lhHigh) {
    conditions.push({
      id: 'hypergonadotropic-hypogonadism',
      name: 'Hypergonadotropic Hypogonadism',
      severity: 'severe',
      narrative:
        `This patient shows both gonadotropins elevated — FSH ${fsh!.toFixed(1)} mIU/mL (reference ${REFERENCE.fsh.low}–${REFERENCE.fsh.high}) and LH ${lh!.toFixed(1)} mIU/mL (reference ${REFERENCE.lh.low}–${REFERENCE.lh.high}) — consistent with loss of negative feedback from the testis to the pituitary. The hypothalamic-pituitary unit is intact and compensating, but the testicular tissue is failing to respond to gonadotropin stimulation at both Sertoli and Leydig compartments.`,
      prognosis:
        'Micro-TESE success in hypergonadotropic patterns averages 30–45% across published cohorts (Ramasamy et al., 2009; Bernie et al., 2015), with histopathology being the strongest individual predictor.',
      evidence: [
        `FSH ${fsh!.toFixed(1)} mIU/mL (>${THRESHOLDS.fshHigh})`,
        `LH ${lh!.toFixed(1)} mIU/mL (>${THRESHOLDS.lhHigh})`,
      ],
      axisState: {
        ...DEFAULT_AXIS,
        gnrh: 'pulsing',
        pituitary: 'compensating',
        fsh: 'pulsing',
        lh: 'pulsing',
        testis: 'faded',
        tubules: 'damaged',
        sertoli: 'damaged',
        leydig: 'damaged',
        testosterone: 'weak',
        inhibinB: 'broken',
      },
    })
    fshConsumed = lhConsumed = true
  } else if (tLow && lhHigh) {
    conditions.push({
      id: 'primary-hypogonadism',
      name: 'Primary Hypogonadism',
      severity: 'moderate',
      narrative:
        `Elevated LH (${lh!.toFixed(1)} mIU/mL; reference ${REFERENCE.lh.low}–${REFERENCE.lh.high}) with deficient testosterone (${t!.toFixed(2)} ng/mL; reference ${REFERENCE.t.low}–${REFERENCE.t.high}) is the biochemical hallmark of primary (testicular) hypogonadism. The pituitary is increasing LH output to drive Leydig-cell testosterone production, but the Leydig cells are unresponsive. FSH is within range, suggesting the Sertoli/spermatogenic compartment may still be partially functional.`,
      prognosis:
        'In NOA patients with isolated Leydig-cell dysfunction (intact FSH/Inhibin axis), micro-TESE success is reported around 40–55% (Schlegel & Su, 1997; Schoor et al., 2002).',
      evidence: [
        `LH ${lh!.toFixed(1)} mIU/mL (>${THRESHOLDS.lhHigh})`,
        `Testosterone ${t!.toFixed(2)} ng/mL (<${THRESHOLDS.tLow})`,
      ],
      axisState: {
        ...DEFAULT_AXIS,
        lh: 'pulsing',
        pituitary: 'compensating',
        leydig: 'unresponsive',
        testosterone: 'weak',
      },
    })
    lhConsumed = tConsumed = true
  }

  // ----- Leftover singletons -------------------------------------------
  if (fshHigh && !fshConsumed) {
    conditions.push({
      id: 'fsh-high',
      name: 'Primary Sertoli-Cell Dysfunction',
      severity: 'moderate',
      narrative:
        `Isolated FSH elevation at ${fsh!.toFixed(1)} mIU/mL (reference ${REFERENCE.fsh.low}–${REFERENCE.fsh.high}) reflects loss of Inhibin B negative feedback from Sertoli cells, indicating impaired spermatogenesis. The pituitary is compensatorily increasing FSH output, but the seminiferous-tubule compartment is failing to produce sperm. Leydig-cell function (LH, testosterone) is intact.`,
      prognosis:
        'FSH alone is a moderate-strength predictor of sperm retrieval; pooled cohorts report ≈45–55% success when FSH >12 IU/L is the sole abnormality (Ramasamy et al., 2009).',
      evidence: [
        `FSH ${fsh!.toFixed(1)} mIU/mL (>${THRESHOLDS.fshHigh})`,
      ],
      axisState: {
        ...DEFAULT_AXIS,
        fsh: 'pulsing',
        pituitary: 'compensating',
        tubules: 'damaged',
        sertoli: 'damaged',
        inhibinB: 'broken',
      },
    })
  }
  if (lhHigh && !lhConsumed) {
    conditions.push({
      id: 'lh-high',
      name: 'Leydig-Cell Dysfunction',
      severity: 'moderate',
      narrative:
        `Isolated LH elevation at ${lh!.toFixed(1)} mIU/mL (reference ${REFERENCE.lh.low}–${REFERENCE.lh.high}) suggests early Leydig-cell impairment with partial testosterone compensation. The pituitary is increasing LH drive; testosterone may still be in range but the negative-feedback loop is weakened.`,
      prognosis:
        'When LH elevation is the only abnormality, sperm retrieval rates are generally favourable (≈55–65%, Schlegel & Li, 1998) as spermatogenesis is typically preserved.',
      evidence: [`LH ${lh!.toFixed(1)} mIU/mL (>${THRESHOLDS.lhHigh})`],
      axisState: {
        ...DEFAULT_AXIS,
        lh: 'pulsing',
        leydig: 'damaged',
        testosterone: 'weak',
      },
    })
  }
  if (tLow && !tConsumed) {
    conditions.push({
      id: 't-low',
      name: 'Hypogonadism (Mixed / Secondary)',
      severity: 'moderate',
      narrative:
        `Testosterone is ${t!.toFixed(2)} ng/mL (reference ${REFERENCE.t.low}–${REFERENCE.t.high}), below the lower limit, without a clearly elevated LH. This pattern is consistent with mixed or secondary (hypothalamic/pituitary) hypogonadism; hypothalamic GnRH drive may be compensatorily elevated. Pre-operative hormonal optimisation has been associated with improved sperm retrieval in this subgroup.`,
      prognosis:
        'Reported micro-TESE success after pre-operative SERM/aromatase-inhibitor therapy in this pattern: 50–60% (Hussein et al., 2013).',
      evidence: [
        `Testosterone ${t!.toFixed(2)} ng/mL (<${THRESHOLDS.tLow})`,
      ],
      axisState: {
        ...DEFAULT_AXIS,
        gnrh: 'pulsing',
        hypothalamus: 'compensating',
        testosterone: 'weak',
      },
    })
  }

  // ----- Independent findings ------------------------------------------
  if (tvLow) {
    conditions.push({
      id: 'tv-low',
      name: 'Testicular Atrophy',
      severity: 'moderate',
      narrative:
        `Mean testicular volume of ${tvMean!.toFixed(1)} mL (reference ${REFERENCE.tv.low}–${REFERENCE.tv.high}) indicates loss of seminiferous-tubule mass — the principal anatomic correlate of spermatogenic capacity. Atrophy is a structural finding that often accompanies long-standing hormonal abnormalities.`,
      prognosis:
        'Testicular volume <12 mL is associated with reduced but not abolished retrieval rates (~30–40%); volume alone has limited individual predictive power compared to histopathology (Tsujimura et al., 2004).',
      evidence: [
        `Testicular volume (mean) ${tvMean!.toFixed(1)} mL (<${THRESHOLDS.tvLow})`,
      ],
      axisState: {
        ...DEFAULT_AXIS,
        testis: 'atrophic',
        tubules: 'sparse',
      },
    })
  }
  if (e2High) {
    conditions.push({
      id: 'e2-high',
      name: 'Aromatase Overactivity (Hyperestrogenism)',
      severity: 'mild',
      narrative:
        `Estradiol of ${e2!.toFixed(1)} pg/mL (reference ${REFERENCE.e2.low}–${REFERENCE.e2.high}) is above the male upper limit, typically reflecting increased peripheral aromatisation of testosterone to estradiol — often by adipose tissue. The excess estradiol provides strong negative feedback at the hypothalamus, suppressing GnRH and indirectly dampening the entire axis.`,
      prognosis:
        'Aromatase-inhibitor therapy normalises the T:E2 ratio and has been shown to improve retrieval rates by 10–15 percentage points (Pavlovich et al., 2001; Raman & Schlegel, 2002).',
      evidence: [`E2 ${e2!.toFixed(1)} pg/mL (>${THRESHOLDS.e2High})`],
      axisState: {
        ...DEFAULT_AXIS,
        gnrh: 'suppressed',
        fsh: 'weak',
        lh: 'weak',
        adipose: 'present',
        aromatase: 'active',
      },
    })
  }
  if (bmiHigh) {
    conditions.push({
      id: 'bmi-high',
      name: 'Obesity-Related Hormonal Disruption',
      severity: 'mild',
      narrative:
        `BMI of ${bmi!.toFixed(1)} kg/m² (reference ${REFERENCE.bmi.low}–${REFERENCE.bmi.high}) is in the obese range. Obesity is independently associated with reduced testosterone, increased peripheral aromatisation to estradiol, leptin/insulin resistance, and impaired spermatogenesis. The HPG axis is broadly suppressed via multiple convergent mechanisms.`,
      prognosis:
        'BMI >30 has been associated with a 7–10 percentage-point reduction in micro-TESE success (Hekim et al., 2018); lifestyle intervention pre-operatively is recommended.',
      evidence: [`BMI ${bmi!.toFixed(1)} kg/m² (>${THRESHOLDS.bmiHigh})`],
      axisState: {
        ...DEFAULT_AXIS,
        gnrh: 'suppressed',
        fsh: 'weak',
        lh: 'weak',
        testosterone: 'weak',
        adipose: 'large',
        aromatase: 'active',
      },
    })
  }
  if (ageHigh) {
    conditions.push({
      id: 'age-high',
      name: 'Age-Related Decline',
      severity: 'mild',
      narrative:
        `At ${age!.toFixed(0)} years, this patient is beyond the lower-risk window (${REFERENCE.age.low}–${REFERENCE.age.high}). All components of the HPG axis show gradual decline with age — reduced GnRH pulse amplitude, modest gonadotropin elevation, and progressive testicular volume loss. Sperm retrieval probability decreases approximately linearly with age in this range.`,
      prognosis:
        'Each decade beyond 40 is associated with a ≈5-percentage-point reduction in retrieval rates, independent of biochemistry (Bromage et al., 2007).',
      evidence: [`Age ${age!.toFixed(0)} years (>${THRESHOLDS.ageHigh})`],
      axisState: {
        ...DEFAULT_AXIS,
        hypothalamus: 'faded',
        gnrh: 'faded',
        pituitary: 'faded',
        fsh: 'faded',
        lh: 'faded',
        testis: 'faded',
        testosterone: 'faded',
        epididymis: 'faded',
        vessels: 'faded',
      },
    })
  }

  return conditions
}

// ---------------------------------------------------------------------------
// SVG palette — clinical 3-state color system
// --------------------------------------------------------------------------
//   • NORMAL       (#22c55e green-500)   — organs, vessels, arrows functioning normally
//   • COMPENSATING (#f59e0b amber-500)   — organs working overtime to maintain homeostasis
//   • ABNORMAL     (#ef4444 red-500)     — broken / overactive pathways, dysfunctional organs
//
// All text labels render in pure white at fontWeight 700 for maximum contrast
// on the dark anatomical card background.  Backgrounds/fills remain dark
// (slate-800/900) so the colored outlines and arrows pop visually.
// ---------------------------------------------------------------------------

const COLOR = {
  // ----- 3-state semantic colors (NEW canonical palette) -----------------
  normal: '#22c55e', // green-500 — healthy / functioning normally
  compensating: '#f59e0b', // amber-500 — increased drive / compensation
  abnormal: '#ef4444', // red-500   — broken, suppressed, or overactive

  // ----- Anatomical-only tones (interior cell-level detail) --------------
  brainFill: '#1e293b', // slate-800 — dark fill (dark theme)
  hypothalamus: '#fda4af', // rose-300 — soft pink (interior body)
  pituitaryBody: '#cbd5e1', // slate-300 (interior body)
  vesselWall: '#475569', // slate-600 — passive bloodstream wall
  vesselBlood: '#7f1d1d', // red-900 — venous tinge
  testisFill: '#1e293b', // dark fill
  sertoli: '#3b82f6', // blue-500 — Sertoli dots (normal interior)
  leydig: '#fb923c', // orange-400 — Leydig clusters (normal interior)
  rete: '#a3a3a3', // neutral-400 — rete testis network
  adipose: '#fbbf24', // amber-400 — adipose / aromatase activity

  // ----- Text + utility --------------------------------------------------
  label: '#ffffff', // pure white — universal label colour
  labelSmall: '#ffffff', // pure white — annotations equally bold
  weak: '#64748b', // slate-500 — desaturated outline for "faded" states

  // ----- Backwards-compat aliases (still used by some props) --------------
  brain: '#22c55e', // healthy brain default
  pituitary: '#22c55e', // healthy pituitary default
  testisOutline: '#22c55e', // healthy tunica default
  tubule: '#22c55e', // healthy tubules default
  fsh: '#22c55e', // healthy FSH arrow default
  lh: '#22c55e', // healthy LH arrow default
  feedback: '#22c55e', // healthy feedback arrow default
  pulse: '#ef4444', // ABNORMAL alias — used widely as the "pulse colour"
  epididymis: '#22c55e',
}

// ---------------------------------------------------------------------------
// Anatomical visualisation — INTERACTIVE 3D (React Three Fiber)
// ---------------------------------------------------------------------------
//
// The previous SVG-based `HpgAxisSvg` (plus its `Pulse` and `FlowingDots`
// helpers) has been replaced by an anatomically realistic 3D scene rendered
// with @react-three/fiber + @react-three/drei.  The 3D component lives in a
// sibling file (`./hpg-axis-3d.tsx`) and is loaded via `next/dynamic` with
// `ssr: false` because three.js cannot run in the Next.js SSR environment.
//
// All clinical logic above (REFERENCE / THRESHOLDS / detectConditions /
// AxisState / COLOR palette / narrative + prognosis text / evidence arrays)
// is preserved verbatim — only the rendering primitive has changed.
// ---------------------------------------------------------------------------

const HPGAxis3D = dynamic(() => import('./hpg-axis-3d'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[460px] w-full items-center justify-center rounded-xl bg-slate-900">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        <span className="text-xs font-medium text-slate-300">Loading 3D anatomy…</span>
      </div>
    </div>
  ),
})

// ---------------------------------------------------------------------------
// Severity style mapping
// ---------------------------------------------------------------------------

const SEVERITY_STYLES: Record<
  Severity,
  {
    leftBar: string
    border: string
    glow: string
    badge: string
    label: string
  }
> = {
  severe: {
    leftBar: 'bg-red-500',
    border: 'border-red-500/40',
    glow: 'shadow-lg shadow-red-500/15',
    badge: 'bg-red-500/15 text-red-300 border-red-500/40',
    label: 'Severe',
  },
  moderate: {
    leftBar: 'bg-amber-500',
    border: 'border-amber-500/40',
    glow: 'shadow-md shadow-amber-500/10',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    label: 'Moderate',
  },
  mild: {
    leftBar: 'bg-sky-500',
    border: 'border-sky-500/40',
    glow: 'shadow-md shadow-sky-500/10',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
    label: 'Informational',
  },
}

// ---------------------------------------------------------------------------
// Condition card
// ---------------------------------------------------------------------------

function ConditionCard({ condition }: { condition: DetectedCondition }) {
  const s = SEVERITY_STYLES[condition.severity]
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-lg border bg-card ${s.border} ${s.glow}`}
    >
      {/* Coloured left strip — instant visual severity cue */}
      <div className={`absolute left-0 top-0 h-full w-1 ${s.leftBar}`} />

      <div className="grid grid-cols-1 gap-4 p-4 pl-5 md:grid-cols-[minmax(0,520px)_1fr] md:gap-5">
        {/* ----- Interactive 3D anatomical diagram (left on md+, top on mobile) ----- */}
        {/* The container is forced to a slate-900 dark background regardless */}
        {/* of the page theme (light/dark) because the 3D scene was designed   */}
        {/* against a dark medical-illustration backdrop and uses pure white   */}
        {/* labels.  Without this, hormone-stream labels become invisible in   */}
        {/* light mode (white-on-white).                                       */}
        <div className="flex flex-col items-stretch rounded-md border border-slate-700/60 bg-slate-900 p-2">
          <HPGAxis3D state={condition.axisState} />

          {/* Color legend — explains the 3-state semantic colour system    */}
          {/* used throughout the diagram (green=normal, amber=compensating, */}
          {/* red=abnormal/dysfunctional).  Small dots match the actual SVG  */}
          {/* stroke colours so users can map them at a glance.              */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-[11px] font-semibold text-white">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-white/30"
                style={{ backgroundColor: '#22c55e' }}
                aria-hidden
              />
              Normal
            </span>
            <span className="text-slate-500" aria-hidden>
              |
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-white/30"
                style={{ backgroundColor: '#f59e0b' }}
                aria-hidden
              />
              Compensating
            </span>
            <span className="text-slate-500" aria-hidden>
              |
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-white/30"
                style={{ backgroundColor: '#ef4444' }}
                aria-hidden
              />
              Abnormal / Dysfunctional
            </span>
          </div>
        </div>

        {/* ----- Text panel ----- */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-base font-semibold leading-tight">
              {condition.name}
            </h4>
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${s.badge}`}
            >
              {s.label}
            </span>
          </div>

          <p className="text-[13px] leading-relaxed text-foreground/85">
            {condition.narrative}
          </p>

          <div className="rounded-md border border-violet-500/20 bg-violet-500/5 px-3 py-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-violet-300/80">
              Micro-TESE prognosis
            </p>
            <p className="text-[12px] leading-relaxed text-foreground/80">
              {condition.prognosis}
            </p>
          </div>

          <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Triggered by
            </p>
            <ul className="space-y-0.5">
              {condition.evidence.map((e) => (
                <li
                  key={e}
                  className="font-mono text-[11px] tabular-nums text-foreground/90"
                >
                  • {e}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Scientific Basis — collapsible footer
// ---------------------------------------------------------------------------

function ScientificBasis() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-border/60 bg-card/50">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-left transition hover:bg-muted/30"
          >
            <div className="flex items-center gap-2">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  open ? 'rotate-0' : '-rotate-90'
                }`}
              />
              <span className="text-sm font-semibold">Scientific Basis</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              thresholds, references &amp; sources
            </span>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-4 border-t border-border/60 px-4 py-4">
            {/* Decision threshold */}
            <section>
              <h5 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Decision threshold
              </h5>
              <p className="text-[12px] leading-relaxed text-foreground/85">
                The default 0.50 cutoff is derived from Youden's J statistic
                (<span className="font-mono">J = Sensitivity + Specificity − 1</span>),
                which maximises diagnostic accuracy on the ROC curve. The
                CatBoost model's AUC of <span className="font-mono">0.8306</span>{' '}
                (95% CI <span className="font-mono">0.7845–0.8767</span>)
                indicates good discriminative ability. Users can re-anchor
                the threshold using the slider above.
              </p>
            </section>

            {/* Risk tiers */}
            <section>
              <h5 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Risk stratification tiers
              </h5>
              <ul className="space-y-1 text-[12px] leading-relaxed text-foreground/85">
                <li>
                  <span className="font-mono text-red-300">&lt; 40%</span> —{' '}
                  <strong>High risk</strong>: poor candidate for micro-TESE;
                  discuss alternatives.
                </li>
                <li>
                  <span className="font-mono text-amber-300">40–69%</span> —{' '}
                  <strong>Moderate risk</strong>: shared decision-making
                  recommended.
                </li>
                <li>
                  <span className="font-mono text-emerald-300">≥ 70%</span> —{' '}
                  <strong>Low risk</strong>: favourable candidate; proceed
                  with standard counselling.
                </li>
              </ul>
            </section>

            {/* Cohort base rate */}
            <section>
              <h5 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Cohort base rate
              </h5>
              <p className="text-[12px] leading-relaxed text-foreground/85">
                In the Royan Institute NOA cohort (n = 2,413; 2007–2022),
                the baseline successful sperm retrieval rate was{' '}
                <span className="font-mono">36.7% (886 / 2,413)</span>. This
                prevalence is used as the prior for the PPV/NPV calculations
                in the Threshold Equalizer above.
              </p>
            </section>

            {/* Biomarker thresholds */}
            <section>
              <h5 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Biomarker threshold references
              </h5>
              <div className="overflow-hidden rounded-md border border-border/60">
                <table className="w-full text-[11px]">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                        Biomarker
                      </th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                        Cut-off
                      </th>
                      <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <tr>
                      <td className="px-2 py-1.5 font-mono">FSH</td>
                      <td className="px-2 py-1.5 font-mono">&gt; 12 IU/L</td>
                      <td className="px-2 py-1.5 text-foreground/80">
                        WHO Laboratory Manual (6th ed., 2021)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1.5 font-mono">LH</td>
                      <td className="px-2 py-1.5 font-mono">&gt; 9 IU/L</td>
                      <td className="px-2 py-1.5 text-foreground/80">
                        Endocrine Society Clinical Practice Guidelines
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1.5 font-mono">Testosterone</td>
                      <td className="px-2 py-1.5 font-mono">&lt; 3 ng/mL</td>
                      <td className="px-2 py-1.5 text-foreground/80">
                        AUA / Endocrine Society joint guideline (Bhasin
                        et al., 2018)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1.5 font-mono">Testis vol.</td>
                      <td className="px-2 py-1.5 font-mono">&lt; 12 mL</td>
                      <td className="px-2 py-1.5 text-foreground/80">
                        Prader orchidometer reference (Carlsen et al.,
                        2000)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1.5 font-mono">Estradiol</td>
                      <td className="px-2 py-1.5 font-mono">&gt; 50 pg/mL</td>
                      <td className="px-2 py-1.5 text-foreground/80">
                        Male hyperestrogenism threshold (Pavlovich et al.,
                        2001)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1.5 font-mono">BMI</td>
                      <td className="px-2 py-1.5 font-mono">&gt; 30 kg/m²</td>
                      <td className="px-2 py-1.5 text-foreground/80">
                        WHO obesity classification (Class I)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Top-level component
// ---------------------------------------------------------------------------

export default function ClinicalInterpretation({
  vals,
}: ClinicalInterpretationProps) {
  const conditions = useMemo(() => detectConditions(vals), [vals])

  // No abnormalities → render nothing. Parent AnimatePresence handles the
  // fade-in/out of this entire block as the user edits values.
  if (conditions.length === 0) return null

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold sm:text-base">
            Clinical Interpretation
          </h3>
          <span className="text-[10px] text-muted-foreground">
            ({conditions.length} pattern{conditions.length === 1 ? '' : 's'}{' '}
            detected)
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Mechanistic interpretation of the entered biomarkers based on
          standard andrology thresholds.{' '}
          <strong className="text-foreground/80">
            Not a diagnostic tool
          </strong>{' '}
          — intended as a teaching aid to relate the model's input space to
          the HPG axis. Patient management requires a clinician's assessment
          of the full picture.
        </p>
      </div>

      {/* Condition cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {conditions.map((c) => (
            <ConditionCard key={c.id} condition={c} />
          ))}
        </AnimatePresence>
      </div>

      {/* Scientific Basis */}
      <ScientificBasis />
    </div>
  )
}
