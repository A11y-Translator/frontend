// 07-2 프론트 방 · 버전 비교 (심플): 두 화면 나란히 + 가벼운 코멘트 목록 + "코멘트 남기기".
import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import dotDev from '@/assets/compare/dot-dev.svg'
import dotLive from '@/assets/compare/dot-live.svg'
import { GlassPanel, Mono } from '@/ui'
import { useToast } from '@/ui/toast'
import { ROLE } from '@/data/mock'
import { CHANGES, SCREEN_NAME, VERSIONS, type CompareComment, type VersionId } from './compareData'
import { CompareShell, PhonePreview, PinBadge, PreviewMarks } from './parts'
import { useCompare } from './useCompare'

const DOT: Record<VersionId, string> = { current: dotLive, dev: dotDev }

export function VersionCompareSimplePage() {
  // 심플은 해결된 코멘트를 기본으로 숨겨요 ("해결됨 1 보기" 로 켜기)
  const c = useCompare({ resolved: false })
  const toast = useToast()
  const [composing, setComposing] = useState(false)
  const [text, setText] = useState('')
  const [threadId, setThreadId] = useState<number | null>(null)
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const titleId = useId()
  const commentsId = useId()

  const openComposer = () => setComposing(true)
  const closeComposer = () => {
    setComposing(false)
    setText('')
    c.setDraft(null)
  }
  // 작성 칸이 열리면 바로 입력할 수 있게
  useEffect(() => {
    if (composing) areaRef.current?.focus()
  }, [composing])

  // 단축키 C: 코멘트 남기기 (글자를 입력하는 중에는 동작하지 않아요)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'c' || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
      e.preventDefault()
      setComposing(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const place = (version: VersionId, e: MouseEvent<HTMLElement>) => {
    c.placeAt(version, e)
    setComposing(true)
    areaRef.current?.focus()
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = text.trim()
    if (!value) return toast('코멘트 내용을 입력해 주세요')
    c.addComment(value)
    setComposing(false)
    setText('')
  }

  const pinsFor = (version: VersionId) => c.comments.filter((x) => x.version === version && (!x.resolved || c.show.resolved))
  const list = c.comments.filter((x) => !x.resolved || c.show.resolved)
  const selectComment = (id: number) => {
    const found = c.comments.find((x) => x.id === id)
    if (found?.resolved && !c.show.resolved) c.toggleShow('resolved')
    c.select(id)
  }

  return (
    <CompareShell variant="simple">
      <div className="flex flex-1 flex-col gap-5 @5xl:flex-row">
        {/* 비교 */}
        <GlassPanel role="region" aria-labelledby={titleId} className="flex min-w-0 flex-1 flex-col gap-5 p-4 @xl:p-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <h2 id={titleId} className="text-lg font-bold whitespace-nowrap text-ink">
                {SCREEN_NAME}
              </h2>
              {/* 누르면 바뀐 곳 점선을 켜고 끕니다 */}
              <button
                type="button"
                aria-pressed={c.show.changes}
                onClick={() => c.toggleShow('changes')}
                className={`rounded text-[13px] font-medium whitespace-nowrap text-muted hover:text-ink ${c.show.changes ? '' : 'line-through opacity-60'}`}
              >
                개발 서버에서 바뀐 곳 {CHANGES.length}
              </button>
            </div>
            <p className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap text-muted">
              화면을 눌러 코멘트 남기기
              <kbd className="rounded border border-line px-1.5 py-px font-sans text-[11px] font-bold">C</kbd>
            </p>
          </div>

          {/* 좁으면 이 줄 안에서만 가로로 스크롤 */}
          <div className="flex min-h-0 flex-1 gap-5 overflow-x-auto">
            {(['current', 'dev'] as const).map((version) => (
              <section
                key={version}
                aria-label={VERSIONS[version].simpleName}
                className="flex min-w-[274px] flex-1 flex-col items-center gap-3.5 rounded-[20px] border border-white/[0.06] bg-white/[0.03] p-4"
              >
                <div className="flex w-full flex-col gap-0.5">
                  <h3 className="flex items-center gap-1.5 text-sm font-bold text-ink">
                    <img src={DOT[version]} alt="" className="size-2 shrink-0" />
                    {VERSIONS[version].simpleName}
                  </h3>
                  <p className="text-xs font-medium text-muted">{VERSIONS[version].simpleLine}</p>
                </div>
                <PhonePreview tone="simple" layers={[{ version }]}>
                  <PreviewMarks
                    version={version}
                    tone="simple"
                    pins={pinsFor(version)}
                    selectedId={c.selectedId}
                    onSelect={selectComment}
                    showChanges={c.show.changes && version === 'dev'}
                    draft={c.draft}
                    onPlace={place}
                  />
                </PhonePreview>
              </section>
            ))}
          </div>
        </GlassPanel>

        {/* 코멘트 — 넓은 화면에서는 비교 패널과 같은 높이로, 목록만 스크롤 */}
        <div className="shrink-0 @5xl:relative @5xl:w-[320px]">
          <GlassPanel role="complementary" aria-labelledby={commentsId} className="flex flex-col gap-3 p-5 @5xl:absolute @5xl:inset-0">
            <div className="flex items-center justify-between gap-2">
              <h2 id={commentsId} className="flex items-center gap-1.5 text-base font-bold text-ink">
                코멘트
                <Mono className="text-[13px] text-muted">
                  <span className="sr-only">미해결 </span>
                  {c.openCount}
                </Mono>
              </h2>
              {c.resolvedCount > 0 && (
                <button
                  type="button"
                  aria-pressed={c.show.resolved}
                  onClick={() => c.toggleShow('resolved')}
                  className={`rounded text-xs font-medium whitespace-nowrap hover:text-ink ${c.show.resolved ? 'text-ink' : 'text-muted'}`}
                >
                  해결됨 {c.resolvedCount} 보기
                </button>
              )}
            </div>

            <div className="-m-1 min-h-0 flex-1 overflow-y-auto p-1">
              {list.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-muted">아직 코멘트가 없어요</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {list.map((x) => (
                    <SimpleComment
                      key={x.id}
                      comment={x}
                      selected={x.id === c.selectedId}
                      threadOpen={x.id === threadId}
                      refCb={c.itemRef(x.id)}
                      onSelect={() => c.select(x.id)}
                      onToggleThread={() => {
                        c.select(x.id)
                        setThreadId(threadId === x.id ? null : x.id)
                      }}
                      onReply={(value) => c.addReply(x.id, value)}
                      onToggleResolved={() => c.toggleResolved(x.id)}
                    />
                  ))}
                </ul>
              )}
            </div>

            {composing ? (
              <form onSubmit={submit} className="flex flex-col gap-2 rounded-2xl border border-line bg-fill p-3 focus-within:border-white/30">
                <label htmlFor="new-comment" className="text-xs font-medium text-muted">
                  {c.draft ? `${VERSIONS[c.draft.version].simpleName} 화면에 찍은 자리에 남겨요` : '화면을 누르면 그 자리에 핀이 찍혀요'}
                </label>
                <textarea
                  id="new-comment"
                  ref={areaRef}
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') closeComposer()
                  }}
                  placeholder="코멘트를 입력하세요"
                  className="resize-none rounded-lg bg-transparent text-sm leading-normal text-ink placeholder:text-muted focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeComposer} className="rounded-[15px] px-3 py-[7px] text-[13px] font-medium text-muted hover:text-ink">
                    취소
                  </button>
                  <button type="submit" className="rounded-[15px] bg-summit px-3.5 py-[7px] text-[13px] font-bold text-on-summit hover:brightness-105">
                    보내기
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={openComposer}
                aria-keyshortcuts="C"
                className="w-full rounded-[20.5px] border border-line bg-white/[0.08] px-4 py-3 text-sm leading-normal font-bold whitespace-nowrap text-ink hover:bg-white/[0.12]"
              >
                코멘트 남기기
              </button>
            )}
          </GlassPanel>
        </div>
      </div>
    </CompareShell>
  )
}

