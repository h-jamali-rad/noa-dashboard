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
  textMuted: '#94a3b8',
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
// TOOLTIP
// ===========================================================================

type Tooltip = { x: number; y: number; name: string; desc: string }

type HoverHandlers = {
  onEnter: (
    name: string,
    desc: string
  ) => (e: ReactMouseEvent) => void
  onLeave: () => void
  onMove: (e: ReactMouseEvent) => void
}

function makeHandlers(
  setTip: React.Dispatch<React.SetStateAction<Tooltip | null>>,
  containerRef: RefObject<HTMLDivElement>
): HoverHandlers {
  return {
    onEnter: (name, desc) => (e) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setTip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        name,
        desc,
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

function TooltipBox({ tip }: { tip: Tooltip | null }) {
  if (!tip) return null
  const style: CSSProperties = {
    position: 'absolute',
    left: tip.x + 14,
    top: tip.y - 8,
    transform: 'translateY(-100%)',
    pointerEvents: 'none',
    zIndex: 50,
    maxWidth: 260,
    minWidth: 180,
    background: 'rgba(2, 6, 23, 0.96)',
    color: '#ffffff',
    border: `1px solid ${PALETTE.panelBorder}`,
    borderRadius: 8,
    padding: '8px 11px',
    fontSize: 11.5,
    lineHeight: 1.45,
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(6px)',
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  }
  return (
    <div style={style}>
      <div
        style={{ fontWeight: 700, color: PALETTE.accent, marginBottom: 4 }}
      >
        {tip.name}
      </div>
      <div style={{ color: PALETTE.text }}>{tip.desc}</div>
    </div>
  )
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
  name,
  desc,
  handlers,
}: {
  cx: number
  cy: number
  rx: number
  ry: number
  name: string
  desc: string
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
      onMouseEnter={handlers.onEnter(name, desc)}
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
  tooltipName,
  tooltipDesc,
  handlers,
}: {
  path: string
  variant: ArrowVariant
  arrowId: string
  reverse?: boolean
  thickness?: number
  tooltipName: string
  tooltipDesc: string
  handlers: HoverHandlers
}) {
  const color = arrowColor(variant)
  const isBroken = variant === 'broken'
  const speed =
    variant === 'pulsing' ? 1.2 : variant === 'faded' ? 4.5 : 2.2

  return (
    <g
      onMouseEnter={handlers.onEnter(tooltipName, tooltipDesc)}
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
  // Brain section (left)
  const BRAIN = { x: 20, y: 20, w: 320, h: 420 }
  const hypoCenter = { cx: 180, cy: 340, rx: 42, ry: 24 }

  // Pituitary section (center)
  const PIT = { x: 380, y: 100, w: 240, h: 200 }
  const antLobe = { cx: 475, cy: 210, rx: 32, ry: 22 }
  const postLobe = { cx: 530, cy: 210, rx: 24, ry: 18 }

  // Testis section (right)
  const TES = { x: 660, y: 30, w: 320, h: 420 }
  const tubulesRegion = { cx: 790, cy: 230, rx: 75, ry: 65 }
  const leydigRegion = { cx: 860, cy: 340, rx: 55, ry: 35 }

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
        overflow: 'hidden',
        color: PALETTE.text,
      }}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        {/* — Faint atlas grid + vignette — */}
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
          name="Hypothalamus"
          desc="Releases GnRH in pulsatile fashion to regulate anterior pituitary function."
          handlers={handlers}
        />

        {/* Label */}
        <g pointerEvents="none" fontFamily="system-ui, sans-serif">
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
          path={`M ${hypoCenter.cx + hypoCenter.rx + 4} ${hypoCenter.cy} C ${hypoCenter.cx + 80} ${hypoCenter.cy}, ${antLobe.cx - 60} ${antLobe.cy}, ${antLobe.cx - antLobe.rx - 4} ${antLobe.cy}`}
          variant={gnrhV}
          arrowId="hpg-arrow-gnrh"
          handlers={handlers}
          tooltipName="GnRH"
          tooltipDesc="Gonadotropin-releasing hormone. Pulsatile secretion (~every 90 min) from hypothalamus drives FSH/LH release from anterior pituitary."
          thickness={2.2}
        />
        <HormonePill x={340} y={180} label="GnRH" variant={gnrhV} />

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
          name="Anterior Pituitary"
          desc="Produces FSH and LH in response to GnRH stimulation."
          handlers={handlers}
        />
        <Hotspot
          cx={postLobe.cx}
          cy={postLobe.cy}
          rx={postLobe.rx}
          ry={postLobe.ry}
          name="Posterior Pituitary"
          desc="Stores and releases oxytocin and vasopressin (ADH)."
          handlers={handlers}
        />

        {/* Labels */}
        <g pointerEvents="none" fontFamily="system-ui, sans-serif">
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
          path={`M ${antLobe.cx + antLobe.rx + 4} ${antLobe.cy - 10} C ${antLobe.cx + 80} ${antLobe.cy - 30}, ${tubulesRegion.cx - 90} ${tubulesRegion.cy - 30}, ${tubulesRegion.cx - tubulesRegion.rx - 6} ${tubulesRegion.cy}`}
          variant={fshV}
          arrowId="hpg-arrow-fsh"
          handlers={handlers}
          tooltipName="FSH"
          tooltipDesc="Follicle-stimulating hormone — acts on Sertoli cells to support spermatogenesis. Elevated FSH = Sertoli-cell dysfunction with loss of Inhibin B feedback."
        />
        <HormonePill
          x={620}
          y={150}
          label="FSH"
          value={values.fsh}
          unit="mIU/mL"
          variant={fshV}
        />

        <HormoneArrow
          path={`M ${antLobe.cx + antLobe.rx + 4} ${antLobe.cy + 10} C ${antLobe.cx + 80} ${antLobe.cy + 40}, ${leydigRegion.cx - 90} ${leydigRegion.cy + 10}, ${leydigRegion.cx - leydigRegion.rx - 6} ${leydigRegion.cy}`}
          variant={lhV}
          arrowId="hpg-arrow-lh"
          handlers={handlers}
          tooltipName="LH"
          tooltipDesc="Luteinizing hormone — acts on Leydig cells to stimulate testosterone synthesis. Elevated LH = Leydig-cell dysfunction or testosterone deficiency."
        />
        <HormonePill
          x={620}
          y={320}
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
          name="Seminiferous Tubules"
          desc="Site of spermatogenesis, regulated by FSH and testosterone."
          handlers={handlers}
        />
        <Hotspot
          cx={leydigRegion.cx}
          cy={leydigRegion.cy}
          rx={leydigRegion.rx}
          ry={leydigRegion.ry}
          name="Leydig Cells"
          desc="Produce testosterone in response to LH stimulation."
          handlers={handlers}
        />

        {/* Labels */}
        <g pointerEvents="none" fontFamily="system-ui, sans-serif">
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
          path={`M ${leydigRegion.cx} ${TES.y - 4} C ${leydigRegion.cx} ${-40}, ${hypoCenter.cx} ${-40}, ${hypoCenter.cx} ${BRAIN.y + 4}`}
          variant={tV}
          arrowId="hpg-arrow-t"
          reverse
          thickness={2.2}
          handlers={handlers}
          tooltipName="Testosterone (negative feedback)"
          tooltipDesc="Testosterone produced by Leydig cells feeds back negatively at the hypothalamus (and pituitary), suppressing GnRH/LH. Loss of this feedback elevates LH."
        />
        <HormonePill
          x={500}
          y={470}
          label="T"
          value={values.testosterone}
          unit="ng/mL"
          variant={tV}
        />

        {/* Inhibin B — testis → pituitary (bottom arc feedback) */}
        <HormoneArrow
          path={`M ${tubulesRegion.cx} ${TES.y + TES.h + 4} C ${tubulesRegion.cx} ${VB_H + 30}, ${antLobe.cx} ${VB_H + 30}, ${antLobe.cx} ${PIT.y + PIT.h + 4}`}
          variant={inhibinV}
          arrowId="hpg-arrow-inhibinb"
          reverse
          thickness={2.2}
          handlers={handlers}
          tooltipName="Inhibin B (negative feedback)"
          tooltipDesc="Glycoprotein hormone produced by Sertoli cells. Feeds back negatively on the pituitary, selectively suppressing FSH. Low Inhibin B → elevated FSH = marker of Sertoli-cell failure."
        />
        <HormonePill
          x={620}
          y={470}
          label="Inhibin B"
          value={values.inhibinB}
          unit="pg/mL"
          variant={inhibinV}
        />

        {/* ============================================================
            STATUS LEGEND (top-right)
            ============================================================ */}
        <g transform={`translate(${VB_W - 118} 14)`}>
          <rect
            x={0}
            y={0}
            width={108}
            height={84}
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
            AXIS STATUS
          </text>
          <g fontFamily="system-ui, sans-serif">
            <circle cx={14} cy={30} r={4} fill={PALETTE.normal} />
            <text x={24} y={33} fill={PALETTE.text} fontSize={9}>
              Normal
            </text>
            <circle cx={14} cy={46} r={4} fill={PALETTE.compensating} />
            <text x={24} y={49} fill={PALETTE.text} fontSize={9}>
              Compensating
            </text>
            <circle cx={14} cy={62} r={4} fill={PALETTE.abnormal} />
            <text x={24} y={65} fill={PALETTE.text} fontSize={9}>
              Dysfunctional
            </text>
            <circle cx={14} cy={78} r={4} fill={PALETTE.faded} />
            <text x={24} y={81} fill={PALETTE.text} fontSize={9}>
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
          <g transform={`translate(10 ${VB_H - 130})`}>
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
      </svg>

      <TooltipBox tip={tip} />
    </div>
  )
}
