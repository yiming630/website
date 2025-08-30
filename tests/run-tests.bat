@echo off
REM ========================================
REM Translation Platform Test Suite Runner
REM Windows Batch Script
REM ========================================

echo.
echo ========================================
echo   Translation Platform Test Suite
echo   Windows Test Runner
echo ========================================
echo.

REM Check Node.js version
echo [1/7] Checking Node.js version...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    exit /b 1
)
node --version

echo.
echo [2/7] Testing Database Connection...
node tests\backend\test-database.js
if %errorlevel% neq 0 (
    echo WARNING: Database tests failed. Is PostgreSQL running?
)

echo.
echo [3/7] Checking if API Gateway is running...
curl -s http://localhost:4000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo API Gateway is not running. Starting it now...
    start /B cmd /c "cd backend\services\api-gateway && npm run dev"
    echo Waiting for server to start...
    timeout /t 10 /nobreak >nul
)

echo.
echo [4/7] Testing GraphQL API...
node tests\backend\test-graphql-api.js
if %errorlevel% neq 0 (
    echo WARNING: Some API tests failed
)

echo.
echo [5/7] Checking if Frontend is running...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo Frontend is not running. Starting it now...
    start /B cmd /c "cd frontend && npm run dev"
    echo Waiting for Next.js to compile...
    timeout /t 15 /nobreak >nul
)

echo.
echo [6/7] Testing Frontend Pages...
node tests\frontend\test-pages.js
if %errorlevel% neq 0 (
    echo WARNING: Some frontend tests failed
)

echo.
echo [7/7] Generating Test Report...
echo Test execution completed at %date% %time% > tests\results\test-summary.txt
echo.
echo ========================================
echo   Test Suite Completed
echo ========================================
echo.
echo View detailed results in:
echo   - tests\results\database-test-results.json
echo   - tests\results\graphql-api-test-results.json
echo   - tests\results\frontend-test-results.json
echo   - tests\TEST_ISSUES.md
echo.
pause