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
// Reusable pulse wrapper (Framer Motion)
// ---------------------------------------------------------------------------

function Pulse({
  children,
  active,
  duration = 1.5,
  intensity = 0.45,
}: {
  children: React.ReactNode
  active: boolean
  duration?: number
  /** Lower opacity at the bottom of the pulse (smaller = more dramatic). */
  intensity?: number
}) {
  if (!active) return <>{children}</>
  return (
    <motion.g
      animate={{ opacity: [1, intensity, 1] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
    >
      {children}
    </motion.g>
  )
}

// ---------------------------------------------------------------------------
// Flowing-dot animation along an SVG path — used for "active signalling"
// ---------------------------------------------------------------------------

function FlowingDots({
  pathId,
  color,
  count = 3,
  duration = 2.5,
  active,
  radius = 2,
}: {
  pathId: string
  color: string
  count?: number
  duration?: number
  active: boolean
  radius?: number
}) {
  if (!active) return null
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <circle key={`${pathId}-dot-${i}`} r={radius} fill={color}>
          <animateMotion
            dur={`${duration}s`}
            repeatCount="indefinite"
            begin={`${(i * duration) / count}s`}
          >
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Anatomical SVG — the centrepiece
// ---------------------------------------------------------------------------

function HpgAxisSvg({ state }: { state: AxisState }) {
  // -------------------------------------------------------------------------
  // Derived visual props per anatomical group
  // -------------------------------------------------------------------------
  // Each organ resolves to one of three semantic colours (green / amber / red)
  // depending on its state.  This is the central place where the abstract
  // AxisState enum is mapped to actual SVG colours / stroke widths.  We also
  // derive human-readable status labels for the <title> hover tooltips.
  // -------------------------------------------------------------------------

  // ----- HYPOTHALAMUS -----------------------------------------------------
  const hypFaded = state.hypothalamus === 'faded'
  const hypCompensating = state.hypothalamus === 'compensating'
  const hypStroke = hypFaded
    ? COLOR.weak
    : hypCompensating
      ? COLOR.compensating
      : COLOR.normal
  const hypStrokeWidth = hypCompensating ? 3 : 1.8
  const hypStatus = hypCompensating
    ? 'Compensating (↑drive)'
    : hypFaded
      ? 'Faded'
      : 'Normal'

  // ----- PITUITARY --------------------------------------------------------
  const pitFaded = state.pituitary === 'faded'
  const pitCompensating = state.pituitary === 'compensating'
  const pitStroke = pitFaded
    ? COLOR.weak
    : pitCompensating
      ? COLOR.compensating
      : COLOR.normal
  const pitStrokeWidth = pitCompensating ? 3 : 1.8
  const pitStatus = pitCompensating
    ? 'Compensating (↑FSH/LH output)'
    : pitFaded
      ? 'Faded'
      : 'Normal'

  // ----- GnRH ARROW -------------------------------------------------------
  const gnrhPulsing = state.gnrh === 'pulsing'
  const gnrhFaded = state.gnrh === 'faded' || state.gnrh === 'suppressed'
  const gnrhColor = gnrhFaded
    ? COLOR.weak
    : gnrhPulsing
      ? COLOR.compensating
      : COLOR.normal
  const gnrhWidth = gnrhPulsing ? 3 : 2

  // ----- FSH ARROW --------------------------------------------------------
  const fshPulsing = state.fsh === 'pulsing'
  const fshFaded = state.fsh === 'faded' || state.fsh === 'weak'
  const fshColor = fshFaded
    ? COLOR.weak
    : fshPulsing
      ? COLOR.abnormal
      : COLOR.normal
  const fshWidth = fshPulsing ? 4.5 : fshFaded ? 1.4 : 2.5
  const fshStatus = fshPulsing
    ? 'OVER-ACTIVE (↑↑) — pituitary hyper-secreting'
    : fshFaded
      ? 'Weak / Faded'
      : 'Normal'

  // ----- LH ARROW ---------------------------------------------------------
  const lhPulsing = state.lh === 'pulsing'
  const lhFaded = state.lh === 'faded' || state.lh === 'weak'
  const lhColor = lhFaded
    ? COLOR.weak
    : lhPulsing
      ? COLOR.abnormal
      : COLOR.normal
  const lhWidth = lhPulsing ? 4.5 : lhFaded ? 1.4 : 2.5
  const lhStatus = lhPulsing
    ? 'OVER-ACTIVE (↑↑) — pituitary hyper-secreting'
    : lhFaded
      ? 'Weak / Faded'
      : 'Normal'

  // ----- TESTIS -----------------------------------------------------------
  const testisAtrophic = state.testis === 'atrophic'
  const testisDamaged = state.testis === 'damaged'
  const testisFaded = state.testis === 'faded'
  const testisScale = testisAtrophic ? 0.7 : 1
  const testisStroke = testisDamaged
    ? COLOR.abnormal
    : testisAtrophic
      ? COLOR.compensating
      : testisFaded
        ? COLOR.weak
        : COLOR.normal
  const testisStrokeWidth = testisDamaged ? 4 : testisAtrophic ? 3 : 2
  const testisStatus = testisDamaged
    ? 'Damaged — primary failure'
    : testisAtrophic
      ? 'Atrophic (shrunken)'
      : testisFaded
        ? 'Faded'
        : 'Normal volume / architecture'

  // ----- TUBULES ----------------------------------------------------------
  const tubulesDamaged = state.tubules === 'damaged'
  const tubulesSparse = state.tubules === 'sparse'
  const tubuleStroke = tubulesDamaged
    ? COLOR.abnormal
    : tubulesSparse
      ? COLOR.compensating
      : COLOR.normal
  const tubuleWidth = tubulesDamaged ? 3 : 1.8
  const tubuleLumenOpacity = tubulesDamaged ? 0.25 : tubulesSparse ? 0.4 : 0.55

  // ----- SERTOLI ----------------------------------------------------------
  const sertoliDamaged = state.sertoli === 'damaged'
  const sertoliColor = sertoliDamaged ? COLOR.abnormal : COLOR.normal
  const sertoliStatus = sertoliDamaged
    ? 'Damaged — spermatogenic compartment failure'
    : 'Normal columnar cells lining tubules'

  // ----- LEYDIG -----------------------------------------------------------
  const leydigDamaged =
    state.leydig === 'damaged' || state.leydig === 'unresponsive'
  const leydigColor = leydigDamaged ? COLOR.weak : COLOR.normal
  const leydigOpacity = leydigDamaged ? 0.55 : 1
  const leydigStatus = leydigDamaged
    ? state.leydig === 'unresponsive'
      ? 'Unresponsive to LH (LH receptor failure)'
      : 'Damaged — interstitial cell loss'
    : 'Normal — interstitial T producers'

  // ----- TESTOSTERONE FEEDBACK -------------------------------------------
  // 'broken' and 'absent' both render as a thick dashed-red severed feedback
  // arrow (loop is functionally dysfunctional in both cases); 'absent' is
  // rendered at slightly lower opacity to signal "substance gone" vs "loop
  // blocked".  'weak' renders as a thin faded slate arrow.
  const tBroken = state.testosterone === 'broken'
  const tAbsent = state.testosterone === 'absent'
  const tWeak = state.testosterone === 'weak'
  const tDysfunctional = tBroken || tAbsent
  const tStroke = tDysfunctional
    ? COLOR.abnormal
    : tWeak
      ? COLOR.weak
      : COLOR.normal
  const tWidth = tDysfunctional ? 3.5 : state.testosterone === 'normal' ? 2.5 : 1.5
  const tDash = tDysfunctional ? '10 6' : tWeak ? '4 4' : undefined
  const tOpacity = tAbsent ? 0.6 : tWeak ? 0.5 : 1
  const tStatus = tBroken
    ? 'BROKEN feedback — low T cannot suppress GnRH'
    : tAbsent
      ? 'ABSENT feedback — testosterone production has failed'
      : tWeak
        ? 'Weak feedback'
        : 'Intact negative feedback (T → hypothalamus)'

  // ----- INHIBIN B FEEDBACK -----------------------------------------------
  const inhibinBroken = state.inhibinB === 'broken'
  const inhibinWeak = state.inhibinB === 'weak'
  const inhibinStroke = inhibinBroken
    ? COLOR.abnormal
    : inhibinWeak
      ? COLOR.weak
      : COLOR.normal
  const inhibinWidth = inhibinBroken ? 3.5 : 2.5
  const inhibinDash = inhibinBroken ? '10 6' : inhibinWeak ? '4 4' : undefined
  const inhibinOpacity = inhibinBroken ? 0.95 : inhibinWeak ? 0.5 : 1
  const inhibinStatus = inhibinBroken
    ? 'BROKEN feedback — Sertoli loss removes pituitary brake on FSH'
    : inhibinWeak
      ? 'Weak feedback'
      : 'Intact negative feedback (Inhibin B → pituitary)'

  // -------------------------------------------------------------------------
  // SVG render
  // -------------------------------------------------------------------------
  return (
    <svg
      viewBox="0 0 700 900"
      className="h-auto w-full max-w-[640px]"
      role="img"
      aria-label="Hypothalamic-Pituitary-Gonadal axis — detailed anatomical schematic"
    >
      {/* ===================================================================
          DEFS — markers, gradients, patterns, reusable arrow paths
          =================================================================== */}
      <defs>
        {/* Tri-state arrowheads matched to stroke colour ------------------- */}
        <marker
          id="ah-normal"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill={COLOR.normal} />
        </marker>
        <marker
          id="ah-compensating"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill={COLOR.compensating} />
        </marker>
        <marker
          id="ah-abnormal"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill={COLOR.abnormal} />
        </marker>
        <marker
          id="ah-weak"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill={COLOR.weak} />
        </marker>

        {/* Legacy aliases retained for backwards-compat with adipose etc. */}
        <marker
          id="ah-down"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill={COLOR.normal} />
        </marker>
        <marker
          id="ah-pulse"
          markerWidth="10"
          markerHeight="10"
          refX="5"
          refY="5"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 Z" fill={COLOR.abnormal} />
        </marker>

        {/* Brain fill — subtle vertical gradient for parenchymal depth ---- */}
        <radialGradient id="brain-grad" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#475569" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#334155" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0.3" />
        </radialGradient>

        {/* Testis fill — slightly warmer dark wash for visceral feel ------ */}
        <radialGradient id="testis-grad" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#475569" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0.9" />
        </radialGradient>

        {/* Tunica double-line effect via pattern --------------------------- */}
        <radialGradient id="tunica-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={testisStroke} stopOpacity="0" />
          <stop offset="92%" stopColor={testisStroke} stopOpacity="0" />
          <stop offset="100%" stopColor={testisStroke} stopOpacity="0.45" />
        </radialGradient>

        {/* Hatch pattern for damaged tissue --------------------------------- */}
        <pattern
          id="damaged-hatch"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="8"
            stroke={COLOR.pulse}
            strokeWidth="1.4"
            opacity="0.45"
          />
        </pattern>

        {/* Reusable hormone-flow paths -------------------------------------- */}
        {/* GnRH — short curve along the portal vessels between hypothalamus  */}
        {/* and anterior pituitary.                                            */}
        <path id="gnrh-path" d="M350,178 Q345,205 350,228" fill="none" />

        {/* FSH — gentle bezier descending on the LEFT side from anterior     */}
        {/* pituitary down to the left pole of the testis (Sertoli compartment)*/}
        <path
          id="fsh-path"
          d="M325,272 C 260,330 220,440 255,565"
          fill="none"
        />

        {/* LH — mirror bezier on the RIGHT side, terminating near the Leydig */}
        {/* (interstitial) compartment.                                         */}
        <path
          id="lh-path"
          d="M375,272 C 440,330 480,440 445,565"
          fill="none"
        />
      </defs>

      {/* ===================================================================
          1. BRAIN  —  sagittal cross-section, y: 20-290
          =================================================================== */}
      <g id="brain-region" opacity={hypFaded ? 0.75 : 1}>
        <title>{`Brain (sagittal view) — controls HPG axis via hypothalamus. Currently: ${hypStatus}.`}</title>

        {/* Cerebral cortex — convex top with smooth descending profile.     */}
        {/* Sagittal silhouette: arching dome at the top, slight rear bulge   */}
        {/* (occipital lobe), and tapering at the brain-stem outlet.           */}
        <path
          d="M 215,180
             C 170,180 145,140 150,100
             C 155,55  205,28  280,28
             C 350,22  430,32  490,55
             C 545,80  555,130 535,165
             C 525,180 505,182 480,180
             L 230,180
             Z"
          fill="url(#brain-grad)"
          stroke="#ffffff"
          strokeWidth="1.4"
          opacity="0.95"
        />

        {/* Subtle cortical sulci — decorative wave lines suggesting gyri    */}
        <path
          d="M 175,90  Q 210,75 245,90 Q 280,75 315,90 Q 350,75 385,90 Q 420,75 455,90 Q 490,75 520,95"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1"
          opacity="0.28"
        />
        <path
          d="M 165,115 Q 205,102 245,115 Q 285,102 325,115 Q 365,102 405,115 Q 445,102 485,115 Q 515,108 530,118"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1"
          opacity="0.22"
        />
        <path
          d="M 175,148 Q 220,138 270,148 Q 320,138 370,148 Q 420,138 470,148 Q 505,142 520,150"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1"
          opacity="0.18"
        />

        {/* Brain stem descending from the rear-base of the brain ---------- */}
        <path
          d="M 430,178
             L 425,210
             C 422,235 420,260 422,285
             L 460,285
             C 462,260 462,235 458,210
             L 455,178
             Z"
          fill="url(#brain-grad)"
          stroke="#ffffff"
          strokeWidth="1.2"
          opacity="0.85"
        />
        <text
          x="478"
          y="245"
          fontSize="13"
          fill={COLOR.label}
          fontWeight="700"
          fontStyle="italic"
        >
          brain stem
        </text>

        {/* Cerebellum — small lobed bulge at the back of the brain stem    */}
        <path
          d="M 460,180
             C 490,180 510,200 510,225
             C 510,250 488,265 465,260
             C 450,255 448,235 452,215
             C 454,200 456,190 460,180 Z"
          fill="url(#brain-grad)"
          stroke="#ffffff"
          strokeWidth="1.1"
          opacity="0.8"
        />
        {/* Cerebellar foliation */}
        <path
          d="M 462,200 Q 480,205 500,212 M 458,220 Q 478,225 502,232 M 460,240 Q 478,245 498,250"
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.9"
          opacity="0.3"
        />

        {/* ---------------- HYPOTHALAMUS ---------------- */}
        {/* Distinct nucleus region at the base of the brain.  Irregular   */}
        {/* almond outline (not a perfect ellipse) representing the multiple*/}
        {/* nuclei.  Wrapped in <Pulse> when COMPENSATING.                   */}
        <Pulse active={hypCompensating} duration={1.2} intensity={0.5}>
          <g id="hypothalamus">
            <title>{`Hypothalamus — produces GnRH pulses that drive the anterior pituitary. Currently: ${hypStatus}.`}</title>
            <path
              d="M 305,148
                 C 305,138 320,132 340,134
                 C 360,132 380,136 392,142
                 C 400,148 398,160 392,165
                 C 380,172 358,174 340,172
                 C 322,172 308,168 305,162
                 C 302,156 303,150 305,148 Z"
              fill={COLOR.hypothalamus}
              fillOpacity="0.88"
              stroke={hypStroke}
              strokeWidth={hypStrokeWidth}
            />
            {/* Neuron-cluster dots — represent supraoptic / paraventricular /
                arcuate / preoptic nuclei.  6 dots spaced asymmetrically.    */}
            <circle cx="320" cy="150" r="2.2" fill="#7f1d1d" />
            <circle cx="335" cy="146" r="2.2" fill="#7f1d1d" />
            <circle cx="350" cy="152" r="2.4" fill="#7f1d1d" />
            <circle cx="365" cy="146" r="2.2" fill="#7f1d1d" />
            <circle cx="378" cy="154" r="2.2" fill="#7f1d1d" />
            <circle cx="345" cy="162" r="2" fill="#7f1d1d" />
            <circle cx="362" cy="164" r="2" fill="#7f1d1d" />
          </g>
        </Pulse>
        <text
          x="350"
          y="124"
          textAnchor="middle"
          fontSize="15"
          fill={COLOR.label}
          fontWeight="700"
        >
          Hypothalamus
        </text>

        {/* ---------------- PORTAL VESSELS ---------------- */}
        {/* Three thin wavy curves descending from the median eminence of   */}
        {/* the hypothalamus into the anterior pituitary.  Subtle red/maroon */}
        {/* fills the inner of each vessel.                                  */}
        <g id="portal-vessels" opacity={state.vessels === 'faded' ? 0.45 : 1}>
          <title>Hypothalamic–hypophyseal portal system — carries GnRH and other releasing hormones from the median eminence directly to the anterior pituitary.</title>
          <path
            d="M 330,175 Q 326,195 332,215 Q 336,228 332,238"
            fill="none"
            stroke={COLOR.vesselWall}
            strokeWidth="2"
            opacity="0.8"
          />
          <path
            d="M 350,178 Q 348,200 354,220 Q 356,232 352,242"
            fill="none"
            stroke={COLOR.vesselBlood}
            strokeWidth="2.2"
            opacity="0.7"
          />
          <path
            d="M 370,175 Q 374,195 368,215 Q 364,228 368,238"
            fill="none"
            stroke={COLOR.vesselWall}
            strokeWidth="2"
            opacity="0.8"
          />
          <text
            x="295"
            y="218"
            fontSize="11"
            fill={COLOR.label}
            fontStyle="italic"
            fontWeight="700"
            opacity="0.85"
          >
            portal v.
          </text>
        </g>

        {/* ---------------- ANTERIOR PITUITARY ---------------- */}
        {/* Bean / kidney shape with a slight notch on the left side       */}
        {/* representing the anterior-posterior division.  Inside: 9       */}
        {/* gonadotroph circles representing FSH/LH-secreting cells.        */}
        <Pulse active={pitCompensating} duration={1.3} intensity={0.5}>
          <g id="pituitary" opacity={pitFaded ? 0.65 : 1}>
            <title>{`Anterior Pituitary — gonadotrophs secrete FSH and LH in response to GnRH. Currently: ${pitStatus}.`}</title>
            <path
              d="M 310,238
                 C 305,240 300,250 305,262
                 C 310,275 325,278 345,275
                 C 365,278 385,278 395,268
                 C 402,260 400,250 395,243
                 C 388,238 378,238 365,240
                 C 352,238 340,238 328,238
                 C 320,238 314,238 310,238 Z"
              fill={COLOR.pituitaryBody}
              fillOpacity="0.92"
              stroke={pitStroke}
              strokeWidth={pitStrokeWidth}
            />
            {/* Anterior / posterior septum — subtle vertical line */}
            <path
              d="M 360,240 Q 360,255 360,272"
              fill="none"
              stroke="#64748b"
              strokeWidth="0.9"
              opacity="0.6"
            />
            {/* Gonadotroph cells — 9 small circles representing FSH/LH-     */}
            {/* secreting cells.  Densely packed in the anterior lobe.        */}
            <circle cx="320" cy="252" r="2.2" fill="#1e40af" />
            <circle cx="328" cy="262" r="2.2" fill="#1e40af" />
            <circle cx="338" cy="252" r="2.2" fill="#1e40af" />
            <circle cx="345" cy="263" r="2.2" fill="#1e40af" />
            <circle cx="335" cy="270" r="2.2" fill="#1e40af" />
            <circle cx="350" cy="255" r="2" fill="#1e40af" />
            <circle cx="370" cy="252" r="2.2" fill="#0e7490" />
            <circle cx="380" cy="262" r="2.2" fill="#0e7490" />
            <circle cx="388" cy="252" r="2.2" fill="#0e7490" />
            <circle cx="378" cy="270" r="2" fill="#0e7490" />
          </g>
        </Pulse>
        <text
          x="350"
          y="298"
          textAnchor="middle"
          fontSize="15"
          fill={COLOR.label}
          fontWeight="700"
        >
          Anterior Pituitary
        </text>

        {/* ---------------- GnRH ARROW ---------------- */}
        {/* Short arrow alongside the portal vessels.  Pulsing GnRH =        */}
        {/* compensating hypothalamus → AMBER.  Flowing dots when active.    */}
        <g id="gnrh-arrow" opacity={gnrhFaded ? 0.4 : 1}>
          <title>{`GnRH — gonadotropin-releasing hormone pulses from hypothalamus → pituitary. Currently: ${
            gnrhPulsing ? 'Compensating (↑pulse frequency)' : gnrhFaded ? 'Faded' : 'Normal'
          }.`}</title>
          <Pulse active={gnrhPulsing} duration={1.2} intensity={0.55}>
            <use
              href="#gnrh-path"
              stroke={gnrhColor}
              strokeWidth={gnrhWidth}
              fill="none"
              markerEnd={`url(#${
                gnrhFaded ? 'ah-weak' : gnrhPulsing ? 'ah-compensating' : 'ah-normal'
              })`}
            />
          </Pulse>
          <FlowingDots
            pathId="gnrh-path"
            color={gnrhPulsing ? COLOR.compensating : COLOR.normal}
            count={gnrhPulsing ? 4 : 3}
            duration={gnrhPulsing ? 1.2 : 2.2}
            active={!gnrhFaded}
            radius={1.8}
          />
          <text
            x="392"
            y="208"
            fontSize="13"
            fontStyle="italic"
            fill={COLOR.label}
            fontWeight="700"
          >
            GnRH
          </text>
        </g>
      </g>

      {/* ===================================================================
          2. FSH / LH HORMONAL PATHWAYS — y: 280-500
          =================================================================== */}

      {/* FSH — bezier descending on the LEFT side ------------------------- */}
      <g id="fsh-arrow" opacity={fshFaded ? 0.4 : 1}>
        <title>{`FSH — follicle-stimulating hormone (pituitary → Sertoli cells). Currently: ${fshStatus}.`}</title>
        <Pulse active={fshPulsing} duration={1.1} intensity={0.5}>
          <use
            href="#fsh-path"
            stroke={fshColor}
            strokeWidth={fshWidth}
            fill="none"
            markerEnd={`url(#${
              fshFaded ? 'ah-weak' : fshPulsing ? 'ah-abnormal' : 'ah-normal'
            })`}
          />
        </Pulse>
        <FlowingDots
          pathId="fsh-path"
          color={fshColor}
          count={fshPulsing ? 5 : 3}
          duration={fshPulsing ? 1.3 : 2.6}
          active={!fshFaded}
          radius={fshPulsing ? 3 : 2.2}
        />
        <text
          x="190"
          y="430"
          fontSize="18"
          fill={COLOR.label}
          fontWeight="700"
        >
          FSH
        </text>
      </g>

      {/* LH — bezier descending on the RIGHT side ------------------------- */}
      <g id="lh-arrow" opacity={lhFaded ? 0.4 : 1}>
        <title>{`LH — luteinising hormone (pituitary → Leydig cells). Currently: ${lhStatus}.`}</title>
        <Pulse active={lhPulsing} duration={1.1} intensity={0.5}>
          <use
            href="#lh-path"
            stroke={lhColor}
            strokeWidth={lhWidth}
            fill="none"
            markerEnd={`url(#${
              lhFaded ? 'ah-weak' : lhPulsing ? 'ah-abnormal' : 'ah-normal'
            })`}
          />
        </Pulse>
        <FlowingDots
          pathId="lh-path"
          color={lhColor}
          count={lhPulsing ? 5 : 3}
          duration={lhPulsing ? 1.3 : 2.6}
          active={!lhFaded}
          radius={lhPulsing ? 3 : 2.2}
        />
        <text
          x="490"
          y="430"
          fontSize="18"
          fill={COLOR.label}
          fontWeight="700"
        >
          LH
        </text>
      </g>

      {/* ===================================================================
          3. TESTIS — anatomical cross-section, y: 540-800
          =================================================================== */}
      <motion.g
        id="testis-region"
        animate={{ scale: testisScale }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ transformOrigin: '350px 670px', transformBox: 'fill-box' }}
        opacity={testisFaded ? 0.55 : 1}
      >
        <title>{`Testis (cross-section) — site of spermatogenesis (tubules) and testosterone production (Leydig cells). Currently: ${testisStatus}.`}</title>

        {/* ---- Tunica albuginea — thick outer shell --------------------- */}
        {/* Slightly textured: solid colored ring + subtle gradient halo for */}
        {/* a double-line effect, then a fill of the tunical capsule.       */}
        <Pulse active={testisDamaged} duration={1.2} intensity={0.5}>
          <ellipse
            cx="350"
            cy="670"
            rx="135"
            ry="105"
            fill="url(#testis-grad)"
            stroke={testisStroke}
            strokeWidth={testisStrokeWidth}
          />
        </Pulse>
        {/* Inner highlight — gives the "double-line" textbook tunica look */}
        <ellipse
          cx="350"
          cy="670"
          rx="129"
          ry="99"
          fill="none"
          stroke={testisStroke}
          strokeWidth="1.1"
          opacity="0.5"
        />
        {/* Damaged hatch overlay */}
        {testisDamaged && (
          <ellipse
            cx="350"
            cy="670"
            rx="135"
            ry="105"
            fill="url(#damaged-hatch)"
          />
        )}

        {/* ---- 6 SEMINIFEROUS TUBULES — coiled circular structures ----- */}
        {/* Each tubule: outer wall circle + lighter inner lumen.            */}
        {/* Arranged in a roughly 3×2 grid inside the tunica.                */}
        {(() => {
          // Stable list of tubule centres for deterministic rendering
          const tubules: { cx: number; cy: number; r: number }[] = [
            { cx: 295, cy: 625, r: 27 },
            { cx: 350, cy: 615, r: 26 },
            { cx: 405, cy: 625, r: 27 },
            { cx: 290, cy: 710, r: 26 },
            { cx: 350, cy: 720, r: 27 },
            { cx: 410, cy: 710, r: 26 },
          ]
          // If sparse, render only the first 3 (top row) at reduced opacity
          const visible = tubulesSparse ? tubules.slice(0, 3) : tubules
          return (
            <g id="seminiferous-tubules" opacity={tubulesSparse ? 0.65 : 1}>
              <title>{`Seminiferous tubules — long coiled ducts where spermatogenesis occurs. Sertoli cells line the walls. Currently: ${
                tubulesDamaged ? 'Damaged' : tubulesSparse ? 'Sparse' : 'Normal'
              }.`}</title>
              {visible.map((t, i) => (
                <g key={`tub-${i}`}>
                  {/* Tubule outer wall */}
                  <circle
                    cx={t.cx}
                    cy={t.cy}
                    r={t.r}
                    fill="#0f172a"
                    stroke={tubuleStroke}
                    strokeWidth={tubuleWidth}
                  />
                  {/* Lumen — lighter inner circle */}
                  <circle
                    cx={t.cx}
                    cy={t.cy}
                    r={t.r - 9}
                    fill="#1e293b"
                    fillOpacity={tubuleLumenOpacity}
                    stroke={tubuleStroke}
                    strokeWidth="0.8"
                    opacity="0.55"
                  />
                  {/* ---- Sertoli cells: 4 small columnar epithelial cells  */}
                  {/* lining the inner wall (top / right / bottom / left).    */}
                  {/* Each is a small rectangle pointing toward tubule centre.*/}
                  <Pulse active={sertoliDamaged} duration={1.2} intensity={0.5}>
                    <g id={`sertoli-${i}`}>
                      <title>{`Sertoli cell (columnar epithelium lining tubule). ${sertoliStatus}.`}</title>
                      {/* Top */}
                      <rect
                        x={t.cx - 2.5}
                        y={t.cy - t.r + 2}
                        width="5"
                        height="11"
                        rx="1"
                        fill={sertoliColor}
                        stroke={sertoliColor}
                        strokeWidth="0.4"
                      />
                      {/* Right */}
                      <rect
                        x={t.cx + t.r - 13}
                        y={t.cy - 2.5}
                        width="11"
                        height="5"
                        rx="1"
                        fill={sertoliColor}
                        stroke={sertoliColor}
                        strokeWidth="0.4"
                      />
                      {/* Bottom */}
                      <rect
                        x={t.cx - 2.5}
                        y={t.cy + t.r - 13}
                        width="5"
                        height="11"
                        rx="1"
                        fill={sertoliColor}
                        stroke={sertoliColor}
                        strokeWidth="0.4"
                      />
                      {/* Left */}
                      <rect
                        x={t.cx - t.r + 2}
                        y={t.cy - 2.5}
                        width="11"
                        height="5"
                        rx="1"
                        fill={sertoliColor}
                        stroke={sertoliColor}
                        strokeWidth="0.4"
                      />
                      {/* × marks overlay when damaged */}
                      {sertoliDamaged && (
                        <>
                          <line
                            x1={t.cx - 4}
                            y1={t.cy - t.r + 4}
                            x2={t.cx + 4}
                            y2={t.cy - t.r + 12}
                            stroke="#ffffff"
                            strokeWidth="1.2"
                          />
                          <line
                            x1={t.cx + 4}
                            y1={t.cy - t.r + 4}
                            x2={t.cx - 4}
                            y2={t.cy - t.r + 12}
                            stroke="#ffffff"
                            strokeWidth="1.2"
                          />
                        </>
                      )}
                    </g>
                  </Pulse>
                </g>
              ))}
            </g>
          )
        })()}

        {/* ---- LEYDIG CELLS — interstitial clusters --------------------- */}
        {/* 4 clusters of 4-5 cells each (≈18 individual round cells).      */}
        {/* Positioned in the gaps between tubules.  When unresponsive /     */}
        {/* damaged: grayed-out + reduced opacity + pulse animation.         */}
        <Pulse active={leydigDamaged} duration={1.4} intensity={0.55}>
          <g id="leydig-cells" opacity={leydigOpacity}>
            <title>{`Leydig cells — interstitial endocrine cells producing testosterone. ${leydigStatus}.`}</title>
            {/* Cluster 1: left gap (between top-left and bottom-left tubules) */}
            <g>
              <circle cx="252" cy="668" r="3.6" fill={leydigColor} />
              <circle cx="260" cy="660" r="3.4" fill={leydigColor} />
              <circle cx="258" cy="676" r="3.4" fill={leydigColor} />
              <circle cx="248" cy="678" r="3.2" fill={leydigColor} />
              <circle cx="265" cy="668" r="3.2" fill={leydigColor} />
            </g>
            {/* Cluster 2: top-centre gap (between top tubules) */}
            <g>
              <circle cx="322" cy="623" r="3.4" fill={leydigColor} />
              <circle cx="330" cy="618" r="3.2" fill={leydigColor} />
              <circle cx="328" cy="632" r="3.4" fill={leydigColor} />
              <circle cx="320" cy="635" r="3.2" fill={leydigColor} />
            </g>
            <g>
              <circle cx="378" cy="618" r="3.4" fill={leydigColor} />
              <circle cx="384" cy="625" r="3.2" fill={leydigColor} />
              <circle cx="372" cy="630" r="3.4" fill={leydigColor} />
              <circle cx="380" cy="635" r="3.2" fill={leydigColor} />
            </g>
            {/* Cluster 3: right gap */}
            <g>
              <circle cx="445" cy="668" r="3.6" fill={leydigColor} />
              <circle cx="452" cy="660" r="3.4" fill={leydigColor} />
              <circle cx="454" cy="676" r="3.4" fill={leydigColor} />
              <circle cx="442" cy="678" r="3.2" fill={leydigColor} />
              <circle cx="438" cy="668" r="3.2" fill={leydigColor} />
            </g>
            {/* Cluster 4: bottom-centre gap */}
            <g>
              <circle cx="322" cy="755" r="3.4" fill={leydigColor} />
              <circle cx="330" cy="748" r="3.2" fill={leydigColor} />
              <circle cx="328" cy="762" r="3.4" fill={leydigColor} />
              <circle cx="318" cy="763" r="3.2" fill={leydigColor} />
            </g>
            <g>
              <circle cx="378" cy="748" r="3.4" fill={leydigColor} />
              <circle cx="384" cy="756" r="3.4" fill={leydigColor} />
              <circle cx="372" cy="762" r="3.2" fill={leydigColor} />
              <circle cx="380" cy="765" r="3.2" fill={leydigColor} />
            </g>
            {/* Cluster 5: small top-center cluster between upper tubules */}
            <g>
              <circle cx="350" cy="660" r="3.4" fill={leydigColor} />
              <circle cx="358" cy="665" r="3.2" fill={leydigColor} />
              <circle cx="343" cy="666" r="3.2" fill={leydigColor} />
            </g>
          </g>
        </Pulse>

        {/* Sertoli label (anchored to top-left tubule) */}
        <text
          x="245"
          y="595"
          fontSize="13"
          fill={COLOR.label}
          fontWeight="700"
        >
          Sertoli Cells
        </text>
        <line
          x1="290"
          y1="598"
          x2="295"
          y2="605"
          stroke={COLOR.label}
          strokeWidth="1"
          opacity="0.6"
        />

        {/* Leydig label (anchored to bottom cluster) */}
        <text
          x="245"
          y="790"
          fontSize="13"
          fill={COLOR.label}
          fontWeight="700"
        >
          Leydig Cells
        </text>
        <line
          x1="290"
          y1="786"
          x2="320"
          y2="765"
          stroke={COLOR.label}
          strokeWidth="1"
          opacity="0.6"
        />

        {/* ---- RETE TESTIS — network of channels (right-centre) -------- */}
        <g id="rete-testis" opacity="0.7">
          <title>Rete testis — anastomosing channels collecting sperm from seminiferous tubules toward the epididymis.</title>
          {/* Network of small interconnected lines forming a mesh */}
          <path
            d="M 466,640 Q 472,660 466,680 Q 472,700 466,718"
            fill="none"
            stroke={COLOR.rete}
            strokeWidth="1.4"
          />
          <path
            d="M 475,640 Q 470,660 475,680 Q 470,700 475,718"
            fill="none"
            stroke={COLOR.rete}
            strokeWidth="1.4"
          />
          <path
            d="M 484,640 Q 478,660 484,680 Q 478,700 484,718"
            fill="none"
            stroke={COLOR.rete}
            strokeWidth="1.4"
          />
          {/* Cross-connections */}
          <path
            d="M 464,650 L 486,650 M 464,675 L 486,675 M 464,700 L 486,700"
            fill="none"
            stroke={COLOR.rete}
            strokeWidth="0.9"
            opacity="0.65"
          />
          <text
            x="500"
            y="678"
            fontSize="12"
            fill={COLOR.label}
            fontWeight="700"
            fontStyle="italic"
          >
            Rete Testis
          </text>
        </g>

        {/* ---- EPIDIDYMIS — comma/crescent attached to top-right ------- */}
        <g
          id="epididymis"
          opacity={state.epididymis === 'faded' ? 0.5 : 1}
        >
          <title>Epididymis — coiled tubular structure where sperm mature and are stored after leaving the rete testis.</title>
          <path
            d="M 488,580
               C 525,572 545,595 542,635
               C 540,675 522,695 500,690
               C 484,683 478,665 480,645
               C 482,625 484,605 488,580 Z"
            fill="#1e293b"
            stroke={state.epididymis === 'faded' ? COLOR.weak : COLOR.normal}
            strokeWidth="2"
          />
          {/* Coil pattern showing convoluted tubule */}
          <path
            d="M 498,595 Q 515,592 528,605
               M 495,608 Q 515,605 530,620
               M 494,624 Q 514,620 532,635
               M 495,640 Q 514,638 530,650
               M 497,656 Q 514,654 528,665
               M 500,672 Q 514,670 526,680"
            fill="none"
            stroke={state.epididymis === 'faded' ? COLOR.weak : COLOR.normal}
            strokeWidth="1.3"
            opacity="0.7"
          />
          {/* Connection from rete to epididymis (efferent ductules) */}
          <path
            d="M 486,635 Q 492,610 495,585"
            fill="none"
            stroke={state.epididymis === 'faded' ? COLOR.weak : COLOR.normal}
            strokeWidth="1.2"
            opacity="0.55"
            strokeDasharray="2 2"
          />
          <text
            x="528"
            y="572"
            fontSize="13"
            fill={COLOR.label}
            fontWeight="700"
          >
            Epididymis
          </text>
        </g>

        {/* ---- Testicular artery / vein — running lateral to testis ---- */}
        <g id="testicular-vessels" opacity={state.vessels === 'faded' ? 0.4 : 0.8}>
          <title>Testicular artery and pampiniform plexus — blood supply and venous drainage.</title>
          <path
            d="M 213,608 Q 200,640 208,690"
            fill="none"
            stroke="#dc2626"
            strokeWidth="1.6"
            opacity="0.75"
          />
          <path
            d="M 222,610 Q 210,640 218,692"
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="1.6"
            opacity="0.75"
          />
          <text
            x="170"
            y="650"
            fontSize="11"
            fill={COLOR.label}
            fontStyle="italic"
            fontWeight="700"
          >
            a./v.
          </text>
        </g>

        {/* Testis title label */}
        <text
          x="350"
          y="810"
          textAnchor="middle"
          fontSize="17"
          fill={COLOR.label}
          fontWeight="700"
        >
          Testis
        </text>
      </motion.g>

      {/* ===================================================================
          4. FEEDBACK LOOPS — curving outside the central column
          =================================================================== */}

      {/* ---------------- INHIBIN B FEEDBACK ----------------               */}
      {/* From Sertoli (left side of testis) up the LEFT side to pituitary. */}
      {/* Long sweeping bezier well clear of the central anatomy.            */}
      <g id="inhibin-feedback" opacity={inhibinOpacity}>
        <title>{`Inhibin B — Sertoli cells → anterior pituitary negative feedback. Suppresses FSH. ${inhibinStatus}.`}</title>
        <Pulse active={inhibinBroken} duration={1.2} intensity={0.4}>
          <path
            d="M 220,650
               C 100,580 50,400 70,250
               Q 110,225 250,238
               L 305,245"
            fill="none"
            stroke={inhibinStroke}
            strokeWidth={inhibinWidth}
            strokeDasharray={inhibinDash}
            markerEnd={`url(#${
              inhibinBroken
                ? 'ah-abnormal'
                : inhibinWeak
                  ? 'ah-weak'
                  : 'ah-normal'
            })`}
          />
        </Pulse>
        <text
          x="34"
          y="430"
          fontSize="14"
          fill={COLOR.label}
          fontStyle="italic"
          fontWeight="700"
        >
          Inhibin B (−)
        </text>
        <text
          x="34"
          y="448"
          fontSize="11"
          fill={COLOR.label}
          fontStyle="italic"
          fontWeight="700"
          opacity="0.85"
        >
          Sertoli → pit.
        </text>
      </g>

      {/* ---------------- TESTOSTERONE FEEDBACK ----------------           */}
      {/* From Leydig (right side of testis) up the RIGHT side to           */}
      {/* hypothalamus.  Long sweeping bezier on the far right.              */}
      <g id="testosterone-feedback" opacity={tOpacity}>
        <title>{`Testosterone — Leydig cells → hypothalamus negative feedback. Suppresses GnRH. ${tStatus}.`}</title>
        <Pulse active={tDysfunctional} duration={1.2} intensity={0.4}>
          <path
            d="M 478,648
               C 610,580 660,400 640,230
               Q 600,148 450,144
               L 395,150"
            fill="none"
            stroke={tStroke}
            strokeWidth={tWidth}
            strokeDasharray={tDash}
            markerEnd={`url(#${
              tDysfunctional
                ? 'ah-abnormal'
                : tWeak
                  ? 'ah-weak'
                  : 'ah-normal'
            })`}
          />
        </Pulse>
        <text
          x="608"
          y="430"
          fontSize="14"
          fill={COLOR.label}
          fontStyle="italic"
          fontWeight="700"
        >
          T (−)
        </text>
        <text
          x="590"
          y="448"
          fontSize="11"
          fill={COLOR.label}
          fontStyle="italic"
          fontWeight="700"
          opacity="0.85"
        >
          Leydig → hyp.
        </text>
      </g>

      {/* ===================================================================
          5. OPTIONAL: ADIPOSE TISSUE (shown for E2↑ or BMI↑)
          =================================================================== */}
      {state.adipose !== 'none' && (
        <g id="adipose">
          <title>Adipose tissue — peripheral aromatase converts testosterone to estradiol (E2). When excess body fat is present, this shunt increases E2, suppressing pituitary FSH/LH.</title>
          {/* Wavy / blobby shape on the far right side */}
          <path
            d={
              state.adipose === 'large'
                ? 'M 565,420 Q 555,395 580,385 Q 612,378 632,400 Q 650,425 638,452 Q 620,478 590,478 Q 562,475 558,452 Q 555,440 565,420 Z'
                : 'M 572,425 Q 570,408 590,402 Q 612,400 622,420 Q 628,440 615,452 Q 595,460 580,455 Q 568,447 572,425 Z'
            }
            fill={COLOR.adipose}
            fillOpacity="0.35"
            stroke={COLOR.adipose}
            strokeWidth="1.2"
          />
          {/* Lipid droplets — small circles inside the adipose blob */}
          {(state.adipose === 'large'
            ? [
                [585, 410],
                [605, 405],
                [625, 418],
                [610, 432],
                [590, 442],
                [570, 432],
                [620, 450],
              ]
            : [
                [585, 420],
                [605, 425],
                [600, 442],
                [580, 440],
              ]
          ).map(([cx, cy], i) => (
            <circle
              key={`lipid-${i}`}
              cx={cx}
              cy={cy}
              r={state.adipose === 'large' ? 4 : 3}
              fill={COLOR.adipose}
              fillOpacity="0.55"
            />
          ))}
          <text
            x={state.adipose === 'large' ? 598 : 600}
            y={state.adipose === 'large' ? 500 : 485}
            textAnchor="middle"
            fontSize="13"
            fill={COLOR.label}
            fontWeight="700"
          >
            Adipose Tissue
          </text>
          {state.aromatase === 'active' && (
            <text
              x={state.adipose === 'large' ? 598 : 600}
              y={state.adipose === 'large' ? 516 : 500}
              textAnchor="middle"
              fontSize="12"
              fill={COLOR.label}
              fontStyle="italic"
              fontWeight="700"
            >
              aromatase: T → E2
            </text>
          )}
        </g>
      )}

      {/* Aromatase arrow — T diverted to E2 in adipose tissue.              */}
      {/* Compensatory shunt → AMBER colour (not red).                       */}
      {state.aromatase === 'active' && (
        <Pulse active duration={1.6}>
          <g id="aromatase-arrow">
            <title>Aromatase shunt — peripheral aromatase converts testosterone to estradiol (E2), reducing free T and suppressing pituitary output.</title>
            <path
              d="M 478,670 Q 540,560 580,470"
              fill="none"
              stroke={COLOR.compensating}
              strokeWidth="2.8"
              strokeDasharray="6 4"
              markerEnd="url(#ah-compensating)"
              opacity="0.9"
            />
            <text
              x="540"
              y="555"
              fontSize="12"
              fill={COLOR.label}
              fontStyle="italic"
              fontWeight="700"
            >
              T → E2
            </text>
          </g>
        </Pulse>
      )}
    </svg>
  )
}

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

      <div className="grid grid-cols-1 gap-4 p-4 pl-5 md:grid-cols-[440px_1fr] md:gap-5">
        {/* ----- SVG diagram (left on md+, top on mobile) ----- */}
        {/* The container is forced to a slate-900 dark background regardless */}
        {/* of the page theme (light/dark) because the SVG was designed       */}
        {/* against a dark medical-illustration backdrop and uses pure white  */}
        {/* labels.  Without this, FSH/LH/feedback labels become invisible in */}
        {/* light mode (white-on-white).                                       */}
        <div className="flex flex-col items-center rounded-md border border-slate-700/60 bg-slate-900 p-2">
          <HpgAxisSvg state={condition.axisState} />

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
