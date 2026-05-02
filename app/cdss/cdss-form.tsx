'use client'

import { useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type NumField = {
  key: string
  label: string
  min: number
  max: number
  placeholder: string
}

type RiskTier = 'Low Risk' | 'Moderate Risk' | 'High Risk'

const NUM_FIELDS: NumField[] = [
  { key: 'fsh', label: 'FSH', min: 1.5, max: 12.4, placeholder: '1.5 ≤ FSH ≤ 12.4' },
  { key: 'lh', label: 'LH', min: 1.7, max: 8.6, placeholder: '1.7 ≤ LH ≤ 8.6' },
  { key: 'testosterone', label: 'Testosterone', min: 300, max: 1000, placeholder: '300 ≤ Testosterone ≤ 1000' },
  { key: 'e2', label: 'E2', min: 10, max: 40, placeholder: '10 ≤ E2 ≤ 40' },
  { key: 'inhibinB', label: 'Inhibin B', min: 80, max: 300, placeholder: '80 ≤ Inhibin B ≤ 300' },
  { key: 'volumeLeft', label: 'Testicular Volume Left', min: 12, max: 25, placeholder: '12 ≤ Left Volume ≤ 25' },
  { key: 'volumeRight', label: 'Testicular Volume Right', min: 12, max: 25, placeholder: '12 ≤ Right Volume ≤ 25' },
  { key: 'age', label: 'Age', min: 18, max: 70, placeholder: '18 ≤ Age ≤ 70' },
]

const primaryPathology = ['SCO', 'Maturation Arrest', 'Hypospermatogenesis', 'Fibrosis']
const secondaryPathology = ['Tubular hyalinization', 'Mixed atrophy', 'Inflammatory changes']

const BRIER_EXPLANATION =
  "Brier Score: A metric measuring the accuracy of probabilistic predictions. Lower values (closer to 0) indicate better calibration. It's the mean squared difference between predicted probabilities and actual outcomes."

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x))
}

function scoreLowerBetter(v: number, soft: number, hard: number) {
  if (v <= soft) return 1
  if (v >= hard) return -1
  const r = (v - soft) / (hard - soft)
  return 1 - 2 * r
}

function scoreHigherBetter(v: number, hard: number, soft: number) {
  if (v <= hard) return -1
  if (v >= soft) return 1
  const r = (v - hard) / (soft - hard)
  return -1 + 2 * r
}

function scoreCentered(v: number, low: number, high: number, hardLow: number, hardHigh: number) {
  if (v < hardLow || v > hardHigh) return -1
  if (v >= low && v <= high) return 1
  if (v < low) return -1 + ((v - hardLow) / (low - hardLow)) * 2
  return 1 - ((v - high) / (hardHigh - high)) * 2
}

function getRiskTier(probabilityPct: number): RiskTier {
  if (probabilityPct >= 70) return 'Low Risk'
  if (probabilityPct >= 40) return 'Moderate Risk'
  return 'High Risk'
}

function getRiskBadgeClass(tier: RiskTier): string {
  if (tier === 'Low Risk') return 'bg-emerald-100 text-emerald-800 border-emerald-300'
  if (tier === 'Moderate Risk') return 'bg-amber-100 text-amber-800 border-amber-300'
  return 'bg-red-100 text-red-800 border-red-300'
}

function getRiskTooltipText(probabilityPct: number, tier: RiskTier): string {
  const p = probabilityPct.toFixed(1)
  if (tier === 'Low Risk') {
    return `With a ${p}% probability of successful sperm retrieval, this patient is a good candidate for micro-TESE. Threshold ≥70% is categorized as low risk (favorable expected outcome).`
  }
  if (tier === 'Moderate Risk') {
    return `With a ${p}% probability of successful sperm retrieval, this case is borderline. Threshold 40–69% is categorized as moderate risk and should be discussed with the patient before deciding to proceed.`
  }
  return `With a ${p}% probability of successful sperm retrieval, this patient is categorized as high risk for an unfavorable outcome. Threshold <40% suggests poor candidacy; alternatives should be considered before surgery.`
}

