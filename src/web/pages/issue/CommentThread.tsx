// Figma: project/issue-detail "Comment thread" (554:12327)
// 작성자 아바타 · 이름/역할 · @멘션 강조 · 답글 입력(→ actions.addComment)
// 닫기: ✕ 버튼 (바깥 클릭 · Esc 는 IssueDetailPage 가 처리)
// 스레드 = 캡처 위 위치 하나 (파란 번호 또는 직접 꽂은 핀). 제목은 IssueDetailPage 가 정해 줌 (예: "#1 색 대비 · 코멘트 2")
// 해결: 그 위치의 코멘트 논의가 끝났다는 표시. 저장돼서(actions.setThreadResolved) 창을 닫았다 열어도 유지되고,
//       '남은 코멘트' 숫자에서 빠져요. 새 코멘트를 남기면 다시 열려요. (이슈 자체의 '해결됨'은 오른쪽 패널에서)
// 멘션: 입력칸에 @ 를 치면 위로 팀원 목록(모두 포함)이 뜨고, 방향키·Enter 또는 클릭으로 고름
import { useId, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type Ref, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { CURRENT_USER_ID, memberById, members } from '@/shared/mocks'
import { TEAM_LABEL } from '@/shared/api/types'
import type { Comment } from '@/shared/api/types'
import { shortName } from '@/web/common/issueHelpers'
import commentArrow from '@/shared/assets/figma/arrow-right.svg'

interface CommentThreadProps {
  embedded?: boolean
  /** 제목 줄 (예: "#1 색 대비 · 코멘트 2", "코멘트 핀 · 코멘트 1", "새 코멘트 · 색 대비") */
  title: string
  /** 상태 줄에 보일 이슈 제목 */
  subtitle: string
  comments: Comment[]
  /** 새 핀을 꽂고 답글을 기다리는 중인지 */
  pendingPin: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onSubmit: (body: string) => void
  /** ✕ · Esc 로 닫기 */
  onClose: () => void
  /** 스레드 해결 여부 (store 에 저장된 값) */
  resolved: boolean
  /** 없으면 해결 버튼을 숨김 (아직 코멘트가 없는 새 핀) */
  onResolvedChange?: (resolved: boolean) => void
  /** 지금 페이지와 다른 이슈의 스레드면 그 이슈 상세 주소 (파란 번호로 연 경우) */
  detailTo?: string
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

export function CommentThread({ title, subtitle, comments, pendingPin, inputRef, onSubmit, onClose, resolved, onResolvedChange, detailTo, style, ref, embedded = false }: CommentThreadProps) {
  const [draft, setDraft] = useState('')
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const listId = useId()
  // 해결한 스레드는 접어서 보여주고, 새 핀을 꽂으면 펼쳐서 바로 입력할 수 있게 (코멘트를 남기면 다시 열림)
  const isClosed = resolved && !pendingPin
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
  }

  return (
    <section
      ref={ref}
      aria-labelledby={titleId}
      style={style}
      className={embedded ? 'inspection-comments' : 'absolute z-10 flex w-[280px] max-w-[calc(100%-16px)] flex-col gap-2.5 rounded-xl border border-ext-line bg-white px-3.5 py-3 font-noto shadow-[0_6px_18px_rgba(0,0,0,0.12)]'}
    >
      <div className="flex items-center text-xs leading-[1.5]">
        <h2 id={titleId} className="min-w-0 flex-1 truncate font-bold text-black">
          {title}
        </h2>
        {onResolvedChange && (
          <button
            type="button"
            aria-pressed={resolved}
            onClick={() => onResolvedChange(!resolved)}
            className="shrink-0 rounded px-1 font-medium text-[#175fc2] hover:underline"
          >
            {resolved ? '다시 열기' : '해결'}
            <span className="sr-only"> (이 위치의 코멘트를 {resolved ? '다시 열기' : '해결로 표시하기'})</span>
          </button>
        )}
        {!embedded && <button
          type="button"
          onClick={onClose}
          aria-label="코멘트 창 닫기"
          title="닫기 (Esc)"
          className="ml-1 flex size-6 items-center justify-center rounded-full text-muted hover:bg-web-chip hover:text-black"
        >
          <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>}
      </div>

      {/* 상태 줄: 해결됨 표시 · 이슈 제목 · (다른 이슈의 번호면) 그 이슈 상세로 가는 링크 */}
      {!embedded && (
        <div className="-mt-1 flex items-center gap-2 text-[11px] leading-[1.5]">
          {resolved && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 font-bold text-success">
              <span aria-hidden>✓</span>해결됨
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-muted">{subtitle}</span>
          {detailTo && (
            <Link to={detailTo} className="shrink-0 font-bold text-[#175fc2] hover:underline">
              상세 보기 →
            </Link>
          )}
        </div>
      )}

      {isClosed ? (
        <p className="text-xs leading-[1.5] text-muted">
          이 위치의 논의가 끝났어요. 코멘트 {comments.length}개는 ‘남은 코멘트’에서 빠졌어요. ‘다시 열기’를 누르면 코멘트를 보고 이어서 남길 수 있어요.
        </p>
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
              placeholder={embedded ? '코멘트 입력 · @로 팀원 멘션' : pendingPin ? '새 핀에 코멘트 남기기… @멘션' : '답글 남기기… @멘션'}
              className="min-w-0 flex-1 bg-transparent py-1 text-xs leading-[1.5] text-black outline-none placeholder:text-[#8a8a8a]"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="shrink-0 rounded-md bg-black px-2 py-1 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#c4c4c4]"
            >
              <span className={embedded ? 'sr-only' : ''}>등록</span>{embedded && <img src={commentArrow} alt="" width="20" height="20" />}
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
