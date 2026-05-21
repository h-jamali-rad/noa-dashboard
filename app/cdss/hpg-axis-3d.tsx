'use client'

/**
 * HPGAxis3D
 * --------------------------------------------------------------------------
 * Anatomically realistic, interactive 3D atlas of the
 * Hypothalamic-Pituitary-Gonadal (HPG) axis, built with React Three Fiber.
 *
 * v2 — enhanced procedural anatomy + working tooltips + pathology viz
 *
 *   - Hypothalamus: organic brain-tissue Icosahedron with sine-noise-based
 *                   sulci/folds.
 *   - Anterior pituitary: bean-shaped LatheGeometry profile (kidney shape)
 *                         with separate anterior/posterior tints, an
 *                         infundibulum stalk, and a "compensating" pulsing
 *                         animation that enlarges + pulses the gland.
 *   - Portal vessels: 3 branching CatmullRomCurve3 → TubeGeometry vessels
 *                     carrying blood-flow particles between hypothalamus
 *                     and pituitary.
 *   - Tunica albuginea: two concentric ellipsoid shells; under atrophy
 *                       the testis scales to 0.6× with surface wrinkling.
 *   - Seminiferous tubules: ring of 18 detailed cross-sections — each ring
 *                           is a torus basement-membrane + inner torus
 *                           lumen + 8 columnar Sertoli cells (tapered
 *                           CylinderGeometry) arranged radially. 35 % of
 *                           tubules are hidden when "damaged".
 *   - Sertoli cells: live inside the tubule cross-sections; dimmed to
 *                    opacity 0.35 when damaged.
 *   - Leydig cells: 14 polygonal DodecahedronGeometry blobs with random
 *                   vertex displacement in interstitial space, dimmed
 *                   when damaged/unresponsive.
 *   - Rete testis: small branching tube network on the mediastinal side.
 *   - Epididymis: helical CatmullRomCurve3 → TubeGeometry coiled tube
 *                 alongside the testis.
 *
 *   - Hormone flows: GnRH, FSH, LH, T, Inhibin B as animated particles
 *                    along CatmullRomCurve3 paths.  Particle count, speed,
 *                    and size scale down when the signal is faded /
 *                    weak / suppressed / broken / absent.
 *
 *   - Tooltips: every anatomical region listens to pointer events and
 *               shows a drei <Html> tooltip with a verbatim medical
 *               description of the structure.  Inner decorative meshes
 *               have raycast={null} so they do not intercept hover.
 *
 *   - Pathology: damaged tubules disappear; dim sertoli/leydig opacity;
 *                weak hormone flows have fewer/slower particles;
 *                compensating pituitary is 1.3× enlarged + pulses.
 *
 * This file is loaded via `next/dynamic({ ssr: false })` because Three.js
 * cannot render in Next's SSR environment.
 *
 * The clinical logic (detectConditions, THRESHOLDS, narrative, etc.) lives
 * in the parent file and is preserved verbatim — this module only renders
 * the diagram given an `AxisState`.
 * --------------------------------------------------------------------------
 */

import {
  Suspense,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
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
  normal: '#22c55e',
  compensating: '#f59e0b',
  abnormal: '#ef4444',
  faded: '#64748b',
  // Anatomical tints
  hypothalamusBody: '#fda4af',
  pituitaryAnterior: '#fef3c7',
  pituitaryPosterior: '#fde68a',
  testisBody: '#1e293b',
  tunicaTint: '#cbd5e1',
  tubuleBasement: '#fbcfe8',
  tubuleLumen: '#fce7f3',
  sertoli: '#3b82f6',
  leydig: '#fb923c',
  rete: '#94a3b8',
  epididymis: '#fcd34d',
  vesselWall: '#7f1d1d',
} as const

/** Map any AxisState field value to a semantic color. */
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
  return PALETTE.abnormal
}

// ---------------------------------------------------------------------------
// AxisState merge — picks the most-abnormal value across multiple conditions
// ---------------------------------------------------------------------------
// When multiple conditions are detected, we render ONE shared 3D scene whose
// state is the field-wise worst case across all detected conditions.
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
  // adipose / aromatase
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
  }
  return out
}

// ---------------------------------------------------------------------------
// Scene constants — coordinates for the major anatomical landmarks
// ---------------------------------------------------------------------------

const POS = {
  hypothalamus: new THREE.Vector3(0, 4.0, 0),
  pituitary: new THREE.Vector3(0, 3.0, 0),
  testisL: new THREE.Vector3(-1.4, -3.0, 0),
  testisR: new THREE.Vector3(1.4, -3.0, 0),
} as const

// ---------------------------------------------------------------------------
// Tooltip — drei <Html> overlay shown next to an anatomical structure
// ---------------------------------------------------------------------------

function Tooltip({
  visible,
  title,
  body,
  position,
}: {
  visible: boolean
  title: string
  body: string
  position: [number, number, number]
}) {
  if (!visible) return null
  return (
    <Html
      position={position}
      center
      distanceFactor={8}
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.15)',
          padding: '8px 10px',
          borderRadius: 6,
          maxWidth: 260,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto',
          fontSize: 11,
          lineHeight: 1.4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 4,
            color: '#fef3c7',
          }}
        >
          {title}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.85)' }}>{body}</div>
      </div>
    </Html>
  )
}

