'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

/* === global keyframes injected once === */
const globalKeyframes = `
@keyframes splash-fadeIn { from { opacity:0 } to { opacity:1 } }
@keyframes splash-fadeInUp { from { opacity:0; transform:translateY(15px) } to { opacity:1; transform:translateY(0) } }
@keyframes splash-slideLeft { from { opacity:0; transform:translateX(-35px) } to { opacity:1; transform:translateX(0) } }
@keyframes splash-slideRight { from { opacity:0; transform:translateX(35px) } to { opacity:1; transform:translateX(0) } }
@keyframes splash-slideUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
@keyframes splash-loadBar { 0% { width:0% } 100% { width:100% } }
@keyframes splash-scan { 0% { top:0; opacity:0 } 10% { opacity:1 } 90% { opacity:1 } 100% { top:100%; opacity:0 } }
@keyframes splash-flicker { 0%,100% { opacity:1 } 50% { opacity:0.92 } 52% { opacity:1 } 70% { opacity:0.95 } 72% { opacity:1 } }
@keyframes splash-barGrow { from { transform:scaleX(0) } to { transform:scaleX(1) } }
@keyframes splash-float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-3px) } }
@keyframes splash-pulse { 0%,100% { opacity:0.15 } 50% { opacity:0.45 } }
@keyframes splash-eyePulse { 0%,100% { fill-opacity:0.7 } 50% { fill-opacity:0.3 } }
@keyframes splash-antennaPulse { 0%,100% { fill-opacity:0.3 } 50% { fill-opacity:0.9 } }
@keyframes splash-chestPulse { 0%,100% { fill-opacity:0.5 } 50% { fill-opacity:1 } }
@keyframes splash-armWave { 0%,100% { transform:rotate(0deg) } 25% { transform:rotate(12deg) } 75% { transform:rotate(-4deg) } }
`

export default function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 4500)
    const hideTimer = setTimeout(() => setVisible(false), 5300)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#040a18] overflow-hidden transition-opacity duration-800 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Inject global keyframes */}
      <style dangerouslySetInnerHTML={{ __html: globalKeyframes }} />

      {/* Particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-400/25"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `splash-pulse ${Math.random() * 2 + 1}s ease ${Math.random() * 4}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Grid floor */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%]" style={{ perspective: '500px' }}>
        <div
          className="absolute inset-0"
          style={{
            transform: 'rotateX(60deg)',
            transformOrigin: 'center top',
            background:
              'repeating-linear-gradient(0deg,transparent,transparent 29px,rgba(6,182,212,0.06) 29px,rgba(6,182,212,0.06) 30px),repeating-linear-gradient(90deg,transparent,transparent 29px,rgba(6,182,212,0.06) 29px,rgba(6,182,212,0.06) 30px)',
          }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[50%] bg-cyan-500/5 blur-3xl rounded-full" />
      </div>

      {/* Scene */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4">

        {/* Title */}
        <div className="text-center mb-3 sm:mb-4" style={{ animation: 'splash-fadeIn 1s ease 0.3s both' }}>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            NOA microTESE
          </h1>
          <p className="text-[8px] sm:text-[10px] text-cyan-400/50 tracking-[0.3em] uppercase mt-0.5">
            Clinical Decision Support System
          </p>
        </div>

        {/* Robots + Screens */}
        <div className="relative flex items-end justify-center gap-3 sm:gap-8 mb-3 sm:mb-4">

          {/* Left */}
          <div className="flex flex-col items-center" style={{ animation: 'splash-slideLeft 0.8s ease 0.5s both' }}>
            <HoloScreen title="CDSS Form" variant="form" />
            <RobotSVG color="#14b8a6" size={55} delay={0.6} armSide="left" />
          </div>

          {/* Center */}
          <div className="flex flex-col items-center -mt-2" style={{ animation: 'splash-slideUp 0.8s ease 0.3s both' }}>
            <HoloScreen title="NOA Dashboard" variant="main" isMain />
            <RobotSVG color="#06b6d4" size={70} delay={0.4} />
          </div>

          {/* Right */}
          <div className="flex flex-col items-center" style={{ animation: 'splash-slideRight 0.8s ease 0.5s both' }}>
            <HoloScreen title="Explainable AI" variant="shap" />
            <RobotSVG color="#8b5cf6" size={55} delay={0.6} armSide="right" />
          </div>
        </div>

        {/* Logos */}
        <div className="flex items-center gap-3 sm:gap-6 mb-3">
          {[
            { src: '/logos/mums.jpeg', label: 'MUMS', d: 1.2 },
            { src: '/logos/royan.png', label: 'Royan Institute', d: 1.4 },
            { src: '/logos/medical-informatics.jpeg', label: 'Med. Informatics', d: 1.6 },
          ].map((logo) => (
            <div key={logo.label} className="flex flex-col items-center gap-0.5" style={{ animation: `splash-fadeInUp 0.5s ease ${logo.d}s both` }}>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 p-1 flex items-center justify-center">
                <Image src={logo.src} alt={logo.label} width={40} height={40} className="rounded-full object-cover" />
              </div>
              <span className="text-[7px] sm:text-[8px] text-gray-500">{logo.label}</span>
            </div>
          ))}
        </div>

        {/* Loading bar */}
        <div className="w-32 sm:w-44 h-[2px] bg-gray-800/60 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 rounded-full" style={{ animation: 'splash-loadBar 4.5s ease-in-out forwards' }} />
        </div>
        <p className="text-[8px] sm:text-[10px] text-gray-600 mt-1 tracking-wider">Initializing AI agents...</p>
      </div>
    </div>
  )
}

