'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/* ── colour palette per category ── */
const CAT_COLORS: Record<string, string> = {
  root: '#a78bfa',
  preprocessing: '#3b82f6',
  training: '#22c55e',
  validation: '#a855f7',
  xai: '#f97316',
  literature: '#eab308',
  integration: '#06b6d4',
  defense: '#ec4899',
  postdefense: '#f43f5e',
  cdss: '#14b8a6',
  novelty: '#8b5cf6',
  infrastructure: '#64748b',
}

type GNode = {
  id: string
  label: string
  category: string
  link?: string
  description?: string
  val: number
  x: number
  y: number
  vx: number
  vy: number
}

type GLink = { source: string; target: string }

function buildGraphData(): { nodes: GNode[]; links: GLink[] } {
  const nodes: GNode[] = []
  const links: GLink[] = []

  const add = (n: Omit<GNode, 'x' | 'y' | 'vx' | 'vy'>, parentId?: string) => {
    nodes.push({ ...n, x: 0, y: 0, vx: 0, vy: 0 })
    if (parentId) links.push({ source: parentId, target: n.id })
  }

  add({ id: 'root', label: 'NOA Micro-TESE\nML Prediction Project', category: 'root', val: 30, description: 'Complete PhD research project: end-to-end ML pipeline for predicting sperm retrieval success in NOA patients' })

  // 1 — Preprocessing
  add({ id: 'preprocessing', label: 'Data\nPreprocessing', category: 'preprocessing', link: '/phase/preprocessing', val: 18, description: 'Phase 1: Data cleaning, feature engineering, imputation & scaling' }, 'root')
  ;[
    { id: 'pp-collect', label: 'Data Collection\n(2450 patients)', description: 'Screened cohort from Royan Institute' },
    { id: 'pp-clean', label: 'Data Cleaning\n(regex, 221 SCO)', description: 'Regex-based corrections, 221 SCO label fixes' },
    { id: 'pp-feat', label: 'Feature Eng.\n(55→73)', description: '16 pathology indicators + derived features' },
    { id: 'pp-missing', label: 'KNN\nImputation', description: 'KNN imputation for missing data' },
    { id: 'pp-scale', label: 'RobustScaler', description: 'RobustScaler for outlier-resistant normalization' },
  ].forEach(s => add({ ...s, category: 'preprocessing', val: 7 }, 'preprocessing'))

  // 2 — Training
  add({ id: 'training', label: 'Model\nTraining', category: 'training', link: '/phase/training', val: 18, description: 'Phase 2: 16 models evaluated with nested cross-validation' }, 'root')
  ;[
    { id: 'tr-models', label: '16 Models\nEvaluated', description: 'LightGBM, XGBoost, SVM, RF, and 12 more' },
    { id: 'tr-cv', label: 'Nested CV\n(2×5 fold)', description: 'Rigorous nested cross-validation strategy' },
    { id: 'tr-hyper', label: 'Hyperparameter\nTuning (50 iter)', description: 'RandomizedSearchCV with 50 iterations' },
    { id: 'tr-best', label: 'Best: LightGBM\n(AUC 0.7327)', description: 'LightGBM achieved best AUC of 0.7327' },
  ].forEach(s => add({ ...s, category: 'training', val: 7 }, 'training'))

  // 3 — Validation
  add({ id: 'validation', label: 'Model\nValidation', category: 'validation', link: '/phase/validation', val: 18, description: 'Phase 3: Comprehensive validation & robustness analysis' }, 'root')
  ;[
    { id: 'val-roc', label: 'ROC Analysis', description: 'Receiver Operating Characteristic curves' },
    { id: 'val-cal', label: 'Calibration\nCurves', description: 'Probability calibration assessment' },
    { id: 'val-dca', label: 'Decision Curve\nAnalysis', description: 'Clinical utility via net benefit analysis' },
    { id: 'val-conf', label: 'Confusion\nMatrices', description: 'Detailed confusion matrix analysis' },
    { id: 'val-perf', label: 'Performance\nMetrics', description: 'AUC, F1, Sensitivity, Specificity, Brier' },
  ].forEach(s => add({ ...s, category: 'validation', val: 7 }, 'validation'))

  // 4 — XAI
  add({ id: 'xai', label: 'Explainability\n(XAI)', category: 'xai', link: '/phase/xai', val: 18, description: 'Phase 4: Explainable AI with SHAP & feature importance' }, 'root')
  ;[
    { id: 'xai-shap', label: 'SHAP\nTreeExplainer', description: 'SHAP TreeExplainer for model interpretation' },
    { id: 'xai-global', label: 'Global Feature\nImportance', description: 'Aggregate feature importance rankings' },
    { id: 'xai-top', label: 'Top: LH, Age\nFSH, Testosterone', description: 'LH, Age, FSH, Testosterone as top predictors' },
    { id: 'xai-bee', label: 'Beeswarm\nPlots', description: 'SHAP beeswarm visualizations' },
  ].forEach(s => add({ ...s, category: 'xai', val: 7 }, 'xai'))

  // 5 — Literature
  add({ id: 'literature', label: 'Literature\nReview', category: 'literature', link: '/phase/literature', val: 18, description: 'Phase 5: Systematic comparison with existing studies' }, 'root')
  ;[
    { id: 'lit-comp', label: 'Studies\nComparison', description: 'Comparison with prior ML approaches' },
    { id: 'lit-z', label: 'Zeadna et al.', description: 'Key reference study comparison' },
    { id: 'lit-r', label: 'Ramasamy\net al.', description: 'Key reference study comparison' },
    { id: 'lit-cohort', label: 'Cohort Size\nComparison', description: 'Largest NOA ML cohort comparison' },
  ].forEach(s => add({ ...s, category: 'literature', val: 7 }, 'literature'))

  // 6 — Integration
  add({ id: 'integration', label: 'Integration', category: 'integration', link: '/phase/integration', val: 18, description: 'Phase 6: Pipeline assembly & dissertation integration' }, 'root')
  ;[
    { id: 'int-pipe', label: 'Pipeline\nAssembly', description: 'End-to-end ML pipeline construction' },
    { id: 'int-agent', label: '6-Agent\nArchitecture', description: 'Multi-agent AI system design' },
    { id: 'int-repro', label: 'Reproducibility', description: 'Ensuring reproducible research' },
  ].forEach(s => add({ ...s, category: 'integration', val: 7 }, 'integration'))

  // 7 — Virtual Defense
  add({ id: 'defense', label: 'Virtual\nDefense', category: 'defense', link: '/virtual-defense', val: 16, description: '4 AI expert panels with votes and critiques' }, 'root')
  ;[
    { id: 'def-stat', label: 'Statistics\nAgent', description: 'Statistical methodology review' },
    { id: 'def-aiml', label: 'AI/ML Agent', description: 'ML methodology review' },
    { id: 'def-xaic', label: 'XAI+Clinical\nAgent', description: 'Explainability & clinical review' },
    { id: 'def-soft', label: 'SoftEng Agent', description: 'Software engineering review' },
    { id: 'def-vote', label: 'Voting Results', description: 'Final panel voting outcomes' },
  ].forEach(s => add({ ...s, category: 'defense', val: 7 }, 'defense'))

  // 8 — Post-Defense
  add({ id: 'postdefense', label: 'Post-Defense\nActions', category: 'postdefense', link: '/post-defense-actions', val: 16, description: 'Corrective actions after defense review' }, 'root')
  ;[
    { id: 'pd-regex', label: 'Regex Bug\nFixes', description: 'Regex-based data corrections' },
    { id: 'pd-partner', label: 'Partner_Age\nRemoval', description: 'Exclusion of non-predictive feature' },
    { id: 'pd-metrics', label: 'Corrected\nMetrics', description: 'Updated performance after fixes' },
  ].forEach(s => add({ ...s, category: 'postdefense', val: 7 }, 'postdefense'))

  // 9 — CDSS
  add({ id: 'cdss', label: 'CDSS', category: 'cdss', link: '/cdss', val: 16, description: 'Clinical Decision Support System' }, 'root')
  ;[
    { id: 'cdss-clin', label: 'Clinical Decision\nSupport', description: 'Evidence-based clinical tool' },
    { id: 'cdss-score', label: 'Scoring\nAlgorithm', description: 'Risk scoring methodology' },
    { id: 'cdss-form', label: 'Patient Input\nForm', description: 'Clinical parameter input interface' },
    { id: 'cdss-risk', label: 'Risk\nStratification', description: 'Low/Moderate/High risk tiers' },
  ].forEach(s => add({ ...s, category: 'cdss', val: 7 }, 'cdss'))

  // 10 — Novelty
  add({ id: 'novelty', label: 'Novelty', category: 'novelty', link: '/novelty-comparison', val: 16, description: 'Novel contributions of this research' }, 'root')
  ;[
    { id: 'nov-largest', label: 'Largest NOA ML\nCohort (n=2413)', description: 'Largest ML cohort for NOA prediction' },
    { id: 'nov-persian', label: 'First Persian\nDataset', description: 'First ML study on Persian NOA cohort' },
    { id: 'nov-cv', label: 'Nested CV\nApproach', description: 'Rigorous nested cross-validation methodology' },
  ].forEach(s => add({ ...s, category: 'novelty', val: 7 }, 'novelty'))

  // 11 — Infrastructure
  add({ id: 'infrastructure', label: 'Infrastructure', category: 'infrastructure', link: '/hardware-specs', val: 16, description: 'Hardware & computing infrastructure' }, 'root')
  ;[
    { id: 'inf-gpu', label: 'NVIDIA H100\nGPU', description: 'High-performance GPU accelerator' },
    { id: 'inf-ram', label: '256GB RAM', description: 'High-capacity system memory' },
    { id: 'inf-cpu', label: 'AMD EPYC\nCPU', description: 'Enterprise-grade processor' },
  ].forEach(s => add({ ...s, category: 'infrastructure', val: 7 }, 'infrastructure'))

  return { nodes, links }
}

