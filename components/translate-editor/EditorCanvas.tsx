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
  // 获取编辑器实例
  getEditor: () => any
}

/**
 * EditorCanvas - 编辑器核心画布组件
 * 使用TipTap作为富文本编辑器的基础
 */
export const EditorCanvas = forwardRef<EditorCanvasRef, EditorCanvasProps>(
  ({ content, onChange, className, formatState, onFormatStateChange, onClick }, ref) => {
    // 初始化TipTap编辑器
    const editor = useEditor({
      immediatelyRender: false,
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
          class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[600px] px-12 py-8',
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
        // 需要自定义扩展来支持字号
        // 这里使用CSS样式作为临时方案
        editor?.chain().focus().setMark('textStyle', { fontSize: `${size}pt` }).run()
      },
      setFontFamily: (family: string) => {
        // 需要自定义扩展来支持字体
        // 这里使用CSS样式作为临时方案
        if (family === 'default') {
          editor?.chain().focus().unsetMark('textStyle').run()
        } else {
          editor?.chain().focus().setMark('textStyle', { fontFamily: family }).run()
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
        // 需要自定义扩展来支持行高
        // 这里使用CSS样式作为临时方案
        editor?.chain().focus().setMark('textStyle', { lineHeight: height }).run()
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
      getEditor: () => editor,
    }), [editor])

    // 应用格式状态变化
    useEffect(() => {
      if (!editor || !formatState) return

      // 这里可以根据formatState的变化来更新编辑器
      // 但要注意避免无限循环
    }, [formatState, editor])

    return (
      <div className={cn('editor-canvas', className)}>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden" style={{ maxWidth: '816px', margin: '0 auto' }}>
          {/* 纸张效果 */}
          <div className="bg-gradient-to-b from-gray-50 to-white border-l-[1px] border-gray-200" style={{ marginLeft: '60px' }}>
            {/* 页边距标尺线 */}
            <div className="absolute left-0 top-0 bottom-0 w-[60px] bg-gray-50 border-r border-gray-200">
              <div className="h-full relative">
                {/* 装订孔 */}
                <div className="absolute left-6 top-20 w-2 h-2 bg-gray-400 rounded-full"></div>
                <div className="absolute left-6 top-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
                <div className="absolute left-6 bottom-20 w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
            </div>
            
            {/* 编辑器内容 */}
            <EditorContent 
              editor={editor} 
              className="relative"
              onClick={onClick}
            />
          </div>
        </div>
        

      </div>
    )
  }
)

EditorCanvas.displayName = 'EditorCanvas'

export default EditorCanvas 