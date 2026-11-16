// Figma: 컴포넌트 / Navbar (554:9041) + card/team (팀 스페이스 전환, 554:10338)
// 모양 3가지 (WebLayout · useSidebar 가 정함)
//  - 펼침: 피그마 그대로 (폭 --sidebar-w)
//  - 접힘(collapsed): 아이콘만 있는 얇은 사이드바 (68px). 메뉴 이름은 화면낭독기용 글자 + 마우스를 올리면 툴팁(title)
//  - 서랍(drawer): 모바일에서 ☰ 로 여는 메뉴. 펼침과 같고, 접기 대신 닫기 버튼 · 메뉴를 고르면 닫힘
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useRef, type Ref } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { CURRENT_USER_ID, memberById, teams } from '@/shared/mocks'
import { useAppState } from '@/shared/store'
import iconFolder from '@/web/assets/icon-folder.svg'
import iconReport from '@/web/assets/icon-report.svg'
import iconTodo from '@/web/assets/icon-todo.svg'
import iconGroup from '@/web/assets/icon-group.svg'
import iconSetting from '@/web/assets/icon-setting.svg'
import iconNotice from '@/web/assets/icon-notice.svg'
import iconDropdown from '@/web/assets/icon-dropdown.svg'
import iconSearch from '@/web/assets/icon-search.svg'
import iconPlus from '@/web/assets/icon-plus.svg'
import workspaceAvatar from '@/web/assets/workspace-avatar.svg'

const MENU = [
  { to: '/', label: '프로젝트', icon: iconFolder, end: true },
  // 디자인 Navbar 에는 없지만 구조도의 '할 일' 메뉴를 위해 추가 (내 할 일 개수 배지)
  { to: '/todo', label: '할 일', icon: iconTodo, badge: true },
  { to: '/report', label: '리포트', icon: iconReport },
  { to: '/members', label: '팀원', icon: iconGroup },
  { to: '/settings', label: '설정', icon: iconSetting },
]

interface NavbarProps {
  /** 아이콘만 보이는 얇은 사이드바 */
  collapsed?: boolean
  /** 펼치기 (접힌 상태에서 검색 아이콘을 누르면 펼치고 검색칸으로 · 서랍 모드에서는 없음) */
  onToggle?: () => void
  /** 서랍 모드: 닫기 버튼과 메뉴 선택 시 호출 */
  onClose?: () => void
  /** 사용자가 경계를 끌어 정한 펼친 폭 (없으면 기본값 --sidebar-w) */
  width?: number
  /** 폭 바뀔 때 부드럽게 (끄는 중에는 끔) */
  animate?: boolean
  ref?: Ref<HTMLElement>
}

function CloseIcon() {
  return (
    <svg aria-hidden width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  )
}

const ICON_BTN = 'flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-3 hover:bg-white'

