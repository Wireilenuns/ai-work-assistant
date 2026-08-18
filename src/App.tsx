import React, { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar, MainLayout } from './components/Layout'
import { useAppStore } from './store'
import { LoadingSpinner } from './components/ui'

import Today from './pages/Today'
import ContentAssistant from './pages/ContentAssistant'
import WeChatCreation from './pages/WeChatCreation'
import VideoCreation from './pages/VideoCreation'
import Inspiration from './pages/Inspiration'
import Tasks from './pages/Tasks'
import DailyReview from './pages/DailyReview'
import Settings from './pages/Settings'

export default function App() {
  const { initialized, initApp } = useAppStore()

  useEffect(() => {
    initApp()
  }, [])

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-ink-50">
        <LoadingSpinner text="正在初始化工作台..." />
      </div>
    )
  }

  return (
    <HashRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-ink-50">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <Routes>
              <Route path="/" element={<Today />} />
              <Route path="/content" element={<ContentAssistant />} />
              <Route path="/content/wechat/:id" element={<WeChatCreation />} />
              <Route path="/content/wechat" element={<WeChatCreation />} />
              <Route path="/content/video/:id" element={<VideoCreation />} />
              <Route path="/content/video" element={<VideoCreation />} />
              <Route path="/inspiration" element={<Inspiration />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/review" element={<DailyReview />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </HashRouter>
  )
}
