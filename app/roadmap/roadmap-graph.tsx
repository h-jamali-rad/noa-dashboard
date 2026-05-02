'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'

type RoadmapNode = {
  id: string
  title: string
  subtitle: string
  route: string
  from: string
  to: string
  x: number
  y: number
  z: number
}

const ROADMAP_NODES: RoadmapNode[] = [
  {
    id: 'preprocessing',
    title: 'Preprocessing',
    subtitle: 'Data cleaning & feature setup',
    route: '/phase/preprocessing',
    from: '#0ea5e9',
    to: '#2563eb',
    x: 10,
    y: 18,
    z: 10,
  },
  {
    id: 'training',
    title: 'Training',
    subtitle: 'Model training & tuning',
    route: '/phase/training',
    from: '#34d399',
    to: '#16a34a',
    x: 26,
    y: 30,
    z: 58,
  },
  {
    id: 'validation',
    title: 'Validation',
    subtitle: 'Performance & robustness checks',
    route: '/phase/validation',
    from: '#a78bfa',
    to: '#7c3aed',
    x: 44,
    y: 21,
    z: 22,
  },
  {
    id: 'xai',
    title: 'XAI',
    subtitle: 'Interpretability & SHAP insights',
    route: '/xai',
    from: '#fb7185',
    to: '#db2777',
    x: 60,
    y: 33,
    z: 72,
  },
  {
    id: 'cdss',
    title: 'CDSS',
    subtitle: 'Clinical decision support',
    route: '/cdss',
    from: '#22d3ee',
    to: '#0d9488',
    x: 77,
    y: 24,
    z: 34,
  },
  {
    id: 'virtual-defense',
    title: 'Virtual Defense',
    subtitle: 'Expert panel reviews',
    route: '/virtual-defense',
    from: '#f97316',
    to: '#ea580c',
    x: 88,
    y: 40,
    z: 74,
  },
  {
    id: 'post-defense',
    title: 'Post-Defense',
    subtitle: 'Corrective action roadmap',
    route: '/post-defense-actions',
    from: '#f43f5e',
    to: '#be123c',
    x: 74,
    y: 57,
    z: 18,
  },
  {
    id: 'references',
    title: 'References',
    subtitle: 'Evidence base & bibliography',
    route: '/references',
    from: '#eab308',
    to: '#ca8a04',
    x: 57,
    y: 67,
    z: 54,
  },
  {
    id: 'hardware-specs',
    title: 'Hardware Specs',
    subtitle: 'Compute stack details',
    route: '/hardware-specs',
    from: '#94a3b8',
    to: '#64748b',
    x: 38,
    y: 61,
    z: 26,
  },
  {
    id: 'novelty-comparison',
    title: 'Novelty Comparison',
    subtitle: 'Differentiation from prior work',
    route: '/novelty-comparison',
    from: '#c084fc',
    to: '#9333ea',
    x: 20,
    y: 72,
    z: 66,
  },
  {
    id: 'gallery',
    title: 'Gallery',
    subtitle: 'Project figures & visuals',
    route: '/gallery',
    from: '#60a5fa',
    to: '#1d4ed8',
    x: 32,
    y: 84,
    z: 40,
  },
  {
    id: 'about',
    title: 'About',
    subtitle: 'Project context & mission',
    route: '/about',
    from: '#818cf8',
    to: '#4338ca',
    x: 52,
    y: 87,
    z: 12,
  },
  {
    id: 'code-repository',
    title: 'Code Repository',
    subtitle: 'Code, logs, and artifacts',
    route: '/code',
    from: '#38bdf8',
    to: '#0284c7',
    x: 74,
    y: 84,
    z: 52,
  },
]

