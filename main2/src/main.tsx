import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { startSync } from '@/data/hydrate'
import { router } from '@/router'
import { ToastProvider } from '@/ui/toast'
import '@/styles/index.css'

// 서버가 연결돼 있으면(VITE_API_URL) 저장소를 서버 값으로 채움. 목업 모드에서는 아무 일도 하지 않아요
startSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </StrictMode>,
)
