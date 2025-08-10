import {
  FileText,
  Search,
  Edit3,
  CheckCircle,
  Shield,
  HelpCircle,
  Brain,
  Globe,
} from "lucide-react"

// 模拟原文内容 - 分成句子数组
export const originalSentences = [
  "人工智能的浪潮：重塑未来与我们的角色",
  "人工智能（AI）正以前所未有的力量，化身为一场深刻的科技革命浪潮，席卷全球。",
  "它不再是科幻小说的遥远构想，而是已经渗透到我们日常生活与工作的方方面面，从智能推荐系统到复杂的医疗诊断。",
  "面对这场变革，理解其内在的机遇、挑战以及我们在其中的位置，显得至关重要。",
  "机遇的黎明：效率与创新的双重奏",
  "AI 最直观的贡献在于对生产效率的巨大提升。",
  "它能将人类从重复、繁琐的劳动中解放出来，自动化处理海量数据，让专业人士能更专注于需要创造力和战略思维的核心任务。",
  "同时，AI 也正成为创新的强大催化剂。",
  "在科研领域，它加速了新材料的发现和药物的研发；在艺术领域，它成为画家、音乐家和设计师的灵感伙伴，共同探索表达的全新疆域。",
  "这曲由效率与创新共同谱写的双重奏，正在为社会发展注入澎湃的动力。",
  "挑战的深水区：责任与适应的必修课",
  "然而，技术的飞跃也伴随着严峻的挑战。",
  "算法的偏见、数据的隐私安全、决策的透明度与问责制，都是亟待解决的伦理难题。",
  "此外，AI 对传统就业市场的冲击不容忽视，这要求我们的教育体系和社会结构做出深刻调整，推行终身学习的理念，帮助劳动者适应新的人机协作模式。",
  "如何制定合理的规则，确保AI朝着对人类有益的方向发展，是我们共同的必修课。",
  "人的角色：驾驭而非替代的智慧",
  "在这场变革中，一个核心问题是：人的价值何在？",
  "答案并非悲观的\"被替代\"，而是充满希望的\"再定位\"。",
  "AI 擅长计算和模式识别，但人类独有的情感智能、批判性思维、复杂道德判断以及真正的创造力，是机器难以企及的。",
  "我们未来的角色，将从任务的执行者，转变为AI工具的驾驭者、价值的判断者和方向的引领者。",
]

// 模拟译文内容
export const translatedContent = `The Tide of Artificial Intelligence: Reshaping the Future and Our Role

Artificial Intelligence (AI) is surging across the globe as a profound technological revolution with unprecedented power. It is no longer a distant concept from science fiction but has permeated every aspect of our daily lives and work, from intelligent recommendation systems to complex medical diagnostics. In the face of this transformation, it is crucial to understand its inherent opportunities, challenges, and our place within it.

The Dawn of Opportunity: A Duet of Efficiency and Innovation

The most immediate contribution of AI lies in its immense enhancement of productivity. It can liberate humans from repetitive and tedious labor, automating the processing of massive amounts of data and allowing professionals to focus more on core tasks that require creativity and strategic thinking. Simultaneously, AI is becoming a powerful catalyst for innovation. In scientific research, it accelerates the discovery of new materials and the development of pharmaceuticals; in the arts, it serves as an inspirational partner for painters, musicians, and designers, jointly exploring new frontiers of expression. This duet, composed of efficiency and innovation, is injecting powerful momentum into social development.

The Deep Waters of Challenge: A Required Course in Responsibility and Adaptation

However, this technological leap is accompanied by stern challenges. Algorithmic bias, data privacy and security, and the transparency and accountability of decision-making are all pressing ethical dilemmas that need to be resolved. Furthermore, the impact of AI on the traditional job market cannot be ignored. This demands that our educational systems and social structures undergo profound adjustments, promoting the concept of lifelong learning and helping the workforce adapt to new models of human-machine collaboration. How to establish reasonable regulations to ensure AI develops in a direction beneficial to humanity is a required course for us all.

The Human Role: The Wisdom of Steering, Not Replacing

A central question in this transformation is: what is the value of human beings? The answer is not a pessimistic 'replacement,' but a hopeful 'repositioning.' AI excels at computation and pattern recognition, but uniquely human attributes such as emotional intelligence, critical thinking, complex ethical judgment, and true creativity are difficult for machines to attain. Our future role will shift from being executors of tasks to being the drivers of AI tools, the arbiters of value, and the navigators of direction. Wisely using AI as a powerful tool—making it a partner that augments human capabilities rather than a competitor—tests our foresight and wisdom.`

// AI新功能选项 - 6个核心功能
export const aiOptions = [
  { 
    icon: FileText, 
    label: "多版本译文", 
    value: "multiple_versions",
    description: "为选中文字提供不同风格的译文版本"
  },
  { 
    icon: Search, 
    label: "专业词汇检查", 
    value: "term_check",
    description: "联网搜索验证专业词汇的正确性"
  },
  { 
    icon: Edit3, 
    label: "用词斟酌", 
    value: "word_refinement",
    description: "AI提供多种词汇选择供用户挑选"
  },
  { 
    icon: CheckCircle, 
    label: "语法拼写检查", 
    value: "grammar_spell",
    description: "检查并修正语法和拼写错误"
  },
  { 
    icon: Shield, 
    label: "翻译质量自检", 
    value: "quality_check",
    description: "检查是否有信息缺失或表达不当"
  },
  { 
    icon: HelpCircle, 
    label: "提问", 
    value: "ask_question",
    description: "向AI提问关于选中文字的任何问题"
  },
]

// 增强功能选项
export const enhancedOptions = [
  { icon: Search, label: "数据库检索", value: "database" },
  { icon: Brain, label: "深度思考", value: "deep" },
  { icon: Globe, label: "联网搜索", value: "web" },
]

// AI助手功能分类选项 - 已移除，使用新的6个核心功能
export const aiAssistantCategories = []

// 默认协作者
export const defaultCollaborators = [
  { id: '1', name: '张三', email: 'zhangsan@example.com' },
  { id: '2', name: '李四', email: 'lisi@example.com' },
  { id: '3', name: '王五', email: 'wangwu@example.com' },
  { id: '4', name: '赵六', email: 'zhaoliu@example.com' },
]