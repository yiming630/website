# =======================================================================
# I. 枚举类型 (Enums)
# 定义了系统中可预知的常量集合。
# =======================================================================

"""
用户角色：区分不同权限
"""
enum UserRole {
  READER   # 普通读者
  TRANSLATOR # 专业译者
  ADMIN    # 管理员
}

"""
文档处理状态：跟踪文档从上传到完成的整个生命周期
"""
enum DocumentStatus {
  UPLOADING   # 上传中
  PROCESSING  # 解析处理中
  PENDING     # 待翻译
  TRANSLATING # 翻译中
  REVIEWING   # 审核/编辑中
  COMPLETED   # 已完成
  FAILED      # 处理失败
}

"""
AI 聊天消息发送方
"""
enum ChatMessageAuthor {
  USER # 用户
  AI   # AI 助手
}

# =======================================================================
# II. 核心数据模型 (Core Types)
# 定义了应用中的核心业务对象。
# =======================================================================

"""
用户模型
代表一个平台用户，包含了基础信息和角色。
对应页面: /login, /workspace (协作者)
"""
type User {
  id: ID!
  name: String!
  avatarUrl: String
  email: String
  role: UserRole!
  createdAt: String!
}

"""
文档模型
代表用户上传和翻译的文档。
对应页面: /page.tsx (上传), /workspace, /translate, /translate-editor
"""
type Document {
  id: ID!
  title: String!
  sourceLanguage: String!
  targetLanguage: String!
  status: DocumentStatus!
  sourceContent: String # 原文内容 (富文本/HTML)
  translatedContent: String # 译文内容 (富文本/HTML)
  owner: User!
  collaborators: [User!]
  comments: [Comment!]
  createdAt: String!
  updatedAt: String!
  previewUrl: String # 预览链接
}

"""
项目模型
用于组织和管理一组相关的文档，主要为专业译者设计。
对应页面: /workspace
"""
type Project {
  id: ID!
  name: String!
  documents: [Document!]
  owner: User!
  createdAt: String!
}

"""
评论模型
用于在文档上进行批注和讨论。
对应页面: /translate-editor (SideBySideReviewPanel)
"""
type Comment {
  id: ID!
  author: User!
  content: String!
  position: String # 评论在文档中的位置 (例如，句子ID或范围)
  createdAt: String!
}

"""
AI 聊天消息模型
用于 AI 助手功能。
对应页面: /translate-editor
"""
type ChatMessage {
  id: ID!
  author: ChatMessageAuthor!
  content: String!
  timestamp: String!
}

"""
翻译任务进度模型
用于实时反馈翻译进度。
对应页面: /translating, /reader-translating
"""
type TranslationProgress {
  jobId: ID!
  progress: Int! # 进度百分比 (0-100)
  status: DocumentStatus!
  message: String # 状态信息，例如 "正在提取文本..."
}


# =======================================================================
# III. 输入类型 (Input Types)
# 定义了 Mutations 中使用的复杂输入对象。
# =======================================================================

"""
上传文档的输入参数
"""
input UploadDocumentInput {
  file: Upload! # GraphQL 文件上传类型
  projectId: ID # 可选，关联到某个项目
}

"""
更新文档内容的输入参数
"""
input UpdateDocumentContentInput {
  documentId: ID!
  translatedContent: String!
}

"""
发送 AI 聊天消息的输入参数
"""
input SendChatMessageInput {
  documentId: ID!
  content: String!
}

# =======================================================================
# IV. 查询接口 (Queries)
# 用于从后端获取数据，对应 HTTP GET 请求。
# =======================================================================

type Query {
  """
  获取当前登录用户的信息
  """
  me: User

  """
  获取专业译者的项目列表
  对应页面: /workspace
  """
  projects: [Project!]

  """
  获取单个项目的详细信息，包括其下的所有文档
  """
  project(id: ID!): Project

  """
  获取单个文档的详细信息
  对应页面: /translate-editor, /preview
  """
  document(id: ID!): Document

  """
  获取指定文档的 AI 聊天历史记录
  对应页面: /translate-editor
  """
  chatHistory(documentId: ID!): [ChatMessage!]
}


# =======================================================================
# V. 操作接口 (Mutations)
# 用于创建、更新或删除数据，对应 HTTP POST/PUT/DELETE 请求。
# =======================================================================

type Mutation {
  """
  使用手机号和验证码登录
  对应页面: /login
  返回 JWT Token 用于后续认证
  """
  loginWithPhone(phone: String!, code: String!): String

  """
  上传新文档并开始处理
  对应页面: /page.tsx
  """
  uploadDocument(input: UploadDocumentInput!): Document!

  """
  为专业译者创建新项目
  对应页面: /workspace
  """
  createProject(name: String!): Project!

  """
  开始翻译一个文档
  对应页面: /translate
  返回一个唯一的 jobId 用于跟踪进度
  """
  startTranslation(documentId: ID!, targetLanguage: String!): ID!

  """
  保存在编辑器中修改的译文内容
  对应页面: /translate-editor
  """
  updateDocumentContent(input: UpdateDocumentContentInput!): Document!

  """
  在文档中添加一条评论
  对应页面: /translate-editor
  """
  addComment(documentId: ID!, content: String!, position: String!): Comment!

  """
  向 AI 助手发送消息
  对应页面: /translate-editor
  """
  sendChatMessage(input: SendChatMessageInput!): ChatMessage!
  
  """
  分享文档给其他用户（添加协作者）
  """
  shareDocument(documentId: ID!, userEmail: String!): Document!
}


# =======================================================================
# VI. 实时订阅接口 (Subscriptions)
# 用于通过 WebSocket 接收来自服务器的实时推送事件。
# =======================================================================

type Subscription {
  """
  订阅翻译任务的实时进度
  对应页面: /translating
  """
  translationProgress(jobId: ID!): TranslationProgress!

  """
  订阅文档内容的实时更新（用于多人协作）
  当其他协作者保存时，会收到此通知
  对应页面: /translate-editor
  """
  documentUpdated(documentId: ID!): Document!

  """
  订阅新的 AI 聊天消息
  用于接收 AI 的响应
  对应页面: /translate-editor
  """
  newChatMessage(documentId: ID!): ChatMessage!

  """
  订阅文档中的新评论
  对应页面: /translate-editor
  """
  newComment(documentId: ID!): Comment!
}

# GraphQL 规范要求必须有一个 Upload 标量类型用于文件上传
scalar Upload