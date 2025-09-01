@echo off
echo Killing processes using common ports...

:: Kill process on port 3000 (Frontend)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process on port 3000 (PID: %%a)
    powershell -Command "Stop-Process -Id %%a -Force -ErrorAction SilentlyContinue"
)

:: Kill process on port 3001 (Frontend fallback)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo Killing process on port 3001 (PID: %%a)
    powershell -Command "Stop-Process -Id %%a -Force -ErrorAction SilentlyContinue"
)

:: Kill process on port 4000 (Old API Gateway)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000 ^| findstr LISTENING') do (
    echo Killing process on port 4000 (PID: %%a)
    powershell -Command "Stop-Process -Id %%a -Force -ErrorAction SilentlyContinue"
)

:: Kill process on port 4001 (Old API Gateway)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4001 ^| findstr LISTENING') do (
    echo Killing process on port 4001 (PID: %%a)
    powershell -Command "Stop-Process -Id %%a -Force -ErrorAction SilentlyContinue"
)

:: Kill process on port 4002 (Current API Gateway)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4002 ^| findstr LISTENING') do (
    echo Killing process on port 4002 (PID: %%a)
    powershell -Command "Stop-Process -Id %%a -Force -ErrorAction SilentlyContinue"
)

:: Kill process on port 8001 (Document Service)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8001 ^| findstr LISTENING') do (
    echo Killing process on port 8001 (PID: %%a)
    powershell -Command "Stop-Process -Id %%a -Force -ErrorAction SilentlyContinue"
)

echo.
echo Waiting for ports to be released...
timeout /t 3 /nobreak > nul

echo.
echo Port status:
netstat -ano | findstr ":3000 :3001 :4000 :4001 :4002 :8001" | findstr LISTENING

echo.
echo Done! Ports should be free now.
echo You can now start your services:
echo   Backend:  cd backend\services\api-gateway ^&^& npm run dev
echo   Frontend: cd frontend ^&^& npm run dev