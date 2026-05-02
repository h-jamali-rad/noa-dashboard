'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BreadcrumbNav from '@/components/breadcrumb-nav'

interface Phase {
  id: number
  title: string
  subtitle: string
  color: string
  icon: string
  highlights: string[]
  link?: string
}

const PHASES: Phase[] = [
  {
    id: 1,
    title: 'Data Understanding & Cleaning',
    subtitle: 'From raw records to analytical dataset',
    color: '#0ea5e9',
    icon: '🗄️',
    highlights: [
      '2,450 screened → 2,413 analytical cohort',
      'OCR typo correction (hyposprmatogenesis → hypospermatogenesis)',
      'NaN vs Zero distinction (MNAR-aware handling)',
      'Pipe-separated value parsing (437 records)',
      'Whitespace-as-value detection (1,291 records)',
      'Hormone data type conversion (2,679 records)',
      'Salvage flag reconciliation (155 records)',
    ],
    link: '/phase/preprocessing',
  },
  {
    id: 2,
    title: 'Feature Engineering',
    subtitle: 'Why Pathology? → Subgroup Analysis → 55→73 features',
    color: '#10b981',
    icon: '🔧',
    highlights: [
      'Pathology decomposition: SCO, MA, CSTH, HS, NS subgroups',
      'SCO extraction rewrite (221 affected records corrected)',
      'Sakamoto testicular volume formula features',
      'Interaction terms & ratio features',
      'From 55 raw variables to 73 engineered features',
      'Subgroup percentage extraction from free-text pathology',
    ],
    link: '/phase/preprocessing',
  },
  {
    id: 3,
    title: 'Statistical Analysis',
    subtitle: 'Rigorous statistical foundation',
    color: '#8b5cf6',
    icon: '📈',
    highlights: [
      'Univariate & multivariate analysis of 73 features',
      'Chi-square (χ²) & Mann-Whitney U tests',
      'Missing data mechanism: MCAR/MAR/MNAR analysis',
      'MNAR evidence: Chi-square χ²=80+, p<0.0001',
      'Success rate gap: 16.4% between missing/present groups',
      'Correlation matrix and collinearity assessment',
    ],
  },
  {
    id: 4,
    title: 'ML Modeling',
    subtitle: 'Training, tuning & feature importance',
    color: '#f43f5e',
    icon: '🧠',
    highlights: [
      '16 models trained with nested 5×5 cross-validation',
      'LightGBM best performer: AUC 0.7327 ± 0.0057',
      'Hyperparameter optimization via Optuna',
      'SHAP-based feature importance ranking',
      'Top predictors: LH, Age, FSH, Testosterone',
      'Leakage-aware methodology throughout',
    ],
    link: '/phase/training',
  },
  {
    id: 5,
    title: 'CDSS Development',
    subtitle: 'Clinical Decision Support System',
    color: '#06b6d4',
    icon: '🏥',
    highlights: [
      'LightGBM-based probability estimation',
      'SHAP-ranked top-14 predictor integration',
      'Risk tier classification: Low / Moderate / High',
      'Calibration-aware probability output',
      'Color-coded input validation (Q1–Q3 ranges)',
      'Preoperative counseling decision support',
    ],
    link: '/cdss',
  },
  {
    id: 6,
    title: 'Deployment & Documentation',
    subtitle: 'Dashboard, defense & reproducibility',
    color: '#f97316',
    icon: '🚀',
    highlights: [
      'Next.js interactive research dashboard',
      '464 curated visualizations in image gallery',
      'TRIPOD / PROBAST compliance documentation',
      'Virtual defense with expert panel reviews',
      'Vercel PostgreSQL + GitHub Sync deployment',
      'All 20 reviewer recommendations addressed',
    ],
  },
]

export default function RoadmapPage() {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null)

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-8">
      <BreadcrumbNav items={[{ label: 'Roadmap' }]} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display font-bold text-3xl tracking-tight">Project Roadmap</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          End-to-end research pipeline — from raw clinical data to a deployed clinical decision support system.
        </p>
      </motion.div>

      {/* Progress Bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground">Progress</span>
          <span className="text-xs font-bold text-emerald-600">100% Complete</span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-purple-500 to-orange-500"
          />
        </div>
        {/* Phase markers */}
        <div className="flex justify-between mt-1">
          {PHASES.map((phase) => (
            <div key={phase.id} className="flex flex-col items-center" style={{ width: `${100 / PHASES.length}%` }}>
              <div className="w-3 h-3 rounded-full border-2 border-white shadow" style={{ backgroundColor: phase.color }} />
              <span className="text-[9px] text-muted-foreground mt-1 hidden sm:block">Phase {phase.id}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

        <div className="space-y-6">
          {PHASES.map((phase, idx) => {
            const isExpanded = expandedPhase === phase.id
            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.12 }}
                className="relative md:pl-16"
              >
                {/* Timeline dot */}
                <motion.div
                  className="hidden md:flex absolute left-4 top-5 h-5 w-5 rounded-full items-center justify-center text-white text-[10px] font-bold shadow-lg z-10"
                  style={{ backgroundColor: phase.color }}
                  whileHover={{ scale: 1.3 }}
                >
                  {phase.id}
                </motion.div>

                <motion.div
                  className="rounded-xl border bg-card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  style={{ borderLeftWidth: 4, borderLeftColor: phase.color }}
                  onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                  whileHover={{ x: 4 }}
                >
                  <div className="p-5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-2xl">{phase.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: phase.color }}>PHASE {phase.id}</span>
                          <h3 className="font-bold">{phase.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{phase.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-medium">✓ Complete</span>
                        <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} className="text-muted-foreground">▼</motion.span>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-5 pb-5 border-t pt-4">
                          <ul className="grid sm:grid-cols-2 gap-2">
                            {phase.highlights.map((h, i) => (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="text-sm text-muted-foreground flex gap-2"
                              >
                                <span style={{ color: phase.color }}>▸</span>
                                {h}
                              </motion.li>
                            ))}
                          </ul>
                          {phase.link && (
                            <a href={phase.link} className="inline-flex items-center gap-1 mt-3 text-xs font-medium hover:underline" style={{ color: phase.color }}>
                              View details →
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
