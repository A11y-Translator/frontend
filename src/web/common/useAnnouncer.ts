// 화면낭독기 알림(aria-live) + 화면 아래 토스트에 같이 쓰는 메시지.
// 같은 문장을 연달아 알려도 다시 읽히도록 한 번 비웠다가 넣습니다.
import { useCallback, useEffect, useRef, useState } from 'react'

export function useAnnouncer() {
  const [message, setMessage] = useState('')
  const timers = useRef<number[]>([])
  const announce = useCallback((m: string) => {
    timers.current.forEach((t) => window.clearTimeout(t))
    setMessage('')
    timers.current = [window.setTimeout(() => setMessage(m), 60), window.setTimeout(() => setMessage(''), 4500)]
  }, [])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  return [message, announce] as const
}