/* ─── simple force simulation ─── */
function initPositions(nodes: GNode[], links: GLink[], w: number, h: number) {
  const cx = w / 2, cy = h / 2
  const nodeMap = new Map<string, GNode>()
  nodes.forEach(n => nodeMap.set(n.id, n))

  // root at center
  const root = nodeMap.get('root')!
  root.x = cx; root.y = cy

  // main branches in a circle
  const mainBranches = links.filter(l => l.source === 'root').map(l => nodeMap.get(l.target)!)
  const r1 = Math.min(w, h) * 0.28
  mainBranches.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / mainBranches.length - Math.PI / 2
    n.x = cx + r1 * Math.cos(angle)
    n.y = cy + r1 * Math.sin(angle)
  })

  // sub-nodes around their parents
  mainBranches.forEach(parent => {
    const children = links.filter(l => l.source === parent.id).map(l => nodeMap.get(l.target)!)
    const parentAngle = Math.atan2(parent.y - cy, parent.x - cx)
    const r2 = Math.min(w, h) * 0.14
    const spread = Math.PI * 0.6
    children.forEach((child, i) => {
      const angle = parentAngle - spread / 2 + (spread * i) / Math.max(children.length - 1, 1)
      child.x = parent.x + r2 * Math.cos(angle)
      child.y = parent.y + r2 * Math.sin(angle)
    })
  })
}

