// Figma: project/issue-detail "Comment thread" (554:12327)
// 작성자 아바타 · 이름/역할 · @멘션 강조 · 답글 입력(→ actions.addComment)
// 닫기: ✕ 버튼 (바깥 클릭 · Esc 는 IssueDetailPage 가 처리)
// 멘션: 입력칸에 @ 를 치면 위로 팀원 목록(모두 포함)이 뜨고, 방향키·Enter 또는 클릭으로 고름
import { useId, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type Ref, type RefObject } from 'react'
import { CURRENT_USER_ID, memberById, members } from '@/shared/mocks'
import { TEAM_LABEL } from '@/shared/api/types'
import type { Comment, Issue } from '@/shared/api/types'
import { shortName } from '@/web/common/issueHelpers'

interface CommentThreadProps {
  issue: Issue
  comments: Comment[]
  /** 새 핀을 꽂고 답글을 기다리는 중인지 */
  pendingPin: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onSubmit: (body: string) => void
  /** ✕ · Esc 로 닫기 */
  onClose: () => void
  style?: CSSProperties
  ref?: Ref<HTMLElement>
}

/** 멘션 후보: 맨 위 "모두" + 나를 뺀 팀원 */
interface MentionOption {
  id: string
  /** 입력칸에 들어갈 글자 (@ 뒤) */
  handle: string
  label: string
  sub: string
  initial: string
}
const MENTION_ALL: MentionOption = { id: 'all', handle: '모두', label: '모두', sub: '이 이슈를 보는 팀원 전체에게 알림', initial: '@' }
const MENTION_MEMBERS: MentionOption[] = members
  .filter((m) => m.id !== CURRENT_USER_ID)
  .map((m) => ({ id: m.id, handle: shortName(m.name), label: m.name, sub: `${TEAM_LABEL[m.team]} · ${m.role}`, initial: m.initial }))

/** 커서 바로 앞이 "@글자" 이면 그 위치와 검색어 */
function mentionQuery(text: string, caret: number) {
  const m = text.slice(0, caret).match(/(^|\s)@([^\s@]*)$/)
  return m ? { start: caret - m[2].length - 1, query: m[2] } : null
}

