# 格式译专家 - 增强版 API 文档

## 项目概述

**项目名称**: 格式译专家 (Translation Format Expert)  
**版本**: 2.0.0  
**描述**: 基于 AI 的智能翻译平台完整 API 规范，支持多种文档格式的翻译并保持原文档格式和排版

---

## 技术架构

### API 架构
- **GraphQL**: 主要数据查询和操作接口
- **REST API**: 文件处理和实时通信接口  
- **WebSocket**: 实时进度推送和协作功能
- **文件服务**: 文档上传、处理、下载管理

### 认证方式
- **JWT Token**: 用户身份认证
- **API Key**: 服务间通信认证
- **OAuth 2.0**: 第三方集成认证

---

# =======================================================================
# I. 枚举类型 (Enums)
# 定义了系统中可预知的常量集合
# =======================================================================

## 用户角色枚举
```graphql
enum UserRole {
  READER      # 普通读者 - 基础翻译功能
  TRANSLATOR  # 专业译者 - 高级编辑和项目管理
  ADMIN       # 管理员 - 系统管理权限
  ENTERPRISE  # 企业用户 - 批量处理和定制功能
}
```

## 文档处理状态枚举
```graphql
enum DocumentStatus {
  UPLOADING      # 上传中
  VALIDATING     # 文件验证中
  PROCESSING     # 解析处理中
  SPLITTING      # 文档分割中
  TRANSLATING    # 翻译中
  INTEGRATING    # 内容整合中
  REVIEWING      # 审核/编辑中
  COMPLETED      # 已完成
  FAILED         # 处理失败
  CANCELLED      # 用户取消
  ARCHIVED       # 已归档
}
```

## 翻译风格枚举
```graphql
enum TranslationStyle {
  GENERAL     # 通用翻译风格
  ACADEMIC    # 学术论文风格
  BUSINESS    # 商务文档风格
  LEGAL       # 法律文件风格
  TECHNICAL   # 技术文档风格
  CREATIVE    # 创意文学风格
  MEDICAL     # 医学专业风格
  FINANCIAL   # 金融专业风格
}
```

## 处理步骤状态枚举
```graphql
enum StepStatus {
  PENDING      # 待处理
  IN_PROGRESS  # 进行中
  COMPLETED    # 已完成
  FAILED       # 失败
  SKIPPED      # 跳过
}
```

## AI 聊天消息发送方枚举
```graphql
enum ChatMessageAuthor {
  USER  # 用户
  AI    # AI 助手
}
```

## 文本对齐方式枚举
```graphql
enum TextAlignment {
  LEFT     # 左对齐
  CENTER   # 居中对齐
  RIGHT    # 右对齐
  JUSTIFY  # 两端对齐
}
```

## 错误代码枚举
```graphql
enum ErrorCode {
  FILE_TOO_LARGE           # 文件过大
  UNSUPPORTED_FORMAT       # 不支持的格式
  PROCESSING_FAILED        # 处理失败
  RATE_LIMIT_EXCEEDED      # 超出速率限制
  INSUFFICIENT_QUOTA       # 配额不足
  TRANSLATION_API_ERROR    # 翻译API错误
  NETWORK_ERROR           # 网络错误
  VALIDATION_ERROR        # 验证错误
  AUTHENTICATION_FAILED   # 认证失败
  PERMISSION_DENIED       # 权限不足
  UNKNOWN_ERROR          # 未知错误
}
```

---

# =======================================================================
# II. 核心数据模型 (Core Types)
# 定义了应用中的核心业务对象
# =======================================================================

## 用户模型
```graphql
"""
用户模型 - 代表平台用户的完整信息
对应页面: /login, /workspace, /dashboard
"""
type User {
  id: ID!
  name: String!
  email: String!
  phone: String
  avatarUrl: String
  role: UserRole!
  plan: String!                    # 套餐类型
  createdAt: String!
  updatedAt: String!
  
  # 使用统计
  stats: UserStats!
  quota: UsageQuota!
  preferences: UserPreferences
  
  # 关联数据
  projects: [Project!]
  documents: [Document!]
  collaborations: [Document!]      # 协作的文档
}
```

## 用户统计模型
```graphql
"""
用户统计信息 - 用于仪表板展示
对应页面: /workspace (dashboard view)
"""
type UserStats {
  tasksCompleted: Int!             # 完成的翻译任务数
  wordsTranslated: Int!            # 翻译的字符数
  timeSaved: Int!                  # 节省的时间(小时)
  documentsThisMonth: Int!         # 本月文档数
  accuracy: Float                  # 翻译准确率
  averageProcessingTime: Int       # 平均处理时间(分钟)
  
  # 历史趋势
  translationHistory: [TranslationSummary!]!
  languagePairs: [LanguagePair!]!
  specializationUsage: [SpecializationUsage!]!
}
```

## 配额使用模型
```graphql
"""
用户配额使用情况
"""
type UsageQuota {
  used: Int!                       # 已使用配额
  total: Int!                      # 总配额
  resetDate: String!              # 重置日期
  planType: String!               # 套餐类型
  features: [String!]!            # 可用功能列表
  isExpired: Boolean!             # 是否过期
}
```

## 用户偏好设置
```graphql
"""
用户个人偏好设置
"""
type UserPreferences {
  defaultSourceLanguage: String!
  defaultTargetLanguage: String!
  defaultTranslationStyle: TranslationStyle!
  autoSave: Boolean!
  emailNotifications: Boolean!
  theme: String!                   # light/dark
  editorFontSize: Int!
  showOriginalText: Boolean!
}
```

## 文档模型
```graphql
"""
文档模型 - 代表用户上传和翻译的文档
对应页面: /workspace, /translate, /translate-editor, /preview
"""
type Document {
  id: ID!
  title: String!
  originalFileName: String!
  fileSize: Int!                   # 文件大小(字节)
  pageCount: Int                   # 页数
  wordCount: Int                   # 字数
  
  # 语言和翻译配置
  sourceLanguage: String!
  detectedLanguage: String         # AI检测的语言
  targetLanguage: String!
  translationStyle: TranslationStyle!
  specialization: String!          # 专业领域
  
  # 状态和进度
  status: DocumentStatus!
  progress: Int!                   # 处理进度 0-100
  currentStep: String              # 当前处理步骤
  
  # 内容
  sourceContent: String            # 原文内容 (富文本/HTML)
  translatedContent: String        # 译文内容 (富文本/HTML)
  
  # 文件URLs
  sourceFileUrl: String            # 原文件下载链接
  previewUrl: String              # 预览链接
  downloadUrls: [DownloadLink!]   # 各格式下载链接
  
  # 关联数据
  owner: User!
  project: Project
  collaborators: [User!]
  comments: [Comment!]
  versions: [DocumentVersion!]
  
  # 处理信息
  processingJob: ProcessingJob
  error: TranslationError
  
  # 时间戳
  createdAt: String!
  updatedAt: String!
  completedAt: String
}
```

## 项目模型
```graphql
"""
项目模型 - 用于组织和管理一组相关的文档
对应页面: /workspace
"""
type Project {
  id: ID!
  name: String!
  description: String
  color: String                    # 项目标识颜色
  icon: String                     # 项目图标
  
  # 项目统计
  documentsCount: Int!
  completedCount: Int!
  totalWords: Int!
  
  # 关联数据
  documents: [Document!]
  owner: User!
  collaborators: [User!]
  tags: [String!]
  
  # 项目设置
  defaultSettings: ProjectSettings
  
  # 时间戳
  createdAt: String!
  updatedAt: String!
  deadline: String
}
```

