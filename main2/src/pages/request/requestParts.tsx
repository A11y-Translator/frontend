// 요청 흐름(06 · 08 · 09 · 10)이 같이 쓰는 부품.
//
// RequestDialog   open · onOpenChange · title · description(ReactNode) · children · onCloseAutoFocus?   (유리 모달 틀 · 520px)
// DialogFooter    cancelLabel? · submitLabel                                          (취소 / 연두 주 버튼)
// RouteChips      from · to: RoleId                                                    (프론트 → 디자인)
// RoleAvatar      name · role · size?                                                  (이름 첫 글자)
// RequestStepper  steps: Step[] · size?: 'sm'|'lg' · align?: 'start'|'center'          (요청 — 수락 — 진행 — 전달 — 확인)
// ResultPreview   file: { source, title, note, version }                               (전달된 Figma 미리보기)
// FIELD_LABEL · FIELD_INPUT · FieldError                                               (입력칸 모양 · 오류 문구)
import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { ROLE, type RoleId } from '@/data/mock'
import { SourceChip } from '@/pages/rooms/RoomAttachments'
import stepCurrent from '@/assets/request/step-current.svg'
import stepDoneLg from '@/assets/request/step-done-lg.svg'
import stepDone from '@/assets/request/step-done.svg'
import stepTodo from '@/assets/request/step-todo.svg'
import thumbResult from '@/assets/request/thumb-result.svg'
import type { Step, StepState } from './requestData'

/* ───────── 모달 틀 ───────── */

export function RequestDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onCloseAutoFocus,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  children: ReactNode
  /** 닫힌 뒤 포커스를 직접 옮기고 싶을 때 (기본: 열기 전 자리로) */
  onCloseAutoFocus?: (event: Event) => void
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgb(3_9_6/0.64)]" />
        {/* 화면이 낮으면 모달 안에서 스크롤 */}
        <Dialog.Content onCloseAutoFocus={onCloseAutoFocus} className="glass-edge fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 overflow-y-auto rounded-3xl border border-line-soft bg-glass px-5 pt-7 pb-6 backdrop-blur-[14px] outline-none sm:px-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col items-start gap-1">
              <Dialog.Title className="text-xl leading-normal font-bold text-ink">{title}</Dialog.Title>
              <Dialog.Description asChild>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-normal text-muted">{description}</div>
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="닫기"
              className="-m-2 flex size-9 shrink-0 items-center justify-center rounded-lg text-base leading-normal font-medium text-muted hover:bg-fill-2 hover:text-ink"
            >
              <span aria-hidden>✕</span>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** 모달 아래 버튼 줄: 취소(닫기) + 주 버튼(submit) */
export function DialogFooter({ cancelLabel = '취소', submitLabel }: { cancelLabel?: string; submitLabel: string }) {
  return (
    <div className="flex w-full flex-wrap items-center justify-end gap-2">
      <Dialog.Close className="rounded-xl border border-line bg-fill px-5 py-3 text-[15px] leading-normal font-medium whitespace-nowrap text-ink transition hover:bg-fill-3">
        {cancelLabel}
      </Dialog.Close>
      <button
        type="submit"
        className="rounded-[21px] bg-summit px-6 py-3 text-[15px] leading-normal font-semibold whitespace-nowrap text-on-summit transition hover:brightness-105 active:brightness-95"
      >
        {submitLabel}
      </button>
    </div>
  )
}

/* ───────── 입력칸 ───────── */

export const FIELD_LABEL = 'text-[13px] leading-normal font-semibold text-ink'
export const FIELD_INPUT =
  'w-full rounded-[10px] border border-line bg-transparent px-3.5 py-3 text-sm leading-normal font-medium text-ink placeholder:font-normal placeholder:text-muted focus-visible:border-white/25 aria-invalid:border-blocked'
/** 안 보이는 radio/checkbox 를 감싼 label 에 포커스 테두리 표시 */
export const FOCUS_WITHIN = 'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-summit'

/** 입력 오류 문구 (입력칸의 aria-describedby 로 연결) */
export function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className="text-xs leading-normal font-medium text-blocked">
      {children}
    </p>
  )
}

/* ───────── 역할 칩 · 아바타 ───────── */

function RoleBadge({ role }: { role: RoleId }) {
  return (
    <span className="rounded-[8.5px] px-[7px] py-0.5 text-[11px] leading-normal font-semibold whitespace-nowrap" style={{ background: ROLE[role].bg, color: ROLE[role].color }}>
      {ROLE[role].label}
    </span>
  )
}

/** 프론트 → 디자인 (요청한 쪽 → 맡은 쪽) */
export function RouteChips({ from, to }: { from: RoleId; to: RoleId }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      <span className="sr-only">보내는 곳</span>
      <RoleBadge role={from} />
      <span aria-hidden className="text-xs leading-normal font-medium text-muted">
        →
      </span>
      <span className="sr-only">받는 곳</span>
      <RoleBadge role={to} />
    </span>
  )
}

