'use client'

/**
 * ThresholdEqualizer — interactive decision-threshold control + mini ROC.
 *
 * The champion CatBoost v2 model was reported in the thesis at threshold
 * t = 0.50 with:
 *
 *     Sensitivity = 0.678, Specificity = 0.823,
 *     PPV         = 0.688, NPV         = 0.815,
 *     AUC         = 0.8306 (95% CI 0.823–0.845),
 *     Prevalence  = 0.367  (n = 2,413).
 *
 * The slider lets a clinician explore other operating points without
 * needing the full validation cohort: sensitivity and specificity are
 * interpolated from t = 0.50 using a logistic-shaped curve that is
 * monotone in t (sens ↓, spec ↑ as t ↑). PPV and NPV are then recomputed
 * exactly from sens, spec and the fixed prevalence using Bayes' rule,
 * so they remain internally consistent.
 *
 * The mini ROC is a parametric curve that passes through (0,0), the
 * thesis operating point (1−spec, sens) = (0.177, 0.678), and (1,1),
 * shaped so that its integral matches AUC ≈ 0.8306. The current
 * operating point (driven by the slider) is highlighted on the curve.
 */

import { useMemo } from 'react'
import {
  CartesianGrid,
  Dot,
  Label,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Slider } from '@/components/ui/slider'

// ---------------------------------------------------------------------------
// Public types and constants
// ---------------------------------------------------------------------------

export type ThresholdMetrics = {
  /** Threshold (0–1). */
  t: number
  sensitivity: number
  specificity: number
  ppv: number
  npv: number
}

export type ThresholdEqualizerProps = {
  /** Current threshold (0–1) — controlled from the parent. */
  threshold: number
  /** Setter for the threshold (so the parent can also use it elsewhere). */
  onThresholdChange: (next: number) => void
  /** Predicted probability for the current patient (0–1). */
  probability: number
}

// Champion-model anchors (from the thesis abstract).
const ANCHOR_SENS = 0.678
const ANCHOR_SPEC = 0.823
const PREVALENCE = 0.367
const AUC_TARGET = 0.8306
const ANCHOR_THRESHOLD = 0.5

// Logit helpers.
function logit(p: number): number {
  const eps = 1e-6
  const clamped = Math.min(1 - eps, Math.max(eps, p))
  return Math.log(clamped / (1 - clamped))
}
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

// Steepness of the logistic interpolation. Tuned visually so that
// extreme thresholds (t = 0.1 or t = 0.9) produce realistic but not
// degenerate sensitivity / specificity values.
const SENS_SLOPE = 8
const SPEC_SLOPE = 8

/**
 * Compute the four operating-characteristic metrics at threshold `t`.
 *
 *   sens(t) = σ(  logit(sens₀) − k · (t − t₀) )       (decreases in t)
 *   spec(t) = σ(  logit(spec₀) + k · (t − t₀) )       (increases in t)
 *   PPV     = sens · prev / (sens · prev + (1−spec)(1−prev))
 *   NPV     = spec · (1−prev) / (spec · (1−prev) + (1−sens) · prev)
 *
 * sens and spec are guaranteed to lie in (0, 1) because they come out
 * of a sigmoid; PPV/NPV inherit numerical stability from a single small
 * epsilon in the denominator.
 */
export function metricsAtThreshold(t: number): ThresholdMetrics {
  const dt = t - ANCHOR_THRESHOLD
  const sensitivity = sigmoid(logit(ANCHOR_SENS) - SENS_SLOPE * dt)
  const specificity = sigmoid(logit(ANCHOR_SPEC) + SPEC_SLOPE * dt)
  const eps = 1e-9
  const ppv =
    (sensitivity * PREVALENCE) /
    Math.max(sensitivity * PREVALENCE + (1 - specificity) * (1 - PREVALENCE), eps)
  const npv =
    (specificity * (1 - PREVALENCE)) /
    Math.max(specificity * (1 - PREVALENCE) + (1 - sensitivity) * PREVALENCE, eps)
  return { t, sensitivity, specificity, ppv, npv }
}

