import { useState, useEffect } from 'react'

export const useTextSelection = (onTextSelected?: (text: string) => void, editorSelector: string = '.editor-content') => {
  const [selectedText, setSelectedText] = useState<string>('')
  const [showFloatingButton, setShowFloatingButton] = useState(false)
  const [floatingButtonPosition, setFloatingButtonPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      const text = selection?.toString().trim()
      
      if (text && text.length > 0) {
        // 检查选中的文本是否在编辑器内
        const range = selection?.getRangeAt(0)
        if (range) {
          const container = range.commonAncestorContainer
          const element = container.nodeType === Node.TEXT_NODE 
            ? container.parentElement 
            : container as HTMLElement
          
          // 检查是否在编辑器内部
          const isInEditor = element?.closest(editorSelector)
          
          if (isInEditor) {
            setSelectedText(text)
            
            // 获取选中文本的位置
            const rect = range.getBoundingClientRect()
            if (rect) {
              setFloatingButtonPosition({
                x: rect.left + rect.width / 2,
                y: rect.bottom + 10
              })
              setShowFloatingButton(true)
            }
            
            if (onTextSelected) {
              onTextSelected(text)
            }
          } else {
            // 如果不在编辑器内，隐藏浮动按钮
            setShowFloatingButton(false)
          }
        }
      } else {
        setShowFloatingButton(false)
      }
    }

    document.addEventListener('selectionchange', handleSelection)
    document.addEventListener('mouseup', handleSelection)
    
    return () => {
      document.removeEventListener('selectionchange', handleSelection)
      document.removeEventListener('mouseup', handleSelection)
    }
  }, [onTextSelected, editorSelector])

  const clearSelection = () => {
    setShowFloatingButton(false)
    // 不清除选择，保持黄色高亮
    // window.getSelection()?.removeAllRanges()
  }
  
  const hideFloatingButton = () => {
    setShowFloatingButton(false)
  }

  return {
    selectedText,
    showFloatingButton,
    floatingButtonPosition,
    clearSelection,
    hideFloatingButton,
  }
}