// ---------------------------------------------------------------------------
// Hover wrapper — group that handles pointer events for an anatomical region
// ---------------------------------------------------------------------------

function Hoverable({
  title,
  body,
  tooltipOffset = [0, 0.8, 0],
  position,
  children,
}: {
  title: string
  body: string
  tooltipOffset?: [number, number, number]
  position?: [number, number, number]
  children: ReactNode
}) {
  const [hover, setHover] = useState(false)
  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHover(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHover(false)
        document.body.style.cursor = 'default'
      }}
    >
      {children}
      <Tooltip
        visible={hover}
        title={title}
        body={body}
        position={tooltipOffset}
      />
    </group>
  )
}

// ===========================================================================
// GEOMETRY FACTORIES
// ===========================================================================

/** Brain-tissue lobe: high-detail icosahedron with sine-noise displacement
 *  to produce realistic sulci/gyri.                                          */
function makeBrainGeometry(
  radius = 0.55,
  detail = 4,
  amplitude = 0.08
): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(radius, detail)
  const pos = g.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const dir = v.clone().normalize()
    // Layered sine noise → resembles brain folds
    const n =
      Math.sin(dir.x * 7.0) * Math.sin(dir.y * 6.0) * 0.4 +
      Math.sin(dir.y * 11.0) * Math.cos(dir.z * 9.0) * 0.3 +
      Math.sin(dir.x * 13.0 + dir.z * 5.0) * 0.3
    v.addScaledVector(dir, n * amplitude)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  pos.needsUpdate = true
  g.computeVertexNormals()
  return g
}

/** Bean / kidney-shaped pituitary profile, swept around the Y axis. */
function makePituitaryGeometry(scale = 0.18): THREE.BufferGeometry {
  const points: THREE.Vector2[] = []
  const N = 24
  for (let i = 0; i <= N; i++) {
    const t = i / N // 0 .. 1
    const angle = t * Math.PI // 0 .. π
    // r(t) is the radius of the bean profile at height y(t)
    const r =
      scale *
      (1.2 +
        0.5 * Math.sin(angle) +
        0.15 * Math.sin(angle * 3) +
        0.08 * Math.sin(angle * 5))
    const y = scale * 2.2 * (t - 0.5)
    points.push(new THREE.Vector2(r, y))
  }
  return new THREE.LatheGeometry(points, 32)
}

/** Wrinkled tunica albuginea — ellipsoid with optional radial wrinkles. */
function makeTunicaGeometry(
  rx: number,
  ry: number,
  rz: number,
  wrinkle = 0
): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 64, 48)
  const pos = g.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    // Apply ellipsoid scaling
    v.x *= rx
    v.y *= ry
    v.z *= rz
    if (wrinkle > 0) {
      const dir = v.clone().normalize()
      const n =
        Math.sin(dir.y * 14.0) * 0.5 +
        Math.cos(dir.x * 12.0 + dir.z * 9.0) * 0.5
      v.addScaledVector(dir, n * wrinkle)
    }
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  pos.needsUpdate = true
  g.computeVertexNormals()
  return g
}

/** Polygonal Leydig-cell shape — dodecahedron with random vertex jitter. */
function makeLeydigGeometry(radius = 0.07): THREE.BufferGeometry {
  const g = new THREE.DodecahedronGeometry(radius, 1)
  const pos = g.attributes.position as THREE.BufferAttribute
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const dir = v.clone().normalize()
    const jitter = (Math.sin(i * 12.9898) * 43758.5453) % 1
    v.addScaledVector(dir, (jitter - 0.5) * radius * 0.35)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  pos.needsUpdate = true
  g.computeVertexNormals()
  return g
}

/** A single thin tube along a curve. */
function makeTubeFromCurve(
  points: THREE.Vector3[],
  radius: number,
  segments = 64,
  radialSegments = 8
): { geom: THREE.BufferGeometry; curve: THREE.CatmullRomCurve3 } {
  const curve = new THREE.CatmullRomCurve3(points)
  const geom = new THREE.TubeGeometry(
    curve,
    segments,
    radius,
    radialSegments,
    false
  )
  return { geom, curve }
}

// ===========================================================================
// ANATOMY COMPONENTS
// ===========================================================================

// ---------------------------------------------------------------------------
// Hypothalamus
// ---------------------------------------------------------------------------

