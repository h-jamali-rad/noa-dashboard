'use client'

import { useMemo, useState } from 'react'
import {
  Layers,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
  Filter,
  Lightbulb,
  Target,
  Sparkles,
} from 'lucide-react'
import dsModelMapping from '@/data/ds_model_mapping.json'

/* ──────────────────────────────────────────────────────────────────────── */
/*  Types                                                                   */
/* ──────────────────────────────────────────────────────────────────────── */

type Status = 'applicable' | 'partial' | 'gap' | 'not_applicable'

interface Item {
  text: string
  status: Status
  description: string
}

interface GroupSummary {
  applicable: number
  partial: number
  gap: number
  not_applicable: number
}

interface Group {
  name: string
  description: string
  items: Item[]
  summary: GroupSummary
}

interface OverallSummary {
  total_items: number
  applicable: number
  partial: number
  gap: number
  not_applicable: number
  key_strengths: string[]
  key_gaps: string[]
  recommendations: string[]
}

interface MappingData {
  groups: Group[]
  overall_summary: OverallSummary
}

const DATA = dsModelMapping as unknown as MappingData

/* ──────────────────────────────────────────────────────────────────────── */
/*  Status configuration                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<
  Status,
  {
    label: string
    color: string // hex for SVG
    bgClass: string
    textClass: string
    borderClass: string
    badgeClass: string
    Icon: typeof CheckCircle2
  }
> = {
  applicable: {
    label: 'Applicable',
    color: '#10b981',
    bgClass: 'bg-emerald-500',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/40',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    Icon: CheckCircle2,
  },
  partial: {
    label: 'Partial',
    color: '#f59e0b',
    bgClass: 'bg-amber-500',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/40',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
    Icon: AlertTriangle,
  },
  gap: {
    label: 'Gap',
    color: '#ef4444',
    bgClass: 'bg-red-500',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/40',
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/40',
    Icon: XCircle,
  },
  not_applicable: {
    label: 'Not Applicable',
    color: '#6b7280',
    bgClass: 'bg-gray-500',
    textClass: 'text-gray-400',
    borderClass: 'border-gray-500/40',
    badgeClass: 'bg-gray-500/15 text-gray-300 border-gray-500/40',
    Icon: MinusCircle,
  },
}

const STATUS_ORDER: Status[] = ['applicable', 'partial', 'gap', 'not_applicable']

/* ──────────────────────────────────────────────────────────────────────── */
/*  Pure-SVG donut chart                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

interface DonutSlice {
  status: Status
  value: number
}

function DonutChart({ slices, total }: { slices: DonutSlice[]; total: number }) {
  const size = 200
  const stroke = 28
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2

  let cumulative = 0
  const arcs = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const fraction = s.value / total
      const dashLength = fraction * circumference
      const arc = {
        ...s,
        offset: -cumulative,
        dash: dashLength,
        gap: circumference - dashLength,
        fraction,
      }
      cumulative += dashLength
      return arc
    })

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label="DS model status distribution"
      className="-rotate-90"
    >
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="#1f2937"
        strokeWidth={stroke}
      />
      {/* Slices */}
      {arcs.map((a) => (
        <circle
          key={a.status}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={STATUS_CONFIG[a.status].color}
          strokeWidth={stroke}
          strokeDasharray={`${a.dash} ${a.gap}`}
          strokeDashoffset={a.offset}
          strokeLinecap="butt"
        />
      ))}
      {/* Centre text — rotated back upright */}
      <g transform={`rotate(90 ${cx} ${cy})`}>
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="fill-white"
          style={{ fontSize: 26, fontWeight: 700, fontFamily: 'inherit' }}
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          className="fill-gray-400"
          style={{ fontSize: 11, fontFamily: 'inherit' }}
        >
          total items
        </text>
      </g>
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Mini stacked bar — used inside each group card header                  */
/* ──────────────────────────────────────────────────────────────────────── */