## 项目设置
```graphql
"""
项目默认设置
"""
type ProjectSettings {
  defaultSourceLanguage: String!
  defaultTargetLanguage: String!
  defaultTranslationStyle: TranslationStyle!
  defaultSpecialization: String!
  autoStart: Boolean!              # 上传后自动开始翻译
  requireReview: Boolean!          # 需要人工审核
  emailNotifications: Boolean!
}
```

## 评论模型
```graphql
"""
评论模型 - 用于在文档上进行批注和讨论
对应页面: /translate-editor (SideBySideReviewPanel)
"""
type Comment {
  id: ID!
  author: User!
  content: String!
  position: CommentPosition!       # 评论在文档中的位置
  isResolved: Boolean!
  replies: [Comment!]              # 回复评论
  
  # 时间戳
  createdAt: String!
  updatedAt: String!
}
```

## 评论位置
```graphql
"""
评论在文档中的精确位置
"""
type CommentPosition {
  pageNumber: Int
  paragraphIndex: Int
  sentenceIndex: Int
  selectionStart: Int              # 选中文本开始位置
  selectionEnd: Int                # 选中文本结束位置
  selectedText: String             # 选中的文本内容
}
```

## AI 聊天消息模型
```graphql
"""
AI 聊天消息模型 - 用于 AI 助手功能
对应页面: /translate-editor
"""
type ChatMessage {
  id: ID!
  author: ChatMessageAuthor!
  content: String!
  timestamp: String!
  
  # 消息上下文
  documentId: ID
  relatedText: String              # 相关的文档文本
  suggestions: [TranslationSuggestion!] # AI建议
  
  # 消息状态
  isTyping: Boolean
  isError: Boolean
  errorMessage: String
}
```

## 翻译建议
```graphql
"""
AI翻译建议
"""
type TranslationSuggestion {
  originalText: String!
  suggestedTranslation: String!
  confidence: Float!               # 置信度 0-1
  reasoning: String                # 建议理由
  alternatives: [String!]          # 替代翻译
}
```

## 翻译任务进度模型
```graphql
"""
翻译任务进度模型 - 用于实时反馈翻译进度
对应页面: /translating, /reader-translating
"""
type TranslationProgress {
  jobId: ID!
  documentId: ID!
  progress: Int!                   # 进度百分比 (0-100)
  status: DocumentStatus!
  message: String                  # 状态信息
  
  # 详细步骤信息
  currentStep: String!             # 当前步骤名称
  totalSteps: Int!                 # 总步骤数
  currentStepIndex: Int!           # 当前步骤索引
  estimatedTimeRemaining: Int      # 预计剩余时间(秒)
  
  # 处理详情
  processingDetails: ProcessingStep
  stepHistory: [ProcessingStep!]   # 步骤历史
  
  # 性能指标
  startTime: String!
  lastUpdateTime: String!
  averageSpeed: Float              # 平均处理速度(字符/秒)
}
```

## 处理步骤
```graphql
"""
处理步骤详情
"""
type ProcessingStep {
  name: String!                    # 步骤名称
  description: String!             # 步骤描述
  status: StepStatus!              # 步骤状态
  progress: Int!                   # 步骤内进度 0-100
  duration: Int                    # 耗时(毫秒)
  startTime: String
  endTime: String
  error: String                    # 错误信息(如果失败)
  
  # 步骤特定数据
  metadata: ProcessingMetadata
}
```

## 处理元数据
```graphql
"""
处理步骤的元数据
"""
type ProcessingMetadata {
  filesProcessed: Int
  pagesProcessed: Int
  wordsProcessed: Int
  chunksCreated: Int
  apiCallsMade: Int
  retryCount: Int
}
```

## 处理任务
```graphql
"""
后台处理任务信息
"""
type ProcessingJob {
  id: ID!
  documentId: ID!
  jobType: String!                 # convert, split, translate, integrate
  status: StepStatus!
  priority: Int!                   # 任务优先级
  
  # 配置信息
  configuration: JobConfiguration
  
  # 执行信息
  startedAt: String
  completedAt: String
  executionTime: Int               # 执行时间(秒)
  retryCount: Int!
  maxRetries: Int!
  
  # 结果信息
  result: JobResult
  error: TranslationError
}
```

## 任务配置
```graphql
"""
处理任务配置
"""
type JobConfiguration {
  sourceLanguage: String!
  targetLanguage: String!
  translationStyle: TranslationStyle!
  specialization: String!
  outputFormats: [String!]!
  preserveFormatting: Boolean!
  enableAI: Boolean!
  qualityLevel: String!            # fast, balanced, high_quality
}
```

## 任务结果
```graphql
"""
处理任务结果
"""
type JobResult {
  success: Boolean!
  filesCreated: [String!]
  statistics: ProcessingStatistics
  qualityMetrics: QualityMetrics
}
```

## 处理统计
```graphql
"""
处理统计信息
"""
type ProcessingStatistics {
  inputFileSize: Int!
  outputFileSize: Int!
  pagesProcessed: Int!
  wordsTranslated: Int!
  charactersProcessed: Int!
  processingTime: Int!             # 秒
  apiCallsUsed: Int!
}
```

## 质量指标
```graphql
"""
翻译质量指标
"""
type QualityMetrics {
  overallScore: Float!             # 总体质量分数 0-100
  fluency: Float!                  # 流畅度
  accuracy: Float!                 # 准确度
  consistency: Float!              # 一致性
  formatPreservation: Float!       # 格式保持度
  
  # 详细分析
  issuesDetected: [QualityIssue!]
  suggestions: [QualityImprovement!]
}
```

## 质量问题
```graphql
"""
检测到的质量问题
"""
type QualityIssue {
  type: String!                    # mistranslation, format_loss, etc.
  severity: String!                # low, medium, high, critical
  description: String!
  location: CommentPosition!
  suggestion: String
}
```

## 质量改进建议
```graphql
"""
质量改进建议
"""
type QualityImprovement {
  area: String!                    # 改进领域
  description: String!
  impact: String!                  # 预期改进效果
  priority: Int!                   # 优先级 1-5
}
```

---

# =======================================================================
# III. 支持数据模型 (Support Types)
# =======================================================================

## 文档版本
```graphql
"""
文档版本管理
"""
type DocumentVersion {
  id: ID!
  versionNumber: String!           # v1.0, v1.1, etc.
  description: String
  content: String!
  createdBy: User!
  createdAt: String!
  
  # 版本比较
  changes: [ContentChange!]
  parentVersion: DocumentVersion
}
```

## 内容变更
```graphql
"""
版本间的内容变更
"""
type ContentChange {
  type: String!                    # added, removed, modified
  position: CommentPosition!
  oldText: String
  newText: String
  author: User!
  timestamp: String!
}
```

## 下载链接
```graphql
"""
文档下载链接信息
"""
type DownloadLink {
  format: String!                  # pdf, docx, epub, etc.
  url: String!
  fileSize: Int!
  expiresAt: String!
  downloadCount: Int!
}
```