export default function RoadmapGraph() {
  const router = useRouter()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [tiltByNode, setTiltByNode] = useState<Record<string, { rx: number; ry: number }>>({})

  const connectors = useMemo(() => {
    return ROADMAP_NODES.slice(0, -1).map((node, i) => {
      const target = ROADMAP_NODES[i + 1]
      return {
        id: `${node.id}-${target.id}`,
        start: node,
        end: target,
      }
    })
  }, [])

  const handleNodeClick = (node: RoadmapNode) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setActiveNode(node.id)
    timeoutRef.current = setTimeout(() => {
      router.push(node.route)
    }, 260)
  }

  return (
    <div className="min-h-screen bg-[#05060a] px-4 pb-8 pt-5 text-white md:px-8">
      <div className="mx-auto w-full max-w-[1400px] space-y-5">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-4xl">
            نقشه‌ راه سه‌بعدی پروژه | 3D Project Roadmap
          </h1>
          <p className="mx-auto max-w-3xl text-sm text-slate-300 md:text-base">
            Hover each node for 3D tilt, click to focus and navigate. The roadmap follows the full project journey from preprocessing to repository artifacts.
          </p>
        </div>

        <div
          className="relative h-[calc(100vh-12.5rem)] min-h-[760px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#080a12] via-[#090b14] to-[#06070d] [perspective:1500px]"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = (e.clientX - rect.left) / rect.width - 0.5
            const y = (e.clientY - rect.top) / rect.height - 0.5
            setParallax({ x: x * 16, y: y * 14 })
          }}
          onMouseLeave={() => setParallax({ x: 0, y: 0 })}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.14),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(192,132,252,0.14),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(34,211,238,0.12),transparent_35%)]" />

          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            <defs>
              <marker id="roadmap-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(148, 163, 184, 0.65)" />
              </marker>
            </defs>

            {connectors.map((edge, i) => {
              const x1 = edge.start.x
              const y1 = edge.start.y
              const x2 = edge.end.x
              const y2 = edge.end.y
              const cx1 = x1 + (x2 - x1) * 0.35
              const cx2 = x1 + (x2 - x1) * 0.65
              const c1y = y1 + (i % 2 === 0 ? -5 : 5)
              const c2y = y2 + (i % 2 === 0 ? 5 : -5)
              const path = `M ${x1}% ${y1}% C ${cx1}% ${c1y}%, ${cx2}% ${c2y}%, ${x2}% ${y2}%`

              return (
                <motion.path
                  key={edge.id}
                  d={path}
                  fill="none"
                  stroke="rgba(148,163,184,0.45)"
                  strokeWidth="1.8"
                  markerEnd="url(#roadmap-arrow)"
                  initial={{ pathLength: 0.1, opacity: 0.35 }}
                  animate={{ pathLength: [0.25, 1], opacity: [0.25, 0.8, 0.25] }}
                  transition={{ duration: 2.6, ease: 'easeInOut', repeat: Infinity, delay: i * 0.09 }}
                  strokeDasharray="7 9"
                />
              )
            })}
          </svg>

          {ROADMAP_NODES.map((node, idx) => {
            const tilt = tiltByNode[node.id] ?? { rx: 0, ry: 0 }
            const depthFactor = Math.max(0.2, node.z / 100)
            const isActive = activeNode === node.id

            return (
              <motion.div
                key={node.id}
                className="absolute"
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  zIndex: 20 + idx,
                  transform: `translate(-50%, -50%) translate3d(${parallax.x * depthFactor}px, ${parallax.y * depthFactor}px, ${node.z}px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                  transformStyle: 'preserve-3d',
                }}
                animate={{
                  scale: isActive ? 1.08 : 1,
                  filter: isActive ? 'brightness(1.18)' : 'brightness(1)',
                }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              >
                <motion.button
                  type="button"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const px = (e.clientX - rect.left) / rect.width - 0.5
                    const py = (e.clientY - rect.top) / rect.height - 0.5
                    setTiltByNode((prev) => ({
                      ...prev,
                      [node.id]: { rx: -py * 11, ry: px * 12 },
                    }))
                  }}
                  onMouseLeave={() => {
                    setTiltByNode((prev) => ({
                      ...prev,
                      [node.id]: { rx: 0, ry: 0 },
                    }))
                  }}
                  onClick={() => handleNodeClick(node)}
                  whileHover={{ scale: 1.06, y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  className="group relative w-[170px] rounded-2xl border border-white/20 px-4 py-3 text-left shadow-2xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-300/70 md:w-[186px]"
                  style={{
                    background: `linear-gradient(140deg, ${node.from}E6 0%, ${node.to}CC 52%, #0b1224 100%)`,
                    boxShadow: `0 20px 40px rgba(2, 6, 23, 0.62), 0 8px 28px ${node.to}55`,
                  }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-60"
                    style={{ background: `radial-gradient(circle at 30% 20%, ${node.from}, transparent 62%)` }}
                  />

                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20"
                    style={{ transform: 'translateZ(-16px)' }}
                  />

                  <p className="relative text-base font-semibold leading-tight tracking-[0.01em] text-white md:text-[1.02rem]">
                    {node.title}
                  </p>
                  <p className="relative mt-1 text-xs leading-relaxed text-slate-100/95 md:text-[12.5px]">
                    {node.subtitle}
                  </p>
                </motion.button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
