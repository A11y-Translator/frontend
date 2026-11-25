// 01-2 흐름 · 노드 보기 — 서비스 단계(기획 · 디자인 · 개발 · 연동 · QA)
// [예시 값] 단계 이름 · 기간 · 진행률(7/10 처럼 단계 안 할 일 수)은 아직 서버에 없어서 여기 둡니다.
// 서버가 단계 목록(GET /phases)을 주면 이 파일만 바꾸면 돼요. 노드(넘겨주기 카드)는 requestStore 의 진짜 값을 씁니다.
import type { RoleId } from '@/data/mock'
import type { HandoffCard } from '@/data/requestStore'

export type PhaseId = 'plan' | 'design' | 'dev' | 'integration' | 'qa'

export interface Phase {
  id: PhaseId
  no: string
  name: string
  dates?: string
  state: 'done' | 'active' | 'planned'
  /** 단계 안 할 일: 끝난 수 / 전체 수 */
  done?: number
  total?: number
  /** 다음 마감 (진행 중 단계만) */
  nextDue?: string
}

export const PHASES: Phase[] = [
  { id: 'plan', no: '✓', name: '기획', state: 'done', done: 6, total: 6 },
  { id: 'design', no: '02', name: '디자인', dates: '11/08 – 11/19', state: 'active', done: 7, total: 10, nextDue: '11/19 (목)' },
  { id: 'dev', no: '03', name: '개발', dates: '11/12 – 11/26', state: 'active', done: 4, total: 13, nextDue: '11/26 (목)' },
  { id: 'integration', no: '04', name: '연동', dates: '11/24 – 11/28', state: 'planned' },
  { id: 'qa', no: '05', name: 'QA', dates: '11/29 – 12/03', state: 'planned' },
]

/** 넘겨주기 카드가 놓이는 단계: 디자인이 끼면 디자인 단계, 프론트 ↔ 백은 개발 단계 (서버가 단계를 주면 그 값) */
export function phaseOf(card: Pick<HandoffCard, 'fromRole' | 'toRole'>): PhaseId {
  const roles: RoleId[] = [card.fromRole, card.toRole]
  return roles.includes('design') ? 'design' : 'dev'
}
