import type { CodeStep } from '../code-snippets'

export const xaiSteps: CodeStep[] = [
  {
    id: 'x1',
    title: 'Step 1 - SHAP global importance on corrected LightGBM',
    objective: 'Generate transparent global feature ranking from the corrected best model.',
    initialCondition: 'Best model fixed as LightGBM (nested-CV AUC 0.7327 ± 0.0057).',
    language: 'python',
    code: [
      'import shap',
      'explainer = shap.TreeExplainer(lightgbm_model)',
      'shap_values = explainer.shap_values(X_eval)',
      'shap.summary_plot(shap_values, X_eval, plot_type="bar", max_display=10)',
    ].join('\n'),
    outputLabel: 'Top SHAP features',
    outputType: 'log',
    output: [
      'LH: 0.3170',
      'Partner-age covariate (excluded): 0.3011',
      'Age: 0.2701',
      'FSH: 0.2503',
      'Testosterone_levels: 0.2118',
    ].join('\n'),
    deliverables: ['shap_bar_LightGBM.png', 'shap_beeswarm_LightGBM.png', 'Global interpretation notes'],
  },
]
