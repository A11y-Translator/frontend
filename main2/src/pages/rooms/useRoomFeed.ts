// 방 대화 목록 = 피그마 예시 대화(initial) + 그 뒤에 보낸 메시지(roomStore) + 넘겨주기 카드에서 생긴 이벤트 줄(roomEvents).
// 메시지와 이벤트는 저장소에서 오기 때문에 다른 화면에 다녀와도 남고, 다른 방에서 한 일도 관련된 방에 보여요.
import { useCallback, useMemo, useRef, useState } from 'react'
import { isMock } from '@/api/config'
import { useRequests } from '@/data/requestStore'
import { inRoom, sendRoomMessage, useRoomMessages, type RoomId } from '@/data/roomStore'
import { getAuthor } from '@/data/sessionStore'
import type { FeedItem } from './roomData'
import { roomEvents } from './roomEvents'

export interface RoomFeedState {
  items: FeedItem[]
  /** 내 이름으로 메시지 보내기. note = 안내 문구 앞에 붙일 말 (예: "디자인 방에") · to = 보낼 곳 (기본: 이 방) */
  send: (text: string, note?: string, to?: RoomId) => void
  /** 이 화면에만 보일 항목을 목록 끝에 추가 (저장되지 않음) */
  append: (item: FeedItem, announce?: string) => void
  /** 화면낭독기에 한마디 읽어 주기 */
  announce: (message: string) => void
  /** aria-live 로 읽어 줄 문구 (RoomFeed 의 live 에 그대로 전달) */
  live: string
}

/**
 * initial = 피그마 예시 대화 (목업 모드에서만 보임 — 서버가 붙으면 서버 메시지만)
 * room    = 어느 방인지 ('all' = 전체 원정대)
 * since   = 이 시각(ms) 뒤에 생긴 것만 (09 확인 화면: 카드 아래에 지금부터 오간 것만 보여 줌)
 */
export function useRoomFeed(initial: readonly FeedItem[], room: RoomId, options: { since?: number } = {}): RoomFeedState {
  const { since = 0 } = options
  const cards = useRequests()
  const messages = useRoomMessages()
  const [local, setLocal] = useState<FeedItem[]>([])
  const [live, setLive] = useState('')
  const seq = useRef(0)

  const items = useMemo<FeedItem[]>(() => {
    const stored = [
      ...messages
        .filter((m) => inRoom(m, room))
        .map((m) => ({ ts: m.ts, item: { kind: 'message', id: m.id, author: m.author, role: m.role, time: m.time, timeStyle: 'clock', text: m.text, attachments: m.attachments } satisfies FeedItem })),
      ...roomEvents(cards, room),
    ]
      .filter((x) => x.ts >= since)
      .sort((a, b) => a.ts - b.ts)
      .map((x): FeedItem => x.item)
    return [...(isMock ? initial : []), ...stored, ...local]
  }, [initial, messages, cards, room, since, local])

  // 같은 문구를 연달아 보내도 다시 읽히도록 끝에 보이지 않는 공백을 번갈아 붙임
  const announce = useCallback((message: string) => {
    seq.current += 1
    setLive(seq.current % 2 ? message : `${message} `)
  }, [])

  const append = useCallback<RoomFeedState['append']>(
    (item, message) => {
      setLocal((prev) => [...prev, item])
      if (message) announce(message)
    },
    [announce],
  )

  const send = useCallback<RoomFeedState['send']>(
    (text, note, to = room) => {
      const sent = sendRoomMessage(to, text, getAuthor())
      if (sent) announce(`${note ? `${note} ` : ''}메시지를 보냈어요: ${sent.text}`)
    },
    [announce, room],
  )

  return { items, send, append, announce, live }
}
