@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Get the LTS version from https://nodejs.org and run this again. & pause & exit /b 1)
echo Starting DS Study Lab in your browser... (close this window to stop)
node server.js 5173 --open
pause
