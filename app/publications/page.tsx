import Link from 'next/link'
import {
  BookOpen,
  ExternalLink,
  Calendar,
  Building2,
  FileText,
  Users,
  Tag,
  ScrollText,
  Microscope,
} from 'lucide-react'
import BreadcrumbNav from '@/components/breadcrumb-nav'
import data from '@/data/publications_data.json'

type TableData = {
  title: string
  columns: string[]
  rows: string[][]
}

type Table3Data = {
  title: string
  description: string
  note: string
  columns: string[]
  rows: string[][]
}

const article = data.article
const table1 = data.table1 as TableData
const table2 = data.table2 as TableData
const table3 = data.table3 as Table3Data

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="text-sm text-foreground/90 leading-snug">{children}</div>
      </div>
    </div>
  )
}

function ResearchTable({
  title,
  columns,
  rows,
  caption,
  accent = 'primary',
}: {
  title: string
  columns: string[]
  rows: string[][]
  caption?: string
  accent?: 'primary' | 'secondary' | 'tertiary'
}) {
  const accentClass =
    accent === 'secondary'
      ? 'bg-secondary/10 text-secondary'
      : accent === 'tertiary'
      ? 'bg-tertiary/10 text-tertiary'
      : 'bg-primary/10 text-primary'

  return (
    <section className="rounded-xl border bg-card overflow-hidden">
      <header className="flex items-start gap-3 px-5 py-4 border-b border-border/60 bg-card/60">
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${accentClass}`}
        >
          <ScrollText className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display font-semibold text-base sm:text-lg leading-snug tracking-tight">
            {title}
          </h2>
          {caption && (
            <p className="mt-1 text-[12px] text-muted-foreground leading-snug">{caption}</p>
          )}
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="bg-muted/40">
              {columns.map((col, i) => (
                <th
                  key={i}
                  scope="col"
                  className="text-left px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60 whitespace-nowrap first:pl-5 last:pr-5"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className="hover:bg-accent/40 transition-colors duration-150"
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={
                      'px-3 py-2.5 align-top text-[13px] text-foreground/90 border-b border-border/40 first:pl-5 last:pr-5 ' +
                      (ci === 0
                        ? 'font-mono text-muted-foreground w-10'
                        : ci === 1
                        ? 'font-medium text-foreground whitespace-nowrap'
                        : 'leading-snug')
                    }
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function PublicationsPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-8">
      <BreadcrumbNav items={[{ label: 'Publications' }]} />

      {/* Page header */}
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight">Publications</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Peer-reviewed research outputs from this PhD project — including the systematic
            scoping review on AI-assisted prediction of microdissection testicular sperm
            extraction (m-TESE) outcomes for non-obstructive azoospermia (NOA).
          </p>
        </div>
      </div>

      {/* Featured article card */}
      <article className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Decorative accent bar */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-tertiary" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Top row: type + journal */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
              <Microscope className="h-3 w-3" />
              {article.type} · PRISMA-ScR
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 text-secondary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
              <Calendar className="h-3 w-3" />
              Published {article.year}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-tertiary/10 text-tertiary px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider">
              Open Access · CC BY 4.0
            </span>
          </div>

          {/* Title */}
          <h2 className="font-display font-bold text-2xl sm:text-3xl leading-tight tracking-tight">
            {article.title}
          </h2>

          {/* Authors */}
          <p className="text-sm text-foreground/80 leading-relaxed">
            <span className="font-semibold text-foreground">{article.authors}</span>
          </p>

          {/* Meta grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <MetaRow icon={FileText} label="Journal">
              <span className="italic">{article.journal}</span>, {article.volume},{' '}
              <span className="font-mono">{article.article_id}</span>
            </MetaRow>
            <MetaRow icon={Building2} label="Publisher">
              {article.publisher}
            </MetaRow>
            <MetaRow icon={ExternalLink} label="DOI">
              <Link
                href={article.doi}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all font-mono text-[12px]"
              >
                {article.doi}
              </Link>
            </MetaRow>
            <MetaRow icon={Calendar} label="Timeline">
              <span className="text-muted-foreground">
                Received {article.received} · Revised {article.revised} · Accepted{' '}
                {article.accepted} · Published {article.published}
              </span>
            </MetaRow>
          </div>

          {/* Affiliations */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Affiliations
              </p>
            </div>
            <ul className="space-y-1 text-[13px] text-foreground/85 leading-snug">
              {article.affiliations.map((aff, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground font-mono text-[11px] shrink-0 mt-0.5">
                    {i + 1}.
                  </span>
                  <span>{aff}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Keywords */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Keywords
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {article.keywords.map((k, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-md border border-border/60 bg-background/60 px-2.5 py-1 text-[12px] text-foreground/85"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>

          {/* Abstract */}
          <div className="space-y-3">
            <h3 className="font-display font-semibold text-lg tracking-tight">Abstract</h3>
            <div className="grid gap-3">
              <div className="rounded-lg border bg-card/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1">
                  Study question
                </p>
                <p className="text-[13.5px] text-foreground/90 leading-relaxed">
                  {article.abstract.study_question}
                </p>
              </div>
              <div className="rounded-lg border bg-card/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary mb-1">
                  Summary answer
                </p>
                <p className="text-[13.5px] text-foreground/90 leading-relaxed">
                  {article.abstract.summary_answer}
                </p>
              </div>
              <div className="rounded-lg border bg-card/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-tertiary mb-1">
                  Main results
                </p>
                <p className="text-[13.5px] text-foreground/90 leading-relaxed">
                  {article.abstract.main_results}
                </p>
              </div>
              <div className="rounded-lg border bg-card/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Study design, size, duration
                </p>
                <p className="text-[13.5px] text-foreground/90 leading-relaxed">
                  {article.abstract.study_design}
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href={article.doi}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Read on Oxford Academic
            </Link>
            <Link
              href={article.doi}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border bg-background text-foreground px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              View DOI
            </Link>
          </div>
        </div>
      </article>

      {/* Tables section header */}
      <div className="space-y-1 pt-2">
        <h2 className="font-display font-bold text-2xl tracking-tight">Review Tables</h2>
        <p className="text-sm text-muted-foreground">
          Structured evidence from the systematic scoping review. All tables are horizontally
          scrollable on smaller screens.
        </p>
      </div>

      {/* Table 1 */}
      <ResearchTable
        title={table1.title}
        columns={table1.columns}
        rows={table1.rows}
        caption={`${table1.rows.length} studies — primary m-TESE prediction cohort, ranked from most recent to earliest.`}
        accent="primary"
      />

      {/* Table 2 */}
      <ResearchTable
        title={table2.title}
        columns={table2.columns}
        rows={table2.rows}
        caption={`${table2.rows.length} studies focusing on salvage m-TESE outcomes.`}
        accent="secondary"
      />

      {/* Table 3 — biomarker matrix */}
      <ResearchTable
        title={table3.title}
        columns={table3.columns}
        rows={table3.rows}
        caption={`${table3.rows.length} studies — ${table3.description} ${table3.note}`}
        accent="tertiary"
      />

      {/* Citation block */}
      <section className="rounded-xl border bg-muted/30 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Cite this article
        </p>
        <p className="text-[13px] text-foreground/90 leading-relaxed font-mono">
          {article.authors}. {article.title}. <span className="italic">{article.journal}</span>,{' '}
          {article.volume}, {article.article_id}, {article.year}.{' '}
          <Link
            href={article.doi}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all"
          >
            {article.doi}
          </Link>
        </p>
      </section>
    </div>
  )
}
