// Figma: Sidebar (970:605) — 검은 사이드바. 시작하기 · 메인보드 · 알림 / 원정대(방) / 도구 / 나
// 모양 3가지 (AppLayout · useSidebar 가 정함)
//  - 펼침: 피그마 그대로 (폭 --sidebar-w, 기본 220px)
//  - 접힘(collapsed): 얇은 사이드바 (64px). 메뉴는 짧은 표시(점·첫 글자)만, 이름은 화면낭독기 글자 + 툴팁(title)
//    ※ 접힌 모양은 피그마에 없어 기존 웹의 "줄이기" 동작을 그대로 가져온 것
//  - 서랍(drawer): 모바일에서 ☰ 로 여는 메뉴. 펼침과 같고 닫기 버튼 · 메뉴를 고르면 닫힘
// 숫자: 알림 = 안 읽은 알림 수 · 방 = 아직 안 끝난 넘겨주기 카드 수 (둘 다 저장소에서 계산)
// 팀 스페이스 이름 · 맨 아래 내 이름을 누르면 작은 메뉴가 열려요 (Radix DropdownMenu — 방향키 · Enter · Esc)
import * as Menu from '@radix-ui/react-dropdown-menu'
import type { ReactNode, Ref } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ROLE, ROOMS } from '@/data/mock'
import { useUnreadCount } from '@/data/notificationStore'
import { isOpen, useRequests } from '@/data/requestStore'
import { selectWorkspace, signOut, useSession, useWorkspace } from '@/data/sessionStore'
import { Avatar, Mono } from '@/ui'
import { useToast } from '@/ui/toast'
import workspaceAvatar from '@/assets/workspace-avatar.svg'
import iconDropdown from '@/assets/icon-dropdown.svg'
import iconNotice from '@/assets/icon-notice.svg'
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
  /** 로그인 전 화면: 워크스페이스 이름 대신 서비스 이름 */
  workspaceName?: string
  ref?: Ref<HTMLElement>
}

const ROW = 'relative flex items-center rounded-lg text-sm font-medium whitespace-nowrap'

function rowClass(collapsed: boolean, active: boolean) {
  return `${ROW} ${collapsed ? 'size-10 justify-center' : 'w-full justify-between p-2.5'} ${
    active ? 'bg-menu-active text-summit' : 'text-ink hover:bg-white/[0.06]'
  }`
}

// 작은 메뉴(드롭다운) 모양 — 시작하기의 팝오버와 같은 면 · 테두리. 서랍(z-50) 위에도 보이게 z-60
const MENU = 'z-[60] min-w-[200px] max-w-[280px] rounded-2xl border border-line bg-surface p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.5)] outline-none'
const MENU_ITEM =
  'flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium outline-none select-none data-[highlighted]:bg-fill-3'
const MENU_LABEL = 'px-2.5 pt-1.5 pb-1 text-[11px] font-medium text-muted'

/** 접힌 사이드바에서 메뉴 이름 대신 보이는 한 글자 */
function Initial({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden className="text-[13px] font-semibold">
      {children}
    </span>
  )
}

