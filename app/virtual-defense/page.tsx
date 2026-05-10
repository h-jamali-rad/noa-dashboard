import BreadcrumbNav from '@/components/breadcrumb-nav'
import data from '@/data/content/extended_sections.json'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Image from 'next/image'

export default function VirtualDefensePage() {
  const panels = Array.isArray(data?.virtual_defense?.panels) ? data.virtual_defense.panels : []

  return (
    <div className="w-full">
      {/* Hero Section with Illustration */}
      <div className="relative w-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        <div className="relative w-full h-auto">
          <Image
            src="/images/virtual-defense-hero.png"
            alt="Virtual Defense Presentation"
            width={1920}
            height={1080}
            priority
            className="w-full h-auto object-cover"
            quality={95}
          />
        </div>
        
        {/* Overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent"></div>
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 drop-shadow-lg">
            Virtual Defense Chamber
          </h1>
          <p className="text-lg md:text-xl text-slate-200 drop-shadow-lg max-w-2xl">
            Next-generation academic presentation with AI-powered committee evaluation and real-time feedback synthesis
          </p>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-6">
        <BreadcrumbNav items={[{ label: 'Virtual Defense' }]} />
        <div>
          <h2 className="font-display font-bold text-3xl tracking-tight">Defense Panel Reviews</h2>
          <p className="text-sm text-muted-foreground mt-1">Committee-style review synthesis with votes, strengths, critiques, and recommendations.</p>
        </div>

        {panels.length === 0 ? (
          <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
            No defense panel entries are currently available.
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-3">
            {panels.map((panel, idx) => {
              const strengths = Array.isArray(panel?.strengths) ? panel.strengths : []
              const critiques = Array.isArray(panel?.critiques) ? panel.critiques : []
              const recs = Array.isArray(panel?.specific_recommendations) ? panel.specific_recommendations : []
              const specialist = panel?.specialist || `Panel ${idx + 1}`
              const vote = panel?.vote || 'n/a'

              return (
                <AccordionItem key={`${specialist}-${idx}`} value={`item-${idx}`} className="border rounded-lg px-4 bg-card">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <div>
                      <p className="font-semibold">{specialist}</p>
                      <p className="text-xs text-muted-foreground">Vote: {vote}</p>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-semibold mb-1">Strengths</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {strengths.map((x, i) => <li key={i}>{x}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Critiques</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {critiques.map((x, i) => <li key={i}>{x}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Recommendations</p>
                        <ul className="list-disc pl-5 space-y-1">
                          {recs.map((x, i) => <li key={i}>{x}</li>)}
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </div>
    </div>
  )
}
