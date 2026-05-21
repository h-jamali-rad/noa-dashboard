'use client'

/**
 * BiomarkerDistributionChart
 * --------------------------------------------------------------------------
 * Renders a compact density chart for a single biomarker input in the CDSS
 * form. It replaces the previous simple "RangeBar" bar visualisation.
 *
 * Visual layers (back → front):
 *   1. Gaussian KDE curve of the n=2,413 cohort values, drawn as a soft
 *      filled area (Recharts <Area>).
 *   2. Inter-Quartile Range (Q1–Q3) band, drawn as a semi-transparent
 *      vertical strip (Recharts <ReferenceArea>) — this is the "normal"
 *      population window.
 *   3. A user-value vertical marker (Recharts <ReferenceLine>) whose colour
 *      switches to red and is wrapped in a pulsing animation when the value
 *      falls outside the Tukey fence (Q1 − 1.5·IQR, Q3 + 1.5·IQR).
 *   4. A small zone badge + numeric population position (percentile rank)
 *      displayed below the chart so the user can read a single fact even
 *      when the chart is collapsed by responsive scaling.
 *
 * KDE implementation
 * --------------------------------------------------------------------------
 * Standard Gaussian KDE with Scott's-rule bandwidth:
 *
 *     h = 1.06 · σ · n^(-1/5)
 *     f̂(x) = (1 / n·h) · Σ_i K((x − x_i) / h)
 *     K(z) = (1 / √(2π)) · exp(−z²/2)
 *
 * The density is evaluated at 100 evenly-spaced grid points spanning
 * [min, max] of the cohort. The cohort's `values` array is sub-sampled
 * (in biomarker_distributions.json) to 500 points which keeps KDE cost
 * around 50,000 multiply-adds per biomarker — negligible in a browser.
 *
 * Performance
 * --------------------------------------------------------------------------
 * KDE samples are wrapped in `useMemo` keyed only on the immutable
 * distribution object, so re-renders triggered by the user typing in the
 * input field do NOT recompute the density. Only the marker line moves.
 *
 * Accessibility
 * --------------------------------------------------------------------------
 * The chart is decorative — the canonical value is the <input> next to it.
 * It carries `aria-hidden` so screen readers fall through to the input.
 * --------------------------------------------------------------------------
 */

