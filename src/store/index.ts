import { create } from 'zustand'
import { db } from '../data/db'
import type { Task, Inspiration, WeChatContent, VideoContent, DailyReview, UserSettings, Priority, TaskStatus } from '../models/types'
import { genId, nowISO, todayStr } from '../utils/date'
import { AIService } from '../services/aiService'
import { loadDemoData, clearDemoData } from '../data/seedData'

// ==================== Task Store ====================

interface TaskStore {
  loading: boolean
  aiParsing: boolean

  addTask: (task: Partial<Task>) => Promise<string>
  addTaskByNL: (input: string) => Promise<Task | null>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTaskComplete: (id: string) => Promise<void>
  setTaskPriority: (id: string, priority: Priority) => Promise<void>
  setTaskStatus: (id: string, status: TaskStatus) => Promise<void>
  setTop3: (id: string, isTop3: boolean) => Promise<void>
  rescheduleTask: (id: string, date: string) => Promise<void>
  createTasksFromContent: (contentId: string, contentType: 'wechat' | 'video', topic: string) => Promise<void>
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  loading: false,
  aiParsing: false,

  addTask: async (task: Partial<Task>) => {
    const newTask: Task = {
      id: genId(),
      title: task.title || '未命名任务',
      description: task.description,
      project: task.project,
      tags: task.tags || [],
      status: task.status || 'inbox',
      priority: task.priority || 'P3',
      dueDate: task.dueDate,
      plannedDate: task.plannedDate,
      estimatedTime: task.estimatedTime,
      actualTime: task.actualTime,
      createdAt: nowISO(),
      source: task.source || 'manual',
      contentId: task.contentId,
      isTop3: task.isTop3,
    }
    await db.tasks.add(newTask)
    return newTask.id
  },

  addTaskByNL: async (input: string) => {
    set({ aiParsing: true })
    try {
      const settings = await db.settings.get('default')
      const parsed = await AIService.parseTask(input, settings || undefined)

      // 如果解析出了日期，自动设为今天计划
      if (parsed.dueDate === todayStr() && !parsed.plannedDate) {
        parsed.plannedDate = todayStr()
      }

      const id = await get().addTask(parsed)
      const newTask = await db.tasks.get(id)
      return newTask || null
    } finally {
      set({ aiParsing: false })
    }
  },

  updateTask: async (id, updates) => {
    await db.tasks.update(id, updates)
  },

  deleteTask: async (id) => {
    await db.tasks.delete(id)
  },

  toggleTaskComplete: async (id) => {
    const task = await db.tasks.get(id)
    if (!task) return
    if (task.status === 'done') {
      await db.tasks.update(id, { status: 'todo', completedAt: undefined })
    } else {
      await db.tasks.update(id, { status: 'done', completedAt: nowISO() })
    }
  },

  setTaskPriority: async (id, priority) => {
    await db.tasks.update(id, { priority })
  },

  setTaskStatus: async (id, status) => {
    const updates: Partial<Task> = { status }
    if (status === 'done') updates.completedAt = nowISO()
    await db.tasks.update(id, updates)
  },

  setTop3: async (id, isTop3) => {
    await db.tasks.update(id, { isTop3 })
  },

  rescheduleTask: async (id, date) => {
    await db.tasks.update(id, { plannedDate: date })
  },

  createTasksFromContent: async (contentId, contentType, topic) => {
    const subTasks = contentType === 'wechat'
      ? [
          { title: `确定文章结构：${topic}`, estimatedTime: 30, priority: 'P2' as Priority },
          { title: `完成初稿：${topic}`, estimatedTime: 120, priority: 'P2' as Priority },
          { title: `修改文章：${topic}`, estimatedTime: 60, priority: 'P3' as Priority },
          { title: `配图：${topic}`, estimatedTime: 30, priority: 'P3' as Priority },
          { title: `发布：${topic}`, estimatedTime: 15, priority: 'P2' as Priority },
        ]
      : [
          { title: `录制视频：${topic}`, estimatedTime: 60, priority: 'P2' as Priority },
          { title: `剪辑视频：${topic}`, estimatedTime: 90, priority: 'P2' as Priority },
          { title: `制作封面：${topic}`, estimatedTime: 20, priority: 'P3' as Priority },
          { title: `发布视频：${topic}`, estimatedTime: 15, priority: 'P2' as Priority },
        ]

    for (const st of subTasks) {
      await db.tasks.add({
        id: genId(),
        title: st.title,
        project: '内容创作',
        tags: [contentType === 'wechat' ? '公众号' : '视频'],
        status: 'todo',
        priority: st.priority,
        estimatedTime: st.estimatedTime,
        createdAt: nowISO(),
        source: 'from_content',
        contentId,
      })
    }
  },
}))

// ==================== Inspiration Store ====================

interface InspirationStore {
  addInspiration: (content: string, tags?: string[]) => Promise<string>
  updateInspiration: (id: string, updates: Partial<Inspiration>) => Promise<void>
  deleteInspiration: (id: string) => Promise<void>
  convertToContent: (id: string, type: 'wechat' | 'video') => Promise<string>
}

