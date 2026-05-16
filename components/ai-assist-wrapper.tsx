'use client'

/**
 * NOA AI Assist — element wrapper.
 *
 * Wrap any dashboard element (`<AIAssistWrapper id="prep-stat-card-cohort">…</>`)
 * so that, when the global AI Assist toggle is ON, hovering the element
 *   1. shows a subtle teal glow / ring around it, and
 *   2. plays `/audio/ai-assist/{id}.mp3` (single-channel — only one at a time).
 *
 * When the toggle is OFF the wrapper is fully transparent (no border / no
 * hover effect) so the underlying dashboard looks identical to before.
 */

import { useCallback } from 'react'
import { useAIAssist } from './ai-assist-provider'

type Props = {
  /** Stable id matching the MP3 filename (`/audio/ai-assist/{id}.mp3`). */
  id: string
  className?: string
  /** Render as <span> instead of <div> for inline contexts. */
  as?: 'div' | 'span'
  children: React.ReactNode
}

export default function AIAssistWrapper({
  id,
  className,
  as = 'div',
  children,
}: Props) {
  const { enabled, play, stopCurrent } = useAIAssist()

  const onEnter = useCallback(() => {
    if (enabled) play(id)
  }, [enabled, id, play])

  const onLeave = useCallback(() => {
    if (enabled) stopCurrent()
  }, [enabled, stopCurrent])

  const baseClass = [
    'rounded-lg transition-shadow transition-colors duration-300 ease-out',
    enabled
      ? [
          // Subtle teal ring + glow when AI Assist is ON. The ring colour matches
          // the floating toggle so the relationship is obvious.
          'ring-1 ring-transparent hover:ring-2 hover:ring-teal-400/60',
          'hover:shadow-[0_0_18px_rgba(45,212,191,0.35)]',
          'cursor-help',
        ].join(' ')
      : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  const sharedProps = {
    'data-ai-assist': id,
    className: baseClass,
    onMouseEnter: onEnter,
    onMouseLeave: onLeave,
    // Touch-screen support: tap to play, second tap (outside) stops.
    onFocus: onEnter,
    onBlur: onLeave,
  } as const

  if (as === 'span') {
    return <span {...sharedProps}>{children}</span>
  }
  return <div {...sharedProps}>{children}</div>
}
