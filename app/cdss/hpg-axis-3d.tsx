'use client'

/**
 * HPGAxis3D — Medical atlas of the Hypothalamic-Pituitary-Gonadal (HPG) axis
 * --------------------------------------------------------------------------
 * Vertical, top-to-bottom composition built around AI-generated medical
 * atlas PNGs in /public/atlas:
 *
 *   /atlas/brain-hypothalamus.png   ← top    (sagittal brain + hypothalamus)
 *   /atlas/pituitary.png            ← middle (pituitary gland)
 *   /atlas/testis-normal.png        ← bottom (healthy testis)
 *   /atlas/testis-pathological.png  ← bottom (atrophic / damaged testis)
 *
 * On top of those images we draw an interactive SVG overlay that contains:
 *   • hover hotspots for each anatomical region (with medical tooltips)
 *   • pulsing red/orange glows on any structure whose state ≠ 'normal'
 *   • animated framer-motion arrows for the four signalling pathways
 *     (GnRH ↓, FSH ↓, LH ↓, Testosterone ↑, Inhibin B ↑)
 *   • hormone-value labels (from state.values) next to the relevant arrow
 *
 * Public API (kept identical to the previous SVG-only implementation —
 * clinical-interpretation modules import these names directly):
 *
 *   • default export   HPGAxis3D({ state: AxisState })
 *   • named export     HPGAxis3DLoading
 *   • named export     mergeAxisStates(states: AxisState[]): AxisState
 *   • named export     DEFAULT_AXIS_STATE
 *   • named type       AxisState
 *   • named type       HormoneValues
 * --------------------------------------------------------------------------
 */

import { motion } from 'framer-motion'
import {
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react'

// ===========================================================================
// PUBLIC TYPES — must remain stable (re-imported elsewhere)
// ===========================================================================

export type HormoneValues = {
  /** mIU/mL */ fsh?: number
  /** mIU/mL */ lh?: number
  /** ng/mL  */ testosterone?: number
  /** pg/mL  */ estradiol?: number
  /** mL     */ testisVolume?: number
  /** pg/mL  */ inhibinB?: number
}

export type AxisState = {
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
  /** OPTIONAL patient hormone values for label display. */
  values?: HormoneValues
}

// ===========================================================================
// STATE MERGING — field-wise worst-case across multiple conditions
// (identical algorithm to the previous version)
// ===========================================================================

const RANK: Record<string, number> = {
  normal: 0,
  pulsing: 0,
  compensating: 1,
  faded: 2,
  weak: 3,
  sparse: 3,
  suppressed: 3,
  unresponsive: 4,
  atrophic: 4,
  damaged: 5,
  broken: 6,
  absent: 7,
  none: 0,
  present: 3,
  large: 5,
  active: 4,
}

function worse<T extends string>(a: T, b: T): T {
  return (RANK[b] ?? 0) > (RANK[a] ?? 0) ? b : a
}

export const DEFAULT_AXIS_STATE: AxisState = {
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

export function mergeAxisStates(states: AxisState[]): AxisState {
  if (states.length === 0) return DEFAULT_AXIS_STATE
  const out: AxisState = { ...DEFAULT_AXIS_STATE }
  const mergedValues: HormoneValues = {}
  for (const s of states) {
    out.hypothalamus = worse(out.hypothalamus, s.hypothalamus)
    out.gnrh = worse(out.gnrh, s.gnrh)
    out.pituitary = worse(out.pituitary, s.pituitary)
    out.fsh = worse(out.fsh, s.fsh)
    out.lh = worse(out.lh, s.lh)
    out.testis = worse(out.testis, s.testis)
    out.tubules = worse(out.tubules, s.tubules)
    out.sertoli = worse(out.sertoli, s.sertoli)
    out.leydig = worse(out.leydig, s.leydig)
    out.testosterone = worse(out.testosterone, s.testosterone)
    out.inhibinB = worse(out.inhibinB, s.inhibinB)
    out.epididymis = worse(out.epididymis, s.epididymis)
    out.vessels = worse(out.vessels, s.vessels)
    out.adipose = worse(out.adipose, s.adipose)
    out.aromatase = worse(out.aromatase, s.aromatase)
    if (s.values) {
      for (const k of Object.keys(s.values) as (keyof HormoneValues)[]) {
        const v = s.values[k]
        if (typeof v === 'number' && Number.isFinite(v)) {
          if (mergedValues[k] === undefined) mergedValues[k] = v
        }
      }
    }
  }
  if (Object.keys(mergedValues).length > 0) out.values = mergedValues
  return out
}

// ===========================================================================
// VISUAL CONSTANTS
// ===========================================================================

const PALETTE = {
  text: '#e2e8f0',
  textMuted: '#cbd5e1',
  textTitle: '#f8fafc',
  accent: '#60a5fa',
  normal: '#22c55e',
  compensating: '#f59e0b',
  abnormal: '#ef4444',
  abnormalSoft: '#fb923c',
  faded: '#64748b',
  panel: 'rgba(2, 6, 23, 0.78)',
  panelBorder: 'rgba(148, 163, 184, 0.35)',
} as const

/** Pixel-stable viewBox for the overlay SVG (horizontal layout ~2:1). */
const VB_W = 1000
const VB_H = 500

// ===========================================================================
// HELPERS
// ===========================================================================

type ArrowVariant = 'normal' | 'pulsing' | 'faded' | 'broken'

function arrowVariantFor(
  s:
    | 'normal'
    | 'pulsing'
    | 'faded'
    | 'suppressed'
    | 'weak'
    | 'broken'
    | 'absent'
): ArrowVariant {
  if (s === 'broken' || s === 'absent') return 'broken'
  if (s === 'pulsing') return 'pulsing'
  if (s === 'faded' || s === 'weak' || s === 'suppressed') return 'faded'
  return 'normal'
}

function arrowColor(v: ArrowVariant): string {
  if (v === 'broken') return PALETTE.abnormal
  if (v === 'pulsing') return PALETTE.normal
  if (v === 'faded') return PALETTE.faded
  return PALETTE.normal
}

function isAbnormal<T extends string>(s: T, normalValues: T[]): boolean {
  return !normalValues.includes(s)
}

// ===========================================================================
// TOOLTIP — rich clinical tooltips with hormone values + interpretation
// ===========================================================================

type TooltipLine = {
  label: string
  value: string
  color?: string
}

type Tooltip = {
  x: number
  y: number
  name: string
  desc: string
  status?: string
  statusColor?: string
  hormoneLines?: TooltipLine[]
  clinicalNote?: string
  outcomeNote?: string
}

type HoverHandlers = {
  onEnter: (
    tip: Omit<Tooltip, 'x' | 'y'>
  ) => (e: ReactMouseEvent) => void
  onLeave: () => void
  onMove: (e: ReactMouseEvent) => void
}

function makeHandlers(
  setTip: React.Dispatch<React.SetStateAction<Tooltip | null>>,
  containerRef: RefObject<HTMLDivElement>
): HoverHandlers {
  return {
    onEnter: (tipData) => (e) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setTip({
        ...tipData,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    },
    onLeave: () => setTip(null),
    onMove: (e) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setTip((prev) =>
        prev
          ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top }
          : prev
      )
    },
  }
}

function TooltipBox({ tip, containerRef }: { tip: Tooltip | null; containerRef: React.RefObject<HTMLDivElement | null> }) {
  if (!tip) return null
  // Use viewport-relative coordinates so tooltip never goes off-screen
  const rect = containerRef.current?.getBoundingClientRect()
  const vpW = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vpH = typeof window !== 'undefined' ? window.innerHeight : 800
  const absX = (rect?.left ?? 0) + tip.x
  const absY = (rect?.top ?? 0) + tip.y
  const tooltipW = 340
  const tooltipH = 320 // estimated max height
  // Position: prefer right+above cursor, but clamp to viewport
  let left = absX + 16
  let top = absY - tooltipH - 8
  // If goes off right edge, flip to left of cursor
  if (left + tooltipW > vpW - 8) left = absX - tooltipW - 16
  // If goes off top, show below cursor
  if (top < 8) top = absY + 20
  // If goes off bottom, clamp
  if (top + tooltipH > vpH - 8) top = vpH - tooltipH - 8
  // Clamp left
  if (left < 8) left = 8

  const style: CSSProperties = {
    position: 'fixed',
    left,
    top,
    pointerEvents: 'none',
    zIndex: 9999,
    maxWidth: tooltipW,
    minWidth: 220,
    background: 'rgba(2, 6, 23, 0.97)',
    color: '#ffffff',
    border: `1px solid ${PALETTE.panelBorder}`,
    borderRadius: 10,
    padding: '10px 13px',
    fontSize: 11.5,
    lineHeight: 1.5,
    boxShadow: '0 14px 32px rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  }
  const divider: CSSProperties = {
    height: 1,
    background: 'rgba(148, 163, 184, 0.2)',
    margin: '6px 0',
  }
  return (
    <div style={style}>
      {/* Header: name + status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <span style={{ fontWeight: 700, color: PALETTE.accent, fontSize: 12.5 }}>
          {tip.name}
        </span>
        {tip.status && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: tip.statusColor ?? PALETTE.text,
              background: `${tip.statusColor ?? PALETTE.faded}22`,
              border: `1px solid ${tip.statusColor ?? PALETTE.faded}44`,
              borderRadius: 4,
              padding: '1px 6px',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {tip.status}
          </span>
        )}
      </div>

      {/* Anatomical description */}
      <div style={{ color: PALETTE.textMuted, fontSize: 10.5, marginBottom: 4 }}>
        {tip.desc}
      </div>

      {/* Hormone values section */}
      {tip.hormoneLines && tip.hormoneLines.length > 0 && (
        <>
          <div style={divider} />
          <div style={{ fontSize: 9, fontWeight: 600, color: PALETTE.textMuted, letterSpacing: 0.5, marginBottom: 3, textTransform: 'uppercase' }}>
            Patient Values
          </div>
          {tip.hormoneLines.map((line, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 1 }}>
              <span style={{ color: PALETTE.text }}>{line.label}</span>
              <span style={{ fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: line.color ?? PALETTE.text }}>
                {line.value}
              </span>
            </div>
          ))}
        </>
      )}

      {/* Clinical interpretation */}
      {tip.clinicalNote && (
        <>
          <div style={divider} />
          <div style={{ fontSize: 9, fontWeight: 600, color: PALETTE.textMuted, letterSpacing: 0.5, marginBottom: 3, textTransform: 'uppercase' }}>
            Clinical Significance
          </div>
          <div style={{ color: '#fbbf24', fontSize: 10.5, lineHeight: 1.4 }}>
            {tip.clinicalNote}
          </div>
        </>
      )}

      {/* NOA outcome relevance */}
      {tip.outcomeNote && (
        <>
          <div style={divider} />
          <div style={{ fontSize: 9, fontWeight: 600, color: PALETTE.textMuted, letterSpacing: 0.5, marginBottom: 3, textTransform: 'uppercase' }}>
            Impact on Sperm Retrieval
          </div>
          <div style={{ color: '#fb923c', fontSize: 10.5, lineHeight: 1.4 }}>
            {tip.outcomeNote}
          </div>
        </>
      )}
    </div>
  )
}

