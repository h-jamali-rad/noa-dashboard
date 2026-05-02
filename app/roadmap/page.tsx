'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const RoadmapGraph = dynamic(() => import('./roadmap-graph'), { ssr: false })

export default function RoadmapPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <p>Loading mind map…</p>
      </div>
    }>
      <RoadmapGraph />
    </Suspense>
  )
}
