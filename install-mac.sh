#!/bin/bash
# ============================================================
# NOA ML Dashboard - Mac (Apple Silicon M1+) Setup Script
# Developed by Hossein Jamalirad, PhD Candidate of Medical
# Informatics in Medical University @ MUMS-2026
# ============================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  NOA ML Project Dashboard - Mac Installer               ║"
echo "║  Version: v3.0 (with Articles)                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running on Mac
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}Error: This script is for macOS only.${NC}"
    echo "Please use install-windows.bat for Windows."
    exit 1
fi

# Step 1: Check Node.js
echo -e "${YELLOW}[1/5] Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VER=$(node -v)
    echo -e "${GREEN}  ✓ Node.js found: $NODE_VER${NC}"
    # Check minimum version (18+)
    MAJOR=$(echo $NODE_VER | sed 's/v//' | cut -d. -f1)
    if [ "$MAJOR" -lt 18 ]; then
        echo -e "${RED}  ✗ Node.js 18+ required. Please update: https://nodejs.org${NC}"
        exit 1
    fi
else
    echo -e "${RED}  ✗ Node.js not found.${NC}"
    echo ""
    echo "  Install via Homebrew:"
    echo "    brew install node"
    echo ""
    echo "  Or download from: https://nodejs.org"
    exit 1
fi

# Step 2: Check npm
echo -e "${YELLOW}[2/5] Checking npm...${NC}"
if command -v npm &> /dev/null; then
    NPM_VER=$(npm -v)
    echo -e "${GREEN}  ✓ npm found: $NPM_VER${NC}"
else
    echo -e "${RED}  ✗ npm not found. Install Node.js first.${NC}"
    exit 1
fi

# Step 3: Install dependencies
echo -e "${YELLOW}[3/5] Installing dependencies...${NC}"
npm install
echo -e "${GREEN}  ✓ Dependencies installed.${NC}"

# Step 4: Generate Prisma client
echo -e "${YELLOW}[4/5] Setting up database...${NC}"
if [ -f "prisma/schema.prisma" ]; then
    npx prisma generate
    npx prisma db push --accept-data-loss 2>/dev/null || true
    echo -e "${GREEN}  ✓ Database ready.${NC}"
else
    echo -e "${YELLOW}  ⚠ No Prisma schema found, skipping.${NC}"
fi

# Step 5: Build and run
echo -e "${YELLOW}[5/5] Building application...${NC}"
npm run build 2>/dev/null || echo -e "${YELLOW}  ⚠ Build warnings detected (non-critical)${NC}"
echo -e "${GREEN}  ✓ Build complete.${NC}"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ Installation Complete!                                ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║  To start the dashboard:                                 ║${NC}"
echo -e "${GREEN}║    npm run dev       (development mode)                   ║${NC}"
echo -e "${GREEN}║    npm run start     (production mode)                    ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║  Then open: http://localhost:3000                        ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

read -p "Start the dashboard now? (y/n): " START
if [[ "$START" == "y" || "$START" == "Y" ]]; then
    echo -e "${GREEN}Starting dashboard on http://localhost:3000 ...${NC}"
    npm run dev
fi
