'use client'

import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'

import BreadcrumbNav from '@/components/breadcrumb-nav'
import data from '@/data/content/extended_sections.json'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

type DefensePanel = {
  specialist?: string
  vote?: string
  strengths?: string[]
  critiques?: string[]
  specific_recommendations?: string[]
}

type VirtualDefenseData = {
  virtual_defense?: {
    panels?: DefensePanel[]
  }
}

const heroFadeIn: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: 'easeOut' },
  },
}

const heroScaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function VirtualDefensePage() {
  const typedData = data as VirtualDefenseData
  const panels: DefensePanel[] = Array.isArray(typedData?.virtual_defense?.panels)
    ? typedData.virtual_defense!.panels
    : []

  return (
    <div className="w-full scroll-smooth bg-slate-950 text-slate-100">
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950">
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          aria-hidden
        >
          <div className="absolute left-1/2 top-16 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-10 right-1/4 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
        </motion.div>

        <motion.div
          variants={heroScaleIn}
          initial="hidden"
          animate="visible"
          className="relative mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 md:pt-20 lg:px-10"
        >
          <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 shadow-[0_0_80px_rgba(59,130,246,0.35)]">
            <Image
              src="/images/virtual-defense-hero-v2.png"
              alt="Premium cinematic virtual PhD defense chamber illustration"
              width={1920}
              height={1080}
              priority
              quality={95}
              className="h-auto w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/35 to-transparent" />
            <div className="absolute inset-0 ring-1 ring-cyan-300/20" />

            <motion.div
              variants={heroFadeIn}
              initial="hidden"
              animate="visible"
              className="absolute inset-x-0 bottom-0 p-6 text-center sm:p-8 md:p-10"
            >
              <h1 className="bg-gradient-to-r from-cyan-200 via-blue-200 to-indigo-300 bg-clip-text text-3xl font-black tracking-tight text-transparent drop-shadow-[0_2px_20px_rgba(56,189,248,0.35)] sm:text-5xl md:text-6xl">
                Virtual Defense Chamber
              </h1>
              <p className="mx-auto mt-3 max-w-3xl text-sm text-slate-200/90 sm:text-base md:text-lg">
                A cinematic, AI-powered PhD defense experience with committee analytics, structured critique, and next-step guidance.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <motion.section
        className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6 lg:px-10"
        variants={heroFadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <BreadcrumbNav items={[{ label: 'Virtual Defense' }]} />

        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Defense Panel Reviews</h2>
          <p className="mt-1 text-sm text-slate-300/80">
            Committee-style review synthesis with votes, strengths, critiques, and recommendations.
          </p>
        </div>

        {panels.length === 0 ? (
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/60 p-4 text-sm text-slate-300">
            No defense panel entries are currently available.
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-3">
            {panels.map((panel, idx) => {
              const strengths: string[] = Array.isArray(panel?.strengths) ? panel.strengths : []
              const critiques: string[] = Array.isArray(panel?.critiques) ? panel.critiques : []
              const recommendations: string[] = Array.isArray(panel?.specific_recommendations)
                ? panel.specific_recommendations
                : []
              const specialist = panel?.specialist || `Panel ${idx + 1}`
              const vote = panel?.vote || 'n/a'

              return (
                <motion.div
                  key={`${specialist}-${idx}`}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, ease: 'easeOut', delay: idx * 0.05 }}
                >
                  <AccordionItem
                    value={`item-${idx}`}
                    className="rounded-lg border border-slate-700/70 bg-slate-900/60 px-4 backdrop-blur-sm"
                  >
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div>
                        <p className="font-semibold text-slate-100">{specialist}</p>
                        <p className="text-xs text-slate-300/80">Vote: {vote}</p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 text-sm md:grid-cols-3">
                        <div>
                          <p className="mb-1 font-semibold">Strengths</p>
                          <ul className="list-disc space-y-1 pl-5 text-slate-200/90">
                            {strengths.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="mb-1 font-semibold">Critiques</p>
                          <ul className="list-disc space-y-1 pl-5 text-slate-200/90">
                            {critiques.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="mb-1 font-semibold">Recommendations</p>
                          <ul className="list-disc space-y-1 pl-5 text-slate-200/90">
                            {recommendations.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              )
            })}
          </Accordion>
        )}
      </motion.section>
    </div>
  )
}