## 翻译摘要
```graphql
"""
翻译活动摘要
"""
type TranslationSummary {
  period: String!                  # today, this_week, this_month
  documentsCount: Int!
  wordsCount: Int!
  languages: [LanguagePair!]!
  averageQuality: Float!
}
```

## 语言对
```graphql
"""
源语言到目标语言的配对
"""
type LanguagePair {
  source: String!
  target: String!
  count: Int!
  successRate: Float!              # 成功率
}
```

## 专业领域使用统计
```graphql
"""
专业领域使用统计
"""
type SpecializationUsage {
  specialization: String!
  count: Int!
  averageQuality: Float!
  totalWords: Int!
}
```

## 翻译专业领域
```graphql
"""
翻译专业领域配置
"""
type TranslationSpecialization {
  key: String!
  title: String!
  description: String!
  icon: String                     # 图标标识符
  color: String                    # 主题颜色
  subCategories: [TranslationSubCategory!]!
  
  # 领域特性
  requiresExpertise: Boolean!      # 是否需要专业知识
  averageProcessingTime: Int       # 平均处理时间(分钟)
  qualityThreshold: Float!         # 质量阈值
}
```

## 翻译子类别
```graphql
"""
翻译专业子类别
"""
type TranslationSubCategory {
  key: String!
  title: String!
  description: String!
  examples: [String!]!
  
  # 子类别特性
  complexity: String!              # simple, medium, complex
  aiAccuracy: Float!               # AI准确率
  humanReviewRequired: Boolean!    # 是否需要人工审核
}
```

## 支持的语言
```graphql
"""
系统支持的语言
"""
type Language {
  code: String!                    # ISO 639-1 语言代码
  name: String!                    # 英文名称
  nativeName: String!              # 本地名称
  rtl: Boolean!                    # 是否为从右到左语言
  
  # 功能支持
  isAutoDetected: Boolean!         # 支持自动检测
  translationQuality: String!      # excellent, good, fair
  supportedAsSource: Boolean!      # 支持作为源语言
  supportedAsTarget: Boolean!      # 支持作为目标语言
}
```

## 输出格式
```graphql
"""
支持的输出格式
"""
type OutputFormat {
  extension: String!               # 文件扩展名
  name: String!                    # 格式名称
  description: String!             # 格式描述
  mimeType: String!                # MIME类型
  
  # 功能支持
  supportsFormatting: Boolean!     # 支持格式化
  supportsImages: Boolean!         # 支持图片
  supportsTables: Boolean!         # 支持表格
  supportsHyperlinks: Boolean!     # 支持超链接
  maxFileSize: Int!                # 最大文件大小(MB)
}
```

## 文件验证结果
```graphql
"""
文件验证结果
"""
type FileValidationResult {
  isValid: Boolean!
  fileSize: Int!
  pageCount: Int
  wordCount: Int
  detectedLanguage: String
  detectedFormat: String!
  
  # 验证详情
  supportedFormats: [String!]!
  errors: [ValidationError!]
  warnings: [ValidationWarning!]
  
  # 预估信息
  estimatedProcessingTime: Int     # 预估处理时间(分钟)
  estimatedCost: Float             # 预估费用
  recommendedSettings: RecommendedSettings
}
```

## 验证错误
```graphql
"""
文件验证错误
"""
type ValidationError {
  code: ErrorCode!
  message: String!
  details: String
  suggestion: String               # 建议解决方案
}
```

## 验证警告
```graphql
"""
文件验证警告
"""
type ValidationWarning {
  type: String!                    # format_loss, quality_degradation, etc.
  message: String!
  impact: String!                  # 影响描述
  canProceed: Boolean!            # 是否可以继续处理
}
```

## 推荐设置
```graphql
"""
根据文件内容推荐的处理设置
"""
type RecommendedSettings {
  translationStyle: TranslationStyle!
  specialization: String!
  qualityLevel: String!
  preserveFormatting: Boolean!
  outputFormats: [String!]!
  
  # 推荐理由
  reasoning: String!
  confidence: Float!               # 推荐置信度 0-1
}
```

## 翻译错误
```graphql
"""
翻译处理错误信息
"""
type TranslationError {
  code: ErrorCode!
  message: String!
  details: String
  timestamp: String!
  
  # 错误恢复
  retryable: Boolean!
  estimatedRetryTime: Int          # 建议重试时间(秒)
  maxRetries: Int
  currentRetries: Int
  
  # 技术详情
  stackTrace: String
  errorId: String!                 # 错误追踪ID
  affectedComponents: [String!]    # 受影响的组件
}
```

---

# =======================================================================
# IV. 输入类型 (Input Types)
# 定义了 Mutations 中使用的复杂输入对象
# =======================================================================

## 文档上传输入
```graphql
"""
增强的文档上传输入参数
"""
input UploadDocumentInput {
  file: Upload!                    # GraphQL 文件上传类型
  projectId: ID                    # 可选，关联到某个项目
  
  # 翻译配置
  sourceLanguage: String           # 源语言 (可选，支持自动检测)
  targetLanguage: String!          # 目标语言
  translationStyle: TranslationStyle! # 翻译风格
  specialization: String!          # 专业领域
  
  # 输出配置
  outputFormats: [String!]!        # 输出格式列表
  preserveFormatting: Boolean      # 保持格式，默认true
  
  # 处理选项
  autoStart: Boolean               # 上传后自动开始翻译，默认false
  priority: Int                    # 处理优先级 1-5，默认3
  qualityLevel: String             # fast, balanced, high_quality
  
  # 协作设置
  collaboratorEmails: [String!]    # 协作者邮箱列表
  shareSettings: ShareSettingsInput
}
```

## 分享设置输入
```graphql
"""
文档分享设置
"""
input ShareSettingsInput {
  isPublic: Boolean!               # 是否公开
  allowComments: Boolean!          # 允许评论
  allowEdit: Boolean!              # 允许编辑
  expiresAt: String                # 分享过期时间
  password: String                 # 访问密码
}
```

## 文档内容更新输入
```graphql
"""
更新文档内容的输入参数
"""
input UpdateDocumentContentInput {
  documentId: ID!
  content: String!                 # 更新的内容 (HTML)
  
  # 编辑上下文
  selectionStart: Int              # 选择开始位置
  selectionEnd: Int                # 选择结束位置
  editType: String!                # insert, delete, replace, format
  
  # 格式状态
  formatStates: FormatStateInput
  
  # 版本控制
  createVersion: Boolean           # 是否创建新版本
  versionDescription: String       # 版本描述
}
```

## 格式状态输入
```graphql
"""
富文本格式状态输入
"""
input FormatStateInput {
  # 文本样式
  isBold: Boolean
  isItalic: Boolean
  isUnderline: Boolean
  isStrikethrough: Boolean
  
  # 颜色和字体
  textColor: String                # 十六进制颜色值
  backgroundColor: String          # 背景色/高亮色
  fontSize: String                 # 字体大小 (pt)
  fontFamily: String               # 字体族
  
  # 段落格式
  alignment: TextAlignment
  lineHeight: String               # 行高
  indent: Int                      # 缩进级别
  
  # 列表
  isBulletList: Boolean
  isNumberedList: Boolean
  listLevel: Int                   # 列表嵌套级别
}
```

