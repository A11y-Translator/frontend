// 피그마 "09 확인 · 수정 요청" — 프론트 방 대화에 올라오는 "결과물을 전달했어요" 카드.
// (피그마에서 이 화면은 모달이 아니라 대화 안의 카드라서 카드로 만들었어요.)
//
// RequestReviewCard  card(처음 열었을 때의 카드) · steps · onConfirm() · onFix(text)
//   · "확인했어요" → onConfirm, "수정 요청" → 아래 입력칸을 열고 닫음, "보내기" → onFix
//   · 전달된 카드가 아니면(아직 전달 전 · 이미 확인) 버튼 대신 안내와 요청 상세 링크를 보여 줍니다.
import { useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FieldError, RequestStepper, ResultPreview, RoleAvatar } from './requestParts'
import { ROLE } from '@/data/mock'
import { statusText, type HandoffCard } from '@/data/requestStore'
import { EXAMPLE, requestPath, type Step } from './requestData'
import { resultFileOf } from './requestView'

interface Props {
  card: HandoffCard
  steps: Step[]
  onConfirm: () => void
  onFix: (text: string) => void
}

export function RequestReviewCard({ card, steps, onConfirm, onFix }: Props) {
  const id = useId()
  const sentRecords = card.history.filter((r) => r.kind === 'deliver' || r.kind === 'redeliver')
  const lastSent = sentRecords[sentRecords.length - 1]
  // "결과물 이름 · 바뀐 점" 에서 바뀐 점만
  const note = lastSent ? lastSent.text.split(' · ').slice(1).join(' · ') || lastSent.text : ''
  const makerRoom = ROLE[card.fromRole].label
  // 피그마처럼 수정 요청 입력칸이 열린 채로 시작 (예시 요청의 첫 전달이면 예시 문구도 채움)
  const [fixOpen, setFixOpen] = useState(true)
  const [text, setText] = useState(card.title === EXAMPLE.title && sentRecords.length === 1 ? EXAMPLE.fixText : '')
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) {
      setError('어디를 고치면 좋을지 적어 주세요')
      textRef.current?.focus()
      return
    }
    setError(undefined)
    setSent(true)
    onFix(text.trim())
  }

  return (
    <article aria-labelledby={`${id}-title`} className="flex w-full flex-col items-start gap-3.5 rounded-[20px] border border-line bg-fill px-4 py-[18px] @2xl:px-5">
      <div className="flex items-center gap-2.5">
        <RoleAvatar name={lastSent?.author ?? card.maker} role={card.fromRole} />
        <div className="flex min-w-0 flex-col items-start gap-0.5 leading-normal">
          <h2 id={`${id}-title`} className="text-sm font-semibold text-ink">
            {lastSent?.author ?? card.maker}님이 결과물을 전달했어요
          </h2>
          <p className="text-xs text-muted">
            {card.title} · {lastSent?.at ?? statusText(card)}
          </p>
        </div>
      </div>

      <div className="flex w-full items-center rounded-2xl border border-line bg-fill px-4 py-3">
        <RequestStepper steps={steps} />
      </div>

      <ResultPreview file={resultFileOf(card)} />

      {note && <p className="text-[13px] leading-normal text-ink">바뀐 점 · {note}</p>}

      {sent ? (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-normal font-medium text-due">
          수정 요청을 보냈어요 · {makerRoom} 방에도 올라갔어요
          <Link to={requestPath(card.id)} className="rounded text-muted underline underline-offset-2 hover:text-ink">
            요청 상세 보기
          </Link>
        </p>
      ) : card.status !== 'delivered' ? (
        // 받는 쪽이 확인할 수 있는 건 전달된 카드뿐 (기획안 §6-①)
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-normal font-medium text-muted">
          {card.status === 'confirmed' ? '이미 확인을 마친 요청이에요' : `아직 전달 전이에요 · ${statusText(card)}`}
          <Link to={requestPath(card.id)} className="rounded underline underline-offset-2 hover:text-ink">
            요청 상세 보기
          </Link>
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-[19.5px] bg-primary px-[22px] py-[11px] text-sm leading-normal font-semibold whitespace-nowrap text-on-primary transition hover:brightness-105 active:brightness-95"
            >
              확인했어요
            </button>
            <button
              type="button"
              onClick={() => setFixOpen((v) => !v)}
              aria-expanded={fixOpen}
              aria-controls={`${id}-fix`}
              className={`rounded-xl border px-[18px] py-[11px] text-sm leading-normal font-semibold whitespace-nowrap text-due transition ${
                fixOpen ? 'border-summit bg-fill-3' : 'border-line bg-fill hover:bg-fill-3'
              }`}
            >
              수정 요청
            </button>
          </div>

          {fixOpen && (
            <form id={`${id}-fix`} noValidate onSubmit={submit} className="flex w-full flex-col items-start gap-2 rounded-2xl border border-line bg-fill p-3">
              <textarea
                ref={textRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={1}
                required
                aria-label="수정 요청 내용"
                aria-invalid={error ? true : undefined}
                aria-describedby={`${error ? `${id}-fix-error ` : ''}${id}-fix-hint`}
                placeholder="어디를 어떻게 고치면 좋을지 적어 주세요"
                className="max-h-40 w-full resize-none rounded bg-transparent text-sm leading-normal font-medium text-ink [field-sizing:content] placeholder:font-normal placeholder:text-muted"
              />
              <FieldError id={`${id}-fix-error`}>{error}</FieldError>
              <div className="flex w-full flex-wrap items-center justify-between gap-2">
                <p id={`${id}-fix-hint`} className="text-xs leading-normal text-muted">
                  수정 요청은 {makerRoom} 방에도 같이 올라가요
                </p>
                <button
                  type="submit"
                  className="ml-auto shrink-0 rounded-[15px] border border-line bg-fill-2 px-3.5 py-[7px] text-[13px] leading-normal font-semibold whitespace-nowrap text-ink transition hover:bg-fill-3"
                >
                  보내기
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </article>
  )
}
