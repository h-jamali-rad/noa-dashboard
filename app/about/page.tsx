import BreadcrumbNav from '@/components/breadcrumb-nav'

export default function AboutPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-6">
      <BreadcrumbNav items={[{ label: 'About' }]} />
      <h1 className="font-display font-bold text-3xl tracking-tight">About this project</h1>
      <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground space-y-3">
        <p>
          This dashboard supports Hossein Jamalirad&apos;s PhD research in Medical Informatics at MUMS, focused on
          preoperative prediction of sperm retrieval success in NOA patients undergoing microTESE.
        </p>
        <p>
          The research benchmark evaluates 16 ML models, then finalizes 5 models in the v2 pathology-integrated pipeline.
          The best performer is CatBoost (AUC 0.8306; 95% CI 0.823–0.845), supported by calibration, decision-curve analysis,
          and explainability.
        </p>
        <p>
          All pipeline outputs shown here were produced by AI agents trained by Hossein Jamalirad.
        </p>
      </div>
    </div>
  )
}
