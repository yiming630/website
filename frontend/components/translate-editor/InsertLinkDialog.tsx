"use client"

import React, { useState, useEffect } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Link, ExternalLink, Mail, Phone, Hash } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface InsertLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (url: string, text: string, openInNewTab: boolean) => void
  selectedText?: string
}

export const InsertLinkDialog: React.FC<InsertLinkDialogProps> = ({
  open,
  onOpenChange,
  onInsert,
  selectedText = '',
}) => {
  const [linkType, setLinkType] = useState<'url' | 'email' | 'phone' | 'anchor'>('url')
  const [url, setUrl] = useState('')
  const [text, setText] = useState(selectedText)
  const [openInNewTab, setOpenInNewTab] = useState(true)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [anchor, setAnchor] = useState('')

  useEffect(() => {
    setText(selectedText)
  }, [selectedText])

  const handleInsert = () => {
    let finalUrl = ''
    let finalText = text

    switch (linkType) {
      case 'url':
        finalUrl = url
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
          finalUrl = 'https://' + finalUrl
        }
        break
      case 'email':
        finalUrl = `mailto:${email}`
        finalText = finalText || email
        break
      case 'phone':
        finalUrl = `tel:${phone}`
        finalText = finalText || phone
        break
      case 'anchor':
        finalUrl = `#${anchor}`
        finalText = finalText || anchor
        break
    }

    if (finalUrl && finalText) {
      onInsert(finalUrl, finalText, openInNewTab)
      // 重置状态
      setUrl('')
      setText('')
      setEmail('')
      setPhone('')
      setAnchor('')
      setLinkType('url')
      onOpenChange(false)
    }
  }

  const isValid = () => {
    switch (linkType) {
      case 'url':
        return url && text
      case 'email':
        return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      case 'phone':
        return phone
      case 'anchor':
        return anchor
      default:
        return false
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>插入链接</DialogTitle>
          <DialogDescription>
            添加网页链接、邮箱、电话或锚点链接
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 链接类型选择 */}
          <div className="space-y-2">
            <Label>链接类型</Label>
            <RadioGroup value={linkType} onValueChange={(value: any) => setLinkType(value)}>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="url" id="type-url" />
                  <Label htmlFor="type-url" className="flex items-center gap-2 cursor-pointer">
                    <ExternalLink className="h-4 w-4" />
                    网页链接
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="type-email" />
                  <Label htmlFor="type-email" className="flex items-center gap-2 cursor-pointer">
                    <Mail className="h-4 w-4" />
                    邮箱
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="phone" id="type-phone" />
                  <Label htmlFor="type-phone" className="flex items-center gap-2 cursor-pointer">
                    <Phone className="h-4 w-4" />
                    电话
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="anchor" id="type-anchor" />
                  <Label htmlFor="type-anchor" className="flex items-center gap-2 cursor-pointer">
                    <Hash className="h-4 w-4" />
                    锚点
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* 根据类型显示不同的输入 */}
          {linkType === 'url' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="url">网址</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  type="url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link-text">显示文本</Label>
                <Input
                  id="link-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="链接文字"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="new-tab" className="flex items-center gap-2">
                  在新标签页中打开
                </Label>
                <Switch
                  id="new-tab"
                  checked={openInNewTab}
                  onCheckedChange={setOpenInNewTab}
                />
              </div>
            </>
          )}

          {linkType === 'email' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-text">显示文本（可选）</Label>
                <Input
                  id="email-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="留空则显示邮箱地址"
                />
              </div>
            </>
          )}

          {linkType === 'phone' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">电话号码</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+86 138 0000 0000"
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone-text">显示文本（可选）</Label>
                <Input
                  id="phone-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="留空则显示电话号码"
                />
              </div>
            </>
          )}

          {linkType === 'anchor' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="anchor">锚点名称</Label>
                <Input
                  id="anchor"
                  value={anchor}
                  onChange={(e) => setAnchor(e.target.value)}
                  placeholder="section-1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anchor-text">显示文本（可选）</Label>
                <Input
                  id="anchor-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="留空则显示锚点名称"
                />
              </div>
            </>
          )}

          {/* 预览 */}
          {isValid() && (
            <div className="space-y-2">
              <Label>预览</Label>
              <div className="border rounded-lg p-3 bg-gray-50">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  {text || email || phone || anchor}
                  {linkType === 'url' && openInNewTab && (
                    <ExternalLink className="h-3 w-3" />
                  )}
                </a>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleInsert} disabled={!isValid()}>
            <Link className="h-4 w-4 mr-2" />
            插入链接
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default InsertLinkDialog
