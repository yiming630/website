"use client"

import { FileText, Eye, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface StatusBarProps {
  /** 当前页码 */
  currentPage?: number
  /** 总页数 */
  totalPages?: number
  /** 总字数 */
  wordCount?: number
  /** 字符数 */
  charCount?: number
  /** 当前语言 */
  language?: string
  /** 视图模式 */
  viewMode?: 'edit' | 'read' | 'preview'
  /** 缩放级别（百分比） */
  zoomLevel?: number
  /** 视图模式改变回调 */
  onViewModeChange?: (mode: 'edit' | 'read' | 'preview') => void
  /** 缩放级别改变回调 */
  onZoomChange?: (level: number) => void
  /** 是否显示原文对照 */
  showOriginal?: boolean
  /** 保存状态 */
  saveStatus?: 'saved' | 'saving' | 'unsaved'
}

export function StatusBar({
  currentPage = 1,
  totalPages = 1,
  wordCount = 0,
  charCount = 0,
  language = "中文",
  viewMode = 'edit',
  zoomLevel = 100,
  onViewModeChange,
  onZoomChange,
  showOriginal = false,
  saveStatus = 'saved',
}: StatusBarProps) {
  // 预设的缩放级别
  const zoomPresets = [50, 75, 100, 125, 150, 200]

  return (
    <div className="bg-gray-100 border-t border-gray-200 px-4 py-1 flex items-center justify-between text-sm">
      {/* 左侧信息 */}
      <div className="flex items-center gap-4">
        {/* 页面信息 */}
        <div className="flex items-center gap-1 text-gray-600">
          <FileText className="h-4 w-4" />
          <span>第 {currentPage} 页，共 {totalPages} 页</span>
        </div>
        
        <div className="h-4 w-px bg-gray-300" />
        
        {/* 字数统计 */}
        <div className="text-gray-600">
          <span>字数：{wordCount.toLocaleString()}</span>
          <span className="mx-2">|</span>
          <span>字符：{charCount.toLocaleString()}</span>
        </div>
        
        <div className="h-4 w-px bg-gray-300" />
        
        {/* 语言信息 */}
        <div className="text-gray-600">
          语言：{language}
        </div>
        
        {/* 保存状态 */}
        {saveStatus !== 'saved' && (
          <>
            <div className="h-4 w-px bg-gray-300" />
            <div className={cn(
              "text-sm",
              saveStatus === 'saving' ? "text-blue-600" : "text-orange-600"
            )}>
              {saveStatus === 'saving' ? '正在保存...' : '未保存'}
            </div>
          </>
        )}
        
        {/* 原文对照状态 */}
        {showOriginal && (
          <>
            <div className="h-4 w-px bg-gray-300" />
            <div className="text-blue-600 flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>原文对照模式</span>
            </div>
          </>
        )}
      </div>
      
      {/* 右侧控件 */}
      <div className="flex items-center gap-4">
        {/* 视图模式切换 */}
        {onViewModeChange && (
          <>
            <Select value={viewMode} onValueChange={(value) => onViewModeChange(value as any)}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="edit">编辑模式</SelectItem>
                <SelectItem value="read">阅读模式</SelectItem>
                <SelectItem value="preview">预览模式</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="h-4 w-px bg-gray-300" />
          </>
        )}
        
        {/* 缩放控制 */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onZoomChange?.(Math.max(50, zoomLevel - 10))}
            disabled={zoomLevel <= 50}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 min-w-[180px]">
            <Slider
              value={[zoomLevel]}
              onValueChange={([value]) => onZoomChange?.(value)}
              min={50}
              max={200}
              step={5}
              className="w-24"
            />
            
            <Select 
              value={zoomLevel.toString()} 
              onValueChange={(value) => onZoomChange?.(parseInt(value))}
            >
              <SelectTrigger className="w-20 h-7 text-xs">
                <SelectValue>{zoomLevel}%</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {zoomPresets.map(preset => (
                  <SelectItem key={preset} value={preset.toString()}>
                    {preset}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onZoomChange?.(Math.min(200, zoomLevel + 10))}
            disabled={zoomLevel >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 