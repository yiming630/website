"use client"

import { Button } from "@/components/ui/button"
import { AtSign } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Header } from "@/components/translate-editor/Header"
import { MainToolbar } from "@/components/translate-editor/MainToolbar"
import { EditorCanvas, EditorCanvasRef } from "@/components/translate-editor/EditorCanvas"
import { StatusBar } from "@/components/translate-editor/StatusBar"
import { AIChatPanel } from "@/components/translate-editor/AIChatPanel"
import { EditorSection } from "@/components/translate-editor/EditorSection"
import { useAIChat } from "./hooks/useAIChat"
import { useTextSelection } from "./hooks/useTextSelection"
import { FormatState } from "./types"
import { translatedContent, originalSentences, defaultCollaborators } from "./constants"

/**
 * 译文编辑器页面 - 左右分栏布局
 */
export default function TranslateEditorPage() {
  // 编辑器内容
  const [editableContent, setEditableContent] = useState(translatedContent)
  const [showOriginal, setShowOriginal] = useState(false)
  const [highlightedSentenceIndex, setHighlightedSentenceIndex] = useState<number | null>(null)
  const [isPanelPinned, setIsPanelPinned] = useState(false)
  const [editorScrollProgress, setEditorScrollProgress] = useState(0)
  
  // 文档状态
  const [documentTitle, setDocumentTitle] = useState('AI翻译文档 - 2024年11月')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  
  // 视图状态
  const [showRuler, setShowRuler] = useState(false)
  const [viewMode, setViewMode] = useState<'edit' | 'read' | 'preview'>('edit')
  const [zoomLevel, setZoomLevel] = useState(100)
  
  // 格式状态
  const [formatState, setFormatState] = useState<FormatState>({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    textColor: '#000000',
    backgroundColor: '#FFFFFF',
    fontSize: '12',
    fontFamily: 'default',
    alignment: 'left',
    isBulletList: false,
    isNumberedList: false,
    lineHeight: '1.5',
  })

  // 使用自定义钩子
  const {
    chatMessages,
    inputValue,
    setInputValue,
    showAttachMenu,
    setShowAttachMenu,
    expandedCategories,
    mentionedItems,
    textActionGroups,
    currentTextId,
    sendMessage,
    addActionToMentions,
    addTextToMentions,
    removeMention,
    removeActionFromGroup,
    selectTextGroup,
    updateGroupCustomInstruction,
    updateActionCustomInstruction,
    toggleCategoryExpanded,
  } = useAIChat()

  const {
    selectedText,
    showFloatingButton,
    floatingButtonPosition,
    clearSelection,
    hideFloatingButton,
  } = useTextSelection()
  
  // 引用
  const editorRef = useRef<EditorCanvasRef>(null)
  
  // 初始化状态
  const [isInitialized, setIsInitialized] = useState(false)

  // 计算字数和字符数
  const wordCount = editableContent.trim().split(/\s+/).length
  const charCount = editableContent.length

  useEffect(() => {
    setIsInitialized(true)
  }, [])

  /**
   * 添加选中文本到@引用
   */
  const addSelectedTextToMentions = () => {
    if (selectedText) {
      addTextToMentions(selectedText)
      hideFloatingButton() // 只隐藏浮动按钮，不清除选中状态
    }
  }
  
  // 工具栏事件处理函数
  const handleUndo = () => editorRef.current?.undo()
  const handleRedo = () => editorRef.current?.redo()
  const handleNewDocument = () => console.log('New document')
  const handleOpenDocument = () => console.log('Open document')
  const handleSave = () => {
    setSaveStatus('saving')
    setTimeout(() => setSaveStatus('saved'), 1000)
  }
  const handleSaveAs = () => console.log('Save as')
  const handlePrint = () => console.log('Print')
  const handleShare = () => console.log('Share')
  const handleExport = () => console.log('Export')
  const handleFindReplace = () => console.log('Find and replace')
  const handleCut = () => document.execCommand('cut')
  const handleCopy = () => document.execCommand('copy')
  const handlePaste = () => document.execCommand('paste')
  const handleToggleRuler = () => setShowRuler(!showRuler)
  const handleToggleOriginalView = () => setShowOriginal(!showOriginal)
  const handleInsertImage = () => console.log('Insert image')
  const handleInsertTable = () => console.log('Insert table')
  const handleInsertLink = () => console.log('Insert link')
  const handleInsertSymbol = () => console.log('Insert symbol')
  const handleFormatText = () => console.log('Format text')
  const handleFormatParagraph = () => console.log('Format paragraph')
  const handleFormatStyles = () => console.log('Format styles')
  const handleBold = () => setFormatState(prev => ({ ...prev, isBold: !prev.isBold }))
  const handleItalic = () => setFormatState(prev => ({ ...prev, isItalic: !prev.isItalic }))
  const handleUnderline = () => setFormatState(prev => ({ ...prev, isUnderline: !prev.isUnderline }))
  const handleStrikethrough = () => setFormatState(prev => ({ ...prev, isStrikethrough: !prev.isStrikethrough }))
  const handleTextColor = (color: string) => setFormatState(prev => ({ ...prev, textColor: color }))
  const handleBackgroundColor = (color: string) => setFormatState(prev => ({ ...prev, backgroundColor: color }))
  const handleFontSize = (size: string) => setFormatState(prev => ({ ...prev, fontSize: size }))
  const handleFontFamily = (family: string) => setFormatState(prev => ({ ...prev, fontFamily: family }))
  const handleAlign = (align: 'left' | 'center' | 'right' | 'justify') => setFormatState(prev => ({ ...prev, alignment: align }))
  const handleBulletList = () => setFormatState(prev => ({ ...prev, isBulletList: !prev.isBulletList }))
  const handleNumberedList = () => setFormatState(prev => ({ ...prev, isNumberedList: !prev.isNumberedList }))
  const handleIndent = () => console.log('Indent')
  const handleOutdent = () => console.log('Outdent')
  const handleLineHeight = (height: string) => setFormatState(prev => ({ ...prev, lineHeight: height }))
  const togglePanelPin = () => setIsPanelPinned(!isPanelPinned)
  const handleEditorScroll = (progress: number) => setEditorScrollProgress(progress)
  const handleViewHistory = () => console.log('View chat history')
  const handleNewConversation = () => {
    // 清空聊天记录，开始新对话
    console.log('Start new conversation')
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* 顶部头部栏 */}
      <Header
        documentTitle={documentTitle}
        onTitleChange={setDocumentTitle}
        saveStatus={saveStatus}
        onSave={handleSave}
        onShare={handleShare}
        onExport={handleExport}
        collaborators={defaultCollaborators}
      />

      {/* 主菜单栏和格式化工具栏 */}
      <MainToolbar
        onNewDocument={handleNewDocument}
        onOpenDocument={handleOpenDocument}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onPrint={handlePrint}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onFindReplace={handleFindReplace}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onToggleRuler={handleToggleRuler}
        onToggleOriginalView={handleToggleOriginalView}
        onInsertImage={handleInsertImage}
        onInsertTable={handleInsertTable}
        onInsertLink={handleInsertLink}
        onInsertSymbol={handleInsertSymbol}
        onFormatText={handleFormatText}
        onFormatParagraph={handleFormatParagraph}
        onFormatStyles={handleFormatStyles}
        showRuler={showRuler}
        showOriginal={showOriginal}
        // 格式化状态和操作
        canUndo={editorRef.current?.canUndo() || false}
        canRedo={editorRef.current?.canRedo() || false}
        isBold={formatState.isBold}
        isItalic={formatState.isItalic}
        isUnderline={formatState.isUnderline}
        isStrikethrough={formatState.isStrikethrough}
        textColor={formatState.textColor}
        backgroundColor={formatState.backgroundColor}
        fontSize={formatState.fontSize}
        fontFamily={formatState.fontFamily}
        alignment={formatState.alignment}
        isBulletList={formatState.isBulletList}
        isNumberedList={formatState.isNumberedList}
        lineHeight={formatState.lineHeight}
        onBold={handleBold}
        onItalic={handleItalic}
        onUnderline={handleUnderline}
        onStrikethrough={handleStrikethrough}
        onTextColor={handleTextColor}
        onBackgroundColor={handleBackgroundColor}
        onFontSize={handleFontSize}
        onFontFamily={handleFontFamily}
        onAlign={handleAlign}
        onBulletList={handleBulletList}
        onNumberedList={handleNumberedList}
        onIndent={handleIndent}
        onOutdent={handleOutdent}
        onLineHeight={handleLineHeight}
        onViewHistory={handleViewHistory}
        onNewConversation={handleNewConversation}
      />



      {/* 标尺 */}
      {showRuler && (
        <div className="bg-gray-100 border-b border-gray-300 h-6 flex items-center px-6">
          <div className="flex items-center w-full relative">
            <div className="absolute inset-0 flex">
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="flex-1 border-r border-gray-400 relative">
                  <span className="absolute top-0 left-0 text-[10px] text-gray-600 pl-0.5">{i}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 主要内容区域 - 左右分栏布局 - 最大化高度利用 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧编辑器区域 - 60% */}
        <EditorSection
          editableContent={editableContent}
          showOriginal={showOriginal}
          originalContent={originalSentences}
          highlightedSentenceIndex={highlightedSentenceIndex}
          editorScrollProgress={editorScrollProgress}
          isPanelPinned={isPanelPinned}
          formatState={formatState}
          editorRef={editorRef}
          isInitialized={isInitialized}
          saveStatus={saveStatus}
          onContentChange={setEditableContent}
          onToggleOriginal={handleToggleOriginalView}
          onTogglePanelPin={togglePanelPin}
          onEditorScroll={handleEditorScroll}
                onFormatStateChange={setFormatState}
          onSaveStatusChange={setSaveStatus}
        />

        {/* 右侧AI聊天区域 - 40% */}
        <AIChatPanel
          chatMessages={chatMessages}
          inputValue={inputValue}
          mentionedItems={mentionedItems}
          textActionGroups={textActionGroups}
          currentTextId={currentTextId}
          showAttachMenu={showAttachMenu}
          expandedCategories={expandedCategories}
          onInputChange={setInputValue}
          onSendMessage={sendMessage}
          onToggleAttachMenu={() => setShowAttachMenu(!showAttachMenu)}
          onToggleCategoryExpanded={toggleCategoryExpanded}
          onRemoveMention={removeMention}
          onRemoveActionFromGroup={removeActionFromGroup}
          onSelectTextGroup={selectTextGroup}
          onAddActionToMentions={addActionToMentions}
          onUpdateGroupCustomInstruction={updateGroupCustomInstruction}
          onUpdateActionCustomInstruction={updateActionCustomInstruction}
        />
      </div>
      
      {/* 底部状态栏 */}
      <StatusBar
        currentPage={1}
        totalPages={3}
        wordCount={wordCount}
        charCount={charCount}
        language="中文"
        viewMode={viewMode}
        zoomLevel={zoomLevel}
        onViewModeChange={setViewMode}
        onZoomChange={setZoomLevel}
        showOriginal={showOriginal}
        saveStatus={saveStatus}
      />
      
      {/* 浮动按钮 - 添加到聊天 */}
      {showFloatingButton && (
        <div
          className="fixed z-50 animate-fade-in"
          style={{
            left: `${floatingButtonPosition.x}px`,
            top: `${floatingButtonPosition.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <Button
            size="sm"
            onClick={addSelectedTextToMentions}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <AtSign className="h-3 w-3 mr-1" />
            添加到聊天
          </Button>
        </div>
      )}
      
      {/* 添加高亮动画样式 */}
      <style jsx global>{`
        /* 禁止非编辑器区域的文本选择 */
        * {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        /* 只允许编辑器内容可选择 */
        .editor-content,
        .editor-content *,
        .editor-text-area,
        .editor-text-area *,
        .ProseMirror,
        .ProseMirror * {
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }
        
        /* 输入框和文本区域也应该可选择 */
        input,
        textarea {
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }
        
        /* 自定义滚动条样式 */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 6px;
          margin: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 6px;
          border: 2px solid #f1f5f9;
          background-clip: padding-box;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
          border: 2px solid #f1f5f9;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:active {
          background: #64748b;
          border: 2px solid #f1f5f9;
        }
        
        /* 为编辑器区域的滚动条添加特殊样式 */
        .editor-content::-webkit-scrollbar,
        .ProseMirror::-webkit-scrollbar {
          width: 10px;
        }
        
        .editor-content::-webkit-scrollbar-track,
        .ProseMirror::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .editor-content::-webkit-scrollbar-thumb,
        .ProseMirror::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 6px;
        }
        
        /* 淡入动画 */
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        /* 选中文本高亮 - 只在编辑器内有效 */
        .editor-content ::selection,
        .editor-text-area ::selection,
        .ProseMirror ::selection {
          background-color: #fef3c7;
          color: #000;
        }
        
        .editor-content ::-moz-selection,
        .editor-text-area ::-moz-selection,
        .ProseMirror ::-moz-selection {
          background-color: #fef3c7;
          color: #000;
        }
        
        /* 高亮动画 */
        @keyframes highlight {
          0% {
            background-color: transparent;
          }
          50% {
            background-color: rgb(254 240 138);
          }
          100% {
            background-color: rgb(254 240 138);
          }
        }
        
        .animate-highlight {
          animation: highlight 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}