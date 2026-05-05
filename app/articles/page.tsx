import BreadcrumbNav from '@/components/breadcrumb-nav'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  ShieldCheck,
  Target,
  BookOpenCheck,
  ScrollText,
} from 'lucide-react'
import articleA from '@/article_a_extracted.json'
import articleB from '@/article_b_extracted.json'

export const metadata = {
  title: 'Articles — NOA microTESE Research Dashboard',
  description:
    'Published and in-preparation manuscripts from the NOA microTESE ML research program, with TRIPOD+AI and PROBAST compliance.',
}

/* ------------------------------------------------------------------ */
/*  Reusable presentational components                                 */
/* ------------------------------------------------------------------ */

type StatusVariant = 'published' | 'in-preparation'

function StatusBadge({ variant, label }: { variant: StatusVariant; label: string }) {
  const cls =
    variant === 'published'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  const Icon = variant === 'published' ? CheckCircle2 : Clock3
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

function MetaPill({
  icon: Icon,
  label,
  value,
  accent = 'primary',
}: {
  icon: typeof Target
  label: string
  value: string
  accent?: 'primary' | 'secondary' | 'tertiary'
}) {
  const accentClasses: Record<string, string> = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    tertiary: 'text-tertiary',
  }
  return (
    <div className="flex items-start gap-2 rounded-md border border-border/60 bg-background/50 px-3 py-2">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${accentClasses[accent]}`} />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function StyledTable({
  headers,
  rows,
  caption,
}: {
  headers: string[]
  rows: (string | number)[][]
  caption?: string
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/50 overflow-x-auto">
      {caption && (
        <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {caption}
        </p>
      )}
      <table className="w-full text-sm">
        <thead className="border-b border-border/60 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                scope="col"
                className="px-4 py-2.5 text-left font-semibold whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-accent/40 transition-colors">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-2 align-top ${
                    j === 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {String(cell ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ComplianceBadge({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof ShieldCheck
  label: string
  tone: 'green' | 'blue'
}) {
  const cls =
    tone === 'green'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  TRIPOD+AI checklist renderer (handles both A and B schemas)        */
/* ------------------------------------------------------------------ */

type TripodItem = {
  section?: string
  item?: string | number
  description?: string
  status?: string
  location?: string
}

function TripodTable({ items }: { items: TripodItem[] }) {
  // Detect schema: in article B, section/item/description are duplicates,
  // so we only need a single description column. In article A they differ.
  const hasDistinctSection = items.some(
    (it) => it.section && it.description && it.section !== it.description
  )
  const headers = hasDistinctSection
    ? ['#', 'Section', 'Description', 'Status', 'Location']
    : ['#', 'Item', 'Status', 'Location']

  const rows: (string | number)[][] = items.map((it, idx) => {
    if (hasDistinctSection) {
      return [
        String(it.item ?? idx + 1),
        String(it.section ?? ''),
        String(it.description ?? ''),
        String(it.status ?? ''),
        String(it.location ?? ''),
      ]
    }
    return [
      String(idx + 1),
      String(it.description ?? it.item ?? ''),
      String(it.status ?? ''),
      String(it.location ?? ''),
    ]
  })

  return <StyledTable headers={headers} rows={rows} />
}

/* ------------------------------------------------------------------ */
/*  PROBAST table (handles both A and B schemas)                       */
/* ------------------------------------------------------------------ */

type ProbastDomain = {
  domain?: string
  signaling_question?: string
  risk_of_bias?: string
  justification?: string
  v1_judgment?: string
  v2_judgment?: string
}

function ProbastTable({ domains }: { domains: ProbastDomain[] }) {
  const hasV1V2 = domains.some((d) => d.v1_judgment || d.v2_judgment)

  const headers = hasV1V2
    ? ['Domain', 'Signaling Question', 'v1 Judgment', 'v2 Judgment']
    : ['Domain', 'Signaling Question', 'Risk of Bias', 'Justification']

  const rows: (string | number)[][] = domains.map((d) => {
    if (hasV1V2) {
      return [
        d.domain ?? '',
        d.signaling_question ?? '',
        d.v1_judgment ?? '',
        d.v2_judgment ?? '',
      ]
    }
    return [
      d.domain ?? '',
      d.signaling_question ?? '',
      d.risk_of_bias ?? '',
      d.justification ?? '',
    ]
  })

  return <StyledTable headers={headers} rows={rows} />
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ArticlesPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-8">
      <BreadcrumbNav items={[{ label: 'Articles' }]} />

      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-6 w-6 text-primary" />
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Manuscripts &amp; Publications
          </p>
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight">
          Articles
        </h1>
        <p className="text-muted-foreground max-w-3xl text-sm md:text-base">
          Peer-reviewed and in-preparation manuscripts produced from the NOA
          micro-TESE machine-learning pipeline. Each in-preparation article is
          accompanied by a downloadable DOCX, a TRIPOD+AI compliance checklist,
          and a PROBAST risk-of-bias assessment.
        </p>
      </header>

      {/* ============================================================== */}
      {/*  CARD 1 — Published                                            */}
      {/* ============================================================== */}
      <article className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-border/60 px-6 py-4 flex flex-wrap items-center gap-3">
          <StatusBadge variant="published" label="Published" />
          <span className="text-xs text-muted-foreground font-mono">
            Article 1 / 3
          </span>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Title
            </p>
            <h2 className="font-display font-semibold text-xl md:text-2xl tracking-tight">
              Machine Learning-Based Prediction of Sperm Retrieval in
              Non-Obstructive Azoospermia: A Comprehensive Analysis
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <MetaPill
              icon={ScrollText}
              label="Authors"
              value="Jamalirad, Sabbaghian, Vakili Arki"
              accent="primary"
            />
            <MetaPill
              icon={BookOpenCheck}
              label="Journal"
              value="Human Reproduction Open, 2025(1), hoae070"
              accent="secondary"
            />
            <MetaPill
              icon={FileText}
              label="DOI"
              value="10.1093/hropen/hoae070"
              accent="tertiary"
            />
          </div>

          <div className="text-sm text-muted-foreground leading-relaxed">
            <p>
              <span className="font-medium text-foreground">Authors: </span>
              Hossein Jamalirad, Marjan Sabbaghian, Hassan Vakili Arki
            </p>
            <p className="mt-1">
              <span className="font-medium text-foreground">Published in: </span>
              Human Reproduction Open, 2025(1), hoae070
            </p>
            <p className="mt-1">
              <span className="font-medium text-foreground">DOI: </span>
              <a
                href="https://doi.org/10.1093/hropen/hoae070"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline break-all"
              >
                https://doi.org/10.1093/hropen/hoae070
              </a>
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild>
              <a
                href="https://doi.org/10.1093/hropen/hoae070"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read on Oxford Academic
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </article>

      {/* ============================================================== */}
      {/*  CARD 2 — Article A (In Preparation)                           */}
      {/* ============================================================== */}
      <ArticleInPrepCard
        cardLabel="Article 2 / 3"
        targetJournal="Fertility & Sterility"
        downloadHref="/downloads/article_a_pathology_encoding.docx"
        downloadLabel="Download DOCX (Article A)"
        data={articleA}
      />

      {/* ============================================================== */}
      {/*  CARD 3 — Article B (In Preparation)                           */}
      {/* ============================================================== */}
      <ArticleInPrepCard
        cardLabel="Article 3 / 3"
        targetJournal="JMIR Medical Informatics"
        downloadHref="/downloads/article_b_cdss_multiagent.docx"
        downloadLabel="Download DOCX (Article B)"
        data={articleB}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  In-Preparation Article Card                                        */
/* ------------------------------------------------------------------ */

type ArticleData = {
  title: string
  authors: string
  abstract: string
  key_results_summary: string
  tables: { table_name: string; headers: string[]; rows: (string | number)[][] }[]
  tripod_ai_checklist: { items: TripodItem[] }
  probast_assessment: { domains: ProbastDomain[] }
  figures?: { figure_name: string; description: string }[]
}

function ArticleInPrepCard({
  cardLabel,
  targetJournal,
  downloadHref,
  downloadLabel,
  data,
}: {
  cardLabel: string
  targetJournal: string
  downloadHref: string
  downloadLabel: string
  data: ArticleData
}) {
  const tripodItems = data.tripod_ai_checklist?.items ?? []
  const probastDomains = data.probast_assessment?.domains ?? []
  const tables = data.tables ?? []
  const figures = data.figures ?? []

  return (
    <article className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-border/60 px-6 py-4 flex flex-wrap items-center gap-3">
        <StatusBadge variant="in-preparation" label="In Preparation" />
        <ComplianceBadge icon={ShieldCheck} label="TRIPOD+AI Compliant ✓" tone="green" />
        <ComplianceBadge icon={ShieldCheck} label="PROBAST: Low Risk of Bias" tone="blue" />
        <span className="ml-auto text-xs text-muted-foreground font-mono">
          {cardLabel}
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Title + meta */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Title
          </p>
          <h2 className="font-display font-semibold text-xl md:text-2xl tracking-tight">
            {data.title}
          </h2>

          <div className="grid gap-3 md:grid-cols-3">
            <MetaPill
              icon={ScrollText}
              label="Authors"
              value={data.authors}
              accent="primary"
            />
            <MetaPill
              icon={Target}
              label="Target Journal"
              value={targetJournal}
              accent="secondary"
            />
            <MetaPill
              icon={FileText}
              label="Manuscript Status"
              value="In Preparation"
              accent="tertiary"
            />
          </div>
        </div>

        {/* Abstract */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Abstract
          </h3>
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
            {data.abstract}
          </p>
        </section>

        {/* Key results summary */}
        <section className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
            <CheckCircle2 className="h-4 w-4" />
            Key Results Summary
          </h3>
          <p className="text-sm leading-relaxed text-foreground/90">
            {data.key_results_summary}
          </p>
        </section>

        {/* Expandable detailed sections */}
        <Accordion type="multiple" className="w-full space-y-2">
          {/* Detailed tables */}
          {tables.map((tbl, idx) => (
            <AccordionItem
              key={`tbl-${idx}`}
              value={`tbl-${idx}`}
              className="rounded-lg border bg-background/40 px-4 border-b-0"
            >
              <AccordionTrigger className="text-left hover:no-underline py-3">
                <span className="flex items-center gap-2 font-semibold">
                  <FileText className="h-4 w-4 text-primary" />
                  Show More — {tbl.table_name}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-2 pb-2">
                  <StyledTable headers={tbl.headers} rows={tbl.rows} />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}

          {/* Figures (descriptive list) */}
          {figures.length > 0 && (
            <AccordionItem
              value="figures"
              className="rounded-lg border bg-background/40 px-4 border-b-0"
            >
              <AccordionTrigger className="text-left hover:no-underline py-3">
                <span className="flex items-center gap-2 font-semibold">
                  <FileText className="h-4 w-4 text-secondary" />
                  Show More — Figures Overview ({figures.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 pb-2 pt-1">
                  {figures.map((fig, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-border/50 bg-card px-3 py-2 text-sm"
                    >
                      <p className="font-semibold text-foreground">{fig.figure_name}</p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        {fig.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* TRIPOD+AI detailed checklist */}
          <AccordionItem
            value="tripod"
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 border-b-0"
          >
            <AccordionTrigger className="text-left hover:no-underline py-3">
              <span className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                TRIPOD+AI Compliance Checklist ({tripodItems.length} items)
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2 pb-2">
                <TripodTable items={tripodItems} />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* PROBAST detailed assessment */}
          <AccordionItem
            value="probast"
            className="rounded-lg border border-sky-500/30 bg-sky-500/5 px-4 border-b-0"
          >
            <AccordionTrigger className="text-left hover:no-underline py-3">
              <span className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                PROBAST Risk-of-Bias Assessment ({probastDomains.length} signaling questions)
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2 pb-2">
                <ProbastTable domains={probastDomains} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button asChild>
            <a href={downloadHref} download>
              <Download className="mr-1 h-4 w-4" />
              {downloadLabel}
            </a>
          </Button>
          <span className="text-xs text-muted-foreground">
            Manuscript draft (.docx) — formatted for {targetJournal}.
          </span>
        </div>
      </div>
    </article>
  )
}
