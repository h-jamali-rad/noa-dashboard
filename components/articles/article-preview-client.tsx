'use client'

import BreadcrumbNav from '@/components/breadcrumb-nav'
import { Button } from '@/components/ui/button'
import { Download, FileJson, Mail, MessageSquarePlus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { sendCommentNotification } from './email-notify'
import AIAssistWrapper from '@/components/ai-assist-wrapper'

type Primitive = string | number | null | undefined

type ArticleTable = {
  table_name: string
  headers: string[]
  rows: Primitive[][]
}

type TripodItem = {
  section?: string
  item?: string | number
  description?: string
  status?: string
  location?: string
}

type ProbastDomain = {
  domain?: string
  signaling_question?: string
  risk_of_bias?: string
  justification?: string
  v1_judgment?: string
  v2_judgment?: string
}

type FigureItem = {
  figure_name: string
  caption?: string
  description: string
}

type StructuredSection = {
  title?: string
  content?: unknown
  subsections?: StructuredSection[]
}

export type ArticleData = {
  title: string
  authors: string
  abstract?: unknown
  introduction?: unknown
  methods?: unknown
  results?: unknown
  discussion?: unknown
  conclusions?: unknown
  references?: unknown
  supplements?: unknown
  usability_testing?: unknown
  key_results_summary?: unknown
  tables?: ArticleTable[]
  figures?: FigureItem[]
  tripod_ai_checklist?: { items?: TripodItem[] }
  probast_assessment?: { domains?: ProbastDomain[] }
}

type ArticleComment = {
  id: number
  articleId: string
  paragraphId: string
  selectedText: string
  commentText: string
  authorName: string
  createdAt: string
}

type ParagraphBlock = {
  id: string
  text: string
}

type CommentDraft = {
  paragraphId: string
  selectedText: string
  x: number
  y: number
}

type RenderedSection = {
  id: string
  title: string
  level: number
  paragraphs: ParagraphBlock[]
}

const SECTION_ORDER: Array<{ key: keyof ArticleData; label: string }> = [
  { key: 'abstract', label: 'Abstract' },
  { key: 'introduction', label: 'Introduction' },
  { key: 'methods', label: 'Methods' },
  { key: 'results', label: 'Results' },
  { key: 'discussion', label: 'Discussion' },
  { key: 'conclusions', label: 'Conclusions' },
  { key: 'references', label: 'References' },
  { key: 'supplements', label: 'Supplements' },
]

function toParagraphs(value: unknown, baseId: string): ParagraphBlock[] {
  if (!value) return []

  if (typeof value === 'string') {
    return value
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((text, index) => ({ id: `${baseId}-p-${index + 1}`, text }))
  }

  if (Array.isArray(value)) {
    const flattened = value
      .map((entry) => {
        if (typeof entry === 'string' || typeof entry === 'number') return String(entry)
        if (entry && typeof entry === 'object') return JSON.stringify(entry)
        return ''
      })
      .filter(Boolean)

    return flattened.map((text, index) => ({ id: `${baseId}-p-${index + 1}`, text }))
  }

  if (typeof value === 'object') {
    const text = JSON.stringify(value, null, 2)
    return [{ id: `${baseId}-p-1`, text }]
  }

  return [{ id: `${baseId}-p-1`, text: String(value) }]
}

function toHeadingLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (s) => s.toUpperCase())
}

function isStructuredSection(value: unknown): value is StructuredSection {
  if (!value || typeof value !== 'object') return false
  const candidate = value as StructuredSection
  return 'content' in candidate || 'subsections' in candidate || 'title' in candidate
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry)) as Record<string, unknown>[]
}

function formatDisplayValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => formatDisplayValue(item)).join(', ')
  if (value && typeof value === 'object') return JSON.stringify(value)
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