## 选择范围输入
```graphql
"""
文本选择范围
"""
input SelectionRangeInput {
  start: Int!                      # 开始位置
  end: Int!                        # 结束位置
  pageNumber: Int                  # 页码 (如果适用)
}
```

## AI 聊天消息输入
```graphql
"""
发送 AI 聊天消息的输入参数
"""
input SendChatMessageInput {
  documentId: ID!
  content: String!
  
  # 上下文信息
  selectedText: String             # 选中的文档文本
  selectionRange: SelectionRangeInput # 选择范围
  
  # 请求类型
  messageType: String!             # translation, explanation, improvement, etc.
  language: String                 # 回复语言
}
```

## 评论添加输入
```graphql
"""
添加评论的输入参数
"""
input AddCommentInput {
  documentId: ID!
  content: String!
  position: CommentPositionInput!
  
  # 回复相关
  parentCommentId: ID              # 如果是回复评论
  
  # 评论类型
  commentType: String              # general, suggestion, issue, approval
  severity: String                 # low, medium, high (for issues)
}
```

## 评论位置输入
```graphql
"""
评论位置输入
"""
input CommentPositionInput {
  pageNumber: Int
  paragraphIndex: Int
  sentenceIndex: Int
  selectionStart: Int!
  selectionEnd: Int!
  selectedText: String!
}
```

## 项目创建输入
```graphql
"""
创建项目的输入参数
"""
input CreateProjectInput {
  name: String!
  description: String
  color: String                    # 项目颜色
  icon: String                     # 项目图标
  
  # 默认设置
  defaultSettings: ProjectSettingsInput
  
  # 协作者
  collaboratorEmails: [String!]
  
  # 项目配置
  tags: [String!]
  deadline: String
  isPrivate: Boolean               # 是否私有项目
}
```

## 项目设置输入
```graphql
"""
项目设置输入
"""
input ProjectSettingsInput {
  defaultSourceLanguage: String!
  defaultTargetLanguage: String!
  defaultTranslationStyle: TranslationStyle!
  defaultSpecialization: String!
  autoStart: Boolean!
  requireReview: Boolean!
  emailNotifications: Boolean!
}
```

## 用户偏好更新输入
```graphql
"""
用户偏好设置更新输入
"""
input UpdateUserPreferencesInput {
  defaultSourceLanguage: String
  defaultTargetLanguage: String
  defaultTranslationStyle: TranslationStyle
  autoSave: Boolean
  emailNotifications: Boolean
  theme: String
  editorFontSize: Int
  showOriginalText: Boolean
}
```

## 文档搜索输入
```graphql
"""
文档搜索输入参数
"""
input DocumentSearchInput {
  query: String!                   # 搜索关键词
  
  # 筛选条件
  projectId: ID                    # 限定项目
  status: DocumentStatus           # 文档状态
  sourceLanguage: String           # 源语言
  targetLanguage: String           # 目标语言
  specialization: String           # 专业领域
  
  # 时间范围
  createdAfter: String
  createdBefore: String
  
  # 排序和分页
  sortBy: String                   # created_at, updated_at, title, size
  sortOrder: String                # asc, desc
  limit: Int                       # 默认20
  offset: Int                      # 默认0
}
```

---

# =======================================================================
# V. 查询接口 (Queries)
# 用于从后端获取数据，对应 HTTP GET 请求
# =======================================================================

```graphql
type Query {
  # ===== 用户相关查询 =====
  """获取当前登录用户的信息"""
  me: User
  
  """获取用户统计信息"""
  userStats: UserStats!
  
  """获取用户配额使用情况"""
  userQuota: UsageQuota!
  
  # ===== 项目相关查询 =====
  """
  获取用户的项目列表
  对应页面: /workspace
  """
  projects(
    limit: Int = 20
    offset: Int = 0
  ): [Project!]!
  
  """获取单个项目的详细信息，包括其下的所有文档"""
  project(id: ID!): Project
  
  # ===== 文档相关查询 =====
  """
  获取单个文档的详细信息
  对应页面: /translate-editor, /preview
  """
  document(id: ID!): Document
  
  """
  搜索文档
  支持全文搜索和筛选
  """
  searchDocuments(input: DocumentSearchInput!): DocumentSearchResult!
  
  """
  获取最近的文档列表
  对应页面: /workspace (dashboard)
  """
  recentDocuments(limit: Int = 10): [Document!]!
  
  """获取文档的版本历史"""
  documentVersions(documentId: ID!): [DocumentVersion!]!
  
  # ===== AI 聊天相关查询 =====
  """
  获取指定文档的 AI 聊天历史记录
  对应页面: /translate-editor
  """
  chatHistory(documentId: ID!): [ChatMessage!]!
  
  # ===== 配置和元数据查询 =====
  """获取所有翻译专业领域"""
  translationSpecializations: [TranslationSpecialization!]!
  
  """获取支持的语言列表"""
  supportedLanguages: [Language!]!
  
  """获取支持的输出格式"""
  supportedOutputFormats: [OutputFormat!]!
  
  """获取翻译风格选项"""
  translationStyles: [TranslationStyleOption!]!
  
  """
  验证文件
  在上传前验证文件格式和内容
  """
  validateFile(file: Upload!): FileValidationResult!
  
  # ===== 统计和分析查询 =====
  """获取平台使用统计"""
  platformStats: PlatformStats!
  
  """获取热门翻译语言对"""
  popularTranslations: [LanguagePair!]!
  
  """获取翻译质量趋势"""
  qualityTrends(
    period: String! # day, week, month, year
    startDate: String
    endDate: String
  ): [QualityTrendPoint!]!
  
  # ===== 实时状态查询 =====
  """
  获取翻译进度 (一次性查询)
  对应页面: /translating
  """
  translationProgress(jobId: ID!): TranslationProgress
  
  """获取系统状态"""
  systemStatus: SystemStatus!
}
```

## 支持类型定义

```graphql
"""
文档搜索结果
"""
type DocumentSearchResult {
  documents: [Document!]!
  totalCount: Int!
  hasMore: Boolean!
  suggestions: [String!]           # 搜索建议
}

"""
翻译风格选项
"""
type TranslationStyleOption {
  key: TranslationStyle!
  title: String!
  description: String!
  examples: [String!]
  suitableFor: [String!]           # 适用场景
}

"""
平台统计信息
"""
type PlatformStats {
  totalUsers: Int!
  totalDocuments: Int!
  totalWordsTranslated: Int!
  averageProcessingTime: Float!    # 分钟
  successRate: Float!              # 成功率百分比
  supportedLanguages: Int!
  
  # 今日统计
  todayStats: DailyStats!
}

"""
每日统计
"""
type DailyStats {
  documentsProcessed: Int!
  wordsTranslated: Int!
  newUsers: Int!
  averageQuality: Float!
}

"""
质量趋势点
"""
type QualityTrendPoint {
  date: String!
  averageQuality: Float!
  documentsCount: Int!
  wordsCount: Int!
}

"""
系统状态
"""
type SystemStatus {
  isHealthy: Boolean!
  services: [ServiceStatus!]!
  maintenance: MaintenanceInfo
  announcements: [Announcement!]
}

"""
服务状态
"""
type ServiceStatus {
  name: String!                    # translation, file_processing, ai_chat
  status: String!                  # healthy, degraded, down
  responseTime: Int                # 响应时间(ms)
  uptime: Float!                   # 正常运行时间百分比
  lastCheck: String!
}

"""
维护信息
"""
type MaintenanceInfo {
  isScheduled: Boolean!
  startTime: String
  endTime: String
  description: String
  affectedServices: [String!]
}

"""
系统公告
"""
type Announcement {
  id: ID!
  title: String!
  content: String!
  type: String!                    # info, warning, maintenance, feature
  priority: Int!                   # 1-5
  createdAt: String!
  expiresAt: String
}
```

