// @引用项接口
export interface MentionedItem {
  id: string
  type: 'text' | 'action'
  content: string
  label?: string // 操作的显示标签
}

// 聊天消息接口
export interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  showCategories?: boolean // 是否显示功能分类选项
  mentions?: MentionedItem[] // @引用的内容
}

// 格式状态接口
export interface FormatState {
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  isStrikethrough: boolean
  textColor: string
  backgroundColor: string
  fontSize: string
  fontFamily: string
  alignment: 'left' | 'center' | 'right' | 'justify'
  isBulletList: boolean
  isNumberedList: boolean
  lineHeight: string
}