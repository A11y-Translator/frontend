// 팀원 페이지 계산 모음 (컴포넌트 아님).
import { memberById } from '@/shared/mocks'
import type { Comment, Issue, Member } from '@/shared/api/types'
export { memberLoad, TEAM_ORDER } from '@/shared/selectors'
export { useAnnouncer } from '@/web/common/useAnnouncer'

/** 접속 중 표시 (프로토타입용 가짜 값 — 디자인 564:2202 기준) */
export const ONLINE = new Set(['hyeseung', 'seoyeon', 'minjun', 'sohee', 'jiwoo'])

export interface Activity {
  id: string
  memberId: string
  text: string
  time: string
}

/**
 * 스토어에서 최근 활동을 만들어요: 수정안 저장 → 코멘트(최신 먼저) → 재검사 자동 해결.
 * TODO: 백엔드 활동 로그가 생기면 교체.
 */
export function buildActivities(issues: Issue[], comments: Comment[]): Activity[] {
  const title = (id: string) => issues.find((i) => i.id === id)?.title ?? '이슈'
  const saved = issues
    .filter((i) => i.savedFix && i.assigneeId)
    .map((i) => ({ id: `fix-${i.id}`, memberId: i.assigneeId!, text: `‘${i.title}’ 수정안 저장`, time: '최근' }))
  const commented = [...comments]
    .reverse()
    .filter((c) => memberById(c.authorId))
    .map((c) => ({ id: `cm-${c.id}`, memberId: c.authorId, text: `‘${title(c.issueId)}’에 코멘트`, time: c.time }))
  const resolved = issues
    .filter((i) => i.status === 'resolved' && i.autoResolved && i.assigneeId)
    .map((i) => ({ id: `res-${i.id}`, memberId: i.assigneeId!, text: `‘${i.title}’ 자동 해결`, time: `버전 ${i.version} 재검사` }))
  return [...saved, ...commented, ...resolved]
}


/** "@서연" 멘션 문자열 (성 빼고 이름) */
export const mentionHandle = (m: Member) => `@${m.name.length > 2 ? m.name.slice(1) : m.name}`
