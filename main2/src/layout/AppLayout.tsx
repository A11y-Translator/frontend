// 공통 틀: 왼쪽 검은 사이드바 + 본문(종이색 바탕 · Figma 밝은 테마).
// 로그인 화면만 산 사진 배경 + 어두운 막을 씁니다 (dim 을 넘길 때 · 화면 전체가 .theme-dark).
// 확대·축소 없이 실제 크기(1:1)로 그리고, 어떤 화면 폭에서도 유동적으로 바뀝니다. (기존 웹과 같은 규칙)
//  - 사이드바: 1280px 이상 펼침 · 768~1279px 접힘 · 768px 미만 숨김(위쪽 ☰ → 서랍)  — useSidebar
//    경계를 마우스로 끌어 폭 조절, 아주 좁게 끌면 접힘 (SidebarResizer · 키보드 ←/→ · Enter)
//  - 스크롤은 본문(main) 하나만. 페이지 전체(body)는 화면 높이에 고정.
//  - 본문은 container query 기준(@container)이라 안쪽 화면은 "본문 폭"에 따라 단을 바꿔요 (예: @4xl:grid-cols-2).
import * as Dialog from '@radix-ui/react-dialog'
import { useRef, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import bgMountain from '@/assets/bg-mountain.jpg'
import { Sidebar } from './Sidebar'
import { SidebarResizer } from './SidebarResizer'
import { useSidebar } from './useSidebar'

interface Props {
  /** 있으면 산 사진 배경 + 이 진하기의 어두운 막 (로그인 0.3). 없으면 종이색 바탕 */
  dim?: number
  /** 사이드바 맨 위 이름 (로그인 전에는 서비스 이름 "오름") */
  workspaceName?: string
}

export function AppLayout({ dim, workspaceName }: Props) {
  const photo = dim !== undefined
  const { mobile, collapsed, setCollapsed, width, setWidth, drawerOpen, setDrawerOpen } = useSidebar()
  const navRef = useRef<HTMLElement>(null)
  const [resizing, setResizing] = useState(false)

  return (
    <div className={`relative flex h-dvh overflow-hidden bg-canvas ${photo ? 'theme-dark' : ''}`}>
      <a href="#main" className="sr-only-focusable rounded bg-primary px-3 py-2 text-on-primary">
        본문으로 건너뛰기
      </a>

      {!mobile && (
        <div className={`relative z-10 flex shrink-0 ${resizing ? 'cursor-col-resize select-none' : ''}`}>
          <Sidebar ref={navRef} collapsed={collapsed} width={collapsed ? undefined : (width ?? undefined)} animate={!resizing} workspaceName={workspaceName} />
          <SidebarResizer navRef={navRef} collapsed={collapsed} setCollapsed={setCollapsed} setWidth={setWidth} onResizingChange={setResizing} />
        </div>
      )}

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* 로그인 화면만: 산 사진 + 어두운 막 (피그마 unsplash 이미지) */}
        {photo && (
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <img src={bgMountain} alt="" className="size-full object-cover" />
            <div className="absolute inset-0 bg-black" style={{ opacity: dim }} />
          </div>
        )}

        {mobile && (
          <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <div className="theme-dark relative flex h-14 shrink-0 items-center gap-2 border-b border-line bg-nav px-3">
              <Dialog.Trigger aria-label="메뉴 열기" className="flex size-10 items-center justify-center rounded-lg text-ink hover:bg-white/[0.06]">
                <svg aria-hidden width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M3.5 6h15M3.5 11h15M3.5 16h15" />
                </svg>
              </Dialog.Trigger>
              <Link to="/board" className="rounded text-base font-semibold text-ink" aria-label="Oreum · 메인보드로 가기">
                Oreum
              </Link>
            </div>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
              <Dialog.Content aria-describedby={undefined} className="fixed inset-y-0 left-0 z-50 w-[260px] max-w-[85vw] shadow-[4px_0_24px_rgba(0,0,0,0.5)] outline-none">
                <Dialog.Title className="sr-only">주 메뉴</Dialog.Title>
                <Sidebar onClose={() => setDrawerOpen(false)} workspaceName={workspaceName} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}

        <main id="main" className="@container relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
