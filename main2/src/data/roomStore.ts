// 방(원정대) 대화에 내가 보낸 메시지 저장소 — 다른 화면에 다녀와도, 새로고침해도 남습니다.
// 화면은 useRoomMessages() 로 바로(동기) 읽고, 저장은 api.rooms 를 거칩니다 (@/api):
//   목업 모드 = 브라우저 localStorage · http 모드 = GET/POST /rooms/:room/messages
// 피그마에 그려진 예시 대화는 pages/rooms/roomData.ts 에 그대로 있고, 여기에는 그 뒤에 보낸 것만 쌓여요.
import { useSyncExternalStore } from 'react'
import { api } from '@/api'
import { isMock } from '@/api/config'
import { readJSON, writeJSON } from '@/api/storage'
import { pull, push } from '@/api/sync'
import type { Attachment } from '@/pages/rooms/roomData'
import type { RoleId } from './mock'

/** 'all' = 전체 원정대 방 (여기에 쓴 메시지는 세 방 모두에 보임) */
export type RoomId = 'all' | RoleId
export const ROOM_IDS: RoomId[] = ['all', 'design', 'front', 'back']

export interface RoomMessage {
  id: string
  /** 보낸 곳 */
  room: RoomId
  author: string
  /** 보낸 사람의 역할 (아바타 · 방 칩 색) */
  role: RoleId
  text: string
  /** 'HH:MM' (화면에 보이는 시각) */
  time: string
  /** 보낸 때(ms) — 시간순 정렬 */
  ts: number
  /** Figma 미리보기 · PR 카드 같은 첨부 (서버가 만들어 줄 때만) */
  attachments?: Attachment[]
}

export const ROOM_MESSAGES_KEY = 'oreum:rooms:v1'
const HANDOFFS_KEY = 'oreum:room-handoffs:v1'

/** 브라우저에 저장된 값 읽기 (목업 모드의 "서버 값") */
export function readLocalMessages(): RoomMessage[] {
  const list = readJSON(ROOM_MESSAGES_KEY)
  const ok = Array.isArray(list) && list.every((m: Partial<RoomMessage> | null) => m && typeof m.id === 'string' && typeof m.text === 'string' && typeof m.ts === 'number')
  return ok ? (list as RoomMessage[]) : []
}

function readHandoffs(): Record<string, string> {
  const v = readJSON(HANDOFFS_KEY)
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, string>) : {}
}

let messages: RoomMessage[] = isMock ? readLocalMessages() : []
let handoffs = readHandoffs()
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const notify = () => listeners.forEach((l) => l())

function set(next: RoomMessage[]) {
  messages = next
  notify()
}

/** const messages = useRoomMessages() — 모든 방의 메시지 (보낸 순서) */
export function useRoomMessages(): RoomMessage[] {
  return useSyncExternalStore(subscribe, () => messages)
}

/** 이 방에 보이는 메시지인지: 전체 방은 모두, 역할 방은 그 방 + 전체 공지 */
export const inRoom = (message: Pick<RoomMessage, 'room'>, room: RoomId) => room === 'all' || message.room === room || message.room === 'all'

let seq = 0
const pad = (n: number) => String(n).padStart(2, '0')

/** 메시지 보내기. room = 보낼 곳 */
export function sendRoomMessage(room: RoomId, text: string, author: { name: string; role: RoleId }): RoomMessage | undefined {
  const body = text.trim()
  if (!body) return undefined
  const d = new Date()
  const message: RoomMessage = {
    id: `m${d.getTime().toString(36)}${(seq++).toString(36)}`,
    room,
    author: author.name,
    role: author.role,
    text: body,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    ts: d.getTime(),
  }
  set([...messages, message])
  push('메시지 보내기', () => api.rooms.send(room, message), {
    rollback: () => set(messages.filter((m) => m.id !== message.id)),
    done: (saved) => set(messages.map((m) => (m.id === message.id ? saved : m))),
  })
  return message
}

/** 서버에서 불러오기 (http 모드에서 시작할 때 · 로그인 직후) */
export function hydrateRooms() {
  return pull(
    '방 대화 불러오기',
    () => Promise.all(ROOM_IDS.map((room) => api.rooms.list(room))),
    (lists) => set(lists.flat().sort((a, b) => a.ts - b.ts)),
  )
}

/* ───────── "넘겨주기"를 누른 메시지 표시 (화면 상태 — 이 브라우저에만 저장) ───────── */

const handoffKey = (room: RoleId, messageId: string) => `${room}:${messageId}`

/** { 메시지 id → 넘겨주기 카드 id } — 이 방에서 이미 넘겨준 메시지 */
export function useRoomHandoffs(room: RoleId): Record<string, string> {
  const all = useSyncExternalStore(subscribe, () => handoffs)
  const prefix = `${room}:`
  return Object.fromEntries(
    Object.entries(all)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, cardId]) => [key.slice(prefix.length), cardId]),
  )
}

export function markHandoff(room: RoleId, messageId: string, cardId: string) {
  handoffs = { ...handoffs, [handoffKey(room, messageId)]: cardId }
  writeJSON(HANDOFFS_KEY, handoffs)
  notify()
}
