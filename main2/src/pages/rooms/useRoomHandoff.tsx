// 대화 → 카드 전환 (기획안 §7-3 · §8-3): 링크가 있는 메시지의 "넘겨주기" → 받는 역할과 날짜를 정하면
// 넘겨주기 카드가 "전달됨(확인 대기)"으로 생기고, 방의 현재 흐름과 메인보드에 바로 반영됩니다.
//
//   const handoff = useRoomHandoff('design', feed)
//   <RoomFeed … handoff={handoff.feed} />   +   {handoff.dialog}  (RoomShell 의 children 자리)
import { useState, type ReactNode } from 'react'
import { ROLE, type RoleId } from '@/data/mock'
import { handOff, useRequests } from '@/data/requestStore'
import { markHandoff, useRoomHandoffs } from '@/data/roomStore'
import { RequestSendDialog, type SentRequest } from '@/pages/request/RequestSendDialog'
import { useToast } from '@/ui/toast'
import type { HandoffLink, RoomHandoff } from './RoomShell'
import type { HandoffAttachment, MessageItem } from './roomData'
import type { RoomFeedState } from './useRoomFeed'

export function useRoomHandoff(room: RoleId, feed: RoomFeedState): { feed: RoomHandoff; dialog: ReactNode } {
  const toast = useToast()
  // n: 모달을 열 때마다 입력값을 새로 시작하려고 세는 번호
  const [target, setTarget] = useState<{ item: MessageItem; link: HandoffLink; n: number } | null>(null)
  const [open, setOpen] = useState(false)
  // 이미 넘겨준 메시지 → 배지 (저장소에 남아서 다른 화면에 다녀와도 그대로. 카드가 지워졌으면 다시 넘겨줄 수 있음)
  const marks = useRoomHandoffs(room)
  const cards = useRequests()
  const done: Record<string, HandoffAttachment> = {}
  for (const [messageId, cardId] of Object.entries(marks)) {
    if (cards.some((c) => c.id === cardId)) done[messageId] = { type: 'handoff', requestId: cardId, strong: '넘겨줌', rest: '', to: `/requests/${cardId}` }
  }

  const onStart: RoomHandoff['onStart'] = (item, link) => {
    setTarget((prev) => ({ item, link, n: (prev?.n ?? 0) + 1 }))
    setOpen(true)
  }

  const sent = (request: SentRequest) => {
    if (!target) return
    // 같은 이름으로 기다리던 카드가 있으면 그 카드가 "전달됨"으로 바뀜 (기획안 §8-3)
    const { card, merged } = handOff({
      title: request.need,
      fromRole: room,
      toRole: request.to,
      due: request.due,
      description: request.desc,
      links: request.links,
      link: request.links[0],
      author: target.item.author,
    })
    markHandoff(room, target.item.id, card.id)
    // 대화의 '넘겨주기' 줄은 카드 기록에서 만들어져요 (받는 방 · 전체 방에도 같이 보임 — roomEvents)
    feed.announce(`${ROLE[card.toRole].label}에 ${card.title} 넘겨줬어요`)
    toast(merged ? `기다리던 "${card.title}" 카드를 전달됨으로 바꿨어요 · ${ROLE[card.toRole].label} 확인 대기` : `${ROLE[card.toRole].label}에 넘겨줬어요 · 흐름에 올라갔어요`)
    setOpen(false)
  }

  // 닫힌 뒤 포커스: 넘겨줬으면 새 배지로, 취소했으면 누른 버튼으로
  const refocus = (event: Event) => {
    const id = target?.item.id
    const el = document.getElementById(`handoff-${id}`) ?? document.getElementById(`handoff-start-${id}`)
    if (el) {
      event.preventDefault()
      el.focus()
    }
  }

  const dialog = target ? (
    <RequestSendDialog
      key={target.n}
      open={open}
      onOpenChange={setOpen}
      from={room}
      mode="handoff"
      preset={{ need: target.link.name, links: [target.link.label] }}
      onSent={sent}
      onCloseAutoFocus={refocus}
    />
  ) : null

  return { feed: { room, done, onStart }, dialog }
}
