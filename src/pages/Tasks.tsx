import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../data/db'
import { useTaskStore, useSettingsStore } from '../store'
import { AIService } from '../services/aiService'
import { Card, Button, Input, Textarea, Select, Checkbox, PriorityBadge, Tag, EmptyState, ConfirmDialog, Modal, LoadingSpinner } from '../components/ui'
import { todayStr, getRelativeDate, formatMinutes, isOverdue, isUpcoming, isDateToday } from '../utils/date'
import { ListTodo, Plus, Search, Inbox, Calendar, Clock, CheckCircle2, AlertCircle, Sparkles, Trash2, Edit3, X } from 'lucide-react'
import type { Task, Priority, TaskStatus, TodayPlan } from '../models/types'
import clsx from 'clsx'

type ViewType = 'inbox' | 'today' | 'upcoming' | 'all' | 'done'

export default function Tasks() {
  const { addTask, addTaskByNL, updateTask, deleteTask, toggleTaskComplete, setTaskPriority, setTaskStatus, rescheduleTask } = useTaskStore()
  const { settings } = useSettingsStore()
  const [view, setView] = useState<ViewType>('today')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showNLAdd, setShowNLAdd] = useState(false)
  const [nlInput, setNlInput] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [plan, setPlan] = useState<TodayPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)

  const allTasks = useLiveQuery(() => db.tasks.toArray(), [])
  const today = todayStr()

  const filteredTasks = (allTasks || []).filter(t => {
    const matchSearch = !search || t.title.includes(search) || (t.description || '').includes(search)
    let matchView = true
    switch (view) {
      case 'inbox': matchView = t.status === 'inbox'; break
      case 'today': matchView = t.plannedDate === today || t.dueDate === today; break
      case 'upcoming': matchView = t.status !== 'done' && !!t.dueDate && isUpcoming(t.dueDate) && !isDateToday(t.dueDate); break
      case 'all': matchView = t.status !== 'done'; break
      case 'done': matchView = t.status === 'done'; break
    }
    return matchSearch && matchView
  }).sort((a, b) => {
    const po: Record<string, number> = { P1: 0, P2: 1, P3: 2, P4: 3 }
    return (po[a.priority] || 3) - (po[b.priority] || 3)
  })

  const viewConfig: Record<ViewType, { label: string; icon: any; color: string }> = {
    inbox: { label: '收件箱', icon: Inbox, color: 'text-ink-600' },
    today: { label: '今天', icon: Calendar, color: 'text-primary-600' },
    upcoming: { label: '即将到期', icon: Clock, color: 'text-orange-500' },
    all: { label: '所有任务', icon: ListTodo, color: 'text-blue-600' },
    done: { label: '已完成', icon: CheckCircle2, color: 'text-green-600' },
  }

  const handleNLAdd = async () => {
    if (!nlInput.trim()) return
    await addTaskByNL(nlInput)
    setNlInput('')
    setShowNLAdd(false)
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
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-800">工作任务</h1>
          <p className="text-sm text-ink-400 mt-0.5">现在最应该做什么？</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowNLAdd(true)}>
            <Sparkles className="w-4 h-4" /> AI 添加
          </Button>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> 添加任务
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1 border-b border-ink-100">
        {(Object.keys(viewConfig) as ViewType[]).map(v => {
          const count = (allTasks || []).filter(t => {
            switch (v) {
              case 'inbox': return t.status === 'inbox'
              case 'today': return t.plannedDate === today || t.dueDate === today
              case 'upcoming': return t.status !== 'done' && !!t.dueDate && isUpcoming(t.dueDate) && !isDateToday(t.dueDate)
              case 'all': return t.status !== 'done'
              case 'done': return t.status === 'done'
            }
          }).length
          const Icon = viewConfig[v].icon
          return (
            <button
              key={v}
              onClick={() => setView(v)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-all -mb-px',
                view === v ? 'border-primary-500 text-primary-600' : 'border-transparent text-ink-400 hover:text-ink-600'
              )}
            >
              <Icon className="w-4 h-4" />
              {viewConfig[v].label}
              <span className={clsx('text-xs px-1.5 py-0.5 rounded', view === v ? 'bg-primary-100 text-primary-600' : 'bg-ink-100 text-ink-400')}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* AI Plan Button (only for today view) */}
      {view === 'today' && !plan && (
        <button
          onClick={handlePlan}
          disabled={planLoading}
          className="w-full p-3 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-100 rounded-lg flex items-center justify-center gap-2 text-sm text-primary-600 hover:from-primary-100 hover:to-blue-100 transition-all"
        >
          {planLoading ? <LoadingSpinner /> : <><Sparkles className="w-4 h-4" /> 帮我安排今天</>}
        </button>
      )}

      {/* AI Plan Result */}
      {plan && (
        <Card className="p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink-800">今日 AI 计划</h3>
            <button onClick={() => setPlan(null)} className="text-xs text-ink-400 hover:text-ink-600 flex items-center gap-0.5">
              <X className="w-3 h-3" /> 关闭
            </button>
          </div>
          {plan.overload && plan.overloadMessage && (
            <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-700">{plan.overloadMessage}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <PlanSection title="Top 3" tasks={plan.top3} />
            <PlanSection title="深度工作" tasks={plan.deepWork} />
            <PlanSection title="快速任务" tasks={plan.quickTasks} />
            <PlanSection title="可以延后" tasks={plan.canPostpone} muted />
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-ink-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索任务..."
          className="input-field pl-9"
        />
      </div>

      {/* Task List */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-1.5">
          {filteredTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => toggleTaskComplete(task.id)}
              onEdit={() => setEditingTask(task)}
              onDelete={() => setDeleteId(task.id)}
              onPriorityChange={(p) => setTaskPriority(task.id, p)}
              onStatusChange={(s) => setTaskStatus(task.id, s)}
              onReschedule={(d) => rescheduleTask(task.id, d)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={viewConfig[view].icon}
            title={search ? "没有找到匹配的任务" : `${viewConfig[view].label}暂无任务`}
            description={search ? "试试其他关键词" : undefined}
            action={!search && view === 'inbox' && <Button onClick={() => setShowNLAdd(true)}><Sparkles className="w-4 h-4" /> 用自然语言添加</Button>}
          />
        </Card>
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={async (task) => { await addTask(task); setShowAdd(false) }}
      />

      {/* NL Add Modal */}
      <Modal
        open={showNLAdd}
        onClose={() => setShowNLAdd(false)}
        title="AI 添加任务"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNLAdd(false)}>取消</Button>
            <Button onClick={handleNLAdd} loading={useTaskStore.getState().aiParsing}>AI 解析并添加</Button>
          </>
        }
      >
        <Textarea
          value={nlInput}
          onChange={e => setNlInput(e.target.value)}
          placeholder="用自然语言描述任务...&#10;例如：周五之前完成AI工作助手第一版，大概需要半天。"
          rows={4}
          autoFocus
        />
        <p className="text-xs text-ink-400 mt-2">AI 会自动解析任务标题、截止日期、预计时间和优先级。</p>
      </Modal>

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={async (updates) => { await updateTask(editingTask.id, updates); setEditingTask(null) }}
        />
      )}

      {/* Delete Confirm */}
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

function PlanSection({ title, tasks, muted }: { title: string; tasks: Task[]; muted?: boolean }) {
  return (
    <div>
      <p className={clsx('text-xs font-medium mb-1.5', muted ? 'text-ink-400' : 'text-ink-600')}>{title} ({tasks.length})</p>
      {tasks.length > 0 ? tasks.map(t => (
        <div key={t.id} className={clsx('text-xs py-0.5', muted ? 'text-ink-400' : 'text-ink-700')}>
          {t.title}
          {t.estimatedTime && <span className="text-ink-400 ml-1">{formatMinutes(t.estimatedTime)}</span>}
        </div>
      )) : <p className="text-xs text-ink-300">暂无</p>}
    </div>
  )
}

function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  onPriorityChange,
  onStatusChange,
  onReschedule,
}: {
  task: Task
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onPriorityChange: (p: Priority) => void
  onStatusChange: (s: TaskStatus) => void
  onReschedule: (d: string) => void
}) {
  const done = task.status === 'done'
  const overdue = !done && isOverdue(task.dueDate)

  return (
    <Card className={clsx('p-3 flex items-center gap-3 group hover:shadow-hover transition-all', done && 'opacity-50')}>
      <Checkbox checked={done} onChange={onToggle} />
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
        <div className="flex items-center gap-2">
          <span className={clsx('text-sm font-medium text-ink-800', done && 'line-through')}>{task.title}</span>
          {task.contentId && <Tag color="purple">关联内容</Tag>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.project && <Tag>{task.project}</Tag>}
          <select
            value={task.priority}
            onChange={(e) => { e.stopPropagation(); onPriorityChange(e.target.value as Priority) }}
            onClick={(e) => e.stopPropagation()}
            className={clsx('text-xs px-1.5 py-0.5 rounded border-0 cursor-pointer', 'bg-ink-50')}
            style={{ appearance: 'none' }}
          >
            <option value="P1">P1 · 必须做</option>
            <option value="P2">P2 · 重要</option>
            <option value="P3">P3 · 普通</option>
            <option value="P4">P4 · 可推迟</option>
          </select>
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
          {task.tags.map(tag => <Tag key={tag} color="blue">{tag}</Tag>)}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-400">
          <Edit3 className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Card>
  )
}

function AddTaskModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (task: Partial<Task>) => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [project, setProject] = useState('')
  const [priority, setPriority] = useState<Priority>('P3')
  const [dueDate, setDueDate] = useState('')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [plannedDate, setPlannedDate] = useState('')

  const handleSave = async () => {
    if (!title.trim()) return
    await onAdd({
      title,
      description,
      project: project || undefined,
      priority,
      dueDate: dueDate || undefined,
      plannedDate: plannedDate || undefined,
      estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
      status: 'todo',
      tags: [],
    })
    setTitle(''); setDescription(''); setProject(''); setPriority('P3'); setDueDate(''); setEstimatedTime(''); setPlannedDate('')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="添加任务"
      footer={<><Button variant="secondary" onClick={onClose}>取消</Button><Button onClick={handleSave} disabled={!title.trim()}>添加</Button></>}
    >
      <div className="space-y-3">
        <Input label="任务标题" value={title} onChange={e => setTitle(e.target.value)} placeholder="任务名称" autoFocus />
        <Textarea label="描述（可选）" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="项目" value={project} onChange={e => setProject(e.target.value)} placeholder="如：内容创作" />
          <Select label="优先级" value={priority} onChange={v => setPriority(v as Priority)} options={[
            { value: 'P1', label: 'P1 · 今天必须' },
            { value: 'P2', label: 'P2 · 重要' },
            { value: 'P3', label: 'P3 · 普通' },
            { value: 'P4', label: 'P4 · 可推迟' },
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="截止日期" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          <Input label="计划日期" type="date" value={plannedDate} onChange={e => setPlannedDate(e.target.value)} />
        </div>
        <Input label="预计时间（分钟）" type="number" value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} placeholder="如：60" />
      </div>
    </Modal>
  )
}

function EditTaskModal({ task, onClose, onSave }: { task: Task; onClose: () => void; onSave: (updates: Partial<Task>) => Promise<void> }) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const [project, setProject] = useState(task.project || '')
  const [priority, setPriority] = useState<Priority>(task.priority)
  const [dueDate, setDueDate] = useState(task.dueDate || '')
  const [plannedDate, setPlannedDate] = useState(task.plannedDate || '')
  const [estimatedTime, setEstimatedTime] = useState(task.estimatedTime?.toString() || '')
  const [status, setStatus] = useState<TaskStatus>(task.status)

  const handleSave = async () => {
    await onSave({
      title,
      description,
      project: project || undefined,
      priority,
      dueDate: dueDate || undefined,
      plannedDate: plannedDate || undefined,
      estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
      status,
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="编辑任务"
      footer={<><Button variant="secondary" onClick={onClose}>取消</Button><Button onClick={handleSave}>保存</Button></>}
    >
      <div className="space-y-3">
        <Input label="任务标题" value={title} onChange={e => setTitle(e.target.value)} />
        <Textarea label="描述" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="项目" value={project} onChange={e => setProject(e.target.value)} />
          <Select label="状态" value={status} onChange={v => setStatus(v as TaskStatus)} options={[
            { value: 'inbox', label: '收件箱' },
            { value: 'todo', label: '待办' },
            { value: 'in_progress', label: '进行中' },
            { value: 'done', label: '已完成' },
          ]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="优先级" value={priority} onChange={v => setPriority(v as Priority)} options={[
            { value: 'P1', label: 'P1 · 今天必须' },
            { value: 'P2', label: 'P2 · 重要' },
            { value: 'P3', label: 'P3 · 普通' },
            { value: 'P4', label: 'P4 · 可推迟' },
          ]} />
          <Input label="预计时间（分钟）" type="number" value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="截止日期" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          <Input label="计划日期" type="date" value={plannedDate} onChange={e => setPlannedDate(e.target.value)} />
        </div>
        {task.contentId && (
          <div className="p-2 bg-purple-50 rounded-lg text-xs text-purple-600">
            此任务关联内容 ID: {task.contentId.slice(-8)}
          </div>
        )}
      </div>
    </Modal>
  )
}
