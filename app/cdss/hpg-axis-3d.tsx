'use client'

/**
 * HPGAxis3D
 * --------------------------------------------------------------------------
 * Anatomically realistic, interactive 3D visualization of the
 * Hypothalamic-Pituitary-Gonadal (HPG) axis, built with React Three Fiber.
 *
 * Designed as a drop-in replacement for the previous SVG diagram
 * (`HpgAxisSvg`) used in `cdss-clinical-interpretation.tsx`.  Receives the
 * exact same `AxisState` prop shape and uses it to color each anatomical
 * structure and hormone particle stream using the project's 3-state
 * semantic palette (green = normal, amber = compensating, red = abnormal).
 *
 * Scene contents
 *   - Brain cross-section (top, y ≈ +3 to +5)
 *       • Hypothalamus       (semi-transparent flattened ellipsoid)
 *       • Anterior Pituitary (smaller bean-shaped gland just below)
 *       • Hypophyseal portal vessels (tube along a CatmullRomCurve3)
 *   - Testis cross-section (bottom, y ≈ -3 to -5)
 *       • Tunica albuginea   (semi-transparent ellipsoid shell)
 *       • Seminiferous tubules (instanced ring of tori, cross-sectional)
 *       • Sertoli cells      (instanced small spheres on tubule walls)
 *       • Leydig cells       (small clusters in interstitial space)
 *       • Rete testis        (mediastinal network on one side)
 *       • Epididymis         (coiled tube attached to the testis)
 *   - Animated hormone particle flows along CatmullRomCurve3 paths:
 *       • GnRH         hypothalamus → pituitary
 *       • FSH          pituitary    → testis (left)
 *       • LH           pituitary    → testis (right)
 *       • Testosterone testis       → hypothalamus (long ascending loop)
 *       • Inhibin B    testis       → pituitary (long ascending loop)
 *
 * This file is meant to be imported via `next/dynamic` with `{ ssr: false }`
 * because Three.js cannot render in the Next.js SSR environment.
 *
 * The clinical logic (detectConditions, THRESHOLDS, narrative, etc.) lives
 * in the parent file and is preserved verbatim — this module only renders
 * the diagram given an `AxisState`.
 * --------------------------------------------------------------------------
 */

import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'

// ---------------------------------------------------------------------------
// Type — mirrors the AxisState declared in cdss-clinical-interpretation.tsx
// ---------------------------------------------------------------------------

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
}

// ---------------------------------------------------------------------------
// Color palette — must match the 3-state semantic system used elsewhere
// ---------------------------------------------------------------------------

const PALETTE = {
  normal: '#22c55e', // green-500
  compensating: '#f59e0b', // amber-500
  abnormal: '#ef4444', // red-500
  faded: '#64748b', // slate-500 — desaturated outline
  // Anatomical interior tints
  hypothalamusBody: '#fda4af', // rose-300
  pituitaryBody: '#e2e8f0', // slate-200
  testisBody: '#1e293b', // slate-800
  tunicaTint: '#cbd5e1', // slate-300 tunica albuginea
  sertoli: '#3b82f6', // blue-500
  leydig: '#fb923c', // orange-400
  rete: '#94a3b8', // slate-400
  epididymis: '#fcd34d', // amber-300 coiled tube
  vesselWall: '#7f1d1d', // dark red — venous tinge
} as const

/**
 * Map a structure-level AxisState field to a semantic color.
 * Any "damaged"/"atrophic"/"broken"/"absent"/"unresponsive"/"sparse"
 * state collapses to abnormal red.
 */
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
  if (s === 'normal' || s === 'pulsing') return PALETTE.normal
  if (s === 'compensating') return PALETTE.compensating
  if (s === 'faded') return PALETTE.faded
  // Everything else (damaged, atrophic, sparse, unresponsive, suppressed,
  // weak, broken, absent) renders as the abnormal red.
  return PALETTE.abnormal
}

// ---------------------------------------------------------------------------
// Scene constants — coordinates for the major anatomical landmarks
// ---------------------------------------------------------------------------

