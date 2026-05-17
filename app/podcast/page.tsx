'use client'

import { useState, useRef, useEffect } from 'react'
import BreadcrumbNav from '@/components/breadcrumb-nav'
import { Mic, ChevronDown, ChevronUp, Headphones, Play, Pause, Volume2 } from 'lucide-react'
import podcastData from '@/data/content/podcast_data.json'
import AIAssistWrapper from '@/components/ai-assist-wrapper'

const HOST_COLORS: Record<string, string> = {
  'Dr. Alex': '#0e7490',
  'Dr. Sarah': '#7c3aed',
}

export default function PodcastPage() {
  const [openSection, setOpenSection] = useState<number | null>(0)
  const [playingSection, setPlayingSection] = useState<number | null>(null)
  const [progress, setProgress] = useState<Record<number, number>>({})
  const [duration, setDuration] = useState<Record<number, number>>({})
  const audioRefs = useRef<Record<number, HTMLAudioElement>>({})

  // Keep progress updated
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
    // Pause any currently playing
    if (playingSection !== null && playingSection !== idx) {
      const prev = audioRefs.current[playingSection]
      if (prev) prev.pause()
    }

    if (!audioRefs.current[idx]) {
      const audio = new Audio(`/audio/podcast_section_${idx + 1}.mp3`)
      audio.addEventListener('loadedmetadata', () => {
        setDuration(prev => ({ ...prev, [idx]: audio.duration }))
      })
      audio.addEventListener('ended', () => {
        setPlayingSection(null)
      })
      audioRefs.current[idx] = audio
    }

    const audio = audioRefs.current[idx]
    if (playingSection === idx) {
      audio.pause()
      setPlayingSection(null)
    } else {
      audio.play()
      setPlayingSection(idx)
      // Auto-open the section
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
      <BreadcrumbNav items={[{ label: 'Research Podcast' }]} />

      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-md bg-primary text-white flex items-center justify-center shadow-md shrink-0">
          <Mic className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight">Research Podcast</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Expert dialogue between Dr. Alex and Dr. Sarah — two AI-trained agents covering every aspect of this NOA study.
            Click the <Headphones className="inline h-3.5 w-3.5 text-primary" /> icon on any section to listen.
          </p>
        </div>
      </div>

      {/* Intro banner */}
      <AIAssistWrapper id="podcast-intro">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-sm font-medium text-primary mb-1">Agent Introduction</p>
          <p className="text-sm text-foreground/80 italic">
            &ldquo;{podcastData.intro}&rdquo;
          </p>
        </div>
      </AIAssistWrapper>

      {/* Sections */}
      <AIAssistWrapper id="podcast-sections">
      <div className="space-y-3">
        {podcastData.sections.map((section, idx) => {
          const isOpen = openSection === idx
          const isPlaying = playingSection === idx
          const prog = progress[idx] || 0
          const dur = duration[idx] || 0
          const pct = dur > 0 ? (prog / dur) * 100 : 0

          return (
            <div key={idx} className={`rounded-xl border shadow-sm overflow-hidden transition-all ${
              isPlaying ? 'border-primary/40 bg-primary/[0.02] ring-1 ring-primary/20' : 'bg-card'
            }`}>
              <div className="flex items-center">
                {/* Play button */}
                <button
                  onClick={() => togglePlay(idx)}
                  className={`flex items-center justify-center w-14 h-14 shrink-0 transition-colors ${
                    isPlaying
                      ? 'bg-primary text-white'
                      : 'bg-muted/30 text-primary hover:bg-primary/10'
                  }`}
                  title={isPlaying ? 'Pause' : 'Listen to this section'}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Headphones className="h-5 w-5" />
                  )}
                </button>

                {/* Section header */}
                <button
                  onClick={() => setOpenSection(isOpen ? null : idx)}
                  className="flex-1 flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-mono font-semibold text-white shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-display font-semibold text-sm">{section.title}</span>
                      {isPlaying && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Volume2 className="h-3 w-3 text-primary animate-pulse" />
                          <span className="text-[10px] text-primary font-mono">
                            {formatTime(prog)} / {formatTime(dur)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>

              {/* Progress bar */}
              {(isPlaying || prog > 0) && (
                <div
                  className="h-1 bg-muted/30 cursor-pointer"
                  onClick={(e) => seekTo(idx, e)}
                >
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${pct}%` }}
                  />
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
                            isAlex
                              ? 'bg-muted/50 rounded-tl-none'
                              : 'bg-primary/5 rounded-tr-none'
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
      </AIAssistWrapper>

      {/* Footer */}
      <div className="text-xs text-muted-foreground text-center py-4 space-y-1">
        <p>8 sections &bull; {podcastData.sections.reduce((a, s) => a + s.lines.length, 0)} dialogue exchanges &bull; English audio with male &amp; female voices</p>
        <p className="italic">This media is generated from this investigation with Hossein Jamalirad&apos;s Architecture&apos;s agent.</p>
      </div>
    </div>
  )
}
