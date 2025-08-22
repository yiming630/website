@echo off
REM OpenRouter Translator 服务启动脚本 (Windows)

echo ==========================================
echo   SeekHub Translator (OpenRouter版本)
echo ==========================================

REM 检查Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到Python，请先安装Python 3.9或更高版本
    pause
    exit /b 1
)

echo ✅ Python已安装

REM 检查环境变量文件
if exist .env (
    echo ✅ 找到.env文件
    REM Windows下加载.env文件
    for /f "delims=" %%i in (.env) do set %%i
) else (
    echo ⚠️  未找到.env文件，请确保已设置环境变量
)

REM 检查API密钥
if "%OPENROUTER_API_KEY%"=="" (
    echo ❌ 错误: 未设置OPENROUTER_API_KEY
    echo 请设置环境变量或创建.env文件
    echo 示例: set OPENROUTER_API_KEY=your_key_here
    pause
    exit /b 1
)

echo ✅ OpenRouter API密钥已配置

REM 创建日志目录
if not exist logs mkdir logs

REM 安装依赖
echo 📦 检查并安装依赖...
pip install -r requirements_openrouter.txt

REM 设置端口
if "%PORT%"=="" set PORT=8000

echo.
echo 🚀 启动Translator服务...
echo    地址: http://localhost:%PORT%
echo    文档: http://localhost:%PORT%/docs
echo.
echo 按 Ctrl+C 停止服务
echo ==========================================

REM 启动服务
uvicorn main_openrouter:app --host 0.0.0.0 --port %PORT% --reload

pause
