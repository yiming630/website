@echo off
echo Starting Translation Platform Services...
echo ========================================

:: First, kill any existing processes on our ports
echo Cleaning up ports...
call kill-ports.bat

echo.
echo Starting Backend API Gateway on port 4002...
start "API Gateway" cmd /k "cd backend\services\api-gateway && npm run dev"

:: Wait a bit for backend to start
timeout /t 5 /nobreak > nul

echo.
echo Starting Frontend on port 3000...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Services Starting:
echo - Backend API:  http://localhost:4002
echo - GraphQL:      http://localhost:4002/graphql
echo - Frontend:     http://localhost:3000
echo ========================================
echo.
echo Press any key to check service status...
pause > nul

:: Check if services are running
echo.
echo Checking service status...
curl -s http://localhost:4002/health > nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Backend API is running
) else (
    echo [ERROR] Backend API is not responding
)

curl -s http://localhost:3000 > nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Frontend is running
) else (
    echo [WARNING] Frontend might still be starting...
)

echo.
echo Services are ready! Press any key to exit...
pause > nul