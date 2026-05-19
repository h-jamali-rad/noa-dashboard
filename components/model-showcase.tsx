'use client';

/**
 * ModelShowcase
 *
 * Interactive, glassmorphic showcase of the 16 candidate models evaluated for
 * the pass / fail prediction task. Designed for a PhD defense presentation:
 * dark-friendly, scientifically illustrated, with filterable category pills,
 * AUC sorting, an expandable detail panel per card, and a summary stats bar.
 *
 * Intentionally agnostic of the host project beyond Tailwind, framer-motion,
 * lucide-react and the AIAssistWrapper component.
 */

import React, { useMemo, useState } from 'react';
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  type Variants,
} from 'framer-motion';
import {
  Trophy,
  ChevronDown,
  Filter,
  ArrowUpDown,
  Sparkles,
  Award,
  Brain,
  TrendingUp,
  BarChart3,
  Target,
  Shield,
  Layers,
  Activity,
  GitBranch,
  Network,
  CircleDot,
  Sigma,
  Zap,
  Hash,
} from 'lucide-react';
import AIAssistWrapper from '@/components/ai-assist-wrapper';
import {
  ALL_MODELS,
  CATEGORY_COLORS,
  MODEL_CATEGORIES,
  bestAuc,
  type ModelCategory,
  type ModelShowcaseItem,
  type ModelMetrics,
} from '@/components/model-showcase-data';

/* ------------------------------------------------------------------ */
/*  Small helpers                                                      */
/* ------------------------------------------------------------------ */

const FILTERS = ['All', ...MODEL_CATEGORIES] as const;
type FilterValue = (typeof FILTERS)[number];

/** Lucide icon to render next to each category pill. */
const CATEGORY_ICONS: Record<ModelCategory, React.ComponentType<{ className?: string }>> = {
  'Gradient Boosting': TrendingUp,
  Ensemble: Layers,
  Linear: Activity,
  Tree: GitBranch,
  Neural: Network,
  Probabilistic: Sigma,
  Distance: CircleDot,
  Kernel: Zap,
};

/** Format any metric to 3-decimal string, or "—" for zero / missing. */
function fmt(v: number | undefined | null): string {
  if (v === undefined || v === null || Number.isNaN(v) || v === 0) return '—';
  return v.toFixed(3);
}

/** AUC gets 4 decimals for emphasis. */
function fmtAuc(v: number | undefined | null): string {
  if (v === undefined || v === null || Number.isNaN(v) || v === 0) return '—';
  return v.toFixed(4);
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.2 } },
};

const detailContainerVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  show: {
    opacity: 1,
    height: 'auto',
    transition: { duration: 0.35, ease: 'easeOut', staggerChildren: 0.06 },
  },
  exit: { opacity: 0, height: 0, transition: { duration: 0.22 } },
};

const detailChildVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

interface MetricsTableProps {
  v1: ModelMetrics;
  v2?: ModelMetrics;
  accentText: string;
}

