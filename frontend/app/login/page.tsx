"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Mountain, 
  Smartphone, 
  QrCode, 
  MessageCircle,
  RefreshCw,
  Shield,
  CheckCircle,
  Mail,
  Lock,
  User,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"

/**
 * 登录页面组件
 * 连接到GraphQL后端进行用户认证
 */
export default function LoginPage() {
  const router = useRouter()
  const { login, register: registerUser, loading: authLoading, error: authError } = useAuth()
  
  // 表单状态
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 清除错误信息
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  /**
   * 处理登录
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    // 验证输入
    if (!email || !password) {
      setError("请输入邮箱和密码")
      return
    }
    
    setIsLoading(true)
    try {
      await login({ email, password })
      setSuccess("登录成功，正在跳转...")
      // 登录成功后会自动跳转到dashboard，由AuthProvider处理
    } catch (err: any) {
      setError(err.message || "登录失败，请检查邮箱和密码")
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 处理注册
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    // 验证输入
    if (!name || !email || !password || !confirmPassword) {
      setError("请填写所有字段")
      return
    }
    
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致")
      return
    }
    
    if (password.length < 6) {
      setError("密码至少需要6个字符")
      return
    }
    
    setIsLoading(true)
    try {
      await registerUser({ 
        name, 
        email, 
        password 
      })
      setSuccess("注册成功，正在跳转...")
      // 注册成功后会自动登录并跳转到dashboard
    } catch (err: any) {
      setError(err.message || "注册失败，请稍后再试")
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 演示账号登录
   */
  const handleDemoLogin = async () => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)
    
    try {
      // 使用演示账号
      await login({ 
        email: "demo@seekhub.com", 
        password: "demo123456" 
      })
      setSuccess("使用演示账号登录成功，正在跳转...")
    } catch (err: any) {
      // 如果演示账号不存在，先创建
      try {
        await registerUser({
          name: "演示用户",
          email: "demo@seekhub.com",
          password: "demo123456"
        })
        setSuccess("演示账号创建成功，正在登录...")
      } catch (registerErr: any) {
        setError("演示账号暂不可用，请使用邮箱注册")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 品牌标识 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Mountain className="h-8 w-8 text-emerald-600" />
            格式译专家
          </Link>
          <p className="text-gray-600 mt-2">专业文档翻译平台</p>
        </div>

        {/* 登录/注册表单 */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isRegister ? "创建账号" : "欢迎回来"}
            </CardTitle>
            <CardDescription className="text-center">
              {isRegister ? "注册新账号开始使用" : "登录您的账号继续使用"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 错误/成功提示 */}
            {(error || authError) && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error || authError}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4 border-green-600 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* 登录表单 */}
            {!isRegister ? (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* 邮箱输入 */}
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="请输入邮箱"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading || authLoading}
                    />
                  </div>
                </div>

                {/* 密码输入 */}
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="请输入密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading || authLoading}
                    />
                  </div>
                </div>

                {/* 记住密码和忘记密码 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="remember" 
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                      记住我
                    </Label>
                  </div>
                  <Link href="#" className="text-sm text-green-600 hover:underline">
                    忘记密码？
                  </Link>
                </div>

                {/* 登录按钮 */}
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  disabled={isLoading || authLoading}
                >
                  {isLoading || authLoading ? "登录中..." : "登录"}
                </Button>
              </form>
            ) : (
              // 注册表单
              <form onSubmit={handleRegister} className="space-y-4">
                {/* 姓名输入 */}
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="请输入姓名"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading || authLoading}
                    />
                  </div>
                </div>

                {/* 邮箱输入 */}
                <div className="space-y-2">
                  <Label htmlFor="register-email">邮箱</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="请输入邮箱"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading || authLoading}
                    />
                  </div>
                </div>

                {/* 密码输入 */}
                <div className="space-y-2">
                  <Label htmlFor="register-password">密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="请输入密码（至少6位）"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading || authLoading}
                    />
                  </div>
                </div>

                {/* 确认密码 */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">确认密码</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="请再次输入密码"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading || authLoading}
                    />
                  </div>
                </div>

                {/* 注册按钮 */}
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  disabled={isLoading || authLoading}
                >
                  {isLoading || authLoading ? "注册中..." : "注册"}
                </Button>
              </form>
            )}

            <Separator className="my-6" />

            {/* 切换登录/注册 */}
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                {isRegister ? "已有账号？" : "还没有账号？"}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister)
                    setError(null)
                    setSuccess(null)
                  }}
                  className="text-green-600 hover:underline ml-1"
                  disabled={isLoading || authLoading}
                >
                  {isRegister ? "立即登录" : "立即注册"}
                </button>
              </p>

              {/* 演示账号 */}
              <Button 
                type="button"
                variant="outline" 
                className="w-full"
                onClick={handleDemoLogin}
                disabled={isLoading || authLoading}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                使用演示账号快速体验
              </Button>
            </div>

            {/* 第三方登录（预留） */}
            <div className="mt-6 space-y-3">
              <p className="text-sm text-gray-600 text-center">或使用其他方式登录</p>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center gap-2"
                  disabled
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">微信</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center justify-center gap-2"
                  disabled
                >
                  <QrCode className="h-4 w-4" />
                  <span className="text-sm">扫码</span>
                </Button>
              </div>
            </div>

            {/* 用户协议 */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                登录即表示您同意我们的{" "}
                <Link href="#" className="text-green-600 hover:underline">
                  用户协议
                </Link>{" "}
                和{" "}
                <Link href="#" className="text-green-600 hover:underline">
                  隐私政策
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 快速体验 */}
        <div className="mt-6 text-center">
          <Link 
            href="/workspace" 
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            跳过登录，直接体验（功能受限）
          </Link>
        </div>
      </div>
    </div>
  )
}