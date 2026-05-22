'use client'

/**
 * HPGAxis3D — Medical-textbook-quality SVG atlas of the HPG axis
 * --------------------------------------------------------------------------
 * Pure inline SVG (React JSX) rendering of the Hypothalamic-Pituitary-Gonadal
 * axis at the histological detail level expected in an andrology textbook.
 *
 * No external 3D / WebGL libraries — runs entirely in client React, scales
 * cleanly with the surrounding flex container, and is fully SSR-safe.
 *
 * Composition (top → bottom):
 *   1. Sagittal brain silhouette with highlighted hypothalamus + stalk
 *   2. Pituitary gland — anterior + posterior lobes, infundibular stalk
 *   3. Testis cross-section (parenchyma-level):
 *        • tunica albuginea capsule
 *        • multiple seminiferous tubule cross-sections (with Sertoli cells,
 *          spermatogonia / spermatocytes, basement membrane)
 *        • interstitial Leydig-cell clusters
 *        • capillary network in the interstitium
 *        • mediastinum testis + rete testis (right side)
 *
 *   Hormone signalling — pulsing flow arrows:
 *     • GnRH        hypothalamus  ↓ pituitary
 *     • FSH, LH     pituitary     ↓ testis
 *     • Testosterone testis       ↑ hypothalamus  (negative feedback)
 *     • Inhibin B   Sertoli cells ↑ pituitary     (negative feedback)
 *
 *   Pathology visualisation (state-driven):
 *     • high FSH + small testes → atrophic / shrunken tubules, thickened
 *       basement membranes, Sertoli-cell-only pattern
 *     • low T                 → fewer / smaller Leydig clusters
 *     • high LH               → Leydig-cell hyperplasia (more & larger but
 *       red-tinged / dysfunctional)
 *     • normal                → healthy spermatogenesis (multiple germ-cell
 *       layers visible inside each tubule)
 *
 *   Interaction:
 *     • Every anatomical structure has a hover tooltip (white-on-dark) with
 *       name + clinical significance.
 *
 * Public API (must remain stable — clinical-interpretation imports these):
 *     • default export HPGAxis3D({state: AxisState})
 *     • named export   HPGAxis3DLoading
 *     • named export   mergeAxisStates(states: AxisState[]): AxisState
 *     • named type     AxisState
 * --------------------------------------------------------------------------
 */

import { motion } from 'framer-motion'
import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'

// ---------------------------------------------------------------------------
// Public AxisState type — single source of truth (re-imported elsewhere)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// State-merging — field-wise worst-case across multiple conditions
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Palette — 3-state semantic + anatomical tones
// ---------------------------------------------------------------------------

const C = {
  normal: '#22c55e',
  compensating: '#f59e0b',
  abnormal: '#ef4444',
  faded: '#64748b',
  bg: '#0f172a',
  bgPanel: '#0b1220',
  outline: '#94a3b8',
  brainFill: '#1e293b',
  brainStroke: '#cbd5e1',
  hypothalamus: '#fda4af',
  pituitaryAnt: '#fde68a',
  pituitaryPost: '#fbcfe8',
  tunica: '#e2e8f0',
  tunicaInner: '#1e293b',
  tubuleBM: '#94a3b8', // basement membrane
  tubuleLumen: '#0f172a',
  sertoli: '#60a5fa',
  spermatogonia: '#a78bfa',
  leydig: '#fb923c',
  capillary: '#dc2626',
  label: '#f8fafc',
  labelMuted: '#cbd5e1',
} as const

function stateColor(
  s:
    | 'normal'
    | 'compensating'
    | 'faded'
    | 'damaged'
    | 'atrophic'
    | 'sparse'
    | 'unresponsive'
    | 'pulsing'
    | 'suppressed'
    | 'weak'
    | 'broken'
    | 'absent'
): string {
  if (s === 'normal' || s === 'pulsing') return C.normal
  if (s === 'compensating') return C.compensating
  if (s === 'faded') return C.faded
  return C.abnormal
}

// ---------------------------------------------------------------------------
// Tooltip — controlled by parent SVG via shared state
// ---------------------------------------------------------------------------

type Tooltip = { x: number; y: number; name: string; desc: string }

