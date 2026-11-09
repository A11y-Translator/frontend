// 설정 화면 전용 입력 컨트롤: 스위치(role="switch"), 선택(native select), 한 줄 설정 행
import { useId, type ReactNode } from 'react'

interface SwitchProps {
  id: string
  checked: boolean
  onChange: (next: boolean) => void
  describedBy?: string
}

/** Figma Switch (36×20) — 누르는 영역은 24px 이상이 되도록 바깥 여백을 둡니다 */
export function Switch({ id, checked, onChange, describedBy }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-describedby={describedBy}
      onClick={() => onChange(!checked)}
      className="-m-0.5 shrink-0 rounded-full p-0.5"
    >
      <span aria-hidden className={`relative block h-5 w-9 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-ext-line'}`}>
        <span
          className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </span>
    </button>
  )
}

interface SelectProps {
  id: string
  value: string
  onChange: (next: string) => void
  options: string[]
  describedBy?: string
}

/** Figma 의 "WCAG 2.1 AA ▾" 칩 모양을 한 기본 select */
export function Select({ id, value, onChange, options, describedBy }: SelectProps) {
  return (
    <span className="relative shrink-0">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={describedBy}
        className="cursor-pointer appearance-none rounded-lg bg-ext-bg py-1.5 pr-7 pl-3 text-[13px] leading-[1.5] font-medium text-black hover:bg-ext-soft"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-black">
        ▾
      </span>
    </span>
  )
}

interface SettingRowProps {
  label: string
  description: string
  /** ids.control 을 컨트롤의 id 로, ids.desc 를 aria-describedby 로 쓰세요 */
  children: (ids: { control: string; desc: string }) => ReactNode
  /** 라벨과 연결할 입력 컨트롤이 없으면 false (예: 로그아웃 버튼) */
  labelled?: boolean
}

export function SettingRow({ label, description, children, labelled = true }: SettingRowProps) {
  const base = useId()
  const ids = { control: `${base}-control`, desc: `${base}-desc` }
  return (
    <li className="flex items-center gap-3 py-[9px]">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.5]">
        {labelled ? (
          <label htmlFor={ids.control} className="text-sm font-medium text-black">
            {label}
          </label>
        ) : (
          <span className="text-sm font-medium text-black">{label}</span>
        )}
        <span id={ids.desc} className="text-xs text-muted">
          {description}
        </span>
      </div>
      {children(ids)}
    </li>
  )
}

export function SettingSection({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="w-full rounded-xl border border-ext-line bg-white px-5 pt-3.5 pb-1">
      <h2 id={id} className="text-[15px] leading-[1.5] font-bold text-black">
        {title}
      </h2>
      <ul>{children}</ul>
    </section>
  )
}
