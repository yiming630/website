"use client"

import React, { RefObject } from 'react'
import { cn } from '@/lib/utils'
import { Languages } from 'lucide-react'
import { EditorCanvas, EditorCanvasRef } from './EditorCanvas'
import { SideBySideReviewPanel } from './SideBySideReviewPanel'
import { FormatState } from '@/app/translate-editor/types'

interface EditorSectionProps {
  editableContent: string
  showOriginal: boolean
  originalContent: string[]
  highlightedSentenceIndex: number | null
  editorScrollProgress: number
  isPanelPinned: boolean
  formatState: FormatState
  editorRef: RefObject<EditorCanvasRef | null>
  isInitialized: boolean
  saveStatus: 'saved' | 'saving' | 'unsaved'
  onContentChange: (content: string) => void
  onToggleOriginal: () => void
  onTogglePanelPin: () => void
  onEditorScroll: (progress: number) => void
  onFormatStateChange: (state: FormatState) => void
  onSaveStatusChange: (status: 'saved' | 'saving' | 'unsaved') => void
}

export const EditorSection: React.FC<EditorSectionProps> = ({
  editableContent,
  showOriginal,
  originalContent,
  highlightedSentenceIndex,
  editorScrollProgress,
  isPanelPinned,
  formatState,
  editorRef,
  isInitialized,
  saveStatus,
  onContentChange,
  onToggleOriginal,
  onTogglePanelPin,
  onEditorScroll,
  onFormatStateChange,
  onSaveStatusChange,
}) => {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollProgress = target.scrollTop / (target.scrollHeight - target.clientHeight)
    onEditorScroll(scrollProgress)
  }

  const handleContentChange = (content: string) => {
    onContentChange(content)
    if (isInitialized && saveStatus === 'saved') {
      onSaveStatusChange('unsaved')
    }
  }

  return (
    <div className="flex-1 flex h-full">
      {/* 主编辑区域容器 */}
      <div className={cn(
        "flex-1 flex h-full",
        showOriginal && "pr-0"
      )}>
        {/* 译文编辑区域 - 使用EditorCanvas */}
        <div className="flex-1 bg-gray-100 flex flex-col h-full">
          <div className="bg-gray-50 border-b border-gray-200" style={{ height: '73px', padding: '16px', flexShrink: 0 }}>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Languages className="h-5 w-5" />
              译文编辑
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              使用上方工具栏进行格式化编辑
            </p>
          </div>
          
          <div className="flex-1 p-8 overflow-y-auto scrollbar-thin" style={{ minHeight: 0 }} onScroll={handleScroll}>
            <EditorCanvas
              ref={editorRef}
              content={editableContent}
              onChange={handleContentChange}
              onFormatStateChange={onFormatStateChange}
              formatState={formatState}
              onClick={() => {}}
            />
          </div>
        </div>
        
        {/* 原文对照侧边栏 */}
        <SideBySideReviewPanel
          originalContent={originalContent}
          isOpen={showOriginal}
          onClose={onToggleOriginal}
          highlightedIndex={highlightedSentenceIndex}
          editorScrollProgress={editorScrollProgress}
          width={450}
          isPinned={isPanelPinned}
          onTogglePin={onTogglePanelPin}
        />
      </div>
    </div>
  )
}