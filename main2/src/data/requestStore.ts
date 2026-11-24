// 넘겨주기 카드(요청) 저장소 — 요청 → 수락 → 전달 → 확인 흐름을 모든 화면이 함께 씁니다.
// 방의 "현재 흐름", 메인보드 "원정대 흐름", 요청 상세(06 · 08 · 09 · 10)가 모두 이 값에서 나와요.
// 화면은 useRequests() 로 바로(동기) 읽고, 저장은 api.requests 를 거칩니다 (@/api):
//   목업 모드 = 브라우저 localStorage · http 모드 = GET /requests · POST /requests · PATCH /requests/:id
import { useSyncExternalStore } from 'react'
import { api } from '@/api'
import { isMock } from '@/api/config'
import { readJSON } from '@/api/storage'
import { pull, push } from '@/api/sync'
import { ROLE, type RoleId } from './mock'

/* ───────── 타입 ───────── */

/** 요청됨 → 수락됨(준비 중 · 진행) → 전달됨(확인 대기) → 확인 완료  (기획안 §4 상태) */
export type RequestStatus = 'requested' | 'accepted' | 'delivered' | 'confirmed'

export type HistoryKind = 'request' | 'accept' | 'propose' | 'question' | 'comment' | 'deliver' | 'fix' | 'redeliver' | 'confirm' | 'block' | 'unblock'

/** 주고받은 기록 한 줄 — 누가 · 언제 · 무엇을 */
export interface HistoryRecord {
  id: string
  kind: HistoryKind
  author: string
  role: RoleId
  /** '11/18 11:00' */
  at: string
  /** 기록한 때(ms). 방 대화에 시간순으로 끼워 넣을 때 씀 — 예시 데이터에는 없음 */
  ts?: number
  text: string
  /** 전달 기록일 때: 결과물 이름 (요약의 "최종 결과물") */
  result?: string
}

export interface HandoffCard {
  id: string
  /** 항목 이름 */
  title: string
  /** 보내는(만드는) 역할 → 받는 역할 */
  fromRole: RoleId
  toRole: RoleId
  /** 보내는 쪽 담당자 · 받는 쪽(요청한) 사람 */
  maker: string
  requester: string
  /** request = 받는 쪽이 요청해서 시작 · handoff = 보내는 쪽이 대화에서 바로 넘겨줌 (기획안 §7-3) */
  origin: 'request' | 'handoff'
  links: string[]
  description: string
  /** 소속 구간(체크포인트 번호). 따로 고르지 않으면 지금 구간 (기획안 §9 자동 지정) */
  checkpoint: number
  /** 희망 날짜 (글자 그대로) */
  due: string
  /** 보내는 쪽이 제안한 다른 날짜 (기획안 §4 데드라인 조율) */
  proposedDue?: string
  status: RequestStatus
  /** 막힘: since = 막힌 날 'MM/DD' (기획안 §8-5) */
  blocked?: { since: string; reason?: string }
  /** PR #24 같은 작은 칩 */
  tag?: string
  /** GitHub 배포로 자동 전달된 카드 */
  auto?: boolean
  /** 결과물을 검토하는 화면이 따로 있으면 그 주소 (버전 비교) */
  reviewPath?: string
  history: HistoryRecord[]
}

export const HISTORY_LABEL: Record<HistoryKind, string> = {
  request: '요청',
  accept: '수락',
  propose: '다른 날짜 제안',
  question: '질문',
  comment: '코멘트',
  deliver: '전달',
  fix: '수정 요청',
  redeliver: '다시 전달',
  confirm: '확인',
  block: '막힘',
  unblock: '막힘 해제',
}

/** 지금 구간 (새 카드의 기본 소속) */
export const CURRENT_CHECKPOINT = 1

/** 역할별 기본 담당자 (계정이 없는 데모라 방마다 한 사람을 대표로 둠) */
export const ROLE_PERSON: Record<RoleId, string> = { design: '김혜승', front: '이민준', back: '정하윤' }

/* ───────── 날짜 ───────── */

// 예시 화면의 "오늘"은 2026/11/18 (요청 보내기의 오늘 · 내일 버튼과 같은 기준). 시 · 분만 실제 시계를 씁니다.
// 서버가 붙으면(http 모드) 진짜 오늘을 씁니다.
const DEMO = { year: 2026, month: 11, day: 18 }

export function demoNow(): Date {
  const n = new Date()
  return isMock ? new Date(DEMO.year, DEMO.month - 1, DEMO.day, n.getHours(), n.getMinutes()) : n
}

