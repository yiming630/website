#!/bin/bash

# OpenRouter Translator 服务启动脚本

echo "=========================================="
echo "  SeekHub Translator (OpenRouter版本)"
echo "=========================================="

# 检查Python版本
python_version=$(python3 --version 2>&1 | grep -Po '(?<=Python )\d+\.\d+')
required_version="3.9"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then 
    echo "❌ 错误: 需要Python $required_version或更高版本，当前版本: $python_version"
    exit 1
fi

echo "✅ Python版本检查通过: $python_version"

# 检查环境变量
if [ -f .env ]; then
    echo "✅ 找到.env文件"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  未找到.env文件，尝试从环境变量读取配置"
fi

if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "❌ 错误: 未设置OPENROUTER_API_KEY"
    echo "请设置环境变量或创建.env文件"
    echo "示例: export OPENROUTER_API_KEY=your_key_here"
    exit 1
fi

echo "✅ OpenRouter API密钥已配置"

# 创建日志目录
mkdir -p logs

# 安装依赖
echo "📦 检查并安装依赖..."
pip3 install -q -r requirements_openrouter.txt

# 启动服务
PORT=${PORT:-8000}
echo ""
echo "🚀 启动Translator服务..."
echo "   地址: http://localhost:$PORT"
echo "   文档: http://localhost:$PORT/docs"
echo ""
echo "按 Ctrl+C 停止服务"
echo "=========================================="

# 启动uvicorn
uvicorn main_openrouter:app --host 0.0.0.0 --port $PORT --reload
