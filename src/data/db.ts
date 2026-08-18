import Dexie, { Table } from 'dexie'
import type { Task, Inspiration, WeChatContent, VideoContent, DailyReview, UserSettings } from '../models/types'

export class AppDatabase extends Dexie {
  tasks!: Table<Task, string>
  inspirations!: Table<Inspiration, string>
  wechatContents!: Table<WeChatContent, string>
  videoContents!: Table<VideoContent, string>
  reviews!: Table<DailyReview, string>
  settings!: Table<UserSettings, string>

  constructor() {
    super('AIWorkAssistantDB')
    this.version(1).stores({
      tasks: 'id, status, priority, dueDate, plannedDate, project, contentId, createdAt, completedAt, isTop3',
      inspirations: 'id, status, createdAt, recommendedType',
      wechatContents: 'id, stage, status, createdAt, updatedAt',
      videoContents: 'id, stage, status, createdAt, updatedAt',
      reviews: 'id, date, createdAt',
      settings: 'id',
    })
  }
}

export const db = new AppDatabase()
