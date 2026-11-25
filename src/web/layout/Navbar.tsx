// Figma: 컴포넌트 / Navbar (554:9041) + card/team (팀 스페이스 전환, 554:10338)
// 모양 3가지 (WebLayout · useSidebar 가 정함)
//  - 펼침: 피그마 그대로 (폭 --sidebar-w)
//  - 접힘(collapsed): 아이콘만 있는 얇은 사이드바 (68px). 메뉴 이름은 화면낭독기용 글자 + 마우스를 올리면 툴팁(title)
//  - 서랍(drawer): 모바일에서 ☰ 로 여는 메뉴. 펼침과 같고, 접기 대신 닫기 버튼 · 메뉴를 고르면 닫힘
import * as Popover from '@radix-ui/react-popover'
import { useEffect, useId, useRef, useState, type Ref } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { CURRENT_USER_ID, memberById, teams } from '@/shared/mocks'
import { useAppState, workspaceIssues } from '@/shared/store'
import iconFolder from '@/web/assets/icon-folder.svg'
import iconTodo from '@/web/assets/icon-todo.svg'
import iconReport from '@/web/assets/icon-report.svg'
import iconGroup from '@/web/assets/icon-group.svg'
import iconSetting from '@/web/assets/icon-setting.svg'
import iconNotice from '@/web/assets/icon-notice.svg'
import iconSearch from '@/web/assets/icon-search.svg'
import iconPlus from '@/web/assets/icon-plus.svg'

