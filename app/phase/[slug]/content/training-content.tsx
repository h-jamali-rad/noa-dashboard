'use client'

import { StatCard } from '@/components/stat-card'
import { Cpu, Trophy, FlaskConical, GitBranch } from 'lucide-react'

const HEADER_TIPS: Record<string, string> = {
  rank: 'Rank: Model order based on overall comparative performance in this benchmark.',
  model: 'Model: The machine-learning algorithm evaluated for sperm retrieval prediction.',
  auc: 'AUC: Area Under the ROC Curve. Higher values indicate better discrimination between successful and unsuccessful sperm retrieval; 1.0 is perfect, 0.5 is random.',
  accuracy: 'Accuracy: Overall proportion of correctly classified cases. Can be affected by class imbalance.',
  sensitivity: 'Sensitivity (Recall): Proportion of successful sperm retrieval cases correctly identified by the model.',
  specificity: 'Specificity: Proportion of unsuccessful sperm retrieval cases correctly identified by the model.',
  f1: 'F1-Score: Harmonic mean of precision and recall; useful when balancing false positives and false negatives.',
  brier: "Brier Score: A metric measuring the accuracy of probabilistic predictions. Lower values (closer to 0) indicate better calibration. It's the mean squared difference between predicted probabilities and actual outcomes.",
}

export default function TrainingContent({ data, accent }: { data: any; accent: string }) {
  const models = data?.models ?? []
  const table = data?.model_comparison_table ?? []
  const best = data?.best_model ?? 'CatBoost'
  const bestAuc = data?.best_auc ?? '0.8306 (95% CI 0.823–0.845)'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Models Tested" value={String(data?.n_models ?? 16)} hint="Paper 1 benchmark" icon={GitBranch} accent={accent} />
        <StatCard label="Finalized in v2" value={String(data?.n_final_models ?? 5)} hint="Pathology-integrated pipeline" icon={FlaskConical} accent={accent} />
        <StatCard label="Best Model" value={best} hint="v2 final comparison" icon={Trophy} accent={accent} />
        <StatCard label="Best AUC" value={String(bestAuc)} hint="CatBoost performance" icon={Cpu} accent={accent} />
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display font-semibold text-base mb-3">Model roster ({models.length})</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          {models.map((m: string) => (
            <div key={m} className="rounded-md bg-muted/40 px-3 py-2">{m}</div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display font-semibold text-base mb-3">Top model comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th title={HEADER_TIPS.rank} className="text-left py-2 pr-4 font-semibold cursor-help">Rank</th>
                <th title={HEADER_TIPS.model} className="text-left py-2 pr-4 font-semibold cursor-help">Model</th>
                <th title={HEADER_TIPS.auc} className="text-left py-2 pr-4 font-semibold cursor-help">AUC</th>
                <th title={HEADER_TIPS.accuracy} className="text-left py-2 pr-4 font-semibold cursor-help">Accuracy</th>
                <th title={HEADER_TIPS.sensitivity} className="text-left py-2 pr-4 font-semibold cursor-help">Sensitivity</th>
                <th title={HEADER_TIPS.specificity} className="text-left py-2 pr-4 font-semibold cursor-help">Specificity</th>
                <th title={HEADER_TIPS.f1} className="text-left py-2 pr-4 font-semibold cursor-help">F1-Score</th>
                <th title={HEADER_TIPS.brier} className="text-left py-2 pr-4 font-semibold cursor-help">Brier Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {table.slice(0, 10).map((row: any) => (
                <tr key={row.rank}>
                  <td className="py-2 pr-4">{row.rank}</td>
                  <td className="py-2 pr-4">{row.model_name}</td>
                  <td className="py-2 pr-4">{Number(row.auc_mean).toFixed(4)}</td>
                  <td className="py-2 pr-4">{Number(row.accuracy_mean).toFixed(4)}</td>
                  <td className="py-2 pr-4">{Number(row.sensitivity_mean).toFixed(4)}</td>
                  <td className="py-2 pr-4">{Number(row.specificity_mean).toFixed(4)}</td>
                  <td className="py-2 pr-4">{Number(row.f1_mean).toFixed(4)}</td>
                  <td className="py-2 pr-4">{row.brier_score == null ? '—' : Number(row.brier_score).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
