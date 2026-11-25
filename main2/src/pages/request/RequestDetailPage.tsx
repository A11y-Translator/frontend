// 피그마 "10 요청 상세 · 전체 흐름 · 내추럴" — 제목 → 진행 단계 → 왼쪽 "주고받은 기록" + 오른쪽 "요약" (/requests/:id).
// 내용은 넘겨주기 카드 저장소(@/data/requestStore)에서 오고, 요약 아래 버튼으로 다음 단계로 넘깁니다.
import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import thumbSummary from '@/assets/request/thumb-result-summary.svg'
import { ROLE } from '@/data/mock'
import { usePlan } from '@/data/planStore'
import {
  acceptProposedDate,
  acceptRequest,
  addComment,
  blockedDays,
  clearBlocked,
  dueShort,
  proposeDate,
  resetRequests,
  setBlocked,
  statusText,
  useRequest,
  type HandoffCard,
} from '@/data/requestStore'
import { getAuthor } from '@/data/sessionStore'
import { Composer, ROOM_PANEL } from '@/pages/rooms/RoomShell'
import { useToast } from '@/ui/toast'
import { FIELD_INPUT, RequestStepper, RoleAvatar, RouteChips } from './requestParts'
import { requestPath, type RecordTone } from './requestData'
import { recordsOf, stepsOf, summaryOf } from './requestView'

// 기록 종류 칩의 색 (요청 · 질문 / 수락 / 전달 · 다시 전달 / 수정 요청 / 확인 / 막힘)
const TONE: Record<RecordTone, string> = {
  plain: 'bg-fill-2 text-ink',
  accept: 'bg-role-front-bg text-checkpoint-text',
  deliver: 'bg-fill-3 text-ink',
  fix: 'bg-fill-3 text-due',
  confirm: 'bg-role-back-bg text-ink',
  blocked: 'bg-danger/10 text-blocked',
}

const STEP_LINK =
  'inline-flex items-center justify-center rounded-full border border-line px-3.5 py-2 text-[13px] leading-normal font-semibold whitespace-nowrap text-ink transition hover:bg-fill-2'

const PAGE = 'flex w-full shrink-0 flex-col px-(--gutter) pt-(--page-top) pb-6 @4xl:min-h-[620px] @4xl:flex-[1_1_0%]'
const BACK = '-my-1 -ml-2 flex size-9 items-center justify-center rounded-lg text-[22px] leading-none font-medium tracking-[-0.02em] text-muted hover:bg-fill-2 hover:text-ink'

/** 제목 옆 상태 칩의 색 (확인 완료는 피그마 그대로) */
function statusTone(card: HandoffCard): RecordTone {
  if (card.blocked && card.status !== 'confirmed') return 'blocked'
  return card.status === 'requested' ? 'plain' : card.status === 'accepted' ? 'accept' : card.status === 'delivered' ? 'deliver' : 'confirm'
}

