import type { CodeStep } from '../code-snippets'

export const integrationSteps: CodeStep[] = [
  {
    id: 'i1',
    title: 'Step 1 - Aggregate validated outputs into a dashboard-ready manifest',
    objective:
      'Stitch preprocessing, training, validation, XAI, and literature outputs into one inventory consumable by the Next.js dashboard.',
    initialCondition:
      'Authoritative metrics already locked (2,413 patients; 45 features; 18 pathology features; CatBoost AUC 0.8306, 95% CI 0.823–0.845).',
    language: 'python',
    code: [
      "import json, pathlib",
      "from datetime import datetime",
      '',
      "manifest = {",
      "    'generated_at': datetime.utcnow().isoformat(),",
      "    'authoritative_metrics': {",
      "        'patients': 2413,",
      "        'features_total': 45,",
      "        'pathology_features': 18,",
      "        'models_tested': 16,",
      "        'models_finalized_v2': 5,",
      "        'best_model': 'CatBoost',",
      "        'best_auc': 0.8306,",
      "        'best_auc_ci': '0.823–0.845',",
      "    },",
      "}",
      "pathlib.Path('data/asset_records.json').write_text(json.dumps(manifest, indent=2))",
      "print('Integration manifest written with authoritative v2 metrics')",
    ].join('\n'),
    outputLabel: 'Integration log',
    outputType: 'log',
    output: [
      'Integration manifest written with authoritative v2 metrics',
      'patients: 2,413',
      'features: 45 (pathology: 18)',
      'models: 16 tested, 5 finalized',
      'best model: CatBoost (AUC 0.8306; 95% CI 0.823–0.845)',
    ].join('\n'),
    deliverables: [
      'Unified manifest with authoritative metrics',
      'Cross-page metric consistency lock',
      'Final handoff artifacts for dashboard presentation',
    ],
  },
]
