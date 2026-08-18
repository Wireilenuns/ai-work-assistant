import { format, parseISO, isToday, isThisWeek, addDays, differenceInDays, startOfDay, endOfDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 获取当前 ISO 日期字符串 (YYYY-MM-DD)
export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

// 格式化日期为中文
export function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const date = parseISO(dateStr)
    return format(date, 'M月d日 EEEE', { locale: zhCN })
  } catch {
    return dateStr
  }
}

// 格式化日期时间
export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const date = parseISO(dateStr)
    return format(date, 'M月d日 HH:mm', { locale: zhCN })
  } catch {
    return dateStr
  }
}

// 获取问候语
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
}

// 获取完整日期显示
export function getFullDateDisplay(): string {
  return format(new Date(), 'yyyy年M月d日 EEEE', { locale: zhCN })
}

// 判断是否今天
export function isDateToday(dateStr?: string): boolean {
  if (!dateStr) return false
  try {
    return isToday(parseISO(dateStr))
  } catch {
    return false
  }
}

// 判断是否本周
export function isDateThisWeek(dateStr?: string): boolean {
  if (!dateStr) return false
  try {
    return isThisWeek(parseISO(dateStr), { weekStartsOn: 1 })
  } catch {
    return false
  }
}

// 判断是否已过期
export function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false
  try {
    const date = parseISO(dateStr)
    return date < startOfDay(new Date())
  } catch {
    return false
  }
}

// 判断是否即将到期（3天内）
export function isUpcoming(dateStr?: string): boolean {
  if (!dateStr) return false
  try {
    const date = parseISO(dateStr)
    const now = new Date()
    const diff = differenceInDays(date, now)
    return diff >= 0 && diff <= 3
  } catch {
    return false
  }
}

// 获取相对时间描述
export function getRelativeDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const date = parseISO(dateStr)
    const now = new Date()
    const diff = differenceInDays(date, startOfDay(now))
    if (diff === 0) return '今天'
    if (diff === 1) return '明天'
    if (diff === -1) return '昨天'
    if (diff > 0 && diff <= 7) return `${diff}天后`
    if (diff < 0 && diff >= -7) return `${Math.abs(diff)}天前`
    return format(date, 'M月d日', { locale: zhCN })
  } catch {
    return dateStr
  }
}

// 格式化分钟为小时分钟
export function formatMinutes(minutes?: number): string {
  if (!minutes || minutes === 0) return ''
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

// 生成唯一ID
export function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// 获取当前 ISO 时间戳
export function nowISO(): string {
  return new Date().toISOString()
}

// 优先级颜色映射
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'P1': return 'bg-red-100 text-red-700'
    case 'P2': return 'bg-orange-100 text-orange-700'
    case 'P3': return 'bg-blue-100 text-blue-700'
    case 'P4': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'P1': return 'P1 · 今天必须'
    case 'P2': return 'P2 · 重要'
    case 'P3': return 'P3 · 普通'
    case 'P4': return 'P4 · 可推迟'
    default: return priority
  }
}

// 状态标签
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'inbox': return '收件箱'
    case 'todo': return '待办'
    case 'in_progress': return '进行中'
    case 'done': return '已完成'
    default: return status
  }
}

// 灵感状态标签
export function getInspirationStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return '待整理'
    case 'ready': return '可创作'
    case 'creating': return '创作中'
    case 'used': return '已使用'
    default: return status
  }
}

export function getInspirationStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-gray-100 text-gray-600'
    case 'ready': return 'bg-green-100 text-green-700'
    case 'creating': return 'bg-blue-100 text-blue-700'
    case 'used': return 'bg-purple-100 text-purple-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

// 内容阶段标签
export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    topic: '输入主题',
    insight: '提炼观点',
    title: '生成标题',
    outline: '生成大纲',
    draft: '生成初稿',
    review: '内容检查',
    final: '定稿',
    opinion: '一句话观点',
    hook: '3秒开头',
    structure: '视频结构',
    script: '口播稿',
    cover: '封面文案',
  }
  return labels[stage] || stage
}
