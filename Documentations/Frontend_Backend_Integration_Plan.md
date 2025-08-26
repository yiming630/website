# Frontend Backend Integration Plan
# 前端后端集成计划

## 概述
本文档描述了如何将GraphQL后端完整集成到Next.js前端应用中。

## 技术栈
- **前端框架**: Next.js 14
- **GraphQL客户端**: Apollo Client
- **状态管理**: Apollo Cache + React Context
- **认证**: JWT Token
- **实时通信**: GraphQL Subscriptions (WebSocket)
- **类型系统**: TypeScript

## 集成架构

```
Frontend (Next.js)
    ├── Apollo Client
    │   ├── HTTP Link (Queries/Mutations)
    │   └── WebSocket Link (Subscriptions)
    ├── Service Layer
    │   ├── AuthService
    │   ├── DocumentService
    │   ├── ProjectService
    │   ├── ChatService
    │   └── ConfigService
    └── UI Components
        └── React Hooks
```

## 实施步骤

### Phase 1: 基础设施 (Day 1)
1. **设置Apollo Client**
   - 安装依赖包
   - 配置HTTP和WebSocket链接
   - 设置认证中间件
   - 配置缓存策略

2. **创建TypeScript类型定义**
   - 从GraphQL Schema生成类型
   - 定义输入/输出接口
   - 创建枚举类型

### Phase 2: 核心服务 (Day 2-3)
3. **认证服务 (AuthService)**
   - 用户注册
   - 用户登录
   - Token刷新
   - 用户登出
   - 个人资料管理

4. **文档服务 (DocumentService)**
   - 文档上传
   - 文档列表
   - 文档详情
   - 翻译功能
   - 下载管理
   - 文档删除

### Phase 3: 协作功能 (Day 4-5)
5. **项目服务 (ProjectService)**
   - 项目创建
   - 项目列表
   - 项目更新
   - 项目删除
   - 协作者管理

6. **聊天服务 (ChatService)**
   - 发送消息
   - 获取历史记录
   - AI助手集成
   - 实时消息订阅

### Phase 4: 实时功能 (Day 6)
7. **订阅服务 (SubscriptionService)**
   - 翻译进度订阅
   - 文档更新订阅
   - 聊天消息订阅

8. **配置服务 (ConfigService)**
   - 支持语言列表
   - 翻译专业领域
   - 用户偏好设置

## 详细实现

### 1. Apollo Client配置

#### 1.1 安装依赖
```bash
npm install @apollo/client graphql subscriptions-transport-ws
npm install --save-dev @graphql-codegen/cli @graphql-codegen/typescript
```

#### 1.2 基础配置
```typescript
// lib/apollo-client.ts
import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
});

const wsLink = new WebSocketLink({
  uri: process.env.NEXT_PUBLIC_WS_ENDPOINT || 'ws://localhost:4000/graphql',
  options: {
    reconnect: true,
    connectionParams: () => ({
      authToken: localStorage.getItem('token'),
    }),
  },
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  authLink.concat(httpLink),
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
```

### 2. TypeScript类型定义

#### 2.1 基础类型
```typescript
// types/graphql.ts
export enum UserRole {
  READER = 'READER',
  TRANSLATOR = 'TRANSLATOR',
  ADMIN = 'ADMIN',
  ENTERPRISE = 'ENTERPRISE',
}

export enum DocumentStatus {
  PROCESSING = 'PROCESSING',
  TRANSLATING = 'TRANSLATING',
  REVIEWING = 'REVIEWING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum TranslationStyle {
  GENERAL = 'GENERAL',
  ACADEMIC = 'ACADEMIC',
  BUSINESS = 'BUSINESS',
  LEGAL = 'LEGAL',
  TECHNICAL = 'TECHNICAL',
  CREATIVE = 'CREATIVE',
  MEDICAL = 'MEDICAL',
  FINANCIAL = 'FINANCIAL',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: string;
  preferences?: any;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Document {
  id: string;
  title: string;
  status: DocumentStatus;
  progress: number;
  sourceLanguage: string;
  targetLanguage: string;
  translationStyle: TranslationStyle;
  specialization: string;
  originalContent?: string;
  translatedContent?: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  owner: User;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. 服务层实现

#### 3.1 认证服务
```typescript
// services/auth.service.ts
import { gql } from '@apollo/client';
import { apolloClient } from '@/lib/apollo-client';

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        name
        email
        role
      }
      token
      refreshToken
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        name
        email
        role
      }
      token
      refreshToken
    }
  }
`;

export class AuthService {
  async register(name: string, email: string, password: string, role?: UserRole) {
    const { data } = await apolloClient.mutate({
      mutation: REGISTER_MUTATION,
      variables: {
        input: { name, email, password, role }
      }
    });
    
    this.saveTokens(data.register.token, data.register.refreshToken);
    return data.register;
  }
  
  async login(email: string, password: string) {
    const { data } = await apolloClient.mutate({
      mutation: LOGIN_MUTATION,
      variables: {
        input: { email, password }
      }
    });
    
    this.saveTokens(data.login.token, data.login.refreshToken);
    return data.login;
  }
  
  private saveTokens(token: string, refreshToken: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
  }
  
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    apolloClient.clearStore();
  }
}
```

#### 3.2 文档服务
```typescript
// services/document.service.ts
import { gql } from '@apollo/client';
import { apolloClient } from '@/lib/apollo-client';

const UPLOAD_DOCUMENT = gql`
  mutation UploadDocument($input: UploadDocumentInput!) {
    uploadDocument(input: $input) {
      id
      title
      status
      progress
      sourceLanguage
      targetLanguage
      translationStyle
      specialization
      fileUrl
      fileSize
      fileType
      createdAt
    }
  }
