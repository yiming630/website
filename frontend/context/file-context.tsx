"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

// 文件上下文类型定义
interface FileContextType {
  file: File | null // 当前选中的文件
  setFile: (file: File | null) => void // 设置文件的函数
}

// 创建文件上下文
const FileContext = createContext<FileContextType | undefined>(undefined)

/**
 * 文件上下文提供者组件
 * 用于在整个应用中共享文件状态
 */
export function FileProvider({ children }: { children: React.ReactNode }) {
  const [file, setFile] = useState<File | null>(null)

  return <FileContext.Provider value={{ file, setFile }}>{children}</FileContext.Provider>
}

/**
 * 使用文件上下文的Hook
 * 提供文件状态和设置函数
 */
export function useFile() {
  const context = useContext(FileContext)
  if (context === undefined) {
    throw new Error("useFile must be used within a FileProvider")
  }
  return context
}
