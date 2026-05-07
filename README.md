# NOA ML Project Dashboard v3.0

**Machine Learning-Based Prediction of Sperm Retrieval in Non-Obstructive Azoospermia**

Developed by Hossein Jamalirad, PhD Candidate of Medical Informatics in Medical University @ MUMS-2026

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** — Download from [nodejs.org](https://nodejs.org)
- **npm** (included with Node.js)

### Installation

#### macOS (Apple Silicon M1+)
```bash
cd noa-dashboard-v3
chmod +x install-mac.sh
./install-mac.sh
```

#### Windows 10+
```
Double-click install-windows.bat
```
Or in Command Prompt/PowerShell:
```cmd
cd noa-dashboard-v3
install-windows.bat
```

### Manual Installation
```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000)

---

## 📋 What's New in v3.0

- **Articles Page** — 3 article cards:
  1. Published: *ML-Based Prediction of Sperm Retrieval in NOA* (Human Reproduction Open, 2025)
  2. In Preparation: *Impact of Histopathological Feature Encoding* (Target: Fertility & Sterility)
  3. In Preparation: *Explainable CDSS for Micro-TESE Outcomes* (Target: JMIR Medical Informatics)
- **TRIPOD+AI & PROBAST** compliance checklists (expandable)
- **Download DOCX** buttons for articles in preparation
- All previous dashboard features preserved

---

## 📁 Project Structure

```
app/               → Next.js pages
  articles/        → Articles page (NEW)
  about/           → About page
  cdss/            → CDSS page
  code/            → Code snippets
  gallery/         → Image gallery
  hardware-specs/  → Hardware specifications
  phase/           → Project phases
  roadmap/         → Project roadmap
  virtual-defense/ → Defense presentation
  xai/             → Explainable AI
components/        → Reusable UI components
data/              → Content data files
prisma/            → Database schema
public/            → Static assets
  downloads/       → Article DOCX files
scripts/           → Database seed scripts
```

---

## 🔬 Key Results

- Dataset: 2,413 patients
- Features: 45 total (37 numeric + 8 categorical)
- Pathology features: 18 bilateral RT/LT
- Models: 16 tested, 5 finalized in v2
- Best model: CatBoost (AUC 0.8306, 95% CI 0.823–0.845)

---

## 📄 License

This project is part of a PhD thesis at Mashhad University of Medical Sciences.

## 📧 Contact

Hossein Jamalirad — h.jamalirad@mums.ac.ir
