'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import BreadcrumbNav from '@/components/breadcrumb-nav'
import { ClipboardCheck, ChevronDown, ChevronUp, Headphones, Pause, Volume2, ExternalLink, BarChart3, Users, Star, MessageSquare, CheckCircle2, AlertTriangle, UserPlus, Send, Award } from 'lucide-react'
import podcastData from '@/data/content/usability_podcast_data.json'

const HOST_COLORS: Record<string, string> = {
  'Dr. Alex': '#0e7490',
  'Dr. Sarah': '#7c3aed',
}

/* ── SUS Agent Expert Data ── */
const AGENT_EXPERTS = [
  { id: 'E1', name: 'Prof. Maria Elena Rossi', specialty: 'Medical Informatics', affiliation: 'University of Rome La Sapienza', score: 77.5, grade: 'B', adjective: 'Good' },
  { id: 'E2', name: 'Dr. James Kofi Mensah', specialty: 'Urology (Male Infertility)', affiliation: 'University of Cape Town', score: 82.5, grade: 'A-', adjective: 'Good' },
  { id: 'E3', name: 'Dr. Yuki Tanaka', specialty: 'Andrology & Reproductive Medicine', affiliation: 'Keio University, Tokyo', score: 87.5, grade: 'A', adjective: 'Excellent' },
  { id: 'E4', name: 'Dr. Henrik Lindqvist', specialty: 'Healthcare UX & HCI', affiliation: 'KTH / Karolinska, Stockholm', score: 65.0, grade: 'C-', adjective: 'OK' },
  { id: 'E5', name: 'Dr. Priya Venkataraman', specialty: 'Clinical Informatics', affiliation: 'AIIMS, New Delhi', score: 72.5, grade: 'C', adjective: 'OK' },
]

const AGENT_MEAN = 77.0
const AGENT_SD = 8.73

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

const SUS_QUESTIONS = [
  { id: 1, text: 'I think that I would like to use this system frequently.', polarity: 'positive' },
  { id: 2, text: 'I found the system unnecessarily complex.', polarity: 'negative' },
  { id: 3, text: 'I thought the system was easy to use.', polarity: 'positive' },
  { id: 4, text: 'I think that I would need the support of a technical person to be able to use this system.', polarity: 'negative' },
  { id: 5, text: 'I found the various functions in this system were well integrated.', polarity: 'positive' },
  { id: 6, text: 'I thought there was too much inconsistency in this system.', polarity: 'negative' },
  { id: 7, text: 'I would imagine that most people would learn to use this system very quickly.', polarity: 'positive' },
  { id: 8, text: 'I found the system very cumbersome to use.', polarity: 'negative' },
  { id: 9, text: 'I felt very confident using the system.', polarity: 'positive' },
  { id: 10, text: 'I needed to learn a lot of things before I could get going with this system.', polarity: 'negative' },
]

type HumanEval = {
  id: number
  evaluatorName: string
  specialty: string
  affiliation: string
  yearsExperience: number
  susScore: number
  evaluatorType: string
  createdAt: string
}

function getSusGrade(score: number): { grade: string; adjective: string; color: string } {
  if (score >= 85) return { grade: 'A', adjective: 'Excellent', color: '#059669' }
  if (score >= 80) return { grade: 'A-', adjective: 'Good', color: '#059669' }
  if (score >= 72.5) return { grade: 'B', adjective: 'Good', color: '#0d9488' }
  if (score >= 65) return { grade: 'C', adjective: 'OK', color: '#d97706' }
  if (score >= 51) return { grade: 'D', adjective: 'Poor', color: '#dc2626' }
  return { grade: 'F', adjective: 'Awful', color: '#991b1b' }
}

