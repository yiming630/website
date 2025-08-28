# Frontend Backend Connection Guide
# 前后端连接完整指南

## 🎯 概述

本文档详细说明了前端每个页面和按钮与后端GraphQL API的连接方式，确保所有功能都正常工作。

## 📋 页面连接状态检查清单

| 页面 | 路径 | 连接状态 | 主要功能 |
|------|------|---------|---------|
| 登录页 | `/login` | ✅ 已更新 | 登录、注册、演示账号 |
| 主页 | `/` | ⏳ 待更新 | 首页展示 |
| 仪表板 | `/dashboard_MainPage` | ⏳ 待更新 | 用户统计、最近活动 |
| 工作台 | `/workspace` | ⏳ 待更新 | 文档列表、上传、管理 |
| 翻译页 | `/translate` | ⏳ 待更新 | 新建翻译任务 |
| 翻译编辑器 | `/translate-editor` | ⏳ 待更新 | 编辑翻译内容 |
| 预览页 | `/preview` | ⏳ 待更新 | 预览翻译结果 |
| 处理中 | `/translating` | ⏳ 待更新 | 显示翻译进度 |

## 🔧 已配置的基础架构

### 1. Apollo Client配置 ✅
文件：`frontend/lib/apollo-client.ts`
- GraphQL HTTP连接
- WebSocket订阅支持
- JWT认证中间件
- 错误处理

### 2. 服务层 ✅
位置：`frontend/services/`
- `auth.service.ts` - 认证服务
- `document.service.ts` - 文档管理
- `project.service.ts` - 项目管理
- `chat.service.ts` - 聊天和AI

### 3. React Hooks ✅
位置：`frontend/hooks/`
- `useAuth.tsx` - 认证状态管理
- `useDocuments.ts` - 文档操作

### 4. TypeScript类型 ✅
文件：`frontend/types/graphql.ts`
- 完整的GraphQL类型定义
- 枚举和接口

## 📱 页面详细连接方案

### 1. 登录页面 (`/login`) ✅ 已完成

**已连接的功能：**
- ✅ 用户登录 - 连接到 `mutation login`
- ✅ 用户注册 - 连接到 `mutation register`
- ✅ 演示账号登录
- ✅ 错误处理和提示
- ✅ 自动跳转到仪表板

### 2. 仪表板页面 (`/dashboard_MainPage`)

**需要连接的功能：**

```typescript
// 需要获取的数据
const { user, loading: userLoading } = useAuth()
const { documents, loading: docsLoading } = useDocuments({ limit: 5 })

// 统计数据查询
const GET_USER_STATS = gql`
  query GetUserStats {
    me {
      id
      name
      plan
      preferences
      documents {
        id
        status
      }
    }
    recentDocuments(limit: 5) {
      id
      title
      status
      progress
      sourceLanguage
      targetLanguage
      createdAt
    }
  }
`
```

**按钮连接：**
- "新建翻译" → 跳转到 `/translate` 或 `/workspace`
- "查看历史" → 调用 `documentService.getDocuments()`
- "升级" → 跳转到付费页面
- "团队协作" → 调用 `projectService.getProjects()`

### 3. 工作台页面 (`/workspace`)

**需要连接的功能：**

```typescript
// 文档列表
const { documents, uploadDocument, deleteDocument, loading } = useDocuments()

// 文件上传处理
const handleFileUpload = async (file: File) => {
  const document = await uploadDocument(file, {
    targetLanguage: 'zh',
    translationStyle: TranslationStyle.GENERAL,
    specialization: 'general'
  })
}

// 删除文档
const handleDelete = async (documentId: string) => {
  await deleteDocument(documentId)
}
```

**按钮连接：**
- "上传文档" → `documentService.uploadFile()` + `documentService.uploadDocument()`
- "删除" → `documentService.deleteDocument()`
- "下载" → 获取下载链接
- "重新翻译" → `documentService.retranslateDocument()`
- "分享" → `documentService.shareDocument()`

### 4. 翻译页面 (`/translate`)

**需要连接的功能：**

```typescript
// 创建新的翻译任务
const CREATE_TRANSLATION = gql`
  mutation CreateTranslation($input: UploadDocumentInput!) {
    uploadDocument(input: $input) {
      id
      status
      progress
    }
  }
`

// 翻译文本
const TRANSLATE_TEXT = gql`
  mutation TranslateText($input: TranslateTextInput!) {
    translateText(input: $input) {
      translatedText
      sourceLanguage
      targetLanguage
    }
  }
`
```

**按钮连接：**
- "选择文件" → 文件选择器
- "开始翻译" → `documentService.uploadDocument()`
- "文本翻译" → `documentService.translateText()`
- "保存设置" → `authService.updatePreferences()`

### 5. 翻译编辑器 (`/translate-editor`)

**需要连接的功能：**

```typescript
// 获取文档内容
const GET_DOCUMENT = gql`
  query GetDocument($id: ID!) {
    document(id: $id) {
      id
      title
      originalContent
      translatedContent
      chatHistory {
        id
        content
        author
      }
    }
  }
