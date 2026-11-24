// 피그마 "08 진행 · 완료 알리기" 의 모달 "다 했어요" — 결과물 · 바뀐 점 한 줄 · 확인 요청 여부.
//
// RequestProgressDialog  card(전달할 넘겨주기 카드) · open · onOpenChange · onDelivered({ note, askConfirm })
import { useId, useRef, useState, type FormEvent } from 'react'
import { DialogFooter, FIELD_INPUT, FIELD_LABEL, FOCUS_WITHIN, FieldError, RequestDialog, RequestStepper, ResultPreview, RouteChips } from './requestParts'
import type { HandoffCard } from '@/data/requestStore'
import { EXAMPLE, stepsAt } from './requestData'
import { resultFileOf } from './requestView'

export interface Delivery {
  note: string
  /** 요청한 사람에게 확인 요청도 같이 보낼지 */
  askConfirm: boolean
}

interface Props {
  card: HandoffCard
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelivered: (delivery: Delivery) => void
}

export function RequestProgressDialog({ card, open, onOpenChange, onDelivered }: Props) {
  const id = useId()
  // 피그마 예시 요청이면 예시 문구를 채워 둠
  const [note, setNote] = useState(card.title === EXAMPLE.title ? EXAMPLE.progressNote : '')
  const [askConfirm, setAskConfirm] = useState(true)
  const [error, setError] = useState<string>()
  const noteRef = useRef<HTMLInputElement>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!note.trim()) {
      setError('바뀐 점을 한 줄로 적어 주세요')
      noteRef.current?.focus()
      return
    }
    setError(undefined)
    onDelivered({ note: note.trim(), askConfirm })
  }

  return (
    <RequestDialog
      open={open}
      onOpenChange={onOpenChange}
      title="다 했어요"
      description={
        <>
          <span className="font-medium">{card.title}</span>
          {/* 보내는 쪽 → 받는 쪽 으로 전달 */}
          <RouteChips from={card.fromRole} to={card.toRole} />
        </>
      }
    >
      <form noValidate onSubmit={submit} className="flex flex-col items-start gap-5">
        <div className="flex w-full items-center rounded-2xl border border-line bg-fill px-[18px] py-3.5">
          {/* 전달 차례 */}
          <RequestStepper steps={stepsAt(3)} />
        </div>

        <div role="group" aria-labelledby={`${id}-result`} className="flex w-full flex-col items-start gap-2">
          <p id={`${id}-result`} className={FIELD_LABEL}>
            결과물
          </p>
          <ResultPreview file={resultFileOf(card, true)} />
        </div>

        <div className="flex w-full flex-col items-start gap-2">
          <label htmlFor={`${id}-note`} className={FIELD_LABEL}>
            바뀐 점 한 줄
          </label>
          <input
            ref={noteRef}
            id={`${id}-note`}
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-note-error` : undefined}
            placeholder="예: 보기 화면과 같은 구조"
            autoComplete="off"
            className={FIELD_INPUT}
          />
          <FieldError id={`${id}-note-error`}>{error}</FieldError>
        </div>

        <label className={`relative flex cursor-pointer items-center gap-2 rounded text-[13px] leading-normal font-medium text-ink ${FOCUS_WITHIN}`}>
          <input type="checkbox" checked={askConfirm} onChange={(e) => setAskConfirm(e.target.checked)} className="sr-only" />
          <span
            aria-hidden
            className={`flex size-4 shrink-0 items-center justify-center rounded-lg border text-[10px] leading-normal font-bold ${
              askConfirm ? 'border-[rgb(214_227_111/0.22)] bg-[rgb(214_227_111/0.13)] text-summit' : 'border-white/25 text-transparent'
            }`}
          >
            ✓
          </span>
          {card.requester}님에게 확인 요청 보내기
        </label>

        <DialogFooter submitLabel="전달하기" />
      </form>
    </RequestDialog>
  )
}