const MetricsTable: React.FC<MetricsTableProps> = ({ v1, v2, accentText }) => {
  const rows: Array<{ label: string; key: keyof ModelMetrics }> = [
    { label: 'AUC', key: 'auc' },
    { label: 'Accuracy', key: 'accuracy' },
    { label: 'Sensitivity', key: 'sensitivity' },
    { label: 'Specificity', key: 'specificity' },
    { label: 'F1-Score', key: 'f1' },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-900/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
            <th className="px-4 py-2.5 text-left font-medium">Metric</th>
            <th className="px-4 py-2.5 text-right font-medium">v1</th>
            {v2 ? (
              <th className={`px-4 py-2.5 text-right font-semibold ${accentText}`}>v2</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const v1Val = v1[row.key] as number | undefined;
            const v2Val = v2 ? (v2[row.key] as number | undefined) : undefined;
            const isAuc = row.key === 'auc';
            return (
              <tr
                key={row.key}
                className={
                  i % 2 === 0
                    ? 'bg-white/[0.015]'
                    : '' + ' border-b border-white/5 last:border-b-0'
                }
              >
                <td className="px-4 py-2.5 text-slate-300">{row.label}</td>
                <td className="px-4 py-2.5 text-right font-mono text-slate-200 tabular-nums">
                  {isAuc ? fmtAuc(v1Val) : fmt(v1Val)}
                </td>
                {v2 ? (
                  <td
                    className={`px-4 py-2.5 text-right font-mono tabular-nums ${accentText}`}
                  >
                    <span className="font-semibold">
                      {isAuc ? fmtAuc(v2Val) : fmt(v2Val)}
                    </span>
                    {isAuc && v2.ci ? (
                      <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                        (95% CI {v2.ci})
                      </span>
                    ) : null}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

interface ModelCardProps {
  model: ModelShowcaseItem;
  expanded: boolean;
  onToggle: (id: string) => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, expanded, onToggle }) => {
  const c = model.categoryColor;
  const Icon = model.svgIcon;
  const champion = model.isChampion;

  return (
    <AIAssistWrapper id={`model-showcase-${model.id}`}>
      <motion.div
        layout
        layoutId={`card-${model.id}`}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        whileHover={{ scale: 1.02, transition: { duration: 0.18 } }}
        onClick={() => onToggle(model.id)}
        className={[
          'group relative cursor-pointer overflow-hidden rounded-2xl',
          'border backdrop-blur-xl transition-shadow duration-300',
          'bg-slate-900/40 hover:shadow-2xl',
          champion
            ? 'border-amber-400/60 shadow-[0_0_40px_-12px_rgba(251,191,36,0.55)] hover:shadow-[0_0_60px_-8px_rgba(251,191,36,0.7)]'
            : `${c.border} hover:border-white/30`,
        ].join(' ')}
      >
        {/* Top accent bar */}
        <div
          className={`h-1 w-full bg-gradient-to-r ${c.accent} ${
            champion ? 'opacity-100' : 'opacity-80'
          }`}
        />

        {/* Champion gold ribbon */}
        {champion ? (
          <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-900 shadow-lg">
            <Trophy className="h-3 w-3" />
            Champion
          </div>
        ) : null}

        {/* Subtle champion glow ring (visual only) */}
        {champion ? (
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/10 via-transparent to-orange-500/10" />
        ) : null}

        <div className="relative p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className={[
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
                    c.bg,
                    c.border,
                    c.text,
                  ].join(' ')}
                >
                  {model.category}
                </span>
                {model.isV2 ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300">
                    <Sparkles className="h-2.5 w-2.5" /> v2
                  </span>
                ) : null}
              </div>
              <h3 className="truncate text-lg font-semibold text-white">{model.name}</h3>
            </div>

            <div
              className={[
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold',
                champion
                  ? 'border-amber-300/60 bg-amber-400/20 text-amber-200'
                  : 'border-white/10 bg-white/5 text-slate-300',
              ].join(' ')}
              title={`Rank #${model.rank}`}
            >
              #{model.rank}
            </div>
          </div>

          {/* Body: SVG icon + AUC */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className={`shrink-0 ${c.text}`}>
              <Icon size={64} className="opacity-90" />
            </div>
            <div className="min-w-0 text-right">
              <div className="text-[10px] uppercase tracking-widest text-slate-400">
                Best AUC
              </div>
              <div className="font-mono text-3xl font-bold tabular-nums text-white">
                {fmtAuc(bestAuc(model))}
              </div>
              {model.v2Metrics?.ci ? (
                <div className="mt-0.5 text-[10px] text-slate-400">
                  95% CI {model.v2Metrics.ci}
                </div>
              ) : null}
            </div>
          </div>

          {/* Expand hint */}
          <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-400">
            <span className="opacity-80">
              {expanded ? 'Click to collapse' : 'Click for details'}
            </span>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </div>

          {/* Detail panel */}
          <AnimatePresence initial={false}>
            {expanded ? (
              <motion.div
                key="detail"
                variants={detailContainerVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                  {/* Large architecture illustration */}
                  <motion.div
                    variants={detailChildVariants}
                    className={`flex items-center justify-center rounded-xl border ${c.border} ${c.bg} py-6`}
                  >
                    <div className={c.text}>
                      <Icon size={128} className="opacity-95" />
                    </div>
                  </motion.div>

                  {/* How it works */}
                  <motion.div variants={detailChildVariants}>
                    <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                      <Brain className="h-3.5 w-3.5" />
                      How it works
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">
                      {model.description}
                    </p>
                  </motion.div>

                  {/* Why selected */}
                  <motion.div variants={detailChildVariants}>
                    <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                      <Target className="h-3.5 w-3.5" />
                      Why this model for this dataset
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">
                      {model.selectionReasoning}
                    </p>
                  </motion.div>

                  {/* Metrics */}
                  <motion.div variants={detailChildVariants}>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                      <BarChart3 className="h-3.5 w-3.5" />
                      Performance metrics
                    </div>
                    <MetricsTable
                      v1={model.v1Metrics}
                      v2={model.v2Metrics}
                      accentText={c.text}
                    />
                  </motion.div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>
    </AIAssistWrapper>
  );
};

/* ------------------------------------------------------------------ */
/*  Summary stat tile                                                  */
/* ------------------------------------------------------------------ */

interface StatTileProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string; // gradient classes e.g. "from-amber-400 to-orange-500"
}

const StatTile: React.FC<StatTileProps> = ({ label, value, sub, icon: Icon, accent }) => (
  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-4 backdrop-blur-xl">
    <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accent}`} />
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-slate-900 shadow-lg`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
          {label}
        </div>
        <div className="font-mono text-xl font-bold leading-tight tabular-nums text-white">
          {value}
        </div>
        {sub ? <div className="text-[11px] text-slate-400">{sub}</div> : null}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const ModelShowcase: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<FilterValue>('All');
  const [sortByAuc, setSortByAuc] = useState<boolean>(true);
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);

  /* Category counts including "All" */
  const categoryCounts = useMemo<Record<FilterValue, number>>(() => {
    const counts = { All: ALL_MODELS.length } as Record<FilterValue, number>;
    for (const cat of MODEL_CATEGORIES) {
      counts[cat] = ALL_MODELS.filter((m) => m.category === cat).length;
    }
    return counts;
  }, []);

  /* Summary stats */
  const stats = useMemo(() => {
    const champion = ALL_MODELS.find((m) => m.isChampion);
    const aucs = ALL_MODELS.map(bestAuc);
    const avgAuc = aucs.reduce((a, b) => a + b, 0) / aucs.length;
    const v2Count = ALL_MODELS.filter((m) => m.isV2).length;
    const usedCategories = new Set(ALL_MODELS.map((m) => m.category)).size;
    return {
      total: ALL_MODELS.length,
      championAuc: champion ? bestAuc(champion) : 0,
      championName: champion?.name ?? '—',
      avgAuc,
      v2Count,
      usedCategories,
    };
  }, []);

  /* Filter + sort */
  const visibleModels = useMemo(() => {
    let list =
      selectedCategory === 'All'
        ? [...ALL_MODELS]
        : ALL_MODELS.filter((m) => m.category === selectedCategory);

    if (sortByAuc) {
      list.sort((a, b) => bestAuc(b) - bestAuc(a));
    } else {
      list.sort((a, b) => a.rank - b.rank);
    }
    return list;
  }, [selectedCategory, sortByAuc]);

  const toggleExpand = (id: string) =>
    setExpandedModelId((prev) => (prev === id ? null : id));

  return (
    <section className="relative w-full">
      {/* Page-level subtle background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-72 w-[600px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-72 w-[500px] rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* ----- Header ----- */}
      <header className="mb-8">
        <div className="mb-2 flex items-center gap-2 text-amber-300">
          <Award className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">
            Model Showcase
          </span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          16 Candidate Models, One Champion
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
          A comprehensive sweep across boosted trees, ensembles, linear, kernel,
          probabilistic, instance-based and neural approaches — benchmarked on a
          2,413 × 73 binary-classification cohort with a 1.72:1 class imbalance.
        </p>
      </header>

      {/* ----- Summary stat bar ----- */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Total Models"
          value={String(stats.total)}
          sub={`${stats.usedCategories} categories`}
          icon={Hash}
          accent="from-sky-400 to-blue-500"
        />
        <StatTile
          label="Champion AUC"
          value={fmtAuc(stats.championAuc)}
          sub={stats.championName}
          icon={Trophy}
          accent="from-amber-400 to-orange-500"
        />
        <StatTile
          label="Average AUC"
          value={fmtAuc(stats.avgAuc)}
          sub="best-of v1 / v2"
          icon={TrendingUp}
          accent="from-emerald-400 to-teal-500"
        />
        <StatTile
          label="v2 Pipeline"
          value={`${stats.v2Count} / ${stats.total}`}
          sub="advanced models"
          icon={Shield}
          accent="from-violet-400 to-fuchsia-500"
        />
      </div>

      {/* ----- Controls ----- */}
      <div className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category filter pills */}
        <LayoutGroup id="category-pills">
          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 hidden items-center gap-1.5 text-xs uppercase tracking-widest text-slate-500 sm:flex">
              <Filter className="h-3.5 w-3.5" />
              Filter
            </div>
            {FILTERS.map((cat) => {
              const isActive = selectedCategory === cat;
              const Icon = cat === 'All' ? Layers : CATEGORY_ICONS[cat as ModelCategory];
              const count = categoryCounts[cat] ?? 0;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={[
                    'relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200',
                  ].join(' ')}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="activePill"
                      className="absolute inset-0 rounded-full border border-white/15 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur"
                      transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                    />
                  ) : null}
                  <span className="relative flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {cat}
                    <span
                      className={[
                        'inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-white/5 text-slate-400',
                      ].join(' ')}
                    >
                      {count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        {/* Sort toggle */}
        <button
          type="button"
          onClick={() => setSortByAuc((s) => !s)}
          className={[
            'inline-flex items-center gap-2 self-start rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors sm:self-auto',
            sortByAuc
              ? 'border-amber-400/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15'
              : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10',
          ].join(' ')}
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          Sort by {sortByAuc ? 'AUC ↓' : 'Rank ↑'}
        </button>
      </div>

      {/* ----- Grid ----- */}
      <LayoutGroup id="model-grid">
        <motion.div
          layout
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {visibleModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                expanded={expandedModelId === model.id}
                onToggle={toggleExpand}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>

      {/* Empty state (defensive) */}
      {visibleModels.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
          No models match the current filter.
        </div>
      ) : null}
    </section>
  );
};

export default ModelShowcase;
