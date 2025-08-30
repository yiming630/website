# ========================================
# Translation Platform Test Suite Runner
# PowerShell Script for Windows
# ========================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Translation Platform Test Suite" -ForegroundColor Cyan
Write-Host "  PowerShell Test Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a port is in use
function Test-Port {
    param($Port)
    $connection = New-Object System.Net.Sockets.TcpClient
    try {
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Check Node.js
Write-Host "[1/7] Checking Node.js version..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/7] Testing Database Connection..." -ForegroundColor Yellow
$dbTestResult = node "tests\backend\test-database.js" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Database tests failed. Is PostgreSQL running?" -ForegroundColor Red
    Write-Host "To fix: Install and start PostgreSQL, then create the database" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/7] Checking API Gateway (port 4000)..." -ForegroundColor Yellow
if (Test-Port -Port 4000) {
    Write-Host "API Gateway is running" -ForegroundColor Green
} else {
    Write-Host "API Gateway is not running. Starting it now..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-Command", "cd backend\services\api-gateway; npm run dev" -WindowStyle Hidden
    Write-Host "Waiting for server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

Write-Host ""
Write-Host "[4/7] Testing GraphQL API..." -ForegroundColor Yellow
$apiTestResult = node "tests\backend\test-graphql-api.js" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Some API tests failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "[5/7] Checking Frontend (port 3000)..." -ForegroundColor Yellow
if (Test-Port -Port 3000) {
    Write-Host "Frontend is running" -ForegroundColor Green
} else {
    Write-Host "Frontend is not running. Starting it now..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-Command", "cd frontend; npm run dev" -WindowStyle Hidden
    Write-Host "Waiting for Next.js to compile..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
}

Write-Host ""
Write-Host "[6/7] Testing Frontend Pages..." -ForegroundColor Yellow
$frontendTestResult = node "tests\frontend\test-pages.js" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Some frontend tests failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "[7/7] Generating Test Report..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"Test execution completed at $timestamp" | Out-File -FilePath "tests\results\test-summary.txt"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Suite Completed" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "View detailed results in:" -ForegroundColor Green
Write-Host "  - tests\results\database-test-results.json" -ForegroundColor White
Write-Host "  - tests\results\graphql-api-test-results.json" -ForegroundColor White
Write-Host "  - tests\results\frontend-test-results.json" -ForegroundColor White
Write-Host "  - tests\TEST_ISSUES.md" -ForegroundColor White
Write-Host ""

# Summary of issues
Write-Host "Known Issues:" -ForegroundColor Yellow
Write-Host "1. Database not running (PostgreSQL required)" -ForegroundColor Red
Write-Host "2. Missing @apollo/client in frontend" -ForegroundColor Red
Write-Host "3. GraphQL schema field name mismatches" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run 'npm install' in frontend folder to fix dependency issues" -ForegroundColor Cyan

Read-Host "Press Enter to exit"