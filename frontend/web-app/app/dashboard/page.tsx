"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Mountain,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  BarChart3,
  Users,
  Globe,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

/**
 * 仪表板页面组件
 * 显示用户的翻译统计、最近活动和快速操作
 */
export default function DashboardPage() {
  // 模拟用户数据
  const [userData] = useState({
    name: "用户",
    plan: "免费体验版",
    usedQuota: 7500,
    totalQuota: 10000,
    tasksCompleted: 25,
    wordsTranslated: 80000,
    timeSaved: 12,
  })

  // 模拟最近活动
  const recentActivities = [
    {
      id: 1,
      title: "商业计划书翻译完成",
      description: "中文 → 英语 • 15页",
      time: "2小时前",
      status: "completed",
    },
    {
      id: 2,
      title: "技术文档正在处理",
      description: "英语 → 中文 • 8页",
      time: "1天前",
      status: "processing",
    },
    {
      id: 3,
      title: "法律合同翻译完成",
      description: "英语 → 中文 • 12页",
      time: "3天前",
      status: "completed",
    },
  ]

  // 统计数据
  const stats = [
    {
      title: "本月翻译",
      value: userData.tasksCompleted,
      unit: "份文档",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "处理字符",
      value: userData.wordsTranslated.toLocaleString(),
      unit: "字符",
      icon: BarChart3,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "节省时间",
      value: userData.timeSaved,
      unit: "小时",
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "翻译质量",
      value: "98.5",
      unit: "%",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Mountain className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">格式译专家</span>
          </Link>

          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/workspace">工作台</Link>
            </Button>
            <Button asChild>
              <Link href="/workspace">
                <Plus className="h-4 w-4 mr-2" />
                新建翻译
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">欢迎回来，{userData.name}！</h1>
          <p className="text-gray-600">这里是您的翻译工作概览，查看最新进展和统计数据</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-500">{stat.unit}</p>
                    </div>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 使用情况 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>本月使用情况</CardTitle>
                <CardDescription>免费额度使用进度和升级建议</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">翻译字符数</span>
                      <span className="text-sm text-gray-600">
                        {userData.usedQuota.toLocaleString()} / {userData.totalQuota.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={(userData.usedQuota / userData.totalQuota) * 100} className="h-2" />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-900">升级到专业版</p>
                        <p className="text-sm text-blue-700">获得无限翻译额度和更多高级功能</p>
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        升级
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 最近活动 */}
            <Card>
              <CardHeader>
                <CardTitle>最近活动</CardTitle>
                <CardDescription>您最近的翻译任务和进展</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.status === "completed" ? "bg-emerald-100" : "bg-blue-100"
                        }`}
                      >
                        {activity.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                      </div>
                      <span className="text-sm text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href="/workspace">
                      查看所有活动
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 快速操作 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
                <CardDescription>常用功能快速入口</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" asChild>
                  <Link href="/workspace">
                    <Plus className="h-4 w-4 mr-2" />
                    新建翻译
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/workspace">
                    <FileText className="h-4 w-4 mr-2" />
                    查看历史
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Users className="h-4 w-4 mr-2" />
                  团队协作
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Globe className="h-4 w-4 mr-2" />
                  API 集成
                </Button>
              </CardContent>
            </Card>

            {/* 帮助和支持 */}
            <Card>
              <CardHeader>
                <CardTitle>帮助和支持</CardTitle>
                <CardDescription>获取帮助和了解新功能</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="ghost" className="w-full justify-start">
                  📖 使用指南
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  💬 联系客服
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  🎯 功能建议
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  🔔 更新日志
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