function buildStructuredSections(value: unknown, baseId: string, defaultTitle: string, level: number): RenderedSection[] {
  if (!value) return []

  if (isStructuredSection(value)) {
    const title = value.title ?? defaultTitle
    const nodes: RenderedSection[] = [
      {
        id: baseId,
        title,
        level,
        paragraphs: toParagraphs(value.content, `${baseId}-content`),
      },
    ]

    if (Array.isArray(value.subsections)) {
      value.subsections.forEach((subsection, index) => {
        nodes.push(...buildStructuredSections(subsection, `${baseId}-sub-${index + 1}`, subsection.title ?? `Subsection ${index + 1}`, Math.min(level + 1, 4)))
      })
    }

    return nodes.filter((node) => node.paragraphs.length > 0 || node.title)
  }

  return [
    {
      id: baseId,
      title: defaultTitle,
      level,
      paragraphs: toParagraphs(value, `${baseId}-content`),
    },
  ].filter((node) => node.paragraphs.length > 0)
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

function StyledTable({ table }: { table: ArticleTable }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/60 bg-background/40">
      <p className="border-b border-border/50 px-4 py-2.5 text-sm font-semibold">{table.table_name}</p>
      <table className="w-full text-sm">
        <thead className="border-b border-border/60 bg-muted/30">
          <tr>
            {table.headers.map((header) => (
              <th key={header} className="whitespace-nowrap px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((value, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  className={`px-4 py-2 align-top ${cellIndex === 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                >
                  {String(value ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ArticlePreviewClient({
  articleId,
  articleData,
  articleLabel,
  docxPath,
  pdfPath,
}: {
  articleId: string
  articleData: ArticleData
  articleLabel: string
  docxPath: string
  pdfPath: string
}) {
  const [comments, setComments] = useState<ArticleComment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<CommentDraft | null>(null)
  const [authorName, setAuthorName] = useState('')
  const [commentText, setCommentText] = useState('')

  const commentsByParagraph = useMemo(() => {
    const map = new Map<string, ArticleComment[]>()
    for (const comment of comments) {
      const list = map.get(comment.paragraphId) ?? []
      list.push(comment)
      map.set(comment.paragraphId, list)
    }
    return map
  }, [comments])

  const sectionBlocks = useMemo(() => {
    const blocks: RenderedSection[] = []

    SECTION_ORDER.forEach(({ key, label }) => {
      const sectionValue = articleData[key]
      if (!sectionValue) return
      blocks.push(...buildStructuredSections(sectionValue, String(key), label, 2))
    })

    const keyResults = toParagraphs(articleData.key_results_summary, 'key-results')
    if (keyResults.length > 0) {
      blocks.push({ id: 'key-results', title: 'Key Results Summary', level: 2, paragraphs: keyResults })
    }

    return blocks
  }, [articleData])

  const usabilityData = useMemo(() => toRecord(articleData.usability_testing), [articleData.usability_testing])

  const usabilityStudyMetadata = useMemo(() => toRecord(usabilityData?.study_metadata), [usabilityData])
  const usabilityPanelDemographics = useMemo(() => toRecord(usabilityData?.expert_panel_demographics), [usabilityData])
  const usabilitySusScores = useMemo(() => toRecord(usabilityData?.sus_item_scores), [usabilityData])
  const usabilityThemes = useMemo(() => toRecord(usabilityData?.qualitative_feedback_themes), [usabilityData])
  const usabilityConclusions = useMemo(() => toRecord(usabilityData?.conclusions), [usabilityData])

  const usabilityNavSections = useMemo(() => {
    if (!usabilityData) return []
    return [
      { id: 'usability-testing', title: 'Usability Testing', level: 2 },
      { id: 'usability-study-metadata', title: 'Study Metadata', level: 3 },
      { id: 'usability-expert-panel-demographics', title: 'Expert Panel Demographics', level: 3 },
      { id: 'usability-sus-item-scores', title: 'SUS Item Scores', level: 3 },
      { id: 'usability-qualitative-feedback-themes', title: 'Qualitative Feedback Themes', level: 3 },
      { id: 'usability-conclusions', title: 'Conclusions & Recommendations', level: 3 },
    ]
  }, [usabilityData])

  const navigationSections = useMemo(() => [...sectionBlocks, ...usabilityNavSections], [sectionBlocks, usabilityNavSections])

  function getStorageKey() {
    return `noa-comments-${articleId}`
  }

  function loadComments() {
    setIsLoading(true)
    setError(null)
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(getStorageKey()) : null
      const stored: ArticleComment[] = raw ? JSON.parse(raw) : []
      setComments(stored)
    } catch {
      setError('Failed to load comments.')
    } finally {
      setIsLoading(false)
    }
  }

  function saveComment() {
    if (!draft) return

    const trimmedName = authorName.trim()
    const trimmedComment = commentText.trim()

    if (!trimmedName || !trimmedComment) {
      setError('Please provide both your name and a comment.')
      return
    }

    setError(null)

    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(getStorageKey()) : null
      const existing: ArticleComment[] = raw ? JSON.parse(raw) : []
      const newComment: ArticleComment = {
        id: Date.now(),
        articleId,
        paragraphId: draft.paragraphId,
        selectedText: draft.selectedText,
        commentText: trimmedComment,
        authorName: trimmedName,
        createdAt: new Date().toISOString(),
      }
      const updated = [...existing, newComment]
      localStorage.setItem(getStorageKey(), JSON.stringify(updated))
      setComments(updated)
      setCommentText('')
      setDraft(null)
      if (typeof window !== 'undefined') {
        window.getSelection()?.removeAllRanges()
      }
    } catch {
      setError('Failed to save comment. Please try again.')
    }
  }

  async function sendAllCommentsViaEmail() {
    if (comments.length === 0) {
      setError('No comments to send.')
      return
    }
    setError(null)

    const allCommentsText = comments
      .map((c, i) => `[${i + 1}] Section: ${c.paragraphId}\nSelected: "${c.selectedText}"\nComment: ${c.commentText}\nBy: ${c.authorName} — ${new Date(c.createdAt).toLocaleString()}`)
      .join('\n\n---\n\n')

    try {
      const result = await sendCommentNotification({
        articleName: articleLabel,
        articleId,
        authorName: comments.length === 1 ? comments[0].authorName : `${comments.length} reviewers`,
        selectedText: `${comments.length} comment(s) across the article`,
        commentText: allCommentsText,
        paragraphId: 'all-sections',
        timestamp: new Date().toISOString(),
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      })

      if (result.ok) {
        setError(null)
        alert(`✅ ${comments.length} comment(s) sent successfully to h.rad.it@gmail.com!`)
      } else {
        setError('Failed to send email. Check EmailJS configuration.')
      }
    } catch {
      setError('Failed to send email. Please try again.')
    }
  }

  function exportCommentsAsJson() {
    const blob = new Blob([JSON.stringify(comments, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${articleId}-comments.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function openDraftFromSelection(paragraphId: string) {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return

    const selectedText = selection.toString().trim()
    if (!selectedText) return

    const range = selection.getRangeAt(0)

    const startContainerElement =
      range.startContainer instanceof Element
        ? range.startContainer
        : range.startContainer.parentElement
    const endContainerElement =
      range.endContainer instanceof Element
        ? range.endContainer
        : range.endContainer.parentElement

    const startParagraph = startContainerElement?.closest('[data-paragraph-id]') as HTMLElement | null
    const endParagraph = endContainerElement?.closest('[data-paragraph-id]') as HTMLElement | null

    if (!startParagraph || !endParagraph || startParagraph.dataset.paragraphId !== endParagraph.dataset.paragraphId) {
      return
    }

    const rect = range.getBoundingClientRect()
    setDraft({
      paragraphId,
      selectedText,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 12,
    })
  }

  useEffect(() => {
    loadComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId])

  return (
    <div className="mx-auto max-w-screen-xl space-y-8 px-4 py-8 sm:px-6 lg:px-10">
      <BreadcrumbNav
        items={[
          { label: 'Articles', href: '/articles' },
          { label: articleLabel },
        ]}
      />

      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{articleLabel}</p>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{articleData.title}</h1>
        <p className="text-sm text-muted-foreground md:text-base">{articleData.authors}</p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild>
            <a href={docxPath} download>
              <Download className="mr-2 h-4 w-4" />
              Download DOCX
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={pdfPath} download>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </a>
          </Button>
          <Button variant="secondary" onClick={exportCommentsAsJson}>
            <FileJson className="mr-2 h-4 w-4" />
            Export Comments JSON
          </Button>
          <Button variant="ghost" onClick={loadComments} disabled={isLoading}>
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            {isLoading ? 'Refreshing comments...' : `Refresh Comments (${comments.length})`}
          </Button>
          {comments.length > 0 && (
            <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={sendAllCommentsViaEmail}>
              <Mail className="mr-2 h-4 w-4" />
              📧 Send All Comments ({comments.length})
            </Button>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Hint banner for comment system */}
        <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm text-blue-300">
          <MessageSquarePlus className="h-4 w-4 shrink-0" />
          <span><strong>How to comment:</strong> Select (highlight) any text in the article below, then a comment box will appear.</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-border/60 bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">On this page</h2>
            <nav className="mt-3 space-y-1">
              {navigationSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`block rounded px-2 py-1 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground ${
                    section.level > 2 ? 'ml-3 text-xs' : ''
                  }`}
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <section className="space-y-8">
          {usabilityData && (
            <article id="usability-testing" className="scroll-mt-24 space-y-6 rounded-xl border border-sky-500/30 bg-sky-500/5 p-6">
              <h2 className="text-2xl font-semibold tracking-tight">Usability Testing</h2>
              <p className="text-sm text-muted-foreground">
                Structured SUS expert evaluation summary prepared for clinical and academic review.
              </p>

              <section id="usability-study-metadata" className="scroll-mt-24 space-y-3 rounded-lg border border-border/60 bg-card/80 p-4">
                <h3 className="text-lg font-semibold tracking-tight">Study Metadata</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {Object.entries(usabilityStudyMetadata ?? {}).map(([key, value]) => (
                    <div key={key} className="rounded border border-border/50 bg-background/50 px-3 py-2 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{toHeadingLabel(key)}</p>
                      <p className="mt-1 whitespace-pre-wrap text-foreground">{formatDisplayValue(value)}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="usability-expert-panel-demographics" className="scroll-mt-24 space-y-3 rounded-lg border border-border/60 bg-card/80 p-4">
                <h3 className="text-lg font-semibold tracking-tight">Expert Panel Demographics</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {Object.entries(usabilityPanelDemographics ?? {})
                    .filter(([key]) => key !== 'panel_members')
                    .map(([key, value]) => (
                      <div key={key} className="rounded border border-border/50 bg-background/50 px-3 py-2 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{toHeadingLabel(key)}</p>
                        <p className="mt-1 whitespace-pre-wrap text-foreground">{formatDisplayValue(value)}</p>
                      </div>
                    ))}
                </div>
                {toRecordArray(usabilityPanelDemographics?.panel_members).length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-border/60 bg-background/50">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left">ID</th>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Specialty</th>
                          <th className="px-3 py-2 text-left">Experience (Years)</th>
                          <th className="px-3 py-2 text-left">SUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {toRecordArray(usabilityPanelDemographics?.panel_members).map((member, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">{formatDisplayValue(member.id)}</td>
                            <td className="px-3 py-2">{formatDisplayValue(member.name)}</td>
                            <td className="px-3 py-2">{formatDisplayValue(member.specialty)}</td>
                            <td className="px-3 py-2">{formatDisplayValue(member.years_experience)}</td>
                            <td className="px-3 py-2">{formatDisplayValue(member.sus_score)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section id="usability-sus-item-scores" className="scroll-mt-24 space-y-3 rounded-lg border border-border/60 bg-card/80 p-4">
                <h3 className="text-lg font-semibold tracking-tight">SUS Item Scores</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {Object.entries(toRecord(usabilitySusScores?.aggregate_statistics) ?? {}).map(([key, value]) => (
                    <div key={key} className="rounded border border-border/50 bg-background/50 px-3 py-2 text-sm">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{toHeadingLabel(key)}</p>
                      <p className="mt-1 text-foreground">{formatDisplayValue(value)}</p>
                    </div>
                  ))}
                </div>
                {toRecordArray(usabilitySusScores?.item_statistics).length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-border/60 bg-background/50">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left">Item</th>
                          <th className="px-3 py-2 text-left">Question</th>
                          <th className="px-3 py-2 text-left">Raw Mean ± SD</th>
                          <th className="px-3 py-2 text-left">Contribution Mean ± SD</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {toRecordArray(usabilitySusScores?.item_statistics).map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-medium">{formatDisplayValue(item.item_id)}</td>
                            <td className="px-3 py-2">{formatDisplayValue(item.item_text)}</td>
                            <td className="px-3 py-2">{formatDisplayValue(item.raw_mean)} ± {formatDisplayValue(item.raw_sd)}</td>
                            <td className="px-3 py-2">{formatDisplayValue(item.contribution_mean_0_to_4)} ± {formatDisplayValue(item.contribution_sd_0_to_4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section id="usability-qualitative-feedback-themes" className="scroll-mt-24 space-y-3 rounded-lg border border-border/60 bg-card/80 p-4">
                <h3 className="text-lg font-semibold tracking-tight">Qualitative Feedback Themes</h3>
                {Object.entries(usabilityThemes ?? {}).map(([key, value]) => (
                  <div key={key} className="rounded border border-border/50 bg-background/50 p-3">
                    <p className="text-sm font-semibold text-foreground">{toHeadingLabel(key)}</p>
                    {Array.isArray(value) ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {value.map((entry, idx) => (
                          <li key={idx}>{formatDisplayValue(entry)}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{formatDisplayValue(value)}</p>
                    )}
                  </div>
                ))}
              </section>

              <section id="usability-conclusions" className="scroll-mt-24 space-y-3 rounded-lg border border-border/60 bg-card/80 p-4">
                <h3 className="text-lg font-semibold tracking-tight">Conclusions & Recommendations</h3>
                {Object.entries(usabilityConclusions ?? {}).map(([key, value]) => (
                  <div key={key} className="rounded border border-border/50 bg-background/50 p-3">
                    <p className="text-sm font-semibold text-foreground">{toHeadingLabel(key)}</p>
                    {Array.isArray(value) ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {value.map((entry, idx) => (
                          <li key={idx}>{formatDisplayValue(entry)}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{formatDisplayValue(value)}</p>
                    )}
                  </div>
                ))}
              </section>
            </article>
          )}

          {sectionBlocks.map((section) => (
            <AIAssistWrapper key={section.id} id={`${articleId}-${section.id}`}>
            <article id={section.id} className="scroll-mt-24 space-y-4 rounded-xl border border-border/60 bg-card p-5">
              {section.level <= 2 ? (
                <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
              ) : (
                <h3 className="text-lg font-semibold tracking-tight text-muted-foreground">{section.title}</h3>
              )}

              <div className="space-y-3">
                {section.paragraphs.map((paragraph) => {
                  const paragraphComments = commentsByParagraph.get(paragraph.id) ?? []
                  const hasComments = paragraphComments.length > 0

                  return (
                    <div
                      key={paragraph.id}
                      data-paragraph-id={paragraph.id}
                      className={`relative rounded-md border px-4 py-3 text-sm leading-relaxed transition-colors ${
                        hasComments
                          ? 'border-amber-400/60 bg-amber-50/70 dark:bg-amber-950/20'
                          : 'border-border/60 bg-background/40'
                      }`}
                      onMouseUp={() => openDraftFromSelection(paragraph.id)}
                    >
                      <p className="whitespace-pre-line pr-14">{paragraph.text}</p>

                      {hasComments && (
                        <div className="group absolute right-2 top-2">
                          <span className="inline-flex cursor-default items-center rounded-full border border-amber-500/50 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                            {paragraphComments.length} comment{paragraphComments.length > 1 ? 's' : ''}
                          </span>
                          <div className="invisible absolute right-0 z-20 mt-2 w-80 rounded-md border border-border bg-popover p-3 text-xs opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                            <p className="mb-2 font-semibold">Comments on this paragraph</p>
                            <ul className="max-h-56 space-y-2 overflow-auto pr-1">
                              {paragraphComments.map((comment) => (
                                <li key={comment.id} className="rounded border border-border/50 p-2">
                                  <p className="font-medium text-foreground">{comment.authorName}</p>
                                  <p className="mt-1 text-muted-foreground">“{comment.selectedText}”</p>
                                  <p className="mt-1 text-foreground">{comment.commentText}</p>
                                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                                    {formatDate(comment.createdAt)}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </article>
            </AIAssistWrapper>
          ))}
        </section>
      </div>

      {articleData.tables && articleData.tables.length > 0 && (
        <AIAssistWrapper id={`${articleId}-tables`}>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Results Tables</h2>
          <div className="space-y-4">
            {articleData.tables.map((table) => (
              <StyledTable key={table.table_name} table={table} />
            ))}
          </div>
        </section>
        </AIAssistWrapper>
      )}

      {articleData.figures && articleData.figures.length > 0 && (
        <AIAssistWrapper id={`${articleId}-figures`}>
        <section className="space-y-3 rounded-xl border border-border/60 bg-card p-5">
          <h2 className="text-2xl font-semibold tracking-tight">Figures</h2>
          <ul className="space-y-2">
            {articleData.figures.map((figure, index) => (
              <li key={`${figure.figure_name}-${index}`} className="rounded-md border border-border/50 bg-background/30 px-4 py-3 text-sm">
                <p className="font-semibold">{figure.figure_name}</p>
                <p className="mt-1 text-muted-foreground">{figure.caption ?? figure.description}</p>
              </li>
            ))}
          </ul>
        </section>
        </AIAssistWrapper>
      )}

      {articleData.tripod_ai_checklist?.items && articleData.tripod_ai_checklist.items.length > 0 && (
        <AIAssistWrapper id={`${articleId}-tripod`}>
        <section className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <h2 className="text-2xl font-semibold tracking-tight">TRIPOD+AI Checklist</h2>
          <div className="overflow-x-auto rounded-lg border border-border/60 bg-background/30">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">Section</th>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {articleData.tripod_ai_checklist.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">{item.section ?? ''}</td>
                    <td className="px-4 py-2">{item.item ?? ''}</td>
                    <td className="px-4 py-2">{item.description ?? ''}</td>
                    <td className="px-4 py-2">{item.status ?? ''}</td>
                    <td className="px-4 py-2">{item.location ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        </AIAssistWrapper>
      )}

      {articleData.probast_assessment?.domains && articleData.probast_assessment.domains.length > 0 && (
        <AIAssistWrapper id={`${articleId}-probast`}>
        <section className="space-y-3 rounded-xl border border-sky-500/30 bg-sky-500/5 p-5">
          <h2 className="text-2xl font-semibold tracking-tight">PROBAST Assessment</h2>
          <div className="overflow-x-auto rounded-lg border border-border/60 bg-background/30">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">Domain</th>
                  <th className="px-4 py-2 text-left">Signaling Question</th>
                  <th className="px-4 py-2 text-left">Judgment / Risk</th>
                  <th className="px-4 py-2 text-left">Justification / v2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {articleData.probast_assessment.domains.map((domain, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">{domain.domain ?? ''}</td>
                    <td className="px-4 py-2">{domain.signaling_question ?? ''}</td>
                    <td className="px-4 py-2">{domain.risk_of_bias ?? domain.v1_judgment ?? ''}</td>
                    <td className="px-4 py-2">{domain.justification ?? domain.v2_judgment ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        </AIAssistWrapper>
      )}

      {draft && (
        <div className="fixed z-50 w-[360px] max-w-[calc(100vw-1rem)] -translate-x-1/2 rounded-lg border border-border bg-card p-4 shadow-xl" style={{ left: draft.x, top: draft.y }}>
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="text-sm font-semibold">Add supervisor comment</p>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded p-1 text-muted-foreground hover:bg-muted"
              aria-label="Close comment popup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mb-3 line-clamp-3 text-xs text-muted-foreground">Selected text: “{draft.selectedText}”</p>
          <div className="space-y-2">
            <input
              value={authorName}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="Your name"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Write your comment"
              rows={4}
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveComment}>
                Save Comment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