export function CommentThread({ issue, comments, pendingPin, inputRef, onSubmit, onClose, style, ref }: CommentThreadProps) {
  const [draft, setDraft] = useState('')
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const listId = useId()
  const [closed, setClosed] = useState(false)
  // 새 핀을 꽂으면 접힌 스레드도 펼쳐서 바로 입력할 수 있게
  const isClosed = closed && !pendingPin
  const inputId = useId()
  const titleId = useId()

  const q = mention?.query.toLowerCase() ?? ''
  const options = mention
    ? [MENTION_ALL, ...MENTION_MEMBERS].filter(
        (o) => !q || o.handle.toLowerCase().includes(q) || o.label.toLowerCase().includes(q) || o.sub.toLowerCase().includes(q),
      )
    : []
  const listOpen = options.length > 0

  const updateMention = (text: string, caret: number | null) => {
    const next = caret == null ? null : mentionQuery(text, caret)
    setMention(next)
    setActiveIdx(0)
  }

  const pick = (o: MentionOption) => {
    if (!mention) return
    const end = mention.start + 1 + mention.query.length
    const insert = `@${o.handle} `
    const next = draft.slice(0, mention.start) + insert + draft.slice(end)
    setDraft(next)
    setMention(null)
    const caret = mention.start + insert.length
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(caret, caret)
    })
  }

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (listOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const d = e.key === 'ArrowDown' ? 1 : -1
        setActiveIdx((i) => (i + d + options.length) % options.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        pick(options[Math.min(activeIdx, options.length - 1)])
        return
      }
      if (e.key === 'Escape') {
        // 목록만 닫고 창은 그대로
        e.preventDefault()
        e.stopPropagation()
        setMention(null)
        return
      }
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (listOpen) return
    const body = draft.trim()
    if (!body) return
    onSubmit(body)
    setDraft('')
    setClosed(false)
  }

  return (
    <section
      ref={ref}
      aria-labelledby={titleId}
      style={style}
      className="absolute z-10 flex w-[280px] flex-col gap-2.5 rounded-xl border border-ext-line bg-white px-3.5 py-3 font-noto shadow-[0_6px_18px_rgba(0,0,0,0.12)]"
    >
      <div className="flex items-center text-xs leading-[1.5]">
        <h2 id={titleId} className="flex-1 font-bold text-black">
          #{issue.no} {issue.category} · 코멘트 {comments.length}
        </h2>
        <button
          type="button"
          aria-expanded={!isClosed}
          onClick={() => setClosed(!isClosed)}
          className="rounded px-1 font-medium text-[#175fc2] hover:underline"
        >
          {isClosed ? '다시 열기' : '해결'}
          <span className="sr-only"> (코멘트 스레드 {isClosed ? '펼치기' : '해결로 접기'})</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="코멘트 창 닫기"
          title="닫기 (Esc)"
          className="ml-1 flex size-6 items-center justify-center rounded-full text-muted hover:bg-web-chip hover:text-black"
        >
          <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      </div>

      {isClosed ? (
        <p className="text-xs text-muted">해결된 스레드예요.</p>
      ) : (
        <>
          {comments.length > 0 ? (
            <ol className="flex max-h-[180px] flex-col gap-2.5 overflow-y-auto">
              {comments.map((c) => (
                <CommentItem key={c.id} comment={c} />
              ))}
            </ol>
          ) : (
            <p className="text-xs text-muted">아직 코멘트가 없어요. 첫 코멘트를 남겨 보세요.</p>
          )}
          <form onSubmit={submit} className="relative flex items-center gap-1.5 rounded-lg bg-[#f5f5f5] py-1 pr-1 pl-2.5">
            {listOpen && (
              <ul
                id={listId}
                role="listbox"
                aria-label="멘션할 팀원"
                className="absolute right-0 bottom-full left-0 z-20 mb-1.5 max-h-[188px] overflow-y-auto rounded-lg border border-ext-line bg-white p-1 shadow-[0_6px_18px_rgba(0,0,0,0.14)]"
              >
                {options.map((o, i) => {
                  const active = i === Math.min(activeIdx, options.length - 1)
                  return (
                    // 콤보박스 패턴: 키보드(↑↓ Enter)는 입력칸에서 처리하고, 목록은 마우스 선택만 받음
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                    <li
                      key={o.id}
                      id={`${listId}-${o.id}`}
                      role="option"
                      aria-selected={active}
                      // 입력칸 포커스를 잃지 않게 mousedown 기본 동작을 막음
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(o)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 ${active ? 'bg-web-chip' : ''}`}
                    >
                      <span
                        aria-hidden
                        className={`flex size-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${o.id === 'all' ? 'bg-black text-white' : 'bg-ext-line text-black'}`}
                      >
                        {o.initial}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col leading-[1.35]">
                        <span className="truncate text-xs font-bold text-black">{o.id === 'all' ? '@모두' : o.label}</span>
                        <span className="truncate text-[10px] text-muted">{o.sub}</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
            <label htmlFor={inputId} className="sr-only">
              {pendingPin ? '새 핀에 코멘트 남기기' : '답글 남기기'} (@ 를 입력하면 멘션할 팀원 목록이 열려요)
            </label>
            <input
              ref={inputRef}
              id={inputId}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                updateMention(e.target.value, e.target.selectionStart)
              }}
              onKeyDown={onInputKeyDown}
              onClick={(e) => updateMention(e.currentTarget.value, e.currentTarget.selectionStart)}
              onBlur={() => setMention(null)}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={listOpen}
              aria-controls={listOpen ? listId : undefined}
              aria-activedescendant={listOpen ? `${listId}-${options[Math.min(activeIdx, options.length - 1)].id}` : undefined}
              placeholder={pendingPin ? '새 핀에 코멘트 남기기… @멘션' : '답글 남기기… @멘션'}
              className="min-w-0 flex-1 bg-transparent py-1 text-xs leading-[1.5] text-black outline-none placeholder:text-[#8a8a8a]"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="shrink-0 rounded-md bg-black px-2 py-1 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#c4c4c4]"
            >
              등록
            </button>
          </form>
        </>
      )}
    </section>
  )
}

function CommentItem({ comment }: { comment: Comment }) {
  const author = memberById(comment.authorId)
  return (
    <li className="flex items-start gap-2">
      <span aria-hidden className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-ext-line text-[10px] leading-[1.5] font-medium text-black">
        {author?.initial ?? '?'}
      </span>
      <div className="flex min-w-0 flex-1 flex-col leading-[1.5] text-black">
        <p className="text-[11px] font-bold">
          {author ? `${shortName(author.name)} · ${author.role}` : '알 수 없음'}
          <span className="ml-1.5 font-normal text-muted">{comment.time}</span>
        </p>
        <p className="text-xs break-words">
          <MentionText text={comment.body} />
        </p>
      </div>
    </li>
  )
}

/** "@혜승 확인했어요" → @혜승 만 강조 (색 + 굵기, 색만으로 구분하지 않음) */
function MentionText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(@\S+)/g).map((part, i) =>
        part.startsWith('@') ? (
          <strong key={i} className="font-bold text-[#175fc2]">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  )
}
