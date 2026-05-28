'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

/* ────────────────────────────────────────────────────────────────────────────
 *  PhD Journey Splash Screen
 *  ~9s animated intro: 8 milestones + running cartoon professional + credits
 * ──────────────────────────────────────────────────────────────────────────── */

const STATIONS = [
  { x: 5,     title: 'Data\nCleaning' },
  { x: 17.86, title: 'Feature\nEngineering' },
  { x: 30.71, title: 'Model\nTraining' },
  { x: 43.57, title: 'Model\nEvaluation' },
  { x: 56.43, title: 'XAI / SHAP\nAnalysis' },
  { x: 69.29, title: 'CDSS\nDevelopment' },
  { x: 82.14, title: 'Virtual\nDefense' },
  { x: 95,    title: 'PhD\nDissertation' },
] as const

// Per-station accent colours for the icon halos
const STATION_COLORS = [
  '#06b6d4', // cyan - data cleaning
  '#0ea5e9', // sky
  '#14b8a6', // teal
  '#22c55e', // green
  '#eab308', // amber - XAI
  '#f97316', // orange
  '#a855f7', // purple
  '#facc15', // gold - PhD
]

/* CSS keyframes – injected once via <style> */
const keyframes = `
@keyframes splash-fadeIn { from { opacity:0 } to { opacity:1 } }
@keyframes splash-fadeOut { from { opacity:1 } to { opacity:0 } }
@keyframes splash-fadeInUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
@keyframes splash-fadeInDown { from { opacity:0; transform:translateY(-20px) } to { opacity:1; transform:translateY(0) } }
@keyframes splash-popIn { 0% { opacity:0; transform:scale(0.4) } 70% { transform:scale(1.15) } 100% { opacity:1; transform:scale(1) } }

@keyframes splash-runPath {
  0%      { left: 5% }
  9.17%   { left: 17.86% }
  14.17%  { left: 17.86% }
  23.33%  { left: 30.71% }
  28.33%  { left: 30.71% }
  37.50%  { left: 43.57% }
  42.50%  { left: 43.57% }
  51.67%  { left: 56.43% }
  56.67%  { left: 56.43% }
  65.83%  { left: 69.29% }
  70.83%  { left: 69.29% }
  80.00%  { left: 82.14% }
  85.00%  { left: 82.14% }
  94.17%  { left: 95% }
  100%    { left: 95% }
}

@keyframes splash-progressFill {
  0%      { width: 0% }
  9.17%   { width: 12.86% }
  14.17%  { width: 12.86% }
  23.33%  { width: 25.71% }
  28.33%  { width: 25.71% }
  37.50%  { width: 38.57% }
  42.50%  { width: 38.57% }
  51.67%  { width: 51.43% }
  56.67%  { width: 51.43% }
  65.83%  { width: 64.29% }
  70.83%  { width: 64.29% }
  80.00%  { width: 77.14% }
  85.00%  { width: 77.14% }
  94.17%  { width: 90% }
  100%    { width: 90% }
}

@keyframes splash-stationLight {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); transform: scale(1) }
  50%      { box-shadow: 0 0 24px 6px var(--c, #06b6d4); transform: scale(1.18) }
}

@keyframes splash-legSwingA {
  0%, 100% { transform: rotate(-32deg) }
  50%      { transform: rotate(32deg) }
}
@keyframes splash-legSwingB {
  0%, 100% { transform: rotate(32deg) }
  50%      { transform: rotate(-32deg) }
}
@keyframes splash-armSwingA {
  0%, 100% { transform: rotate(30deg) }
  50%      { transform: rotate(-40deg) }
}
@keyframes splash-armSwingB {
  0%, 100% { transform: rotate(-40deg) }
  50%      { transform: rotate(30deg) }
}
@keyframes splash-bodyBob {
  0%, 100% { transform: translateY(0) }
  50%      { transform: translateY(-2px) }
}

@keyframes splash-finishGlow {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(250, 204, 21, 0.6)) }
  50%      { filter: drop-shadow(0 0 22px rgba(250, 204, 21, 1)) }
}

@keyframes splash-starBurst {
  0%   { opacity: 0; transform: scale(0) rotate(0deg) }
  60%  { opacity: 1; transform: scale(1.3) rotate(180deg) }
  100% { opacity: 0; transform: scale(2) rotate(360deg) }
}

@keyframes splash-particleDrift {
  0%   { transform: translateY(0) translateX(0); opacity: 0.6 }
  100% { transform: translateY(-30px) translateX(10px); opacity: 0 }
}
`

