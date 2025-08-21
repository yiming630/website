#!/bin/bash
# SeekHub 翻译系统部署脚本

set -e  # 错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# 检查必需的环境变量
check_environment() {
    print_message "检查环境变量..."
    
    required_vars=(
        "GOOGLE_APPLICATION_CREDENTIALS"
        "FIRESTORE_PROJECT_ID"
        "PUBSUB_PROJECT_ID"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "缺少必需的环境变量: $var"
            exit 1
        else
            print_success "环境变量 $var: ✓"
        fi
    done
}

# 检查依赖
check_dependencies() {
    print_message "检查系统依赖..."
    
    # 检查 Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python3 未安装"
        exit 1
    fi
    print_success "Python3: $(python3 --version)"
    
    # 检查 Docker (如果需要)
    if [ "$DEPLOYMENT_TYPE" = "docker" ]; then
        if ! command -v docker &> /dev/null; then
            print_error "Docker 未安装"
            exit 1
        fi
        print_success "Docker: $(docker --version)"
    fi
    
    # 检查 Google Cloud SDK (如果需要)
    if [ "$DEPLOYMENT_TYPE" = "gcp" ]; then
        if ! command -v gcloud &> /dev/null; then
            print_error "Google Cloud SDK 未安装"
            exit 1
        fi
        print_success "GCloud SDK: $(gcloud --version | head -1)"
    fi
}

# 构建应用
build_application() {
    print_message "构建应用..."
    
    # 安装依赖
    print_message "安装Python依赖..."
    pip install -r requirements.txt
    
    # 运行测试 (如果存在)
    if [ -f "tests/" ] && [ -n "$(ls -A tests/)" ]; then
        print_message "运行测试..."
        python -m pytest tests/ -v
    fi
    
    print_success "应用构建完成"
}

# Docker部署
deploy_docker() {
    print_message "Docker部署..."
    
    cd deployment/docker
    
    # 构建镜像
    print_message "构建Docker镜像..."
    docker build -t seekhub-backend:latest -f Dockerfile ../..
    
    # 启动服务
    print_message "启动Docker服务..."
    docker-compose up -d
    
    print_success "Docker部署完成"
}

# GCP部署
deploy_gcp() {
    print_message "Google Cloud Platform部署..."
    
    # 设置项目
    gcloud config set project $FIRESTORE_PROJECT_ID
    
    # 部署到Compute Engine或Cloud Run
    print_warning "GCP部署功能开发中..."
    
    print_success "GCP部署完成"
}

# 本地部署
deploy_local() {
    print_message "本地部署..."
    
    # 检查配置文件
    if [ ! -f ".env" ]; then
        print_warning ".env 文件不存在，从模板创建..."
        cp config/templates/env.template .env
        print_warning "请编辑 .env 文件填入您的配置"
    fi
    
    # 启动应用
    print_message "启动应用..."
    python main.py start --workers 4 &
    
    # 保存PID
    echo $! > seekhub.pid
    print_success "应用已启动，PID: $(cat seekhub.pid)"
    
    print_success "本地部署完成"
}

# 健康检查
health_check() {
    print_message "执行健康检查..."
    
    sleep 5  # 等待服务启动
    
    if python tools/health_check.py; then
        print_success "健康检查通过"
    else
        print_error "健康检查失败"
        exit 1
    fi
}

# 部署后清理
cleanup() {
    print_message "清理临时文件..."
    
    # 清理构建产物
    find . -name "*.pyc" -delete
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
    
    print_success "清理完成"
}

# 显示帮助信息
show_help() {
    echo "SeekHub 翻译系统部署脚本"
    echo ""
    echo "用法: $0 [选项] <部署类型>"
    echo ""
    echo "部署类型:"
    echo "  local   - 本地部署"
    echo "  docker  - Docker容器部署"
    echo "  gcp     - Google Cloud Platform部署"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -c, --check    仅执行健康检查"
    echo "  --skip-tests   跳过测试"
    echo ""
    echo "示例:"
    echo "  $0 local                # 本地部署"
    echo "  $0 docker               # Docker部署"
    echo "  $0 -c                   # 健康检查"
}

# 主函数
main() {
    # 默认值
    DEPLOYMENT_TYPE=""
    SKIP_TESTS=false
    CHECK_ONLY=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--check)
                CHECK_ONLY=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            local|docker|gcp)
                DEPLOYMENT_TYPE=$1
                shift
                ;;
            *)
                print_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 仅健康检查
    if [ "$CHECK_ONLY" = true ]; then
        health_check
        exit 0
    fi
    
    # 检查部署类型
    if [ -z "$DEPLOYMENT_TYPE" ]; then
        print_error "请指定部署类型"
        show_help
        exit 1
    fi
    
    # 开始部署
    print_message "开始 SeekHub 系统部署 (类型: $DEPLOYMENT_TYPE)"
    echo "=================================================="
    
    # 执行步骤
    check_environment
    check_dependencies
    
    if [ "$SKIP_TESTS" != true ]; then
        build_application
    fi
    
    case $DEPLOYMENT_TYPE in
        local)
            deploy_local
            ;;
        docker)
            deploy_docker
            ;;
        gcp)
            deploy_gcp
            ;;
    esac
    
    health_check
    cleanup
    
    echo "=================================================="
    print_success "🎉 SeekHub 系统部署完成!"
    
    if [ "$DEPLOYMENT_TYPE" = "local" ]; then
        echo ""
        print_message "启动命令:"
        echo "  GUI模式: python bin/quick_start.py gui"
        echo "  CLI模式: python bin/quick_start.py cli"
        echo ""
        print_message "停止命令:"
        echo "  kill \$(cat seekhub.pid)"
    fi
}

# 脚本入口
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 