"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mountain, Mail, MapPin, Phone, Send, MessageSquare, Clock, Globe } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 构建mailto链接
    const mailtoLink = `mailto:seekhub@gmail.com?subject=${encodeURIComponent(formData.subject || "来自格式译专家的咨询")}&body=${encodeURIComponent(
      `姓名: ${formData.name}\n邮箱: ${formData.email}\n\n${formData.message}`
    )}`
    window.location.href = mailtoLink
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 导航栏 */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <Mountain className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-xl text-gray-900">格式译专家</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors" href="/">
            首页
          </Link>
          <Link className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors" href="/#features">
            功能特性
          </Link>
          <Link className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors" href="/#scenarios">
            应用场景
          </Link>
          <Link className="text-sm font-medium text-gray-900" href="/contact">
            联系我们
          </Link>
        </nav>
        <div className="ml-6 flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">登录</Link>
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/user-type">免费体验</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* 页面标题区域 */}
        <section className="w-full py-12 md:py-24 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900">
                  联系我们
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-600 md:text-xl">
                  我们随时准备为您提供帮助和支持
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 联系方式卡片 */}
        <section className="w-full py-12 md:py-24 bg-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">电子邮件</h3>
                  <p className="text-gray-600 mb-2">联系人：格式译工作人员</p>
                  <a href="mailto:seekhub@gmail.com" className="text-blue-600 hover:text-blue-700 font-medium">
                    seekhub@gmail.com
                  </a>
                </CardContent>
              </Card>
              
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">响应时间</h3>
                  <p className="text-gray-600">工作日：24小时内</p>
                  <p className="text-gray-600">周末：48小时内</p>
                </CardContent>
              </Card>
              
              <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <Globe className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">服务时间</h3>
                  <p className="text-gray-600">全球24/7在线服务</p>
                  <p className="text-gray-600">专业技术支持</p>
                </CardContent>
              </Card>
            </div>

            {/* 联系表单 */}
            <div className="max-w-2xl mx-auto">
              <Card className="p-8">
                <CardContent className="p-0">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">发送消息给我们</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          您的姓名
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="请输入您的姓名"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          电子邮箱
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        咨询类型
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">请选择咨询类型</option>
                        <option value="产品咨询">产品咨询</option>
                        <option value="技术支持">技术支持</option>
                        <option value="商务合作">商务合作</option>
                        <option value="价格咨询">价格咨询</option>
                        <option value="其他问题">其他问题</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        详细信息
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请详细描述您的需求或问题..."
                      />
                    </div>
                    
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                      <Send className="mr-2 h-4 w-4" />
                      发送消息
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* 常见问题提示 */}
            <div className="max-w-2xl mx-auto mt-12">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <MessageSquare className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">需要快速帮助？</h3>
                      <p className="text-gray-600 mb-3">
                        查看我们的常见问题解答，可能已经有您想要的答案。
                      </p>
                      <Button variant="outline" asChild size="sm">
                        <Link href="/#faq">查看常见问题</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-gray-200 bg-white">
        <p className="text-xs text-gray-600">© 2024 格式译专家. 保留所有权利.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs text-gray-600 hover:text-gray-900 transition-colors" href="#">
            服务条款
          </Link>
          <Link className="text-xs text-gray-600 hover:text-gray-900 transition-colors" href="#">
            隐私政策
          </Link>
          <Link className="text-xs text-gray-600 hover:text-gray-900 transition-colors" href="/contact">
            联系我们
          </Link>
        </nav>
      </footer>
    </div>
  )
}