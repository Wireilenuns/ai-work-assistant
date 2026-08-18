import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../data/db'
import { useReviewStore, useTaskStore } from '../store'
import { AIService } from '../services/aiService'
import { Card, Button, Textarea, LoadingSpinner, EmptyState, Tag, AIButton } from '../components/ui'
import { todayStr, getFullDateDisplay, formatDateTime } from '../utils/date'
import { Moon, Sparkles, CheckCircle2, AlertCircle, Lightbulb, TrendingUp, Calendar } from 'lucide-react'
import type { DailyReview as DailyReviewType } from '../models/types'
import clsx from 'clsx'

export default function DailyReview() {
  const { saveReview, saving } = useReviewStore()
  const { rescheduleTask } = useTaskStore()
  const [started, setStarted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reviewData, setReviewData] = useState<any>(null)
  const [answers, setAnswers] = useState({ completed: '', uncompleted: '', blockers: '' })

  const today = todayStr()
  const todayTasks = useLiveQuery(() => db.tasks.where('plannedDate').equals(today).toArray(), [today])
  const dueTodayTasks = useLiveQuery(() => db.tasks.where('dueDate').equals(today).toArray(), [today])
  const history = useLiveQuery(() => db.reviews.orderBy('date').reverse().toArray(), [])

  const allTodayTasks = [...(todayTasks || []), ...(dueTodayTasks || [])].filter((t, i, arr) =>
    arr.findIndex(x => x.id === t.id) === i
  )

  const doneCount = allTodayTasks.filter(t => t.status === 'done').length
  const totalCount = allTodayTasks.length

  const handleStart = () => {
    setStarted(true)
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await AIService.generateDailyReview(allTodayTasks, answers)
      const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0
      const review: Omit<DailyReviewType, 'id' | 'createdAt'> = {
        date: today,
        completedSummary: answers.completed,
        uncompletedSummary: answers.uncompleted,
        blockers: answers.blockers,
        stats: {
          plannedCount: totalCount,
          completedCount: doneCount,
          completionRate,
        },
        keyAchievements: result.keyAchievements,
        uncompletedTasks: result.uncompletedTasks,
        issues: result.issues,
        tomorrowSuggestions: result.tomorrowSuggestions,
      }
      await saveReview(review)
      setReviewData({ ...review, ...result })
    } finally {
      setLoading(false)
    }
  }

  const handleRescheduleUncompleted = async (targetDate: string) => {
    const uncompleted = allTodayTasks.filter(t => t.status !== 'done')
    for (const t of uncompleted) {
      await rescheduleTask(t.id, targetDate)
    }
    alert(`已将 ${uncompleted.length} 个未完成任务安排到 ${targetDate}`)
  }

  // If review data is generated, show the result
  if (reviewData) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink-800">今日复盘</h1>
            <p className="text-sm text-ink-400 mt-0.5">{getFullDateDisplay()}</p>
          </div>
          <Tag color="green">复盘完成</Tag>
        </div>

        {/* Stats */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink-800">今日数据</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-ink-800">{reviewData.stats.plannedCount}</p>
              <p className="text-xs text-ink-400 mt-1">计划任务</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{reviewData.stats.completedCount}</p>
              <p className="text-xs text-ink-400 mt-1">完成数量</p>
            </div>
            <div className="text-center">
              <p className={clsx('text-2xl font-bold', reviewData.stats.completionRate >= 80 ? 'text-green-600' : reviewData.stats.completionRate >= 50 ? 'text-orange-500' : 'text-red-500')}>
                {reviewData.stats.completionRate}%
              </p>
              <p className="text-xs text-ink-400 mt-1">完成率</p>
            </div>
          </div>
        </Card>

        {/* Key Achievements */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h3 className="text-sm font-semibold text-ink-800">今日关键成果</h3>
          </div>
          <ul className="space-y-1.5">
            {reviewData.keyAchievements.map((item: string, idx: number) => (
              <li key={idx} className="text-sm text-ink-700 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">·</span> {item}
              </li>
            ))}
          </ul>
        </Card>

        {/* Uncompleted */}
        {reviewData.uncompletedTasks.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-semibold text-ink-800">未完成事项</h3>
            </div>
            <div className="space-y-1.5">
              {reviewData.uncompletedTasks.map((t: { id: string; title: string }) => (
                <div key={t.id} className="text-sm text-ink-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  {t.title}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => {
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                handleRescheduleUncompleted(tomorrow.toISOString().split('T')[0])
              }}>全部安排到明天</Button>
            </div>
          </Card>
        )}

        {/* Issues */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <h3 className="text-sm font-semibold text-ink-800">今日问题</h3>
          </div>
          <ul className="space-y-1.5">
            {reviewData.issues.map((issue: string, idx: number) => (
              <li key={idx} className="text-sm text-ink-600 flex items-start gap-2">
                <span className="text-red-400 mt-0.5">·</span> {issue}
              </li>
            ))}
          </ul>
        </Card>

        {/* Tomorrow Suggestions */}
        <Card className="p-4 border-primary-200 bg-primary-50/30">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-ink-800">明日建议 Top 3</h3>
          </div>
          <div className="space-y-2">
            {reviewData.tomorrowSuggestions.map((s: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-ink-700">
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                {s}
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => { setReviewData(null); setStarted(false); setAnswers({ completed: '', uncompleted: '', blockers: '' }) }}>
            重新复盘
          </Button>
        </div>
      </div>
    )
  }

  // If started, show the questions
  if (started) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-ink-800">今日复盘</h1>
          <p className="text-sm text-ink-400 mt-0.5">{getFullDateDisplay()}</p>
        </div>

        {/* Quick Stats */}
        <Card className="p-4">
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-xl font-bold text-ink-800">{totalCount}</p>
              <p className="text-xs text-ink-400">今日任务</p>
            </div>
            <div className="w-px h-8 bg-ink-200" />
            <div>
              <p className="text-xl font-bold text-green-600">{doneCount}</p>
              <p className="text-xs text-ink-400">已完成</p>
            </div>
            <div className="w-px h-8 bg-ink-200" />
            <div>
              <p className="text-xl font-bold text-orange-500">{totalCount - doneCount}</p>
              <p className="text-xs text-ink-400">未完成</p>
            </div>
          </div>
        </Card>

        {/* Questions */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-ink-800 mb-3">回答以下问题</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">1. 今天完成了什么？</label>
              <Textarea
                value={answers.completed}
                onChange={e => setAnswers({ ...answers, completed: e.target.value })}
                rows={3}
                placeholder="描述今天完成的重要事项..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">2. 什么没有完成？</label>
              <Textarea
                value={answers.uncompleted}
                onChange={e => setAnswers({ ...answers, uncompleted: e.target.value })}
                rows={3}
                placeholder="哪些任务没有完成，为什么..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">3. 最大的阻碍是什么？</label>
              <Textarea
                value={answers.blockers}
                onChange={e => setAnswers({ ...answers, blockers: e.target.value })}
                rows={3}
                placeholder="今天遇到的主要阻碍和问题..."
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setStarted(false)}>取消</Button>
            <AIButton onClick={handleGenerate} loading={loading || saving}>
              <Sparkles className="w-4 h-4" /> 生成复盘报告
            </AIButton>
          </div>
        </Card>
      </div>
    )
  }

  // Default: show start screen and history
  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-ink-800">每日复盘</h1>
        <p className="text-sm text-ink-400 mt-0.5">回顾今天，规划明天</p>
      </div>

      {/* Start Button */}
      <Card className="p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-50 flex items-center justify-center mb-3">
          <Moon className="w-7 h-7 text-primary-500" />
        </div>
        <h2 className="text-lg font-semibold text-ink-800 mb-1">开始今日复盘</h2>
        <p className="text-sm text-ink-400 mb-4">AI 会读取今天的任务完成情况，帮你总结并规划明天</p>
        <div className="flex items-center justify-center gap-4 text-sm text-ink-500 mb-4">
          <span>今日 {totalCount} 项任务</span>
          <span className="text-green-600">完成 {doneCount}</span>
          {totalCount - doneCount > 0 && <span className="text-orange-500">未完成 {totalCount - doneCount}</span>}
        </div>
        <Button onClick={handleStart} size="lg">
          <Moon className="w-4 h-4" /> 开始今日复盘
        </Button>
      </Card>

      {/* History */}
      {history && history.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-ink-800 mb-2">复盘历史</h2>
          <div className="space-y-2">
            {history.map(review => (
              <Card key={review.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-ink-400" />
                    <span className="text-sm font-medium text-ink-800">{review.date}</span>
                  </div>
                  <span className={clsx('badge',
                    review.stats.completionRate >= 80 ? 'bg-green-100 text-green-700' :
                    review.stats.completionRate >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                  )}>
                    完成率 {review.stats.completionRate}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-ink-500 mb-2">
                  <span>计划 {review.stats.plannedCount}</span>
                  <span className="text-green-600">完成 {review.stats.completedCount}</span>
                  <span>关键成果 {review.keyAchievements.length}</span>
                </div>
                {review.tomorrowSuggestions.length > 0 && (
                  <div className="pt-2 border-t border-ink-100">
                    <p className="text-xs text-ink-400 mb-1">明日建议</p>
                    {review.tomorrowSuggestions.slice(0, 2).map((s, i) => (
                      <p key={i} className="text-xs text-ink-600">· {s}</p>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
