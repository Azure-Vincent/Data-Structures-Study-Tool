@echo off
cd /d "%~dp0"
where npm >nul 2>nul || (echo Node.js is not installed. Get version 22.12 or newer from https://nodejs.org and run this again. & pause & exit /b 1)
rem The desktop runtime (Electron) needs Node.js 22.12+; start-browser.bat works with 18+.
node -e "const v=process.versions.node.split('.').map(Number);process.exit(v[0]>22||(v[0]===22&&v[1]>=12)?0:1)" || (echo The desktop window needs Node.js 22.12 or newer. Update it from https://nodejs.org, or use start-browser.bat. & pause & exit /b 1)
if not exist node_modules\electron\ (
  echo First run: installing the desktop runtime, this takes a minute...
  call npm install || (pause & exit /b 1)
)
call npm start
