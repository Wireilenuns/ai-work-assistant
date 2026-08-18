import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../data/db'
import { useContentStore } from '../store'
import { Card, Button, Input, EmptyState, Tag, Modal } from '../components/ui'
import { getStageLabel, formatDateTime } from '../utils/date'
import { PenTool, Video, Plus, FileText, ChevronRight } from 'lucide-react'
import type { Content } from '../models/types'
import clsx from 'clsx'

export default function ContentAssistant() {
  const navigate = useNavigate()
  const { createWeChatContent, createVideoContent } = useContentStore()
  const [showCreate, setShowCreate] = useState(false)
  const [createType, setCreateType] = useState<'wechat' | 'video'>('wechat')
  const [topic, setTopic] = useState('')

  const wechatContents = useLiveQuery(() => db.wechatContents.orderBy('updatedAt').reverse().toArray(), [])
  const videoContents = useLiveQuery(() => db.videoContents.orderBy('updatedAt').reverse().toArray(), [])

  const allContents: Content[] = [
    ...(wechatContents || []).map(c => ({ ...c, type: 'wechat' as const })),
    ...(videoContents || []).map(c => ({ ...c, type: 'video' as const })),
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const handleCreate = async () => {
    if (!topic.trim()) return
    if (createType === 'wechat') {
      const id = await createWeChatContent(topic)
      navigate(`/content/wechat/${id}`)
    } else {
      const id = await createVideoContent(topic)
      navigate(`/content/video/${id}`)
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-800">内容助手</h1>
          <p className="text-sm text-ink-400 mt-0.5">从灵感到定稿，完整创作工作流</p>
        </div>
      </div>

      {/* Create Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setCreateType('wechat'); setShowCreate(true) }}
          className="card p-4 flex items-center gap-3 hover:shadow-hover transition-all text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <PenTool className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-800">写公众号</p>
            <p className="text-xs text-ink-400">主题 → 观点 → 标题 → 大纲 → 初稿 → 检查 → 定稿</p>
          </div>
        </button>
        <button
          onClick={() => { setCreateType('video'); setShowCreate(true) }}
          className="card p-4 flex items-center gap-3 hover:shadow-hover transition-all text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <Video className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-800">做视频</p>
            <p className="text-xs text-ink-400">主题 → 观点 → 开头 → 结构 → 口播稿 → 标题 → 封面</p>
          </div>
        </button>
      </div>

      {/* Content List */}
      <div>
        <h2 className="text-base font-semibold text-ink-800 mb-2">创作历史</h2>
        {allContents.length > 0 ? (
          <div className="space-y-2">
            {allContents.map(content => (
              <ContentCard
                key={content.id}
                content={content}
                onClick={() => navigate(content.type === 'wechat' ? `/content/wechat/${content.id}` : `/content/video/${content.id}`)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={FileText}
              title="还没有创作内容"
              description="选择写公众号或做视频开始你的创作"
            />
          </Card>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={createType === 'wechat' ? '新建公众号内容' : '新建视频内容'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!topic.trim()}>开始创作</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setCreateType('wechat')}
              className={clsx('flex-1 p-3 rounded-lg border-2 text-center transition-all',
                createType === 'wechat' ? 'border-primary-500 bg-primary-50' : 'border-ink-200 hover:border-ink-300')}
            >
              <PenTool className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <span className="text-sm font-medium">公众号</span>
            </button>
            <button
              onClick={() => setCreateType('video')}
              className={clsx('flex-1 p-3 rounded-lg border-2 text-center transition-all',
                createType === 'video' ? 'border-primary-500 bg-primary-50' : 'border-ink-200 hover:border-ink-300')}
            >
              <Video className="w-5 h-5 mx-auto mb-1 text-purple-600" />
              <span className="text-sm font-medium">短视频</span>
            </button>
          </div>
          <Input
            label="输入主题或核心想法"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder={createType === 'wechat' ? '例如：为什么每个人都需要AI工作助手' : '例如：3个提升效率的AI工具'}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </div>
      </Modal>
    </div>
  )
}

function ContentCard({ content, onClick }: { content: Content; onClick: () => void }) {
  const isWeChat = content.type === 'wechat'
  const title = isWeChat
    ? (content as any).selectedTitle || content.topic
    : (content as any).selectedTitle || content.topic

  return (
    <Card className="p-3.5 flex items-center gap-3 hover:shadow-hover transition-all cursor-pointer" onClick={onClick}>
      <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
        isWeChat ? 'bg-green-50' : 'bg-purple-50')}>
        {isWeChat ? <PenTool className="w-4.5 h-4.5 text-green-600" /> : <Video className="w-4.5 h-4.5 text-purple-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-800 truncate">{title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Tag color={isWeChat ? 'green' : 'purple'}>{isWeChat ? '公众号' : '视频'}</Tag>
          <span className="text-xs text-ink-400">{getStageLabel(content.stage)}</span>
          {content.status === 'final' && <Tag color="blue">已定稿</Tag>}
          <span className="text-xs text-ink-400">{formatDateTime(content.updatedAt)}</span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-ink-300" />
    </Card>
  )
}
