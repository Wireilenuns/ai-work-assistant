import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../data/db'
import { useTaskStore, useSettingsStore } from '../store'
import { AIService } from '../services/aiService'
import { Card, Button, Checkbox, PriorityBadge, Tag, LoadingSpinner, EmptyState, ConfirmDialog } from '../components/ui'
import { getGreeting, getFullDateDisplay, getRelativeDate, formatMinutes, todayStr, isOverdue } from '../utils/date'
import { PenTool, Video, ListTodo, Moon, Sparkles, Send, Plus, ChevronRight, AlertCircle, Clock } from 'lucide-react'
import type { Task, TodayPlan } from '../models/types'
import clsx from 'clsx'

export default function Today() {
  const navigate = useNavigate()
  const { addTaskByNL, toggleTaskComplete, deleteTask } = useTaskStore()
  const { settings } = useSettingsStore()
  const [nlInput, setNlInput] = useState('')
  const [parsedPreview, setParsedPreview] = useState<Task | null>(null)
  const [plan, setPlan] = useState<TodayPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const today = todayStr()

  const allTasks = useLiveQuery(() => db.tasks.toArray(), [])
  const todayTasks = (allTasks || []).filter(t =>
    t.plannedDate === today || t.dueDate === today || (t.isTop3 && t.status !== 'done')
  ).sort((a, b) => {
    if (a.isTop3 && !b.isTop3) return -1
    if (!a.isTop3 && b.isTop3) return 1
    const po: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 }
    return (po[a.priority] || 3) - (po[b.priority] || 3)
  })

  const top3 = todayTasks.filter(t => t.isTop3).slice(0, 3)
  const pendingCount = todayTasks.filter(t => t.status !== 'done').length

  const handleNLSubmit = async () => {
    if (!nlInput.trim()) return
    const task = await addTaskByNL(nlInput)
    if (task) {
      setParsedPreview(task)
      setNlInput('')
    }
  }

  const handlePlan = async () => {
    setPlanLoading(true)
    try {
      const activeTasks = (allTasks || []).filter(t => t.status !== 'done')
      const hours = settings?.dailyWorkHours || 8
      const result = await AIService.planToday(activeTasks, hours, settings || undefined)
      setPlan(result)
    } finally {
      setPlanLoading(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <p className="text-sm text-ink-400 mb-0.5">{getFullDateDisplay()}</p>
        <h1 className="text-2xl font-bold text-ink-800">
          {getGreeting()}，{pendingCount > 0 ? `今天还有 ${pendingCount} 项任务需要处理。` : '今天的任务都完成了！'}
        </h1>
      </div>

      {/* Quick Record */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary-500" />
          <span className="text-sm font-medium text-ink-700">快速记录</span>
          {useTaskStore.getState().aiParsing && <span className="text-xs text-primary-500">AI 解析中...</span>}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={nlInput}
            onChange={e => setNlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNLSubmit()}
            placeholder="有什么事情需要记录？例如：周五之前完成公众号修改"
            className="input-field flex-1"
          />
          <Button onClick={handleNLSubmit} loading={useTaskStore.getState().aiParsing}>
            <Send className="w-4 h-4" />
            记录
          </Button>
        </div>
        {parsedPreview && (
          <div className="mt-2 p-2.5 bg-primary-50 rounded-lg text-sm text-ink-600 animate-slide-up">
            <span className="text-primary-600 font-medium">已创建：</span>
            {parsedPreview.title}
            {parsedPreview.dueDate && <span className="ml-2 text-ink-400">截止：{getRelativeDate(parsedPreview.dueDate)}</span>}
            {parsedPreview.estimatedTime && <span className="ml-2 text-ink-400">预计：{formatMinutes(parsedPreview.estimatedTime)}</span>}
            <span className="ml-2 text-ink-400">{parsedPreview.priority}</span>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '写公众号', icon: PenTool, color: 'text-green-600 bg-green-50', path: '/content/wechat' },
          { label: '做视频', icon: Video, color: 'text-purple-600 bg-purple-50', path: '/content/video' },
          { label: '添加任务', icon: ListTodo, color: 'text-blue-600 bg-blue-50', path: '/tasks' },
          { label: '开始复盘', icon: Moon, color: 'text-orange-600 bg-orange-50', path: '/review' },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="card p-4 flex flex-col items-center gap-2 hover:shadow-hover transition-all"
          >
            <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', action.color)}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-ink-700">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Today's Top 3 */}
      {top3.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-ink-800">今日 Top 3</h2>
            <button onClick={handlePlan} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {planLoading ? '生成中...' : '帮我安排今天'}
            </button>
          </div>
          <div className="space-y-2">
            {top3.map((task, idx) => (
              <TaskCard
                key={task.id}
                task={task}
                index={idx}
                onToggle={() => toggleTaskComplete(task.id)}
                onDelete={() => setDeleteId(task.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Plan Result */}
      {plan && (
        <Card className="p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink-800">今日 AI 计划</h3>
            <button onClick={() => setPlan(null)} className="text-xs text-ink-400 hover:text-ink-600">收起</button>
          </div>
          {plan.overload && plan.overloadMessage && (
            <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-700">{plan.overloadMessage}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-medium text-ink-500 mb-1.5">深度工作 ({plan.deepWork.length})</p>
              {plan.deepWork.length > 0 ? plan.deepWork.map(t => (
                <p key={t.id} className="text-xs text-ink-600 py-0.5">{t.title} <span className="text-ink-400">{formatMinutes(t.estimatedTime)}</span></p>
              )) : <p className="text-xs text-ink-300">暂无</p>}
            </div>
            <div>
              <p className="text-xs font-medium text-ink-500 mb-1.5">快速任务 ({plan.quickTasks.length})</p>
              {plan.quickTasks.length > 0 ? plan.quickTasks.map(t => (
                <p key={t.id} className="text-xs text-ink-600 py-0.5">{t.title} <span className="text-ink-400">{formatMinutes(t.estimatedTime)}</span></p>
              )) : <p className="text-xs text-ink-300">暂无</p>}
            </div>
          </div>
          {plan.canPostpone.length > 0 && (
            <div className="mt-3 pt-3 border-t border-ink-100">
              <p className="text-xs font-medium text-ink-500 mb-1.5">可以延后 ({plan.canPostpone.length})</p>
              {plan.canPostpone.map(t => (
                <p key={t.id} className="text-xs text-ink-400 py-0.5">{t.title}</p>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Today's Tasks */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-ink-800">今日任务</h2>
          <button onClick={() => navigate('/tasks')} className="text-xs text-ink-400 hover:text-primary-600 flex items-center gap-0.5">
            查看全部 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {todayTasks.length > 0 ? (
          <div className="space-y-2">
            {todayTasks.map((task, idx) => (
              <TaskCard
                key={task.id}
                task={task}
                index={idx}
                onToggle={() => toggleTaskComplete(task.id)}
                onDelete={() => setDeleteId(task.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={ListTodo}
              title="今天还没有任务"
              description="用上方快速记录添加你的第一项任务"
            />
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteTask(deleteId) }}
        title="删除任务"
        message="确定要删除这个任务吗？此操作不可撤销。"
        confirmText="删除"
        danger
      />
    </div>
  )
}

// ==================== Task Card ====================
function TaskCard({
  task,
  index,
  onToggle,
  onDelete,
}: {
  task: Task
  index?: number
  onToggle: () => void
  onDelete: () => void
}) {
  const done = task.status === 'done'
  const overdue = !done && isOverdue(task.dueDate)

  return (
    <Card className={clsx('p-3.5 flex items-center gap-3 transition-all', done && 'opacity-50')}>
      <Checkbox checked={done} onChange={onToggle} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {index !== undefined && task.isTop3 && (
            <span className="text-xs font-bold text-primary-500">#{index + 1}</span>
          )}
          <span className={clsx('text-sm font-medium text-ink-800 truncate', done && 'line-through')}>{task.title}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.project && <Tag>{task.project}</Tag>}
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <span className={clsx('text-xs', overdue ? 'text-red-500 font-medium' : 'text-ink-400')}>
              {overdue && '⚠ '}{getRelativeDate(task.dueDate)}
            </span>
          )}
          {task.estimatedTime && (
            <span className="text-xs text-ink-400 flex items-center gap-0.5">
              <Clock className="w-3 h-3" />{formatMinutes(task.estimatedTime)}
            </span>
          )}
        </div>
      </div>
      <button onClick={onDelete} className="text-ink-300 hover:text-red-500 p-1 text-xs">删除</button>
    </Card>
  )
}
