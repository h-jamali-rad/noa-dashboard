export interface AgentNode {
  id: string
  name: string
  shortName: string
  description: string
  designReason: string
  color: string
  inputs: string[]
  outputs: string[]
  connections: string[]
  pipelineRole: string
}

export const ORCHESTRATOR: AgentNode = {
  id: 'orchestrator',
  name: "HJR's Deep Agent — Master Orchestrator",
  shortName: 'Master Orchestrator',
  description: 'Central DAG controller that manages all agents, schedules tasks, handles inter-agent communication, and maintains pipeline state across the entire research workflow.',
  designReason: 'Designed by HJR to coordinate the complex multi-agent pipeline, ensuring reproducible and deterministic execution of all research phases from data preprocessing to final dissertation assembly.',
  color: '#0e7490',
  inputs: ['Research objectives', 'Configuration parameters', 'Human-in-the-loop directives'],
  outputs: ['Task assignments', 'Pipeline state', 'Execution logs', 'Quality reports'],
  connections: ['All agents'],
  pipelineRole: 'Serves as the central nervous system of the entire research pipeline, orchestrating DAG-based execution with dependency resolution, retry logic, and cross-agent state management.',
}

export const AGENTS: AgentNode[] = [
  {
    id: 'preprocessing',
    name: 'Data Preprocessing Agent',
    shortName: 'Preprocessing',
    description: 'Handles data cleaning, feature engineering, missing value imputation, and dataset preparation. Processes the raw 2,450-patient cohort into the analytical 2,413-patient dataset.',
    designReason: 'Designed by HJR to automate the labor-intensive data cleaning pipeline, ensuring consistent preprocessing across all experimental runs and eliminating manual data handling errors.',
    color: '#06b6d4',
    inputs: ['Raw clinical dataset (2,450 records)', 'Feature definitions', 'Imputation strategy configs'],
    outputs: ['Clean analytical dataset (2,413)', '73 engineered features', 'Data quality report'],
    connections: ['orchestrator', 'encoding', 'training'],
    pipelineRole: 'First agent in the pipeline — transforms raw clinical data into ML-ready features with documented provenance.',
  },
  {
    id: 'encoding',
    name: 'Pathology Encoding Agent',
    shortName: 'Pathology Encoding',
    description: 'Systematically evaluates 16 encoding strategies for sparse histopathological features, solving the data collapse problem that limited v1 performance.',
    designReason: 'Designed by HJR to systematically evaluate 16 encoding strategies for sparse histopathological features, solving the data collapse problem that limited v1 performance.',
    color: '#8b5cf6',
    inputs: ['Categorical pathology features', 'Encoding strategy library', 'Target variable'],
    outputs: ['16 encoded feature sets', 'Encoding performance matrix', 'Optimal encoding selection'],
    connections: ['orchestrator', 'preprocessing', 'training'],
    pipelineRole: 'Bridges preprocessing and training by finding the optimal numerical representation for categorical pathology data.',
  },
  {
    id: 'training',
    name: 'Model Training Agent',
    shortName: 'Model Training',
    description: 'Trains 5 ML models: CatBoost, LightGBM, XGBoost, RandomForest, and GradientBoosting. Implements hyperparameter optimization and ensemble strategies.',
    designReason: 'Designed by HJR to automate parallel model training with systematic hyperparameter search, enabling fair comparison across 5 gradient boosting and ensemble algorithms.',
    color: '#0ea5e9',
    inputs: ['Encoded feature sets', 'Hyperparameter search spaces', 'Training configuration'],
    outputs: ['5 trained models', 'Training metrics', 'Best model: LightGBM (AUC 0.7327)'],
    connections: ['orchestrator', 'encoding', 'validation', 'xai'],
    pipelineRole: 'Core ML engine — produces the trained models that power the CDSS prediction system.',
  },
  {
    id: 'validation',
    name: 'Validation Agent',
    shortName: 'Validation',
    description: 'Performs cross-validation, bootstrap confidence intervals, calibration analysis, and reproducibility verification across all trained models.',
    designReason: 'Designed by HJR to ensure rigorous statistical validation, including corrected benchmarks and calibration curves — critical for clinical credibility.',
    color: '#10b981',
    inputs: ['Trained models', 'Test datasets', 'Validation protocols'],
    outputs: ['CV results', 'Bootstrap CIs', 'Calibration plots', 'DCA curves'],
    connections: ['orchestrator', 'training', 'xai'],
    pipelineRole: 'Quality gate — no model proceeds to clinical deployment without passing validation checks.',
  },
  {
    id: 'xai',
    name: 'XAI Agent',
    shortName: 'Explainable AI',
    description: 'Generates SHAP analysis, LIME explanations, feature importance rankings, and clinical interpretability reports for all models.',
    designReason: 'Designed by HJR to bridge the gap between ML predictions and clinical understanding, making model decisions transparent and trustworthy for physicians.',
    color: '#f59e0b',
    inputs: ['Trained models', 'Feature metadata', 'Clinical domain knowledge'],
    outputs: ['SHAP values', 'LIME explanations', 'Feature importance rankings', 'Clinical narrative'],
    connections: ['orchestrator', 'training', 'validation', 'cdss'],
    pipelineRole: 'Transparency engine — ensures every prediction can be explained in clinical terms.',
  },
  {
    id: 'literature',
    name: 'Literature Agent',
    shortName: 'Literature',
    description: 'Conducts systematic literature review, reference verification, citation management, and novelty assessment against existing micro-TESE prediction studies.',
    designReason: 'Designed by HJR to automate the exhaustive literature search process, cross-referencing hundreds of papers to identify gaps and validate novelty claims.',
    color: '#ec4899',
    inputs: ['Research questions', 'Search queries', 'Existing bibliography'],
    outputs: ['Systematic review results', 'Verified references', 'Novelty report', 'Gap analysis'],
    connections: ['orchestrator', 'integration'],
    pipelineRole: 'Evidence foundation — provides the scholarly context that frames the entire research contribution.',
  },
  {
    id: 'cdss',
    name: 'CDSS Agent',
    shortName: 'CDSS',
    description: 'Clinical Decision Support System for micro-TESE outcome prediction. Transforms the best model into an interactive clinical tool with patient-specific explanations.',
    designReason: 'Designed by HJR to translate ML research into clinical practice, providing urologists with an actionable prediction tool backed by explainable AI.',
    color: '#ef4444',
    inputs: ['Best trained model', 'Patient features', 'XAI explanations', 'Clinical thresholds'],
    outputs: ['Prediction probabilities', 'Risk stratification', 'Patient-specific explanations', 'Clinical recommendations'],
    connections: ['orchestrator', 'training', 'xai'],
    pipelineRole: 'Clinical endpoint — the practical application that brings the research to the bedside.',
  },
  {
    id: 'judge',
    name: 'Judge LLM',
    shortName: 'Judge LLM',
    description: 'Evaluates and verifies outputs from other agents. Performs quality control, consistency checking, and validates that outputs meet PhD-level research standards.',
    designReason: 'Designed by HJR as an automated quality gatekeeper, ensuring every agent output meets rigorous academic standards before proceeding in the pipeline.',
    color: '#a855f7',
    inputs: ['Agent outputs', 'Quality criteria', 'Academic standards checklist'],
    outputs: ['Quality scores', 'Revision requests', 'Approval decisions', 'Audit trail'],
    connections: ['orchestrator', 'All agents'],
    pipelineRole: 'Quality assurance — the critical reviewer that maintains academic rigor throughout the pipeline.',
  },
  {
    id: 'embedding',
    name: 'Embedding & Reranker',
    shortName: 'Embed & Rerank',
    description: 'Manages semantic search, document retrieval, and knowledge base operations. Powers the RAG system that enables context-aware agent responses.',
    designReason: 'Designed by HJR to build a persistent knowledge base from research artifacts, enabling all agents to retrieve relevant context from prior work and literature.',
    color: '#14b8a6',
    inputs: ['Documents', 'Research artifacts', 'Search queries'],
    outputs: ['Semantic embeddings', 'Ranked search results', 'Relevant context chunks'],
    connections: ['orchestrator', 'literature', 'judge'],
    pipelineRole: 'Memory system — provides the knowledge infrastructure that enables intelligent, context-aware agent behavior.',
  },
]

export const LLM_FARMS = {
  id: 'llm-farms',
  name: 'Optimized LLMs from LLM Farms',
  description: 'Foundation layer of specialized language models powering all agents above.',
  specializations: ['Medical', 'Scientific', 'ML/AI', 'Mathematics', 'Statistics'],
  color: '#6366f1',
}
