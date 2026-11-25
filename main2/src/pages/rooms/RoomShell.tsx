// 방(원정대 채널) 공통 틀 — 전체 · 디자인 · 프론트 · 백 방이 모두 이 틀을 씁니다.
// (피그마 "11 전체 방 / 03 디자인 방 / 05 프론트 방": 제목 → 왼쪽 대화 패널 + 오른쪽 패널)
//
// ── 쓰는 법 ─────────────────────────────────────────────────────────────
//   const feed = useRoomFeed(FRONT_ROOM.feed, 'front')   // ./useRoomFeed — 예시 대화 + 보낸 메시지 + 넘겨주기 이벤트
//   <RoomShell title="프론트" count="4명" icon={<img …/>}
//     feed={<RoomFeed label="프론트 방 대화" items={feed.items} live={feed.live}
//                     composer={{ placeholder: '메시지 입력', onSend: feed.send }} />}
//     side={<SidePanel title="현재 흐름">…</SidePanel>}   // ./RoomSidePanel
//   >
//     {모달 · 시트 등 방 위에 띄울 것}                    // children — 틀 맨 끝에 그대로 렌더
//   </RoomShell>
//
// ── 내보내는 것 ─────────────────────────────────────────────────────────
// RoomShell   title: string            방 이름 (h1)
//             count: string            인원 ("6명")
//             icon?: ReactNode         제목 앞 색 점 (장식 — alt="" 이미지)
//             headerExtra?: ReactNode  제목 줄에 덧붙일 것 (GitHub 연결 칩, "요청 보내기" 버튼 등)
//             feed: ReactNode          왼쪽 칸 (보통 <RoomFeed/>)
//             side: ReactNode          오른쪽 칸 (보통 <SidePanel/>)
//             gap?: 'normal'|'tight'   두 칸 사이 (32px · 전체 방은 16px)
//             children?: ReactNode     방 위에 띄울 모달/오버레이
// RoomFeed    label: string            패널 이름 (화면낭독기용)
//             items: FeedItem[]        날짜 · 메시지 · 이벤트 (./roomData 의 타입)
//             composer: ComposerProps  아래 입력칸
//             live?: string            aria-live 로 읽어 줄 문구 (useRoomFeed().live)
//             density?: 'cozy'|'compact'  간격 (compact = 전체 방: 아바타 30 · 간격 18)
//             showRoomChip?: boolean   이름 앞에 방 칩(디자인/프론트/백) 표시
//             gapClass?: string        항목 사이 간격 클래스 (기본은 density 에 따름)
//             children?: ReactNode     있으면 목록 대신 이것을 가운데에 그림 (비어 있음 · 불러오는 중 · 실패)
//             handoff?: RoomHandoff    링크가 붙은 이 방 메시지에 "넘겨주기" 버튼을 붙임 (./useRoomHandoff 의 값 그대로)
// MessageRow  item: MessageItem · compact?: boolean · showRoomChip?: boolean · handoff?: RoomHandoff   (li)
// EventRow    item: EventItem                                                     (li)
// Composer    placeholder: string · onSend(text) · label?: string(기본 "메시지 입력")
//             leading?: ReactNode(입력칸 앞 칩) · inputRef?: Ref<HTMLInputElement> · disabled?: boolean
// useRoomFeed(initial, room) → { items, send(text, note?, to?), append(item, announce?), announce(text), live }   (./useRoomFeed)
//   · 보낸 메시지는 저장소(@/data/roomStore)에, 요청 · 넘겨주기 · 수정 요청 · 확인 · 막힘 줄은 카드 기록(./roomEvents)에서 와요.
import { useEffect, useRef, useState, type FormEvent, type ReactNode, type Ref } from 'react'
import { Link } from 'react-router-dom'
import { ROLE, type RoleId } from '@/data/mock'
import { AttachmentView, HandoffBadge } from './RoomAttachments'
import type { EventItem, FeedItem, HandoffAttachment, MessageItem } from './roomData'

/* ───────── 틀 ───────── */

