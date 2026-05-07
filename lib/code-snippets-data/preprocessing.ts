import type { CodeStep } from '../code-snippets'

export const preprocessingSteps: CodeStep[] = [
  {
    id: 'p1',
    title: 'Step 1 - Confirm analytical dataset and feature inventory',
    objective: 'Lock authoritative cohort counts and feature dimensions before modeling.',
    initialCondition: 'Authoritative summary available from validated research artifacts.',
    language: 'python',
    code: [
      'dataset = {',
      "  'patients': 2413,",
      "  'features_total': 45,",
      "  'features_numeric': 37,",
      "  'features_categorical': 8,",
      "  'pathology_features': 18,",
      "  'outcome_positive': 886,",
      "  'outcome_negative': 1527,",
      '}',
      'print(dataset)',
    ].join('\n'),
    outputLabel: 'Dataset integrity summary',
    outputType: 'log',
    output: [
      "patients: 2,413",
      "features: 45 (37 numeric + 8 categorical)",
      "pathology features: 18",
      "outcome prevalence: 36.7% (886/1527)",
    ].join('\n'),
    deliverables: ['Authoritative cohort lock', 'Feature-count lock', 'Outcome-count lock'],
  },
]
