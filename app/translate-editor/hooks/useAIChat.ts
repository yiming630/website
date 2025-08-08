import { useState, useEffect } from 'react'
import { ChatMessage, MentionedItem } from '../types'

export const useAIChat = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [selectedEnhancedOptions, setSelectedEnhancedOptions] = useState<string[]>([])
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<number[]>([0, 1, 2])
  const [mentionedItems, setMentionedItems] = useState<MentionedItem[]>([])

  // 初始化欢迎消息
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([{
        id: Date.now().toString(),
        type: 'ai',
        content: '您好！我是您的AI助手。请问您需要什么帮助？您可以选择以下操作，或直接告诉我您的需求：',
        timestamp: new Date(),
        showCategories: true
      }])
    }
  }, [])

  /**
   * 添加操作到@引用
   */
  const addActionToMentions = (action: string, label: string) => {
    const newMention: MentionedItem = {
      id: Date.now().toString(),
      type: 'action',
      content: action,
      label: label
    }
    setMentionedItems(prev => [...prev, newMention])
  }

  /**
   * 添加文本到@引用
   */
  const addTextToMentions = (text: string) => {
    const newMention: MentionedItem = {
      id: Date.now().toString(),
      type: 'text',
      content: text,
      label: text.substring(0, 30) + (text.length > 30 ? '...' : '')
    }
    setMentionedItems(prev => [...prev, newMention])
  }

  /**
   * 移除@引用项
   */
  const removeMention = (id: string) => {
    setMentionedItems(prev => prev.filter(item => item.id !== id))
  }

  /**
   * 发送消息
   */
  const sendMessage = (content?: string) => {
    const messageContent = content || inputValue.trim()
    if (!messageContent && mentionedItems.length === 0) return
    
    // 构建完整的消息内容
    let fullMessage = ''
    if (mentionedItems.length > 0) {
      const textMentions = mentionedItems.filter(item => item.type === 'text')
      const actionMentions = mentionedItems.filter(item => item.type === 'action')
      
      if (textMentions.length > 0) {
        fullMessage += '针对以下文本：\n'
        textMentions.forEach(item => {
          fullMessage += `"${item.content}"\n`
        })
      }
      
      if (actionMentions.length > 0) {
        fullMessage += '\n请执行以下操作：\n'
        actionMentions.forEach(item => {
          fullMessage += `- ${item.label}\n`
        })
      }
      
      if (messageContent) {
        fullMessage += '\n附加说明：' + messageContent
      }
    } else {
      fullMessage = messageContent
    }
    
    // 添加用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: fullMessage,
      timestamp: new Date(),
      mentions: [...mentionedItems]
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setInputValue('')
    setMentionedItems([])
    
    // 模拟AI响应
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `我已收到您的请求，正在为您处理...`,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiMessage])
    }, 1000)
  }

  /**
   * 切换分类展开/折叠状态
   */
  const toggleCategoryExpanded = (index: number) => {
    setExpandedCategories(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  /**
   * 切换增强选项
   */
  const toggleEnhancedOption = (value: string) => {
    setSelectedEnhancedOptions(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }

  return {
    chatMessages,
    inputValue,
    setInputValue,
    selectedEnhancedOptions,
    showAttachMenu,
    setShowAttachMenu,
    expandedCategories,
    mentionedItems,
    sendMessage,
    addActionToMentions,
    addTextToMentions,
    removeMention,
    toggleCategoryExpanded,
    toggleEnhancedOption,
  }
}