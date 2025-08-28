"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { LoginInput, RegisterInput, User, UserRole } from '@/types/graphql';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name?: string, email?: string) => Promise<void>;
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
      setUser(result.user);
      router.push('/dashboard_MainPage');
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
  
  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
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
 * 保护需要认证的页面
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: UserRole
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push('/login');
      }
      
      if (!loading && requiredRole && user && !authService.hasRole(requiredRole, user.role)) {
        router.push('/unauthorized');
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
    
    return <Component {...props} />;
  };
}
