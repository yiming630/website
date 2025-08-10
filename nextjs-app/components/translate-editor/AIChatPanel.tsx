"use client"

import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Bot,
  User,
  ChevronRight,
  ChevronDown,
  AtSign,
  XCircle,
  Plus,
  Image,
  Paperclip,
  Mic,
  Send,
  HelpCircle,
  Edit3,
} from 'lucide-react'
import { ChatMessage, MentionedItem, TextActionGroup } from '@/app/translate-editor/types'
import { aiOptions, enhancedOptions, aiAssistantCategories } from '@/app/translate-editor/constants'
import { AITutorial } from './AITutorial'

interface AIChatPanelProps {
  chatMessages: ChatMessage[]
  inputValue: string
  mentionedItems: MentionedItem[]
  textActionGroups: TextActionGroup[]
  currentTextId: string | null
  selectedEnhancedOptions: string[]
  showAttachMenu: boolean
  expandedCategories: number[]
  onInputChange: (value: string) => void
  onSendMessage: (content?: string) => void
  onToggleEnhancedOption: (value: string) => void
  onToggleAttachMenu: () => void
  onToggleCategoryExpanded: (index: number) => void
  onRemoveMention: (id: string) => void
  onRemoveActionFromGroup: (textId: string, actionId: string) => void
  onSelectTextGroup: (textId: string) => void
  onAddActionToMentions: (action: string, label: string) => void
  onUpdateGroupCustomInstruction: (textId: string, instruction: string) => void
  onUpdateActionCustomInstruction: (textId: string, actionId: string, instruction: string) => void
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  chatMessages,
  inputValue,
  mentionedItems,
  textActionGroups,
  currentTextId,
  selectedEnhancedOptions,
  showAttachMenu,
  expandedCategories,
  onInputChange,
  onSendMessage,
  onToggleEnhancedOption,
  onToggleAttachMenu,
  onToggleCategoryExpanded,
  onRemoveMention,
  onRemoveActionFromGroup,
  onSelectTextGroup,
  onAddActionToMentions,
  onUpdateGroupCustomInstruction,
  onUpdateActionCustomInstruction,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    // 自动滚动到最新消息
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleAIOption = (option: typeof aiOptions[0]) => {
    onAddActionToMentions(option.value, option.label)
  }

  const handleCategoryOption = (option: any, categoryTitle: string) => {
    const fullLabel = `${categoryTitle} - ${option.label}`
    onAddActionToMentions(option.value, fullLabel)
  }