---

# =======================================================================
# VI. 操作接口 (Mutations)
# 用于创建、更新或删除数据，对应 HTTP POST/PUT/DELETE 请求
# =======================================================================

```graphql
type Mutation {
  # ===== 用户认证相关 =====
  """
  使用手机号和验证码登录
  对应页面: /login
  返回 JWT Token 用于后续认证
  """
  loginWithPhone(
    phone: String!
    code: String!
  ): AuthResult!
  
  """使用邮箱和密码登录"""
  loginWithEmail(
    email: String!
    password: String!
  ): AuthResult!
  
  """发送验证码"""
  sendVerificationCode(
    phone: String!
    type: String! # login, register, reset_password
  ): Boolean!
  
  """用户注册"""
  registerUser(
    name: String!
    email: String!
    phone: String
    password: String!
    verificationCode: String!
  ): AuthResult!
  
  """刷新访问令牌"""
  refreshToken(refreshToken: String!): AuthResult!
  
  """用户登出"""
  logout: Boolean!
  
  # ===== 用户设置相关 =====
  """更新用户信息"""
  updateUserProfile(
    name: String
    email: String
    avatarUrl: String
  ): User!
  
  """更新用户偏好设置"""
  updateUserPreferences(
    input: UpdateUserPreferencesInput!
  ): UserPreferences!
  
  # ===== 文档处理相关 =====
  """
  上传新文档并开始处理
  对应页面: /workspace, /page.tsx
  """
  uploadDocument(
    input: UploadDocumentInput!
  ): Document!
  
  """
  开始翻译一个文档
  对应页面: /translate
  返回一个唯一的 jobId 用于跟踪进度
  """
  startTranslation(
    documentId: ID!
    configuration: JobConfiguration
  ): ProcessingJob!
  
  """
  保存在编辑器中修改的译文内容
  对应页面: /translate-editor
  """
  updateDocumentContent(
    input: UpdateDocumentContentInput!
  ): Document!
  
  """重新翻译文档"""
  retranslateDocument(
    documentId: ID!
    configuration: JobConfiguration
  ): ProcessingJob!
  
  """取消正在进行的翻译任务"""
  cancelTranslation(jobId: ID!): Boolean!
  
  """删除文档"""
  deleteDocument(documentId: ID!): Boolean!
  
  """归档文档"""
  archiveDocument(documentId: ID!): Document!
  
  """恢复已归档的文档"""
  restoreDocument(documentId: ID!): Document!
  
  # ===== 格式化和编辑相关 =====
  """应用格式化到选定文本"""
  applyFormatting(
    documentId: ID!
    range: SelectionRangeInput!
    formatting: FormatStateInput!
  ): Boolean!
  
  """移除格式化"""
  removeFormatting(
    documentId: ID!
    range: SelectionRangeInput!
  ): Boolean!
  
  """插入表格"""
  insertTable(
    documentId: ID!
    position: Int!
    rows: Int!
    cols: Int!
    hasHeader: Boolean
  ): Boolean!
  
  """插入图片"""
  insertImage(
    documentId: ID!
    position: Int!
    imageFile: Upload!
    alt: String
  ): Boolean!
  
  """插入链接"""
  insertLink(
    documentId: ID!
    range: SelectionRangeInput!
    url: String!
    text: String
  ): Boolean!
  
  # ===== 项目管理相关 =====
  """
  为专业译者创建新项目
  对应页面: /workspace
  """
  createProject(input: CreateProjectInput!): Project!
  
  """更新项目信息"""
  updateProject(
    projectId: ID!
    name: String
    description: String
    color: String
    icon: String
    settings: ProjectSettingsInput
  ): Project!
  
  """删除项目"""
  deleteProject(projectId: ID!): Boolean!
  
  """添加文档到项目"""
  addDocumentToProject(
    documentId: ID!
    projectId: ID!
  ): Boolean!
  
  """从项目中移除文档"""
  removeDocumentFromProject(
    documentId: ID!
    projectId: ID!
  ): Boolean!
  
  # ===== 协作相关 =====
  """
  分享文档给其他用户（添加协作者）
  """
  shareDocument(
    documentId: ID!
    userEmail: String!
    permissions: SharePermissions
  ): Document!
  
  """移除协作者"""
  removeCollaborator(
    documentId: ID!
    userId: ID!
  ): Document!
  
  """更新协作权限"""
  updateCollaboratorPermissions(
    documentId: ID!
    userId: ID!
    permissions: SharePermissions!
  ): Document!
  
  # ===== 评论相关 =====
  """
  在文档中添加一条评论
  对应页面: /translate-editor
  """
  addComment(input: AddCommentInput!): Comment!
  
  """回复评论"""
  replyToComment(
    parentCommentId: ID!
    content: String!
  ): Comment!
  
  """编辑评论"""
  editComment(
    commentId: ID!
    content: String!
  ): Comment!
  
  """删除评论"""
  deleteComment(commentId: ID!): Boolean!
  
  """标记评论为已解决"""
  resolveComment(commentId: ID!): Comment!
  
  """重新打开已解决的评论"""
  reopenComment(commentId: ID!): Comment!
  
  # ===== AI 聊天相关 =====
  """
  向 AI 助手发送消息
  对应页面: /translate-editor
  """
  sendChatMessage(
    input: SendChatMessageInput!
  ): ChatMessage!
  
  """清除聊天历史"""
  clearChatHistory(documentId: ID!): Boolean!
  
  """对AI建议进行反馈"""
  provideFeedback(
    messageId: ID!
    rating: Int! # 1-5
    comment: String
  ): Boolean!
  
  # ===== 版本控制相关 =====
  """创建文档版本"""
  createDocumentVersion(
    documentId: ID!
    description: String!
  ): DocumentVersion!
  
  """恢复到指定版本"""
  restoreToVersion(
    documentId: ID!
    versionId: ID!
  ): Document!
  
  """比较两个版本"""
  compareVersions(
    versionId1: ID!
    versionId2: ID!
  ): [ContentChange!]!
  
  # ===== 系统管理相关 (管理员) =====
  """报告问题"""
  reportIssue(
    type: String!                  # bug, feature_request, feedback
    title: String!
    description: String!
    severity: String               # low, medium, high, critical
    attachments: [Upload!]
  ): Boolean!
  
  """提交使用反馈"""
  submitFeedback(
    rating: Int!                   # 1-5
    comment: String!
    category: String               # usability, performance, features
    documentId: ID                 # 可选，关联文档
  ): Boolean!
}
```

## 认证和权限类型

```graphql
"""
认证结果
"""
type AuthResult {
  success: Boolean!
  accessToken: String
  refreshToken: String
  expiresIn: Int                   # 访问令牌过期时间(秒)
  user: User
  error: String
}

"""
分享权限
"""
input SharePermissions {
  canView: Boolean!                # 可查看
  canComment: Boolean!             # 可评论
  canEdit: Boolean!                # 可编辑
  canShare: Boolean!               # 可分享给他人
  canDownload: Boolean!            # 可下载
}
```

