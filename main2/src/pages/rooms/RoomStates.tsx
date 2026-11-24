// 상태 카드 3종 — 피그마 "07-2 상태 · 불러오기 실패 / 비어 있음 / 불러오는 중".
// 기본 글자는 피그마(버전 비교 화면용) 그대로이고, 다른 화면에서는 props 로 바꿔 씁니다.
//
// ErrorState    title? · lines?: string[] · actionLabel? · onRetry?() · bare?   → role="alert"
// EmptyState    title? · lines?: string[] · actionLabel? · onAction?() · bare?
// LoadingState  text? · rows?: number · bare?                                  → role="status"
//   bare = 이미 유리 패널 안에 넣을 때 카드 테두리·바탕을 빼고 내용만 그림
import type { ReactNode } from 'react'
import iconAlert from '@/assets/rooms/icon-alert.svg'
import iconComment from '@/assets/rooms/icon-comment.svg'
import skeletonEllipse from '@/assets/rooms/skeleton-ellipse.svg'

interface FrameProps {
  bare?: boolean
  role?: 'alert' | 'status'
  align?: 'center' | 'start'
  children: ReactNode
}

// 카드 틀: 360×300 유리 패널 (좁으면 줄어듦)
function StateFrame({ bare = false, role, align = 'center', children }: FrameProps) {
  const layout = align === 'center' ? 'items-center justify-center text-center' : 'items-start'
  return (
    <div
      role={role}
      className={`flex w-full max-w-[360px] flex-col gap-3 px-6 py-7 ${layout} ${
        bare ? '' : 'glass-edge h-[300px] overflow-clip rounded-3xl border border-line-soft bg-glass backdrop-blur-[14px]'
      }`}
    >
      {children}
    </div>
  )
}

function Lines({ lines }: { lines: readonly string[] }) {
  return (
    <p className="w-full text-[13px] leading-normal text-muted">
      {lines.map((line, i) => (
        <span key={i} className="block">
          {line}
        </span>
      ))}
    </p>
  )
}

export interface ErrorStateProps {
  title?: string
  lines?: readonly string[]
  actionLabel?: string
  onRetry?: () => void
  bare?: boolean
}

/** 불러오기 실패 */
export function ErrorState({
  title = '개발 서버 화면을 불러오지 못했어요',
  lines = ['dev 서버가 꺼져 있거나 연결이 끊겼을 수 있어요.', '마지막으로 불러온 화면: 오늘 10:20'],
  actionLabel = '다시 불러오기',
  onRetry,
  bare,
}: ErrorStateProps) {
  return (
    <StateFrame bare={bare} role="alert">
      <img src={iconAlert} alt="" className="size-7" />
      <p className="text-[15px] leading-normal font-bold text-ink">{title}</p>
      <Lines lines={lines} />
      <button
        type="button"
        onClick={onRetry}
        className="rounded-[19px] bg-summit px-4 py-2.5 text-[13px] leading-normal font-bold whitespace-nowrap text-on-summit transition hover:brightness-105 active:brightness-95"
      >
        {actionLabel}
      </button>
    </StateFrame>
  )
}

export interface EmptyStateProps {
  title?: string
  lines?: readonly string[]
  actionLabel?: string
  onAction?: () => void
  bare?: boolean
}

/** 비어 있음 */
export function EmptyState({
  title = '아직 코멘트가 없어요',
  lines = ['개발 서버 화면에서 바뀐 곳을 눌러', '첫 코멘트를 남겨 보세요.'],
  actionLabel = '코멘트 남기기',
  onAction,
  bare,
}: EmptyStateProps) {
  return (
    <StateFrame bare={bare}>
      <img src={iconComment} alt="" className="size-7" />
      <p className="text-[15px] leading-normal font-bold text-ink">{title}</p>
      <Lines lines={lines} />
      <button
        type="button"
        onClick={onAction}
        className="rounded-[18px] border border-line bg-white/[0.08] px-4 py-2.5 text-[13px] leading-normal font-bold whitespace-nowrap text-ink transition hover:bg-white/[0.14]"
      >
        {actionLabel}
      </button>
    </StateFrame>
  )
}

export interface LoadingStateProps {
  text?: string
  rows?: number
  bare?: boolean
}

/** 불러오는 중 (뼈대 3줄 + 안내 문구) */
export function LoadingState({ text = '개발 서버 화면을 불러오는 중이에요…', rows = 3, bare }: LoadingStateProps) {
  return (
    <StateFrame bare={bare} role="status" align="start">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} aria-hidden className="flex w-full animate-pulse items-center gap-2.5">
          <img src={skeletonEllipse} alt="" className="size-[22px] shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="h-2.5 w-full max-w-[160px] rounded-[5px] bg-fill-2" />
            <div className="h-2 w-full max-w-[220px] rounded bg-fill-2" />
          </div>
        </div>
      ))}
      <p className="text-[13px] leading-normal font-medium text-muted">{text}</p>
    </StateFrame>
  )
}
