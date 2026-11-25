// 방의 "현재 흐름"을 넘겨주기 카드 저장소에서 만들어 냅니다 (기획안 §7-3 "이 방의 흐름" = 메인 흐름을 이 방 기준으로 좁힌 것).
//
// useRoomFlows(role)        → [넘겨줄 것, 받을 것]  (FlowGroup 에 그대로 전달)
// flowStatus(card, dir)     → 행 오른쪽 글자와 색 (막힘 N일째 / 마감 / 확인 대기 / 확인하기 / 요청 …)
// roomSummary(cards, role)  → 방 카드의 한 줄 요약 (전체 방)
import type { RoleId } from '@/data/mock'
import { blockedDays, dueDay, dueShort, dueState, isFixing, sortByUrgency, useRequests, type HandoffCard } from '@/data/requestStore'
import type { FlowGroupData, FlowItem, FlowTone } from './roomData'

type Dir = FlowItem['dir']

/** out = 보내는 방에서 볼 때 · in = 받는 방에서 볼 때 */
export function flowStatus(card: HandoffCard, dir: Dir): { status: string; tone: FlowTone } {
  // 기획안 §8-5: 막힘이 가장 먼저 보이게
  if (card.blocked) return { status: `${blockedDays(card)}일째 막힘`, tone: 'blocked' }
  if (card.status === 'requested') return { status: card.proposedDue ? '날짜 조율 중' : '요청', tone: 'muted' }
  if (card.status === 'delivered') {
    // 검토 화면이 따로 있는 카드(배포된 PR)는 "검토 요청"
    if (card.reviewPath) return { status: dir === 'out' && card.auto ? '검토 요청 (자동)' : '검토 요청', tone: 'action' }
    // 기획안 §6-①: 받는 쪽이 확인해야 완료
    return dir === 'out' ? { status: '확인 대기', tone: 'muted' } : { status: '확인하기', tone: 'action' }
  }
  if (isFixing(card)) return { status: '수정 요청', tone: 'due' }
  const due = dueState(card)
  if (due === 'overdue') return { status: '마감 지남', tone: 'blocked' }
  // 보내는 방은 날짜만, 받는 방은 시각까지
  const text = dir === 'out' ? dueDay(card.due) : dueShort(card.due)
  if (due === 'today') return { status: text.replace(/^\d{1,2}\s*\/\s*\d{1,2}/, '오늘'), tone: 'due' }
  return { status: text, tone: due === 'later' ? 'date' : 'muted' }
}

function flowItem(card: HandoffCard, dir: Dir): FlowItem {
  // 받는 쪽의 "확인하기" 는 바로 확인 화면(09)으로, 나머지는 요청 상세로
  const review = dir === 'in' && card.status === 'delivered' && !card.reviewPath
  return {
    id: card.id,
    title: card.title,
    dir,
    role: dir === 'out' ? card.toRole : card.fromRole,
    tag: dir === 'out' ? card.tag : undefined,
    ...flowStatus(card, dir),
    to: `/requests/${card.id}${review ? '/review' : ''}`,
  }
}

/** 넘겨줄 것 = 이 방이 보내는 카드 · 받을 것 = 이 방이 받는 카드. 확인이 끝난 카드는 빠져요 (기획안 §8-4) */
export function roomFlows(cards: readonly HandoffCard[], role: RoleId): FlowGroupData[] {
  // 기획안 §7-2 정렬: 막힘·마감 지남 → 마감 임박 → 확인 대기 → 나머지
  const open = sortByUrgency(cards)
  const out = open.filter((c) => c.fromRole === role).map((c) => flowItem(c, 'out'))
  const incoming = open.filter((c) => c.toRole === role).map((c) => flowItem(c, 'in'))
  return [
    { title: '넘겨줄 것', count: out.length, items: out },
    { title: '받을 것', count: incoming.length, items: incoming },
  ]
}

export function useRoomFlows(role: RoleId): FlowGroupData[] {
  return roomFlows(useRequests(), role)
}

/** 방의 지금 상황을 한 줄로 (급한 것 두 개) */
export function roomSummary(cards: readonly HandoffCard[], role: RoleId) {
  const phrases = sortByUrgency(cards)
    .filter((c) => c.fromRole === role || c.toRole === role)
    .slice(0, 2)
    .map((c) => {
      const mine = c.fromRole === role
      if (c.blocked) return `${c.title} ${blockedDays(c)}일째 막힘`
      if (c.status === 'delivered') return mine ? `${c.title} 넘김 완료` : `${c.title} 확인 필요`
      if (c.status === 'requested') return mine ? `${c.title} 요청 받음` : `${c.title} 요청 보냄`
      const due = dueState(c)
      if (due === 'overdue') return `${c.title} 마감 지남`
      if (due === 'today') return mine ? `${c.title} 오늘 마감 예정` : `${c.title} 오늘 받을 예정`
      return `${c.title} ${dueDay(c.due)}까지`
    })
  return phrases.join(' · ') || '주고받을 것이 없어요'
}
