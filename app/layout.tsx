import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { FileProvider } from "@/context/file-context"

// 配置Inter字体
const inter = Inter({ subsets: ["latin"] })

// 页面元数据配置
export const metadata: Metadata = {
  title: "格式译专家 - 专业文档翻译平台",
  description: "专业的文档翻译服务，支持多种格式，保持原文档格式不变",
    generator: 'v0.dev'
}

/**
 * 根布局组件
 * 包含全局样式和文件上下文提供者
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <FileProvider>{children}</FileProvider>
      </body>
    </html>
  )
}