const MENU = [
  // 프로젝트만 모아 보기 (최근 수정순 · 생성일순 정렬). 메인(홈)은 맨 위 워크스페이스 아이콘
  { to: '/projects', label: '프로젝트', icon: iconFolder },
  // 디자인 Navbar 에는 없지만 구조도의 '할 일' 메뉴 (내 할 일 개수 배지)
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

type Workspace = (typeof teams)[number]

/** 워크스페이스 이미지를 정하지 않았으면 색 + 첫 글자 (워크스페이스마다 다른 색) */
const WORKSPACE_COLORS: Record<string, string> = { a11y: '#1d4ed8', gdgoc: '#0f8a5f', ours: '#c2410c' }
const FALLBACK_COLORS = ['#6d28d9', '#be185d', '#0e7490', '#4d7c0f']
const colorOf = (t: Workspace) =>
  WORKSPACE_COLORS[t.id] ?? FALLBACK_COLORS[[...t.id].reduce((a, c) => a + c.charCodeAt(0), 0) % FALLBACK_COLORS.length]

function WorkspaceIcon({ team, size = 28 }: { team: Workspace; size?: number }) {
  const image = 'image' in team ? (team as { image?: string }).image : undefined
  return image ? (
    <img src={image} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" />
  ) : (
    <span
      aria-hidden
      style={{ width: size, height: size, background: colorOf(team) }}
      className="flex shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
    >
      {team.initial}
    </span>
  )
}

const WORKSPACE_KEY = 'a11y-translator:workspace'
const readWorkspace = () => {
  try {
    return teams.find((t) => t.id === localStorage.getItem(WORKSPACE_KEY)) ?? teams[0]
  } catch {
    return teams[0]
  }
}

const ICON_BTN = 'flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-3 hover:bg-white'

export function Navbar({ collapsed = false, onToggle, onClose, width, animate = true, ref }: NavbarProps) {
  const me = memberById(CURRENT_USER_ID)!
  const searchRef = useRef<HTMLInputElement>(null)
  const drawer = !!onClose
  // 지금 워크스페이스 (서버 연결 전에는 이 브라우저에만 기억)
  const [workspace, setWorkspace] = useState<Workspace>(readWorkspace)
  const [announce, setAnnounce] = useState('')
  // 워크스페이스 선택창: 마우스를 올리면 열리고, 벗어나면 잠깐 뒤 닫혀요 (아이콘 → 창으로 옮겨 갈 틈)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const openedByHover = useRef(false)
  const openedByKeyboard = useRef(false)
  const closeTimer = useRef<number>(undefined)
  const homeLinkRef = useRef<HTMLAnchorElement>(null)
  const switcherRef = useRef<HTMLDivElement>(null)
  const hintId = useId()
  const openSwitcher = () => {
    window.clearTimeout(closeTimer.current)
    if (!switcherOpen) {
      openedByHover.current = true
      openedByKeyboard.current = false
    }
    setSwitcherOpen(true)
  }
  const closeSwitcherSoon = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setSwitcherOpen(false), 180)
  }
  useEffect(() => {
    if (!switcherOpen) openedByHover.current = false
  }, [switcherOpen])
  useEffect(() => () => window.clearTimeout(closeTimer.current), [])
  const changeWorkspace = (id: string) => {
    const next = teams.find((t) => t.id === id)
    if (!next) return
    setWorkspace(next)
    setAnnounce(`${next.name} 워크스페이스로 바꿨어요`)
    try {
      localStorage.setItem(WORKSPACE_KEY, id)
    } catch {
      /* 기억 못 해도 바꾸기는 돼요 */
    }
  }
  // 나에게 배정된 미해결 이슈 수 (예시 이슈 + 실제 검사 이슈)
  const state = useAppState()
  const myOpen = workspaceIssues(state).filter((i) => i.assigneeId === CURRENT_USER_ID && i.status !== 'resolved').length

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
      className={`flex h-full shrink-0 flex-col gap-4 overflow-x-hidden overflow-y-auto bg-web-nav py-4 font-pretendard ${animate ? 'transition-[width] duration-200' : ''} ${
        collapsed ? 'w-[68px] items-center px-2' : drawer ? 'w-full px-2.5' : 'w-(--sidebar-w) px-2.5'
      }`}
    >
      {/* 워크스페이스 + 알림 + 접기 */}
      <div className={`flex items-center rounded-[10px] py-1 ${collapsed ? 'flex-col gap-2' : 'justify-between gap-1 pl-1.5'}`}>
        {/* 워크스페이스 아이콘: 클릭 = 지금 워크스페이스 홈(메인), 마우스를 올리면 = 워크스페이스 선택창
            키보드: 아이콘에서 ↓ 또는 → 를 누르면 선택창이 열려요 */}
        <Popover.Root open={switcherOpen} onOpenChange={setSwitcherOpen}>
          <Popover.Anchor asChild>
            <div className="min-w-0" onMouseEnter={openSwitcher} onMouseLeave={closeSwitcherSoon}>
              <Link
                ref={homeLinkRef}
                to="/"
                onClick={() => {
                  setSwitcherOpen(false)
                  onClose?.()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault()
                    window.clearTimeout(closeTimer.current)
                    openedByHover.current = false
                    openedByKeyboard.current = true
                    setSwitcherOpen(true)
                    // 선택창이 그려진 뒤 지금 워크스페이스 항목으로 포커스
                    requestAnimationFrame(() =>
                      requestAnimationFrame(() =>
                        (switcherRef.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]') ??
                          switcherRef.current?.querySelector<HTMLButtonElement>('button'))?.focus(),
                      ),
                    )
                  }
                }}
                aria-haspopup="dialog"
                aria-expanded={switcherOpen}
                aria-describedby={hintId}
                className="flex min-w-0 items-center gap-2 rounded-lg p-0.5 text-[15px] font-medium whitespace-nowrap text-black hover:bg-white/60"
              >
                <WorkspaceIcon team={workspace} />
                {collapsed ? <span className="sr-only">{workspace.name} 홈</span> : <span className="truncate">{workspace.name}</span>}
                {!collapsed && <span className="sr-only"> 홈</span>}
              </Link>
              <span id={hintId} className="sr-only">
                아래 화살표를 누르면 워크스페이스를 바꿀 수 있어요
              </span>
            </div>
          </Popover.Anchor>
          <Popover.Portal>
            <Popover.Content
              ref={switcherRef}
              side={collapsed ? 'right' : 'bottom'}
              align="start"
              sideOffset={collapsed ? 10 : 6}
              collisionPadding={12}
              onMouseEnter={openSwitcher}
              onMouseLeave={closeSwitcherSoon}
              // 마우스로 열 때는 포커스를 옮기지 않아요 (키보드로 열 때는 onKeyDown 에서 지금 항목으로)
              onOpenAutoFocus={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => {
                // 키보드로 열었으면 닫을 때 워크스페이스 아이콘으로 포커스를 돌려줘요
                e.preventDefault()
                if (openedByKeyboard.current) homeLinkRef.current?.focus()
              }}
              aria-label="워크스페이스 선택"
              className="z-50 flex w-[300px] max-w-[calc(100vw-24px)] flex-col gap-3 rounded-[20px] bg-black px-1.5 py-2 shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
            >
              <div className="flex flex-col gap-0.5">
                <p className="p-2.5 text-base font-semibold text-white">워크스페이스</p>
                <ul className="flex flex-col gap-1">
                  {teams.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        aria-pressed={t.id === workspace.id}
                        onClick={() => {
                          changeWorkspace(t.id)
                          setSwitcherOpen(false)
                          homeLinkRef.current?.focus()
                        }}
                        className="flex h-11 w-full cursor-pointer items-center gap-3.5 rounded-[10px] px-2 text-left text-[13px] font-medium text-white outline-none hover:bg-[#464646] focus-visible:bg-[#464646] focus-visible:outline-2 focus-visible:outline-white aria-pressed:bg-[#464646]"
                      >
                        <WorkspaceIcon team={t} size={32} />
                        <span className="flex-1">{t.name}</span>
                        {t.id === workspace.id && <span aria-hidden>✓</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                className="flex h-11 w-full cursor-pointer items-center gap-3.5 rounded-[10px] px-2 text-[13px] font-medium text-white outline-none hover:bg-[#464646] focus-visible:bg-[#464646] focus-visible:outline-2 focus-visible:outline-white"
              >
                <img src={iconPlus} alt="" width={18} height={18} />
                워크스페이스 추가하기
              </button>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
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
        <label className="flex items-center gap-2 rounded-xl bg-web-search px-2.5 py-3">
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
                onClick={onClose}
                title={collapsed ? m.label : undefined}
                className={({ isActive }) =>
                  `relative flex items-center rounded-xl text-[15px] font-medium tracking-[-0.3px] whitespace-nowrap text-black ${
                    collapsed ? 'size-11 justify-center' : 'gap-2 px-1 py-1'
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
      <p role="status" className="sr-only">
        {announce}
      </p>
    </nav>
  )
}
