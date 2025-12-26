@echo off
setlocal enabledelayedexpansion

REM AutoGD&T Engine - Windows Start Script
REM For project structure with BACKEND and FRONTEND folders

echo ========================================
echo   AutoGD&T Engine - Quick Start
echo ========================================
echo.

REM Get the script directory (GD-T folder)
set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%BACKEND"
set "FRONTEND_DIR=%SCRIPT_DIR%FRONTEND\autogdt-engine"

echo Project root: %SCRIPT_DIR%
echo.

REM Check if directories exist
if not exist "%BACKEND_DIR%" (
    echo [ERROR] BACKEND directory not found at: %BACKEND_DIR%
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%" (
    echo [ERROR] FRONTEND directory not found at: %FRONTEND_DIR%
    pause
    exit /b 1
)

echo [OK] Found BACKEND and FRONTEND directories
echo.

REM Check if main.py exists
if not exist "%BACKEND_DIR%\main.py" (
    echo [ERROR] main.py not found in BACKEND directory
    pause
    exit /b 1
)

echo [OK] Found main.py
echo.

REM Backend Setup
echo ========================================
echo   Setting up Backend...
echo ========================================
cd /d "%BACKEND_DIR%"

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        echo Make sure Python is installed and in PATH
        pause
        exit /b 1
    )
    echo [OK] Virtual environment created
)

REM Activate virtual environment
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

REM Install dependencies
echo Installing backend dependencies...
pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Some dependencies may have failed to install
) else (
    echo [OK] Backend dependencies installed
)

REM Create necessary directories
if not exist "uploads" mkdir uploads
if not exist "outputs" mkdir outputs
echo [OK] Created uploads and outputs directories
echo.

REM Frontend Setup
echo ========================================
echo   Setting up Frontend...
echo ========================================
cd /d "%FRONTEND_DIR%"

REM Install npm dependencies if needed
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies
        echo Make sure Node.js and npm are installed
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies installed
) else (
    echo [OK] Frontend dependencies already installed
)

REM Create .env if it doesn't exist
if not exist ".env" (
    echo VITE_API_URL=http://localhost:8000 > .env
    echo [OK] Created .env file
)

REM Check if api.js exists
if not exist "src\services\api.js" (
    echo [WARNING] src\services\api.js not found
    echo          Please make sure to create this file before the frontend will work
)
echo.

REM Start servers
echo ========================================
echo   Starting servers...
echo ========================================
echo.

REM Start backend in a new window
cd /d "%BACKEND_DIR%"
start "AutoGD&T Backend" /min cmd /c "call venv\Scripts\activate.bat && python main.py > backend.log 2>&1"
timeout /t 3 /nobreak >nul
echo [OK] Backend started on http://localhost:8000

REM Start frontend in a new window
cd /d "%FRONTEND_DIR%"
start "AutoGD&T Frontend" /min cmd /c "npm run dev > frontend.log 2>&1"
timeout /t 3 /nobreak >nul
echo [OK] Frontend started on http://localhost:5173
echo.

echo ========================================
echo   AutoGD^&T Engine is running!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Logs:
echo   Backend:  %BACKEND_DIR%\backend.log
echo   Frontend: %FRONTEND_DIR%\frontend.log
echo.
echo Both servers are running in minimized windows.
echo Close those windows or press Ctrl+C here to stop the servers.
echo.
pause