// ===========================================================================
// CLINICAL INTERPRETATION HELPERS
// ===========================================================================

function statusLabel(
  s: string
): { text: string; color: string } {
  switch (s) {
    case 'normal':
    case 'pulsing':
      return { text: 'Normal', color: PALETTE.normal }
    case 'compensating':
      return { text: 'Compensating', color: PALETTE.compensating }
    case 'faded':
    case 'suppressed':
    case 'weak':
      return { text: 'Suppressed', color: PALETTE.faded }
    case 'damaged':
    case 'broken':
    case 'atrophic':
      return { text: 'Dysfunctional', color: PALETTE.abnormal }
    case 'unresponsive':
      return { text: 'Unresponsive', color: PALETTE.abnormal }
    case 'absent':
      return { text: 'Absent', color: PALETTE.abnormal }
    case 'sparse':
      return { text: 'Sparse', color: PALETTE.abnormalSoft }
    default:
      return { text: s, color: PALETTE.textMuted }
  }
}

/** Interpret FSH value in clinical context */
function fshInterpretation(v?: number): string | undefined {
  if (v === undefined) return undefined
  if (v < 1.5) return 'Low FSH → hypogonadotropic state; consider hypothalamic/pituitary cause (Kallmann, tumor).'
  if (v <= 12) return 'FSH within normal range (1.5–12 mIU/mL).'
  if (v <= 25) return 'Moderately elevated FSH (>12) → suggests partial Sertoli cell dysfunction. Residual spermatogenesis may exist.'
  return 'Markedly elevated FSH (>25) → severe spermatogenic failure. Sertoli cells unable to produce adequate Inhibin B feedback.'
}

/** Interpret LH value */
function lhInterpretation(v?: number): string | undefined {
  if (v === undefined) return undefined
  if (v < 1.7) return 'Low LH → hypogonadotropic state; pituitary/hypothalamic origin likely.'
  if (v <= 8.6) return 'LH within normal range (1.7–8.6 mIU/mL).'
  if (v <= 20) return 'Elevated LH → Leydig cell compensation; testosterone production under stress.'
  return 'Markedly elevated LH (>20) → primary Leydig cell failure; poor testosterone synthesis.'
}

/** Interpret testosterone */
function testosteroneInterpretation(v?: number): string | undefined {
  if (v === undefined) return undefined
  if (v < 2.5) return 'Low testosterone (<2.5 ng/mL) → inadequate intratesticular T for spermatogenesis. Consider HCG stimulation before micro-TESE.'
  if (v <= 10) return 'Testosterone within normal range (2.5–10 ng/mL).'
  return 'Supraphysiologic testosterone → possible exogenous source. Exogenous T suppresses spermatogenesis; must discontinue before TESE.'
}

/** Interpret Inhibin B */
function inhibinBInterpretation(v?: number): string | undefined {
  if (v === undefined) return undefined
  if (v < 40) return 'Very low Inhibin B (<40 pg/mL) → severe Sertoli cell dysfunction. Strong predictor of failed sperm retrieval.'
  if (v < 80) return 'Low Inhibin B (40–80 pg/mL) → reduced Sertoli cell function. Focal spermatogenesis possible.'
  return 'Inhibin B ≥80 pg/mL → relatively preserved Sertoli cell function. Favorable for micro-TESE.'
}

