import BreadcrumbNav from '@/components/breadcrumb-nav'
import ModelShowcase from '@/components/model-showcase'

export const metadata = {
  title: 'Model Showcase — NOA microTESE Dashboard',
  description:
    'Interactive showcase of 16 ML architectures evaluated for micro-TESE outcome prediction. Compare AUC, accuracy, F1, and more.',
}

export default function ModelShowcasePage() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-8">
      <BreadcrumbNav items={[{ label: 'Model Showcase' }]} />

      <header className="space-y-2">
        <h1 className="font-display font-bold text-3xl tracking-tight">
          Model Showcase
        </h1>
        <p className="text-sm text-muted-foreground">
          Interactive gallery of all 16 machine-learning architectures evaluated
          during the training phase. Filter by category, compare key metrics, and
          explore each model's strengths.
        </p>
      </header>

      <ModelShowcase />
    </div>
  )
}
