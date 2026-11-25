// Figma "01 메인" — 메인보드 (밝은 테마).
//  - 위: 프로젝트 이름(캠퍼스 앱) + 최종 마감 칩 · 오른쪽 "+ 넘겨주기"
//  - 진행 순서 줄: 체크포인트마다 상태(막힘 · 진행 중 · 완료 · ○○부터) — 넘겨주기 카드에서 계산 · "일정 보기 ›" → 흐름 전체 보기
//  - 흐름 카드: 역할끼리 주고받는 중인 개수(디자인 ⇄ 프론트 ⇄ 백, 막힌 줄은 "막힘") + 오늘 해야 할 일 2개 + 범례
//  - 방 카드 3개: 디자인 방 / 프론트 방 / 백 방 (새 메시지 · AI 요약 · 최근 자료 · 마지막 메시지 · 보낼 것 / 받을 것)
// 본문 폭이 좁으면 한 줄로 쌓이고(@4xl 미만), 넓으면 2×2 로 놓입니다.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PROJECT, ROLE, type RoleId } from '@/data/mock'
import { checkpointRanges, deadlineChip, usePlan } from '@/data/planStore'
import { blockedDays, dueShort, dueState, isOpen, routeText, sortByUrgency, statusText, useRequests, type HandoffCard } from '@/data/requestStore'
import { Page } from '@/layout/Page'
import { GlassPanel } from '@/ui'
import { useSoon } from '@/ui/toast'
import { ROOM_CARDS, type RoomCardData } from './boardData'
import { SectionTodoSheet } from './SectionTodoSheet'

/** 2구간(메인 피드)에 들어서면 할 일 추천 시트를 열 수 있어요 */
const SHEET_CHECKPOINT = 2

export function MainBoardPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const plan = usePlan()

  return (
    <Page>
      {/* 제목(프로젝트 이름) + 최종 마감 칩 · + 넘겨주기 */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-[11px] gap-y-2">
          <h1 className="text-[clamp(22px,1rem+1.2vw,28px)] leading-tight font-bold tracking-[-0.02em] text-ink">{PROJECT.name}</h1>
          <p className="rounded-xl bg-fill-2 px-2.5 py-[5px] text-xs font-medium text-ink">{deadlineChip(plan)}</p>
        </div>
        <Link
          to="/requests/new"
          className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2.5 text-[13px] leading-none font-semibold text-on-primary hover:brightness-125"
        >
          <span aria-hidden>+</span> 넘겨주기
        </Link>
      </header>

      <ProgressBar onOpenSection={() => setSheetOpen(true)} />

      <div className="mt-4 grid flex-1 grid-cols-1 gap-4 @4xl:auto-rows-fr @4xl:grid-cols-2">
        <FlowCard />
        {ROOM_CARDS.map((card) => (
          <RoomCard key={card.role} card={card} />
        ))}
      </div>

      <SectionTodoSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </Page>
  )
}

/* ───────── 진행 순서 ───────── */

type StepState = { kind: 'blocked' | 'progress' | 'done' | 'later'; text: string }

/** 체크포인트 상태: 그 구간 넘겨주기 중 막힌 게 있으면 막힘 → 안 끝난 게 있으면 진행 중 → 다 끝났으면 완료 → 아직이면 "11/25부터" */
function stepState(no: number, cards: readonly HandoffCard[], range: string): StepState {
  const mine = cards.filter((c) => c.checkpoint === no)
  const open = mine.filter(isOpen)
  if (open.some((c) => c.blocked)) return { kind: 'blocked', text: '막힘' }
  if (open.length > 0) return { kind: 'progress', text: '진행 중' }
  if (mine.length > 0) return { kind: 'done', text: '완료' }
  return { kind: 'later', text: range ? `${range.split(' – ')[0]}부터` : '예정' }
}

const STEP_TONE: Record<StepState['kind'], { dot: string; text: string }> = {
  blocked: { dot: 'bg-danger', text: 'text-danger' },
  progress: { dot: 'bg-role-front', text: 'text-role-front' },
  done: { dot: 'bg-role-back', text: 'text-role-back' },
  later: { dot: 'bg-fill-3', text: 'text-muted' },
}

