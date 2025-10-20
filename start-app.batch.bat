@echo off
echo ========================================
echo   Starting Student Management System
echo ========================================
echo.

echo Step 1: Starting Backend Server...
cd server
start cmd /k "npm run dev"

echo Waiting 5 seconds for backend to start...
timeout /t 5

echo Step 2: Starting Frontend Client...
cd ..\client
start cmd /k "npm start"

echo.
echo ========================================
echo   Both servers are starting...
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo The servers will open in separate windows.
echo Close this window when done.
echo.
pause