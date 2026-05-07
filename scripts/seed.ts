import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'data')
const PUBLIC_IMAGES_DIR = path.join(ROOT, 'public', 'images')

type CuratedImage = { agent: string; filename: string; publicPath: string }
type FileRecord = { agent: string; filename: string; fullPath: string; size: number }

const phaseDefs = [
  { id: 1, slug: 'preprocessing', title: 'Agent 1 — Data Preprocessing', subtitle: '2,413 patients • 45 total features • 18 pathology features', description: 'Clinical cohort ingestion, pathology feature extraction, and leakage-safe preprocessing for NOA micro-TESE prediction.', objectives: ['Ingest and quality-check source records', 'Construct analytical cohort', 'Engineer and validate pathology-aware feature set', 'Implement leakage-safe preprocessing'], deliverables: ['Leakage-safe preprocessing pipeline', 'Dataset with 45 features (including 18 pathology features)', 'Data quality and missingness documentation'], iconKey: 'database', accent: '#0f6d8b' },
  { id: 2, slug: 'training', title: 'Agent 2 — Model Training', subtitle: '16 models tested → 5 finalized • Best: CatBoost AUC 0.8306 (95% CI 0.823–0.845)', description: 'Nested cross-validation model development with pathology integration and final v2 model selection.', objectives: ['Train and compare 16 model families', 'Retain 5 finalists in v2 pipeline', 'Select best model based on AUC, calibration, and clinical utility'], deliverables: ['Final 5-model comparison table', 'Best-model metadata and hyperparameters', 'Reproducible training artifacts'], iconKey: 'cpu', accent: '#1c8a9c' },
  { id: 3, slug: 'validation', title: 'Agent 3 — Validation & Robustness', subtitle: 'Nested CV + calibration + DCA on corrected benchmark', description: 'Discrimination, calibration, and clinical-utility validation after post-defense corrections.', objectives: ['Validate discrimination and calibration', 'Compare Brier and reliability behavior', 'Assess decision-curve clinical utility'], deliverables: ['Calibration and DCA artifacts', 'Robustness evidence', 'Validation-ready manuscript inputs'], iconKey: 'shield-check', accent: '#2d6cdf' },
  { id: 4, slug: 'xai', title: 'Agent 4 — Explainable AI', subtitle: 'SHAP + feature-importance synthesis on finalized CatBoost v2', description: 'Explainability outputs for global and local interpretation with pathology-aware clinically interpretable feature signals.', objectives: ['Generate SHAP global and local explanations', 'Quantify pathology feature influence', 'Summarize clinically interpretable behavior'], deliverables: ['SHAP summary outputs', 'Feature-importance plots', 'Clinician-facing interpretation notes'], iconKey: 'brain-circuit', accent: '#7c3aed' },
  { id: 5, slug: 'literature', title: 'Agent 5 — Literature & Theory', subtitle: 'Evidence synthesis and comparative positioning', description: 'Literature-backed context for novelty, benchmarks, translational value, and research-gap closure.', objectives: ['Synthesize prior NOA/micro-TESE studies', 'Position corrected results against literature', 'Document references and novelty rationale'], deliverables: ['Literature synthesis', 'Novelty comparison basis', 'Reference-ready bibliography inputs'], iconKey: 'book-open', accent: '#0f8a4f' },
  { id: 6, slug: 'integration', title: 'Agent 6 — Integration & Dissertation', subtitle: 'Final dashboard and dissertation handoff', description: 'Consolidation of corrected pipeline outputs into the final dissertation-oriented dashboard experience.', objectives: ['Synchronize corrected content', 'Package outputs for review', 'Provide end-to-end dissertation handoff'], deliverables: ['Integrated dashboard content', 'Consolidated assets', 'Final review package'], iconKey: 'graduation-cap', accent: '#dc2626' },
] as const

function inferModelTag(filename: string): string | null {
  const f = filename.toLowerCase()
  for (const t of ['lightgbm', 'gradient', 'xgboost', 'stacking', 'catboost', 'roc', 'shap']) {
    if (f.includes(t)) return t
  }
  return null
}

function inferCategory(filename: string): string {
  const f = filename.toLowerCase()
  if (f.includes('calibration')) return 'Calibration'
  if (f.includes('decision_curve')) return 'Decision Curve'
  if (f.includes('roc')) return 'ROC'
  if (f.includes('precision')) return 'Precision-Recall'
  if (f.includes('confusion')) return 'Confusion Matrix'
  if (f.includes('shap')) return 'SHAP'
  if (f.includes('importance')) return 'Feature Importance'
  if (f.includes('learning')) return 'Learning Curve'
  return 'General'
}

