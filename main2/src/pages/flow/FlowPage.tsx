// Figma "01-2 흐름 · 노드 보기" — 흐름 전체 보기 (메인 › 흐름)
//  - 위: 제목 + 최종 마감 칩 · 노드 보기 / 목록 보기 · + 넘겨주기
//  - 숫자 줄: 진행 중 서비스 · 넘겨주기 · 막힘 · 마감 임박 · 확인 대기 (넘겨주기 카드에서 계산)
//  - 거르기: 전체 · 디자인 · 프론트 · 백 | 막힘 · 마감 임박 · 확인 대기 · 완료 숨기기
//  - 단계 줄(기획 → 디자인 → 개발 → 연동 → QA) 아래에 단계별 노드(넘겨주기 카드) + 진행 요약
//  - 노드를 누르면 오른쪽에 상세: 누가 누구에게 · 상태 · 날짜 흐름 · 보내는 쪽/받는 쪽 · 데드라인 · 마지막 기록 · 링크 · 버튼
//  - 아래: 날짜 줄 (날짜별 넘겨주기 수 · 오늘)
// 단계(이름 · 기간 · 진행률)는 아직 서버에 없어 flowData.ts 의 예시 값, 노드는 requestStore 의 진짜 카드예요.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROLE, type RoleId } from '@/data/mock'
import { deadlineChip, usePlan } from '@/data/planStore'
import {
  acceptProposedDate,
  blockedDays,
  demoNow,
  dueShort,
  dueState,
  isOpen,
  parseWhen,
  proposeDate,
  routeText,
  statusText,
  urgency,
  useRequests,
  type HandoffCard,
} from '@/data/requestStore'
import { Page } from '@/layout/Page'
import { GhostButton, Mono, PrimaryButton, Segmented } from '@/ui'
import { useToast } from '@/ui/toast'
import { PHASES, phaseOf, type Phase } from './flowData'

type View = 'node' | 'list'
type RoleFilter = 'all' | RoleId
type StateFilter = 'blocked' | 'due' | 'review'

const VIEWS = [
  { value: 'node', label: '노드 보기' },
  { value: 'list', label: '목록 보기' },
] as const

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'design', label: '디자인' },
  { value: 'front', label: '프론트' },
  { value: 'back', label: '백' },
]
const STATE_FILTERS: { value: StateFilter; label: string }[] = [
  { value: 'blocked', label: '막힘' },
  { value: 'due', label: '마감 임박' },
  { value: 'review', label: '확인 대기' },
]

/** 노드 상태: 색 점 + 한마디 */
function nodeTone(c: HandoffCard): { kind: 'blocked' | 'due' | 'review' | 'request' | 'progress' | 'done'; text: string } {
  if (!isOpen(c)) return { kind: 'done', text: '확인 완료' }
  if (c.blocked) return { kind: 'blocked', text: `${blockedDays(c)}일째 막힘` }
  if (c.status === 'delivered') return { kind: 'review', text: c.auto || c.reviewPath ? '검토 요청' : '확인 대기' }
  if (c.status === 'requested') return { kind: 'request', text: c.proposedDue ? '날짜 조율 중' : '요청' }
  const due = dueState(c)
  if (due === 'today' || due === 'overdue') return { kind: 'due', text: due === 'today' ? `오늘 ${dueShort(c.due).replace(/^오늘\s*/, '')}` : `${dueShort(c.due)} 지남` }
  return { kind: 'progress', text: dueShort(c.due) }
}

const DOT: Record<ReturnType<typeof nodeTone>['kind'], string> = {
  blocked: 'bg-danger',
  due: 'bg-due',
  review: 'bg-role-front',
  request: 'bg-fill-3',
  progress: 'bg-role-front',
  done: 'bg-role-back',
}

const matchesState = (c: HandoffCard, f: StateFilter) =>
  f === 'blocked' ? !!c.blocked && isOpen(c) : f === 'due' ? urgency(c) === 1 || (dueState(c) === 'overdue' && isOpen(c)) : c.status === 'delivered'

