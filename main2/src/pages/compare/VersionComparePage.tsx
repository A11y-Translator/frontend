// 07 프론트 방 · 버전 비교 (기본): 버전 바 + 나란히/겹쳐 보기 + 코멘트(답글 · 해결 · 넘겨주기).
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useId, useRef, useState, type FormEvent, type MouseEvent, type ReactNode, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import dotCurrent from '@/assets/compare/dot-current.svg'
import dotDev from '@/assets/compare/dot-dev.svg'
import iconChevronDown from '@/assets/compare/icon-chevron-down.svg'
import legendDesign from '@/assets/compare/legend-design.svg'
import legendFront from '@/assets/compare/legend-front.svg'
import legendResolved from '@/assets/compare/legend-resolved.svg'
import { CHECKPOINTS } from '@/data/mock'
import { GlassPanel, Mono, Segmented } from '@/ui'
import { useSoon, useToast } from '@/ui/toast'
import { CHANGES, PR_CHIP, SCREEN_NAME, VERSIONS, type CompareComment, type VersionId } from './compareData'
import { CompareShell, PhonePreview, PinBadge, PreviewMarks, RoleTag } from './parts'
import { useCompare, type CompareState, type ShowState } from './useCompare'

const VERSION_IDS: VersionId[] = ['current', 'dev']
const DOT: Record<VersionId, string> = { current: dotCurrent, dev: dotDev }
const VIEW_MODES = [
  { value: 'side', label: '나란히' },
  { value: 'overlay', label: '겹쳐 보기' },
] as const
type ViewMode = (typeof VIEW_MODES)[number]['value']
type Filter = 'open' | 'resolved'

const MENU = 'z-50 min-w-[220px] rounded-xl border border-line bg-surface p-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)]'
const MENU_ITEM = 'flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-[13px] text-ink outline-none data-[highlighted]:bg-fill-3'

