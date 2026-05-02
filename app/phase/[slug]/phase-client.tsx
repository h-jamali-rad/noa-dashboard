'use client'

import { useState } from 'react'
import ImageGallery from '@/components/image-gallery'
import type { GalleryImage } from '@/components/image-gallery'
import CodeBlock from '@/components/code-block'
import CodeStepBlock from '@/components/code-step-block'
import { SectionBlock } from '@/components/section-block'
import { getCodeStepsForPhase } from '@/lib/code-snippets'
import {
  Target,
  Package,
  Code2,
  FileText,
  Images,
  BarChart3,
  ListChecks,
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react'
import PreprocessingContent from './content/preprocessing-content'
import TrainingContent from './content/training-content'
import ValidationContent from './content/validation-content'
import XaiContent from './content/xai-content'
import LiteratureContent from './content/literature-content'
import IntegrationContent from './content/integration-content'
import { Button } from '@/components/ui/button'

type CodeRow = { id: number; filename: string; language: string; contentText: string; size: number }
type LogRow = { id: number; filename: string; contentText: string; size: number }

export default function PhaseClient({
  slug,
  accent,
  objectives,
  deliverables,
  images,
  codeFiles,
  logFiles,
  contentJson,
}: {
  slug: string
  accent: string
  objectives: string[]
  deliverables: string[]
  images: GalleryImage[]
  codeFiles: CodeRow[]
  logFiles: LogRow[]
  contentJson: any
}) {
  const safeObjectives = objectives ?? []
  const safeDeliverables = deliverables ?? []
  const [showAllCode, setShowAllCode] = useState(false)
  const [showAllLogs, setShowAllLogs] = useState(false)

  // Pre-pick the most representative code file to feature
  const featuredCode = (codeFiles ?? []).slice(0, 2)
  const remainingCode = (codeFiles ?? []).slice(2)
  const featuredLogs = (logFiles ?? []).slice(0, 2)
  const remainingLogs = (logFiles ?? []).slice(2)
  const codeSteps = getCodeStepsForPhase(slug)

  return (
    <div className="mt-10">
      {/* Initial conditions / objectives */}
      <SectionBlock
        id="initial-conditions"
        eyebrow="Step 1"
        title="Initial conditions & objectives"
        description="What this agent inherits, what it must achieve, and the constraints it operates under."
        icon={Target}
        accent={accent}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="h-4 w-4" style={{ color: accent }} />
              <h3 className="font-display font-semibold text-base">Objectives</h3>
            </div>
            <ul className="space-y-2">
              {safeObjectives.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono font-semibold text-white shrink-0 mt-0.5"
                    style={{ backgroundColor: accent }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-foreground/85">{o}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm gradient-brand-soft">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-primary" />
              <h3 className="font-display font-semibold text-base">Deliverables handed to next phase</h3>
            </div>
            <ul className="space-y-2">
              {safeDeliverables.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground/85">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionBlock>

      {/* Phase-specific content / execution results */}
      <SectionBlock
        id="execution-results"
        eyebrow="Step 2"
        title="Execution results"
        description="Quantitative outputs produced by this agent — metrics tables, model rankings, calibration audits, archetypes and more."
        icon={BarChart3}
        accent={accent}
      >
        {slug === 'preprocessing' && <PreprocessingContent data={contentJson?.preprocessing} accent={accent} />}
        {slug === 'training' && <TrainingContent data={contentJson?.training} accent={accent} />}
        {slug === 'validation' && <ValidationContent data={contentJson?.validation} accent={accent} />}
        {slug === 'xai' && <XaiContent data={contentJson?.xai} accent={accent} />}
        {slug === 'literature' && <LiteratureContent data={contentJson?.literature} accent={accent} />}
        {slug === 'integration' && <IntegrationContent accent={accent} />}
      </SectionBlock>

      {/* Granular step-by-step execution */}
      {codeSteps.length > 0 && (
        <SectionBlock
          id="step-by-step"
          eyebrow="Step 3"
          title={`Step-by-step execution (${codeSteps.length} actions)`}
          description="A granular replay of every meaningful action this agent performed. Each step states its initial condition, exposes the actual code that was executed, captures the resulting output, and lists the artefacts handed downstream."
          icon={Layers}
          accent={accent}
        >
          <div className="grid gap-5">
            {codeSteps.map((step, idx) => (
              <CodeStepBlock
                key={step.id}
                step={step}
                index={idx}
                total={codeSteps.length}
                accent={accent}
              />
            ))}
          </div>
        </SectionBlock>
      )}

      {/* Code */}
      {codeFiles && codeFiles.length > 0 && (
        <SectionBlock
          id="code"
          eyebrow="Step 4"
          title={`Code library (${codeFiles.length} files)`}
          description="The full Python scripts, notebooks and modules executed by this agent. Open any file to inspect the syntax-highlighted source code or copy it to your clipboard."
          icon={Code2}
          accent={accent}
        >
          <div className="space-y-3">
            {featuredCode.map((c) => (
              <CodeBlock
                key={c.id}
                filename={c.filename}
                code={c.contentText}
                language={c.language}
                size={c.size}
                defaultOpen={false}
              />
            ))}
            {showAllCode &&
              remainingCode.map((c) => (
                <CodeBlock
                  key={c.id}
                  filename={c.filename}
                  code={c.contentText}
                  language={c.language}
                  size={c.size}
                  defaultOpen={false}
                />
              ))}
            {remainingCode.length > 0 && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setShowAllCode((s) => !s)}>
                  {showAllCode ? 'Hide additional scripts' : `Show ${remainingCode.length} additional scripts`}
                </Button>
              </div>
            )}
          </div>
        </SectionBlock>
      )}

      {/* Logs / reports */}
      {logFiles && logFiles.length > 0 && (
        <SectionBlock
          id="reports"
          eyebrow="Step 5"
          title={`Reports & execution logs (${logFiles.length})`}
          description="Human-readable Markdown reports, executive summaries and execution logs generated by this phase."
          icon={FileText}
          accent={accent}
        >
          <div className="space-y-3">
            {featuredLogs.map((l) => (
              <CodeBlock
                key={l.id}
                filename={l.filename}
                code={l.contentText}
                language="markdown"
                size={l.size}
                defaultOpen={false}
                description="Markdown report"
              />
            ))}
            {showAllLogs &&
              remainingLogs.map((l) => (
                <CodeBlock
                  key={l.id}
                  filename={l.filename}
                  code={l.contentText}
                  language="markdown"
                  size={l.size}
                  defaultOpen={false}
                  description="Markdown report"
                />
              ))}
            {remainingLogs.length > 0 && (
              <div className="flex justify-center">
                <Button variant="outline" onClick={() => setShowAllLogs((s) => !s)}>
                  {showAllLogs ? 'Hide additional reports' : `Show ${remainingLogs.length} additional reports`}
                </Button>
              </div>
            )}
          </div>
        </SectionBlock>
      )}

      {/* Image gallery */}
      {images && images.length > 0 && (
        <SectionBlock
          id="figures"
          eyebrow="Step 6"
          title={`Visualisations (${images.length} figures)`}
          description="Every figure produced by this agent. Use search and the category / model filters; click any tile to open the full-resolution lightbox with arrow-key navigation."
          icon={Images}
          accent={accent}
        >
          <ImageGallery images={images} initialPageSize={20} />
        </SectionBlock>
      )}

      {/* Wrap up */}
      <SectionBlock
        id="handoff"
        eyebrow="Step 7"
        title="Hand-off summary"
        description="What the next agent receives at the boundary of this phase."
        icon={Sparkles}
        accent={accent}
      >
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground">
              {images?.length ?? 0} figures
            </span>
            <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground">
              {codeFiles?.length ?? 0} scripts
            </span>
            <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground">
              {logFiles?.length ?? 0} reports
            </span>
            <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground">
              {safeDeliverables.length} listed deliverables
            </span>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {safeDeliverables.map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </SectionBlock>
    </div>
  )
}
