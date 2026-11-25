// 피그마 "06 요청 보내기" 의 모달 — 누구에게 · 무엇이 필요해요 · 언제까지 · 설명 · 참고 링크.
//
// RequestSendDialog  open · onOpenChange · from: RoleId(요청을 여는 방) · onSent(request)
//   · from 을 뺀 나머지 역할이 "누구에게" 후보가 됩니다. 프론트 방에서는 피그마의 예시 값이 채워져 있어요.
//   · mode="handoff" + preset: 대화의 링크에서 연 "넘겨주기" (기획안 §7-3) — 항목 이름과 링크가 채워져 있고, 받는 역할과 날짜만 고르면 돼요.
import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ROLE, type RoleId } from '@/data/mock'
import dotBack from '@/assets/dot-back.svg'
import dotDesign from '@/assets/dot-design.svg'
import dotFront from '@/assets/dot-front.svg'
import { DialogFooter, FIELD_INPUT, FIELD_LABEL, FOCUS_WITHIN, FieldError, RequestDialog } from './requestParts'
import { SEND, linkLabel, type DueMode } from './requestData'

export interface SentRequest {
  to: RoleId
  need: string
  due: string
  desc: string
  links: string[]
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  from: RoleId
  onSent: (request: SentRequest) => void
  mode?: 'request' | 'handoff'
  preset?: { need: string; links: string[] }
  /** 닫힌 뒤 포커스를 직접 옮기고 싶을 때 */
  onCloseAutoFocus?: (event: Event) => void
}

// 모드별 글자 (요청하기는 피그마 그대로)
const COPY = {
  request: { title: SEND.title, sub: SEND.sub, need: '무엇이 필요해요', needError: '무엇이 필요한지 적어 주세요', dueError: '언제까지 필요한지 골라 주세요', submit: '요청 보내기' },
  handoff: { title: '넘겨주기', sub: '받는 역할과 날짜를 정하면 흐름에 바로 올라가요.', need: '항목 이름', needError: '넘겨줄 항목 이름을 적어 주세요', dueError: '언제까지 확인하면 되는지 골라 주세요', submit: '넘겨주기' },
}

const DOT: Record<RoleId, string> = { design: dotDesign, front: dotFront, back: dotBack }
const ROLE_IDS = Object.keys(ROLE) as RoleId[]
// "11/21" 처럼 날짜가 들어 있는지만 확인
const HAS_DATE = /\d{1,2}\s*\/\s*\d{1,2}/

