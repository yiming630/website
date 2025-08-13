"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mountain, Download, FileText, CheckCircle, Home } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ReaderDownloadPage() {
  const router = useRouter()

  const handleDownload = () => {
    // 模拟下载
    alert("开始下载译文...")
    // 实际项目中这里会触发真实的文件下载
  }

  const handleNewTranslation = () => {
    router.push('/reader-workspace')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 简洁的头部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">格式译专家</span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            <Home className="h-4 w-4 mr-1" />
            返回首页
          </Button>
        </div>
      </header>

      {/* 主要内容 */}
      <div className="flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-73px)]">
        <div className="w-full max-w-lg">
          <Card className="shadow-xl">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                {/* 成功图标 */}
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>

                {/* 成功消息 */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">翻译成功！</h1>
                  <p className="text-lg text-gray-600">您的文档已经翻译完成</p>
                </div>

                {/* 文件信息 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">翻译文档.pdf</p>
                      <p className="text-sm text-gray-500">准备下载 • 2.8 MB</p>
                    </div>
                  </div>
                </div>

                {/* 下载按钮 */}
                <div className="space-y-3">
                  <Button 
                    size="lg" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                    onClick={handleDownload}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    立即下载
                  </Button>

                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full h-12"
                    onClick={handleNewTranslation}
                  >
                    翻译新文档
                  </Button>
                </div>

                {/* 提示信息 */}
                <div className="text-sm text-gray-500 space-y-1">
                  <p>✓ 保持原文档格式</p>
                  <p>✓ AI智能优化译文</p>
                  <p>✓ 支持多种语言</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 底部链接 */}
          <div className="text-center mt-6 text-sm text-gray-500">
            <p>
              需要编辑译文？
              <Button 
                variant="link" 
                className="text-blue-600 hover:text-blue-700 p-0 ml-1"
                onClick={() => {
                  localStorage.setItem('userType', 'professional')
                  router.push('/workspace')
                }}
              >
                试试专业模式
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 