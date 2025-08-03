"use client"

import { useEffect, useRef, useState } from "react"
import { FileText, X, Pin, PinOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SideBySideReviewPanelProps {
  /** 原文内容数组 */
  originalContent: string[]
  /** 是否显示面板 */
  isOpen: boolean
  /** 关闭面板的回调 */
  onClose: () => void
  /** 高亮的句子索引 */
  highlightedIndex?: number | null
  /** 编辑器滚动位置（百分比） */
  editorScrollProgress?: number
  /** 面板宽度 */
  width?: number
  /** 是否固定位置（不跟随滚动） */
  isPinned?: boolean
  /** 切换固定状态 */
  onTogglePin?: () => void
}

export function SideBySideReviewPanel({
  originalContent,
  isOpen,
  onClose,
  highlightedIndex,
  editorScrollProgress = 0,
  width = 400,
  isPinned = false,
  onTogglePin,
}: SideBySideReviewPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const highlightedRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  // 滚动同步 - 根据编辑器的滚动位置调整原文滚动
  useEffect(() => {
    if (!scrollAreaRef.current || !contentRef.current || isScrolling) return

    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
    if (!scrollContainer) return

    const maxScroll = contentRef.current.scrollHeight - scrollContainer.clientHeight
    const targetScroll = maxScroll * editorScrollProgress

    scrollContainer.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    })
  }, [editorScrollProgress, isScrolling])

  // 高亮句子自动滚动到视图中
  useEffect(() => {
    if (highlightedIndex !== null && highlightedRef.current) {
      setIsScrolling(true)
      
      highlightedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })

      // 防止滚动冲突
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 1000)
    }
  }, [highlightedIndex])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  if (!isOpen) return null

  return (
    <div
      className={cn(
        "bg-white border-l border-gray-200 flex flex-col transition-all duration-300 shadow-lg",
        isPinned ? "sticky top-0 h-screen" : "relative h-full"
      )}
      style={{ width: `${width}px` }}
    >
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">原文对照</h3>
          {highlightedIndex !== null && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              第 {highlightedIndex + 1} 句
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onTogglePin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePin}
              className="h-8 w-8 p-0"
              title={isPinned ? "取消固定" : "固定面板"}
            >
              {isPinned ? (
                <PinOff className="h-4 w-4" />
              ) : (
                <Pin className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 内容区域 */}
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div ref={contentRef} className="p-6">
          {originalContent.map((sentence, index) => (
            <div
              key={index}
              ref={highlightedIndex === index ? highlightedRef : null}
              className={cn(
                "mb-4 p-3 rounded-lg transition-all duration-300 text-sm leading-relaxed",
                highlightedIndex === index
                  ? "bg-yellow-100 border-l-4 border-yellow-500 font-medium shadow-sm"
                  : "hover:bg-gray-50"
              )}
            >
              <span className="text-xs text-gray-500 mr-2">#{index + 1}</span>
              {sentence}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* 底部信息 */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span>共 {originalContent.length} 句</span>
          <span className="text-gray-400">只读模式</span>
        </div>
      </div>
    </div>
  )
} 