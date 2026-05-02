// Granular code snippets per execution step (one entry per task, not per file).
// Each step shows: initial conditions -> code -> output -> deliverables.

export type CodeStep = {
  id: string
  title: string
  objective: string
  initialCondition: string
  language: 'python' | 'bash' | 'sql' | 'json' | 'typescript'
  code: string
  outputLabel?: string
  outputType?: 'log' | 'metrics' | 'json' | 'table' | 'success'
  output?: string
  deliverables: string[]
}

import { preprocessingSteps } from './code-snippets-data/preprocessing'
import { trainingSteps } from './code-snippets-data/training'
import { validationSteps } from './code-snippets-data/validation'
import { xaiSteps } from './code-snippets-data/xai'
import { literatureSteps } from './code-snippets-data/literature'
import { integrationSteps } from './code-snippets-data/integration'

export const PHASE_CODE_STEPS: Record<string, CodeStep[]> = {
  preprocessing: preprocessingSteps,
  training: trainingSteps,
  validation: validationSteps,
  xai: xaiSteps,
  literature: literatureSteps,
  integration: integrationSteps,
}

export function getCodeStepsForPhase(slug: string): CodeStep[] {
  return PHASE_CODE_STEPS[slug] ?? []
}