function ProgressBar({ onOpenSection }: { onOpenSection: () => void }) {
  const plan = usePlan()
  const cards = useRequests()
  const ranges = checkpointRanges(plan)

  return (
    <nav aria-label="진행 순서" className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-line bg-surface px-5 py-3">
      <span className="text-xs font-medium text-muted">진행 순서</span>
      <ol className="m-0 flex min-w-0 flex-1 list-none flex-wrap items-center gap-x-2 gap-y-1.5 p-0">
        {plan.checkpoints.map((c, i) => {
          const no = i + 1
          const st = stepState(no, cards, ranges[i])
          const tone = STEP_TONE[st.kind]
          const label = (
            <>
              <span aria-hidden className={`size-2 shrink-0 rounded-full ${tone.dot}`} />
              <span className={`text-[13px] font-semibold ${st.kind === 'later' ? 'text-muted' : 'text-ink'}`}>{c.name}</span>
              <span className={`text-xs font-medium ${tone.text}`}>{st.text}</span>
            </>
          )
          return (
            <li key={c.id} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden className="h-px w-[clamp(12px,3vw,48px)] bg-line" />}
              {no === SHEET_CHECKPOINT ? (
                <button type="button" onClick={onOpenSection} aria-haspopup="dialog" className="flex items-center gap-1.5 rounded-lg px-1 py-0.5 hover:bg-fill-2">
                  {label}
                  <span className="sr-only"> — {no}구간 할 일 추천 열기</span>
                </button>
              ) : (
                <span className="flex items-center gap-1.5 px-1 py-0.5">{label}</span>
              )}
            </li>
          )
        })}
      </ol>
      <Link to="/flow" className="rounded text-xs font-medium text-role-front hover:underline">
        일정 보기 <span aria-hidden>›</span>
      </Link>
    </nav>
  )
}

/* ───────── 흐름 (역할끼리 주고받는 것) ───────── */

/** a → b 로 안 끝난 넘겨주기 수와, 그중 막힌 게 있는지 */
function link(cards: readonly HandoffCard[], from: RoleId, to: RoleId) {
  const open = cards.filter((c) => isOpen(c) && c.fromRole === from && c.toRole === to)
  return { count: open.length, blocked: open.some((c) => c.blocked) }
}