---

# =======================================================================
# VII. 实时订阅接口 (Subscriptions)
# 用于通过 WebSocket 接收来自服务器的实时推送事件
# =======================================================================

```graphql
type Subscription {
  # ===== 翻译进度相关 =====
  """
  订阅翻译任务的实时进度
  对应页面: /translating, /reader-translating
  """
  translationProgress(jobId: ID!): TranslationProgress!
  
  """
  订阅处理步骤更新
  更详细的步骤级别进度
  """
  processingStepUpdated(jobId: ID!): ProcessingStep!
  
  # ===== 文档协作相关 =====
  """
  订阅文档内容的实时更新（用于多人协作）
  当其他协作者保存时，会收到此通知
  对应页面: /translate-editor
  """
  documentUpdated(documentId: ID!): Document!
  
  """
  订阅文档内容变更 (实时协作编辑)
  更细粒度的内容变更通知
  """
  documentContentChanged(documentId: ID!): ContentChange!
  
  """
  订阅协作者状态更新
  显示谁在线、谁在编辑等
  """
  collaboratorStatusChanged(documentId: ID!): CollaboratorStatus!
  
  # ===== 评论相关 =====
  """
  订阅文档中的新评论
  对应页面: /translate-editor
  """
  newComment(documentId: ID!): Comment!
  
  """
  订阅评论更新 (编辑、解决等)
  """
  commentUpdated(documentId: ID!): Comment!
  
  # ===== AI 聊天相关 =====
  """
  订阅新的 AI 聊天消息
  用于接收 AI 的响应
  对应页面: /translate-editor
  """
  newChatMessage(documentId: ID!): ChatMessage!
  
  """
  订阅 AI 输入状态
  显示 AI 正在思考/输入的状态
  """
  aiTypingStatus(documentId: ID!): AITypingStatus!
  
  # ===== 系统通知相关 =====
  """
  订阅用户通知
  系统消息、任务完成通知等
  """
  userNotifications(userId: ID!): UserNotification!
  
  """
  订阅系统状态更新
  维护通知、服务状态等
  """
  systemStatusChanged: SystemStatus!
  
  # ===== 文件处理相关 =====
  """
  订阅文件上传进度
  """
  fileUploadProgress(uploadId: ID!): FileUploadProgress!
  
  """
  订阅批量操作进度
  批量翻译、批量下载等
  """
  batchOperationProgress(operationId: ID!): BatchOperationProgress!
}
```

## 订阅支持类型

```graphql
"""
协作者状态
"""
type CollaboratorStatus {
  user: User!
  status: String!                  # online, offline, editing, viewing
  lastSeen: String!
  currentSelection: SelectionRange # 当前选择的文本范围
  currentPage: Int                 # 当前查看的页面
}

"""
AI 输入状态
"""
type AITypingStatus {
  isTyping: Boolean!
  estimatedResponseTime: Int       # 预计响应时间(秒)
  messageType: String              # 响应类型
}

"""
用户通知
"""
type UserNotification {
  id: ID!
  type: String!                    # task_completed, document_shared, comment_added
  title: String!
  message: String!
  data: NotificationData           # 通知相关数据
  isRead: Boolean!
  createdAt: String!
  expiresAt: String
  
  # 通知操作
  actions: [NotificationAction!]
}

"""
通知数据
"""
type NotificationData {
  documentId: ID
  projectId: ID
  commentId: ID
  url: String                      # 相关页面链接
  metadata: String                 # JSON格式的额外数据
}

"""
通知操作
"""
type NotificationAction {
  type: String!                    # view, download, reply, dismiss
  label: String!
  url: String
}

"""
文件上传进度
"""
type FileUploadProgress {
  uploadId: ID!
  fileName: String!
  progress: Int!                   # 0-100
  uploadedBytes: Int!
  totalBytes: Int!
  speed: Float!                    # 上传速度 MB/s
  estimatedTimeRemaining: Int      # 预计剩余时间(秒)
  status: String!                  # uploading, processing, completed, failed
}

"""
批量操作进度
"""
type BatchOperationProgress {
  operationId: ID!
  operationType: String!           # batch_translate, batch_download, batch_delete
  totalItems: Int!
  processedItems: Int!
  successfulItems: Int!
  failedItems: Int!
  currentItem: String              # 当前处理的项目
  status: String!                  # running, completed, failed, cancelled
  errors: [String!]                # 错误列表
}
```

---

# =======================================================================
# VIII. REST API 端点 (Backend Integration)
# 用于后端服务集成和文件处理管道
# =======================================================================

## 文件处理管道 API

### 文件上传和验证
```http
POST /api/v2/files/upload
Content-Type: multipart/form-data

# 表单数据
file: <binary>
metadata: {
  "originalName": "document.pdf",
  "sourceLanguage": "auto",
  "targetLanguage": "zh-cn",
  "translationStyle": "academic",
  "specialization": "tech"
}

# 响应
{
  "success": true,
  "data": {
    "uploadId": "upload_123456",
    "fileId": "file_789012",
    "validation": {
      "isValid": true,
      "fileSize": 2048576,
      "pageCount": 15,
      "detectedLanguage": "en",
      "estimatedProcessingTime": 300
    }
  }
}
```

### 开始文档处理
```http
POST /api/v2/documents/{documentId}/process
Content-Type: application/json

{
  "pipeline": ["extract", "split", "translate", "integrate"],
  "configuration": {
    "sourceLanguage": "en",
    "targetLanguage": "zh-cn",
    "translationStyle": "academic",
    "specialization": "tech",
    "qualityLevel": "high_quality",
    "preserveFormatting": true
  }
}

# 响应
{
  "success": true,
  "data": {
    "jobId": "job_345678",
    "estimatedDuration": 300,
    "steps": [
      {"name": "extract", "estimatedDuration": 60},
      {"name": "split", "estimatedDuration": 30},
      {"name": "translate", "estimatedDuration": 180},
      {"name": "integrate", "estimatedDuration": 30}
    ]
  }
}
```

### 获取处理进度
```http
GET /api/v2/jobs/{jobId}/progress

# 响应
{
  "success": true,
  "data": {
    "jobId": "job_345678",
    "status": "translating",
    "progress": 65,
    "currentStep": "translate",
    "currentStepProgress": 30,
    "estimatedTimeRemaining": 120,
    "steps": [
      {"name": "extract", "status": "completed", "duration": 58},
      {"name": "split", "status": "completed", "duration": 28},
      {"name": "translate", "status": "in_progress", "progress": 30},
      {"name": "integrate", "status": "pending"}
    ]
  }
}
```

## 文档管理 API

### 获取文档内容
```http
GET /api/v2/documents/{documentId}/content
Accept: application/json

# 查询参数
?version=latest&format=html&includeMetadata=true

# 响应
{
  "success": true,
  "data": {
    "documentId": "doc_123456",
    "content": "<html>...</html>",
    "metadata": {
      "wordCount": 1500,
      "pageCount": 8,
      "lastModified": "2024-01-15T10:30:00Z",
      "version": "v1.2"
    }
  }
}
```

