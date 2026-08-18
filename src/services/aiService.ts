import type { Task, Priority, ContentReview, TodayPlan, UserSettings } from '../models/types'

// ==================== AI Provider 接口 ====================

export interface AIProvider {
  parseTask(input: string, settings?: UserSettings): Promise<Partial<Task>>
  generateWeChatInsight(topic: string, settings?: UserSettings): Promise<{
    targetAudience: string
    coreProblem: string
    coreViewpoint: string
    contentValue: string
  }>
  generateTitles(topic: string, insight?: any, settings?: UserSettings): Promise<string[]>
  generateArticleOutline(topic: string, insight: any, title: string, settings?: UserSettings): Promise<string>
  generateArticle(outline: string, topic: string, insight: any, title: string, settings?: UserSettings): Promise<string>
  generateVideoOpinion(topic: string, settings?: UserSettings): Promise<string>
  generateVideoHooks(opinion: string, settings?: UserSettings): Promise<string[]>
  generateVideoStructure(opinion: string, hook: string, settings?: UserSettings): Promise<{ label: string; content: string }[]>
  generateVideoScript(structure: { label: string; content: string }[], opinion: string, settings?: UserSettings): Promise<string>
  generateVideoTitles(opinion: string, script: string, settings?: UserSettings): Promise<string[]>
  generateVideoCover(opinion: string, settings?: UserSettings): Promise<string>
  reviewContent(content: string, type: 'wechat' | 'video', settings?: UserSettings): Promise<ContentReview>
  optimizeContent(content: string, reviewResult: ContentReview, settings?: UserSettings): Promise<string>
  planToday(tasks: Task[], availableHours: number, settings?: UserSettings): Promise<TodayPlan>
  generateDailyReview(tasks: Task[], userAnswers: { completed: string; uncompleted: string; blockers: string }): Promise<{
    keyAchievements: string[]
    uncompletedTasks: { id: string; title: string }[]
    issues: string[]
    tomorrowSuggestions: string[]
  }>
}

// ==================== Mock AI Provider ====================

