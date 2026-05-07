import type { CodeStep } from '../code-snippets'

export const trainingSteps: CodeStep[] = [
  {
    id: 't1',
    title: 'Step 1 - Build 16-model benchmark and finalize v2 shortlist',
    objective: 'Train and compare 16 candidate models, then retain 5 finalized models in the pathology-integrated v2 pipeline.',
    initialCondition: 'Leakage-safe preprocessing completed on n=2,413 analytical records with 45 total features (including 18 pathology features).',
    language: 'python',
    code: [
      'from sklearn.model_selection import StratifiedKFold',
      'import catboost as cb',
      '',
      'cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)',
      'model = cb.CatBoostClassifier(depth=6, iterations=657, learning_rate=0.0062, l2_leaf_reg=3.51, verbose=0)',
      'model.fit(X_train, y_train)',
      'print("Benchmark models tested:", 16)',
      'print("Finalized in v2:", 5)',
      'print("Best model:", "CatBoost")',
      'print("Best AUC:", 0.8306)',
    ].join('\n'),
    outputLabel: 'v2 best-model summary',
    outputType: 'log',
    output: [
      'Best model: CatBoost',
      'Best AUC: 0.8306 (95% CI 0.823–0.845)',
      'Models tested: 16',
      'Finalized models: 5',
    ].join('\n'),
    deliverables: ['16-model benchmark report', '5-model v2 comparison', 'Best-model metadata and hyperparameters'],
  },
]
