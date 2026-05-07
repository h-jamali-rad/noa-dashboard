import type { CodeStep } from '../code-snippets'

export const xaiSteps: CodeStep[] = [
  {
    id: 'x1',
    title: 'Step 1 - SHAP global importance on finalized CatBoost v2',
    objective: 'Generate transparent feature ranking for the best finalized model.',
    initialCondition: 'Best model fixed as CatBoost (AUC 0.8306; 95% CI 0.823–0.845).',
    language: 'python',
    code: [
      'import shap',
      'explainer = shap.TreeExplainer(catboost_model)',
      'shap_values = explainer.shap_values(X_eval)',
      'shap.summary_plot(shap_values, X_eval, plot_type="bar", max_display=10)',
    ].join('\n'),
    outputLabel: 'Top SHAP features',
    outputType: 'log',
    output: [
      'RT_Severe_Hypospermatogenesis_pct: top signal',
      'Pathology-derived features dominate the ranking',
      '17 of top 25 predictors are pathology-derived',
    ].join('\n'),
    deliverables: ['SHAP global plot', 'Local explanation cases', 'Pathology-focused interpretation notes'],
  },
]
