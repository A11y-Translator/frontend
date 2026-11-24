// 피그마 "01 메인 · 내추럴" — 메인보드.
// 왼쪽 위: 원정대 흐름(작은 루트 지도 + 요청 줄) · 나머지 세 칸: 디자인 / 백 / 프론트 방 요약 카드.
// 본문 폭이 좁으면 한 줄로 쌓이고(@4xl 미만), 넓으면 2×2 로 놓입니다.
// 최종 마감 칩과 작은 지도의 체크포인트(이름 · 개수)는 시작하기/추천 루트에서 정한 값(planStore)을 따라가요.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import flowDotDone from '@/assets/board/flow-dot-done.svg'
import flowDotProgress from '@/assets/board/flow-dot-progress.svg'
import flowFlag from '@/assets/board/flow-flag.svg'
import flowFoot from '@/assets/board/flow-foot.svg'
import flowRoute from '@/assets/board/flow-route.svg'
import legendDotDone from '@/assets/board/legend-dot-done.svg'
import legendDotProgress from '@/assets/board/legend-dot-progress.svg'
import { ROLE, type RoleId } from '@/data/mock'
import { deadlineChip, usePlan, type PlanCheckpoint } from '@/data/planStore'
import { isOpen, routeText, sortByUrgency, urgency, useRequests } from '@/data/requestStore'
import { flowStatus } from '@/pages/rooms/roomFlows'
import { Page } from '@/layout/Page'
import { GlassPanel } from '@/ui'
import { useSoon } from '@/ui/toast'
import { FLOW_MAP, FLOW_PINS, FLOW_ROWS, ROOM_CARDS, type RoomCardData } from './boardData'
import { SectionTodoSheet } from './SectionTodoSheet'

export function MainBoardPage() {
  // 2구간 할 일 추천 시트 열림 여부
  const [sheetOpen, setSheetOpen] = useState(false)
  const plan = usePlan()

  return (
    <Page>
      {/* 제목 + 최종 마감 칩 */}
      <header className="flex flex-wrap items-center gap-x-[11px] gap-y-2">
        <h1 className="text-[clamp(22px,1rem+1.2vw,28px)] leading-tight font-bold tracking-[-0.02em] text-ink">메인보드</h1>
        <p className="rounded-xl bg-fill-2 px-2.5 py-[5px] text-xs font-medium text-ink">{deadlineChip(plan)}</p>
      </header>

      <div className="mt-6 grid flex-1 grid-cols-1 gap-4 @4xl:-mx-[11px] @4xl:auto-rows-fr @4xl:grid-cols-2">
        <FlowCard checkpoints={plan.checkpoints} onOpenSection={() => setSheetOpen(true)} />
        {ROOM_CARDS.map((card) => (
          <RoomCard key={card.role} card={card} />
        ))}
      </div>

      <SectionTodoSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </Page>
  )
}

/* ───────── 원정대 흐름 ───────── */

type FlowPinData = { no: number | 'summit'; label: string; x: number; y: number }

/**
 * 체크포인트를 작은 지도의 핀으로. 피그마에 그려진 자리(1~4번 + 정상)를 잇는 길 위에 고르게 놓아서,
 * 4개면 피그마 자리 그대로이고 개수가 달라도(0~8개) 같은 산길을 따라 놓여요. 정상은 늘 같은 자리.
 */
function flowPins(checkpoints: readonly PlanCheckpoint[]): FlowPinData[] {
  const last = FLOW_PINS.length - 1
  const summit = FLOW_PINS[last]
  const at = (u: number) => {
    const i = Math.min(Math.floor(u), last - 1)
    const a = FLOW_PINS[i]
    const b = FLOW_PINS[i + 1]
    return { x: a.x + (b.x - a.x) * (u - i), y: a.y + (b.y - a.y) * (u - i) }
  }
  return [...checkpoints.map((c, i) => ({ no: i + 1, label: c.name || `체크포인트 ${i + 1}`, ...at((i * last) / checkpoints.length) })), summit]
}

