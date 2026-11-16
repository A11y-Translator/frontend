// 사이드바 상태: 화면 폭에 따라 기본 모양을 정하고, 사용자가 접기/펼치기를 누르면 그 선택을 기억합니다.
//  - 768px 미만(모바일): 사이드바 숨김 → 위쪽 ☰ 버튼으로 서랍(drawer)처럼 열기
//  - 768~1279px: 아이콘만 있는 얇은 사이드바가 기본
//  - 1280px 이상: 펼친 사이드바가 기본
import { useCallback, useEffect, useState } from 'react'

const KEY = 'a11y-translator:sidebar'
const MOBILE = '(max-width: 767.98px)'
const WIDE = '(min-width: 1280px)'

type Pref = 'expanded' | 'collapsed' | null

function readPref(): Pref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'expanded' || v === 'collapsed' ? v : null
  } catch {
    return null
  }
}

function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

export function useSidebar() {
  const mobile = useMedia(MOBILE)
  const wide = useMedia(WIDE)
  const [pref, setPref] = useState<Pref>(readPref)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // 모바일에서 벗어나면 서랍은 닫아 둡니다
  useEffect(() => {
    if (!mobile) setDrawerOpen(false)
  }, [mobile])

  const collapsed = pref ? pref === 'collapsed' : !wide

  const toggle = useCallback(() => {
    const next = collapsed ? 'expanded' : 'collapsed'
    setPref(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* 저장소를 못 쓰면 이번 방문 동안만 기억 */
    }
  }, [collapsed])

  return { mobile, collapsed, toggle, drawerOpen, setDrawerOpen }
}
