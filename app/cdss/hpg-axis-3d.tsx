'use client'

/**
 * HPGAxis3D — Real 3D anatomical atlas (.glb models)
 * --------------------------------------------------------------------------
 * Interactive 3D atlas of the Hypothalamic-Pituitary-Gonadal (HPG) axis,
 * rendering REAL 3D anatomical models (.glb) instead of procedural geometry.
 *
 * Models loaded from /public/models/:
 *   - brain.glb     — real human brain (head, used for hypothalamus highlight)
 *   - pituitary.glb — anterior/posterior lobes + infundibular stalk
 *   - testis.glb    — testis body + tunica + epididymis + vas deferens cross
 *
 * Additional procedurally-built content (not in the .glb files):
 *   - Subtle human body silhouette (wireframe torso outline) for context
 *   - Hypophyseal portal vessels (3 thin tubes connecting hypothalamus → pituitary)
 *   - Animated hormone particle flows along CatmullRomCurve3 paths:
 *       GnRH, FSH, LH, Testosterone, Inhibin B
 *   - Pathology cues:
 *       - Atrophic testis: scale 0.65×, desaturated, slightly transparent
 *       - Compensating pituitary: 1.3× enlarged + sin-pulsing animation
 *       - Damaged structures: red tint + dimmed
 *       - Weak flows: fewer/slower/smaller particles
 *
 * Tooltips use `drei/Html` with **inline-style white text on dark bg** so
 * they remain legible regardless of the page/parent CSS theme.
 *
 * IMPORTANT: this file MUST be loaded via `next/dynamic({ ssr: false })`
 * because Three.js cannot render under Next.js SSR.
 * --------------------------------------------------------------------------
 */

