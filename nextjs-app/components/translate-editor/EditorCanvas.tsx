"use client"

import React, { useEffect, useImperativeHandle, forwardRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { FontFamily } from '@tiptap/extension-font-family'
import { FontSize, LineHeight } from '@/lib/tiptap-extensions'
import { cn } from '@/lib/utils'

export interface EditorCanvasProps {
  content: string
  onChange: (content: string) => void
  className?: string
  onClick?: () => void
  // 格式状态
  formatState?: {
    isBold: boolean
    isItalic: boolean
    isUnderline: boolean
    isStrikethrough: boolean
    textColor: string
    backgroundColor: string
    fontSize: string
    fontFamily: string
    alignment: 'left' | 'center' | 'right' | 'justify'
    isBulletList: boolean
    isNumberedList: boolean
    lineHeight: string
  }
  onFormatStateChange?: (state: any) => void
  // 视图设置
  zoomLevel?: number
  showLineNumbers?: boolean
  fontFamily?: string
  fontSize?: number
  lineHeight?: number
}

export interface EditorCanvasRef {
  // 格式化命令
  toggleBold: () => void
  toggleItalic: () => void
  toggleUnderline: () => void
  toggleStrike: () => void
  setTextColor: (color: string) => void
  setHighlight: (color: string) => void
  setFontSize: (size: string) => void
  setFontFamily: (family: string) => void
  setTextAlign: (align: 'left' | 'center' | 'right' | 'justify') => void
  toggleBulletList: () => void
  toggleOrderedList: () => void
  indent: () => void
  outdent: () => void
  setLineHeight: (height: string) => void
  insertTable: () => void
  insertImage: (src: string) => void
  insertLink: (url: string) => void
  // 历史记录
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  // 编辑操作
  cut: () => void
  copy: () => void
  paste: () => void
  selectAll: () => void
  // 查找替换
  find: (searchText: string, options?: any) => number
  findAndReplace: (searchText: string, replaceText: string, replaceAll?: boolean) => void
  clearHighlights: () => void
  // 获取编辑器实例
  getEditor: () => any
  getContent: () => string
  getHTML: () => string
}

/**
 * EditorCanvas - 编辑器核心画布组件
 * 使用TipTap作为富文本编辑器的基础
 */
export const EditorCanvas = forwardRef<EditorCanvasRef, EditorCanvasProps>(
  ({ 
    content, 
    onChange, 
    className, 
    formatState, 
    onFormatStateChange, 
    onClick,
    zoomLevel = 100,
    showLineNumbers = false,
    fontFamily: customFontFamily,
    fontSize: customFontSize,
    lineHeight: customLineHeight
  }, ref) => {
    // 初始化TipTap编辑器
    const editor = useEditor({
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: 'prose prose-lg max-w-none p-8 min-h-[calc(130vh-364px)] overflow-y-auto focus:outline-none editor-text-area scrollbar-thin',
        },
      },
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3, 4, 5, 6],
          },
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        TextStyle,
        Color,
        Highlight.configure({
          multicolor: true,
        }),
        FontFamily.configure({
          types: ['textStyle'],
        }),
        FontSize,
        LineHeight,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-600 underline hover:text-blue-800',
          },
        }),
        Image.configure({
          HTMLAttributes: {
            class: 'max-w-full h-auto rounded',
          },
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
      ],
      content,
      editorProps: {
        attributes: {
          class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[780px] px-12 py-8',
        },
      },
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML())
        updateFormatState()
      },
      onSelectionUpdate: () => {
        updateFormatState()
      },
    })

    // 更新格式状态
    const updateFormatState = () => {
      if (!editor || !onFormatStateChange) return

      const state = {
        isBold: editor.isActive('bold'),
        isItalic: editor.isActive('italic'),
        isUnderline: editor.isActive('underline'),
        isStrikethrough: editor.isActive('strike'),
        textColor: editor.getAttributes('textStyle').color || '#000000',
        backgroundColor: editor.getAttributes('highlight').color || '#FFFFFF',
        fontSize: '12', // TipTap默认不跟踪字号，需要自定义扩展
        fontFamily: 'default', // TipTap默认不跟踪字体，需要自定义扩展
        alignment: (
          editor.isActive({ textAlign: 'left' }) ? 'left' :
          editor.isActive({ textAlign: 'center' }) ? 'center' :
          editor.isActive({ textAlign: 'right' }) ? 'right' :
          editor.isActive({ textAlign: 'justify' }) ? 'justify' : 'left'
        ) as 'left' | 'center' | 'right' | 'justify',
        isBulletList: editor.isActive('bulletList'),
        isNumberedList: editor.isActive('orderedList'),
        lineHeight: '1.5', // 需要自定义扩展来支持行高
      }

      onFormatStateChange(state)
    }

    // 暴露编辑器方法给父组件
    useImperativeHandle(ref, () => ({
      toggleBold: () => editor?.chain().focus().toggleBold().run(),
      toggleItalic: () => editor?.chain().focus().toggleItalic().run(),
      toggleUnderline: () => editor?.chain().focus().toggleUnderline().run(),
      toggleStrike: () => editor?.chain().focus().toggleStrike().run(),
      setTextColor: (color: string) => editor?.chain().focus().setColor(color).run(),
      setHighlight: (color: string) => {
        if (color === '#FFFFFF' || color === 'transparent') {
          editor?.chain().focus().unsetHighlight().run()
        } else {
          editor?.chain().focus().toggleHighlight({ color }).run()
        }
      },
      setFontSize: (size: string) => {
        if (size === 'default') {
          editor?.chain().focus().unsetFontSize().run()
        } else {
          editor?.chain().focus().setFontSize(`${size}pt`).run()
        }
      },
      setFontFamily: (family: string) => {
        if (family === 'default') {
          editor?.chain().focus().unsetFontFamily().run()
        } else {
          editor?.chain().focus().setFontFamily(family).run()
        }
      },
      setTextAlign: (align: 'left' | 'center' | 'right' | 'justify') => {
        editor?.chain().focus().setTextAlign(align).run()
      },
      toggleBulletList: () => editor?.chain().focus().toggleBulletList().run(),
      toggleOrderedList: () => editor?.chain().focus().toggleOrderedList().run(),
      indent: () => {
        // TipTap不直接支持缩进，需要自定义扩展
        // 这里可以通过增加嵌套列表级别来模拟
        editor?.chain().focus().sinkListItem('listItem').run()
      },
      outdent: () => {
        // TipTap不直接支持缩进，需要自定义扩展
        // 这里可以通过减少嵌套列表级别来模拟
        editor?.chain().focus().liftListItem('listItem').run()
      },
      setLineHeight: (height: string) => {
        if (height === 'default') {
          editor?.chain().focus().unsetLineHeight().run()
        } else {
          editor?.chain().focus().setLineHeight(height).run()
        }
      },
      insertTable: () => {
        editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
      },
      insertImage: (src: string) => {
        editor?.chain().focus().setImage({ src }).run()
      },
      insertLink: (url: string) => {
        editor?.chain().focus().setLink({ href: url }).run()
      },
      undo: () => editor?.chain().focus().undo().run(),
      redo: () => editor?.chain().focus().redo().run(),
      canUndo: () => editor?.can().undo() || false,
      canRedo: () => editor?.can().redo() || false,
      // 编辑操作
      cut: () => {
        if (editor) {
          const selection = editor.state.selection
          const selectedText = editor.state.doc.textBetween(selection.from, selection.to)
          if (selectedText) {
            navigator.clipboard.writeText(selectedText)
            editor.chain().focus().deleteSelection().run()
          }
        }
      },
      copy: () => {
        if (editor) {
          const selection = editor.state.selection
          const selectedText = editor.state.doc.textBetween(selection.from, selection.to)
          if (selectedText) {
            navigator.clipboard.writeText(selectedText)
          }
        }
      },
      paste: async () => {
        if (editor) {
          try {
            const text = await navigator.clipboard.readText()
            editor.chain().focus().insertContent(text).run()
          } catch (error) {
            console.error('粘贴失败:', error)
          }
        }
      },
      selectAll: () => editor?.chain().focus().selectAll().run(),
      // 查找替换
      find: (searchText: string, options?: any) => {
        if (!editor || !searchText) return 0
        
        const content = editor.getText()
        let regex: RegExp
        
        try {
          const flags = options?.caseSensitive ? 'g' : 'gi'
          if (options?.useRegex) {
            regex = new RegExp(searchText, flags)
          } else {
            const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const pattern = options?.wholeWord ? `\\b${escapedText}\\b` : escapedText
            regex = new RegExp(pattern, flags)
          }
          
          const matches = content.match(regex)
          
          // 高亮匹配的文本
          if (matches && matches.length > 0) {
            // 这里可以添加高亮逻辑
            // 暂时使用 mark 标签来高亮
            const firstMatch = content.search(regex)
            if (firstMatch >= 0) {
              editor.chain()
                .focus()
                .setTextSelection({ from: firstMatch + 1, to: firstMatch + searchText.length + 1 })
                .run()
            }
          }
          
          return matches ? matches.length : 0
        } catch (error) {
          console.error('查找错误:', error)
          return 0
        }
      },
      findAndReplace: (searchText: string, replaceText: string, replaceAll: boolean = false) => {
        if (!editor || !searchText) return
        
        const content = editor.getHTML()
        let newContent = content
        
        if (replaceAll) {
          // 全部替换
          const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
          newContent = content.replace(regex, replaceText)
        } else {
          // 替换第一个匹配
          const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
          newContent = content.replace(regex, replaceText)
        }
        
        if (newContent !== content) {
          editor.chain().focus().setContent(newContent).run()
        }
      },
      clearHighlights: () => {
        // 清除所有高亮
        if (editor) {
          editor.chain().focus().unsetHighlight().run()
        }
      },
      getEditor: () => editor,
      getContent: () => editor?.getText() || '',
      getHTML: () => editor?.getHTML() || '',
    }), [editor])

    // 应用格式状态变化
    useEffect(() => {
      if (!editor || !formatState) return

      // 这里可以根据formatState的变化来更新编辑器
      // 但要注意避免无限循环
    }, [formatState, editor])

    // 计算缩放样式
    const zoomStyles = {
      transform: `scale(${zoomLevel / 100})`,
      transformOrigin: 'top center',
      width: `${100 / (zoomLevel / 100)}%`,
    }

    // 编辑器自定义样式
    const editorStyles = {
      fontSize: customFontSize ? `${customFontSize}px` : undefined,
      fontFamily: customFontFamily || undefined,
      lineHeight: customLineHeight || undefined,
    }

    return (
      <div className={cn('editor-canvas', className)}>
        <div className="flex justify-center">
          <div 
            className="bg-white shadow-lg rounded-lg overflow-hidden transition-transform duration-200" 
            style={{ 
              ...zoomStyles,
              maxWidth: '816px',
            }}
          >
            {/* 纸张效果 */}
            <div className="bg-gradient-to-b from-gray-50 to-white">
              <div className="flex">
                {/* 行号区域 */}
                {showLineNumbers && (
                  <div className="bg-gray-50 border-r border-gray-200 px-2 py-8 select-none">
                    <div className="text-gray-400 text-xs font-mono">
                      {Array.from({ length: 50 }, (_, i) => (
                        <div key={i} className="h-6 leading-6">
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 编辑器内容 */}
                <div className="flex-1" style={editorStyles}>
                  <EditorContent 
                    editor={editor} 
                    className="relative editor-content"
                    onClick={onClick}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

EditorCanvas.displayName = 'EditorCanvas'

export default EditorCanvas 