export function FlowPage() {
  const plan = usePlan()
  const cards = useRequests()
  const [view, setView] = useState<View>('node')
  const [role, setRole] = useState<RoleFilter>('all')
  const [states, setStates] = useState<StateFilter[]>([])
  const [hideDone, setHideDone] = useState(false)
  // 처음에는 가장 급한 카드(막힘)를 열어 둠 — 피그마처럼
  const [selectedId, setSelectedId] = useState<string | null>(() => [...cards].filter(isOpen).sort((a, b) => urgency(a) - urgency(b))[0]?.id ?? null)

  const stats = useMemo(() => {
    const open = cards.filter(isOpen)
    return {
      total: cards.length,
      blocked: open.filter((c) => c.blocked).length,
      due: open.filter((c) => matchesState(c, 'due')).length,
      review: open.filter((c) => c.status === 'delivered').length,
    }
  }, [cards])

  const visible = cards.filter(
    (c) =>
      (role === 'all' || c.fromRole === role || c.toRole === role) &&
      states.every((f) => matchesState(c, f)) &&
      !(hideDone && !isOpen(c)),
  )
  const selected = cards.find((c) => c.id === selectedId) ?? null
  const toggleState = (f: StateFilter) => setStates((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]))
  const activePhases = PHASES.filter((p) => p.state === 'active').map((p) => p.name)

  return (
    <Page>
      {/* 메인 › 흐름 */}
      <nav aria-label="현재 위치" className="text-xs text-muted">
        <Link to="/board" className="rounded hover:text-ink">
          메인
        </Link>
        <span aria-hidden className="mx-1.5">
          ›
        </span>
        <span aria-current="page">흐름</span>
      </nav>

      <header className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-[11px] gap-y-2">
          <h1 className="text-[clamp(22px,1rem+1.2vw,28px)] leading-tight font-bold tracking-[-0.02em] text-ink">흐름 전체 보기</h1>
          <p className="rounded-xl bg-fill-2 px-2.5 py-[5px] text-xs font-medium text-ink">{deadlineChip(plan)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Segmented label="보기 방식" options={VIEWS} value={view} onChange={setView} />
          <Link to="/requests/new" className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2.5 text-[13px] leading-none font-semibold text-on-primary hover:brightness-125">
            <span aria-hidden>+</span> 넘겨주기
          </Link>
        </div>
      </header>

      {/* 숫자 줄 */}
      <dl className="m-0 mt-4 flex flex-wrap gap-x-[clamp(20px,4vw,56px)] gap-y-3">
        <Stat label="진행 중 서비스" value={activePhases.join(' · ') || '없음'} />
        <Stat label="넘겨주기" value={stats.total} unit="건" />
        <Stat label="막힘" value={stats.blocked} unit="건" tone="text-danger" />
        <Stat label="마감 임박" value={stats.due} unit="건" tone="text-due" />
        <Stat label="확인 대기" value={stats.review} unit="건" />
      </dl>

      {/* 거르기 */}
      <div role="toolbar" aria-label="거르기" className="mt-4 flex flex-wrap items-center gap-1.5">
        <div role="group" aria-label="역할로 거르기" className="flex flex-wrap gap-1.5">
          {ROLE_FILTERS.map((f) => (
            <FilterChip key={f.value} on={role === f.value} onClick={() => setRole(f.value)}>
              {f.label}
            </FilterChip>
          ))}
        </div>
        <span aria-hidden className="mx-1 h-4 w-px bg-line" />
        <div role="group" aria-label="상태로 거르기" className="flex flex-wrap gap-1.5">
          {STATE_FILTERS.map((f) => (
            <FilterChip key={f.value} on={states.includes(f.value)} onClick={() => toggleState(f.value)}>
              {f.label}
            </FilterChip>
          ))}
          <FilterChip on={hideDone} onClick={() => setHideDone((v) => !v)}>
            완료 숨기기
          </FilterChip>
        </div>
        <p role="status" className="sr-only">
          넘겨주기 {visible.length}건 보는 중
        </p>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4 rounded-[22px] bg-fill-2 p-[clamp(12px,1.6vw,22px)]">
        <div className="flex min-h-0 flex-1 gap-4">
          <div className="min-w-0 flex-1 overflow-x-auto">
            {view === 'node' ? (
              <NodeBoard cards={visible} selectedId={selectedId} onSelect={setSelectedId} />
            ) : (
              <ListView cards={visible} selectedId={selectedId} onSelect={setSelectedId} />
            )}
          </div>
          {selected && <DetailPanel key={selected.id} card={selected} onClose={() => setSelectedId(null)} />}
        </div>
        <DateStrip cards={cards} />
      </div>
    </Page>
  )
}

