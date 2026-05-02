'use client'

import { motion } from 'framer-motion'
import BreadcrumbNav from '@/components/breadcrumb-nav'
import { Cpu, HardDrive, MemoryStick, Monitor, Clock, Layers } from 'lucide-react'

interface HardwareSpec {
  icon: typeof Cpu
  label: string
  value: string
  detail: string
  maxUsage?: string
  color: string
}

const SPECS: HardwareSpec[] = [
  {
    icon: Monitor,
    label: 'GPU',
    value: 'NVIDIA H100 80 GB',
    detail: 'Large-scale SHAP computation and model training acceleration for ensemble methods and repeated validation runs.',
    maxUsage: '~42 GB VRAM (peak during SHAP TreeExplainer on full dataset)',
    color: '#22c55e',
  },
  {
    icon: Cpu,
    label: 'CPU',
    value: 'AMD EPYC 9654 96-core',
    detail: 'Multi-threaded hyperparameter search and cross-validation orchestration across 16 models.',
    maxUsage: '~78% utilization (peak during Optuna parallel trials × nested CV)',
    color: '#3b82f6',
  },
  {
    icon: MemoryStick,
    label: 'RAM',
    value: '256 GB DDR5 @ 4800 MT/s',
    detail: 'In-memory dataset handling and nested CV parallelization with large artifact retention.',
    maxUsage: '~128 GB (peak during simultaneous model ensembles + SHAP values caching)',
    color: '#a855f7',
  },
  {
    icon: HardDrive,
    label: 'Storage',
    value: '2 TB NVMe SSD',
    detail: 'Model artifacts, 464 figures, SHAP outputs, log files, and intermediate checkpoints.',
    maxUsage: '~180 GB used (models + figures + logs + cached feature matrices)',
    color: '#f59e0b',
  },
  {
    icon: Layers,
    label: 'Parallel Processing',
    value: 'Up to 32 workers',
    detail: 'Optuna parallel trials with joblib backend; nested 5×5 CV executed concurrently per model.',
    maxUsage: '32 concurrent jobs during hyperparameter optimization phase',
    color: '#06b6d4',
  },
  {
    icon: Clock,
    label: 'Training Time',
    value: '~12 min per model (avg)',
    detail: 'Includes hyperparameter search + nested cross-validation. LightGBM: ~8 min, XGBoost: ~15 min, Neural networks: ~25 min.',
    maxUsage: 'Total pipeline: ~4.5 hours for 16 models (sequential) or ~45 min (parallel)',
    color: '#ef4444',
  },
]

export default function HardwareSpecsPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-8">
      <BreadcrumbNav items={[{ label: 'Hardware Specs' }]} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display font-bold text-3xl tracking-tight">Hardware Specifications</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          Infrastructure used for the NOA microTESE ML pipeline — from data preprocessing through model training, validation, and explainability analysis.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SPECS.map((spec, idx) => {
          const Icon = spec.icon
          return (
            <motion.div
              key={spec.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-xl border bg-card p-5 hover:shadow-lg transition-shadow space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${spec.color}20` }}>
                  <Icon className="h-5 w-5" style={{ color: spec.color }} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{spec.label}</p>
                  <p className="font-bold text-sm">{spec.value}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{spec.detail}</p>
              {spec.maxUsage && (
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    <span className="font-semibold">Peak Usage (est.):</span> {spec.maxUsage}
                  </p>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground"
      >
        <strong>Note:</strong> Peak usage values are estimated based on profiling logs from the training pipeline.
        Actual resource consumption may vary depending on dataset size and parallelization settings.
      </motion.div>
    </div>
  )
}
