// Figma: Member card (564:2348 …) — 컴포넌트 Frame 7292 스타일
// 카드 전체를 눌러 선택(aria-pressed), ⋯ 메뉴는 별도 버튼. (버튼 안에 버튼을 넣지 않으려고 겹쳐 배치)
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useNavigate } from 'react-router-dom'
import type { Member } from '@/shared/api/types'
import statusOnline from '@/web/assets/status-online.svg'
import { ONLINE } from './membersUtils'

interface Props {
  member: Member
  load: { assigned: number; resolved: number }
  selected: boolean
  onSelect: () => void
  onMention: () => void
}

export function MemberCard({ member: m, load, selected, onSelect, onMention }: Props) {
  const navigate = useNavigate()
  const total = load.assigned + load.resolved
  const pct = total ? Math.round((load.resolved / total) * 100) : 0
  const online = ONLINE.has(m.id)

  return (
    <li
      className={`relative flex items-center gap-3 rounded-[10px] border-[1.5px] px-4 py-3.5 font-noto leading-[1.45] ${
        selected ? 'border-ink-2 bg-web-chip' : 'border-[#d9d9d9] bg-white hover:bg-web-chip'
      }`}
    >
      <button
        type="button"
        aria-pressed={selected}
        aria-controls="member-detail"
        onClick={onSelect}
        // after: 로 카드 전체를 클릭 영역으로
        className="flex min-w-0 flex-1 items-center gap-3 rounded text-left after:absolute after:inset-0 after:rounded-[10px] after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
      >
        <span className="relative size-10 shrink-0">
          <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-[#e9eaec] text-[15px] font-bold text-ink-3">
            {m.initial}
          </span>
          {online && (
            <>
              <img src={statusOnline} alt="" width={10} height={10} className="absolute top-[30px] left-[30px]" />
              <span className="sr-only">(접속 중)</span>
            </>
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-bold text-ink-2">{m.name}</span>
            <span className="shrink-0 rounded-md bg-[#f2f3f5] px-[7px] py-px text-[11px] font-medium text-muted-3">
              {m.role}
              {m.lead ? ' · 팀장' : ''}
            </span>
          </span>
          {/* 해결 비율 막대 — 숫자는 아래 글자로 전달하므로 장식 */}
          <span aria-hidden className="block h-1 w-full overflow-hidden rounded-[2px] bg-web-line-2">
            <span className="block h-full rounded-[2px] bg-ink-2" style={{ width: `${pct}%` }} />
          </span>
          <span className="text-xs text-muted-2">
            담당 {load.assigned} · 해결 {load.resolved}
          </span>
        </span>
      </button>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          aria-label={`${m.name} 메뉴`}
          className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-md text-base font-bold text-muted-2 hover:bg-web-line-2"
        >
          <span aria-hidden>⋯</span>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-[160px] rounded-[10px] border border-web-header-line bg-white p-1.5 font-noto shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          >
            <DropdownMenu.Item onSelect={onSelect} className={itemCls}>
              자세히 보기
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={onMention} className={itemCls}>
              @ 멘션하기
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={() => navigate('/todo/team')} className={itemCls}>
              담당 이슈 보기
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </li>
  )
}

const itemCls = 'flex cursor-pointer items-center rounded-md px-2.5 py-[7px] text-[13px] text-ink-2 outline-none data-[highlighted]:bg-web-chip'
