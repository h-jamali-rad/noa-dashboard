import BreadcrumbNav from '@/components/breadcrumb-nav'
import ThesisClient from './thesis-client'
import thesisData from '@/data/thesis_content.json'

export const metadata = {
  title: 'Thesis — NOA microTESE Dashboard',
  description:
    'Full 5-chapter PhD thesis on machine-learning prediction of micro-TESE outcomes in non-obstructive azoospermia.',
}

export default function ThesisPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-8">
      <BreadcrumbNav items={[{ label: 'Thesis' }]} />

      <header className="space-y-2">
        <h1 className="font-display font-bold text-3xl tracking-tight">
          PhD Thesis
        </h1>
        <p className="text-sm text-muted-foreground">
          Machine Learning–Based Prediction of Microdissection Testicular Sperm Extraction
          Outcomes in Non-Obstructive Azoospermia — Full dissertation with all 5 chapters,
          abstracts, and references.
        </p>
      </header>

      <ThesisClient data={thesisData as any} />
    </div>
  )
}
