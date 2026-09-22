@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies - first run only...
  call npm install
)
if not exist backend\node_modules call npm install --prefix backend
if not exist frontend\node_modules call npm install --prefix frontend
call npm run dev
pause
