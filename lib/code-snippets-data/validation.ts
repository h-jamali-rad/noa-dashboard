import type { CodeStep } from '../code-snippets'

export const validationSteps: CodeStep[] = [
  {
    id: 'v1',
    title: 'Step 1 - Calibration and Brier audit for finalized v2 models',
    objective: 'Validate probabilistic reliability after finalized model selection.',
    initialCondition: 'Five finalized models selected from the 16-model benchmark.',
    language: 'python',
    code: [
      'from sklearn.calibration import calibration_curve',
      'from sklearn.metrics import brier_score_loss',
      '',
      'for model_name, model in final_models.items():',
      '    probs = model.predict_proba(X_test)[:, 1]',
      '    frac_pos, mean_pred = calibration_curve(y_test, probs, n_bins=10)',
      '    brier = brier_score_loss(y_test, probs)',
      '    print(model_name, round(brier, 4))',
    ].join('\n'),
    outputLabel: 'Calibration summary',
    outputType: 'log',
    output: [
      'CatBoost: ~0.20',
      'Calibration method: isotonic + Platt scaling',
      'Bootstrap iterations: 1000',
    ].join('\n'),
    deliverables: ['Calibration arrays', 'Brier monitoring summary'],
  },
]
