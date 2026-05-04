'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  BookOpen,
  Database,
  Brain,
  ShieldCheck,
  Lightbulb,
  Stethoscope,
  Presentation,
  ListChecks,
  FileText,
  GitCompareArrows,
  Library,
  Images,
  Cpu,
  Github,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Trophy,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Milestone = {
  id: string
  step: number
  title: string
  description: string
  route: string
  icon: LucideIcon
  /** Tailwind gradient classes for the colored accent (from / via / to) */
  gradient: string
  /** Tailwind ring color used for the number badge halo and side accent */
  ring: string
  /** A soft tinted background used behind the icon */
  tint: string
}

const MILESTONES: Milestone[] = [
  {
    id: 'literature',
    step: 1,
    title: 'Literature Review',
    description: 'Systematic survey of NOA, m-TESE outcomes, and clinical biomarkers.',
    route: '/phase/literature',
    icon: BookOpen,
    gradient: 'from-sky-500 via-blue-500 to-indigo-600',
    ring: 'ring-sky-300/60 dark:ring-sky-400/40',
    tint: 'bg-sky-500/10 text-sky-600 dark:text-sky-300',
  },
  {
    id: 'preprocessing',
    step: 2,
    title: 'Preprocessing',
    description: 'Cohort cleaning, encoding, scaling, and feature engineering pipelines.',
    route: '/phase/preprocessing',
    icon: Database,
    gradient: 'from-cyan-500 via-teal-500 to-emerald-600',
    ring: 'ring-teal-300/60 dark:ring-teal-400/40',
    tint: 'bg-teal-500/10 text-teal-600 dark:text-teal-300',
  },
  {
    id: 'training',
    step: 3,
    title: 'Training',
    description: 'Model fitting, cross-validation, and hyper-parameter optimisation.',
    route: '/phase/training',
    icon: Brain,
    gradient: 'from-emerald-500 via-green-500 to-lime-600',
    ring: 'ring-emerald-300/60 dark:ring-emerald-400/40',
    tint: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  },
  {
    id: 'validation',
    step: 4,
    title: 'Validation',
    description: 'Held-out testing, calibration, and bootstrap robustness checks.',
    route: '/phase/validation',
    icon: ShieldCheck,
    gradient: 'from-indigo-500 via-blue-600 to-violet-600',
    ring: 'ring-indigo-300/60 dark:ring-indigo-400/40',
    tint: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
  },
  {
    id: 'xai',
    step: 5,
    title: 'XAI — Explainability',
    description: 'SHAP attributions and per-patient interpretability dashboards.',
    route: '/xai',
    icon: Lightbulb,
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    ring: 'ring-violet-300/60 dark:ring-violet-400/40',
    tint: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
  },
  {
    id: 'cdss',
    step: 6,
    title: 'CDSS',
    description: 'Clinical decision support — interactive risk-prediction interface.',
    route: '/cdss',
    icon: Stethoscope,
    gradient: 'from-pink-500 via-fuchsia-500 to-rose-600',
    ring: 'ring-pink-300/60 dark:ring-pink-400/40',
    tint: 'bg-pink-500/10 text-pink-600 dark:text-pink-300',
  },
  {
    id: 'virtual-defense',
    step: 7,
    title: 'Virtual Defense',
    description: 'Expert panel review with clinician and methodology questions.',
    route: '/virtual-defense',
    icon: Presentation,
    gradient: 'from-orange-500 via-red-500 to-rose-600',
    ring: 'ring-orange-300/60 dark:ring-orange-400/40',
    tint: 'bg-orange-500/10 text-orange-600 dark:text-orange-300',
  },
  {
    id: 'post-defense-actions',
    step: 8,
    title: 'Post-Defense Actions',
    description: 'Corrective action plan and revisions captured after the defense.',
    route: '/post-defense-actions',
    icon: ListChecks,
    gradient: 'from-rose-500 via-pink-600 to-red-700',
    ring: 'ring-rose-300/60 dark:ring-rose-400/40',
    tint: 'bg-rose-500/10 text-rose-600 dark:text-rose-300',
  },
  {
    id: 'publications',
    step: 9,
    title: 'Publications',
    description: 'Oxford Academic article and scoping-review biomarker tables.',
    route: '/publications',
    icon: FileText,
    gradient: 'from-amber-500 via-orange-500 to-yellow-600',
    ring: 'ring-amber-300/60 dark:ring-amber-400/40',
    tint: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  },
  {
    id: 'novelty-comparison',
    step: 10,
    title: 'Novelty Comparison',
    description: 'How this work differs from the closest prior NOA studies.',
    route: '/novelty-comparison',
    icon: GitCompareArrows,
    gradient: 'from-purple-500 via-violet-600 to-indigo-700',
    ring: 'ring-purple-300/60 dark:ring-purple-400/40',
    tint: 'bg-purple-500/10 text-purple-600 dark:text-purple-300',
  },
  {
    id: 'references',
    step: 11,
    title: 'References',
    description: 'Curated bibliography and 45 systematic-review primary studies.',
    route: '/references',
    icon: Library,
    gradient: 'from-yellow-500 via-amber-500 to-orange-600',
    ring: 'ring-yellow-300/60 dark:ring-yellow-400/40',
    tint: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
  },
  {
    id: 'gallery',
    step: 12,
    title: 'Gallery',
    description: 'Project figures, performance plots, and presentation visuals.',
    route: '/gallery',
    icon: Images,
    gradient: 'from-sky-500 via-cyan-500 to-blue-600',
    ring: 'ring-cyan-300/60 dark:ring-cyan-400/40',
    tint: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300',
  },
  {
    id: 'hardware-specs',
    step: 13,
    title: 'Hardware Specs',
    description: 'Compute environment, GPU stack, and reproducibility details.',
    route: '/hardware-specs',
    icon: Cpu,
    gradient: 'from-slate-500 via-zinc-600 to-gray-700',
    ring: 'ring-slate-300/60 dark:ring-slate-400/40',
    tint: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  },
  {
    id: 'code',
    step: 14,
    title: 'Code Repository',
    description: 'Source code, training logs, and reproducible artifacts on GitHub.',
    route: '/code',
    icon: Github,
    gradient: 'from-teal-500 via-emerald-600 to-green-700',
    ring: 'ring-emerald-300/60 dark:ring-emerald-400/40',
    tint: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  },
]

