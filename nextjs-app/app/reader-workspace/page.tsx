"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mountain, Upload, FileText, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

export default function ReaderWorkspacePage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
      // 立即跳转到翻译页面
      setTimeout(() => {
        router.push('/reader-translating')
      }, 500)
    } else if (selectedFile) {
      alert("请上传PDF格式的文件")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] || null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files?.[0] || null)
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
          <span className="text-sm text-gray-500">快速翻译模式</span>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-73px)]">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">上传您的文档</h1>
            <p className="text-lg text-gray-600">支持PDF格式，AI智能翻译，保持原文排版</p>
          </div>

          <Card className="shadow-xl">
            <CardContent className="p-8">
              <div
                className={`
                  relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                  transition-all duration-200 
                  ${isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                  }
                `}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf"
                />

                {file ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500 mt-1">正在准备翻译...</p>
                    </div>
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        拖拽文件到此处，或点击选择
                      </p>
                      <p className="text-sm text-gray-500 mt-1">仅支持PDF格式</p>
                    </div>
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                      选择文件
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* 简单的说明 */}
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">1</div>
                  <p className="text-sm text-gray-600 mt-1">上传文档</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">2</div>
                  <p className="text-sm text-gray-600 mt-1">AI翻译</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">3</div>
                  <p className="text-sm text-gray-600 mt-1">下载译文</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-gray-500 mt-6">
            需要更多控制选项？
            <Button 
              variant="link" 
              className="text-blue-600 hover:text-blue-700 p-0 ml-1"
              onClick={() => {
                localStorage.setItem('userType', 'professional')
                router.push('/workspace')
              }}
            >
              切换到专业模式
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
} 