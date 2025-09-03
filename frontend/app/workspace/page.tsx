"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DocumentUpload } from "@/components/DocumentUpload"
import {
  Mountain,
  Search,
  Filter,
  Upload,
  FileText,
  MoreVertical,
  Download,
  Trash2,
  Share2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  LogOut,
  User,
  Loader2,
  HardDrive,
  Shield,
} from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { useDocuments } from "@/hooks/useDocuments"
import { DocumentStatus, TranslationStyle } from "@/types/graphql"

/**
 * 工作台页面组件
 * 连接到GraphQL后端管理文档
 */
export default function WorkspacePage() {
  const router = useRouter()
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth()
  const { 
    documents, 
    loading: docsLoading, 
    error: docsError, 
    deleteDocument,
    searchDocuments,
    refetch 
  } = useDocuments()

  // 页面状态
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date")
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // 检查认证状态
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // 处理文档搜索
  const handleSearch = async () => {
    if (searchQuery) {
      await searchDocuments(searchQuery)
    } else {
      await refetch()
    }
  }

  // 处理文档删除
  const handleDelete = async (documentId: string) => {
    if (!confirm("确定要删除这个文档吗？")) return
    
    setIsDeleting(documentId)
    try {
      await deleteDocument(documentId)
      setSelectedDocument(null)
    } catch (error) {
      console.error("删除文档失败:", error)
    } finally {
      setIsDeleting(null)
    }
  }

  // 处理文档预览
  const handlePreview = (documentId: string) => {
    router.push(`/preview?id=${documentId}`)
  }

  // 处理文档下载
  const handleDownload = (document: any) => {
    // 如果有下载链接，直接下载
    if (document.downloadLinks?.length > 0) {
      const link = document.downloadLinks[0]
      window.open(link.url, '_blank')
    } else {
      alert("文档还未准备好下载，请稍后再试")
    }
  }

  // 处理登出
  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  // 筛选和排序文档
  const filteredDocuments = documents
    .filter((doc) => {
      // 状态筛选
      if (filterStatus !== "all" && doc.status !== filterStatus) {
        return false
      }
      // 搜索筛选
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          doc.title.toLowerCase().includes(query) ||
          doc.sourceLanguage.toLowerCase().includes(query) ||
          doc.targetLanguage.toLowerCase().includes(query)
        )
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else if (sortBy === "name") {
        return a.title.localeCompare(b.title)
      } else if (sortBy === "status") {
        return a.status.localeCompare(b.status)
      }
      return 0
    })

  // 加载状态
  if (authLoading) {
    return <WorkspaceSkeleton />
  }

  // 未登录状态
  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">格式译专家</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">{user.name}</span>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard_MainPage">仪表板</Link>
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">我的工作台</h1>
            <p className="text-gray-600 mt-1">管理您的所有翻译文档</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={docsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${docsLoading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button onClick={() => setShowUploadDialog(!showUploadDialog)}>
              <Upload className="h-4 w-4 mr-2" />
              上传文档
            </Button>
          </div>
        </div>

        {/* 错误提示 */}
        {docsError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              加载文档时出错：{docsError}
            </AlertDescription>
          </Alert>
        )}

        {/* 存储统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总文档数</p>
                  <p className="text-2xl font-bold">{documents.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">已完成</p>
                  <p className="text-2xl font-bold text-green-600">
                    {documents.filter(d => d.status === DocumentStatus.COMPLETED).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">处理中</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {documents.filter(d => 
                      d.status === DocumentStatus.PROCESSING || 
                      d.status === DocumentStatus.TRANSLATING
                    ).length}
                  </p>
                </div>
                <Loader2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">云端存储</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {documents.filter(d => d.fileUrl).length}
                  </p>
                </div>
                <div className="flex items-center">
                  <HardDrive className="h-6 w-6 text-purple-500 mr-1" />
                  <Shield className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 上传组件 */}
        {showUploadDialog && (
          <div className="mb-6">
            <DocumentUpload />
          </div>
        )}

        {/* 搜索和筛选栏 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="搜索文档..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value={DocumentStatus.COMPLETED}>已完成</SelectItem>
                <SelectItem value={DocumentStatus.TRANSLATING}>翻译中</SelectItem>
                <SelectItem value={DocumentStatus.PROCESSING}>处理中</SelectItem>
                <SelectItem value={DocumentStatus.REVIEWING}>审核中</SelectItem>
                <SelectItem value={DocumentStatus.FAILED}>失败</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">按日期</SelectItem>
                <SelectItem value="name">按名称</SelectItem>
                <SelectItem value="status">按状态</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 文档列表 */}
        {docsLoading && filteredDocuments.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-32 w-full" />
              </Card>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || filterStatus !== "all" ? "没有找到匹配的文档" : "还没有文档"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterStatus !== "all" 
                ? "尝试调整搜索条件或筛选器"
                : "上传您的第一个文档开始翻译"
              }
            </p>
            {!searchQuery && filterStatus === "all" && (
              <Button onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                上传文档
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                isSelected={selectedDocument === document.id}
                isDeleting={isDeleting === document.id}
                onSelect={() => setSelectedDocument(document.id)}
                onPreview={() => handlePreview(document.id)}
                onDownload={() => handleDownload(document)}
                onDelete={() => handleDelete(document.id)}
              />
            ))}
          </div>
        )}

        {/* 统计信息 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              共 {filteredDocuments.length} 个文档
              {searchQuery && ` (搜索: "${searchQuery}")`}
              {filterStatus !== "all" && ` (筛选: ${getStatusLabel(filterStatus as DocumentStatus)})`}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                已完成: {filteredDocuments.filter(d => d.status === DocumentStatus.COMPLETED).length}
              </span>
              <span>
                处理中: {filteredDocuments.filter(d => 
                  d.status === DocumentStatus.TRANSLATING || 
                  d.status === DocumentStatus.PROCESSING
                ).length}
              </span>
              <span>
                失败: {filteredDocuments.filter(d => d.status === DocumentStatus.FAILED).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 文档卡片组件
 */
function DocumentCard({
  document,
  isSelected,
  isDeleting,
  onSelect,
  onPreview,
  onDownload,
  onDelete,
}: {
  document: any
  isSelected: boolean
  isDeleting: boolean
  onSelect: () => void
  onPreview: () => void
  onDownload: () => void
  onDelete: () => void
}) {
  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case DocumentStatus.TRANSLATING:
      case DocumentStatus.PROCESSING:
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      case DocumentStatus.REVIEWING:
        return <Clock className="h-4 w-4 text-yellow-600" />
      case DocumentStatus.FAILED:
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.COMPLETED:
        return "bg-green-100 text-green-800"
      case DocumentStatus.TRANSLATING:
      case DocumentStatus.PROCESSING:
        return "bg-blue-100 text-blue-800"
      case DocumentStatus.REVIEWING:
        return "bg-yellow-100 text-yellow-800"
      case DocumentStatus.FAILED:
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card 
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-400" />
          <Badge className={getStatusColor(document.status)} variant="secondary">
            <span className="flex items-center gap-1">
              {getStatusIcon(document.status)}
              {getStatusLabel(document.status)}
            </span>
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              onPreview()
            }}>
              <Eye className="h-4 w-4 mr-2" />
              预览
            </DropdownMenuItem>
            {document.status === DocumentStatus.COMPLETED && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onDownload()
              }}>
                <Download className="h-4 w-4 mr-2" />
                下载
              </DropdownMenuItem>
            )}
            <DropdownMenuItem disabled>
              <Share2 className="h-4 w-4 mr-2" />
              分享
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
        {document.title}
      </h3>

      <div className="space-y-1 text-sm text-gray-600">
        <p>
          {document.sourceLanguage} → {document.targetLanguage}
        </p>
        <p className="text-xs">
          风格: {getStyleLabel(document.translationStyle)}
        </p>
        {document.progress > 0 && document.progress < 100 && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>进度</span>
              <span>{document.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${document.progress}%` }}
              />
            </div>
          </div>
        )}
        <p className="text-xs text-gray-500 pt-2">
          {new Date(document.createdAt).toLocaleDateString('zh-CN')}
        </p>
      </div>
    </Card>
  )
}

/**
 * 骨架屏组件
 */
function WorkspaceSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-6 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Skeleton className="h-16 w-full mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-32 w-full" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * 获取状态标签
 */
function getStatusLabel(status: DocumentStatus): string {
  switch (status) {
    case DocumentStatus.COMPLETED:
      return "已完成"
    case DocumentStatus.TRANSLATING:
      return "翻译中"
    case DocumentStatus.PROCESSING:
      return "处理中"
    case DocumentStatus.REVIEWING:
      return "审核中"
    case DocumentStatus.FAILED:
      return "失败"
    default:
      return status
  }
}

/**
 * 获取风格标签
 */
function getStyleLabel(style: TranslationStyle): string {
  switch (style) {
    case TranslationStyle.GENERAL:
      return "通用"
    case TranslationStyle.ACADEMIC:
      return "学术"
    case TranslationStyle.BUSINESS:
      return "商务"
    case TranslationStyle.LEGAL:
      return "法律"
    case TranslationStyle.TECHNICAL:
      return "技术"
    case TranslationStyle.CREATIVE:
      return "创意"
    case TranslationStyle.MEDICAL:
      return "医疗"
    case TranslationStyle.FINANCIAL:
      return "金融"
    default:
      return style
  }
}