// 알림 — 넘겨주기 카드의 "주고받은 기록"에서 만들어 냅니다 (요청 받음 · 수락 · 날짜 제안 · 확인 필요 · 수정 요청 · 막힘 · 확인 완료 …).
// 알림 목록 자체는 카드에서 계산하고, 여기에는 "읽음" 표시만 저장해요.
//   목업 모드 = 브라우저 localStorage · http 모드 = GET /notifications (읽음 여부) · POST /notifications/read
import { useMemo, useSyncExternalStore } from 'react'
import { api } from '@/api'
import { isMock } from '@/api/config'
import { readJSON } from '@/api/storage'
import { pull, push } from '@/api/sync'
import type { RoleId } from './mock'
import { dayDiff, demoNow, parseWhen, useRequests, type HandoffCard, type HistoryKind, type HistoryRecord } from './requestStore'
import { useSession } from './sessionStore'

/* ───────── 타입 ───────── */

export interface Notification {
  /** `${카드 id}:${기록 id}` */
  id: string
  cardId: string
  kind: HistoryKind
  /** 요청 받음 · 수락 · 날짜 제안 · 확인 필요 · 수정 요청 · 막힘 · 확인 완료 … */
  label: string
  /** 알림을 만든 쪽 → 받는 쪽 */
  fromRole: RoleId
  toRole: RoleId
  /** 누가 */
  actor: string
  /** 카드(항목) 이름 */
  title: string
  text: string
  /** 'MM/DD HH:mm' */
  at: string
  /** 기록한 때(ms). 예시 데이터에는 없음 */
  ts?: number
  /** 오늘 생긴 알림인지 (오늘 / 이전 묶음) */
  today: boolean
  /** 누르면 갈 주소 — 확인이 필요한 전달은 확인 화면(/requests/:id/review) */
  to: string
  read: boolean
}

export const NOTIFICATION_LABEL: Record<HistoryKind, string> = {
  request: '요청 받음',
  accept: '수락',
  propose: '날짜 제안',
  question: '질문',
  comment: '코멘트',
  deliver: '확인 필요',
  redeliver: '확인 필요',
  fix: '수정 요청',
  confirm: '확인 완료',
  block: '막힘',
  unblock: '막힘 해제',
}

/* ───────── 카드 → 알림 ───────── */

const isDelivery = (kind: HistoryKind) => kind === 'deliver' || kind === 'redeliver'
const timeOf = (r: HistoryRecord) => r.ts ?? parseWhen(r.at)?.date.getTime() ?? 0

/**
 * 모든 카드의 기록을 알림으로 바꿔 새것부터 늘어놓습니다.
 * 처음부터 읽음으로 치는 것: 내가 남긴 기록 · 오늘 이전의 기록. 그 밖에는 readIds 에 있어야 읽음.
 */
export function deriveNotifications(cards: readonly HandoffCard[], me: string, readIds: ReadonlySet<string>): Notification[] {
  const now = demoNow()
  const startOfToday = new Date().setHours(0, 0, 0, 0)
  const rows = cards.flatMap((card, cardIndex) => {
    const lastDelivery = [...card.history].reverse().find((r) => isDelivery(r.kind))
    return card.history.map((r, i) => {
      const when = parseWhen(r.at)
      // 방금 한 일은 진짜 시계로, 예시 기록은 예시 화면의 "오늘"로 견줌
      const today = r.ts !== undefined ? r.ts >= startOfToday : when !== null && dayDiff(when.date, now) === 0
      const id = `${card.id}:${r.id}`
      // 지금 확인을 기다리는 전달이면 바로 확인 화면으로
      const review = card.status === 'delivered' && r === lastDelivery && !card.reviewPath
      const item: Notification = {
        id,
        cardId: card.id,
        kind: r.kind,
        label: NOTIFICATION_LABEL[r.kind],
        fromRole: r.role,
        toRole: r.role === card.fromRole ? card.toRole : card.fromRole,
        actor: r.author,
        title: card.title,
        text: r.text,
        at: r.at,
        ...(r.ts !== undefined ? { ts: r.ts } : {}),
        today,
        to: `/requests/${card.id}${review ? '/review' : ''}`,
        read: readIds.has(id) || r.author === me || !today,
      }
      return { item, time: timeOf(r), order: cardIndex * 1000 + i }
    })
  })
  // 방금 한 일(ts 있음)이 맨 위, 그다음 예시 기록을 날짜순으로
  return rows
    .sort((a, b) => Number(b.item.ts !== undefined) - Number(a.item.ts !== undefined) || b.time - a.time || b.order - a.order)
    .map((x) => x.item)
}

/** 알림 시각을 짧게: 방금 · 12분 전 · 3시간 전 · 09:10 · 11/17 18:10 */
export function relativeTime(n: Pick<Notification, 'at' | 'ts' | 'today'>) {
  if (!n.today) return n.at
  const then = n.ts ?? parseWhen(n.at)?.date.getTime()
  const base = n.ts !== undefined ? Date.now() : demoNow().getTime()
  const clock = n.at.split(' ')[1] ?? n.at
  if (then === undefined) return clock
  const minutes = Math.round((base - then) / 60_000)
  if (minutes < 0) return clock
  if (minutes < 1) return '방금'
  if (minutes < 60) return `${minutes}분 전`
  return `${Math.floor(minutes / 60)}시간 전`
}

/* ───────── 읽음 표시 저장 ───────── */

export const NOTIFICATION_READ_KEY = 'oreum:notifications:read:v1'

/** 브라우저에 저장된 값 읽기 (목업 모드의 "서버 값") */
export function readLocalReadIds(): string[] {
  const v = readJSON(NOTIFICATION_READ_KEY)
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

let readIds: ReadonlySet<string> = new Set(isMock ? readLocalReadIds() : [])
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

function set(next: ReadonlySet<string>) {
  readIds = next
  listeners.forEach((l) => l())
}

/** 읽음으로 표시 (알림을 눌렀을 때 · "모두 읽음") */
export function markRead(ids: readonly string[]) {
  const fresh = ids.filter((id) => !readIds.has(id))
  if (fresh.length === 0) return
  const prev = readIds
  set(new Set([...readIds, ...fresh]))
  push('알림 읽음 표시', () => api.notifications.markRead(fresh), { rollback: () => set(prev) })
}

/** 서버에서 읽음 여부 불러오기 (http 모드에서 시작할 때 · 로그인 직후) */
export function hydrateNotifications() {
  return pull('알림 불러오기', () => api.notifications.list(), (list) => set(new Set([...readIds, ...list.filter((n) => n.read).map((n) => n.id)])))
}

/* ───────── 화면에서 쓰기 ───────── */

/** const list = useNotifications() — 새것부터. 카드나 읽음 표시가 바뀌면 다시 계산돼요 */
export function useNotifications(): Notification[] {
  const cards = useRequests()
  const read = useSyncExternalStore(subscribe, () => readIds)
  const me = useSession()?.user.name ?? ''
  return useMemo(() => deriveNotifications(cards, me, read), [cards, me, read])
}

/** 안 읽은 알림 수 (사이드바 배지) */
export function useUnreadCount() {
  return useNotifications().filter((n) => !n.read).length
}