const HYPOTHALAMUS_POS = new THREE.Vector3(0, 4.2, 0)
const PITUITARY_POS = new THREE.Vector3(0, 2.9, 0)
const TESTIS_POS = new THREE.Vector3(0, -3.8, 0)
const EPIDIDYMIS_BASE = new THREE.Vector3(1.7, -3.4, 0)

// ---------------------------------------------------------------------------
// Hover tooltip helper — reusable Html overlay shown on pointer-over
// ---------------------------------------------------------------------------

function Tooltip({
  visible,
  title,
  description,
  offsetY = 0.5,
}: {
  visible: boolean
  title: string
  description: string
  offsetY?: number
}) {
  if (!visible) return null
  return (
    <Html
      position={[0, offsetY, 0]}
      center
      distanceFactor={10}
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(148, 163, 184, 0.35)',
          borderRadius: 6,
          color: '#f8fafc',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          fontSize: 11,
          lineHeight: 1.35,
          padding: '6px 8px',
          maxWidth: 220,
          boxShadow: '0 6px 14px rgba(0,0,0,0.35)',
          whiteSpace: 'normal',
          textAlign: 'left',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 2, color: '#fef9c3' }}>
          {title}
        </div>
        <div style={{ opacity: 0.85 }}>{description}</div>
      </div>
    </Html>
  )
}

// ---------------------------------------------------------------------------
// 3D label — small white text floating beside a structure
// ---------------------------------------------------------------------------

function Label({
  position,
  children,
  size = 0.22,
  color = '#ffffff',
}: {
  position: [number, number, number]
  children: string
  size?: number
  color?: string
}) {
  return (
    <Text
      position={position}
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.015}
      outlineColor="#000000"
      depthOffset={-1}
    >
      {children}
    </Text>
  )
}

// ---------------------------------------------------------------------------
// Hypothalamus — flattened ellipsoid representing the hypothalamic region
// ---------------------------------------------------------------------------

function Hypothalamus({ state }: { state: AxisState['hypothalamus'] }) {
  const [hover, setHover] = useState(false)
  const color = stateColor(state)
  return (
    <group position={HYPOTHALAMUS_POS.toArray()}>
      {/* Outer glow shell — semi-transparent halo in state color */}
      <mesh
        scale={[1.6, 0.9, 1.1]}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHover(false)
        }}
      >
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={state === 'faded' ? 0.05 : 0.35}
          transparent
          opacity={state === 'faded' ? 0.25 : 0.45}
          roughness={0.55}
          metalness={0.05}
        />
      </mesh>
      {/* Anatomical inner body — soft rose to suggest neural tissue */}
      <mesh scale={[1.2, 0.7, 0.9]}>
        <sphereGeometry args={[1, 24, 18]} />
        <meshStandardMaterial
          color={PALETTE.hypothalamusBody}
          emissive={PALETTE.hypothalamusBody}
          emissiveIntensity={0.08}
          transparent
          opacity={0.55}
          roughness={0.75}
        />
      </mesh>
      <Label position={[-2.4, 0.15, 0]} size={0.26}>
        Hypothalamus
      </Label>
      <Tooltip
        visible={hover}
        title="Hypothalamus"
        description="Releases GnRH in pulsatile bursts that drive anterior pituitary FSH/LH secretion. Apex of the HPG axis."
        offsetY={1.1}
      />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Anterior Pituitary — smaller bean-shaped gland just below hypothalamus
// ---------------------------------------------------------------------------

