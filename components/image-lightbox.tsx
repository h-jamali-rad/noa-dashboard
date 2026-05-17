'use client'

import { useEffect, useCallback, useState, useMemo } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Download, Volume2, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAIAssist } from './ai-assist-provider'

export type LightboxImage = {
  publicPath: string
  altText: string
  caption?: string
  category?: string
  modelTag?: string | null
  filename?: string
}

function deriveAudioId(publicPath: string): string {
  // e.g. /images/xai/shap_bar_CatBoost.png → phase=xai, name=shap_bar_CatBoost → fig-xai-shap_bar_CatBoost
  const match = publicPath.match(/\/images\/([^/]+)\/([^/]+)\.[^.]+$/)
  if (!match) return ''
  const phase = match[1]
  const name = match[2]
  return `fig-${phase}-${name}`
}

export default function ImageLightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: LightboxImage[]
  index: number | null
  onClose: () => void
  onIndexChange: (i: number) => void
}) {
  const { enabled, play, stopCurrent } = useAIAssist()
  const [playingId, setPlayingId] = useState<string | null>(null)

  const isOpen = index !== null && index >= 0 && index < images.length
  const img = isOpen ? images[index!] : null

  const audioId = useMemo(() => {
    if (!img) return ''
    return deriveAudioId(img.publicPath)
  }, [img])

  const isPlaying = playingId !== null && playingId === audioId

  const goPrev = useCallback(() => {
    if (index === null) return
    stopCurrent()
    setPlayingId(null)
    const next = (index - 1 + images.length) % images.length
    onIndexChange(next)
  }, [index, images.length, onIndexChange, stopCurrent])

  const goNext = useCallback(() => {
    if (index === null) return
    stopCurrent()
    setPlayingId(null)
    const next = (index + 1) % images.length
    onIndexChange(next)
  }, [index, images.length, onIndexChange, stopCurrent])

  const handleClose = useCallback(() => {
    stopCurrent()
    setPlayingId(null)
    onClose()
  }, [onClose, stopCurrent])

  const toggleAudio = useCallback(() => {
    if (!audioId) return
    if (isPlaying) {
      stopCurrent()
      setPlayingId(null)
    } else {
      play(audioId)
      setPlayingId(audioId)
    }
  }, [audioId, isPlaying, play, stopCurrent])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, handleClose, goPrev, goNext])

  // Stop audio when lightbox closes (unmounts or isOpen becomes false)
  useEffect(() => {
    if (!isOpen && playingId) {
      stopCurrent()
      setPlayingId(null)
    }
  }, [isOpen, playingId, stopCurrent])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col anim-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={img?.altText || 'Image lightbox'}
    >
      <div className="flex items-center justify-between gap-4 p-3 sm:p-4 text-white">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{img?.caption || img?.filename}</p>
          <p className="text-xs opacity-70 truncate">
            {img?.category}
            {img?.modelTag ? ` • ${img.modelTag}` : ''} • {index! + 1} / {images.length}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {enabled && audioId && (
            <Button
              variant="ghost"
              size="icon"
              className={
                isPlaying
                  ? 'text-teal-400 hover:bg-teal-400/20 hover:text-teal-300'
                  : 'text-teal-400 hover:bg-teal-400/20 hover:text-teal-300'
              }
              onClick={toggleAudio}
              aria-label={isPlaying ? 'Stop AI interpretation' : 'Play AI interpretation'}
              title={isPlaying ? 'Stop AI interpretation' : 'Play AI interpretation'}
            >
              {isPlaying ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          )}
          <a
            href={img?.publicPath}
            download
            className="inline-flex items-center justify-center h-9 w-9 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Download image"
            aria-label="Download"
          >
            <Download className="h-4 w-4" />
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={handleClose}
            aria-label="Close lightbox"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center px-2 sm:px-12 pb-4">
        <button
          onClick={goPrev}
          className="absolute left-2 sm:left-4 z-10 inline-flex items-center justify-center h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="relative w-full h-full max-w-7xl mx-auto flex items-center justify-center">
          <div className="relative w-full h-full">
            <Image
              key={img?.publicPath}
              src={img?.publicPath ?? ''}
              alt={img?.altText ?? 'Visualization'}
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'contain' }}
              className="select-none anim-fade-in"
            />
          </div>
        </div>

        <button
          onClick={goNext}
          className="absolute right-2 sm:right-4 z-10 inline-flex items-center justify-center h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