export default function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [showFinishBurst, setShowFinishBurst] = useState(false)
  const [showCredit, setShowCredit] = useState(false)

  useEffect(() => {
    // Total ~9.6s lifecycle
    const burstTimer  = setTimeout(() => setShowFinishBurst(true), 7000)
    const creditTimer = setTimeout(() => setShowCredit(true),      7200)
    const fadeTimer   = setTimeout(() => setFadeOut(true),         8800)
    const hideTimer   = setTimeout(() => setVisible(false),        9600)
    return () => {
      clearTimeout(burstTimer)
      clearTimeout(creditTimer)
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden transition-opacity duration-700 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background:
          'radial-gradient(ellipse at top, #0b1735 0%, #050a1c 55%, #02050f 100%)',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />

      {/* Subtle drifting particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => {
          const left = (i * 37) % 100
          const top  = (i * 53) % 100
          const dur  = 4 + (i % 5)
          const delay = (i % 7) * 0.6
          return (
            <span
              key={i}
              className="absolute rounded-full bg-cyan-300/40"
              style={{
                width: 2 + (i % 3),
                height: 2 + (i % 3),
                left: `${left}%`,
                top: `${top}%`,
                animation: `splash-particleDrift ${dur}s ease-in-out ${delay}s infinite`,
              }}
            />
          )
        })}
      </div>

      {/* Main vertical layout */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-between px-6 py-6 sm:py-10">

        {/* ─── Top: Presentation title ─── */}
        <div className="text-center max-w-3xl" style={{ animation: 'splash-fadeInDown 1.1s ease 0.2s both' }}>
          <p className="text-[10px] sm:text-xs tracking-[0.45em] uppercase text-cyan-300/70 mb-2">
            A&nbsp;Presentation&nbsp;by
          </p>
          <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold leading-tight">
            <span className="bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent">
              Medical Informatics Group
            </span>
            <br className="hidden sm:block" />
            <span className="text-white/90 text-base sm:text-xl md:text-2xl font-light">
              of the&nbsp;Mashhad University of Medical Sciences
            </span>
          </h1>

          {/* Credit fades in at end */}
          <div
            className="mt-3 text-cyan-100/90 text-sm sm:text-base font-light min-h-[1.5em]"
            style={{
              opacity: showCredit ? 1 : 0,
              transform: showCredit ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 1s ease, transform 1s ease',
            }}
          >
            by&nbsp;<span className="font-medium text-white">Hossein Jamalirad</span>
            <span className="hidden sm:inline">&nbsp;·&nbsp;</span>
            <span className="block sm:inline text-cyan-200/80 text-xs sm:text-sm">
              PhD&nbsp;Candidate&nbsp;in&nbsp;Medical&nbsp;Informatics
            </span>
          </div>
        </div>

        {/* ─── Center: Milestone path ─── */}
        <div className="w-full max-w-6xl relative" style={{ animation: 'splash-fadeIn 0.9s ease 0.6s both' }}>
          {/* Path / progress line */}
          <div className="relative mx-auto" style={{ height: 140 }}>
            {/* Background track */}
            <div
              className="absolute"
              style={{
                left: '5%',
                right: '5%',
                top: 32,
                height: 4,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.18), rgba(255,255,255,0.05))',
                borderRadius: 4,
              }}
            />
            {/* Animated progress fill */}
            <div
              className="absolute"
              style={{
                left: '5%',
                top: 32,
                height: 4,
                borderRadius: 4,
                background: 'linear-gradient(90deg, #06b6d4, #14b8a6, #22c55e, #eab308, #f97316, #a855f7, #facc15)',
                boxShadow: '0 0 18px rgba(6,182,212,0.55)',
                animation: 'splash-progressFill 6s cubic-bezier(0.65,0,0.35,1) 1s forwards',
                width: 0,
              }}
            />

            {/* Stations */}
            {STATIONS.map((s, idx) => {
              const color = STATION_COLORS[idx]
              // Each station "lights up" when char arrives (delay = station-arrival time)
              // run starts at 1s; station arrival times in seconds (run starts):
              const arrivalTimes = [0, 0.55, 1.40, 2.25, 3.10, 3.95, 4.80, 5.65]
              const lightDelay = 1 + arrivalTimes[idx]
              return (
                <div
                  key={s.title}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${s.x}%`,
                    transform: 'translateX(-50%)',
                    top: 0,
                  }}
                >
                  {/* Icon disc */}
                  <div
                    className="relative flex items-center justify-center rounded-full"
                    style={{
                      width: 44,
                      height: 44,
                      background: 'rgba(15,23,42,0.85)',
                      border: `2px solid ${color}`,
                      animation: `splash-stationLight 0.9s ease ${lightDelay}s 1 forwards`,
                      // CSS var consumed by keyframe
                      ['--c' as any]: color,
                    }}
                  >
                    <MilestoneIcon index={idx} color={color} />
                  </div>
                  {/* Title */}
                  <div
                    className="text-center mt-2 leading-tight font-medium"
                    style={{
                      width: 84,
                      whiteSpace: 'pre-line',
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.92)',
                      textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                    }}
                  >
                    {s.title}
                  </div>
                </div>
              )
            })}

            {/* Final-station celebration burst */}
            {showFinishBurst && (
              <div
                className="absolute pointer-events-none"
                style={{ left: '95%', top: 32, transform: 'translate(-50%, -50%)' }}
              >
                <StarBurst />
              </div>
            )}

            {/* Running character — translateX is animated via left%, then translateX(-50%) centers it */}
            <div
              className="absolute"
              style={{
                top: -52,
                left: '5%',
                transform: 'translateX(-50%)',
                animation: 'splash-runPath 6s cubic-bezier(0.65,0,0.35,1) 1s forwards',
                width: 70,
                height: 96,
              }}
            >
              <RunningCharacter />
            </div>
          </div>
        </div>

        {/* ─── University logos ─── */}
        <div
          className="flex items-center justify-center gap-5 sm:gap-9"
          style={{ animation: 'splash-fadeInUp 0.8s ease 0.9s both' }}
        >
          {[
            { src: '/logos/mums.jpeg', label: 'Mashhad University of Medical Sciences' },
            { src: '/logos/royan.png', label: 'Royan Institute' },
            { src: '/logos/medical-informatics.jpeg', label: 'Medical Informatics Department' },
          ].map((logo) => (
            <div key={logo.label} className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/25 p-1 flex items-center justify-center shadow-lg shadow-black/40">
                <Image
                  src={logo.src}
                  alt={logo.label}
                  width={56}
                  height={56}
                  className="rounded-full object-cover w-full h-full"
                />
              </div>
              <span
                className="text-center leading-tight"
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.85)',
                  maxWidth: 110,
                  display: 'block',
                  textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                }}
              >
                {logo.label}
              </span>
            </div>
          ))}
        </div>

        {/* ─── Contact section ─── */}
        <div
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-7 text-white/85"
          style={{ animation: 'splash-fadeInUp 0.8s ease 1.2s both' }}
        >
          <ContactPill icon={<TelegramIcon />} label="@hradit" color="#229ED9" />
          <ContactPill icon={<EmailIcon />}    label="h.rad.it@gmail.com" color="#EA4335" />
          <ContactPill icon={<WhatsAppIcon />} label="+98 912 22 44 227" color="#25D366" />
        </div>
      </div>
    </div>
  )
}

/* ─────────────── Sub-components ─────────────── */

function ContactPill({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div
      className="flex items-center rounded-full backdrop-blur-sm"
      style={{
        gap: 8,
        padding: '6px 14px',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.18)',
      }}
    >
      <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </span>
      <span
        style={{
          fontSize: 12,
          letterSpacing: '0.02em',
          fontWeight: 500,
          color: 'rgba(255,255,255,0.95)',
        }}
      >
        {label}
      </span>
    </div>
  )
}

function MilestoneIcon({ index, color }: { index: number; color: string }) {
  const stroke = color
  const props = { fill: 'none', stroke, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (index) {
    case 0: // Data Cleaning – sparkling table
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" {...props}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <path d="M9 5v14" />
          <path d="M16 14l1.5 1.5L19 14l-1.5 1.5L19 17l-1.5-1.5L16 17l1.5-1.5z" />
        </svg>
      )
    case 1: // Feature Engineering – gears
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" />
        </svg>
      )
    case 2: // Model Training – brain
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" {...props}>
          <path d="M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 003 3V4z" />
          <path d="M15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-3 3V4z" />
          <path d="M9 8h6M9 12h6M9 16h6" />
        </svg>
      )
    case 3: // Model Evaluation – target with chart
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" {...props}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill={stroke} />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        </svg>
      )
    case 4: // XAI/SHAP – lightbulb with bars
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" {...props}>
          <path d="M9 18h6" />
          <path d="M10 21h4" />
          <path d="M12 3a6 6 0 00-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0012 3z" />
          <path d="M10 9l1.5 2L13 8.5" strokeWidth="1.4" />
        </svg>
      )
    case 5: // CDSS – stethoscope
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" {...props}>
          <path d="M5 3v6a4 4 0 008 0V3" />
          <path d="M9 13a3 3 0 003 3v2a4 4 0 004 4 4 4 0 004-4v-3" />
          <circle cx="20" cy="11" r="2" />
        </svg>
      )
    case 6: // Virtual Defense – podium / video
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" {...props}>
          <rect x="3" y="5" width="14" height="10" rx="1.5" />
          <path d="M17 9l4-2v8l-4-2z" />
          <path d="M7 19h6M10 15v4" />
        </svg>
      )
    case 7: // PhD Dissertation – graduation cap
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" {...props}>
          <path d="M2 9l10-5 10 5-10 5z" />
          <path d="M6 11v4c2 1.5 4 2 6 2s4-.5 6-2v-4" />
          <path d="M22 9v6" />
        </svg>
      )
  }
}

/* ─────────────── Brand-style contact icons ─────────────── */

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.464.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="4.5" width="19" height="15" rx="2"/>
      <path d="M3 6l9 7 9-7"/>
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.413c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.887-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.107zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414z"/>
    </svg>
  )
}

function StarBurst() {
  return (
    <svg viewBox="0 0 100 100" width="120" height="120"
         style={{ animation: 'splash-starBurst 1.4s ease-out forwards', filter: 'drop-shadow(0 0 12px rgba(250,204,21,0.9))' }}>
      {[0, 30, 60, 90, 120, 150].map((rot) => (
        <g key={rot} transform={`rotate(${rot} 50 50)`}>
          <path d="M50 18 L52 46 L80 50 L52 54 L50 82 L48 54 L20 50 L48 46 Z" fill="#facc15" opacity="0.85" />
        </g>
      ))}
      <circle cx="50" cy="50" r="6" fill="#fde68a" />
    </svg>
  )
}

/* ─────────────── Running cartoon character ─────────────── */
/* Detailed inline SVG: clean-shaven young man in dark suit, dark hair pushed back,
   warm skin tone, white shirt, maroon tie, polished shoes; arms + legs swing in
   alternating rotation to suggest a smooth running cycle. */

function RunningCharacter() {
  // Use unique animation timings per limb side
  const legA: React.CSSProperties = { transformOrigin: '30px 50px', animation: 'splash-legSwingA 0.42s linear infinite' }
  const legB: React.CSSProperties = { transformOrigin: '30px 50px', animation: 'splash-legSwingB 0.42s linear infinite' }
  const armA: React.CSSProperties = { transformOrigin: '13px 32px', animation: 'splash-armSwingA 0.42s linear infinite' }
  const armB: React.CSSProperties = { transformOrigin: '47px 32px', animation: 'splash-armSwingB 0.42s linear infinite' }
  const bodyBob: React.CSSProperties = { transformOrigin: 'center', animation: 'splash-bodyBob 0.42s linear infinite' }

  // skin / hair / suit palette
  const skin    = '#e7c6a3'
  const skinSh  = '#c89a73'
  const hair    = '#1a120c'
  const hairHi  = '#2c2018'
  const suit    = '#1c2740'
  const suitSh  = '#0e1530'
  const shirt   = '#f8fafc'
  const tie     = '#9c1e3a'
  const shoes   = '#0a0a0a'

  return (
    <svg viewBox="0 0 60 90" width="100%" height="100%"
         xmlns="http://www.w3.org/2000/svg"
         style={{ overflow: 'visible' }}>
      {/* drop-shadow on ground */}
      <ellipse cx="30" cy="87" rx="15" ry="2.2" fill="#000" opacity="0.35" />

      {/* ────── LEGS (rotate from hip = 30,50) ────── */}
      <g style={legB}>
        {/* upper leg */}
        <rect x="27" y="50" width="6.4" height="18" rx="2.6" fill={suit} />
        {/* knee/lower leg */}
        <rect x="27.4" y="64" width="5.6" height="13" rx="2.4" fill={suitSh} />
        {/* shoe */}
        <ellipse cx="30" cy="79" rx="5.2" ry="2.4" fill={shoes} />
        <path d="M25 78.5 Q30 75.5 35 78.5" stroke="#1a1a1a" strokeWidth="0.6" fill="none" />
      </g>
      <g style={legA}>
        <rect x="27" y="50" width="6.4" height="18" rx="2.6" fill={suit} />
        <rect x="27.4" y="64" width="5.6" height="13" rx="2.4" fill={suitSh} />
        <ellipse cx="30" cy="79" rx="5.2" ry="2.4" fill={shoes} />
        <path d="M25 78.5 Q30 75.5 35 78.5" stroke="#1a1a1a" strokeWidth="0.6" fill="none" />
      </g>

      {/* ────── BODY (bob) ────── */}
      <g style={bodyBob}>

        {/* Suit jacket – torso */}
        <path
          d="M14 32
             Q14 30 16 30
             L20 28
             Q22 26 26 26
             L34 26
             Q38 26 40 28
             L44 30
             Q46 30 46 32
             L48 52
             Q48 54 46 54
             L14 54
             Q12 54 12 52 Z"
          fill={suit}
        />
        {/* Jacket shading */}
        <path d="M14 32 L18 30 L18 54 L14 54 Z" fill={suitSh} opacity="0.7" />
        <path d="M46 32 L42 30 L42 54 L46 54 Z" fill={suitSh} opacity="0.7" />

        {/* Shirt V-opening */}
        <path d="M24 28 L30 38 L36 28 L34 44 L26 44 Z" fill={shirt} />

        {/* Lapels */}
        <path d="M24 28 L30 38 L26 44 L22 32 Z" fill={suitSh} />
        <path d="M36 28 L30 38 L34 44 L38 32 Z" fill={suitSh} />

        {/* Tie */}
        <path d="M28.5 30 L31.5 30 L33 33 L30 36 L27 33 Z" fill={tie} />
        <path d="M28 36 L32 36 L33 50 L30 53 L27 50 Z" fill={tie} />
        <path d="M30 36 L31 50 L30 53 Z" fill="#7a1530" opacity="0.6" />

        {/* Belt hint */}
        <rect x="20" y="51" width="20" height="2" fill="#0a0e1a" />

        {/* Buttons */}
        <circle cx="30" cy="42" r="0.7" fill="#0a0a0a" />
        <circle cx="30" cy="47" r="0.7" fill="#0a0a0a" />

        {/* ─── BACK ARM (behind body) ─── */}
        <g style={armA}>
          {/* upper arm */}
          <rect x="10" y="30" width="6" height="14" rx="2.6" fill={suitSh} />
          {/* forearm */}
          <rect x="10.5" y="42" width="5" height="13" rx="2.3" fill={suit} />
          {/* cuff */}
          <rect x="10.5" y="53" width="5" height="1.4" fill={shirt} />
          {/* hand */}
          <circle cx="13" cy="57" r="2.6" fill={skin} />
          <path d="M11 57 Q13 60 15 57" stroke={skinSh} strokeWidth="0.4" fill="none" />
        </g>

        {/* ─── FRONT ARM ─── */}
        <g style={armB}>
          <rect x="44" y="30" width="6" height="14" rx="2.6" fill={suit} />
          <rect x="44.5" y="42" width="5" height="13" rx="2.3" fill={suitSh} />
          <rect x="44.5" y="53" width="5" height="1.4" fill={shirt} />
          <circle cx="47" cy="57" r="2.6" fill={skin} />
          <path d="M45 57 Q47 60 49 57" stroke={skinSh} strokeWidth="0.4" fill="none" />
        </g>

        {/* ─── NECK ─── */}
        <rect x="26.5" y="22" width="7" height="6" rx="1.5" fill={skin} />
        <rect x="26.5" y="26" width="7" height="2" fill={skinSh} opacity="0.6" />

        {/* ─── HEAD ─── */}
        {/* Skull base */}
        <ellipse cx="30" cy="14" rx="9.2" ry="11" fill={skin} />
        {/* Jawline shadow */}
        <path d="M21.5 16 Q22 22 30 24 Q38 22 38.5 16 Q35 23 30 23 Q25 23 21.5 16 Z" fill={skinSh} opacity="0.35" />

        {/* Hair – swept back / slight receding hairline (matches portrait) */}
        <path
          d="M21 11
             Q21 3 30 3
             Q39 3 39 11
             Q39 7.5 35 7
             Q33 8.2 30 8.2
             Q27 8.2 25 7
             Q21 7.5 21 11 Z"
          fill={hair}
        />
        {/* Hair side wisps */}
        <path d="M21 11 Q21.5 14 23 15.5 L23 12 Z" fill={hair} />
        <path d="M39 11 Q38.5 14 37 15.5 L37 12 Z" fill={hair} />
        {/* hair highlight */}
        <path d="M24 6 Q28 4 33 5" stroke={hairHi} strokeWidth="0.8" fill="none" />

        {/* Ears */}
        <ellipse cx="21" cy="15" rx="1.4" ry="2" fill={skin} />
        <ellipse cx="39" cy="15" rx="1.4" ry="2" fill={skin} />
        <ellipse cx="21" cy="15" rx="0.6" ry="1.1" fill={skinSh} opacity="0.6" />
        <ellipse cx="39" cy="15" rx="0.6" ry="1.1" fill={skinSh} opacity="0.6" />

        {/* Eyebrows (thick, dark – like portrait) */}
        <path d="M23 12.6 Q25.5 11.6 27.7 12.6" stroke={hair} strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M32.3 12.6 Q34.5 11.6 37 12.6" stroke={hair} strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* Eyes (whites + dark irises) */}
        <ellipse cx="25.4" cy="15" rx="1.5" ry="1.1" fill="#fff" />
        <ellipse cx="34.6" cy="15" rx="1.5" ry="1.1" fill="#fff" />
        <circle cx="25.6" cy="15.1" r="0.85" fill="#231a10" />
        <circle cx="34.8" cy="15.1" r="0.85" fill="#231a10" />
        <circle cx="25.9" cy="14.8" r="0.25" fill="#fff" />
        <circle cx="35.1" cy="14.8" r="0.25" fill="#fff" />

        {/* Nose */}
        <path d="M30 15 L29.2 19.2 Q30 20 30.8 19.2 Z" fill={skinSh} opacity="0.55" />
        <path d="M29.6 19.4 Q30 19.8 30.4 19.4" stroke={skinSh} strokeWidth="0.3" fill="none" />

        {/* Mouth – subtle confident smile */}
        <path d="M27.6 21.4 Q30 22.6 32.4 21.4" stroke="#4b1a1a" strokeWidth="0.7" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  )
}
