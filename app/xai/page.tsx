import BreadcrumbNav from '@/components/breadcrumb-nav'

const TOP_MODELS = [
  { model: 'CatBoost', auc: '0.8306', ci: '0.823–0.845', accuracy: '0.770', sensitivity: '0.678', specificity: '0.823', f1: '0.684' },
  { model: 'XGBoost', auc: '0.8214', ci: '0.814–0.835', accuracy: '0.758', sensitivity: '0.669', specificity: '0.809', f1: '0.669' },
  { model: 'LightGBM', auc: '0.8213', ci: '0.809–0.836', accuracy: '0.755', sensitivity: '0.681', specificity: '0.798', f1: '0.671' },
  { model: 'RandomForest', auc: '0.8157', ci: '0.809–0.829', accuracy: '0.747', sensitivity: '0.694', specificity: '0.778', f1: '0.669' },
  { model: 'LogisticRegression', auc: '0.7926', ci: '0.777–0.804', accuracy: '0.735', sensitivity: '0.659', specificity: '0.779', f1: '0.646' },
]

const PATHOLOGY_FEATURE_GROUPS = [
  'Severity scores: RT_severity, LT_severity',
  'SCO percentages: RT_SCO_pct, LT_SCO_pct',
  'Hypospermatogenesis: RT_/LT_ percentages (standard + severe)',
  'Maturation Arrest stages (Spermatogonial, Spermatocytic, ImmatureRound, Elongated) for RT and LT',
  'CSTH percentages: RT_CSTH_pct, LT_CSTH_pct',
]

export default function XaiPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-6">
      <BreadcrumbNav items={[{ label: 'XAI' }]} />
      <h1 className="font-display font-bold text-3xl tracking-tight">Explainable AI (XAI) — v2 Pathology-Integrated Summary</h1>

      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Authoritative dataset summary: 2,413 patients, 45 total features, and 18 pathology features extracted bilaterally (RT_/LT_).
      </div>

      <div className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold text-lg mb-3">Final v2 model comparison (5 finalized models)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-2">Model</th>
                <th className="text-left py-2 pr-2">AUC</th>
                <th className="text-left py-2 pr-2">95% CI</th>
                <th className="text-left py-2 pr-2">Accuracy</th>
                <th className="text-left py-2 pr-2">Sensitivity</th>
                <th className="text-left py-2 pr-2">Specificity</th>
                <th className="text-left py-2">F1</th>
              </tr>
            </thead>
            <tbody>
              {TOP_MODELS.map((row) => (
                <tr key={row.model} className="border-b last:border-b-0">
                  <td className="py-2 pr-2 font-medium">{row.model}</td>
                  <td className="py-2 pr-2">{row.auc}</td>
                  <td className="py-2 pr-2">{row.ci}</td>
                  <td className="py-2 pr-2">{row.accuracy}</td>
                  <td className="py-2 pr-2">{row.sensitivity}</td>
                  <td className="py-2 pr-2">{row.specificity}</td>
                  <td className="py-2">{row.f1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-2 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">Best model:</strong> CatBoost with AUC 0.8306 (95% CI 0.823–0.845).
        </p>
        <p>
          <strong className="text-foreground">Model selection path:</strong> 16 models tested in the benchmark, then 5 retained in the final v2 pathology-integrated pipeline.
        </p>
        <p>
          <strong className="text-foreground">Pathology signal:</strong> 18 pathology features were extracted from free-text reports and treated as a significant component of the final pipeline.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold text-lg mb-3">Pathology feature groups used in v2</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
          {PATHOLOGY_FEATURE_GROUPS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
