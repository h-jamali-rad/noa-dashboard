'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

const LOGOS = [
  { src: '/logos/mums.jpeg', alt: 'Mashhad University of Medical Sciences' },
  { src: '/logos/royan.png', alt: 'Royan Institute' },
  { src: '/logos/medical-informatics.jpeg', alt: 'Medical Informatics Department' },
]

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<'video' | 'logos' | 'done'>('video')
  const [logoRotation, setLogoRotation] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleEnded = () => {
      setPhase('logos')
      // After 4 seconds of logo animation, fade to done
      setTimeout(() => {
        setPhase('done')
        // After fade, restart video loop
        setTimeout(() => {
          setPhase('video')
          video.currentTime = 0
          video.play().catch(() => {})
        }, 1000)
      }, 4000)
    }

    video.addEventListener('ended', handleEnded)
    return () => video.removeEventListener('ended', handleEnded)
  }, [])

  // Rotate logos during logo phase
  useEffect(() => {
    if (phase !== 'logos') return
    const interval = setInterval(() => {
      setLogoRotation(prev => prev + 2)
    }, 30)
    return () => clearInterval(interval)
  }, [phase])

  return (
    <section className="rounded-xl overflow-hidden border bg-black relative" style={{ minHeight: '300px' }}>
      {/* Video Layer */}
      <div
        className="transition-opacity duration-1000"
        style={{ opacity: phase === 'video' ? 1 : 0 }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-auto object-contain bg-black"
          style={{ maxHeight: '520px' }}
        >
          <source src="/videos/intro-hero.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Logo Carousel Layer */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 transition-opacity duration-1000"
        style={{ opacity: phase === 'logos' ? 1 : 0, pointerEvents: phase === 'logos' ? 'auto' : 'none' }}
      >
        <div className="relative" style={{ width: '280px', height: '280px' }}>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <p className="text-white/90 text-sm font-bold tracking-wider uppercase">NOA Research</p>
            <p className="text-white/50 text-[10px] mt-1">Collaborative Investigation</p>
          </div>

          {/* Rotating logos */}
          {LOGOS.map((logo, i) => {
            const angle = (logoRotation + i * 120) * (Math.PI / 180)
            const radius = 110
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius

            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `calc(50% + ${x}px - 32px)`,
                  top: `calc(50% + ${y}px - 32px)`,
                  transition: 'none',
                }}
              >
                <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-1.5 shadow-lg shadow-black/30">
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={52}
                    height={52}
                    className="rounded-lg w-full h-full object-contain"
                  />
                </div>
                <p className="text-[8px] text-white/60 text-center mt-1 max-w-[80px] mx-auto leading-tight">
                  {logo.alt}
                </p>
              </div>
            )
          })}

          {/* Orbit ring */}
          <div
            className="absolute inset-0 rounded-full border border-white/10"
            style={{ margin: '-8px', width: 'calc(100% + 16px)', height: 'calc(100% + 16px)' }}
          />
        </div>
      </div>

      {/* Done / Fade overlay */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-1000 pointer-events-none"
        style={{ opacity: phase === 'done' ? 1 : 0 }}
      />
    </section>
  )
}
