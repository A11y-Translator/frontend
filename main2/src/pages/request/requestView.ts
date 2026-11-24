// 넘겨주기 카드(저장소 값) → 요청 화면에 그릴 모양: 진행 단계 · 주고받은 기록 · 요약 · 결과물 미리보기.
import { HISTORY_LABEL, dayDiff, dueShort, dueState, parseWhen, type HandoffCard, type HistoryKind, type HistoryRecord } from '@/data/requestStore'
import { EXAMPLE, stepsAt, type RecordItem, type RecordTone, type Step } from './requestData'

const isDelivery = (kind: HistoryKind) => kind === 'deliver' || kind === 'redeliver'
/** 조건에 맞는 마지막 기록 */
const lastOf = (h: readonly HistoryRecord[], test: (r: HistoryRecord) => boolean) => [...h].reverse().find(test)

/** 지금 차례인 단계: 요청됨 → 수락(1) · 진행 중 → 진행(2) · 전달됨 → 확인(4) · 확인 완료 → 모두 끝(5) */
const CURRENT: Record<HandoffCard['status'], number> = { requested: 1, accepted: 2, delivered: 4, confirmed: 5 }

/** 요청 — 수락 — 진행 — 전달 — 확인. times 를 켜면 끝난 단계 아래에 때를 적음 (요청 상세) */
export function stepsOf(card: HandoffCard, times = false): Step[] {
  const steps = stepsAt(CURRENT[card.status])
  if (!times) return steps
  const h = card.history
  const accept = lastOf(h, (r) => r.kind === 'accept')
  const acceptAt = accept ? h.indexOf(accept) : -1
  const at = [
    h.find((r) => r.kind === 'request')?.at,
    accept?.at,
    // 진행: 수락 다음에 처음 무언가 오간 날 (날짜만)
    acceptAt >= 0 ? h[acceptAt + 1]?.at.split(' ')[0] : undefined,
    lastOf(h, (r) => isDelivery(r.kind))?.at,
    lastOf(h, (r) => r.kind === 'confirm')?.at,
  ]
  return steps.map((s, i) => (s.state === 'done' && at[i] ? { ...s, at: at[i] } : s))
}

const TONE: Record<HistoryKind, RecordTone> = {
  request: 'plain',
  accept: 'accept',
  propose: 'plain',
  question: 'plain',
  comment: 'plain',
  deliver: 'deliver',
  redeliver: 'deliver',
  fix: 'fix',
  confirm: 'confirm',
  block: 'blocked',
  unblock: 'plain',
}

export function recordsOf(card: HandoffCard): RecordItem[] {
  return card.history.map((r) => ({ id: r.id, chip: HISTORY_LABEL[r.kind], tone: TONE[r.kind], author: r.author, role: r.role, at: r.at, text: r.text }))
}

function duration(from: Date, to: Date) {
  const minutes = Math.max(0, Math.round((to.getTime() - from.getTime()) / 60_000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  if (days) return hours ? `${days}일 ${hours}시간` : `${days}일`
  return hours ? `${hours}시간` : `${minutes}분`
}

export interface SummaryRow {
  label: string
  value: string
  good: boolean
}

/** 요약 패널: 최종 결과물 · 마감 · 요청부터 확인까지 · 주고받은 횟수 (모두 기록에서 계산) */
export function summaryOf(card: HandoffCard): { result: string | null; rest: SummaryRow[] } {
  const h = card.history
  const last = lastOf(h, (r) => isDelivery(r.kind))
  const confirm = lastOf(h, (r) => r.kind === 'confirm')
  const done = card.status === 'confirmed' && confirm

  // 마감: 끝났으면 얼마나 일찍/늦게, 아직이면 조율 · 임박 여부
  let due = dueShort(card.due)
  let good = false
  const dueAt = parseWhen(card.due)
  const doneAt = done ? parseWhen(done.at) : null
  if (dueAt && doneAt) {
    const early = dayDiff(dueAt.date, doneAt.date)
    good = early >= 0
    due += early > 0 ? ` · ${early === 1 ? '하루' : `${early}일`} 일찍 끝남` : early === 0 ? ' · 제때 끝남' : ` · ${-early}일 늦음`
  } else if (card.proposedDue) due += ` · ${dueShort(card.proposedDue)} 제안 중`
  else if (card.status === 'requested' || card.status === 'accepted') due += dueState(card) === 'today' ? ' · 오늘 마감' : dueState(card) === 'overdue' ? ' · 마감 지남' : ''

  const startAt = h[0] && parseWhen(h[0].at)
  const count = (label: string, n: number) => (n ? [`${label} ${n}번`] : [])
  const counts = [
    ...count('전달', h.filter((r) => isDelivery(r.kind)).length),
    ...count('수정 요청', h.filter((r) => r.kind === 'fix').length),
    ...count('질문', h.filter((r) => r.kind === 'question').length),
    ...count('코멘트', h.filter((r) => r.kind === 'comment').length),
    ...count('날짜 제안', h.filter((r) => r.kind === 'propose').length),
  ]

  return {
    result: last ? (last.result ?? last.text) : null,
    rest: [
      { label: '마감', value: due, good },
      { label: '요청부터 확인까지', value: startAt && doneAt ? duration(startAt.date, doneAt.date) : '아직 확인 전', good: false },
      { label: '주고받은 횟수', value: counts.join(' · ') || '아직 없음', good: false },
    ],
  }
}

// 피그마 08 · 09 의 예시 미리보기 (회원 정보 수정 화면 시안)
const EXAMPLE_FILE = { source: 'FIGMA', title: '회원 정보 수정', note: '프로필 영역' }

/** 08 · 09 의 결과물 미리보기에 넣을 값. next = 지금 보내려는 것(다음 버전) */
export function resultFileOf(card: HandoffCard, next = false) {
  const sent = card.history.filter((r) => isDelivery(r.kind))
  const lastSent = sent[sent.length - 1]
  const version = `v${sent.length + (next ? 1 : 0) || 1} · ${next ? '방금' : (lastSent?.at ?? '방금')}`
  if (card.title === EXAMPLE.title) return { ...EXAMPLE_FILE, version }
  const link = card.links[card.links.length - 1] ?? ''
  const source = /figma/i.test(link) ? 'FIGMA' : /github/i.test(link) ? 'GITHUB' : '결과물'
  return { source, title: card.title, note: lastSent?.text.split(' · ').pop() ?? '바뀐 곳', version }
}