function fshColor(v?: number): string {
  if (v === undefined) return PALETTE.text
  if (v < 1.5 || v > 25) return PALETTE.abnormal
  if (v > 12) return PALETTE.abnormalSoft
  return PALETTE.normal
}
function lhColor(v?: number): string {
  if (v === undefined) return PALETTE.text
  if (v < 1.7 || v > 20) return PALETTE.abnormal
  if (v > 8.6) return PALETTE.abnormalSoft
  return PALETTE.normal
}
function tColor(v?: number): string {
  if (v === undefined) return PALETTE.text
  if (v < 2.5) return PALETTE.abnormal
  if (v > 10) return PALETTE.abnormalSoft
  return PALETTE.normal
}
function inhibColor(v?: number): string {
  if (v === undefined) return PALETTE.text
  if (v < 40) return PALETTE.abnormal
  if (v < 80) return PALETTE.abnormalSoft
  return PALETTE.normal
}

/** Build hormone lines array from values */
function buildHormoneLines(values: HormoneValues, keys: (keyof HormoneValues)[]): TooltipLine[] {
  const lines: TooltipLine[] = []
  const units: Record<keyof HormoneValues, string> = {
    fsh: 'mIU/mL',
    lh: 'mIU/mL',
    testosterone: 'ng/mL',
    estradiol: 'pg/mL',
    testisVolume: 'mL',
    inhibinB: 'pg/mL',
  }
  const labels: Record<keyof HormoneValues, string> = {
    fsh: 'FSH',
    lh: 'LH',
    testosterone: 'Testosterone',
    estradiol: 'Estradiol',
    testisVolume: 'Testis Volume',
    inhibinB: 'Inhibin B',
  }
  const colorFns: Record<keyof HormoneValues, (v?: number) => string> = {
    fsh: fshColor,
    lh: lhColor,
    testosterone: tColor,
    estradiol: () => PALETTE.text,
    testisVolume: (v) => (v !== undefined && v < 12 ? PALETTE.abnormalSoft : PALETTE.text),
    inhibinB: inhibColor,
  }
  for (const k of keys) {
    const v = values[k]
    if (typeof v === 'number' && Number.isFinite(v)) {
      lines.push({
        label: labels[k],
        value: `${v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)} ${units[k]}`,
        color: colorFns[k](v),
      })
    }
  }
  return lines
}

// ===========================================================================
// DIAGNOSIS DERIVATION — persistent labels from AxisState
// ===========================================================================

type DiagAnnotation = {
  /** Short label e.g. "Primary Testicular Failure" */
  label: string
  /** Where to anchor: 'brain' | 'pituitary' | 'testis' | 'global' */
  target: 'brain' | 'pituitary' | 'testis' | 'global'
  /** severity badge color */
  color: string
  /** severity text */
  severity: string
  /** short clinical one-liner */
  note: string
}

function deriveDiagnoses(s: AxisState): DiagAnnotation[] {
  const out: DiagAnnotation[] = []
  const v = s.values ?? {}

  // Primary testicular failure: high FSH/LH + low T + damaged testis
  const fshHigh = v.fsh !== undefined && v.fsh > 12
  const lhHigh = v.lh !== undefined && v.lh > 9
  const tLow = v.testosterone !== undefined && v.testosterone < 3
  const tvLow = v.testisVolume !== undefined && v.testisVolume < 12

  if (fshHigh && lhHigh && tLow) {
    out.push({
      label: 'Primary Testicular Failure',
      target: 'testis',
      color: PALETTE.abnormal,
      severity: 'SEVERE',
      note: `FSH ↑ LH ↑ T ↓ — pituitary driving maximally, testis unresponsive`,
    })
  } else if (fshHigh && tLow) {
    out.push({
      label: 'Gonadal Insufficiency',
      target: 'testis',
      color: PALETTE.abnormal,
      severity: 'SEVERE',
      note: `FSH ↑ T ↓ — seminiferous failure with Leydig dysfunction`,
    })
  } else if (fshHigh && lhHigh && !tLow) {
    out.push({
      label: 'Compensated Gonadotrophin Elevation',
      target: 'pituitary',
      color: PALETTE.compensating,
      severity: 'MODERATE',
      note: `FSH ↑ LH ↑ T normal — testis maintaining output under stress`,
    })
  }

  // Testicular atrophy
  if (tvLow) {
    out.push({
      label: 'Testicular Atrophy',
      target: 'testis',
      color: PALETTE.abnormalSoft,
      severity: 'MODERATE',
      note: `TV ${v.testisVolume!.toFixed(1)} mL (<12) — reduced spermatogenic mass`,
    })
  }

  // Hypothalamic/central
  if (s.hypothalamus === 'faded') {
    out.push({
      label: 'Hypogonadotropic State',
      target: 'brain',
      color: PALETTE.abnormal,
      severity: 'SEVERE',
      note: 'Suppressed GnRH — rule out exogenous T, opioids, lesion',
    })
  } else if (s.hypothalamus === 'compensating') {
    out.push({
      label: 'Hypothalamic Compensation',
      target: 'brain',
      color: PALETTE.compensating,
      severity: 'MILD',
      note: 'GnRH pulse frequency up-regulated to compensate',
    })
  }

  // Obesity/aromatase
  if (s.aromatase === 'active') {
    out.push({
      label: 'Aromatase Excess',
      target: 'global',
      color: PALETTE.abnormalSoft,
      severity: 'MODERATE',
      note: 'BMI ↑ → excess T→E2 conversion → central suppression',
    })
  }

  return out
}

// ===========================================================================
// SUB-COMPONENTS
// ===========================================================================

/**
 * Pulsing red/orange glow used as an SVG overlay on any structure whose
 * state ≠ 'normal'. Rendered as a soft ellipse with animated opacity+scale.
 */
