"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Mountain,
  FileIcon,
  ArrowLeft,
  Languages,
  FileText,
  FileDiff,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Edit3,
  Download,
  CheckCircle,
  Maximize2,
  X,
  Shield,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

export default function PreviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isReaderMode = searchParams.get('mode') === 'reader'
  
  const [previewMode, setPreviewMode] = useState<"side-by-side" | "single">("side-by-side")
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null)
  const [showFeedbackInput, setShowFeedbackInput] = useState(false)
  const [fullscreenPanel, setFullscreenPanel] = useState<"original" | "translated" | null>(null)

  // 普通读者模式
  if (isReaderMode) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        {/* 头部 */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Mountain className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-gray-900">格式译专家</span>
            </Link>
          </div>
        </header>

        {/* 主要内容 */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          <div className="max-w-2xl w-full">
            <Card>
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  {/* 成功图标 */}
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  
                  {/* 成功消息 */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">翻译完成！</h2>
                    <p className="text-gray-600">您的文档已经成功翻译，可以下载了</p>
                  </div>
                  
                  {/* 文件信息 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-center gap-3">
                      <FileIcon className="h-6 w-6 text-blue-500" />
                      <div>
                        <p className="font-semibold text-gray-900">文档名称.pdf</p>
                        <p className="text-sm text-gray-500">翻译完成 • 2.5 MB</p>
                      </div>
                    </div>
                    
                    {/* Extended file metadata for reader mode */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>云端存储</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3 text-blue-500" />
                          <span>安全加密</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span>3分钟前完成</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3 text-purple-500" />
                          <span>PDF格式</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 下载按钮 */}
                  <div className="space-y-3">
                    <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Download className="mr-2 h-5 w-5" />
                      下载译文
                    </Button>
                    
                    <Button variant="outline" size="lg" className="w-full" onClick={() => router.push('/workspace')}>
                      翻译新文档
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    译文将保持原文档的格式和排版
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // 专业译者模式
  return (
    <>
      <div className={cn("flex flex-col h-screen bg-gray-50", fullscreenPanel && "hidden")}>
        {/* 头部 */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/workspace" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回工作台
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <Link href="/" className="flex items-center gap-2">
                <Mountain className="h-6 w-6 text-blue-600" />
                <span className="font-semibold text-gray-900">格式译专家</span>
              </Link>
            </div>

            {/* 操作按钮组 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 text-sm">
                <FileIcon className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-gray-900">文档名称.pdf</span>
                <span className="text-gray-500">• 翻译完成</span>
              </div>
              
              {/* 预览模式切换 */}
              <div className="bg-gray-100 rounded-lg p-1">
                <div className="text-xs text-gray-600 text-center mb-1 px-2">预览模式</div>
                <div className="flex gap-1">
                  <Button
                    variant={previewMode === "side-by-side" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setPreviewMode("side-by-side")}
                    className="h-8"
                  >
                    <FileDiff className="w-4 h-4 mr-1" />
                    对照
                  </Button>
                  <Button
                    variant={previewMode === "single" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setPreviewMode("single")}
                    className="h-8"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    单页
                  </Button>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/translate-editor">
                    <Edit3 className="w-4 h-4 mr-2" />
                    编辑译文
                  </Link>
                </Button>
                
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Download className="mr-2 h-4 w-4" />
                  下载译文
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* 主要内容 - 全屏预览区域 */}
        <div className="flex-1 flex p-4 gap-4 overflow-hidden">
          {/* 原文预览 */}
          <div
            className={cn(
              "flex-1 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden",
              previewMode === "single" && "hidden"
            )}
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                原文预览
              </h4>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFullscreenPanel("original")}
                  title="全屏预览"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  下载原文
                </Button>
              </div>
            </div>
            <div className="flex-1 p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="max-w-4xl mx-auto">
                <div className="prose prose-lg max-w-none">
                  <h1>人工智能的浪潮：重塑未来与我们的角色</h1>
                  <p>
                    人工智能（AI）正以前所未有的力量，化身为一场深刻的科技革命浪潮，席卷全球。
                    它不再是科幻小说的遥远构想，而是已经渗透到我们日常生活与工作的方方面面，从智能推荐系统到复杂的医疗诊断。
                    面对这场变革，理解其内在的机遇、挑战以及我们在其中的位置，显得至关重要。
                  </p>
                  <h2>机遇的黎明：效率与创新的双重奏</h2>
                  <p>
                    AI 最直观的贡献在于对生产效率的巨大提升。
                    它能将人类从重复、繁琐的劳动中解放出来，自动化处理海量数据，让专业人士能更专注于需要创造力和战略思维的核心任务。
                    同时，AI 也正成为创新的强大催化剂。
                    在科研领域，它加速了新材料的发现和药物的研发；在艺术领域，它成为画家、音乐家和设计师的灵感伙伴，共同探索表达的全新疆域。
                    这曲由效率与创新共同谱写的双重奏，正在为社会发展注入澎湃的动力。
                  </p>
                  <h2>挑战的深水区：责任与适应的必修课</h2>
                  <p>
                    然而，技术的飞跃也伴随着严峻的挑战。
                    算法的偏见、数据的隐私安全、决策的透明度与问责制，都是亟待解决的伦理难题。
                    此外，AI 对传统就业市场的冲击不容忽视，这要求我们的教育体系和社会结构做出深刻调整，推行终身学习的理念，帮助劳动者适应新的人机协作模式。
                    如何制定合理的规则，确保AI朝着对人类有益的方向发展，是我们共同的必修课。
                  </p>
                  <h2>人的角色：驾驭而非替代的智慧</h2>
                  <p>
                    在这场变革中，一个核心问题是：人的价值何在？
                    答案并非悲观的"被替代"，而是充满希望的"再定位"。
                    AI 擅长计算和模式识别，但人类独有的情感智能、批判性思维、复杂道德判断以及真正的创造力，是机器难以企及的。
                    我们未来的角色，将从任务的执行者，转变为AI工具的驾驭者、价值的判断者和方向的引领者。
                    智慧地使用AI这把"利器"，让它成为增强人类能力的伙伴，而非竞争对手，这考验着我们的远见与智慧。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 译文预览 */}
          <div className={cn(
            "flex-1 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden",
            previewMode === "single" && "flex-[2]"
          )}>
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Languages className="h-5 w-5" />
                译文预览
              </h4>
              <div className="flex items-center gap-3">
                {/* 翻译质量反馈 */}
                <div className="flex gap-1">
                  <Button
                    variant={feedback === "good" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setFeedback("good")
                      setShowFeedbackInput(false)
                    }}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={feedback === "bad" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setFeedback("bad")
                      setShowFeedbackInput(true)
                    }}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFullscreenPanel("translated")}
                  title="全屏预览"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  下载译文
                </Button>
              </div>
            </div>
            <div className="flex-1 p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="max-w-4xl mx-auto">
                <div className="prose prose-lg max-w-none">
                  <h1>The Tide of Artificial Intelligence: Reshaping the Future and Our Role</h1>
                  <p>
                    Artificial Intelligence (AI) is surging across the globe as a profound technological revolution with unprecedented power. 
                    It is no longer a distant concept from science fiction but has permeated every aspect of our daily lives and work, from intelligent recommendation systems to complex medical diagnostics. 
                    In the face of this transformation, it is crucial to understand its inherent opportunities, challenges, and our place within it.
                  </p>
                  <h2>The Dawn of Opportunity: A Duet of Efficiency and Innovation</h2>
                  <p>
                    The most immediate contribution of AI lies in its immense enhancement of productivity. 
                    It can liberate humans from repetitive and tedious labor, automating the processing of massive amounts of data and allowing professionals to focus more on core tasks that require creativity and strategic thinking. 
                    Simultaneously, AI is becoming a powerful catalyst for innovation. 
                    In scientific research, it accelerates the discovery of new materials and the development of pharmaceuticals; in the arts, it serves as an inspirational partner for painters, musicians, and designers, jointly exploring new frontiers of expression. 
                    This duet, composed of efficiency and innovation, is injecting powerful momentum into social development.
                  </p>
                  <h2>The Deep Waters of Challenge: A Required Course in Responsibility and Adaptation</h2>
                  <p>
                    However, this technological leap is accompanied by stern challenges. 
                    Algorithmic bias, data privacy and security, and the transparency and accountability of decision-making are all pressing ethical dilemmas that need to be resolved. 
                    Furthermore, the impact of AI on the traditional job market cannot be ignored. This demands that our educational systems and social structures undergo profound adjustments, promoting the concept of lifelong learning and helping the workforce adapt to new models of human-machine collaboration. 
                    How to establish reasonable regulations to ensure AI develops in a direction beneficial to humanity is a required course for us all.
                  </p>
                  <h2>The Human Role: The Wisdom of Steering, Not Replacing</h2>
                  <p>
                    A central question in this transformation is: what is the value of human beings? 
                    The answer is not a pessimistic 'replacement,' but a hopeful 'repositioning.' 
                    AI excels at computation and pattern recognition, but uniquely human attributes such as emotional intelligence, critical thinking, complex ethical judgment, and true creativity are difficult for machines to attain. 
                    Our future role will shift from being executors of tasks to being the drivers of AI tools, the arbiters of value, and the navigators of direction. 
                    Wisely using AI as a powerful tool—making it a partner that augments human capabilities rather than a competitor—tests our foresight and wisdom.
                  </p>
                </div>
              </div>
            </div>
            
            {/* 反馈输入框 */}
            {showFeedbackInput && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="max-w-2xl mx-auto">
                  <Textarea 
                    placeholder="请告诉我们哪里需要改进..." 
                    className="mb-3"
                    rows={3}
                  />
                  <Button size="sm">提交反馈</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 全屏预览模式 */}
      {fullscreenPanel && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* 全屏头部 */}
          <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {fullscreenPanel === "original" ? (
                <>
                  <FileText className="h-5 w-5" />
                  原文全屏预览
                </>
              ) : (
                <>
                  <Languages className="h-5 w-5" />
                  译文全屏预览
                </>
              )}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFullscreenPanel(null)}
              className="text-white hover:bg-gray-800"
            >
              <X className="h-5 w-5 mr-2" />
              退出全屏
            </Button>
          </header>
          
          {/* 全屏内容 */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-12">
              <div className="prose prose-lg max-w-none">
                {fullscreenPanel === "original" ? (
                  <>
                    <h1>人工智能的浪潮：重塑未来与我们的角色</h1>
                    <p>
                      人工智能（AI）正以前所未有的力量，化身为一场深刻的科技革命浪潮，席卷全球。
                      它不再是科幻小说的遥远构想，而是已经渗透到我们日常生活与工作的方方面面，从智能推荐系统到复杂的医疗诊断。
                      面对这场变革，理解其内在的机遇、挑战以及我们在其中的位置，显得至关重要。
                    </p>
                    <h2>机遇的黎明：效率与创新的双重奏</h2>
                    <p>
                      AI 最直观的贡献在于对生产效率的巨大提升。
                      它能将人类从重复、繁琐的劳动中解放出来，自动化处理海量数据，让专业人士能更专注于需要创造力和战略思维的核心任务。
                      同时，AI 也正成为创新的强大催化剂。
                      在科研领域，它加速了新材料的发现和药物的研发；在艺术领域，它成为画家、音乐家和设计师的灵感伙伴，共同探索表达的全新疆域。
                      这曲由效率与创新共同谱写的双重奏，正在为社会发展注入澎湃的动力。
                    </p>
                    <h2>挑战的深水区：责任与适应的必修课</h2>
                    <p>
                      然而，技术的飞跃也伴随着严峻的挑战。
                      算法的偏见、数据的隐私安全、决策的透明度与问责制，都是亟待解决的伦理难题。
                      此外，AI 对传统就业市场的冲击不容忽视，这要求我们的教育体系和社会结构做出深刻调整，推行终身学习的理念，帮助劳动者适应新的人机协作模式。
                      如何制定合理的规则，确保AI朝着对人类有益的方向发展，是我们共同的必修课。
                    </p>
                    <h2>人的角色：驾驭而非替代的智慧</h2>
                    <p>
                      在这场变革中，一个核心问题是：人的价值何在？
                      答案并非悲观的"被替代"，而是充满希望的"再定位"。
                      AI 擅长计算和模式识别，但人类独有的情感智能、批判性思维、复杂道德判断以及真正的创造力，是机器难以企及的。
                      我们未来的角色，将从任务的执行者，转变为AI工具的驾驭者、价值的判断者和方向的引领者。
                      智慧地使用AI这把"利器"，让它成为增强人类能力的伙伴，而非竞争对手，这考验着我们的远见与智慧。
                    </p>
                  </>
                ) : (
                  <>
                    <h1>The Tide of Artificial Intelligence: Reshaping the Future and Our Role</h1>
                    <p>
                      Artificial Intelligence (AI) is surging across the globe as a profound technological revolution with unprecedented power. 
                      It is no longer a distant concept from science fiction but has permeated every aspect of our daily lives and work, from intelligent recommendation systems to complex medical diagnostics. 
                      In the face of this transformation, it is crucial to understand its inherent opportunities, challenges, and our place within it.
                    </p>
                    <h2>The Dawn of Opportunity: A Duet of Efficiency and Innovation</h2>
                    <p>
                      The most immediate contribution of AI lies in its immense enhancement of productivity. 
                      It can liberate humans from repetitive and tedious labor, automating the processing of massive amounts of data and allowing professionals to focus more on core tasks that require creativity and strategic thinking. 
                      Simultaneously, AI is becoming a powerful catalyst for innovation. 
                      In scientific research, it accelerates the discovery of new materials and the development of pharmaceuticals; in the arts, it serves as an inspirational partner for painters, musicians, and designers, jointly exploring new frontiers of expression. 
                      This duet, composed of efficiency and innovation, is injecting powerful momentum into social development.
                    </p>
                    <h2>The Deep Waters of Challenge: A Required Course in Responsibility and Adaptation</h2>
                    <p>
                      However, this technological leap is accompanied by stern challenges. 
                      Algorithmic bias, data privacy and security, and the transparency and accountability of decision-making are all pressing ethical dilemmas that need to be resolved. 
                      Furthermore, the impact of AI on the traditional job market cannot be ignored. This demands that our educational systems and social structures undergo profound adjustments, promoting the concept of lifelong learning and helping the workforce adapt to new models of human-machine collaboration. 
                      How to establish reasonable regulations to ensure AI develops in a direction beneficial to humanity is a required course for us all.
                    </p>
                    <h2>The Human Role: The Wisdom of Steering, Not Replacing</h2>
                    <p>
                      A central question in this transformation is: what is the value of human beings? 
                      The answer is not a pessimistic 'replacement,' but a hopeful 'repositioning.' 
                      AI excels at computation and pattern recognition, but uniquely human attributes such as emotional intelligence, critical thinking, complex ethical judgment, and true creativity are difficult for machines to attain. 
                      Our future role will shift from being executors of tasks to being the drivers of AI tools, the arbiters of value, and the navigators of direction. 
                      Wisely using AI as a powerful tool—making it a partner that augments human capabilities rather than a competitor—tests our foresight and wisdom.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 添加滚动条样式 */}
      <style jsx global>{`
        /* 自定义滚动条样式 */
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </>
  )
} 