export interface RoomShellProps {
  title: string
  count: string
  icon?: ReactNode
  headerExtra?: ReactNode
  feed: ReactNode
  side: ReactNode
  gap?: 'normal' | 'tight'
  children?: ReactNode
}

export function RoomShell({ title, count, icon, headerExtra, feed, side, gap = 'normal', children }: RoomShellProps) {
  return (
    // 넓으면(@4xl↑) 화면 높이에 딱 맞추고 대화만 안에서 스크롤, 좁으면 한 줄로 쌓여 페이지가 스크롤
    <div className="flex w-full shrink-0 flex-col px-(--gutter) pt-(--page-top) pb-[19px] @4xl:min-h-[560px] @4xl:flex-[1_1_0%]">
      <header className="relative flex flex-wrap items-center gap-x-3 gap-y-2 pl-1.5">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon}
          <h1 className="text-[clamp(22px,1rem+1.2vw,28px)] leading-[1.2] font-bold tracking-[-0.02em] text-ink">{title}</h1>
          <p className="text-lg leading-normal text-muted">
            <span className="sr-only">인원 </span>
            {count}
          </p>
          {/* 기획 문서 ↗ — 모든 방 제목 옆 (Figma 03 · 07 · 11). 기획안은 시작하기 화면에 있어요 */}
          <Link to="/start" className="ml-1 inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-fill-2">
            기획 문서 <span aria-hidden>↗</span>
          </Link>
        </div>
        {headerExtra}
      </header>

      <div
        className={`mt-[15px] grid min-h-0 flex-1 @4xl:grid-cols-[minmax(0,724fr)_minmax(0,404fr)] @4xl:grid-rows-[minmax(0,1fr)] ${
          gap === 'tight' ? 'gap-4' : 'gap-4 @5xl:gap-8'
        }`}
      >
        {feed}
        {side}
      </div>
      {children}
    </div>
  )
}

/** 제목 줄 "요청 보내기" 링크 모양 (GhostButton 을 제목 줄에 맞게 조금 작게) */
export const REQUEST_ENTRY =
  'inline-flex items-center justify-center rounded-full border border-line px-3.5 py-2 text-[13px] leading-none font-semibold whitespace-nowrap text-ink transition hover:bg-fill-2'

/** 메시지 아래 작은 "넘겨주기" 버튼 (요청 모달의 "+ 링크" 칩과 같은 모양) */
const HANDOFF_ENTRY = 'rounded-[14px] border border-line bg-fill-3 px-2.5 py-1.5 text-xs leading-normal font-medium whitespace-nowrap text-muted hover:text-ink'

/** 유리 패널 모양 (GlassPanel 과 같은 값 — section 으로 쓰려고 클래스만 공유) */
export const ROOM_PANEL = 'glass-edge rounded-3xl border border-line-soft bg-glass backdrop-blur-[14px]'

/* ───────── 대화 패널 ───────── */

export interface RoomFeedProps {
  label: string
  items: FeedItem[]
  composer: ComposerProps
  live?: string
  density?: 'cozy' | 'compact'
  showRoomChip?: boolean
  gapClass?: string
  children?: ReactNode
  handoff?: RoomHandoff
}

/** 대화 → 카드 전환 (기획안 §7-3): 링크가 있는 메시지에서 '넘겨주기' */
export interface HandoffLink {
  /** 항목 이름으로 쓸 링크 이름 */
  name: string
  /** 카드에 붙일 링크 칩 글자 ("Figma  마이페이지 시안") */
  label: string
}
export interface RoomHandoff {
  /** 이 방(보내는 역할)의 메시지에만 버튼이 붙음 */
  room: RoleId
  /** 이미 넘겨준 메시지 → 그 자리에 보여 줄 배지 */
  done: Record<string, HandoffAttachment>
  onStart: (item: MessageItem, link: HandoffLink) => void
}

