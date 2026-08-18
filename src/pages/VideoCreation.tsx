import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../data/db'
import { useContentStore, useSettingsStore, useTaskStore } from '../store'
import { AIService } from '../services/aiService'
import { Card, Button, Input, Textarea, LoadingSpinner, Tag, ConfirmDialog, AIButton } from '../components/ui'
import { getStageLabel } from '../utils/date'
import { ArrowLeft, Check, Copy, Sparkles, RefreshCw, AlertCircle, ListPlus } from 'lucide-react'
import type { VideoContent, VideoStage } from '../models/types'
import clsx from 'clsx'

const STAGES: VideoStage[] = ['topic', 'opinion', 'hook', 'structure', 'script', 'title', 'cover']
const STAGE_LABELS: Record<VideoStage, string> = {
  topic: '输入主题',
  opinion: '一句话观点',
  hook: '3秒开头',
  structure: '视频结构',
  script: '完整口播稿',
  title: '视频标题',
  cover: '封面文案',
}

export default function VideoCreation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { updateVideoContent, deleteVideoContent } = useContentStore()
  const { createTasksFromContent } = useTaskStore()
  const { settings } = useSettingsStore()

  const content = useLiveQuery(() => id ? db.videoContents.get(id) : undefined, [id])
  const linkedTasks = useLiveQuery(() => id ? db.tasks.where('contentId').equals(id).toArray() : [], [id])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!id) return <div className="text-center text-ink-400">未指定内容</div>
  if (!content) return <LoadingSpinner text="加载中..." />

  const s = settings || undefined
  const currentStageIdx = STAGES.indexOf(content.stage)

  const handleGenerateOpinion = async () => {
    setLoading(true); setError('')
    try {
      const opinion = await AIService.generateVideoOpinion(content.topic, s)
      await updateVideoContent(id, { opinion, stage: 'opinion' })
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleGenerateHooks = async () => {
    setLoading(true); setError('')
    try {
      const hooks = await AIService.generateVideoHooks(content.opinion || '', s)
      await updateVideoContent(id, { hooks, stage: 'hook' })
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleGenerateStructure = async () => {
    setLoading(true); setError('')
    try {
      const structure = await AIService.generateVideoStructure(content.opinion || '', content.selectedHook || content.hooks?.[0] || '', s)
      await updateVideoContent(id, { structure, stage: 'structure' })
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleGenerateScript = async () => {
    setLoading(true); setError('')
    try {
      const script = await AIService.generateVideoScript(content.structure || [], content.opinion || '', s)
      await updateVideoContent(id, { script, stage: 'script' })
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleGenerateTitles = async () => {
    setLoading(true); setError('')
    try {
      const titles = await AIService.generateVideoTitles(content.opinion || '', content.script || '', s)
      await updateVideoContent(id, { titles, stage: 'title' })
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleGenerateCover = async () => {
    setLoading(true); setError('')
    try {
      const coverText = await AIService.generateVideoCover(content.opinion || '', s)
      await updateVideoContent(id, { coverText, stage: 'cover', status: 'final' })
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleAddToPlan = async () => {
    await createTasksFromContent(id, 'video', content.selectedTitle || content.topic)
    alert('已创建关联任务：录制视频、剪辑视频、制作封面、发布视频')
  }

  const handleCopy = () => {
    const text = content.script || ''
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/content')} className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-ink-800">{content.selectedTitle || content.topic}</h1>
            <p className="text-xs text-ink-400">视频创作</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)}>删除</Button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STAGES.map((stage, idx) => (
          <React.Fragment key={stage}>
            <div className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0',
              idx === currentStageIdx ? 'bg-purple-600 text-white' :
              idx < currentStageIdx ? 'bg-purple-50 text-purple-600' : 'bg-ink-100 text-ink-400'
            )}>
              {idx < currentStageIdx && <Check className="w-3 h-3" />}
              {idx + 1}. {STAGE_LABELS[stage]}
            </div>
            {idx < STAGES.length - 1 && <div className={clsx('w-4 h-px', idx < currentStageIdx ? 'bg-purple-300' : 'bg-ink-200')} />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError('')} className="ml-auto">×</button>
        </div>
      )}

      {/* Step 1: Topic */}
      {content.stage === 'topic' && (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink-800 mb-3">Step 1: 输入主题</h2>
          <Input
            label="视频主题"
            value={content.topic}
            onChange={e => updateVideoContent(id, { topic: e.target.value })}
            placeholder="例如：3个提升效率的AI工具"
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={handleGenerateOpinion} loading={loading} disabled={!content.topic.trim()} className="bg-purple-600 hover:bg-purple-700">
              <Sparkles className="w-4 h-4" /> 生成核心观点
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Opinion */}
      {content.stage === 'opinion' && content.opinion && (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink-800 mb-3">Step 2: 核心观点（一句话）</h2>
          <Textarea
            label="让观众记住的那一句话"
            value={content.opinion}
            onChange={e => updateVideoContent(id, { opinion: e.target.value })}
            rows={3}
            placeholder="看完这条视频你会明白..."
          />
          <div className="mt-4 flex justify-between">
            <Button variant="ghost" onClick={handleGenerateOpinion} loading={loading}>
              <RefreshCw className="w-4 h-4" /> 重新生成
            </Button>
            <Button onClick={handleGenerateHooks} loading={loading} className="bg-purple-600 hover:bg-purple-700">
              <Sparkles className="w-4 h-4" /> 生成3秒开头
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Hooks */}
      {content.stage === 'hook' && content.hooks && (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink-800 mb-1">Step 3: 3秒开头</h2>
          <p className="text-xs text-ink-400 mb-3">选择一个最能抓住注意力的开头</p>
          <div className="space-y-2">
            {content.hooks.map((hook, idx) => (
              <button
                key={idx}
                onClick={() => updateVideoContent(id, { selectedHook: hook })}
                className={clsx(
                  'w-full text-left p-3 rounded-lg border-2 transition-all',
                  content.selectedHook === hook ? 'border-purple-500 bg-purple-50' : 'border-ink-200 hover:border-ink-300'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm text-ink-800">{hook}</span>
                  {content.selectedHook === hook && <Check className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />}
                </div>
                <span className="text-xs text-ink-400 mt-1 block">方案 {idx + 1}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <Button variant="ghost" onClick={handleGenerateHooks} loading={loading}>
              <RefreshCw className="w-4 h-4" /> 重新生成
            </Button>
            <Button onClick={handleGenerateStructure} loading={loading} className="bg-purple-600 hover:bg-purple-700">
              <Sparkles className="w-4 h-4" /> 生成视频结构
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Structure */}
      {content.stage === 'structure' && content.structure && (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink-800 mb-3">Step 4: 视频结构</h2>
          <div className="space-y-2">
            {content.structure.map((section, idx) => (
              <div key={idx} className="flex gap-2">
                <div className="w-20 flex-shrink-0">
                  <Input value={section.label} onChange={e => {
                    const newStructure = [...content.structure!]
                    newStructure[idx] = { ...section, label: e.target.value }
                    updateVideoContent(id, { structure: newStructure })
                  }} />
                </div>
                <Textarea
                  value={section.content}
                  onChange={e => {
                    const newStructure = [...content.structure!]
                    newStructure[idx] = { ...section, content: e.target.value }
                    updateVideoContent(id, { structure: newStructure })
                  }}
                  rows={2}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <Button variant="ghost" onClick={handleGenerateStructure} loading={loading}>
              <RefreshCw className="w-4 h-4" /> 重新生成
            </Button>
            <Button onClick={handleGenerateScript} loading={loading} className="bg-purple-600 hover:bg-purple-700">
              <Sparkles className="w-4 h-4" /> 生成口播稿
            </Button>
          </div>
        </Card>
      )}

      {/* Step 5: Script */}
      {content.stage === 'script' && content.script && (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink-800 mb-3">Step 5: 完整口播稿</h2>
          <Textarea
            value={content.script}
            onChange={e => updateVideoContent(id, { script: e.target.value })}
            rows={18}
            className="text-sm leading-relaxed"
            placeholder="口播稿..."
          />
          <div className="mt-4 flex justify-between">
            <Button variant="ghost" onClick={handleGenerateScript} loading={loading}>
              <RefreshCw className="w-4 h-4" /> 重新生成
            </Button>
            <Button onClick={handleGenerateTitles} loading={loading} className="bg-purple-600 hover:bg-purple-700">
              <Sparkles className="w-4 h-4" /> 生成标题
            </Button>
          </div>
        </Card>
      )}

      {/* Step 6: Titles */}
      {content.stage === 'title' && content.titles && (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink-800 mb-3">Step 6: 视频标题</h2>
          <div className="space-y-2">
            {content.titles.map((title, idx) => (
              <button
                key={idx}
                onClick={() => updateVideoContent(id, { selectedTitle: title })}
                className={clsx(
                  'w-full text-left p-3 rounded-lg border-2 transition-all',
                  content.selectedTitle === title ? 'border-purple-500 bg-purple-50' : 'border-ink-200 hover:border-ink-300'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-800">{title}</span>
                  {content.selectedTitle === title && <Check className="w-4 h-4 text-purple-600" />}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <Button variant="ghost" onClick={handleGenerateTitles} loading={loading}>
              <RefreshCw className="w-4 h-4" /> 重新生成
            </Button>
            <Button onClick={handleGenerateCover} loading={loading} className="bg-purple-600 hover:bg-purple-700">
              <Sparkles className="w-4 h-4" /> 生成封面文案
            </Button>
          </div>
        </Card>
      )}

      {/* Step 7: Cover & Final */}
      {content.stage === 'cover' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-ink-800">Step 7: 封面文案 & 定稿</h2>
            <Tag color="green">已完成</Tag>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">封面文案</label>
              <Input
                value={content.coverText || ''}
                onChange={e => updateVideoContent(id, { coverText: e.target.value })}
                placeholder="封面上的短句"
              />
            </div>

            {/* Summary */}
            <div className="bg-ink-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-ink-500 mb-1">核心观点</p>
                <p className="text-sm text-ink-700">{content.opinion}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-500 mb-1">选定标题</p>
                <p className="text-sm font-ink-800 font-medium">{content.selectedTitle}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-ink-500 mb-1">封面文案</p>
                <p className="text-sm text-ink-700">{content.coverText}</p>
              </div>
            </div>

            {/* Full Script */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-ink-500">完整口播稿</p>
                <Button size="sm" variant="ghost" onClick={handleCopy}>
                  <Copy className="w-3.5 h-3.5" /> {copied ? '已复制!' : '复制'}
                </Button>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-ink-700 leading-relaxed font-sans p-3 bg-ink-50 rounded-lg max-h-60 overflow-y-auto">
                {content.script}
              </pre>
            </div>
          </div>

          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => updateVideoContent(id, { stage: 'title' })}>回到标题</Button>
            <Button variant="secondary" onClick={handleAddToPlan}>
              <ListPlus className="w-4 h-4" /> 加入工作计划
            </Button>
          </div>

          {/* Linked Tasks */}
          {linkedTasks && linkedTasks.length > 0 && (
            <div className="mt-5 pt-4 border-t border-ink-100">
              <h3 className="text-sm font-semibold text-ink-700 mb-2">关联任务</h3>
              <div className="space-y-1.5">
                {linkedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <span className={clsx('w-1.5 h-1.5 rounded-full', task.status === 'done' ? 'bg-green-400' : 'bg-ink-300')} />
                    <span className={clsx('text-ink-600', task.status === 'done' && 'line-through opacity-50')}>{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { deleteVideoContent(id); navigate('/content') }}
        title="删除视频内容"
        message="确定要删除这个视频内容吗？关联的任务将解除关联但不会被删除。"
        confirmText="删除"
        danger
      />
    </div>
  )
}
