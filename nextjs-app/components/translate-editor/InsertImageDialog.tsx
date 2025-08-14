"use client"

import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Link, Image as ImageIcon } from 'lucide-react'

interface InsertImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (imageUrl: string, alt?: string) => void
}

export const InsertImageDialog: React.FC<InsertImageDialogProps> = ({
  open,
  onOpenChange,
  onInsert,
}) => {
  const [imageUrl, setImageUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件')
        return
      }

      // 检查文件大小（限制为5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB')
        return
      }

      // 创建预览URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setPreviewUrl(dataUrl)
        setImageUrl(dataUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUrlChange = (url: string) => {
    setImageUrl(url)
    // 简单验证URL格式
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))) {
      setPreviewUrl(url)
    } else {
      setPreviewUrl('')
    }
  }

  const handleInsert = () => {
    if (imageUrl) {
      onInsert(imageUrl, altText || '图片')
      // 重置状态
      setImageUrl('')
      setAltText('')
      setPreviewUrl('')
      onOpenChange(false)
    }
  }

  const handleClose = () => {
    setImageUrl('')
    setAltText('')
    setPreviewUrl('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>插入图片</DialogTitle>
          <DialogDescription>
            从本地上传图片或输入图片URL
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              上传图片
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link className="h-4 w-4 mr-2" />
              图片链接
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label>选择图片文件</Label>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  选择图片
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                支持 JPG、PNG、GIF、WebP 格式，最大 5MB
              </p>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">图片URL</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* 替代文本输入 */}
        <div className="space-y-2">
          <Label htmlFor="alt-text">替代文本（可选）</Label>
          <Input
            id="alt-text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="描述图片内容，用于辅助功能"
          />
        </div>

        {/* 图片预览 */}
        {previewUrl && (
          <div className="space-y-2">
            <Label>预览</Label>
            <div className="border rounded-lg p-4 bg-gray-50">
              <img
                src={previewUrl}
                alt={altText || '预览'}
                className="max-w-full h-auto max-h-[200px] mx-auto"
                onError={() => {
                  setPreviewUrl('')
                  alert('无法加载图片，请检查URL是否正确')
                }}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleInsert} disabled={!imageUrl}>
            <ImageIcon className="h-4 w-4 mr-2" />
            插入图片
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InsertImageDialog
