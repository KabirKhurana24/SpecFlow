@echo off
setlocal
cd /d "%~dp0"
echo Starting SPECFLOW Requirements Workspace...
where node >nul 2>nul || (echo Node.js is not installed. Install Node.js 20 or newer. & pause & exit /b 1)
if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (echo Dependency installation failed. & pause & exit /b 1)
)
call npm run dev
