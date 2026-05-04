'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const RoadmapGraph = dynamic(() => import('./roadmap-graph'), { ssr: false })

export default function RoadmapPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          <p className="text-sm">Loading roadmap…</p>
        </div>
      }
    >
      <RoadmapGraph />
    </Suspense>
  )
}