import { Suspense, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// ---------------------------------------------------------------------------
// Asset paths
// ---------------------------------------------------------------------------

const BRAIN_URL = '/models/brain.glb'
const PITUITARY_URL = '/models/pituitary.glb'
const TESTIS_URL = '/models/testis.glb'

// Preload (Next.js client-side; safe — wrapped in try/catch in case the
// module is imported in an unsupported env).
try {
  useGLTF.preload(BRAIN_URL)
  useGLTF.preload(PITUITARY_URL)
  useGLTF.preload(TESTIS_URL)
} catch {
  /* noop */
}

// ---------------------------------------------------------------------------
// AxisState type (single source of truth — re-imported by clinical file)
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
// Color palette
// ---------------------------------------------------------------------------

const PALETTE = {
  normal: '#22c55e',
  compensating: '#f59e0b',
  abnormal: '#ef4444',
  faded: '#64748b',
  brainTissue: '#cbd5e1',
  pituitaryTissue: '#fde68a',
  testisTissue: '#e2e8f0',
  silhouette: '#475569',
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
  if (s === 'normal' || s === 'pulsing') return PALETTE.normal
  if (s === 'compensating') return PALETTE.compensating
  if (s === 'faded') return PALETTE.faded
  return PALETTE.abnormal
}

// ---------------------------------------------------------------------------
// AxisState merge — field-wise worst-case across multiple conditions
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
// Scene positions
// ---------------------------------------------------------------------------

const POS = {
  brain: new THREE.Vector3(0, 4.3, 0),
  hypothalamus: new THREE.Vector3(0, 3.7, 0.05),
  pituitary: new THREE.Vector3(0, 2.85, 0),
  testisL: new THREE.Vector3(-1.6, -3.4, 0),
  testisR: new THREE.Vector3(1.6, -3.4, 0),
} as const

// ---------------------------------------------------------------------------
// Tooltip metadata — verbatim medical descriptions
// ---------------------------------------------------------------------------

type TooltipKey =
  | 'hypothalamus'
  | 'pituitary'
  | 'portal'
  | 'tunica'
  | 'tubules'
  | 'sertoli'
  | 'leydig'
  | 'rete'
  | 'epididymis'

const TOOLTIPS: Record<TooltipKey, { name: string; description: string }> = {
  hypothalamus: {
    name: 'Hypothalamus',
    description:
      'Neuroendocrine command center. Releases GnRH in pulsatile fashion (~every 90 min) to regulate the reproductive axis.',
  },
  pituitary: {
    name: 'Anterior Pituitary',
    description:
      'Adenohypophysis. Gonadotroph cells produce FSH and LH in response to GnRH stimulation.',
  },
  portal: {
    name: 'Portal Vessels',
    description:
      'Hypophyseal portal system. Carries GnRH directly from hypothalamus to anterior pituitary, bypassing systemic circulation.',
  },
  tunica: {
    name: 'Tunica Albuginea',
    description:
      'Dense white fibrous capsule (0.5-1mm thick) surrounding testicular parenchyma.',
  },
  tubules: {
    name: 'Seminiferous Tubules',
    description:
      'Site of spermatogenesis. ~600-1200 per testis, ~80cm long each. Contains Sertoli cells and germ cells at various stages.',
  },
  sertoli: {
    name: 'Sertoli Cells',
    description:
      'Nurse cells supporting spermatogenesis. Produce Inhibin B, AMH, and form the blood-testis barrier.',
  },
  leydig: {
    name: 'Leydig Cells',
    description:
      'Interstitial endocrine cells. Primary source of testosterone (~7mg/day) in response to LH stimulation.',
  },
  rete: {
    name: 'Rete Testis',
    description:
      'Anastomosing network of delicate tubules collecting sperm from straight tubules (tubuli recti).',
  },
  epididymis: {
    name: 'Epididymis',
    description:
      '6m coiled duct for sperm maturation (10-14 days), capacitation, and storage.',
  },
}

// ---------------------------------------------------------------------------
// Tooltip rendering — inline-styled, white-on-dark, always legible
// ---------------------------------------------------------------------------

function HoverTooltip({
  visible,
  data,
  position,
}: {
  visible: boolean
  data: { name: string; description: string }
  position: [number, number, number]
}) {
  if (!visible) return null
  return (
    <Html
      position={position}
      center
      distanceFactor={6}
      style={{ pointerEvents: 'none' }}
      zIndexRange={[100, 0]}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.92)',
          color: '#ffffff',
          padding: '10px 14px',
          borderRadius: 8,
          fontSize: 13,
          maxWidth: 260,
          minWidth: 200,
          pointerEvents: 'none',
          border: '1px solid rgba(255,255,255,0.25)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto',
          textAlign: 'left',
          lineHeight: 1.4,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            marginBottom: 5,
            color: '#60a5fa',
            fontSize: 13,
          }}
        >
          {data.name}
        </div>
        <div style={{ fontSize: 11.5, color: '#e2e8f0' }}>
          {data.description}
        </div>
      </div>
    </Html>
  )
}

// ---------------------------------------------------------------------------
// Hoverable wrapper — pointer events + tooltip
// ---------------------------------------------------------------------------

function Hoverable({
  tooltipKey,
  tooltipPosition = [0, 1.0, 0],
  position,
  children,
}: {
  tooltipKey: TooltipKey
  tooltipPosition?: [number, number, number]
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
        if (typeof document !== 'undefined')
          document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        setHover(false)
        if (typeof document !== 'undefined')
          document.body.style.cursor = 'default'
      }}
    >
      {children}
      <HoverTooltip
        visible={hover}
        data={TOOLTIPS[tooltipKey]}
        position={tooltipPosition}
      />
    </group>
  )
}

// ===========================================================================
// GLB MODEL HELPERS
// ===========================================================================

/** Compute a normalisation transform (offset + scale) so the loaded model
 *  fits inside a target sphere of the given radius around the origin.
 *  Returns the scale factor and centroid (to subtract).                     */
function fitToSphere(
  scene: THREE.Object3D,
  targetRadius: number
): { scale: number; center: THREE.Vector3 } {
  const box = new THREE.Box3().setFromObject(scene)
  const size = new THREE.Vector3()
  box.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const scale = (targetRadius * 2) / maxDim
  const center = new THREE.Vector3()
  box.getCenter(center)
  return { scale, center }
}