function SectionLabel({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  if (collapsed) return <div aria-hidden className="mx-auto mt-3 mb-1 h-px w-6 bg-line" />
  return <p className="px-2.5 pt-[18px] pb-1.5 text-xs font-medium text-muted">{children}</p>
}

export function Sidebar({ collapsed = false, onClose, width, animate = true, workspaceName, ref }: SidebarProps) {
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
  const name = workspaceName ?? workspace.current.name
  // 로그인 화면도 '시작하기' 흐름의 첫 단계라 같은 메뉴를 강조 (피그마 시작하기/login)
  const inStart = useLocation().pathname === '/login'

  return (
    <nav
      ref={ref}
      aria-label="주 메뉴"
      style={!collapsed && !drawer && width ? { width } : undefined}
      className={`flex h-full shrink-0 flex-col gap-4 overflow-x-hidden overflow-y-auto bg-nav pt-6 pb-5 ${animate ? 'transition-[width] duration-200' : ''} ${
        collapsed ? 'w-16 items-center px-2' : drawer ? 'w-full px-3' : 'w-(--sidebar-w) px-3'
      }`}
    >
      {/* 워크스페이스 + 알림 */}
      <div className={`flex w-full items-center ${collapsed ? 'flex-col gap-1' : 'justify-between'}`}>
        <div className={`flex min-w-0 items-center ${collapsed ? '' : 'gap-1.5'}`}>
          {/* 로고(동그라미)를 누르면 메인 화면(메인보드)으로 */}
          <NavLink to="/board" onClick={onClose} aria-label="메인보드로 가기" title="메인보드로 가기" className="shrink-0 rounded-full hover:brightness-90">
            <img src={workspaceAvatar} alt="" width={28} height={28} />
          </NavLink>
          {!collapsed &&
            (user && !workspaceName ? (
              // 팀 스페이스 고르기 (이름만 바뀌어요 — 스페이스별 데이터는 서버가 붙은 뒤)
              <Menu.Root>
                <Menu.Trigger className="flex min-w-0 items-center gap-1.5 rounded-lg text-sm font-semibold text-ink">
                  <span className="truncate">{name}</span>
                  <img src={iconDropdown} alt="" width={19} height={19} className="shrink-0" />
                  <span className="sr-only">, 팀 스페이스 바꾸기</span>
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Content align="start" sideOffset={8} className={MENU}>
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
              // 로그인 전: 서비스 이름만 (피그마 시작하기/login 모양 그대로)
              <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-ink">
                <span className="truncate">{name}</span>
                <img src={iconDropdown} alt="" width={19} height={19} className="shrink-0" />
              </p>
            ))}
        </div>
        <div className="flex shrink-0 items-center">
          <NavLink
            to="/notifications"
            onClick={onClose}
            aria-label={unread > 0 ? `알림, 새 알림 ${unread}개` : '알림'}
            title={collapsed ? '알림' : undefined}
            className="relative flex size-10 items-center justify-center rounded-lg hover:bg-white/[0.06]"
          >
            <img src={iconNotice} alt="" width={24} height={24} />
            {unread > 0 && <span aria-hidden className="absolute top-2 right-2 size-1.5 rounded-full bg-danger" />}
          </NavLink>
          {drawer && (
            <button type="button" onClick={onClose} aria-label="메뉴 닫기" className="flex size-10 items-center justify-center rounded-lg text-ink hover:bg-white/[0.06]">
              <svg aria-hidden width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 주 메뉴 */}
      <ul className={`flex w-full flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
        <li>
          <NavLink to="/start" onClick={onClose} title={collapsed ? '시작하기' : undefined} className={({ isActive }) => rowClass(collapsed, isActive || inStart)}>
            {collapsed ? (
              <>
                <Initial>시</Initial>
                <span className="sr-only">시작하기</span>
              </>
            ) : (
              '시작하기'
            )}
          </NavLink>
        </li>
        <li>
          <NavLink to="/board" onClick={onClose} title={collapsed ? '메인보드' : undefined} className={({ isActive }) => rowClass(collapsed, isActive)}>
            {collapsed ? (
              <>
                <Initial>메</Initial>
                <span className="sr-only">메인보드</span>
              </>
            ) : (
              '메인보드'
            )}
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/notifications"
            onClick={onClose}
            title={collapsed ? (unread > 0 ? `알림 ${unread}개` : '알림') : undefined}
            className={({ isActive }) => rowClass(collapsed, isActive)}
          >
            {collapsed ? (
              <>
                <Initial>알</Initial>
                <span className="sr-only">알림</span>
                {unread > 0 && <span aria-hidden className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-danger" />}
              </>
            ) : (
              <>
                알림
                {unread > 0 && <Mono className="px-1.5 text-[10px] text-danger">{unread}</Mono>}
              </>
            )}
            {unread > 0 && <span className="sr-only">, 새 알림 {unread}개</span>}
          </NavLink>
        </li>
      </ul>

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
            className={`flex shrink-0 items-center gap-2.5 rounded-lg text-left hover:bg-white/[0.06] ${collapsed ? 'size-10 justify-center' : 'w-full p-2'}`}
          >
            <Avatar name={user.name} />
            {collapsed ? <span className="sr-only">{user.name}</span> : <span className="truncate text-[13px] font-medium text-ink">{user.name}</span>}
            <span className="sr-only">, 내 계정 메뉴</span>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content align="start" side="top" sideOffset={8} className={MENU}>
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
