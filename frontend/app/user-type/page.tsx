"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mountain, BookOpen, Briefcase, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function UserTypePage() {
  const router = useRouter()

  const handleReaderChoice = () => {
    // 一键翻译 - 设置标志并跳转到简化工作台
    localStorage.setItem('userType', 'reader')
    router.push('/reader-workspace')
  }

  const handleProfessionalChoice = () => {
    // 专业模式 - 设置标志并跳转到工作台
    localStorage.setItem('userType', 'professional')
    router.push('/workspace')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">格式译专家</span>
          </Link>
        </div>
      </header>

      {/* 主要内容 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">选择您的使用方式</h1>
            <p className="text-xl text-gray-600">根据您的需求，我们为您提供不同的翻译体验</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 一键翻译选项 */}
            <Card className="hover:shadow-xl transition-shadow duration-300 cursor-pointer border-2 hover:border-blue-500" onClick={handleReaderChoice}>
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-blue-600" />
                </div>
                <CardTitle className="text-2xl mb-2">一键翻译</CardTitle>
                <CardDescription className="text-base">
                  秒速翻译，格式无损，动动鼠标就能翻译整本书
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-blue-600 text-xs">✓</span>
                    </div>
                    <span>快速上传，秒级响应，极速翻译</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-blue-600 text-xs">✓</span>
                    </div>
                    <span>保留全部格式，表格图片完美还原</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-blue-600 text-xs">✓</span>
                    </div>
                    <span>无需二次编辑，直接使用译文</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-blue-600 text-xs">✓</span>
                    </div>
                    <span>动动鼠标即可翻译整本书籍</span>
                  </div>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                  选择此模式
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* 专业模式选项 */}
            <Card className="hover:shadow-xl transition-shadow duration-300 cursor-pointer border-2 hover:border-purple-500" onClick={handleProfessionalChoice}>
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-10 h-10 text-purple-600" />
                </div>
                <CardTitle className="text-2xl mb-2">专业模式</CardTitle>
                <CardDescription className="text-base">
                  精细控制，打造完美译文
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-purple-600 text-xs">✓</span>
                    </div>
                    <span>自定义翻译风格和领域</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-purple-600 text-xs">✓</span>
                    </div>
                    <span>AI辅助编辑和优化</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-purple-600 text-xs">✓</span>
                    </div>
                    <span>对照查看原文译文</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                      <span className="text-purple-600 text-xs">✓</span>
                    </div>
                    <span>专业排版和格式控制</span>
                  </div>
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="lg">
                  选择此模式
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              不确定选择哪个？您可以随时在设置中切换使用模式
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 