// ---------------------------------------------------------------------------
// Brain — semi-transparent context with highlighted hypothalamus core
// ---------------------------------------------------------------------------

function BrainModel({ state }: { state: AxisState }) {
  const gltf = useGLTF(BRAIN_URL) as unknown as { scene: THREE.Object3D }
  const cloned = useMemo(() => gltf.scene.clone(true), [gltf.scene])
  const { scale, center } = useMemo(
    () => fitToSphere(cloned, 0.9),
    [cloned]
  )

  // Apply semi-transparent gray brain-tissue material to every mesh.
  useMemo(() => {
    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: PALETTE.brainTissue,
          roughness: 0.6,
          metalness: 0.0,
          transparent: true,
          opacity: 0.35,
          clearcoat: 0.4,
          clearcoatRoughness: 0.5,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
        mesh.castShadow = false
        mesh.receiveShadow = false
        // Disable raycast on the brain mass — only the hypothalamus
        // highlight sphere should respond to hover, otherwise the
        // huge brain mesh blocks every other tooltip behind it.
        mesh.raycast = () => {}
      }
    })
  }, [cloned])

  return (
    <group position={[POS.brain.x, POS.brain.y, POS.brain.z]}>
      <primitive
        object={cloned}
        scale={[scale, scale, scale]}
        position={[-center.x * scale, -center.y * scale, -center.z * scale]}
      />
      <HypothalamusHighlight state={state} />
    </group>
  )
}

// ---------------------------------------------------------------------------
// Hypothalamus highlight — small glowing sphere at the brain base center
// ---------------------------------------------------------------------------

function HypothalamusHighlight({ state }: { state: AxisState }) {
  const colour = stateColor(state.hypothalamus)
  const isFaded = state.hypothalamus === 'faded'
  const haloRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (haloRef.current) {
      const s = 1.0 + 0.08 * Math.sin(clock.elapsedTime * 2.5)
      haloRef.current.scale.setScalar(s)
    }
  })

  return (
    <Hoverable
      tooltipKey="hypothalamus"
      // hypothalamus sits at the base/center of the brain — offset down a touch
      position={[0, -0.55, 0.1]}
      tooltipPosition={[0, 0.8, 0]}
    >
      {/* Solid core */}
      <mesh>
        <sphereGeometry args={[0.18, 32, 24]} />
        <meshPhysicalMaterial
          color={colour}
          emissive={colour}
          emissiveIntensity={isFaded ? 0.2 : 0.9}
          metalness={0.1}
          roughness={0.4}
          transparent
          opacity={isFaded ? 0.6 : 1.0}
        />
      </mesh>
      {/* Inner glow halo (pulsing) */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.26, 24, 18]} />
        <meshBasicMaterial
          color={colour}
          transparent
          opacity={isFaded ? 0.1 : 0.22}
        />
      </mesh>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.4, 16, 12]} />
        <meshBasicMaterial
          color={colour}
          transparent
          opacity={isFaded ? 0.04 : 0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </Hoverable>
  )
}

// ---------------------------------------------------------------------------
// Pituitary model
// ---------------------------------------------------------------------------

