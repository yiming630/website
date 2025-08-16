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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FileText, FileDown, FileCode, FileType } from 'lucide-react'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (format: string, filename: string) => void
  defaultFilename?: string
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  onExport,
  defaultFilename = 'document'
}) => {
  const [format, setFormat] = useState('docx')
  const [filename, setFilename] = useState(defaultFilename)

  const handleExport = () => {
    onExport(format, filename)
    onOpenChange(false)
  }

  const formatOptions = [
    {
      value: 'docx',
      label: 'Word 文档',
      description: '(.docx) 适用于 Microsoft Word',
      icon: FileText
    },
    {
      value: 'pdf',
      label: 'PDF 文档',
      description: '便携式文档格式，适合打印和分享',
      icon: FileDown
    },
    {
      value: 'html',
      label: 'HTML 网页',
      description: '包含格式的网页文件',
      icon: FileCode
    },
    {
      value: 'txt',
      label: '纯文本',
      description: '不包含格式的纯文本文件',
      icon: FileType
    }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>导出文档</DialogTitle>
          <DialogDescription>
            选择导出格式和文件名
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* 文件名输入 */}
          <div className="space-y-2">
            <Label htmlFor="filename">文件名</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="输入文件名"
            />
          </div>

          {/* 格式选择 */}
          <div className="space-y-2">
            <Label>导出格式</Label>
            <RadioGroup value={format} onValueChange={setFormat}>
              {formatOptions.map((option) => {
                const Icon = option.icon
                return (
                  <div
                    key={option.value}
                    className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                    onClick={() => setFormat(option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Icon className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <Label
                        htmlFor={option.value}
                        className="cursor-pointer font-medium"
                      >
                        {option.label}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {option.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={!filename.trim()}>
            导出
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExportDialog
