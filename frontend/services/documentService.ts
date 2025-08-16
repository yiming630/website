/**
 * 文档服务 - 处理文件的新建、打开、保存、导入导出等操作
 */

import { saveAs } from 'file-saver'
import * as mammoth from 'mammoth'

// 文档接口定义
export interface Document {
  id: string
  title: string
  content: string
  format?: string
  createdAt: Date
  updatedAt: Date
  metadata?: {
    author?: string
    version?: string
    tags?: string[]
  }
}

// 文档存储键名
const STORAGE_KEY = 'seekhub_documents'
const CURRENT_DOC_KEY = 'seekhub_current_document'
const AUTO_SAVE_KEY = 'seekhub_autosave'

/**
 * 文档服务类
 */
export class DocumentService {
  /**
   * 创建新文档
   */
  static createNewDocument(): Document {
    return {
      id: `doc_${Date.now()}`,
      title: '未命名文档',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        author: 'User',
        version: '1.0.0',
        tags: []
      }
    }
  }

  /**
   * 保存文档到本地存储
   */
  static async saveDocument(doc: Document): Promise<void> {
    try {
      // 更新时间戳
      doc.updatedAt = new Date()
      
      // 保存到 localStorage
      localStorage.setItem(CURRENT_DOC_KEY, JSON.stringify(doc))
      
      // 同时保存到文档列表
      const docs = this.getAllDocuments()
      const index = docs.findIndex(d => d.id === doc.id)
      if (index >= 0) {
        docs[index] = doc
      } else {
        docs.push(doc)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
      
      return Promise.resolve()
    } catch (error) {
      console.error('保存文档失败:', error)
      throw new Error('保存文档失败')
    }
  }

  /**
   * 自动保存（用于实时保存）
   */
  static async autoSave(content: string, title?: string): Promise<void> {
    try {
      const autoSaveData = {
        content,
        title,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(autoSaveData))
    } catch (error) {
      console.error('自动保存失败:', error)
    }
  }

  /**
   * 获取自动保存的内容
   */
  static getAutoSavedContent(): { content: string; title?: string; timestamp: string } | null {
    try {
      const data = localStorage.getItem(AUTO_SAVE_KEY)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  /**
   * 获取所有文档
   */
  static getAllDocuments(): Document[] {
    try {
      const docs = localStorage.getItem(STORAGE_KEY)
      return docs ? JSON.parse(docs) : []
    } catch {
      return []
    }
  }

  /**
   * 获取当前文档
   */
  static getCurrentDocument(): Document | null {
    try {
      const doc = localStorage.getItem(CURRENT_DOC_KEY)
      return doc ? JSON.parse(doc) : null
    } catch {
      return null
    }
  }

  /**
   * 打开文档（从本地文件）
   */
  static async openDocument(file: File): Promise<Document> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string
          let processedContent = content
          
          // 根据文件类型处理
          if (file.name.endsWith('.docx')) {
            // 处理 Word 文档
            const arrayBuffer = e.target?.result as ArrayBuffer
            const result = await mammoth.convertToHtml({ arrayBuffer })
            processedContent = result.value
          } else if (file.name.endsWith('.html')) {
            // HTML 文件直接使用
            processedContent = content
          } else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            // 纯文本转换为 HTML
            processedContent = `<p>${content.replace(/\n/g, '</p><p>')}</p>`
          }
          
          const doc: Document = {
            id: `doc_${Date.now()}`,
            title: file.name.replace(/\.[^/.]+$/, ''), // 移除扩展名
            content: processedContent,
            format: file.type,
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          resolve(doc)
        } catch (error) {
          reject(new Error('读取文件失败'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('文件读取错误'))
      }
      
      // 根据文件类型选择读取方式
      if (file.name.endsWith('.docx')) {
        reader.readAsArrayBuffer(file)
      } else {
        reader.readAsText(file)
      }
    })
  }

  /**
   * 导出为 Word 文档
   */
  static async exportToWord(content: string, filename: string = 'document.docx'): Promise<void> {
    try {
      // 创建 HTML 内容，包含样式
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Times New Roman', serif; line-height: 1.6; }
            h1 { font-size: 24pt; }
            h2 { font-size: 18pt; }
            h3 { font-size: 14pt; }
            p { margin: 10px 0; }
          </style>
        </head>
        <body>
          ${content}
        </body>
        </html>
      `
      
      // 创建 Blob 并下载
      const blob = new Blob([htmlContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      })
      saveAs(blob, filename)
    } catch (error) {
      console.error('导出 Word 失败:', error)
      throw new Error('导出 Word 文档失败')
    }
  }

  /**
   * 导出为 PDF
   */
  static async exportToPDF(content: string, filename: string = 'document.pdf'): Promise<void> {
    try {
      // 暂时使用打印功能代替 PDF 导出
      // 用户可以在打印对话框中选择"另存为 PDF"
      await this.printDocument(content, filename.replace('.pdf', ''))
      
      // 提示用户
      alert('请在打印对话框中选择"另存为 PDF"来保存 PDF 文件')
    } catch (error) {
      console.error('导出 PDF 失败:', error)
      throw new Error('导出 PDF 失败')
    }
  }

  /**
   * 导出为 HTML
   */
  static async exportToHTML(content: string, filename: string = 'document.html'): Promise<void> {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${filename.replace('.html', '')}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; }
            p { margin: 10px 0; }
            ul, ol { margin: 10px 0; padding-left: 30px; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            img { max-width: 100%; height: auto; }
            a { color: #0066cc; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          ${content}
        </body>
        </html>
      `
      
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      saveAs(blob, filename)
    } catch (error) {
      console.error('导出 HTML 失败:', error)
      throw new Error('导出 HTML 失败')
    }
  }

  /**
   * 导出为纯文本
   */
  static async exportToText(content: string, filename: string = 'document.txt'): Promise<void> {
    try {
      // 移除 HTML 标签
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = content
      const textContent = tempDiv.textContent || tempDiv.innerText || ''
      
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
      saveAs(blob, filename)
    } catch (error) {
      console.error('导出文本失败:', error)
      throw new Error('导出文本失败')
    }
  }

  /**
   * 打印文档
   */
  static async printDocument(content: string, title: string = '文档'): Promise<void> {
    try {
      // 创建打印窗口
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('无法打开打印窗口')
      }
      
      // 写入内容
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            @media print {
              body { 
                font-family: 'Times New Roman', serif; 
                line-height: 1.6;
                margin: 1in;
              }
              h1 { page-break-before: auto; }
              table { page-break-inside: avoid; }
              img { max-width: 100%; page-break-inside: avoid; }
            }
            body { 
              font-family: 'Times New Roman', serif; 
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${content}
        </body>
        </html>
      `)
      
      printWindow.document.close()
      
      // 等待内容加载完成后打印
      printWindow.onload = () => {
        printWindow.print()
        // 打印完成后关闭窗口
        printWindow.onafterprint = () => {
          printWindow.close()
        }
      }
    } catch (error) {
      console.error('打印失败:', error)
      throw new Error('打印文档失败')
    }
  }

  /**
   * 导入 Word 文档
   */
  static async importFromWord(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          const result = await mammoth.convertToHtml({ arrayBuffer })
          resolve(result.value)
        } catch (error) {
          reject(new Error('导入 Word 文档失败'))
        }
      }
      
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * 导入 PDF（需要 PDF.js 库）
   */
  static async importFromPDF(file: File): Promise<string> {
    // 这里需要集成 PDF.js 库来解析 PDF
    // 暂时返回提示信息
    return Promise.resolve('<p>PDF 导入功能正在开发中...</p>')
  }

  /**
   * 导入纯文本
   */
  static async importFromText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const text = e.target?.result as string
        // 转换换行符为段落
        const html = text.split('\n\n')
          .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
          .join('')
        resolve(html)
      }
      
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsText(file)
    })
  }
}

export default DocumentService