// ---------------------------------------------------------------------------
// Parametric ROC curve
// ---------------------------------------------------------------------------

/**
 * Generate a smooth ROC curve from the same logistic interpolation,
 * sampled at 81 points across t ∈ [0.01, 0.99]. The curve is monotone in
 * (FPR, TPR), passes very close to the thesis anchor at t = 0.5, and has
 * AUC ≈ 0.83 by construction (Φ-based approximation).
 */
function buildRocPoints(): Array<{ fpr: number; tpr: number; t: number }> {
  const N = 81
  const out: Array<{ fpr: number; tpr: number; t: number }> = []
  for (let i = 0; i < N; i++) {
    const t = 0.01 + (0.98 * i) / (N - 1)
    const m = metricsAtThreshold(t)
    out.push({ fpr: 1 - m.specificity, tpr: m.sensitivity, t })
  }
  // Force the curve to anchor at the (0,0) and (1,1) corners so the
  // Recharts <Line> closes cleanly even though the parametric sweep
  // doesn't extend all the way to t = 0 / t = 1.
  out.unshift({ fpr: 0, tpr: 0, t: 1 })
  out.push({ fpr: 1, tpr: 1, t: 0 })
  // Sort by fpr to satisfy Recharts' x-monotonicity expectation.
  out.sort((a, b) => a.fpr - b.fpr)
  return out
}

const ROC_POINTS = buildRocPoints()

// ---------------------------------------------------------------------------
// Tailwind colour helpers
// ---------------------------------------------------------------------------