/** 메시지에 붙은 첫 링크 (Figma 미리보기 · PR 카드 · 링크 칩) */
function handoffLink(item: MessageItem): HandoffLink | null {
  for (const a of item.attachments ?? []) {
    if (a.type === 'figma') return { name: a.title, label: `Figma  ${a.title}` }
    if (a.type === 'pr') return { name: a.title.replace(/^#\d+\s*/, ''), label: `GitHub  PR ${a.title.match(/^#\d+/)?.[0] ?? a.title}` }
    if (a.type === 'link') return { name: a.title.replace(/^#\d+\s*/, ''), label: `${a.source === 'FIGMA' ? 'Figma' : 'GitHub'}  ${a.title}` }
  }
  return null
}

export function RoomFeed({ label, items, composer, live = '', density = 'cozy', showRoomChip = false, gapClass, children, handoff }: RoomFeedProps) {
  const compact = density === 'compact'
  const scroller = useRef<HTMLDivElement>(null)
  const count = useRef(items.length)

  // 처음 열 때: 예시 대화 뒤에 쌓인 것이 있으면 최신(맨 아래)부터 보이게
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [])

  // 새 항목이 붙으면 맨 아래로
  useEffect(() => {
    if (items.length > count.current) scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
    count.current = items.length
  }, [items.length])

  return (
    <section
      aria-label={label}
      className={`${ROOM_PANEL} flex h-[clamp(480px,calc(100dvh-200px),750px)] min-h-0 min-w-0 flex-col gap-4 px-4 pb-5 @2xl:px-7 @4xl:h-auto ${compact ? 'pt-[22px]' : 'pt-6'}`}
    >
      {/* 안쪽만 스크롤 (포커스 테두리가 잘리지 않게 살짝 여유) */}
      <div ref={scroller} tabIndex={children ? undefined : 0} aria-label={children ? undefined : `${label} 목록`} role={children ? undefined : 'group'} className="-mx-1.5 flex min-h-0 flex-1 flex-col overflow-y-auto px-1.5 pb-1">
        {children ? (
          <div className="flex flex-1 items-center justify-center py-4">{children}</div>
        ) : (
          <ol className={`flex flex-col items-start ${gapClass ?? (compact ? 'gap-[18px]' : 'gap-[22px]')}`}>
            {items.map((item) =>
              item.kind === 'date' ? (
                <li key={item.id} className="w-full text-center text-xs leading-normal font-medium text-muted">
                  {item.label}
                </li>
              ) : item.kind === 'message' ? (
                <MessageRow key={item.id} item={item} compact={compact} showRoomChip={showRoomChip} handoff={handoff} />
              ) : (
                <EventRow key={item.id} item={item} />
              ),
            )}
          </ol>
        )}
      </div>
      <Composer {...composer} />
      <p role="status" aria-live="polite" className="sr-only">
        {live}
      </p>
    </section>
  )
}

/* ───────── 메시지 한 줄 ───────── */

export function MessageRow({
  item,
  compact = false,
  showRoomChip = false,
  handoff,
}: {
  item: MessageItem
  compact?: boolean
  showRoomChip?: boolean
  handoff?: RoomHandoff
}) {
  const role = ROLE[item.role]
  // 넘겨주기 버튼: 이 방 사람이 올린, 링크가 있고 아직 넘겨주지 않은 메시지에만
  const sent = handoff?.done[item.id]
  const link = handoff && !sent && item.role === handoff.room && !item.attachments?.some((a) => a.type === 'handoff') ? handoffLink(item) : null
  return (
    <li className="flex w-full items-start gap-3">
      <span
        aria-hidden
        className={`flex shrink-0 items-center justify-center rounded-full bg-fill-3 text-[13px] font-semibold text-ink ${compact ? 'size-[30px]' : 'size-8'}`}
      >
        {item.author.slice(0, 1)}
      </span>
      <div className={`flex min-w-0 flex-1 flex-col items-start ${compact ? 'gap-1.5' : 'gap-2'}`}>
        <div className="flex flex-wrap items-center gap-2 leading-normal">
          {showRoomChip && (
            <span className="rounded-[8.5px] px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap" style={{ background: role.bg, color: role.color }}>
              {role.label}
              <span className="sr-only"> 방</span>
            </span>
          )}
          <span className="text-[13px] font-semibold text-ink">{item.author}</span>
          <span className={item.timeStyle === 'clock' ? 'font-mono text-[11px] font-medium text-muted' : 'text-xs text-muted'}>{item.time}</span>
        </div>
        <p className="max-w-full text-sm leading-normal break-words text-ink">{item.text}</p>
        {item.attachments?.map((a, i) => <AttachmentView key={i} item={a} />)}
        {sent && <HandoffBadge id={`handoff-${item.id}`} item={sent} />}
        {handoff && link && (
          <button type="button" id={`handoff-start-${item.id}`} onClick={() => handoff.onStart(item, link)} aria-haspopup="dialog" className={HANDOFF_ENTRY}>
            넘겨주기
            <span className="sr-only"> — {link.name}</span>
          </button>
        )}
      </div>
    </li>
  )
}

/* ───────── 이벤트 한 줄 (넘겨주기 · 요청 · GitHub) ───────── */

const EVENT: Record<EventItem['tone'], { box: string; chip: string; text: string }> = {
  handoff: {
    box: 'rounded-xl border-line bg-fill',
    chip: 'rounded-[8.5px] bg-role-front-bg px-[7px] py-0.5 text-[11px] font-semibold text-checkpoint-text',
    text: 'font-medium text-ink',
  },
  request: {
    box: 'rounded-[16.5px] border-danger/25 bg-danger/10',
    chip: 'rounded-[8.5px] border border-danger/25 bg-danger/10 px-[7px] py-0.5 text-[11px] font-semibold text-blocked',
    text: 'font-semibold text-danger',
  },
  github: {
    box: 'rounded-xl border-line bg-fill',
    chip: 'rounded-lg border border-line bg-fill-3 px-[5px] py-px font-mono text-[10px] font-medium tracking-[0.4px] text-ink',
    text: 'font-medium text-muted',
  },
}

export function EventRow({ item }: { item: EventItem }) {
  const tone = EVENT[item.tone]
  const cls = `flex max-w-full flex-wrap items-center gap-2 border px-3 py-2 leading-normal ${tone.box}`
  const body = (
    <>
      <span className={`shrink-0 whitespace-nowrap ${tone.chip}`}>{item.chip}</span>
      <span className={`text-xs ${tone.text}`}>{item.text}</span>
    </>
  )
  return (
    <li className="max-w-full">
      {item.to ? (
        <Link to={item.to} className={`${cls} transition hover:brightness-125`}>
          {body}
        </Link>
      ) : (
        <p className={cls}>{body}</p>
      )}
    </li>
  )
}

/* ───────── 입력칸 ───────── */

export interface ComposerProps {
  placeholder: string
  onSend: (text: string) => void
  /** 화면낭독기용 이름 (기본 "메시지 입력") */
  label?: string
  /** 입력칸 앞에 놓을 것 (전체 방의 "보낼 곳" 칩) */
  leading?: ReactNode
  inputRef?: Ref<HTMLInputElement>
  disabled?: boolean
}

export function Composer({ placeholder, onSend, label = '메시지 입력', leading, inputRef, disabled = false }: ComposerProps) {
  const [text, setText] = useState('')

  // Enter · 보내기 버튼 → 목록에 추가하고 입력칸 비움
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText('')
  }

  return (
    <form onSubmit={submit} className="flex shrink-0 items-center gap-2.5 rounded-xl border border-line py-2.5 pr-2.5 pl-3 focus-within:border-ink/20">
      {leading}
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={label}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        enterKeyHint="send"
        className="min-w-0 flex-1 rounded bg-transparent text-sm leading-normal text-ink placeholder:text-muted disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled}
        className="shrink-0 rounded-[15px] bg-primary px-3.5 py-[7px] text-[13px] leading-normal font-semibold whitespace-nowrap text-on-primary transition hover:brightness-105 active:brightness-95 disabled:opacity-50"
      >
        보내기
      </button>
    </form>
  )
}
