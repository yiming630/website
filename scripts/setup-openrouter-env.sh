#!/bin/bash

# SeekHub OpenRouter环境配置脚本
# 用于快速配置OpenRouter环境变量

set -e

echo "=========================================="
echo "  SeekHub OpenRouter 环境配置工具"
echo "=========================================="

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 选择环境
echo ""
echo "请选择要配置的环境:"
echo "1) 开发环境 (development)"
echo "2) 生产环境 (production)"
echo "3) 测试环境 (test)"
read -p "选择 (1-3): " env_choice

case $env_choice in
    1)
        ENV_TYPE="development"
        ENV_FILE=".env.development"
        ;;
    2)
        ENV_TYPE="production"
        ENV_FILE=".env.production"
        ;;
    3)
        ENV_TYPE="test"
        ENV_FILE=".env.test"
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "配置 $ENV_TYPE 环境..."

# 复制模板文件
if [ "$ENV_TYPE" = "production" ]; then
    cp config/environments/production.openrouter.env $ENV_FILE
else
    cp config/environments/env.openrouter $ENV_FILE
fi

echo "✅ 已创建 $ENV_FILE"

# 配置OpenRouter API密钥
echo ""
echo "配置OpenRouter API密钥"
echo "获取密钥: https://openrouter.ai/"
read -p "请输入OpenRouter API密钥: " openrouter_key

if [ -z "$openrouter_key" ]; then
    echo "⚠️  未输入API密钥，跳过配置"
else
    # 替换API密钥
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your_openrouter_api_key_here/$openrouter_key/g" $ENV_FILE
    else
        # Linux
        sed -i "s/your_openrouter_api_key_here/$openrouter_key/g" $ENV_FILE
    fi
    echo "✅ API密钥已配置"
fi

# 配置本地存储路径
echo ""
echo "配置本地存储"
read -p "输入存储根目录 [默认: /data/seekhub/storage]: " storage_root
storage_root=${storage_root:-/data/seekhub/storage}

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|LOCAL_STORAGE_ROOT=.*|LOCAL_STORAGE_ROOT=$storage_root|g" $ENV_FILE
else
    sed -i "s|LOCAL_STORAGE_ROOT=.*|LOCAL_STORAGE_ROOT=$storage_root|g" $ENV_FILE
fi

# 创建存储目录
if [ ! -d "$storage_root" ]; then
    echo "创建存储目录: $storage_root"
    sudo mkdir -p $storage_root
    sudo chown $USER:$USER $storage_root
    echo "✅ 存储目录已创建"
fi

# 配置服务器URL（生产环境）
if [ "$ENV_TYPE" = "production" ]; then
    echo ""
    read -p "输入您的域名 (例如: seekhub.example.com): " domain
    if [ ! -z "$domain" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/yourdomain.com/$domain/g" $ENV_FILE
        else
            sed -i "s/yourdomain.com/$domain/g" $ENV_FILE
        fi
        echo "✅ 域名已配置"
    fi
fi

# 配置数据库（可选）
echo ""
read -p "是否配置数据库? (y/n): " config_db
if [ "$config_db" = "y" ]; then
    read -p "数据库用户名 [默认: postgres]: " db_user
    db_user=${db_user:-postgres}
    
    read -s -p "数据库密码: " db_password
    echo ""
    
    read -p "数据库名称 [默认: seekhub_$ENV_TYPE]: " db_name
    db_name=${db_name:-seekhub_$ENV_TYPE}
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/POSTGRES_USER=.*/POSTGRES_USER=$db_user/g" $ENV_FILE
        sed -i '' "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$db_password/g" $ENV_FILE
        sed -i '' "s/POSTGRES_DB=.*/POSTGRES_DB=$db_name/g" $ENV_FILE
    else
        sed -i "s/POSTGRES_USER=.*/POSTGRES_USER=$db_user/g" $ENV_FILE
        sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$db_password/g" $ENV_FILE
        sed -i "s/POSTGRES_DB=.*/POSTGRES_DB=$db_name/g" $ENV_FILE
    fi
    echo "✅ 数据库配置完成"
fi

# 生成JWT密钥
echo ""
echo "生成JWT密钥..."
jwt_secret=$(openssl rand -base64 32)
jwt_refresh_secret=$(openssl rand -base64 32)

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/your_jwt_secret_key_here_change_in_production/$jwt_secret/g" $ENV_FILE
    sed -i '' "s/your_refresh_secret_key_here_change_in_production/$jwt_refresh_secret/g" $ENV_FILE
else
    sed -i "s/your_jwt_secret_key_here_change_in_production/$jwt_secret/g" $ENV_FILE
    sed -i "s/your_refresh_secret_key_here_change_in_production/$jwt_refresh_secret/g" $ENV_FILE
fi
echo "✅ JWT密钥已生成"

# 创建各服务的环境文件链接
echo ""
echo "创建服务环境文件..."

# Translator服务
if [ -d "tools/experiments/PDF_to_DOCX/PDF_to_DOCX/SeekHub_Demo-main/translator" ]; then
    ln -sf $(pwd)/$ENV_FILE tools/experiments/PDF_to_DOCX/PDF_to_DOCX/SeekHub_Demo-main/translator/.env
    echo "✅ Translator服务环境文件已链接"
fi

# Backend服务
if [ -d "tools/experiments/PDF_to_DOCX/PDF_to_DOCX/SeekHub_Demo-main/backend" ]; then
    ln -sf $(pwd)/$ENV_FILE tools/experiments/PDF_to_DOCX/PDF_to_DOCX/SeekHub_Demo-main/backend/.env
    echo "✅ Backend服务环境文件已链接"
fi

# Backend服务（主项目）
if [ -d "backend" ]; then
    ln -sf $(pwd)/$ENV_FILE backend/.env
    echo "✅ 主Backend服务环境文件已链接"
fi

# Frontend服务
if [ -d "frontend" ]; then
    ln -sf $(pwd)/$ENV_FILE frontend/.env.local
    echo "✅ Frontend服务环境文件已链接"
fi

echo ""
echo "=========================================="
echo "✅ 环境配置完成!"
echo ""
echo "配置文件: $ENV_FILE"
echo ""
echo "下一步:"
echo "1. 检查并修改 $ENV_FILE 中的其他配置"
echo "2. 启动服务:"
echo "   - Translator: cd translator && npm start"
echo "   - Backend: cd backend && npm start"
echo "   - Frontend: cd frontend && npm run dev"
echo ""
echo "测试OpenRouter连接:"
echo "   python test_openrouter_client.py"
echo "=========================================="
