# Translator服务OpenRouter迁移指南

## 概述
本指南说明如何将translator服务从Google Gemini API迁移到OpenRouter，以解决在中国大陆地区的访问问题。

## 改造内容

### 1. 核心变更
- **API提供商**: 从Google Gemini直连改为通过OpenRouter访问
- **认证方式**: 从Google API密钥改为OpenRouter API密钥
- **网络访问**: 无需VPN即可在国内正常访问

### 2. 新增功能
- ✅ 流式翻译端点 `/translate/stream`
- ✅ 批量翻译端点 `/translate/batch`
- ✅ 健康检查端点 `/health`
- ✅ 详细的错误处理和重试机制
- ✅ 返回使用的模型和token数量信息

## 迁移步骤

### 步骤1: 获取OpenRouter API密钥
1. 访问 [OpenRouter官网](https://openrouter.ai/)
2. 注册账号并登录
3. 在Dashboard中创建API密钥
4. 充值账户（支持支付宝、微信等国内支付方式）

### 步骤2: 安装依赖
```bash
# 进入translator目录
cd tools/experiments/PDF_to_DOCX/PDF_to_DOCX/SeekHub_Demo-main/translator/

# 安装新的依赖
pip install -r requirements_openrouter.txt
```

### 步骤3: 配置环境变量
```bash
# 复制环境变量示例文件
cp env.example .env

# 编辑.env文件，填入您的OpenRouter API密钥
# OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

### 步骤4: 运行服务

#### 开发环境
```bash
# 使用新的main_openrouter.py文件
uvicorn main_openrouter:app --reload --port 8000
```

#### 生产环境
```bash
# 使用环境变量运行
export OPENROUTER_API_KEY=your_key_here
python main_openrouter.py
```

## API兼容性

### 完全兼容的端点
- `POST /translate` - 主翻译端点，请求和响应格式保持不变

### 新增端点
1. **流式翻译** `POST /translate/stream`
   - 支持实时流式返回翻译结果
   - 适合长文本的实时显示

2. **批量翻译** `POST /translate/batch`
   - 一次请求翻译多个文本
   - 最多支持10个文本

3. **健康检查** `GET /health`
   - 检查服务状态

## 测试

### 基础测试
```bash
# 测试健康检查
curl http://localhost:8000/health

# 测试翻译
curl -X POST http://localhost:8000/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, world!"}'
```

### Python测试脚本
运行 `test_translator.py` 进行完整测试：
```bash
python test_translator.py
```

## 费用对比

### Google Gemini (直连)
- Gemini Pro: $0.00025/1K characters
- 需要VPN（额外成本）
- 可能存在访问不稳定

### OpenRouter
- Gemini Pro: $0.000125/1K tokens (约50%成本)
- 无需VPN
- 国内访问稳定
- 支持多种支付方式

## 性能优化建议

1. **使用流式翻译**
   - 对于长文本，使用流式端点可以提升用户体验

2. **批量处理**
   - 多个短文本使用批量翻译端点，减少请求次数

3. **缓存策略**
   - 考虑在应用层实现翻译缓存，减少重复翻译

## 故障排查

### 常见问题

1. **API密钥无效**
   - 检查环境变量是否正确设置
   - 确认OpenRouter账户有足够余额

2. **翻译超时**
   - 检查网络连接
   - 考虑减小单次翻译文本大小

3. **模型不可用**
   - 服务会自动切换到备用模型
   - 检查OpenRouter状态页面

## 回滚方案

如需回滚到原始Google Gemini版本：
1. 使用原始的 `main.py` 文件
2. 恢复原始的 `requirements.txt`
3. 设置 `GOOGLE_API_KEY` 环境变量

## 支持

如有问题，请查看：
- OpenRouter文档: https://openrouter.ai/docs
- 项目Issue页面
- 联系技术支持团队
