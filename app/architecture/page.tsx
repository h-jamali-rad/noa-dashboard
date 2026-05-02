'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BreadcrumbNav from '@/components/breadcrumb-nav'

interface Agent {
  id: string
  label: string
  emoji: string
  color: string
  angle: number
  tasks: string[]
}

const AGENTS: Agent[] = [
  {
    id: 'preprocessing',
    label: 'Data Preprocessing',
    emoji: '📊',
    color: '#0ea5e9',
    angle: -90,
    tasks: [
      'Cleans 2,450 patient records → 2,413 analytical',
      'Handles OCR typos & whitespace issues',
      'NaN vs Zero correction (MNAR-aware)',
      'Pipe-separated value parsing',
      'Hormone data type conversion',
      'Salvage flag reconciliation',
      'SCO extraction rewrite',
    ],
  },
  {
    id: 'feature',
    label: 'Feature Engineering',
    emoji: '🔧',
    color: '#10b981',
    angle: -18,
    tasks: [
      'Pathology subgroup decomposition (SCO, MA, CSTH, HS, NS)',
      'Expands 55 raw → 73 engineered features',
      'Creates Sakamoto volume formula features',
      'Interaction terms & ratio features',
    ],
  },
  {
    id: 'statistical',
    label: 'Statistical Analysis',
    emoji: '📈',
    color: '#8b5cf6',
    angle: 54,
    tasks: [
      'Univariate & multivariate analysis',
      'Chi-square & Mann-Whitney tests',
      'Missing data mechanism analysis (MCAR/MAR/MNAR)',
      'Correlation matrix computation',
    ],
  },
  {
    id: 'ml',
    label: 'ML Modeling',
    emoji: '🧠',
    color: '#f43f5e',
    angle: 126,
    tasks: [
      'Trains 16 models with nested cross-validation',
      'LightGBM best performer (AUC 0.7327 ± 0.0057)',
      'Hyperparameter optimization with Optuna',
      'Feature importance via SHAP values',
      'Calibration & Decision Curve Analysis',
    ],
  },
  {
    id: 'cdss',
    label: 'CDSS Agent',
    emoji: '🏥',
    color: '#06b6d4',
    angle: 198,
    tasks: [
      'Clinical Decision Support System interface',
      'LightGBM-based probability estimation',
      'Risk tier classification (Low/Moderate/High)',
      'SHAP-ranked top-14 predictor integration',
      'Preoperative counseling support',
    ],
  },
]

const RADIUS = 220
const CENTER = { x: 300, y: 300 }

function getAgentPosition(angle: number) {
  const rad = (angle * Math.PI) / 180
  return {
    x: CENTER.x + RADIUS * Math.cos(rad),
    y: CENTER.y + RADIUS * Math.sin(rad),
  }
}

export default function ArchitecturePage() {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-8">
      <BreadcrumbNav items={[{ label: 'Architecture' }]} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display font-bold text-3xl tracking-tight">System Architecture</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          Multi-agent orchestration pipeline — a central orchestrator coordinates five specialized agents
          for end-to-end NOA microTESE prediction.
        </p>
      </motion.div>

      {/* Architecture Diagram */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: 600, height: 600 }}>
          {/* SVG connections */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 600">
            <defs>
              {AGENTS.map((agent) => (
                <linearGradient key={`grad-${agent.id}`} id={`grad-${agent.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={agent.color} stopOpacity="0.3" />
                  <stop offset="50%" stopColor={agent.color} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={agent.color} stopOpacity="0.3" />
                </linearGradient>
              ))}
            </defs>
            {AGENTS.map((agent) => {
              const pos = getAgentPosition(agent.angle)
              const isHovered = hoveredAgent === agent.id
              return (
                <g key={`line-${agent.id}`}>
                  <motion.line
                    x1={CENTER.x} y1={CENTER.y}
                    x2={pos.x} y2={pos.y}
                    stroke={`url(#grad-${agent.id})`}
                    strokeWidth={isHovered ? 3 : 1.5}
                    strokeDasharray={isHovered ? 'none' : '6 4'}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, delay: 0.3 }}
                  />
                  {/* Animated dot */}
                  <motion.circle
                    r={isHovered ? 5 : 3}
                    fill={agent.color}
                    animate={{
                      cx: [CENTER.x, pos.x],
                      cy: [CENTER.y, pos.y],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </g>
              )
            })}
          </svg>

          {/* Central Orchestrator */}
          <motion.div
            className="absolute flex flex-col items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl cursor-default"
            style={{
              width: 120, height: 120,
              left: CENTER.x - 60, top: CENTER.y - 60,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            whileHover={{ scale: 1.1 }}
          >
            <span className="text-3xl">🤖</span>
            <span className="text-xs font-bold mt-1">Orchestrator</span>
          </motion.div>

          {/* Agents */}
          {AGENTS.map((agent, idx) => {
            const pos = getAgentPosition(agent.angle)
            const isHovered = hoveredAgent === agent.id
            return (
              <motion.div
                key={agent.id}
                className="absolute flex flex-col items-center"
                style={{ left: pos.x - 50, top: pos.y - 50 }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + idx * 0.15, type: 'spring' }}
                onMouseEnter={() => setHoveredAgent(agent.id)}
                onMouseLeave={() => setHoveredAgent(null)}
              >
                <motion.div
                  className="w-[100px] h-[100px] rounded-full flex flex-col items-center justify-center shadow-lg cursor-pointer border-2 transition-colors"
                  style={{
                    backgroundColor: isHovered ? agent.color : `${agent.color}20`,
                    borderColor: agent.color,
                  }}
                  whileHover={{ scale: 1.15 }}
                >
                  <span className="text-2xl">{agent.emoji}</span>
                  <span className={`text-[9px] font-bold mt-0.5 text-center leading-tight px-1 ${isHovered ? 'text-white' : ''}`}>
                    {agent.label}
                  </span>
                </motion.div>

                {/* Tooltip on hover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full mt-2 z-50 w-64 rounded-xl border bg-card shadow-xl p-3"
                    >
                      <p className="font-bold text-sm mb-2" style={{ color: agent.color }}>{agent.emoji} {agent.label}</p>
                      <ul className="space-y-1">
                        {agent.tasks.map((task, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                            <span className="shrink-0 mt-0.5" style={{ color: agent.color }}>•</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}

          {/* Database badge */}
          <motion.div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-card border shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <span className="text-lg">🗃️</span>
            <span className="text-xs font-medium">Vercel PostgreSQL + GitHub Sync</span>
          </motion.div>
        </div>
      </div>

      {/* Agent Details Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS.map((agent, idx) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + idx * 0.1 }}
            className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${agent.color}20` }}>
                {agent.emoji}
              </div>
              <h3 className="font-bold text-sm" style={{ color: agent.color }}>{agent.label}</h3>
            </div>
            <ul className="space-y-1.5">
              {agent.tasks.map((task, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                  <span className="shrink-0" style={{ color: agent.color }}>▸</span>
                  {task}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  )
}