/* ── Holographic Screen ── */
function HoloScreen({ title, variant, isMain }: { title: string; variant: 'form' | 'main' | 'shap'; isMain?: boolean }) {
  const w = isMain ? 140 : 105
  const h = isMain ? 90 : 68

  return (
    <div className="relative mb-1">
      <div
        className="rounded-md border border-cyan-500/40 bg-cyan-950/30 backdrop-blur-sm overflow-hidden"
        style={{
          width: w, height: h,
          boxShadow: '0 0 20px rgba(6,182,212,0.15)',
          animation: 'splash-flicker 3.5s ease infinite',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/[0.06] to-transparent" />
        <div className="p-1.5 font-mono">
          <div className="text-cyan-400 font-bold" style={{ fontSize: 7 }}>{title}</div>

          {variant === 'main' && (
            <div className="mt-1">
              {/* Mini chart */}
              <div className="flex items-end gap-[1px]" style={{ height: 20 }}>
                {[65,45,80,55,70,40,83,50,75,60,48,72,58,66,44,78].map((v, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{
                    height: `${v}%`,
                    background: i === 6 ? 'rgba(6,182,212,0.7)' : 'rgba(6,182,212,0.2)',
                    transformOrigin: 'left',
                    animation: `splash-barGrow 1.5s ease ${i * 0.05 + 1}s both`,
                  }} />
                ))}
              </div>
              <div style={{ fontSize: 5, color: 'rgba(6,182,212,0.45)', marginTop: 2 }}>16 Models — CatBoost Champion</div>
              <div className="flex gap-[2px] mt-1">
                <div className="flex-1 rounded flex flex-col items-center justify-center" style={{ height: 14, background: 'rgba(6,182,212,0.12)' }}>
                  <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(6,182,212,0.8)' }}>0.8306</span>
                  <span style={{ fontSize: 4, color: 'rgba(6,182,212,0.4)' }}>AUC</span>
                </div>
                <div className="flex-1 rounded flex flex-col items-center justify-center" style={{ height: 14, background: 'rgba(20,184,166,0.12)' }}>
                  <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(20,184,166,0.8)' }}>2,413</span>
                  <span style={{ fontSize: 4, color: 'rgba(20,184,166,0.4)' }}>Patients</span>
                </div>
                <div className="flex-1 rounded flex flex-col items-center justify-center" style={{ height: 14, background: 'rgba(139,92,246,0.12)' }}>
                  <span style={{ fontSize: 7, fontWeight: 700, color: 'rgba(139,92,246,0.8)' }}>73</span>
                  <span style={{ fontSize: 4, color: 'rgba(139,92,246,0.4)' }}>Features</span>
                </div>
              </div>
            </div>
          )}

          {variant === 'form' && (
            <div className="mt-1">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-1" style={{ marginBottom: 2 }}>
                  <div className="rounded" style={{ height: 4, width: `${30 + i * 10}%`, background: 'rgba(6,182,212,0.2)' }} />
                  <div className="rounded" style={{ height: 4, width: `${50 - i * 8}%`, background: 'rgba(20,184,166,0.12)' }} />
                </div>
              ))}
              <div className="flex gap-1 mt-1">
                <div className="rounded flex items-center justify-center" style={{ height: 10, width: 28, background: 'rgba(34,197,94,0.2)', fontSize: 5, color: 'rgba(134,239,172,0.7)' }}>73%</div>
                <div className="rounded flex items-center justify-center" style={{ height: 10, width: 22, background: 'rgba(239,68,68,0.12)', fontSize: 5, color: 'rgba(252,165,165,0.5)' }}>27%</div>
              </div>
            </div>
          )}

          {variant === 'shap' && (
            <div className="mt-1">
              {['FSH','LH','Age','TestVol','T/LH'].map((f, i) => (
                <div key={f} className="flex items-center gap-1" style={{ marginBottom: 2 }}>
                  <span style={{ width: 22, fontSize: 4, color: 'rgba(6,182,212,0.35)' }}>{f}</span>
                  <div className="flex-1 rounded" style={{ height: 3, background: 'rgba(30,41,59,0.5)' }}>
                    <div className="rounded" style={{
                      height: '100%',
                      width: `${[85,72,65,58,50][i]}%`,
                      background: i < 2 ? 'rgba(239,68,68,0.4)' : 'rgba(6,182,212,0.3)',
                      transformOrigin: 'left',
                      animation: `splash-barGrow 1s ease ${i * 0.15 + 1.2}s both`,
                    }} />
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 4, color: 'rgba(6,182,212,0.3)', marginTop: 2 }}>SHAP Feature Importance</div>
            </div>
          )}
        </div>
        {/* Scan line */}
        <div className="absolute left-0 right-0" style={{ height: 1, background: 'rgba(6,182,212,0.2)', animation: 'splash-scan 2.5s linear infinite' }} />
      </div>
      {/* Base glow */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: -2, width: '55%', height: 3, background: 'rgba(6,182,212,0.35)', filter: 'blur(4px)', borderRadius: '50%' }} />
    </div>
  )
}

