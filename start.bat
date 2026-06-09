@echo off
echo Starting CognitiveLens...

start "CognitiveLens API" cmd /k "uvicorn api.main:app --reload"

timeout /t 2 /nobreak >nul

start "CognitiveLens UI" cmd /k "cd frontend-react && npm install && npm run dev"

echo.
echo API:      http://localhost:8000
echo Frontend: http://localhost:5173
echo.
pause
