// 메시지 아래에 붙는 것들: 링크 칩 · Figma 미리보기 카드 · GitHub PR 카드 · 넘겨주기 배지.
import { Link } from 'react-router-dom'
import { ROLE } from '@/data/mock'
import { dueDay, routeText, statusText, useRequest } from '@/data/requestStore'
import { useSoon } from '@/ui/toast'
import dotStage from '@/assets/rooms/dot-stage-summit.svg'
import markerCurrent from '@/assets/rooms/marker-current.svg'
import markerDone from '@/assets/rooms/marker-done.svg'
import markerTodo from '@/assets/rooms/marker-todo.svg'
import thumbMypage from '@/assets/rooms/thumb-mypage-screen.svg'
import type { Attachment, FigmaAttachment, HandoffAttachment, LinkAttachment, PrAttachment, PrStage, StageState } from './roomData'

/** GITHUB · FIGMA 같은 출처 칩 (고정폭 10px) */
export function SourceChip({ children, className = 'bg-fill-2' }: { children: string; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-[8.5px] px-1.5 py-0.5 font-mono text-[10px] leading-normal font-medium tracking-[0.4px] text-ink ${className}`}>
      {children}
    </span>
  )
}

/** 한 줄 링크 칩 (전체 방) */
export function LinkChip({ item }: { item: LinkAttachment }) {
  const soon = useSoon()
  const cls = 'flex max-w-full flex-wrap items-center gap-2 rounded-[10px] border border-line px-3 py-2 text-left transition hover:bg-fill'
  const body = (
    <>
      <SourceChip>{item.source}</SourceChip>
      <span className="text-[13px] font-medium text-ink">{item.title}</span>
      {item.stages && (
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="sr-only">끝난 단계:</span>
          {item.stages.map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-[11px] font-medium text-ink">
              <img src={dotStage} alt="" className="size-[7px]" />
              {s}
            </span>
          ))}
        </span>
      )}
      {!item.to && (
        <span aria-hidden className="text-xs font-medium text-muted">
          ↗
        </span>
      )}
    </>
  )
  return item.to ? (
    <Link to={item.to} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={soon(`${item.title} 열기`)} className={cls}>
      {body}
      <span className="sr-only">(새 창에서 열기)</span>
    </button>
  )
}

/** 로그인 화면 썸네일 (피그마에서 네모로 그린 그림 그대로) */
function LoginThumb() {
  return (
    <div className="absolute top-[10px] left-[60px] h-[130px] w-[78px] rounded-lg bg-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.08)]">
      <div className="absolute top-[18px] left-[10px] h-1.5 w-10 rounded-xs bg-[#1f1f1f]" />
      <div className="absolute top-[28px] left-[10px] h-1 w-[54px] rounded-xs bg-[#d4d4d4]" />
      <div className="absolute top-[46px] left-[10px] h-3 w-[58px] rounded-[3px] bg-[#f0f0f2]" />
      <div className="absolute top-[62px] left-[10px] h-3 w-[58px] rounded-[3px] bg-[#f0f0f2]" />
      <div className="absolute top-[84px] left-[10px] h-3.5 w-[58px] rounded-[3px] bg-[#ece8fd]" />
      <div className="absolute top-[106px] left-[24px] h-1 w-[30px] rounded-xs bg-[#d4d4d4]" />
    </div>
  )
}

// 바뀐 곳 표시(주황 점선 · 지시선 · 설명 칩)의 위치 — 썸네일마다 다름
const MARK = {
  login: { area: 'top-[90px] h-[22px]', leader: 'top-[101px]', chip: 'top-[88px]' },
  mypage: { area: 'top-[22px] h-[28px]', leader: 'top-[36px]', chip: 'top-[23px]' },
} as const

/** Figma 미리보기 카드 (디자인 방) — 썸네일 + 바뀐 곳 + 파일 정보 */
export function FigmaPreviewCard({ item }: { item: FigmaAttachment }) {
  const soon = useSoon()
  const mark = MARK[item.thumb]
  return (
    <div className="@container w-full max-w-[460px] overflow-clip rounded-[20px] border border-line bg-fill">
      <div aria-hidden className="relative h-[150px] w-full overflow-clip bg-fill">
        {item.thumb === 'login' ? <LoginThumb /> : <img src={thumbMypage} alt="" className="absolute top-[6px] left-[54px] h-[142px] w-[90px] max-w-none" />}
        <div className={`absolute left-[66px] w-[66px] rounded border-[1.5px] border-dashed border-[#e8710a] bg-due/10 ${mark.area}`} />
        {/* 설명 칩은 카드가 좁으면 숨김 (글자는 아래 sr-only 로 읽힘) */}
        <div className={`absolute left-[136px] hidden h-[1.5px] w-10 bg-[#e8710a] @[340px]:block ${mark.leader}`} />
        <div className={`absolute left-[180px] hidden items-center rounded-[13px] border border-[#f9c9a3] bg-fill-3 px-2.5 py-[5px] @[340px]:flex ${mark.chip}`}>
          <span className="text-xs leading-normal font-semibold whitespace-nowrap text-muted">{item.note}</span>
        </div>
        <div className="absolute top-2.5 right-2.5 flex items-center rounded-[10.5px] border border-line bg-fill-3 px-2 py-[3px]">
          <span className="text-[11px] leading-normal font-medium whitespace-nowrap text-muted">{item.version}</span>
        </div>
      </div>
      <p className="sr-only">
        미리보기: {item.note} · {item.version}
      </p>
      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        <div className="flex min-w-0 flex-col gap-[3px]">
          <div className="flex flex-wrap items-center gap-2">
            <SourceChip className="bg-fill-3">FIGMA</SourceChip>
            <span className="text-sm leading-normal font-semibold text-ink">{item.title}</span>
          </div>
          <span className="text-[11px] leading-normal text-muted">{item.path}</span>
        </div>
        {item.external && (
          <button
            type="button"
            onClick={soon('Figma에서 열기')}
            aria-label={`${item.title} Figma에서 열기`}
            className="-m-2 flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-medium text-muted hover:bg-fill-2 hover:text-ink"
          >
            <span aria-hidden>↗</span>
          </button>
        )}
      </div>
    </div>
  )
}

const STAGE: Record<StageState, { marker: string; text: string; sr: string }> = {
  done: { marker: markerDone, text: 'font-medium text-ink', sr: '완료' },
  current: { marker: markerCurrent, text: 'font-bold text-checkpoint-text', sr: '진행 중' },
  todo: { marker: markerTodo, text: 'font-medium text-muted', sr: '예정' },
}

/** PR 진행 단계: 작업 — 리뷰 — 병합 — 배포 */
export function PrStages({ stages }: { stages: PrStage[] }) {
  // 모두 끝났으면 연결선도 연두색, 아니면 등고선 색
  const allDone = stages.every((s) => s.state === 'done')
  return (
    <ol aria-label="PR 진행 단계" className="flex w-full flex-wrap items-center gap-y-1.5 rounded-xl border border-line bg-fill px-3 py-2.5">
      {stages.map((s, i) => (
        <li key={s.label} className="flex items-center">
          {i > 0 && <span aria-hidden className={`mx-2 h-[1.5px] w-[clamp(8px,7.5cqw,36px)] ${allDone ? 'bg-summit' : 'bg-contour'}`} />}
          <span className={`flex items-center gap-1.5 text-xs leading-normal whitespace-nowrap ${STAGE[s.state].text}`}>
            <img src={STAGE[s.state].marker} alt="" className="size-2.5" />
            {s.label}
            <span className="sr-only"> ({STAGE[s.state].sr})</span>
          </span>
        </li>
      ))}
    </ol>
  )
}

/** GitHub PR 카드 (프론트 방) */
export function PrCard({ item }: { item: PrAttachment }) {
  const soon = useSoon()
  // 연결된 넘겨주기 카드가 있으면 그 카드의 지금 상태로 (막힘이 풀리면 빨간 글자도 풀림)
  const linked = useRequest(item.badge.requestId)
  const badge = linked
    ? { ...item.badge, tone: linked.blocked && linked.status !== 'confirmed' ? ('blocked' as const) : ('auto' as const), text: `${linked.title} (${routeText(linked)}) ${statusText(linked)}` }
    : item.badge
  return (
    <div className="@container flex w-full max-w-[480px] flex-col items-start gap-3 rounded-[20px] border border-line bg-surface px-4 py-3.5">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <SourceChip>GITHUB</SourceChip>
          <span className="text-sm leading-normal font-semibold text-ink">{item.title}</span>
        </div>
        <button
          type="button"
          onClick={soon('GitHub에서 PR 열기')}
          aria-label={`${item.title} GitHub에서 열기`}
          className="-m-2 flex size-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-medium text-muted hover:bg-fill-2 hover:text-ink"
        >
          <span aria-hidden>↗</span>
        </button>
      </div>
      <p className="text-xs leading-normal whitespace-pre-wrap text-muted">{item.branch}</p>
      <PrStages stages={item.stages} />
      <Link
        to={badge.to}
        className={`flex max-w-full flex-wrap items-center gap-x-1.5 bg-fill-3 px-2.5 py-1.5 leading-normal transition hover:brightness-125 ${
          badge.tone === 'auto' ? 'rounded-[13px] text-role-design' : 'rounded-xl text-blocked'
        }`}
      >
        <span className="text-[11px] font-bold">{badge.label}</span>
        <span className="text-xs font-semibold">{badge.text}</span>
      </Link>
    </div>
  )
}

/** "프론트에 넘겨줌 · 마감 11/19 · 확인 대기" — 누르면 요청 상세로 */
export function HandoffBadge({ item, id }: { item: HandoffAttachment; id?: string }) {
  // 연결된 넘겨주기 카드가 있으면 그 카드의 지금 상태로 (확인하면 "확인 완료"로 바뀜)
  const linked = useRequest(item.requestId)
  const strong = linked ? `${ROLE[linked.toRole].label}에 넘겨줌` : item.strong
  const rest = linked ? `· 마감 ${dueDay(linked.due)} · ${statusText(linked)}` : item.rest
  return (
    <Link
      id={id}
      to={item.to}
      className="flex max-w-full flex-wrap items-center gap-x-1.5 rounded-[13px] bg-role-front-bg px-2.5 py-1.5 text-xs leading-normal text-role-front transition hover:brightness-125"
    >
      <span className="font-semibold">{strong}</span>
      <span>{rest}</span>
    </Link>
  )
}

/** 첨부 종류에 맞는 부품을 골라 그림 */
export function AttachmentView({ item }: { item: Attachment }) {
  switch (item.type) {
    case 'link':
      return <LinkChip item={item} />
    case 'figma':
      return <FigmaPreviewCard item={item} />
    case 'pr':
      return <PrCard item={item} />
    case 'handoff':
      return <HandoffBadge item={item} />
  }
}
