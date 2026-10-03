@echo off
cd /d "%~dp0"
call npm install || (pause & exit /b 1)
call npm run dist:win
echo.
echo Done. The .exe files are in the dist folder.
pause