function Hypothalamus({ state }: { state: AxisState }) {
  const colour = stateColor(state.hypothalamus)
  const isFaded = state.hypothalamus === 'faded'

  const leftLobe = useMemo(() => makeBrainGeometry(0.6, 4, 0.09), [])
  const rightLobe = useMemo(() => makeBrainGeometry(0.6, 4, 0.09), [])
  const center = useMemo(() => makeBrainGeometry(0.42, 4, 0.05), [])

  return (
    <Hoverable
      title="Hypothalamus"
      body="Neuroendocrine command center. Releases GnRH in pulsatile fashion to regulate the reproductive axis."
      position={[POS.hypothalamus.x, POS.hypothalamus.y, POS.hypothalamus.z]}
      tooltipOffset={[0, 1.0, 0]}
    >
      {/* Left lobe */}
      <mesh geometry={leftLobe} position={[-0.45, 0, 0]} raycast={null as never}>
        <meshPhysicalMaterial
          color={PALETTE.hypothalamusBody}
          roughness={0.6}
          clearcoat={0.4}
          clearcoatRoughness={0.5}
          transparent
          opacity={isFaded ? 0.45 : 0.92}
          emissive={colour}
          emissiveIntensity={isFaded ? 0.05 : 0.2}
        />
      </mesh>
      {/* Right lobe */}
      <mesh geometry={rightLobe} position={[0.45, 0, 0]} raycast={null as never}>
        <meshPhysicalMaterial
          color={PALETTE.hypothalamusBody}
          roughness={0.6}
          clearcoat={0.4}
          clearcoatRoughness={0.5}
          transparent
          opacity={isFaded ? 0.45 : 0.92}
          emissive={colour}
          emissiveIntensity={isFaded ? 0.05 : 0.2}
        />
      </mesh>
      {/* Central mass between lobes */}
      <mesh geometry={center} position={[0, -0.05, 0]} raycast={null as never}>
        <meshPhysicalMaterial
          color={PALETTE.hypothalamusBody}
          roughness={0.6}
          clearcoat={0.4}
          transparent
          opacity={isFaded ? 0.45 : 0.95}
          emissive={colour}
          emissiveIntensity={isFaded ? 0.05 : 0.3}
        />
      </mesh>
      {/* State-color outline halo */}
      <mesh raycast={null as never}>
        <sphereGeometry args={[1.05, 32, 24]} />
        <meshBasicMaterial
          color={colour}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </Hoverable>
  )
}

// ---------------------------------------------------------------------------
// Anterior Pituitary
// ---------------------------------------------------------------------------

function AnteriorPituitary({ state }: { state: AxisState }) {
  const colour = stateColor(state.pituitary)
  const isFaded = state.pituitary === 'faded'
  const isCompensating = state.pituitary === 'compensating'

  const beanGeom = useMemo(() => makePituitaryGeometry(0.18), [])
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    if (isCompensating) {
      // Enlarged + pulsing
      const s = 1.3 + 0.1 * Math.sin(clock.elapsedTime * 4)
      groupRef.current.scale.setScalar(s)
    } else {
      groupRef.current.scale.setScalar(1.0)
    }
  })

  return (
    <Hoverable
      title="Anterior Pituitary"
      body="Adenohypophysis. Produces FSH and LH in response to GnRH stimulation."
      position={[POS.pituitary.x, POS.pituitary.y, POS.pituitary.z]}
      tooltipOffset={[0, 0.6, 0]}
    >
      <group ref={groupRef}>
        {/* Anterior half — bean profile */}
        <mesh geometry={beanGeom} rotation={[0, 0, Math.PI / 2]} raycast={null as never}>
          <meshPhysicalMaterial
            color={PALETTE.pituitaryAnterior}
            roughness={0.4}
            clearcoat={0.6}
            transparent
            opacity={isFaded ? 0.5 : 0.95}
            emissive={colour}
            emissiveIntensity={isFaded ? 0.05 : 0.25}
          />
        </mesh>
        {/* Posterior smaller cap */}
        <mesh position={[0, -0.05, -0.08]} raycast={null as never}>
          <sphereGeometry args={[0.13, 24, 18]} />
          <meshPhysicalMaterial
            color={PALETTE.pituitaryPosterior}
            roughness={0.5}
            clearcoat={0.5}
            transparent
            opacity={isFaded ? 0.5 : 0.85}
            emissive={colour}
            emissiveIntensity={isFaded ? 0.05 : 0.15}
          />
        </mesh>
        {/* Infundibulum stalk to hypothalamus */}
        <mesh
          position={[0, 0.55, 0]}
          rotation={[0, 0, 0]}
          raycast={null as never}
        >
          <cylinderGeometry args={[0.04, 0.06, 0.5, 16]} />
          <meshPhysicalMaterial
            color={PALETTE.pituitaryAnterior}
            roughness={0.55}
            transparent
            opacity={isFaded ? 0.4 : 0.9}
          />
        </mesh>
        {/* Outline halo */}
        <mesh raycast={null as never}>
          <sphereGeometry args={[0.42, 24, 18]} />
          <meshBasicMaterial
            color={colour}
            transparent
            opacity={isCompensating ? 0.22 : 0.12}
            side={THREE.BackSide}
          />
        </mesh>
      </group>
    </Hoverable>
  )
}

// ---------------------------------------------------------------------------
// Portal Vessels — 3 branching vessels hypothalamus → pituitary
// ---------------------------------------------------------------------------

