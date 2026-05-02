'use client'

import { StatCard } from '@/components/stat-card'
import { BrainCircuit, Layers, Target, Sparkles } from 'lucide-react'

const PARTNER_AGE_NOTE =
  'Partner Age was excluded from the final model as it lacks biological plausibility for predicting sperm retrieval success in NOA patients.'

export default function XaiContent({ data, accent }: { data: any; accent: string }) {
  const top5 = data?.top5_features ?? []
  const shapTop10 = data?.global_shap_top10 ?? {}
  const fiTop10 = data?.feature_importance_top10_lightgbm ?? {}

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="XAI Method" value="SHAP" hint={data?.method ?? 'TreeExplainer'} icon={BrainCircuit} accent={accent} />
        <StatCard label="Best Model" value="LightGBM" hint="Corrected pipeline" icon={Target} accent={accent} />
        <StatCard label="Local Cases" value={String(data?.n_local_cases ?? 5)} hint="Case-level interpretation" icon={Sparkles} accent={accent} />
        <StatCard label="Top Predictors" value={String(top5.length)} hint="Global ranking" icon={Layers} accent={accent} />
      </div>

      <div className="rounded-lg border border-amber-300/50 bg-amber-50/40 p-4 text-sm text-foreground/90">
        <p className="font-medium">Clinical plausibility constraint</p>
        <p className="mt-1 text-xs text-muted-foreground">{PARTNER_AGE_NOTE}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display font-semibold text-base mb-3">Top-5 SHAP features</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          {top5.map((f: string) => (
            <div key={f} className="rounded-md bg-muted/40 px-3 py-2">{f}</div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display font-semibold text-base mb-3">Global SHAP top-10</h3>
          <ul className="space-y-1.5 text-sm">
            {Object.entries(shapTop10).slice(0, 10).map(([k, v]) => (
              <li key={k} className="flex justify-between gap-3"><span>{k}</span><span className="font-mono text-xs">{Number(v).toFixed(4)}</span></li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display font-semibold text-base mb-3">LightGBM feature-importance top-10</h3>
          <ul className="space-y-1.5 text-sm">
            {Object.entries(fiTop10).slice(0, 10).map(([k, v]) => (
              <li key={k} className="flex justify-between gap-3"><span>{k}</span><span className="font-mono text-xs">{v as number}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