import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import {
  Area,
  AreaChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BiomarkerDistribution = {
  /** Cohort minimum. */
  min: number
  /** First quartile (25th percentile). */
  q1: number
  /** Median (50th percentile). */
  median: number
  /** Third quartile (75th percentile). */
  q3: number
  /** Cohort maximum. */
  max: number
  /** Cohort mean. */
  mean: number
  /** True n (e.g. 2,413). */
  n: number
  /** Sub-sampled values used for KDE. */
  values: number[]
}

type BiomarkerDistributionChartProps = {
  /** The user-entered value as a raw string (may be empty / invalid). */
  value: string | undefined
  /** Cohort distribution; if undefined, the chart renders a placeholder. */
  distribution: BiomarkerDistribution | undefined
  /** Display name for the biomarker (used in aria-label). */
  label: string
}

// ---------------------------------------------------------------------------
// KDE helpers
// ---------------------------------------------------------------------------

const KDE_GRID_POINTS = 100

/** Sample standard deviation (Bessel-corrected). */
function stdDev(xs: number[]): number {
  const n = xs.length
  if (n < 2) return 0
  const mean = xs.reduce((a, b) => a + b, 0) / n
  const v = xs.reduce((acc, x) => acc + (x - mean) ** 2, 0) / (n - 1)
  return Math.sqrt(Math.max(v, 0))
}

/**
 * Gaussian KDE evaluated on a uniform grid spanning [min, max].
 *
 * Returns an array of `{ x, density }` objects ready to feed into Recharts.
 * Uses Scott's rule for the bandwidth, with a floor of (max − min) / 100
 * so that highly-clustered features (e.g. Seminal_plasma_pH around 7.8)
 * still produce a visible curve instead of a single spike.
 */
function computeGaussianKDE(
  values: number[],
  domainMin: number,
  domainMax: number,
): Array<{ x: number; density: number }> {
  const n = values.length
  if (n === 0 || domainMax <= domainMin) return []

  const sigma = stdDev(values)
  // Scott's rule: h = 1.06 * σ * n^(-1/5)
  let h = 1.06 * sigma * Math.pow(n, -1 / 5)
  // Avoid pathological collapse — at least a 100th of the domain.
  const domainSpan = domainMax - domainMin
  h = Math.max(h, domainSpan / 100, 1e-9)

  const inv2h2 = 1 / (2 * h * h)
  const norm = 1 / (n * h * Math.sqrt(2 * Math.PI))

  const out: Array<{ x: number; density: number }> = new Array(KDE_GRID_POINTS)
  for (let i = 0; i < KDE_GRID_POINTS; i++) {
    const x = domainMin + (domainSpan * i) / (KDE_GRID_POINTS - 1)
    let sum = 0
    for (let j = 0; j < n; j++) {
      const d = x - values[j]
      sum += Math.exp(-d * d * inv2h2)
    }
    out[i] = { x, density: norm * sum }
  }
  return out
}

// ---------------------------------------------------------------------------
// Outlier / zone helpers
// ---------------------------------------------------------------------------

type Zone =
  | 'unknown'      // no value entered
  | 'extreme-low'  // < q1 − 1.5·IQR  (Tukey fence outlier)
  | 'extreme-high' // > q3 + 1.5·IQR  (Tukey fence outlier)
  | 'low'          // [q1 − 1.5·IQR, q1)
  | 'iqr'          // [q1, q3]
  | 'high'         // (q3, q3 + 1.5·IQR]

type ZoneInfo = {
  zone: Zone
  isOutlier: boolean
  label: string
  /** Tailwind utility classes for the badge. */
  badgeClass: string
  /** Hex marker / chart-stroke colour. */
  color: string
}

function classifyValue(value: number, d: BiomarkerDistribution): ZoneInfo {
  const iqr = Math.max(d.q3 - d.q1, 0)
  const lowerFence = d.q1 - 1.5 * iqr
  const upperFence = d.q3 + 1.5 * iqr

  if (value < lowerFence) {
    return {
      zone: 'extreme-low',
      isOutlier: true,
      label: 'Outlier (extreme low)',
      badgeClass:
        'text-red-700 bg-red-50 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-700',
      color: '#dc2626',
    }
  }
  if (value > upperFence) {
    return {
      zone: 'extreme-high',
      isOutlier: true,
      label: 'Outlier (extreme high)',
      badgeClass:
        'text-red-700 bg-red-50 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-700',
      color: '#dc2626',
    }
  }
  if (value < d.q1) {
    return {
      zone: 'low',
      isOutlier: false,
      label: 'Below IQR',
      badgeClass:
        'text-sky-700 bg-sky-50 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-700',
      color: '#0284c7',
    }
  }
  if (value > d.q3) {
    return {
      zone: 'high',
      isOutlier: false,
      label: 'Above IQR',
      badgeClass:
        'text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700',
      color: '#d97706',
    }
  }
  return {
    zone: 'iqr',
    isOutlier: false,
    label: 'Within IQR',
    badgeClass:
      'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700',
    color: '#059669',
  }
}

/** Percentile rank of `value` in `values` (closed interval, ≤). */
function percentileRank(value: number, values: number[]): number {
  if (values.length === 0) return 0
  let count = 0
  for (let i = 0; i < values.length; i++) {
    if (values[i] <= value) count++
  }
  return (count / values.length) * 100
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BiomarkerDistributionChart({
  value,
  distribution,
  label,
}: BiomarkerDistributionChartProps) {
  /**
   * Pre-compute the KDE grid once per `distribution` reference. This is
   * the hot path on input edits — we explicitly do NOT include `value` in
   * the dependency array because the curve never changes per-keystroke.
   */
  const kdeData = useMemo(() => {
    if (!distribution) return []
    return computeGaussianKDE(distribution.values, distribution.min, distribution.max)
  }, [distribution])

  /**
   * Y-axis upper limit. Recharts auto-fits poorly when one bucket of the
   * KDE has a spike (e.g. a clustered biomarker), so we set it explicitly
   * to a 10% headroom above the maximum density.
   */
  const yMax = useMemo(() => {
    if (kdeData.length === 0) return 1
    let m = 0
    for (const p of kdeData) if (p.density > m) m = p.density
    return m * 1.1
  }, [kdeData])

  if (!distribution) {
    // The JSON has not yet loaded — render a thin skeleton bar so the
    // form layout remains stable.
    return (
      <div
        className="mt-1.5 h-[58px] w-full animate-pulse rounded bg-muted/40"
        aria-hidden
      />
    )
  }

  const numeric = value !== undefined && value !== '' ? Number(value) : NaN
  const hasValue = Number.isFinite(numeric)
  const zoneInfo: ZoneInfo | null = hasValue ? classifyValue(numeric, distribution) : null
  const percentile = hasValue ? percentileRank(numeric, distribution.values) : null

  // Clamp marker x for charting purposes — values outside [min, max] still
  // render but pinned to the edge so the marker remains visible. The badge
  // separately communicates that the value is outside the cohort.
  const clampedX = hasValue
    ? Math.max(distribution.min, Math.min(distribution.max, numeric))
    : null

  return (
    <div
      className="mt-1.5 space-y-0.5"
      aria-label={`Distribution chart for ${label}`}
      aria-hidden
    >
      <div className="relative h-[44px] w-full overflow-hidden rounded">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={kdeData}
            margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="kde-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="x"
              type="number"
              domain={[distribution.min, distribution.max]}
              hide
            />
            <YAxis domain={[0, yMax]} hide />
            {/* IQR shaded band */}
            <ReferenceArea
              x1={distribution.q1}
              x2={distribution.q3}
              y1={0}
              y2={yMax}
              fill="#10b981"
              fillOpacity={0.14}
              stroke="#10b981"
              strokeOpacity={0.35}
              strokeDasharray="2 2"
              ifOverflow="visible"
            />
            {/* Median tick */}
            <ReferenceLine
              x={distribution.median}
              stroke="#10b981"
              strokeOpacity={0.6}
              strokeWidth={1}
              strokeDasharray="2 3"
              ifOverflow="visible"
            />
            {/* KDE filled curve */}
            <Area
              type="monotone"
              dataKey="density"
              stroke="#6366f1"
              strokeWidth={1.25}
              fill="url(#kde-fill)"
              isAnimationActive={false}
              dot={false}
              activeDot={false}
            />
            {/* User value marker */}
            {hasValue && clampedX !== null && (
              <ReferenceLine
                x={clampedX}
                stroke={zoneInfo!.color}
                strokeWidth={2}
                ifOverflow="visible"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>

        {/* Pulsing halo on the user-value marker when outlier (rendered
            outside Recharts so we can drive it with Framer Motion). The
            marker x-position is computed from the chart's data domain. */}
        <AnimatePresence>
          {hasValue && clampedX !== null && zoneInfo!.isOutlier && (
            <motion.span
              key="outlier-pulse"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              className="pointer-events-none absolute top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-red-500/60"
              style={{
                left: `${
                  ((clampedX - distribution.min) /
                    Math.max(distribution.max - distribution.min, 1e-9)) *
                  100
                }%`,
                backgroundColor: '#dc2626',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between text-[9px] leading-tight">
        {hasValue && zoneInfo ? (
          <span
            className={`inline-flex items-center gap-0.5 rounded-sm border px-1 py-px font-medium ${zoneInfo.badgeClass}`}
          >
            {zoneInfo.isOutlier && <AlertTriangle className="h-2.5 w-2.5" />}
            {zoneInfo.label}
            {percentile !== null && (
              <span className="ml-0.5 opacity-70">· P{Math.round(percentile)}</span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground/50">
            Q1 {distribution.q1} – Q3 {distribution.q3}
          </span>
        )}
        <span className="text-muted-foreground/50">
          n={distribution.n.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
