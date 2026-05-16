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
  name: "HJR's Deep Agent — Orchestrator",
  shortName: 'Orchestrator',
  description:
    'Central coordination layer for HJR\'s 5-agent system. Handles task decomposition, dependency ordering, and inter-agent communication.',
  designReason:
    'Designed to keep multi-agent execution deterministic and auditable while coordinating research, verification, model optimization, and dashboard delivery.',
  color: '#0e7490',
  inputs: ['User request', 'Project goals', 'Workflow state'],
  outputs: ['Task decomposition plan', 'Agent assignments', 'Aggregated final response'],
  connections: ['researcher', 'verifier', 'ml-expert', 'dashboard-builder'],
  pipelineRole:
    'Routes work across specialized agents and enforces the architecture flow: decomposition → assignment → execution → cross-verification → aggregation.',
}

export const AGENTS: AgentNode[] = [
  {
    id: 'researcher',
    name: 'Researcher Agent',
    shortName: 'Researcher',
    description:
      'Performs deep code and data analysis, feature engineering reviews, and experiment traceability checks for the NOA pipeline.',
    designReason:
      'Built to handle technical investigation at scale and continuously map findings back to reproducible research artifacts.',
    color: '#06b6d4',
    inputs: ['Codebase', 'Dataset summaries', 'Experiment outputs'],
    outputs: ['Research notes', 'Data/feature findings', 'Implementation recommendations'],
    connections: ['orchestrator', 'verifier', 'ml-expert'],
    pipelineRole: 'Primary analysis engine that surfaces evidence and technical context for the rest of the system.',
  },
  {
    id: 'verifier',
    name: 'Verifier Agent',
    shortName: 'Verifier',
    description:
      'Independently validates claims, metrics, and implementation changes with cross-checks and repeatability-focused review.',
    designReason:
      'Introduced to reduce silent errors by requiring independent verification before final aggregation.',
    color: '#10b981',
    inputs: ['Researcher outputs', 'Model metrics', 'Validation criteria'],
    outputs: ['Verification reports', 'Consistency checks', 'Approval/revision requests'],
    connections: ['orchestrator', 'researcher', 'ml-expert', 'dashboard-builder'],
    pipelineRole: 'Quality gate that enforces evidence-backed updates and reliable reporting.',
  },
  {
    id: 'ml-expert',
    name: 'ML Expert Agent (Model Training)',
    shortName: 'ML Expert',
    description:
      'Owns pathology-focused pipeline optimization and model selection: 16 ML models tested, with 5 finalized in the v2 pipeline.',
    designReason:
      'Specialized to convert clinical and pathology feature insights into robust model performance under leakage-safe validation.',
    color: '#0ea5e9',
    inputs: ['Engineered dataset (2,413 patients, 73 features)', 'Pathology feature block (18 features)', 'Training/validation protocol'],
    outputs: ['Final 5-model comparison', 'Best model: CatBoost (AUC 0.8306, 95% CI 0.823–0.845)', 'Optimization notes'],
    connections: ['orchestrator', 'researcher', 'verifier', 'dashboard-builder'],
    pipelineRole: 'Model optimization core that translates data engineering into validated predictive performance.',
  },
  {
    id: 'dashboard-builder',
    name: 'Dashboard Builder Agent',
    shortName: 'Dashboard Builder',
    description:
      'Implements and deploys the web dashboard, ensuring all visible statistics and claims match authoritative research outputs.',
    designReason:
      'Created to make the final research product accessible, reviewable, and presentation-ready without breaking data integrity.',
    color: '#f59e0b',
    inputs: ['Verified metrics', 'Architecture decisions', 'UI requirements'],
    outputs: ['Updated dashboard pages', 'Documented changes', 'Deployment-ready app'],
    connections: ['orchestrator', 'verifier', 'ml-expert'],
    pipelineRole: 'Presentation and delivery layer that turns validated outputs into a usable product.',
  },
]

export const LLM_FARMS = {
  id: 'llm-farms',
  name: 'Embedding + Retrieval + Reranker Layer',
  description: 'Knowledge layer supporting retrieval-augmented execution and context sharing across all 5 agents.',
  specializations: ['Embedding', 'Retrieval', 'Reranking', 'Scientific QA', 'Traceability'],
  color: '#6366f1',
}
