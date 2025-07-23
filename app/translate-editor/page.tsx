"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Mountain,
  ArrowLeft,
  FileText,
  Languages,
  MessageSquare,
  RotateCcw,
  HelpCircle,
  Sparkles,
  Send,
  User,
  Bot,
  Copy,
  Check,
} from "lucide-react"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

// 模拟原文内容
const originalContent = `
# 人工智能在现代医疗中的应用

## 引言

人工智能（AI）技术在医疗领域的应用正在快速发展，为医疗诊断、治疗和患者护理带来了革命性的变化。本文将探讨AI在现代医疗中的主要应用领域及其潜在影响。

## 主要应用领域

### 1. 医学影像诊断

AI在医学影像分析方面表现出色，能够：
- 快速识别X光、CT和MRI扫描中的异常
- 提高诊断准确性，减少人为错误
- 协助放射科医生进行更精确的诊断

### 2. 药物研发

机器学习算法正在加速新药开发过程：
- 预测分子结构和药物相互作用
- 缩短临床试验时间
- 降低研发成本

### 3. 个性化治疗

AI能够分析患者的基因信息和病史，为每位患者制定个性化的治疗方案。

## 结论

人工智能在医疗领域的应用前景广阔，但同时也需要解决数据隐私、算法透明度等挑战。
`

// 模拟译文内容
const translatedContent = `
# Applications of Artificial Intelligence in Modern Healthcare

## Introduction

The application of Artificial Intelligence (AI) technology in the healthcare field is rapidly developing, bringing revolutionary changes to medical diagnosis, treatment, and patient care. This article will explore the main application areas of AI in modern healthcare and its potential impact.

## Main Application Areas

### 1. Medical Imaging Diagnosis

AI excels in medical image analysis and can:
- Quickly identify abnormalities in X-ray, CT, and MRI scans
- Improve diagnostic accuracy and reduce human error
- Assist radiologists in making more precise diagnoses

### 2. Drug Development

Machine learning algorithms are accelerating the new drug development process:
- Predict molecular structures and drug interactions
- Shorten clinical trial time
- Reduce research and development costs

### 3. Personalized Treatment

AI can analyze patients' genetic information and medical history to develop personalized treatment plans for each patient.

## Conclusion

The application prospects of artificial intelligence in the healthcare field are broad, but challenges such as data privacy and algorithm transparency also need to be addressed.
`

// AI聊天消息类型
interface ChatMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  selectedText?: string
  action?: "translate" | "explain" | "question"
}

/**
 * 译文编辑器页面
 * 左侧显示原文，右侧显示可编辑的译文，支持AI交互
 */
