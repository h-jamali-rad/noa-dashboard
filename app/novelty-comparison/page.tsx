import BreadcrumbNav from '@/components/breadcrumb-nav'
import data from '@/data/content/extended_sections.json'
import AIAssistWrapper from '@/components/ai-assist-wrapper'

const HEADER_TIPS: Record<string, string> = {
  study: 'Study: Prior publication or current work used for methodological comparison.',
  sample: 'Sample size: Number of patients included in each study cohort.',
  models: 'Models: Machine-learning/statistical methods used in the study.',
  auc: 'AUC: Area Under the ROC Curve. Higher indicates stronger discrimination between successful and unsuccessful sperm retrieval outcomes.',
  differentiation: 'Our Differentiation: Concrete methodological or clinical advantage of the current NOA study versus prior work.',
}

export default function NoveltyComparisonPage() {
  const rows = data.novelty_comparison.comparison_table

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-6">
      <BreadcrumbNav items={[{ label: 'Novelty Comparison' }]} />
      <h1 className="font-display font-bold text-3xl tracking-tight">Novelty Comparison</h1>
      <AIAssistWrapper id="novelty-table">
      <div className="rounded-lg border bg-card p-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th title={HEADER_TIPS.study} className="text-left py-2 pr-3 cursor-help">Study</th>
              <th title={HEADER_TIPS.sample} className="text-left py-2 pr-3 cursor-help">Sample</th>
              <th title={HEADER_TIPS.models} className="text-left py-2 pr-3 cursor-help">Models</th>
              <th title={HEADER_TIPS.auc} className="text-left py-2 pr-3 cursor-help">Best AUC</th>
              <th title={HEADER_TIPS.differentiation} className="text-left py-2 pr-3 cursor-help">Our Differentiation</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((r, i) => {
              const isOurs = r.study === 'Present study'
              return (
                <tr key={i} className={isOurs ? 'bg-primary/5 border-l-4 border-l-primary' : ''}>
                  <td className={`py-2 pr-3 ${isOurs ? 'font-bold text-primary' : ''}`}>{r.study} ({r.year})</td>
                  <td className={`py-2 pr-3 ${isOurs ? 'font-bold' : ''}`}>{isOurs ? <>{String(r.sample_size)}</> : r.sample_size}</td>
                  <td className={`py-2 pr-3 ${isOurs ? 'font-bold' : ''}`}>{r.models_used}</td>
                  <td className={`py-2 pr-3 ${isOurs ? 'font-bold text-primary' : ''}`}>{r.best_auc}</td>
                  <td className={`py-2 pr-3 ${isOurs ? 'font-semibold' : ''}`}>{r.how_this_study_addresses}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      </AIAssistWrapper>

      {/* Highlighted points */}
      <AIAssistWrapper id="novelty-differentiators">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="font-display font-semibold text-base mb-3">Key Differentiators</h2>
          <ul className="space-y-2">
            {data.novelty_comparison.highlighted_points.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-mono font-semibold text-white shrink-0 mt-0.5">{i + 1}</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </AIAssistWrapper>
    </div>
  )
}