### 更新文档内容
```http
PUT /api/v2/documents/{documentId}/content
Content-Type: application/json

{
  "content": "<html>...</html>",
  "editInfo": {
    "selectionStart": 100,
    "selectionEnd": 200,
    "editType": "replace"
  },
  "createVersion": false
}

# 响应
{
  "success": true,
  "data": {
    "documentId": "doc_123456",
    "version": "v1.2",
    "lastModified": "2024-01-15T10:35:00Z"
  }
}
```

### 下载文档
```http
GET /api/v2/documents/{documentId}/download
Accept: application/octet-stream

# 查询参数
?format=docx&version=latest&includeComments=false

# 响应头
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="translated_document.docx"
Content-Length: 524288

# 响应体: 二进制文件内容
```

## AI 服务 API

### AI 聊天
```http
POST /api/v2/ai/chat
Content-Type: application/json

{
  "documentId": "doc_123456",
  "message": "请解释这个句子的翻译",
  "context": {
    "selectedText": "The quick brown fox",
    "selectionRange": {"start": 100, "end": 120}
  },
  "messageType": "explanation",
  "language": "zh-cn"
}

# 响应
{
  "success": true,
  "data": {
    "messageId": "msg_789012",
    "response": "这个句子是一个常用的英语测试句...",
    "suggestions": [
      {
        "originalText": "The quick brown fox",
        "suggestedTranslation": "敏捷的棕色狐狸",
        "confidence": 0.95,
        "reasoning": "这是标准的形容词+名词结构..."
      }
    ]
  }
}
```

### 获取翻译建议
```http
POST /api/v2/ai/suggestions
Content-Type: application/json

{
  "text": "The quick brown fox jumps over the lazy dog",
  "sourceLanguage": "en",
  "targetLanguage": "zh-cn",
  "context": {
    "specialization": "general",
    "translationStyle": "natural"
  }
}

# 响应
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "translation": "敏捷的棕色狐狸跳过了懒惰的狗",
        "confidence": 0.92,
        "alternatives": [
          "快速的棕色狐狸越过了懒狗",
          "迅速的棕狐跳跃过慵懒的狗"
        ]
      }
    ],
    "explanation": "这是一个经典的英语全字母句..."
  }
}
```

## 实时通信 API

### WebSocket 连接
```javascript
// WebSocket 端点
wss://api.example.com/v2/ws

// 连接参数
?token=jwt_token&documentId=doc_123456&features=progress,collaboration,chat

// 消息格式
{
  "type": "subscribe",
  "channel": "document:doc_123456:progress",
  "data": {}
}

// 服务器推送
{
  "type": "progress_update",
  "channel": "document:doc_123456:progress",
  "data": {
    "progress": 75,
    "currentStep": "integrate",
    "message": "正在整合翻译内容..."
  }
}
```

## 管理和监控 API

### 系统状态
```http
GET /api/v2/system/health

# 响应
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "2.0.0",
    "uptime": 86400,
    "services": {
      "translation": {"status": "healthy", "responseTime": 150},
      "fileProcessing": {"status": "healthy", "responseTime": 200},
      "database": {"status": "healthy", "responseTime": 10},
      "ai": {"status": "degraded", "responseTime": 500}
    }
  }
}
```

### 使用统计
```http
GET /api/v2/admin/stats
Authorization: Bearer admin_token

# 查询参数
?period=last_7_days&groupBy=day&includeDetails=true

# 响应
{
  "success": true,
  "data": {
    "totalRequests": 15420,
    "totalDocuments": 1205,
    "totalWords": 2850000,
    "averageProcessingTime": 145,
    "successRate": 98.5,
    "dailyStats": [
      {"date": "2024-01-10", "documents": 180, "words": 425000},
      {"date": "2024-01-11", "documents": 195, "words": 465000}
    ]
  }
}
```

---

# =======================================================================
# IX. 错误处理和状态码
# =======================================================================

## HTTP 状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | 成功 | 正常请求成功 |
| 201 | 已创建 | 资源创建成功 |
| 202 | 已接受 | 异步任务已提交 |
| 400 | 请求错误 | 参数验证失败 |
| 401 | 未认证 | Token无效或过期 |
| 403 | 权限不足 | 无权访问资源 |
| 404 | 资源不存在 | 文档或项目未找到 |
| 409 | 冲突 | 资源状态冲突 |
| 413 | 文件过大 | 超出上传限制 |
| 415 | 不支持的格式 | 文件格式不支持 |
| 429 | 速率限制 | 请求过于频繁 |
| 500 | 服务器错误 | 内部处理错误 |
| 503 | 服务不可用 | 系统维护或过载 |

## 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "文件格式不支持",
    "details": "仅支持 PDF, DOCX, EPUB, TXT, MOBI, AZW 格式",
    "errorId": "err_20240115_123456",
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/v2/files/upload",
    "retryable": false,
    "suggestions": [
      "请确保文件格式正确",
      "如需支持其他格式，请联系客服"
    ]
  }
}
```

## GraphQL 错误格式

```json
{
  "data": null,
  "errors": [
    {
      "message": "文档不存在或无权访问",
      "locations": [{"line": 2, "column": 3}],
      "path": ["document"],
      "extensions": {
        "code": "RESOURCE_NOT_FOUND",
        "errorId": "err_20240115_123456",
        "retryable": false
      }
    }
  ]
}
```

---

# =======================================================================
# X. 标量类型和自定义类型
# =======================================================================

```graphql
# GraphQL 规范要求的标量类型
scalar Upload          # 文件上传类型
scalar DateTime        # ISO 8601 日期时间
scalar JSON           # JSON 对象类型
scalar EmailAddress   # 邮箱地址类型
scalar PhoneNumber    # 电话号码类型
scalar URL            # URL 类型
scalar Color          # 颜色值类型 (#RRGGBB)
```

---

# =======================================================================
# XI. API 使用示例
# =======================================================================

## 完整的文档翻译工作流

### 1. 用户认证
```javascript
// 发送验证码
const { data } = await client.mutate({
  mutation: SEND_VERIFICATION_CODE,
  variables: { phone: "+86138xxxxxxxx", type: "login" }
});

// 登录
const { data: authData } = await client.mutate({
  mutation: LOGIN_WITH_PHONE,
  variables: { 
    phone: "+86138xxxxxxxx", 
    code: "123456" 
  }
});

// 设置认证头
client.setHeader('Authorization', `Bearer ${authData.loginWithPhone.accessToken}`);
```

### 2. 上传文档
```javascript
// 准备文件上传
const fileInput = document.querySelector('#file-input');
const file = fileInput.files[0];

// 上传文档
const { data } = await client.mutate({
  mutation: UPLOAD_DOCUMENT,
  variables: {
    input: {
      file,
      sourceLanguage: "auto",
      targetLanguage: "zh-cn",
      translationStyle: "ACADEMIC",
      specialization: "tech",
      outputFormats: ["docx", "pdf"],
      autoStart: true
    }
  }
});

const documentId = data.uploadDocument.id;
```

### 3. 监听翻译进度
```javascript
// 订阅翻译进度
const subscription = client.subscribe({
  query: TRANSLATION_PROGRESS_SUBSCRIPTION,
  variables: { jobId: data.uploadDocument.processingJob.id }
}).subscribe({
  next: (result) => {
    const progress = result.data.translationProgress;
    updateProgressUI(progress);
    
    if (progress.status === 'COMPLETED') {
      // 翻译完成，跳转到编辑页面
      window.location.href = `/translate-editor/${documentId}`;
    }
  },
  error: (err) => console.error('订阅错误:', err)
});
```

### 4. 编辑和协作
```javascript
// 获取文档内容
const { data: docData } = await client.query({
  query: GET_DOCUMENT,
  variables: { id: documentId }
});