// 아바타 바탕색 (피그마 값 — 방 대화의 아바타와 같음)
const AVATAR_BG: Record<RoleId, string> = {
  design: 'rgb(52 62 43 / 0.95)',
  front: 'rgb(40 60 67 / 0.95)',
  back: 'rgb(37 62 54 / 0.95)',
}

export function RoleAvatar({ name, role, size = 30 }: { name: string; role: RoleId; size?: number }) {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full text-[13px] leading-normal font-semibold"
      style={{ width: size, height: size, background: AVATAR_BG[role], color: ROLE[role].color }}
    >
      {name.slice(0, 1)}
    </span>
  )
}

/* ───────── 진행 단계 ───────── */

const STEP: Record<StepState, { marker: string; text: string; sr: string }> = {
  done: { marker: stepDone, text: 'font-medium text-ink', sr: '완료' },
  current: { marker: stepCurrent, text: 'font-bold text-checkpoint-text', sr: '지금 단계' },
  todo: { marker: stepTodo, text: 'font-medium text-muted', sr: '남음' },
}

/** 요청 — 수락 — 진행 — 전달 — 확인. 연결선은 칸 폭에 맞춰 줄어듦 (sm 최대 44px · lg 최대 96px) */
export function RequestStepper({ steps, size = 'sm', align = 'start' }: { steps: Step[]; size?: 'sm' | 'lg'; align?: 'start' | 'center' }) {
  const lg = size === 'lg'
  const line = lg
    ? 'mt-[7px] w-[clamp(4px,calc(25cqw_-_56px),96px)] @lg:w-[clamp(4px,calc(25cqw_-_96px),96px)]'
    : 'mt-[5px] w-[clamp(4px,calc(25cqw_-_46px),44px)]'
  return (
    <div className="@container w-full min-w-0">
      <ol aria-label="요청 진행 단계" className={`flex items-start ${align === 'center' ? 'justify-center' : ''}`}>
        {steps.map((s, i) => (
          <li key={s.label} aria-current={s.state === 'current' ? 'step' : undefined} className="flex items-start">
            {i > 0 && <span aria-hidden className={`mx-1.5 h-[1.5px] shrink-0 bg-contour ${line}`} />}
            <span className="flex flex-col items-center gap-1.5">
              <img src={lg && s.state === 'done' ? stepDoneLg : STEP[s.state].marker} alt="" className={lg ? 'size-4' : 'size-3'} />
              <span className={`leading-normal whitespace-nowrap ${lg ? 'text-[13px]' : 'text-xs'} ${STEP[s.state].text}`}>
                {s.label}
                <span className="sr-only"> ({STEP[s.state].sr})</span>
              </span>
              {s.at && (
                // 좁으면 날짜 · 시각을 두 줄로
                <span className="flex flex-col items-center font-mono text-[10px] leading-normal font-medium whitespace-nowrap text-muted @lg:flex-row @lg:gap-[0.6ch]">
                  {s.at.split(' ').map((part) => (
                    <span key={part}>{part}</span>
                  ))}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ───────── 전달된 결과물 미리보기 ───────── */

export function ResultPreview({ file }: { file: { source: string; title: string; note: string; version: string } }) {
  return (
    <div className="@container w-full overflow-clip rounded-[20px] border border-line bg-fill">
      <div aria-hidden className="relative h-[130px] w-full overflow-clip bg-white/[0.03]">
        <img src={thumbResult} alt="" className="absolute top-[7px] left-[60px] h-[116px] w-[70px] max-w-none" />
        <div className="absolute top-[14px] left-[78px] h-[30px] w-[34px] rounded border-[1.5px] border-dashed border-[#e8710a] bg-[rgb(232_113_10/0.08)]" />
        <div className="absolute top-[18px] left-[150px] flex items-center rounded-[13px] border border-[#f9c9a3] bg-fill-3 px-2.5 py-[5px]">
          <span className="text-xs leading-normal font-semibold whitespace-nowrap text-muted">{file.note}</span>
        </div>
        {/* 버전 칩: 좁으면 오른쪽 아래로 (설명 칩과 겹치지 않게) */}
        <div className="absolute right-2.5 bottom-2.5 flex items-center rounded-[10.5px] border border-line bg-fill-3 px-2 py-[3px] @[420px]:top-2.5 @[420px]:right-auto @[420px]:bottom-auto @[420px]:left-[331px]">
          <span className="text-[11px] leading-normal font-medium whitespace-nowrap text-muted">{file.version}</span>
        </div>
      </div>
      <p className="sr-only">
        미리보기: 바뀐 곳 {file.note} · {file.version}
      </p>
      <div className="flex flex-wrap items-center gap-2 px-3.5 py-3">
        <SourceChip className="bg-fill-3">{file.source}</SourceChip>
        <span className="text-sm leading-normal font-semibold text-ink">{file.title}</span>
      </div>
    </div>
  )
}
