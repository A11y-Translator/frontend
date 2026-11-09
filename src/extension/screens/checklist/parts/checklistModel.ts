// 체크리스트 공통 데이터 (v1·v2 공통) — 모든 숫자는 store 에서 계산
import { useAppState } from '@/shared/store'
import { CURRENT_USER_ID } from '@/shared/mocks'
import type { Issue } from '@/shared/api/types'
import { myIssues, scanStats } from '@/extension/scanStats'
import { buildFix } from '@/extension/buildFix'

export type ChecklistTab = 'mine' | 'all' | 'unassigned'

export const CHECKLIST_TABS: { key: ChecklistTab; label: string }[] = [
  { key: 'mine', label: '내 할 일' },
  { key: 'all', label: '전체' },
  { key: 'unassigned', label: '미배정' },
]

const byNo = (a: Issue, b: Issue) => a.no - b.no

export function useChecklistData() {
  const { issues } = useAppState()
  const stats = scanStats(issues)
  const mine = myIssues(issues)
  const lists: Record<ChecklistTab, Issue[]> = {
    mine,
    all: [...issues].sort(byNo),
    unassigned: issues.filter((i) => i.status === 'unassigned').sort(byNo),
  }
  return {
    lists,
    counts: {
      mine: mine.length,
      // "전체"는 검사 요약 기준 숫자 (02 검사 결과의 "이슈 N개"와 같게)
      all: stats.total,
      unassigned: lists.unassigned.length,
    } as Record<ChecklistTab, number>,
    mineDone: mine.filter(isDone).length,
    total: stats.total,
    scannedAt: stats.scannedAt,
  }
}

export const isDone = (i: Issue) => i.status === 'resolved'
export const isMine = (i: Issue) => i.assigneeId === CURRENT_USER_ID

/** 상태 문구 — 색·취소선만으로 상태를 알리지 않도록 항상 글자로도 제공 */
export const statusLabel = (i: Issue) =>
  isDone(i) ? (i.autoResolved ? '재검사에서 자동 해결됨' : '해결됨') : '남음'

/** 접힌 상태에서 보여줄 한 줄 추천 수정 (색 대비는 첫 번째 추천 색 기준) */
export const suggestionText = (i: Issue) => buildFix(i, i.fixOptions?.[0]?.color).designer