function AbnormalGlow({
  cx,
  cy,
  rx,
  ry,
  color = PALETTE.abnormal,
}: {
  cx: number
  cy: number
  rx: number
  ry: number
  color?: string
}) {
  return (
    <g pointerEvents="none">
      {/* Solid bold ring */}
      <motion.ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke={color}
        strokeWidth={3}
        initial={{ opacity: 0.7 }}
        animate={{
          opacity: [0.6, 1, 0.6],
          strokeWidth: [3, 4.5, 3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {/* Outer expanding pulse ring */}
      <motion.ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke={color}
        strokeWidth={2}
        initial={{ opacity: 0.6, scale: 1 }}
        animate={{
          opacity: [0.6, 0],
          scale: [1, 1.4],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {/* Faint fill for visibility */}
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={color}
        opacity={0.12}
      />
    </g>
  )
}

/**
 * Hotspot — an invisible (or faint outline) hover region that triggers the
 * tooltip when the user hovers over an anatomical structure.
 */
function Hotspot({
  cx,
  cy,
  rx,
  ry,
  tipData,
  handlers,
}: {
  cx: number
  cy: number
  rx: number
  ry: number
  tipData: Omit<Tooltip, 'x' | 'y'>
  handlers: HoverHandlers
}) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="rgba(96, 165, 250, 0.001)"
      stroke="rgba(96, 165, 250, 0.18)"
      strokeWidth={0.8}
      strokeDasharray="3 3"
      style={{ cursor: 'help' }}
      onMouseEnter={handlers.onEnter(tipData)}
      onMouseLeave={handlers.onLeave}
      onMouseMove={handlers.onMove}
    />
  )
}

/**
 * Animated hormone-flow arrow. Uses framer-motion's strokeDashoffset to
 * create a moving-dash effect. State-driven styling:
 *   • 'normal'  → solid green, slow dashes
 *   • 'pulsing' → bright green, fast dashes
 *   • 'faded'   → grey, very slow dashes, low opacity
 *   • 'broken'  → red, static dashed line, no arrowhead
 */
function HormoneArrow({
  path,
  variant,
  arrowId,
  reverse = false,
  thickness = 3,
  tipData,
  handlers,
}: {
  path: string
  variant: ArrowVariant
  arrowId: string
  reverse?: boolean
  thickness?: number
  tipData: Omit<Tooltip, 'x' | 'y'>
  handlers: HoverHandlers
}) {
  const color = arrowColor(variant)
  const isBroken = variant === 'broken'
  const speed =
    variant === 'pulsing' ? 1.2 : variant === 'faded' ? 4.5 : 2.2

  return (
    <g
      onMouseEnter={handlers.onEnter(tipData)}
      onMouseLeave={handlers.onLeave}
      onMouseMove={handlers.onMove}
      style={{ cursor: 'help' }}
    >
      <defs>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
        </marker>
      </defs>

      {/* Backdrop static line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        opacity={isBroken ? 0.18 : variant === 'faded' ? 0.22 : 0.32}
      />

      {isBroken ? (
        // Broken / absent → static dashed red line, no arrowhead
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray="3 7"
          opacity={0.65}
        />
      ) : (
        // Animated dashed flow with arrowhead
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray="9 8"
          markerEnd={`url(#${arrowId})`}
          opacity={variant === 'faded' ? 0.6 : 1}
          animate={{ strokeDashoffset: reverse ? [0, 17] : [17, 0] }}
          transition={{
            duration: speed,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      {/* Extra pulsing halo overlay when 'pulsing' */}
      {variant === 'pulsing' && (
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={thickness + 4}
          strokeLinecap="round"
          pointerEvents="none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.35, 0] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </g>
  )
}

/**
 * Pill-shaped label next to an arrow, showing hormone name + (optional) value.
 */
function HormonePill({
  x,
  y,
  label,
  value,
  unit,
  variant,
}: {
  x: number
  y: number
  label: string
  value?: number
  unit?: string
  variant: ArrowVariant
}) {
  const color = arrowColor(variant)
  const formatted =
    typeof value === 'number' && Number.isFinite(value)
      ? `${value.toFixed(value >= 10 ? 0 : 1)}${unit ? ` ${unit}` : ''}`
      : null
  const width = formatted ? 96 : 56
  const height = 20
  return (
    <g pointerEvents="none">
      <rect
        x={x - width / 2}
        y={y - height / 2}
        rx={10}
        ry={10}
        width={width}
        height={height}
        fill="rgba(2, 6, 23, 0.92)"
        stroke={color}
        strokeWidth={1.2}
      />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fill="#ffffff"
        fontSize={10}
        fontWeight={700}
        fontFamily="system-ui, sans-serif"
        letterSpacing={0.3}
      >
        {label}
        {formatted ? `  ${formatted}` : ''}
      </text>
    </g>
  )
}

// ===========================================================================
// MAIN COMPONENT
// ===========================================================================

export function HPGAxis3DLoading() {
  return (
    <div className="flex h-full min-h-[300px] w-full items-center justify-center text-sm text-white/70">
      Loading anatomical atlas…
    </div>
  )
}

export default function HPGAxis3D({ state }: { state: AxisState }) {
  const [tip, setTip] = useState<Tooltip | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const handlers = makeHandlers(
    setTip,
    containerRef as RefObject<HTMLDivElement>
  )

  const values = state.values ?? {}
  const diagnoses = deriveDiagnoses(state)

  // ----- Image picks ------------------------------------------------------
  const testisSrc =
    state.testis !== 'normal'
      ? '/atlas/testis-pathological.png'
      : '/atlas/testis-normal.png'

  // ----- Arrow variants ---------------------------------------------------
  const gnrhV = arrowVariantFor(state.gnrh)
  const fshV = arrowVariantFor(state.fsh)
  const lhV = arrowVariantFor(state.lh)
  const tV = arrowVariantFor(state.testosterone)
  const inhibinV = arrowVariantFor(state.inhibinB)

  // ----- Abnormal-region flags -------------------------------------------
  const hypoAbnormal = isAbnormal(state.hypothalamus, ['normal'])
  const pituiAbnormal = isAbnormal(state.pituitary, ['normal'])
  const tubulesAbnormal =
    isAbnormal(state.tubules, ['normal']) ||
    isAbnormal(state.sertoli, ['normal'])
  const leydigAbnormal = isAbnormal(state.leydig, ['normal'])

  // ----- Coordinates (in overlay SVG viewBox 0..1000 × 0..500) -----------
  // PADDING: 30px from all viewBox edges so nothing is clipped
  const PAD = 30

  // Box sizes matched to actual image aspect ratios (no wasted space).
  // Images render edge-to-edge inside their box.
  //
  // Brain/Testis: 800×500 = 1.6:1 aspect
  // Pituitary:    500×400 = 1.25:1 aspect

  // Brain (left) — 1.6:1 aspect
  const BRAIN = { x: PAD, y: 120, w: 280, h: 175 }
  // Hypothalamus: warm glow in lower-center of the brain cross-section
  const hypoCenter = { cx: BRAIN.x + BRAIN.w * 0.47, cy: BRAIN.y + BRAIN.h * 0.68, rx: 38, ry: 22 }

  // Pituitary (center) — 1.25:1 aspect
  const PIT = { x: 380, y: 130, w: 190, h: 152 }
  const antLobe = { cx: PIT.x + PIT.w * 0.38, cy: PIT.y + PIT.h * 0.55, rx: 28, ry: 20 }
  const postLobe = { cx: PIT.x + PIT.w * 0.62, cy: PIT.y + PIT.h * 0.55, rx: 22, ry: 16 }

  // Testis (right) — 1.6:1 aspect
  const TES = { x: 670, y: 120, w: 280, h: 175 }
  const tubulesRegion = { cx: TES.x + TES.w * 0.42, cy: TES.y + TES.h * 0.45, rx: 55, ry: 40 }
  const leydigRegion = { cx: TES.x + TES.w * 0.62, cy: TES.y + TES.h * 0.72, rx: 40, ry: 24 }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 400,
        background:
          'radial-gradient(circle at 50% 30%, #0f172a 0%, #020617 100%)',
        borderRadius: 8,
        overflow: 'visible',
        color: PALETTE.text,
      }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        {/* — Faint atlas grid + vignette + text shadow filter — */}
        <defs>
          <pattern
            id="atlas-grid"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.4"
              opacity="0.4"
            />
          </pattern>
          <radialGradient id="vignette" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.7" />
          </radialGradient>
          {/* Dark halo behind text for contrast against any background */}
          <filter id="text-shadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#020617" floodOpacity="0.9" />
          </filter>
        </defs>
        <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#atlas-grid)" />
        <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#vignette)" />

        {/* ============================================================
            TOP SECTION — Brain / Hypothalamus
            ============================================================ */}
        <image
          href="/atlas/brain-hypothalamus.png"
          xlinkHref="/atlas/brain-hypothalamus.png"
          x={BRAIN.x}
          y={BRAIN.y}
          width={BRAIN.w}
          height={BRAIN.h}
          preserveAspectRatio="xMidYMid meet"
          opacity={state.hypothalamus === 'faded' ? 0.55 : 0.95}
          
        />

        {/* Abnormal-state glow over the hypothalamus */}
        {hypoAbnormal && (
          <AbnormalGlow
            cx={hypoCenter.cx}
            cy={hypoCenter.cy}
            rx={hypoCenter.rx + 6}
            ry={hypoCenter.ry + 6}
            color={
              state.hypothalamus === 'compensating'
                ? PALETTE.abnormalSoft
                : PALETTE.abnormal
            }
          />
        )}

        {/* Hover hotspot — hypothalamus */}
        <Hotspot
          cx={hypoCenter.cx}
          cy={hypoCenter.cy}
          rx={hypoCenter.rx}
          ry={hypoCenter.ry}
          tipData={{
            name: 'Hypothalamus',
            desc: 'GnRH pulse generator — releases GnRH every ~90 min to drive anterior pituitary FSH/LH secretion.',
            ...statusLabel(state.hypothalamus),
            status: statusLabel(state.hypothalamus).text,
            statusColor: statusLabel(state.hypothalamus).color,
            hormoneLines: buildHormoneLines(values, ['fsh', 'lh']),
            clinicalNote: state.hypothalamus === 'compensating'
              ? 'Hypothalamus is up-regulating GnRH pulse frequency to compensate for low gonadal feedback.'
              : state.hypothalamus === 'faded'
                ? 'Hypothalamic GnRH output is suppressed — hypogonadotropic state. Rule out exogenous testosterone, opioids, or structural lesion.'
                : undefined,
            outcomeNote: state.hypothalamus !== 'normal'
              ? 'Hypothalamic dysfunction → secondary hypogonadism. HCG/HMG therapy may restore spermatogenesis before considering micro-TESE.'
              : undefined,
          }}
          handlers={handlers}
        />

        {/* Label */}
        <g pointerEvents="none" fontFamily="system-ui, sans-serif" filter="url(#text-shadow)">
          <text
            x={BRAIN.x + BRAIN.w / 2}
            y={BRAIN.y + BRAIN.h + 16}
            fill={PALETTE.textTitle}
            fontSize={11}
            fontWeight={700}
            textAnchor="middle"
          >
            Hypothalamus
          </text>
          <text
            x={BRAIN.x + BRAIN.w / 2}
            y={BRAIN.y + BRAIN.h + 28}
            fill={PALETTE.textMuted}
            fontSize={9}
            textAnchor="middle"
          >
            GnRH neurons
          </text>
        </g>

        {/* ============================================================
            GnRH ARROW — Hypothalamus ↓ Pituitary
            ============================================================ */}
        <HormoneArrow
          path={`M ${BRAIN.x + BRAIN.w} ${hypoCenter.cy} Q ${(BRAIN.x + BRAIN.w + PIT.x) / 2} ${antLobe.cy}, ${PIT.x} ${antLobe.cy}`}
          variant={gnrhV}
          arrowId="hpg-arrow-gnrh"
          handlers={handlers}
          tipData={{
            name: 'GnRH Signaling',
            desc: 'Gonadotropin-releasing hormone — pulsatile decapeptide from hypothalamus to anterior pituitary via portal circulation.',
            ...statusLabel(state.gnrh),
            status: statusLabel(state.gnrh).text,
            statusColor: statusLabel(state.gnrh).color,
            clinicalNote: state.gnrh === 'suppressed'
              ? 'GnRH suppressed → exogenous steroids, opioids, or hypothalamic lesion. FSH/LH will be inappropriately low.'
              : state.gnrh === 'pulsing'
                ? 'GnRH pulse frequency increased — compensatory response to low gonadal feedback.'
                : undefined,
            outcomeNote: state.gnrh === 'suppressed'
              ? 'Reversible cause of azoospermia. Pulsatile GnRH or gonadotropin therapy can restore spermatogenesis in 6–12 months.'
              : undefined,
          }}
          thickness={1.5}
        />
        <HormonePill x={(BRAIN.x + BRAIN.w + PIT.x) / 2} y={hypoCenter.cy + 10} label="GnRH" variant={gnrhV} />

        {/* ============================================================
            MIDDLE SECTION — Pituitary Gland
            ============================================================ */}
        <image
          href="/atlas/pituitary.png"
          xlinkHref="/atlas/pituitary.png"
          x={PIT.x}
          y={PIT.y}
          width={PIT.w}
          height={PIT.h}
          preserveAspectRatio="xMidYMid meet"
          opacity={state.pituitary === 'faded' ? 0.55 : 0.95}
          
        />

        {/* Abnormal glow — anterior lobe (FSH/LH source) */}
        {pituiAbnormal && (
          <AbnormalGlow
            cx={antLobe.cx}
            cy={antLobe.cy}
            rx={antLobe.rx + 6}
            ry={antLobe.ry + 6}
            color={
              state.pituitary === 'compensating'
                ? PALETTE.abnormalSoft
                : PALETTE.abnormal
            }
          />
        )}

        {/* Hover hotspots — anterior + posterior lobes */}
        <Hotspot
          cx={antLobe.cx}
          cy={antLobe.cy}
          rx={antLobe.rx}
          ry={antLobe.ry}
          tipData={{
            name: 'Anterior Pituitary',
            desc: 'Gonadotroph cells synthesize and secrete FSH and LH under GnRH stimulation. Key regulator of testicular function.',
            ...statusLabel(state.pituitary),
            status: statusLabel(state.pituitary).text,
            statusColor: statusLabel(state.pituitary).color,
            hormoneLines: buildHormoneLines(values, ['fsh', 'lh']),
            clinicalNote: (() => {
              const notes: string[] = []
              const fi = fshInterpretation(values.fsh)
              const li = lhInterpretation(values.lh)
              if (fi) notes.push(fi)
              if (li) notes.push(li)
              if (state.pituitary === 'compensating') notes.push('Pituitary is in compensatory overdrive — increasing gonadotropin output to overcome gonadal failure.')
              return notes.length > 0 ? notes.join(' ') : undefined
            })(),
            outcomeNote: (values.fsh !== undefined && values.fsh > 12)
              ? 'Elevated FSH is the hallmark of primary testicular failure (NOA). FSH >25 with low Inhibin B = poor micro-TESE prognosis (SRR ~30%). FSH 12–25 with preserved volume = intermediate prognosis (SRR ~40–50%).'
              : (values.fsh !== undefined && values.fsh < 1.5)
                ? 'Low FSH suggests hypogonadotropic hypogonadism — potentially treatable with gonadotropins. Excellent TESE prognosis after hormonal correction.'
                : undefined,
          }}
          handlers={handlers}
        />
        <Hotspot
          cx={postLobe.cx}
          cy={postLobe.cy}
          rx={postLobe.rx}
          ry={postLobe.ry}
          tipData={{
            name: 'Posterior Pituitary',
            desc: 'Neurohypophysis — stores and releases oxytocin and vasopressin (ADH). Not directly involved in HPG axis gonadotropin regulation.',
            status: 'N/A for HPG',
            statusColor: PALETTE.textMuted,
          }}
          handlers={handlers}
        />

        {/* Labels */}
        <g pointerEvents="none" fontFamily="system-ui, sans-serif" filter="url(#text-shadow)">
          <text
            x={PIT.x + PIT.w / 2}
            y={PIT.y - 8}
            fill={PALETTE.textTitle}
            fontSize={11}
            fontWeight={700}
            textAnchor="middle"
          >
            Pituitary Gland
          </text>
          <text
            x={antLobe.cx}
            y={antLobe.cy + antLobe.ry + 16}
            fill={PALETTE.textMuted}
            fontSize={9}
            textAnchor="middle"
          >
            Anterior · FSH/LH
          </text>
          <text
            x={postLobe.cx}
            y={postLobe.cy + postLobe.ry + 16}
            fill={PALETTE.textMuted}
            fontSize={9}
            textAnchor="middle"
          >
            Posterior · ADH
          </text>
        </g>

        {/* ============================================================
            FSH + LH ARROWS — Pituitary ↓ Testis
            ============================================================ */}
        <HormoneArrow
          path={`M ${PIT.x + PIT.w} ${antLobe.cy - 14} Q ${(PIT.x + PIT.w + TES.x) / 2} ${tubulesRegion.cy - 40}, ${TES.x} ${tubulesRegion.cy}`}
          variant={fshV}
          arrowId="hpg-arrow-fsh"
          handlers={handlers}
          tipData={{
            name: 'FSH → Sertoli Cells',
            desc: 'Follicle-stimulating hormone binds FSH receptors on Sertoli cells, activating spermatogenesis support, ABP production, and Inhibin B secretion.',
            ...statusLabel(state.fsh),
            status: statusLabel(state.fsh).text,
            statusColor: statusLabel(state.fsh).color,
            hormoneLines: buildHormoneLines(values, ['fsh', 'inhibinB']),
            clinicalNote: fshInterpretation(values.fsh),
            outcomeNote: values.fsh !== undefined
              ? values.fsh > 25
                ? 'FSH >25 mIU/mL with small testis volume (<6 mL) strongly predicts maturation arrest or Sertoli-cell-only pattern. Micro-TESE SRR approximately 20–35%.'
                : values.fsh > 12
                  ? 'Moderately elevated FSH suggests partial spermatogenic failure. Focal spermatogenesis may still be present — micro-TESE SRR 40–55%.'
                  : values.fsh < 1.5
                    ? 'Low FSH → hypogonadotropic hypogonadism. Gonadotropin therapy may induce spermatogenesis, potentially avoiding TESE altogether.'
                    : 'Normal FSH with azoospermia → consider obstructive causes or early maturation arrest.'
              : undefined,
          }}
        />
        <HormonePill
          x={(PIT.x + PIT.w + TES.x) / 2}
          y={antLobe.cy - 40}
          label="FSH"
          value={values.fsh}
          unit="mIU/mL"
          variant={fshV}
        />

        <HormoneArrow
          path={`M ${PIT.x + PIT.w} ${antLobe.cy + 14} Q ${(PIT.x + PIT.w + TES.x) / 2} ${leydigRegion.cy + 10}, ${TES.x} ${leydigRegion.cy}`}
          variant={lhV}
          arrowId="hpg-arrow-lh"
          handlers={handlers}
          tipData={{
            name: 'LH → Leydig Cells',
            desc: 'Luteinizing hormone binds LH/hCG receptors on Leydig cells, stimulating steroidogenesis (testosterone synthesis via cholesterol → pregnenolone → testosterone).',
            ...statusLabel(state.lh),
            status: statusLabel(state.lh).text,
            statusColor: statusLabel(state.lh).color,
            hormoneLines: buildHormoneLines(values, ['lh', 'testosterone']),
            clinicalNote: lhInterpretation(values.lh),
            outcomeNote: values.lh !== undefined
              ? values.lh > 20
                ? 'Markedly elevated LH with low T → primary Leydig cell failure. Poor intratesticular testosterone environment for spermatogenesis.'
                : values.lh > 8.6
                  ? 'Elevated LH → compensatory response. Leydig cells under stress but still functional.'
                  : values.lh < 1.7
                    ? 'Low LH → hypogonadotropic state. HCG therapy can mimic LH action and restore intratesticular testosterone.'
                    : undefined
              : undefined,
          }}
        />
        <HormonePill
          x={(PIT.x + PIT.w + TES.x) / 2}
          y={leydigRegion.cy - 10}
          label="LH"
          value={values.lh}
          unit="mIU/mL"
          variant={lhV}
        />

        {/* ============================================================
            BOTTOM SECTION — Testis (normal or pathological)
            ============================================================ */}
        <image
          href={testisSrc}
          xlinkHref={testisSrc}
          x={TES.x}
          y={TES.y}
          width={TES.w}
          height={TES.h}
          preserveAspectRatio="xMidYMid meet"
          opacity={state.testis === 'faded' ? 0.55 : 0.97}
          
        />

        {/* Abnormal-state glows */}
        {tubulesAbnormal && (
          <AbnormalGlow
            cx={tubulesRegion.cx}
            cy={tubulesRegion.cy}
            rx={tubulesRegion.rx + 4}
            ry={tubulesRegion.ry + 4}
            color={PALETTE.abnormal}
          />
        )}
        {leydigAbnormal && (
          <AbnormalGlow
            cx={leydigRegion.cx}
            cy={leydigRegion.cy}
            rx={leydigRegion.rx + 4}
            ry={leydigRegion.ry + 4}
            color={PALETTE.abnormalSoft}
          />
        )}

        {/* Hover hotspots — seminiferous tubules + Leydig cells */}
        <Hotspot
          cx={tubulesRegion.cx}
          cy={tubulesRegion.cy}
          rx={tubulesRegion.rx}
          ry={tubulesRegion.ry}
          tipData={{
            name: 'Seminiferous Tubules',
            desc: 'Site of spermatogenesis — Sertoli cells form the blood-testis barrier and nurture developing germ cells from spermatogonia → spermatozoa. Requires FSH + intratesticular testosterone.',
            ...statusLabel(state.tubules === 'normal' ? state.sertoli : state.tubules),
            status: statusLabel(state.tubules === 'normal' ? state.sertoli : state.tubules).text,
            statusColor: statusLabel(state.tubules === 'normal' ? state.sertoli : state.tubules).color,
            hormoneLines: buildHormoneLines(values, ['fsh', 'inhibinB', 'testisVolume']),
            clinicalNote: (() => {
              const notes: string[] = []
              if (state.tubules === 'damaged' || state.sertoli === 'damaged')
                notes.push('Tubular damage with Sertoli cell dysfunction — Sertoli-cell-only (SCO) pattern likely on histology.')
              if (state.tubules === 'sparse')
                notes.push('Sparse tubules — focal spermatogenesis may exist in isolated regions.')
              const ibi = inhibinBInterpretation(values.inhibinB)
              if (ibi) notes.push(ibi)
              return notes.length > 0 ? notes.join(' ') : undefined
            })(),
            outcomeNote: (() => {
              if (state.tubules === 'damaged' && state.sertoli === 'damaged')
                return 'Complete SCO pattern → micro-TESE SRR ~25–30%. Surgeon should explore multiple regions for focal spermatogenesis.'
              if (state.tubules === 'sparse')
                return 'Hypospermatogenesis pattern → micro-TESE SRR ~50–60%. Best prognosis among NOA subtypes.'
              if (values.testisVolume !== undefined && values.testisVolume < 6)
                return 'Testis volume <6 mL → significantly reduced parenchyma. Associated with lower SRR.'
              return undefined
            })(),
          }}
          handlers={handlers}
        />
        <Hotspot
          cx={leydigRegion.cx}
          cy={leydigRegion.cy}
          rx={leydigRegion.rx}
          ry={leydigRegion.ry}
          tipData={{
            name: 'Leydig Cells',
            desc: 'Interstitial cells producing testosterone via LH stimulation. Intratesticular T concentration is 50–100× serum levels and essential for spermatogenesis.',
            ...statusLabel(state.leydig),
            status: statusLabel(state.leydig).text,
            statusColor: statusLabel(state.leydig).color,
            hormoneLines: buildHormoneLines(values, ['testosterone', 'lh', 'estradiol']),
            clinicalNote: (() => {
              const notes: string[] = []
              const ti = testosteroneInterpretation(values.testosterone)
              if (ti) notes.push(ti)
              if (state.leydig === 'damaged' || state.leydig === 'unresponsive')
                notes.push('Leydig cell dysfunction — reduced steroidogenic capacity. Serum T may be low despite elevated LH.')
              return notes.length > 0 ? notes.join(' ') : undefined
            })(),
            outcomeNote: values.testosterone !== undefined && values.testosterone < 2.5
              ? 'Low serum testosterone correlates with poor intratesticular T environment. Pre-TESE HCG stimulation for 3 months may improve micro-TESE SRR by 10–15%.'
              : state.leydig === 'unresponsive'
                ? 'Leydig cells unresponsive to LH → primary hypogonadism. Limited benefit from hormonal optimization.'
                : undefined,
          }}
          handlers={handlers}
        />

        {/* Labels */}
        <g pointerEvents="none" fontFamily="system-ui, sans-serif" filter="url(#text-shadow)">
          <text
            x={tubulesRegion.cx}
            y={tubulesRegion.cy + tubulesRegion.ry + 16}
            fill={PALETTE.textTitle}
            fontSize={10}
            fontWeight={700}
            textAnchor="middle"
          >
            Seminiferous Tubules
          </text>
          <text
            x={leydigRegion.cx}
            y={leydigRegion.cy + leydigRegion.ry + 16}
            fill={PALETTE.textMuted}
            fontSize={9}
            textAnchor="middle"
          >
            Leydig Cells
          </text>
        </g>

        {/* Testis caption */}
        <text
          x={TES.x + TES.w / 2}
          y={TES.y + TES.h + 14}
          textAnchor="middle"
          fill={PALETTE.textTitle}
          fontSize={11}
          fontWeight={700}
          fontFamily="system-ui, sans-serif"
          filter="url(#text-shadow)"
        >
          {state.testis === 'atrophic'
            ? 'Testis — Atrophic Parenchyma'
            : state.testis === 'damaged'
              ? 'Testis — Damaged Parenchyma'
              : state.testis === 'faded'
                ? 'Testis — Suppressed Function'
                : 'Testis — Healthy Parenchyma'}
        </text>

        {/* ============================================================
            FEEDBACK ARROWS (right side, both flowing upward)
            ============================================================ */}
        {/* Testosterone — testis → hypothalamus (top arc feedback) */}
        <HormoneArrow
          path={`M ${TES.x + TES.w * 0.6} ${TES.y} C ${TES.x + TES.w * 0.6} ${PAD}, ${BRAIN.x + BRAIN.w * 0.6} ${PAD}, ${BRAIN.x + BRAIN.w * 0.6} ${BRAIN.y}`}
          variant={tV}
          arrowId="hpg-arrow-t"
          reverse
          thickness={1.5}
          handlers={handlers}
          tipData={{
            name: 'Testosterone — Negative Feedback',
            desc: 'Testosterone from Leydig cells feeds back at hypothalamus (suppresses GnRH pulse frequency) and anterior pituitary (suppresses LH secretion). Loss of this feedback loop elevates LH.',
            ...statusLabel(state.testosterone),
            status: statusLabel(state.testosterone).text,
            statusColor: statusLabel(state.testosterone).color,
            hormoneLines: buildHormoneLines(values, ['testosterone', 'lh']),
            clinicalNote: testosteroneInterpretation(values.testosterone),
            outcomeNote: values.testosterone !== undefined && values.testosterone < 2.5
              ? 'Low T → impaired intratesticular testosterone environment. Pre-operative HCG stimulation (1500–3000 IU 2×/wk for 3 months) may improve sperm retrieval rates by optimizing local T concentration.'
              : state.testosterone === 'broken' || state.testosterone === 'absent'
                ? 'Absent testosterone feedback → unopposed GnRH/LH drive. Indicates severe Leydig cell damage.'
                : undefined,
          }}
        />
        <HormonePill
          x={(BRAIN.x + BRAIN.w * 0.6 + TES.x + TES.w * 0.6) / 2}
          y={PAD + 4}
          label="T"
          value={values.testosterone}
          unit="ng/mL"
          variant={tV}
        />

        {/* Inhibin B — testis → pituitary (bottom arc feedback) */}
        <HormoneArrow
          path={`M ${TES.x + TES.w * 0.35} ${TES.y + TES.h} C ${TES.x + TES.w * 0.35} ${VB_H - PAD}, ${PIT.x + PIT.w * 0.45} ${VB_H - PAD}, ${PIT.x + PIT.w * 0.45} ${PIT.y + PIT.h}`}
          variant={inhibinV}
          arrowId="hpg-arrow-inhibinb"
          reverse
          thickness={1.5}
          handlers={handlers}
          tipData={{
            name: 'Inhibin B — Negative Feedback',
            desc: 'Glycoprotein secreted by Sertoli cells. Selectively suppresses FSH at the anterior pituitary via activin/follistatin signaling. Best serological marker of Sertoli cell function and spermatogenic status.',
            ...statusLabel(state.inhibinB),
            status: statusLabel(state.inhibinB).text,
            statusColor: statusLabel(state.inhibinB).color,
            hormoneLines: buildHormoneLines(values, ['inhibinB', 'fsh']),
            clinicalNote: inhibinBInterpretation(values.inhibinB),
            outcomeNote: values.inhibinB !== undefined
              ? values.inhibinB < 40
                ? 'Inhibin B <40 pg/mL is the strongest serological predictor of SCO histology. Micro-TESE SRR approximately 20–30%. However, focal spermatogenesis cannot be excluded — proceed with micro-TESE.'
                : values.inhibinB < 80
                  ? 'Inhibin B 40–80 pg/mL → intermediate prognosis. Residual spermatogenesis likely in some tubules. Micro-TESE SRR ~45–55%.'
                  : 'Inhibin B ≥80 pg/mL → relatively preserved Sertoli function. If NOA confirmed, micro-TESE SRR ~55–70%. Consider obstructive cause.'
              : undefined,
          }}
        />
        <HormonePill
          x={(PIT.x + PIT.w * 0.45 + TES.x + TES.w * 0.35) / 2}
          y={VB_H - PAD - 4}
          label="Inhibin B"
          value={values.inhibinB}
          unit="pg/mL"
          variant={inhibinV}
        />

        {/* ============================================================
            STATUS LEGEND (top-right)
            ============================================================ */}
        <g transform={`translate(${VB_W - 120} 6)`}>
          <rect
            x={0}
            y={0}
            width={114}
            height={86}
            rx={6}
            ry={6}
            fill={PALETTE.panel}
            stroke="#334155"
            strokeWidth={1}
          />
          <text
            x={8}
            y={15}
            fill={PALETTE.textTitle}
            fontSize={9}
            fontWeight={700}
            letterSpacing={0.4}
            fontFamily="system-ui, sans-serif"
          >
            AXIS STATUS
          </text>
          <g fontFamily="system-ui, sans-serif">
            <circle cx={14} cy={32} r={4} fill={PALETTE.normal} />
            <text x={24} y={35} fill={PALETTE.text} fontSize={9}>
              Normal
            </text>
            <circle cx={14} cy={48} r={4} fill={PALETTE.compensating} />
            <text x={24} y={51} fill={PALETTE.text} fontSize={9}>
              Compensating
            </text>
            <circle cx={14} cy={64} r={4} fill={PALETTE.abnormal} />
            <text x={24} y={67} fill={PALETTE.text} fontSize={9}>
              Dysfunctional
            </text>
            <circle cx={14} cy={80} r={4} fill={PALETTE.faded} />
            <text x={24} y={83} fill={PALETTE.text} fontSize={9}>
              Suppressed
            </text>
          </g>
        </g>

        {/* ============================================================
            PATIENT VALUES PANEL (only when values are present)
            ============================================================ */}
        {(values.fsh !== undefined ||
          values.lh !== undefined ||
          values.testosterone !== undefined ||
          values.testisVolume !== undefined ||
          values.inhibinB !== undefined ||
          values.estradiol !== undefined) && (
          <g transform={`translate(${PAD} ${BRAIN.y + BRAIN.h + 50})`}>
            <rect
              x={0}
              y={0}
              width={150}
              height={114}
              rx={6}
              ry={6}
              fill={PALETTE.panel}
              stroke="#334155"
              strokeWidth={1}
            />
            <text
              x={8}
              y={14}
              fill={PALETTE.textTitle}
              fontSize={9}
              fontWeight={700}
              letterSpacing={0.4}
              fontFamily="system-ui, sans-serif"
            >
              PATIENT VALUES
            </text>
            <g
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fontSize={9.5}
              fill={PALETTE.text}
            >
              {values.fsh !== undefined && (
                <text x={8} y={30}>
                  FSH{'  '}
                  <tspan fill={arrowColor(fshV)} fontWeight={700}>
                    {values.fsh.toFixed(1)}
                  </tspan>{' '}
                  mIU/mL
                </text>
              )}
              {values.lh !== undefined && (
                <text x={8} y={46}>
                  LH{'   '}
                  <tspan fill={arrowColor(lhV)} fontWeight={700}>
                    {values.lh.toFixed(1)}
                  </tspan>{' '}
                  mIU/mL
                </text>
              )}
              {values.testosterone !== undefined && (
                <text x={8} y={62}>
                  T{'    '}
                  <tspan fill={arrowColor(tV)} fontWeight={700}>
                    {values.testosterone.toFixed(2)}
                  </tspan>{' '}
                  ng/mL
                </text>
              )}
              {values.testisVolume !== undefined && (
                <text x={8} y={78}>
                  TV{'   '}
                  <tspan fontWeight={700}>
                    {values.testisVolume.toFixed(1)}
                  </tspan>{' '}
                  mL
                </text>
              )}
              {values.inhibinB !== undefined && (
                <text x={8} y={94}>
                  InB{'  '}
                  <tspan fill={arrowColor(inhibinV)} fontWeight={700}>
                    {values.inhibinB.toFixed(0)}
                  </tspan>{' '}
                  pg/mL
                </text>
              )}
              {values.estradiol !== undefined && (
                <text x={8} y={110}>
                  E2{'   '}
                  <tspan fontWeight={700}>
                    {values.estradiol.toFixed(0)}
                  </tspan>{' '}
                  pg/mL
                </text>
              )}
            </g>
          </g>
        )}
        {/* ===== DIAGNOSIS ANNOTATIONS — persistent callouts ===== */}
        {diagnoses.length > 0 && (() => {
          // Group by target and track per-target stack index
          const targetCount: Record<string, number> = {}
          return (
          <g fontFamily="system-ui, sans-serif" filter="url(#text-shadow)">
            {diagnoses.map((d, i) => {
              const tIdx = targetCount[d.target] ?? 0
              targetCount[d.target] = tIdx + 1

              // Position based on target structure — stack per target
              let anchorX: number, anchorY: number
              switch (d.target) {
                case 'brain':
                  anchorX = BRAIN.x + BRAIN.w / 2
                  anchorY = BRAIN.y - 18 - tIdx * 40
                  break
                case 'pituitary':
                  anchorX = PIT.x + PIT.w / 2
                  anchorY = PIT.y - 18 - tIdx * 40
                  break
                case 'testis':
                  anchorX = TES.x + TES.w * 0.35
                  anchorY = TES.y - 18 - tIdx * 40
                  break
                default:
                  anchorX = VB_W / 2
                  anchorY = 20 + tIdx * 40
              }
              // Clamp Y so it doesn't go above viewBox
              anchorY = Math.max(14, anchorY)

              return (
                <g key={`diag-${i}`}>
                  {/* Leader line from badge to structure */}
                  {d.target !== 'global' && (
                    <line
                      x1={anchorX}
                      y1={anchorY + 24}
                      x2={anchorX}
                      y2={d.target === 'brain' ? BRAIN.y : d.target === 'pituitary' ? PIT.y : TES.y}
                      stroke={d.color}
                      strokeWidth={0.8}
                      strokeDasharray="3 2"
                      opacity={0.5}
                    />
                  )}
                  {/* Badge background */}
                  <motion.rect
                    x={anchorX - 95}
                    y={anchorY - 10}
                    width={190}
                    height={34}
                    rx={6}
                    fill="#0f172a"
                    fillOpacity={0.88}
                    stroke={d.color}
                    strokeWidth={1.2}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.15, duration: 0.4 }}
                  />
                  {/* Severity dot */}
                  <motion.circle
                    cx={anchorX - 82}
                    cy={anchorY}
                    r={3.5}
                    fill={d.color}
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ delay: 0.5 + i * 0.15, duration: 1.5, repeat: Infinity }}
                  />
                  {/* Label text */}
                  <motion.text
                    x={anchorX - 72}
                    y={anchorY + 1}
                    fill={PALETTE.textTitle}
                    fontSize={8.5}
                    fontWeight={700}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.15 }}
                  >
                    {d.label}
                    <tspan fill={d.color} fontSize={7} fontWeight={600}> [{d.severity}]</tspan>
                  </motion.text>
                  {/* Note text */}
                  <motion.text
                    x={anchorX - 82}
                    y={anchorY + 14}
                    fill={PALETTE.textMuted}
                    fontSize={6.5}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.15 }}
                  >
                    {d.note.length > 60 ? d.note.slice(0, 60) + '…' : d.note}
                  </motion.text>
                </g>
              )
            })}
          </g>
          )
        })()}
      </svg>

      <TooltipBox tip={tip} containerRef={containerRef} />
    </div>
  )
}
