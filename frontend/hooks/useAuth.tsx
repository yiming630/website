"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { LoginInput, RegisterInput, User, UserRole } from '@/types/graphql';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Mountain, RefreshCw } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name?: string, email?: string) => Promise<void>;
  sendVerificationEmail: (email: string) => Promise<{ success: boolean; message: string; emailSent: boolean }>;
  resendVerificationEmail: () => Promise<{ success: boolean; message: string; emailSent: boolean }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message: string; user: User | null }>;
  checkEmailVerificationStatus: (token: string) => Promise<{ valid: boolean; expired: boolean; used: boolean; user: User | null }>;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthProvider组件
 * 提供全局认证状态管理
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // 初始化时检查用户登录状态
  useEffect(() => {
    checkAuth();
  }, []);
  
  /**
   * 检查当前认证状态
   */
  const checkAuth = async () => {
    setLoading(true);
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setError('Failed to verify authentication');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 用户登录
   */
  const login = async (input: LoginInput) => {
    setError(null);
    setLoading(true);
    try {
      const result = await authService.login(input);
      setUser(result.user);
      router.push('/dashboard_MainPage');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 用户注册
   */
  const register = async (input: RegisterInput) => {
    setError(null);
    setLoading(true);
    try {
      const result = await authService.register(input);
      
      // 如果注册成功但没有tokens，说明需要邮箱验证
      if (result.user && !result.tokens) {
        setUser(result.user);
        // 不跳转到dashboard，保持在登录页面显示验证提示
        throw new Error(result.message || '请检查您的邮箱并点击验证链接完成注册');
      } else if (result.user && result.tokens) {
        // 如果有tokens，说明邮箱已验证，可以直接登录
        setUser(result.user);
        router.push('/dashboard_MainPage');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 用户登出
   */
  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 更新用户资料
   */
  const updateProfile = async (name?: string, email?: string) => {
    setError(null);
    try {
      const updatedUser = await authService.updateProfile({ name, email });
      setUser(updatedUser);
    } catch (err: any) {
      setError(err.message || 'Profile update failed');
      throw err;
    }
  };
  
  /**
   * 检查用户角色权限
   */
  const hasRole = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    return authService.hasRole(requiredRole, user.role);
  };

  /**
   * 发送邮箱验证邮件
   */
  const sendVerificationEmail = async (email: string) => {
    setError(null);
    try {
      return await authService.sendVerificationEmail(email);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
      throw err;
    }
  };

  /**
   * 重新发送邮箱验证邮件
   */
  const resendVerificationEmail = async () => {
    setError(null);
    try {
      return await authService.resendVerificationEmail();
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
      throw err;
    }
  };

  /**
   * 验证邮箱
   */
  const verifyEmail = async (token: string) => {
    setError(null);
    setLoading(true);
    try {
      const result = await authService.verifyEmail(token);
      
      if (result.success && result.user) {
        setUser(result.user);
        // 验证成功后跳转到dashboard
        router.push('/dashboard_MainPage');
      }
      
      return {
        success: result.success,
        message: result.message,
        user: result.user
      };
    } catch (err: any) {
      setError(err.message || 'Email verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 检查邮箱验证令牌状态
   */
  const checkEmailVerificationStatus = async (token: string) => {
    try {
      return await authService.checkEmailVerificationStatus(token);
    } catch (err: any) {
      setError(err.message || 'Failed to check verification status');
      throw err;
    }
  };
  
  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    sendVerificationEmail,
    resendVerificationEmail,
    verifyEmail,
    checkEmailVerificationStatus,
    isAuthenticated: !!user,
    hasRole,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 * 获取认证上下文
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * withAuth高阶组件
 * 保护需要认证的页面，包括邮箱验证检查
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: UserRole;
    requireEmailVerification?: boolean;
  }
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [emailVerificationChecked, setEmailVerificationChecked] = useState(false);
    
    useEffect(() => {
      if (!loading) {
        // 检查是否已登录
        if (!isAuthenticated) {
          router.push('/login');
          return;
        }
        
        // 检查角色权限
        if (options?.requiredRole && user && !authService.hasRole(options.requiredRole, user.role)) {
          router.push('/unauthorized');
          return;
        }
        
        // 检查邮箱验证状态
        if (options?.requireEmailVerification !== false && user) { // 默认需要邮箱验证
          // @ts-ignore - User type needs to be updated to include emailVerified
          if (!user.emailVerified) {
            // 如果邮箱未验证，显示提示页面而不是重定向到登录
            setEmailVerificationChecked(true);
            return;
          }
        }
        
        setEmailVerificationChecked(true);
      }
    }, [loading, isAuthenticated, user]);
    
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      return null;
    }
    
    // 邮箱未验证时显示提示页面
    // @ts-ignore - User type needs to be updated
    if (options?.requireEmailVerification !== false && user && !user.emailVerified) {
      return <EmailVerificationRequired />;
    }
    
    if (!emailVerificationChecked) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Checking authentication...</div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}

/**
 * 邮箱未验证时的提示组件
 */
function EmailVerificationRequired() {
  const { user, resendVerificationEmail } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  
  const handleResendEmail = async () => {
    setIsResending(true);
    setMessage('');
    
    try {
      const result = await resendVerificationEmail();
      
      if (result.success) {
        setMessage('验证邮件已重新发送，请检查您的邮箱');
      } else {
        setMessage('发送失败：' + result.message);
      }
    } catch (error: any) {
      setMessage('发送失败：' + (error.message || '未知错误'));
    } finally {
      setIsResending(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Mountain className="h-8 w-8 text-gray-900" />
            格式译专家
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Mail className="h-12 w-12 text-amber-500" />
            </div>
            <CardTitle className="text-2xl">邮箱验证required</CardTitle>
            <CardDescription className="text-center">
              请验证您的邮箱后继续使用翻译功能
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert className="border-amber-500 bg-amber-50">
              <Mail className="h-4 w-4" />
              <AlertDescription className="text-amber-800">
                我们已向 <strong>{user?.email}</strong> 发送了验证邮件。
                请点击邮件中的链接完成验证。
              </AlertDescription>
            </Alert>

            {message && (
              <Alert className={message.includes('失败') ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}>
                <AlertDescription className={message.includes('失败') ? 'text-red-800' : 'text-green-800'}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full bg-gray-900 hover:bg-gray-800"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  发送中...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  重新发送验证邮件
                </>
              )}
            </Button>

            <div className="text-center pt-4">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  退出登录
                </Button>
              </Link>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">没有收到邮件？</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• 请检查垃圾邮件文件夹</li>
                <li>• 确认邮箱地址拼写正确</li>
                <li>• 验证邮件可能需要几分钟才能送达</li>
                <li>• 如仍有问题请联系客服</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