const pad = (n: number) => String(n).padStart(2, '0')
const stamp = (d = demoNow()) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
const dayStamp = (d = demoNow()) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`

/** '11/21 (금) 18:00' · '오늘 18:00' · '11/20' → 날짜. 날짜가 없는 글자('체크포인트 2')는 null */
export function parseWhen(text: string): { date: Date; hasTime: boolean } | null {
  const md = text.match(/(\d{1,2})\s*\/\s*(\d{1,2})/)
  const time = text.match(/(\d{1,2}):(\d{2})/)
  const today = demoNow()
  let month = today.getMonth() + 1
  let day = today.getDate()
  if (md) {
    month = Number(md[1])
    day = Number(md[2])
  } else if (/내일/.test(text)) day += 1
  else if (!/오늘/.test(text)) return null
  return { date: new Date(today.getFullYear(), month - 1, day, time ? Number(time[1]) : 0, time ? Number(time[2]) : 0), hasTime: Boolean(time) }
}

/** 두 날짜의 날 수 차이 (a − b, 시각은 무시) */
export function dayDiff(a: Date, b: Date) {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  return Math.round((start(a) - start(b)) / 86_400_000)
}

/** '11/21 (금) 18:00' → '11/21 18:00' (요일 빼기) */
export const dueShort = (due: string) => due.replace(/\s*\([^)]*\)/, '').trim()
/** '11/21 (금) 18:00' → '11/21' (날짜만) */
export const dueDay = (due: string) => dueShort(due).replace(/\s*\d{1,2}:\d{2}$/, '').trim() || due

/* ───────── 읽기 도우미 ───────── */

export const isOpen = (card: HandoffCard) => card.status !== 'confirmed'

/** N일째 막힘 (막힌 날이 1일째) */
export function blockedDays(card: HandoffCard) {
  const since = card.blocked && parseWhen(card.blocked.since)
  return since ? Math.max(1, dayDiff(demoNow(), since.date) + 1) : 1
}

/** 마감까지: 지남 · 오늘 · 나중 · 날짜 없음 */
export function dueState(card: HandoffCard): 'overdue' | 'today' | 'later' | 'none' {
  const due = parseWhen(card.due)
  if (!due) return 'none'
  const left = dayDiff(due.date, demoNow())
  return left < 0 ? 'overdue' : left === 0 ? 'today' : 'later'
}

/** 기획안 §7-2 정렬: 막힘·마감 지남(0) → 마감 임박(1) → 확인 대기(2) → 나머지(3) */
export function urgency(card: HandoffCard): 0 | 1 | 2 | 3 {
  if (card.blocked) return 0
  if (card.status === 'delivered') return 2
  const due = dueState(card)
  return due === 'overdue' ? 0 : due === 'today' ? 1 : 3
}

/** 아직 안 끝난 카드를 급한 순서로 (같은 급이면 막힌 지 오래된 것 → 만든 순서) */
export function sortByUrgency(cards: readonly HandoffCard[]) {
  return cards
    .filter(isOpen)
    .map((card, i) => ({ card, i, rank: urgency(card) }))
    .sort((a, b) => a.rank - b.rank || (b.card.blocked ? blockedDays(b.card) : 0) - (a.card.blocked ? blockedDays(a.card) : 0) || a.i - b.i)
    .map((x) => x.card)
}

/** 마지막 기록이 수정 요청이면 "고치는 중" (그 뒤에 달린 코멘트 · 질문은 건너뜀) */
export const isFixing = (card: HandoffCard) =>
  card.status === 'accepted' && [...card.history].reverse().find((h) => h.kind !== 'comment' && h.kind !== 'question')?.kind === 'fix'

/** 상태를 한마디로: 요청됨 · 진행 중 · 확인 대기 · 확인 완료 · 2일째 막힘 */
export function statusText(card: HandoffCard) {
  if (card.blocked && isOpen(card)) return `${blockedDays(card)}일째 막힘`
  if (card.status === 'requested') return card.proposedDue ? '날짜 조율 중' : '요청됨'
  if (card.status === 'accepted') return isFixing(card) ? '수정 중' : '진행 중'
  return card.status === 'delivered' ? '확인 대기' : '확인 완료'
}

/** '백 → 프론트' */
export const routeText = (card: Pick<HandoffCard, 'fromRole' | 'toRole'>) => `${ROLE[card.fromRole].label} → ${ROLE[card.toRole].label}`

/* ───────── 예시 데이터 (피그마 화면에 그려진 항목 그대로) ───────── */

const COMPARE = '/rooms/front/compare'
let seedSeq = 0
const rec = (kind: HistoryKind, author: string, role: RoleId, at: string, text: string, result?: string): HistoryRecord => ({
  id: `s${++seedSeq}`,
  kind,
  author,
  role,
  at,
  text,
  ...(result ? { result } : {}),
})

/** 예시 카드 (목업 모드의 처음 값) */
export function seedRequests(): HandoffCard[] {
  seedSeq = 0
  return [
    // 프론트 방 "받을 것" · 백 방 "넘겨줄 것" · 메인보드 맨 위 (기획안 §8-5)
    {
      id: 'login-api', title: '로그인 API', fromRole: 'back', toRole: 'front', maker: '정하윤', requester: '이민준', origin: 'request',
      links: [], description: '', checkpoint: 1, due: '11/17 18:00', status: 'accepted', blocked: { since: '11/17', reason: '토큰 처리 문제로 하루 더 필요' },
      history: [
        rec('request', '이민준', 'front', '11/14 10:00', '11/17까지 로그인 API 요청'),
        rec('accept', '정하윤', 'back', '11/14 10:30', '11/17 18:00까지 하기로 함'),
        rec('block', '이민준', 'front', '11/17 18:10', 'API 대기 · 토큰 처리 문제로 하루 더 필요'),
      ],
    },
    {
      id: 'mypage-draft', title: '마이페이지 시안', fromRole: 'design', toRole: 'front', maker: '박서연', requester: '이민준', origin: 'request',
      links: [], description: '', checkpoint: 3, due: '오늘 18:00', status: 'accepted',
      history: [
        rec('request', '이민준', 'front', '11/17 09:30', '11/18까지 마이페이지 시안 요청'),
        rec('accept', '박서연', 'design', '11/17 09:40', '11/18 18:00까지 하기로 함'),
      ],
    },
    {
      id: 'login-v2', title: '로그인 화면 v2', fromRole: 'design', toRole: 'front', maker: '김혜승', requester: '이민준', origin: 'handoff',
      links: ['Figma  로그인 화면 v2'], description: '', checkpoint: 1, due: '11/19', status: 'delivered',
      history: [rec('deliver', '김혜승', 'design', '11/18 09:40', 'Figma 로그인 화면 v2 · 버튼 높이 48로 수정', 'Figma 로그인 화면 v2')],
    },
    {
      id: 'signup-spec', title: '회원가입 API 명세', fromRole: 'back', toRole: 'front', maker: '정하윤', requester: '이민준', origin: 'handoff',
      links: [], description: '', checkpoint: 1, due: '11/19', status: 'delivered',
      history: [rec('deliver', '정하윤', 'back', '11/18 08:40', '회원가입 API 명세 문서', '회원가입 API 명세 문서')],
    },
    {
      id: 'icon-set', title: '아이콘 세트', fromRole: 'design', toRole: 'front', maker: '박서연', requester: '최지우', origin: 'request',
      links: [], description: '', checkpoint: 2, due: '체크포인트 2', status: 'accepted',
      history: [
        rec('request', '최지우', 'front', '11/17 14:00', '체크포인트 2까지 아이콘 세트 요청'),
        rec('accept', '박서연', 'design', '11/17 14:20', '체크포인트 2까지 하기로 함'),
      ],
    },
    {
      id: 'main-impl', title: '메인 화면 구현', fromRole: 'front', toRole: 'design', maker: '최지우', requester: '김혜승', origin: 'handoff',
      links: ['GitHub  PR #24'], description: '', checkpoint: 2, due: '11/19', status: 'delivered', tag: 'PR #24', auto: true, reviewPath: COMPARE,
      history: [rec('deliver', '최지우', 'front', '11/18 09:10', 'PR #24 배포 완료 → 디자인에 검토 요청 (자동)', 'PR #24 메인 화면 레이아웃')],
    },
    {
      id: 'member-info', title: '회원 정보 화면', fromRole: 'front', toRole: 'design', maker: '이민준', requester: '김혜승', origin: 'request',
      links: ['GitHub  PR #25'], description: '', checkpoint: 3, due: '11/20', status: 'accepted', tag: 'PR #25',
      history: [
        rec('request', '김혜승', 'design', '11/17 16:00', '11/20까지 회원 정보 화면 구현 요청'),
        rec('accept', '이민준', 'front', '11/17 16:10', '11/20까지 하기로 함'),
      ],
    },
    {
      id: 'api-test', title: 'API 연동 테스트', fromRole: 'front', toRole: 'back', maker: '이민준', requester: '정하윤', origin: 'request',
      links: [], description: '', checkpoint: 1, due: '11/21', status: 'requested',
      history: [rec('request', '정하윤', 'back', '11/18 08:55', '11/21까지 API 연동 테스트 요청')],
    },
    // 피그마 "10 요청 상세" 의 예시 (프론트가 요청 → 디자인이 만들어 전달 → 확인 완료)
    {
      id: '1', title: '회원 정보 수정 화면 시안', fromRole: 'design', toRole: 'front', maker: '김혜승', requester: '이민준', origin: 'request',
      links: [], description: '', checkpoint: 3, due: '11/21 18:00', status: 'confirmed',
      history: [
        rec('request', '이민준', 'front', '11/18 11:00', '11/21까지 회원 정보 수정 화면 시안 요청'),
        rec('accept', '김혜승', 'design', '11/18 11:05', '11/21 18:00까지 하기로 함'),
        rec('question', '김혜승', 'design', '11/19 10:00', '저장 버튼은 상단 고정 맞나요?  →  이민준: 네, 상단 고정이에요'),
        rec('deliver', '김혜승', 'design', '11/20 15:00', 'Figma 회원 정보 수정 v1', 'Figma 회원 정보 수정 v1'),
        rec('fix', '이민준', 'front', '11/20 16:10', '프로필 사진 영역이 보기 화면보다 커요'),
        rec('redeliver', '김혜승', 'design', '11/20 18:30', 'Figma 회원 정보 수정 v2 · 프로필 영역 수정', 'Figma 회원 정보 수정 v2'),
        rec('confirm', '이민준', 'front', '11/20 19:00', '확인했어요. 구현 시작할게요'),
      ],
    },
  ]
}

/* ───────── 저장 (api 를 거쳐서) ───────── */

export const REQUESTS_KEY = 'oreum:requests:v1'

/** 브라우저에 저장된 값 읽기 (목업 모드의 "서버 값"). 없거나 이상하면 예시 데이터 */
export function readLocalRequests(): HandoffCard[] {
  const list = readJSON(REQUESTS_KEY)
  if (list === null) return seedRequests()
  const ok =
    Array.isArray(list) &&
    list.every((c: Partial<HandoffCard> | null) => c && typeof c.id === 'string' && typeof c.title === 'string' && Array.isArray(c.history) && Array.isArray(c.links))
  return ok ? (list as HandoffCard[]) : seedRequests()
}

// http 모드에서는 비어 있다가 서버 값이 들어옴 (hydrateRequests)
let cards: HandoffCard[] = isMock ? readLocalRequests() : []
const listeners = new Set<() => void>()

function set(next: HandoffCard[]) {
  cards = next
  listeners.forEach((l) => l())
}

/** 카드 하나만 갈아 끼움 (서버가 돌려준 값 · 되돌리기) */
const replace = (id: string, card: HandoffCard) => set(cards.map((c) => (c.id === id ? card : c)))

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** const cards = useRequests() — 값이 바뀌면 화면이 다시 그려져요 */
export function useRequests(): HandoffCard[] {
  return useSyncExternalStore(subscribe, () => cards)
}

export function useRequest(id: string | undefined): HandoffCard | undefined {
  return useRequests().find((c) => c.id === id)
}

/** 화면 밖(이벤트 처리)에서 지금 값 읽기 */
export const getRequest = (id: string) => cards.find((c) => c.id === id)

/** 서버에서 불러오기 (http 모드에서 시작할 때 · 로그인 직후) */
export function hydrateRequests() {
  return pull('요청 불러오기', () => api.requests.list(), set)
}

/* ───────── 바꾸기 ───────── */

/**
 * 카드에 한 일 — 서버에는 { action, card } 로 함께 보냅니다 (PATCH /requests/:id).
 * 서버는 action 을 직접 적용해도 되고, 프론트가 계산한 card 를 그대로 저장해도 돼요.
 */
export type RequestAction =
  | { type: 'accept' }
  | { type: 'propose'; date: string }
  | { type: 'acceptProposed' }
  | { type: 'deliver'; note: string; link?: string; author?: string }
  | { type: 'confirm'; text: string }
  | { type: 'fix'; text: string }
  | { type: 'block'; reason: string }
  | { type: 'unblock' }
  | { type: 'comment'; kind: 'comment' | 'question'; text: string }

let seq = 0
const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`
const now = (kind: HistoryKind, author: string, role: RoleId, text: string, result?: string): HistoryRecord => ({
  id: newId('h'),
  kind,
  author,
  role,
  at: stamp(),
  ts: Date.now(),
  text,
  ...(result ? { result } : {}),
})

