// Figma: project/issue-detail "Comment thread" (554:12327)
// 작성자 아바타 · 이름/역할 · @멘션 강조 · 답글 입력(→ actions.addComment)
import { useId, useState, type CSSProperties, type FormEvent, type RefObject } from 'react'
import { memberById } from '@/shared/mocks'
import type { Comment, Issue } from '@/shared/api/types'
import { shortName } from '@/web/common/issueHelpers'

interface CommentThreadProps {
  issue: Issue
  comments: Comment[]
  /** 새 핀을 꽂고 답글을 기다리는 중인지 */
  pendingPin: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onSubmit: (body: string) => void
  style?: CSSProperties
}

export function CommentThread({ issue, comments, pendingPin, inputRef, onSubmit, style }: CommentThreadProps) {
  const [draft, setDraft] = useState('')
  const [closed, setClosed] = useState(false)
  // 새 핀을 꽂으면 접힌 스레드도 펼쳐서 바로 입력할 수 있게
  const isClosed = closed && !pendingPin
  const inputId = useId()
  const titleId = useId()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    onSubmit(body)
    setDraft('')
    setClosed(false)
  }

  return (
    <section
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
          <form onSubmit={submit} className="flex items-center gap-1.5 rounded-lg bg-[#f5f5f5] py-1 pr-1 pl-2.5">
            <label htmlFor={inputId} className="sr-only">
              {pendingPin ? '새 핀에 코멘트 남기기' : '답글 남기기'} (@이름으로 멘션)
            </label>
            <input
              ref={inputRef}
              id={inputId}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
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