export default function TranslateEditorPage() {
  // 编辑状态
  const [editableContent, setEditableContent] = useState(translatedContent)
  const [selectedText, setSelectedText] = useState("")
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null)

  // AI交互状态
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [isAITyping, setIsAITyping] = useState(false)
  const [actionType, setActionType] = useState<"translate" | "explain" | "question">("translate")

  // 引用
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // 复制状态
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  /**
   * 处理文本选择
   */
  const handleTextSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const selected = editableContent.substring(start, end)

      if (selected.trim()) {
        setSelectedText(selected)
        setSelectionRange({ start, end })
        setShowAIPanel(true)
      }
    }
  }

  /**
   * 发送AI请求
   */
  const handleAIRequest = async (action: "translate" | "explain" | "question", customInput?: string) => {
    if (!selectedText && !customInput) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: customInput || getActionPrompt(action, selectedText),
      timestamp: new Date(),
      selectedText: selectedText,
      action: action,
    }

    setChatMessages((prev) => [...prev, userMessage])
    setIsAITyping(true)
    setCurrentInput("")

    // 模拟AI响应
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: generateAIResponse(action, selectedText, customInput),
        timestamp: new Date(),
      }

      setChatMessages((prev) => [...prev, aiResponse])
      setIsAITyping(false)
    }, 1500)
  }

  /**
   * 生成操作提示文本
   */
  const getActionPrompt = (action: "translate" | "explain" | "question", text: string) => {
    switch (action) {
      case "translate":
        return `请重新翻译这段文字："${text}"`
      case "explain":
        return `请解释这段内容的含义："${text}"`
      case "question":
        return `关于这段文字，我想了解更多："${text}"`
      default:
        return text
    }
  }

  /**
   * 生成AI响应（模拟）
   */
  const generateAIResponse = (action: "translate" | "explain" | "question", text: string, customInput?: string) => {
    if (customInput) {
      return "我理解您的问题。基于您选中的文本内容，我建议您可以考虑以下几个方面..."
    }

    switch (action) {
      case "translate":
        return `我为您重新翻译了这段文字：\n\n"${text}"\n\n重新翻译后的版本：\n"这是一个更准确和流畅的翻译版本，更好地传达了原文的含义。"`
      case "explain":
        return `关于您选中的文字："${text}"\n\n这段内容主要讲述了...它的核心观点是...这在整个文档的上下文中具有重要意义。`
      case "question":
        return `关于您选中的内容："${text}"\n\n这是一个很好的问题。从专业角度来看，这段内容涉及到...您可能还想了解...`
      default:
        return "我已经收到您的请求，正在为您处理..."
    }
  }

  /**
   * 应用AI建议的翻译
   */
  const applyAITranslation = (newTranslation: string) => {
    if (selectionRange && textareaRef.current) {
      const before = editableContent.substring(0, selectionRange.start)
      const after = editableContent.substring(selectionRange.end)
      const newContent = before + newTranslation + after

      setEditableContent(newContent)
      setSelectedText("")
      setSelectionRange(null)
    }
  }

  /**
   * 复制消息内容
   */
  const copyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  // 自动滚动到聊天底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 页面头部 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/workspace" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回工作台
            </Link>
          </Button>
          <div className="h-6 w-px bg-gray-300"></div>
          <Link href="/" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">格式译专家</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">译文编辑器</span>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            保存更改
          </Button>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：原文显示 */}
        <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              原文内容
            </h3>
            <p className="text-sm text-gray-600 mt-1">只读模式，供参考对照</p>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">{originalContent}</pre>
            </div>
          </div>
        </div>

        {/* 右侧：译文编辑区域 */}
        <div className="flex-1 flex flex-col">
          {/* 译文编辑头部 */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  译文编辑
                </h3>
                <p className="text-sm text-gray-600 mt-1">选中文字后可与AI交互进行优化</p>
              </div>

              {selectedText && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    已选中 {selectedText.length} 个字符
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedText("")
                      setSelectionRange(null)
                      setShowAIPanel(false)
                    }}
                  >
                    取消选择
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex">
            {/* 译文编辑区 */}
            <div className="flex-1 p-6 overflow-y-auto">
              <Textarea
                ref={textareaRef}
                value={editableContent}
                onChange={(e) => setEditableContent(e.target.value)}
                onSelect={handleTextSelection}
                className="w-full h-full resize-none border-0 focus:ring-0 text-base leading-relaxed overflow-y-auto"
                placeholder="译文内容将显示在这里..."
              />
            </div>

            {/* AI交互面板 */}
            {showAIPanel && (
              <div className="w-96 border-l border-gray-200 bg-white flex flex-col h-full">
                {/* AI面板头部 */}
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI 助手
                    </h4>
                    <Button size="sm" variant="ghost" onClick={() => setShowAIPanel(false)}>
                      ×
                    </Button>
                  </div>

                  {selectedText && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-xs text-gray-600 mb-1">选中的文字：</p>
                      <p className="text-sm text-gray-900 line-clamp-3">"{selectedText}"</p>
                    </div>
                  )}
                </div>

                {/* 快速操作按钮 */}
                {selectedText && (
                  <div className="p-4 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-3">快速操作：</p>
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start bg-transparent"
                        onClick={() => handleAIRequest("translate")}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        重新翻译
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start bg-transparent"
                        onClick={() => handleAIRequest("explain")}
                      >
                        <HelpCircle className="h-4 w-4 mr-2" />
                        解释内容
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full justify-start bg-transparent"
                        onClick={() => handleAIRequest("question")}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        提问
                      </Button>
                    </div>
                  </div>
                )}

                {/* 聊天消息区域 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">选中文字开始与AI交互</p>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={cn("flex gap-3", message.type === "user" ? "justify-end" : "justify-start")}
                        >
                          {message.type === "ai" && (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <Bot className="h-4 w-4 text-blue-600" />
                            </div>
                          )}

                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg p-3 relative group",
                              message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900",
                            )}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                            {/* 复制按钮 */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className={cn(
                                "absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0",
                                message.type === "user"
                                  ? "text-white hover:bg-blue-700"
                                  : "text-gray-600 hover:bg-gray-200",
                              )}
                              onClick={() => copyMessage(message.id, message.content)}
                            >
                              {copiedMessageId === message.id ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>

                          {message.type === "user" && (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                          )}
                        </div>
                      ))}

                      {isAITyping && (
                        <div className="flex gap-3 justify-start">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="bg-gray-100 rounded-lg p-3">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>

                {/* 自定义输入区域 */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <Textarea
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      placeholder="输入自定义指令..."
                      className="flex-1 resize-none h-10 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          if (currentInput.trim()) {
                            handleAIRequest("question", currentInput)
                          }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (currentInput.trim()) {
                          handleAIRequest("question", currentInput)
                        }
                      }}
                      disabled={!currentInput.trim() || isAITyping}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
