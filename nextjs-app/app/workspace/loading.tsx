import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * 工作台加载状态组件
 * 显示工作台页面的骨架屏
 */
export default function WorkspaceLoading() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 左侧面板骨架 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* 头部骨架 */}
        <div className="p-4 border-b border-gray-200">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-9 w-full" />
        </div>

        {/* 标题骨架 */}
        <div className="p-4 border-b border-gray-200">
          <Skeleton className="h-5 w-24 mx-auto" />
        </div>

        {/* 搜索框骨架 */}
        <div className="p-4 border-b border-gray-200">
          <Skeleton className="h-9 w-full" />
        </div>

        {/* 任务列表骨架 */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="p-3 rounded-lg">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 中央面板骨架 */}
      <div className="flex-1 bg-white p-8">
        <div className="max-w-4xl mx-auto">
          {/* 欢迎区域骨架 */}
          <div className="text-center mb-8">
            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>

          {/* 步骤说明骨架 */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="text-center">
                <Skeleton className="h-12 w-12 rounded-lg mx-auto mb-3" />
                <Skeleton className="h-5 w-20 mx-auto mb-2" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            ))}
          </div>

          {/* 快速入门提示骨架 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-8" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 右侧用户面板骨架 */}
      <div className="fixed top-4 right-4 z-50">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  )
}
