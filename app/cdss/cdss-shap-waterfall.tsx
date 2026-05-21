'use client'

/**
 * ShapWaterfall — local-explanation visualisation for the CDSS form.
 *
 * Layout (horizontal):
 *
 *   ┌────────────────────────────────────────────────────────────────────┐
 *   │  Base 36.7%                                       → Final 58.4%    │
 *   │                                                                    │
 *   │  LH                  ▰▰▰▰▰▰▰▰    +12.4%   ↑                        │
 *   │  Age                 ▰▰▰▰▰        +6.1%   ↑                        │
 *   │  FSH        ▰▰▰▰▰    −4.5%   ↓                                     │
 *   │  Testosterone        ▰▰▰          +3.2%   ↑                        │
 *   │  …                                                                 │
 *   └────────────────────────────────────────────────────────────────────┘
 *
 * Inputs are signed *local* SHAP contributions in logit space (computed
 * in cdss-form.tsx as `weight * normalizeWithinBounds(value, field)` for
 * each entered biomarker, plus a single aggregated pathology contribution).
 * For visual purposes the magnitudes are normalised against the maximum
 * absolute contribution so bars span [0, 100%] of the available width.
 * The numeric label on each bar is the *signed contribution to the model
 * logit* (rounded to 3 dp) so it ties back to the underlying calculation
 * — exactly what a SHAP waterfall is meant to surface.
 *
 * Animation: Framer Motion staggers the bars in from the left so the user
 * perceives the contributions accumulating from base rate to final
 * probability.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'

export type ShapContribution = {
  /** Stable identifier (used as React key). */
  key: string
  /** Display label (matches the form input label). */
  label: string
  /**
   * Signed contribution to the model logit. Positive → pushes the
   * prediction toward retrieval = 1 (successful). Negative → pushes
   * toward retrieval = 0 (unsuccessful).
   */
  contribution: number
}

export type ShapWaterfallProps = {
  /** Base-rate probability (0–1) — the model's prior, e.g. 0.367. */
  baseRate: number
  /** Final predicted probability (0–1). */
  probability: number
  /** Per-feature signed contributions (any order — sorted internally). */
  contributions: ShapContribution[]
}

export default function ShapWaterfall({
  baseRate,
  probability,
  contributions,
}: ShapWaterfallProps) {
  // Sort by absolute magnitude (largest first) and drop ~zero rows so the
  // chart stays readable. 1e-4 in logit space is irrelevant clinically.
  const rows = useMemo(() => {
    const filtered = contributions.filter((c) => Math.abs(c.contribution) > 1e-4)
    filtered.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    return filtered
  }, [contributions])

  // Scale factor: largest absolute contribution maps to 100% of the bar
  // width. If everything is essentially zero, fall back to 1.0 to avoid
  // division-by-zero and emit a flat row.
  const maxAbs = useMemo(
    () => Math.max(...rows.map((c) => Math.abs(c.contribution)), 1e-4),
    [rows],
  )

  const probabilityPct = (probability * 100).toFixed(1)
  const baseRatePct = (baseRate * 100).toFixed(1)
  const deltaPct = (probability * 100 - baseRate * 100).toFixed(1)
  const deltaPositive = probability >= baseRate

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Local SHAP Explanation</h3>
        <span className="text-[10px] text-muted-foreground">
          per-feature contributions to the model logit
        </span>
      </div>

      {/* Base → Final summary */}
      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Base rate
          </p>
          <p className="font-semibold tabular-nums">{baseRatePct}%</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-1">
          {deltaPositive ? (
            <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-red-600" />
          )}
          <span
            className={
              deltaPositive
                ? 'font-medium text-emerald-700 dark:text-emerald-300'
                : 'font-medium text-red-700 dark:text-red-300'
            }
          >
            {deltaPositive ? '+' : ''}
            {deltaPct} pp
          </span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Final
          </p>
          <p className="font-semibold tabular-nums">{probabilityPct}%</p>
        </div>
      </div>

      {/* Bars */}
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
          No biomarker values entered — fill the form above to see per-feature
          contributions.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((row, i) => {
            const positive = row.contribution >= 0
            const widthPct = Math.min(
              100,
              Math.abs(row.contribution) / maxAbs * 100,
            )
            return (
              <li
                key={row.key}
                className="grid grid-cols-[7.5rem_1fr_3.75rem] items-center gap-2 text-[11px]"
              >
                <span
                  className="truncate font-medium text-foreground/80"
                  title={row.label}
                >
                  {row.label}
                </span>
                {/* Bar track: centred two-direction axis. */}
                <div className="relative h-3.5 w-full">
                  {/* Centre line (zero axis). */}
                  <div className="absolute left-1/2 top-0 h-full w-px bg-border" />
                  {/* Filled bar — left or right of centre depending on sign. */}
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: `${widthPct / 2}%`, opacity: 1 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.04 * i,
                      ease: 'easeOut',
                    }}
                    className={
                      positive
                        ? 'absolute left-1/2 top-0 h-full rounded-r-sm bg-emerald-500/80'
                        : 'absolute right-1/2 top-0 h-full rounded-l-sm bg-red-500/80'
                    }
                  />
                </div>
                <span
                  className={
                    positive
                      ? 'text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-300'
                      : 'text-right font-mono tabular-nums text-red-700 dark:text-red-300'
                  }
                  title="Signed contribution to the model logit"
                >
                  {positive ? '+' : ''}
                  {row.contribution.toFixed(3)}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
        Bars are scaled to the largest absolute contribution in this case.
        Green bars push the prediction toward <strong>successful retrieval</strong>;
        red bars push it toward <strong>unsuccessful retrieval</strong>. Values
        are in logit (log-odds) units.
      </p>
    </div>
  )
}