function PituitaryModel({ state }: { state: AxisState }) {
  const gltf = useGLTF(PITUITARY_URL) as unknown as { scene: THREE.Object3D }
  const cloned = useMemo(() => gltf.scene.clone(true), [gltf.scene])
  const { scale, center } = useMemo(
    () => fitToSphere(cloned, 0.32),
    [cloned]
  )

  const colour = stateColor(state.pituitary)
  const isFaded = state.pituitary === 'faded'
  const isCompensating = state.pituitary === 'compensating'

  // Re-skin every mesh inside the GLB with a state-coloured material.
  useMemo(() => {
    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: PALETTE.pituitaryTissue,
          roughness: 0.45,
          metalness: 0.05,
          clearcoat: 0.6,
          clearcoatRoughness: 0.4,
          emissive: colour,
          emissiveIntensity: isFaded ? 0.05 : 0.3,
          transparent: true,
          opacity: isFaded ? 0.6 : 0.97,
        })
        mesh.raycast = () => {}
      }
    })
  }, [cloned, colour, isFaded])

  const groupRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    if (isCompensating) {
      const s = 1.3 + 0.1 * Math.sin(clock.elapsedTime * 4)
      groupRef.current.scale.setScalar(s)
    } else {
      groupRef.current.scale.setScalar(1.0)
    }
  })

  return (
    <Hoverable
      tooltipKey="pituitary"
      position={[POS.pituitary.x, POS.pituitary.y, POS.pituitary.z]}
      tooltipPosition={[0, 0.7, 0]}
    >
      <group ref={groupRef}>
        <primitive
          object={cloned}
          scale={[scale, scale, scale]}
          position={[
            -center.x * scale,
            -center.y * scale,
            -center.z * scale,
          ]}
        />
        {/* Outline halo */}
        <mesh>
          <sphereGeometry args={[0.55, 24, 18]} />
          <meshBasicMaterial
            color={colour}
            transparent
            opacity={isCompensating ? 0.22 : isFaded ? 0.05 : 0.13}
            side={THREE.BackSide}
          />
        </mesh>
        {/* Pickup sphere for hover (invisible) */}
        <mesh>
          <sphereGeometry args={[0.5, 16, 12]} />
          <meshBasicMaterial color={colour} transparent opacity={0.001} />
        </mesh>
      </group>
    </Hoverable>
  )
}

// ---------------------------------------------------------------------------
// Portal Vessels — 3 branching tubes hypothalamus → pituitary + blood flow
// ---------------------------------------------------------------------------

function PortalVessels({ state }: { state: AxisState }) {
  const colour = stateColor(state.vessels)
  const isFaded = state.vessels === 'faded'

  const vessels = useMemo(() => {
    const make = (pts: THREE.Vector3[], r: number) => {
      const curve = new THREE.CatmullRomCurve3(pts)
      const geom = new THREE.TubeGeometry(curve, 40, r, 8, false)
      return { geom, curve }
    }
    return [
      make(
        [
          new THREE.Vector3(0, 3.6, 0.05),
          new THREE.Vector3(0, 3.35, 0.05),
          new THREE.Vector3(0, 3.1, 0.0),
        ],
        0.025
      ),
      make(
        [
          new THREE.Vector3(-0.08, 3.6, 0.05),
          new THREE.Vector3(-0.14, 3.4, 0),
          new THREE.Vector3(-0.1, 3.15, -0.02),
          new THREE.Vector3(-0.04, 2.95, 0),
        ],
        0.018
      ),
      make(
        [
          new THREE.Vector3(0.08, 3.6, 0.05),
          new THREE.Vector3(0.14, 3.4, 0),
          new THREE.Vector3(0.1, 3.15, -0.02),
          new THREE.Vector3(0.04, 2.95, 0),
        ],
        0.018
      ),
    ]
  }, [])

  // Blood-flow particles
  const particles = useRef<Array<{ t: number; speed: number }>>(
    Array.from({ length: 5 }, () => ({
      t: Math.random(),
      speed: 0.18 + Math.random() * 0.12,
    }))
  )
  const particleRefs = useRef<Array<THREE.Mesh | null>>([])

  useFrame((_, dt) => {
    const curve = vessels[0]?.curve
    if (!curve) return
    particles.current.forEach((p, i) => {
      p.t = (p.t + p.speed * dt * (isFaded ? 0.3 : 1)) % 1
      const m = particleRefs.current[i]
      if (m) m.position.copy(curve.getPoint(p.t))
    })
  })

  return (
    <Hoverable tooltipKey="portal" tooltipPosition={[0.4, 3.35, 0]}>
      {vessels.map((v, i) => (
        <mesh
          key={i}
          geometry={v.geom}
          raycast={i === 0 ? undefined : () => {}}
        >
          <meshStandardMaterial
            color="#7f1d1d"
            transparent
            opacity={isFaded ? 0.35 : 0.85}
            emissive={colour}
            emissiveIntensity={isFaded ? 0.05 : 0.18}
          />
        </mesh>
      ))}
      {particles.current.map((_, i) => (
        <mesh
          key={`p${i}`}
          ref={(el) => {
            particleRefs.current[i] = el
          }}
        >
          <sphereGeometry args={[0.022, 8, 6]} />
          <meshBasicMaterial color={colour} />
        </mesh>
      ))}
    </Hoverable>
  )
}