`

// AI改进翻译
const IMPROVE_TRANSLATION = gql`
  mutation ImproveTranslation($input: ImproveTranslationInput!) {
    improveTranslation(input: $input) {
      improvedTranslation
    }
  }
`
```

**按钮连接：**
- "保存" → 更新文档内容
- "AI优化" → `documentService.improveTranslation()`
- "发送消息" → `chatService.sendMessage()`
- "导出" → 生成下载链接

### 6. 预览页面 (`/preview`)

**需要连接的功能：**

```typescript
// 获取文档预览
const { document } = useDocument(documentId)

// 订阅文档更新
useEffect(() => {
  const subscription = documentService.subscribeToDocumentUpdates(
    documentId,
    (updates) => {
      // 更新预览内容
    }
  )
  return () => subscription.unsubscribe()
}, [documentId])
```

### 7. 处理中页面 (`/translating`)

**需要连接的功能：**

```typescript
// 订阅翻译进度
const TRANSLATION_PROGRESS = gql`
  subscription TranslationProgress($documentId: ID!) {
    translationProgress(documentId: $documentId) {
      documentId
      status
      progress
      currentStep
      estimatedTimeRemaining
      error
    }
  }
`
```

## 🚀 快速集成步骤

### 步骤1：确保Provider配置

```typescript
// app/layout.tsx
import { ApolloProvider } from '@apollo/client'
import { AuthProvider } from '@/hooks/useAuth'
import { apolloClient } from '@/lib/apollo-client'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ApolloProvider client={apolloClient}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ApolloProvider>
      </body>
    </html>
  )
}
```

### 步骤2：在页面中使用hooks

```typescript
// 任何页面组件
import { useAuth } from '@/hooks/useAuth'
import { useDocuments } from '@/hooks/useDocuments'

export default function MyPage() {
  const { user, isAuthenticated } = useAuth()
  const { documents, uploadDocument } = useDocuments()
  
  // 使用数据和方法
}
```

### 步骤3：处理加载和错误状态

```typescript
if (loading) {
  return <LoadingSpinner />
}

if (error) {
  return <ErrorMessage message={error} />
}

return <PageContent data={data} />
```

## 🧪 测试连接

### 1. 测试认证流程
```bash
# 1. 启动后端
cd backend
npm start

# 2. 启动前端
cd frontend
npm run dev

# 3. 访问登录页面
# http://localhost:3000/login

# 4. 测试功能
- 注册新用户
- 登录
- 查看是否跳转到仪表板
```

### 2. 测试文档操作
```bash
# 在工作台页面测试
- 上传文档
- 查看文档列表
- 删除文档
- 查看翻译进度
```

### 3. 检查网络请求
```javascript
// 在浏览器控制台
// F12 → Network → 筛选 GraphQL

// 应该看到的请求：
- http://localhost:4000/graphql (POST)
- ws://localhost:4000/graphql (WebSocket)
```

## 🔍 常见问题

### 1. CORS错误
**问题**：`Access-Control-Allow-Origin` 错误

**解决**：
```javascript
// backend/index.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))
```

### 2. WebSocket连接失败
**问题**：WebSocket连接不上

**解决**：
```javascript
// 检查后端WebSocket配置
// 确保防火墙允许WebSocket连接
```

### 3. 401未授权错误
**问题**：API调用返回401

**解决**：
```javascript
// 检查token是否正确保存
console.log(localStorage.getItem('token'))

// 确保token添加到请求头
```

### 4. 按钮无响应
**问题**：点击按钮没有反应

**检查清单**：
- ✓ onClick事件绑定正确
- ✓ 异步函数使用async/await
- ✓ 错误被正确捕获和显示
- ✓ loading状态正确处理
- ✓ 按钮disabled状态管理

## 📊 连接状态监控

### 创建连接测试页面

```typescript
// app/test-connection/page.tsx
export default function TestConnection() {
  const { user } = useAuth()
  const { documents } = useDocuments()
  
  return (
    <div>
      <h1>连接测试</h1>
      <div>
        <h2>认证状态</h2>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
      <div>
        <h2>文档数据</h2>
        <pre>{JSON.stringify(documents, null, 2)}</pre>
      </div>
    </div>
  )
}
```

## ✅ 完成检查清单

- [ ] Apollo Client配置完成
- [ ] 所有服务层实现
- [ ] 所有Hooks创建
- [ ] 登录页面连接
- [ ] 仪表板页面连接
- [ ] 工作台页面连接
- [ ] 翻译页面连接
- [ ] 编辑器页面连接
- [ ] 预览页面连接
- [ ] 进度页面连接
- [ ] 错误处理完善
- [ ] 加载状态处理
- [ ] WebSocket订阅工作

## 📝 下一步行动

1. **立即修复**：更新所有页面使用真实数据
2. **测试**：逐页测试所有按钮功能
3. **优化**：添加缓存和性能优化
4. **监控**：添加错误追踪和日志
