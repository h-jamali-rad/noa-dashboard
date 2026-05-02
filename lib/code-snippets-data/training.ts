import type { CodeStep } from '../code-snippets'

export const trainingSteps: CodeStep[] = [
  {
    id: 't1',
    title: 'Step 1 - Build corrected 16-model benchmark',
    objective: 'Train and compare 16 candidate models under the corrected post-defense protocol.',
    initialCondition: 'Leakage-safe preprocessing completed on n=2,413 analytical records.',
    language: 'python',
    code: [
      'from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold',
      'from sklearn.pipeline import Pipeline',
      'from sklearn.preprocessing import RobustScaler',
      'from lightgbm import LGBMClassifier',
      'import pandas as pd',
      '',
      'cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)',
      "pipe = Pipeline([('scaler', RobustScaler()), ('clf', LGBMClassifier(random_state=42))])",
      'param_dist = {',
      "  'clf__n_estimators': [80, 100, 116, 140],",
      "  'clf__max_depth': [3, 4, 5, 6],",
      "  'clf__num_leaves': [31, 45, 66, 95],",
      "  'clf__learning_rate': [0.01, 0.02, 0.032, 0.05],",
      '}',
      'search = RandomizedSearchCV(pipe, param_dist, n_iter=50, scoring="roc_auc", cv=cv, random_state=42)',
      'search.fit(X_train, y_train)',
      'print(search.best_score_, search.best_params_)',
    ].join('\n'),
    outputLabel: 'Corrected best-model summary',
    outputType: 'log',
    output: [
      'Best model: LightGBM',
      'Nested CV AUC: 0.7327 ± 0.0057',
      'Models evaluated: 16',
    ].join('\n'),
    deliverables: ['Corrected model rankings', 'Best hyperparameters', 'Nested-CV performance table'],
  },
]
