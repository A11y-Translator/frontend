// 세부 할 일 한 줄 (피그마 "루트 상세 / 세부 할 일") — 체크하면 담음, 풀면 제안.
// 구간 도착 시트(sheet)와 루트 상세 패널(route)에서 같이 씁니다.
import iconCheck from '@/assets/board/icon-check.svg'
import { SOURCE_LABEL, type TodoSource } from './boardData'

interface Props {
  label: string
  source: TodoSource
  checked: boolean
  onChange: (checked: boolean) => void
  /** sheet: 반투명 줄 + 검은 체크 · route: 불투명 줄 + 테두리 체크 */
  tone: 'sheet' | 'route'
}

export function TodoRow({ label, source, checked, onChange, tone }: Props) {
  // 체크 동그라미 모양 (화면마다 다름)
  const box =
    tone === 'route'
      ? 'border border-[#a8abb0] bg-surface'
      : checked
        ? 'bg-[#111]'
        : 'border-[1.2px] border-[#c9c9ce] bg-fill-3'
  // 출처 칩: 시트에서는 AI 추천만 연보라, 루트 상세에서는 둘 다 회색
  const tag =
    source === 'ai' && tone === 'sheet'
      ? 'border border-role-design/25 bg-role-design-bg text-role-front'
      : 'bg-fill-3 text-muted'

  return (
    <label
      className={`relative flex min-h-[30px] w-full cursor-pointer items-center gap-2 rounded-xl border border-line px-2.5 py-[6px] hover:border-ink/20 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-summit ${tone === 'route' ? 'bg-surface' : 'bg-fill'}`}
    >
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden className={`flex size-4 shrink-0 items-center justify-center rounded-full ${box}`}>
        {checked && <img src={iconCheck} alt="" className="size-2.5" />}
      </span>
      <span className={`min-w-0 flex-1 text-xs leading-[1.4] break-keep ${tone === 'sheet' && !checked ? 'text-muted' : 'text-ink'}`}>{label}</span>
      <span className={`shrink-0 rounded-lg px-1.5 py-0.5 text-[10px] leading-none font-bold whitespace-nowrap ${tag}`}>{SOURCE_LABEL[source]}</span>
    </label>
  )
}
