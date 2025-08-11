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
  Sparkles,
  ChevronRight,
  Play,
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
        
        <Tabs defaultValue="workflow" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="workflow">工作流程</TabsTrigger>
            <TabsTrigger value="demo">操作演示</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[500px] mt-4">
            <TabsContent value="workflow" className="space-y-4 px-1">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-3">🚀 三步快速上手</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-blue-600 font-bold">1</span>
                    </div>
                    <div className="font-medium mb-1">选择文本</div>
                    <div className="text-gray-600">在编辑器中选中文本，点击浮动按钮</div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-blue-600 font-bold">2</span>
                    </div>
                    <div className="font-medium mb-1">选择功能</div>
                    <div className="text-gray-600">从6大功能中选择或直接输入需求</div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-blue-600 font-bold">3</span>
                    </div>
                    <div className="font-medium mb-1">执行处理</div>
                    <div className="text-gray-600">点击发送，AI即时处理您的请求</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-green-600" />
                  @提及系统说明
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <p>类似 Cursor 的 @提及系统，精确控制AI操作：</p>
                  <ul className="space-y-1 ml-4">
                    <li className="flex gap-2">
                      <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span><strong>@文本</strong>：选中的文本作为上下文</span>
                    </li>
                    <li className="flex gap-2">
                      <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span><strong>@操作</strong>：功能选项作为指令队列</span>
                    </li>
                    <li className="flex gap-2">
                      <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span><strong>批量处理</strong>：同时选择多个项目</span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="demo" className="space-y-4 px-1">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-dashed border-gray-400 rounded-lg p-8 text-center">
                <div className="w-full h-64 bg-white/50 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-gray-500 flex flex-col items-center gap-3">
                    <Play className="h-12 w-12" />
                    <div className="text-lg font-medium">互动演示动画</div>
                    <div className="text-sm">实时操作演示将在这里显示</div>
                  </div>
                </div>
                <div className="flex justify-center gap-3">
                  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                    播放演示
                  </button>
                  <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
                    暂停
                  </button>
                  <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                    重新开始
                  </button>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}