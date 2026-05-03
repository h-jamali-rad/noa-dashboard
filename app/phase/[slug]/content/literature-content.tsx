'use client'

import { useMemo, useState } from 'react'
import { StatCard } from '@/components/stat-card'
import { BookOpen, Quote, Search, Lightbulb, Library } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function LiteratureContent({ data, accent }: { data: any; accent: string }) {
  const refs = data?.references ?? []
  const gaps = data?.research_gaps ?? []
  const frameworks = data?.theoretical_frameworks ?? []
  const methodologies = data?.methodologies_reviewed ?? []
  const benchmarks = data?.citation_map?.key_benchmarks ?? {}

  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return refs
    return refs.filter((r: any) => `${r?.authors} ${r?.title} ${r?.year} ${r?.source} ${r?.relevance}`.toLowerCase().includes(q))
  }, [refs, search])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="References" value={String(refs?.length ?? 41)} hint="Anchor citations" icon={Library} accent={accent} />
        <StatCard label="Research Gaps" value={String(gaps?.length ?? 7)} hint="Identified & addressed" icon={Lightbulb} accent={accent} />
        <StatCard label="Frameworks" value={String(frameworks?.length ?? 9)} hint="Theoretical scaffolding" icon={BookOpen} accent={accent} />
        <StatCard label="Methodologies" value={String(methodologies?.length ?? 21)} hint="Reviewed in detail" icon={Quote} accent={accent} />
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4" style={{ color: accent }} />
          <h3 className="font-display font-semibold text-base">7 articulated research gaps</h3>
        </div>
        <ul className="space-y-3">
          {gaps.map((g: any, i: number) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-mono font-semibold text-white" style={{ backgroundColor: accent }}>{g?.id}</span>
              <div>
                <p className="text-sm leading-relaxed">{g?.gap ?? g?.gap_en}</p>
                {g?.addressed_by && <p className="text-xs text-muted-foreground mt-1"><span className="font-mono uppercase tracking-wider">Addressed by:</span> {g.addressed_by}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3 flex-wrap gap-y-2">
          <BookOpen className="h-4 w-4" style={{ color: accent }} />
          <h3 className="font-display font-semibold text-base">41-reference bibliography</h3>
          <div className="relative ml-auto w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search references…" className="pl-8 h-9 text-sm" />
          </div>
        </div>
        <ol className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
          {filtered.map((r: any) => (
            <li key={r?.id} className="flex items-start gap-3 text-sm">
              <span className="font-mono text-[11px] text-muted-foreground w-6 text-right shrink-0 pt-0.5">[{r?.id}]</span>
              <div className="min-w-0">
                <p className="leading-snug"><span className="font-medium">{r?.authors}</span> ({r?.year}). <em>{r?.title}</em> {r?.source}</p>
                {r?.relevance && <p className="text-xs text-muted-foreground mt-0.5">{r.relevance}</p>}
              </div>
            </li>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No references match the search.</p>}
        </ol>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display font-semibold text-base mb-3">Theoretical frameworks ({frameworks.length})</h3>
          <ul className="space-y-2 text-sm">
            {frameworks.slice(0, 8).map((f: any, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-mono text-[11px] text-muted-foreground shrink-0">{i + 1}.</span>
                <span className="leading-snug">{f?.framework}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm gradient-brand-soft">
          <h3 className="font-display font-semibold text-base mb-3">Key benchmark studies</h3>
          <ul className="space-y-2 text-sm">
            {Object.entries(benchmarks).map(([k, v]) => (
              <li key={k}>
                <p className="font-mono text-[11px] text-muted-foreground">{k}</p>
                <p className="text-sm leading-snug">{String(v)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