function StackedBar({ summary }: { summary: GroupSummary }) {
  const total =
    summary.applicable + summary.partial + summary.gap + summary.not_applicable
  if (total === 0) return null
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-800">
      {STATUS_ORDER.map((s) => {
        const value = summary[s]
        if (value === 0) return null
        const pct = (value / total) * 100
        return (
          <div
            key={s}
            className={STATUS_CONFIG[s].bgClass}
            style={{ width: `${pct}%` }}
            title={`${STATUS_CONFIG[s].label}: ${value} (${pct.toFixed(0)}%)`}
          />
        )
      })}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Status badge for an individual item                                     */
/* ──────────────────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.Icon
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.badgeClass}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Single item row                                                         */
/* ──────────────────────────────────────────────────────────────────────── */

function ItemRow({ item }: { item: Item }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/60 transition-colors hover:border-gray-700">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 p-3 text-left"
      >
        <div className="flex flex-1 items-start gap-2">
          <StatusBadge status={item.status} />
          <span className="text-xs leading-snug text-gray-200">{item.text}</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-gray-800 px-3 py-3 text-xs leading-relaxed text-gray-300">
          {item.description}
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Group card                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

function GroupCard({
  group,
  index,
  filter,
}: {
  group: Group
  index: number
  filter: Status | 'all'
}) {
  const [open, setOpen] = useState(false)

  const total =
    group.summary.applicable +
    group.summary.partial +
    group.summary.gap +
    group.summary.not_applicable

  const visibleItems = useMemo(
    () =>
      filter === 'all'
        ? group.items
        : group.items.filter((i) => i.status === filter),
    [group.items, filter],
  )

  // Highlight gap-heavy groups (≥25% of items are gaps)
  const gapRatio = total > 0 ? group.summary.gap / total : 0
  const isCritical = gapRatio >= 0.25

  return (
    <div
      className={`rounded-xl border bg-gray-900/70 transition-all ${
        isCritical
          ? 'border-red-500/30 shadow-[0_0_0_1px_rgba(239,68,68,0.1)]'
          : 'border-gray-800 hover:border-cyan-500/40'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-4 p-4 text-left"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 font-mono text-xs font-bold text-cyan-300">
          {String(index + 1).padStart(2, '0')}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-sm font-semibold text-white">
              {group.name}
            </h3>
            <span className="rounded-full border border-gray-700 bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-gray-300">
              {total} {total === 1 ? 'item' : 'items'}
            </span>
            {isCritical && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                <AlertTriangle className="h-3 w-3" />
                Gap-heavy
              </span>
            )}
          </div>

          <StackedBar summary={group.summary} />

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-medium">
            {STATUS_ORDER.map((s) => (
              <span
                key={s}
                className={`inline-flex items-center gap-1 ${STATUS_CONFIG[s].textClass}`}
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full ${STATUS_CONFIG[s].bgClass}`}
                />
                {STATUS_CONFIG[s].label}: {group.summary[s]}
              </span>
            ))}
          </div>
        </div>

        {open ? (
          <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="space-y-3 border-t border-gray-800 px-4 pb-4 pt-3">
          <p className="text-xs italic leading-relaxed text-gray-400">
            {group.description}
          </p>
          {visibleItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-700 p-4 text-center text-xs text-gray-500">
              No items match the current filter.
            </div>
          ) : (
            <div className="space-y-2">
              {visibleItems.map((it, i) => (
                <ItemRow key={i} item={it} />
              ))}
            </div>
          )}
          {filter !== 'all' && (
            <p className="text-[10px] text-gray-500">
              Showing {visibleItems.length} of {group.items.length} items
              filtered by status &ldquo;{STATUS_CONFIG[filter].label}&rdquo;.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Main exported component                                                 */
/* ──────────────────────────────────────────────────────────────────────── */

export default function DsModelEvaluation() {
  const [filter, setFilter] = useState<Status | 'all'>('all')

  const overall = DATA.overall_summary

  // Derive percentages
  const totals = useMemo(() => {
    const t = overall.total_items
    return STATUS_ORDER.map((s) => ({
      status: s,
      value: overall[s],
      pct: t > 0 ? (overall[s] / t) * 100 : 0,
    }))
  }, [overall])

  return (
    <div className="space-y-6 rounded-2xl border border-gray-800 bg-gray-900/40 p-5 md:p-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-md">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-white">
              DS Model Framework Evaluation
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-gray-400">
              Systematic mapping of the NOA micro-TESE CDSS against the 22
              Decision Support (DS) model dimensions — {overall.total_items}{' '}
              evaluation criteria across applicability, partial coverage, gaps,
              and not-applicable items.
            </p>
          </div>
        </div>
      </div>

      {/* ── Summary dashboard ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
        <div className="grid items-center gap-6 md:grid-cols-[auto,1fr]">
          {/* Donut chart */}
          <div className="flex flex-col items-center gap-3">
            <DonutChart
              slices={totals.map((t) => ({ status: t.status, value: t.value }))}
              total={overall.total_items}
            />
            <p className="text-[10px] uppercase tracking-wider text-gray-500">
              Overall status distribution
            </p>
          </div>

          {/* Status cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {totals.map(({ status, value, pct }) => {
              const cfg = STATUS_CONFIG[status]
              const Icon = cfg.Icon
              return (
                <div
                  key={status}
                  className={`rounded-lg border bg-gray-900 p-4 ${cfg.borderClass}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cfg.textClass}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-white">{value}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-800">
                    <div
                      className={`h-full rounded-full ${cfg.bgClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cumulative stacked bar */}
        <div className="mt-5 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">
            Cumulative distribution
          </p>
          <div className="flex h-3 overflow-hidden rounded-full bg-gray-800">
            {totals.map(
              ({ status, pct }) =>
                pct > 0 && (
                  <div
                    key={status}
                    className={STATUS_CONFIG[status].bgClass}
                    style={{ width: `${pct}%` }}
                    title={`${STATUS_CONFIG[status].label}: ${pct.toFixed(1)}%`}
                  />
                ),
            )}
          </div>
        </div>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/60 p-3">
        <span className="inline-flex items-center gap-1.5 pl-2 pr-1 text-xs font-semibold text-gray-300">
          <Filter className="h-3.5 w-3.5 text-cyan-400" />
          Filter items:
        </span>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
              : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-300'
          }`}
        >
          All ({overall.total_items})
        </button>
        {STATUS_ORDER.map((s) => {
          const cfg = STATUS_CONFIG[s]
          const active = filter === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? `${cfg.borderClass} bg-white/5 ${cfg.textClass}`
                  : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
              }`}
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${cfg.bgClass}`}
              />
              {cfg.label} ({overall[s]})
            </button>
          )
        })}
      </div>

      {/* ── 22 group cards ────────────────────────────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-2">
        {DATA.groups.map((group, i) => (
          <GroupCard key={group.name} group={group} index={i} filter={filter} />
        ))}
      </div>

      {/* ── Gap analysis section ──────────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-gray-800 bg-gray-900/60 p-5">
        <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
          <Target className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">
            Gap Analysis &amp; Recommendations
          </h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Key strengths */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-300">
              <Sparkles className="h-4 w-4" />
              Key Strengths
              <span className="ml-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono">
                {overall.key_strengths.length}
              </span>
            </h4>
            <ul className="space-y-2">
              {overall.key_strengths.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs leading-relaxed text-gray-200"
                >
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key gaps */}
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-red-300">
              <AlertTriangle className="h-4 w-4" />
              Critical Gaps
              <span className="ml-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-mono">
                {overall.key_gaps.length}
              </span>
            </h4>
            <ul className="space-y-2">
              {overall.key_gaps.map((g, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs leading-relaxed text-gray-200"
                >
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommendations — full width */}
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-cyan-300">
            <Lightbulb className="h-4 w-4" />
            Recommendations
            <span className="ml-1 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono">
              {overall.recommendations.length}
            </span>
          </h4>
          <ol className="grid gap-2 md:grid-cols-2">
            {overall.recommendations.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-md border border-cyan-500/20 bg-gray-900/60 p-3 text-xs leading-relaxed text-gray-200"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 font-mono text-[10px] font-bold text-cyan-300">
                  {i + 1}
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* ── Footnote ──────────────────────────────────────────────────── */}
      <p className="text-center text-[10px] text-gray-500">
        DS Model framework · {DATA.groups.length} dimensions ·{' '}
        {overall.total_items} criteria · NOA micro-TESE CDSS mapping
      </p>
    </div>
  )
}
