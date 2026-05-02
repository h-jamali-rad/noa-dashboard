'use client'

import { useMemo, useState } from 'react'
import CodeBlock from '@/components/code-block'
import { Input } from '@/components/ui/input'
import { Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

type CodeRow = { id: number; agent: string; filename: string; language: string; contentText: string; size: number }
type LogRow = { id: number; agent: string; filename: string; contentText: string; size: number }

const AGENTS = ['all', 'preprocessing', 'training', 'validation', 'xai', 'literature', 'integration']
const KIND = ['all', 'code', 'log'] as const
type Kind = (typeof KIND)[number]

export default function CodeLibrary({ code, logs }: { code: CodeRow[]; logs: LogRow[] }) {
  const [search, setSearch] = useState('')
  const [agent, setAgent] = useState<string>('all')
  const [kind, setKind] = useState<Kind>('all')

  const items = useMemo(() => {
    const c = code.map((x) => ({ ...x, kind: 'code' as const, language: x.language }))
    const l = logs.map((x) => ({ ...x, kind: 'log' as const, language: 'markdown' }))
    return [...c, ...l].sort((a, b) => a.agent.localeCompare(b.agent) || a.filename.localeCompare(b.filename))
  }, [code, logs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((it) => {
      if (agent !== 'all' && it.agent !== agent) return false
      if (kind !== 'all' && it.kind !== kind) return false
      if (q) {
        const hay = `${it.filename} ${it.agent}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [items, search, agent, kind])

  return (
    <div className="space-y-5">
      <div className="glass-panel rounded-lg p-3 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by filename or agent…"
              className="pl-9"
            />
          </div>
          <div className="text-xs text-muted-foreground self-center font-mono whitespace-nowrap">
            {filtered.length.toLocaleString()} of {items.length.toLocaleString()}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Filter className="h-3 w-3" />
            Phase
          </span>
          {AGENTS.map((a) => (
            <button
              key={a}
              onClick={() => setAgent(a)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full transition-colors duration-150 border',
                agent === a
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-foreground/80 border-transparent hover:border-primary/40 hover:text-primary'
              )}
            >
              {a === 'all' ? 'All phases' : a}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Filter className="h-3 w-3" />
            Type
          </span>
          {KIND.map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full transition-colors duration-150 border',
                kind === k
                  ? 'bg-secondary text-secondary-foreground border-secondary'
                  : 'bg-muted/50 text-foreground/80 border-transparent hover:border-secondary/40 hover:text-secondary'
              )}
            >
              {k === 'all' ? 'All types' : k === 'code' ? 'Python scripts' : 'Markdown reports'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">
          No files match the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((it) => (
            <CodeBlock
              key={`${it.kind}-${it.id}`}
              filename={`${it.agent}/${it.filename}`}
              code={it.contentText}
              language={it.language}
              size={it.size}
              defaultOpen={false}
              description={it.kind === 'code' ? 'Python implementation' : 'Markdown report'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