function delay(ms: number = 800): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class MockAIProvider implements AIProvider {
  async parseTask(input: string, settings?: UserSettings): Promise<Partial<Task>> {
    await delay(600)

    const result: Partial<Task> = {
      title: input,
      status: 'inbox',
      source: 'ai_parsed',
      tags: [],
    }

    // 解析截止日期
    const lowerInput = input.toLowerCase()

    if (/今天|今日/.test(input)) {
      result.dueDate = new Date().toISOString().split('T')[0]
    } else if (/明天|明日/.test(input)) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      result.dueDate = tomorrow.toISOString().split('T')[0]
    } else if (/后天/.test(input)) {
      const day = new Date()
      day.setDate(day.getDate() + 2)
      result.dueDate = day.toISOString().split('T')[0]
    } else if (/下周/.test(input)) {
      const day = new Date()
      day.setDate(day.getDate() + 7)
      result.dueDate = day.toISOString().split('T')[0]
    } else if (/周[一二三四五六日天]/.test(input)) {
      const dayMap: Record<string, number> = {
        '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 0, '周天': 0,
      }
      const match = input.match(/周([一二三四五六日天])/)
      if (match) {
        const targetDay = dayMap[`周${match[1]}`]
        const now = new Date()
        let diff = targetDay - now.getDay()
        if (diff <= 0) diff += 7
        now.setDate(now.getDate() + diff)
        result.dueDate = now.toISOString().split('T')[0]
      }
    } else if (/(月底|月末)/.test(input)) {
      const now = new Date()
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      result.dueDate = lastDay.toISOString().split('T')[0]
    }

    // 解析优先级
    if (/紧急|立刻|马上|必须|重要|asap/i.test(input)) {
      result.priority = 'P1'
    } else if (/应该|需要|尽量/.test(input)) {
      result.priority = 'P2'
    }

    // 解析预计时间
    const hourMatch = input.match(/(\d+)\s*(个)?\s*小时/)
    const minMatch = input.match(/(\d+)\s*分钟/)
    const halfDayMatch = input.match(/半天/)
    const dayMatch = input.match(/(\d+)\s*天/)

    if (hourMatch) {
      result.estimatedTime = parseInt(hourMatch[1]) * 60
    } else if (minMatch) {
      result.estimatedTime = parseInt(minMatch[1])
    } else if (halfDayMatch) {
      result.estimatedTime = 240 // 4小时
    } else if (dayMatch) {
      result.estimatedTime = parseInt(dayMatch[1]) * 480 // 8小时/天
    }

    // 解析项目
    if (settings?.mainProjects) {
      const projects = settings.mainProjects.split(/[、,，]/).map(p => p.trim())
      for (const proj of projects) {
        if (proj && input.includes(proj)) {
          result.project = proj
          break
        }
      }
    }

    // 清理标题：去掉时间相关描述
    result.title = input
      .replace(/(今天|今日|明天|明日|后天|下周[一二三四五六日天]?|周[一二三四五六日天]|月底|月末|周五之前|周五前|之前|前)/g, '')
      .replace(/(大概需要|预计需要|需要|大约|大概)\s*(\d+\s*(个)?\s*小时|\d+\s*分钟|半天|\d+\s*天)/g, '')
      .replace(/(紧急|立刻|马上|必须|重要)/g, '')
      .replace(/[，,。！!]+$/g, '')
      .replace(/^\s+|\s+$/g, '')
      .replace(/\s+/g, ' ')

    if (!result.title) result.title = input

    return result
  }

  async generateWeChatInsight(topic: string, settings?: UserSettings) {
    await delay(1000)
    return {
      targetAudience: settings?.targetAudience || '关注个人成长和AI工具的知识工作者',
      coreProblem: `关于"${topic}"，很多人缺乏系统性的认知和实践方法`,
      coreViewpoint: `${topic}的关键不在于工具本身，而在于如何将其融入个人的工作流程`,
      contentValue: '帮助读者建立正确认知，并提供可落地的实践方法',
    }
  }

  async generateTitles(topic: string, insight?: any, settings?: UserSettings): Promise<string[]> {
    await delay(800)
    const subject = topic.length > 10 ? topic.slice(0, 10) : topic
    return [
      // 观点型
      `${subject}：被忽视的个人竞争力`,
      // 反常识型
      `为什么我不建议你立刻开始${subject}？`,
      // 结果型
      `坚持${subject}30天，我的工作效率翻了3倍`,
      // 故事型
      `从手忙脚乱到游刃有余：我的${subject}实践之路`,
      // 问题型
      `${subject}到底值不值得投入？这是我研究了50个案例后的答案`,
    ]
  }

  async generateArticleOutline(topic: string, insight: any, title: string, settings?: UserSettings): Promise<string> {
    await delay(1000)
    return `## 引言
- 用一个场景或数据引入话题
- 提出核心问题：${insight?.coreProblem || '如何更好地理解和实践'}

## 一、现状与痛点
- 大多数人面临的困境
- 常见的误区和错误做法

## 二、核心观点
- ${insight?.coreViewpoint || topic + '的关键在于系统化方法'}
- 为什么这样说

## 三、实践方法
- 第一步：明确目标
- 第二步：建立流程
- 第三步：持续优化

## 四、真实案例
- 一个具体的实践故事
- 可复用的经验总结

## 结语
- 核心观点重申
- 鼓励读者行动`
  }

  async generateArticle(outline: string, topic: string, insight: any, title: string, settings?: UserSettings): Promise<string> {
    await delay(1500)
    const style = settings?.contentStyle || '专业但不过于严肃'
    const avoid = settings?.dislikedExpressions || ''

    return `${title}

你有没有想过，为什么有些人看起来总是游刃有余，而有些人永远在手忙脚乱？

差距可能不在天赋，而在方法。

一、现状与痛点

我们这代人面对的信息量是前所未有的。每天醒来，手机里有几十条未读消息，待办清单上排满了任务，脑子里还不断冒出新的想法。

大多数人处理这些信息的方式是：想到什么做什么，什么紧急做什么。结果就是：看起来很忙，但一天结束时说不清自己到底做了什么有价值的事。

这不是态度问题，是方法问题。

二、核心观点

${insight?.coreViewpoint || topic + '的关键不在于做更多事，而在于用对方法做对的事'}

真正高效的个人管理不是把所有事情都塞进日程表，而是学会判断：什么是今天最值得做的事。好的工具应该帮你做判断，而不仅仅是帮你做记录。

三、实践方法

第一步：明确目标。每天早上花5分钟，想清楚今天最想完成的三件事。不是三件最紧急的事，而是三件最重要的事。

第二步：建立流程。把重复性的工作流程化。比如内容创作，可以从灵感库开始，经过选题、结构、初稿、检查，一步步推进。每一步都有明确的产出，不容易卡壳。

第三步：持续优化。每天晚上花3分钟复盘，问自己三个问题：今天完成了什么？什么没完成？最大的阻碍是什么？坚持一周，你就会发现自己的工作模式。

四、真实案例

我自己的实践是这样的：早上8:30打开工作台，系统已经帮我排好了今天的Top3任务。上午做深度工作，专注完成最重要的任务。下午处理快速任务和日常事务。晚上做复盘，系统自动读取今天的完成情况，帮我总结并建议明天的计划。

这个流程看起来简单，但坚持下来后，我的内容产出效率提升了近3倍。不是因为做了更多事，而是因为做了更对的事。

结语

${topic}不是什么高深的技巧，它就是一套帮你专注在重要事情上的系统。

工具再好，也需要你来驱动。先用起来，再优化。完美主义是行动力最大的敌人。

今天就开始，从写下你明天最重要的三件事开始。`
  }

  async generateVideoOpinion(topic: string, settings?: UserSettings): Promise<string> {
    await delay(600)
    return `看完这条视频你会明白：${topic}不是什么高深的技术，而是每个人都能上手的实用方法。`
  }

  async generateVideoHooks(opinion: string, settings?: UserSettings): Promise<string[]> {
    await delay(800)
    return [
      `等一下，你是不是也一直在纠结${opinion.slice(6, 20)}...？今天花一分钟告诉你答案。`,
      `我赌你不知道，${opinion.slice(0, 15)}其实有个更简单的做法。`,
      `这条视频可能会改变你对这件事的看法，给你30秒。`,
    ]
  }

  async generateVideoStructure(opinion: string, hook: string, settings?: UserSettings) {
    await delay(800)
    return [
      { label: '开头', content: hook },
      { label: '问题', content: '提出大多数人面临的困境或误区' },
      { label: '观点', content: opinion },
      { label: '案例', content: '用一个具体的故事或数据来支撑观点' },
      { label: '结论', content: '总结核心观点，给出行动建议' },
    ]
  }

  async generateVideoScript(structure: { label: string; content: string }[], opinion: string, settings?: UserSettings): Promise<string> {
    await delay(1200)
    let script = ''
    for (const section of structure) {
      if (section.label === '开头') {
        script += `${section.content}\n\n`
      } else if (section.label === '问题') {
        script += `说到这个问题，我猜很多人都是这样：每天忙忙碌碌，但回头一看，好像什么重要的事都没做成。是不是很扎心？但这就是大多数人的真实状态。\n\n`
      } else if (section.label === '观点') {
        script += `${opinion}\n\n`
      } else if (section.label === '案例') {
        script += `我有个朋友，之前也是这种状态。后来他开始用一个很简单的方法：每天只关注三件事。就这一个改变，一个月后他的工作效率直接翻了一倍。不是因为他变聪明了，而是他开始做对的事了。\n\n`
      } else if (section.label === '结论') {
        script += `所以记住，方法不在于多，在于用。今天就开始，写下你明天最重要的三件事。坚持一周，你会感谢自己的。\n\n`
      }
    }
    return script.trim()
  }

  async generateVideoTitles(opinion: string, script: string, settings?: UserSettings): Promise<string[]> {
    await delay(600)
    return [
      '这个方法让我效率翻倍，分享给你',
      '别再瞎忙了！1分钟告诉你真相',
      '90%的人都做错了，正确的方法是这样的',
      '学会这一招，省下每天2小时',
      '亲测有效：一个简单到不可思议的方法',
    ]
  }

  async generateVideoCover(opinion: string, settings?: UserSettings): Promise<string> {
    await delay(400)
    const short = opinion.replace(/^(看完这条视频你会明白：|其实)/, '').slice(0, 12)
    return short || '效率翻倍的秘密'
  }

  async reviewContent(content: string, type: 'wechat' | 'video', settings?: UserSettings): Promise<ContentReview> {
    await delay(1500)

    const wordCount = content.length
    const hasQuestion = /[？?]/.test(content)
    const hasData = /\d+[%％]/.test(content)
    const hasCase = /案例|例子|故事|我/.test(content)

    let score = 70
    const issues: ContentReview['issues'] = []

    // 检查开头吸引力
    if (!hasQuestion && wordCount > 100) {
      score -= 8
      issues.push({
        title: '开头吸引力不足',
        reason: '文章开头缺少能引发读者好奇心的元素，如提问、悬念或数据',
        suggestion: '在开头加入一个反常识的问题或一个令人意外的数据，让读者产生"我也想知道"的感觉',
      })
    }

    // 检查核心观点
    if (content.length < 500) {
      score -= 10
      issues.push({
        title: '核心观点不够明确',
        reason: '内容较短，核心观点可能没有充分展开',
        suggestion: '补充更多论证和细节，让核心观点更有说服力',
      })
    }

    // 检查信息密度
    if (!hasData) {
      score -= 8
      issues.push({
        title: '信息密度偏低',
        reason: '文中缺少具体数据支撑，观点显得主观',
        suggestion: '加入2-3个具体数据或研究结论，提升内容的可信度',
      })
    }

    // 检查 AI 套话
    const aiPhrases = ['赋能', '抓手', '闭环', '矩阵', '打法', '颗粒度', '底层逻辑', '顶层设计', '在当今', '随着...的发展']
    const foundAiPhrases = aiPhrases.filter(p => content.includes(p))
    if (foundAiPhrases.length > 0) {
      score -= 12
      issues.push({
        title: '检测到AI套话',
        reason: `文中使用了"${foundAiPhrases.join('、')}"等典型AI生成用语，影响阅读自然度`,
        suggestion: '用更口语化、更个人化的表达替换这些词语，让文章更有"人味"',
      })
    }

    // 检查案例
    if (!hasCase) {
      score -= 7
      issues.push({
        title: '缺少案例和细节',
        reason: '内容偏理论化，缺少具体案例来支撑观点',
        suggestion: '加入1-2个真实案例或个人经历，让读者更容易理解和共鸣',
      })
    }

    // 检查结尾
    const lastParagraph = content.split('\n\n').slice(-1)[0]
    if (lastParagraph.length < 30) {
      score -= 5
      issues.push({
        title: '结尾力度不足',
        reason: '结尾过于简短，没有给读者留下深刻印象或行动指引',
        suggestion: '在结尾加入一句有力的金句或明确的行动号召',
      })
    }

    // 重复内容检查
    const sentences = content.split(/[。！？\n]/).filter(s => s.trim().length > 10)
    const uniqueSentences = new Set(sentences.map(s => s.trim().slice(0, 20)))
    if (sentences.length > uniqueSentences.size + 2) {
      score -= 6
      issues.push({
        title: '存在重复内容',
        reason: '文中有部分段落表达了相似的意思，造成冗余',
        suggestion: '合并或删除重复段落，让每个段落都有独立的信息增量',
      })
    }

    score = Math.max(0, Math.min(100, score))

    // 如果问题不足3个，补充一般性建议
    while (issues.length < 3) {
      issues.push({
        title: '内容可以更具个人特色',
        reason: '文章整体质量不错，但缺少作者独特的个人风格和观点',
        suggestion: '加入更多个人见解和独特表达，让读者感受到这是一个"人"在说话',
      })
    }

    // 推荐开头
    const recommendedOpening = `你有没有想过一个看起来简单但很多人答不上来的问题：${type === 'wechat' ? '为什么有些人看起来总是比同龄人更从容？' : '为什么你每天很忙但总感觉没做成什么事？'}`

    // 推荐结尾
    const recommendedEnding = `记住，最好的时间是现在。不是明天，不是下周，就是今天。先做起来，你已经在大多数人前面了。`

    // 推荐修改句子
    const recommendedSentences: { original: string; suggested: string }[] = []
    if (foundAiPhrases.length > 0) {
      recommendedSentences.push({
        original: `在当今时代，我们需要用新的方式来${foundAiPhrases[0] || '赋能'}个人成长。`,
        suggested: '说到底，就是换个更聪明的方式做事。',
      })
    }

    return {
      score,
      issues: issues.slice(0, 3),
      recommendedOpening,
      recommendedEnding,
      recommendedSentences,
    }
  }

  async optimizeContent(content: string, reviewResult: ContentReview, settings?: UserSettings): Promise<string> {
    await delay(1500)
    let optimized = content

    // 替换推荐开头
    if (reviewResult.recommendedOpening) {
      const firstParagraph = optimized.split('\n\n')[0]
      optimized = optimized.replace(firstParagraph, reviewResult.recommendedOpening)
    }

    // 替换推荐结尾
    if (reviewResult.recommendedEnding) {
      const paragraphs = optimized.split('\n\n')
      paragraphs[paragraphs.length - 1] = reviewResult.recommendedEnding
      optimized = paragraphs.join('\n\n')
    }

    // 替换推荐句子
    if (reviewResult.recommendedSentences) {
      for (const { original, suggested } of reviewResult.recommendedSentences) {
        optimized = optimized.replace(original, suggested)
      }
    }

    // 去除 AI 套话
    const aiPhrases: Record<string, string> = {
      '赋能': '帮助',
      '抓手': '切入点',
      '闭环': '完整流程',
      '矩阵': '体系',
      '打法': '策略',
      '颗粒度': '细节',
      '底层逻辑': '核心原理',
      '顶层设计': '整体规划',
      '在当今': '现在',
    }
    for (const [phrase, replacement] of Object.entries(aiPhrases)) {
      optimized = optimized.replace(new RegExp(phrase, 'g'), replacement)
    }

    return optimized
  }

  async planToday(tasks: Task[], availableHours: number, settings?: UserSettings): Promise<TodayPlan> {
    await delay(800)

    const availMinutes = availableHours * 60
    const activeTasks = tasks.filter(t => t.status !== 'done')

    // 按优先级和截止日期排序
    const sorted = [...activeTasks].sort((a, b) => {
      const priorityOrder: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 }
      const pDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
      if (pDiff !== 0) return pDiff
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return 0
    })

    // Top3: 优先级最高的3个
    const top3 = sorted.slice(0, 3)

    // 深度工作: 预计时间 > 60分钟
    const deepWork = sorted.filter(t => !top3.includes(t) && (t.estimatedTime || 0) > 60)

    // 快速任务: 预计时间 <= 30分钟
    const quickTasks = sorted.filter(t => !top3.includes(t) && !deepWork.includes(t) && (t.estimatedTime || 30) <= 30)

    // 可延后: P4 或无截止日期
    const canPostpone = sorted.filter(t =>
      !top3.includes(t) && !deepWork.includes(t) && !quickTasks.includes(t) &&
      (t.priority === 'P4' || (!t.dueDate && t.priority === 'P3'))
    )

    const top3Time = top3.reduce((sum, t) => sum + (t.estimatedTime || 30), 0)
    const deepTime = deepWork.reduce((sum, t) => sum + (t.estimatedTime || 60), 0)
    const quickTime = quickTasks.reduce((sum, t) => sum + (t.estimatedTime || 15), 0)
    const totalEstimated = top3Time + deepTime + quickTime
    const totalEstimatedHours = totalEstimated / 60

    const overload = totalEstimatedHours > availableHours
    let overloadMessage: string | undefined

    if (overload) {
      const suggestPostpone = [...canPostpone, ...deepWork.slice(-1)]
        .filter(t => !top3.includes(t))
        .slice(0, 2)
        .map(t => t.title)
      overloadMessage = `今天计划约需要 ${Math.round(totalEstimatedHours)} 小时，但你的可用时间只有 ${availableHours} 小时。建议推迟：${suggestPostpone.join('、') || '部分低优先级任务'}`
    }

    return {
      top3,
      deepWork,
      quickTasks,
      canPostpone,
      totalEstimatedHours,
      availableHours,
      overload,
      overloadMessage,
    }
  }

  async generateDailyReview(tasks: Task[], userAnswers: { completed: string; uncompleted: string; blockers: string }) {
    await delay(1000)

    const done = tasks.filter(t => t.status === 'done')
    const notDone = tasks.filter(t => t.status !== 'done')

    // 提取关键成果
    const keyAchievements: string[] = []
    if (userAnswers.completed) {
      keyAchievements.push(...userAnswers.completed.split(/[。；;\n]/).filter(s => s.trim()).slice(0, 3))
    }
    for (const t of done.slice(0, 3 - keyAchievements.length)) {
      keyAchievements.push(t.title)
    }

    // 未完成任务
    const uncompletedTasks = notDone.map(t => ({ id: t.id, title: t.title }))

    // 问题分析
    const issues: string[] = []
    if (userAnswers.blockers) {
      issues.push(...userAnswers.blockers.split(/[。；;\n]/).filter(s => s.trim()).slice(0, 2))
    }
    if (notDone.length > done.length) {
      issues.push('今日完成率偏低，任务量可能超出实际可用时间')
    }
    if (notDone.some(t => t.priority === 'P1')) {
      issues.push('有高优先级任务未完成，需要优先安排')
    }
    if (issues.length === 0) {
      issues.push('整体执行顺利，可以尝试增加任务挑战度')
    }

    // 明日建议
    const tomorrowSuggestions: string[] = []
    const p1NotDone = notDone.filter(t => t.priority === 'P1').slice(0, 2)
    const p2NotDone = notDone.filter(t => t.priority === 'P2').slice(0, 1)
    const suggestions = [...p1NotDone, ...p2NotDone]
    for (const t of suggestions.slice(0, 3)) {
      tomorrowSuggestions.push(t.title)
    }
    if (tomorrowSuggestions.length < 3 && userAnswers.uncompleted) {
      const manual = userAnswers.uncompleted.split(/[。；;\n]/).filter(s => s.trim())
      for (const m of manual) {
        if (tomorrowSuggestions.length < 3) tomorrowSuggestions.push(m)
      }
    }

    return {
      keyAchievements: keyAchievements.slice(0, 5),
      uncompletedTasks,
      issues: issues.slice(0, 3),
      tomorrowSuggestions: tomorrowSuggestions.slice(0, 3),
    }
  }
}

