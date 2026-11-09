// 할 일 페이지(탭 3개 + 넘기기 모달)에서 같이 쓰는 계산·상수 모음.
// 컴포넌트가 아닌 것만 둡니다 (react-refresh 규칙 때문에 컴포넌트는 TodoBits.tsx 에).
import { members } from '@/shared/mocks'
import type { Comment, Issue, Member, Team } from '@/shared/api/types'
// 공통 계산은 shared/selectors, 알림은 web/common 에서 가져와 다시 내보냅니다
export { bySeverity, byNo, memberLoad, TEAM_ORDER } from '@/shared/selectors'
export { useAnnouncer } from '@/web/common/useAnnouncer'

export const TODO_TABS = ['mine', 'team', 'unassigned'] as const
export type TodoTab = (typeof TODO_TABS)[number]
export const isTodoTab = (v?: string): v is TodoTab => TODO_TABS.includes(v as TodoTab)

/** 코멘트 작성자 옆에 붙는 짧은 직군 표기 (디자인: "민준 · FE") */
export const TEAM_SHORT: Record<Team, string> = { design: '디자인', frontend: 'FE', backend: 'BE', pm: 'PM' }

/** 담당자 선택에서 "○○ 팀 전체 (미지정)"를 뜻하는 값 */
export const TEAM_ALL = '__team__'

export const teamMembers = (team: Team) => members.filter((m) => m.team === team)

/** 담당이 이 수보다 적으면 "이번 주 여유 있음" */
export const ROOM_LIMIT = 5

/** "버전 12까지" 같은 마감에서 목표 버전을 꺼냄. 없으면 이슈가 나온 버전 */
export function targetVersion(i: Issue) {
  const m = i.due?.match(/버전\s*(\d+)/)
  return m ? Number(m[1]) : i.version
}

/** 수정안(추천 색·코드)이 있는지 */
export const hasFix = (i: Issue) => Boolean(i.fixOptions?.length || i.fixCode)

/** "@혜승" 또는 "@김혜승" 멘션이 들어간 코멘트 */
export function mentionsOf(comments: Comment[], me: Member) {
  const given = me.name.length > 2 ? me.name.slice(1) : me.name
  return comments.filter((c) => c.authorId !== me.id && (c.body.includes(`@${given}`) || c.body.includes(`@${me.name}`)))
}