export function Navbar({ collapsed = false, onToggle, onClose, width, animate = true, ref }: NavbarProps) {
  const me = memberById(CURRENT_USER_ID)!
  const { issues } = useAppState()
  const myOpen = issues.filter((i) => i.assigneeId === CURRENT_USER_ID && i.status !== 'resolved').length
  const searchRef = useRef<HTMLInputElement>(null)
  const drawer = !!onClose

  // 접힌 상태에서 검색 아이콘을 누르면 펼치고 검색칸으로
  const openSearch = () => {
    onToggle?.()
    requestAnimationFrame(() => searchRef.current?.focus())
  }

  return (
    <nav
      ref={ref}
      aria-label="주 메뉴"
      style={!collapsed && !drawer && width ? { width } : undefined}
      className={`flex h-full shrink-0 flex-col gap-3 overflow-x-hidden overflow-y-auto bg-web-nav py-4 font-pretendard ${animate ? 'transition-[width] duration-200' : ''} ${
        collapsed ? 'w-[68px] items-center px-2' : drawer ? 'w-full px-2.5' : 'w-(--sidebar-w) px-2.5'
      }`}
    >
      {/* 워크스페이스 + 알림 + 접기 */}
      <div className={`flex items-center rounded-[10px] py-1 ${collapsed ? 'flex-col gap-2' : 'justify-between gap-1 pl-1.5'}`}>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger
            title={collapsed ? 'A11y Team · 팀 스페이스 바꾸기' : undefined}
            className="flex min-w-0 items-center gap-1 rounded-lg text-[15px] font-medium whitespace-nowrap text-black"
          >
            <img src={workspaceAvatar} alt="" width={24} height={24} className="shrink-0" />
            {collapsed ? <span className="sr-only">A11y Team</span> : <span className="truncate">A11y Team</span>}
            {!collapsed && <img src={iconDropdown} alt="" width={16} height={16} className="shrink-0" />}
            <span className="sr-only">, 팀 스페이스 바꾸기</span>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              side={collapsed ? 'right' : 'bottom'}
              sideOffset={8}
              collisionPadding={12}
              className="z-50 flex w-[300px] max-w-[calc(100vw-24px)] flex-col gap-[57px] rounded-[20px] bg-black px-1.5 py-2 shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
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
        <div className={`flex shrink-0 items-center ${collapsed ? 'flex-col gap-1' : ''}`}>
          <button type="button" aria-label="알림" title={collapsed ? '알림' : undefined} className={ICON_BTN}>
            <img src={iconNotice} alt="" width={22} height={22} />
          </button>
          {/* 사이드바 펼치기·접기 버튼은 없음 — 경계를 끌거나(SidebarResizer) 키보드로 조절. 서랍(모바일)에서만 닫기 버튼 */}
          {drawer && (
            <button type="button" onClick={onClose} aria-label="메뉴 닫기" className={ICON_BTN}>
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      {/* 검색 */}
      {collapsed ? (
        <button type="button" onClick={openSearch} aria-label="검색" title="검색" className={`${ICON_BTN} bg-web-search`}>
          <img src={iconSearch} alt="" width={20} height={20} />
        </button>
      ) : (
        <label className="flex items-center gap-2 rounded-xl bg-web-search px-2.5 py-2">
          <img src={iconSearch} alt="" width={20} height={20} />
          <span className="sr-only">검색</span>
          <input
            ref={searchRef}
            type="search"
            placeholder="Search"
            className="w-full min-w-0 bg-transparent text-sm font-medium tracking-[-0.4px] text-black outline-none placeholder:text-placeholder"
          />
        </label>
      )}

      {/* 메뉴 */}
      <ul className={`flex flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
        {MENU.map((m) => {
          const badge = 'badge' in m && m.badge && myOpen > 0
          return (
            <li key={m.to}>
              <NavLink
                to={m.to}
                end={m.end}
                onClick={onClose}
                title={collapsed ? m.label : undefined}
                className={({ isActive }) =>
                  `relative flex items-center rounded-xl text-[15px] font-medium tracking-[-0.3px] whitespace-nowrap text-black ${
                    collapsed ? 'size-11 justify-center' : 'gap-2 px-1 py-0.5'
                  } ${isActive ? 'bg-white' : 'hover:bg-white/60'}`
                }
              >
                <span className="flex size-9 shrink-0 items-center justify-center">
                  <img src={m.icon} alt="" width={22} height={22} />
                </span>
                {collapsed ? <span className="sr-only">{m.label}</span> : m.label}
                {badge &&
                  (collapsed ? (
                    <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] leading-4 font-semibold text-white">
                      {myOpen}
                      <span className="sr-only">개 남음</span>
                    </span>
                  ) : (
                    <span className="mr-2 ml-auto rounded-full bg-black px-2 py-0.5 text-xs font-semibold text-white">
                      {myOpen}
                      <span className="sr-only">개 남음</span>
                    </span>
                  ))}
              </NavLink>
            </li>
          )
        })}
      </ul>

      <div className="flex-1" />

      {/* 디자인에 없는 진입점: 크롬 확장 프로그램 데모 (확장 화면은 웹과 다른 곳이라 URL 로만 이동) */}
      <Link
        to="/extension"
        title={collapsed ? '확장 프로그램 열기' : undefined}
        className={`flex items-center rounded-xl border border-web-line bg-white text-sm font-medium whitespace-nowrap text-black hover:bg-web-chip ${
          collapsed ? 'size-11 justify-center' : 'gap-2.5 px-3 py-2.5'
        }`}
      >
        <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-md bg-black text-xs font-bold text-white">A</span>
        {collapsed ? <span className="sr-only">확장 프로그램 열기</span> : '확장 프로그램 열기'}
      </Link>

      {/* 사용자 */}
      <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center py-1' : 'p-2'}`} title={collapsed ? `${me.name} · ${me.role}` : undefined}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-avatar text-[13px] font-bold text-muted" aria-hidden>
          {me.initial}
        </span>
        {collapsed ? (
          <span className="sr-only">
            {me.name} · {me.role}
          </span>
        ) : (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-semibold tracking-[-0.325px] text-black">{me.name}</span>
            <span className="truncate text-xs tracking-[-0.3px] text-muted">{me.role}</span>
          </div>
        )}
      </div>
    </nav>
  )
}
