import { gql } from '@apollo/client';
import { apolloClient } from '@/lib/apollo-client';
import {
  AuthPayload,
  AuthTokens,
  LoginInput,
  LogoutResponse,
  RefreshTokenInput,
  RegisterInput,
  UpdateUserProfileInput,
  UpdateUserPreferencesInput,
  User,
  UserRole,
} from '@/types/graphql';

// GraphQL查询和变更定义
const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        name
        email
        role
        plan
        preferences
        createdAt
      }
      token
      refreshToken
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        name
        email
        role
        plan
        preferences
        createdAt
        lastLogin
      }
      token
      refreshToken
    }
  }
`;

const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($input: RefreshTokenInput!) {
    refreshToken(input: $input) {
      accessToken
      refreshToken
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout($refreshToken: String) {
    logout(refreshToken: $refreshToken) {
      message
      success
    }
  }
`;

const GET_ME_QUERY = gql`
  query GetMe {
    me {
      id
      name
      email
      role
      plan
      preferences
      createdAt
      lastLogin
    }
  }
`;

const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateUserProfileInput!) {
    updateProfile(input: $input) {
      id
      name
      email
      role
      plan
      preferences
      createdAt
      lastLogin
    }
  }
`;

const UPDATE_PREFERENCES_MUTATION = gql`
  mutation UpdatePreferences($input: UpdateUserPreferencesInput!) {
    updatePreferences(input: $input) {
      id
      name
      email
      role
      plan
      preferences
      createdAt
      lastLogin
    }
  }
`;

/**
 * 认证服务类
 * 处理用户认证、授权和个人资料管理
 */
export class AuthService {
  private static instance: AuthService;
  
  private constructor() {}
  
  /**
   * 获取AuthService单例实例
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  
  /**
   * 用户注册
   * @param input 注册信息
   * @returns 认证信息包含用户信息和token
   */
  async register(input: RegisterInput): Promise<AuthPayload> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: REGISTER_MUTATION,
        variables: { input },
      });
      
      // 保存token到本地存储
      this.saveTokens(data.register.token, data.register.refreshToken);
      
      return data.register;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  /**
   * 用户登录
   * @param input 登录信息
   * @returns 认证信息包含用户信息和token
   */
  async login(input: LoginInput): Promise<AuthPayload> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: LOGIN_MUTATION,
        variables: { input },
      });
      
      // 保存token到本地存储
      this.saveTokens(data.login.token, data.login.refreshToken);
      
      return data.login;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  /**
   * 刷新访问令牌
   * @param refreshToken 刷新令牌
   * @returns 新的token对
   */
  async refreshToken(refreshToken?: string): Promise<AuthTokens> {
    const token = refreshToken || this.getRefreshToken();
    if (!token) {
      throw new Error('No refresh token available');
    }
    
    try {
      const { data } = await apolloClient.mutate({
        mutation: REFRESH_TOKEN_MUTATION,
        variables: {
          input: { refreshToken: token },
        },
      });
      
      // 更新本地存储的token
      this.saveTokens(data.refreshToken.accessToken, data.refreshToken.refreshToken);
      
      return data.refreshToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      // 如果刷新失败，清除本地token
      this.clearTokens();
      throw error;
    }
  }
  
  /**
   * 用户登出
   * @returns 登出响应
   */
  async logout(): Promise<LogoutResponse> {
    const refreshToken = this.getRefreshToken();
    
    try {
      const { data } = await apolloClient.mutate({
        mutation: LOGOUT_MUTATION,
        variables: { refreshToken },
      });
      
      return data.logout;
    } catch (error) {
      console.error('Logout error:', error);
      return {
        message: 'Logout failed',
        success: false,
      };
    } finally {
      // 无论成功与否都清除本地token和缓存
      this.clearTokens();
      await apolloClient.clearStore();
    }
  }
  
  /**
   * 获取当前用户信息
   * @returns 当前用户信息
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data } = await apolloClient.query({
        query: GET_ME_QUERY,
        fetchPolicy: 'network-only',
      });
      
      return data.me;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
  
  /**
   * 更新用户资料
   * @param input 更新的用户资料
   * @returns 更新后的用户信息
   */
  async updateProfile(input: UpdateUserProfileInput): Promise<User> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_PROFILE_MUTATION,
        variables: { input },
      });
      
      return data.updateProfile;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
  
  /**
   * 更新用户偏好设置
   * @param input 更新的偏好设置
   * @returns 更新后的用户信息
   */
  async updatePreferences(input: UpdateUserPreferencesInput): Promise<User> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UPDATE_PREFERENCES_MUTATION,
        variables: { input },
      });
      
      return data.updatePreferences;
    } catch (error) {
      console.error('Update preferences error:', error);
      throw error;
    }
  }
  
  /**
   * 检查用户是否已登录
   * @returns 是否已登录
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
  
  /**
   * 获取访问令牌
   * @returns 访问令牌
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }
  
  /**
   * 获取刷新令牌
   * @returns 刷新令牌
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }
  
  /**
   * 保存令牌到本地存储
   * @param token 访问令牌
   * @param refreshToken 刷新令牌
   */
  private saveTokens(token: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
  }
  
  /**
   * 清除本地存储的令牌
   */
  private clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
  
  /**
   * 检查用户角色权限
   * @param requiredRole 需要的角色
   * @param userRole 用户当前角色
   * @returns 是否有权限
   */
  hasRole(requiredRole: UserRole, userRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.READER]: 0,
      [UserRole.TRANSLATOR]: 1,
      [UserRole.ADMIN]: 2,
      [UserRole.ENTERPRISE]: 2,
    };
    
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
}

// 导出单例实例
export const authService = AuthService.getInstance();
