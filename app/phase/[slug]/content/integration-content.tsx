'use client'

import { StatCard } from '@/components/stat-card'
import { GraduationCap, FileText, Layers, ImageIcon, CheckCircle2 } from 'lucide-react'
import AIAssistWrapper from '@/components/ai-assist-wrapper'

export default function IntegrationContent({ accent }: { accent: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AIAssistWrapper id="int-stat-deliverable">
          <StatCard label="Final Deliverable" value="PhD Dissertation" hint="Complete HTML file" icon={GraduationCap} accent={accent} />
        </AIAssistWrapper>
        <AIAssistWrapper id="int-stat-dataset">
          <StatCard label="Dataset" value="2,413 patients" hint="NOA analytical cohort" icon={ImageIcon} accent={accent} />
        </AIAssistWrapper>
        <AIAssistWrapper id="int-stat-features">
          <StatCard label="Feature Set" value="73 total" hint="55 original + 18 engineered" icon={Layers} accent={accent} />
        </AIAssistWrapper>
        <AIAssistWrapper id="int-stat-pathology">
          <StatCard label="Pathology Features" value="18" hint="RT/LT bilateral extraction" icon={FileText} accent={accent} />
        </AIAssistWrapper>
      </div>

      <AIAssistWrapper id="int-agent-output">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display font-semibold text-base mb-3">What Agent 6 produced</h3>
        <ul className="space-y-2.5 text-sm">
          {[
            'Aggregated outputs from Agents 1–5 into a single coherent dissertation manuscript.',
            'Synchronized all dashboard narratives to the authoritative cohort (2,413 patients).',
            'Aligned every major metric to the finalized v2 pipeline (16 tested → 5 finalized, CatBoost best AUC 0.8306).',
            'Integrated the pathology block summary (18 bilateral RT/LT features).',
            'Generated the human-readable integration report (Markdown).',
            'Validated consistency of displayed metrics across pages before final handoff.',
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
      </AIAssistWrapper>

      <AIAssistWrapper id="int-data-to-dissertation">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm gradient-brand-soft">
        <h3 className="font-display font-semibold text-base mb-3">From data to dissertation — the full chain</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {[
            'Royan workbook (.xlsb)',
            '→',
            '2,413 patients',
            '→',
            '73 features (55 + 18 engineered)',
            '→',
            '18 pathology features',
            '→',
            '16 models tested → 5 finalized',
            '→',
            'Nested CV + calibration + DCA',
            '→',
            'CatBoost AUC 0.8306',
            '→',
            '95% CI 0.823–0.845',
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
      </AIAssistWrapper>
    </div>
  )
}