`;

const GET_DOCUMENTS = gql`
  query GetDocuments($projectId: ID, $limit: Int, $offset: Int) {
    documents(projectId: $projectId, limit: $limit, offset: $offset) {
      id
      title
      status
      progress
      sourceLanguage
      targetLanguage
      translationStyle
      specialization
      createdAt
      updatedAt
    }
  }
`;

const TRANSLATION_PROGRESS_SUBSCRIPTION = gql`
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
`;

export class DocumentService {
  async uploadDocument(input: {
    title: string;
    sourceLanguage: string;
    targetLanguage: string;
    translationStyle: TranslationStyle;
    specialization: string;
    fileUrl: string;
    fileSize?: number;
    fileType?: string;
    projectId?: string;
  }) {
    const { data } = await apolloClient.mutate({
      mutation: UPLOAD_DOCUMENT,
      variables: { input }
    });
    return data.uploadDocument;
  }
  
  async getDocuments(projectId?: string, limit = 10, offset = 0) {
    const { data } = await apolloClient.query({
      query: GET_DOCUMENTS,
      variables: { projectId, limit, offset }
    });
    return data.documents;
  }
  
  subscribeToProgress(documentId: string, onUpdate: (progress: any) => void) {
    return apolloClient.subscribe({
      query: TRANSLATION_PROGRESS_SUBSCRIPTION,
      variables: { documentId }
    }).subscribe({
      next: ({ data }) => onUpdate(data.translationProgress),
      error: (err) => console.error('Subscription error:', err),
    });
  }
}
```

### 4. React Hooks集成

#### 4.1 认证Hook
```typescript
// hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from 'react';
import { AuthService } from '@/services/auth.service';
import { User } from '@/types/graphql';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authService = new AuthService();
  
  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    setUser(result.user);
  };
  
  const register = async (name: string, email: string, password: string) => {
    const result = await authService.register(name, email, password);
    setUser(result.user);
  };
  
  const logout = () => {
    authService.logout();
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### 4.2 文档Hook
```typescript
// hooks/useDocuments.ts
import { useState, useEffect } from 'react';
import { DocumentService } from '@/services/document.service';
import { Document, TranslationStyle } from '@/types/graphql';

export function useDocuments(projectId?: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const documentService = new DocumentService();
  
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docs = await documentService.getDocuments(projectId);
      setDocuments(docs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const uploadDocument = async (file: File, options: {
    targetLanguage: string;
    translationStyle: TranslationStyle;
    specialization: string;
  }) => {
    // 上传文件到存储
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const { fileUrl, fileSize, fileType } = await uploadResponse.json();
    
    // 创建文档记录
    const document = await documentService.uploadDocument({
      title: file.name,
      sourceLanguage: 'auto',
      targetLanguage: options.targetLanguage,
      translationStyle: options.translationStyle,
      specialization: options.specialization,
      fileUrl,
      fileSize,
      fileType
    });
    
    // 订阅进度更新
    const subscription = documentService.subscribeToProgress(
      document.id,
      (progress) => {
        setDocuments(prev => prev.map(doc => 
          doc.id === document.id 
            ? { ...doc, ...progress }
            : doc
        ));
      }
    );
    
    return { document, subscription };
  };
  
  useEffect(() => {
    fetchDocuments();
  }, [projectId]);
  
  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
    uploadDocument
  };
}
```

### 5. 组件集成示例

#### 5.1 文档上传组件
```typescript
// components/DocumentUpload.tsx
import { useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { TranslationStyle } from '@/types/graphql';

export function DocumentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState('zh');
  const [style, setStyle] = useState<TranslationStyle>(TranslationStyle.GENERAL);
  const { uploadDocument } = useDocuments();
  
  const handleUpload = async () => {
    if (!file) return;
    
    const { document, subscription } = await uploadDocument(file, {
      targetLanguage,
      translationStyle: style,
      specialization: 'general'
    });
    
    console.log('Document uploaded:', document);
  };
  
  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}>
        <option value="zh">中文</option>
        <option value="en">English</option>
        <option value="ja">日本語</option>
      </select>
      <select value={style} onChange={(e) => setStyle(e.target.value as TranslationStyle)}>
        <option value={TranslationStyle.GENERAL}>通用</option>
        <option value={TranslationStyle.ACADEMIC}>学术</option>
        <option value={TranslationStyle.BUSINESS}>商务</option>
      </select>
      <button onClick={handleUpload}>上传并翻译</button>
    </div>
  );
}
```

## 测试计划

### 单元测试
- 服务层方法测试
- GraphQL查询/变更测试
- Hook功能测试

### 集成测试
- 认证流程测试
- 文档上传和翻译测试
- 实时订阅测试

### E2E测试
- 完整用户流程测试
- 多用户协作测试
- 错误处理测试

## 部署注意事项

1. **环境变量配置**
   ```env
   NEXT_PUBLIC_GRAPHQL_ENDPOINT=https://api.seekhub.com/graphql
   NEXT_PUBLIC_WS_ENDPOINT=wss://api.seekhub.com/graphql
   ```

2. **生产环境优化**
   - 启用Apollo Cache持久化
   - 配置请求重试策略
   - 实现离线支持

3. **安全考虑**
   - Token安全存储
   - XSS防护
   - CSRF防护

## 时间线

- **Day 1**: Apollo Client设置 + TypeScript类型
- **Day 2**: 认证服务 + 文档服务
- **Day 3**: 项目服务 + 聊天服务
- **Day 4**: 订阅服务 + 实时更新
- **Day 5**: UI组件集成
- **Day 6**: 测试和优化

## 下一步

1. 安装必要的依赖包
2. 创建Apollo Client配置
3. 实现认证服务
4. 逐步实现各个服务模块
