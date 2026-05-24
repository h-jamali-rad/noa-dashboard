#!/bin/bash
# Build the Electron app from the Next.js project
# Run this from the repository root: bash electron-app/build.sh

echo "Building static export..."
NEXT_OUTPUT_MODE=export npm run build

echo "Copying static export to Electron app..."
rm -rf electron-app/app
cp -r out electron-app/app
cp public/favicon.png electron-app/icon.png

echo "Installing Electron dependencies..."
cd electron-app
npm install

echo ""
echo "Done! To run: cd electron-app && npm start"
echo "To build .app bundle: cd electron-app && npm run build"