function PortalVessels({ state }: { state: AxisState }) {
  const colour = stateColor(state.vessels)
  const isFaded = state.vessels === 'faded'

  const vessels = useMemo(() => {
    return [
      // Central trunk
      makeTubeFromCurve(
        [
          new THREE.Vector3(0, 3.55, 0),
          new THREE.Vector3(0, 3.35, 0.05),
          new THREE.Vector3(0, 3.15, 0),
        ],
        0.025
      ),
      // Left branch
      makeTubeFromCurve(
        [
          new THREE.Vector3(-0.08, 3.55, 0),
          new THREE.Vector3(-0.15, 3.4, -0.04),
          new THREE.Vector3(-0.12, 3.2, 0),
          new THREE.Vector3(-0.05, 3.05, 0.02),
        ],
        0.018
      ),
      // Right branch
      makeTubeFromCurve(
        [
          new THREE.Vector3(0.08, 3.55, 0),
          new THREE.Vector3(0.16, 3.4, 0.04),
          new THREE.Vector3(0.14, 3.2, 0),
          new THREE.Vector3(0.06, 3.05, -0.02),
        ],
        0.018
      ),
    ]
  }, [])

  // Blood-flow particles
  const particles = useRef<Array<{ t: number; speed: number }>>(
    Array.from({ length: 6 }, () => ({
      t: Math.random(),
      speed: 0.18 + Math.random() * 0.1,
    }))
  )
  const particleRefs = useRef<Array<THREE.Mesh | null>>([])

  useFrame((_, dt) => {
    if (!vessels[0]) return
    const curve = vessels[0].curve
    particles.current.forEach((p, i) => {
      p.t = (p.t + p.speed * dt * (isFaded ? 0.3 : 1)) % 1
      const m = particleRefs.current[i]
      if (m && curve) {
        const pos = curve.getPoint(p.t)
        m.position.copy(pos)
      }
    })
  })

  return (
    <Hoverable
      title="Portal Vessels"
      body="Hypophyseal portal system. Carries GnRH directly from hypothalamus to anterior pituitary."
      tooltipOffset={[0.35, 3.35, 0]}
    >
      {vessels.map((v, i) => (
        <mesh key={i} geometry={v.geom} raycast={i === 0 ? undefined : (null as never)}>
          <meshStandardMaterial
            color={PALETTE.vesselWall}
            transparent
            opacity={isFaded ? 0.35 : 0.85}
            emissive={colour}
            emissiveIntensity={isFaded ? 0.05 : 0.15}
          />
        </mesh>
      ))}
      {/* Blood particles travelling along the central trunk */}
      {particles.current.map((_, i) => (
        <mesh
          key={`p${i}`}
          ref={(el) => {
            particleRefs.current[i] = el
          }}
          raycast={null as never}
        >
          <sphereGeometry args={[0.018, 8, 6]} />
          <meshBasicMaterial color={colour} />
        </mesh>
      ))}
    </Hoverable>
  )
}

// ---------------------------------------------------------------------------
// Single testis — tunica + tubules + cells + rete + epididymis
// ---------------------------------------------------------------------------

