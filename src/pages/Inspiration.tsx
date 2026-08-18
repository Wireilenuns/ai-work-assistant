import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../data/db'
import { useInspirationStore } from '../store'
import { Card, Button, Input, Textarea, EmptyState, Tag, ConfirmDialog, Modal } from '../components/ui'
import { getRelativeDate, getInspirationStatusLabel, getInspirationStatusColor } from '../utils/date'
import { Lightbulb, Plus, Search, PenTool, Video, Trash2, Filter } from 'lucide-react'
import type { Inspiration, ContentType } from '../models/types'
import clsx from 'clsx'

export default function Inspiration() {
  const navigate = useNavigate()
  const { addInspiration, deleteInspiration, convertToContent, updateInspiration } = useInspirationStore()
  const [showAdd, setShowAdd] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newTags, setNewTags] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const inspirations = useLiveQuery(() => db.inspirations.orderBy('createdAt').reverse().toArray(), [])

  const filtered = (inspirations || []).filter(insp => {
    const matchSearch = !search || insp.content.includes(search) || insp.tags.some(t => t.includes(search))
    const matchStatus = filterStatus === 'all' || insp.status === filterStatus
    return matchSearch && matchStatus
  })

  const handleAdd = async () => {
    if (!newContent.trim()) return
    const tags = newTags.split(/[,，\s]+/).filter(Boolean)
    await addInspiration(newContent, tags)
    setNewContent('')
    setNewTags('')
    setShowAdd(false)
  }

  const handleConvert = async (id: string, type: ContentType) => {
    const contentId = await convertToContent(id, type)
    navigate(type === 'wechat' ? `/content/wechat/${contentId}` : `/content/video/${contentId}`)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-800">灵感库</h1>
          <p className="text-sm text-ink-400 mt-0.5">记录每一个一闪而过的想法</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> 记录灵感
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索灵感内容或标签..."
            className="input-field pl-9"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="input-field w-32 cursor-pointer"
        >
          <option value="all">全部状态</option>
          <option value="pending">待整理</option>
          <option value="ready">可创作</option>
          <option value="creating">创作中</option>
          <option value="used">已使用</option>
        </select>
      </div>

      {/* Inspiration List */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map(insp => (
            <InspirationCard
              key={insp.id}
              insp={insp}
              onConvert={handleConvert}
              onDelete={() => setDeleteId(insp.id)}
              onUpdate={(updates) => updateInspiration(insp.id, updates)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Lightbulb}
            title={search ? "没有找到匹配的灵感" : "灵感库还是空的"}
            description={search ? "试试其他关键词" : "记录下每一个想法，让它成为创作的种子"}
            action={!search && <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> 记录第一条灵感</Button>}
          />
        </Card>
      )}

      {/* Add Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="记录灵感"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>取消</Button>
            <Button onClick={handleAdd}>保存</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Textarea
            label="灵感内容"
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="一句话记录你的想法..."
            rows={4}
            autoFocus
          />
          <Input
            label="标签（可选，用逗号分隔）"
            value={newTags}
            onChange={e => setNewTags(e.target.value)}
            placeholder="AI, 效率, 思考"
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteInspiration(deleteId) }}
        title="删除灵感"
        message="确定要删除这条灵感吗？此操作不可撤销。"
        confirmText="删除"
        danger
      />
    </div>
  )
}

function InspirationCard({
  insp,
  onConvert,
  onDelete,
  onUpdate,
}: {
  insp: Inspiration
  onConvert: (id: string, type: ContentType) => void
  onDelete: () => void
  onUpdate: (updates: Partial<Inspiration>) => void
}) {
  return (
    <Card className="p-4 group hover:shadow-hover transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink-800 leading-relaxed">{insp.content}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {insp.tags.map(tag => <Tag key={tag} color="blue">{tag}</Tag>)}
            <span className={clsx('badge', getInspirationStatusColor(insp.status))}>
              {getInspirationStatusLabel(insp.status)}
            </span>
            {insp.recommendedType && <Tag color="purple">{insp.recommendedType === 'wechat' ? '公众号' : '视频'}</Tag>}
            <span className="text-xs text-ink-400">{getRelativeDate(insp.createdAt)}</span>
          </div>
        </div>
        <button onClick={onDelete} className="text-ink-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {insp.status !== 'used' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-ink-100">
          <Button size="sm" variant="ghost" onClick={() => onConvert(insp.id, 'wechat')}>
            <PenTool className="w-3.5 h-3.5" /> 转公众号选题
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onConvert(insp.id, 'video')}>
            <Video className="w-3.5 h-3.5" /> 转视频选题
          </Button>
          {insp.status === 'pending' && (
            <Button size="sm" variant="ghost" onClick={() => onUpdate({ status: 'ready' })}>
              标记为可创作
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
