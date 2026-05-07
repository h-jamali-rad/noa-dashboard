'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, Zap, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  OrchestratorIcon,
  DataPreprocessingIcon,
  ModelTrainingIcon,
  ValidationIcon,
  CdssIcon,
  LlmFarmsIcon,
} from '@/components/architecture/agent-icons'
import { ORCHESTRATOR, AGENTS, LLM_FARMS, type AgentNode } from '@/components/architecture/agent-data'

/* ---- Icon map ---- */
const ICON_MAP: Record<string, React.FC<{ size?: number }>> = {
  orchestrator: OrchestratorIcon,
  researcher: DataPreprocessingIcon,
  verifier: ValidationIcon,
  'ml-expert': ModelTrainingIcon,
  'dashboard-builder': CdssIcon,
  'llm-farms': LlmFarmsIcon,
}

/* ---- Animated particles on connection lines ---- */
function FlowParticle({ x1, y1, x2, y2, delay, color }: { x1: number; y1: number; x2: number; y2: number; delay: number; color: string }) {
  return (
    <motion.circle
      r="2.5"
      fill={color}
      initial={{ cx: x1, cy: y1, opacity: 0 }}
      animate={{ cx: [x1, x2], cy: [y1, y2], opacity: [0, 0.9, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  )
}

/* ---- Agent Card Component ---- */
function AgentCard({
  agent,
  iconId,
  onSelect,
  isHighlighted,
}: {
  agent: AgentNode
  iconId: string
  onSelect: (agent: AgentNode) => void
  isHighlighted: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const IconComponent = ICON_MAP[iconId]

  return (
    <motion.div
      className="relative group cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(agent)}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.97 }}
      layout
    >
      {/* Glow ring */}
      <motion.div
        className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, ${agent.color}33 0%, transparent 70%)`,
          filter: 'blur(8px)',
        }}
      />

      <div
        className={cn(
          'relative flex flex-col items-center gap-2 rounded-xl border p-4 backdrop-blur-sm transition-all duration-300 min-w-[130px] max-w-[150px]',
          'bg-card/80 border-border/60',
          isHighlighted && 'ring-2 ring-offset-2 ring-offset-background',
        )}
        style={{
          borderColor: hovered ? agent.color : undefined,
          boxShadow: hovered ? `0 0 20px ${agent.color}30` : undefined,
          ...(isHighlighted ? { '--tw-ring-color': agent.color } as React.CSSProperties : {}),
        }}
      >
        {/* Idle float animation */}
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {IconComponent && <IconComponent size={52} />}
        </motion.div>

        <p className="text-xs font-semibold text-center leading-tight mt-1" style={{ color: agent.color }}>
          {agent.shortName}
        </p>

        {/* Status indicator */}
        <motion.div
          className="absolute -top-1 -right-1 h-3 w-3 rounded-full"
          style={{ backgroundColor: agent.color }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Tooltip on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 w-72 rounded-lg border border-border/60 bg-card/95 backdrop-blur-md p-4 shadow-lg pointer-events-none"
          >
            <p className="font-semibold text-sm mb-1" style={{ color: agent.color }}>{agent.name}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{agent.designReason}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ---- Detail Modal ---- */
function AgentModal({ agent, onClose }: { agent: AgentNode; onClose: () => void }) {
  const IconComponent = ICON_MAP[agent.id]

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-border/60 bg-card p-6 sm:p-8 shadow-xl"
        initial={{ scale: 0.9, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 30, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className="shrink-0">
            {IconComponent && <IconComponent size={64} />}
          </div>
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight" style={{ color: agent.color }}>
              {agent.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{agent.description}</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Design rationale */}
          <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
            <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
              <Zap className="h-4 w-4" style={{ color: agent.color }} />
              Why HJR Designed This Agent
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{agent.designReason}</p>
          </div>

          {/* Inputs */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Inputs</h4>
            <ul className="space-y-1">
              {agent.inputs.map((input, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                  {input}
                </li>
              ))}
            </ul>
          </div>

          {/* Outputs */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Outputs</h4>
            <ul className="space-y-1">
              {agent.outputs.map((output, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: agent.color }} />
                  {output}
                </li>
              ))}
            </ul>
          </div>

          {/* Pipeline role */}
          <div className="rounded-lg border border-border/40 p-4">
            <h4 className="text-sm font-semibold mb-1">Role in Pipeline</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{agent.pipelineRole}</p>
          </div>

          {/* Connections */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Connections</h4>
            <div className="flex flex-wrap gap-2">
              {agent.connections.map((conn, i) => (
                <span
                  key={i}
                  className="text-xs font-mono px-2 py-1 rounded-md bg-muted text-muted-foreground"
                >
                  {conn}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ---- Connection Lines SVG Layer ---- */
function ConnectionLines({
  containerRef,
  agentRefs,
  orchestratorRef,
  llmRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
  agentRefs: React.RefObject<Map<string, HTMLDivElement>>
  orchestratorRef: React.RefObject<HTMLDivElement | null>
  llmRef: React.RefObject<HTMLDivElement | null>
}) {
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; color: string }[]>([])
  const [llmLines, setLlmLines] = useState<{ x1: number; y1: number; x2: number; y2: number; color: string }[]>([])

  const updateLines = useCallback(() => {
    if (!containerRef.current || !orchestratorRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const orchRect = orchestratorRef.current.getBoundingClientRect()
    const orchX = orchRect.left + orchRect.width / 2 - containerRect.left
    const orchY = orchRect.top + orchRect.height - containerRect.top

    const newLines: typeof lines = []
    agentRefs.current?.forEach((el, id) => {
      const rect = el.getBoundingClientRect()
      const x = rect.left + rect.width / 2 - containerRect.left
      const y = rect.top - containerRect.top
      const agent = AGENTS.find(a => a.id === id)
      newLines.push({ x1: orchX, y1: orchY, x2: x, y2: y, color: agent?.color || '#0e7490' })
    })
    setLines(newLines)

    // LLM farm lines
    if (llmRef.current) {
      const llmRect = llmRef.current.getBoundingClientRect()
      const llmX = llmRect.left + llmRect.width / 2 - containerRect.left
      const llmY = llmRect.top - containerRect.top
      const newLlmLines: typeof llmLines = []
      agentRefs.current?.forEach((el, id) => {
        const rect = el.getBoundingClientRect()
        const x = rect.left + rect.width / 2 - containerRect.left
        const y = rect.top + rect.height - containerRect.top
        const agent = AGENTS.find(a => a.id === id)
        newLlmLines.push({ x1: x, y1: y, x2: llmX, y2: llmY, color: agent?.color || '#6366f1' })
      })
      setLlmLines(newLlmLines)
    }
  }, [containerRef, orchestratorRef, agentRefs, llmRef])

  useEffect(() => {
    updateLines()
    const handle = () => updateLines()
    window.addEventListener('resize', handle)
    // Run a few times after mount to catch layout shifts
    const t1 = setTimeout(handle, 300)
    const t2 = setTimeout(handle, 800)
    return () => {
      window.removeEventListener('resize', handle)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [updateLines])

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      <defs>
        {lines.map((l, i) => (
          <linearGradient key={`grad-${i}`} id={`line-grad-${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0e7490" stopOpacity="0.6" />
            <stop offset="100%" stopColor={l.color} stopOpacity="0.6" />
          </linearGradient>
        ))}
      </defs>
      {/* Orchestrator → Agent lines */}
      {lines.map((l, i) => (
        <g key={`orch-${i}`}>
          <motion.line
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={`url(#line-grad-${i})`}
            strokeWidth="1.5"
            strokeDasharray="6 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: i * 0.1 }}
          />
          <FlowParticle x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} delay={i * 0.4} color={l.color} />
          <FlowParticle x1={l.x2} y1={l.y2} x2={l.x1} y2={l.y1} delay={i * 0.4 + 1.2} color="#0e7490" />
        </g>
      ))}
      {/* Agent → LLM farm lines */}
      {llmLines.map((l, i) => (
        <g key={`llm-${i}`}>
          <line
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={LLM_FARMS.color}
            strokeWidth="0.8"
            strokeDasharray="3 6"
            opacity={0.3}
          />
          <FlowParticle x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} delay={i * 0.6 + 0.5} color={LLM_FARMS.color} />
        </g>
      ))}
    </svg>
  )
}