// ==================== AI Service 单例 ====================

let currentProvider: AIProvider = new MockAIProvider()

export function getAIProvider(): AIProvider {
  return currentProvider
}

export function setAIProvider(provider: AIProvider) {
  currentProvider = provider
}

// 统一的 AI Service 入口
export const AIService = {
  parseTask: (input: string, settings?: UserSettings) => currentProvider.parseTask(input, settings),
  generateWeChatInsight: (topic: string, settings?: UserSettings) => currentProvider.generateWeChatInsight(topic, settings),
  generateTitles: (topic: string, insight?: any, settings?: UserSettings) => currentProvider.generateTitles(topic, insight, settings),
  generateArticleOutline: (topic: string, insight: any, title: string, settings?: UserSettings) => currentProvider.generateArticleOutline(topic, insight, title, settings),
  generateArticle: (outline: string, topic: string, insight: any, title: string, settings?: UserSettings) => currentProvider.generateArticle(outline, topic, insight, title, settings),
  generateVideoOpinion: (topic: string, settings?: UserSettings) => currentProvider.generateVideoOpinion(topic, settings),
  generateVideoHooks: (opinion: string, settings?: UserSettings) => currentProvider.generateVideoHooks(opinion, settings),
  generateVideoStructure: (opinion: string, hook: string, settings?: UserSettings) => currentProvider.generateVideoStructure(opinion, hook, settings),
  generateVideoScript: (structure: { label: string; content: string }[], opinion: string, settings?: UserSettings) => currentProvider.generateVideoScript(structure, opinion, settings),
  generateVideoTitles: (opinion: string, script: string, settings?: UserSettings) => currentProvider.generateVideoTitles(opinion, script, settings),
  generateVideoCover: (opinion: string, settings?: UserSettings) => currentProvider.generateVideoCover(opinion, settings),
  reviewContent: (content: string, type: 'wechat' | 'video', settings?: UserSettings) => currentProvider.reviewContent(content, type, settings),
  optimizeContent: (content: string, reviewResult: ContentReview, settings?: UserSettings) => currentProvider.optimizeContent(content, reviewResult, settings),
  planToday: (tasks: Task[], availableHours: number, settings?: UserSettings) => currentProvider.planToday(tasks, availableHours, settings),
  generateDailyReview: (tasks: Task[], userAnswers: { completed: string; uncompleted: string; blockers: string }) => currentProvider.generateDailyReview(tasks, userAnswers),
}
