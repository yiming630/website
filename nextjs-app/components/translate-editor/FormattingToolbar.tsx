"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Toggle } from '@/components/ui/toggle'
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Minus,
  Palette,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Table,
  Image,
  Link,
  ChevronDown,
  Plus,
} from 'lucide-react'

interface FormattingToolbarProps {
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  // 文本格式状态
  isBold?: boolean
  isItalic?: boolean
  isUnderline?: boolean
  isStrikethrough?: boolean
  textColor?: string
  backgroundColor?: string
  fontSize?: string
  fontFamily?: string
  // 段落格式状态
  alignment?: 'left' | 'center' | 'right' | 'justify'
  isBulletList?: boolean
  isNumberedList?: boolean
  lineHeight?: string
  // 格式化操作
  onBold: () => void
  onItalic: () => void
  onUnderline: () => void
  onStrikethrough: () => void
  onTextColor: (color: string) => void
  onBackgroundColor: (color: string) => void
  onFontSize: (size: string) => void
  onFontFamily: (family: string) => void
  onAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => void
  onBulletList: () => void
  onNumberedList: () => void
  onIndent: () => void
  onOutdent: () => void
  onLineHeight: (height: string) => void
  onInsertTable: () => void
  onInsertImage: () => void
  onInsertLink: () => void
}

// 预定义的颜色选项
const colorOptions = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
  '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
  '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
  '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
]

