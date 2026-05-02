import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { PHASE_ORDER, getIcon, type PhaseSlug } from '@/lib/phases'
import BreadcrumbNav from '@/components/breadcrumb-nav'
import PhaseClient from './phase-client'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return PHASE_ORDER.map((slug) => ({ slug }))
}

async function getPhaseData(slug: string) {
  try {
    const phase = await prisma.agentPhase.findUnique({ where: { slug } })
    if (!phase) return null
    const [images, codeFiles, logFiles] = await Promise.all([
      prisma.imageAsset.findMany({
        where: { agent: slug },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.codeFile.findMany({
        where: { agent: slug },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.logFile.findMany({
        where: { agent: slug },
        orderBy: { sortOrder: 'asc' },
      }),
    ])
    return { phase, images, codeFiles, logFiles }
  } catch (e) {
    console.error('phase fetch failed', e)
    return null
  }
}

export default async function PhasePage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  if (!PHASE_ORDER.includes(slug as PhaseSlug)) notFound()

  const data = await getPhaseData(slug)
  if (!data) notFound()

  const { phase, images, codeFiles, logFiles } = data
  const Icon = getIcon(phase.iconKey)

  // Prev / Next phase
  const idx = PHASE_ORDER.indexOf(slug as PhaseSlug)
  const prevSlug = idx > 0 ? PHASE_ORDER[idx - 1] : null
  const nextSlug = idx < PHASE_ORDER.length - 1 ? PHASE_ORDER[idx + 1] : null

  const phaseTitle = phase.title.replace(/^Agent \d+ — /, '')

  // Serialize for client component
  const galleryImages = images.map((i) => ({
    publicPath: i.publicPath,
    altText: i.altText,
    caption: i.caption,
    category: i.category,
    modelTag: i.modelTag,
    filename: i.filename,
  }))
  const codeData = codeFiles.map((c) => ({
    id: c.id,
    filename: c.filename,
    language: c.language,
    contentText: c.contentText,
    size: c.size,
  }))
  const logData = logFiles.map((l) => ({
    id: l.id,
    filename: l.filename,
    contentText: l.contentText,
    size: l.size,
  }))

  const objectives = (() => {
    try {
      return JSON.parse((phase as any).objectivesJson ?? '[]') as string[]
    } catch {
      return []
    }
  })()
  const deliverables = (() => {
    try {
      return JSON.parse((phase as any).deliverablesJson ?? '[]') as string[]
    } catch {
      return []
    }
  })()

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto">
      <BreadcrumbNav items={[{ label: 'Pipeline', href: '/' }, { label: phaseTitle }]} />

      <div className="flex items-start gap-4 mb-2">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-md text-white shadow-md shrink-0"
          style={{ backgroundColor: phase.accent }}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p
            className="text-[11px] uppercase tracking-widest font-mono font-semibold mb-0.5"
            style={{ color: phase.accent }}
          >
            Agent {phase.id} of 6
          </p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight leading-tight">
            {phaseTitle}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{phase.subtitle}</p>
        </div>
      </div>

      <p className="text-sm text-foreground/80 leading-relaxed mt-4 max-w-4xl">{phase.description}</p>

      <PhaseClient
        slug={slug}
        accent={phase.accent}
        objectives={objectives}
        deliverables={deliverables}
        images={galleryImages}
        codeFiles={codeData}
        logFiles={logData}
        contentJson={(phase.contentJson as any) ?? null}
      />

      {/* Phase nav */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {prevSlug ? (
          <Button asChild variant="outline" className="justify-start h-auto py-3">
            <Link href={`/phase/${prevSlug}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="flex flex-col items-start min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Previous phase</span>
                <span className="font-semibold capitalize">Agent {idx} · {prevSlug}</span>
              </span>
            </Link>
          </Button>
        ) : <div />}
        {nextSlug && (
          <Button asChild variant="outline" className="justify-end h-auto py-3 sm:ml-auto">
            <Link href={`/phase/${nextSlug}`}>
              <span className="flex flex-col items-end min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Next phase</span>
                <span className="font-semibold capitalize">Agent {idx + 2} · {nextSlug}</span>
              </span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
