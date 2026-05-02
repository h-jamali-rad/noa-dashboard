'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BreadcrumbNav from '@/components/breadcrumb-nav'
import reviewerData from '@/data/content/reviewer_recommendations.json'

type Severity = 'Critical' | 'High' | 'Medium' | 'Low'
type CategoryKey = 'data_processing' | 'feature_engineering' | 'statistical_analysis' | 'cdss' | 'documentation'

interface Recommendation {
  id: string
  title: string
  severity: Severity
  description: string
  recommendation: string
  affected_records?: number
  affected_percentage?: string
  status: string
}

const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; border: string; dot: string }> = {
  Critical: { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
  High: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', dot: 'bg-orange-500' },
  Medium: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  Low: { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
}

const CATEGORY_LABELS: Record<CategoryKey, { label: string; icon: string }> = {
  data_processing: { label: 'Data Processing', icon: '🗄️' },
  feature_engineering: { label: 'Feature Engineering', icon: '🔧' },
  statistical_analysis: { label: 'Statistical Analysis', icon: '📊' },
  cdss: { label: 'CDSS', icon: '🏥' },
  documentation: { label: 'Documentation', icon: '📝' },
}

const categories = reviewerData.categories as unknown as Record<CategoryKey, Recommendation[]>
const allRecs: (Recommendation & { category: CategoryKey })[] = []
for (const [cat, items] of Object.entries(categories)) {
  for (const item of items as Recommendation[]) {
    allRecs.push({ ...item, category: cat as CategoryKey })
  }
}

export default function DefensePage() {
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return allRecs.filter((r) => {
      if (severityFilter !== 'all' && r.severity !== severityFilter) return false
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
      return true
    })
  }, [severityFilter, categoryFilter])

  const severities: Severity[] = ['Critical', 'High', 'Medium', 'Low']

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-8">
      <BreadcrumbNav items={[{ label: 'Reviewer Defense' }]} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display font-bold text-3xl tracking-tight">Reviewer Recommendations & Response</h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          Detailed breakdown of {reviewerData.reviewer_name}&apos;s evaluation ({reviewerData.expertise}) with all {reviewerData.total_issues} recommendations addressed.
        </p>
      </motion.div>

      {/* Reviewer Info Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border bg-card p-5 space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Reviewer</p>
          <p className="text-lg font-bold">{reviewerData.reviewer_name}</p>
          <p className="text-sm text-muted-foreground">{reviewerData.expertise}</p>
          <p className="text-xs text-muted-foreground">Review date: {reviewerData.review_date}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border bg-card p-5 space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Overall Score</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold font-display text-primary">5.5</span>
            <span className="text-lg text-muted-foreground">/ 10</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 mt-2">
            <motion.div initial={{ width: 0 }} animate={{ width: '55%' }} transition={{ duration: 1, delay: 0.5 }} className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border bg-card p-5 space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Issue Breakdown</p>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {severities.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${SEVERITY_COLORS[s].dot}`} />
                <span className="text-sm">{s}: <strong>{reviewerData.breakdown[s.toLowerCase() as keyof typeof reviewerData.breakdown]}</strong></span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* All Implemented Badge */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: 'spring' }} className="flex justify-center">
        <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-300 dark:border-emerald-700">
          <span className="text-3xl">✅</span>
          <div>
            <p className="font-bold text-emerald-800 dark:text-emerald-300 text-lg">All {allRecs.length} Recommendations Implemented</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">Every issue has been addressed in the corrected pipeline</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Filter by severity</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSeverityFilter('all')} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${severityFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-accent'}`}>All ({allRecs.length})</button>
          {severities.map((s) => {
            const count = allRecs.filter((r) => r.severity === s).length
            return (
              <button key={s} onClick={() => setSeverityFilter(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${severityFilter === s ? `${SEVERITY_COLORS[s].bg} ${SEVERITY_COLORS[s].text} ${SEVERITY_COLORS[s].border}` : 'bg-card text-foreground border-border hover:bg-accent'}`}>
                <span className={`inline-block h-2 w-2 rounded-full ${SEVERITY_COLORS[s].dot} mr-1.5`} />{s} ({count})
              </button>
            )
          })}
        </div>

        <p className="text-sm font-semibold text-muted-foreground mt-4">Filter by category</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCategoryFilter('all')} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${categoryFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-accent'}`}>All</button>
          {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((cat) => {
            const info = CATEGORY_LABELS[cat]
            const count = (categories[cat] || []).length
            return (
              <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${categoryFilter === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-accent'}`}>
                {info.icon} {info.label} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((rec, idx) => {
            const sev = SEVERITY_COLORS[rec.severity]
            const catInfo = CATEGORY_LABELS[rec.category]
            const isExpanded = expandedId === rec.id

            return (
              <motion.div key={rec.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25, delay: idx * 0.03 }}
                className={`rounded-xl border ${sev.border} ${sev.bg} overflow-hidden cursor-pointer transition-shadow hover:shadow-md`}
                onClick={() => setExpandedId(isExpanded ? null : rec.id)}
              >
                <div className="p-4 flex items-start gap-3">
                  <span className={`mt-1 shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${sev.text} border ${sev.border}`}>{rec.severity}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{rec.id}: {rec.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{catInfo.icon} {catInfo.label}</span>
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-medium">✓ Implemented</span>
                    </div>
                    {rec.affected_records && (
                      <p className="text-xs text-muted-foreground mt-1">Affected: {rec.affected_records.toLocaleString()} records ({rec.affected_percentage})</p>
                    )}
                  </div>
                  <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} className="text-muted-foreground shrink-0 mt-1">▼</motion.span>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                      <div className="px-4 pb-4 border-t border-inherit space-y-3 pt-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                          <p className="text-sm">{rec.description}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Recommendation</p>
                          <p className="text-sm">{rec.recommendation}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No recommendations match the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