export const useInspirationStore = create<InspirationStore>(() => ({
  addInspiration: async (content, tags) => {
    const id = genId()
    await db.inspirations.add({
      id,
      content,
      createdAt: nowISO(),
      tags: tags || [],
      status: 'pending',
    })
    return id
  },

  updateInspiration: async (id, updates) => {
    await db.inspirations.update(id, updates)
  },

  deleteInspiration: async (id) => {
    await db.inspirations.delete(id)
  },

  convertToContent: async (id, type) => {
    const insp = await db.inspirations.get(id)
    if (!insp) throw new Error('灵感不存在')

    const contentId = genId()
    if (type === 'wechat') {
      const content: WeChatContent = {
        id: contentId,
        type: 'wechat',
        stage: 'topic',
        topic: insp.content,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        status: 'draft',
      }
      await db.wechatContents.add(content)
    } else {
      const content: VideoContent = {
        id: contentId,
        type: 'video',
        stage: 'topic',
        topic: insp.content,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        status: 'draft',
      }
      await db.videoContents.add(content)
    }

    await db.inspirations.update(id, { status: 'creating', recommendedType: type })
    return contentId
  },
}))

// ==================== Content Store ====================

interface ContentStore {
  createWeChatContent: (topic: string) => Promise<string>
  updateWeChatContent: (id: string, updates: Partial<WeChatContent>) => Promise<void>
  deleteWeChatContent: (id: string) => Promise<void>
  createVideoContent: (topic: string) => Promise<string>
  updateVideoContent: (id: string, updates: Partial<VideoContent>) => Promise<void>
  deleteVideoContent: (id: string) => Promise<void>
}

export const useContentStore = create<ContentStore>(() => ({
  createWeChatContent: async (topic) => {
    const id = genId()
    await db.wechatContents.add({
      id,
      type: 'wechat',
      stage: 'topic',
      topic,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      status: 'draft',
    })
    return id
  },

  updateWeChatContent: async (id, updates) => {
    await db.wechatContents.update(id, { ...updates, updatedAt: nowISO() })
  },

  deleteWeChatContent: async (id) => {
    await db.wechatContents.delete(id)
    // 删除关联任务
    const tasks = await db.tasks.where('contentId').equals(id).toArray()
    for (const t of tasks) {
      await db.tasks.update(t.id, { contentId: undefined })
    }
  },

  createVideoContent: async (topic) => {
    const id = genId()
    await db.videoContents.add({
      id,
      type: 'video',
      stage: 'topic',
      topic,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      status: 'draft',
    })
    return id
  },

  updateVideoContent: async (id, updates) => {
    await db.videoContents.update(id, { ...updates, updatedAt: nowISO() })
  },

  deleteVideoContent: async (id) => {
    await db.videoContents.delete(id)
    const tasks = await db.tasks.where('contentId').equals(id).toArray()
    for (const t of tasks) {
      await db.tasks.update(t.id, { contentId: undefined })
    }
  },
}))

// ==================== Review Store ====================

interface ReviewStore {
  saving: boolean
  saveReview: (review: Omit<DailyReview, 'id' | 'createdAt'>) => Promise<string>
}

export const useReviewStore = create<ReviewStore>((set) => ({
  saving: false,
  saveReview: async (review) => {
    set({ saving: true })
    try {
      const id = genId()
      await db.reviews.add({
        ...review,
        id,
        createdAt: nowISO(),
      })
      return id
    } finally {
      set({ saving: false })
    }
  },
}))

// ==================== Settings Store ====================

interface SettingsStore {
  settings: UserSettings | null
  loaded: boolean
  loadSettings: () => Promise<void>
  saveSettings: (updates: Partial<UserSettings>) => Promise<void>
  loadDemo: () => Promise<void>
  clearDemo: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  loaded: false,

  loadSettings: async () => {
    let s = await db.settings.get('default')
    if (!s) {
      s = {
        id: 'default',
        aiMode: 'mock',
        demoDataLoaded: false,
      }
      await db.settings.put(s)
    }
    set({ settings: s, loaded: true })
  },

  saveSettings: async (updates) => {
    const current = get().settings || { id: 'default', aiMode: 'mock' as const }
    const updated = { ...current, ...updates }
    await db.settings.put(updated)
    set({ settings: updated })
  },

  loadDemo: async () => {
    await loadDemoData()
    await get().loadSettings()
  },

  clearDemo: async () => {
    await clearDemoData()
    await get().loadSettings()
  },
}))

// ==================== App Init Store ====================

interface AppStore {
  initialized: boolean
  initApp: () => Promise<void>
}

export const useAppStore = create<AppStore>((set) => ({
  initialized: false,
  initApp: async () => {
    const settings = await db.settings.get('default')
    if (!settings || !settings.demoDataLoaded) {
      await loadDemoData()
    }
    await useSettingsStore.getState().loadSettings()
    set({ initialized: true })
  },
}))