// 보내는 쪽 · 받는 쪽이 남기는 기록
const byMaker = (c: HandoffCard, kind: HistoryKind, text: string, result?: string) => now(kind, c.maker, c.fromRole, text, result)
const byRequester = (c: HandoffCard, kind: HistoryKind, text: string) => now(kind, c.requester, c.toRole, text)

/** 새 카드를 목록에 넣고 서버에 보냄. 실패하면 뺌 */
function add(card: HandoffCard) {
  set([...cards, card])
  push('요청 저장', () => api.requests.create(card), {
    rollback: () => set(cards.filter((c) => c.id !== card.id)),
    done: (saved) => replace(card.id, saved),
  })
}

/** 카드 하나를 바꿈. 지금 상태에서 할 수 없는 일이면(fn 이 null) 그대로 둠 */
function change(id: string, action: RequestAction, fn: (card: HandoffCard) => HandoffCard | null) {
  const card = getRequest(id)
  const next = card && fn(card)
  if (!card || !next) return undefined
  replace(id, next)
  push('요청 저장', () => api.requests.update(id, { action, card: next }), {
    // 그 사이에 또 바뀌었으면 건드리지 않음
    rollback: () => {
      if (getRequest(id) === next) replace(id, card)
    },
    done: (saved) => {
      if (getRequest(id) === next) replace(id, saved)
    },
  })
  return next
}

