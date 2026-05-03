'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function RoadmapFab() {
  const pathname = usePathname()

  // Don't show on the roadmap page itself
  if (pathname === '/roadmap') return null

  return (
    <Link
      href="/roadmap"
      className="fixed right-6 bottom-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full
        bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600
        text-white text-sm font-semibold shadow-lg shadow-purple-500/30
        hover:shadow-purple-500/50 hover:scale-105
        transition-all duration-300 ease-out
        animate-pulse-slow
        group"
      title="Project Roadmap"
    >
      <span className="text-lg">🗺️</span>
      <span className="hidden sm:inline">Project Roadmap</span>
      <span className="sm:hidden">Roadmap</span>

      {/* Glow ring */}
      <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
    </Link>
  )
}
