// 아직 연결되지 않은 버튼을 눌렀을 때 "준비 중" 이라고 알려 주는 작은 알림.
// 화면낭독기도 읽도록 role="status" (aria-live) 로 띄웁니다.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { onSyncError } from '@/api/sync'

type Notify = (message: string) => void
const ToastContext = createContext<Notify>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const timer = useRef<number | undefined>(undefined)

  const notify = useCallback<Notify>((m) => {
    setMessage(m)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMessage(''), 2600)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // 서버 저장 · 불러오기가 실패하면(저장소가 값을 되돌린 뒤) 여기로 알림이 와요
  useEffect(() => onSyncError(notify), [notify])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4">
        {message && (
          <div className="rounded-full border border-line bg-surface px-4 py-2.5 text-[13px] font-medium text-ink shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
            {message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

/** const toast = useToast(); toast('저장했어요') */
export function useToast() {
  return useContext(ToastContext)
}

/** 아직 화면/기능이 없는 버튼용: onClick={soon('루트 수정')} → "루트 수정은 아직 준비 중이에요" */
export function useSoon() {
  const toast = useToast()
  return useCallback((what: string) => () => toast(`${what} — 아직 준비 중이에요`), [toast])
}
