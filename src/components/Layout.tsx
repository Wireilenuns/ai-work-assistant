import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, PenTool, Lightbulb, ListTodo, Moon, Settings, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { useAppStore, useSettingsStore } from '../store'

const navItems = [
  { path: '/', label: '今日', icon: Home },
  { path: '/content', label: '内容助手', icon: PenTool },
  { path: '/inspiration', label: '灵感库', icon: Lightbulb },
  { path: '/tasks', label: '工作任务', icon: ListTodo },
  { path: '/review', label: '每日复盘', icon: Moon },
  { path: '/settings', label: '设置', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const { initialized } = useAppStore()

  return (
    <aside className="w-56 flex-shrink-0 h-screen bg-white border-r border-ink-100 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
          <Sparkles className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-ink-800 leading-tight">AI 工作助手</h1>
          <p className="text-[10px] text-ink-400 leading-tight">个人工作台</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={clsx('nav-item', isActive && 'nav-item-active')}
            >
              <item.icon className={clsx('w-4.5 h-4.5', isActive ? 'text-primary-600' : 'text-ink-400')} />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-ink-100">
        <div className="flex items-center gap-2">
          <div className={clsx('w-2 h-2 rounded-full', initialized ? 'bg-green-400' : 'bg-ink-300')} />
          <span className="text-xs text-ink-400">
            {initialized ? 'Mock AI 模式' : '初始化中...'}
          </span>
        </div>
      </div>
    </aside>
  )
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-ink-50">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
