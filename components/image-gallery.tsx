'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { Search, Filter, ImageOff, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import ImageLightbox, { LightboxImage } from './image-lightbox'
import { cn } from '@/lib/utils'

export type GalleryImage = LightboxImage & {
  agent?: string
}

export default function ImageGallery({
  images,
  initialPageSize = 24,
  showFilters = true,
  emptyMessage = 'No images match the selected filters.',
}: {
  images: GalleryImage[]
  initialPageSize?: number
  showFilters?: boolean
  emptyMessage?: string
}) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [activeModel, setActiveModel] = useState<string>('All')
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const safeImages = images ?? []

  const categories = useMemo(() => {
    const set = new Set<string>()
    safeImages.forEach((i) => i?.category && set.add(i.category))
    return ['All', ...Array.from(set).sort()]
  }, [safeImages])

  const models = useMemo(() => {
    const set = new Set<string>()
    safeImages.forEach((i) => i?.modelTag && set.add(i.modelTag))
    return ['All', ...Array.from(set).sort()]
  }, [safeImages])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return safeImages.filter((img) => {
      if (!img) return false
      if (activeCategory !== 'All' && img.category !== activeCategory) return false
      if (activeModel !== 'All' && img.modelTag !== activeModel) return false
      if (q) {
        const hay = `${img.altText ?? ''} ${img.caption ?? ''} ${img.filename ?? ''} ${img.category ?? ''} ${img.modelTag ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [safeImages, search, activeCategory, activeModel])

  const visible = filtered.slice(0, pageSize)
  const hasMore = filtered.length > pageSize

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="glass-panel rounded-lg p-3 sm:p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPageSize(initialPageSize)
                }}
                placeholder="Search images by name, model, or category…"
                className="pl-9"
              />
            </div>
            <div className="text-xs text-muted-foreground self-center font-mono whitespace-nowrap">
              {filtered.length.toLocaleString()} of {safeImages.length.toLocaleString()}
            </div>
          </div>

          {categories.length > 2 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Filter className="h-3 w-3" />
                Category
              </span>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setActiveCategory(c)
                    setPageSize(initialPageSize)
                  }}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full transition-colors duration-150 border',
                    activeCategory === c
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-foreground/80 border-transparent hover:border-primary/40 hover:text-primary'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {models.length > 2 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Tag className="h-3 w-3" />
                Model
              </span>
              {models.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setActiveModel(m)
                    setPageSize(initialPageSize)
                  }}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full transition-colors duration-150 border',
                    activeModel === m
                      ? 'bg-secondary text-secondary-foreground border-secondary'
                      : 'bg-muted/50 text-foreground/80 border-transparent hover:border-secondary/40 hover:text-secondary'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ImageOff className="h-10 w-10 mb-3 opacity-60" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {visible.map((img, i) => (
              <button
                key={img.publicPath}
                onClick={() => setLightboxIndex(i)}
                title={img.altText}
                className="group relative block w-full aspect-[4/3] rounded-md overflow-hidden bg-muted shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Image
                  src={img.publicPath}
                  alt={img.altText}
                  fill
                  loading="lazy"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  style={{ objectFit: 'cover' }}
                  className="transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-[11px] text-white font-medium truncate">{img.caption || img.filename}</p>
                  <p className="text-[10px] text-white/80 truncate">
                    {img.category}
                    {img.modelTag ? ` • ${img.modelTag}` : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-3">
              <Button
                variant="outline"
                onClick={() => setPageSize((p) => p + initialPageSize)}
                className="shadow-sm"
              >
                Load more ({filtered.length - pageSize} remaining)
              </Button>
            </div>
          )}
        </>
      )}

      <ImageLightbox
        images={filtered}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </div>
  )
}