export function RequestSendDialog({ open, onOpenChange, from, onSent, mode = 'request', preset, onCloseAutoFocus }: Props) {
  const id = useId()
  const copy = COPY[mode]
  const targets = ROLE_IDS.filter((r) => r !== from)
  // 넘겨주기: 링크 이름 · 링크 · 오늘까지가 채워진 채로 시작
  const filled =
    mode === 'handoff'
      ? { need: preset?.need ?? '', dueMode: 'today' as DueMode, due: SEND.dueOptions[0].text, desc: '', links: preset?.links ?? [] }
      : from === 'front'
        ? SEND.filled
        : null

  const [to, setTo] = useState<RoleId>(targets[0])
  const [need, setNeed] = useState(filled?.need ?? '')
  const [dueMode, setDueMode] = useState<DueMode>(filled?.dueMode ?? 'custom')
  const [due, setDue] = useState(filled?.due ?? '')
  const [desc, setDesc] = useState(filled?.desc ?? '')
  const [links, setLinks] = useState<string[]>(filled?.links ?? [])
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkDraft, setLinkDraft] = useState('')
  const [errors, setErrors] = useState<{ need?: string; due?: string; link?: string }>({})

  const needRef = useRef<HTMLInputElement>(null)
  const dueRef = useRef<HTMLInputElement>(null)
  const linkRef = useRef<HTMLInputElement>(null)
  const addRef = useRef<HTMLButtonElement>(null)

  // 오늘 · 내일 → 날짜를 채움, 직접 입력 → 입력칸으로 이동
  const pickDue = (mode: DueMode) => {
    setDueMode(mode)
    const option = SEND.dueOptions.find((o) => o.value === mode)
    if (option?.text) {
      setDue(option.text)
      setErrors((e) => ({ ...e, due: undefined }))
    } else {
      dueRef.current?.focus()
    }
  }

  const addLink = () => {
    const url = linkDraft.trim()
    if (!/^https?:\/\/\S+\.\S+/i.test(url)) {
      setErrors((e) => ({ ...e, link: 'https:// 로 시작하는 주소를 붙여 주세요' }))
      linkRef.current?.focus()
      return
    }
    setLinks((prev) => [...prev, linkLabel(url)])
    setLinkDraft('')
    setLinkOpen(false)
    setErrors((e) => ({ ...e, link: undefined }))
    addRef.current?.focus()
  }

  // 링크 입력칸의 Enter 는 요청 보내기가 아니라 "추가"
  const onLinkKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addLink()
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!need.trim()) next.need = copy.needError
    if (!due.trim()) next.due = copy.dueError
    else if (!HAS_DATE.test(due)) next.due = '날짜를 11/21 18:00 처럼 적어 주세요'
    setErrors(next)
    if (next.need) return needRef.current?.focus()
    if (next.due) return dueRef.current?.focus()
    onSent({ to, need: need.trim(), due: due.trim(), desc: desc.trim(), links })
  }

  return (
    <RequestDialog open={open} onOpenChange={onOpenChange} title={copy.title} description={copy.sub} onCloseAutoFocus={onCloseAutoFocus}>
      <form noValidate onSubmit={submit} className="flex flex-col items-start gap-5">
        <fieldset className="min-w-0">
          <legend className={`${FIELD_LABEL} mb-2 p-0`}>누구에게</legend>
          <div className="flex flex-wrap items-center gap-2">
            {targets.map((role) => {
              const on = role === to
              return (
                <label
                  key={role}
                  className={`relative flex cursor-pointer items-center gap-1.5 border px-3.5 py-2 text-sm leading-normal whitespace-nowrap ${FOCUS_WITHIN} ${
                    on ? 'rounded-xl font-semibold' : 'rounded-[18px] border-line font-medium text-ink hover:bg-fill'
                  }`}
                  style={on ? { background: ROLE[role].bg, borderColor: ROLE[role].color, color: ROLE[role].color } : undefined}
                >
                  <input type="radio" name={`${id}-to`} value={role} checked={on} onChange={() => setTo(role)} className="sr-only" />
                  <img src={DOT[role]} alt="" className="size-2" />
                  {ROLE[role].label}
                </label>
              )
            })}
          </div>
        </fieldset>

        <div className="flex w-full flex-col items-start gap-2">
          <label htmlFor={`${id}-need`} className={FIELD_LABEL}>
            {copy.need}
          </label>
          <input
            ref={needRef}
            id={`${id}-need`}
            type="text"
            value={need}
            onChange={(e) => setNeed(e.target.value)}
            required
            aria-invalid={errors.need ? true : undefined}
            aria-describedby={errors.need ? `${id}-need-error` : undefined}
            placeholder="예: 회원 정보 수정 화면 시안"
            autoComplete="off"
            className={FIELD_INPUT}
          />
          <FieldError id={`${id}-need-error`}>{errors.need}</FieldError>
        </div>

        <div className="flex w-full flex-col items-start gap-2">
          <label htmlFor={`${id}-due`} className={FIELD_LABEL}>
            언제까지
          </label>
          <div className="flex max-w-full flex-wrap items-center gap-2">
            <input
              ref={dueRef}
              id={`${id}-due`}
              type="text"
              value={due}
              // 직접 고치면 "직접 입력" 으로 바뀜
              onChange={(e) => {
                setDue(e.target.value)
                setDueMode('custom')
              }}
              required
              aria-invalid={errors.due ? true : undefined}
              aria-describedby={errors.due ? `${id}-due-error` : undefined}
              placeholder="11/21 (금) 18:00"
              autoComplete="off"
              className={`${FIELD_INPUT} w-[156px]!`}
            />
            <div role="radiogroup" aria-label="마감 빠르게 고르기" className="flex flex-wrap items-center gap-2">
              {SEND.dueOptions.map((o) => {
                const on = o.value === dueMode
                return (
                  <label
                    key={o.value}
                    className={`relative cursor-pointer rounded-2xl px-3 py-2 text-[13px] leading-normal whitespace-nowrap ${FOCUS_WITHIN} ${
                      on ? 'bg-primary font-semibold text-on-primary' : 'bg-fill-2 font-medium text-ink hover:bg-fill-3'
                    }`}
                  >
                    <input type="radio" name={`${id}-due-mode`} value={o.value} checked={on} onChange={() => pickDue(o.value)} className="sr-only" />
                    {o.label}
                  </label>
                )
              })}
            </div>
          </div>
          <FieldError id={`${id}-due-error`}>{errors.due}</FieldError>
        </div>

        <div className="flex w-full flex-col items-start gap-2">
          <label htmlFor={`${id}-desc`} className={FIELD_LABEL}>
            설명 (선택)
          </label>
          <textarea
            id={`${id}-desc`}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={1}
            placeholder="참고할 내용을 적어 주세요"
            className={`${FIELD_INPUT} max-h-32 min-h-[46px] resize-none [field-sizing:content]`}
          />
        </div>

        <div role="group" aria-labelledby={`${id}-links`} className="flex w-full flex-col items-start gap-2">
          <p id={`${id}-links`} className={FIELD_LABEL}>
            참고 링크
          </p>
          <ul className="flex flex-wrap items-center gap-2">
            {links.map((label, i) => (
              <li key={`${label}-${i}`} className="flex items-center gap-1 rounded-[14px] border border-line bg-fill-3 py-1 pr-1 pl-2.5">
                <span className="font-mono text-[11px] leading-normal font-medium whitespace-pre text-ink">{label}</span>
                {/* 피그마 칩에는 없는 작은 ✕ — 붙인 링크를 뺄 수 있게 추가 */}
                <button
                  type="button"
                  onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`${label.replace(/\s+/g, ' ')} 링크 빼기`}
                  className="flex size-[22px] items-center justify-center rounded-full text-[10px] text-muted hover:bg-fill-3 hover:text-ink"
                >
                  <span aria-hidden>✕</span>
                </button>
              </li>
            ))}
            <li>
              <button
                ref={addRef}
                type="button"
                onClick={() => setLinkOpen((v) => !v)}
                aria-expanded={linkOpen}
                aria-controls={`${id}-link-form`}
                className="rounded-[14px] border border-line bg-fill-3 px-2.5 py-1.5 text-xs leading-normal font-medium whitespace-nowrap text-muted hover:text-ink"
              >
                + 링크
              </button>
            </li>
          </ul>
          {linkOpen && (
            <div id={`${id}-link-form`} className="flex w-full flex-col items-start gap-2">
              <div className="flex w-full items-center gap-2">
                <input
                  ref={linkRef}
                  type="url"
                  inputMode="url"
                  value={linkDraft}
                  onChange={(e) => setLinkDraft(e.target.value)}
                  onKeyDown={onLinkKey}
                  // eslint-disable-next-line jsx-a11y/no-autofocus -- 사용자가 방금 연 입력칸으로 포커스를 옮겨요
                  autoFocus
                  aria-label="참고 링크 주소"
                  aria-invalid={errors.link ? true : undefined}
                  aria-describedby={errors.link ? `${id}-link-error` : undefined}
                  placeholder="https://github.com/…/pull/25"
                  autoComplete="off"
                  className={`${FIELD_INPUT} min-w-0 flex-1 py-2.5!`}
                />
                <button
                  type="button"
                  onClick={addLink}
                  className="shrink-0 rounded-[15px] border border-line bg-fill-2 px-3.5 py-[7px] text-[13px] leading-normal font-semibold whitespace-nowrap text-ink hover:bg-fill-3"
                >
                  추가
                </button>
              </div>
              <FieldError id={`${id}-link-error`}>{errors.link}</FieldError>
            </div>
          )}
        </div>

        <DialogFooter submitLabel={copy.submit} />
      </form>
    </RequestDialog>
  )
}
