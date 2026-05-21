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
 * The visual is an animated inline SVG of the Hypothalamic-Pituitary-
 * Gonadal axis. For each detected condition we render a separate card
 * that:
 *   1. Sets the visual "state" of each SVG sub-component (normal,
 *      pulsing, faded, broken, etc.) so the diagram literally *shows*
 *      the mechanism the text is describing.
 *   2. Lists the specific abnormal values that triggered the condition.
 *   3. Names and explains the condition in 2-3 sentences of clinical
 *      prose. We use *mechanistic* language (Sertoli-cell dysfunction,
 *      hypergonadotropic hypogonadism, etc.) — the same language a
 *      reproductive endocrinologist would use in a consult note.
 *
 * Detection priority (combinations match first, then any leftover
 * single-biomarker abnormalities):
 *   1. FSH↑ + LH↑ + T↓ → "Severe Primary Testicular Failure"
 *   2. FSH↑ + LH↑     → "Hypergonadotropic Hypogonadism"
 *   3. T↓ + LH↑       → "Primary Hypogonadism"
 *   4. then any of:    FSH↑, LH↑, T↓ that were *not* consumed above
 *   5. independent:    Testicular Volume↓, E2↑, BMI↑, Age↑
 *
 * IMPORTANT — this is a research artefact, NOT a diagnostic tool. The
 * card explicitly says so. Thresholds below are the conventional cut-offs
 * used in the andrology literature; they are deliberately conservative
 * so a borderline value does not light the panel.
 * --------------------------------------------------------------------------
 */

import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Info } from 'lucide-react'

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
// Clinical thresholds (conventional cut-offs from andrology literature)
// ---------------------------------------------------------------------------

const THRESHOLDS = {
  fshHigh: 12, // IU/L (mIU/mL); upper limit of reference in most labs
  lhHigh: 9, // IU/L
  tLow: 3, // ng/mL (≈ 10.4 nmol/L) — Endocrine Society lower bound
  tvLow: 12, // mL — bilateral atrophy threshold (Carlsen et al.)
  e2High: 50, // pg/mL — hyperestrogenism in adult males
  bmiHigh: 30, // kg/m² — WHO Class I obesity
  ageHigh: 45, // years — clinically meaningful andropause inflection
} as const

// ---------------------------------------------------------------------------
// AxisState — drives the SVG rendering
// ---------------------------------------------------------------------------

type IntensityState = 'normal' | 'pulsing' | 'faded' | 'broken' | 'weak' | 'absent'

type AxisState = {
  hypothalamus: 'normal' | 'compensating' | 'faded'
  gnrh: IntensityState
  pituitary: 'normal' | 'faded'
  fsh: IntensityState // arrow from pituitary to tubules
  lh: IntensityState // arrow from pituitary to Leydig cells
  testis: 'normal' | 'atrophic' | 'damaged' | 'faded'
  tubules: 'normal' | 'damaged' | 'sparse'
  leydig: 'normal' | 'damaged' | 'unresponsive'
  testosterone: IntensityState // T output arrow rising to hypothalamus
  inhibinB: IntensityState // Inhibin B feedback arrow
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
  leydig: 'normal',
  testosterone: 'normal',
  inhibinB: 'normal',
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
  explanation: string
  /** Display strings like "FSH 18.4 mIU/mL". */
  evidence: string[]
  /** SVG state to apply. */
  axisState: AxisState
}