function loadCuratedImages(): CuratedImage[] {
  const phases = ['preprocessing', 'training', 'validation', 'xai']
  const out: CuratedImage[] = []
  for (const phase of phases) {
    const dir = path.join(PUBLIC_IMAGES_DIR, phase)
    if (!fs.existsSync(dir)) continue
    for (const filename of fs.readdirSync(dir)) {
      if (!/\.(png|jpg|jpeg|svg|webp)$/i.test(filename)) continue
      out.push({ agent: phase, filename, publicPath: `/images/${phase}/${filename}` })
    }
  }
  return out.sort((a, b) => a.publicPath.localeCompare(b.publicPath))
}

function loadDataFiles(subdir: 'code' | 'logs'): FileRecord[] {
  const dir = path.join(DATA_DIR, subdir)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((filename) => !filename.startsWith('.'))
    .map((filename) => {
      const fullPath = path.join(dir, filename)
      const [agent] = filename.split('__')
      return {
        agent: agent || 'integration',
        filename,
        fullPath,
        size: fs.statSync(fullPath).size,
      }
    })
}

async function main() {
  const images = loadCuratedImages()
  const codeFiles = loadDataFiles('code')
  const logFiles = loadDataFiles('logs')

  const contentMap: Record<string, any> = {}
  for (const f of fs.readdirSync(path.join(DATA_DIR, 'content'))) {
    const slug = f.replace('_content.json', '')
    contentMap[slug] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'content', f), 'utf8'))
  }

  const imageCount: Record<string, number> = {}
  const codeCount: Record<string, number> = {}
  const logCount: Record<string, number> = {}
  for (const r of images) imageCount[r.agent] = (imageCount[r.agent] ?? 0) + 1
  for (const r of codeFiles) codeCount[r.agent] = (codeCount[r.agent] ?? 0) + 1
  for (const r of logFiles) logCount[r.agent] = (logCount[r.agent] ?? 0) + 1

  for (const p of phaseDefs) {
    await prisma.agentPhase.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle,
        description: p.description,
        objectivesJson: JSON.stringify(p.objectives),
        deliverablesJson: JSON.stringify(p.deliverables),
        iconKey: p.iconKey,
        accent: p.accent,
        imageCount: imageCount[p.slug] ?? 0,
        codeCount: codeCount[p.slug] ?? 0,
        logCount: logCount[p.slug] ?? 0,
        contentJson: contentMap[p.slug] ?? null,
      },
      update: {
        title: p.title,
        subtitle: p.subtitle,
        description: p.description,
        objectivesJson: JSON.stringify(p.objectives),
        deliverablesJson: JSON.stringify(p.deliverables),
        iconKey: p.iconKey,
        accent: p.accent,
        imageCount: imageCount[p.slug] ?? 0,
        codeCount: codeCount[p.slug] ?? 0,
        logCount: logCount[p.slug] ?? 0,
        contentJson: contentMap[p.slug] ?? null,
      },
    })
  }

  let i = 0
  for (const img of images) {
    await prisma.imageAsset.upsert({
      where: { publicPath: img.publicPath },
      create: {
        agent: img.agent,
        category: inferCategory(img.filename),
        modelTag: inferModelTag(img.filename),
        filename: img.filename,
        publicPath: img.publicPath,
        altText: `${img.agent} ${img.filename}`,
        caption: img.filename,
        sortOrder: i++,
      },
      update: {
        agent: img.agent,
        category: inferCategory(img.filename),
        modelTag: inferModelTag(img.filename),
        filename: img.filename,
        altText: `${img.agent} ${img.filename}`,
        caption: img.filename,
        sortOrder: i++,
      },
    })
  }

  let c = 0
  for (const code of codeFiles) {
    const uniqueKey = `${code.agent}__${code.filename}`
    const contentText = fs.readFileSync(code.fullPath, 'utf8')
    await prisma.codeFile.upsert({
      where: { uniqueKey },
      create: {
        agent: code.agent,
        filename: code.filename,
        language: code.filename.endsWith('.py') ? 'python' : code.filename.endsWith('.md') ? 'markdown' : 'text',
        contentText,
        size: code.size,
        sortOrder: c++,
        uniqueKey,
      },
      update: { contentText, size: code.size, sortOrder: c++ },
    })
  }

  let l = 0
  for (const log of logFiles) {
    const uniqueKey = `${log.agent}__${log.filename}`
    const contentText = fs.readFileSync(log.fullPath, 'utf8')
    await prisma.logFile.upsert({
      where: { uniqueKey },
      create: {
        agent: log.agent,
        filename: log.filename,
        contentText,
        size: log.size,
        sortOrder: l++,
        uniqueKey,
      },
      update: { contentText, size: log.size, sortOrder: l++ },
    })
  }

  console.log(`SQLite seed completed with ${images.length} curated images.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
