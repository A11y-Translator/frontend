// 피그마 "01-2 루트 · 심플 노드 · 산" — 원정대 흐름(루트 상세).
// 체크포인트 보기: 산길 위에 핀이 놓이고, 진행 중인 구간(0 · 1)은 핀 아래에 세부 할 일 패널이 펼쳐집니다.
// 목록 보기: 같은 내용을 카드 목록으로. 본문 폭이 좁으면(@5xl 미만) 항상 목록으로 보여요.
// 위치는 피그마 캔버스(폭 1232px) 좌표를 본문 폭 비율(cqw)로 바꿔서 폭에 따라 같이 늘고 줄어듭니다.
// 체크포인트 이름 · 개수 · 정상 날짜는 시작하기/추천 루트에서 정한 값(planStore)을 따라가요.
//  - 산길 그림은 체크포인트 4개에 맞춰 그려져 있어서, 4개일 때만 "체크포인트 보기"를 쓰고 그 밖에는 목록으로 보여 줍니다.
import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import routeFlag from '@/assets/board/route-flag.svg'
import routeFoot from '@/assets/board/route-foot.svg'
import pathCurrent from '@/assets/board/route-path-current.svg'
import pathPlanned from '@/assets/board/route-path-planned.svg'
import { deadlineText, usePlan } from '@/data/planStore'
import {
  ROUTE_CANVAS_W,
  ROUTE_HEADER,
  ROUTE_NEXT,
  ROUTE_PINS,
  ROUTE_SECTIONS,
  ROUTE_SUMMIT,
  ROUTE_UPCOMING,
  ROUTE_VIEWS,
  type RouteSection,
  type RouteView,
} from './boardData'
import { SectionTodoSheet } from './SectionTodoSheet'
import { TodoRow } from './TodoRow'

/** 피그마 px → 본문 폭 비율 */
const cq = (px: number) => `${((px / ROUTE_CANVAS_W) * 100).toFixed(3)}cqw`

/** 처음 담김 상태 (피그마: 기획안 = 담음, AI 추천 = 제안) */
const INITIAL_TODOS: Record<string, boolean> = Object.fromEntries(
  ROUTE_SECTIONS.flatMap((s) => s.parts.flatMap((p) => p.todos.map((t) => [t.id, t.added]))),
)

/** 펼친 구간 패널이 놓이는 자리 (피그마 좌표: 왼쪽 · 핀 발 높이) */
const PANEL_POS: Record<number, { left: number; pinY: number }> = {
  0: { left: 40, pinY: 460.5 },
  1: { left: 360, pinY: 380.5 },
}

