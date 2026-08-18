// ==================== 基础类型 ====================

export type ID = string

export type TaskStatus = 'inbox' | 'todo' | 'in_progress' | 'done'
export type Priority = 'P1' | 'P2' | 'P3' | 'P4'

export type InspirationStatus = 'pending' | 'ready' | 'creating' | 'used'
export type ContentType = 'wechat' | 'video'

export type ContentStage =
  | 'topic'      // 输入主题
  | 'insight'    // 提炼观点
  | 'title'      // 生成标题
  | 'outline'    // 生成大纲
  | 'draft'      // 生成初稿
  | 'review'     // 内容检查
  | 'final'      // 定稿

export type VideoStage =
  | 'topic'       // 主题
  | 'opinion'     // 一句话观点
  | 'hook'        // 3秒开头
  | 'structure'   // 视频结构
  | 'script'      // 完整口播稿
  | 'title'       // 视频标题
  | 'cover'       // 封面文案

// ==================== 任务 ====================

export interface Task {
  id: ID
  title: string
  description?: string
  project?: string
  tags: string[]
  status: TaskStatus
  priority: Priority
  dueDate?: string      // ISO date string
  plannedDate?: string  // ISO date string
  estimatedTime?: number // 预计分钟
  actualTime?: number    // 实际分钟
  createdAt: string
  completedAt?: string
  source: 'manual' | 'ai_parsed' | 'from_content' | 'from_review'
  contentId?: ID         // 关联内容ID
  isTop3?: boolean
}

// ==================== 灵感 ====================

export interface Inspiration {
  id: ID
  content: string
  createdAt: string
  tags: string[]
  status: InspirationStatus
  recommendedType?: ContentType
  relatedTopicId?: ID
}

// ==================== 内容（公众号/视频） ====================

export interface ContentReview {
  score: number
  issues: {
    title: string
    reason: string
    suggestion: string
  }[]
  recommendedOpening?: string
  recommendedEnding?: string
  recommendedSentences?: { original: string; suggested: string }[]
}

export interface WeChatContent {
  id: ID
  type: 'wechat'
  stage: ContentStage
  topic: string
  insight?: {
    targetAudience?: string
    coreProblem?: string
    coreViewpoint?: string
    contentValue?: string
  }
  titles?: string[]
  selectedTitle?: string
  outline?: string
  draft?: string
  reviewResult?: ContentReview
  optimizedDraft?: string
  finalContent?: string
  createdAt: string
  updatedAt: string
  status: 'draft' | 'final'
}

export interface VideoContent {
  id: ID
  type: 'video'
  stage: VideoStage
  topic: string
  opinion?: string
  hooks?: string[]
  selectedHook?: string
  structure?: { label: string; content: string }[]
  script?: string
  titles?: string[]
  selectedTitle?: string
  coverText?: string
  reviewResult?: ContentReview
  optimizedScript?: string
  finalContent?: string
  createdAt: string
  updatedAt: string
  status: 'draft' | 'final'
}

export type Content = WeChatContent | VideoContent

// ==================== 每日复盘 ====================

export interface DailyReview {
  id: ID
  date: string  // YYYY-MM-DD
  completedSummary?: string
  uncompletedSummary?: string
  blockers?: string
  stats: {
    plannedCount: number
    completedCount: number
    completionRate: number
  }
  keyAchievements: string[]
  uncompletedTasks: { id: ID; title: string }[]
  issues: string[]
  tomorrowSuggestions: string[]
  createdAt: string
}

// ==================== 用户设置 ====================

export interface UserSettings {
  id: string  // always 'default'
  // 工作信息
  workType?: string
  mainProjects?: string
  dailyWorkHours?: number
  deepWorkHours?: number
  // 内容档案
  contentPlatforms?: string[]
  contentField?: string
  targetAudience?: string
  contentStyle?: string
  dislikedExpressions?: string
  articleLength?: string
  videoLength?: string
  // AI 设置
  aiMode: 'mock' | 'api'
  apiKey?: string
  // 是否已初始化 demo 数据
  demoDataLoaded?: boolean
}

// ==================== 今日计划 ====================

export interface TodayPlan {
  top3: Task[]
  deepWork: Task[]
  quickTasks: Task[]
  canPostpone: Task[]
  totalEstimatedHours: number
  availableHours: number
  overload: boolean
  overloadMessage?: string
}