export default function UsabilityTestingPage() {
  const [openSection, setOpenSection] = useState<number | null>(null)
  const [playingSection, setPlayingSection] = useState<number | null>(null)
  const [progress, setProgress] = useState<Record<number, number>>({})
  const [duration, setDuration] = useState<Record<number, number>>({})
  const audioRefs = useRef<Record<number, HTMLAudioElement>>({})

  // SUS Form state
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formSpecialty, setFormSpecialty] = useState('')
  const [formAffiliation, setFormAffiliation] = useState('')
  const [formExperience, setFormExperience] = useState('')
  const [formAnswers, setFormAnswers] = useState<Record<number, number>>({})
  const [formStrengths, setFormStrengths] = useState('')
  const [formWeaknesses, setFormWeaknesses] = useState('')
  const [formRecommendations, setFormRecommendations] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [formError, setFormError] = useState('')

  // Human evaluations
  const [humanEvals, setHumanEvals] = useState<HumanEval[]>([])
  const [loadingEvals, setLoadingEvals] = useState(true)

  const loadEvaluations = useCallback(async () => {
    try {
      const res = await fetch('/api/sus-evaluation')
      if (res.ok) {
        const data = await res.json()
        setHumanEvals(data.evaluations?.filter((e: HumanEval) => e.evaluatorType === 'human') ?? [])
      }
    } catch { /* ignore */ }
    setLoadingEvals(false)
  }, [])

  useEffect(() => { loadEvaluations() }, [loadEvaluations])

  useEffect(() => {
    const interval = setInterval(() => {
      if (playingSection !== null) {
        const audio = audioRefs.current[playingSection]
        if (audio) setProgress(prev => ({ ...prev, [playingSection]: audio.currentTime }))
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
      audio.addEventListener('loadedmetadata', () => setDuration(prev => ({ ...prev, [idx]: audio.duration })))
      audio.addEventListener('ended', () => setPlayingSection(null))
      audioRefs.current[idx] = audio
    }
    const audio = audioRefs.current[idx]
    if (playingSection === idx) { audio.pause(); setPlayingSection(null) }
    else { audio.play(); setPlayingSection(idx); setOpenSection(idx) }
  }

  const seekTo = (idx: number, e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRefs.current[idx]
    if (!audio || !duration[idx]) return
    const rect = e.currentTarget.getBoundingClientRect()
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration[idx]
    setProgress(prev => ({ ...prev, [idx]: audio.currentTime }))
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`

  const handleSubmitSus = async () => {
    if (!formName.trim() || !formSpecialty.trim() || !formAffiliation.trim()) {
      setFormError('Please fill in your name, specialty, and affiliation.')
      return
    }
    for (let i = 1; i <= 10; i++) {
      if (!formAnswers[i]) {
        setFormError(`Please answer question ${i}.`)
        return
      }
    }
    setFormError('')
    setFormSubmitting(true)
    try {
      const res = await fetch('/api/sus-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluatorName: formName.trim(),
          evaluatorEmail: formEmail.trim(),
          specialty: formSpecialty.trim(),
          affiliation: formAffiliation.trim(),
          yearsExperience: parseInt(formExperience) || 0,
          evaluatorType: 'human',
          q1: formAnswers[1], q2: formAnswers[2], q3: formAnswers[3], q4: formAnswers[4], q5: formAnswers[5],
          q6: formAnswers[6], q7: formAnswers[7], q8: formAnswers[8], q9: formAnswers[9], q10: formAnswers[10],
          qualitativeStrengths: formStrengths.trim(),
          qualitativeWeaknesses: formWeaknesses.trim(),
          qualitativeRecommendations: formRecommendations.trim(),
        }),
      })
      if (!res.ok) throw new Error('API error')
      setFormSuccess(true)
      loadEvaluations()
    } catch {
      setFormError('Failed to submit. Please try again.')
    }
    setFormSubmitting(false)
  }

  // Compute human stats
  const humanMean = humanEvals.length > 0
    ? humanEvals.reduce((a, e) => a + e.susScore, 0) / humanEvals.length
    : 0
  const humanSd = humanEvals.length > 1
    ? Math.sqrt(humanEvals.reduce((a, e) => a + (e.susScore - humanMean) ** 2, 0) / (humanEvals.length - 1))
    : 0

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
            System Usability Scale (SUS) evaluation of the micro-TESE CDSS — by AI agent experts and real human experts.
          </p>
        </div>
      </div>

      {/* Direct Access to CDSS */}
      <Link href="/cdss" className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 hover:bg-emerald-500/10 transition-colors group">
        <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0"><ExternalLink className="h-5 w-5" /></div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Try the CDSS Panel</p>
          <p className="text-xs text-muted-foreground">Open the micro-TESE Clinical Decision Support System — evaluate it, then come back to fill the SUS form</p>
        </div>
        <ExternalLink className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>

      {/* ══════ SECTION 1: AI Agent Expert Results ══════ */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
          <Award className="h-5 w-5 text-purple-500" />
          AI Agent Expert Evaluation
          <span className="text-xs font-normal text-muted-foreground ml-2">5 virtual expert agents</span>
        </h2>

        {/* Score cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border bg-card p-4 text-center">
            <BarChart3 className="h-5 w-5 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{AGENT_MEAN}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Mean SUS Score</p>
            <p className="text-[9px] text-muted-foreground">SD ±{AGENT_SD}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <Star className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-600">B</p>
            <p className="text-[10px] text-muted-foreground mt-1">Letter Grade</p>
            <p className="text-[9px] text-muted-foreground">Good — Acceptable</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <Users className="h-5 w-5 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">5</p>
            <p className="text-[10px] text-muted-foreground mt-1">Agent Evaluators</p>
            <p className="text-[9px] text-muted-foreground">Medical Informatics & Health Informatics</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">0.783</p>
            <p className="text-[10px] text-muted-foreground mt-1">Cronbach&apos;s α</p>
            <p className="text-[9px] text-muted-foreground">Acceptable to Good</p>
          </div>
        </div>

        {/* Agent Expert Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-purple-50/50 dark:bg-purple-950/20">
                  <th className="px-4 py-2 text-left font-medium">Expert (Agent)</th>
                  <th className="px-4 py-2 text-left font-medium">Specialty</th>
                  <th className="px-4 py-2 text-left font-medium">Affiliation</th>
                  <th className="px-4 py-2 text-center font-medium">SUS Score</th>
                  <th className="px-4 py-2 text-center font-medium">Grade</th>
                </tr>
              </thead>
              <tbody>
                {AGENT_EXPERTS.map((expert) => (
                  <tr key={expert.id} className="border-b last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-2.5 font-medium">{expert.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{expert.specialty}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{expert.affiliation}</td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${expert.score}%`, backgroundColor: expert.score >= 80 ? '#059669' : expert.score >= 70 ? '#d97706' : '#dc2626' }} />
                        </div>
                        <span className="font-mono font-semibold text-xs">{expert.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono font-bold text-xs">{expert.grade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Strength Themes</h3>
            <ul className="space-y-2">{STRENGTHS.map((s, i) => (<li key={i} className="flex items-start gap-2 text-xs text-foreground/80"><span className="text-emerald-500 mt-0.5">✓</span>{s}</li>))}</ul>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><AlertTriangle className="h-4 w-4 text-amber-500" />Improvement Areas</h3>
            <ul className="space-y-2">{WEAKNESSES.map((w, i) => (<li key={i} className="flex items-start gap-2 text-xs text-foreground/80"><span className="text-amber-500 mt-0.5">⚠</span>{w}</li>))}</ul>
          </div>
        </div>
      </div>

      {/* ══════ SECTION 2: Real Human Expert Evaluation ══════ */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
          <Users className="h-5 w-5 text-emerald-600" />
          Real Human Expert Evaluation
          <span className="text-xs font-normal text-muted-foreground ml-2">{humanEvals.length} evaluation{humanEvals.length !== 1 ? 's' : ''} submitted</span>
        </h2>

        {/* Human Score Summary */}
        {humanEvals.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border bg-card p-4 text-center">
              <BarChart3 className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald-600">{humanMean.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Mean SUS Score</p>
              {humanEvals.length > 1 && <p className="text-[9px] text-muted-foreground">SD ±{humanSd.toFixed(2)}</p>}
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <Star className="h-5 w-5 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-600">{getSusGrade(humanMean).grade}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Letter Grade</p>
              <p className="text-[9px] text-muted-foreground">{getSusGrade(humanMean).adjective}</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <Users className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald-600">{humanEvals.length}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Human Evaluators</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <BarChart3 className="h-5 w-5 text-blue-500 mx-auto mb-2" />
              <p className={`text-2xl font-bold ${humanMean >= AGENT_MEAN ? 'text-emerald-600' : 'text-amber-600'}`}>
                {humanMean >= AGENT_MEAN ? '+' : ''}{(humanMean - AGENT_MEAN).toFixed(1)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">vs Agent Experts</p>
              <p className="text-[9px] text-muted-foreground">Agent mean: {AGENT_MEAN}</p>
            </div>
          </div>
        )}

        {/* Human Expert Table */}
        {humanEvals.length > 0 && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-emerald-50/50 dark:bg-emerald-950/20">
                    <th className="px-4 py-2 text-left font-medium">Expert (Human)</th>
                    <th className="px-4 py-2 text-left font-medium">Specialty</th>
                    <th className="px-4 py-2 text-left font-medium">Affiliation</th>
                    <th className="px-4 py-2 text-center font-medium">SUS Score</th>
                    <th className="px-4 py-2 text-center font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {humanEvals.map((ev) => {
                    const g = getSusGrade(ev.susScore)
                    return (
                      <tr key={ev.id} className="border-b last:border-0 hover:bg-muted/10">
                        <td className="px-4 py-2.5 font-medium">{ev.evaluatorName}</td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{ev.specialty}</td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">{ev.affiliation}</td>
                        <td className="px-4 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${ev.susScore}%`, backgroundColor: g.color }} />
                            </div>
                            <span className="font-mono font-semibold text-xs">{ev.susScore.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono font-bold text-xs">{g.grade}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Comparison Card */}
        {humanEvals.length > 0 && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Agent vs Human Expert Comparison
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-600 font-medium">AI Agent Experts (n={AGENT_EXPERTS.length})</span>
                  <span className="font-mono font-bold">{AGENT_MEAN} ±{AGENT_SD}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${AGENT_MEAN}%` }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-600 font-medium">Human Experts (n={humanEvals.length})</span>
                  <span className="font-mono font-bold">{humanMean.toFixed(1)} {humanEvals.length > 1 ? `±${humanSd.toFixed(2)}` : ''}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${humanMean}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {loadingEvals && <p className="text-sm text-muted-foreground text-center py-4">Loading evaluations...</p>}
        {!loadingEvals && humanEvals.length === 0 && !showForm && (
          <div className="rounded-xl border border-dashed border-muted-foreground/30 p-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No human expert evaluations submitted yet. Be the first to evaluate the CDSS!</p>
          </div>
        )}

        {/* CTA Button */}
        {!showForm && !formSuccess && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl border-2 border-dashed border-emerald-500/50 bg-emerald-500/5 p-4 w-full hover:bg-emerald-500/10 transition-colors text-left">
            <UserPlus className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Submit Your SUS Evaluation</p>
              <p className="text-xs text-muted-foreground">First try the CDSS, then fill the standard 10-item SUS questionnaire</p>
            </div>
          </button>
        )}

        {/* SUS Form */}
        {showForm && !formSuccess && (
          <div id="sus-form" className="rounded-xl border bg-card p-6 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              SUS Evaluation Form
            </h3>

            {/* Personal Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium block mb-1">Full Name *</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Dr. Jane Smith" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Email</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="jane@university.edu" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Specialty *</label>
                <input type="text" value={formSpecialty} onChange={e => setFormSpecialty(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. Urology, Medical Informatics" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Affiliation *</label>
                <input type="text" value={formAffiliation} onChange={e => setFormAffiliation(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. University Hospital" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Years of Experience</label>
                <input type="number" value={formExperience} onChange={e => setFormExperience(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="15" />
              </div>
            </div>

            {/* SUS Questions */}
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree):</p>
              {SUS_QUESTIONS.map(q => (
                <div key={q.id} className="rounded-lg border p-4 space-y-2">
                  <p className="text-sm"><span className="font-mono font-bold text-emerald-600 mr-2">Q{q.id}.</span>{q.text}</p>
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] text-muted-foreground w-20">Strongly Disagree</span>
                    {[1, 2, 3, 4, 5].map(v => (
                      <button key={v} onClick={() => setFormAnswers(prev => ({ ...prev, [q.id]: v }))} className={`h-9 w-9 rounded-full border-2 text-sm font-bold transition-all ${
                        formAnswers[q.id] === v
                          ? 'bg-emerald-600 text-white border-emerald-600 scale-110'
                          : 'border-muted-foreground/30 hover:border-emerald-500'
                      }`}>
                        {v}
                      </button>
                    ))}
                    <span className="text-[10px] text-muted-foreground w-16">Strongly Agree</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Qualitative */}
            <div className="space-y-3">
              <p className="text-xs font-medium">Qualitative Feedback (Optional)</p>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Strengths</label>
                <textarea value={formStrengths} onChange={e => setFormStrengths(e.target.value)} rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="What did you like most about the system?" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Weaknesses</label>
                <textarea value={formWeaknesses} onChange={e => setFormWeaknesses(e.target.value)} rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="What could be improved?" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Recommendations</label>
                <textarea value={formRecommendations} onChange={e => setFormRecommendations(e.target.value)} rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Any suggestions for future development?" />
              </div>
            </div>

            {formError && <p className="text-sm text-red-500">{formError}</p>}

            <button onClick={handleSubmitSus} disabled={formSubmitting} className="flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-6 py-3 font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50">
              <Send className="h-4 w-4" />
              {formSubmitting ? 'Submitting...' : 'Submit SUS Evaluation'}
            </button>
          </div>
        )}

        {/* Success Message */}
        {formSuccess && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Thank you for your evaluation!</p>
            <p className="text-sm text-muted-foreground mt-1">Your SUS score has been recorded and added to the comparison.</p>
          </div>
        )}
      </div>

      {/* ══════ SECTION 3: Podcast ══════ */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-2">
          <Headphones className="h-5 w-5 text-emerald-600" />
          Usability Evaluation Podcast
        </h2>

        {/* Intro banner */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">Podcast Introduction</p>
          <p className="text-sm text-foreground/80 italic">&ldquo;{podcastData.intro}&rdquo;</p>
        </div>

        {podcastData.sections.map((section, idx) => {
          const isOpen = openSection === idx
          const isPlaying = playingSection === idx
          const prog = progress[idx] || 0
          const dur = duration[idx] || 0
          const pct = dur > 0 ? (prog / dur) * 100 : 0

          return (
            <div key={idx} className={`rounded-xl border shadow-sm overflow-hidden transition-all ${isPlaying ? 'border-emerald-500/40 bg-emerald-500/[0.02] ring-1 ring-emerald-500/20' : 'bg-card'}`}>
              <div className="flex items-center">
                <button onClick={() => togglePlay(idx)} className={`flex items-center justify-center w-14 h-14 shrink-0 transition-colors ${isPlaying ? 'bg-emerald-600 text-white' : 'bg-muted/30 text-emerald-600 hover:bg-emerald-500/10'}`}>
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Headphones className="h-5 w-5" />}
                </button>
                <button onClick={() => setOpenSection(isOpen ? null : idx)} className="flex-1 flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-mono font-semibold text-white shrink-0">{idx + 1}</span>
                    <div>
                      <span className="font-display font-semibold text-sm">{section.title}</span>
                      {isPlaying && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Volume2 className="h-3 w-3 text-emerald-600 animate-pulse" />
                          <span className="text-[10px] text-emerald-600 font-mono">{formatTime(prog)} / {formatTime(dur)}</span>
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
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color }}>{isAlex ? 'A' : 'S'}</div>
                          <span className="text-[9px] text-muted-foreground font-mono">{line.speaker.split(' ')[1]}</span>
                        </div>
                        <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed max-w-[85%] ${isAlex ? 'bg-muted/50 rounded-tl-none' : 'bg-emerald-500/5 rounded-tr-none'}`}>{line.text}</div>
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
        <p>6 sections · {podcastData.sections.reduce((a, s) => a + s.lines.length, 0)} dialogue exchanges · English audio</p>
        <p className="italic">This media is generated from this investigation with Hossein Jamalirad&apos;s Architecture&apos;s agent.</p>
      </div>
    </div>
  )
}
