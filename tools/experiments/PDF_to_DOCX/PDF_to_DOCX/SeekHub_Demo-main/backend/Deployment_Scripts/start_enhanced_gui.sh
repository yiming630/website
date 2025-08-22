#!/bin/bash

# SeekHub 增强版GUI监控界面启动脚本
# 使用说明: ./start_enhanced_gui.sh

echo "🚀 SeekHub 智能翻译系统 - 增强版GUI监控界面"
echo "================================================"

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装或不在PATH中"
    exit 1
fi

# 检查当前目录
if [ ! -f "enhanced_gui_monitor.py" ]; then
    echo "❌ 请在backend目录下运行此脚本"
    exit 1
fi

# 检查CustomTkinter依赖
echo "🔍 检查依赖..."
python3 -c "import customtkinter" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  CustomTkinter未安装，正在安装..."
    pip3 install customtkinter
    if [ $? -ne 0 ]; then
        echo "❌ 安装CustomTkinter失败"
        exit 1
    fi
fi

# 检查psutil依赖
python3 -c "import psutil" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  psutil未安装，正在安装..."
    pip3 install psutil
    if [ $? -ne 0 ]; then
        echo "❌ 安装psutil失败"
        exit 1
    fi
fi

# 检查matplotlib依赖
python3 -c "import matplotlib" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  matplotlib未安装，正在安装..."
    pip3 install matplotlib
    if [ $? -ne 0 ]; then
        echo "❌ 安装matplotlib失败"
        exit 1
    fi
fi

# 检查numpy依赖
python3 -c "import numpy" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "⚠️  numpy未安装，正在安装..."
    pip3 install numpy
    if [ $? -ne 0 ]; then
        echo "❌ 安装numpy失败"
        exit 1
    fi
fi

# 检查Google Cloud凭据
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "⚠️  设置Google Cloud凭据..."
    export GOOGLE_APPLICATION_CREDENTIALS="../seekhub-demo-9d255b940d24.json"
fi

# 检查凭据文件是否存在
if [ ! -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "⚠️  凭据文件不存在: $GOOGLE_APPLICATION_CREDENTIALS"
    echo "请确保Google Cloud服务账户密钥文件位于正确位置"
fi

# 设置环境变量
export FIRESTORE_PROJECT_ID="seekhub-demo"
export PUBSUB_PROJECT_ID="seekhub-demo"
export GCS_BUCKET_NAME="seekhub-demo-test1"
export MAX_WORKERS="20"
export MAX_CONCURRENT_REQUESTS="50"
export BATCH_SIZE="10"

# 设置Python路径
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

echo "✅ 环境检查完成"
echo "📊 启动增强版GUI监控界面..."
echo ""

# 启动GUI
python3 enhanced_gui_monitor.py

echo ""
echo "👋 GUI监控界面已关闭"
echo "感谢使用SeekHub智能翻译系统！" 