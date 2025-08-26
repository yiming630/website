import { gql } from '@apollo/client';
import { apolloClient } from '@/lib/apollo-client';
import { ChatMessage, SendChatMessageInput } from '@/types/graphql';

// GraphQL查询和变更定义
const SEND_CHAT_MESSAGE_MUTATION = gql`
  mutation SendChatMessage($input: SendChatMessageInput!) {
    sendChatMessage(input: $input) {
      id
      content
      author
      messageType
      selectedText
      position
      createdAt
    }
  }
`;

const CLEAR_CHAT_HISTORY_MUTATION = gql`
  mutation ClearChatHistory($documentId: ID!) {
    clearChatHistory(documentId: $documentId)
  }
`;

const GET_CHAT_HISTORY_QUERY = gql`
  query GetChatHistory($documentId: ID!) {
    chatHistory(documentId: $documentId) {
      id
      content
      author
      messageType
      selectedText
      position
      createdAt
    }
  }
`;

const NEW_CHAT_MESSAGE_SUBSCRIPTION = gql`
  subscription NewChatMessage($documentId: ID!) {
    newChatMessage(documentId: $documentId) {
      id
      content
      author
      messageType
      selectedText
      position
      createdAt
    }
  }
`;

/**
 * 聊天服务类
 * 处理文档相关的聊天和AI助手功能
 */
export class ChatService {
  private static instance: ChatService;
  
  private constructor() {}
  
  /**
   * 获取ChatService单例实例
   */
  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }
  
  /**
   * 发送聊天消息
   * @param input 聊天消息输入
   * @returns 发送的消息
   */
  async sendMessage(input: SendChatMessageInput): Promise<ChatMessage> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: SEND_CHAT_MESSAGE_MUTATION,
        variables: { input },
      });
      
      return data.sendChatMessage;
    } catch (error) {
      console.error('Send chat message error:', error);
      throw error;
    }
  }
  
  /**
   * 获取聊天历史
   * @param documentId 文档ID
   * @returns 聊天历史消息列表
   */
  async getChatHistory(documentId: string): Promise<ChatMessage[]> {
    try {
      const { data } = await apolloClient.query({
        query: GET_CHAT_HISTORY_QUERY,
        variables: { documentId },
        fetchPolicy: 'network-only',
      });
      
      return data.chatHistory;
    } catch (error) {
      console.error('Get chat history error:', error);
      throw error;
    }
  }
  
  /**
   * 清除聊天历史
   * @param documentId 文档ID
   * @returns 是否清除成功
   */
  async clearChatHistory(documentId: string): Promise<boolean> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CLEAR_CHAT_HISTORY_MUTATION,
        variables: { documentId },
      });
      
      return data.clearChatHistory;
    } catch (error) {
      console.error('Clear chat history error:', error);
      throw error;
    }
  }
  
  /**
   * 订阅新的聊天消息
   * @param documentId 文档ID
   * @param onNewMessage 新消息回调
   * @returns 订阅对象
   */
  subscribeToNewMessages(
    documentId: string,
    onNewMessage: (message: ChatMessage) => void
  ) {
    return apolloClient.subscribe({
      query: NEW_CHAT_MESSAGE_SUBSCRIPTION,
      variables: { documentId },
    }).subscribe({
      next: ({ data }) => {
        if (data && data.newChatMessage) {
          onNewMessage(data.newChatMessage);
        }
      },
      error: (error) => {
        console.error('Chat message subscription error:', error);
      },
    });
  }
  
  /**
   * 发送AI助手请求
   * @param documentId 文档ID
   * @param prompt 提示词
   * @param selectedText 选中的文本（可选）
   * @param position 位置信息（可选）
   * @returns AI响应消息
   */
  async sendAIRequest(
    documentId: string,
    prompt: string,
    selectedText?: string,
    position?: Record<string, any>
  ): Promise<ChatMessage> {
    const input: SendChatMessageInput = {
      documentId,
      content: prompt,
      messageType: 'ai_request',
      selectedText,
      position,
    };
    
    return this.sendMessage(input);
  }
  
  /**
   * 请求翻译改进
   * @param documentId 文档ID
   * @param selectedText 选中的原文
   * @param currentTranslation 当前翻译
   * @param feedback 用户反馈
   * @returns AI改进后的翻译
   */
  async requestTranslationImprovement(
    documentId: string,
    selectedText: string,
    currentTranslation: string,
    feedback?: string
  ): Promise<ChatMessage> {
    const prompt = `请改进以下翻译：
原文：${selectedText}
当前翻译：${currentTranslation}
${feedback ? `用户反馈：${feedback}` : ''}`;
    
    return this.sendAIRequest(documentId, prompt, selectedText);
  }
  
  /**
   * 请求术语解释
   * @param documentId 文档ID
   * @param term 需要解释的术语
   * @param context 上下文（可选）
   * @returns AI解释
   */
  async requestTermExplanation(
    documentId: string,
    term: string,
    context?: string
  ): Promise<ChatMessage> {
    const prompt = `请解释术语"${term}"${context ? `，在以下上下文中：${context}` : ''}`;
    
    return this.sendAIRequest(documentId, prompt, term);
  }
  
  /**
   * 请求风格调整
   * @param documentId 文档ID
   * @param selectedText 选中的文本
   * @param targetStyle 目标风格
   * @returns AI调整后的文本
   */
  async requestStyleAdjustment(
    documentId: string,
    selectedText: string,
    targetStyle: string
  ): Promise<ChatMessage> {
    const prompt = `请将以下文本调整为${targetStyle}风格：${selectedText}`;
    
    return this.sendAIRequest(documentId, prompt, selectedText);
  }
}

// 导出单例实例
export const chatService = ChatService.getInstance();
