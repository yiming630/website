# Frontend Backend Connection Testing Guide
# 前后端连接测试指南

## ✅ 已完成的连接工作

### 1. 核心基础架构
- **Apollo Client配置** (`lib/apollo-client.ts`) - GraphQL客户端，支持HTTP和WebSocket
- **AuthProvider** (`hooks/useAuth.tsx`) - 全局认证状态管理
- **服务层** (`services/`) - 完整的API服务封装
- **类型定义** (`types/graphql.ts`) - TypeScript类型支持

### 2. 已更新的页面
| 页面 | 文件路径 | 连接状态 | 功能 |
|------|---------|---------|------|
| 布局 | `app/layout.tsx` | ✅ | Apollo和Auth Provider |
| 登录 | `app/login/page.tsx` | ✅ | 登录、注册、演示账号 |
| 仪表板 | `app/dashboard_MainPage/page.tsx` | ✅ | 用户数据、文档统计 |
| 工作台 | `app/workspace/page.tsx` | ✅ | 文档管理、上传、删除 |

## 🧪 测试步骤

### 1. 启动后端服务

```bash
# 在终端1中
cd backend

# 确保环境配置正确
npm run setup

# 启动API服务器
npm start
```

后端应该在 `http://localhost:4000/graphql` 运行

### 2. 启动前端应用

```bash
# 在终端2中
cd frontend

# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev
```

前端应该在 `http://localhost:3000` 运行

### 3. 测试认证功能

#### 3.1 注册测试
1. 访问 `http://localhost:3000/login`
2. 点击"立即注册"切换到注册模式
3. 填写信息：
   - 姓名：测试用户
   - 邮箱：test@example.com
   - 密码：test123456
   - 确认密码：test123456
4. 点击"注册"按钮
5. **期望结果**：
   - 显示"注册成功，正在跳转..."
   - 自动跳转到仪表板页面

#### 3.2 登录测试
1. 如果已登录，先点击右上角登出按钮
2. 访问 `http://localhost:3000/login`
3. 输入刚才注册的账号：
   - 邮箱：test@example.com
   - 密码：test123456
4. 点击"登录"按钮
5. **期望结果**：
   - 显示"登录成功，正在跳转..."
   - 自动跳转到仪表板页面

#### 3.3 演示账号测试
1. 在登录页面点击"使用演示账号快速体验"
2. **期望结果**：
   - 自动创建或登录演示账号
   - 跳转到仪表板页面

### 4. 测试仪表板功能

访问 `http://localhost:3000/dashboard_MainPage`

**应该看到的内容**：
- ✅ 用户名显示在顶部导航栏
- ✅ 统计卡片显示真实数据（总文档数、已完成、处理中、成功率）
- ✅ 最近文档列表（如果有的话）
- ✅ 账户信息显示（账户类型、注册时间等）

**测试按钮功能**：
- 点击"新建翻译" → 应跳转到翻译页面
- 点击"工作台" → 应跳转到工作台页面
- 点击"查看所有文档" → 应跳转到工作台
- 点击"刷新" → 应重新加载数据
- 点击"退出登录" → 应返回登录页面

### 5. 测试工作台功能

访问 `http://localhost:3000/workspace`

**测试文档上传**：
1. 点击"上传文档"按钮
2. 选择一个文件（PDF、DOCX、TXT等）
3. 选择目标语言和翻译风格
4. 点击"上传并开始翻译"
5. **期望结果**：
   - 文件上传进度显示
   - 文档出现在列表中
   - 显示翻译进度

**测试文档管理**：
- 搜索功能：输入关键词，按Enter搜索
- 筛选功能：选择不同状态筛选文档
- 排序功能：按日期、名称、状态排序
- 删除功能：点击文档卡片的"..."菜单，选择删除

### 6. 检查网络请求

打开浏览器开发者工具（F12），切换到Network标签：

**应该看到的GraphQL请求**：
```
POST http://localhost:4000/graphql
```

**请求内容示例**：
- `operationName: "Login"` - 登录请求
- `operationName: "Register"` - 注册请求
- `operationName: "GetMe"` - 获取用户信息
- `operationName: "GetDocuments"` - 获取文档列表

**WebSocket连接**（如果有订阅）：
```
ws://localhost:4000/graphql
```

## 🔍 故障排查

### 问题1：CORS错误
**错误信息**：
```
Access to fetch at 'http://localhost:4000/graphql' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**解决方案**：
确保后端配置了CORS：
```javascript
// backend/index.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))
```

### 问题2：无法连接到后端
**错误信息**：
```
Network error: Failed to fetch
```

**检查步骤**：
1. 确认后端正在运行：`curl http://localhost:4000/graphql`
2. 检查端口是否正确
3. 检查防火墙设置

### 问题3：401未授权错误
**错误信息**：
```
GraphQL error: Unauthorized
```

**解决方案**：
1. 清除localStorage：
```javascript
localStorage.clear()
```
2. 重新登录

### 问题4：按钮点击无反应
**检查清单**：
- [ ] 浏览器控制台是否有错误
- [ ] 网络请求是否发出
- [ ] loading状态是否正确显示
- [ ] 后端是否返回错误

## 📋 完整测试清单

### 认证系统
- [ ] 新用户注册成功
- [ ] 已注册用户登录成功
- [ ] 演示账号登录成功
- [ ] 登出功能正常
- [ ] 未登录访问受保护页面会重定向到登录页

### 仪表板
- [ ] 显示当前用户信息
- [ ] 显示文档统计数据
- [ ] 显示最近文档列表
- [ ] 刷新按钮更新数据
- [ ] 所有导航按钮工作正常

### 工作台
- [ ] 文档列表正确显示
- [ ] 文档上传功能正常
- [ ] 文档删除功能正常
- [ ] 搜索功能正常
- [ ] 筛选和排序功能正常
- [ ] 文档状态实时更新

### 错误处理
- [ ] 网络错误有友好提示
- [ ] 表单验证错误正确显示
- [ ] 加载状态正确显示
- [ ] 空状态有合适的提示

## 🚀 下一步优化建议

1. **添加更多页面连接**：
   - 翻译页面 (`/translate`)
   - 编辑器页面 (`/translate-editor`)
   - 预览页面 (`/preview`)

2. **实现实时功能**：
   - WebSocket订阅翻译进度
   - 实时文档状态更新
   - 实时聊天功能

3. **性能优化**：
   - 实现分页加载
   - 添加缓存策略
   - 优化大文件上传

4. **用户体验提升**：
   - 添加操作成功/失败的Toast提示
   - 添加操作确认对话框
   - 改进加载和错误状态的UI

## 📞 需要帮助？

如果测试过程中遇到问题：

1. **检查日志**：
   - 前端：浏览器控制台
   - 后端：终端输出

2. **验证配置**：
   - 确保 `.env` 文件配置正确
   - 确保数据库连接正常
   - 确保端口没有被占用

3. **清理缓存**：
   ```bash
   # 前端
   rm -rf .next
   npm run dev
   
   # 后端
   npm restart
   ```

## ✅ 测试完成确认

所有测试通过后，您的前后端连接就完全建立了！现在可以：
- 上传和管理文档
- 查看翻译进度
- 使用AI功能
- 团队协作（即将推出）
