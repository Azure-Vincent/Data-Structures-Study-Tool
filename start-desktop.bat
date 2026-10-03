@echo off
cd /d "%~dp0"
where npm >nul 2>nul || (echo Node.js is not installed. Get the LTS version from https://nodejs.org and run this again. & pause & exit /b 1)
if not exist node_modules\electron\ (
  echo First run: installing the desktop runtime, this takes a minute...
  call npm install || (pause & exit /b 1)
)
call npm start