function Pituitary({ state }: { state: AxisState['pituitary'] }) {
  const [hover, setHover] = useState(false)
  const color = stateColor(state)
  return (
    <group position={PITUITARY_POS.toArray()}>
      <mesh
        scale={[0.65, 0.5, 0.55]}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHover(false)
        }}
      >
        <sphereGeometry args={[1, 28, 22]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={state === 'faded' ? 0.05 : 0.4}
          transparent
          opacity={state === 'faded' ? 0.3 : 0.55}
          roughness={0.5}
          metalness={0.05}
        />
      </mesh>
      {/* Inner gland body */}
      <mesh scale={[0.48, 0.38, 0.42]}>
        <sphereGeometry args={[1, 20, 16]} />
        <meshStandardMaterial
          color={PALETTE.pituitaryBody}
          emissive={PALETTE.pituitaryBody}
          emissiveIntensity={0.08}
          transparent
          opacity={0.7}
          roughness={0.7}
        />
      </mesh>
      <Label position={[2.0, 0.0, 0]} size={0.22}>
        Anterior Pituitary
      </Label>
      <Tooltip
        visible={hover}
        title="Anterior Pituitary"
        description="Secretes FSH and LH in response to hypothalamic GnRH pulses. Gonadotropes are the primary cell type."
        offsetY={0.8}
      />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Hypophyseal portal vessels — curved tube connecting hypothalamus → pituitary
// ---------------------------------------------------------------------------

function PortalVessels({ state }: { state: AxisState['vessels'] }) {
  const [hover, setHover] = useState(false)
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 3.6, 0.05),
        new THREE.Vector3(-0.08, 3.4, 0.12),
        new THREE.Vector3(0.08, 3.2, 0.05),
        new THREE.Vector3(0, 3.0, 0.0),
      ]),
    []
  )
  const tubeGeom = useMemo(
    () => new THREE.TubeGeometry(curve, 32, 0.06, 12, false),
    [curve]
  )
  const dim = state === 'faded'
  return (
    <group>
      <mesh
        geometry={tubeGeom}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHover(false)
        }}
      >
        <meshStandardMaterial
          color={PALETTE.vesselWall}
          emissive={dim ? '#3b0f0f' : '#7f1d1d'}
          emissiveIntensity={dim ? 0.05 : 0.3}
          roughness={0.4}
          transparent
          opacity={dim ? 0.35 : 0.85}
        />
      </mesh>
      <group position={[0, 3.3, 0]}>
        <Tooltip
          visible={hover}
          title="Hypophyseal Portal Vessels"
          description="Specialized capillary network carrying releasing hormones (incl. GnRH) from median eminence to anterior pituitary."
          offsetY={0.4}
        />
      </group>
      <Label position={[-1.4, 3.3, 0]} size={0.16}>
        Portal Vessels
      </Label>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Tunica Albuginea — outer ellipsoid shell of the testis
// ---------------------------------------------------------------------------

function TunicaAlbuginea({ state }: { state: AxisState['testis'] }) {
  const [hover, setHover] = useState(false)
  const color = stateColor(state)
  // Atrophy → slightly smaller shell
  const atrophyScale = state === 'atrophic' || state === 'damaged' ? 0.85 : 1.0
  return (
    <group position={TESTIS_POS.toArray()}>
      <mesh
        scale={[1.55 * atrophyScale, 1.15 * atrophyScale, 1.15 * atrophyScale]}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHover(false)
        }}
      >
        <sphereGeometry args={[1, 40, 28]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={state === 'faded' ? 0.05 : 0.2}
          transparent
          opacity={state === 'faded' ? 0.18 : 0.28}
          roughness={0.55}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner parenchymal tint */}
      <mesh
        scale={[
          1.45 * atrophyScale,
          1.05 * atrophyScale,
          1.05 * atrophyScale,
        ]}
      >
        <sphereGeometry args={[1, 32, 22]} />
        <meshStandardMaterial
          color={PALETTE.testisBody}
          emissive="#1f2937"
          emissiveIntensity={0.1}
          transparent
          opacity={0.6}
          roughness={0.85}
        />
      </mesh>
      <Label position={[0, 1.55 * atrophyScale, 0]} size={0.28}>
        Testis (Tunica Albuginea)
      </Label>
      <Tooltip
        visible={hover}
        title="Tunica Albuginea"
        description="Dense fibrous capsule enclosing the testicular parenchyma. Sends septa inward dividing the testis into lobules."
        offsetY={1.6 * atrophyScale}
      />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Seminiferous Tubules — instanced ring of tori (cross-sectional view)
// ---------------------------------------------------------------------------

