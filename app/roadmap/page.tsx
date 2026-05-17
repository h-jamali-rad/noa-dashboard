'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import AIAssistWrapper from '@/components/ai-assist-wrapper'

const RoadmapGraph = dynamic(() => import('./roadmap-graph'), { ssr: false })

export default function RoadmapPage() {
  return (
    <AIAssistWrapper id="roadmap-overview" className="block">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
            <p className="text-sm">Loading roadmap…</p>
          </div>
        }
      >
        <RoadmapGraph />
      </Suspense>
    </AIAssistWrapper>
  )
}
