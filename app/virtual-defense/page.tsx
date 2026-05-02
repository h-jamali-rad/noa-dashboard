import BreadcrumbNav from '@/components/breadcrumb-nav'
import data from '@/data/content/extended_sections.json'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export default function VirtualDefensePage() {
  const panels = Array.isArray(data?.virtual_defense?.panels) ? data.virtual_defense.panels : []

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-6">
      <BreadcrumbNav items={[{ label: 'Virtual Defense' }]} />
      <div>
        <h1 className="font-display font-bold text-3xl tracking-tight">Virtual Defense</h1>
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
  )
}
