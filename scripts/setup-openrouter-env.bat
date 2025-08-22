@echo off
REM SeekHub OpenRouter环境配置脚本 (Windows)
REM 用于快速配置OpenRouter环境变量

echo ==========================================
echo   SeekHub OpenRouter 环境配置工具
echo ==========================================

REM 检查是否在项目根目录
if not exist "package.json" (
    echo ❌ 错误: 请在项目根目录运行此脚本
    pause
    exit /b 1
)

REM 选择环境
echo.
echo 请选择要配置的环境:
echo 1) 开发环境 (development)
echo 2) 生产环境 (production)
echo 3) 测试环境 (test)
set /p env_choice="选择 (1-3): "

if "%env_choice%"=="1" (
    set ENV_TYPE=development
    set ENV_FILE=.env.development
) else if "%env_choice%"=="2" (
    set ENV_TYPE=production
    set ENV_FILE=.env.production
) else if "%env_choice%"=="3" (
    set ENV_TYPE=test
    set ENV_FILE=.env.test
) else (
    echo ❌ 无效选择
    pause
    exit /b 1
)

echo.
echo 配置 %ENV_TYPE% 环境...

REM 复制模板文件
if "%ENV_TYPE%"=="production" (
    copy config\environments\production.openrouter.env %ENV_FILE%
) else (
    copy config\environments\env.openrouter %ENV_FILE%
)

echo ✅ 已创建 %ENV_FILE%

REM 配置OpenRouter API密钥
echo.
echo 配置OpenRouter API密钥
echo 获取密钥: https://openrouter.ai/
set /p openrouter_key="请输入OpenRouter API密钥: "

if "%openrouter_key%"=="" (
    echo ⚠️  未输入API密钥，跳过配置
) else (
    REM 使用PowerShell替换文本
    powershell -Command "(Get-Content %ENV_FILE%) -replace 'your_openrouter_api_key_here', '%openrouter_key%' | Set-Content %ENV_FILE%"
    echo ✅ API密钥已配置
)

REM 配置本地存储路径
echo.
echo 配置本地存储
set /p storage_root="输入存储根目录 [默认: C:\data\seekhub\storage]: "
if "%storage_root%"=="" set storage_root=C:\data\seekhub\storage

powershell -Command "(Get-Content %ENV_FILE%) -replace 'LOCAL_STORAGE_ROOT=.*', 'LOCAL_STORAGE_ROOT=%storage_root%' | Set-Content %ENV_FILE%"

REM 创建存储目录
if not exist "%storage_root%" (
    echo 创建存储目录: %storage_root%
    mkdir "%storage_root%"
    echo ✅ 存储目录已创建
)

REM 配置服务器URL（生产环境）
if "%ENV_TYPE%"=="production" (
    echo.
    set /p domain="输入您的域名 (例如: seekhub.example.com): "
    if not "%domain%"=="" (
        powershell -Command "(Get-Content %ENV_FILE%) -replace 'yourdomain.com', '%domain%' | Set-Content %ENV_FILE%"
        echo ✅ 域名已配置
    )
)

REM 配置数据库（可选）
echo.
set /p config_db="是否配置数据库? (y/n): "
if "%config_db%"=="y" (
    set /p db_user="数据库用户名 [默认: postgres]: "
    if "%db_user%"=="" set db_user=postgres
    
    set /p db_password="数据库密码: "
    
    set /p db_name="数据库名称 [默认: seekhub_%ENV_TYPE%]: "
    if "%db_name%"=="" set db_name=seekhub_%ENV_TYPE%
    
    powershell -Command "(Get-Content %ENV_FILE%) -replace 'POSTGRES_USER=.*', 'POSTGRES_USER=%db_user%' | Set-Content %ENV_FILE%"
    powershell -Command "(Get-Content %ENV_FILE%) -replace 'POSTGRES_PASSWORD=.*', 'POSTGRES_PASSWORD=%db_password%' | Set-Content %ENV_FILE%"
    powershell -Command "(Get-Content %ENV_FILE%) -replace 'POSTGRES_DB=.*', 'POSTGRES_DB=%db_name%' | Set-Content %ENV_FILE%"
    echo ✅ 数据库配置完成
)

REM 生成JWT密钥
echo.
echo 生成JWT密钥...
REM 使用PowerShell生成随机字符串
for /f "delims=" %%i in ('powershell -Command "[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))"') do set jwt_secret=%%i
for /f "delims=" %%i in ('powershell -Command "[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString()))"') do set jwt_refresh_secret=%%i

powershell -Command "(Get-Content %ENV_FILE%) -replace 'your_jwt_secret_key_here_change_in_production', '%jwt_secret%' | Set-Content %ENV_FILE%"
powershell -Command "(Get-Content %ENV_FILE%) -replace 'your_refresh_secret_key_here_change_in_production', '%jwt_refresh_secret%' | Set-Content %ENV_FILE%"
echo ✅ JWT密钥已生成

REM 创建各服务的环境文件
echo.
echo 创建服务环境文件...

REM Translator服务
if exist "tools\experiments\PDF_to_DOCX\PDF_to_DOCX\SeekHub_Demo-main\translator" (
    copy %ENV_FILE% tools\experiments\PDF_to_DOCX\PDF_to_DOCX\SeekHub_Demo-main\translator\.env
    echo ✅ Translator服务环境文件已创建
)

REM Backend服务
if exist "tools\experiments\PDF_to_DOCX\PDF_to_DOCX\SeekHub_Demo-main\backend" (
    copy %ENV_FILE% tools\experiments\PDF_to_DOCX\PDF_to_DOCX\SeekHub_Demo-main\backend\.env
    echo ✅ Backend服务环境文件已创建
)

REM Backend服务（主项目）
if exist "backend" (
    copy %ENV_FILE% backend\.env
    echo ✅ 主Backend服务环境文件已创建
)

REM Frontend服务
if exist "frontend" (
    copy %ENV_FILE% frontend\.env.local
    echo ✅ Frontend服务环境文件已创建
)

echo.
echo ==========================================
echo ✅ 环境配置完成!
echo.
echo 配置文件: %ENV_FILE%
echo.
echo 下一步:
echo 1. 检查并修改 %ENV_FILE% 中的其他配置
echo 2. 启动服务:
echo    - Translator: cd translator ^&^& npm start
echo    - Backend: cd backend ^&^& npm start
echo    - Frontend: cd frontend ^&^& npm run dev
echo.
echo 测试OpenRouter连接:
echo    python test_openrouter_client.py
echo ==========================================

pause