function SimpleComment({
  comment: x,
  selected,
  threadOpen,
  refCb,
  onSelect,
  onToggleThread,
  onReply,
  onToggleResolved,
}: {
  comment: CompareComment
  selected: boolean
  threadOpen: boolean
  refCb: (el: HTMLElement | null) => void
  onSelect: () => void
  onToggleThread: () => void
  onReply: (text: string) => void
  onToggleResolved: () => void
}) {
  const [reply, setReply] = useState('')
  const threadId = useId()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = reply.trim()
    if (!value) return
    onReply(value)
    setReply('')
  }
  return (
    <li
      ref={refCb}
      onClick={onSelect}
      className={`flex flex-col items-start gap-1.5 p-3 ${selected ? 'rounded-2xl bg-[rgb(40_60_67/0.95)]' : 'rounded-[10px]'} ${x.resolved ? 'opacity-70' : ''}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <PinBadge comment={x} tone="simple" selected={selected} onSelect={onSelect} />
        <span className="text-[13px] font-bold whitespace-nowrap text-ink">{x.author}</span>
        <span className={`text-xs font-medium whitespace-nowrap ${selected ? 'text-[#b4bcc1]' : 'text-muted'}`}>
          {ROLE[x.role].label} · {x.time}
          {x.resolved && ' · 해결됨'}
        </span>
      </div>
      <p className="text-sm leading-normal text-ink">{x.simpleText}</p>

      <div className="flex items-center gap-3.5 text-xs" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-expanded={threadOpen}
          aria-controls={threadId}
          onClick={onToggleThread}
          className={`rounded font-medium whitespace-nowrap hover:text-ink ${selected ? 'text-[#b4bcc1]' : 'text-muted'}`}
        >
          답글{x.replies.length > 0 && ` ${x.replies.length}`}
        </button>
        <button type="button" onClick={onToggleResolved} className="rounded font-bold whitespace-nowrap text-checkpoint-text hover:brightness-125">
          {x.resolved ? '되돌리기' : '해결'}
        </button>
      </div>

      {threadOpen && (
        <div id={threadId} className="flex w-full flex-col gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
          {x.replies.length > 0 && (
            <ul className="flex flex-col gap-2" aria-label="답글">
              {x.replies.map((r, i) => (
                <li key={i} className="flex flex-col gap-0.5 border-l-2 border-white/15 pl-2.5">
                  <p className="text-xs">
                    <span className="font-bold text-ink">{r.author}</span>{' '}
                    <span className={`font-medium ${selected ? 'text-[#b4bcc1]' : 'text-muted'}`}>
                      {ROLE[r.role].label} · {r.time}
                    </span>
                  </p>
                  <p className="text-[13px] leading-normal text-ink">{r.text}</p>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={submit} className="flex items-center gap-2 rounded-xl border border-white/15 py-1.5 pr-1.5 pl-3 focus-within:border-white/40">
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              aria-label={`${x.id}번 코멘트에 답글 달기`}
              placeholder="답글 달기"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-ink placeholder:text-[#b4bcc1] focus:outline-none"
            />
            <button type="submit" className="rounded-[13px] bg-summit px-3 py-1.5 text-xs font-bold whitespace-nowrap text-on-summit hover:brightness-105">
              보내기
            </button>
          </form>
        </div>
      )}
    </li>
  )
}