// ---------------------------------------------------------------------------
// Testis model — left & right
// ---------------------------------------------------------------------------

function TestisModel({
  state,
  side,
}: {
  state: AxisState
  side: 'L' | 'R'
}) {
  const gltf = useGLTF(TESTIS_URL) as unknown as { scene: THREE.Object3D }
  // CRITICAL: clone for each instance so they have independent materials
  const cloned = useMemo(() => gltf.scene.clone(true), [gltf.scene, side])
  const { scale, center } = useMemo(() => fitToSphere(cloned, 0.9), [cloned])

  const isAtrophic = state.testis === 'atrophic'
  const isDamaged = state.testis === 'damaged'
  const isFaded = state.testis === 'faded'
  const testisColour = stateColor(state.testis)

  const sizeMul = isAtrophic ? 0.65 : isDamaged ? 0.85 : 1.0

  // Apply state-coloured material to all submeshes
  useMemo(() => {
    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const name = (mesh.name || '').toLowerCase()
        // Try to detect epididymis-like submeshes by name; default to body
        const isEpi = /epi|duct|vas/.test(name)
        const tint = isEpi
          ? '#fcd34d'
          : PALETTE.testisTissue
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: tint,
          roughness: 0.5,
          metalness: 0.05,
          clearcoat: 0.5,
          clearcoatRoughness: 0.5,
          emissive: testisColour,
          emissiveIntensity: isFaded ? 0.05 : 0.18,
          transparent: true,
          opacity: isFaded ? 0.55 : isDamaged ? 0.82 : 0.95,
          side: THREE.DoubleSide,
        })
        mesh.raycast = () => {}
      }
    })
  }, [cloned, testisColour, isFaded, isDamaged])

  const center3 = side === 'L' ? POS.testisL : POS.testisR
  const mirror = side === 'L' ? -1 : 1

  return (
    <group
      position={[center3.x, center3.y, center3.z]}
      scale={[sizeMul, sizeMul, sizeMul]}
    >
      {/* Tunica albuginea hover region — outer shell of the testis */}
      <Hoverable tooltipKey="tunica" tooltipPosition={[0, 1.0, 0]}>
        <primitive
          object={cloned}
          scale={[scale, scale, scale]}
          position={[
            -center.x * scale,
            -center.y * scale,
            -center.z * scale,
          ]}
        />
        {/* Subtle outline halo around the testis */}
        <mesh>
          <sphereGeometry args={[1.05, 32, 24]} />
          <meshBasicMaterial
            color={testisColour}
            transparent
            opacity={isFaded ? 0.05 : 0.1}
            side={THREE.BackSide}
          />
        </mesh>
      </Hoverable>

      {/* Tubule / Sertoli / Leydig / Rete hover regions (overlaid)         */}
      {/* These invisible pickup spheres allow the same testis model to     */}
      {/* surface multiple distinct tooltips for sub-structures the .glb    */}
      {/* doesn't separately label.                                          */}

      {/* Seminiferous tubules — central */}
      <Hoverable
        tooltipKey="tubules"
        position={[0, 0.0, 0.55]}
        tooltipPosition={[0, 0.45, 0]}
      >
        <mesh>
          <sphereGeometry args={[0.3, 14, 10]} />
          <meshBasicMaterial
            color={stateColor(state.tubules)}
            transparent
            opacity={0.001}
          />
        </mesh>
      </Hoverable>

      {/* Sertoli cells — inside-the-tubules pocket */}
      <Hoverable
        tooltipKey="sertoli"
        position={[mirror * 0.2, -0.1, 0.55]}
        tooltipPosition={[0, 0.45, 0]}
      >
        <mesh>
          <sphereGeometry args={[0.18, 12, 8]} />
          <meshBasicMaterial
            color={stateColor(state.sertoli)}
            transparent
            opacity={0.001}
          />
        </mesh>
      </Hoverable>

      {/* Leydig cells — interstitial */}
      <Hoverable
        tooltipKey="leydig"
        position={[-mirror * 0.3, 0.2, 0.45]}
        tooltipPosition={[0, 0.5, 0]}
      >
        <mesh>
          <sphereGeometry args={[0.18, 12, 8]} />
          <meshBasicMaterial
            color={stateColor(state.leydig)}
            transparent
            opacity={0.001}
          />
        </mesh>
      </Hoverable>

      {/* Rete testis — mediastinal side */}
      <Hoverable
        tooltipKey="rete"
        position={[mirror * 0.7, 0.05, 0.0]}
        tooltipPosition={[mirror * 0.6, 0.3, 0]}
      >
        <mesh>
          <sphereGeometry args={[0.18, 12, 8]} />
          <meshBasicMaterial
            color={stateColor(state.testis)}
            transparent
            opacity={0.001}
          />
        </mesh>
      </Hoverable>

      {/* Epididymis — coiled tube alongside */}
      <Hoverable
        tooltipKey="epididymis"
        position={[mirror * 0.95, 0.2, 0.1]}
        tooltipPosition={[mirror * 0.5, 0.4, 0]}
      >
        <mesh>
          <sphereGeometry args={[0.28, 14, 10]} />
          <meshBasicMaterial
            color={stateColor(state.epididymis)}
            transparent
            opacity={0.001}
          />
        </mesh>
      </Hoverable>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Body silhouette — subtle wireframe torso outline for anatomical context
// ---------------------------------------------------------------------------

function BodySilhouette() {
  // Two columns of points: left and right profile of a simple
  // head + neck + torso + groin silhouette, sampled in (x, y) pairs.
  const outlinePoints = useMemo(() => {
    // Right half of the silhouette (mirrored for the left)
    const right: Array<[number, number]> = [
      [0.0, 5.4], // top of head
      [0.55, 5.3],
      [0.8, 5.0],
      [0.9, 4.6], // side of head
      [0.85, 4.2],
      [0.65, 3.95], // jaw / chin
      [0.4, 3.85], // neck top
      [0.45, 3.4], // neck bottom
      [0.95, 3.2], // shoulder
      [1.85, 2.95], // outer shoulder
      [2.1, 2.2], // upper arm out
      [2.25, 1.0], // outer elbow
      [2.25, -0.3], // forearm
      [2.1, -1.2], // wrist
      [2.05, -1.6], // hand
      [1.95, -2.05],
      [1.7, -1.8], // back to side
      [1.55, -1.4], // waist
      [1.45, -0.7], // lower torso
      [1.55, 0.0], // waist mid
      [1.65, 1.3], // chest
      [1.55, 2.4], // upper chest
      [1.0, 2.7], // collarbone
      // Lower body
    ]
    const lower: Array<[number, number]> = [
      [1.55, -1.4],
      [1.55, -2.4], // hip
      [1.65, -3.0], // outer thigh
      [1.55, -3.8], // mid thigh
      [1.4, -4.6],
      [1.25, -5.2],
      [1.0, -5.6],
      [0.7, -5.6], // ankle
      [0.55, -5.3],
      [0.4, -4.8], // inner thigh top
      [0.25, -4.0],
      [0.1, -3.5], // groin
    ]
    const half = [...right, ...lower]
    // Build a closed loop: right side top→bottom, then mirrored left
    // side bottom→top, back to start.
    const pts: THREE.Vector3[] = []
    for (const [x, y] of half) pts.push(new THREE.Vector3(x, y, 0))
    for (let i = half.length - 1; i >= 0; i--) {
      const [x, y] = half[i]
      pts.push(new THREE.Vector3(-x, y, 0))
    }
    return pts
  }, [])

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(outlinePoints)
    return g
  }, [outlinePoints])

  return (
    <group position={[0, 0, -1.6]} raycast={() => {}}>
      <lineLoop>
        <primitive attach="geometry" object={geom} />
        <lineBasicMaterial
          color={PALETTE.silhouette}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </lineLoop>
      {/* Subtle filled silhouette behind */}
      <mesh raycast={() => {}}>
        <primitive
          attach="geometry"
          object={makeFilledOutline(outlinePoints)}
        />
        <meshBasicMaterial
          color={PALETTE.silhouette}
          transparent
          opacity={0.06}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

// Build a filled-shape geometry from a closed 2D polygon (z=0 plane).
function makeFilledOutline(points: THREE.Vector3[]): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  if (points.length === 0) return new THREE.BufferGeometry()
  shape.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i].x, points[i].y)
  }
  shape.closePath()
  return new THREE.ShapeGeometry(shape)
}

