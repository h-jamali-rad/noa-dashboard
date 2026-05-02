'use client'

import { useEffect, useRef, useState } from 'react'

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playCount, setPlayCount] = useState(0)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    const handleEnded = () => {
      setPlayCount((c) => {
        if (c < 1) {
          v.currentTime = 0
          v.play().catch(() => {})
          return c + 1
        }
        return c + 1
      })
    }

    v.addEventListener('ended', handleEnded)
    v.play().catch(() => {})
    return () => v.removeEventListener('ended', handleEnded)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.20] dark:opacity-[0.25]"
        aria-hidden="true"
      >
        <source src="/videos/intro.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-background/65 to-background/90" />
      <div className="absolute inset-0 hero-pattern" />
    </div>
  )
}
