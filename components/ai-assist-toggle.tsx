'use client'

/**
 * NOA AI Assist — floating toggle button.
 *
 * Sits in the bottom-right corner, stacked just above the RoadmapFab.
 * Visually distinct (teal glow / pulse) when ON, muted when OFF.
 */

import { Headphones, HeadphoneOff } from 'lucide-react'
import { useAIAssist } from './ai-assist-provider'

export default function AIAssistToggle() {
  const { enabled, toggle } = useAIAssist()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={
        enabled
          ? 'Disable NOA AI Assist hover audio guide'
          : 'Enable NOA AI Assist hover audio guide'
      }
      title={
        enabled
          ? 'NOA AI Assist is ON — hover any highlighted element to hear the explanation. Click to turn off.'
          : 'NOA AI Assist is OFF — click to enable hover audio explanations.'
      }
      className={[
        'fixed right-6 bottom-24 z-50',
        'inline-flex items-center gap-2 rounded-full',
        'px-4 py-2.5 text-xs sm:text-sm font-medium',
        'border backdrop-blur-md',
        'transition-all duration-300 ease-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        enabled
          ? [
              'bg-teal-500/15 text-teal-200 border-teal-400/50',
              'shadow-[0_0_22px_rgba(45,212,191,0.45)]',
              'hover:bg-teal-500/25 hover:shadow-[0_0_28px_rgba(45,212,191,0.65)]',
              'animate-[aiAssistPulse_2.4s_ease-in-out_infinite]',
            ].join(' ')
          : [
              'bg-background/60 text-muted-foreground border-border',
              'hover:bg-muted/60 hover:text-foreground hover:border-foreground/30',
              'shadow-sm',
            ].join(' '),
      ].join(' ')}
    >
      {enabled ? (
        <Headphones className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <HeadphoneOff className="h-4 w-4 shrink-0" aria-hidden />
      )}
      <span className="hidden sm:inline">NOA AI Assist</span>
      <span className="sm:hidden">AI Assist</span>
      <span
        className={[
          'ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider',
          enabled
            ? 'bg-teal-400/25 text-teal-100'
            : 'bg-muted/70 text-muted-foreground',
        ].join(' ')}
      >
        {enabled ? 'ON' : 'OFF'}
      </span>

      {/* Local keyframes — kept inline to avoid touching tailwind.config */}
      <style jsx>{`
        @keyframes aiAssistPulse {
          0%,
          100% {
            box-shadow: 0 0 22px rgba(45, 212, 191, 0.45);
          }
          50% {
            box-shadow: 0 0 32px rgba(45, 212, 191, 0.75);
          }
        }
      `}</style>
    </button>
  )
}
