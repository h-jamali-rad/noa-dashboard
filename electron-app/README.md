# NOA CDSS Dashboard — Electron App

Offline desktop application for the NOA microTESE Clinical Decision Support System Dashboard.

## Prerequisites

- **macOS** with Apple Silicon (M1/M2/M3)
- **Node.js** 18+ installed (`brew install node`)

## Quick Start

### Option 1: Run directly with Electron (recommended for development)

```bash
cd noa-electron
npm install
npm start
```

This opens the dashboard as a native desktop window. All audio files work offline.

### Option 2: Build a standalone .app bundle

```bash
cd noa-electron
npm install
npm run build
```

The built app will be in `dist/mac-arm64/NOA CDSS Dashboard.app`. 
You can drag it to your Applications folder.

## Notes

- The app is fully offline — no internet connection required
- All 452 AI Assist audio files are bundled
- The splash screen plays for 4 seconds on each launch
- Total app size is ~470MB (mostly audio files and static assets)