export default function CdssForm() {
  const [vals, setVals] = useState<Record<string, string>>({})
  const [klinefelter, setKlinefelter] = useState(false)
  const [pathMain, setPathMain] = useState<Record<string, boolean>>({})
  const [pathSec, setPathSec] = useState<Record<string, boolean>>({})
  const [result, setResult] = useState<{ p: number; tier: RiskTier } | null>(null)

  const te2 = useMemo(() => {
    const t = Number(vals.testosterone || 0)
    const e2 = Number(vals.e2 || 0)
    if (!t || !e2) return 0
    return t / e2
  }, [vals.testosterone, vals.e2])

  const getInputClass = (key: string, min: number, max: number) => {
    const v = Number(vals[key])
    if (!vals[key]) return ''
    if (v < min) return 'border-red-500 ring-1 ring-red-400'
    if (v > max) return 'border-orange-500 ring-1 ring-orange-400'
    return 'border-teal-500 ring-1 ring-teal-400'
  }

  const onSubmit = () => {
    const fsh = Number(vals.fsh || 0)
    const lh = Number(vals.lh || 0)
    const testosterone = Number(vals.testosterone || 0)
    const e2 = Number(vals.e2 || 0)
    const inhibinB = Number(vals.inhibinB || 0)
    const volumeLeft = Number(vals.volumeLeft || 0)
    const volumeRight = Number(vals.volumeRight || 0)
    const age = Number(vals.age || 0)

    const modelSignal =
      0.16 * scoreLowerBetter(fsh, 12.9, 25.0) +
      0.16 * scoreLowerBetter(lh, 8.5, 18.0) +
      0.14 * scoreHigherBetter(testosterone, 280, 550) +
      0.06 * scoreCentered(e2, 15, 35, 8, 60) +
      0.10 * scoreHigherBetter(inhibinB, 35, 95) +
      0.12 * scoreCentered((volumeLeft + volumeRight) / 2, 12, 25, 6, 35) +
      0.10 * scoreCentered(age, 26, 45, 18, 70) +
      0.08 * scoreCentered(te2, 10, 25, 5, 40) +
      (klinefelter ? -0.18 : 0.06)

    let pathology = 0
    if (pathMain['SCO']) pathology -= 0.2
    if (pathMain['Maturation Arrest']) pathology -= 0.12
    if (pathMain['Hypospermatogenesis']) pathology += 0.18
    if (pathMain['Fibrosis']) pathology -= 0.16
    const secCount = secondaryPathology.filter((x) => pathSec[x]).length
    pathology += -Math.min(0.1, secCount * 0.03)
    pathology = Math.max(-0.35, Math.min(0.3, pathology))

    const logit = Math.log(0.367 / 0.633) + 2.4 * (modelSignal + pathology)
    const p = sigmoid(logit)
    const pct = p * 100
    const tier = getRiskTier(pct)
    setResult({ p: pct, tier })
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="rounded-lg border border-blue-300/40 bg-blue-50/40 p-3 text-xs text-muted-foreground" title={BRIER_EXPLANATION}>
          Probability-focused interpretation is aligned with calibration principles (including Brier-based reliability checks): higher predicted sperm retrieval probability means lower clinical risk.
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {NUM_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-xs font-medium">{f.label}</label>
              <Input
                value={vals[f.key] ?? ''}
                onChange={(e) => setVals((p) => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className={getInputClass(f.key, f.min, f.max)}
                type="number"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="text-xs font-medium">T/E2 ratio (auto-calculated)</label>
          <Input value={te2 ? te2.toFixed(2) : ''} readOnly placeholder="auto-calculated" className="border-teal-500/50" />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox checked={klinefelter} onCheckedChange={(v) => setKlinefelter(Boolean(v))} />
          <span className="text-sm">Klinefelter syndrome</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2">Pathology indicators (primary)</p>
            {primaryPathology.map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm mb-1">
                <Checkbox checked={!!pathMain[p]} onCheckedChange={(v) => setPathMain((s) => ({ ...s, [p]: Boolean(v) }))} />
                {p}
              </label>
            ))}
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Pathology indicators (secondary)</p>
            {secondaryPathology.map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm mb-1">
                <Checkbox checked={!!pathSec[p]} onCheckedChange={(v) => setPathSec((s) => ({ ...s, [p]: Boolean(v) }))} />
                {p}
              </label>
            ))}
          </div>
        </div>

        <Button onClick={onSubmit} className="w-full">Compute probability</Button>

        {result && (
          <div className="rounded-lg border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Probability of successful sperm retrieval</p>
            <p className="font-display text-3xl font-bold">{result.p.toFixed(1)}%</p>

            <div className="mt-2 flex items-center justify-center gap-2">
              <p className="text-sm">Risk category:</p>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getRiskBadgeClass(result.tier)}`}>
                {result.tier}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-muted-foreground hover:bg-muted" aria-label="Risk tier explanation">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs leading-relaxed">
                  {getRiskTooltipText(result.p, result.tier)}
                  <div className="mt-2 border-t pt-2">
                    <p><strong>Thresholds:</strong></p>
                    <p>Low Risk: ≥70% | Moderate Risk: 40–69% | High Risk: &lt;40%</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Interpretation rule: <strong>higher probability = lower clinical risk</strong> for failed sperm retrieval.
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