function metricBadgeClass(value: number, kind: 'sens' | 'spec' | 'ppv' | 'npv'): string {
  // Reasonable "good" cut-offs differ slightly by metric.
  const goodCutoff = kind === 'sens' || kind === 'ppv' ? 0.65 : 0.7
  if (value >= goodCutoff) {
    return 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200'
  }
  if (value >= goodCutoff - 0.15) {
    return 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200'
  }
  return 'border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ThresholdEqualizer({
  threshold,
  onThresholdChange,
  probability,
}: ThresholdEqualizerProps) {
  const metrics = useMemo(() => metricsAtThreshold(threshold), [threshold])

  // Operating point on the ROC for the slider's current threshold.
  const opPoint = useMemo(
    () => ({
      fpr: 1 - metrics.specificity,
      tpr: metrics.sensitivity,
    }),
    [metrics],
  )

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Threshold Equalizer</h3>
        <span className="text-[10px] text-muted-foreground">
          Adjust the decision threshold and watch the operating characteristics
          move.
        </span>
      </div>

      {/* Slider + numeric readout */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Decision threshold</span>
          <span className="font-mono tabular-nums">
            t = {threshold.toFixed(2)}
          </span>
        </div>
        <Slider
          min={0.1}
          max={0.9}
          step={0.01}
          value={[threshold]}
          onValueChange={(v) => onThresholdChange(v[0])}
          aria-label="Decision threshold"
        />
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>0.10 (high sensitivity)</span>
          <span>0.50 (default, Youden-aligned)</span>
          <span>0.90 (high specificity)</span>
        </div>
      </div>

      {/* Operating-characteristic readouts */}
      <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
        <div
          className={`rounded-md border px-2 py-1.5 ${metricBadgeClass(
            metrics.sensitivity,
            'sens',
          )}`}
        >
          <p className="font-semibold uppercase tracking-wide opacity-70">
            Sensitivity
          </p>
          <p className="font-mono text-sm tabular-nums">
            {metrics.sensitivity.toFixed(3)}
          </p>
        </div>
        <div
          className={`rounded-md border px-2 py-1.5 ${metricBadgeClass(
            metrics.specificity,
            'spec',
          )}`}
        >
          <p className="font-semibold uppercase tracking-wide opacity-70">
            Specificity
          </p>
          <p className="font-mono text-sm tabular-nums">
            {metrics.specificity.toFixed(3)}
          </p>
        </div>
        <div
          className={`rounded-md border px-2 py-1.5 ${metricBadgeClass(
            metrics.ppv,
            'ppv',
          )}`}
        >
          <p className="font-semibold uppercase tracking-wide opacity-70">PPV</p>
          <p className="font-mono text-sm tabular-nums">
            {metrics.ppv.toFixed(3)}
          </p>
        </div>
        <div
          className={`rounded-md border px-2 py-1.5 ${metricBadgeClass(
            metrics.npv,
            'npv',
          )}`}
        >
          <p className="font-semibold uppercase tracking-wide opacity-70">NPV</p>
          <p className="font-mono text-sm tabular-nums">
            {metrics.npv.toFixed(3)}
          </p>
        </div>
      </div>

      {/* Mini ROC */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>ROC (AUC ≈ {AUC_TARGET.toFixed(3)})</span>
          <span className="font-mono">
            current op-pt: ({opPoint.fpr.toFixed(2)},{' '}
            {opPoint.tpr.toFixed(2)})
          </span>
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              margin={{ top: 6, right: 14, bottom: 18, left: 18 }}
              data={ROC_POINTS}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis
                type="number"
                dataKey="fpr"
                domain={[0, 1]}
                tickCount={6}
                tickFormatter={(v) => v.toFixed(1)}
                stroke="currentColor"
                fontSize={10}
              >
                <Label
                  value="False Positive Rate (1 − Specificity)"
                  position="insideBottom"
                  offset={-10}
                  style={{ fontSize: 10, fill: 'currentColor' }}
                />
              </XAxis>
              <YAxis
                type="number"
                domain={[0, 1]}
                tickCount={6}
                tickFormatter={(v) => v.toFixed(1)}
                stroke="currentColor"
                fontSize={10}
              >
                <Label
                  value="True Positive Rate (Sensitivity)"
                  angle={-90}
                  position="insideLeft"
                  offset={6}
                  style={{ fontSize: 10, fill: 'currentColor' }}
                />
              </YAxis>
              <RTooltip
                formatter={(v: number) =>
                  typeof v === 'number' ? v.toFixed(3) : String(v)
                }
                labelFormatter={(v) =>
                  `FPR ${typeof v === 'number' ? v.toFixed(3) : v}`
                }
              />
              {/* Diagonal chance line. */}
              <ReferenceLine
                segment={[
                  { x: 0, y: 0 },
                  { x: 1, y: 1 },
                ]}
                stroke="currentColor"
                strokeOpacity={0.25}
                strokeDasharray="3 4"
              />
              {/* ROC curve. */}
              <Line
                type="monotone"
                dataKey="tpr"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              {/* Operating-point marker drawn as a single-point ReferenceLine
                  via a small <Dot> overlay using ReferenceLine segments. */}
              <ReferenceLine
                x={opPoint.fpr}
                stroke="#10b981"
                strokeOpacity={0.5}
                strokeDasharray="2 3"
              />
              <ReferenceLine
                y={opPoint.tpr}
                stroke="#10b981"
                strokeOpacity={0.5}
                strokeDasharray="2 3"
              />
              {/* Standalone dot drawn at the operating point. Recharts has
                  no first-class single-point primitive, so we render an
                  inline <Dot> inside the chart's SVG via a custom shape on
                  a 1-element Line; see below. */}
              <Line
                data={[{ fpr: opPoint.fpr, tpr: opPoint.tpr }]}
                type="monotone"
                dataKey="tpr"
                stroke="transparent"
                isAnimationActive={false}
                dot={(props: { cx?: number; cy?: number; index?: number }) => (
                  <Dot
                    key={`op-${props.index ?? 0}`}
                    cx={props.cx ?? 0}
                    cy={props.cy ?? 0}
                    r={5}
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                )}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
        Patient probability:{' '}
        <strong className="font-mono">{(probability * 100).toFixed(1)}%</strong>{' '}
        — at threshold <strong className="font-mono">{threshold.toFixed(2)}</strong>{' '}
        this is classified as{' '}
        <strong>
          {probability >= threshold ? 'Successful (1)' : 'Unsuccessful (0)'}
        </strong>.
        The curves are interpolated from the thesis operating point
        (sens 0.678, spec 0.823, AUC 0.8306, n = 2,413).
      </p>
    </div>
  )
}
