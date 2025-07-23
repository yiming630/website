"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Mountain, 
  Smartphone, 
  QrCode, 
  MessageCircle,
  RefreshCw,
  Shield,
  CheckCircle
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

/**
 * 登录页面组件
 * 提供微信登录功能
 */
export default function LoginPage() {
  // 登录方式状态
  const [loginMethod, setLoginMethod] = useState<"wechat" | "phone">("wechat")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [qrCodeStatus, setQrCodeStatus] = useState<"waiting" | "scanned" | "expired">("waiting")

  // 验证码倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 模拟二维码状态变化
  useEffect(() => {
    if (loginMethod === "wechat") {
      // 模拟5秒后二维码过期
      const timer = setTimeout(() => {
        if (qrCodeStatus === "waiting") {
          setQrCodeStatus("expired")
        }
      }, 60000) // 60秒后过期
      
      return () => clearTimeout(timer)
    }
  }, [loginMethod, qrCodeStatus])

  /**
   * 发送验证码
   */
  const handleSendCode = async () => {
    if (!phoneNumber) {
      alert("请输入手机号")
      return
    }
    
    setIsLoading(true)
    // 模拟发送验证码
    setTimeout(() => {
      setIsLoading(false)
      setCountdown(60)
      alert("验证码已发送到您的手机")
    }, 1000)
  }

  /**
   * 手机号登录
   */
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber || !verificationCode) {
      alert("请输入手机号和验证码")
      return
    }
    
    setIsLoading(true)
    // 模拟登录
    setTimeout(() => {
      setIsLoading(false)
      window.location.href = "/workspace"
    }, 1000)
  }

  /**
   * 刷新二维码
   */
  const refreshQrCode = () => {
    setQrCodeStatus("waiting")
  }

  /**
   * 模拟微信扫码登录
   */
  const simulateWechatLogin = () => {
    setQrCodeStatus("scanned")
    setTimeout(() => {
      window.location.href = "/workspace"
    }, 2000)
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

        {/* 登录表单 */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">欢迎回来</CardTitle>
            <CardDescription className="text-center">选择您喜欢的登录方式</CardDescription>
          </CardHeader>
          <CardContent>
            {/* 登录方式切换 */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <Button
                variant={loginMethod === "wechat" ? "default" : "outline"}
                onClick={() => setLoginMethod("wechat")}
                className={loginMethod === "wechat" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                微信登录
              </Button>
              <Button
                variant={loginMethod === "phone" ? "default" : "outline"}
                onClick={() => setLoginMethod("phone")}
                className={loginMethod === "phone" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                手机登录
              </Button>
            </div>

            {/* 微信扫码登录 */}
            {loginMethod === "wechat" && (
              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {/* 二维码区域 */}
                    <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                      {qrCodeStatus === "waiting" && (
                        <>
                          <QrCode className="h-24 w-24 text-gray-400" />
                          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={simulateWechatLogin}>
                            <div className="text-center">
                              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">点击模拟扫码</p>
                            </div>
                          </div>
                        </>
                      )}
                      {qrCodeStatus === "scanned" && (
                        <div className="text-center">
                          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                          <p className="text-lg font-semibold text-green-600">扫码成功</p>
                          <p className="text-sm text-gray-600">正在登录...</p>
                        </div>
                      )}
                      {qrCodeStatus === "expired" && (
                        <div className="text-center">
                          <RefreshCw className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-lg font-semibold text-gray-600">二维码已过期</p>
                          <Button 
                            onClick={refreshQrCode}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            刷新二维码
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      请使用微信扫描二维码登录
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                      <Shield className="h-3 w-3" />
                      <span>安全登录，保护您的隐私</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 手机号登录 */}
            {loginMethod === "phone" && (
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                {/* 手机号输入 */}
              <div className="space-y-2">
                  <Label htmlFor="phone">手机号</Label>
                <div className="relative">
                    <Smartphone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                      id="phone"
                      type="tel"
                      placeholder="请输入手机号"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

                {/* 验证码输入 */}
              <div className="space-y-2">
                  <Label htmlFor="code">验证码</Label>
                  <div className="flex gap-2">
                  <Input
                      id="code"
                      type="text"
                      placeholder="请输入验证码"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="flex-1"
                    required
                  />
                    <Button
                    type="button"
                      variant="outline"
                      onClick={handleSendCode}
                      disabled={countdown > 0 || isLoading}
                      className="px-4"
                  >
                      {countdown > 0 ? `${countdown}s` : "获取验证码"}
                    </Button>
              </div>
              </div>

              {/* 登录按钮 */}
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  disabled={isLoading}
                >
                {isLoading ? "登录中..." : "登录"}
              </Button>
            </form>
            )}

            <Separator className="my-6" />

            {/* 其他登录方式 */}
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">其他登录方式</p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm">支付宝</span>
                </Button>
                <Button variant="outline" className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm">QQ</span>
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
          <Link href="/workspace" className="text-sm text-gray-600 hover:text-gray-900 underline">
            跳过登录，直接体验
          </Link>
        </div>
      </div>
    </div>
  )
}