// 字体选项
const fontFamilies = [
  { value: 'default', label: '默认字体' },
  { value: 'serif', label: '衬线字体' },
  { value: 'sans-serif', label: '无衬线字体' },
  { value: 'monospace', label: '等宽字体' },
  { value: 'SimSun', label: '宋体' },
  { value: 'SimHei', label: '黑体' },
  { value: 'Microsoft YaHei', label: '微软雅黑' },
  { value: 'KaiTi', label: '楷体' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
]

// 字号选项
const fontSizes = [
  { value: '8', label: '8' },
  { value: '9', label: '9' },
  { value: '10', label: '10' },
  { value: '11', label: '11' },
  { value: '12', label: '12' },
  { value: '14', label: '14' },
  { value: '16', label: '16' },
  { value: '18', label: '18' },
  { value: '20', label: '20' },
  { value: '22', label: '22' },
  { value: '24', label: '24' },
  { value: '26', label: '26' },
  { value: '28', label: '28' },
  { value: '36', label: '36' },
  { value: '48', label: '48' },
  { value: '72', label: '72' },
]

// 行高选项
const lineHeights = [
  { value: '1', label: '1.0' },
  { value: '1.15', label: '1.15' },
  { value: '1.5', label: '1.5' },
  { value: '2', label: '2.0' },
  { value: '2.5', label: '2.5' },
  { value: '3', label: '3.0' },
]

/**
 * ColorPicker - 颜色选择器组件
 */
const ColorPicker: React.FC<{
  color?: string
  onChange: (color: string) => void
  icon: React.ElementType
  title: string
}> = ({ color = '#000000', onChange, icon: Icon, title }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2" title={title}>
          <Icon className="h-3.5 w-3.5" />
          <div
            className="w-4 h-1 ml-1 border border-gray-300"
            style={{ backgroundColor: color }}
          />
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="grid grid-cols-10 gap-1">
          {colorOptions.map((c) => (
            <button
              key={c}
              className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
              onClick={() => onChange(c)}
              title={c}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * FormattingToolbar - 格式化工具栏组件
 */
export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isBold,
  isItalic,
  isUnderline,
  isStrikethrough,
  textColor,
  backgroundColor,
  fontSize = '12',
  fontFamily = 'default',
  alignment = 'left',
  isBulletList,
  isNumberedList,
  lineHeight = '1.5',
  onBold,
  onItalic,
  onUnderline,
  onStrikethrough,
  onTextColor,
  onBackgroundColor,
  onFontSize,
  onFontFamily,
  onAlign,
  onBulletList,
  onNumberedList,
  onIndent,
  onOutdent,
  onLineHeight,
  onInsertTable,
  onInsertImage,
  onInsertLink,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-0.5">
      <div className="flex items-center gap-1 flex-wrap">
        {/* 历史记录组 */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-7 w-8 p-0"
            title="撤销 (Ctrl+Z)"
          >
            <Undo className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-7 w-8 p-0"
            title="重做 (Ctrl+Y)"
          >
            <Redo className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* 字体选择 */}
        <Select value={fontFamily} onValueChange={onFontFamily}>
          <SelectTrigger className="h-7 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontFamilies.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.value }}>{font.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 字号选择 */}
        <Select value={fontSize} onValueChange={onFontSize}>
          <SelectTrigger className="h-7 w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontSizes.map((size) => (
              <SelectItem key={size.value} value={size.value}>
                {size.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6" />

        {/* 文本样式组 */}
        <div className="flex items-center gap-1">
          <Toggle
            size="sm"
            pressed={isBold}
            onPressedChange={onBold}
            className="h-7 w-8 p-0"
            title="加粗 (Ctrl+B)"
          >
            <Bold className="h-3.5 w-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={isItalic}
            onPressedChange={onItalic}
            className="h-7 w-8 p-0"
            title="斜体 (Ctrl+I)"
          >
            <Italic className="h-3.5 w-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={isUnderline}
            onPressedChange={onUnderline}
            className="h-7 w-8 p-0"
            title="下划线 (Ctrl+U)"
          >
            <Underline className="h-3.5 w-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={isStrikethrough}
            onPressedChange={onStrikethrough}
            className="h-7 w-8 p-0"
            title="删除线"
          >
            <Minus className="h-3.5 w-3.5" />
          </Toggle>
          
          {/* 文字颜色 */}
          <ColorPicker
            color={textColor}
            onChange={onTextColor}
            icon={Palette}
            title="文字颜色"
          />
          
          {/* 背景颜色 */}
          <ColorPicker
            color={backgroundColor}
            onChange={onBackgroundColor}
            icon={Highlighter}
            title="背景高亮"
          />
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* 段落格式组 */}
        <div className="flex items-center gap-1">
          {/* 对齐方式 */}
          <Toggle
            size="sm"
            pressed={alignment === 'left'}
            onPressedChange={() => onAlign('left')}
            className="h-7 w-8 p-0"
            title="左对齐"
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={alignment === 'center'}
            onPressedChange={() => onAlign('center')}
            className="h-7 w-8 p-0"
            title="居中对齐"
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={alignment === 'right'}
            onPressedChange={() => onAlign('right')}
            className="h-7 w-8 p-0"
            title="右对齐"
          >
            <AlignRight className="h-3.5 w-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={alignment === 'justify'}
            onPressedChange={() => onAlign('justify')}
            className="h-7 w-8 p-0"
            title="两端对齐"
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </Toggle>
          
          {/* 列表 */}
          <Toggle
            size="sm"
            pressed={isBulletList}
            onPressedChange={onBulletList}
            className="h-7 w-8 p-0"
            title="项目符号列表"
          >
            <List className="h-3.5 w-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={isNumberedList}
            onPressedChange={onNumberedList}
            className="h-7 w-8 p-0"
            title="编号列表"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Toggle>
          
          {/* 缩进 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOutdent}
            className="h-7 w-8 p-0"
            title="减少缩进"
          >
            <Outdent className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onIndent}
            className="h-7 w-8 p-0"
            title="增加缩进"
          >
            <Indent className="h-3.5 w-3.5" />
          </Button>
          
          {/* 行间距 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2" title="行间距">
                <AlignJustify className="h-3.5 w-3.5" />
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {lineHeights.map((height) => (
                <DropdownMenuItem
                  key={height.value}
                  onClick={() => onLineHeight(height.value)}
                >
                  {height.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* 插入工具组 */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onInsertTable}
            className="h-7 px-2"
            title="插入表格"
          >
            <Table className="h-3.5 w-3.5" />
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onInsertImage}
            className="h-7 px-2"
            title="插入图片"
          >
            <Image className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onInsertLink}
            className="h-7 px-2"
            title="插入链接"
          >
            <Link className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FormattingToolbar 