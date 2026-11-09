// 검사 결과 숫자 계산 (02 결과 · 04 저장 · 07 재검사가 같이 씀)
// 디자인의 "이슈 24개"는 검사 요약(scanSummary) 기준이고, store 의 issues 는 그중 대표 이슈 목록입니다.
// 재검사로 새로 해결된 이슈만큼 요약 숫자에서 빼서 "24 → 21" 같은 변화를 보여줍니다.
import { issues as initialIssues, scanSummary, CURRENT_USER_ID } from '@/shared/mocks'
import type { Issue, Severity } from '@/shared/api/types'

/** 검사 시점(10:42)에 이미 해결돼 있던 이슈 — 요약 숫자에 포함되지 않음 */
const resolvedAtScan = new Set(initialIssues.filter((i) => i.status === 'resolved').map((i) => i.id))

/** 검사 이후 해결된 이슈 (재검사 자동 해결 포함) */
export const resolvedSinceScan = (issues: Issue[]) =>
  issues.filter((i) => i.status === 'resolved' && !resolvedAtScan.has(i.id))

/** 남은 이슈 수 */
export function remainingCount(issues: Issue[], resolvedIds?: Set<string>) {
  const resolved = resolvedIds
    ? [...resolvedIds].filter((id) => !resolvedAtScan.has(id)).length
    : resolvedSinceScan(issues).length
  return Math.max(0, scanSummary.total - resolved)
}

export function scanStats(issues: Issue[]) {
  const fixed = resolvedSinceScan(issues)
  const minus = (pred: (i: Issue) => boolean) => fixed.filter(pred).length
  const bySeverity = Object.fromEntries(
    (Object.keys(scanSummary.bySeverity) as Severity[]).map((s) => [
      s,
      Math.max(0, scanSummary.bySeverity[s] - minus((i) => i.severity === s)),
    ]),
  ) as Record<Severity, number>
  const byCategory = scanSummary.byCategory.map((c) => ({
    label: c.label,
    count: Math.max(0, c.count - minus((i) => i.category === c.label)),
  }))
  return {
    total: remainingCount(issues),
    scannedAt: scanSummary.scannedAt,
    bySeverity,
    byCategory,
    /** 아직 남은 대표 이슈 (목록에 표시) */
    open: issues.filter((i) => i.status !== 'resolved').sort((a, b) => a.no - b.no),
    /** 확장에서 저장한 수정안 개수 */
    savedFixes: issues.filter((i) => i.savedFix).length,
  }
}

/** 07 · 내 체크리스트 — 로그인한 사용자에게 배정된 이슈 */
export const myIssues = (issues: Issue[]) =>
  issues.filter((i) => i.assigneeId === CURRENT_USER_ID).sort((a, b) => a.no - b.no)
