// 웹 화면(검사 · 이슈 상세 · 리포트 · 할 일)이 같이 쓰는 계산 함수.
// 임시 숫자는 여기 두지 않고 shared/mocks 에서 가져옵니다.
import { comments as initialComments, issues as initialIssues } from '@/shared/mocks'
import { SCAN } from '@/shared/mocks/scan'
import type { AppState } from '@/shared/store'
import type { Category, Comment, Issue } from '@/shared/api/types'
import { bySeverity } from '@/shared/selectors'

export { bySeverity }

/** mocks 초기 데이터에서 이미 해결된 이슈 수 — 재검사로 새로 해결된 만큼만 더하기 위해 */
const INITIAL_RESOLVED = initialIssues.filter((i) => i.status === 'resolved').length

export const isResolved = (i: Issue) => i.status === 'resolved'

/** store 상태로 계산한 요약 숫자 */
export function deriveStats(state: Pick<AppState, 'issues' | 'comments'>) {
  const resolvedNow = state.issues.filter(isResolved).length
  const resolved = SCAN.baseResolved + Math.max(0, resolvedNow - INITIAL_RESOLVED)
  const total = SCAN.totalIssues
  return {
    total,
    resolved,
    unresolved: Math.max(0, total - resolved),
    delta: total - SCAN.prevIssues,
    // 이번 프로토타입에서 새로 단 코멘트만큼 남은 코멘트도 늘어납니다
    remainingComments: SCAN.remainingComments + Math.max(0, state.comments.length - initialComments.length),
  }
}

/** 이슈별 코멘트 수: mocks 의 숫자와 실제 스레드 개수 중 큰 값 (새 코멘트를 달면 늘어남) */
export function commentCount(issue: Issue, comments: Comment[]) {
  const n = comments.filter((c) => c.issueId === issue.id).length
  return Math.max(issue.comments, n)
}

/** 체크 칩 묶음: 색 대비 / 대체 텍스트 / 키보드 / 폼 레이블 / 기타(링크·문서 구조) */
export const CATEGORY_FILTERS: { id: string; label: string; match: (c: Category) => boolean }[] = [
  { id: 'all', label: '전체', match: () => true },
  { id: 'contrast', label: '색 대비', match: (c) => c === '색 대비' },
  { id: 'alt', label: '대체 텍스트', match: (c) => c === '대체 텍스트' },
  { id: 'keyboard', label: '키보드', match: (c) => c === '키보드' },
  { id: 'form', label: '폼 레이블', match: (c) => c === '폼 레이블' },
  { id: 'etc', label: '기타', match: (c) => c === '링크' || c === '문서 구조' },
]


/** 상태 태그 (Figma Component 1) 종류 */
export type TagKind = 'done' | 'progress' | 'important' | 'normal'
export function tagKindOf(i: Issue): TagKind {
  if (i.status === 'resolved') return 'done'
  if (i.priority === 'high') return 'important'
  if (i.status === 'in_progress' || i.status === 'review') return 'progress'
  return 'normal'
}

/** 김혜승 → 혜승 (디자인의 코멘트 작성자 표기) */
export const shortName = (name: string) => (name.length === 3 ? name.slice(1) : name)

/** 색 대비 이슈 요약: "2.7 : 1 → 기준 4.5 : 1" */
export function contrastSummary(i: Issue) {
  return i.category === '색 대비' ? '2.7 : 1 → 기준 4.5 : 1' : i.wcag
}


/** ISO 시간 → '2026.11.10 14:05' (새 프로젝트 검사 시각 표시) */
export function formatScannedAt(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
