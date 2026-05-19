'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Printer,
  FileText,
  Globe,
  List,
  ArrowUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ──────────────────────── Types ──────────────────────── */
interface ThesisData {
  english_abstract: string
  persian_abstract: string
  abbreviations: Array<string | { abbreviation: string; full_form: string }>
  chapter_1_introduction: string
  chapter_2_literature_review: string
  chapter_3_methods: string
  chapter_4_results: string
  chapter_5_discussion: string
  references: string[]
  table_of_contents: string
  list_of_tables: string[]
  list_of_figures: string[]
}

interface ChapterInfo {
  key: keyof ThesisData
  num: number
  title: string
  icon: string
}

const CHAPTERS: ChapterInfo[] = [
  { key: 'chapter_1_introduction', num: 1, title: 'Introduction', icon: '📖' },
  { key: 'chapter_2_literature_review', num: 2, title: 'Literature Review', icon: '📚' },
  { key: 'chapter_3_methods', num: 3, title: 'Methods', icon: '🔬' },
  { key: 'chapter_4_results', num: 4, title: 'Results', icon: '📊' },
  { key: 'chapter_5_discussion', num: 5, title: 'Discussion & Conclusion', icon: '💡' },
]

/* ──────────────────── Helpers ──────────────────── */

/** Parse plain text into paragraphs, detecting headings by numbering patterns */
function parseChapterContent(text: string) {
  const lines = text.split('\n')
  const elements: { type: 'h1' | 'h2' | 'h3' | 'h4' | 'p'; text: string; id?: string }[] = []

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    // Chapter title line  e.g. "Chapter 1: Introduction"
    if (/^Chapter\s+\d+[:\s]/i.test(line)) {
      const id = line.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')
      elements.push({ type: 'h1', text: line, id })
      continue
    }

    // Section  e.g. "1.1 Problem Statement"
    if (/^\d+\.\d+\.\d+\.\d+\s/.test(line)) {
      const id = line.match(/^[\d.]+/)?.[0]?.replace(/\./g, '-') ?? ''
      elements.push({ type: 'h4', text: line, id: `sec-${id}` })
    } else if (/^\d+\.\d+\.\d+\s/.test(line)) {
      const id = line.match(/^[\d.]+/)?.[0]?.replace(/\./g, '-') ?? ''
      elements.push({ type: 'h3', text: line, id: `sec-${id}` })
    } else if (/^\d+\.\d+\s/.test(line)) {
      const id = line.match(/^[\d.]+/)?.[0]?.replace(/\./g, '-') ?? ''
      elements.push({ type: 'h2', text: line, id: `sec-${id}` })
    } else {
      // Regular paragraph
      elements.push({ type: 'p', text: line })
    }
  }

  return elements
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

/* ──────────────────── Components ──────────────────── */

