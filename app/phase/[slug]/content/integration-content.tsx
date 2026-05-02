'use client'

import { StatCard } from '@/components/stat-card'
import { GraduationCap, FileText, Layers, ImageIcon, CheckCircle2 } from 'lucide-react'

export default function IntegrationContent({ accent }: { accent: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Final Deliverable" value="PhD Dissertation" hint="Complete HTML file" icon={GraduationCap} accent={accent} />
        <StatCard label="Figures Embedded" value="464" hint="From validation + XAI + literature" icon={ImageIcon} accent={accent} />
        <StatCard label="Sections Assembled" value="6" hint="One per agent phase" icon={Layers} accent={accent} />
        <StatCard label="Reports Aggregated" value="33" hint="All Markdown logs" icon={FileText} accent={accent} />
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display font-semibold text-base mb-3">What Agent 6 produced</h3>
        <ul className="space-y-2.5 text-sm">
          {[
            'Aggregated outputs from Agents 1–5 into a single coherent dissertation manuscript.',
            'Embedded 464 figures with descriptive captions, alt text and proper section ordering.',
            'Inserted institutional logos (MUMS, Medical Informatics, Royan) at appropriate sizes.',
            'Generated the human-readable integration report (Markdown).',
            'Produced the dashboard inventory file consumed by this very web application.',
            'Validated TRIPOD/STROBE/PROBAST/TRIPOD-AI compliance items end-to-end.',
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm gradient-brand-soft">
        <h3 className="font-display font-semibold text-base mb-3">From data to dissertation — the full chain</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {[
            'Royan workbook (.xlsb)',
            '→',
            '2,413 analytical patients',
            '→',
            '73 features',
            '→',
            '27 trained models',
            '→',
            '10 validation methods',
            '→',
            '430 XAI figures',
            '→',
            '41 references',
            '→',
            'PhD dissertation',
          ].map((s, i) => (
            <span
              key={i}
              className={
                s === '→'
                  ? 'text-muted-foreground'
                  : 'px-2 py-1 rounded-md bg-card border border-border shadow-sm'
              }
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
