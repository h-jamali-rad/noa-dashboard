import BreadcrumbNav from '@/components/breadcrumb-nav'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import CdssForm from './cdss-form'

export default function CdssPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-6">
      <BreadcrumbNav items={[{ label: 'CDSS' }]} />
      <h1 className="font-display font-bold text-3xl tracking-tight">Clinical Decision Support System (CDSS)</h1>

      <div className="rounded-lg border bg-card p-4">
        <video controls className="w-full rounded-md" src="/videos/cdss_intro.mp4" />
      </div>

      <div className="rounded-lg border bg-card p-5">
        <CdssForm />
      </div>

      <div className="rounded-lg border bg-card p-5">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="pathology-explanation" className="border rounded-lg px-4">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold">Pathology explanation in CDSS</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  In the study dataset, pathology was recorded as percentage patterns in testicular tissue
                  (e.g., SCO 45%, Maturation Arrest 30%). The rebuilt CDSS keeps this structure by receiving
                  right/left pathology percentage inputs directly.
                </p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <strong>Baseline model context:</strong> The prediction summary is aligned with the v2 finalized
                    model family (CatBoost best; AUC 0.8306, 95% CI 0.823–0.845).
                  </li>
                  <li>
                    <strong>Pathology integration:</strong> RT and LT pathology percentages are entered as numeric
                    values (0–100) and included as a small penalty term in the final logit.
                  </li>
                  <li>
                    <strong>Validation color coding:</strong> Input fields are color coded using distribution anchors
                    (RED below minimum, GREEN for Q1–Q3, TEAL/AMBER for Q3–max, ORANGE above maximum).
                  </li>
                  <li>
                    <strong>Placeholder guidance:</strong> Every main feature input shows the interquartile hint format
                    <code> Q1 ≤ x ≤ Q3 </code> to support realistic entries.
                  </li>
                  <li>
                    <strong>Clinical interpretation:</strong> Output remains probability-first, with calibrated risk
                    tier interpretation for preoperative counseling.
                  </li>
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pathology-faq" className="border rounded-lg px-4 mt-3">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold">FAQ for universities and treatment centers</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Q: How is pathology handled in the rebuilt CDSS?
                </p>
                <p>
                  A: Pathology is entered as explicit RT and LT percentages (0–100), aligned with the source dataset.
                  These values are integrated within a pathology-aware risk summary aligned to the finalized 5-model v2 pipeline,
                  where pathology extraction is a significant contributor to performance.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