function FlowCard() {
  const cards = useRequests()
  // 기획안 §7-2 정렬: 막힘·마감 지남 → 마감 임박 → 확인 대기 → 나머지
  const today = sortByUrgency(cards).slice(0, 2)
  const pairs: [RoleId, RoleId][] = [
    ['design', 'front'],
    ['front', 'back'],
  ]

  return (
    <GlassPanel role="region" aria-labelledby="board-flow" className="flex min-w-0 flex-col px-[23px] pt-[22px] pb-[18px]">
      <div className="flex items-center justify-between gap-2">
        <h2 id="board-flow" className="text-lg leading-tight font-bold text-ink">
          흐름
        </h2>
        <Link to="/flow" className="rounded text-xs text-muted hover:text-ink">
          흐름 전체 보기 <span aria-hidden>›</span>
        </Link>
      </div>

      {/* 디자인 ⇄ 프론트 ⇄ 백 */}
      <div role="list" aria-label="역할끼리 주고받는 중" className="mt-4 flex items-center justify-center gap-1">
        {(['design', 'front', 'back'] as const).map((role, i) => (
          <div key={role} role="listitem" className="flex items-center gap-1">
            {i > 0 && <Arrows left={pairs[i - 1][0]} right={pairs[i - 1][1]} cards={cards} />}
            <Link
              to={ROLE[role].path}
              className="rounded-full px-[clamp(12px,2vw,22px)] py-2.5 text-[13px] font-semibold"
              style={{ background: ROLE[role].bg, color: ROLE[role].color }}
            >
              {ROLE[role].label}
            </Link>
          </div>
        ))}
      </div>

      {/* 오늘 해야 할 일 */}
      <h3 className="mt-5 text-xs font-medium text-muted">오늘 해야 할 일</h3>
      <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
        {today.map((r) => {
          const due = dueState(r)
          const tone = r.blocked ? 'blocked' : due === 'today' || due === 'overdue' ? 'due' : 'progress'
          const right = r.blocked ? `${blockedDays(r)}일째 막힘` : due === 'today' ? `오늘 ${dueShort(r.due).replace(/^오늘\s*/, '')}` : statusText(r)
          return (
            <li key={r.id}>
              <Link
                to={`/requests/${r.id}`}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 ${
                  tone === 'blocked' ? 'bg-danger/[0.07] hover:bg-danger/[0.11]' : tone === 'due' ? 'bg-due/[0.08] hover:bg-due/[0.12]' : 'bg-fill hover:bg-fill-2'
                }`}
              >
                <span aria-hidden className={`size-2 shrink-0 rounded-full ${tone === 'blocked' ? 'bg-danger' : tone === 'due' ? 'bg-due' : 'bg-role-front'}`} />
                <span className="min-w-0 flex-1">
                  <span className="text-sm leading-tight font-semibold text-ink">{r.title}</span>
                  <span className="ml-2 text-xs text-muted">{routeText(r)}</span>
                </span>
                <span className={`shrink-0 text-xs font-semibold ${tone === 'blocked' ? 'text-danger' : tone === 'due' ? 'text-due' : 'text-role-front'}`}>{right}</span>
              </Link>
            </li>
          )
        })}
        {today.length === 0 && <li className="px-1 text-xs text-muted">주고받을 것이 없어요. 모두 확인까지 끝났어요.</li>}
      </ul>

      <ul aria-label="범례" className="m-0 mt-auto flex list-none items-center gap-3.5 self-start p-0 pt-3 text-[11px] text-muted">
        {[
          ['bg-danger', '막힘'],
          ['bg-due', '마감 임박'],
          ['bg-role-front', '진행 중'],
        ].map(([dot, text]) => (
          <li key={text} className="flex items-center gap-[5px]">
            <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
            {text}
          </li>
        ))}
      </ul>
    </GlassPanel>
  )
}

/** 두 역할 사이 화살표 두 줄: 위 = 왼쪽 → 오른쪽, 아래 = 오른쪽 → 왼쪽. 숫자 = 주고받는 중, 막힌 줄은 "막힘" */
function Arrows({ left, right, cards }: { left: RoleId; right: RoleId; cards: readonly HandoffCard[] }) {
  const rows = [
    { from: left, to: right, dir: 'r' as const, ...link(cards, left, right) },
    { from: right, to: left, dir: 'l' as const, ...link(cards, right, left) },
  ]
  return (
    <span className="flex w-[clamp(54px,7vw,92px)] flex-col gap-1">
      {rows.map((r) => {
        const tone = r.blocked ? 'text-danger' : 'text-muted'
        const label = r.blocked ? '막힘' : String(r.count)
        return (
          <span key={r.dir} className={`flex items-center gap-1 text-[11px] font-semibold ${tone}`}>
            <span className="sr-only">
              {ROLE[r.from].label} → {ROLE[r.to].label}: {r.blocked ? '막힘' : `${r.count}건`}
            </span>
            <span aria-hidden className="flex w-full items-center gap-1">
              {r.dir === 'l' && <span>←</span>}
              <span className={`h-px flex-1 ${r.blocked ? 'bg-danger' : 'bg-line'}`} />
              <span>{label}</span>
              <span className={`h-px flex-1 ${r.blocked ? 'bg-danger' : 'bg-line'}`} />
              {r.dir === 'r' && <span>→</span>}
            </span>
          </span>
        )
      })}
    </span>
  )
}

/* ───────── 방(역할) 요약 카드 ───────── */

function RoomCard({ card }: { card: RoomCardData }) {
  const soon = useSoon()
  // 보낼 것 / 받을 것: 아직 확인이 안 끝난 넘겨주기 카드 수 (기획안 §7-1)
  const open = useRequests().filter(isOpen)
  const send = open.filter((c) => c.fromRole === card.role).length
  const receive = open.filter((c) => c.toRole === card.role).length
  const role = ROLE[card.role]
  const headingId = `board-room-${card.role}`

  return (
    <GlassPanel role="region" aria-labelledby={headingId} className="flex min-w-0 flex-col gap-4 px-6 py-[22px]">
      {/* 방 이름 → 그 방으로 · 새 메시지 */}
      <div className="flex items-center justify-between gap-2">
        <h2 id={headingId} className="text-lg leading-tight font-bold text-ink">
          <Link to={role.path} className="inline-flex items-center gap-2 rounded hover:underline">
            <span aria-hidden className="size-2 rounded-full" style={{ background: role.color }} />
            {role.label} 방
          </Link>
        </h2>
        <Link to={role.path} className="rounded text-xs text-muted hover:text-ink">
          새 메시지 {card.newMessages} <span aria-hidden>›</span>
          <span className="sr-only"> — {role.label} 방으로</span>
        </Link>
      </div>

      {/* AI 진행 요약 */}
      <p className="flex items-center gap-2 rounded-[14px] px-3 py-2.5 text-[13px] leading-tight font-medium text-ink" style={{ background: role.bg }}>
        <span className="shrink-0 rounded-lg bg-surface px-1.5 py-0.5 font-mono text-[10px] leading-[normal] font-semibold tracking-[0.4px]" style={{ color: role.color }}>
          AI
        </span>
        <span className="min-w-0">{card.aiSummary}</span>
      </p>

      {/* 가장 최근 자료 (연결할 주소가 아직 없어요) */}
      <button
        type="button"
        onClick={soon(`${card.latestLink.title} 열기`)}
        className="flex w-full items-center gap-2 rounded-[10px] border border-line py-2 pr-3 pl-2 text-left hover:bg-fill"
      >
        <MiniThumb />
        <span className="shrink-0 rounded-[8.5px] bg-fill-2 px-1.5 py-0.5 font-mono text-[10px] leading-[normal] font-medium tracking-[0.4px] text-ink">{card.latestLink.kind}</span>
        <span className="min-w-0 truncate text-[13px] font-medium text-ink">{card.latestLink.title}</span>
        <span aria-hidden className="text-xs font-medium text-muted">
          ↗
        </span>
      </button>

      {/* 마지막 메시지 */}
      <div className="flex flex-col gap-[3px]">
        <p className="flex flex-wrap items-center gap-x-1.5">
          <span className="text-[13px] font-semibold text-ink">{card.lastMessage.title}</span>
          <span className="text-xs text-muted">{card.lastMessage.when}</span>
        </p>
        <p className="text-sm leading-[1.35] break-keep text-ink">
          {card.lastMessage.lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      </div>

      {/* 보낼 것 / 받을 것 */}
      <dl className="m-0 mt-auto flex gap-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-2xl bg-primary px-4 py-3 text-white/65">
          <dt className="text-xs font-medium text-inherit">보낼 것</dt>
          <dd className="m-0 text-2xl leading-[normal] font-bold tracking-[-0.02em]">
            {send}
          </dd>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-2xl bg-fill px-4 py-3">
          <dt className="text-xs font-medium text-muted">받을 것</dt>
          <dd className="m-0 text-2xl leading-[normal] font-bold tracking-[-0.02em] text-ink">{receive}</dd>
        </div>
      </dl>
    </GlassPanel>
  )
}

/** 자료 옆 작은 화면 그림 (피그마 Mini thumb — 도형으로만 된 장식) */
function MiniThumb() {
  const bar = 'absolute bg-fill-3'
  return (
    <span aria-hidden className="relative block h-10 w-14 shrink-0 overflow-hidden rounded-xl border border-line bg-fill">
      <span className="absolute top-[3px] left-[14px] block h-[49px] w-[30px] rounded-[3px] bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.08)]">
        <span className={`${bar} top-[6.84px] left-[3.8px] h-[2.28px] w-[15.2px] rounded-[2px]`} />
        <span className={`${bar} top-[10.64px] left-[3.8px] h-[1.52px] w-[20.52px] rounded-[2px]`} />
        <span className={`${bar} top-[17.48px] left-[3.8px] h-[4.56px] w-[22.04px] rounded-[1.14px]`} />
        <span className={`${bar} top-[23.56px] left-[3.8px] h-[4.56px] w-[22.04px] rounded-[1.14px]`} />
        <span className="absolute top-[31.92px] left-[3.8px] h-[5.32px] w-[22.04px] rounded-[1.14px] bg-ink" />
        <span className={`${bar} top-[40.28px] left-[9.12px] h-[1.52px] w-[11.4px] rounded-[2px]`} />
      </span>
    </span>
  )
}
