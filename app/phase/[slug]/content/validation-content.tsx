'use client'

import { StatCard } from '@/components/stat-card'
import { ShieldCheck, Trophy, Layers, Activity } from 'lucide-react'

const BRIER_EXPLANATION =
  "Brier Score: A metric measuring the accuracy of probabilistic predictions. Lower values (closer to 0) indicate better calibration. It's the mean squared difference between predicted probabilities and actual outcomes."

export default function ValidationContent({ data, accent }: { data: any; accent: string }) {
  const brier = data?.calibration?.brier ?? {}
  const dca = data?.dca ?? {}

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Validation Design" value="Nested CV" hint="Stratified split + bootstrap" icon={ShieldCheck} accent={accent} />
        <StatCard label="Bootstrap" value={String(data?.bootstrap ?? '1000 iterations')} hint="Top models" icon={Activity} accent={accent} />
        <StatCard label="Clinical Utility" value="DCA" hint="Treat-all/none compared" icon={Layers} accent={accent} />
        <StatCard label="Best Calibration" value="Brier ≈ 0.20" hint={`CatBoost ${Number(brier?.CatBoost ?? 0.20).toFixed(4)}`} icon={Trophy} accent={accent} />
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 title={BRIER_EXPLANATION} className="font-display font-semibold text-base mb-2 cursor-help">Calibration summary (Brier score)</h3>
        <p title={BRIER_EXPLANATION} className="text-xs text-muted-foreground mb-3 cursor-help">Lower is better. Hover for definition.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          {Object.entries(brier).map(([model, value]) => (
            <div key={model} className="rounded-md bg-muted/40 p-3">
              <p className="font-medium">{model}</p>
              <p title={BRIER_EXPLANATION} className="text-muted-foreground text-xs cursor-help">Brier Score: {Number(value).toFixed(4)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="font-display font-semibold text-base mb-2">Decision Curve Analysis</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{dca?.clinical_utility}</p>
        <p className="text-xs text-muted-foreground mt-2">{data?.multiple_comparison}</p>
      </div>
    </div>
  )
}
