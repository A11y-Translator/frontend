// 추천 색 선택 (03 미리 고쳐보기 · 체크리스트 추천 수정에서 공통 사용)
// 네이티브 radio 를 쓰므로 방향키로 옵션 이동, Space 로 선택이 기본 지원됩니다.
import { useId, type ReactNode } from 'react'
import type { ContrastOption } from '@/shared/api/types'

interface Props {
  legend: ReactNode
  /** legend 오른쪽에 붙는 상태 표시 (예: ● 적용 중) */
  aside?: ReactNode
  options: ContrastOption[]
  value?: string
  onChange: (color: string) => void
  /** 작은 행 (체크리스트 카드 안) */
  compact?: boolean
}

export function ContrastOptionGroup({ legend, aside, options, value, onChange, compact }: Props) {
  const name = useId()
  return (
    <fieldset className={`relative flex w-full min-w-0 flex-col ${compact ? 'gap-1.5' : 'gap-2.5'}`}>
      {/* legend 는 fieldset 의 첫 자식이어야 그룹 이름으로 읽힘 → 상태 표시는 오른쪽 위에 따로 배치 */}
      <legend className={`pr-24 font-bold text-ink-2 ${compact ? 'mb-1.5 text-xs leading-[1.45]' : 'mb-2.5 min-h-[25px] text-sm leading-[1.5]'}`}>{legend}</legend>
      {aside && <div className="absolute top-0 right-0">{aside}</div>}
      {options.map((o) => {
        const checked = o.color.toLowerCase() === value?.toLowerCase()
        return (
          <label
            key={o.color}
            className={`flex cursor-pointer items-center gap-2.5 rounded-lg border ${compact ? 'gap-2 px-2 py-1.5' : 'px-2.5 py-2'} has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent ${
              checked ? 'border-accent bg-[#edf4ff]' : 'border-ext-frame bg-white hover:bg-ext-bg'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.color}
              checked={checked}
              onChange={() => onChange(o.color)}
              className="sr-only"
            />
            <span aria-hidden className={`shrink-0 ${compact ? 'size-[18px] rounded-[5px]' : 'size-[22px] rounded-md'}`} style={{ backgroundColor: o.color }} />
            <span className={`flex min-w-0 flex-1 ${compact ? 'flex-wrap items-baseline gap-x-2 leading-[1.45]' : 'flex-col leading-[1.5]'}`}>
              <span className={`font-bold text-ink-2 ${compact ? 'text-xs' : 'text-[13px]'}`}>{o.color.toUpperCase()}</span>
              <span className="text-[11px] text-muted">
                {o.ratio} · {o.label}
              </span>
            </span>
            {/* 선택 여부를 글자로도 표시 (색만으로 구분하지 않기) */}
            <span aria-hidden className={`shrink-0 text-xs leading-[1.5] font-medium ${checked ? 'text-[#175fc2]' : 'text-muted'}`}>
              {checked ? '선택됨' : '적용'}
            </span>
          </label>
        )
      })}
    </fieldset>
  )
}