// ---------------------------------------------------------------------------
// Condition detection
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

  // Testicular volume: use the average of available measurements, or
  // whichever side is entered. Either side being low is clinically
  // relevant — we flag if the *mean* is below the threshold.
  let tvMean: number | null = null
  if (tvL !== null && tvR !== null) tvMean = (tvL + tvR) / 2
  else if (tvL !== null) tvMean = tvL
  else if (tvR !== null) tvMean = tvR
  const tvLow = tvMean !== null && tvMean < THRESHOLDS.tvLow

  const e2High = e2 !== null && e2 > THRESHOLDS.e2High
  const bmiHigh = bmi !== null && bmi > THRESHOLDS.bmiHigh
  const ageHigh = age !== null && age > THRESHOLDS.ageHigh

  const conditions: DetectedCondition[] = []
  // Track which gonadotropin-axis biomarkers have already been "consumed"
  // by a combined condition so we don't double-report them as singletons.
  let fshConsumed = false
  let lhConsumed = false
  let tConsumed = false

  // --- Combination conditions (highest priority first) -------------------
  if (fshHigh && lhHigh && tLow) {
    conditions.push({
      id: 'severe-primary-failure',
      name: 'Severe Primary Testicular Failure',
      severity: 'severe',
      explanation:
        'Pronounced elevation of both gonadotropins (FSH and LH) with frank testosterone deficiency indicates failure of both compartments of the testis — Sertoli cells (FSH target) and Leydig cells (LH target). The pituitary is driving the axis maximally but the testis is unresponsive; sperm retrieval probability is correspondingly low.',
      evidence: [
        `FSH ${fsh!.toFixed(1)} mIU/mL (>${THRESHOLDS.fshHigh})`,
        `LH ${lh!.toFixed(1)} mIU/mL (>${THRESHOLDS.lhHigh})`,
        `Testosterone ${t!.toFixed(2)} ng/mL (<${THRESHOLDS.tLow})`,
      ],
      axisState: {
        ...DEFAULT_AXIS,
        gnrh: 'pulsing',
        hypothalamus: 'compensating',
        fsh: 'pulsing',
        lh: 'pulsing',
        testis: 'damaged',
        tubules: 'damaged',
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
      explanation:
        'Both gonadotropins are elevated, indicating loss of negative feedback from the testis to the pituitary. The hypothalamic-pituitary unit is intact and compensating, but the testis is failing to respond to either FSH or LH stimulation.',
      evidence: [
        `FSH ${fsh!.toFixed(1)} mIU/mL (>${THRESHOLDS.fshHigh})`,
        `LH ${lh!.toFixed(1)} mIU/mL (>${THRESHOLDS.lhHigh})`,
      ],
      axisState: {
        ...DEFAULT_AXIS,
        gnrh: 'pulsing',
        fsh: 'pulsing',
        lh: 'pulsing',
        testis: 'faded',
        tubules: 'damaged',
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
      explanation:
        'Elevated LH with deficient testosterone is the biochemical hallmark of primary (testicular) hypogonadism. The pituitary is intact and is increasing LH output in an attempt to drive Leydig-cell testosterone production, but the Leydig cells are unresponsive.',
      evidence: [
        `LH ${lh!.toFixed(1)} mIU/mL (>${THRESHOLDS.lhHigh})`,
        `Testosterone ${t!.toFixed(2)} ng/mL (<${THRESHOLDS.tLow})`,
      ],
      axisState: {
        ...DEFAULT_AXIS,
        lh: 'pulsing',
        leydig: 'unresponsive',
        testosterone: 'weak',
        inhibinB: 'normal',
      },
    })
    lhConsumed = tConsumed = true
  }

  // --- Individual abnormalities not already consumed --------------------
  if (fshHigh && !fshConsumed) {
    conditions.push({
      id: 'fsh-high',
      name: 'Primary Sertoli-Cell Dysfunction',
      severity: 'moderate',
      explanation:
        'Isolated FSH elevation reflects loss of Inhibin B negative feedback from Sertoli cells, indicating impaired spermatogenesis. The pituitary FSH output is compensatorily high, but the seminiferous-tubule compartment is failing to produce sperm.',
      evidence: [`FSH ${fsh!.toFixed(1)} mIU/mL (>${THRESHOLDS.fshHigh})`],
      axisState: {
        ...DEFAULT_AXIS,
        fsh: 'pulsing',
        tubules: 'damaged',
        inhibinB: 'broken',
      },
    })
  }
  if (lhHigh && !lhConsumed) {
    conditions.push({
      id: 'lh-high',
      name: 'Leydig-Cell Dysfunction',
      severity: 'moderate',
      explanation:
        'Isolated LH elevation suggests early Leydig-cell impairment with partial testosterone compensation. The pituitary is increasing LH drive; testosterone may still be within range but the negative-feedback loop is weakened.',
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
      name: 'Hypogonadism',
      severity: 'moderate',
      explanation:
        'Testosterone is below the reference range without a clearly elevated LH. This pattern is consistent with mixed or secondary hypogonadism; hypothalamic GnRH drive may be compensatorily elevated.',
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

  // --- Independent findings ---------------------------------------------
  if (tvLow) {
    conditions.push({
      id: 'tv-low',
      name: 'Testicular Atrophy',
      severity: 'moderate',
      explanation:
        'Reduced testicular volume indicates loss of seminiferous-tubule mass — the principal correlate of spermatogenic capacity. Atrophy is a structural finding that often accompanies long-standing hormonal abnormalities.',
      evidence: [
        `Testicular volume mean ${tvMean!.toFixed(1)} mL (<${THRESHOLDS.tvLow})`,
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
      name: 'Aromatase Overactivity',
      severity: 'mild',
      explanation:
        'Elevated estradiol in an adult male typically reflects increased peripheral aromatisation of testosterone to estradiol — often by adipose tissue. The excess estradiol suppresses hypothalamic GnRH, dampening the entire axis.',
      evidence: [`E2 ${e2!.toFixed(1)} pg/mL (>${THRESHOLDS.e2High})`],
      axisState: {
        ...DEFAULT_AXIS,
        gnrh: 'weak',
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
      explanation:
        'BMI in the obese range is independently associated with reduced testosterone, increased peripheral aromatisation to estradiol, and impaired spermatogenesis. The HPG axis is broadly suppressed via multiple mechanisms.',
      evidence: [`BMI ${bmi!.toFixed(1)} kg/m² (>${THRESHOLDS.bmiHigh})`],
      axisState: {
        ...DEFAULT_AXIS,
        gnrh: 'weak',
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
      explanation:
        'Beyond ~45 years, all components of the HPG axis show gradual decline — reduced GnRH pulse amplitude, modest gonadotropin elevation, and progressive testicular volume loss. Sperm retrieval probability decreases approximately linearly with age in this range.',
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
      },
    })
  }

  return conditions
}

// ---------------------------------------------------------------------------
// SVG palette
// ---------------------------------------------------------------------------

const COLOR = {
  organ: '#94a3b8', // slate-400 — normal organ outline
  organFill: '#1e293b', // slate-800 — dark fill (works on dark cards)
  organFaded: '#475569', // slate-600 — for faded state
  tubules: '#60a5fa', // blue-400 — Sertoli/tubule compartment
  leydig: '#fb923c', // orange-400 — Leydig-cell compartment
  arrowNormal: '#94a3b8', // slate-400
  arrowAccent: '#a78bfa', // violet-400 — feedback arrows
  pulse: '#ef4444', // red-500 — overactive / failing
  weak: '#94a3b8', // slate-400 + lower opacity
  adipose: '#fbbf24', // amber-400
}

// ---------------------------------------------------------------------------
// Sub-components for the SVG (each is a discrete <g> with id)
// ---------------------------------------------------------------------------

/** Reusable pulsing wrapper. */
function Pulse({
  children,
  active,
  duration = 1.4,
}: {
  children: React.ReactNode
  active: boolean
  duration?: number
}) {
  if (!active) return <>{children}</>
  return (
    <motion.g
      animate={{ opacity: [1, 0.45, 1], scale: [1, 1.04, 1] }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
    >
      {children}
    </motion.g>
  )
}

function HpgAxisSvg({ state }: { state: AxisState }) {
  // ---- Hypothalamus (top) ------------------------------------------
  const hypFaded = state.hypothalamus === 'faded'
  const hypCompensating = state.hypothalamus === 'compensating'

  // ---- GnRH arrow (hyp → pit) --------------------------------------
  const gnrhPulsing = state.gnrh === 'pulsing'
  const gnrhWeak = state.gnrh === 'weak' || state.gnrh === 'faded'
  const gnrhBroken = state.gnrh === 'broken'
  const gnrhStroke = gnrhPulsing ? COLOR.pulse : COLOR.arrowNormal
  const gnrhDash = gnrhBroken ? '4 3' : undefined
  const gnrhWidth = gnrhPulsing ? 2.5 : gnrhWeak ? 1 : 1.6
  const gnrhOpacity = gnrhWeak ? 0.4 : 1

  // ---- Pituitary ---------------------------------------------------
  const pitFaded = state.pituitary === 'faded'

  // ---- FSH arrow ---------------------------------------------------
  const fshPulsing = state.fsh === 'pulsing'
  const fshWeak = state.fsh === 'weak' || state.fsh === 'faded'
  const fshStroke = fshPulsing ? COLOR.pulse : COLOR.tubules
  const fshWidth = fshPulsing ? 2.8 : fshWeak ? 1 : 1.8
  const fshOpacity = fshWeak ? 0.45 : 1

  // ---- LH arrow ----------------------------------------------------
  const lhPulsing = state.lh === 'pulsing'
  const lhWeak = state.lh === 'weak' || state.lh === 'faded'
  const lhStroke = lhPulsing ? COLOR.pulse : COLOR.leydig
  const lhWidth = lhPulsing ? 2.8 : lhWeak ? 1 : 1.8
  const lhOpacity = lhWeak ? 0.45 : 1

  // ---- Testis ------------------------------------------------------
  const testisScale =
    state.testis === 'atrophic' ? 0.72 : state.testis === 'faded' ? 1 : 1
  const testisStroke =
    state.testis === 'damaged'
      ? COLOR.pulse
      : state.testis === 'faded'
        ? COLOR.organFaded
        : COLOR.organ
  const testisOpacity = state.testis === 'faded' ? 0.45 : 1

  // ---- Tubules / Leydig compartments -------------------------------
  const tubulesDamaged = state.tubules === 'damaged'
  const tubulesSparse = state.tubules === 'sparse'
  const tubulesOpacity = tubulesDamaged ? 0.35 : tubulesSparse ? 0.5 : 1
  const tubulesColor = tubulesDamaged ? COLOR.organFaded : COLOR.tubules

  const leydigDamaged = state.leydig === 'damaged' || state.leydig === 'unresponsive'
  const leydigOpacity = leydigDamaged ? 0.35 : 1
  const leydigColor = leydigDamaged ? COLOR.organFaded : COLOR.leydig

  // ---- Testosterone feedback arrow ---------------------------------
  const tStroke =
    state.testosterone === 'absent'
      ? COLOR.organFaded
      : state.testosterone === 'pulsing'
        ? COLOR.pulse
        : COLOR.arrowAccent
  const tWidth =
    state.testosterone === 'absent' || state.testosterone === 'weak'
      ? 0.7
      : 1.6
  const tOpacity =
    state.testosterone === 'absent'
      ? 0.15
      : state.testosterone === 'weak' || state.testosterone === 'faded'
        ? 0.4
        : 1
  const tDash = state.testosterone === 'broken' ? '4 3' : undefined

  // ---- Inhibin B feedback arrow ------------------------------------
  const inhibinDash =
    state.inhibinB === 'broken' || state.inhibinB === 'weak' ? '4 3' : undefined
  const inhibinOpacity =
    state.inhibinB === 'broken'
      ? 0.35
      : state.inhibinB === 'weak'
        ? 0.5
        : 1
  const inhibinStroke =
    state.inhibinB === 'broken' ? COLOR.organFaded : COLOR.arrowAccent

  return (
    <svg
      viewBox="0 0 220 320"
      className="h-auto w-full"
      role="img"
      aria-label="Hypothalamic-Pituitary-Gonadal axis schematic"
    >
      <defs>
        <marker
          id="arrowhead-down"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
        </marker>
        <marker
          id="arrowhead-pulse"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L6,3 L0,6 Z" fill={COLOR.pulse} />
        </marker>
        {/* Cross-hatch for damaged tissue. */}
        <pattern
          id="damaged-hatch"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke={COLOR.pulse} strokeWidth="1" opacity="0.4" />
        </pattern>
      </defs>

      {/* ============ HYPOTHALAMUS ============ */}
      <g id="hypothalamus" opacity={hypFaded ? 0.45 : 1}>
        <Pulse active={hypCompensating}>
          <ellipse
            cx="110"
            cy="28"
            rx="48"
            ry="18"
            fill={COLOR.organFill}
            stroke={hypCompensating ? COLOR.pulse : COLOR.organ}
            strokeWidth="1.5"
          />
          {/* Subtle convolutions */}
          <path
            d="M75,25 Q85,18 95,25 Q105,18 115,25 Q125,18 135,25 Q140,28 145,25"
            fill="none"
            stroke={hypCompensating ? COLOR.pulse : COLOR.organ}
            strokeWidth="0.8"
            opacity="0.6"
          />
        </Pulse>
        <text x="110" y="32" textAnchor="middle" fontSize="9" fill="#cbd5e1" fontWeight="500">
          Hypothalamus
        </text>
      </g>

      {/* ============ GnRH ARROW ============ */}
      <g id="gnrh-arrow" color={gnrhStroke} opacity={gnrhOpacity}>
        <Pulse active={gnrhPulsing} duration={1.1}>
          <line
            x1="110"
            y1="48"
            x2="110"
            y2="78"
            stroke={gnrhStroke}
            strokeWidth={gnrhWidth}
            strokeDasharray={gnrhDash}
            markerEnd={`url(#${gnrhPulsing ? 'arrowhead-pulse' : 'arrowhead-down'})`}
          />
        </Pulse>
        <text x="116" y="66" fontSize="8" fill="#cbd5e1" fontStyle="italic">
          GnRH
        </text>
      </g>

      {/* ============ PITUITARY ============ */}
      <g id="pituitary" opacity={pitFaded ? 0.45 : 1}>
        <ellipse
          cx="110"
          cy="92"
          rx="32"
          ry="14"
          fill={COLOR.organFill}
          stroke={COLOR.organ}
          strokeWidth="1.5"
        />
        <text x="110" y="95" textAnchor="middle" fontSize="8" fill="#cbd5e1" fontWeight="500">
          Pituitary
        </text>
      </g>

      {/* ============ FSH ARROW ============ */}
      <g id="fsh-arrow" opacity={fshOpacity}>
        <Pulse active={fshPulsing} duration={1.1}>
          <line
            x1="90"
            y1="108"
            x2="72"
            y2="168"
            stroke={fshStroke}
            strokeWidth={fshWidth}
            markerEnd={`url(#${fshPulsing ? 'arrowhead-pulse' : 'arrowhead-down'})`}
          />
        </Pulse>
        <text x="62" y="138" fontSize="9" fill={fshStroke} fontWeight="600">
          FSH
        </text>
      </g>

      {/* ============ LH ARROW ============ */}
      <g id="lh-arrow" opacity={lhOpacity}>
        <Pulse active={lhPulsing} duration={1.1}>
          <line
            x1="130"
            y1="108"
            x2="148"
            y2="168"
            stroke={lhStroke}
            strokeWidth={lhWidth}
            markerEnd={`url(#${lhPulsing ? 'arrowhead-pulse' : 'arrowhead-down'})`}
          />
        </Pulse>
        <text x="148" y="138" fontSize="9" fill={lhStroke} fontWeight="600">
          LH
        </text>
      </g>

      {/* ============ TESTIS (with inner structures) ============ */}
      <g
        id="testis"
        opacity={testisOpacity}
        style={{
          transformOrigin: '110px 222px',
          transform: `scale(${testisScale})`,
        }}
      >
        <ellipse
          cx="110"
          cy="222"
          rx="76"
          ry="48"
          fill={COLOR.organFill}
          stroke={testisStroke}
          strokeWidth="1.8"
        />
        {state.testis === 'damaged' && (
          <ellipse cx="110" cy="222" rx="76" ry="48" fill="url(#damaged-hatch)" />
        )}

        {/* Seminiferous tubules (left half) — wavy lines */}
        <g id="seminiferous-tubules" opacity={tubulesOpacity}>
          {[0, 1, 2, 3].map((i) => {
            const y = 200 + i * 12
            return (
              <path
                key={`tub-${i}`}
                d={`M48,${y} Q60,${y - 4} 72,${y} Q84,${y + 4} 96,${y}`}
                fill="none"
                stroke={tubulesColor}
                strokeWidth={tubulesSparse ? 0.8 : 1.4}
              />
            )
          })}
          <text x="72" y="258" textAnchor="middle" fontSize="7" fill="#94a3b8">
            tubules
          </text>
        </g>

        {/* Leydig cells (right half) — small filled circles */}
        <g id="leydig-cells" opacity={leydigOpacity}>
          {[
            [128, 200],
            [144, 208],
            [160, 200],
            [128, 220],
            [148, 224],
            [164, 218],
            [134, 240],
            [152, 244],
          ].map(([x, y], i) => (
            <circle key={`ley-${i}`} cx={x} cy={y} r="2.4" fill={leydigColor} />
          ))}
          <text x="148" y="258" textAnchor="middle" fontSize="7" fill="#94a3b8">
            Leydig
          </text>
        </g>

        <text x="110" y="288" textAnchor="middle" fontSize="9" fill="#cbd5e1" fontWeight="500">
          Testis
        </text>
      </g>

      {/* ============ INHIBIN B FEEDBACK (tubules → pituitary) ============ */}
      <g id="inhibin-feedback" opacity={inhibinOpacity}>
        <path
          d="M60,195 Q20,160 40,110 Q60,95 80,92"
          fill="none"
          stroke={inhibinStroke}
          strokeWidth="1.2"
          strokeDasharray={inhibinDash}
          markerEnd="url(#arrowhead-down)"
          color={inhibinStroke}
        />
        <text
          x="12"
          y="148"
          fontSize="7"
          fill={inhibinStroke}
          fontStyle="italic"
        >
          Inhibin B
        </text>
      </g>

      {/* ============ TESTOSTERONE FEEDBACK (Leydig → hypothalamus) ============ */}
      <g id="testosterone-feedback" opacity={tOpacity} color={tStroke}>
        <path
          d="M160,195 Q205,140 195,80 Q180,40 145,28"
          fill="none"
          stroke={tStroke}
          strokeWidth={tWidth}
          strokeDasharray={tDash}
          markerEnd="url(#arrowhead-down)"
        />
        <text x="186" y="130" fontSize="7" fill={tStroke} fontStyle="italic">
          T
        </text>
      </g>

      {/* ============ ADIPOSE TISSUE (only when present) ============ */}
      {state.adipose !== 'none' && (
        <g id="adipose">
          <ellipse
            cx={state.adipose === 'large' ? 30 : 28}
            cy={state.adipose === 'large' ? 232 : 235}
            rx={state.adipose === 'large' ? 18 : 12}
            ry={state.adipose === 'large' ? 14 : 9}
            fill={COLOR.adipose}
            opacity="0.55"
            stroke={COLOR.adipose}
            strokeWidth="1"
          />
          <text
            x={state.adipose === 'large' ? 30 : 28}
            y={state.adipose === 'large' ? 252 : 250}
            textAnchor="middle"
            fontSize="6.5"
            fill={COLOR.adipose}
          >
            adipose
          </text>
        </g>
      )}

      {/* ============ AROMATASE PATHWAY (T → E2 in adipose) ============ */}
      {state.aromatase === 'active' && (
        <g id="aromatase-arrow">
          <Pulse active duration={1.3}>
            <path
              d="M85,235 Q60,232 45,232"
              fill="none"
              stroke={COLOR.adipose}
              strokeWidth="1.3"
              markerEnd="url(#arrowhead-down)"
              color={COLOR.adipose}
            />
          </Pulse>
          <text x="55" y="225" fontSize="6.5" fill={COLOR.adipose} fontStyle="italic">
            T→E2
          </text>
        </g>
      )}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

const SEVERITY_STYLES: Record<Severity, { border: string; glow: string; badge: string; label: string }> = {
  severe: {
    border: 'border-red-500/40',
    glow: 'shadow-lg shadow-red-500/20',
    badge: 'bg-red-500/15 text-red-300 border-red-500/40',
    label: 'Severe',
  },
  moderate: {
    border: 'border-amber-500/40',
    glow: 'shadow-md shadow-amber-500/15',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    label: 'Moderate',
  },
  mild: {
    border: 'border-sky-500/40',
    glow: 'shadow-md shadow-sky-500/10',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
    label: 'Mild',
  },
}

function ConditionCard({ condition }: { condition: DetectedCondition }) {
  const s = SEVERITY_STYLES[condition.severity]
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`relative rounded-lg border bg-card ${s.border} ${s.glow}`}
    >
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-[220px_1fr] sm:gap-4 sm:p-4">
        {/* ----- SVG diagram (left on sm+, top on mobile) ----- */}
        <div className="flex items-center justify-center rounded-md border border-border/40 bg-background/40 p-2">
          <div className="w-full max-w-[220px]">
            <HpgAxisSvg state={condition.axisState} />
          </div>
        </div>

        {/* ----- Text panel ----- */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold leading-tight sm:text-base">
              {condition.name}
            </h4>
            <span
              className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${s.badge}`}
            >
              {s.label}
            </span>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
            {condition.explanation}
          </p>

          {/* Evidence — the specific numbers that triggered the condition. */}
          <div className="rounded-md border border-border/50 bg-muted/30 px-2.5 py-1.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Triggered by
            </p>
            <ul className="space-y-0.5">
              {condition.evidence.map((e) => (
                <li
                  key={e}
                  className="font-mono text-[11px] text-foreground/90 tabular-nums"
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
// Top-level component
// ---------------------------------------------------------------------------

export default function ClinicalInterpretation({ vals }: ClinicalInterpretationProps) {
  // Memoise the detection so we don't re-classify on unrelated re-renders.
  const conditions = useMemo(() => detectConditions(vals), [vals])

  // If nothing is abnormal we render NOTHING — the panel is opt-in based
  // on the patient's biomarkers. AnimatePresence on the parent in
  // cdss-form.tsx handles the fade-in/out when this entire block
  // appears or disappears.
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
            ({conditions.length} pattern{conditions.length === 1 ? '' : 's'} detected)
          </span>
        </div>
      </div>

      {/* Disclaimer — this is critical. */}
      <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Mechanistic interpretation of the entered biomarkers based on
          standard andrology thresholds. <strong className="text-foreground/80">Not a diagnostic tool</strong> —
          intended as a teaching aid to relate the model's input space to
          the HPG axis. Patient management requires a clinician's
          assessment of the full picture.
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
    </div>
  )
}
