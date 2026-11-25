// 공용 부품 — 모든 화면이 같은 모양을 쓰도록 여기서 가져다 씁니다.
// (피그마 "최종 3 · 다듬음" 의 유리 패널 · 카드 · 칩 · 버튼)
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { ROLE, type RoleId } from '@/data/mock'

type DivProps = HTMLAttributes<HTMLDivElement>

/** 큰 패널: 밝은 화면은 흰 카드, 어두운 곳은 반투명 유리 · 둥근 24px (일정 · 기획 문서 · 체크포인트 상세 등) */
export function GlassPanel({ className = '', children, ...rest }: DivProps) {
  return (
    <div
      {...rest}
      className={`glass-edge rounded-3xl border border-line-soft bg-glass backdrop-blur-[14px] ${className}`}
    >
      {children}
    </div>
  )
}

/** 불투명 카드: 흰색(어두운 곳은 #1c1d1f) + 둥근 16px */
export function Card({ className = '', children, ...rest }: DivProps) {
  return (
    <div {...rest} className={`rounded-2xl border border-line bg-surface ${className}`}>
      {children}
    </div>
  )
}

/** 페이지 제목 + 설명 (28px Bold / 15px) */
export function PageHeader({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="text-[clamp(22px,1rem+1.2vw,28px)] leading-tight font-bold tracking-[-0.02em] text-ink">{title}</h1>
        {sub && <p className="text-[15px] text-muted">{sub}</p>}
      </div>
      {right}
    </header>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement>

/** 주 버튼: 먹색 알약 (루트 생성하기 · 이 루트로 출발하기). 어두운 곳(.theme-dark)에서는 연두 알약 */
export function PrimaryButton({ className = '', type = 'button', children, ...rest }: BtnProps) {
  return (
    <button
      type={type}
      {...rest}
      className={`inline-flex items-center justify-center rounded-full bg-primary px-6 py-3.5 text-[15px] leading-none font-semibold whitespace-nowrap text-on-primary transition hover:brightness-125 active:brightness-95 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

/** 보조 버튼: 테두리만 있는 알약 (수정하기) */
export function GhostButton({ className = '', type = 'button', children, ...rest }: BtnProps) {
  return (
    <button
      type={type}
      {...rest}
      className={`inline-flex items-center justify-center rounded-full border border-line px-5 py-3 text-sm leading-none font-semibold whitespace-nowrap text-ink transition hover:bg-fill-2 ${className}`}
    >
      {children}
    </button>
  )
}

/** 둘 중 하나 고르기 (일 단위 / 시간 단위 · 파일 / 링크 / 직접 입력 · 보기 / 편집) */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex shrink-0 items-center gap-0.5 rounded-[14px] bg-fill-2 p-[3px]">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`rounded-[11px] px-2.5 py-1 text-xs whitespace-nowrap ${on ? 'bg-fill-3 font-semibold text-ink' : 'bg-fill-2 font-medium text-muted hover:text-ink'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** 작은 칩 */
export function Chip({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-[7px] py-0.5 text-[11px] font-bold whitespace-nowrap ${className}`}>
      {children}
    </span>
  )
}

/** "AI 추천" 칩 */
export function AiChip() {
  return <Chip className="border border-role-front/25 bg-role-front-bg text-role-front">AI 추천</Chip>
}

/** 역할 색 점 (디자인 연두 · 프론트 연보라 · 백 하늘) */
export function RoleDot({ role, className = '' }: { role: RoleId; className?: string }) {
  return <span aria-hidden className={`inline-block size-2 shrink-0 rounded-full ${className}`} style={{ background: ROLE[role].color }} />
}

/** 역할 칩 (디자인 2명) */
export function RoleChip({ role, children }: { role: RoleId; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[14px] px-2.5 py-1.5 text-[13px] font-semibold whitespace-nowrap"
      style={{ background: ROLE[role].bg, color: ROLE[role].color }}
    >
      <RoleDot role={role} />
      {children}
    </span>
  )
}

/** 이름 첫 글자 아바타 */
export function Avatar({ name, size = 28, className = '' }: { name: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.43) }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-avatar font-semibold text-avatar-text ${className}`}
    >
      {name.slice(0, 1)}
    </span>
  )
}

/** 고정폭 숫자 (날짜 · 개수) */
export function Mono({ className = '', children }: { className?: string; children: ReactNode }) {
  return <span className={`font-mono font-medium ${className}`}>{children}</span>
}
