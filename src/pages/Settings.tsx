import React, { useState, useRef } from 'react'
import { useSettingsStore } from '../store'
import { exportAllData, importAllData } from '../data/seedData'
import { Card, Button, Input, Textarea, Select, ConfirmDialog, Tag } from '../components/ui'
import { Settings as SettingsIcon, Download, Upload, Trash2, Sparkles, Briefcase, FileText, Save } from 'lucide-react'

export default function Settings() {
  const { settings, saveSettings, clearDemo, loadDemo } = useSettingsStore()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [importData, setImportData] = useState<any>(null)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Local state for form
  const [form, setForm] = useState({
    workType: settings?.workType || '',
    mainProjects: settings?.mainProjects || '',
    dailyWorkHours: settings?.dailyWorkHours?.toString() || '8',
    deepWorkHours: settings?.deepWorkHours?.toString() || '4',
    contentPlatforms: settings?.contentPlatforms?.join('、') || '',
    contentField: settings?.contentField || '',
    targetAudience: settings?.targetAudience || '',
    contentStyle: settings?.contentStyle || '',
    dislikedExpressions: settings?.dislikedExpressions || '',
    articleLength: settings?.articleLength || '',
    videoLength: settings?.videoLength || '',
    aiMode: settings?.aiMode || 'mock',
  })

  const update = (key: string, value: string) => setForm({ ...form, [key]: value })

  const handleSave = async () => {
    await saveSettings({
      workType: form.workType || undefined,
      mainProjects: form.mainProjects || undefined,
      dailyWorkHours: form.dailyWorkHours ? parseInt(form.dailyWorkHours) : undefined,
      deepWorkHours: form.deepWorkHours ? parseInt(form.deepWorkHours) : undefined,
      contentPlatforms: form.contentPlatforms ? form.contentPlatforms.split(/[、,，]/).map(s => s.trim()).filter(Boolean) : undefined,
      contentField: form.contentField || undefined,
      targetAudience: form.targetAudience || undefined,
      contentStyle: form.contentStyle || undefined,
      dislikedExpressions: form.dislikedExpressions || undefined,
      articleLength: form.articleLength || undefined,
      videoLength: form.videoLength || undefined,
      aiMode: form.aiMode as 'mock' | 'api',
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExport = async () => {
    const data = await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-work-assistant-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        setImportData(data)
        setShowImportConfirm(true)
      } catch {
        alert('文件格式错误，请选择有效的 JSON 备份文件')
      }
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = async () => {
    try {
      await importAllData(importData)
      alert('数据导入成功！')
      window.location.reload()
    } catch (e: any) {
      alert(`导入失败：${e.message}`)
    }
  }

  const handleClearDemo = async () => {
    await clearDemo()
    alert('Demo 数据已清除')
  }

  const handleLoadDemo = async () => {
    await loadDemo()
    alert('Demo 数据已重新加载')
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-ink-800">设置</h1>
        <p className="text-sm text-ink-400 mt-0.5">个人工作档案与偏好</p>
      </div>

      {/* AI Mode */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary-500" />
          <h2 className="text-base font-semibold text-ink-800">AI 模式</h2>
        </div>
        <Select
          label="AI 提供方"
          value={form.aiMode}
          onChange={v => update('aiMode', v)}
          options={[
            { value: 'mock', label: 'Mock 模式（内置模拟，无需配置）' },
            { value: 'api', label: 'API 模式（需要配置，暂未实现）' },
          ]}
        />
        <p className="text-xs text-ink-400 mt-2">
          当前为 Mock 模式，所有 AI 功能使用内置模拟逻辑运行。后续可通过实现 AIProvider 接口接入真实模型。
        </p>
      </Card>

      {/* Work Info */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-blue-500" />
          <h2 className="text-base font-semibold text-ink-800">工作信息</h2>
        </div>
        <div className="space-y-3">
          <Input label="主要工作类型" value={form.workType} onChange={e => update('workType', e.target.value)} placeholder="如：内容创作者、产品经理" />
          <Input label="主要项目" value={form.mainProjects} onChange={e => update('mainProjects', e.target.value)} placeholder="用逗号分隔，如：公众号运营、AI工作助手" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="每日工作时间（小时）" type="number" value={form.dailyWorkHours} onChange={e => update('dailyWorkHours', e.target.value)} />
            <Input label="每日深度工作时间（小时）" type="number" value={form.deepWorkHours} onChange={e => update('deepWorkHours', e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Content Profile */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-green-500" />
          <h2 className="text-base font-semibold text-ink-800">内容档案</h2>
        </div>
        <p className="text-xs text-ink-400 mb-3">AI 生成内容时会优先读取以下设置</p>
        <div className="space-y-3">
          <Input label="内容平台" value={form.contentPlatforms} onChange={e => update('contentPlatforms', e.target.value)} placeholder="用逗号分隔，如：微信公众号、抖音" />
          <Input label="内容领域" value={form.contentField} onChange={e => update('contentField', e.target.value)} placeholder="如：AI工具与效率" />
          <Input label="目标读者" value={form.targetAudience} onChange={e => update('targetAudience', e.target.value)} placeholder="如：知识工作者" />
          <Textarea label="内容风格" value={form.contentStyle} onChange={e => update('contentStyle', e.target.value)} rows={2} placeholder="如：专业但不过于严肃，有个人观点" />
          <Input label="不喜欢的表达" value={form.dislikedExpressions} onChange={e => update('dislikedExpressions', e.target.value)} placeholder="如：赋能、抓手、闭环" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="常用文章长度" value={form.articleLength} onChange={e => update('articleLength', e.target.value)} placeholder="如：2000-3000字" />
            <Input label="常用视频长度" value={form.videoLength} onChange={e => update('videoLength', e.target.value)} placeholder="如：1-3分钟" />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        {saved && <Tag color="green">已保存</Tag>}
        <Button onClick={handleSave}>
          <Save className="w-4 h-4" /> 保存设置
        </Button>
      </div>

      {/* Data Management */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <SettingsIcon className="w-4 h-4 text-ink-500" />
          <h2 className="text-base font-semibold text-ink-800">数据管理</h2>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-ink-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-ink-700">导出数据</p>
              <p className="text-xs text-ink-400">将所有数据导出为 JSON 文件</p>
            </div>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="w-4 h-4" /> 导出
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-ink-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-ink-700">导入数据</p>
              <p className="text-xs text-ink-400">从 JSON 备份文件恢复数据</p>
            </div>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4" /> 导入
            </Button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </div>
          <div className="flex items-center justify-between p-3 bg-ink-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-ink-700">重新加载 Demo 数据</p>
              <p className="text-xs text-ink-400">恢复初始示例数据</p>
            </div>
            <Button variant="secondary" onClick={handleLoadDemo}>
              加载
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-red-700">清除所有 Demo 数据</p>
              <p className="text-xs text-red-400">删除所有任务、灵感、内容和设置</p>
            </div>
            <Button variant="danger" onClick={() => setShowClearConfirm(true)}>
              <Trash2 className="w-4 h-4" /> 清除
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearDemo}
        title="清除所有数据"
        message="⚠️ 此操作将删除所有任务、灵感、内容和设置，且不可恢复。建议先导出备份。确定继续吗？"
        confirmText="确认清除"
        danger
      />

      <ConfirmDialog
        open={showImportConfirm}
        onClose={() => setShowImportConfirm(false)}
        onConfirm={handleConfirmImport}
        title="导入数据"
        message="导入将覆盖当前数据。确定要继续吗？"
        confirmText="确认导入"
      />

      <p className="text-center text-xs text-ink-300 pt-4">
        AI 个人工作助手 v1.0.0 · 本地数据存储于 IndexedDB
      </p>
    </div>
  )
}
