"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mountain, Upload, FileText, ArrowRight, Globe, Languages, Sparkles } from "lucide-react"
import Link from "next/link"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

// Translation styles
const TRANSLATION_STYLES = [
  { value: "GENERAL", label: "通用" },
  { value: "ACADEMIC", label: "学术" },
  { value: "BUSINESS", label: "商务" },
  { value: "LEGAL", label: "法律" },
  { value: "TECHNICAL", label: "技术" },
  { value: "CREATIVE", label: "创意" },
  { value: "MEDICAL", label: "医学" },
  { value: "FINANCIAL", label: "金融" }
]

// Supported languages
const LANGUAGES = [
  { value: "en", label: "英语" },
  { value: "zh", label: "中文" },
  { value: "es", label: "西班牙语" },
  { value: "fr", label: "法语" },
  { value: "de", label: "德语" },
  { value: "ja", label: "日语" },
  { value: "ko", label: "韩语" },
  { value: "ru", label: "俄语" }
]

export default function ReaderWorkspacePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [sourceLanguage, setSourceLanguage] = useState("en")
  const [targetLanguage, setTargetLanguage] = useState("zh")
  const [translationStyle, setTranslationStyle] = useState("GENERAL")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (selectedFile: File) => {
    if (!selectedFile) return

    // Check file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: "文件类型不支持",
        description: "请上传 PDF、DOCX 或 TXT 格式的文件",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    
    try {
      // Get auth token
      const token = localStorage.getItem('token')
      
      if (!token) {
        // If no token, use quick mode without authentication
        console.log("Using quick translation mode without authentication")
      }

      // Prepare form data
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('sourceLanguage', sourceLanguage)
      formData.append('targetLanguage', targetLanguage)
      formData.append('translationStyle', translationStyle)
      formData.append('visibility', 'private')

      // Upload file to backend (use quick route if no token)
      const uploadUrl = token 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'}/api/files/upload`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002'}/api/files/upload/quick`;
        
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.error || '文件上传失败')
      }

      const uploadResult = await uploadResponse.json()
      
      // Store file metadata for the translating page
      sessionStorage.setItem('uploadedFile', JSON.stringify({
        fileId: uploadResult.fileMetadata?.fileId,
        filename: selectedFile.name,
        sourceLanguage,
        targetLanguage,
        translationStyle,
        uploadResult
      }))

      toast({
        title: "文件上传成功",
        description: "正在跳转到翻译页面...",
      })

      // Navigate to translating page
      setTimeout(() => {
        router.push('/reader-translating')
      }, 500)

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "上传失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile)
      handleFileUpload(selectedFile)
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
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">格式译专家</span>
          </Link>
          <span className="text-sm text-gray-500 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            快速翻译模式
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-73px)]">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">上传您的文档</h1>
            <p className="text-lg text-gray-600">AI智能翻译，保持原文排版，支持多种格式</p>
          </div>

          <Card className="shadow-xl">
            <CardContent className="p-8">
              {/* Language and Style Selection */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    源语言
                  </Label>
                  <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Languages className="h-3 w-3" />
                    目标语言
                  </Label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    翻译风格
                  </Label>
                  <Select value={translationStyle} onValueChange={setTranslationStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSLATION_STYLES.map(style => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                className={`
                  relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                  transition-all duration-200 
                  ${isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                  }
                  ${isUploading ? 'pointer-events-none opacity-60' : ''}
                `}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  disabled={isUploading}
                />

                {isUploading ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{file?.name}</p>
                      <p className="text-sm text-gray-500 mt-1">正在上传并准备翻译...</p>
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
                      <p className="text-sm text-gray-500 mt-1">支持 PDF、DOCX、TXT 格式</p>
                    </div>
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                      选择文件
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Process Steps */}
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