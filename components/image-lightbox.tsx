'use client'

import { useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type LightboxImage = {
  publicPath: string
  altText: string
  caption?: string
  category?: string
  modelTag?: string | null
  filename?: string
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
  const isOpen = index !== null && index >= 0 && index < images.length

  const goPrev = useCallback(() => {
    if (index === null) return
    const next = (index - 1 + images.length) % images.length
    onIndexChange(next)
  }, [index, images.length, onIndexChange])

  const goNext = useCallback(() => {
    if (index === null) return
    const next = (index + 1) % images.length
    onIndexChange(next)
  }, [index, images.length, onIndexChange])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, onClose, goPrev, goNext])

  if (!isOpen) return null
  const img = images[index!]

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
            onClick={onClose}
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