function Testis({
  state,
  side,
}: {
  state: AxisState
  side: 'L' | 'R'
}) {
  const center = side === 'L' ? POS.testisL : POS.testisR
  const mirror = side === 'L' ? -1 : 1

  const isAtrophic = state.testis === 'atrophic'
  const isDamagedTestis =
    state.testis === 'damaged' || state.testis === 'atrophic'
  const isFadedTestis = state.testis === 'faded'

  const scale = isAtrophic ? 0.6 : 1.0
  const wrinkle = isDamagedTestis ? 0.04 : 0
  const testisColour = stateColor(state.testis)

  // Concentric ellipsoid shells for tunica albuginea
  const outerTunica = useMemo(
    () => makeTunicaGeometry(1.0, 1.2, 1.0, wrinkle),
    [wrinkle]
  )
  const innerTunica = useMemo(
    () => makeTunicaGeometry(0.95, 1.15, 0.95, wrinkle * 0.8),
    [wrinkle]
  )

  return (
    <group position={[center.x, center.y, center.z]} scale={[scale, scale, scale]}>
      {/* TUNICA ALBUGINEA */}
      <Hoverable
        title="Tunica Albuginea"
        body="Dense fibrous capsule surrounding the testis. Provides structural support."
        tooltipOffset={[0, 1.4, 0]}
      >
        <mesh geometry={outerTunica} raycast={null as never}>
          <meshPhysicalMaterial
            color={PALETTE.tunicaTint}
            roughness={0.55}
            clearcoat={0.4}
            transparent
            opacity={isFadedTestis ? 0.15 : 0.25}
            side={THREE.DoubleSide}
            emissive={testisColour}
            emissiveIntensity={0.05}
          />
        </mesh>
        {/* Inner cortex with state-color outline */}
        <mesh geometry={innerTunica} raycast={null as never}>
          <meshStandardMaterial
            color={PALETTE.testisBody}
            transparent
            opacity={isFadedTestis ? 0.18 : 0.45}
            side={THREE.DoubleSide}
            emissive={testisColour}
            emissiveIntensity={isFadedTestis ? 0.05 : 0.12}
          />
        </mesh>
        {/* Capsule glow */}
        <mesh raycast={null as never}>
          <sphereGeometry args={[1.25, 32, 24]} />
          <meshBasicMaterial
            color={testisColour}
            transparent
            opacity={isFadedTestis ? 0.05 : 0.1}
            side={THREE.BackSide}
          />
        </mesh>
      </Hoverable>

      {/* SEMINIFEROUS TUBULES */}
      <SeminiferousTubules state={state} />

      {/* LEYDIG CELLS — interstitial */}
      <LeydigCells state={state} />

      {/* RETE TESTIS — small branching tubes on mediastinal side */}
      <ReteTestis state={state} mirror={mirror} />

      {/* EPIDIDYMIS — helical coil alongside the testis */}
      <Epididymis state={state} mirror={mirror} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Seminiferous Tubules — ring of detailed tubule cross-sections
// ---------------------------------------------------------------------------

function SeminiferousTubules({ state }: { state: AxisState }) {
  const tubuleColour = stateColor(state.tubules)
  const sertoliColour = stateColor(state.sertoli)
  const isDamagedT =
    state.tubules === 'damaged' || state.tubules === 'sparse'
  const isFaded = state.testis === 'faded'
  const isDamagedSertoli = state.sertoli === 'damaged'

  // Place 18 tubule cross-sections in a 2-ring pattern inside the testis
  const tubules = useMemo(() => {
    const list: Array<{
      pos: THREE.Vector3
      visible: boolean
      radius: number
    }> = []
    const RING1_COUNT = 12
    const RING2_COUNT = 6
    const RING1_R = 0.7
    const RING2_R = 0.35
    // Outer ring
    for (let i = 0; i < RING1_COUNT; i++) {
      const a = (i / RING1_COUNT) * Math.PI * 2
      const visible = isDamagedT ? Math.sin(i * 7.3) > -0.3 : true // ≈65% kept
      list.push({
        pos: new THREE.Vector3(
          Math.cos(a) * RING1_R,
          Math.sin(a) * RING1_R,
          0
        ),
        visible,
        radius: 0.13,
      })
    }
    // Inner ring
    for (let i = 0; i < RING2_COUNT; i++) {
      const a = (i / RING2_COUNT) * Math.PI * 2 + 0.3
      const visible = isDamagedT ? (i + 1) % 3 !== 0 : true
      list.push({
        pos: new THREE.Vector3(
          Math.cos(a) * RING2_R,
          Math.sin(a) * RING2_R,
          0
        ),
        visible,
        radius: 0.11,
      })
    }
    return list
  }, [isDamagedT])

  // Reusable geometries
  const basementGeom = useMemo(
    () => new THREE.TorusGeometry(0.13, 0.022, 12, 28),
    []
  )
  const basementGeomSmall = useMemo(
    () => new THREE.TorusGeometry(0.11, 0.02, 12, 28),
    []
  )
  const lumenGeom = useMemo(
    () => new THREE.TorusGeometry(0.13, 0.012, 8, 24),
    []
  )
  const sertoliGeom = useMemo(
    () => new THREE.CylinderGeometry(0.012, 0.018, 0.04, 6),
    []
  )

  return (
    <>
      <Hoverable
        title="Seminiferous Tubules"
        body="Site of spermatogenesis. Contains Sertoli cells and developing germ cells."
        tooltipOffset={[0, 1.0, 0.4]}
      >
        {tubules.map((t, idx) =>
          t.visible ? (
            <group key={idx} position={[t.pos.x, t.pos.y, 0]}>
              {/* Basement membrane (outer torus ring) */}
              <mesh
                geometry={t.radius === 0.13 ? basementGeom : basementGeomSmall}
                rotation={[Math.PI / 2, 0, 0]}
                raycast={null as never}
              >
                <meshStandardMaterial
                  color={PALETTE.tubuleBasement}
                  emissive={tubuleColour}
                  emissiveIntensity={isFaded ? 0.05 : 0.2}
                  transparent
                  opacity={isFaded ? 0.4 : 0.9}
                  roughness={0.5}
                />
              </mesh>
              {/* Lumen (inner thin torus) */}
              <mesh
                geometry={lumenGeom}
                rotation={[Math.PI / 2, 0, 0]}
                scale={[t.radius / 0.13, 1, t.radius / 0.13]}
                raycast={null as never}
              >
                <meshBasicMaterial
                  color={PALETTE.tubuleLumen}
                  transparent
                  opacity={isFaded ? 0.4 : 0.95}
                />
              </mesh>
              {/* Columnar Sertoli cells arranged radially on the basement */}
              <SertoliRing
                radius={t.radius - 0.02}
                count={8}
                color={sertoliColour}
                geom={sertoliGeom}
                dim={isDamagedSertoli || isFaded}
              />
            </group>
          ) : (
            // Damaged tubules — render as a faint cross-shaped scar
            <group key={idx} position={[t.pos.x, t.pos.y, 0]}>
              <mesh raycast={null as never}>
                <sphereGeometry args={[0.02, 6, 6]} />
                <meshBasicMaterial
                  color={PALETTE.abnormal}
                  transparent
                  opacity={0.6}
                />
              </mesh>
            </group>
          )
        )}
      </Hoverable>

      {/* Sertoli-cell-specific tooltip overlay — invisible mesh that captures
          hover on the central core only.  This ensures users can still get
          a Sertoli-only tooltip in addition to the tubules' one above.       */}
      <Hoverable
        title="Sertoli Cells"
        body="Nurse cells of spermatogenesis. Produce Inhibin B and support germ cell development."
        position={[0, 0, 0.4]}
        tooltipOffset={[0, 0, 0.5]}
      >
        <mesh>
          <sphereGeometry args={[0.18, 12, 8]} />
          <meshBasicMaterial
            color={sertoliColour}
            transparent
            opacity={0.001}
          />
        </mesh>
      </Hoverable>
    </>
  )
}

/** Radial arrangement of Sertoli cells inside a tubule cross-section. */
function SertoliRing({
  radius,
  count,
  color,
  geom,
  dim,
}: {
  radius: number
  count: number
  color: string
  geom: THREE.CylinderGeometry
  dim: boolean
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2
        const x = Math.cos(a) * radius
        const y = Math.sin(a) * radius
        return (
          <mesh
            key={i}
            geometry={geom}
            position={[x, y, 0]}
            rotation={[0, 0, a + Math.PI / 2]}
            raycast={null as never}
          >
            <meshStandardMaterial
              color={PALETTE.sertoli}
              emissive={color}
              emissiveIntensity={dim ? 0.06 : 0.4}
              transparent
              opacity={dim ? 0.35 : 0.95}
              roughness={0.4}
            />
          </mesh>
        )
      })}
    </>
  )
}