export function VersionComparePage() {
  const c = useCompare()
  const toast = useToast()
  const soon = useSoon()
  const [base, setBase] = useState<VersionId>('current')
  const [target, setTarget] = useState<VersionId>('dev')
  const [mode, setMode] = useState<ViewMode>('side')
  const [overlay, setOverlay] = useState(50)
  const [filter, setFilter] = useState<Filter>('open')
  const inputRef = useRef<HTMLInputElement>(null)

  const differs = base !== target
  const changeCount = differs ? CHANGES.length : 0

  // 핀을 누르면 그 코멘트가 있는 탭(미해결/해결됨)으로 옮겨서 보여 줘요
  const selectComment = (id: number) => {
    const found = c.comments.find((x) => x.id === id)
    if (found) setFilter(found.resolved ? 'resolved' : 'open')
    c.select(id)
  }
  const place = (version: VersionId, e: MouseEvent<HTMLElement>) => {
    c.placeAt(version, e)
    inputRef.current?.focus()
  }
  const pinsFor = (version: VersionId) =>
    c.comments.filter((x) => x.version === version && (x.resolved ? c.show.resolved : x.role === 'design' ? c.show.design : c.show.front))
  const marks = (version: VersionId) => (
    <PreviewMarks
      version={version}
      tone="basic"
      pins={pinsFor(version)}
      selectedId={c.selectedId}
      onSelect={selectComment}
      showChanges={c.show.changes && differs && version === 'dev'}
      draft={c.draft}
      onPlace={place}
    />
  )

  return (
    <CompareShell variant="basic">
      {/* 버전 바 */}
      <section
        aria-label="비교할 버전"
        className="relative z-20 flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl border border-line bg-fill px-4 py-3"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <VersionPicker side="왼쪽" value={base} onChange={setBase} />
          <span aria-hidden className="text-sm font-medium text-muted">
            →
          </span>
          <VersionPicker side="오른쪽" value={target} onChange={setTarget} />
          <span aria-hidden className="hidden h-7 w-px rounded-[14px] bg-contour @2xl:block" />
          <span className="rounded-[11px] bg-role-front-bg px-2 py-1 text-xs font-bold whitespace-nowrap text-checkpoint-text">바뀐 곳 {changeCount}</span>
          <span className="rounded-[11px] bg-fill-3 px-2 py-1 text-xs font-bold whitespace-nowrap text-ink">미해결 코멘트 {c.openCount}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger className="flex items-center gap-1.5 rounded-[14px] border border-line bg-fill-3 py-1.5 pr-2.5 pl-3 text-xs whitespace-nowrap hover:bg-fill-3">
              <span className="font-medium text-muted">화면</span>
              <span className="font-bold text-ink">{SCREEN_NAME}</span>
              <img src={iconChevronDown} alt="" className="size-3" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" sideOffset={6} className={MENU}>
                <DropdownMenu.RadioGroup
                  value={SCREEN_NAME}
                  onValueChange={(name) => {
                    // 피그마에는 메인 피드 화면만 있어요
                    if (name !== SCREEN_NAME) soon(`${name} 화면 비교`)()
                  }}
                >
                  {CHECKPOINTS.filter((p) => p.no > 0).map((p) => (
                    <DropdownMenu.RadioItem key={p.no} value={p.name} className={MENU_ITEM}>
                      {p.name}
                      <DropdownMenu.ItemIndicator className="text-ink">✓</DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
          <Segmented label="보기 방식" options={VIEW_MODES} value={mode} onChange={setMode} />
        </div>
      </section>

      <div className="mt-4 flex flex-1 flex-col gap-4 @5xl:flex-row">
        {/* 비교 */}
        <GlassPanel role="region" aria-labelledby="compare-title" className="flex min-w-0 flex-1 flex-col gap-4 px-4 py-5 @xl:px-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-2">
              <h2 id="compare-title" className="text-base font-bold whitespace-nowrap text-ink">
                {SCREEN_NAME}
              </h2>
              <span className="rounded-[8.5px] bg-fill-2 px-1.5 py-0.5 text-[11px] font-bold whitespace-nowrap text-ink">{PR_CHIP}</span>
            </div>
            <p className="text-xs font-medium text-muted">화면을 클릭하면 그 자리에 코멘트를 남길 수 있어요</p>
          </div>

          {mode === 'side' ? (
            // 좁으면 이 줄 안에서만 가로로 스크롤
            <div className="flex gap-4 overflow-x-auto">
              <Pane version={base}>
                <PhonePreview tone="basic" layers={[{ version: base }]}>
                  {marks(base)}
                </PhonePreview>
              </Pane>
              <Pane version={target}>
                <PhonePreview tone="basic" layers={[{ version: target }]}>
                  {marks(target)}
                </PhonePreview>
              </Pane>
            </div>
          ) : (
            // 겹쳐 보기: 왼쪽 버전 위에 오른쪽 버전을 반투명하게 (피그마에 없는 화면 — 임시 구성)
            <div className="flex flex-col items-center gap-3 rounded-[20px] border border-line bg-fill p-3.5">
              <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <h3 className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-ink">
                  <img src={DOT[base]} alt="" className="size-2" />
                  {VERSIONS[base].paneName}
                  <span aria-hidden className="font-medium text-muted">
                    위에
                  </span>
                  <span className="sr-only">위에</span>
                  <img src={DOT[target]} alt="" className="size-2" />
                  {VERSIONS[target].paneName}
                </h3>
                <label className="flex items-center gap-2 text-[11px] font-medium text-muted">
                  {VERSIONS[target].paneName} 진하기
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={overlay}
                    onChange={(e) => setOverlay(Number(e.target.value))}
                    className="w-32 accent-ink"
                  />
                  <Mono className="w-8 text-right text-[10px]">{overlay}%</Mono>
                </label>
              </div>
              <PhonePreview tone="basic" layers={[{ version: base }, { version: target, opacity: overlay / 100 }]}>
                {marks(target)}
              </PhonePreview>
              <p className="text-[11px] font-medium text-muted">{VERSIONS[target].caption}</p>
            </div>
          )}

          <Legend show={c.show} onToggle={c.toggleShow} />
        </GlassPanel>

        {/* 코멘트 — 넓은 화면에서는 비교 패널과 같은 높이로, 목록만 스크롤 */}
        <div className="shrink-0 @5xl:relative @5xl:w-[344px]">
          <CommentsPanel c={c} filter={filter} setFilter={setFilter} inputRef={inputRef} onSelect={selectComment} onEmpty={() => toast('코멘트 내용을 입력해 주세요')} />
        </div>
      </div>
    </CompareShell>
  )
}

/* ───────────── 버전 고르기 ───────────── */

function VersionPicker({ side, value, onChange }: { side: string; value: VersionId; onChange: (v: VersionId) => void }) {
  const v = VERSIONS[value]
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center gap-2.5 rounded-xl border border-line bg-fill px-3 py-1.5 text-left hover:bg-fill-3">
        <img src={DOT[value]} alt="" className="size-2 shrink-0" />
        <span className="flex flex-col gap-px whitespace-nowrap">
          <span className="sr-only">{side} 화면 버전 고르기:</span>
          <span className="text-[11px] font-medium text-muted">{v.barLabel}</span>
          <span className="text-[13px] font-bold text-ink">{v.barLine}</span>
        </span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="start" sideOffset={6} className={MENU}>
          <DropdownMenu.RadioGroup value={value} onValueChange={(id) => onChange(id as VersionId)}>
            {VERSION_IDS.map((id) => (
              <DropdownMenu.RadioItem key={id} value={id} className={MENU_ITEM}>
                <span className="flex items-center gap-2.5">
                  <img src={DOT[id]} alt="" className="size-2 shrink-0" />
                  <span className="flex flex-col gap-px whitespace-nowrap">
                    <span className="text-[11px] font-medium text-muted">{VERSIONS[id].barLabel}</span>
                    <span className="font-bold">{VERSIONS[id].barLine}</span>
                  </span>
                </span>
                <DropdownMenu.ItemIndicator className="text-ink">✓</DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/* ───────────── 한쪽 화면 ───────────── */

function Pane({ version, children }: { version: VersionId; children: ReactNode }) {
  const soon = useSoon()
  const v = VERSIONS[version]
  return (
    <section
      aria-label={`${v.paneName} ${v.chip}`}
      className="flex min-w-[270px] flex-1 flex-col items-center gap-3 rounded-[20px] border border-line bg-fill p-3.5"
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="flex items-center gap-1.5">
          <img src={DOT[version]} alt="" className="size-2 shrink-0" />
          <h3 className="text-[13px] font-bold whitespace-nowrap text-ink">{v.paneName}</h3>
          {version === 'current' ? (
            <span className="rounded-[9.5px] border border-line bg-fill-3 px-1.5 py-0.5 text-[11px] font-bold whitespace-nowrap text-ink">{v.chip}</span>
          ) : (
            <span className="rounded-[8.5px] bg-role-front-bg px-1.5 py-0.5 font-mono text-[10px] font-medium whitespace-nowrap text-checkpoint-text">{v.chip}</span>
          )}
        </div>
        <button type="button" onClick={soon(`${v.url} 새 창으로 열기`)} className="rounded text-[11px] font-medium whitespace-nowrap text-muted hover:text-ink">
          {v.url} ↗
        </button>
      </div>
      {children}
      <p className="text-center text-[11px] font-medium text-muted">{v.caption}</p>
    </section>
  )
}

/* ───────────── 범례 (누르면 표시 켜고 끄기) ───────────── */

function Legend({ show, onToggle }: { show: ShowState; onToggle: (key: keyof ShowState) => void }) {
  const items: { key: keyof ShowState; label: string; dot?: string }[] = [
    { key: 'changes', label: '바뀐 곳' },
    { key: 'design', label: '디자인 코멘트', dot: legendDesign },
    { key: 'front', label: '프론트 코멘트', dot: legendFront },
    { key: 'resolved', label: '해결됨', dot: legendResolved },
  ]
  return (
    <div role="group" aria-label="화면 위에 표시할 것" className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          aria-pressed={show[it.key]}
          onClick={() => onToggle(it.key)}
          className={`flex items-center gap-1.5 rounded text-xs font-medium whitespace-nowrap text-muted hover:text-ink ${show[it.key] ? '' : 'line-through opacity-50'}`}
        >
          {it.dot ? (
            <img src={it.dot} alt="" className="size-2.5" />
          ) : (
            <span aria-hidden className="h-2.5 w-3.5 rounded-[5px] border-[1.2px] border-dashed border-role-front/25 bg-role-front-bg" />
          )}
          {it.label}
        </button>
      ))}
    </div>
  )
}

/* ───────────── 코멘트 패널 ───────────── */

function CommentsPanel({
  c,
  filter,
  setFilter,
  inputRef,
  onSelect,
  onEmpty,
}: {
  c: CompareState
  filter: Filter
  setFilter: (f: Filter) => void
  inputRef: RefObject<HTMLInputElement | null>
  onSelect: (id: number) => void
  onEmpty: () => void
}) {
  const [text, setText] = useState('')
  const titleId = useId()
  const list = c.comments.filter((x) => (filter === 'resolved' ? x.resolved : !x.resolved))
  const selected = c.comments.find((x) => x.id === c.selectedId)
  const otherCount = filter === 'open' ? c.resolvedCount : c.openCount

  // 찍어 둔 자리가 있으면 새 코멘트, 아니면 고른 코멘트에 답글
  const hint = c.draft ? '찍은 자리에 새 코멘트 남기기' : selected ? `${selected.id}번 코멘트에 답글 달기` : '새 코멘트 남기기'

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return onEmpty()
    if (c.draft || !selected) {
      c.addComment(value)
      setFilter('open')
    } else {
      c.addReply(selected.id, value)
    }
    setText('')
  }

  return (
    <GlassPanel role="complementary" aria-labelledby={titleId} className="flex flex-col gap-3.5 p-5 @5xl:absolute @5xl:inset-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={titleId} className="flex items-center gap-1.5 text-base font-bold text-ink">
          코멘트
          <Mono className="text-[13px] text-muted">
            <span className="sr-only">전체 </span>
            {c.comments.length}
          </Mono>
        </h2>
        <Segmented
          label="코멘트 상태"
          options={[
            { value: 'open', label: `미해결 ${c.openCount}` },
            { value: 'resolved', label: `해결됨 ${c.resolvedCount}` },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <div className="-m-1 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-1">
        {list.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted">{filter === 'open' ? '미해결 코멘트가 없어요' : '해결된 코멘트가 없어요'}</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {list.map((x) => (
              <CommentCard
                key={x.id}
                comment={x}
                selected={x.id === c.selectedId}
                refCb={c.itemRef(x.id)}
                onSelect={() => onSelect(x.id)}
                onReply={() => {
                  c.setDraft(null)
                  c.select(x.id)
                  inputRef.current?.focus()
                }}
                onToggleResolved={() => c.toggleResolved(x.id)}
              />
            ))}
          </ul>
        )}
        {otherCount > 0 && (
          <button
            type="button"
            onClick={() => setFilter(filter === 'open' ? 'resolved' : 'open')}
            className="self-start rounded text-xs font-medium whitespace-nowrap text-muted hover:text-ink"
          >
            {filter === 'open' ? `해결된 코멘트 ${otherCount}개 보기 ›` : `미해결 코멘트 ${otherCount}개 보기 ›`}
          </button>
        )}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 rounded-xl border border-line py-2 pr-2 pl-3 focus-within:border-ink/20">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label={hint}
          placeholder={hint}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink placeholder:text-muted focus:outline-none"
        />
        {c.draft && (
          <button type="button" onClick={() => c.setDraft(null)} className="rounded text-xs font-medium whitespace-nowrap text-muted hover:text-ink">
            자리 취소
          </button>
        )}
        <button type="submit" className="rounded-[15px] bg-summit px-3.5 py-[7px] text-[13px] leading-normal font-bold whitespace-nowrap text-on-summit hover:brightness-105">
          보내기
        </button>
      </form>
    </GlassPanel>
  )
}

function CommentCard({
  comment: x,
  selected,
  refCb,
  onSelect,
  onReply,
  onToggleResolved,
}: {
  comment: CompareComment
  selected: boolean
  refCb: (el: HTMLElement | null) => void
  onSelect: () => void
  onReply: () => void
  onToggleResolved: () => void
}) {
  const action = 'rounded text-xs font-medium whitespace-nowrap text-muted hover:text-ink'
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- 마우스 편의용: 키보드는 핀 버튼(PinBadge)으로 같은 선택을 할 수 있어요
    <li
      ref={refCb}
      onClick={(e) => {
        // 안쪽 버튼 · 입력칸을 누른 건 선택으로 치지 않아요
        if (!(e.target as HTMLElement).closest('button, a, input, textarea')) onSelect()
      }}
      className={`flex flex-col items-start gap-2 p-3 ${selected ? 'rounded-[20px] border-[1.5px] border-line bg-fill' : 'rounded-2xl border border-line bg-fill'}`}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <PinBadge comment={x} tone="basic" selected={selected} onSelect={onSelect} />
          <span className="text-[13px] font-bold whitespace-nowrap text-ink">{x.author}</span>
          <RoleTag role={x.role} />
          {x.timeMono ? <Mono className="text-[10px] text-muted">{x.time}</Mono> : <span className="text-[11px] font-medium whitespace-nowrap text-muted">{x.time}</span>}
        </div>
        <span className={`text-[11px] font-bold whitespace-nowrap ${x.resolved ? 'text-muted' : x.memo ? 'text-checkpoint-text' : 'text-blocked'}`}>
          {x.resolved ? '해결됨' : x.memo ? '메모' : '미해결'}
        </span>
      </div>
      <p className="text-[11px] font-medium text-muted">{x.place}</p>
      <p className="text-[13px] leading-normal text-ink">{x.text}</p>

      {x.replies.length > 0 && (
        <ul className="flex w-full flex-col gap-1.5" aria-label="답글">
          {x.replies.map((r, i) => (
            <li key={i} className="flex flex-col gap-1 rounded-2xl border border-line bg-fill p-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold whitespace-nowrap text-ink">
                  <span aria-hidden>↳ </span>
                  {r.author}
                </span>
                <RoleTag role={r.role} />
                <span className="text-[11px] font-medium whitespace-nowrap text-muted">{r.time}</span>
              </div>
              <p className="text-xs leading-normal text-ink">{r.text}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onReply} className={action}>
          답글
        </button>
        <button type="button" onClick={onToggleResolved} className={action}>
          {x.resolved ? '미해결로 되돌리기' : '해결로 표시'}
        </button>
        {selected && !x.resolved && (
          <Link to="/requests/new" className="rounded-[10.5px] bg-fill-3 px-2 py-1 text-[11px] font-bold whitespace-nowrap text-ink hover:brightness-110">
            넘겨주기로 만들기
          </Link>
        )}
      </div>
    </li>
  )
}
