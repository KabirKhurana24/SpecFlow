@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Install Node.js 20 or newer. & pause & exit /b 1)
if not exist node_modules call npm install
if errorlevel 1 (echo Dependency installation failed. & pause & exit /b 1)
call npm run build
if errorlevel 1 (echo Build failed. & pause & exit /b 1)
echo Production output is in dist\
pause
