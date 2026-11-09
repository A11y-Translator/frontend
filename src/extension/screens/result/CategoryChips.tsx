// 02 · 카테고리 필터 칩 — 눌린 상태를 aria-pressed 로 전달 (색만으로 구분하지 않도록 검정 채움 + 상태 속성)
import type { Category } from '@/shared/api/types'

interface Props {
  total: number
  categories: { label: string; count: number }[]
  value: Category | 'all'
  onChange: (v: Category | 'all') => void
}

export default function CategoryChips({ total, categories, value, onChange }: Props) {
  const chips: { key: Category | 'all'; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: total },
    ...categories.map((c) => ({ key: c.label as Category, label: c.label, count: c.count })),
  ]
  return (
    <div role="group" aria-label="분류별로 보기" className="flex w-full shrink-0 flex-wrap gap-1.5">
      {chips.map((c) => {
        const on = c.key === value
        return (
          <button
            key={c.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(c.key)}
            className={`rounded-full px-2.5 py-[5px] text-xs leading-[1.5] font-medium whitespace-nowrap ${
              on ? 'border border-black bg-black text-white' : 'border border-ext-line bg-white text-black hover:bg-ext-soft'
            }`}
          >
            {c.label} {c.count}
          </button>
        )
      })}
    </div>
  )
}