function FlowCard({ checkpoints, onOpenSection }: { checkpoints: readonly PlanCheckpoint[]; onOpenSection: () => void }) {
  const pins = flowPins(checkpoints)
  // 핀이 촘촘하면(6개 이상) 이름이 겹치지 않게 줄임
  const crowded = checkpoints.length > 5
  // 기획안 §7-2 정렬: 막힘·마감 지남 → 마감 임박 → 확인 대기 → 나머지. 확인이 끝난 카드는 빠져요 (§8-4)
  const open = sortByUrgency(useRequests())
  const rows = open.slice(0, FLOW_ROWS)
  const more = open.length - rows.length

  return (
    <GlassPanel role="region" aria-labelledby="board-flow" className="flex min-w-0 flex-col px-[23px] pt-[26px] pb-[21px]">
      {/* 제목 + 작은 루트 지도: 이 영역 어디를 눌러도 루트 상세로 (2번 핀만 시트 열기) */}
      <div className="relative flex flex-col">
        <h2 id="board-flow" className="text-lg leading-tight font-bold text-ink">
          <Link to="/route" className="rounded after:absolute after:inset-0 after:rounded-xl">
            원정대 흐름
          </Link>
        </h2>

        <div
          className="pointer-events-none relative mx-auto mt-1.5 w-full max-w-[409px]"
          style={{ aspectRatio: `${FLOW_MAP.width} / ${FLOW_MAP.height}` }}
        >
          {/* 산길 (점선) */}
          <img src={flowRoute} alt="" className="absolute top-[25.99%] left-[2.6%] h-[64.09%] w-[95.2%]" />
          <ol aria-label="체크포인트" className="m-0 list-none p-0">
            {pins.map((pin) => (
              <li
                key={pin.no}
                className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center"
                style={{ left: `${((pin.x + 8.985) / FLOW_MAP.width) * 100}%`, top: `${((pin.y + 44.92) / FLOW_MAP.height) * 100}%` }}
              >
                {pin.no === 2 ? (
                  // 2구간 핀 → 2구간 할 일 추천 시트
                  <button
                    type="button"
                    onClick={onOpenSection}
                    aria-haspopup="dialog"
                    aria-label={`${pin.no} ${pin.label} — 2구간 할 일 추천 열기`}
                    className="pointer-events-auto relative flex flex-col items-center rounded-full before:absolute before:-inset-x-2 before:-inset-y-1 hover:brightness-125"
                  >
                    <FlowPin no={pin.no} />
                  </button>
                ) : (
                  <FlowPin no={pin.no} />
                )}
                <span
                  aria-hidden={pin.no === 2}
                  title={crowded ? pin.label : undefined}
                  className={`absolute top-full mt-[5.7px] text-[8.385px] leading-[1.2] font-bold whitespace-nowrap text-ink ${crowded ? 'max-w-[42px] overflow-hidden text-ellipsis' : ''}`}
                >
                  {pin.label}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* 범례 */}
        <ul aria-label="범례" className="m-0 flex list-none items-center gap-3.5 self-end p-0 text-[11px] text-muted">
          <li className="flex items-center gap-[5px]">
            <img src={legendDotProgress} alt="" className="size-1.5" />
            진행 중
          </li>
          <li className="flex items-center gap-[5px]">
            <img src={legendDotDone} alt="" className="size-1.5" />
            완료
          </li>
        </ul>
      </div>

      {/* 요청 줄 → 요청 상세 */}
      <ul className="m-0 mt-[15px] flex list-none flex-col gap-1.5 p-0">
        {rows.map((r) => {
          // 점: 전달까지 끝났으면(확인 대기) 완료 색, 아니면 진행 중
          const sent = r.status === 'delivered'
          // 기획안 §8-5: "백 → 프론트 · 2일째 막힘" 처럼 누가 누구 때문에 멈췄는지 먼저
          const state = flowStatus(r, sent ? 'out' : 'in').status
          return (
            <li key={r.id}>
              <Link to={`/requests/${r.id}`} className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl border border-line bg-fill px-3.5 py-3 hover:border-white/20 hover:bg-fill-2">
                <img src={sent ? flowDotDone : flowDotProgress} alt="" className="size-2 shrink-0" />
                <span className="sr-only">{sent ? '전달 완료' : '진행 중'}</span>
                <span className="text-sm leading-tight font-semibold text-ink">{r.title}</span>
                <span className="text-xs text-muted">
                  {routeText(r)} · <span className={urgency(r) === 0 ? 'font-semibold text-blocked' : undefined}>{state}</span>
                </span>
              </Link>
            </li>
          )
        })}
        {rows.length === 0 && <li className="px-1 text-xs text-muted">주고받을 것이 없어요. 모두 확인까지 끝났어요.</li>}
      </ul>
      {more > 0 && (
        <Link to="/rooms/all" className="mt-2 self-end rounded text-xs text-muted hover:text-ink">
          외 {more}건<span className="sr-only"> 더 보기 — 전체 원정대 방으로</span>
        </Link>
      )}
    </GlassPanel>
  )
}

/** 작은 핀 (머리 18px · 막대 · 발) — 숫자 핀은 연두, 정상 핀은 깃발 */
function FlowPin({ no }: { no: number | 'summit' }) {
  return (
    <>
      {no === 'summit' ? (
        <span className="flex size-[18px] items-center justify-center rounded-full bg-fill-3">
          <img src={flowFlag} alt="" className="size-[8.4px]" />
        </span>
      ) : (
        <span className="flex size-[18px] items-center justify-center rounded-full border border-[rgb(214_227_111/0.2)] bg-[rgb(214_227_111/0.14)] font-mono text-[10px] leading-none font-medium text-summit">
          {no}
        </span>
      )}
      <span aria-hidden className="h-6 w-[1.2px] bg-contour" />
      <img src={flowFoot} alt="" className="h-[3px] w-1.5" />
    </>
  )
}

/* ───────── 방(역할) 요약 카드 ───────── */

/** 역할별 AI 요약 색 (피그마: 역할 색 13% 면 + 22% 테두리) */
const AI_TONE: Record<RoleId, { box: string; chip: string }> = {
  design: { box: 'border-[rgb(242_255_155/0.22)] bg-[rgb(242_255_155/0.13)] text-role-design', chip: 'text-role-design' },
  front: { box: 'border-[rgb(236_232_253/0.22)] bg-[rgb(236_232_253/0.13)] text-role-front', chip: 'text-role-front' },
  back: { box: 'border-[rgb(185_252_255/0.22)] bg-[rgb(185_252_255/0.13)] text-role-back', chip: 'text-[#dff4f5]' },
}

function RoomCard({ card }: { card: RoomCardData }) {
  const soon = useSoon()
  // 보낼 자료 / 받을 자료: 아직 확인이 안 끝난 넘겨주기 카드 수 (기획안 §7-1)
  const open = useRequests().filter(isOpen)
  const send = open.filter((c) => c.fromRole === card.role).length
  const receive = open.filter((c) => c.toRole === card.role).length
  const role = ROLE[card.role]
  const tone = AI_TONE[card.role]
  const headingId = `board-room-${card.role}`

  return (
    <GlassPanel role="region" aria-labelledby={headingId} className="flex min-w-0 flex-col gap-4 px-6 py-[22px]">
      {/* 방 이름 → 그 방으로 */}
      <h2 id={headingId} className="text-lg leading-tight font-bold text-ink">
        <Link to={role.path} className="inline-flex items-end gap-1 rounded hover:text-white">
          {role.label}
          <span aria-hidden className="text-xl leading-none font-medium text-muted">
            ›
          </span>
        </Link>
      </h2>

      {/* AI 진행 요약 */}
      <p className={`flex items-center gap-2 rounded-[14px] border px-3 py-2.5 text-[13px] leading-tight font-medium ${tone.box}`}>
        <span className={`shrink-0 rounded-lg bg-[rgb(52_62_43/0.95)] px-1.5 py-0.5 font-mono text-[10px] leading-[normal] font-medium tracking-[0.4px] ${tone.chip}`}>
          AI
        </span>
        <span className="min-w-0">{card.aiSummary}</span>
      </p>

      {/* 가장 최근 링크 (연결할 주소가 아직 없어요) */}
      <button
        type="button"
        onClick={soon(`${card.latestLink.title} 링크 열기`)}
        className="flex w-full items-center gap-2 rounded-[10px] border border-line py-2 pr-3 pl-2 text-left hover:bg-fill"
      >
        <MiniThumb />
        <span className="shrink-0 rounded-[8.5px] bg-fill-2 px-1.5 py-0.5 font-mono text-[10px] leading-[normal] font-medium tracking-[0.4px] text-ink">
          {card.latestLink.kind}
        </span>
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

      {/* 보낼 자료 / 받을 자료 개수 */}
      <dl className="m-0 mt-auto flex gap-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-2xl border border-[rgb(214_227_111/0.2)] bg-[rgb(214_227_111/0.1)] px-4 py-3 text-summit">
          <dt className="text-xs font-medium">보낼 자료</dt>
          <dd className="m-0 text-2xl leading-[normal] font-bold tracking-[-0.02em]">{send}</dd>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-2xl border border-line bg-fill px-4 py-3">
          <dt className="text-xs font-medium text-muted">받을 자료</dt>
          <dd className="m-0 text-2xl leading-[normal] font-bold tracking-[-0.02em] text-ink">{receive}</dd>
        </div>
      </dl>
    </GlassPanel>
  )
}

/** 링크 옆 작은 화면 그림 (피그마 Mini thumb — 도형으로만 된 장식) */
function MiniThumb() {
  const bar = 'absolute bg-contour'
  return (
    <span aria-hidden className="relative block h-10 w-14 shrink-0 overflow-hidden rounded-xl border border-line bg-fill">
      <span className="absolute top-[3px] left-[14px] block h-[49px] w-[30px] rounded-[3px] bg-[rgb(244_244_241/0.16)] drop-shadow-[0_2px_3px_rgb(0_0_0/0.08)]">
        <span className={`${bar} top-[6.84px] left-[3.8px] h-[2.28px] w-[15.2px] rounded-[2px]`} />
        <span className={`${bar} top-[10.64px] left-[3.8px] h-[1.52px] w-[20.52px] rounded-[2px]`} />
        <span className={`${bar} top-[17.48px] left-[3.8px] h-[4.56px] w-[22.04px] rounded-[1.14px]`} />
        <span className={`${bar} top-[23.56px] left-[3.8px] h-[4.56px] w-[22.04px] rounded-[1.14px]`} />
        <span className="absolute top-[31.92px] left-[3.8px] h-[5.32px] w-[22.04px] rounded-[1.14px] bg-[rgb(40_60_67/0.95)]" />
        <span className={`${bar} top-[40.28px] left-[9.12px] h-[1.52px] w-[11.4px] rounded-[2px]`} />
      </span>
    </span>
  )
}
