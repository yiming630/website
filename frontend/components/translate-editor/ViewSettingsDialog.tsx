"use client"

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Monitor, 
  Type, 
  Layout, 
  Palette,
  MousePointer,
  Eye,
  FileText,
  Settings2
} from 'lucide-react'

export interface ViewSettings {
  // 显示设置
  zoomLevel: number
  showRuler: boolean
  showOriginal: boolean
  showStatusBar: boolean
  showLineNumbers: boolean
  showWordCount: boolean
  
  // 编辑器设置
  theme: 'light' | 'dark' | 'auto'
  fontSize: number
  lineHeight: number
  fontFamily: string
  wordWrap: boolean
  highlightCurrentLine: boolean
  
  // 布局设置
  sidebarPosition: 'left' | 'right'
  sidebarWidth: number
  editorWidth: 'fixed' | 'fluid'
  maxEditorWidth: number
}

interface ViewSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: ViewSettings
  onSettingsChange: (settings: ViewSettings) => void
}

export const ViewSettingsDialog: React.FC<ViewSettingsDialogProps> = ({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}) => {
  const [localSettings, setLocalSettings] = useState<ViewSettings>(settings)

  const handleApply = () => {
    onSettingsChange(localSettings)
    onOpenChange(false)
  }

  const handleReset = () => {
    const defaultSettings: ViewSettings = {
      zoomLevel: 100,
      showRuler: false,
      showOriginal: false,
      showStatusBar: true,
      showLineNumbers: false,
      showWordCount: true,
      theme: 'light',
      fontSize: 14,
      lineHeight: 1.5,
      fontFamily: 'default',
      wordWrap: true,
      highlightCurrentLine: true,
      sidebarPosition: 'right',
      sidebarWidth: 40,
      editorWidth: 'fixed',
      maxEditorWidth: 816,
    }
    setLocalSettings(defaultSettings)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>视图设置</DialogTitle>
          <DialogDescription>
            自定义编辑器的显示和布局设置
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="display" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="display">
              <Monitor className="h-4 w-4 mr-2" />
              显示
            </TabsTrigger>
            <TabsTrigger value="editor">
              <Type className="h-4 w-4 mr-2" />
              编辑器
            </TabsTrigger>
            <TabsTrigger value="layout">
              <Layout className="h-4 w-4 mr-2" />
              布局
            </TabsTrigger>
          </TabsList>

          {/* 显示设置 */}
          <TabsContent value="display" className="space-y-4 mt-4">
            {/* 缩放级别 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>缩放级别</Label>
                <span className="text-sm text-gray-500">{localSettings.zoomLevel}%</span>
              </div>
              <Slider
                value={[localSettings.zoomLevel]}
                onValueChange={(value) => setLocalSettings({ ...localSettings, zoomLevel: value[0] })}
                min={50}
                max={200}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>50%</span>
                <span>100%</span>
                <span>200%</span>
              </div>
            </div>

            {/* 显示选项 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-ruler" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  显示标尺
                </Label>
                <Switch
                  id="show-ruler"
                  checked={localSettings.showRuler}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, showRuler: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-original" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  显示原文对照
                </Label>
                <Switch
                  id="show-original"
                  checked={localSettings.showOriginal}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, showOriginal: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-status" className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  显示状态栏
                </Label>
                <Switch
                  id="show-status"
                  checked={localSettings.showStatusBar}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, showStatusBar: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-lines" className="flex items-center gap-2">
                  行号显示
                </Label>
                <Switch
                  id="show-lines"
                  checked={localSettings.showLineNumbers}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, showLineNumbers: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-count" className="flex items-center gap-2">
                  字数统计
                </Label>
                <Switch
                  id="show-count"
                  checked={localSettings.showWordCount}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, showWordCount: checked })}
                />
              </div>
            </div>

            {/* 主题选择 */}
            <div className="space-y-2">
              <Label>主题</Label>
              <RadioGroup
                value={localSettings.theme}
                onValueChange={(value) => setLocalSettings({ ...localSettings, theme: value as 'light' | 'dark' | 'auto' })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="theme-light" />
                  <Label htmlFor="theme-light">浅色</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  <Label htmlFor="theme-dark">深色</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="auto" id="theme-auto" />
                  <Label htmlFor="theme-auto">跟随系统</Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>

          {/* 编辑器设置 */}
          <TabsContent value="editor" className="space-y-4 mt-4">
            {/* 字体大小 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>字体大小</Label>
                <span className="text-sm text-gray-500">{localSettings.fontSize}px</span>
              </div>
              <Slider
                value={[localSettings.fontSize]}
                onValueChange={(value) => setLocalSettings({ ...localSettings, fontSize: value[0] })}
                min={10}
                max={24}
                step={1}
                className="w-full"
              />
            </div>

            {/* 行高 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>行高</Label>
                <span className="text-sm text-gray-500">{localSettings.lineHeight}</span>
              </div>
              <Slider
                value={[localSettings.lineHeight]}
                onValueChange={(value) => setLocalSettings({ ...localSettings, lineHeight: value[0] })}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* 字体选择 */}
            <div className="space-y-2">
              <Label>字体</Label>
              <Select
                value={localSettings.fontFamily}
                onValueChange={(value) => setLocalSettings({ ...localSettings, fontFamily: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">默认字体</SelectItem>
                  <SelectItem value="serif">衬线字体</SelectItem>
                  <SelectItem value="sans-serif">无衬线字体</SelectItem>
                  <SelectItem value="monospace">等宽字体</SelectItem>
                  <SelectItem value="SimSun">宋体</SelectItem>
                  <SelectItem value="SimHei">黑体</SelectItem>
                  <SelectItem value="Microsoft YaHei">微软雅黑</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 编辑器选项 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="word-wrap">自动换行</Label>
                <Switch
                  id="word-wrap"
                  checked={localSettings.wordWrap}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, wordWrap: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="highlight-line">高亮当前行</Label>
                <Switch
                  id="highlight-line"
                  checked={localSettings.highlightCurrentLine}
                  onCheckedChange={(checked) => setLocalSettings({ ...localSettings, highlightCurrentLine: checked })}
                />
              </div>
            </div>
          </TabsContent>

          {/* 布局设置 */}
          <TabsContent value="layout" className="space-y-4 mt-4">
            {/* 侧边栏位置 */}
            <div className="space-y-2">
              <Label>AI 助手位置</Label>
              <RadioGroup
                value={localSettings.sidebarPosition}
                onValueChange={(value) => setLocalSettings({ ...localSettings, sidebarPosition: value as 'left' | 'right' })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="left" id="sidebar-left" />
                  <Label htmlFor="sidebar-left">左侧</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="right" id="sidebar-right" />
                  <Label htmlFor="sidebar-right">右侧</Label>
                </div>
              </RadioGroup>
            </div>

            {/* 侧边栏宽度 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>AI 助手宽度</Label>
                <span className="text-sm text-gray-500">{localSettings.sidebarWidth}%</span>
              </div>
              <Slider
                value={[localSettings.sidebarWidth]}
                onValueChange={(value) => setLocalSettings({ ...localSettings, sidebarWidth: value[0] })}
                min={30}
                max={50}
                step={5}
                className="w-full"
              />
            </div>

            {/* 编辑器宽度模式 */}
            <div className="space-y-2">
              <Label>编辑器宽度</Label>
              <RadioGroup
                value={localSettings.editorWidth}
                onValueChange={(value) => setLocalSettings({ ...localSettings, editorWidth: value as 'fixed' | 'fluid' })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="width-fixed" />
                  <Label htmlFor="width-fixed">固定宽度</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fluid" id="width-fluid" />
                  <Label htmlFor="width-fluid">自适应宽度</Label>
                </div>
              </RadioGroup>
            </div>

            {/* 最大宽度（仅固定宽度模式） */}
            {localSettings.editorWidth === 'fixed' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>最大宽度</Label>
                  <span className="text-sm text-gray-500">{localSettings.maxEditorWidth}px</span>
                </div>
                <Slider
                  value={[localSettings.maxEditorWidth]}
                  onValueChange={(value) => setLocalSettings({ ...localSettings, maxEditorWidth: value[0] })}
                  min={600}
                  max={1200}
                  step={50}
                  className="w-full"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleReset}>
            重置默认
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleApply}>
            应用
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ViewSettingsDialog
