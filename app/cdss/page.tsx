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
                  (e.g., SCO 45%, Maturation Arrest 30%). In this dashboard CDSS, pathology is entered as
                  checkboxes for practical clinical workflow.
                </p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <strong>Baseline model context:</strong> The trained statistical model is based on preoperative
                    data and counseling-stage variables.
                  </li>
                  <li>
                    <strong>Feasibility scenario from thesis workflow:</strong> In real practice, pathology patterns can
                    be clarified during the operative pathway. Therefore, checkbox inputs are used as a practical
                    clinician interface that can support decision refinement when new pathology information becomes
                    available.
                  </li>
                  <li>
                    <strong>Preoperative data limitation:</strong> Before micro-TESE, exact percentage pathology values
                    are often unavailable; clinicians usually have presence/absence information from prior reports.
                  </li>
                  <li>
                    <strong>Feature importance finding:</strong> In the final LightGBM analysis, pathology variables
                    (SCO, Maturation Arrest, Hypospermatogenesis, Fibrosis) had near-zero feature importance.
                  </li>
                  <li>
                    <strong>Why pathology is still kept in CDSS:</strong> They remain visible for clinical completeness
                    and center-level documentation, because CDSS here is a heuristic bridge combining model evidence
                    and clinical judgment.
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
                  Q: Why is pathology entered as checkbox in CDSS while the dataset stores pathology as percentages?
                </p>
                <p>
                  A: The CDSS is designed for real-world clinical use where exact quantitative pathology percentages
                  are not always available at first decision time. Clinicians more commonly know whether a pattern
                  (e.g., SCO) is present. Also, the final LightGBM model assigned near-zero importance to pathology
                  variables, so keeping checkbox-style pathology in CDSS serves documentation and clinical context,
                  not dominant model signal.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
