import { useState, useEffect } from 'react'
import { ChatMessage, MentionedItem, TextActionGroup } from '../types'

export const useAIChat = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [selectedEnhancedOptions, setSelectedEnhancedOptions] = useState<string[]>([])
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<number[]>([0, 1, 2])
  const [mentionedItems, setMentionedItems] = useState<MentionedItem[]>([])
  const [textActionGroups, setTextActionGroups] = useState<TextActionGroup[]>([])
  const [currentTextId, setCurrentTextId] = useState<string | null>(null) // 当前选中的文本ID

  // 初始化欢迎消息
  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([{
        id: Date.now().toString(),
        type: 'ai',
        content: '您好！我是您的AI翻译助手。\n\n请选中需要处理的文字，然后选择以下功能之一，或直接输入您的需求：',
        timestamp: new Date(),
        showCategories: true
      }])
    }
  }, [])

  
  /**
   * 添加操作到@引用
   */
  const addActionToMentions = (action: string, label: string) => {
    // 如果有当前选中的文本，将操作关联到该文本
    if (currentTextId) {
      setTextActionGroups(prev => {
        const group = prev.find(g => g.textId === currentTextId)
        if (group) {
          // 检查是否已存在相同操作
          const actionExists = group.actions.some(a => a.action === action)
          if (!actionExists) {
            return prev.map(g => 
              g.textId === currentTextId 
                ? {
                    ...g,
                    actions: [...g.actions, {
                      id: Date.now().toString(),
                      action,
                      label,
                      customInstruction: '' // 初始化操作的个性化指令
                    }]
                  }
                : g
            )
          }
        }
        return prev
      })
    } else {
      // 没有选中文本时，作为全局操作添加
      const newMention: MentionedItem = {
        id: Date.now().toString(),
        type: 'action',
        content: action,
        label: label
      }
      setMentionedItems(prev => [...prev, newMention])
    }
  }

  /**
   * 添加文本到@引用
   */
  const addTextToMentions = (text: string) => {
    const textId = Date.now().toString()
    const textLabel = text.substring(0, 30) + (text.length > 30 ? '...' : '')
    
    // 创建新的文本-操作组
    const newGroup: TextActionGroup = {
      textId,
      text,
      textLabel,
      customInstruction: '', // 初始化个性化指令为空
      actions: []
    }
    setTextActionGroups(prev => [...prev, newGroup])
    setCurrentTextId(textId) // 设置为当前选中的文本
    
    // 同时添加到mentionedItems以保持兼容
    const newMention: MentionedItem = {
      id: textId,
      type: 'text-with-actions',
      content: text,
      label: textLabel,
      actions: []
    }
    setMentionedItems(prev => [...prev, newMention])
  }

  /**
   * 移除@引用项
   */
  const removeMention = (id: string) => {
    // 移除mentionedItems中的项
    setMentionedItems(prev => prev.filter(item => item.id !== id))
    
    // 如果是文本组，也从 textActionGroups 中移除
    setTextActionGroups(prev => prev.filter(group => group.textId !== id))
    
    // 如果移除的是当前选中的文本，清空currentTextId
    if (currentTextId === id) {
      setCurrentTextId(null)
    }
  }
  
  /**
   * 移除文本组中的某个操作
   */
  const removeActionFromGroup = (textId: string, actionId: string) => {
    setTextActionGroups(prev => prev.map(group => 
      group.textId === textId
        ? {
            ...group,
            actions: group.actions.filter(a => a.id !== actionId)
          }
        : group
    ))
  }
  
  /**
   * 选择文本组作为当前活动组
   */
  const selectTextGroup = (textId: string) => {
    setCurrentTextId(textId)
  }
  
  /**
   * 更新文本组的个性化指令
   */
  const updateGroupCustomInstruction = (textId: string, instruction: string) => {
    setTextActionGroups(prev => prev.map(group => 
      group.textId === textId
        ? { ...group, customInstruction: instruction }
        : group
    ))
  }
  
  /**
   * 更新操作的个性化指令
   */
  const updateActionCustomInstruction = (textId: string, actionId: string, instruction: string) => {
    setTextActionGroups(prev => prev.map(group => 
      group.textId === textId
        ? {
            ...group,
            actions: group.actions.map(action => 
              action.id === actionId
                ? { ...action, customInstruction: instruction }
                : action
            )
          }
        : group
    ))
  }

  /**
   * 发送消息
   */
  const sendMessage = (content?: string) => {
    const messageContent = content || inputValue.trim()
    if (!messageContent && mentionedItems.length === 0 && textActionGroups.length === 0) return
    
    // 构建完整的消息内容
    let fullMessage = ''
    
    // 处理文本-操作组
    if (textActionGroups.length > 0) {
      fullMessage += '请处理以下内容：\n\n'
      textActionGroups.forEach((group, index) => {
        fullMessage += `【文本${index + 1}】\n`
        fullMessage += `"${group.text}"\n`
        if (group.actions.length > 0) {
          fullMessage += '需要执行的操作：\n'
          group.actions.forEach(action => {
            fullMessage += `  - ${action.label}`
            if (action.customInstruction && action.customInstruction.trim()) {
              fullMessage += `（${action.customInstruction}）`
            }
            fullMessage += '\n'
          })
        } else {
          fullMessage += '（未指定操作）\n'
        }
        if (group.customInstruction && group.customInstruction.trim()) {
          fullMessage += `特别要求：${group.customInstruction}\n`
        }
        fullMessage += '\n'
      })
    }
    
    // 处理全局操作（没有关联到特定文本的操作）
    const globalActions = mentionedItems.filter(item => item.type === 'action')
    if (globalActions.length > 0) {
      fullMessage += '全局操作：\n'
      globalActions.forEach(item => {
        fullMessage += `- ${item.label}\n`
      })
      fullMessage += '\n'
    }
    
    if (messageContent) {
      fullMessage += '\n附加说明：' + messageContent
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
    setTextActionGroups([])
    setCurrentTextId(null)
    
    // 模拟AI响应 - 根据不同功能提供不同响应
    setTimeout(() => {
      let responseContent = '我已收到您的请求，正在为您处理...'
      
      // 检查是否有特定的功能请求
      if (fullMessage.includes('多版本译文')) {
        responseContent = '正在为您生成不同风格的译文版本...\n\n版本1（正式）：...\n版本2（口语化）：...\n版本3（学术）：...'
      } else if (fullMessage.includes('专业词汇检查')) {
        responseContent = '正在联网搜索验证专业词汇...\n\n检查结果：词汇准确性已确认'
      } else if (fullMessage.includes('用词斩酌')) {
        responseContent = '为您提供多种词汇选择：\n\n1. 原词：...\n2. 备选1：...\n3. 备选2：...\n4. 备选3：...'
      } else if (fullMessage.includes('语法拼写检查')) {
        responseContent = '正在检查语法和拼写...\n\n检查完成：发现1处语法问题，2处拼写错误'
      } else if (fullMessage.includes('翻译质量自检')) {
        responseContent = '正在进行翻译质量自检...\n\n检查结果：\n✅ 信息完整性：通过\n⚠️ 表达准确性：需要注意...'
      }
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: responseContent,
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
    textActionGroups,
    currentTextId,
    sendMessage,
    addActionToMentions,
    addTextToMentions,
    removeMention,
    removeActionFromGroup,
    selectTextGroup,
    updateGroupCustomInstruction,
    updateActionCustomInstruction,
    toggleCategoryExpanded,
    toggleEnhancedOption,
  }
}