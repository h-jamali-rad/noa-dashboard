@echo off
chcp 65001 >nul 2>&1
title NOA ML Dashboard - Windows Installer

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  NOA ML Project Dashboard - Windows Installer            ║
echo ║  Version: v3.0 (with Articles)                           ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: Step 1: Check Node.js
echo [1/5] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   ERROR: Node.js not found!
    echo.
    echo   Please install Node.js 18+ from:
    echo   https://nodejs.org/en/download
    echo.
    echo   After installing, restart this script.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo   OK: Node.js found: %NODE_VER%

:: Step 2: Check npm
echo [2/5] Checking npm...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   ERROR: npm not found! Install Node.js first.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
echo   OK: npm found: %NPM_VER%

:: Step 3: Install dependencies
echo [3/5] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo   ERROR: Failed to install dependencies.
    pause
    exit /b 1
)
echo   OK: Dependencies installed.

:: Step 4: Generate Prisma client
echo [4/5] Setting up database...
if exist prisma\schema.prisma (
    call npx prisma generate
    call npx prisma db push --accept-data-loss 2>nul
    echo   OK: Database ready.
) else (
    echo   SKIP: No Prisma schema found.
)

:: Step 5: Build
echo [5/5] Building application...
call npm run build
echo   OK: Build complete.

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  Installation Complete!                                  ║
echo ╠══════════════════════════════════════════════════════════╣
echo ║                                                          ║
echo ║  To start the dashboard:                                 ║
echo ║    npm run dev       (development mode)                   ║
echo ║    npm run start     (production mode)                    ║
echo ║                                                          ║
echo ║  Then open: http://localhost:3000                        ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

set /p START="Start the dashboard now? (y/n): "
if /i "%START%"=="y" (
    echo Starting dashboard on http://localhost:3000 ...
    call npm run dev
)

pause
