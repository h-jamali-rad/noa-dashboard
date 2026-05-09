'use client'

import BreadcrumbNav from '@/components/breadcrumb-nav'
import { Button } from '@/components/ui/button'
import { Download, FileJson, MessageSquarePlus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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
  description: string
}

export type ArticleData = {
  title: string
  authors: string
  abstract?: unknown
  introduction?: unknown
  methods?: unknown
  results?: unknown
  discussion?: unknown
  references?: unknown
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

const CORE_SECTIONS: Array<{ key: keyof ArticleData; label: string }> = [
  { key: 'abstract', label: 'Abstract' },
  { key: 'introduction', label: 'Introduction' },
  { key: 'methods', label: 'Methods' },
  { key: 'results', label: 'Results' },
  { key: 'discussion', label: 'Discussion' },
  { key: 'references', label: 'References' },
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
    const blocks = CORE_SECTIONS.map(({ key, label }) => ({
      key,
      label,
      paragraphs: toParagraphs(articleData[key], String(key)),
    })).filter((section) => section.paragraphs.length > 0)

    const keyResults = toParagraphs(articleData.key_results_summary, 'key-results')
    if (keyResults.length > 0) {
      blocks.push({
        key: 'key_results_summary',
        label: 'Key Results Summary',
        paragraphs: keyResults,
      })
    }

    return blocks
  }, [articleData])

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
      setError('Failed to load comments from local storage.')
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
      const newComment: ArticleComment = {
        id: Date.now(),
        articleId,
        paragraphId: draft.paragraphId,
        selectedText: draft.selectedText,
        commentText: trimmedComment,
        authorName: trimmedName,
        createdAt: new Date().toISOString(),
      }

      const raw = typeof window !== 'undefined' ? localStorage.getItem(getStorageKey()) : null
      const existing: ArticleComment[] = raw ? JSON.parse(raw) : []
      existing.push(newComment)
      localStorage.setItem(getStorageKey(), JSON.stringify(existing))

      setCommentText('')
      setDraft(null)
      if (typeof window !== 'undefined') {
        window.getSelection()?.removeAllRanges()
      }
      loadComments()
    } catch {
      setError('Failed to save comment.')
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
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </header>

      <section className="space-y-8">
        {sectionBlocks.map((section) => (
          <article key={String(section.key)} className="space-y-4 rounded-xl border border-border/60 bg-card p-5">
            <h2 className="text-xl font-semibold tracking-tight">{section.label}</h2>
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
        ))}
      </section>

      {articleData.tables && articleData.tables.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Results Tables</h2>
          <div className="space-y-4">
            {articleData.tables.map((table) => (
              <StyledTable key={table.table_name} table={table} />
            ))}
          </div>
        </section>
      )}

      {articleData.figures && articleData.figures.length > 0 && (
        <section className="space-y-3 rounded-xl border border-border/60 bg-card p-5">
          <h2 className="text-2xl font-semibold tracking-tight">Figures</h2>
          <ul className="space-y-2">
            {articleData.figures.map((figure, index) => (
              <li key={`${figure.figure_name}-${index}`} className="rounded-md border border-border/50 bg-background/30 px-4 py-3 text-sm">
                <p className="font-semibold">{figure.figure_name}</p>
                <p className="mt-1 text-muted-foreground">{figure.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {articleData.tripod_ai_checklist?.items && articleData.tripod_ai_checklist.items.length > 0 && (
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
      )}

      {articleData.probast_assessment?.domains && articleData.probast_assessment.domains.length > 0 && (
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