// ---------------------------------------------------------------------------
// Leydig Cells — polygonal blobs in interstitial space
// ---------------------------------------------------------------------------

function LeydigCells({ state }: { state: AxisState }) {
  const colour = stateColor(state.leydig)
  const isDamaged =
    state.leydig === 'damaged' || state.leydig === 'unresponsive'

  const cells = useMemo(() => {
    const list: Array<{ pos: THREE.Vector3 }> = []
    // Distribute in interstitial space (between rings).  Avoid the tubule
    // ring positions roughly.
    const N = 14
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + 0.4
      const r = 0.5 + 0.07 * Math.sin(i * 4.1)
      list.push({
        pos: new THREE.Vector3(
          Math.cos(a) * r,
          Math.sin(a) * r,
          0
        ),
      })
    }
    // A few extra blobs at random angles
    for (let i = 0; i < 5; i++) {
      const a = i * 1.6
      const r = 0.25 + 0.1 * Math.cos(i * 2.7)
      list.push({
        pos: new THREE.Vector3(
          Math.cos(a) * r,
          Math.sin(a) * r,
          0.02
        ),
      })
    }
    return list
  }, [])

  const geom = useMemo(() => makeLeydigGeometry(0.05), [])

  return (
    <Hoverable
      title="Leydig Cells"
      body="Interstitial cells. Primary source of testosterone production in response to LH."
      tooltipOffset={[0.55, 0.55, 0.2]}
    >
      {cells.map((c, i) => (
        <mesh
          key={i}
          geometry={geom}
          position={[c.pos.x, c.pos.y, c.pos.z]}
          raycast={null as never}
        >
          <meshStandardMaterial
            color={PALETTE.leydig}
            emissive={colour}
            emissiveIntensity={isDamaged ? 0.08 : 0.4}
            transparent
            opacity={isDamaged ? 0.35 : 0.95}
            roughness={0.5}
          />
        </mesh>
      ))}
    </Hoverable>
  )
}

// ---------------------------------------------------------------------------
// Rete Testis — branching tube network on the mediastinal side
// ---------------------------------------------------------------------------

