// 프로젝트 정렬 기준 — 최근 수정순 · 생성일 최신순 · 생성일 오래된순
import type { Project } from '@/shared/api/types'
import { projects as MOCK_PROJECTS } from '@/shared/mocks'

export type ProjectSort = 'recent' | 'created-desc' | 'created-asc'

export const PROJECT_SORTS: { value: ProjectSort; label: string }[] = [
  { value: 'recent', label: '최근 수정순' },
  { value: 'created-desc', label: '생성일 최신순' },
  { value: 'created-asc', label: '생성일 오래된순' },
]

/** '26.11.11' (YY.MM.DD) → 시각 */
const parseShortDate = (s: string) => {
  const m = /^(\d{2})\.(\d{1,2})\.(\d{1,2})$/.exec(s.trim())
  return m ? new Date(2000 + Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() : 0
}

/** 생성 시각: createdAt → (예전에 저장된 프로젝트) 예시 데이터 · id 에 든 생성 시각 → 수정일 */
export function createdTime(p: Project): number {
  if (p.createdAt) return Date.parse(p.createdAt) || 0
  const mock = MOCK_PROJECTS.find((m) => m.id === p.id)
  if (mock?.createdAt) return Date.parse(mock.createdAt) || 0
  // 새 프로젝트 id 는 `p${Date.now().toString(36)}` 형식이라 생성 시각을 되살릴 수 있어요
  if (/^p[0-9a-z]{6,}$/.test(p.id)) {
    const t = parseInt(p.id.slice(1), 36)
    if (t > 1_500_000_000_000 && t < 4_000_000_000_000) return t
  }
  return parseShortDate(p.updatedAt)
}

/** 최근 활동 시각: 수정일(날짜만 있음)과 생성 시각 중 늦은 쪽 */
const recentTime = (p: Project) => Math.max(parseShortDate(p.updatedAt), createdTime(p))

export function sortProjects(list: readonly Project[], sort: ProjectSort): Project[] {
  const key = sort === 'recent' ? recentTime : createdTime
  const dir = sort === 'created-asc' ? 1 : -1
  return [...list].sort((a, b) => dir * (key(a) - key(b)))
}

/** 화면에 보일 생성일 (예: 2026.11.25) */
export function createdLabel(p: Project) {
  const t = createdTime(p)
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