function SeminiferousTubules({
  tubules,
  sertoli,
}: {
  tubules: AxisState['tubules']
  sertoli: AxisState['sertoli']
}) {
  const [hover, setHover] = useState<number | null>(null)
  const color = stateColor(tubules)
  const sparse = tubules === 'sparse'
  const count = sparse ? 7 : 12
  // Pre-compute tubule center positions inside the testis ellipsoid
  const tubulePositions = useMemo(() => {
    const arr: Array<{
      pos: [number, number, number]
      rot: [number, number, number]
      r: number
    }> = []
    // Outer ring
    const outer = sparse ? 5 : 8
    for (let i = 0; i < outer; i++) {
      const ang = (i / outer) * Math.PI * 2
      arr.push({
        pos: [Math.cos(ang) * 0.85, Math.sin(ang) * 0.55, 0],
        rot: [Math.PI / 2, 0, ang],
        r: 0.22,
      })
    }
    // Inner ring
    const inner = sparse ? 2 : 4
    for (let i = 0; i < inner; i++) {
      const ang = (i / inner) * Math.PI * 2 + Math.PI / inner
      arr.push({
        pos: [Math.cos(ang) * 0.42, Math.sin(ang) * 0.28, 0],
        rot: [Math.PI / 2, 0, ang],
        r: 0.18,
      })
    }
    return arr.slice(0, count)
  }, [count, sparse])

  const sertoliColor = sertoli === 'damaged' ? PALETTE.abnormal : PALETTE.sertoli

  return (
    <group position={TESTIS_POS.toArray()}>
      {tubulePositions.map((t, i) => (
        <group key={i} position={t.pos} rotation={t.rot}>
          {/* Tubule cross-section (torus = circular cross-section) */}
          <mesh
            onPointerOver={(e) => {
              e.stopPropagation()
              setHover(i)
            }}
            onPointerOut={(e) => {
              e.stopPropagation()
              setHover((cur) => (cur === i ? null : cur))
            }}
          >
            <torusGeometry args={[t.r, t.r * 0.28, 14, 28]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.25}
              roughness={0.55}
            />
          </mesh>
          {/* Sertoli cells — small spheres around the tubule wall */}
          {[0, 1, 2, 3, 4, 5].map((k) => {
            const a = (k / 6) * Math.PI * 2
            return (
              <mesh
                key={k}
                position={[Math.cos(a) * t.r, Math.sin(a) * t.r, 0]}
              >
                <sphereGeometry args={[t.r * 0.18, 10, 8]} />
                <meshStandardMaterial
                  color={sertoliColor}
                  emissive={sertoliColor}
                  emissiveIntensity={0.4}
                />
              </mesh>
            )
          })}
          {hover === i && (
            <Tooltip
              visible
              title="Seminiferous Tubule"
              description="Site of spermatogenesis. Lined by Sertoli cells (blue) that support germ-cell maturation."
              offsetY={0.5}
            />
          )}
        </group>
      ))}
      <Label position={[0, -1.45, 0]} size={0.18}>
        Seminiferous Tubules
      </Label>
      <Label position={[1.6, 0.0, 0]} size={0.16} color="#93c5fd">
        Sertoli Cells
      </Label>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Leydig Cells — small clusters in the interstitial space between tubules
// ---------------------------------------------------------------------------

function LeydigCells({ state }: { state: AxisState['leydig'] }) {
  const [hover, setHover] = useState(false)
  // Leydig dysfunction renders them in red, else orange
  const color =
    state === 'damaged' || state === 'unresponsive'
      ? PALETTE.abnormal
      : PALETTE.leydig
  // Pseudo-random but stable interstitial positions
  const positions = useMemo<Array<[number, number, number]>>(
    () => [
      [0.55, 0.05, 0.45],
      [-0.55, -0.1, 0.45],
      [0.0, 0.55, 0.4],
      [-0.3, -0.55, 0.4],
      [0.4, -0.45, -0.4],
      [-0.5, 0.4, -0.4],
      [0.65, 0.3, -0.35],
      [-0.65, -0.25, -0.35],
      [0.1, -0.65, 0.0],
    ],
    []
  )

  return (
    <group position={TESTIS_POS.toArray()}>
      {positions.map((p, i) => (
        <mesh
          key={i}
          position={p}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHover(true)
          }}
          onPointerOut={(e) => {
            e.stopPropagation()
            setHover(false)
          }}
        >
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
      <Label position={[-1.7, -0.6, 0]} size={0.16} color="#fdba74">
        Leydig Cells
      </Label>
      {hover && (
        <group position={[0, 0.8, 0]}>
          <Tooltip
            visible
            title="Leydig Cells"
            description="Interstitial cells that synthesize testosterone in response to LH from the anterior pituitary."
          />
        </group>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Rete Testis — mediastinal network on the posterior aspect of the testis
// ---------------------------------------------------------------------------

function ReteTestis() {
  const [hover, setHover] = useState(false)
  // A small lattice of cylinders representing the rete network
  const segments = useMemo<
    Array<{
      pos: [number, number, number]
      rot: [number, number, number]
      len: number
    }>
  >(
    () => [
      { pos: [1.05, 0.2, 0], rot: [0, 0, Math.PI / 6], len: 0.5 },
      { pos: [1.05, -0.1, 0], rot: [0, 0, -Math.PI / 8], len: 0.45 },
      { pos: [1.15, 0.05, 0], rot: [0, 0, Math.PI / 2], len: 0.55 },
      { pos: [1.2, 0.35, 0], rot: [0, 0, Math.PI / 3], len: 0.3 },
      { pos: [1.2, -0.3, 0], rot: [0, 0, -Math.PI / 3], len: 0.3 },
    ],
    []
  )
  return (
    <group position={TESTIS_POS.toArray()}>
      {segments.map((s, i) => (
        <mesh
          key={i}
          position={s.pos}
          rotation={s.rot}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHover(true)
          }}
          onPointerOut={(e) => {
            e.stopPropagation()
            setHover(false)
          }}
        >
          <cylinderGeometry args={[0.035, 0.035, s.len, 8]} />
          <meshStandardMaterial
            color={PALETTE.rete}
            emissive={PALETTE.rete}
            emissiveIntensity={0.2}
            roughness={0.7}
          />
        </mesh>
      ))}
      <Label position={[1.4, 0.75, 0]} size={0.15} color="#cbd5e1">
        Rete Testis
      </Label>
      {hover && (
        <group position={[1.2, 0.5, 0]}>
          <Tooltip
            visible
            title="Rete Testis"
            description="Anastomosing network of channels at the mediastinum that collects sperm from the seminiferous tubules and conveys them to the efferent ductules."
          />
        </group>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Epididymis — coiled tube attached to the posterior testis
// ---------------------------------------------------------------------------

function Epididymis({ state }: { state: AxisState['epididymis'] }) {
  const [hover, setHover] = useState(false)
  const dim = state === 'faded'
  const curve = useMemo(() => {
    // Helical coiled tube starting from rete and looping down the testis side
    const pts: THREE.Vector3[] = []
    const turns = 4
    const samples = 80
    for (let i = 0; i <= samples; i++) {
      const t = i / samples
      const ang = t * Math.PI * 2 * turns
      const radius = 0.18
      // Drop along Y as we coil
      const y = 0.6 - t * 1.6
      const cx = EPIDIDYMIS_BASE.x + Math.cos(ang) * radius
      const cy = EPIDIDYMIS_BASE.y + y
      const cz = EPIDIDYMIS_BASE.z + Math.sin(ang) * radius * 0.7
      pts.push(new THREE.Vector3(cx, cy, cz))
    }
    return new THREE.CatmullRomCurve3(pts)
  }, [])
  const tubeGeom = useMemo(
    () => new THREE.TubeGeometry(curve, 200, 0.08, 10, false),
    [curve]
  )
  return (
    <group>
      <mesh
        geometry={tubeGeom}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHover(false)
        }}
      >
        <meshStandardMaterial
          color={PALETTE.epididymis}
          emissive={PALETTE.epididymis}
          emissiveIntensity={dim ? 0.05 : 0.25}
          transparent
          opacity={dim ? 0.35 : 0.95}
          roughness={0.55}
        />
      </mesh>
      <Label position={[2.6, -3.6, 0]} size={0.16} color="#fde68a">
        Epididymis
      </Label>
      {hover && (
        <group position={[2.3, -3.0, 0]}>
          <Tooltip
            visible
            title="Epididymis"
            description="Highly convoluted duct (~6 m uncoiled) where sperm undergo maturation and acquire motility before storage prior to ejaculation."
          />
        </group>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// HormoneFlow — animated string of glowing particles along a curve.
// Particles move modularly along t∈[0,1], colored by hormone state.
// ---------------------------------------------------------------------------

type FlowProps = {
  curve: THREE.CatmullRomCurve3
  color: string
  count?: number
  speed?: number
  radius?: number
  label: string
  labelPos: [number, number, number]
  hidden?: boolean
}

function HormoneFlow({
  curve,
  color,
  count = 7,
  speed = 0.18,
  radius = 0.075,
  label,
  labelPos,
  hidden = false,
}: FlowProps) {
  const groupRef = useRef<THREE.Group>(null)
  const tRef = useRef(0)
  // Stable particle refs
  const particleRefs = useRef<Array<THREE.Mesh | null>>([])

  useFrame((_, delta) => {
    if (hidden) return
    tRef.current = (tRef.current + delta * speed) % 1
    const t0 = tRef.current
    for (let i = 0; i < count; i++) {
      const u = (t0 + i / count) % 1
      const p = curve.getPoint(u)
      const m = particleRefs.current[i]
      if (m) {
        m.position.copy(p)
        // Subtle scale pulse so particles "breathe" along the path
        const s = 0.85 + 0.25 * Math.sin((u + i * 0.13) * Math.PI * 2)
        m.scale.setScalar(s)
      }
    }
  })

  // Faint path tube to give the user a hint of the route
  const pathTube = useMemo(
    () => new THREE.TubeGeometry(curve, 64, 0.012, 8, false),
    [curve]
  )

  if (hidden) return null

  return (
    <group ref={groupRef}>
      {/* Faint guide tube */}
      <mesh geometry={pathTube}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>
      {/* Particles */}
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            particleRefs.current[i] = el
          }}
        >
          <sphereGeometry args={[radius, 14, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.95} />
        </mesh>
      ))}
      <Label position={labelPos} size={0.18} color={color}>
        {label}
      </Label>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Scene — assembles all anatomical structures + hormone flows
// ---------------------------------------------------------------------------

function HPGScene({ state }: { state: AxisState }) {
  // ---- Curves for the five hormone flows -----------------------------------
  const gnrhCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.15, 3.7, 0.18),
        new THREE.Vector3(0.18, 3.4, 0.22),
        new THREE.Vector3(0.1, 3.2, 0.18),
        new THREE.Vector3(0.05, 3.05, 0.1),
      ]),
    []
  )

  const fshCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.25, 2.7, 0.0),
        new THREE.Vector3(-0.9, 1.2, 0.3),
        new THREE.Vector3(-1.1, -0.4, 0.4),
        new THREE.Vector3(-0.95, -1.8, 0.35),
        new THREE.Vector3(-0.65, -3.0, 0.2),
        new THREE.Vector3(-0.35, -3.6, 0.0),
      ]),
    []
  )

  const lhCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.25, 2.7, 0.0),
        new THREE.Vector3(0.9, 1.2, 0.3),
        new THREE.Vector3(1.1, -0.4, 0.4),
        new THREE.Vector3(0.95, -1.8, 0.35),
        new THREE.Vector3(0.65, -3.0, 0.2),
        new THREE.Vector3(0.35, -3.6, 0.0),
      ]),
    []
  )

  // Long ascending feedback loops — curl out and away from the central axis
  // so the path is visually distinct from the downstream FSH/LH flows.
  const testosteroneCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.7, -3.6, -0.05),
        new THREE.Vector3(-2.3, -2.0, -0.3),
        new THREE.Vector3(-2.8, 0.0, -0.4),
        new THREE.Vector3(-2.3, 2.0, -0.3),
        new THREE.Vector3(-1.4, 3.4, -0.2),
        new THREE.Vector3(-0.5, 4.0, -0.05),
      ]),
    []
  )

  const inhibinCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.7, -3.6, -0.05),
        new THREE.Vector3(2.3, -2.0, -0.3),
        new THREE.Vector3(2.8, 0.0, -0.4),
        new THREE.Vector3(2.4, 1.6, -0.3),
        new THREE.Vector3(1.2, 2.6, -0.2),
        new THREE.Vector3(0.4, 2.85, -0.05),
      ]),
    []
  )

  return (
    <>
      {/* Lighting tuned for a dark anatomical illustration */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 8, 6]} intensity={0.85} />
      <directionalLight position={[-5, -4, -5]} intensity={0.25} />
      <pointLight position={[0, 0, 5]} intensity={0.3} color="#a3e635" />

      {/* ---- Brain structures ---- */}
      <Hypothalamus state={state.hypothalamus} />
      <Pituitary state={state.pituitary} />
      <PortalVessels state={state.vessels} />

      {/* ---- Testis structures ---- */}
      <TunicaAlbuginea state={state.testis} />
      <SeminiferousTubules tubules={state.tubules} sertoli={state.sertoli} />
      <LeydigCells state={state.leydig} />
      <ReteTestis />
      <Epididymis state={state.epididymis} />

      {/* ---- Hormone particle flows ---- */}
      <HormoneFlow
        curve={gnrhCurve}
        color={stateColor(state.gnrh)}
        label="GnRH"
        labelPos={[0.6, 3.5, 0.3]}
        count={5}
        speed={0.4}
        radius={0.055}
        hidden={state.gnrh === 'suppressed' || state.gnrh === 'faded'}
      />
      <HormoneFlow
        curve={fshCurve}
        color={stateColor(state.fsh)}
        label="FSH"
        labelPos={[-1.4, 0.6, 0.5]}
        count={9}
        speed={0.16}
        radius={0.085}
        hidden={state.fsh === 'faded'}
      />
      <HormoneFlow
        curve={lhCurve}
        color={stateColor(state.lh)}
        label="LH"
        labelPos={[1.4, 0.6, 0.5]}
        count={9}
        speed={0.16}
        radius={0.085}
        hidden={state.lh === 'faded'}
      />
      <HormoneFlow
        curve={testosteroneCurve}
        color={stateColor(state.testosterone)}
        label="Testosterone"
        labelPos={[-3.2, 0.4, -0.4]}
        count={7}
        speed={0.13}
        radius={0.075}
        hidden={
          state.testosterone === 'broken' ||
          state.testosterone === 'absent' ||
          state.testosterone === 'faded'
        }
      />
      <HormoneFlow
        curve={inhibinCurve}
        color={stateColor(state.inhibinB)}
        label="Inhibin B"
        labelPos={[3.2, 0.4, -0.4]}
        count={7}
        speed={0.13}
        radius={0.07}
        hidden={state.inhibinB === 'broken'}
      />

      {/* Orbit controls — rotate / zoom / pan */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={6}
        maxDistance={28}
        target={[0, 0, 0]}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Loading fallback — small spinner while the 3D scene initialises
// ---------------------------------------------------------------------------

function LoadingFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-2">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"
          aria-label="Loading 3D anatomical visualization"
        />
        <span className="text-xs font-medium text-slate-300">
          Loading 3D anatomy…
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export default function HPGAxis3D({ state }: { state: AxisState }) {
  return (
    <div className="relative h-[460px] w-full overflow-hidden rounded-xl bg-slate-900">
      <Canvas
        camera={{ position: [0, 0, 14], fov: 45, near: 0.1, far: 100 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0f172a' }}
      >
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#0f172a', 18, 40]} />
        <Suspense fallback={null}>
          <HPGScene state={state} />
        </Suspense>
      </Canvas>

      {/* Subtle interaction hint overlay */}
      <div className="pointer-events-none absolute bottom-2 left-2 select-none rounded-md bg-slate-900/70 px-2 py-1 text-[10px] font-medium tracking-wide text-slate-300 ring-1 ring-white/10">
        🖱 drag to rotate · scroll to zoom · right-drag to pan
      </div>
    </div>
  )
}

// Re-export the loading fallback for use by parent dynamic-import wrappers
export { LoadingFallback as HPGAxis3DLoading }
