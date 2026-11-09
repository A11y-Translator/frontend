// 웹 ↔ 확장이 같이 보는 상태 (프로토타입용).
// 확장에서 "웹으로 전송"하면 웹의 할 일에 나타나고, 재검사하면 웹 리포트도 바뀌는 흐름을 보여주기 위한 것.
// 같은 브라우저 안에서 localStorage 로 공유합니다. 백엔드가 붙으면 이 파일의 액션을 API 호출로 바꾸면 됩니다.
import { useSyncExternalStore } from 'react'
import { issues as initialIssues, comments as initialComments } from './mocks'
import type { Comment, Issue, Team } from '@/shared/api/types'

const KEY = 'a11y-translator:prototype-state:v1'

export interface AppState {
  issues: Issue[]
  comments: Comment[]
  /** 확장 → 웹 전송 기록 */
  lastSent?: { projectName: string; version: number; at: string; withFixes: boolean }
  /** 확장 "페이지에서 미리 고쳐보기"로 적용 중인 색 (issueId → color) */
  previewFix: Record<string, string>
  currentVersion: number
}

const initial = (): AppState => ({
  issues: initialIssues,
  comments: initialComments,
  previewFix: {},
  currentVersion: 11,
})

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initial(), ...JSON.parse(raw) }
  } catch {
    /* 저장소를 못 쓰는 환경이면 초기값 사용 */
  }
  return initial()
}

let state: AppState = load()
const listeners = new Set<() => void>()

function set(next: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const patch = typeof next === 'function' ? next(state) : next
  state = { ...state, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

// 다른 탭(예: 웹 탭 ↔ 확장 데모 탭)에서 바뀐 내용도 반영
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load()
      listeners.forEach((l) => l())
    }
  })
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/**
 * 전체 상태를 구독합니다. 필터링·계산은 컴포넌트에서 하세요.
 * (예: const { issues } = useAppState(); const mine = issues.filter(...))
 */
export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, () => state)
}

const updateIssue = (id: string, patch: Partial<Issue>) =>
  set((s) => ({ issues: s.issues.map((i) => (i.id === id ? { ...i, ...patch } : i)) }))

export const actions = {
  /** 확장 03 · 미리 고쳐보기: 추천 색 선택 */
  previewFix(issueId: string, color: string) {
    set((s) => ({ previewFix: { ...s.previewFix, [issueId]: color } }))
  },
  /** 확장 03 · 수정안 저장 */
  saveFix(issueId: string, fix: string) {
    updateIssue(issueId, { savedFix: fix })
  },
  /** 확장 04 · 결과 저장 → 웹으로 전송 */
  sendToWeb(projectName: string, version: number, withFixes: boolean) {
    set({ lastSent: { projectName, version, at: '방금', withFixes }, currentVersion: version })
  },
  /** 확장 07 · 재검사: 수정안을 적용한 이슈는 자동 해결 */
  recheck() {
    set((s) => ({
      issues: s.issues.map((i) =>
        (i.savedFix || s.previewFix[i.id]) && i.status !== 'resolved'
          ? { ...i, status: 'resolved', autoResolved: true }
          : i,
      ),
      currentVersion: s.currentVersion + 1,
    }))
  },
  /** 웹 06 · 미배정 → 팀 분배 */
  assignTeam(issueId: string, team: Team, assigneeId?: string) {
    updateIssue(issueId, { team, assigneeId, status: 'todo' })
  },
  /** AI 추천대로 모두 분배 */
  assignAllByAi() {
    set((s) => ({
      issues: s.issues.map((i) =>
        i.status === 'unassigned' && i.aiTeam ? { ...i, team: i.aiTeam, status: 'todo' } : i,
      ),
    }))
  },
  /** 할 일 넘기기 / 담당자 변경 */
  changeAssignee(issueId: string, assigneeId: string | undefined, team?: Team) {
    updateIssue(issueId, { assigneeId, ...(team ? { team } : {}) })
  },
  addComment(c: Omit<Comment, 'id'>) {
    set((s) => ({ comments: [...s.comments, { ...c, id: `c${Date.now()}` }] }))
  },
  /** 데모 초기화 */
  reset() {
    set(initial())
  },
}
