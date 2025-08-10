// @引用项接口
export interface MentionedItem {
  id: string
  type: 'text' | 'action' | 'text-with-actions' // 新增类型：带操作的文本
  content: string
  label?: string // 操作的显示标签
  actions?: string[] // 关联的操作标签（仅用于text-with-actions类型）
  parentTextId?: string // 关联的文本ID（仅用于action类型）
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

// 文本与操作组合接口
export interface TextActionGroup {
  textId: string
  text: string
  textLabel: string
  customInstruction?: string // 文本的个性化指令
  actions: Array<{
    id: string
    action: string
    label: string
    customInstruction?: string // 操作的个性化指令
  }>
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