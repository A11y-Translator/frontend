// Figma: 컴포넌트 / Navbar (554:9041) + card/team (팀 스페이스 전환, 554:10338)
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { NavLink } from 'react-router-dom'
import { CURRENT_USER_ID, memberById, teams } from '@/shared/mocks'
import iconFolder from '@/web/assets/icon-folder.svg'
import iconReport from '@/web/assets/icon-report.svg'
import iconGroup from '@/web/assets/icon-group.svg'
import iconSetting from '@/web/assets/icon-setting.svg'
import iconNotice from '@/web/assets/icon-notice.svg'
import iconDropdown from '@/web/assets/icon-dropdown.svg'
import iconSearch from '@/web/assets/icon-search.svg'
import iconPlus from '@/web/assets/icon-plus.svg'
import workspaceAvatar from '@/web/assets/workspace-avatar.svg'

const MENU = [
  { to: '/', label: '프로젝트', icon: iconFolder, end: true },
  { to: '/report', label: '리포트', icon: iconReport },
  { to: '/members', label: '팀원', icon: iconGroup },
  { to: '/settings', label: '설정', icon: iconSetting },
]

export function Navbar() {
  const me = memberById(CURRENT_USER_ID)!

  return (
    <nav aria-label="주 메뉴" className="flex h-full w-[280px] shrink-0 flex-col gap-[15px] bg-web-nav px-3 py-4 font-pretendard">
      {/* 워크스페이스 */}
      <div className="flex items-center justify-between rounded-[10px] py-1 pr-1 pl-2">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="flex items-center gap-1.5 rounded-lg text-base font-medium text-black">
            <img src={workspaceAvatar} alt="" width={28} height={28} />
            A11y Team
            <img src={iconDropdown} alt="" width={19} height={19} />
            <span className="sr-only">팀 스페이스 바꾸기</span>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={8}
              className="z-50 flex w-[300px] flex-col gap-[57px] rounded-[20px] bg-black px-1.5 py-2 shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
            >
              <div className="flex flex-col gap-0.5">
                <DropdownMenu.Label className="p-2.5 text-base font-semibold text-white">팀 스페이스</DropdownMenu.Label>
                <DropdownMenu.RadioGroup value="a11y" className="flex flex-col gap-1">
                  {teams.map((t) => (
                    <DropdownMenu.RadioItem
                      key={t.id}
                      value={t.id}
                      className="flex h-11 cursor-pointer items-center gap-3.5 rounded-[10px] px-2 text-[13px] font-medium text-white outline-none data-[highlighted]:bg-[#464646] data-[state=checked]:bg-[#464646]"
                    >
                      <span className="flex size-8 items-center justify-center rounded-full bg-avatar text-[13px] font-bold text-muted">
                        {t.initial}
                      </span>
                      {t.name}
                    </DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.RadioGroup>
              </div>
              <DropdownMenu.Item className="flex h-11 cursor-pointer items-center gap-3.5 rounded-[10px] px-2 text-[13px] font-medium text-white outline-none data-[highlighted]:bg-[#464646]">
                <img src={iconPlus} alt="" width={18} height={18} />
                팀 스페이스 추가하기
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
        <button type="button" aria-label="알림" className="flex size-10 items-center justify-center rounded-lg">
          <img src={iconNotice} alt="" width={24} height={24} />
        </button>
      </div>

      {/* 검색 */}
      <label className="flex items-center gap-2 rounded-xl bg-web-search p-2.5">
        <img src={iconSearch} alt="" width={24} height={24} />
        <span className="sr-only">검색</span>
        <input
          type="search"
          placeholder="Search"
          className="w-full bg-transparent text-base font-medium tracking-[-0.4px] text-black outline-none placeholder:text-placeholder"
        />
      </label>

      {/* 메뉴 */}
      <ul className="flex flex-col gap-2">
        {MENU.map((m) => (
          <li key={m.to}>
            <NavLink
              to={m.to}
              end={m.end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-1 py-0.5 text-base font-medium tracking-[-0.4px] text-black ${isActive ? 'bg-white' : 'hover:bg-white/60'}`
              }
            >
              <span className="flex size-10 items-center justify-center">
                <img src={m.icon} alt="" width={24} height={24} />
              </span>
              {m.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="flex-1" />

      {/* 사용자 */}
      <div className="flex items-center gap-2.5 p-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-avatar text-[13px] font-bold text-muted" aria-hidden>
          {me.initial}
        </span>
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold tracking-[-0.325px] text-black">{me.name}</span>
          <span className="text-xs tracking-[-0.3px] text-muted">{me.role}</span>
        </div>
      </div>
    </nav>
  )
}