function Stat({ label, value, unit, tone = 'text-ink' }: { label: string; value: string | number; unit?: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`m-0 text-lg font-bold ${tone}`}>
        {value}
        {unit && <span className="ml-0.5 text-xs font-medium text-muted">{unit}</span>}
      </dd>
    </div>
  )
}

function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap ${on ? 'bg-ink text-canvas' : 'border border-line bg-surface text-ink hover:bg-fill-2'}`}
    >
      {children}
    </button>
  )
}

/* ───────── 노드 보기 ───────── */

/** 단계 열 폭: 진행 중 단계는 넓게, 끝났거나 예정인 단계는 좁게 (피그마 01-2) */
const COLS = { gridTemplateColumns: PHASES.map((p) => (p.state === 'active' ? 'minmax(190px, 1.6fr)' : 'minmax(96px, 0.7fr)')).join(' ') }

function NodeBoard({ cards, selectedId, onSelect }: { cards: HandoffCard[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="min-w-[680px]">
      {/* 단계 줄 */}
      <ol aria-label="서비스 단계" className="m-0 grid list-none p-0" style={COLS}>
        {PHASES.map((p, i) => (
          <li key={p.id} className="relative flex flex-col gap-1 pr-3">
            <span className="relative flex items-center">
              <span
                className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  p.state === 'done' ? 'bg-role-back text-white' : p.state === 'active' ? 'bg-ink text-canvas' : 'border border-line bg-surface text-muted'
                }`}
              >
                <span aria-hidden>{p.no}</span>
              </span>
              {i < PHASES.length - 1 && <span aria-hidden className={`absolute left-8 h-0.5 w-full ${p.state === 'planned' ? 'bg-line' : 'bg-role-front/60'}`} />}
            </span>
            <span className="text-[13px] font-bold text-ink">
              {p.name}
              <span className="sr-only"> ({p.state === 'done' ? '완료' : p.state === 'active' ? '진행 중' : '예정'})</span>
            </span>
            <span className="text-[11px] text-muted">{p.state === 'done' ? `완료 ${p.done}/${p.total}` : `${p.dates}${p.state === 'planned' ? ' · 예정' : ` · ${p.done}/${p.total}`}`}</span>
          </li>
        ))}
      </ol>

      {/* 단계별 노드 */}
      <div className="mt-4 grid gap-3" style={COLS}>
        {PHASES.map((p) => {
          const inPhase = cards.filter((c) => phaseOf(c) === p.id)
          return (
            <section key={p.id} aria-label={`${p.name} 단계 넘겨주기`} className="flex min-w-0 flex-col gap-2">
              {inPhase.map((c) => (
                <Node key={c.id} card={c} on={c.id === selectedId} onSelect={onSelect} />
              ))}
              {p.state === 'active' && <PhaseSummary phase={p} />}
              {p.state === 'active' && inPhase.length === 0 && <p className="px-1 text-xs text-muted">조건에 맞는 넘겨주기가 없어요</p>}
            </section>
          )
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted">노드를 누르면 오른쪽에 상세가 펼쳐져요</p>
    </div>
  )
}

function Node({ card, on, onSelect }: { card: HandoffCard; on: boolean; onSelect: (id: string) => void }) {
  const tone = nodeTone(card)
  const from = ROLE[card.fromRole]
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onSelect(card.id)}
      className={`flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors ${
        on ? 'border-ink bg-ink text-canvas' : 'border-line bg-surface text-ink hover:border-ink/30'
      }`}
    >
      <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: from.bg, color: from.color }}>
        {from.label.slice(0, 1)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-bold">{card.title}</span>
        <span className={`truncate text-[11px] ${on ? 'text-canvas/70' : 'text-muted'}`}>
          {routeText(card)} · {tone.text}
        </span>
      </span>
      <span aria-hidden className={`size-2 shrink-0 rounded-full ${DOT[tone.kind]}`} />
    </button>
  )
}

