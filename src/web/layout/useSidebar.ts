// 사이드바 상태: 화면 폭에 따라 기본 모양을 정하고, 사용자가 경계를 끌어 바꾼 폭·접힘을 기억합니다.
//  - 768px 미만(모바일): 사이드바 숨김 → 위쪽 ☰ 버튼으로 서랍(drawer)처럼 열기
//  - 768~1279px: 아이콘만 있는 얇은 사이드바가 기본
//  - 1280px 이상: 펼친 사이드바가 기본
//  - 경계 끌기: 펼친 폭을 SIDEBAR_MIN~SIDEBAR_MAX 사이로 조절, COLLAPSE_AT 보다 좁게 끌면 아이콘만으로 접힘
import { useCallback, useEffect, useState } from 'react'

const KEY = 'a11y-translator:sidebar'
const WIDTH_KEY = 'a11y-translator:sidebar-width'
const MOBILE = '(max-width: 767.98px)'
const WIDE = '(min-width: 1280px)'

/** 아이콘만 있는 사이드바 폭 */
export const SIDEBAR_RAIL = 68
/** 펼친 사이드바로 끌 수 있는 폭 */
export const SIDEBAR_MIN = 200
export const SIDEBAR_MAX = 360
/** 이보다 좁게 끌어 놓으면 아이콘만으로 접힘 */
export const COLLAPSE_AT = 140

type Pref = 'expanded' | 'collapsed' | null

function read<T>(key: string, parse: (v: string | null) => T): T {
  try {
    return parse(localStorage.getItem(key))
  } catch {
    return parse(null)
  }
}

function save(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* 저장소를 못 쓰면 이번 방문 동안만 기억 */
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
  const [pref, setPref] = useState<Pref>(() => read(KEY, (v) => (v === 'expanded' || v === 'collapsed' ? v : null)))
  /** 사용자가 끌어서 정한 펼친 폭 (없으면 화면 폭에 맞춘 기본값 --sidebar-w) */
  const [width, setWidthState] = useState<number | null>(() =>
    read(WIDTH_KEY, (v) => {
      const n = Number(v)
      return v && n >= SIDEBAR_MIN && n <= SIDEBAR_MAX ? n : null
    }),
  )
  const [drawerOpen, setDrawerOpen] = useState(false)

  // 모바일에서 벗어나면 서랍은 닫아 둡니다
  useEffect(() => {
    if (!mobile) setDrawerOpen(false)
  }, [mobile])

  const collapsed = pref ? pref === 'collapsed' : !wide

  const setCollapsed = useCallback((next: boolean) => {
    const p = next ? 'collapsed' : 'expanded'
    setPref(p)
    save(KEY, p)
  }, [])

  const toggle = useCallback(() => setCollapsed(!collapsed), [collapsed, setCollapsed])

  /** 펼친 폭 정하기 (null = 기본값으로 되돌리기) */
  const setWidth = useCallback((w: number | null) => {
    const next = w === null ? null : Math.round(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, w)))
    setWidthState(next)
    save(WIDTH_KEY, next === null ? null : String(next))
  }, [])

  return { mobile, collapsed, toggle, setCollapsed, width, setWidth, drawerOpen, setDrawerOpen }
}
