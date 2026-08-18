import { db } from './db'
import type { Task, Inspiration, WeChatContent, UserSettings } from '../models/types'
import { genId, nowISO, todayStr } from '../utils/date'
import { addDays, format } from 'date-fns'

export async function loadDemoData() {
  const existing = await db.settings.get('default')
  if (existing?.demoDataLoaded) return

  // === Demo 任务 ===
  const today = todayStr()
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const friday = format(addDays(new Date(), Math.max(0, 5 - new Date().getDay()) || 5), 'yyyy-MM-dd')
  const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd')

  const demoTasks: Task[] = [
    {
      id: genId(),
      title: '完成 AI 个人工作助手 MVP',
      description: '完成核心功能开发、自测和交付',
      project: 'AI个人工作助手',
      tags: ['开发', 'MVP'],
      status: 'in_progress',
      priority: 'P1',
      dueDate: today,
      plannedDate: today,
      estimatedTime: 240,
      createdAt: nowISO(),
      source: 'manual',
      isTop3: true,
    },
    {
      id: genId(),
      title: '修改公众号文章',
      description: '根据反馈修改《为什么每个人都需要自己的AI工作助手》',
      project: '内容创作',
      tags: ['公众号', '写作'],
      status: 'todo',
      priority: 'P1',
      dueDate: today,
      plannedDate: today,
      estimatedTime: 90,
      createdAt: nowISO(),
      source: 'manual',
      isTop3: true,
    },
    {
      id: genId(),
      title: '回复合作邮件',
      description: '回复上周的合作邀约邮件',
      project: '日常事务',
      tags: ['邮件'],
      status: 'todo',
      priority: 'P2',
      dueDate: today,
      plannedDate: today,
      estimatedTime: 30,
      createdAt: nowISO(),
      source: 'manual',
      isTop3: true,
    },
    {
      id: genId(),
      title: '整理本周读书笔记',
      project: '个人成长',
      tags: ['阅读'],
      status: 'todo',
      priority: 'P3',
      dueDate: tomorrow,
      estimatedTime: 60,
      createdAt: nowISO(),
      source: 'manual',
    },
    {
      id: genId(),
      title: '录制短视频：AI工具推荐',
      project: '内容创作',
      tags: ['短视频'],
      status: 'todo',
      priority: 'P2',
      dueDate: friday,
      estimatedTime: 120,
      createdAt: nowISO(),
      source: 'manual',
    },
    {
      id: genId(),
      title: '更新简历',
      project: '个人发展',
      tags: ['求职'],
      status: 'inbox',
      priority: 'P4',
      dueDate: nextWeek,
      estimatedTime: 60,
      createdAt: nowISO(),
      source: 'manual',
    },
  ]

  // === Demo 灵感 ===
  const demoInspirations: Inspiration[] = [
    {
      id: genId(),
      content: 'AI真正改变的不是效率，而是一个人的能力边界。',
      createdAt: nowISO(),
      tags: ['AI', '思考'],
      status: 'ready',
      recommendedType: 'wechat',
    },
    {
      id: genId(),
      content: '普通人用AI做10件事，高手用AI做1件事但做到极致。',
      createdAt: nowISO(),
      tags: ['AI', '方法论'],
      status: 'pending',
    },
    {
      id: genId(),
      content: '短视频的核心不是时长，是信息密度。',
      createdAt: nowISO(),
      tags: ['短视频', '创作'],
      status: 'ready',
      recommendedType: 'video',
    },
    {
      id: genId(),
      content: '每天早上花5分钟规划今天，比加班2小时更有效。',
      createdAt: nowISO(),
      tags: ['效率', '习惯'],
      status: 'used',
      recommendedType: 'wechat',
    },
  ]

  // === Demo 公众号内容 ===
  const demoContent: WeChatContent = {
    id: genId(),
    type: 'wechat',
    stage: 'draft',
    topic: '为什么每个人都需要自己的AI工作助手',
    insight: {
      targetAudience: '知识工作者、内容创作者',
      coreProblem: '面对大量待办事项和内容创作需求，个人精力难以兼顾',
      coreViewpoint: 'AI工作助手不是替代你工作，而是扩展你的能力边界',
      contentValue: '帮助读者理解AI工具如何系统性地提升个人工作效率',
    },
    titles: [
      '为什么每个人都需要自己的AI工作助手',
      '2026年了，你还在手动管理日程？',
      '一个人 + AI = 一个团队：我是如何做到的',
      '别再问AI能做什么，先问你需要什么',
      '我用AI管理一天的工作，效率翻了3倍',
    ],
    selectedTitle: '为什么每个人都需要自己的AI工作助手',
    outline: `## 引言
- 每天醒来面对一堆待办事项的焦虑
- AI不是万能的，但没有AI是万万不能的

## 一、个人工作管理的痛点
- 任务太多，分不清主次
- 灵感来了没地方记，需要时找不到
- 创作时频繁切换上下文

## 二、AI工作助手能做什么
- 自然语言输入，自动结构化任务
- 帮你判断今天最该做什么
- 创作流程化：从灵感到定稿

## 三、一个真实案例
- 从早上规划到晚上复盘的完整一天

## 结语
- AI是工具，你才是主人
- 先用起来，再优化`,
    draft: `为什么每个人都需要自己的AI工作助手

每天早上醒来，面对手机里数十条待办事项，你是否也有一种不知道从何下手的感觉？

这不是效率问题，是信息过载。我们的大脑适合思考，不适合存储。

一、个人工作管理的痛点

现代知识工作者面临的困境很相似：任务太多，分不清主次；灵感来了没地方记，需要时又找不到；创作时在不同工具间频繁切换，好不容易进入状态又被打断。

传统的Todo List解决了记录问题，但没有解决判断问题——它告诉你"有什么要做"，却不会告诉你"最该做什么"。

二、AI工作助手能做什么

一个真正的AI工作助手，核心能力是"理解你的意图并帮你做决策"。

你可以用自然语言说"周五之前完成AI工作助手第一版，大概需要半天"，系统会自动解析出任务标题、截止日期、预计时间和优先级。

它还能帮你安排今天：读取所有未完成任务，结合截止日期和优先级，告诉你今天最该做的三件事，并主动提醒你是否时间不够。

在内容创作方面，从灵感记录到选题、标题、大纲、初稿、检查、定稿，整个流程都可以在助手中完成，不用在多个工具之间来回切换。

三、一个真实案例

早上8:30，打开助手，它告诉我今天有3项重要任务。我快速确认后，进入深度工作模式。

上午完成了两篇公众号文章的初稿，中间用快速记录功能记下了3条灵感。

下午处理了一个紧急任务，助手自动帮我调整了后续计划。

晚上，点击"开始复盘"，助手读取了今天的完成情况，帮我总结了关键成果和未完成事项，并建议了明天的Top3。

四、结语

AI是工具，你才是主人。工具的意义不在于它有多强大，而在于它能在多大程度上释放你的注意力，让你专注在真正重要的事情上。

先用起来，再优化。完美主义是行动力最大的敌人。`,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    status: 'draft',
  }

  // === Demo 设置 ===
  const demoSettings: UserSettings = {
    id: 'default',
    workType: '内容创作者',
    mainProjects: 'AI个人工作助手、公众号运营',
    dailyWorkHours: 8,
    deepWorkHours: 4,
    contentPlatforms: ['微信公众号', '抖音'],
    contentField: 'AI工具与效率',
    targetAudience: '知识工作者、内容创作者',
    contentStyle: '专业但不过于严肃，有个人观点',
    dislikedExpressions: '赋能、抓手、闭环',
    articleLength: '2000-3000字',
    videoLength: '1-3分钟',
    aiMode: 'mock',
    demoDataLoaded: true,
  }

  await db.tasks.bulkAdd(demoTasks)
  await db.inspirations.bulkAdd(demoInspirations)
  await db.wechatContents.add(demoContent)
  await db.settings.put(demoSettings)
}

