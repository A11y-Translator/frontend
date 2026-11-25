// 넘겨주기 카드의 기록 → 방 대화에 끼워 넣을 이벤트 줄 (요청 · 넘겨주기 · 수정 요청 · 확인 · 막힘).
// 카드가 생기거나 전달 · 수정 요청 · 확인 · 막힘 처리되면, 관련된 두 방과 전체 방의 대화에 한 줄씩 보입니다.
// 피그마에 그려진 예시 줄(roomData 의 e1 · e2)과 겹치지 않도록, 예시 기록(id 가 s1, s2 …)은 빼고 그 뒤에 생긴 기록만 써요.
import type { RoleId } from '@/data/mock'
import { dueDay, routeText, type HandoffCard, type HistoryRecord } from '@/data/requestStore'
import type { RoomId } from '@/data/roomStore'
import type { EventItem } from './roomData'

const isSeed = (r: HistoryRecord) => /^s\d+$/.test(r.id)

/** 받는 쪽 → 보내는 쪽 (요청 · 수정 요청의 방향) */
const backward = (card: HandoffCard) => routeText({ fromRole: card.toRole, toRole: card.fromRole })

function eventOf(card: HandoffCard, r: HistoryRecord): Omit<EventItem, 'kind' | 'id' | 'to'> | null {
  switch (r.kind) {
    case 'request':
      return { tone: 'request', chip: '요청', text: `${backward(card)} · ${card.title} · ${dueDay(card.due)}까지` }
    case 'deliver':
      return { tone: 'handoff', chip: '넘겨주기', text: `${routeText(card)} · ${card.title} 전달됨 · 확인 대기` }
    case 'redeliver':
      return { tone: 'handoff', chip: '넘겨주기', text: `${routeText(card)} · ${card.title} 다시 전달됨 · 확인 대기` }
    case 'fix':
      return { tone: 'request', chip: '수정 요청', text: `${backward(card)} · ${card.title} · ${r.text}` }
    case 'confirm':
      return { tone: 'handoff', chip: '확인', text: `${routeText(card)} · ${card.title} 확인 완료` }
    case 'block':
      return { tone: 'request', chip: '막힘', text: `${routeText(card)} · ${card.title} · ${r.text}` }
    default:
      // 수락 · 날짜 제안 · 코멘트 등은 요청 상세와 알림에만
      return null
  }
}

/** 이 방과 관련된 카드인지 (전체 방은 모두) */
const involves = (card: HandoffCard, room: RoomId) => room === 'all' || card.fromRole === (room as RoleId) || card.toRole === (room as RoleId)

/** 이 방 대화에 보일 이벤트 줄과 생긴 때 */
export function roomEvents(cards: readonly HandoffCard[], room: RoomId): { ts: number; item: EventItem }[] {
  return cards
    .filter((card) => involves(card, room))
    .flatMap((card) =>
      card.history.flatMap((r) => {
        const event = isSeed(r) ? null : eventOf(card, r)
        return event ? [{ ts: r.ts ?? 0, item: { kind: 'event' as const, id: `ev-${card.id}-${r.id}`, to: `/requests/${card.id}`, ...event } }] : []
      }),
    )
}
