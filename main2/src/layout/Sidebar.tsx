// Figma: Sidebar (Section 3 · warm, 1123:7417) — 짙은 갈색 틀 위 사이드바.
//   위쪽 묶음(둥근 어두운 패널): 팀 스페이스 이름 + 시작하기 · 메인보드 · 알림 (동그란 아이콘 + 알약 모양 메뉴)
//   그 아래: 원정대(방) / 도구 / 맨 아래 나
// 모양 3가지 (AppLayout · useSidebar 가 정함)
//  - 펼침: 피그마 그대로 (폭 --sidebar-w, 기본 240px)
//  - 접힘(collapsed): 얇은 사이드바 (64px). 주 메뉴는 동그란 아이콘만, 방은 점만 — 이름은 화면낭독기 글자 + 툴팁(title)
//    ※ 접힌 모양은 피그마에 없어 기존 웹의 "줄이기" 동작을 그대로 가져온 것
//  - 서랍(drawer): 모바일에서 ☰ 로 여는 메뉴. 펼침과 같고 닫기 버튼 · 메뉴를 고르면 닫힘
// 숫자: 알림 = 안 읽은 알림 수 · 방 = 아직 안 끝난 넘겨주기 카드 수 (둘 다 저장소에서 계산)
// 팀 스페이스 이름 · 맨 아래 내 이름을 누르면 작은 메뉴가 열려요 (Radix DropdownMenu — 방향키 · Enter · Esc)
import * as Menu from '@radix-ui/react-dropdown-menu'
import type { ReactNode, Ref } from 'react'
import { NavLink } from 'react-router-dom'
import { ROLE, ROOMS } from '@/data/mock'
import { useUnreadCount } from '@/data/notificationStore'
import { isOpen, useRequests } from '@/data/requestStore'
import { selectWorkspace, signOut, useSession, useWorkspace } from '@/data/sessionStore'
import { Avatar, Mono } from '@/ui'
import { useToast } from '@/ui/toast'
import iconDropdown from '@/assets/icon-dropdown.svg'
import iconStart from '@/assets/icon-start.svg'
import iconBoard from '@/assets/icon-board.svg'
import iconBell from '@/assets/icon-bell.svg'
import dotsAll from '@/assets/dots-all.svg'
import iconA11y from '@/assets/icon-a11y.svg'

interface SidebarProps {
  collapsed?: boolean
  /** 서랍 모드: 닫기 버튼과 메뉴 선택 시 호출 */
  onClose?: () => void
  /** 사용자가 경계를 끌어 정한 펼친 폭 */
  width?: number
  /** 폭 바뀔 때 부드럽게 (끄는 중에는 끔) */
  animate?: boolean
  ref?: Ref<HTMLElement>
}

// 지금 화면인 메뉴: 왼쪽이 밝은 가로 그라데이션 알약 + 옅은 테두리
const ACTIVE = 'border-white/[0.08] bg-linear-to-r from-white/[0.22] to-white/[0.02] text-white'
const IDLE = 'border-transparent text-white/[0.72] hover:bg-white/[0.06]'

/** 주 메뉴 줄 (시작하기 · 메인보드 · 알림): 동그란 아이콘(40px) + 이름 */
function mainRowClass(collapsed: boolean, active: boolean) {
  return `relative flex items-center rounded-full border text-sm font-medium whitespace-nowrap ${
    collapsed ? 'size-[42px] justify-center' : 'w-full justify-between py-1 pr-3 pl-1'
  } ${active ? ACTIVE : IDLE}`
}

/** 방 · 도구 줄: 점(또는 작은 아이콘) + 이름 */
function rowClass(collapsed: boolean, active: boolean) {
  return `relative flex items-center rounded-full border text-sm font-medium whitespace-nowrap ${
    collapsed ? 'size-10 justify-center' : 'w-full justify-between p-2.5'
  } ${active ? ACTIVE : IDLE}`
}

