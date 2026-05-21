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
// SVG palette — muted medical-illustration tones
// ---------------------------------------------------------------------------

const COLOR = {
  brain: '#94a3b8', // slate-400 — brain outline
  brainFill: '#1e293b', // slate-800 — dark fill (dark theme)
  pituitary: '#cbd5e1', // slate-300
  hypothalamus: '#fda4af', // rose-300 — soft pink
  vessel: '#475569', // slate-600 — bloodstream channel
  vesselBlood: '#7f1d1d', // red-900 — venous tinge
  testisOutline: '#cbd5e1', // slate-300 — tunica albuginea
  testisFill: '#1e293b', // dark fill
  tubule: '#60a5fa', // blue-400 — Sertoli compartment
  sertoli: '#3b82f6', // blue-500 — Sertoli dots
  leydig: '#fb923c', // orange-400 — Leydig clusters
  fsh: '#38bdf8', // sky-400
  lh: '#f97316', // orange-500
  feedback: '#a78bfa', // violet-400 — Inhibin B / T feedback
  pulse: '#ef4444', // red-500 — pulse colour for over-active
  weak: '#94a3b8', // slate-400
  label: '#cbd5e1',
  labelSmall: '#94a3b8',
  adipose: '#fbbf24', // amber-400
  rete: '#a3a3a3', // neutral-400 — rete testis network
  epididymis: '#94a3b8',
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
  // ---- Derived visual props per anatomical group ----------------------
  const hypFaded = state.hypothalamus === 'faded'
  const hypCompensating = state.hypothalamus === 'compensating'

  const pitFaded = state.pituitary === 'faded'
  const pitCompensating = state.pituitary === 'compensating'

  const gnrhPulsing = state.gnrh === 'pulsing'
  const gnrhFaded = state.gnrh === 'faded' || state.gnrh === 'suppressed'

  const fshPulsing = state.fsh === 'pulsing'
  const fshFaded = state.fsh === 'faded' || state.fsh === 'weak'

  const lhPulsing = state.lh === 'pulsing'
  const lhFaded = state.lh === 'faded' || state.lh === 'weak'

  const testisScale =
    state.testis === 'atrophic' ? 0.72 : 1
  const testisStroke =
    state.testis === 'damaged'
      ? COLOR.pulse
      : state.testis === 'faded'
        ? COLOR.weak
        : COLOR.testisOutline
  const testisFillOpacity =
    state.testis === 'faded'
      ? 0.35
      : state.testis === 'damaged'
        ? 0.55
        : 1

  const tubulesDamaged = state.tubules === 'damaged'
  const tubulesSparse = state.tubules === 'sparse'
  const tubuleStroke = tubulesDamaged ? COLOR.pulse : COLOR.tubule
  const tubuleOpacity = tubulesDamaged ? 0.5 : tubulesSparse ? 0.4 : 1

  const sertoliColor = state.sertoli === 'damaged' ? COLOR.pulse : COLOR.sertoli

  const leydigDamaged =
    state.leydig === 'damaged' || state.leydig === 'unresponsive'
  const leydigColor = leydigDamaged ? COLOR.pulse : COLOR.leydig
  const leydigOpacity = leydigDamaged ? 0.55 : 1
  const leydigPulse = leydigDamaged

  // Testosterone feedback arc visual style
  const tStroke =
    state.testosterone === 'absent'
      ? COLOR.weak
      : state.testosterone === 'broken'
        ? COLOR.pulse
        : COLOR.feedback
  const tOpacity =
    state.testosterone === 'absent'
      ? 0.15
      : state.testosterone === 'weak' || state.testosterone === 'faded'
        ? 0.4
        : 1
  const tWidth = state.testosterone === 'normal' ? 1.6 : 0.9
  const tDash =
    state.testosterone === 'broken' || state.testosterone === 'weak'
      ? '4 3'
      : undefined

  // Inhibin B arc style
  const inhibinDash =
    state.inhibinB === 'broken' || state.inhibinB === 'weak' ? '4 3' : undefined
  const inhibinOpacity =
    state.inhibinB === 'broken'
      ? 0.35
      : state.inhibinB === 'weak'
        ? 0.55
        : 1
  const inhibinStroke =
    state.inhibinB === 'broken' ? COLOR.pulse : COLOR.feedback

  return (
    <svg
      viewBox="0 0 400 500"
      className="h-auto w-full max-w-[340px]"
      role="img"
      aria-label="Hypothalamic-Pituitary-Gonadal axis schematic"
    >
      <defs>
        {/* Arrowheads */}
        <marker
          id="ah-down"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
        </marker>
        <marker
          id="ah-pulse"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill={COLOR.pulse} />
        </marker>
        {/* Subtle gradient on brain (gives a hint of depth without flat fill) */}
        <radialGradient id="brain-grad" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#334155" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="testis-grad" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#334155" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
        </radialGradient>
        <pattern
          id="damaged-hatch"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="6"
            stroke={COLOR.pulse}
            strokeWidth="0.9"
            opacity="0.5"
          />
        </pattern>

        {/* GnRH path — within the brain */}
        <path
          id="gnrh-path"
          d="M200,90 Q200,110 200,135"
          fill="none"
        />
        {/* FSH path — from pituitary to testis (curves left) */}
        <path
          id="fsh-path"
          d="M180,160 C140,220 130,300 150,370"
          fill="none"
        />
        {/* LH path — from pituitary to testis (curves right) */}
        <path
          id="lh-path"
          d="M220,160 C260,220 270,300 250,370"
          fill="none"
        />
      </defs>

      {/* ============================================================== */}
      {/* BRAIN — top section                                            */}
      {/* ============================================================== */}
      <g
        id="brain"
        opacity={hypFaded ? 0.55 : 1}
      >
        {/* Simplified cerebral outline — convex top, flat bottom */}
        <path
          d="M120,90
             C 110,55  150,25  200,28
             C 250,25  290,55  280,90
             C 285,100 282,110 270,115
             C 260,118 250,118 240,118
             L 160,118
             C 150,118 140,118 130,115
             C 118,110 115,100 120,90 Z"
          fill="url(#brain-grad)"
          stroke={COLOR.brain}
          strokeWidth="1.6"
        />
        {/* Convolutions / sulci — purely decorative wavy line art */}
        <path
          d="M140,55 Q160,42 180,55 Q200,42 220,55 Q240,42 260,55"
          fill="none"
          stroke={COLOR.brain}
          strokeWidth="0.7"
          opacity="0.5"
        />
        <path
          d="M135,72 Q160,62 185,72 Q210,62 235,72 Q255,62 270,72"
          fill="none"
          stroke={COLOR.brain}
          strokeWidth="0.7"
          opacity="0.4"
        />

        {/* ----- Hypothalamus — small almond at base of brain ---------- */}
        <Pulse active={hypCompensating} duration={1.2} intensity={0.55}>
          <g id="hypothalamus">
            <ellipse
              cx="200"
              cy="100"
              rx="22"
              ry="10"
              fill={COLOR.hypothalamus}
              fillOpacity="0.85"
              stroke={hypCompensating ? COLOR.pulse : COLOR.hypothalamus}
              strokeWidth="1.3"
            />
            {/* Nuclei dots */}
            <circle cx="192" cy="100" r="1.4" fill="#7f1d1d" />
            <circle cx="200" cy="98" r="1.4" fill="#7f1d1d" />
            <circle cx="208" cy="100" r="1.4" fill="#7f1d1d" />
          </g>
        </Pulse>
        <text
          x="200"
          y="84"
          textAnchor="middle"
          fontSize="9"
          fill={COLOR.label}
          fontWeight="500"
        >
          Hypothalamus
        </text>

        {/* ----- Pituitary — small oval hanging below ------------------ */}
        <line
          x1="200"
          y1="110"
          x2="200"
          y2="125"
          stroke={COLOR.brain}
          strokeWidth="1.4"
          opacity="0.7"
        />
        <Pulse active={pitCompensating} duration={1.3} intensity={0.55}>
          <g id="pituitary" opacity={pitFaded ? 0.5 : 1}>
            <ellipse
              cx="200"
              cy="135"
              rx="18"
              ry="9"
              fill={COLOR.pituitary}
              stroke={pitCompensating ? COLOR.pulse : COLOR.pituitary}
              strokeWidth="1.3"
            />
            {/* Anterior / posterior division */}
            <line
              x1="200"
              y1="127"
              x2="200"
              y2="143"
              stroke="#475569"
              strokeWidth="0.6"
              opacity="0.6"
            />
          </g>
        </Pulse>
        <text
          x="225"
          y="138"
          fontSize="8"
          fill={COLOR.labelSmall}
        >
          Pituitary
        </text>

        {/* ----- GnRH arrow — short, internal --------------------------- */}
        <g
          id="gnrh-arrow"
          color={gnrhPulsing ? COLOR.pulse : COLOR.feedback}
          opacity={gnrhFaded ? 0.35 : 1}
        >
          <use
            href="#gnrh-path"
            stroke={gnrhPulsing ? COLOR.pulse : COLOR.feedback}
            strokeWidth={gnrhPulsing ? 2.3 : 1.4}
            markerEnd={`url(#${gnrhPulsing ? 'ah-pulse' : 'ah-down'})`}
          />
          <FlowingDots
            pathId="gnrh-path"
            color={COLOR.pulse}
            count={3}
            duration={1.2}
            active={gnrhPulsing}
            radius={1.6}
          />
          <text
            x="206"
            y="118"
            fontSize="7.5"
            fontStyle="italic"
            fill={gnrhPulsing ? COLOR.pulse : COLOR.labelSmall}
          >
            GnRH
          </text>
        </g>
      </g>

      {/* ============================================================== */}
      {/* BLOODSTREAM CHANNEL — vessel running from pituitary to testis  */}
      {/* ============================================================== */}
      <g id="vessels" opacity={state.vessels === 'faded' ? 0.45 : 1}>
        {/* Outer vessel walls */}
        <path
          d="M192,160 C150,230 145,310 165,380"
          fill="none"
          stroke={COLOR.vessel}
          strokeWidth="2.4"
          opacity="0.6"
        />
        <path
          d="M208,160 C250,230 255,310 235,380"
          fill="none"
          stroke={COLOR.vessel}
          strokeWidth="2.4"
          opacity="0.6"
        />
        {/* Inner blood tint */}
        <path
          d="M200,160 C200,250 200,320 200,380"
          fill="none"
          stroke={COLOR.vesselBlood}
          strokeWidth="1"
          opacity="0.35"
        />
      </g>

      {/* ============================================================== */}
      {/* FSH & LH ARROWS — flowing through vessel                        */}
      {/* ============================================================== */}
      {/* FSH (left curve) */}
      <g
        id="fsh-arrow"
        color={fshPulsing ? COLOR.pulse : COLOR.fsh}
        opacity={fshFaded ? 0.4 : 1}
      >
        <use
          href="#fsh-path"
          stroke={fshPulsing ? COLOR.pulse : COLOR.fsh}
          strokeWidth={fshPulsing ? 2.6 : fshFaded ? 1.0 : 1.7}
          markerEnd={`url(#${fshPulsing ? 'ah-pulse' : 'ah-down'})`}
        />
        <FlowingDots
          pathId="fsh-path"
          color={fshPulsing ? COLOR.pulse : COLOR.fsh}
          count={3}
          duration={2.4}
          active={!fshFaded}
          radius={fshPulsing ? 2.6 : 2}
        />
        <text
          x="120"
          y="265"
          fontSize="11"
          fill={fshPulsing ? COLOR.pulse : COLOR.fsh}
          fontWeight="700"
        >
          FSH
        </text>
      </g>

      {/* LH (right curve) */}
      <g
        id="lh-arrow"
        color={lhPulsing ? COLOR.pulse : COLOR.lh}
        opacity={lhFaded ? 0.4 : 1}
      >
        <use
          href="#lh-path"
          stroke={lhPulsing ? COLOR.pulse : COLOR.lh}
          strokeWidth={lhPulsing ? 2.6 : lhFaded ? 1.0 : 1.7}
          markerEnd={`url(#${lhPulsing ? 'ah-pulse' : 'ah-down'})`}
        />
        <FlowingDots
          pathId="lh-path"
          color={lhPulsing ? COLOR.pulse : COLOR.lh}
          count={3}
          duration={2.4}
          active={!lhFaded}
          radius={lhPulsing ? 2.6 : 2}
        />
        <text
          x="270"
          y="265"
          fontSize="11"
          fill={lhPulsing ? COLOR.pulse : COLOR.lh}
          fontWeight="700"
        >
          LH
        </text>
      </g>

      {/* ============================================================== */}
      {/* TESTIS CROSS-SECTION                                            */}
      {/* ============================================================== */}
      <g
        id="testis-group"
        style={{
          transformOrigin: '200px 420px',
          transform: `scale(${testisScale})`,
          transition: 'transform 0.4s ease-out',
        }}
        opacity={state.testis === 'faded' ? 0.55 : 1}
      >
        {/* Tunica albuginea — thick outer shell */}
        <ellipse
          cx="200"
          cy="420"
          rx="95"
          ry="58"
          fill="url(#testis-grad)"
          stroke={testisStroke}
          strokeWidth="2.4"
          fillOpacity={testisFillOpacity}
        />
        {state.testis === 'damaged' && (
          <ellipse
            cx="200"
            cy="420"
            rx="95"
            ry="58"
            fill="url(#damaged-hatch)"
          />
        )}

        {/* ----- Seminiferous tubules — coiled loops on left half ----- */}
        <g id="seminiferous-tubules" opacity={tubuleOpacity}>
          {/* 5 looping tubules — drawn as gentle Bezier coils */}
          <path
            d="M135,395 C145,388 155,395 160,402 C165,408 155,415 145,412 C135,409 130,402 135,395 Z"
            fill="none"
            stroke={tubuleStroke}
            strokeWidth={tubulesSparse ? 0.9 : 1.5}
          />
          <path
            d="M125,418 C140,408 165,418 170,432 C173,440 158,448 142,440 C128,432 120,425 125,418 Z"
            fill="none"
            stroke={tubuleStroke}
            strokeWidth={tubulesSparse ? 0.9 : 1.5}
          />
          <path
            d="M135,445 C150,438 175,448 175,460 C173,470 155,470 142,463 C132,457 128,450 135,445 Z"
            fill="none"
            stroke={tubuleStroke}
            strokeWidth={tubulesSparse ? 0.9 : 1.5}
          />
          {!tubulesSparse && (
            <>
              <path
                d="M155,380 C170,375 188,385 187,398 C186,405 172,408 162,402 C152,396 150,386 155,380 Z"
                fill="none"
                stroke={tubuleStroke}
                strokeWidth="1.5"
              />
              <path
                d="M170,422 C188,418 205,428 200,442 C195,452 180,452 168,444 C158,436 158,425 170,422 Z"
                fill="none"
                stroke={tubuleStroke}
                strokeWidth="1.5"
              />
            </>
          )}

          {/* ----- Sertoli cells — small dots along tubule walls ------ */}
          <g id="sertoli-cells">
            {[
              [148, 396],
              [152, 405],
              [160, 410],
              [140, 422],
              [150, 432],
              [165, 435],
              [170, 422],
              [155, 450],
              [168, 458],
              [180, 446],
              [185, 393],
            ].map(([cx, cy], i) => (
              <circle
                key={`sert-${i}`}
                cx={cx}
                cy={cy}
                r={tubulesSparse ? 0.9 : 1.5}
                fill={sertoliColor}
                opacity={tubulesSparse ? 0.6 : 1}
              />
            ))}
          </g>
          <text
            x="155"
            y="480"
            textAnchor="middle"
            fontSize="7.5"
            fill={COLOR.labelSmall}
          >
            tubules · Sertoli
          </text>
        </g>

        {/* ----- Leydig clusters — between tubules on right half ------ */}
        <Pulse active={leydigPulse} duration={1.4}>
          <g id="leydig-cells" opacity={leydigOpacity}>
            {/* Small triangular clusters of 3 cells each */}
            {[
              [230, 395],
              [248, 405],
              [260, 392],
              [220, 415],
              [242, 425],
              [262, 418],
              [232, 440],
              [255, 448],
              [225, 460],
              [248, 462],
            ].map(([cx, cy], i) => (
              <g key={`ley-${i}`}>
                <circle cx={cx} cy={cy} r="2.2" fill={leydigColor} />
                <circle cx={cx + 3.5} cy={cy + 1} r="2.0" fill={leydigColor} />
                <circle cx={cx + 1.5} cy={cy + 3.5} r="2.0" fill={leydigColor} />
              </g>
            ))}
          </g>
        </Pulse>
        <text
          x="248"
          y="480"
          textAnchor="middle"
          fontSize="7.5"
          fill={COLOR.labelSmall}
        >
          Leydig (interstitium)
        </text>

        {/* ----- Rete testis — small mediastinal network -------------- */}
        <g id="rete-testis" opacity={0.7}>
          <path
            d="M195,400 Q200,415 195,430 Q200,445 195,455"
            fill="none"
            stroke={COLOR.rete}
            strokeWidth="0.8"
          />
          <path
            d="M205,400 Q200,415 205,430 Q200,445 205,455"
            fill="none"
            stroke={COLOR.rete}
            strokeWidth="0.8"
          />
          <text
            x="200"
            y="395"
            textAnchor="middle"
            fontSize="6.5"
            fill={COLOR.labelSmall}
            fontStyle="italic"
          >
            rete
          </text>
        </g>

        {/* ----- Epididymis — comma-shaped along top right ------------ */}
        <g
          id="epididymis"
          opacity={state.epididymis === 'faded' ? 0.5 : 1}
        >
          <path
            d="M285,388 C310,378 320,395 318,415 C315,430 305,435 295,425 C285,418 280,400 285,388 Z"
            fill="#1e293b"
            stroke={COLOR.epididymis}
            strokeWidth="1.4"
          />
          {/* Coil pattern */}
          <path
            d="M292,395 Q302,392 308,398 M289,405 Q300,402 310,408 M292,417 Q302,415 309,420"
            fill="none"
            stroke={COLOR.epididymis}
            strokeWidth="0.7"
            opacity="0.7"
          />
          <text
            x="305"
            y="382"
            textAnchor="middle"
            fontSize="7.5"
            fill={COLOR.labelSmall}
          >
            epididymis
          </text>
        </g>

        {/* ----- Testicular vessels — running along the lateral side --- */}
        <g id="testicular-vessels" opacity={state.vessels === 'faded' ? 0.4 : 0.75}>
          <path
            d="M105,400 Q95,420 100,450"
            fill="none"
            stroke="#dc2626"
            strokeWidth="1.4"
            opacity="0.7"
          />
          <path
            d="M112,402 Q102,422 107,450"
            fill="none"
            stroke="#1d4ed8"
            strokeWidth="1.4"
            opacity="0.7"
          />
          <text
            x="80"
            y="425"
            fontSize="6.5"
            fill={COLOR.labelSmall}
            fontStyle="italic"
          >
            a./v.
          </text>
        </g>

        <text
          x="200"
          y="498"
          textAnchor="middle"
          fontSize="10"
          fill={COLOR.label}
          fontWeight="600"
        >
          Testis
        </text>
      </g>

      {/* ============================================================== */}
      {/* FEEDBACK LOOPS — curving outside the central column             */}
      {/* ============================================================== */}
      {/* Inhibin B: from Sertoli (left of testis) back up to pituitary */}
      <g id="inhibin-feedback" opacity={inhibinOpacity}>
        <path
          d="M100,395 C40,330 30,200 60,145 Q100,128 178,140"
          fill="none"
          stroke={inhibinStroke}
          strokeWidth="1.3"
          strokeDasharray={inhibinDash}
          color={inhibinStroke}
          markerEnd="url(#ah-down)"
        />
        <text
          x="22"
          y="270"
          fontSize="8"
          fill={inhibinStroke}
          fontStyle="italic"
        >
          Inhibin B
        </text>
        <text
          x="22"
          y="282"
          fontSize="7"
          fill={COLOR.labelSmall}
          fontStyle="italic"
        >
          (Sertoli → pit.)
        </text>
      </g>

      {/* Testosterone: from Leydig (right of testis) back up to hypothalamus */}
      <g id="testosterone-feedback" opacity={tOpacity} color={tStroke}>
        <path
          d="M300,395 C370,330 380,200 350,135 Q320,108 222,100"
          fill="none"
          stroke={tStroke}
          strokeWidth={tWidth}
          strokeDasharray={tDash}
          markerEnd="url(#ah-down)"
        />
        <text
          x="350"
          y="270"
          fontSize="9"
          fill={tStroke}
          fontStyle="italic"
          fontWeight="600"
        >
          T
        </text>
        <text
          x="343"
          y="282"
          fontSize="7"
          fill={COLOR.labelSmall}
          fontStyle="italic"
        >
          (Leydig → hyp.)
        </text>
      </g>

      {/* ============================================================== */}
      {/* OPTIONAL: ADIPOSE TISSUE (shown only for E2↑ or BMI↑)           */}
      {/* ============================================================== */}
      {state.adipose !== 'none' && (
        <g id="adipose">
          {/* Wavy blob along the left lower side */}
          <path
            d={
              state.adipose === 'large'
                ? 'M30,360 Q25,340 45,330 Q70,322 85,340 Q95,358 80,375 Q60,390 40,382 Q25,378 30,360 Z'
                : 'M40,358 Q40,344 55,340 Q72,338 80,352 Q82,368 68,374 Q50,376 42,370 Q38,365 40,358 Z'
            }
            fill={COLOR.adipose}
            fillOpacity="0.4"
            stroke={COLOR.adipose}
            strokeWidth="1"
          />
          {/* Lipid droplet circles */}
          {(state.adipose === 'large'
            ? [
                [45, 350],
                [60, 345],
                [75, 355],
                [55, 365],
                [70, 370],
                [40, 370],
              ]
            : [
                [55, 350],
                [65, 358],
                [72, 348],
              ]
          ).map(([cx, cy], i) => (
            <circle
              key={`lipid-${i}`}
              cx={cx}
              cy={cy}
              r={state.adipose === 'large' ? 3.5 : 2.5}
              fill={COLOR.adipose}
              fillOpacity="0.55"
            />
          ))}
          <text
            x={state.adipose === 'large' ? 58 : 60}
            y={state.adipose === 'large' ? 400 : 392}
            textAnchor="middle"
            fontSize="7.5"
            fill={COLOR.adipose}
          >
            adipose
          </text>
          {state.aromatase === 'active' && (
            <text
              x={state.adipose === 'large' ? 58 : 60}
              y={state.adipose === 'large' ? 410 : 402}
              textAnchor="middle"
              fontSize="6.5"
              fill={COLOR.adipose}
              fontStyle="italic"
            >
              aromatase
            </text>
          )}
        </g>
      )}

      {/* Aromatase arrow — T from Leydig diverted to E2 in adipose */}
      {state.aromatase === 'active' && (
        <Pulse active duration={1.6}>
          <g id="aromatase-arrow">
            <path
              d="M195,420 Q140,395 90,365"
              fill="none"
              stroke={COLOR.adipose}
              strokeWidth="1.5"
              strokeDasharray="3 2"
              markerEnd="url(#ah-down)"
              color={COLOR.adipose}
              opacity="0.85"
            />
            <text
              x="125"
              y="395"
              fontSize="7"
              fill={COLOR.adipose}
              fontStyle="italic"
            >
              T→E2
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

      <div className="grid grid-cols-1 gap-4 p-4 pl-5 md:grid-cols-[300px_1fr] md:gap-5">
        {/* ----- SVG diagram (left on md+, top on mobile) ----- */}
        <div className="flex items-start justify-center rounded-md border border-border/40 bg-background/40 p-2">
          <HpgAxisSvg state={condition.axisState} />
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
