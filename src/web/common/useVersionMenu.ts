// 헤더 "버전 N ▾" 드롭다운에 들어갈 버전 목록.
// 새 프로젝트: 검사 기록(inspectionHistory) / 데모 프로젝트B: mocks 의 versions + 재검사로 늘어난 버전
import { useAppState } from '@/shared/store'
import { versions as mockVersions } from '@/shared/mocks'
import { DEFAULT_PROJECT_ID } from '@/shared/mocks/scan'
import { formatScannedAt } from './issueHelpers'

export interface VersionMenuItem {
  no: number
  date: string
  issues: number
  to: string
  /** 최신 버전 */
  latest: boolean
}

export function useVersionMenu(projectId: string = DEFAULT_PROJECT_ID): VersionMenuItem[] {
  const state = useAppState()
  const link = (no: number) => `/projects/${projectId}/inspection?v=${no}`
  const history = state.inspectionHistory[projectId]

  if (history?.length) {
    const latest = history[history.length - 1].version
    return [...history]
      .reverse()
      .map((h) => ({ no: h.version, date: formatScannedAt(h.scannedAt), issues: h.issues.length, to: link(h.version), latest: h.version === latest }))
  }

  // 데모 프로젝트B
  const current = state.currentVersion
  const top = mockVersions[0]?.no ?? 0
  const items: VersionMenuItem[] = []
  for (let no = current; no > top; no--) {
    items.push({ no, date: '오늘', issues: state.issues.filter((i) => i.status !== 'resolved').length, to: link(no), latest: no === current })
  }
  for (const v of mockVersions) {
    if (v.no <= current) items.push({ no: v.no, date: v.date, issues: v.issues, to: link(v.no), latest: v.no === current })
  }
  return items
}
