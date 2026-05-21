'use client'

/**
 * ModelInterpretation — collapsible "explain the model output" panel.
 *
 * Layout:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  ▾ Model interpretation — feature ranking          (12 feats)│
 *   ├──────────────────────────────────────────────────────────────┤
 *   │  LH                ▰▰▰▰▰▰▰▰▰▰    +0.198    (↑)              │
 *   │  Testosterone      ▰▰▰▰▰▰▰       −0.142    (↓)              │
 *   │  FSH               ▰▰▰▰▰         +0.094    (↑)              │
 *   │  …                                                           │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Each row shows:
 *   • feature label (left)
 *   • horizontal mini-bar whose width = |contribution|/maxAbs (centre)
 *   • signed contribution in logit units (right, font-mono)
 *
 * Tooltip text is *model interpretation only*: it states what the feature
 * did to the predicted probability of sperm retrieval, NOT what the
 * clinician should infer or do about the patient. We are deliberately
 * careful here because SHAP contributions are correlational signals
 * inside the model, not causal evidence in a patient.
 *
 * Default state is closed — the SHAP waterfall above is the primary
 * visual explanation; this panel exists for the user who wants to drill
 * into the exact numeric contribution of every entered feature.
 */

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ShapContribution } from './cdss-shap-waterfall'

export type ModelInterpretationProps = {
  contributions: ShapContribution[]
}

export default function ModelInterpretation({
  contributions,
}: ModelInterpretationProps) {
  const [open, setOpen] = useState(false)

  /**
   * Sort by |contribution| desc so the most influential features appear
   * at the top. We do NOT drop tiny contributions here (unlike the
   * waterfall) — this panel is meant to be the complete ranking, so a
   * feature with a near-zero SHAP value is still useful information
   * ("this biomarker had essentially no effect on the prediction").
   */
  const sorted = useMemo(
    () =>
      [...contributions].sort(
        (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution),
      ),
    [contributions],
  )

  /** Normaliser for the mini-bars. Guard against all-zero contributions. */
  const maxAbs = useMemo(() => {
    const m = Math.max(...sorted.map((c) => Math.abs(c.contribution)), 1e-6)
    return m
  }, [sorted])

  if (sorted.length === 0) return null

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-lg px-4 py-3 text-left transition hover:bg-muted/40"
          >
            <div className="flex items-center gap-2">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  open ? 'rotate-0' : '-rotate-90'
                }`}
              />
              <span className="text-sm font-semibold">
                Model interpretation — feature ranking
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {sorted.length} feature{sorted.length === 1 ? '' : 's'}
            </span>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-1.5 border-t px-4 py-3">
            {sorted.map((c) => {
              const positive = c.contribution > 0
              const widthPct = (Math.abs(c.contribution) / maxAbs) * 100
              const signed = `${c.contribution >= 0 ? '+' : ''}${c.contribution.toFixed(3)}`
              const direction = positive
                ? 'pushing the prediction toward LIKELY retrieval'
                : 'pulling the prediction toward UNLIKELY retrieval'

              return (
                <Tooltip key={c.key}>
                  <TooltipTrigger asChild>
                    <div className="grid cursor-help grid-cols-[7rem_1fr_4.5rem] items-center gap-3 rounded-md px-2 py-1.5 text-xs transition hover:bg-muted/30">
                      <span className="truncate font-medium" title={c.label}>
                        {c.label}
                      </span>

                      {/* Mini bar: filled width is signed, but visually mirrored
                          around the centre so positive grows right and
                          negative grows left. Kept simple (single colour
                          per row) — the sign is also conveyed by the
                          numeric value on the right. */}
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                        <div
                          className={`absolute top-0 h-1.5 rounded-full ${
                            positive ? 'bg-emerald-500' : 'bg-rose-500'
                          } ${positive ? 'left-1/2' : 'right-1/2'}`}
                          style={{ width: `${widthPct / 2}%` }}
                        />
                        {/* Centre tick so the user can see the zero line. */}
                        <div className="absolute left-1/2 top-0 h-1.5 w-px bg-muted-foreground/40" />
                      </div>

                      <span
                        className={`text-right font-mono text-xs tabular-nums ${
                          positive ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {signed}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-xs leading-relaxed">
                      <span className="font-semibold">{c.label}</span>{' '}
                      contributed{' '}
                      <span className="font-mono">{signed}</span> to the
                      logit, {direction}.
                    </p>
                    <p className="mt-1 text-[10px] italic text-muted-foreground">
                      Model interpretation only — this is how the model used
                      the feature, not a clinical recommendation.
                    </p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
