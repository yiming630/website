"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Share2,
  Download,
  Save,
  Check,
  Loader2,
  FileDown,
  FileText,
  Users,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HeaderProps {
  documentTitle: string
  onTitleChange: (title: string) => void
  saveStatus: 'saved' | 'saving' | 'unsaved'
  onSave: () => void
  onShare: () => void
  onExport: (format: 'docx' | 'pdf') => void
  collaborators?: Array<{
    id: string
    name: string
    avatar?: string
    email?: string
  }>
}

/**
 * DocumentTitle - 可编辑的文档标题组件
 */
const DocumentTitle: React.FC<{
  title: string
  onChange: (title: string) => void
}> = ({ title, onChange }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [tempTitle, setTempTitle] = useState(title)

  const handleSave = () => {
    onChange(tempTitle)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempTitle(title)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <Input
        value={tempTitle}
        onChange={(e) => setTempTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSave()
          } else if (e.key === 'Escape') {
            handleCancel()
          }
        }}
        className="text-lg font-semibold max-w-xs"
        autoFocus
      />
    )
  }

  return (
    <h1
      className="text-lg font-semibold cursor-text hover:bg-gray-100 px-2 py-1 rounded transition-colors"
      onClick={() => setIsEditing(true)}
      title="点击编辑文档标题"
    >
      {title || '未命名文档'}
    </h1>
  )
}

/**
 * CollaborationAvatars - 显示协作用户头像
 */
const CollaborationAvatars: React.FC<{
  collaborators: Array<{
    id: string
    name: string
    avatar?: string
    email?: string
  }>
}> = ({ collaborators }) => {
  if (!collaborators || collaborators.length === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4 text-gray-500 mr-1" />
        <div className="flex -space-x-2">
          {collaborators.slice(0, 3).map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-white">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-xs">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{user.name}</p>
                {user.email && (
                  <p className="text-xs text-gray-500">{user.email}</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
          {collaborators.length > 3 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    +{collaborators.length - 3}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">还有 {collaborators.length - 3} 位协作者</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

/**
 * ShareButton - 分享按钮
 */
const ShareButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2"
    >
      <Share2 className="h-4 w-4" />
      分享
    </Button>
  )
}

/**
 * ExportButton - 导出按钮（支持多种格式）
 */
const ExportButton: React.FC<{
  onExport: (format: 'docx' | 'pdf') => void
}> = ({ onExport }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          导出
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('docx')}>
          <FileText className="h-4 w-4 mr-2" />
          导出为 Word (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('pdf')}>
          <FileDown className="h-4 w-4 mr-2" />
          导出为 PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * SaveStatus - 保存状态显示
 */
const SaveStatus: React.FC<{
  status: 'saved' | 'saving' | 'unsaved'
  onSave: () => void
}> = ({ status, onSave }) => {
  const statusConfig = {
    saved: {
      icon: Check,
      text: '已保存',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    saving: {
      icon: Loader2,
      text: '正在保存中...',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      animate: true,
    },
    unsaved: {
      icon: Save,
      text: '未保存',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${config.bgColor} ${config.color}`}
      >
        <Icon
          className={`h-4 w-4 ${config.animate ? 'animate-spin' : ''}`}
        />
        <span>{config.text}</span>
      </div>
      {status === 'unsaved' && (
        <Button
          size="sm"
          onClick={onSave}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          保存
        </Button>
      )}
    </div>
  )
}

/**
 * Header - 主页面头部组件
 */
export const Header: React.FC<HeaderProps> = ({
  documentTitle,
  onTitleChange,
  saveStatus,
  onSave,
  onShare,
  onExport,
  collaborators = [],
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 左侧 - 文档标题和协作者 */}
        <div className="flex items-center gap-6">
          <DocumentTitle title={documentTitle} onChange={onTitleChange} />
          <CollaborationAvatars collaborators={collaborators} />
        </div>

        {/* 右侧 - 操作按钮和保存状态 */}
        <div className="flex items-center gap-3">
          <ShareButton onClick={onShare} />
          <ExportButton onExport={onExport} />
          <div className="h-6 w-px bg-gray-300" />
          <SaveStatus status={saveStatus} onSave={onSave} />
        </div>
      </div>
    </header>
  )
}

export default Header 