  return (
    <div className="w-[30%] min-w-[400px] bg-white border-l border-gray-200 flex flex-col h-full">
      {/* 聊天头部 - 调整高度与左侧对齐 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-b border-blue-800 flex items-center justify-between" 
           style={{ height: '73px', padding: '16px', flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold">AI 助手</h3>
            <p className="text-xs text-blue-100 mt-1">随时为您提供帮助</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 flex items-center gap-2"
          onClick={() => setShowTutorial(true)}
        >
          <HelpCircle className="h-4 w-4" />
          <span className="text-sm">查看使用教程</span>
        </Button>
      </div>
      
      {/* 聊天消息区域 - 添加minHeight: 0确保flex-1正常工作 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-thin" style={{ minHeight: 0 }}>
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 animate-fade-in",
              message.type === 'user' && "justify-end"
            )}
          >
            {message.type === 'ai' && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
            )}
            <div className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3",
              message.type === 'user' 
                ? "bg-blue-600 text-white" 
                : "bg-white border border-gray-200"
            )}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {/* 显示新的6个AI功能选项 */}
              {message.type === 'ai' && message.showCategories && (
                <div className="mt-4">
                  <div className="space-y-2">
                    {aiOptions.map((option) => (
                      <div
                        key={option.value}
                        className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group"
                        onClick={() => handleAIOption(option)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <option.icon className="h-5 w-5 text-blue-700" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm text-gray-900 group-hover:text-blue-900">
                              {option.label}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1">
                              {option.description}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 mt-1 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {message.type === 'user' && (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      
      {/* 增强选项 */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white" style={{ flexShrink: 0 }}>
        <div className="flex gap-2">
          {enhancedOptions.map((option) => (
            <Button
              key={option.value}
              variant={selectedEnhancedOptions.includes(option.value) ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleEnhancedOption(option.value)}
              className="flex-1"
            >
              <option.icon className="h-4 w-4 mr-1" />
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      
      {/* 输入区域 */}
      <div className="p-4 border-t border-gray-200 bg-white" style={{ flexShrink: 0 }}>
        {/* @引用显示区域 - 改进版 */}
        {(textActionGroups.length > 0 || mentionedItems.filter(item => item.type === 'action').length > 0) && (
          <div className="mb-3 space-y-2">
            {/* 文本-操作组 */}
            {textActionGroups.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <AtSign className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-gray-700">文本与操作组合：</span>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin pr-2">
                  {textActionGroups.map((group, index) => (
                    <div
                      key={group.textId}
                      className={cn(
                        "p-2 bg-white rounded-md border transition-all cursor-pointer",
                        currentTextId === group.textId 
                          ? "border-blue-400 shadow-sm" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => onSelectTextGroup(group.textId)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <span className="text-xs font-medium text-blue-600">
                            文本 {index + 1}:
                          </span>
                          <span className="text-xs text-gray-700 ml-1">{group.textLabel}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveMention(group.textId)
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </div>
                      {group.actions.length > 0 && (
                        <div className="mt-2 pl-2 border-l-2 border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">关联操作：</div>
                          <div className="space-y-2">
                            {group.actions.map(action => (
                              <div key={action.id} className="bg-green-50 rounded p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-green-700">
                                    {action.label}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onRemoveActionFromGroup(group.textId, action.id)
                                    }}
                                    className="text-green-600 hover:text-red-500"
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </button>
                                </div>
                                <Input
                                  type="text"
                                  placeholder="为此操作添加特别要求..."
                                  value={action.customInstruction || ''}
                                  onChange={(e) => {
                                    e.stopPropagation()
                                    onUpdateActionCustomInstruction(group.textId, action.id, e.target.value)
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs h-6 px-2 bg-white"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* 个性化指令输入框 */}
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <Edit3 className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">个性化指令：</span>
                        </div>
                        <Input
                          type="text"
                          placeholder="为这段文本输入特别要求..."
                          value={group.customInstruction || ''}
                          onChange={(e) => {
                            e.stopPropagation()
                            onUpdateGroupCustomInstruction(group.textId, e.target.value)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs h-7 px-2"
                        />
                      </div>
                      
                      {group.actions.length === 0 && currentTextId === group.textId && (
                        <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                          请点击下方操作按钮为此文本添加操作
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 全局操作（未关联到文本的操作） */}
            {mentionedItems.filter(item => item.type === 'action').length > 0 && (
              <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-yellow-700">全局操作：</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {mentionedItems.filter(item => item.type === 'action').map(item => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs"
                    >
                      {item.label}
                      <button
                        onClick={() => onRemoveMention(item.id)}
                        className="text-yellow-700 hover:text-red-500"
                      >
                        <XCircle className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="flex gap-2">
          <div className="relative">
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-9 p-0"
              onClick={onToggleAttachMenu}
            >
              <Plus className="h-5 w-5" />
            </Button>
            {showAttachMenu && (
              <div className="absolute bottom-12 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Image className="h-4 w-4 mr-2" />
                  图片
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Paperclip className="h-4 w-4 mr-2" />
                  文件
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Mic className="h-4 w-4 mr-2" />
                  语音
                </Button>
              </div>
            )}
          </div>
          <Input
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSendMessage()
              }
            }}
            placeholder={
              textActionGroups.length > 0 || mentionedItems.length > 0 
                ? "输入附加说明..." 
                : "输入您的需求..."
            }
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={() => onSendMessage()}
            disabled={!inputValue.trim() && mentionedItems.length === 0 && textActionGroups.length === 0}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* AI使用教程弹窗 */}
      <AITutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  )
}