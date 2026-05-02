# NOA PhD Dissertation — Integration Report

**Output file:** `[path]`
**Final size:** 4,213,371 bytes (4.02 MB)

## Sections Added

| # | Section ID | Title | Inserted After |
|---|------------|-------|----------------|
| 1 | `literature-expanded` | Expanded Literature Review | `#literature` |
| 2 | `preprocessing-fe`     | Data Preprocessing & Feature Engineering | `#data-prep` |
| 3 | `training-experiments` | Model Training & Experiments | `#performance` |
| 4 | `validation-methods`   | Validation Methods | `#training-experiments` |
| 5 | `xai-pipeline`         | XAI Pipeline (Phase 5) | `#xai` |

## Content Integrated

- **Preprocessing** — full dataset info (2450 patients, 55→73 features), 10 cleaning steps, full feature-engineering breakdown, 7 transformations, outcome analysis.
- **Training** — 9-classifier benchmark, hyperparameter tuning (Optuna), 14 experiment logs, 5 ablation studies, 5-version model evolution (Paper 1 → Paper B), 20 decisions, 15 problems/solutions, 8 code-evolution phases.
- **Validation** — 10 validation methods, 15 base models (27 including adjusted variants), full performance/calibration/threshold/risk-stratification/subgroup analyses, TRIPOD/PROBAST/STROBE compliance.
- **XAI Pipeline** — 10-task pipeline, 15 interpretability methods, complete SHAP rankings, 7 LIME archetypes, counterfactuals, 5 ablation studies, 430+ SHAP/LIME visualizations across all models and archetypes visualizations.
- **Expanded Literature** — 41 references, 7 research gaps, 9 theoretical frameworks, 21 methodologies, 8 narrative sections, full citation map.

## Logos Updated

- **MUMS Logo** — embedded as base64 (JPEG) — added to cover header & footer
- **Medical Informatics Logo** — embedded as base64 (JPEG) — added to cover header & footer
- **Royan Institute Logo** — embedded as base64 (PNG) — kept in cover header & footer

All three logos appear in the cover page header (`.logos` block) and in a new persistent footer that renders below every page section.

## Issues Fixed

- ✅ "Jamalirad" used consistently (single word, normalized via regex).
- ✅ No occurrence of "Farnaz Khoshrounejad" (verified absent in source template — none added).
- ✅ Dr. Vakili-Arki preserved in cover meta cards, supervisor JS object, and floating profile cards.
- ✅ All forbidden platform-name references stripped (regex pass).
- ✅ Sticky ToC updated with the 5 new section anchors and new groupings.
- ✅ Color scheme (`#0f6d8b`, `#2856a8`), Inter typography, sticky TOC, search, lightbox, supervisor floating cards — all preserved.
- ✅ Existing CSS classes reused for new sections (`.section-title`, `.flow-step`, `.flow-steps`, `.kpi`, `details`, `.pill`, `.topic-accordion`, `.two-col`, `.footer-note`, etc.).
- ✅ All existing JavaScript (Chart.js initializers, search, sorting, mind-map, lightbox, supervisor hover) untouched.

## Quality Checks

- HTML validates structurally (single `<main>`, balanced `<section>` blocks).
- Internal anchor links from the new ToC entries resolve to the new section IDs.
- Logos embedded as base64 — file is fully self-contained, no external image dependencies for branding.
- Final size: **4,213,371 bytes**.