export function RequestDetailPage() {
  const { id } = useParams()
  const card = useRequest(id)
  const plan = usePlan()

  if (!card) return <RequestNotFound />

  // 돌아갈 곳: 요청으로 시작했으면 요청한(받는) 방, 넘겨주기로 시작했으면 보낸 방
  const back = ROLE[card.origin === 'request' ? card.toRole : card.fromRole]
  const records = recordsOf(card)
  const summary = summaryOf(card)
  const checkpoint = plan.checkpoints[card.checkpoint - 1]?.name

  return (
    // 넓으면(@4xl↑) 화면 높이에 맞추고 두 패널만 안에서 스크롤, 좁으면 한 줄로 쌓여 페이지가 스크롤
    <div className={PAGE}>
      <header className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <Link to={back.path} aria-label={`${back.label} 방으로 돌아가기`} className={BACK}>
          <span aria-hidden>‹</span>
        </Link>
        <h1 className="-ml-2 text-xl leading-normal font-bold text-ink">{card.title}</h1>
        {/* 기획안 §7-5: 보내는 역할 → 받는 역할 (방의 흐름 · 메인보드와 같은 방향) */}
        <RouteChips from={card.fromRole} to={card.toRole} />
        <p className={`rounded-[10px] px-2 py-[3px] text-xs leading-normal font-semibold whitespace-nowrap ${TONE[statusTone(card)]}`}>
          <span className="sr-only">상태: </span>
          {statusText(card)}
        </p>
      </header>

      <div className="mt-5 flex w-full justify-center rounded-2xl border border-line bg-fill px-3 py-5 @2xl:px-7">
        <RequestStepper steps={stepsOf(card, true)} size="lg" align="center" />
      </div>

      <div className="mt-[clamp(16px,3.3vh,30px)] grid min-h-0 flex-1 gap-4 @4xl:grid-cols-[minmax(0,724fr)_minmax(0,420fr)] @4xl:grid-rows-[minmax(0,1fr)]">
        <section aria-labelledby="request-records" className={`${ROOM_PANEL} flex min-h-0 min-w-0 flex-col overflow-y-auto px-4 py-6 @2xl:px-7`}>
          <h2 id="request-records" className="text-base leading-normal font-bold text-ink">
            주고받은 기록
          </h2>
          <ol className="mt-3.5 flex flex-col">
            {records.map((r, i) => (
              <li key={r.id} className="flex items-stretch gap-3.5">
                <div className="flex shrink-0 flex-col items-center">
                  <RoleAvatar name={r.author} role={r.role} />
                  {/* 다음 기록으로 이어지는 선 (마지막 기록에는 없음) */}
                  {i < records.length - 1 && <span aria-hidden className="min-h-10 w-[1.5px] flex-1 rounded-xl bg-fill-2" />}
                </div>
                <div className="flex min-w-0 flex-col items-start gap-1 pt-1 pb-3.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 leading-normal">
                    <span className={`rounded-[8.5px] px-[7px] py-0.5 text-[11px] font-semibold whitespace-nowrap ${TONE[r.tone]}`}>{r.chip}</span>
                    <span className="text-[13px] font-semibold text-ink">{r.author}</span>
                    <span className="font-mono text-[11px] font-medium whitespace-nowrap text-muted">{r.at}</span>
                  </div>
                  <p className="max-w-full text-sm leading-normal break-words whitespace-pre-wrap text-ink">{r.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <RecordComposer key={card.id} cardId={card.id} />
        </section>

        <section aria-labelledby="request-summary" className={`${ROOM_PANEL} flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto p-6`}>
          <h2 id="request-summary" className="text-base leading-normal font-bold text-ink">
            요약
          </h2>
          <dl className="flex flex-col gap-4 leading-normal">
            <div className="flex flex-col">
              <dt className="text-xs text-muted">{card.status === 'confirmed' ? '최종 결과물' : '결과물'}</dt>
              <dd className={`mt-1 text-[15px] font-semibold ${summary.result ? 'text-ink' : 'text-muted'}`}>{summary.result ?? '아직 전달 전이에요'}</dd>
              {summary.result && (
                <dd aria-hidden className="mt-4 flex h-[150px] w-full justify-center overflow-clip rounded-[20px] border border-line bg-fill pt-[9px]">
                  <img src={thumbSummary} alt="" className="h-[130px] w-[78px] max-w-none" />
                </dd>
              )}
            </div>
            {summary.rest.map((row) => (
              <div key={row.label} className="flex flex-col gap-1">
                <dt className="text-xs text-muted">{row.label}</dt>
                <dd className={`text-[15px] font-semibold ${row.good ? 'text-ink' : 'text-ink'}`}>{row.value}</dd>
              </div>
            ))}
            {/* 기획안 §4 · §7-5: 소속 구간(시퀀스) · 링크 · 막힘 — 피그마 10번 화면에는 없는 줄 */}
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted">구간</dt>
              <dd className="text-[15px] font-semibold text-ink">{checkpoint ? `${card.checkpoint} · ${checkpoint}` : `체크포인트 ${card.checkpoint}`}</dd>
            </div>
            {card.blocked && card.status !== 'confirmed' && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs text-muted">막힘</dt>
                <dd className="text-[15px] font-semibold text-blocked">
                  {blockedDays(card)}일째{card.blocked.reason ? ` · ${card.blocked.reason}` : ''}
                </dd>
              </div>
            )}
            {card.description && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs text-muted">설명</dt>
                <dd className="text-sm font-medium break-words whitespace-pre-wrap text-ink">{card.description}</dd>
              </div>
            )}
            {card.links.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <dt className="text-xs text-muted">링크</dt>
                <dd className="flex flex-wrap items-center gap-2">
                  {card.links.map((label, i) => (
                    <span key={`${label}-${i}`} className="rounded-[14px] border border-line bg-fill-3 px-2.5 py-1.5 font-mono text-[11px] leading-normal font-medium whitespace-pre text-ink">
                      {label}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>

          <RequestActions key={card.id} card={card} />
        </section>
      </div>
    </div>
  )
}

/* ───────── 코멘트 · 질문 남기기 ───────── */

const NOTE_KINDS = [
  { value: 'comment', label: '코멘트', sent: '코멘트를 남겼어요' },
  { value: 'question', label: '질문', sent: '질문을 남겼어요' },
] as const
type NoteKind = (typeof NOTE_KINDS)[number]['value']

/**
 * 기획안 §7-5: 카드에서 바로 코멘트 · 질문을 남김 (피그마 10번 화면에는 없는 칸 — 방 대화의 입력칸 모양을 그대로 씀).
 * 상태는 바뀌지 않고 "주고받은 기록"에 누가 · 언제 · 무엇을 한 줄로 남아요. Enter 로 보내기.
 */
function RecordComposer({ cardId }: { cardId: string }) {
  const toast = useToast()
  const [kind, setKind] = useState<NoteKind>('comment')
  const current = NOTE_KINDS.find((k) => k.value === kind) ?? NOTE_KINDS[0]

  // 종류 칩 — 보이는 칩 위에 투명한 select 를 겹침 (전체 방의 "보낼 곳" 칩과 같은 방식)
  const kindChip = (
    <span className="relative flex shrink-0 items-center rounded-[11px] bg-fill-2 px-2 py-1 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-summit hover:bg-fill-3">
      <span aria-hidden className="text-xs leading-normal font-semibold whitespace-nowrap text-ink">
        {current.label} ▾
      </span>
      <select aria-label="남길 종류" value={kind} onChange={(e) => setKind(e.target.value as NoteKind)} className="absolute inset-0 size-full cursor-pointer opacity-0">
        {NOTE_KINDS.map((k) => (
          <option key={k.value} value={k.value}>
            {k.label}
          </option>
        ))}
      </select>
    </span>
  )

  return (
    <div className="mt-auto pt-3">
      <Composer
        label={`${current.label} 입력`}
        placeholder={kind === 'question' ? '궁금한 점을 물어보세요' : '코멘트를 남겨 보세요'}
        leading={kindChip}
        onSend={(text) => {
          if (addComment(cardId, kind, text, getAuthor())) toast(`${current.sent}: ${text.trim()}`)
        }}
      />
    </div>
  )
}

/* ───────── 지금 할 수 있는 일 ───────── */

/**
 * 카드의 지금 상태에서 할 수 있는 일만, 누가 하는지에 따라 묶어 보여 줍니다.
 *   요청됨  보내는 쪽: 이 날짜로 수락 · 다른 날짜 제안 → 받는 쪽: 제안한 날짜 수락   (기획안 §4 데드라인 조율)
 *   진행    보내는 쪽: 완료 알리기(08) · 받는 쪽: 막힘 표시 / 해제                    (기획안 §7-5 · §8-5)
 *   전달됨  받는 쪽: 확인 · 수정 요청(09)                                              (기획안 §6-① 받는 쪽이 확인해야 완료)
 */
function RequestActions({ card }: { card: HandoffCard }) {
  const id = useId()
  const toast = useToast()
  const box = useRef<HTMLElement>(null)
  const [form, setForm] = useState<'propose' | 'block' | null>(null)
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  // 버튼이 눌린 뒤 사라져도 포커스가 이 묶음 안에 남도록
  const done = (message: string) => {
    toast(message)
    setForm(null)
    setValue('')
    setError(false)
    box.current?.focus()
  }

  const open = (next: 'propose' | 'block') => {
    setForm((cur) => (cur === next ? null : next))
    setValue('')
    setError(false)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = value.trim()
    if (form === 'propose') {
      // 날짜가 들어 있는지만 확인 (요청 보내기와 같은 규칙)
      if (!/\d{1,2}\s*\/\s*\d{1,2}/.test(text)) return setError(true)
      proposeDate(card.id, text)
      done(`${dueShort(text)}로 날짜를 제안했어요`)
    } else {
      setBlocked(card.id, text)
      done('막힘으로 표시했어요 · 메인보드 맨 위에 올라가요')
    }
  }

  const from = `보내는 쪽 · ${ROLE[card.fromRole].label} ${card.maker}`
  const to = `받는 쪽 · ${ROLE[card.toRole].label} ${card.requester}`
  const WAIT = 'text-[13px] leading-normal font-medium text-ink'

  return (
    <section ref={box} tabIndex={-1} aria-labelledby={`${id}-title`} className="mt-auto flex flex-col items-start gap-3 rounded-lg pt-2 outline-none">
      <h3 id={`${id}-title`} className="text-xs leading-normal font-normal text-muted">
        지금 할 수 있는 일
      </h3>

      {card.status === 'requested' && (
        <>
          <ActionGroup label={from}>
            <button
              type="button"
              onClick={() => {
                acceptRequest(card.id)
                done(`${dueShort(card.due)}까지 하기로 했어요`)
              }}
              className={STEP_LINK}
            >
              이 날짜로 수락
            </button>
            <button type="button" onClick={() => open('propose')} aria-expanded={form === 'propose'} aria-controls={`${id}-form`} className={STEP_LINK}>
              다른 날짜 제안
            </button>
          </ActionGroup>
          {card.proposedDue && (
            <ActionGroup label={to}>
              <button
                type="button"
                onClick={() => {
                  const date = dueShort(card.proposedDue ?? '')
                  acceptProposedDate(card.id)
                  done(`${date}까지로 정했어요`)
                }}
                className={STEP_LINK}
              >
                제안한 날짜 수락 ({dueShort(card.proposedDue)})
              </button>
            </ActionGroup>
          )}
        </>
      )}

      {card.status === 'accepted' && (
        <>
          <ActionGroup label={from}>
            <Link to={`${requestPath(card.id)}/progress`} className={STEP_LINK}>
              완료 알리기
            </Link>
          </ActionGroup>
          <ActionGroup label={to}>
            {card.blocked ? (
              <button
                type="button"
                onClick={() => {
                  clearBlocked(card.id)
                  done('막힘을 풀었어요')
                }}
                className={STEP_LINK}
              >
                막힘 해제
              </button>
            ) : (
              <button type="button" onClick={() => open('block')} aria-expanded={form === 'block'} aria-controls={`${id}-form`} className={STEP_LINK}>
                막힘 표시
              </button>
            )}
          </ActionGroup>
        </>
      )}

      {card.status === 'delivered' && (
        <>
          <ActionGroup label={from}>
            <p className={WAIT}>전달했어요 · 받는 쪽 확인을 기다리는 중</p>
          </ActionGroup>
          <ActionGroup label={to}>
            <Link to={`${requestPath(card.id)}/review`} className={STEP_LINK}>
              확인 · 수정 요청
            </Link>
            {card.reviewPath && (
              <Link to={card.reviewPath} className={STEP_LINK}>
                버전 비교에서 검토
              </Link>
            )}
          </ActionGroup>
        </>
      )}

      {card.status === 'confirmed' && <p className={WAIT}>받는 쪽 확인까지 끝난 요청이에요</p>}

      {form && (
        <form id={`${id}-form`} noValidate onSubmit={submit} className="flex w-full flex-col items-start gap-2">
          <div className="flex w-full items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              // eslint-disable-next-line jsx-a11y/no-autofocus -- 사용자가 방금 연 입력칸으로 포커스를 옮겨요
              autoFocus
              aria-label={form === 'propose' ? '제안할 날짜' : '막힌 이유 (선택)'}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              placeholder={form === 'propose' ? '11/22 (토) 18:00' : '막힌 이유 (선택) · 예: API 대기'}
              autoComplete="off"
              className={`${FIELD_INPUT} min-w-0 flex-1 py-2.5!`}
            />
            <button
              type="submit"
              className="shrink-0 rounded-[15px] border border-line bg-fill-2 px-3.5 py-[7px] text-[13px] leading-normal font-semibold whitespace-nowrap text-ink hover:bg-fill-3"
            >
              {form === 'propose' ? '제안 보내기' : '막힘 표시'}
            </button>
          </div>
          {error && (
            <p id={`${id}-error`} role="alert" className="text-xs leading-normal font-medium text-blocked">
              날짜를 11/22 18:00 처럼 적어 주세요
            </p>
          )}
        </form>
      )}

      {card.status !== 'confirmed' && <p className="text-[11px] leading-normal text-muted">데모라 두 역할의 버튼을 모두 눌러 볼 수 있어요</p>}
      <ResetButton />
    </section>
  )
}

function ActionGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col items-start gap-1.5">
      <p aria-hidden className="text-xs leading-normal font-semibold text-ink">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

/** 예시 데이터로 되돌리기 (저장소 초기화) */
function ResetButton() {
  const toast = useToast()
  return (
    <button
      type="button"
      onClick={() => {
        resetRequests()
        toast('예시 데이터로 되돌렸어요')
      }}
      className="rounded text-[11px] leading-normal text-muted underline underline-offset-2 hover:text-ink"
    >
      예시 데이터로 되돌리기
    </button>
  )
}

/* ───────── 없는 요청 ───────── */

function RequestNotFound() {
  return (
    <div className={PAGE}>
      <header className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <Link to="/rooms/all" aria-label="전체 원정대 방으로 돌아가기" className={BACK}>
          <span aria-hidden>‹</span>
        </Link>
        <h1 className="-ml-2 text-xl leading-normal font-bold text-ink">요청을 찾을 수 없어요</h1>
      </header>
      <section aria-label="안내" className={`${ROOM_PANEL} mt-5 flex flex-col items-start gap-3 p-6`}>
        <p className="text-sm leading-normal text-ink">주소가 바뀌었거나, 예시 데이터로 되돌리면서 지워진 요청일 수 있어요.</p>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/board" className={STEP_LINK}>
            메인보드로
          </Link>
          <Link to="/rooms/all" className={STEP_LINK}>
            전체 원정대 방으로
          </Link>
        </div>
        <ResetButton />
      </section>
    </div>
  )
}
