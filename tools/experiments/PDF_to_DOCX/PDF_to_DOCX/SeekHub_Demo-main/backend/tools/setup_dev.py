#!/usr/bin/env python3
"""
开发环境设置脚本
自动化开发环境的配置和依赖安装
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def print_step(message):
    """打印步骤信息"""
    print(f"\n🔧 {message}")
    print("-" * 50)

def run_command(command, description=""):
    """运行命令并处理错误"""
    try:
        print(f"执行: {command}")
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 命令执行失败: {e}")
        if e.stderr:
            print(f"错误信息: {e.stderr}")
        return False

def setup_virtual_environment():
    """设置虚拟环境"""
    print_step("设置Python虚拟环境")
    
    venv_path = Path(".venv")
    if venv_path.exists():
        print("✅ 虚拟环境已存在")
        return True
    
    # 创建虚拟环境
    if not run_command("python -m venv .venv"):
        return False
    
    print("✅ 虚拟环境创建成功")
    return True

def install_dependencies():
    """安装项目依赖"""
    print_step("安装项目依赖")
    
    # 根据操作系统选择激活命令
    if os.name == 'nt':  # Windows
        activate_cmd = ".venv\\Scripts\\activate"
        pip_cmd = ".venv\\Scripts\\pip"
    else:  # Linux/Mac
        activate_cmd = "source .venv/bin/activate"
        pip_cmd = ".venv/bin/pip"
    
    # 升级pip
    if not run_command(f"{pip_cmd} install --upgrade pip"):
        return False
    
    # 安装依赖
    if not run_command(f"{pip_cmd} install -r requirements.txt"):
        return False
    
    print("✅ 依赖安装完成")
    return True

def setup_config_files():
    """设置配置文件"""
    print_step("设置配置文件")
    
    # 复制环境变量模板
    env_template = Path("config/templates/env.template")
    env_file = Path(".env")
    
    if not env_file.exists() and env_template.exists():
        shutil.copy(env_template, env_file)
        print("✅ .env 文件已创建")
        print("💡 请编辑 .env 文件填入您的配置")
    else:
        print("✅ .env 文件已存在")
    
    # 复制配置文件模板
    config_template = Path("config/templates/config.yaml")
    config_file = Path("config/development.yaml")
    
    if not config_file.exists() and config_template.exists():
        shutil.copy(config_template, config_file)
        print("✅ development.yaml 配置文件已创建")
    else:
        print("✅ 开发配置文件已存在")

def create_log_directory():
    """创建日志目录"""
    print_step("创建日志目录")
    
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # 创建日志文件
    (log_dir / "seekhub.log").touch()
    (log_dir / "error.log").touch()
    
    print("✅ 日志目录创建完成")

def verify_installation():
    """验证安装"""
    print_step("验证安装")
    
    # 检查主要模块
    try:
        sys.path.insert(0, str(Path.cwd()))
        from src.common.logger import setup_logger
        from src.common.config_manager import config_manager
        print("✅ 核心模块导入成功")
    except ImportError as e:
        print(f"❌ 模块导入失败: {e}")
        return False
    
    return True

def main():
    """主函数"""
    print("🌟 SeekHub 开发环境设置工具")
    print("=" * 50)
    
    # 检查Python版本
    if sys.version_info < (3, 8):
        print("❌ 需要Python 3.8或更高版本")
        return 1
    
    # 检查当前目录
    if not Path("main.py").exists():
        print("❌ 请在backend目录中运行此脚本")
        return 1
    
    steps = [
        setup_virtual_environment,
        install_dependencies,
        setup_config_files,
        create_log_directory,
        verify_installation
    ]
    
    for step in steps:
        if not step():
            print(f"\n❌ 设置失败于步骤: {step.__name__}")
            return 1
    
    print("\n" + "=" * 50)
    print("🎉 开发环境设置完成！")
    print("\n📝 下一步:")
    print("1. 编辑 .env 文件填入您的Google Cloud配置")
    print("2. 运行: python bin/quick_start.py gui")
    print("3. 开始开发！")
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 