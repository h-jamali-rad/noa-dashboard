import fs from 'node:fs'
import path from 'node:path'
import BreadcrumbNav from '@/components/breadcrumb-nav'

const SHAP_CANDIDATE_PATHS = [
  path.join(process.cwd(), 'public/data/shap_summary.json'),
  path.join(process.cwd(), 'data/shap_summary.json'),
]

const FEATURE_IMPORTANCE_CANDIDATE_PATHS = [
  path.join(process.cwd(), 'public/data/feature_importance.json'),
  path.join(process.cwd(), 'data/feature_importance.json'),
]

const TOP14_FEATURES = [
  'LH',
  'Age',
  'FSH',
  'Testosterone_levels',
  'Body_Weight',
  'Sakamoto_LT/mL',
  'BMI',
  'Height',
  'RT_XYZ_Sono',
  'Testicular_volume_LT',
  'Seminal_plasma_pH',
  'Testicular_volume_RT',
  'LT_XYZ_Sono',
  'E2',
] as const

const SHAP_KEY_MAP: Record<(typeof TOP14_FEATURES)[number], string> = {
  LH: 'LH',
  Age: 'Age',
  FSH: 'FSH',
  Testosterone_levels: 'Testosterone_levels',
  Body_Weight: 'Boby_Weight',
  'Sakamoto_LT/mL': 'Sakamoto_LT_mL',
  BMI: 'BMI',
  Height: 'Hieght',
  RT_XYZ_Sono: 'RT_XYZ__Sono_',
  Testicular_volume_LT: 'Testicular_volume_LT__Guess_',
  Seminal_plasma_pH: 'Seminal_plasma_pH',
  Testicular_volume_RT: 'Testicular_volume_RT__Guess_',
  LT_XYZ_Sono: 'LT_XYZ__Sono_',
  E2: 'E2',
}

type ShapSummary = {
  global?: {
    global_shap_importance?: Record<string, number>
  }
}

type FeatureImportance = {
  LightGBM?: Record<string, number>
}

function loadJsonFromCandidates<T>(candidates: string[], label: string): { parsed: T; source: string } {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const raw = fs.readFileSync(candidate, 'utf-8')
      return { parsed: JSON.parse(raw) as T, source: candidate }
    }
  }

  throw new Error(`${label} not found in any configured paths: ${candidates.join(', ')}`)
}

function loadShapSummary(): { shap: Record<string, number>; source: string } {
  const { parsed, source } = loadJsonFromCandidates<ShapSummary>(SHAP_CANDIDATE_PATHS, 'SHAP summary')
  return {
    shap: parsed.global?.global_shap_importance ?? {},
    source,
  }
}

function loadFeatureImportance(): { lightgbm: Record<string, number>; source: string } {
  const { parsed, source } = loadJsonFromCandidates<FeatureImportance>(
    FEATURE_IMPORTANCE_CANDIDATE_PATHS,
    'Feature importance summary',
  )

  return {
    lightgbm: parsed.LightGBM ?? {},
    source,
  }
}

export default function XaiPage() {
  const { shap, source } = loadShapSummary()
  const { lightgbm, source: fiSource } = loadFeatureImportance()

  const top14 = TOP14_FEATURES.map((feature) => {
    const rawKey = SHAP_KEY_MAP[feature]
    return {
      feature,
      value: Number(shap[rawKey] ?? 0),
    }
  })

  const dominant = top14[0]
  const weakest = top14[top14.length - 1]
  const pathologyRt = Number(shap.Pathology_RT ?? 0)
  const pathologyLt = Number(shap.Pathology_LT ?? 0)
  const topLightGbmFeature = Object.entries(lightgbm).sort((a, b) => Number(b[1]) - Number(a[1]))[0]

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-screen-2xl mx-auto space-y-6">
      <BreadcrumbNav items={[{ label: 'XAI' }]} />
      <h1 className="font-display font-bold text-3xl tracking-tight">Explainable AI (XAI) — LightGBM SHAP Summary</h1>

      <div className="rounded-lg border bg-card p-4 text-xs text-muted-foreground space-y-1">
        <p>
          SHAP source: <code>{source}</code>
        </p>
        <p>
          Feature-importance source: <code>{fiSource}</code>
        </p>
      </div>

      <div className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold text-lg mb-3">Top 14 SHAP features (actual values)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-2">Rank</th>
                <th className="text-left py-2 pr-2">Feature</th>
                <th className="text-right py-2">Mean |SHAP|</th>
              </tr>
            </thead>
            <tbody>
              {top14.map((row, idx) => (
                <tr key={row.feature} className="border-b last:border-b-0">
                  <td className="py-2 pr-2">{idx + 1}</td>
                  <td className="py-2 pr-2">{row.feature}</td>
                  <td className="py-2 text-right font-mono">{row.value.toFixed(6)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-2 text-sm text-muted-foreground">
        <p>
          In this LightGBM SHAP profile, the largest global signal is <strong className="text-foreground">{dominant.feature}</strong>{' '}
          ({dominant.value.toFixed(4)}), followed by age and gonadotropin/hormonal variables.
        </p>
        <p>
          The selected top-14 set keeps clinically central endocrine and testicular-volume/sono descriptors; the smallest
          contribution within this set is <strong className="text-foreground">{weakest.feature}</strong> ({weakest.value.toFixed(4)}).
        </p>
        <p>
          Pathology summary variables are near-zero in the source SHAP file (Pathology_RT={pathologyRt.toFixed(4)}, Pathology_LT={pathologyLt.toFixed(4)}),
          supporting a secondary, context-only role versus the main top-14 predictors.
        </p>
        {topLightGbmFeature ? (
          <p>
            LightGBM native split-count leader from bundled <code>feature_importance.json</code>: <strong className="text-foreground">{topLightGbmFeature[0]}</strong>{' '}
            ({Number(topLightGbmFeature[1]).toLocaleString()}).
          </p>
        ) : null}
      </div>
    </div>
  )
}
