// 확장 공통 선택칸 (04 저장 · 팝업 결과 요약에서 같이 씀) — 라벨 + 네이티브 select + ▾
import { useId, type ReactNode } from 'react'

const FIELD = 'w-full appearance-none rounded-lg border border-ext-frame bg-white px-3 py-2.5 pr-8 text-sm leading-[1.5] font-medium text-ink-2'

interface SelectFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  children: ReactNode
}

export function SelectField({ label, value, onChange, children }: SelectFieldProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs leading-[1.5] font-medium text-muted">{label}</label>
      <div className="relative">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={FIELD}>
          {children}
        </select>
        <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">▾</span>
      </div>
    </div>
  )
}