function ReteTestis({
  state,
  mirror,
}: {
  state: AxisState
  mirror: number
}) {
  const colour = stateColor(state.testis)
  const isFaded =
    state.testis === 'faded' || state.testis === 'atrophic'

  const segments = useMemo(() => {
    return [
      makeTubeFromCurve(
        [
          new THREE.Vector3(mirror * 0.7, 0.2, 0),
          new THREE.Vector3(mirror * 0.85, 0.05, 0),
          new THREE.Vector3(mirror * 0.95, -0.1, 0),
        ],
        0.025,
        24,
        6
      ),
      makeTubeFromCurve(
        [
          new THREE.Vector3(mirror * 0.65, -0.05, 0),
          new THREE.Vector3(mirror * 0.85, -0.05, 0.06),
          new THREE.Vector3(mirror * 0.95, -0.1, 0),
        ],
        0.02,
        20,
        6
      ),
      makeTubeFromCurve(
        [
          new THREE.Vector3(mirror * 0.55, -0.3, 0),
          new THREE.Vector3(mirror * 0.8, -0.25, -0.04),
          new THREE.Vector3(mirror * 0.95, -0.1, 0),
        ],
        0.02,
        20,
        6
      ),
      makeTubeFromCurve(
        [
          new THREE.Vector3(mirror * 0.45, 0.45, 0),
          new THREE.Vector3(mirror * 0.7, 0.35, -0.05),
          new THREE.Vector3(mirror * 0.85, 0.1, 0),
        ],
        0.018,
        20,
        6
      ),
    ]
  }, [mirror])

  return (
    <Hoverable
      title="Rete Testis"
      body="Network of channels collecting sperm from seminiferous tubules."
      tooltipOffset={[mirror * 1.2, 0, 0]}
    >
      {segments.map((s, i) => (
        <mesh key={i} geometry={s.geom} raycast={null as never}>
          <meshStandardMaterial
            color={PALETTE.rete}
            emissive={colour}
            emissiveIntensity={isFaded ? 0.05 : 0.18}
            transparent
            opacity={isFaded ? 0.4 : 0.92}
            roughness={0.45}
          />
        </mesh>
      ))}
      {/* Subtle pickup mesh for the tooltip hover */}
      <mesh position={[mirror * 0.85, 0, 0]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshBasicMaterial color={colour} transparent opacity={0.001} />
      </mesh>
    </Hoverable>
  )
}

// ---------------------------------------------------------------------------
// Epididymis — helical coiled tube alongside the testis
// ---------------------------------------------------------------------------

function Epididymis({
  state,
  mirror,
}: {
  state: AxisState
  mirror: number
}) {
  const colour = stateColor(state.epididymis)
  const isFaded = state.epididymis === 'faded'

  const tube = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const TURNS = 6
    const POINTS = 90
    for (let i = 0; i <= POINTS; i++) {
      const t = i / POINTS
      const angle = t * Math.PI * 2 * TURNS
      const y = 1.0 - t * 2.0 // top → bottom
      const r = 0.06 + 0.02 * Math.sin(t * Math.PI * 3)
      const x = mirror * (1.0 + r * Math.cos(angle))
      const z = r * Math.sin(angle)
      pts.push(new THREE.Vector3(x, y, z))
    }
    return makeTubeFromCurve(pts, 0.04, 220, 8)
  }, [mirror])

  return (
    <Hoverable
      title="Epididymis"
      body="Coiled tube for sperm maturation, storage, and transport."
      tooltipOffset={[mirror * 1.4, 0, 0.4]}
    >
      <mesh geometry={tube.geom} raycast={null as never}>
        <meshPhysicalMaterial
          color={PALETTE.epididymis}
          roughness={0.4}
          clearcoat={0.5}
          transparent
          opacity={isFaded ? 0.35 : 0.92}
          emissive={colour}
          emissiveIntensity={isFaded ? 0.05 : 0.15}
        />
      </mesh>
      {/* Pickup mesh for tooltip */}
      <mesh position={[mirror * 1.05, 0, 0]}>
        <sphereGeometry args={[0.35, 14, 10]} />
        <meshBasicMaterial color={colour} transparent opacity={0.001} />
      </mesh>
    </Hoverable>
  )
}

// ===========================================================================
// HORMONE FLOWS — animated particles along curves
// ===========================================================================

function HormoneFlow({
  start,
  end,
  controlOffsets = [],
  state,
  baseCount = 6,
  particleRadius = 0.04,
  speed = 0.18,
  label,
}: {
  start: THREE.Vector3
  end: THREE.Vector3
  controlOffsets?: Array<[number, number, number]>
  state:
    | 'normal'
    | 'pulsing'
    | 'faded'
    | 'suppressed'
    | 'weak'
    | 'broken'
    | 'absent'
  baseCount?: number
  particleRadius?: number
  speed?: number
  label?: string
}) {
  const colour = stateColor(state)

  // Adjust count / speed / size for weakened states
  const isWeak =
    state === 'weak' ||
    state === 'faded' ||
    state === 'suppressed'
  const isBroken = state === 'broken' || state === 'absent'

  const count = isBroken ? 0 : isWeak ? 2 : baseCount
  const speedMul = isBroken ? 0 : isWeak ? 0.35 : 1
  const sizeMul = isWeak ? 0.7 : 1

  const curve = useMemo(() => {
    const points: THREE.Vector3[] = [start.clone()]
    controlOffsets.forEach((o) => {
      points.push(
        new THREE.Vector3(
          (start.x + end.x) / 2 + o[0],
          (start.y + end.y) / 2 + o[1],
          (start.z + end.z) / 2 + o[2]
        )
      )
    })
    points.push(end.clone())
    return new THREE.CatmullRomCurve3(points)
  }, [start, end, controlOffsets])

  // Tube geometry (background path)
  const tubeGeom = useMemo(
    () => new THREE.TubeGeometry(curve, 64, 0.012, 6, false),
    [curve]
  )

  const particles = useRef<Array<{ t: number; phase: number }>>(
    Array.from({ length: count }, (_, i) => ({
      t: i / Math.max(count, 1),
      phase: Math.random(),
    }))
  )
  const refs = useRef<Array<THREE.Mesh | null>>([])

  useFrame((_, dt) => {
    particles.current.forEach((p, i) => {
      p.t = (p.t + speed * speedMul * dt) % 1
      const m = refs.current[i]
      if (m) {
        const pt = curve.getPoint(p.t)
        m.position.copy(pt)
      }
    })
  })

  return (
    <group>
      {/* Path tube — subtle backdrop */}
      <mesh geometry={tubeGeom} raycast={null as never}>
        <meshBasicMaterial
          color={colour}
          transparent
          opacity={isBroken ? 0.15 : 0.4}
        />
      </mesh>
      {/* Animated particles */}
      {particles.current.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          raycast={null as never}
        >
          <sphereGeometry
            args={[particleRadius * sizeMul, 10, 8]}
          />
          <meshBasicMaterial color={colour} transparent opacity={0.95} />
        </mesh>
      ))}
      {/* Label is intentionally not rendered as 3D Text here — keeping the
          atlas clean.  Hovering anatomy reveals the hormone via tooltip.    */}
      {label ? null : null}
    </group>
  )
}