export function RouteDetailPage() {
  const [view, setView] = useState<RouteView>('map')
  // 구간 패널 펼침 (핀을 눌러 접고 펼침)
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true, 1: true })
  const [todos, setTodos] = useState(INITIAL_TODOS)
  const [sheetOpen, setSheetOpen] = useState(false)
  const panelId = useId()
  const plan = usePlan()
  const cps = plan.checkpoints
  const summitWhen = deadlineText(plan).short
  // 산길 위 핀 자리는 4개짜리 그림 → 개수가 다르면 목록 보기로
  const mapOk = cps.length === ROUTE_PINS.filter((p) => typeof p.no === 'number' && p.no > 0).length
  const shown: RouteView = mapOk ? view : 'list'
  /** n번 체크포인트 이름 (0 = 베이스캠프) */
  const nameOf = (no: number, fallback: string) => (no > 0 ? cps[no - 1]?.name || fallback : fallback)
  // 펼친 구간: 베이스캠프 + 지금 있는 체크포인트만, 이름은 계획에서
  const sections = ROUTE_SECTIONS.filter((s) => s.no === 0 || s.no <= cps.length).map((s) => ({ ...s, name: nameOf(s.no, s.name) }))
  const next = cps[ROUTE_NEXT.no - 1] ? { ...ROUTE_NEXT, name: cps[ROUTE_NEXT.no - 1].name, title: `${ROUTE_NEXT.no} · ${cps[ROUTE_NEXT.no - 1].name}` } : null
  // 목록 보기의 예정 구간: 펼친 구간 뒤의 체크포인트 전부
  const upcoming = cps.slice(1).map((c, i) => ({ no: i + 2, name: c.name, dates: ROUTE_UPCOMING.find((u) => u.no === i + 2)?.dates }))

  const toggleTodo = (id: string, v: boolean) => setTodos((t) => ({ ...t, [id]: v }))
  const openSheet = () => setSheetOpen(true)

  return (
    <div className="flex min-h-full w-full flex-col bg-[#111214]">
      <div className="grid grid-cols-1">
        {/* 제목 */}
        <header className="z-10 col-start-1 row-start-1 flex flex-col gap-1.5 self-start justify-self-start px-[clamp(16px,3.25cqw,40px)] pt-(--page-top)">
          <h1 className="text-[clamp(22px,1rem+1.2vw,28px)] leading-[1.5] font-bold tracking-[-0.02em] text-ink">{ROUTE_HEADER.title}</h1>
          <p className="text-[13px] leading-5 text-muted">
            {cps.length > 0 ? `${cps.length}개의 체크포인트가 있어요.` : '체크포인트가 아직 없어요. 시작하기에서 루트를 만들어 주세요.'}
            {!mapOk && cps.length > 0 && <span className="hidden @5xl:inline"> 산길 지도는 체크포인트가 4개일 때 보여서, 지금은 목록으로 보여 드려요.</span>}
          </p>
        </header>

        {/* 체크포인트 보기 (넓은 화면에서만) */}
        {shown === 'map' && (
          <div className="relative col-start-1 row-start-1 hidden grid-cols-1 @5xl:grid" style={{ minHeight: cq(480) }}>
            {/* 산길: 지나온 구간(연두) · 예정 구간(회색) */}
            <img src={pathCurrent} alt="" className="absolute" style={{ left: cq(89), top: cq(379), width: cq(322), height: cq(82) }} />
            <img src={pathPlanned} alt="" className="absolute" style={{ left: cq(409), top: cq(159), width: cq(602), height: cq(222) }} />

            {/* 핀 */}
            {ROUTE_PINS.map((raw) => {
              const pin = typeof raw.no === 'number' ? { ...raw, name: nameOf(raw.no, raw.name) } : raw
              const style: CSSProperties = { left: cq(pin.x), top: cq(pin.y) }
              const expandable = typeof pin.no === 'number' && pin.no in PANEL_POS
              return (
                <div key={pin.no} style={style} className="absolute z-10 flex -translate-x-1/2 translate-y-[calc(-100%+2.5px)] flex-col items-center">
                  {pin.state === 'summit' ? (
                    <span className="flex size-[30px] items-center justify-center rounded-full border-2 border-surface bg-summit">
                      <img src={routeFlag} alt="" className="size-3.5" />
                      <span className="sr-only">
                        {ROUTE_SUMMIT.name} {summitWhen}
                      </span>
                    </span>
                  ) : expandable ? (
                    <button
                      type="button"
                      aria-expanded={open[pin.no as number]}
                      aria-controls={`${panelId}-${pin.no}`}
                      aria-label={`${pin.no} ${pin.name} 구간 할 일`}
                      onClick={() => setOpen((o) => ({ ...o, [pin.no as number]: !o[pin.no as number] }))}
                      className="flex size-[30px] items-center justify-center rounded-full bg-summit font-mono text-[11px] leading-none font-medium text-on-light hover:brightness-110"
                    >
                      {pin.no}
                    </button>
                  ) : (
                    <span className="relative flex size-[30px] items-center justify-center rounded-full bg-[rgb(244_244_241/0.16)] font-mono text-[11px] leading-none font-medium text-ink">
                      {pin.no}
                      <span className="sr-only"> {pin.name} (예정)</span>
                    </span>
                  )}
                  <span aria-hidden className="h-10 w-0.5 bg-contour" />
                  <img src={routeFoot} alt="" className="h-[5px] w-2.5" />

                  {/* 2번 핀 위: 예정 구간 카드 → 2구간 할 일 추천 시트 */}
                  {next && pin.no === next.no && (
                    <button
                      type="button"
                      onClick={openSheet}
                      aria-haspopup="dialog"
                      className="absolute bottom-[calc(100%+14px)] -left-[63px] flex h-[94px] w-[164px] flex-col items-start rounded-2xl border border-[rgb(244_244_241/0.16)] bg-surface px-3 pt-2.5 text-left whitespace-nowrap hover:border-white/30"
                    >
                      <span className="max-w-full truncate text-[13px] leading-5 font-bold text-ink">{next.title}</span>
                      <span className="mt-1 font-mono text-[10px] leading-[15px] font-medium text-muted">{next.dates}</span>
                      <span className="mt-[11px] text-[11px] leading-[17px] text-muted">{next.note}</span>
                    </button>
                  )}

                  {/* 4번 핀 옆: 최종 정상 카드 (정상 핀이 화면낭독기용 글자를 갖고 있어 여기는 장식) */}
                  {pin.no === 4 && (
                    <div
                      aria-hidden
                      className="absolute bottom-[calc(100%-10px)] -left-[27px] -z-10 h-[62px] w-[108px] rounded-2xl border border-line bg-fill px-[10px] pt-1.5 whitespace-nowrap"
                    >
                      <p className="text-[13px] leading-5 font-bold text-summit">{ROUTE_SUMMIT.name}</p>
                      <p className="mt-1 font-mono text-[10px] leading-[17px] font-medium text-ink">{summitWhen}</p>
                    </div>
                  )}
                </div>
              )
            })}

            {/* 펼친 구간 패널 (핀 바로 아래) */}
            {sections.map((s) => {
              const pos = PANEL_POS[s.no]
              if (!pos || !open[s.no]) return null
              return (
                <SectionPanel
                  key={s.no}
                  id={`${panelId}-${s.no}`}
                  section={s}
                  todos={todos}
                  onToggle={toggleTodo}
                  className="col-start-1 row-start-1 self-start justify-self-start"
                  style={{ marginLeft: cq(pos.left), marginTop: `calc(${cq(pos.pinY)} + 19.5px)`, width: cq(284) }}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* 목록 보기 (좁은 화면에서는 항상 이 모양) */}
      <div className={`mt-6 grid-cols-1 items-start gap-4 px-[clamp(16px,3.25cqw,40px)] @2xl:grid-cols-2 @5xl:grid-cols-3 ${shown === 'list' ? 'grid' : 'grid @5xl:hidden'}`}>
        {sections.map((s) => (
          <SectionPanel key={s.no} section={s} todos={todos} onToggle={toggleTodo} />
        ))}
        <UpcomingPanel upcoming={upcoming} summitWhen={summitWhen} onOpenSheet={openSheet} />
      </div>

      {/* 보기 전환 (오른쪽 아래) — 지도를 쓸 수 있을 때만 */}
      <div className={`relative z-10 hidden justify-end pr-12 pb-[58px] ${mapOk ? '@5xl:flex' : ''} ${shown === 'map' ? '-mt-1' : 'mt-6'}`}>
        <div role="group" aria-label="보기 전환" className="grid h-9 w-[208px] grid-cols-2 items-center rounded-xl border border-line bg-fill p-[3px]">
          {ROUTE_VIEWS.map((v) => {
            const on = v.value === view
            return (
              <button
                key={v.value}
                type="button"
                aria-pressed={on}
                onClick={() => setView(v.value)}
                className={`h-7 rounded-[14px] text-xs leading-[18px] whitespace-nowrap ${on ? 'bg-fill-3 font-bold text-ink' : 'font-normal text-muted hover:text-ink'}`}
              >
                {v.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className={mapOk ? 'pb-6 @5xl:hidden' : 'pb-6'} />
      <SectionTodoSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}

/* ───────── 구간 머리 (피그마 "루트 상세 / 구간") ───────── */

function SectionBadge({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[rgb(159_195_211/0.22)] bg-[rgb(159_195_211/0.13)] font-mono text-[10px] leading-none font-medium text-checkpoint">
      {children}
    </span>
  )
}

/* ───────── 펼친 구간 패널: 파트별 세부 할 일 ───────── */

function SectionPanel({
  section,
  todos,
  onToggle,
  id,
  className = '',
  style,
}: {
  section: RouteSection
  todos: Record<string, boolean>
  onToggle: (id: string, checked: boolean) => void
  id?: string
  className?: string
  style?: CSSProperties
}) {
  const headingId = useId()
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      style={style}
      className={`flex min-w-0 flex-col rounded-[20px] border border-white/[0.06] bg-white/[0.03] p-[15px] ${className}`}
    >
      <div className="flex min-h-9 items-center gap-2.5">
        <SectionBadge>{section.no}</SectionBadge>
        <div className="flex min-w-0 flex-1 flex-col gap-px leading-[1.4]">
          <h2 id={headingId} className="truncate text-[13px] font-bold text-ink">
            {section.name}
          </h2>
          <p className="font-mono text-[10px] font-medium text-muted">{section.dates}</p>
        </div>
        <span className="shrink-0 rounded-[9px] border border-[rgb(214_227_111/0.22)] bg-[rgb(214_227_111/0.13)] px-2 py-[3px] text-[10px] leading-[normal] font-bold whitespace-nowrap text-summit">
          {section.status}
        </span>
      </div>

      {section.parts.map((part) => (
        <fieldset key={part.label} className="m-0 mt-6 flex min-w-0 flex-col gap-1 border-0 p-0">
          <legend className="mb-1 p-0 text-[10px] leading-[15px] font-bold text-summit">{part.label}</legend>
          {part.todos.map((t) => (
            <TodoRow key={t.id} tone="route" label={t.label} source={t.source} checked={todos[t.id]} onChange={(v) => onToggle(t.id, v)} />
          ))}
        </fieldset>
      ))}

      {section.note && <p className="mt-[27px] text-[10px] leading-[15px] text-muted">{section.note}</p>}
    </section>
  )
}

/* ───────── 목록 보기 전용: 예정 구간 + 정상 ───────── */

function UpcomingPanel({
  upcoming,
  summitWhen,
  onOpenSheet,
}: {
  upcoming: { no: number; name: string; dates?: string }[]
  summitWhen: string
  onOpenSheet: () => void
}) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-2 rounded-[20px] border border-white/[0.06] bg-white/[0.03] p-[15px]">
      <h2 id={headingId} className="text-[10px] leading-[15px] font-bold text-summit">
        예정 구간
      </h2>
      <ol className="m-0 flex list-none flex-col gap-1 p-0">
        {upcoming.map((u) => {
          const body = (
            <>
              <SectionBadge>{u.no}</SectionBadge>
              <span className="flex min-w-0 flex-1 flex-col gap-px leading-[1.4]">
                <span className="truncate text-[13px] font-bold text-ink">{u.name}</span>
                {u.dates && <span className="font-mono text-[10px] font-medium text-muted">{u.dates}</span>}
              </span>
            </>
          )
          return (
            <li key={u.no}>
              {u.no === ROUTE_NEXT.no ? (
                // 다음 구간 → 2구간 할 일 추천 시트
                <button
                  type="button"
                  onClick={onOpenSheet}
                  aria-haspopup="dialog"
                  className="flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-[rgb(244_244_241/0.16)] bg-surface px-2.5 py-1.5 text-left hover:border-white/30"
                >
                  {body}
                  <span className="shrink-0 text-[11px] text-muted">{ROUTE_NEXT.note}</span>
                </button>
              ) : (
                <div className="flex min-h-11 items-center gap-2.5 px-2.5 py-1.5">{body}</div>
              )}
            </li>
          )
        })}
        <li className="flex min-h-11 items-center gap-2.5 px-2.5 py-1.5">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-summit">
            <img src={routeFlag} alt="" className="size-3" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-px leading-[1.4]">
            <span className="text-[13px] font-bold text-summit">{ROUTE_SUMMIT.name}</span>
            <span className="font-mono text-[10px] font-medium text-ink">{summitWhen}</span>
          </span>
        </li>
      </ol>
    </section>
  )
}