export interface NewRequest {
  title: string
  /** 만들어 줄 역할(보내는 쪽) · 요청하는 역할(받는 쪽) */
  fromRole: RoleId
  toRole: RoleId
  due: string
  description?: string
  links?: string[]
  checkpoint?: number
}

/** 06 요청 보내기: 받는 쪽이 희망 날짜와 함께 요청 (기획안 §8-2) */
export function createRequest(input: NewRequest): HandoffCard {
  const base = { maker: ROLE_PERSON[input.fromRole], requester: ROLE_PERSON[input.toRole], fromRole: input.fromRole, toRole: input.toRole }
  const card: HandoffCard = {
    ...base,
    id: newId('r'),
    title: input.title,
    origin: 'request',
    links: input.links ?? [],
    description: input.description ?? '',
    checkpoint: input.checkpoint ?? CURRENT_CHECKPOINT,
    due: input.due,
    status: 'requested',
    history: [now('request', base.requester, base.toRole, `${dueDay(input.due)}까지 ${input.title} 요청`)],
  }
  add(card)
  return card
}

/**
 * 대화의 링크에서 바로 넘겨주기 (기획안 §7-3 · §8-3).
 * 같은 방향 · 같은 이름으로 기다리던 카드가 있으면 그 카드를 "전달됨"으로 바꾸고, 없으면 전달된 카드를 새로 만듭니다.
 */
