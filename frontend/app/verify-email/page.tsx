"use client"

import type React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Mountain,
  Mail,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"

/**
 * 邮箱验证页面组件
 * 处理用户点击邮件中的验证链接
 */
export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyEmail, checkEmailVerificationStatus, sendVerificationEmail } = useAuth()
  
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid' | 'expired' | 'used' | 'success' | 'error'>('checking')
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [isResending, setIsResending] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      setMessage('验证链接无效，缺少必要的验证令牌')
      return
    }

    checkTokenStatus()
  }, [token])

  /**
   * 检查令牌状态
   */
  const checkTokenStatus = async () => {
    if (!token) return

    try {
      setStatus('checking')
      const result = await checkEmailVerificationStatus(token)
      
      if (!result.valid) {
        if (result.expired) {
          setStatus('expired')
          setMessage('验证链接已过期，请重新发送验证邮件')
        } else if (result.used) {
          setStatus('used')
          setMessage('此验证链接已被使用，如果您还未登录，请直接登录')
        } else {
          setStatus('invalid')
          setMessage('无效的验证链接')
        }
      } else {
        setStatus('valid')
        setMessage('验证链接有效，点击下方按钮完成邮箱验证')
        if (result.user) {
          setUserEmail(result.user.email)
        }
      }
    } catch (error: any) {
      setStatus('error')
      setMessage('检查验证状态时出错：' + (error.message || '未知错误'))
    }
  }

  /**
   * 执行邮箱验证
   */
  const handleVerifyEmail = async () => {
    if (!token) return

    try {
      const result = await verifyEmail(token)
      
      if (result.success) {
        setStatus('success')
        setMessage(result.message || '邮箱验证成功！正在跳转到主页面...')
        
        // 3秒后自动跳转（useAuth中的verifyEmail已经会自动跳转）
        setTimeout(() => {
          if (!router) {
            window.location.href = '/dashboard_MainPage'
          }
        }, 3000)
      } else {
        setStatus('error')
        setMessage(result.message || '邮箱验证失败')
      }
    } catch (error: any) {
      setStatus('error')
      setMessage('验证过程中出错：' + (error.message || '未知错误'))
    }
  }

  /**
   * 重新发送验证邮件
   */
  const handleResendEmail = async () => {
    if (!userEmail) {
      setMessage('无法获取邮箱地址，请返回登录页面重新注册')
      return
    }

    setIsResending(true)
    try {
      const result = await sendVerificationEmail(userEmail)
      
      if (result.success) {
        setMessage(`新的验证邮件已发送到 ${userEmail}，请检查您的邮箱`)
        setStatus('checking') // 重置状态，用户可能会收到新的链接
      } else {
        setMessage('发送验证邮件失败：' + result.message)
      }
    } catch (error: any) {
      setMessage('发送验证邮件时出错：' + (error.message || '未知错误'))
    } finally {
      setIsResending(false)
    }
  }

  const renderStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Clock className="h-12 w-12 text-blue-500 animate-pulse" />
      case 'valid':
        return <Mail className="h-12 w-12 text-green-500" />
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />
      case 'expired':
      case 'used':
      case 'invalid':
      case 'error':
        return <AlertCircle className="h-12 w-12 text-red-500" />
      default:
        return <Mail className="h-12 w-12 text-gray-500" />
    }
  }

  const renderStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-500 bg-green-50'
      case 'valid':
        return 'border-blue-500 bg-blue-50'
      case 'checking':
        return 'border-blue-500 bg-blue-50'
      case 'expired':
      case 'used':
      case 'invalid':
      case 'error':
        return 'border-red-500 bg-red-50'
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 品牌标识 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Mountain className="h-8 w-8 text-gray-900" />
            格式译专家
          </Link>
          <p className="text-gray-600 mt-2">邮箱验证</p>
        </div>

        {/* 验证状态卡片 */}
        <Card className={`shadow-xl border-2 ${renderStatusColor()}`}>
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              {renderStatusIcon()}
            </div>
            <CardTitle className="text-2xl">
              {status === 'checking' && '正在检查验证状态...'}
              {status === 'valid' && '确认邮箱验证'}
              {status === 'success' && '验证成功！'}
              {status === 'expired' && '验证链接已过期'}
              {status === 'used' && '验证链接已使用'}
              {status === 'invalid' && '无效的验证链接'}
              {status === 'error' && '验证出错'}
            </CardTitle>
            <CardDescription className="text-center">
              {userEmail && (
                <span className="text-sm text-gray-600">
                  邮箱地址: <strong>{userEmail}</strong>
                </span>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* 状态消息 */}
            <Alert className={
              status === 'success' ? 'border-green-600 bg-green-50' :
              status === 'error' || status === 'invalid' || status === 'expired' || status === 'used' ? 'border-red-600 bg-red-50' :
              'border-blue-600 bg-blue-50'
            }>
              <AlertDescription className={
                status === 'success' ? 'text-green-800' :
                status === 'error' || status === 'invalid' || status === 'expired' || status === 'used' ? 'text-red-800' :
                'text-blue-800'
              }>
                {message}
              </AlertDescription>
            </Alert>

            {/* 操作按钮 */}
            <div className="space-y-3">
              {status === 'valid' && (
                <Button 
                  onClick={handleVerifyEmail}
                  className="w-full bg-gray-900 hover:bg-gray-800"
                  size="lg"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  确认验证邮箱
                </Button>
              )}

              {status === 'success' && (
                <Button 
                  onClick={() => router.push('/dashboard_MainPage')}
                  className="w-full bg-gray-900 hover:bg-gray-800"
                  size="lg"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  进入主页面
                </Button>
              )}

              {(status === 'expired' || status === 'used') && userEmail && (
                <Button 
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full bg-gray-700 hover:bg-gray-600"
                  size="lg"
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
              )}

              {/* 返回登录 */}
              <div className="pt-4 border-t">
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    返回登录页面
                  </Button>
                </Link>
              </div>
            </div>

            {/* 帮助信息 */}
            {status !== 'success' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">需要帮助？</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• 请检查邮件的垃圾邮件文件夹</li>
                  <li>• 验证链接有效期为24小时</li>
                  <li>• 每个验证链接只能使用一次</li>
                  <li>• 如有问题请联系客服支持</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 底部链接 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            没有收到验证邮件？{" "}
            <Link href="/login" className="text-gray-600 hover:underline">
              重新注册
            </Link>{" "}
            或{" "}
            <Link href="/#contact" className="text-gray-600 hover:underline">
              联系客服
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}