import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../data/db'
import { useContentStore, useSettingsStore, useTaskStore } from '../store'
import { AIService } from '../services/aiService'
import { Card, Button, Input, Textarea, LoadingSpinner, Tag, ConfirmDialog, AIButton } from '../components/ui'
import { getStageLabel } from '../utils/date'
import { ArrowLeft, Check, Copy, Sparkles, RefreshCw, AlertCircle, ListPlus, FileText } from 'lucide-react'
import type { WeChatContent, ContentStage, ContentReview } from '../models/types'
import clsx from 'clsx'

const STAGES: ContentStage[] = ['topic', 'insight', 'title', 'outline', 'draft', 'review', 'final']
const STAGE_LABELS: Record<ContentStage, string> = {
  topic: '输入主题',
  insight: '提炼观点',
  title: '生成标题',
  outline: '生成大纲',
  draft: '生成初稿',
  review: '内容检查',
  final: '定稿',
}

export default function WeChatCreation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { updateWeChatContent, deleteWeChatContent } = useContentStore()
  const { createTasksFromContent } = useTaskStore()
  const { settings } = useSettingsStore()

  const content = useLiveQuery(() => id ? db.wechatContents.get(id) : undefined, [id])
  const linkedTasks = useLiveQuery(() => id ? db.tasks.where('contentId').equals(id).toArray() : [], [id])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showOptimized, setShowOptimized] = useState(false)

  if (!id) return <div className="text-center text-ink-400">未指定内容</div>
  if (!content) return <LoadingSpinner text="加载中..." />

  const s = settings || undefined
  const currentStageIdx = STAGES.indexOf(content.stage)

  const handleGenerateInsight = async () => {
    setLoading(true); setError('')
    try {
      const insight = await AIService.generateWeChatInsight(content.topic, s)
      await updateWeChatContent(id, { insight, stage: 'insight' })
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleGenerateTitles = async () => {
    setLoading(true); setError('')
    try {
      const titles = await AIService.generateTitles(content.topic, content.insight, s)
      await updateWeChatContent(id, { titles, stage: 'title' })
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleGenerateOutline = async () => {
    setLoading(true); setError('')
    try {
      const outline = await AIService.generateArticleOutline(content.topic, content.insight, content.selectedTitle || content.topic, s)
      await updateWeChatContent(id, { outline, stage: 'outline' })
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleGenerateDraft = async () => {
    setLoading(true); setError('')
    try {
      const draft = await AIService.generateArticle(content.outline || '', content.topic, content.insight, content.selectedTitle || content.topic, s)
      await updateWeChatContent(id, { draft, stage: 'draft' })
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleReview = async () => {
    setLoading(true); setError('')
    try {
      const reviewResult = await AIService.reviewContent(content.draft || '', 'wechat', s)
      await updateWeChatContent(id, { reviewResult, stage: 'review' })
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleOptimize = async () => {
    if (!content.reviewResult) return
    setLoading(true); setError('')
    try {
      const optimized = await AIService.optimizeContent(content.draft || '', content.reviewResult, s)
      await updateWeChatContent(id, { optimizedDraft: optimized })
      setShowOptimized(true)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleFinalize = async (useOptimized: boolean) => {
    const finalContent = useOptimized ? (content.optimizedDraft || content.draft || '') : (content.draft || '')
    await updateWeChatContent(id, { finalContent, stage: 'final', status: 'final' })
  }

  const handleAddToPlan = async () => {
    await createTasksFromContent(id, 'wechat', content.selectedTitle || content.topic)
    alert('已创建关联任务：确定结构、完成初稿、修改文章、配图、发布')
  }

  const handleCopy = () => {
    const text = content.finalContent || content.optimizedDraft || content.draft || ''
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
            <p className="text-xs text-ink-400">公众号创作</p>
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
              idx === currentStageIdx ? 'bg-primary-600 text-white' :
              idx < currentStageIdx ? 'bg-primary-50 text-primary-600' : 'bg-ink-100 text-ink-400'
            )}>
              {idx < currentStageIdx && <Check className="w-3 h-3" />}
              {idx + 1}. {STAGE_LABELS[stage]}
            </div>
            {idx < STAGES.length - 1 && <div className={clsx('w-4 h-px', idx < currentStageIdx ? 'bg-primary-300' : 'bg-ink-200')} />}
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
            label="你要写的主题或原始观点"
            value={content.topic}
            onChange={e => updateWeChatContent(id, { topic: e.target.value })}
            placeholder="例如：为什么每个人都需要自己的AI工作助手"
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={handleGenerateInsight} loading={loading} disabled={!content.topic.trim()}>
              <Sparkles className="w-4 h-4" /> 提炼核心观点
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Insight */}
      {content.stage === 'insight' && content.insight && (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink-800 mb-3">Step 2: 核心观点</h2>
          <div className="space-y-3">
            {([
              { key: 'targetAudience', label: '目标读者' },
              { key: 'coreProblem', label: '核心问题' },
              { key: 'coreViewpoint', label: '核心观点' },
              { key: 'contentValue', label: '内容价值' },
            ] as const).map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-ink-700 mb-1">{field.label}</label>
                <Textarea
                  value={content.insight![field.key] || ''}
                  onChange={e => updateWeChatContent(id, { insight: { ...content.insight!, [field.key]: e.target.value } })}
                  rows={2}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <Button variant="ghost" onClick={() => handleGenerateInsight()} loading={loading}>
              <RefreshCw className="w-4 h-4" /> 重新生成
            </Button>
            <Button onClick={handleGenerateTitles} loading={loading}>
              <Sparkles className="w-4 h-4" /> 生成标题
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Titles */}
      {content.stage === 'title' && content.titles && (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink-800 mb-3">Step 3: 选择标题</h2>
          <div className="space-y-2">
            {content.titles.map((title, idx) => (
              <button
                key={idx}
                onClick={() => updateWeChatContent(id, { selectedTitle: title })}
                className={clsx(
                  'w-full text-left p-3 rounded-lg border-2 transition-all',
                  content.selectedTitle === title ? 'border-primary-500 bg-primary-50' : 'border-ink-200 hover:border-ink-300'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-800">{title}</span>
                  {content.selectedTitle === title && <Check className="w-4 h-4 text-primary-600" />}
                </div>
                <span className="text-xs text-ink-400 mt-0.5 block">
                  {['观点型', '反常识型', '结果型', '故事型', '问题型'][idx]}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-between">
            <Button variant="ghost" onClick={handleGenerateTitles} loading={loading}>
              <RefreshCw className="w-4 h-4" /> 重新生成
            </Button>
            <Button onClick={handleGenerateOutline} loading={loading} disabled={!content.selectedTitle}>
              <Sparkles className="w-4 h-4" /> 生成大纲
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Outline */}
      {content.stage === 'outline' && content.outline && (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink-800 mb-3">Step 4: 文章大纲</h2>
          <Textarea
            value={content.outline}
            onChange={e => updateWeChatContent(id, { outline: e.target.value })}
            rows={15}
            className="font-mono text-sm"
          />
          <div className="mt-4 flex justify-between">
            <Button variant="ghost" onClick={handleGenerateOutline} loading={loading}>
              <RefreshCw className="w-4 h-4" /> 重新生成
            </Button>
            <Button onClick={handleGenerateDraft} loading={loading}>
              <Sparkles className="w-4 h-4" /> 生成初稿
            </Button>
          </div>
        </Card>
      )}

      {/* Step 5: Draft */}
      {content.stage === 'draft' && content.draft && (
        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink-800 mb-3">Step 5: 文章初稿</h2>
          <Textarea
            value={content.draft}
            onChange={e => updateWeChatContent(id, { draft: e.target.value })}
            rows={20}
            className="text-sm leading-relaxed"
          />
          <div className="mt-4 flex justify-between">
            <Button variant="ghost" onClick={handleGenerateDraft} loading={loading}>
              <RefreshCw className="w-4 h-4" /> 重新生成
            </Button>
            <Button onClick={handleReview} loading={loading}>
              <Sparkles className="w-4 h-4" /> 进入内容检查
            </Button>
          </div>
        </Card>
      )}

      {/* Step 6: Review */}
      {content.stage === 'review' && content.reviewResult && (
        <ReviewPanel
          content={content}
          reviewResult={content.reviewResult}
          loading={loading}
          showOptimized={showOptimized}
          onOptimize={handleOptimize}
          onAcceptOptimized={() => {
            updateWeChatContent(id, { draft: content.optimizedDraft, optimizedDraft: undefined })
            setShowOptimized(false)
          }}
          onUseOriginal={() => handleFinalize(false)}
          onUseOptimized={() => handleFinalize(true)}
          onGoBack={() => updateWeChatContent(id, { stage: 'draft' })}
        />
      )}

      {/* Step 7: Final */}
      {content.stage === 'final' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-ink-800">最终版本</h2>
            <Tag color="green">已定稿</Tag>
          </div>
          <div className="bg-ink-50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-ink-700 leading-relaxed font-sans">
              {content.finalContent || content.draft}
            </pre>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 justify-end">
            <Button variant="ghost" onClick={handleCopy}>
              <Copy className="w-4 h-4" /> {copied ? '已复制!' : '复制全文'}
            </Button>
            <Button variant="secondary" onClick={() => updateWeChatContent(id, { stage: 'review' })}>
              回到检查
            </Button>
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
        onConfirm={() => { deleteWeChatContent(id); navigate('/content') }}
        title="删除内容"
        message="确定要删除这篇内容吗？关联的任务将解除关联但不会被删除。"
        confirmText="删除"
        danger
      />
    </div>
  )
}

// ==================== Review Panel ====================
function ReviewPanel({
  content,
  reviewResult,
  loading,
  showOptimized,
  onOptimize,
  onAcceptOptimized,
  onUseOriginal,
  onUseOptimized,
  onGoBack,
}: {
  content: WeChatContent
  reviewResult: ContentReview
  loading: boolean
  showOptimized: boolean
  onOptimize: () => void
  onAcceptOptimized: () => void
  onUseOriginal: () => void
  onUseOptimized: () => void
  onGoBack: () => void
}) {
  const scoreColor = reviewResult.score >= 80 ? 'text-green-600' : reviewResult.score >= 60 ? 'text-orange-500' : 'text-red-500'

  return (
    <div className="space-y-3">
      {/* Score */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-ink-800">Step 6: 内容检查</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-400">总评分</span>
            <span className={clsx('text-2xl font-bold', scoreColor)}>{reviewResult.score}</span>
            <span className="text-sm text-ink-400">/100</span>
          </div>
        </div>

        {/* Issues */}
        <div className="space-y-3">
          {reviewResult.issues.map((issue, idx) => (
            <div key={idx} className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="badge bg-orange-200 text-orange-800 flex-shrink-0">{idx + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-800">{issue.title}</p>
                  <p className="text-xs text-ink-500 mt-1">原因：{issue.reason}</p>
                  <p className="text-xs text-primary-600 mt-1">建议：{issue.suggestion}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        {(reviewResult.recommendedOpening || reviewResult.recommendedEnding) && (
          <div className="mt-4 pt-4 border-t border-ink-100 space-y-3">
            {reviewResult.recommendedOpening && (
              <div>
                <p className="text-xs font-medium text-ink-500 mb-1">推荐新开头</p>
                <p className="text-sm text-ink-700 p-2 bg-blue-50 rounded-lg">{reviewResult.recommendedOpening}</p>
              </div>
            )}
            {reviewResult.recommendedEnding && (
              <div>
                <p className="text-xs font-medium text-ink-500 mb-1">推荐新结尾</p>
                <p className="text-sm text-ink-700 p-2 bg-blue-50 rounded-lg">{reviewResult.recommendedEnding}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2 justify-end">
          <Button variant="ghost" onClick={onGoBack}>回到初稿</Button>
          <AIButton onClick={onOptimize} loading={loading}>
            <Sparkles className="w-4 h-4" /> 帮我优化全文
          </AIButton>
        </div>
      </Card>

      {/* Original Draft */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-ink-700 mb-2">原始版本</h3>
        <pre className="whitespace-pre-wrap text-sm text-ink-600 leading-relaxed font-sans max-h-60 overflow-y-auto">
          {content.draft}
        </pre>
      </Card>

      {/* Optimized Version */}
      {showOptimized && content.optimizedDraft && (
        <Card className="p-5 border-primary-200 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-primary-700">AI 优化版本</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={onAcceptOptimized}>
                <Check className="w-3.5 h-3.5" /> 采用优化版
              </Button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-ink-700 leading-relaxed font-sans max-h-60 overflow-y-auto">
            {content.optimizedDraft}
          </pre>
        </Card>
      )}

      {/* Finalize */}
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onUseOriginal}>
          <FileText className="w-4 h-4" /> 使用原始版本定稿
        </Button>
        {content.optimizedDraft && (
          <Button onClick={onUseOptimized}>
            <Check className="w-4 h-4" /> 使用优化版本定稿
          </Button>
        )}
      </div>
    </div>
  )
}
