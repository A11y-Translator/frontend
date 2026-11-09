// 할 일 탭들이 같이 쓰는 작은 UI 조각.
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { Issue } from '@/shared/api/types'
export { SeverityChip } from '@/shared/ui/SeverityChip'


export function Avatar({ initial, size = 22, className = '' }: { initial: string; size?: 22 | 26 | 30; className?: string }) {
  const text = size === 30 ? 'text-xs' : 'text-[11px]'
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-web-header-line leading-[1.45] font-bold text-ink-2 ${text} ${className}`}
    >
      {initial}
    </span>
  )
}

/** 우리 팀 할 일 표의 상태 배지. 글자로 상태를 말하고 색은 보조 */
export function StatusBadge({ issue }: { issue: Issue }) {
  const map = {
    in_progress: { label: '진행 중', cls: 'bg-[#edf4ff] text-[#175fc2]' },
    review: { label: '검토 요청', cls: 'bg-[#fff6e5] text-[#8a5a00]' },
    todo: { label: '할 일', cls: 'bg-web-chip text-ink-3' },
    unassigned: { label: '미배정', cls: 'bg-web-chip text-ink-3' },
    resolved: issue.autoResolved
      ? { label: '자동 해결', cls: 'bg-success-bg text-success' }
      : { label: '완료', cls: 'bg-success-bg text-success' },
  } as const
  const s = map[issue.status]
  return <span className={`inline-block rounded-md px-2 py-0.5 text-xs leading-[1.45] font-medium whitespace-nowrap ${s.cls}`}>{s.label}</span>
}

/** "정렬: 심각도순 ▾" / "직군: 전체 ▾" 처럼 생긴 작은 선택 메뉴 */
export function SelectMenu<T extends string>({
  prefix,
  value,
  options,
  onChange,
}: {
  prefix: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  const current = options.find((o) => o.value === value)?.label
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="rounded-md px-1 text-[13px] leading-[1.45] font-medium whitespace-nowrap text-[#626873] hover:text-ink-2">
        {prefix}: {current} <span aria-hidden>▾</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[160px] rounded-[10px] border border-web-header-line bg-white p-1.5 font-noto shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        >
          <DropdownMenu.Label className="px-2.5 pt-1 pb-1 text-[11px] font-medium text-muted-2">{prefix}</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
            {options.map((o) => (
              <DropdownMenu.RadioItem
                key={o.value}
                value={o.value}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-[7px] text-[13px] text-ink-2 outline-none data-[highlighted]:bg-web-chip data-[state=checked]:font-bold"
              >
                {o.label}
                <DropdownMenu.ItemIndicator aria-hidden className="text-xs font-bold text-[#175fc2]">
                  ✓
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

/** 작업 결과 알림: 화면낭독기(role=status)와 화면 아래 토스트를 한 곳에서 */
export function LiveToast({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-8 left-[calc(50%+140px)] z-[60] -translate-x-1/2 font-noto">
      {message && (
        <span className="block rounded-pill bg-ink-2 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
          {message}
        </span>
      )}
    </div>
  )
}
