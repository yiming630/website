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
} from 'lucide-react'
import { ChatMessage, MentionedItem } from '@/app/translate-editor/types'
import { aiOptions, enhancedOptions, aiAssistantCategories } from '@/app/translate-editor/constants'
import { AITutorial } from './AITutorial'

interface AIChatPanelProps {
  chatMessages: ChatMessage[]
  inputValue: string
  mentionedItems: MentionedItem[]
  selectedEnhancedOptions: string[]
  showAttachMenu: boolean
  expandedCategories: number[]
  onInputChange: (value: string) => void
  onSendMessage: (content?: string) => void
  onToggleEnhancedOption: (value: string) => void
  onToggleAttachMenu: () => void
  onToggleCategoryExpanded: (index: number) => void
  onRemoveMention: (id: string) => void
  onAddActionToMentions: (action: string, label: string) => void
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  chatMessages,
  inputValue,
  mentionedItems,
  selectedEnhancedOptions,
  showAttachMenu,
  expandedCategories,
  onInputChange,
  onSendMessage,
  onToggleEnhancedOption,
  onToggleAttachMenu,
  onToggleCategoryExpanded,
  onRemoveMention,
  onAddActionToMentions,
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
    <div className="w-[30%] min-w-[400px] bg-white border-l border-gray-200 flex flex-col">
      {/* 聊天头部 - 调整高度与左侧对齐 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-b border-blue-800 flex items-center justify-between" 
           style={{ height: '73px', padding: '16px' }}>
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
      
      {/* 聊天消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
              
              {/* 显示AI助手功能分类选项 */}
              {message.type === 'ai' && message.showCategories && (
                <div className="mt-4 space-y-3">
                  {aiAssistantCategories.map((category, index) => {
                    const isExpanded = expandedCategories.includes(index)
                    return (
                      <div key={index} className="border border-gray-100 rounded-lg overflow-hidden bg-gray-50 hover:border-gray-200 transition-colors">
                        <button
                          onClick={() => onToggleCategoryExpanded(index)}
                          className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-100 transition-colors"
                        >
                          <span className="text-lg">{category.icon}</span>
                          <div className="flex-1 text-left">
                            <h4 className="font-semibold text-sm text-gray-900">{category.title}</h4>
                            {!isExpanded && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{category.description}</p>
                            )}
                          </div>
                          <ChevronDown className={cn(
                            "h-4 w-4 text-gray-400 transition-transform",
                            isExpanded && "rotate-180"
                          )} />
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-3">
                            <p className="text-xs text-gray-500 mb-2">{category.description}</p>
                            <div className="space-y-1">
                              {category.options.map((option) => (
                                <Button
                                  key={option.value}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-left hover:bg-white group"
                                  onClick={() => handleCategoryOption(option, category.title)}
                                >
                                  <ChevronRight className="h-3 w-3 mr-2 flex-shrink-0 text-gray-400 group-hover:text-gray-600" />
                                  <div className="flex-1">
                                    <div className="font-medium text-xs text-gray-700 group-hover:text-gray-900">{option.label}</div>
                                    <div className="text-xs text-gray-500 line-clamp-1">{option.description}</div>
                                  </div>
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  
                  {/* 保留原有的快捷操作按钮 */}
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500 mb-2">快捷操作：</p>
                    <div className="grid grid-cols-2 gap-2">
                      {aiOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => handleAIOption(option)}
                        >
                          <option.icon className="h-4 w-4 mr-2" />
                          {option.label}
                        </Button>
                      ))}
                    </div>
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
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
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
      <div className="p-4 border-t border-gray-200 bg-white">
        {/* @引用显示区域 */}
        {mentionedItems.length > 0 && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <AtSign className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-gray-600">已选中的内容和操作：</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {mentionedItems.map(item => (
                <div
                  key={item.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-gray-200 text-xs"
                >
                  <span className={cn(
                    "font-medium",
                    item.type === 'text' ? "text-blue-600" : "text-green-600"
                  )}>
                    {item.type === 'text' ? '文本' : '操作'}:
                  </span>
                  <span className="text-gray-700">{item.label}</span>
                  <button
                    onClick={() => onRemoveMention(item.id)}
                    className="ml-1 text-gray-400 hover:text-red-500"
                  >
                    <XCircle className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
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
            placeholder={mentionedItems.length > 0 ? "输入附加说明..." : "输入您的需求..."}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={() => onSendMessage()}
            disabled={!inputValue.trim() && mentionedItems.length === 0}
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