export function handOff(input: NewRequest & { author?: string; link?: string }): { card: HandoffCard; merged: boolean } {
  const link = input.link?.replace(/\s+/g, ' ')
  const waiting = cards.find(
    (c) => c.fromRole === input.fromRole && c.toRole === input.toRole && c.title.trim() === input.title.trim() && (c.status === 'requested' || c.status === 'accepted'),
  )
  if (waiting) {
    const next = deliverRequest(waiting.id, link ?? input.title, { link: input.link, author: input.author })
    if (next) return { card: next, merged: true }
  }
  const maker = input.author ?? ROLE_PERSON[input.fromRole]
  const card: HandoffCard = {
    id: newId('r'),
    title: input.title,
    fromRole: input.fromRole,
    toRole: input.toRole,
    maker,
    requester: ROLE_PERSON[input.toRole],
    origin: 'handoff',
    links: input.link ? [input.link] : (input.links ?? []),
    description: input.description ?? '',
    checkpoint: input.checkpoint ?? CURRENT_CHECKPOINT,
    due: input.due,
    status: 'delivered',
    history: [now('deliver', maker, input.fromRole, `${link ?? input.title} · ${dueDay(input.due)}까지 확인 부탁`, link ?? input.title)],
  }
  add(card)
  return { card, merged: false }
}