/* ---- Main Page ---- */
export default function ArchitecturePage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentNode | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const orchestratorRef = useRef<HTMLDivElement | null>(null)
  const llmRef = useRef<HTMLDivElement | null>(null)
  const agentRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const setAgentRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) agentRefs.current.set(id, el)
    else agentRefs.current.delete(id)
  }, [])

  // Agent rows: top row (2) and bottom row (2)
  const topRow = AGENTS.slice(0, 2)
  const bottomRow = AGENTS.slice(2)

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-6">
      {/* Page header */}
      <motion.section
        className="rounded-xl border bg-card p-6 sm:p-8 hero-pattern"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight">
          Multi-Agent AI Architecture
        </h1>
        <p className="text-muted-foreground mt-2 max-w-3xl text-sm sm:text-base">
          Interactive visualization of HJR&apos;s Deep Agent system — a DAG-based multi-agent pipeline
          orchestrating 5 specialized agents (Orchestrator, Researcher, Verifier, ML Expert, Dashboard Builder)
          for the NOA microTESE research workflow. Hover for details, click for full specifications.
        </p>
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <ChevronDown className="h-4 w-4 animate-bounce" />
          <span>Scroll down to explore the architecture diagram</span>
        </div>
      </motion.section>

      {/* Architecture Diagram */}
      <motion.section
        className="relative rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        <div ref={containerRef} className="relative px-4 sm:px-8 lg:px-16 py-10 sm:py-16 min-h-[700px]">
          {/* Connection lines layer */}
          <ConnectionLines
            containerRef={containerRef}
            agentRefs={agentRefs}
            orchestratorRef={orchestratorRef}
            llmRef={llmRef}
          />

          {/* Layer 1: Master Orchestrator */}
          <div className="relative z-10 flex flex-col items-center mb-16 sm:mb-20">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.3 }}
            >
              <div className="text-center mb-3">
                <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-3 py-1 rounded-full bg-muted/50 border border-border/40 mb-4">
                  Central Controller
                </span>
              </div>
              <div
                ref={orchestratorRef}
                className="cursor-pointer"
                onClick={() => setSelectedAgent(ORCHESTRATOR)}
              >
                <motion.div
                  className="relative p-5 sm:p-6 rounded-2xl border-2 bg-card/90 backdrop-blur-md"
                  style={{ borderColor: '#0e7490' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Glow */}
                  <motion.div
                    className="absolute -inset-2 rounded-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(14,116,144,0.2) 0%, transparent 70%)' }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="relative flex items-center gap-4">
                    <OrchestratorIcon size={68} />
                    <div>
                      <p className="font-display font-bold text-sm sm:text-base text-primary">
                        HJR&apos;s Deep Agent
                      </p>
                      <p className="text-xs text-muted-foreground">Master Orchestrator</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">DAG Controller • 5 Specialized Agents</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Layer 2: Agent Nodes - Top Row */}
          <div className="relative z-10 flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
            {topRow.map((agent, i) => (
              <motion.div
                key={agent.id}
                ref={(el) => setAgentRef(agent.id, el)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
              >
                <AgentCard
                  agent={agent}
                  iconId={agent.id}
                  onSelect={setSelectedAgent}
                  isHighlighted={selectedAgent?.id === agent.id}
                />
              </motion.div>
            ))}
          </div>

          {/* Layer 2: Agent Nodes - Bottom Row */}
          <div className="relative z-10 flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 mb-16 sm:mb-20">
            {bottomRow.map((agent, i) => (
              <motion.div
                key={agent.id}
                ref={(el) => setAgentRef(agent.id, el)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
              >
                <AgentCard
                  agent={agent}
                  iconId={agent.id}
                  onSelect={setSelectedAgent}
                  isHighlighted={selectedAgent?.id === agent.id}
                />
              </motion.div>
            ))}
          </div>

          {/* Layer 3: LLM Farms */}
          <motion.div
            className="relative z-10 flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <span className="inline-block text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-3 py-1 rounded-full bg-muted/50 border border-border/40 mb-4">
              Foundation Layer
            </span>
            <div
              ref={llmRef}
              className="w-full max-w-3xl rounded-xl border-2 bg-card/80 backdrop-blur-md p-5 sm:p-6"
              style={{ borderColor: LLM_FARMS.color + '60' }}
            >
              <div className="flex items-center gap-4 mb-4">
                <LlmFarmsIcon size={48} />
                <div>
                  <p className="font-display font-bold text-sm" style={{ color: LLM_FARMS.color }}>
                    {LLM_FARMS.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{LLM_FARMS.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {LLM_FARMS.specializations.map((spec, i) => (
                  <motion.span
                    key={spec}
                    className="text-xs font-mono px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: LLM_FARMS.color + '40', color: LLM_FARMS.color }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                  >
                    {spec}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Agent detail modal */}
      <AnimatePresence>
        {selectedAgent && (
          <AgentModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
        )}
      </AnimatePresence>

      {/* Legend / Info Section */}
      <motion.section
        className="rounded-xl border bg-card p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <h2 className="font-display font-semibold text-lg tracking-tight mb-4">Architecture Legend</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className="flex items-start gap-3 rounded-lg border border-border/40 p-3 hover:border-primary/40 transition-colors text-left"
            >
              <div
                className="h-3 w-3 rounded-full shrink-0 mt-1"
                style={{ backgroundColor: agent.color }}
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: agent.color }}>{agent.shortName}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{agent.description}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          Developed by Hossein Jamalirad, PhD Candidate of Medical Informatics in Medical University @ MUMS-2026
        </p>
      </div>
    </div>
  )
}