// 更新文档内容
await client.mutate({
  mutation: UPDATE_DOCUMENT_CONTENT,
  variables: {
    input: {
      documentId,
      content: editorContent,
      editType: "replace",
      selectionStart: 100,
      selectionEnd: 200
    }
  }
});

// 添加评论
await client.mutate({
  mutation: ADD_COMMENT,
  variables: {
    input: {
      documentId,
      content: "这个翻译需要调整",
      position: {
        selectionStart: 150,
        selectionEnd: 180,
        selectedText: "machine learning"
      }
    }
  }
});
```

### 5. AI 助手交互
```javascript
// 发送AI聊天消息
const { data: aiResponse } = await client.mutate({
  mutation: SEND_CHAT_MESSAGE,
  variables: {
    input: {
      documentId,
      content: "请解释这个术语的最佳翻译",
      selectedText: "machine learning",
      messageType: "translation"
    }
  }
});

// 订阅AI响应
client.subscribe({
  query: NEW_CHAT_MESSAGE_SUBSCRIPTION,
  variables: { documentId }
}).subscribe({
  next: (result) => {
    const message = result.data.newChatMessage;
    if (message.author === 'AI') {
      displayAIResponse(message);
    }
  }
});
```

---

# =======================================================================
# XII. 性能和优化建议
# =======================================================================

## GraphQL 查询优化

### 1. 使用片段减少重复
```graphql
fragment DocumentInfo on Document {
  id
  title
  status
  progress
  sourceLanguage
  targetLanguage
  createdAt
  updatedAt
}

query GetRecentDocuments {
  recentDocuments(limit: 10) {
    ...DocumentInfo
    owner {
      id
      name
      avatarUrl
    }
  }
}
```

### 2. 分页查询
```graphql
query GetDocuments($first: Int!, $after: String) {
  documents(first: $first, after: $after) {
    edges {
      node {
        ...DocumentInfo
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```

### 3. 字段级别的缓存
```javascript
// Apollo Client 缓存配置
const cache = new InMemoryCache({
  typePolicies: {
    Document: {
      fields: {
        translatedContent: {
          merge: false  // 不合并，直接替换
        }
      }
    }
  }
});
```

## REST API 优化

### 1. HTTP 缓存头
```http
# 文档内容缓存
GET /api/v2/documents/123/content
Cache-Control: private, max-age=300
ETag: "v1.2-abc123"

# 静态资源缓存
GET /api/v2/documents/123/download
Cache-Control: public, max-age=86400
```

### 2. 压缩和格式优化
```http
# 请求压缩
Accept-Encoding: gzip, deflate, br

# 响应压缩
Content-Encoding: gzip
Content-Length: 1024

# 条件请求
If-None-Match: "v1.2-abc123"
If-Modified-Since: Wed, 15 Jan 2024 10:00:00 GMT
```

## 实时通信优化

### 1. WebSocket 连接管理
```javascript
class DocumentSocket {
  constructor(documentId, features = []) {
    this.documentId = documentId;
    this.features = features;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  connect() {
    const wsUrl = `wss://api.example.com/v2/ws?documentId=${this.documentId}&features=${this.features.join(',')}`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      console.log('WebSocket connected');
    };
    
    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, Math.pow(2, this.reconnectAttempts) * 1000);
      }
    };
  }
}
```

### 2. 消息批处理
```javascript
class MessageBatcher {
  constructor(flushInterval = 100) {
    this.queue = [];
    this.flushInterval = flushInterval;
    this.timeoutId = null;
  }
  
  addMessage(message) {
    this.queue.push(message);
    
    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        this.flush();
      }, this.flushInterval);
    }
  }
  
  flush() {
    if (this.queue.length > 0) {
      this.processBatch(this.queue);
      this.queue = [];
    }
    this.timeoutId = null;
  }
}
```

---

# =======================================================================
# XIII. 安全和合规性
# =======================================================================

## 认证和授权

### JWT Token 结构
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_123456",
    "iat": 1642248000,
    "exp": 1642251600,
    "aud": "translation-platform",
    "iss": "auth.example.com",
    "scope": ["read:documents", "write:documents", "admin:projects"],
    "user_role": "TRANSLATOR",
    "plan": "professional"
  }
}
```

### 权限范围定义
- `read:documents` - 查看文档
- `write:documents` - 编辑文档
- `admin:projects` - 管理项目
- `share:documents` - 分享文档
- `delete:documents` - 删除文档
- `access:ai` - 使用AI功能
- `admin:system` - 系统管理

## 数据保护

### 文件加密
```javascript
// 文件上传加密
const encryptedFile = await encryptFile(file, {
  algorithm: 'AES-256-GCM',
  keyDerivation: 'PBKDF2'
});

// 文件下载解密
const decryptedContent = await decryptFile(encryptedData, userKey);
```

### 敏感数据处理
```json
{
  "sensitiveFields": ["content", "comments", "chatHistory"],
  "encryption": {
    "atRest": "AES-256",
    "inTransit": "TLS 1.3",
    "keyManagement": "AWS KMS"
  },
  "dataRetention": {
    "documents": "2 years",
    "logs": "1 year",
    "temporaryFiles": "24 hours"
  }
}
```

## 合规性要求

### GDPR 合规
```graphql
# 数据导出
mutation ExportUserData($userId: ID!) {
  exportUserData(userId: $userId) {
    downloadUrl
    expiresAt
    format # JSON, CSV, XML
  }
}

# 数据删除
mutation DeleteUserData($userId: ID!, $retentionOverride: Boolean) {
  deleteUserData(userId: $userId, retentionOverride: $retentionOverride) {
    success
    deletedAt
    retainedData # 法律要求保留的数据
  }
}
```

### 审计日志
```json
{
  "event": "document_translated",
  "timestamp": "2024-01-15T10:30:00Z",
  "userId": "user_123456",
  "documentId": "doc_789012",
  "action": "start_translation",
  "metadata": {
    "sourceLanguage": "en",
    "targetLanguage": "zh-cn",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "sessionId": "sess_345678"
  },
  "compliance": {
    "dataClassification": "confidential",
    "retentionPeriod": "7 years",
    "processingLawfulBasis": "contract"
  }
}
```

---

## 总结

这份增强版 API 文档提供了：

1. **完整的数据模型** - 涵盖用户、文档、项目、评论、AI聊天等所有核心实体
2. **丰富的查询接口** - 支持复杂搜索、分页、筛选和聚合查询
3. **全面的操作接口** - 包括CRUD操作、文件处理、实时协作等功能
4. **实时通信支持** - WebSocket订阅，支持进度跟踪和多人协作
5. **REST API 集成** - 与后端处理服务的完整集成规范
6. **错误处理机制** - 详细的错误代码和处理流程
7. **性能优化建议** - 缓存、分页、批处理等最佳实践
8. **安全和合规性** - 认证授权、数据保护、审计日志等要求

这个API规范完全支持您的前端功能需求，并为未来的扩展提供了坚实的基础。