/** 보내는 쪽: 희망 날짜 그대로 수락 */
export function acceptRequest(id: string) {
  return change(id, { type: 'accept' }, (c) =>
    c.status !== 'requested' ? null : { ...c, status: 'accepted', proposedDue: undefined, history: [...c.history, byMaker(c, 'accept', `${dueShort(c.due)}까지 하기로 함`)] },
  )
}

/** 보내는 쪽: 다른 날짜 제안 (기획안 §4 · §7-5 데드라인 조율) */
export function proposeDate(id: string, date: string) {
  return change(id, { type: 'propose', date }, (c) =>
    c.status !== 'requested' ? null : { ...c, proposedDue: date, history: [...c.history, byMaker(c, 'propose', `${dueShort(c.due)} 대신 ${dueShort(date)} 제안`)] },
  )
}

/** 받는 쪽: 제안한 날짜 수락 → 그 날짜가 마감이 되고 진행 시작 */
export function acceptProposedDate(id: string) {
  return change(id, { type: 'acceptProposed' }, (c) => {
    if (c.status !== 'requested' || !c.proposedDue) return null
    return { ...c, due: c.proposedDue, proposedDue: undefined, status: 'accepted', history: [...c.history, byRequester(c, 'accept', `제안한 ${dueShort(c.proposedDue)}까지로 정함`)] }
  })
}

/** 보내는 쪽: 전달 (08). 수정 요청 뒤에 다시 보내면 "다시 전달"로 남고, 막힘은 풀립니다 */
export function deliverRequest(id: string, note: string, extra: { link?: string; author?: string } = {}) {
  return change(id, { type: 'deliver', note, ...extra }, (c) => {
    if (c.status !== 'requested' && c.status !== 'accepted') return null
    const again = c.history.some((h) => h.kind === 'deliver' || h.kind === 'redeliver')
    const count = c.history.filter((h) => h.kind === 'deliver' || h.kind === 'redeliver').length + 1
    const result = extra.link?.replace(/\s+/g, ' ') ?? `${c.title} v${count}`
    const author = extra.author ?? c.maker
    return {
      ...c,
      status: 'delivered',
      blocked: undefined,
      proposedDue: undefined,
      links: extra.link && !c.links.includes(extra.link) ? [...c.links, extra.link] : c.links,
      history: [...c.history, now(again ? 'redeliver' : 'deliver', author, c.fromRole, note === result ? result : `${result} · ${note}`, result)],
    }
  })
}

/** 받는 쪽: 확인 → 완료. 흐름에서 빠집니다 (기획안 §6-① · §8-4) */
export function confirmRequest(id: string, text = '확인했어요') {
  return change(id, { type: 'confirm', text }, (c) =>
    c.status !== 'delivered' ? null : { ...c, status: 'confirmed', blocked: undefined, history: [...c.history, byRequester(c, 'confirm', text)] },
  )
}

/** 받는 쪽: 수정 요청 → 다시 진행으로 (09) */
export function requestFix(id: string, text: string) {
  return change(id, { type: 'fix', text }, (c) => (c.status !== 'delivered' ? null : { ...c, status: 'accepted', history: [...c.history, byRequester(c, 'fix', text)] }))
}

/** 받는 쪽: 막힘 표시 (기획안 §7-5 · §8-5) */
export function setBlocked(id: string, reason = '') {
  return change(id, { type: 'block', reason }, (c) => {
    if (c.status !== 'accepted' || c.blocked) return null
    return { ...c, blocked: { since: dayStamp(), ...(reason ? { reason } : {}) }, history: [...c.history, byRequester(c, 'block', reason || '기다리느라 일이 멈췄어요')] }
  })
}

export function clearBlocked(id: string) {
  return change(id, { type: 'unblock' }, (c) => (!c.blocked ? null : { ...c, blocked: undefined, history: [...c.history, byRequester(c, 'unblock', '막힘을 풀었어요')] }))
}

/** 카드에 코멘트 · 질문 남기기 (기획안 §7-5). 상태는 그대로이고 기록만 한 줄 늘어요 */
export function addComment(id: string, kind: 'comment' | 'question', text: string, author: { name: string; role: RoleId }) {
  const body = text.trim()
  if (!body) return undefined
  return change(id, { type: 'comment', kind, text: body }, (c) => ({ ...c, history: [...c.history, now(kind, author.name, author.role, body)] }))
}

/** 예시 데이터로 되돌리기 (데모용) */
export function resetRequests() {
  const prev = cards
  set(seedRequests())
  push('예시 데이터로 되돌리기', () => api.requests.reset(), { rollback: () => set(prev), done: set })
}
