'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Start fade out at 3.2s, fully gone by 4s
    const fadeTimer = setTimeout(() => setFadeOut(true), 3200)
    const hideTimer = setTimeout(() => setVisible(false), 4000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-950 transition-opacity duration-800 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-500/20 animate-pulse"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 1.5}s`,
            }}
          />
        ))}
        {/* Glowing circuit lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="circuit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="20%" x2="100%" y2="20%" stroke="url(#circuit-grad)" strokeWidth="0.5">
            <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" />
          </line>
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="url(#circuit-grad)" strokeWidth="0.5">
            <animate attributeName="opacity" values="0;1;0" dur="2.5s" begin="0.5s" repeatCount="indefinite" />
          </line>
          <line x1="0" y1="80%" x2="100%" y2="80%" stroke="url(#circuit-grad)" strokeWidth="0.5">
            <animate attributeName="opacity" values="0;1;0" dur="2s" begin="1s" repeatCount="indefinite" />
          </line>
          <line x1="30%" y1="0" x2="30%" y2="100%" stroke="url(#circuit-grad)" strokeWidth="0.5">
            <animate attributeName="opacity" values="0;1;0" dur="2.8s" begin="0.3s" repeatCount="indefinite" />
          </line>
          <line x1="70%" y1="0" x2="70%" y2="100%" stroke="url(#circuit-grad)" strokeWidth="0.5">
            <animate attributeName="opacity" values="0;1;0" dur="3.2s" begin="0.7s" repeatCount="indefinite" />
          </line>
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* AI Robot Icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 animate-bounce" style={{ animationDuration: '2s' }}>
            <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {/* Robot head */}
              <rect x="5" y="7" width="14" height="10" rx="2" />
              {/* Antenna */}
              <line x1="12" y1="7" x2="12" y2="3" />
              <circle cx="12" cy="2.5" r="1" fill="currentColor" />
              {/* Eyes */}
              <circle cx="9" cy="11" r="1.5" fill="currentColor">
                <animate attributeName="r" values="1.5;1;1.5" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="15" cy="11" r="1.5" fill="currentColor">
                <animate attributeName="r" values="1.5;1;1.5" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Mouth */}
              <path d="M9 14.5h6" />
              {/* Body connectors */}
              <line x1="5" y1="10" x2="3" y2="10" />
              <line x1="19" y1="10" x2="21" y2="10" />
              <line x1="5" y1="14" x2="3" y2="14" />
              <line x1="19" y1="14" x2="21" y2="14" />
            </svg>
          </div>
          {/* Glow effect */}
          <div className="absolute -inset-4 rounded-3xl bg-cyan-500/10 blur-xl animate-pulse" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent animate-pulse" style={{ animationDuration: '2.5s' }}>
            NOA microTESE
          </h1>
          <p className="text-sm sm:text-base text-cyan-300/70 tracking-widest uppercase">
            Clinical Decision Support System
          </p>
        </div>

        {/* Three Logos */}
        <div className="flex items-center gap-6 sm:gap-10">
          <div className="flex flex-col items-center gap-2 opacity-0 animate-[fadeInUp_0.6s_ease_0.3s_forwards]">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 p-2 flex items-center justify-center">
              <Image src="/logos/mums.jpeg" alt="MUMS" width={64} height={64} className="rounded-full object-cover" />
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400">MUMS</span>
          </div>
          <div className="flex flex-col items-center gap-2 opacity-0 animate-[fadeInUp_0.6s_ease_0.6s_forwards]">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 p-2 flex items-center justify-center">
              <Image src="/logos/royan.png" alt="Royan Institute" width={64} height={64} className="rounded-full object-cover" />
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400">Royan Institute</span>
          </div>
          <div className="flex flex-col items-center gap-2 opacity-0 animate-[fadeInUp_0.6s_ease_0.9s_forwards]">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 p-2 flex items-center justify-center">
              <Image src="/logos/medical-informatics.jpeg" alt="Medical Informatics" width={64} height={64} className="rounded-full object-cover" />
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400">Med. Informatics</span>
          </div>
        </div>

        {/* Loading bar */}
        <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden mt-4">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full"
            style={{
              animation: 'loadBar 3.2s ease-in-out forwards',
            }}
          />
        </div>
        <p className="text-xs text-gray-500">Loading dashboard…</p>
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes loadBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  )
}