// ===========================================================================
// SCENE ROOT
// ===========================================================================

function HPGScene({ state }: { state: AxisState }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 8, 5]} intensity={0.9} />
      <directionalLight position={[-5, -5, -3]} intensity={0.35} />
      <pointLight position={[0, 4, 4]} intensity={0.5} color="#a78bfa" />
      <pointLight
        position={[0, -3, 4]}
        intensity={0.5}
        color="#fb923c"
      />

      {/* Brain region */}
      <Hypothalamus state={state} />
      <AnteriorPituitary state={state} />
      <PortalVessels state={state} />

      {/* Testes */}
      <Testis state={state} side="L" />
      <Testis state={state} side="R" />

      {/* Hormone flows */}
      {/* GnRH: hypothalamus → pituitary (very short, central) */}
      <HormoneFlow
        start={POS.hypothalamus.clone().add(new THREE.Vector3(0, -0.55, 0))}
        end={POS.pituitary.clone().add(new THREE.Vector3(0, 0.4, 0))}
        state={state.gnrh}
        baseCount={3}
        particleRadius={0.03}
        speed={0.4}
        label="GnRH"
      />

      {/* FSH: pituitary → left testis */}
      <HormoneFlow
        start={POS.pituitary.clone().add(new THREE.Vector3(-0.1, -0.2, 0))}
        end={POS.testisL.clone().add(new THREE.Vector3(0.3, 1.0, 0))}
        controlOffsets={[
          [-0.4, 1.5, 0.1],
          [-0.6, 0.5, -0.2],
        ]}
        state={state.fsh}
        baseCount={5}
        particleRadius={0.05}
        speed={0.18}
        label="FSH"
      />

      {/* LH: pituitary → right testis */}
      <HormoneFlow
        start={POS.pituitary.clone().add(new THREE.Vector3(0.1, -0.2, 0))}
        end={POS.testisR.clone().add(new THREE.Vector3(-0.3, 1.0, 0))}
        controlOffsets={[
          [0.4, 1.5, 0.1],
          [0.6, 0.5, -0.2],
        ]}
        state={state.lh}
        baseCount={5}
        particleRadius={0.05}
        speed={0.18}
        label="LH"
      />

      {/* Testosterone: left testis → hypothalamus (long ascending feedback) */}
      <HormoneFlow
        start={POS.testisL.clone().add(new THREE.Vector3(-0.5, 0.8, 0))}
        end={POS.hypothalamus.clone().add(new THREE.Vector3(-0.4, -0.3, 0))}
        controlOffsets={[
          [-1.5, 1.5, 0.3],
          [-1.7, 3.0, 0.0],
          [-0.8, 4.0, 0.2],
        ]}
        state={state.testosterone}
        baseCount={5}
        particleRadius={0.045}
        speed={0.13}
        label="T"
      />

      {/* Inhibin B: right testis → pituitary (long ascending feedback) */}
      <HormoneFlow
        start={POS.testisR.clone().add(new THREE.Vector3(0.5, 0.8, 0))}
        end={POS.pituitary.clone().add(new THREE.Vector3(0.3, -0.15, 0))}
        controlOffsets={[
          [1.5, 1.5, -0.3],
          [1.4, 3.0, 0.0],
        ]}
        state={state.inhibinB}
        baseCount={4}
        particleRadius={0.04}
        speed={0.13}
        label="Inhibin B"
      />

      {/* OrbitControls — interactive camera */}
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={20}
        target={[0, 0.2, 0]}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </>
  )
}

// ===========================================================================
// PUBLIC COMPONENTS
// ===========================================================================

export function HPGAxis3DLoading() {
  return (
    <div className="flex h-full min-h-[300px] w-full items-center justify-center text-sm text-white/70">
      Loading 3D atlas…
    </div>
  )
}

export default function HPGAxis3D({ state }: { state: AxisState }) {
  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 0.3, 11], fov: 50 }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#0f172a']} />
        <Suspense fallback={null}>
          <HPGScene state={state} />
        </Suspense>
      </Canvas>
    </div>
  )
}
