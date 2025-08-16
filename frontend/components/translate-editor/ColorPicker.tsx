"use client"

import React, { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronDown, Palette, Highlighter, RotateCcw } from 'lucide-react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  type?: 'text' | 'background'
  disabled?: boolean
}

// 预定义的颜色
const presetColors = {
  text: [
    '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC',
    '#DC143C', '#FF0000', '#FF6900', '#FCB900', '#00D084', '#0693E3',
    '#0062CC', '#002C5F', '#5300EB', '#8E44AD', '#C0392B', '#E74C3C',
  ],
  background: [
    'transparent', '#FFFFFF', '#FFF9E6', '#FFF2CC', '#FFE6CC', '#FFD9D9',
    '#FFE6F2', '#F2E6FF', '#E6E6FF', '#E6F2FF', '#E6FFFF', '#E6FFF2',
    '#E6FFE6', '#F2FFE6', '#FFFFE6', '#FFF2E6', '#FFEBD2', '#FFE0B2',
  ],
}

// 最近使用的颜色存储键
const RECENT_COLORS_KEY = 'editor_recent_colors'

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  type = 'text',
  disabled = false,
}) => {
  const [customColor, setCustomColor] = useState(value)
  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${RECENT_COLORS_KEY}_${type}`)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const icon = type === 'text' ? Palette : Highlighter
  const Icon = icon
  const title = type === 'text' ? '文字颜色' : '背景高亮'
  const colors = presetColors[type]

  const handleColorSelect = (color: string) => {
    onChange(color)
    
    // 更新最近使用的颜色
    const updated = [color, ...recentColors.filter(c => c !== color)].slice(0, 8)
    setRecentColors(updated)
    localStorage.setItem(`${RECENT_COLORS_KEY}_${type}`, JSON.stringify(updated))
  }

  const handleCustomColorChange = () => {
    if (customColor && /^#[0-9A-Fa-f]{6}$/.test(customColor)) {
      handleColorSelect(customColor)
    }
  }

  const handleReset = () => {
    const defaultColor = type === 'text' ? '#000000' : 'transparent'
    handleColorSelect(defaultColor)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-1"
          disabled={disabled}
          title={title}
        >
          <Icon className="h-4 w-4" />
          <div
            className="w-4 h-3 ml-1 border border-gray-300 rounded"
            style={{ 
              backgroundColor: value === 'transparent' ? 'white' : value,
              backgroundImage: value === 'transparent' 
                ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                : undefined,
              backgroundSize: value === 'transparent' ? '8px 8px' : undefined,
              backgroundPosition: value === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
            }}
          />
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3">
        <Tabs defaultValue="preset" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preset">预设颜色</TabsTrigger>
            <TabsTrigger value="custom">自定义</TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="space-y-3">
            {/* 最近使用 */}
            {recentColors.length > 0 && (
              <div>
                <Label className="text-xs text-gray-600">最近使用</Label>
                <div className="grid grid-cols-8 gap-1 mt-1">
                  {recentColors.map((color, index) => (
                    <button
                      key={index}
                      className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                      style={{ 
                        backgroundColor: color === 'transparent' ? 'white' : color,
                        backgroundImage: color === 'transparent' 
                          ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                          : undefined,
                        backgroundSize: color === 'transparent' ? '8px 8px' : undefined,
                      }}
                      onClick={() => handleColorSelect(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 预设颜色 */}
            <div>
              <Label className="text-xs text-gray-600">预设颜色</Label>
              <div className="grid grid-cols-9 gap-1 mt-1">
                {colors.map((color, index) => (
                  <button
                    key={index}
                    className={`w-8 h-8 rounded border-2 hover:border-gray-400 transition-colors ${
                      value === color ? 'border-blue-500' : 'border-gray-200'
                    }`}
                    style={{ 
                      backgroundColor: color === 'transparent' ? 'white' : color,
                      backgroundImage: color === 'transparent' 
                        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                        : undefined,
                      backgroundSize: color === 'transparent' ? '8px 8px' : undefined,
                    }}
                    onClick={() => handleColorSelect(color)}
                    title={color === 'transparent' ? '无颜色' : color}
                  />
                ))}
              </div>
            </div>

            {/* 重置按钮 */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleReset}
            >
              <RotateCcw className="h-3 w-3 mr-2" />
              重置为默认
            </Button>
          </TabsContent>

          <TabsContent value="custom" className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="custom-color">自定义颜色</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-color"
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleCustomColorChange}
                  disabled={!customColor || !/^#[0-9A-Fa-f]{6}$/.test(customColor)}
                >
                  应用
                </Button>
              </div>
            </div>

            {/* 颜色预览 */}
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-gray-600 mb-2">预览</div>
              {type === 'text' ? (
                <div style={{ color: customColor }}>
                  这是示例文本 ABC 123
                </div>
              ) : (
                <div style={{ backgroundColor: customColor, padding: '4px 8px', borderRadius: '4px' }}>
                  这是高亮示例文本
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

export default ColorPicker
