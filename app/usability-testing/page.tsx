'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import BreadcrumbNav from '@/components/breadcrumb-nav'
import { ClipboardCheck, ChevronDown, ChevronUp, Headphones, Play, Pause, Volume2, ExternalLink, BarChart3, Users, Star, MessageSquare, CheckCircle2, AlertTriangle } from 'lucide-react'
import podcastData from '@/data/content/usability_podcast_data.json'

const HOST_COLORS: Record<string, string> = {
  'Dr. Alex': '#0e7490',
  'Dr. Sarah': '#7c3aed',
}

/* ── SUS Data (from article_b_extracted) ── */
const SUS_RESULTS = {
  mean: 77.0,
  sd: 8.73,
  median: 77.5,
  min: 65.0,
  max: 87.5,
  ci_lower: 66.16,
  ci_upper: 87.84,
  cronbach_alpha: 0.783,
  adjective: 'Good',
  acceptability: 'Acceptable',
  grade: 'B',
  percentile: 'Top 30%',
}

const EXPERTS = [
  { id: 'E1', name: 'Prof. Maria Elena Rossi', specialty: 'Medical Informatics', affiliation: 'University of Rome La Sapienza', score: 77.5, grade: 'B', adjective: 'Good' },
  { id: 'E2', name: 'Dr. James Kofi Mensah', specialty: 'Urology (Male Infertility)', affiliation: 'University of Cape Town', score: 82.5, grade: 'A-', adjective: 'Good' },
  { id: 'E3', name: 'Dr. Yuki Tanaka', specialty: 'Andrology & Reproductive Medicine', affiliation: 'Keio University, Tokyo', score: 87.5, grade: 'A', adjective: 'Excellent' },
  { id: 'E4', name: 'Dr. Henrik Lindqvist', specialty: 'Healthcare UX & HCI', affiliation: 'KTH / Karolinska, Stockholm', score: 65.0, grade: 'C-', adjective: 'OK' },
  { id: 'E5', name: 'Dr. Priya Venkataraman', specialty: 'Clinical Informatics', affiliation: 'AIIMS, New Delhi', score: 72.5, grade: 'C', adjective: 'OK' },
]

const STRENGTHS = [
  'Clinical relevance and comprehensiveness of predictors',
  'Transparent and interpretable AI outputs (SHAP explanations)',
  'Learnability and practical consultation utility',
]

const WEAKNESSES = [
  'Interoperability and deployment constraints (HL7 FHIR/openEHR)',
  'Workflow friction and UI resilience gaps',
  'Governance and external validity concerns',
]