// ===========================================================================
// HORMONE FLOWS
// ===========================================================================

type FlowState =
  | 'normal'
  | 'pulsing'
  | 'faded'
  | 'suppressed'
  | 'weak'
  | 'broken'
  | 'absent'

function HormoneFlow({
  start,
  end,
  controls = [],
  state,
  label,
  labelOffset = [0, 0, 0],
  baseCount = 6,
  particleRadius = 0.05,
  speed = 0.18,
}: {
  start: THREE.Vector3
  end: THREE.Vector3
  controls?: Array<[number, number, number]>
  state: FlowState
  label: string
  labelOffset?: [number, number, number]
  baseCount?: number
  particleRadius?: number
  speed?: number
}) {
  const colour = stateColor(state)
  const isWeak =
    state === 'weak' || state === 'faded' || state === 'suppressed'
  const isBroken = state === 'broken' || state === 'absent'

  const count = isBroken ? 0 : isWeak ? 2 : baseCount
  const speedMul = isBroken ? 0 : isWeak ? 0.35 : 1
  const sizeMul = isWeak ? 0.7 : 1

  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = [start.clone()]
    for (const c of controls) {
      pts.push(
        new THREE.Vector3(
          (start.x + end.x) / 2 + c[0],
          (start.y + end.y) / 2 + c[1],
          (start.z + end.z) / 2 + c[2]
        )
      )
    }
    pts.push(end.clone())
    return new THREE.CatmullRomCurve3(pts)
  }, [start, end, controls])

  const tubeGeom = useMemo(
    () => new THREE.TubeGeometry(curve, 64, 0.012, 6, false),
    [curve]
  )

  const particles = useRef<Array<{ t: number }>>(
    Array.from({ length: count }, (_, i) => ({ t: i / Math.max(count, 1) }))
  )
  const refs = useRef<Array<THREE.Mesh | null>>([])

  useFrame((_, dt) => {
    particles.current.forEach((p, i) => {
      p.t = (p.t + speed * speedMul * dt) % 1
      const m = refs.current[i]
      if (m) m.position.copy(curve.getPoint(p.t))
    })
  })

  // 3D text label at the curve midpoint + labelOffset
  const labelPos = useMemo(() => {
    const mid = curve.getPoint(0.5)
    return new THREE.Vector3(
      mid.x + labelOffset[0],
      mid.y + labelOffset[1],
      mid.z + labelOffset[2]
    )
  }, [curve, labelOffset])

  return (
    <group>
      {/* Path tube — subtle backdrop */}
      <mesh geometry={tubeGeom} raycast={() => {}}>
        <meshBasicMaterial
          color={colour}
          transparent
          opacity={isBroken ? 0.12 : 0.4}
        />
      </mesh>
      {/* Animated particles */}
      {particles.current.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
        >
          <sphereGeometry args={[particleRadius * sizeMul, 10, 8]} />
          <meshBasicMaterial color={colour} transparent opacity={0.95} />
        </mesh>
      ))}
      {/* HTML label (white text on dark bg pill) */}
      <Html
        position={[labelPos.x, labelPos.y, labelPos.z]}
        center
        distanceFactor={9}
        style={{ pointerEvents: 'none' }}
        zIndexRange={[50, 0]}
      >
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#ffffff',
            border: `1px solid ${colour}`,
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.3,
            whiteSpace: 'nowrap',
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto',
          }}
        >
          {label}
        </div>
      </Html>
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
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 8, 5]} intensity={0.85} />
      <directionalLight position={[-5, 4, -3]} intensity={0.35} />
      {/* Hypothalamus spotlight — dramatic */}
      <spotLight
        position={[0, 6, 4]}
        target-position={[0, 3.7, 0]}
        angle={0.5}
        penumbra={0.6}
        intensity={1.1}
        color="#a78bfa"
      />
      {/* Testis warm fill */}
      <pointLight
        position={[0, -3, 4]}
        intensity={0.45}
        color="#fb923c"
      />

      {/* Body silhouette — anatomical context */}
      <BodySilhouette />

      {/* GLB models with hover regions */}
      <Suspense fallback={null}>
        <BrainModel state={state} />
        <PituitaryModel state={state} />
        <PortalVessels state={state} />
        <TestisModel state={state} side="L" />
        <TestisModel state={state} side="R" />
      </Suspense>

      {/* Hormone flows */}
      <HormoneFlow
        start={POS.hypothalamus.clone()}
        end={POS.pituitary.clone().add(new THREE.Vector3(0, 0.3, 0))}
        state={state.gnrh}
        label="GnRH"
        labelOffset={[0.35, 0, 0]}
        baseCount={3}
        particleRadius={0.035}
        speed={0.45}
      />
      <HormoneFlow
        start={POS.pituitary.clone().add(new THREE.Vector3(-0.15, -0.2, 0))}
        end={POS.testisL.clone().add(new THREE.Vector3(0.3, 1.0, 0))}
        controls={[
          [-0.5, 1.7, 0.2],
          [-0.7, 0.5, -0.2],
        ]}
        state={state.fsh}
        label="FSH"
        labelOffset={[-0.5, 0.2, 0]}
        baseCount={5}
        particleRadius={0.05}
        speed={0.18}
      />
      <HormoneFlow
        start={POS.pituitary.clone().add(new THREE.Vector3(0.15, -0.2, 0))}
        end={POS.testisR.clone().add(new THREE.Vector3(-0.3, 1.0, 0))}
        controls={[
          [0.5, 1.7, 0.2],
          [0.7, 0.5, -0.2],
        ]}
        state={state.lh}
        label="LH"
        labelOffset={[0.5, 0.2, 0]}
        baseCount={5}
        particleRadius={0.05}
        speed={0.18}
      />
      {/* Testosterone feedback: left testis → hypothalamus (wide left arc) */}
      <HormoneFlow
        start={POS.testisL.clone().add(new THREE.Vector3(-0.6, 0.8, 0))}
        end={POS.hypothalamus
          .clone()
          .add(new THREE.Vector3(-0.45, -0.25, 0))}
        controls={[
          [-1.8, 1.5, 0.3],
          [-2.0, 3.5, 0.1],
          [-1.0, 4.3, 0.0],
        ]}
        state={state.testosterone}
        label="Testosterone"
        labelOffset={[-0.9, 0, 0]}
        baseCount={5}
        particleRadius={0.045}
        speed={0.13}
      />
      {/* Inhibin B feedback: right testis → pituitary (wide right arc) */}
      <HormoneFlow
        start={POS.testisR.clone().add(new THREE.Vector3(0.6, 0.8, 0))}
        end={POS.pituitary.clone().add(new THREE.Vector3(0.35, -0.15, 0))}
        controls={[
          [1.8, 1.5, -0.3],
          [1.6, 3.2, 0.0],
        ]}
        state={state.inhibinB}
        label="Inhibin B"
        labelOffset={[0.9, 0, 0]}
        baseCount={4}
        particleRadius={0.04}
        speed={0.13}
      />

      {/* OrbitControls */}
      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={22}
        target={[0, 0.0, 0]}
        autoRotate
        autoRotateSpeed={0.5}
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
        camera={{ position: [0, 0.3, 13], fov: 50 }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#0f172a']} />
        <Suspense fallback={null}>
          <HPGScene state={state} />
        </Suspense>
      </Canvas>
    </div>
  )
}