function simulate(nodes: GNode[], links: GLink[], iterations: number) {
  const nodeMap = new Map<string, GNode>()
  nodes.forEach(n => nodeMap.set(n.id, n))

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 0.3 * (1 - iter / iterations)

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j]
        let dx = b.x - a.x, dy = b.y - a.y
        let dist = Math.sqrt(dx * dx + dy * dy) || 1
        const minDist = (a.val + b.val) * 2.5
        if (dist < minDist) {
          const force = (minDist - dist) / dist * alpha * 0.5
          a.x -= dx * force; a.y -= dy * force
          b.x += dx * force; b.y += dy * force
        }
      }
    }

    // Attraction along links
    for (const link of links) {
      const s = nodeMap.get(link.source)!, t = nodeMap.get(link.target)!
      let dx = t.x - s.x, dy = t.y - s.y
      let dist = Math.sqrt(dx * dx + dy * dy) || 1
      const targetDist = s.id === 'root' ? 180 : 100
      const force = (dist - targetDist) / dist * alpha * 0.1
      t.x -= dx * force; t.y -= dy * force
      s.x += dx * force; s.y += dy * force
    }
  }
}

export default function RoadmapGraph() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<GNode | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const transformRef = useRef({ x: 0, y: 0, scale: 1 })
  const draggingRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })

  const graphData = useMemo(() => {
    const data = buildGraphData()
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200
    const h = typeof window !== 'undefined' ? window.innerHeight - 140 : 700
    initPositions(data.nodes, data.links, w, h)
    simulate(data.nodes, data.links, 60)
    return data
  }, [])

  const nodeMapRef = useRef(new Map<string, GNode>())
  useEffect(() => {
    const m = new Map<string, GNode>()
    graphData.nodes.forEach(n => m.set(n.id, n))
    nodeMapRef.current = m
  }, [graphData])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const { x: tx, y: ty, scale } = transformRef.current
    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.translate(tx, ty)
    ctx.scale(scale, scale)

    // Draw links
    for (const link of graphData.links) {
      const s = nodeMapRef.current.get(link.source)!
      const t = nodeMapRef.current.get(link.target)!
      const gradient = ctx.createLinearGradient(s.x, s.y, t.x, t.y)
      gradient.addColorStop(0, (CAT_COLORS[s.category] || '#888') + '60')
      gradient.addColorStop(1, (CAT_COLORS[t.category] || '#888') + '90')
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.lineTo(t.x, t.y)
      ctx.strokeStyle = gradient
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Draw nodes
    for (const node of graphData.nodes) {
      const color = CAT_COLORS[node.category] || '#888'
      const isRoot = node.id === 'root'
      const isMain = node.val >= 16
      const radius = isRoot ? 36 : isMain ? 22 : 14

      ctx.save()
      ctx.shadowBlur = isRoot ? 30 : isMain ? 18 : 10
      ctx.shadowColor = color

      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = isRoot ? 3 : 1.5
      ctx.stroke()
      ctx.restore()

      // Label
      const fontSize = isRoot ? 7 : isMain ? 5.5 : 4.5
      ctx.font = `600 ${fontSize}px "DM Sans", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#fff'
      const lines = node.label.split('\n')
      const lh = fontSize * 1.4
      const startY = node.y - ((lines.length - 1) * lh) / 2
      lines.forEach((line, i) => {
        ctx.fillText(line, node.x, startY + i * lh)
      })
    }

    ctx.restore()
  }, [graphData])

  useEffect(() => {
    draw()
    const onResize = () => draw()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [draw])

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const { x: tx, y: ty, scale } = transformRef.current
    return { x: (sx - tx) / scale, y: (sy - ty) / scale }
  }, [])

  const hitTest = useCallback((sx: number, sy: number): GNode | null => {
    const { x: wx, y: wy } = screenToWorld(sx, sy)
    for (let i = graphData.nodes.length - 1; i >= 0; i--) {
      const n = graphData.nodes[i]
      const isRoot = n.id === 'root'
      const isMain = n.val >= 16
      const r = isRoot ? 36 : isMain ? 22 : 14
      const dx = n.x - wx, dy = n.y - wy
      if (dx * dx + dy * dy <= (r + 4) * (r + 4)) return n
    }
    return null
  }, [graphData, screenToWorld])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top
    setMousePos({ x: e.clientX, y: e.clientY })

    if (draggingRef.current) {
      const dx = e.clientX - lastMouseRef.current.x
      const dy = e.clientY - lastMouseRef.current.y
      transformRef.current.x += dx
      transformRef.current.y += dy
      lastMouseRef.current = { x: e.clientX, y: e.clientY }
      draw()
      return
    }

    const hit = hitTest(sx, sy)
    setHoveredNode(hit)
    const canvas = canvasRef.current
    if (canvas) canvas.style.cursor = hit?.link ? 'pointer' : hit ? 'default' : 'grab'
  }, [hitTest, draw])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top
    const hit = hitTest(sx, sy)
    if (hit?.link) router.push(hit.link)
  }, [hitTest, router])

  // Attach wheel handler as non-passive to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left, my = e.clientY - rect.top
      const t = transformRef.current
      const factor = e.deltaY < 0 ? 1.1 : 0.9
      const newScale = Math.max(0.3, Math.min(5, t.scale * factor))
      t.x = mx - (mx - t.x) * (newScale / t.scale)
      t.y = my - (my - t.y) * (newScale / t.scale)
      t.scale = newScale
      draw()
    }
    canvas.addEventListener('wheel', handler, { passive: false })
    return () => canvas.removeEventListener('wheel', handler)
  }, [draw])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top
    const hit = hitTest(sx, sy)
    if (!hit) {
      draggingRef.current = true
      lastMouseRef.current = { x: e.clientX, y: e.clientY }
    }
  }, [hitTest])

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false
  }, [])

  return (
    <div className="relative min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="relative z-10 px-6 pt-6 pb-2">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-white text-center">
          نقشه راه پروژه تحقیقاتی | Project Research Roadmap
        </h1>
        <p className="text-sm text-gray-400 text-center mt-2 max-w-2xl mx-auto">
          Interactive mind map of the complete NOA Micro-TESE ML Prediction project.
          Hover over nodes for details. Click any node to navigate to that section. Scroll to zoom, drag to pan.
        </p>
        <div className="flex justify-center gap-4 mt-3 flex-wrap">
          {Object.entries(CAT_COLORS).filter(([k]) => k !== 'root').map(([key, color]) => (
            <span key={key} className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </span>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: 'calc(100vh - 140px)', display: 'block' }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Tooltip */}
      {hoveredNode && (
        <div
          className="fixed z-50 pointer-events-none px-4 py-3 rounded-lg shadow-xl border border-white/10 max-w-xs"
          style={{
            left: mousePos.x + 16,
            top: mousePos.y - 10,
            background: 'rgba(15, 15, 30, 0.95)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <p className="font-semibold text-sm text-white">{hoveredNode.label?.replace(/\n/g, ' ')}</p>
          {hoveredNode.description && (
            <p className="text-xs text-gray-400 mt-1">{hoveredNode.description}</p>
          )}
          {hoveredNode.link && (
            <p className="text-[10px] text-purple-400 mt-1.5">Click to navigate →</p>
          )}
        </div>
      )}
    </div>
  )
}