export async function clearDemoData() {
  await db.tasks.clear()
  await db.inspirations.clear()
  await db.wechatContents.clear()
  await db.videoContents.clear()
  await db.reviews.clear()
  const settings = await db.settings.get('default')
  if (settings) {
    await db.settings.put({ ...settings, demoDataLoaded: false })
  } else {
    await db.settings.put({
      id: 'default',
      aiMode: 'mock',
      demoDataLoaded: false,
    })
  }
}

export async function exportAllData() {
  const [tasks, inspirations, wechatContents, videoContents, reviews, settings] = await Promise.all([
    db.tasks.toArray(),
    db.inspirations.toArray(),
    db.wechatContents.toArray(),
    db.videoContents.toArray(),
    db.reviews.toArray(),
    db.settings.toArray(),
  ])
  return {
    exportDate: nowISO(),
    version: '1.0.0',
    tasks,
    inspirations,
    wechatContents,
    videoContents,
    reviews,
    settings,
  }
}

export async function importAllData(data: any) {
  if (!data) throw new Error('数据为空')
  const tables = [db.tasks, db.inspirations, db.wechatContents, db.videoContents, db.reviews, db.settings]
  await db.transaction('rw', tables, async () => {
    if (data.tasks) await db.tasks.bulkPut(data.tasks)
    if (data.inspirations) await db.inspirations.bulkPut(data.inspirations)
    if (data.wechatContents) await db.wechatContents.bulkPut(data.wechatContents)
    if (data.videoContents) await db.videoContents.bulkPut(data.videoContents)
    if (data.reviews) await db.reviews.bulkPut(data.reviews)
    if (data.settings) await db.settings.bulkPut(data.settings)
  })
}
