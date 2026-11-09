import { createContext, useContext, useEffect, useRef, type RefObject } from 'react'
import { actions } from '@/shared/store'
import type { Issue } from '@/shared/api/types'

export type PanelScreen =
  | { name: 'login' }
  /** selectedId: 상세에서 돌아왔을 때 방금 본 카드를 표시·포커스 */
  | { name: 'result'; selectedId?: string }
  | { name: 'fix'; issueId: string }
  | { name: 'save' }
  /** sidebar/checklist (v1/v2 미정 — screens/checklist/index.tsx 에서 버전 선택) */
  | { name: 'checklist' }
  /**
   * prevResolved: 재검사 직전에 이미 해결 상태였던 이슈 id → 이번 재검사로 새로 해결된 것만 골라내기 위해 사용
   * auto: 페이지 새로고침(↻)으로 자동 재검사됐는지
   */
  | { name: 'recheck'; prevResolved: string[]; auto: boolean }

export interface PanelNav {
  screen: PanelScreen
  go: (s: PanelScreen) => void
  /** 재검사 실행 후 07 화면으로 이동 */
  recheck: (auto?: boolean) => void
  /** 페이지(데모 사이트)에서 해당 이슈 요소 강조. null 이면 해제 */
  highlight: (issueId: string | null) => void
  overlay: boolean
  setOverlay: (on: boolean) => void
  /** 첫 화면이 아니면 true — 화면이 바뀔 때 제목으로 포커스를 옮기기 위해 사용 */
  navigatedRef: RefObject<boolean>
}

export const PanelContext = createContext<PanelNav | null>(null)

export function usePanel(): PanelNav {
  const ctx = useContext(PanelContext)
  if (!ctx) throw new Error('usePanel 은 PanelApp 안에서만 사용할 수 있어요')
  return ctx
}

/**
 * 재검사를 실행하고 07 화면 상태를 돌려줍니다.
 * 패널의 "재검사"/"다시 검사" 버튼과 데모 브라우저의 ↻(새로고침)이 같이 씁니다.
 */
export function startRecheck(issues: Issue[], auto: boolean): PanelScreen {
  const prevResolved = issues.filter((i) => i.status === 'resolved').map((i) => i.id)
  actions.recheck()
  return { name: 'recheck', prevResolved, auto }
}

/**
 * 화면 전환 시 스크린리더·키보드 사용자가 새 화면의 시작점을 알 수 있도록 제목에 포커스를 옮깁니다.
 * (처음 열렸을 때는 포커스를 뺏지 않음. key 가 바뀌면 — 예: 이전/다음 이슈 — 다시 포커스)
 */
export function useScreenFocus<T extends HTMLElement>(key?: string) {
  const ref = useRef<T>(null)
  const { navigatedRef } = usePanel()
  useEffect(() => {
    if (navigatedRef.current) ref.current?.focus()
  }, [navigatedRef, key])
  return ref
}
