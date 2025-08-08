"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AtSign,
  MousePointer,
  MessageSquare,
  Sparkles,
  FileText,
  Search,
  Brain,
  Globe,
  ChevronRight,
  Info,
} from 'lucide-react'

interface AITutorialProps {
  isOpen: boolean
  onClose: () => void
}

export const AITutorial: React.FC<AITutorialProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI 编辑助手使用指南
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="quickstart" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quickstart">快速开始</TabsTrigger>
            <TabsTrigger value="features">核心功能</TabsTrigger>
            <TabsTrigger value="workflow">工作流程</TabsTrigger>
            <TabsTrigger value="tips">使用技巧</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="quickstart" className="space-y-4 px-1">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">🚀 三步快速上手</h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="font-semibold text-blue-700">1.</span>
                    <div>
                      <strong>选择文本</strong>
                      <p className="text-gray-600 mt-1">在编辑器中选中需要处理的文本，点击浮动的"添加到聊天"按钮</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-blue-700">2.</span>
                    <div>
                      <strong>选择操作</strong>
                      <p className="text-gray-600 mt-1">从AI助手提供的功能选项中选择需要的操作，或输入自定义指令</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-blue-700">3.</span>
                    <div>
                      <strong>执行处理</strong>
                      <p className="text-gray-600 mt-1">点击发送按钮，AI将根据您的要求处理文本</p>
                    </div>
                  </li>
                </ol>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-green-600" />
                  @提及系统说明
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <p>本编辑器采用类似 Cursor 的 @提及系统，让您能够精确控制AI的操作范围：</p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex gap-2">
                      <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span><strong>@文本</strong>：选中的文本片段会作为上下文提供给AI</span>
                    </li>
                    <li className="flex gap-2">
                      <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span><strong>@操作</strong>：点击的功能选项会作为指令添加到队列</span>
                    </li>
                    <li className="flex gap-2">
                      <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span><strong>批量处理</strong>：可以同时选择多个文本片段和操作，一次性执行</span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="features" className="space-y-4 px-1">
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-blue-900">📝 核心翻译优化</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="text-blue-600">•</span>
                      <div>
                        <strong>重新翻译</strong>：使用不同算法重新生成译文
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-blue-600">•</span>
                      <div>
                        <strong>多版本译文</strong>：提供多个翻译版本供选择
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-blue-600">•</span>
                      <div>
                        <strong>逐词对照</strong>：显示原文与译文的对应关系
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-green-900">✨ 文本润色与风格调整</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="text-green-600">•</span>
                      <div>
                        <strong>语气调整</strong>：专业、口语化、学术、说服力等风格切换
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-green-600">•</span>
                      <div>
                        <strong>语法检查</strong>：自动检测并修正语法和拼写错误
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-green-600">•</span>
                      <div>
                        <strong>内容调整</strong>：简化复杂内容或扩展简单描述
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-purple-900">🔍 内容理解与信息提取</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="text-purple-600">•</span>
                      <div>
                        <strong>智能问答</strong>：针对文本内容提问获取解答
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-purple-600">•</span>
                      <div>
                        <strong>摘要总结</strong>：快速提取文本核心要点
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-purple-600">•</span>
                      <div>
                        <strong>术语解释</strong>：解释专业术语和概念
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-purple-600">•</span>
                      <div>
                        <strong>信息提取</strong>：提取人名、地点、日期等关键信息
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-3 text-gray-700">🔧 增强功能</h3>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-blue-500" />
                      <span>数据库检索</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <span>深度思考</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-500" />
                      <span>联网搜索</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    注：这三个功能会直接执行，不会被添加到@提及列表
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="workflow" className="space-y-4 px-1">
              <div className="space-y-4">
                <h3 className="font-semibold">📋 典型工作流程</h3>
                
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">场景一：优化整段翻译</h4>
                    <ol className="space-y-2 text-sm">
                      <li>1. 选中需要优化的译文段落</li>
                      <li>2. 点击"添加到聊天"将文本加入</li>
                      <li>3. 选择"语气润色 → 更专业"</li>
                      <li>4. 选择"语法和拼写检查"</li>
                      <li>5. 输入额外要求（如"保持原意的同时让语言更流畅"）</li>
                      <li>6. 点击发送执行所有操作</li>
                    </ol>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">场景二：理解复杂内容</h4>
                    <ol className="space-y-2 text-sm">
                      <li>1. 选中难以理解的段落</li>
                      <li>2. 点击"添加到聊天"</li>
                      <li>3. 选择"总结摘要"了解大意</li>
                      <li>4. 选择"解释关键术语"理解专业词汇</li>
                      <li>5. 直接输入具体问题（如"这段话中的理论依据是什么？"）</li>
                      <li>6. 点击发送获取全面解答</li>
                    </ol>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">场景三：批量处理多段文本</h4>
                    <ol className="space-y-2 text-sm">
                      <li>1. 选中第一段文本，添加到聊天</li>
                      <li>2. 选中第二段文本，添加到聊天</li>
                      <li>3. 选择需要的处理操作（如"重新翻译"）</li>
                      <li>4. 输入统一要求（如"使用相同的术语和风格"）</li>
                      <li>5. 点击发送，AI会依次处理所有文本</li>
                    </ol>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="tips" className="space-y-4 px-1">
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    专业使用技巧
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-2">
                      <span className="text-yellow-700 font-semibold">💡</span>
                      <div>
                        <strong>明确的指令效果更好</strong>
                        <p className="text-gray-600 mt-1">
                          避免模糊指令如"改好一点"，使用具体要求如"将学术语言改为商务邮件风格"
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <span className="text-yellow-700 font-semibold">💡</span>
                      <div>
                        <strong>善用组合操作</strong>
                        <p className="text-gray-600 mt-1">
                          可以同时选择多个操作，如"重新翻译"+"语法检查"+"简化内容"，一次性完成多项优化
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <span className="text-yellow-700 font-semibold">💡</span>
                      <div>
                        <strong>利用上下文关联</strong>
                        <p className="text-gray-600 mt-1">
                          选择相关段落一起处理，AI能更好地理解上下文，保持翻译的一致性
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <span className="text-yellow-700 font-semibold">💡</span>
                      <div>
                        <strong>活用增强功能</strong>
                        <p className="text-gray-600 mt-1">
                          遇到专业内容时启用"数据库检索"，需要背景知识时使用"联网搜索"，复杂问题启用"深度思考"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">⌨️ 快捷操作</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">选中文本后点击浮动按钮</span>
                      <code className="bg-gray-100 px-2 py-0.5 rounded">添加到聊天</code>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">输入框内按回车</span>
                      <code className="bg-gray-100 px-2 py-0.5 rounded">发送消息</code>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">点击 × 图标</span>
                      <code className="bg-gray-100 px-2 py-0.5 rounded">移除@提及</code>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">🎯 最佳实践</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• 处理长文档时，分段进行效果更好</li>
                    <li>• 保存重要的原始文本，以便对比修改效果</li>
                    <li>• 对于专业领域内容，先使用"解释关键术语"了解背景</li>
                    <li>• 批量处理相似内容时，使用统一的指令保持一致性</li>
                    <li>• 充分利用AI的多轮对话能力，逐步优化结果</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}