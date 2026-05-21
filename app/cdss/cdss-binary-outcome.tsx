'use client'

/**
 * BinaryOutcomeCard
 *
 * Prominent visual decision for the current patient: at the user-selected
 * threshold, is sperm retrieval LIKELY (probability ≥ threshold) or
 * UNLIKELY?
 *
 * Animations: when the predicted outcome flips (because the slider crosses
 * the patient's predicted probability or because a new probability is
 * computed), the card swaps with a Framer Motion AnimatePresence
 * cross-fade + slide so the change is perceived rather than missed.
 */

import { AnimatePresence, motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

export type BinaryOutcomeCardProps = {
  /** Predicted probability (0–1). */
  probability: number
  /** Decision threshold (0–1). */
  threshold: number
}

export default function BinaryOutcomeCard({
  probability,
  threshold,
}: BinaryOutcomeCardProps) {
  const likely = probability >= threshold
  const probabilityPct = probability * 100
  const thresholdPct = threshold * 100
  // Distance from the threshold in percentage points — used to colour the
  // "confidence" cue. Close to threshold → less confident.
  const distancePct = Math.abs(probabilityPct - thresholdPct)

  // Border / background palette is driven entirely by the outcome.
  const containerClass = likely
    ? 'border-emerald-400 bg-emerald-50/80 dark:border-emerald-700 dark:bg-emerald-950/40'
    : 'border-red-400 bg-red-50/80 dark:border-red-700 dark:bg-red-950/40'

  const titleClass = likely
    ? 'text-emerald-700 dark:text-emerald-200'
    : 'text-red-700 dark:text-red-200'

  return (
    <div className={`rounded-xl border-2 p-5 text-center ${containerClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Sperm Retrieval Prediction at t = {threshold.toFixed(2)}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={likely ? 'likely' : 'unlikely'}
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="my-2 flex items-center justify-center gap-3"
        >
          <span
            className={
              likely
                ? 'inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/40'
                : 'inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-md shadow-red-200 dark:shadow-red-900/40'
            }
            aria-hidden
          >
            {likely ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
          </span>
          <span
            className={`font-display text-2xl font-bold tracking-tight ${titleClass}`}
          >
            {likely ? 'LIKELY' : 'UNLIKELY'}
          </span>
        </motion.div>
      </AnimatePresence>

      <p className="text-xs text-muted-foreground">
        Predicted probability{' '}
        <strong className="font-mono tabular-nums text-foreground/90">
          {probabilityPct.toFixed(1)}%
        </strong>{' '}
        {likely ? '≥' : '<'} threshold{' '}
        <strong className="font-mono tabular-nums text-foreground/90">
          {thresholdPct.toFixed(0)}%
        </strong>
      </p>

      {distancePct < 5 && (
        <p className="mt-2 text-[10px] font-medium text-amber-700 dark:text-amber-300">
          Borderline case — &lt; 5 percentage points from the threshold.
          Consider sensitivity-analysis at neighbouring thresholds.
        </p>
      )}
    </div>
  )
}