function TooltipBox({ tip }: { tip: Tooltip | null }) {
  if (!tip) return null
  // Place tooltip so it doesn't run off the right/top edges
  const offsetX = 14
  const offsetY = -8
  const style: CSSProperties = {
    position: 'absolute',
    left: tip.x + offsetX,
    top: tip.y + offsetY,
    transform: 'translateY(-100%)',
    pointerEvents: 'none',
    zIndex: 50,
    maxWidth: 260,
    minWidth: 180,
    background: 'rgba(2, 6, 23, 0.96)',
    color: '#ffffff',
    border: '1px solid rgba(148, 163, 184, 0.35)',
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
      <div style={{ fontWeight: 700, color: '#60a5fa', marginBottom: 4 }}>
        {tip.name}
      </div>
      <div style={{ color: '#e2e8f0' }}>{tip.desc}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HoverGroup — convenience wrapper to register hover handlers on an SVG <g>
// ---------------------------------------------------------------------------

type HoverHandlers = {
  onEnter: (name: string, desc: string) => (e: React.MouseEvent) => void
  onLeave: () => void
  onMove: (e: React.MouseEvent) => void
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

// ===========================================================================
// SUB-COMPONENTS (rendered inside the main SVG)
// ===========================================================================

// ---------------------------------------------------------------------------
// Brain sagittal silhouette
// ---------------------------------------------------------------------------

function Brain({
  state,
  handlers,
}: {
  state: AxisState
  handlers: HoverHandlers
}) {
  const isFaded = state.hypothalamus === 'faded'
  const isComp = state.hypothalamus === 'compensating'
  const hColor = stateColor(state.hypothalamus)

  return (
    <g>
      {/* — Brain sagittal silhouette (cerebrum + cerebellum + brainstem) — */}
      <g
        onMouseEnter={handlers.onEnter(
          'Cerebrum (sagittal section)',
          'Mid-sagittal section of the brain shown for anatomical orientation. Hypothalamus sits at the base, just superior to the pituitary stalk.'
        )}
        onMouseLeave={handlers.onLeave}
        onMouseMove={handlers.onMove}
        style={{ cursor: 'help' }}
      >
        {/* Cerebrum — peanut-shaped outline */}
        <path
          d="M 215 60
             C 145 60, 100 105, 100 165
             C 100 200, 115 230, 145 245
             L 165 250
             C 175 252, 188 252, 200 250
             L 240 248
             L 270 250
             L 295 245
             C 320 235, 335 210, 335 180
             C 335 155, 325 130, 305 110
             C 285 85, 255 65, 215 60 Z"
          fill={C.brainFill}
          stroke={C.brainStroke}
          strokeWidth={1.6}
          opacity={isFaded ? 0.5 : 0.95}
        />
        {/* Cortical gyri — subtle curved lines */}
        <g
          fill="none"
          stroke={C.brainStroke}
          strokeWidth={0.8}
          opacity={isFaded ? 0.25 : 0.55}
          strokeLinecap="round"
        >
          <path d="M 130 130 C 150 120, 175 118, 195 132" />
          <path d="M 145 100 C 165 95, 195 92, 215 105" />
          <path d="M 175 80 C 200 75, 235 78, 260 92" />
          <path d="M 230 95 C 255 95, 285 105, 305 130" />
          <path d="M 250 120 C 280 125, 305 145, 315 175" />
          <path d="M 125 175 C 145 175, 165 185, 175 205" />
          <path d="M 195 165 C 220 165, 245 175, 260 195" />
          <path d="M 235 145 C 260 145, 285 158, 300 180" />
        </g>

        {/* Cerebellum — small folded structure (lower right) */}
        <path
          d="M 290 220
             C 305 220, 320 230, 325 248
             C 327 260, 320 270, 308 273
             C 295 275, 280 268, 275 255
             C 273 240, 280 225, 290 220 Z"
          fill={C.brainFill}
          stroke={C.brainStroke}
          strokeWidth={1.4}
          opacity={isFaded ? 0.4 : 0.85}
        />
        <g
          fill="none"
          stroke={C.brainStroke}
          strokeWidth={0.7}
          opacity={isFaded ? 0.25 : 0.5}
        >
          <path d="M 285 230 L 322 232" />
          <path d="M 282 240 L 324 244" />
          <path d="M 281 252 L 322 256" />
          <path d="M 285 264 L 318 268" />
        </g>

        {/* Brainstem stem going down to spinal cord */}
        <path
          d="M 240 250
             L 235 285
             L 245 305
             L 240 320"
          fill="none"
          stroke={C.brainStroke}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={isFaded ? 0.4 : 0.75}
        />
        {/* Corpus callosum — inner C-shape */}
        <path
          d="M 165 140
             C 200 120, 250 120, 285 145"
          fill="none"
          stroke={C.brainStroke}
          strokeWidth={2}
          opacity={isFaded ? 0.25 : 0.5}
          strokeLinecap="round"
        />
      </g>

      {/* — Hypothalamus highlight — */}
      <g
        onMouseEnter={handlers.onEnter(
          'Hypothalamus',
          'Neuroendocrine command center. Releases GnRH in pulsatile fashion (~every 90 min) to drive gonadotroph cells in the anterior pituitary.'
        )}
        onMouseLeave={handlers.onLeave}
        onMouseMove={handlers.onMove}
        style={{ cursor: 'help' }}
      >
        {/* Pulsing halo for compensating state */}
        {isComp && (
          <motion.circle
            cx={222}
            cy={232}
            r={22}
            fill={hColor}
            opacity={0.22}
            animate={{ scale: [1, 1.18, 1], opacity: [0.18, 0.32, 0.18] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {/* Glow ring */}
        <circle cx={222} cy={232} r={16} fill={hColor} opacity={0.18} />
        {/* Solid hypothalamus body */}
        <ellipse
          cx={222}
          cy={232}
          rx={13}
          ry={9}
          fill={C.hypothalamus}
          stroke={hColor}
          strokeWidth={1.8}
          opacity={isFaded ? 0.6 : 1}
        />
        {/* Label leader line + text */}
        <line
          x1={205}
          y1={232}
          x2={70}
          y2={232}
          stroke={C.outline}
          strokeWidth={0.8}
          opacity={0.6}
        />
        <text
          x={68}
          y={228}
          fill={C.label}
          fontSize={11}
          fontWeight={700}
          textAnchor="end"
          fontFamily="system-ui, sans-serif"
        >
          Hypothalamus
        </text>
        <text
          x={68}
          y={242}
          fill={C.labelMuted}
          fontSize={9}
          textAnchor="end"
          fontFamily="system-ui, sans-serif"
        >
          GnRH-secreting neurons
        </text>
      </g>

      {/* Infundibular stalk — connects hypothalamus to pituitary */}
      <g
        onMouseEnter={handlers.onEnter(
          'Infundibular Stalk',
          'Pituitary stalk / hypophyseal portal system. Carries GnRH directly from the hypothalamus to the anterior pituitary, bypassing systemic circulation.'
        )}
        onMouseLeave={handlers.onLeave}
        onMouseMove={handlers.onMove}
        style={{ cursor: 'help' }}
      >
        <path
          d="M 222 245
             C 222 265, 218 285, 215 305"
          fill="none"
          stroke={C.brainStroke}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={isFaded ? 0.35 : 0.7}
        />
        {/* Portal vessels — thin red lines along the stalk */}
        <path
          d="M 219 245 C 218 265, 215 285, 213 305"
          fill="none"
          stroke="#b91c1c"
          strokeWidth={0.9}
          opacity={0.8}
        />
        <path
          d="M 225 245 C 224 265, 222 285, 218 305"
          fill="none"
          stroke="#b91c1c"
          strokeWidth={0.9}
          opacity={0.8}
        />
      </g>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Pituitary — anterior + posterior lobes
// ---------------------------------------------------------------------------

function Pituitary({
  state,
  handlers,
}: {
  state: AxisState
  handlers: HoverHandlers
}) {
  const isFaded = state.pituitary === 'faded'
  const isComp = state.pituitary === 'compensating'
  const pColor = stateColor(state.pituitary)

  // Compensating pituitary is enlarged
  const scale = isComp ? 1.18 : 1.0

  return (
    <g transform={`translate(215 320) scale(${scale}) translate(-215 -320)`}>
      {/* Pulsing halo when compensating */}
      {isComp && (
        <motion.ellipse
          cx={215}
          cy={325}
          rx={42}
          ry={26}
          fill={pColor}
          opacity={0.18}
          animate={{ scale: [1, 1.12, 1], opacity: [0.12, 0.26, 0.12] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Sella turcica outline — bony cradle */}
      <path
        d="M 180 340 L 180 326 Q 215 318, 250 326 L 250 340 Z"
        fill="none"
        stroke={C.outline}
        strokeWidth={0.9}
        opacity={0.45}
        strokeDasharray="2 2"
      />

      {/* Anterior lobe (adenohypophysis) — larger, anterior (left) */}
      <g
        onMouseEnter={handlers.onEnter(
          'Anterior Pituitary',
          'Adenohypophysis. Gonadotroph cells produce FSH (Sertoli stimulation) and LH (Leydig stimulation) in response to GnRH.'
        )}
        onMouseLeave={handlers.onLeave}
        onMouseMove={handlers.onMove}
        style={{ cursor: 'help' }}
      >
        <ellipse
          cx={205}
          cy={326}
          rx={22}
          ry={14}
          fill={C.pituitaryAnt}
          stroke={pColor}
          strokeWidth={1.8}
          opacity={isFaded ? 0.55 : 0.95}
        />
        {/* Cellular detail — small dots representing gonadotrophs */}
        <g fill="#a16207" opacity={isFaded ? 0.3 : 0.6}>
          <circle cx={195} cy={322} r={1.3} />
          <circle cx={201} cy={329} r={1.3} />
          <circle cx={208} cy={324} r={1.3} />
          <circle cx={213} cy={331} r={1.3} />
          <circle cx={219} cy={326} r={1.3} />
          <circle cx={197} cy={332} r={1.3} />
          <circle cx={210} cy={319} r={1.3} />
        </g>
      </g>

      {/* Posterior lobe (neurohypophysis) — smaller, posterior (right) */}
      <g
        onMouseEnter={handlers.onEnter(
          'Posterior Pituitary',
          'Neurohypophysis. Stores oxytocin and ADH (vasopressin). Not directly involved in HPG signalling but shown for anatomical completeness.'
        )}
        onMouseLeave={handlers.onLeave}
        onMouseMove={handlers.onMove}
        style={{ cursor: 'help' }}
      >
        <ellipse
          cx={238}
          cy={328}
          rx={13}
          ry={11}
          fill={C.pituitaryPost}
          stroke={pColor}
          strokeWidth={1.4}
          opacity={isFaded ? 0.5 : 0.85}
        />
      </g>

      {/* Label leader line + text */}
      <line
        x1={252}
        y1={326}
        x2={400}
        y2={326}
        stroke={C.outline}
        strokeWidth={0.8}
        opacity={0.6}
      />
      <text
        x={402}
        y={322}
        fill={C.label}
        fontSize={11}
        fontWeight={700}
        fontFamily="system-ui, sans-serif"
      >
        Pituitary Gland
      </text>
      <text
        x={402}
        y={336}
        fill={C.labelMuted}
        fontSize={9}
        fontFamily="system-ui, sans-serif"
      >
        Anterior • Posterior lobes
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Seminiferous tubule cross-section (single tubule)
// ---------------------------------------------------------------------------

type TubuleProps = {
  cx: number
  cy: number
  r: number
  state: AxisState
  variant?: 'normal' | 'sertoli-only' | 'sparse'
  handlers: HoverHandlers
  rotate?: number
}

function Tubule({
  cx,
  cy,
  r,
  state,
  variant = 'normal',
  handlers,
  rotate = 0,
}: TubuleProps) {
  const isDamaged = state.tubules === 'damaged'
  const isSparse = state.tubules === 'sparse'
  const isAtrophic = state.testis === 'atrophic'
  // Atrophic / damaged → thickened basement membrane
  const bmWidth = isDamaged || isAtrophic ? 3.2 : 1.6
  const bmColor = isDamaged
    ? C.abnormal
    : isAtrophic
      ? C.compensating
      : C.tubuleBM

  // Inner lumen radius (where germ cells sit)
  const innerR = r * 0.78

  // Determine pathology pattern
  const showSpermatogonia =
    variant === 'normal' && !isDamaged && !isSparse && !isAtrophic
  const sertoliCount =
    variant === 'sertoli-only' || isDamaged || isAtrophic
      ? 6
      : isSparse
        ? 4
        : 8
  const sertoliColor = state.sertoli === 'damaged' ? C.abnormal : C.sertoli

  // Sertoli cells (basal, attached to basement membrane)
  const sertoliPositions = useMemo(() => {
    const arr: Array<{ x: number; y: number; r: number }> = []
    for (let i = 0; i < sertoliCount; i++) {
      const a = (i / sertoliCount) * Math.PI * 2
      arr.push({
        x: cx + Math.cos(a) * innerR * 0.92,
        y: cy + Math.sin(a) * innerR * 0.92,
        r: r * 0.085,
      })
    }
    return arr
  }, [cx, cy, innerR, r, sertoliCount])

  // Spermatogonia / spermatocytes layer
  const spermPositions = useMemo(() => {
    if (!showSpermatogonia) return []
    const arr: Array<{ x: number; y: number; r: number }> = []
    const n = 10
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.2
      const radius = innerR * 0.55
      arr.push({
        x: cx + Math.cos(a) * radius,
        y: cy + Math.sin(a) * radius,
        r: r * 0.07,
      })
    }
    // Inner ring — round spermatids
    const n2 = 6
    for (let i = 0; i < n2; i++) {
      const a = (i / n2) * Math.PI * 2 + 0.6
      const radius = innerR * 0.28
      arr.push({
        x: cx + Math.cos(a) * radius,
        y: cy + Math.sin(a) * radius,
        r: r * 0.05,
      })
    }
    return arr
  }, [cx, cy, innerR, r, showSpermatogonia])

  const tooltipName = 'Seminiferous Tubule'
  const tooltipDesc =
    variant === 'sertoli-only' || isDamaged
      ? 'Damaged seminiferous tubule — thickened basement membrane and Sertoli-cell-only pattern (no spermatogenesis).'
      : isAtrophic
        ? 'Atrophic tubule — reduced diameter, thickened basement membrane, depleted germ-cell population.'
        : 'Healthy seminiferous tubule with all stages of spermatogenesis: spermatogonia at the basement membrane, primary/secondary spermatocytes, and round spermatids near the lumen.'

  const pulse = isDamaged || isAtrophic

  return (
    <g
      transform={`rotate(${rotate} ${cx} ${cy})`}
      onMouseEnter={handlers.onEnter(tooltipName, tooltipDesc)}
      onMouseLeave={handlers.onLeave}
      onMouseMove={handlers.onMove}
      style={{ cursor: 'help' }}
    >
      {pulse ? (
        <motion.circle
          cx={cx}
          cy={cy}
          r={r}
          fill={C.tubuleLumen}
          stroke={bmColor}
          strokeWidth={bmWidth}
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={C.tubuleLumen}
          stroke={bmColor}
          strokeWidth={bmWidth}
        />
      )}

      {/* Inner lumen ring (subtle) */}
      <circle
        cx={cx}
        cy={cy}
        r={innerR * 0.32}
        fill="none"
        stroke={C.outline}
        strokeWidth={0.5}
        opacity={0.3}
        strokeDasharray="1.5 2"
      />

      {/* Sertoli cells */}
      {sertoliPositions.map((p, i) => (
        <ellipse
          key={`s${i}`}
          cx={p.x}
          cy={p.y}
          rx={p.r * 1.2}
          ry={p.r * 0.85}
          fill={sertoliColor}
          opacity={isDamaged ? 0.8 : 0.85}
          stroke={sertoliColor}
          strokeWidth={0.4}
        />
      ))}

      {/* Spermatogonia / spermatocytes */}
      {spermPositions.map((p, i) => (
        <circle
          key={`g${i}`}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill={C.spermatogonia}
          opacity={0.85}
        />
      ))}

      {/* If Sertoli-cell-only pattern → render a tiny SCO marker */}
      {(variant === 'sertoli-only' || isDamaged) && (
        <text
          x={cx}
          y={cy + 3}
          fill={C.abnormal}
          fontSize={r * 0.32}
          fontWeight={700}
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
          opacity={0.85}
        >
          SCO
        </text>
      )}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Leydig cell cluster — interstitial endocrine cells
// ---------------------------------------------------------------------------

function LeydigCluster({
  cx,
  cy,
  size,
  state,
  handlers,
}: {
  cx: number
  cy: number
  size: number
  state: AxisState
  handlers: HoverHandlers
}) {
  const isDamaged = state.leydig === 'damaged'
  const isUnresp = state.leydig === 'unresponsive'
  const isTLow = state.testosterone === 'weak' || state.testosterone === 'absent'
  const isLHHigh = state.lh === 'pulsing'

  // Hyperplasia from high LH but dysfunctional → more cells, red tint
  const hyperplasia = isLHHigh && (isDamaged || isUnresp)

  const count = isTLow ? 3 : hyperplasia ? 9 : 6
  const cellR = isTLow ? size * 0.18 : hyperplasia ? size * 0.26 : size * 0.22

  const fill = isDamaged || isUnresp ? C.abnormal : C.leydig
  const opacity = isTLow ? 0.55 : 0.92

  const positions = useMemo(() => {
    const arr: Array<{ x: number; y: number }> = []
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + 0.3
      const radius = size * (0.25 + (i % 2) * 0.18)
      arr.push({
        x: cx + Math.cos(a) * radius,
        y: cy + Math.sin(a) * radius,
      })
    }
    return arr
  }, [cx, cy, count, size])

  const pulse = isDamaged || isUnresp

  return (
    <g
      onMouseEnter={handlers.onEnter(
        'Leydig Cells (interstitial)',
        isTLow
          ? 'Leydig cells reduced in number and size — diminished testosterone synthesis (∼7 mg/day in healthy adults).'
          : hyperplasia
            ? 'Leydig-cell hyperplasia — enlarged and increased in number under high LH drive, but dysfunctional (low T despite high LH).'
            : 'Leydig cells in the interstitial space — primary source of testosterone (∼7 mg/day) in response to LH stimulation.'
      )}
      onMouseLeave={handlers.onLeave}
      onMouseMove={handlers.onMove}
      style={{ cursor: 'help' }}
    >
      {pulse ? (
        <motion.g
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          {positions.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={cellR}
              fill={fill}
              opacity={opacity}
              stroke={fill}
              strokeWidth={0.4}
            />
          ))}
        </motion.g>
      ) : (
        positions.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={cellR}
            fill={fill}
            opacity={opacity}
            stroke={fill}
            strokeWidth={0.4}
          />
        ))
      )}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Capillary — thin red vessel between tubules
// ---------------------------------------------------------------------------

function Capillary({
  d,
  state,
  handlers,
}: {
  d: string
  state: AxisState
  handlers: HoverHandlers
}) {
  const isFaded = state.vessels === 'faded'
  return (
    <path
      d={d}
      fill="none"
      stroke={C.capillary}
      strokeWidth={isFaded ? 0.8 : 1.4}
      opacity={isFaded ? 0.4 : 0.85}
      strokeLinecap="round"
      style={{ cursor: 'help' }}
      onMouseEnter={handlers.onEnter(
        'Capillary',
        'Testicular interstitial capillary. Carries oxygenated blood and delivers LH; transports testosterone away into systemic circulation.'
      )}
      onMouseLeave={handlers.onLeave}
      onMouseMove={handlers.onMove}
    />
  )
}

// ---------------------------------------------------------------------------
// Testis cross-section — the central, detailed view
// ---------------------------------------------------------------------------

function TestisCrossSection({
  state,
  handlers,
}: {
  state: AxisState
  handlers: HoverHandlers
}) {
  const isAtrophic = state.testis === 'atrophic'
  const isDamaged = state.testis === 'damaged'
  const isFaded = state.testis === 'faded'
  const tColor = stateColor(state.testis)

  // Center of the testis cross-section
  const cx = 215
  const cy = 620
  const Rbase = 165
  const scale = isAtrophic ? 0.72 : isDamaged ? 0.9 : 1.0
  const R = Rbase * scale

  // Tubule layout — relative coordinates around the testis center
  // Pattern: pathology determines which subset to render & their detail
  const tubuleVariant = (): 'normal' | 'sertoli-only' | 'sparse' => {
    if (state.tubules === 'damaged' || (isAtrophic && state.sertoli === 'damaged'))
      return 'sertoli-only'
    if (state.tubules === 'sparse') return 'sparse'
    return 'normal'
  }

  // Tubule grid (offsets from center, scaled by R/165 so they shrink with testis)
  const tubuleLayout: Array<{ dx: number; dy: number; r: number }> = [
    { dx: -82, dy: -62, r: 32 },
    { dx: -10, dy: -78, r: 30 },
    { dx: 62, dy: -60, r: 30 },
    { dx: -98, dy: 8, r: 32 },
    { dx: -22, dy: -8, r: 30 },
    { dx: 50, dy: 6, r: 30 },
    { dx: 100, dy: 16, r: 26 },
    { dx: -70, dy: 70, r: 30 },
    { dx: 8, dy: 70, r: 30 },
    { dx: 70, dy: 75, r: 28 },
  ]
  const tubuleCount =
    state.tubules === 'sparse' || isAtrophic ? 6 : tubuleLayout.length

  return (
    <g>
      {/* — Tunica vaginalis (subtle outer ring) — */}
      <circle
        cx={cx}
        cy={cy}
        r={R + 14}
        fill="none"
        stroke={C.outline}
        strokeWidth={0.6}
        opacity={0.3}
        strokeDasharray="3 3"
      />

      {/* — Tunica albuginea (dense fibrous capsule) — */}
      <g
        onMouseEnter={handlers.onEnter(
          'Tunica Albuginea',
          'Dense white fibrous capsule (0.5–1 mm thick) surrounding the testicular parenchyma. Maintains intratesticular pressure and provides structural support.'
        )}
        onMouseLeave={handlers.onLeave}
        onMouseMove={handlers.onMove}
        style={{ cursor: 'help' }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={R + 4}
          fill="#f8fafc"
          stroke={tColor}
          strokeWidth={3}
          opacity={isFaded ? 0.4 : 0.9}
        />
        {/* Subtle inner shadow ring */}
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill={C.tunicaInner}
          stroke="#475569"
          strokeWidth={1}
          opacity={isFaded ? 0.45 : 1}
        />
      </g>

      {/* — Parenchyma background — slight pink interstitium tint — */}
      <circle
        cx={cx}
        cy={cy}
        r={R - 2}
        fill="#3f1d2a"
        opacity={isFaded ? 0.18 : 0.35}
      />

      {/* — Interstitial capillary network — */}
      <g opacity={isFaded ? 0.4 : 0.9}>
        <Capillary
          d={`M ${cx - 130} ${cy - 30} C ${cx - 90} ${cy - 80}, ${cx - 30} ${cy - 50}, ${cx + 30} ${cy - 80}`}
          state={state}
          handlers={handlers}
        />
        <Capillary
          d={`M ${cx - 110} ${cy + 40} C ${cx - 50} ${cy + 20}, ${cx + 20} ${cy + 50}, ${cx + 80} ${cy + 30}`}
          state={state}
          handlers={handlers}
        />
        <Capillary
          d={`M ${cx + 10} ${cy + 100} C ${cx + 50} ${cy + 80}, ${cx + 80} ${cy + 60}, ${cx + 120} ${cy + 90}`}
          state={state}
          handlers={handlers}
        />
        <Capillary
          d={`M ${cx - 90} ${cy - 90} C ${cx - 70} ${cy - 60}, ${cx - 80} ${cy - 20}, ${cx - 100} ${cy + 20}`}
          state={state}
          handlers={handlers}
        />
      </g>

      {/* — Seminiferous tubules — */}
      <g>
        {tubuleLayout.slice(0, tubuleCount).map((t, i) => {
          const tx = cx + t.dx * scale
          const ty = cy + t.dy * scale
          const tr = t.r * scale
          // Skip if tubule center falls outside the parenchyma circle
          const distFromCenter = Math.hypot(tx - cx, ty - cy)
          if (distFromCenter + tr > R - 6) return null
          return (
            <Tubule
              key={i}
              cx={tx}
              cy={ty}
              r={tr}
              state={state}
              variant={tubuleVariant()}
              handlers={handlers}
              rotate={(i * 37) % 60}
            />
          )
        })}
      </g>

      {/* — Leydig cell clusters (interstitial space, between tubules) — */}
      <g opacity={isFaded ? 0.4 : 1}>
        <LeydigCluster
          cx={cx - 50}
          cy={cy - 36}
          size={26}
          state={state}
          handlers={handlers}
        />
        <LeydigCluster
          cx={cx + 28}
          cy={cy - 36}
          size={24}
          state={state}
          handlers={handlers}
        />
        <LeydigCluster
          cx={cx - 50}
          cy={cy + 40}
          size={24}
          state={state}
          handlers={handlers}
        />
        <LeydigCluster
          cx={cx + 30}
          cy={cy + 40}
          size={26}
          state={state}
          handlers={handlers}
        />
      </g>

      {/* — Mediastinum testis + rete testis on the right — */}
      <g
        onMouseEnter={handlers.onEnter(
          'Mediastinum / Rete Testis',
          'Mediastinum testis — fibrous structure on the posterior surface containing the rete testis, an anastomosing network of tubules collecting sperm from the seminiferous tubules.'
        )}
        onMouseLeave={handlers.onLeave}
        onMouseMove={handlers.onMove}
        style={{ cursor: 'help' }}
      >
        <path
          d={`M ${cx + R - 4} ${cy - 30}
              Q ${cx + R - 22} ${cy}, ${cx + R - 4} ${cy + 30}`}
          fill="#cbd5e1"
          opacity={0.35}
          stroke={C.outline}
          strokeWidth={0.8}
        />
        {/* Rete tubule network */}
        <g
          fill="none"
          stroke="#94a3b8"
          strokeWidth={0.9}
          opacity={0.7}
        >
          <path d={`M ${cx + R - 18} ${cy - 18} Q ${cx + R - 12} ${cy - 12}, ${cx + R - 6} ${cy - 18}`} />
          <path d={`M ${cx + R - 20} ${cy - 8} Q ${cx + R - 13} ${cy - 2}, ${cx + R - 6} ${cy - 8}`} />
          <path d={`M ${cx + R - 20} ${cy + 4} Q ${cx + R - 13} ${cy + 10}, ${cx + R - 6} ${cy + 4}`} />
          <path d={`M ${cx + R - 18} ${cy + 16} Q ${cx + R - 12} ${cy + 22}, ${cx + R - 6} ${cy + 16}`} />
        </g>
      </g>

      {/* — Labels (leader lines pointing into the testis) — */}
      <g fontFamily="system-ui, sans-serif">
        {/* Tunica albuginea */}
        <line
          x1={cx + R - 3}
          y1={cy - R + 60}
          x2={cx + R + 60}
          y2={cy - R + 40}
          stroke={C.outline}
          strokeWidth={0.8}
          opacity={0.6}
        />
        <text
          x={cx + R + 62}
          y={cy - R + 38}
          fill={C.label}
          fontSize={10.5}
          fontWeight={700}
        >
          Tunica albuginea
        </text>

        {/* Seminiferous tubule */}
        <line
          x1={cx - 22}
          y1={cy - 38}
          x2={cx - R - 60}
          y2={cy - R + 20}
          stroke={C.outline}
          strokeWidth={0.8}
          opacity={0.6}
        />
        <text
          x={cx - R - 62}
          y={cy - R + 18}
          fill={C.label}
          fontSize={10.5}
          fontWeight={700}
          textAnchor="end"
        >
          Seminiferous tubule
        </text>
        <text
          x={cx - R - 62}
          y={cy - R + 30}
          fill={C.labelMuted}
          fontSize={9}
          textAnchor="end"
        >
          (Sertoli + germ cells)
        </text>

        {/* Leydig cells */}
        <line
          x1={cx - 50}
          y1={cy + 40}
          x2={cx - R - 60}
          y2={cy + R - 10}
          stroke={C.outline}
          strokeWidth={0.8}
          opacity={0.6}
        />
        <text
          x={cx - R - 62}
          y={cy + R - 12}
          fill={C.label}
          fontSize={10.5}
          fontWeight={700}
          textAnchor="end"
        >
          Leydig cells
        </text>
        <text
          x={cx - R - 62}
          y={cy + R}
          fill={C.labelMuted}
          fontSize={9}
          textAnchor="end"
        >
          (interstitial endocrine)
        </text>

        {/* Rete testis */}
        <line
          x1={cx + R - 10}
          y1={cy}
          x2={cx + R + 60}
          y2={cy + 20}
          stroke={C.outline}
          strokeWidth={0.8}
          opacity={0.6}
        />
        <text
          x={cx + R + 62}
          y={cy + 18}
          fill={C.label}
          fontSize={10.5}
          fontWeight={700}
        >
          Rete testis
        </text>
      </g>

      {/* — Title under the testis — */}
      <text
        x={cx}
        y={cy + R + 30}
        textAnchor="middle"
        fill={C.label}
        fontSize={12}
        fontWeight={700}
        fontFamily="system-ui, sans-serif"
      >
        Testis — Cross-Section (Histological View)
      </text>
      <text
        x={cx}
        y={cy + R + 46}
        textAnchor="middle"
        fill={C.labelMuted}
        fontSize={10}
        fontFamily="system-ui, sans-serif"
      >
        {isAtrophic
          ? 'Atrophic parenchyma — reduced volume, thickened basement membranes'
          : isDamaged
            ? 'Damaged parenchyma — disrupted spermatogenesis'
            : 'Healthy parenchyma — full-thickness spermatogenesis'}
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Animated hormone flow arrow — pulsing dashed line + arrowhead
// ---------------------------------------------------------------------------

function HormoneArrow({
  path,
  state,
  arrowId,
  reverse = false,
  thickness = 2.4,
  handlers,
  tooltipName,
  tooltipDesc,
}: {
  path: string
  state:
    | 'normal'
    | 'pulsing'
    | 'faded'
    | 'suppressed'
    | 'weak'
    | 'broken'
    | 'absent'
  arrowId: string
  reverse?: boolean
  thickness?: number
  handlers: HoverHandlers
  tooltipName: string
  tooltipDesc: string
}) {
  const color = stateColor(state)
  const isBroken = state === 'broken' || state === 'absent'
  const isWeak = state === 'weak' || state === 'faded' || state === 'suppressed'

  const speed = isBroken ? 0 : isWeak ? 4.5 : 1.8

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
        opacity={isBroken ? 0.15 : 0.3}
      />
      {/* Animated dashed line (only when not broken) */}
      {!isBroken && (
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray="9 8"
          markerEnd={`url(#${arrowId})`}
          animate={{ strokeDashoffset: reverse ? [0, 17] : [17, 0] }}
          transition={{
            duration: speed,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
      {/* Broken / absent arrow → red X marker at midpoint */}
      {isBroken && (
        <g>
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray="3 6"
            opacity={0.45}
          />
        </g>
      )}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Hormone label pill — name + value
// ---------------------------------------------------------------------------

function HormonePill({
  x,
  y,
  label,
  value,
  unit,
  state,
}: {
  x: number
  y: number
  label: string
  value?: number
  unit?: string
  state:
    | 'normal'
    | 'pulsing'
    | 'faded'
    | 'suppressed'
    | 'weak'
    | 'broken'
    | 'absent'
}) {
  const color = stateColor(state)
  const formatted =
    typeof value === 'number' && Number.isFinite(value)
      ? `${value.toFixed(value >= 10 ? 0 : 1)}${unit ? ` ${unit}` : ''}`
      : null
  const width = formatted ? 92 : 56
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

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background:
          'radial-gradient(circle at 50% 30%, #0f172a 0%, #020617 100%)',
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox="0 0 800 900"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        {/* Faint background grid for the "atlas" feel */}
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
        <rect x="0" y="0" width="800" height="900" fill="url(#atlas-grid)" />
        <rect x="0" y="0" width="800" height="900" fill="url(#vignette)" />

        {/* — Top brain section — */}
        <Brain state={state} handlers={handlers} />

        {/* — Pituitary section — */}
        <Pituitary state={state} handlers={handlers} />

        {/* — GnRH arrow: hypothalamus → pituitary — */}
        <HormoneArrow
          path="M 222 250 C 222 270, 222 290, 215 310"
          state={state.gnrh}
          arrowId="arrow-gnrh"
          handlers={handlers}
          tooltipName="GnRH"
          tooltipDesc="Gonadotropin-releasing hormone. Pulsatile secretion (~every 90 min) from hypothalamus drives FSH/LH release from anterior pituitary."
          thickness={2}
        />
        <HormonePill
          x={280}
          y={278}
          label="GnRH"
          state={state.gnrh}
        />

        {/* — FSH arrow: pituitary → testis (left curve) — */}
        <HormoneArrow
          path="M 200 340 C 130 400, 100 480, 130 550"
          state={state.fsh}
          arrowId="arrow-fsh"
          handlers={handlers}
          tooltipName="FSH"
          tooltipDesc="Follicle-stimulating hormone. Acts on Sertoli cells to support spermatogenesis. Elevated FSH indicates Sertoli-cell dysfunction with loss of Inhibin B feedback."
        />
        <HormonePill
          x={110}
          y={440}
          label="FSH"
          value={values.fsh}
          unit="mIU/mL"
          state={state.fsh}
        />

        {/* — LH arrow: pituitary → testis (right curve) — */}
        <HormoneArrow
          path="M 232 340 C 300 400, 330 480, 300 550"
          state={state.lh}
          arrowId="arrow-lh"
          handlers={handlers}
          tooltipName="LH"
          tooltipDesc="Luteinizing hormone. Acts on Leydig cells to stimulate testosterone synthesis. Elevated LH indicates Leydig-cell dysfunction or testosterone deficiency."
        />
        <HormonePill
          x={325}
          y={440}
          label="LH"
          value={values.lh}
          unit="mIU/mL"
          state={state.lh}
        />

        {/* — Testis cross-section — */}
        <TestisCrossSection state={state} handlers={handlers} />

        {/* — Testosterone feedback: testis → hypothalamus (wide left arc) — */}
        <HormoneArrow
          path="M 80 600 C 30 500, 20 350, 60 230 C 90 200, 140 210, 170 218"
          state={state.testosterone}
          arrowId="arrow-t"
          handlers={handlers}
          tooltipName="Testosterone (negative feedback)"
          tooltipDesc="Testosterone produced by Leydig cells feeds back negatively at the hypothalamus (and pituitary), suppressing GnRH/LH. Loss of this feedback elevates LH."
          thickness={2.2}
        />
        <HormonePill
          x={50}
          y={420}
          label="T"
          value={values.testosterone}
          unit="ng/mL"
          state={state.testosterone}
        />

        {/* — Inhibin B feedback: Sertoli → pituitary (wide right arc) — */}
        <HormoneArrow
          path="M 360 600 C 420 520, 430 420, 380 360 C 340 330, 290 330, 260 332"
          state={state.inhibinB}
          arrowId="arrow-inhibinb"
          handlers={handlers}
          tooltipName="Inhibin B (negative feedback)"
          tooltipDesc="Glycoprotein hormone produced by Sertoli cells. Feeds back negatively on the pituitary, selectively suppressing FSH. Low Inhibin B → elevated FSH → marker of Sertoli-cell failure."
          thickness={2.2}
        />
        <HormonePill
          x={420}
          y={480}
          label="Inhibin B"
          value={values.inhibinB}
          unit="pg/mL"
          state={state.inhibinB}
        />

        {/* — Side legend (status) — */}
        <g transform="translate(620 60)">
          <rect
            x={0}
            y={0}
            width={160}
            height={108}
            rx={8}
            ry={8}
            fill="rgba(2, 6, 23, 0.7)"
            stroke="#334155"
            strokeWidth={1}
          />
          <text
            x={10}
            y={18}
            fill="#f8fafc"
            fontSize={10}
            fontWeight={700}
            letterSpacing={0.5}
            fontFamily="system-ui, sans-serif"
          >
            AXIS STATUS
          </text>
          <g fontFamily="system-ui, sans-serif">
            <circle cx={16} cy={36} r={5} fill={C.normal} />
            <text x={28} y={40} fill="#e2e8f0" fontSize={10}>
              Normal
            </text>
            <circle cx={16} cy={56} r={5} fill={C.compensating} />
            <text x={28} y={60} fill="#e2e8f0" fontSize={10}>
              Compensating
            </text>
            <circle cx={16} cy={76} r={5} fill={C.abnormal} />
            <text x={28} y={80} fill="#e2e8f0" fontSize={10}>
              Dysfunctional
            </text>
            <circle cx={16} cy={96} r={5} fill={C.faded} />
            <text x={28} y={100} fill="#e2e8f0" fontSize={10}>
              Suppressed
            </text>
          </g>
        </g>

        {/* — Patient summary panel (if values present) — */}
        {(values.fsh !== undefined ||
          values.lh !== undefined ||
          values.testosterone !== undefined ||
          values.testisVolume !== undefined) && (
          <g transform="translate(620 190)">
            <rect
              x={0}
              y={0}
              width={160}
              height={110}
              rx={8}
              ry={8}
              fill="rgba(2, 6, 23, 0.7)"
              stroke="#334155"
              strokeWidth={1}
            />
            <text
              x={10}
              y={18}
              fill="#f8fafc"
              fontSize={10}
              fontWeight={700}
              letterSpacing={0.5}
              fontFamily="system-ui, sans-serif"
            >
              PATIENT VALUES
            </text>
            <g
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fontSize={10}
              fill="#e2e8f0"
            >
              {values.fsh !== undefined && (
                <text x={10} y={38}>
                  FSH       <tspan fill={stateColor(state.fsh)} fontWeight={700}>{values.fsh.toFixed(1)}</tspan> mIU/mL
                </text>
              )}
              {values.lh !== undefined && (
                <text x={10} y={56}>
                  LH        <tspan fill={stateColor(state.lh)} fontWeight={700}>{values.lh.toFixed(1)}</tspan> mIU/mL
                </text>
              )}
              {values.testosterone !== undefined && (
                <text x={10} y={74}>
                  T          <tspan fill={stateColor(state.testosterone)} fontWeight={700}>{values.testosterone.toFixed(2)}</tspan> ng/mL
                </text>
              )}
              {values.testisVolume !== undefined && (
                <text x={10} y={92}>
                  TV       <tspan fill={stateColor(state.testis)} fontWeight={700}>{values.testisVolume.toFixed(1)}</tspan> mL
                </text>
              )}
              {values.estradiol !== undefined && (
                <text x={10} y={106}>
                  E2       <tspan fontWeight={700}>{values.estradiol.toFixed(0)}</tspan> pg/mL
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