function PhaseSummary({ phase }: { phase: Phase }) {
  const pct = phase.total ? Math.round(((phase.done ?? 0) / phase.total) * 100) : 0
  return (
    <div className="mt-2 flex flex-col gap-1.5 rounded-xl border border-line bg-surface p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-ink">{phase.name} 시퀀스</span>
        <span className="rounded-full bg-role-front-bg px-1.5 py-0.5 text-[10px] font-semibold text-role-front">진행 중</span>
      </div>
      <p className="text-lg font-bold text-ink">
        {phase.done} / {phase.total} <span className="text-xs font-medium text-muted">완료</span>
      </p>
      <span role="progressbar" aria-label={`${phase.name} 진행률`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="block h-1.5 overflow-hidden rounded-full bg-fill-3">
        <span className="block h-full rounded-full bg-role-front" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-[11px] text-muted">다음 마감 {phase.nextDue}</span>
    </div>
  )
}

/* ───────── 목록 보기 ───────── */

function ListView({ cards, selectedId, onSelect }: { cards: HandoffCard[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const sorted = [...cards].sort((a, b) => Number(!isOpen(a)) - Number(!isOpen(b)) || urgency(a) - urgency(b))
  if (sorted.length === 0) return <p className="p-6 text-center text-sm text-muted">조건에 맞는 넘겨주기가 없어요</p>
  return (
    <table className="w-full min-w-[560px] border-separate border-spacing-y-1.5 text-left text-[13px]">
      <thead className="text-[11px] text-muted">
        <tr>
          <th scope="col" className="px-3 font-medium">상태</th>
          <th scope="col" className="px-3 font-medium">항목</th>
          <th scope="col" className="px-3 font-medium">주고받는 쪽</th>
          <th scope="col" className="px-3 font-medium">단계</th>
          <th scope="col" className="px-3 font-medium">데드라인</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((c) => {
          const tone = nodeTone(c)
          const on = c.id === selectedId
          return (
            <tr key={c.id} className={on ? 'bg-ink text-canvas' : 'bg-surface'}>
              <td className="rounded-l-xl px-3 py-2.5">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <span aria-hidden className={`size-2 rounded-full ${DOT[tone.kind]}`} />
                  {tone.text}
                </span>
              </td>
              <td className="px-3 py-2.5 font-bold">
                <button type="button" aria-pressed={on} onClick={() => onSelect(c.id)} className="rounded text-left hover:underline">
                  {c.title}
                </button>
              </td>
              <td className="px-3 py-2.5 whitespace-nowrap">{routeText(c)}</td>
              <td className="px-3 py-2.5">{PHASES.find((p) => p.id === phaseOf(c))?.name}</td>
              <td className="rounded-r-xl px-3 py-2.5 font-mono text-xs">{dueShort(c.due)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/* ───────── 오른쪽 상세 ───────── */

function DetailPanel({ card, onClose }: { card: HandoffCard; onClose: () => void }) {
  const toast = useToast()
  const tone = nodeTone(card)
  const [proposing, setProposing] = useState(false)
  const [date, setDate] = useState('')
  const lastNote = [...card.history].reverse().find((h) => h.kind === 'comment' || h.kind === 'question' || h.kind === 'block' || h.kind === 'propose')
  const requestedAt = card.history.find((h) => h.kind === 'request')?.at.split(' ')[0]
  const link = card.links[0]?.replace(/\s{2,}/g, ' ')
  const titleId = `flow-detail-${card.id}`

  // 날짜 흐름: 요청 → 데드라인 → 오늘 → (제안한 날짜)
  const steps = [
    requestedAt && { label: '요청', when: requestedAt },
    { label: card.blocked ? '전달 예정' : '데드라인', when: dueShort(card.due) },
    { label: '오늘', when: `${demoNow().getMonth() + 1}/${demoNow().getDate()}`, now: true },
    card.proposedDue && { label: '변경', when: dueShort(card.proposedDue) },
  ].filter(Boolean) as { label: string; when: string; now?: boolean }[]

  const submitPropose = () => {
    const d = date.trim()
    if (!parseWhen(d)) return toast('날짜를 11/22 처럼 넣어 주세요')
    proposeDate(card.id, d)
    setProposing(false)
    toast(`${card.title} — ${d} 로 다른 날짜를 제안했어요`)
  }

  return (
    <aside aria-labelledby={titleId} className="flex w-[clamp(260px,24vw,320px)] shrink-0 flex-col gap-3.5 self-start rounded-2xl bg-surface p-4 shadow-[0_8px_24px_rgb(23_24_26/0.08)]">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-fill-2 px-2 py-0.5 text-[11px] font-semibold text-ink">{routeText(card)}</span>
        <button type="button" onClick={onClose} aria-label="상세 닫기" className="flex size-7 items-center justify-center rounded-full text-muted hover:bg-fill-2 hover:text-ink">
          <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <h2 id={titleId} className="text-lg font-bold text-ink">
          {card.title}
        </h2>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone.kind === 'blocked' ? 'bg-danger/10 text-danger' : tone.kind === 'due' ? 'bg-due/10 text-due' : 'bg-fill-2 text-ink'}`}>
          {tone.kind === 'progress' ? statusText(card) : tone.text}
        </span>
      </div>

      {/* 날짜 흐름 */}
      <ol aria-label="날짜 흐름" className="m-0 flex list-none items-start p-0">
        {steps.map((s, i) => (
          <li key={s.label} className="flex flex-1 flex-col items-center gap-1 text-center">
            <span className="flex w-full items-center">
              <span aria-hidden className={`h-px flex-1 ${i === 0 ? 'opacity-0' : 'bg-line'}`} />
              <span aria-hidden className={`size-2.5 shrink-0 rounded-full ${s.now ? 'bg-ink' : s.label === '변경' ? 'bg-role-front' : card.blocked && i === 1 ? 'bg-danger' : 'bg-fill-3'}`} />
              <span aria-hidden className={`h-px flex-1 ${i === steps.length - 1 ? 'opacity-0' : 'bg-line'}`} />
            </span>
            <span className="text-[10px] text-muted">{s.label}</span>
            <Mono className="text-[11px] text-ink">{s.when}</Mono>
          </li>
        ))}
      </ol>

      <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
        <dt className="text-muted">보내는 쪽</dt>
        <dd className="m-0 font-medium text-ink">
          {card.maker} ({ROLE[card.fromRole].label})
        </dd>
        <dt className="text-muted">받는 쪽</dt>
        <dd className="m-0 font-medium text-ink">
          {card.requester} ({ROLE[card.toRole].label})
        </dd>
        <dt className="text-muted">데드라인</dt>
        <dd className="m-0 font-medium text-ink">
          {dueShort(card.due)}
          {card.proposedDue && <span className="text-role-front"> → {dueShort(card.proposedDue)} 변경 요청</span>}
        </dd>
      </dl>

      {lastNote && (
        <p className="rounded-xl bg-fill px-3 py-2.5 text-[13px] text-ink">
          <span className="block text-[11px] text-muted">
            {lastNote.author} · {lastNote.at}
          </span>
          {lastNote.text}
        </p>
      )}

      {link && (
        <p className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-[13px] text-ink">
          <span className="rounded-md bg-fill-2 px-1.5 py-0.5 font-mono text-[10px] font-semibold">{link.split(' ')[0]}</span>
          <span className="min-w-0 truncate">{link.split(' ').slice(1).join(' ')}</span>
        </p>
      )}

      {/* 버튼: 요청 단계면 날짜 조율, 그 밖에는 요청 상세에서 */}
      {card.status === 'requested' ? (
        proposing ? (
          <div className="flex items-center gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">제안할 날짜</span>
              <input value={date} onChange={(e) => setDate(e.target.value)} placeholder="예) 11/22" className="w-full rounded-lg border border-line bg-surface px-2.5 py-2 text-[13px] text-ink" />
            </label>
            <PrimaryButton onClick={submitPropose} className="px-4 py-2.5 text-[13px]">
              제안
            </PrimaryButton>
          </div>
        ) : (
          <div className="flex gap-2">
            <GhostButton onClick={() => setProposing(true)} className="flex-1 px-3 py-2.5 text-[13px]">
              다른 날짜 제안
            </GhostButton>
            {card.proposedDue ? (
              <PrimaryButton
                onClick={() => {
                  acceptProposedDate(card.id)
                  toast(`${card.title} — ${dueShort(card.proposedDue ?? '')} 로 정했어요`)
                }}
                className="flex-1 px-3 py-2.5 text-[13px]"
              >
                변경 수락
              </PrimaryButton>
            ) : (
              <Link to={`/requests/${card.id}`} className="flex flex-1 items-center justify-center rounded-full bg-primary px-3 py-2.5 text-[13px] font-semibold text-on-primary hover:brightness-125">
                요청 상세
              </Link>
            )}
          </div>
        )
      ) : (
        <Link to={`/requests/${card.id}`} className="flex items-center justify-center rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-on-primary hover:brightness-125">
          요청 상세 보기 <span aria-hidden className="ml-1">→</span>
        </Link>
      )}
    </aside>
  )
}

/* ───────── 날짜 줄 ───────── */

function DateStrip({ cards }: { cards: HandoffCard[] }) {
  const plan = usePlan()
  const now = demoNow()
  const key = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  // 날짜별 넘겨주기 수 (데드라인 기준) + 오늘 + 정상(마감일)
  const byDay = new Map<string, { date: Date; cards: HandoffCard[] }>()
  for (const c of cards) {
    const w = parseWhen(c.due)
    if (!w) continue
    const k = key(w.date)
    byDay.set(k, { date: w.date, cards: [...(byDay.get(k)?.cards ?? []), c] })
  }
  if (!byDay.has(key(now))) byDay.set(key(now), { date: now, cards: [] })
  const end = new Date(`${plan.date}T00:00:00`)
  const endKey = Number.isNaN(end.getTime()) ? null : key(end)
  if (endKey && !byDay.has(endKey)) byDay.set(endKey, { date: end, cards: [] })
  const days = [...byDay.values()].sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <ol aria-label="날짜별 넘겨주기" className="theme-dark m-0 flex list-none items-center gap-1 overflow-x-auto rounded-full bg-nav p-0 px-3 py-2">
      <li className="pr-2 text-xs font-bold text-ink">{now.getMonth() + 1}월</li>
      {days.map(({ date, cards: list }) => {
        const k = key(date)
        const isToday = k === key(now)
        const blocked = list.some((c) => c.blocked && isOpen(c))
        const open = list.filter(isOpen).length
        return (
          <li key={k} className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] ${isToday ? 'bg-fill-3 font-bold text-ink' : 'text-muted'}`}>
            <Mono>{k}</Mono>
            {isToday && <span>오늘</span>}
            {k === endKey && <span className="text-summit">정상</span>}
            {list.length > 0 && (
              <span className={`flex size-4 items-center justify-center rounded-full text-[10px] font-bold ${blocked ? 'bg-danger text-white' : open ? 'bg-role-front text-white' : 'bg-role-back text-white'}`}>
                {list.length}
                <span className="sr-only">건{blocked ? ', 막힘 있음' : ''}</span>
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
