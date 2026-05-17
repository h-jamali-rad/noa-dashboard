import { prisma } from '@/lib/db'
import ImageGallery, { GalleryImage } from '@/components/image-gallery'
import BreadcrumbNav from '@/components/breadcrumb-nav'
import { Images } from 'lucide-react'
import AIAssistWrapper from '@/components/ai-assist-wrapper'

async function getImages(): Promise<GalleryImage[]> {
  try {
    const rows = await prisma.imageAsset.findMany({
      orderBy: [{ agent: 'asc' }, { sortOrder: 'asc' }],
    })
    return rows.map((r) => ({
      publicPath: r.publicPath,
      altText: r.altText,
      caption: r.caption,
      category: r.category,
      modelTag: r.modelTag,
      filename: r.filename,
      agent: r.agent,
    }))
  } catch {
    return []
  }
}

export default async function GalleryPage() {
  const images = await getImages()
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto">
      <BreadcrumbNav items={[{ label: 'Image Gallery' }]} />
      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-md gradient-brand text-white shadow-sm">
          <Images className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight">Complete image gallery</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            All {images.length.toLocaleString()} visualisations produced across the validation, XAI and literature
            phases. Filter by category or model, click any image for the full-resolution lightbox view, and use the
            keyboard arrows to navigate.
          </p>
        </div>
      </div>
      <AIAssistWrapper id="gallery-overview" className="block">
        <ImageGallery images={images} initialPageSize={32} />
      </AIAssistWrapper>
    </div>
  )
}
