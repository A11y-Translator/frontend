// 웹·확장이 같이 쓰는 계산 (컴포넌트 아님). 백엔드가 집계값을 주면 해당 함수만 교체하면 됩니다.
import { issues as initialIssues } from '@/shared/mocks'
import type { Issue, Member, Severity, Team } from '@/shared/api/types'

export const SEVERITY_RANK: Record<Severity, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 }

/** 심각도순 → 번호순 정렬 */
export const bySeverity = (a: Issue, b: Issue) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.no - b.no
export const byNo = (a: Issue, b: Issue) => a.no - b.no

/** 직군 표시 순서 */
export const TEAM_ORDER: Team[] = ['design', 'frontend', 'backend', 'pm']

const openOf = (list: Issue[], id: string) => list.filter((i) => i.assigneeId === id && i.status !== 'resolved').length
const resolvedOf = (list: Issue[], id: string) => list.filter((i) => i.assigneeId === id && i.status === 'resolved').length

/**
 * 팀원의 담당/해결 수.
 * [임시] 목업 숫자를 기준값으로 두고, 화면에서 바뀐 만큼(넘기기·분배·자동 해결)만 더하고 뺍니다.
 * 백엔드가 붙으면 서버 집계값으로 교체.
 */
export function memberLoad(m: Member, issues: Issue[]) {
  return {
    assigned: Math.max(0, m.assigned + openOf(issues, m.id) - openOf(initialIssues, m.id)),
    resolved: Math.max(0, m.resolved + resolvedOf(issues, m.id) - resolvedOf(initialIssues, m.id)),
  }
}