function TOCSidebar({
  activeChapter,
  onSelect,
}: {
  activeChapter: number | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="space-y-1">
      <button
        onClick={() => onSelect('english-abstract')}
        className="block w-full text-left text-xs px-2 py-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        English Abstract
      </button>
      <button
        onClick={() => onSelect('persian-abstract')}
        className="block w-full text-left text-xs px-2 py-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        Persian Abstract
      </button>
      <button
        onClick={() => onSelect('abbreviations')}
        className="block w-full text-left text-xs px-2 py-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        Abbreviations
      </button>
      <div className="border-t border-border my-2" />
      {CHAPTERS.map((ch) => (
        <button
          key={ch.num}
          onClick={() => onSelect(`chapter-${ch.num}`)}
          className={cn(
            'block w-full text-left text-xs px-2 py-1.5 rounded transition-colors',
            activeChapter === ch.num
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <span className="mr-1">{ch.icon}</span> Ch. {ch.num}: {ch.title}
        </button>
      ))}
      <div className="border-t border-border my-2" />
      <button
        onClick={() => onSelect('references')}
        className="block w-full text-left text-xs px-2 py-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
      >
        References
      </button>
    </div>
  )
}

function ChapterSection({ chapter, data }: { chapter: ChapterInfo; data: ThesisData }) {
  const [expanded, setExpanded] = useState(false)
  const content = data[chapter.key] as string
  const elements = parseChapterContent(content)
  const wc = wordCount(content)

  return (
    <section id={`chapter-${chapter.num}`} className="scroll-mt-24">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 rounded-lg border bg-card px-5 py-4 hover:border-primary/40 transition-colors group"
      >
        <span className="text-2xl">{chapter.icon}</span>
        <div className="text-left flex-1 min-w-0">
          <h2 className="font-display font-semibold text-lg tracking-tight">
            Chapter {chapter.num}: {chapter.title}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {wc.toLocaleString()} words • {elements.filter((e) => e.type !== 'p').length} sections
          </p>
        </div>
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="rounded-b-lg border border-t-0 bg-card/50 px-6 py-6 sm:px-8 space-y-4 text-sm leading-relaxed">
              {elements.map((el, i) => {
                if (el.type === 'h1')
                  return (
                    <h2
                      key={i}
                      id={el.id}
                      className="font-display font-bold text-xl mt-6 mb-2 scroll-mt-24"
                    >
                      {el.text}
                    </h2>
                  )
                if (el.type === 'h2')
                  return (
                    <h3
                      key={i}
                      id={el.id}
                      className="font-display font-semibold text-base mt-5 mb-1.5 text-foreground/90 scroll-mt-24"
                    >
                      {el.text}
                    </h3>
                  )
                if (el.type === 'h3')
                  return (
                    <h4
                      key={i}
                      id={el.id}
                      className="font-display font-medium text-sm mt-4 mb-1 text-foreground/80 scroll-mt-24"
                    >
                      {el.text}
                    </h4>
                  )
                if (el.type === 'h4')
                  return (
                    <h5
                      key={i}
                      id={el.id}
                      className="font-medium text-sm mt-3 mb-1 text-foreground/70 scroll-mt-24"
                    >
                      {el.text}
                    </h5>
                  )
                return (
                  <p key={i} className="text-foreground/80">
                    {el.text}
                  </p>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/* ──────────────────── Main Component ──────────────────── */

export default function ThesisClient({ data }: { data: ThesisData }) {
  const [showTOC, setShowTOC] = useState(true)
  const [activeChapter, setActiveChapter] = useState<number | null>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const totalWords = [
    data.english_abstract,
    data.persian_abstract,
    data.chapter_1_introduction,
    data.chapter_2_literature_review,
    data.chapter_3_methods,
    data.chapter_4_results,
    data.chapter_5_discussion,
  ].reduce((sum, t) => sum + wordCount(t), 0)

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="relative">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{totalWords.toLocaleString()}</span>
          <span className="text-muted-foreground">words</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs">
          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">5</span>
          <span className="text-muted-foreground">chapters</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-xs">
          <List className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{data.references.length}</span>
          <span className="text-muted-foreground">references</span>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowTOC(!showTOC)}
            className="flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-xs hover:bg-accent transition-colors"
          >
            <List className="h-3.5 w-3.5" />
            {showTOC ? 'Hide' : 'Show'} TOC
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-md border bg-primary text-primary-foreground px-3 py-1.5 text-xs hover:bg-primary/90 transition-colors print:hidden"
          >
            <Printer className="h-3.5 w-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* TOC Sidebar */}
        {showTOC && (
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                Table of Contents
              </p>
              <TOCSidebar activeChapter={activeChapter} onSelect={scrollTo} />
            </div>
          </aside>
        )}

        {/* Main content */}
        <div ref={contentRef} className="flex-1 min-w-0 space-y-8">
          {/* English Abstract */}
          <section id="english-abstract" className="scroll-mt-24">
            <div className="rounded-lg border bg-card px-6 py-5 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <h2 className="font-display font-semibold text-lg">Abstract (English)</h2>
              </div>
              <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-line">
                {data.english_abstract}
              </div>
            </div>
          </section>

          {/* Persian Abstract */}
          <section id="persian-abstract" className="scroll-mt-24">
            <div className="rounded-lg border bg-card px-6 py-5 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <h2 className="font-display font-semibold text-lg">Abstract (Persian)</h2>
              </div>
              <div
                className="text-sm leading-loose text-foreground/80 whitespace-pre-line"
                dir="rtl"
                lang="fa"
              >
                {data.persian_abstract}
              </div>
            </div>
          </section>

          {/* Abbreviations */}
          <section id="abbreviations" className="scroll-mt-24">
            <div className="rounded-lg border bg-card px-6 py-5 space-y-3">
              <h2 className="font-display font-semibold text-lg">List of Abbreviations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                {data.abbreviations.map((abbr, i) => {
                  const label =
                    typeof abbr === 'string'
                      ? abbr
                      : `${abbr.abbreviation} — ${abbr.full_form}`
                  return (
                    <div key={i} className="px-2 py-1 rounded hover:bg-accent/50 transition-colors">
                      {typeof abbr === 'string' ? (
                        abbr
                      ) : (
                        <>
                          <span className="font-semibold">{abbr.abbreviation}</span>
                          <span className="text-muted-foreground"> — {abbr.full_form}</span>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Chapters */}
          {CHAPTERS.map((ch) => (
            <ChapterSection key={ch.num} chapter={ch} data={data} />
          ))}

          {/* References */}
          <section id="references" className="scroll-mt-24">
            <div className="rounded-lg border bg-card px-6 py-5 space-y-3">
              <h2 className="font-display font-semibold text-lg">
                References ({data.references.length})
              </h2>
              <ol className="space-y-1.5 text-xs">
                {data.references.map((ref, i) => (
                  <li
                    key={i}
                    className="rounded px-2 py-1 hover:bg-accent/50 transition-colors"
                  >
                    <span className="font-mono text-muted-foreground mr-2">[{i + 1}]</span>
                    {ref}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
      </div>

      {/* Back to top */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs shadow-lg hover:bg-primary/90 transition-colors print:hidden"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Back to top
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
