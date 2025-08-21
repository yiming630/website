# SeekHub 翻译系统 Docker 镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libxml2-dev \
    libxslt-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制源代码
COPY src/ ./src/
COPY bin/ ./bin/
COPY config/ ./config/
COPY main.py .

# 创建日志目录
RUN mkdir -p logs

# 创建非root用户
RUN useradd -m -u 1000 seekhub && chown -R seekhub:seekhub /app
USER seekhub

# 暴露端口（如果需要）
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python tools/health_check.py || exit 1

# 启动命令
CMD ["python", "main.py", "start", "--workers", "4"] 