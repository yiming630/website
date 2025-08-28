"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Mountain,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  BarChart3,
  Users,
  Globe,
  Zap,
  LogOut,
  User,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { useDocuments } from "@/hooks/useDocuments"
import { DocumentStatus, TranslationStyle } from "@/types/graphql"

/**
 * 仪表板页面组件
 * 连接到GraphQL后端显示真实用户数据和翻译统计
 */
export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth()
  const { documents, loading: docsLoading, error: docsError, refetch } = useDocuments({ 
    autoRefetch: true,
    refetchInterval: 30000 // 每30秒刷新一次
  })

  // 如果未登录，重定向到登录页
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // 计算统计数据
  const stats = {
    totalDocuments: documents.length,
    completedDocuments: documents.filter(d => d.status === DocumentStatus.COMPLETED).length,
    processingDocuments: documents.filter(d => d.status === DocumentStatus.TRANSLATING || d.status === DocumentStatus.PROCESSING).length,
    totalCharacters: documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0),
  }

  // 获取最近的文档（最多5个）
  const recentDocuments = documents
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // 处理登出
  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  // 加载状态
  if (authLoading) {
    return <DashboardSkeleton />
  }

  // 未登录状态（防御性编程）
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
            {/* 用户信息 */}
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">{user.name}</span>
              <span className="text-xs text-gray-500">({user.role})</span>
            </div>
            
            <Button variant="outline" asChild>
              <Link href="/workspace">工作台</Link>
            </Button>
            <Button asChild>
              <Link href="/translate">
                <Plus className="h-4 w-4 mr-2" />
                新建翻译
              </Link>
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            欢迎回来，{user.name}！
          </h1>
          <p className="text-gray-600">
            这里是您的翻译工作概览，查看最新进展和统计数据
          </p>
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

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="总文档数"
            value={stats.totalDocuments}
            unit="份"
            icon={FileText}
            color="text-blue-600"
            bgColor="bg-blue-100"
            loading={docsLoading}
          />
          <StatCard
            title="已完成"
            value={stats.completedDocuments}
            unit="份"
            icon={CheckCircle2}
            color="text-emerald-600"
            bgColor="bg-emerald-100"
            loading={docsLoading}
          />
          <StatCard
            title="处理中"
            value={stats.processingDocuments}
            unit="份"
            icon={Clock}
            color="text-yellow-600"
            bgColor="bg-yellow-100"
            loading={docsLoading}
          />
          <StatCard
            title="成功率"
            value={stats.totalDocuments > 0 
              ? Math.round((stats.completedDocuments / stats.totalDocuments) * 100)
              : 0
            }
            unit="%"
            icon={TrendingUp}
            color="text-purple-600"
            bgColor="bg-purple-100"
            loading={docsLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 最近文档 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>最近文档</CardTitle>
                  <CardDescription>您最近的翻译任务</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => refetch()}
                  disabled={docsLoading}
                >
                  刷新
                </Button>
              </CardHeader>
              <CardContent>
                {docsLoading && recentDocuments.length === 0 ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recentDocuments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">暂无文档</p>
                    <Button className="mt-4" asChild>
                      <Link href="/translate">
                        <Plus className="h-4 w-4 mr-2" />
                        创建第一个翻译
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentDocuments.map((doc) => (
                      <DocumentItem key={doc.id} document={doc} />
                    ))}
                  </div>
                )}

                {recentDocuments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/workspace">
                        查看所有文档
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 使用情况 */}
            <Card>
              <CardHeader>
                <CardTitle>账户信息</CardTitle>
                <CardDescription>您的账户类型和使用情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">账户类型</span>
                    <span className="text-sm text-gray-600">{user.plan || "免费版"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">注册时间</span>
                    <span className="text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  {user.lastLogin && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">上次登录</span>
                      <span className="text-sm text-gray-600">
                        {new Date(user.lastLogin).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-lg mt-4">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-900">升级到专业版</p>
                        <p className="text-sm text-blue-700">获得更多功能和无限翻译额度</p>
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        了解更多
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 快速操作 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
                <CardDescription>常用功能快速入口</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" asChild>
                  <Link href="/translate">
                    <Plus className="h-4 w-4 mr-2" />
                    新建翻译
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/workspace">
                    <FileText className="h-4 w-4 mr-2" />
                    文档管理
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Users className="h-4 w-4 mr-2" />
                  团队协作（即将推出）
                </Button>
                <Button variant="outline" className="w-full justify-start" disabled>
                  <Globe className="h-4 w-4 mr-2" />
                  API集成（即将推出）
                </Button>
              </CardContent>
            </Card>

            {/* 帮助和支持 */}
            <Card>
              <CardHeader>
                <CardTitle>帮助和支持</CardTitle>
                <CardDescription>获取帮助和了解新功能</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="ghost" className="w-full justify-start">
                  📖 使用指南
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  💬 联系客服
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  🎯 功能建议
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  🔔 更新日志
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 统计卡片组件
 */
function StatCard({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  color, 
  bgColor,
  loading 
}: {
  title: string
  value: number | string
  unit: string
  icon: any
  color: string
  bgColor: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-2" />
            ) : (
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{unit}</p>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 文档列表项组件
 */
function DocumentItem({ document }: { document: any }) {
  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.COMPLETED:
        return { bg: "bg-emerald-100", text: "text-emerald-600", label: "已完成" }
      case DocumentStatus.TRANSLATING:
      case DocumentStatus.PROCESSING:
        return { bg: "bg-blue-100", text: "text-blue-600", label: "处理中" }
      case DocumentStatus.FAILED:
        return { bg: "bg-red-100", text: "text-red-600", label: "失败" }
      default:
        return { bg: "bg-gray-100", text: "text-gray-600", label: status }
    }
  }

  const status = getStatusColor(document.status)
  const createdAt = new Date(document.createdAt)
  const timeAgo = getTimeAgo(createdAt)

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={`w-10 h-10 rounded-full ${status.bg} flex items-center justify-center`}>
        {document.status === DocumentStatus.COMPLETED ? (
          <CheckCircle2 className={`h-5 w-5 ${status.text}`} />
        ) : (
          <Clock className={`h-5 w-5 ${status.text}`} />
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{document.title}</p>
        <p className="text-sm text-gray-600">
          {document.sourceLanguage} → {document.targetLanguage} • {document.translationStyle}
        </p>
      </div>
      <div className="text-right">
        <span className={`text-xs px-2 py-1 rounded-full ${status.bg} ${status.text}`}>
          {status.label}
        </span>
        <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
      </div>
    </div>
  )
}

/**
 * 骨架屏组件
 */
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-6 w-96 mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * 计算相对时间
 */
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}