const TOTAL = MILESTONES.length

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.18,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 220, damping: 24 },
  },
}

export default function RoadmapGraph() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Decorative ambient gradients — subtle, theme-aware */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-120px] top-10 h-[320px] w-[420px] rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute left-[-120px] top-32 h-[320px] w-[420px] rounded-full bg-tertiary/10 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            PhD Project Journey
          </div>

          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
              Project Roadmap
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            A step-by-step view of every milestone in the NOA prediction project — from literature review to a fully reproducible code release. Click any step to explore.
          </p>

          {/* Progress summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mx-auto mt-7 flex w-full max-w-xl flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur sm:flex-row sm:gap-5 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </p>
                <p className="text-sm font-semibold text-foreground">
                  All {TOTAL} milestones completed
                </p>
              </div>
            </div>

            <div className="flex-1 sm:pl-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {TOTAL}/{TOTAL} • 100%
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.6, duration: 1.1, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Timeline */}
        <motion.ol
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative mt-14 list-none"
        >
          {/* Vertical track */}
          <div
            aria-hidden
            className="absolute left-7 top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-border to-transparent sm:left-9"
          />
          <motion.div
            aria-hidden
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.4, duration: 1.4, ease: 'easeInOut' }}
            style={{ transformOrigin: 'top' }}
            className="absolute left-7 top-2 bottom-2 w-[2px] rounded-full bg-gradient-to-b from-primary/70 via-secondary/70 to-tertiary/70 sm:left-9"
          />

          {MILESTONES.map((m) => (
            <MilestoneRow key={m.id} milestone={m} />
          ))}
        </motion.ol>

        {/* Footer flourish */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 + TOTAL * 0.09, duration: 0.5 }}
          className="mt-12 flex items-center justify-center gap-3 text-xs text-muted-foreground"
        >
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          End-to-end PhD pipeline — fully reproducible &amp; defended.
        </motion.div>
      </div>
    </div>
  )
}

function MilestoneRow({ milestone }: { milestone: Milestone }) {
  const Icon = milestone.icon
  return (
    <motion.li variants={itemVariants} className="relative pl-20 pb-7 sm:pl-24">
      {/* Step number marker on the timeline */}
      <div className="absolute left-0 top-1.5 sm:left-0">
        <div
          className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${milestone.gradient} text-white shadow-lg ring-4 ${milestone.ring} ring-offset-2 ring-offset-background sm:h-[72px] sm:w-[72px]`}
        >
          <span className="absolute inset-0 rounded-full bg-white/10 mix-blend-overlay" />
          <span className="text-lg font-bold tabular-nums sm:text-2xl">
            {milestone.step}
          </span>
        </div>
      </div>

      {/* Card */}
      <Link
        href={milestone.route}
        className="group block focus:outline-none"
        aria-label={`Open ${milestone.title}`}
      >
        <motion.div
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background"
        >
          {/* Colored gradient accent strip on the left */}
          <div
            aria-hidden
            className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${milestone.gradient}`}
          />
          {/* Soft tinted glow on hover */}
          <div
            aria-hidden
            className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br ${milestone.gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-25`}
          />

          <div className="flex items-start gap-4 p-5 pl-6 sm:gap-5 sm:p-6 sm:pl-7">
            {/* Icon tile */}
            <div
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${milestone.tint} sm:h-14 sm:w-14`}
            >
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.8} />
            </div>

            {/* Body */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Step {milestone.step} of {TOTAL}
                </p>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Completed
                </span>
              </div>

              <h3 className="mt-1.5 text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-primary sm:text-xl">
                {milestone.title}
              </h3>

              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground sm:text-[14.5px]">
                {milestone.description}
              </p>

              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary">
                <span>Open section</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.li>
  )
}