function IconCircle({ src, active }: { src: string; active: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex size-10 shrink-0 items-center justify-center rounded-full border ${
        active ? 'border-white/[0.18] bg-white/[0.28]' : 'border-white/[0.05] bg-white/[0.08]'
      }`}
    >
      <img src={src} alt="" width={18} height={18} />
    </span>
  )
}

// 작은 메뉴(드롭다운) 모양 — 시작하기의 팝오버와 같은 면 · 테두리. 서랍(z-50) 위에도 보이게 z-60
const MENU = 'z-[60] min-w-[200px] max-w-[280px] rounded-2xl border border-line bg-surface p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.5)] outline-none'
const MENU_ITEM =
  'flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium outline-none select-none data-[highlighted]:bg-fill-3'
const MENU_LABEL = 'px-2.5 pt-1.5 pb-1 text-[11px] font-medium text-muted'

function SectionLabel({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  if (collapsed) return <div aria-hidden className="mx-auto mt-3 mb-1 h-px w-6 bg-line" />
  return <p className="px-2.5 pt-[18px] pb-1.5 text-xs font-medium text-muted">{children}</p>
}

const MAIN_MENU = [
  { to: '/start', label: '시작하기', icon: iconStart },
  { to: '/board', label: '메인보드', icon: iconBoard },
  { to: '/notifications', label: '알림', icon: iconBell },
] as const

export function Sidebar({ collapsed = false, onClose, width, animate = true, ref }: SidebarProps) {
  const drawer = !!onClose
  const toast = useToast()
  const user = useSession()?.user
  const workspace = useWorkspace()
  // 알림 배지: 안 읽은 알림 수 (로그인 전에는 없음)
  const unreadAll = useUnreadCount()
  const unread = user ? unreadAll : 0
  // 방 숫자: 아직 확인이 안 끝난 넘겨주기 카드 중 그 방이 보내거나 받는 것 (전체 = 모두)
  const open = useRequests().filter(isOpen)
  const roomCount = (id: (typeof ROOMS)[number]['id']) => (id === 'all' ? open.length : open.filter((c) => c.fromRole === id || c.toRole === id).length)

  return (
    <nav
      ref={ref}
      aria-label="주 메뉴"
      style={!collapsed && !drawer && width ? { width } : undefined}
      className={`theme-dark flex h-full shrink-0 flex-col gap-4 overflow-x-hidden overflow-y-auto bg-nav py-3 ${animate ? 'transition-[width] duration-200' : ''} ${
        collapsed ? 'w-16 items-center px-2' : drawer ? 'w-full px-3' : 'w-(--sidebar-w) px-3'
      }`}
    >
      {/* 위쪽 묶음: 팀 스페이스 + 주 메뉴 (둥근 어두운 패널) */}
      <div className={`panel-dark flex w-full flex-col gap-4 rounded-[32px] ${collapsed ? 'items-center px-0.5 py-1' : 'px-2 pt-6 pb-2'}`}>
        {!collapsed && (
          <div className="flex w-full items-center justify-between px-2">
            {user ? (
              // 팀 스페이스 고르기 (이름만 바뀌어요 — 스페이스별 데이터는 서버가 붙은 뒤)
              <Menu.Root>
                <Menu.Trigger className="flex min-w-0 items-center gap-1.5 rounded-lg text-sm font-medium text-white">
                  <span className="truncate">{workspace.current.name}</span>
                  <img src={iconDropdown} alt="" width={19} height={19} className="shrink-0" />
                  <span className="sr-only">, 팀 스페이스 바꾸기</span>
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Content align="start" sideOffset={8} className={`theme-dark ${MENU}`}>
                    <Menu.Label className={MENU_LABEL}>팀 스페이스</Menu.Label>
                    <Menu.RadioGroup
                      value={workspace.current.id}
                      onValueChange={(id) => {
                        if (id === workspace.current.id) return
                        selectWorkspace(id)
                        toast(`팀 스페이스를 바꿨어요 · ${workspace.list.find((w) => w.id === id)?.name ?? ''}`)
                      }}
                    >
                      {workspace.list.map((w) => (
                        <Menu.RadioItem key={w.id} value={w.id} className={`${MENU_ITEM} text-ink`}>
                          <span className="min-w-0 flex-1 truncate">{w.name}</span>
                          <Menu.ItemIndicator className="shrink-0 text-summit">
                            <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2.5 7.5l3 3 6-7" />
                            </svg>
                          </Menu.ItemIndicator>
                        </Menu.RadioItem>
                      ))}
                    </Menu.RadioGroup>
                    <Menu.Separator className="mx-1 my-1.5 h-px bg-line" />
                    {/* 새 스페이스 만들기는 서버가 있어야 해서 흐리게 두고, 누르면 이유를 알려 줌 */}
                    <Menu.Item onSelect={() => toast('팀 스페이스 추가는 서버가 연결된 뒤에 할 수 있어요')} className={`${MENU_ITEM} text-muted`}>
                      <span aria-hidden>+</span>
                      팀 스페이스 추가하기
                      <span className="sr-only"> (서버 연결 뒤에 가능)</span>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Portal>
              </Menu.Root>
            ) : (
              <p className="truncate text-sm font-medium text-white">{workspace.current.name}</p>
            )}
            {drawer && (
              <button type="button" onClick={onClose} aria-label="메뉴 닫기" className="-my-2 flex size-10 shrink-0 items-center justify-center rounded-full text-ink hover:bg-white/[0.06]">
                <svg aria-hidden width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* 주 메뉴 */}
        <ul className={`flex w-full flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
          {MAIN_MENU.map((m) => {
            const badge = m.to === '/notifications' ? unread : 0
            return (
              <li key={m.to}>
                <NavLink
                  to={m.to}
                  onClick={onClose}
                  title={collapsed ? (badge > 0 ? `${m.label} ${badge}개` : m.label) : undefined}
                  className={({ isActive }) => mainRowClass(collapsed, isActive)}
                >
                  {({ isActive }) => (
                    <>
                      <span className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                        <IconCircle src={m.icon} active={isActive} />
                        {collapsed ? <span className="sr-only">{m.label}</span> : m.label}
                      </span>
                      {badge > 0 &&
                        (collapsed ? (
                          <span aria-hidden className="absolute top-1 right-1 size-1.5 rounded-full bg-danger" />
                        ) : (
                          <Mono className="px-1.5 text-[10px] text-danger">{badge}</Mono>
                        ))}
                      {badge > 0 && <span className="sr-only">, 새 알림 {badge}개</span>}
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </div>

      {/* 원정대 (방) */}
      <div className="w-full">
        <SectionLabel collapsed={collapsed}>원정대</SectionLabel>
        <ul className={`flex flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
          {ROOMS.map((room) => {
            const count = roomCount(room.id)
            return (
              <li key={room.id}>
                <NavLink to={room.path} onClick={onClose} title={collapsed ? `${room.label} · ${count}` : undefined} className={({ isActive }) => rowClass(collapsed, isActive)}>
                  <span className={`flex items-center ${collapsed ? '' : 'gap-2.5'}`}>
                    {room.id === 'all' ? (
                      <img src={dotsAll} alt="" width={16} height={4} className="shrink-0" />
                    ) : (
                      <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: ROLE[room.id].color }} />
                    )}
                    {collapsed ? <span className="sr-only">{room.label}</span> : room.label}
                  </span>
                  {!collapsed && <Mono className="px-1.5 text-[10px] text-faint">{count}</Mono>}
                  <span className="sr-only">, 진행 중인 넘겨주기 {count}개</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </div>

      {/* 도구 */}
      <div className="w-full">
        <SectionLabel collapsed={collapsed}>도구</SectionLabel>
        <ul className={`flex flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
          <li>
            <NavLink to="/a11y" onClick={onClose} title={collapsed ? '웹 접근성 검사' : undefined} className={({ isActive }) => rowClass(collapsed, isActive)}>
              <span className={`flex items-center ${collapsed ? '' : 'gap-2.5'}`}>
                <img src={iconA11y} alt="" width={12} height={12} className="shrink-0" />
                {collapsed ? <span className="sr-only">웹 접근성 검사</span> : '웹 접근성 검사'}
              </span>
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="min-h-px flex-1" />

      {/* 나 — 누르면 이름 · 역할과 로그아웃 (로그인 전에는 없음) */}
      {user && (
        <Menu.Root>
          <Menu.Trigger
            title={collapsed ? user.name : undefined}
            className={`flex shrink-0 items-center gap-2.5 text-left hover:bg-white/[0.1] ${
              collapsed ? 'size-10 justify-center rounded-full' : 'w-full rounded-3xl border border-white/[0.06] bg-white/[0.06] p-2'
            }`}
          >
            <Avatar name={user.name} size={32} />
            {collapsed ? <span className="sr-only">{user.name}</span> : <span className="truncate text-[13px] font-medium text-white">{user.name}</span>}
            <span className="sr-only">, 내 계정 메뉴</span>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content align="start" side="top" sideOffset={8} className={`theme-dark ${MENU}`}>
              <div className="flex items-center gap-2.5 px-2.5 py-2">
                <Avatar name={user.name} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[13px] font-semibold text-ink">{user.name}</span>
                  <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
                    <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: ROLE[user.role].color }} />
                    <span className="shrink-0">{ROLE[user.role].label}</span>
                    {user.email && <span className="truncate">· {user.email}</span>}
                  </span>
                </div>
              </div>
              <Menu.Separator className="mx-1 my-1.5 h-px bg-line" />
              <Menu.Item
                onSelect={() => {
                  // 세션을 지우면 라우터가 로그인 화면으로 보냄 (router.tsx 의 RequireAuth)
                  onClose?.()
                  signOut()
                  toast('로그아웃했어요')
                }}
                className={`${MENU_ITEM} text-ink`}
              >
                로그아웃
              </Menu.Item>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      )}
    </nav>
  )
}
