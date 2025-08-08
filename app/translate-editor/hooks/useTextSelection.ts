import { useState, useEffect } from 'react'

export const useTextSelection = (onTextSelected?: (text: string) => void) => {
  const [selectedText, setSelectedText] = useState<string>('')
  const [showFloatingButton, setShowFloatingButton] = useState(false)
  const [floatingButtonPosition, setFloatingButtonPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      const text = selection?.toString().trim()
      
      if (text && text.length > 0) {
        setSelectedText(text)
        
        // 获取选中文本的位置
        const range = selection?.getRangeAt(0)
        const rect = range?.getBoundingClientRect()
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
        setShowFloatingButton(false)
      }
    }

    document.addEventListener('selectionchange', handleSelection)
    document.addEventListener('mouseup', handleSelection)
    
    return () => {
      document.removeEventListener('selectionchange', handleSelection)
      document.removeEventListener('mouseup', handleSelection)
    }
  }, [onTextSelected])

  const clearSelection = () => {
    setShowFloatingButton(false)
    window.getSelection()?.removeAllRanges()
  }

  return {
    selectedText,
    showFloatingButton,
    floatingButtonPosition,
    clearSelection,
  }
}