export default function UsabilityTestingPage() {
  const [openSection, setOpenSection] = useState<number | null>(null)
  const [playingSection, setPlayingSection] = useState<number | null>(null)
  const [progress, setProgress] = useState<Record<number, number>>({})
  const [duration, setDuration] = useState<Record<number, number>>({})
  const audioRefs = useRef<Record<number, HTMLAudioElement>>({})

  useEffect(() => {
    const interval = setInterval(() => {
      if (playingSection !== null) {
        const audio = audioRefs.current[playingSection]
        if (audio) {
          setProgress(prev => ({ ...prev, [playingSection]: audio.currentTime }))
        }
      }
    }, 250)
    return () => clearInterval(interval)
  }, [playingSection])

  const togglePlay = (idx: number) => {
    if (playingSection !== null && playingSection !== idx) {
      const prev = audioRefs.current[playingSection]
      if (prev) prev.pause()
    }
    if (!audioRefs.current[idx]) {
      const audio = new Audio(`/audio/usability_section_${idx + 1}.mp3`)
      audio.addEventListener('loadedmetadata', () => {
        setDuration(prev => ({ ...prev, [idx]: audio.duration }))
      })
      audio.addEventListener('ended', () => setPlayingSection(null))
      audioRefs.current[idx] = audio
    }
    const audio = audioRefs.current[idx]
    if (playingSection === idx) {
      audio.pause()
      setPlayingSection(null)
    } else {
      audio.play()
      setPlayingSection(idx)
      setOpenSection(idx)
    }
  }

  const seekTo = (idx: number, e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRefs.current[idx]
    if (!audio || !duration[idx]) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * duration[idx]
    setProgress(prev => ({ ...prev, [idx]: audio.currentTime }))
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-8">
      <BreadcrumbNav items={[{ label: 'Usability Testing' }]} />

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
          <ClipboardCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight">CDSS Usability Testing</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            System Usability Scale (SUS) expert evaluation of the micro-TESE Clinical Decision Support System.
            Click <Headphones className="inline h-3.5 w-3.5 text-emerald-600" /> to listen to each section.
          </p>
        </div>
      </div>

      {/* Direct Access to CDSS */}
      <Link
        href="/cdss"
        className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 hover:bg-emerald-500/10 transition-colors group"
      >
        <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <ExternalLink className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Try the CDSS Panel</p>
          <p className="text-xs text-muted-foreground">Open the micro-TESE Clinical Decision Support System that was evaluated in this study</p>
        </div>
        <ExternalLink className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>

      {/* SUS Score Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <BarChart3 className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-600">{SUS_RESULTS.mean}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Mean SUS Score</p>
          <p className="text-[9px] text-muted-foreground">SD ±{SUS_RESULTS.sd}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <Star className="h-5 w-5 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-600">{SUS_RESULTS.grade}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Letter Grade</p>
          <p className="text-[9px] text-muted-foreground">{SUS_RESULTS.adjective} — {SUS_RESULTS.acceptability}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <Users className="h-5 w-5 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-600">5</p>
          <p className="text-[10px] text-muted-foreground mt-1">Expert Evaluators</p>
          <p className="text-[9px] text-muted-foreground">Multidisciplinary panel</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <CheckCircle2 className="h-5 w-5 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-600">{SUS_RESULTS.cronbach_alpha}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Cronbach\u2019s \u03B1</p>
          <p className="text-[9px] text-muted-foreground">Acceptable to Good</p>
        </div>
      </div>

      {/* Expert Scores Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Expert Panel Scores
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="px-4 py-2 text-left font-medium">Expert</th>
                <th className="px-4 py-2 text-left font-medium">Specialty</th>
                <th className="px-4 py-2 text-left font-medium">Affiliation</th>
                <th className="px-4 py-2 text-center font-medium">SUS Score</th>
                <th className="px-4 py-2 text-center font-medium">Grade</th>
                <th className="px-4 py-2 text-center font-medium">Rating</th>
              </tr>
            </thead>
            <tbody>
              {EXPERTS.map((expert) => (
                <tr key={expert.id} className="border-b last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-2.5 font-medium">{expert.name}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{expert.specialty}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{expert.affiliation}</td>
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${expert.score}%`,
                            backgroundColor: expert.score >= 80 ? '#059669' : expert.score >= 70 ? '#d97706' : '#dc2626',
                          }}
                        />
                      </div>
                      <span className="font-mono font-semibold text-xs">{expert.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center font-mono font-bold text-xs">{expert.grade}</td>
                  <td className="px-4 py-2.5 text-center text-xs">{expert.adjective}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-muted/10 border-t">
          <p className="text-[10px] text-muted-foreground text-center">
            Mean: {SUS_RESULTS.mean} · 95% CI: [{SUS_RESULTS.ci_lower}, {SUS_RESULTS.ci_upper}] · Industry benchmark: 68
          </p>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Strength Themes
          </h3>
          <ul className="space-y-2">
            {STRENGTHS.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                <span className="text-emerald-500 mt-0.5">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Improvement Areas
          </h3>
          <ul className="space-y-2">
            {WEAKNESSES.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                <span className="text-amber-500 mt-0.5">⚠</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Intro banner */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">Podcast Introduction</p>
        <p className="text-sm text-foreground/80 italic">
          &ldquo;{podcastData.intro}&rdquo;
        </p>
      </div>

      {/* Podcast Sections */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Headphones className="h-5 w-5 text-emerald-600" />
          Usability Evaluation Podcast
        </h2>
        {podcastData.sections.map((section, idx) => {
          const isOpen = openSection === idx
          const isPlaying = playingSection === idx
          const prog = progress[idx] || 0
          const dur = duration[idx] || 0
          const pct = dur > 0 ? (prog / dur) * 100 : 0

          return (
            <div key={idx} className={`rounded-xl border shadow-sm overflow-hidden transition-all ${
              isPlaying ? 'border-emerald-500/40 bg-emerald-500/[0.02] ring-1 ring-emerald-500/20' : 'bg-card'
            }`}>
              <div className="flex items-center">
                <button
                  onClick={() => togglePlay(idx)}
                  className={`flex items-center justify-center w-14 h-14 shrink-0 transition-colors ${
                    isPlaying
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted/30 text-emerald-600 hover:bg-emerald-500/10'
                  }`}
                  title={isPlaying ? 'Pause' : 'Listen to this section'}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setOpenSection(isOpen ? null : idx)}
                  className="flex-1 flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-mono font-semibold text-white shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-display font-semibold text-sm">{section.title}</span>
                      {isPlaying && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Volume2 className="h-3 w-3 text-emerald-600 animate-pulse" />
                          <span className="text-[10px] text-emerald-600 font-mono">
                            {formatTime(prog)} / {formatTime(dur)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
              {(isPlaying || prog > 0) && (
                <div className="h-1 bg-muted/30 cursor-pointer" onClick={(e) => seekTo(idx, e)}>
                  <div className="h-full bg-emerald-600 transition-all duration-200" style={{ width: `${pct}%` }} />
                </div>
              )}
              {isOpen && (
                <div className="px-4 pb-5 space-y-3">
                  {section.lines.map((line, li) => {
                    const color = HOST_COLORS[line.speaker] || '#666'
                    const isAlex = line.speaker === 'Dr. Alex'
                    return (
                      <div key={li} className={`flex gap-3 ${isAlex ? '' : 'flex-row-reverse'}`}>
                        <div className="shrink-0 flex flex-col items-center gap-1">
                          <div
                            className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: color }}
                          >
                            {isAlex ? 'A' : 'S'}
                          </div>
                          <span className="text-[9px] text-muted-foreground font-mono">{line.speaker.split(' ')[1]}</span>
                        </div>
                        <div
                          className={`rounded-xl px-4 py-3 text-sm leading-relaxed max-w-[85%] ${
                            isAlex ? 'bg-muted/50 rounded-tl-none' : 'bg-emerald-500/5 rounded-tr-none'
                          }`}
                        >
                          {line.text}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center py-4 space-y-1">
        <p>6 sections · {podcastData.sections.reduce((a, s) => a + s.lines.length, 0)} dialogue exchanges · English audio with male & female voices</p>
        <p className="italic">This media is generated from this investigation with Hossein Jamalirad&apos;s Architecture&apos;s agent.</p>
      </div>
    </div>
  )
}
