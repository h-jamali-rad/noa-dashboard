'use client'

import { StatCard } from '@/components/stat-card'
import { BrainCircuit, Layers, Target, Sparkles } from 'lucide-react'
import AIAssistWrapper from '@/components/ai-assist-wrapper'

const PARTNER_AGE_NOTE =
  'Final v2 explainability focuses on pathology-aware signals, with 18 bilateral pathology features integrated into interpretation.'

export default function XaiContent({ data, accent }: { data: any; accent: string }) {
  const top5 = data?.top5_features ?? []
  const shapTop10 = data?.global_shap_top10 ?? {}
  const fiTop10 = data?.feature_importance_top10_catboost ?? {}

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AIAssistWrapper id="xai-stat-method">
          <StatCard label="XAI Method" value="SHAP" hint={data?.method ?? 'TreeExplainer'} icon={BrainCircuit} accent={accent} />
        </AIAssistWrapper>
        <AIAssistWrapper id="xai-stat-best-model">
          <StatCard label="Best Model" value="CatBoost" hint="AUC 0.8306 (v2)" icon={Target} accent={accent} />
        </AIAssistWrapper>
        <AIAssistWrapper id="xai-stat-pathology">
          <StatCard label="Pathology Features" value="18" hint="Bilateral RT_/LT_ extraction" icon={Sparkles} accent={accent} />
        </AIAssistWrapper>
        <AIAssistWrapper id="xai-stat-top-predictors">
          <StatCard label="Top Predictors" value={String(top5.length)} hint="Pathology-dominant ranking" icon={Layers} accent={accent} />
        </AIAssistWrapper>
      </div>

      <div className="rounded-lg border border-amber-300/50 bg-amber-50/40 p-4 text-sm text-foreground/90">
        <p className="font-medium">Clinical plausibility constraint</p>
        <p className="mt-1 text-xs text-muted-foreground">{PARTNER_AGE_NOTE}</p>
      </div>

      <AIAssistWrapper id="xai-top5-features">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display font-semibold text-base mb-3">Top-5 SHAP features</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          {top5.map((f: string) => (
            <div key={f} className="rounded-md bg-muted/40 px-3 py-2">{f}</div>
          ))}
        </div>
      </div>
      </AIAssistWrapper>

      <div className="grid lg:grid-cols-2 gap-5">
        <AIAssistWrapper id="xai-shap-top10">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display font-semibold text-base mb-3">Global SHAP top-10</h3>
          <ul className="space-y-1.5 text-sm">
            {Object.entries(shapTop10).slice(0, 10).map(([k, v]) => (
              <li key={k} className="flex justify-between gap-3"><span>{k}</span><span className="font-mono text-xs">{Number(v).toFixed(4)}</span></li>
            ))}
          </ul>
        </div>
        </AIAssistWrapper>

        <AIAssistWrapper id="xai-catboost-fi-top10">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="font-display font-semibold text-base mb-3">CatBoost feature-importance top-10</h3>
          <ul className="space-y-1.5 text-sm">
            {Object.entries(fiTop10).slice(0, 10).map(([k, v]) => (
              <li key={k} className="flex justify-between gap-3"><span>{k}</span><span className="font-mono text-xs">{v as number}</span></li>
            ))}
          </ul>
        </div>
        </AIAssistWrapper>
      </div>
    </div>
  )
}