/* ── Robot SVG ── */
function RobotSVG({ color, size, delay, armSide }: {
  color: string; size: number; delay: number; armSide?: 'left' | 'right'
}) {
  return (
    <div style={{ width: size, height: size * 1.25, animation: `splash-float 3s ease-in-out ${delay}s infinite` }}>
      <svg viewBox="0 0 60 78" fill="none" xmlns="https://www.shutterstock.com/image-vector/optical-art-glowing-rectangles-deep-260nw-2714510777.jpg" className="w-full h-full" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>
        {/* Ground glow */}
        <ellipse cx="30" cy="76" rx="18" ry="2" fill={color} fillOpacity="0.15" />
        {/* Legs */}
        <rect x="18" y="60" width="6" height="13" rx="2" fill="#0f172a" stroke={color} strokeWidth="0.6" strokeOpacity="0.35" />
        <rect x="36" y="60" width="6" height="13" rx="2" fill="#0f172a" stroke={color} strokeWidth="0.6" strokeOpacity="0.35" />
        {/* Feet */}
        <rect x="16" y="71" width="10" height="4" rx="1.5" fill="#0f172a" stroke={color} strokeWidth="0.5" strokeOpacity="0.25" />
        <rect x="34" y="71" width="10" height="4" rx="1.5" fill="#0f172a" stroke={color} strokeWidth="0.5" strokeOpacity="0.25" />
        {/* Body */}
        <rect x="13" y="35" width="34" height="27" rx="6" fill="#0f172a" stroke={color} strokeWidth="0.8" strokeOpacity="0.45" />
        {/* Chest light */}
        <circle cx="30" cy="46" r="3.5" fill={color} fillOpacity="0.1" style={{ animation: 'splash-pulse 2s ease infinite' }} />
        <circle cx="30" cy="46" r="1.8" fill={color} fillOpacity="0.5" style={{ animation: 'splash-chestPulse 2s ease infinite' }} />
        {/* Body lines */}
        <line x1="20" y1="52" x2="40" y2="52" stroke={color} strokeWidth="0.4" strokeOpacity="0.15" />
        <line x1="22" y1="56" x2="38" y2="56" stroke={color} strokeWidth="0.4" strokeOpacity="0.1" />
        {/* Left arm */}
        <g style={{ transformOrigin: '13px 38px', animation: armSide === 'left' ? 'splash-armWave 2.5s ease infinite' : 'none' }}>
          <rect x="4" y="37" width="10" height="5" rx="2" fill="#0f172a" stroke={color} strokeWidth="0.5" strokeOpacity="0.3" />
          <rect x="2" y="41" width="7" height="11" rx="2" fill="#0f172a" stroke={color} strokeWidth="0.5" strokeOpacity="0.25" />
          <circle cx="5.5" cy="53" r="3" fill="#0f172a" stroke={color} strokeWidth="0.5" strokeOpacity="0.2" />
        </g>
        {/* Right arm */}
        <g style={{ transformOrigin: '47px 38px', animation: armSide === 'right' ? 'splash-armWave 2.8s ease 0.3s infinite' : 'none' }}>
          <rect x="46" y="37" width="10" height="5" rx="2" fill="#0f172a" stroke={color} strokeWidth="0.5" strokeOpacity="0.3" />
          <rect x="51" y="41" width="7" height="11" rx="2" fill="#0f172a" stroke={color} strokeWidth="0.5" strokeOpacity="0.25" />
          <circle cx="54.5" cy="53" r="3" fill="#0f172a" stroke={color} strokeWidth="0.5" strokeOpacity="0.2" />
        </g>
        {/* Neck */}
        <rect x="26" y="30" width="8" height="6" rx="2" fill="#0f172a" stroke={color} strokeWidth="0.5" strokeOpacity="0.25" />
        {/* Head */}
        <rect x="17" y="10" width="26" height="22" rx="5" fill="#0f172a" stroke={color} strokeWidth="1" strokeOpacity="0.55" />
        {/* Eyes */}
        <ellipse cx="24" cy="20" rx="3.5" ry="3" fill={color} fillOpacity="0.7" style={{ animation: 'splash-eyePulse 3s ease infinite' }} />
        <ellipse cx="36" cy="20" rx="3.5" ry="3" fill={color} fillOpacity="0.7" style={{ animation: 'splash-eyePulse 3s ease infinite' }} />
        <circle cx="25" cy="20" r="1.2" fill="white" fillOpacity="0.85" />
        <circle cx="37" cy="20" r="1.2" fill="white" fillOpacity="0.85" />
        {/* Mouth */}
        <rect x="25" y="26" width="10" height="1.5" rx="0.75" fill={color} fillOpacity="0.25" />
        {/* Antenna */}
        <line x1="30" y1="10" x2="30" y2="4" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" />
        <circle cx="30" cy="3" r="2" fill={color} fillOpacity="0.3" style={{ animation: 'splash-antennaPulse 1.5s ease infinite' }} />
        {/* Ears */}
        <rect x="14" y="17" width="3.5" height="7" rx="1.5" fill="#0f172a" stroke={color} strokeWidth="0.5" strokeOpacity="0.3" />
        <rect x="42.5" y="17" width="3.5" height="7" rx="1.5" fill="#0f172a" stroke={color} strokeWidth="0.5" strokeOpacity="0.3" />
      </svg>
    </div>
  )
}
