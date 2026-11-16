// 웹 공통 틀: 왼쪽 사이드바 + 본문. 헤더는 페이지마다 내용이 달라서 각 페이지에서 <Header /> 를 넣습니다.
// 확대·축소 없이 실제 크기(1:1)로 그리고, 어떤 화면 폭에서도 유동적으로 바뀝니다.
//  - 사이드바: 1280px 이상 펼침 · 768~1279px 아이콘만 · 768px 미만 숨김(위쪽 ☰ → 서랍)  — useSidebar
//  - 스크롤은 본문(main) 하나만. 페이지 전체(body)는 스크롤되지 않게 화면 높이에 고정해서 "이중 스크롤"을 막아요.
//  - 본문은 container query 기준(@container)이라 안쪽 화면은 "본문 폭"에 따라 단을 바꿔요 (예: @4xl:grid-cols-2).
import * as Dialog from '@radix-ui/react-dialog'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { useSidebar } from './useSidebar'

function MenuIcon() {
  return (
    <svg aria-hidden width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3.5 6h15M3.5 11h15M3.5 16h15" />
    </svg>
  )
}

export function WebLayout() {
  const { mobile, collapsed, toggle, drawerOpen, setDrawerOpen } = useSidebar()

  return (
    <div className="relative flex h-dvh overflow-hidden bg-web-bg">
      <a href="#main" className="sr-only-focusable rounded bg-black px-3 py-2 text-white">
        본문으로 건너뛰기
      </a>

      {!mobile && <Navbar collapsed={collapsed} onToggle={toggle} />}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {mobile && (
          <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            {/* 모바일 위쪽 바: ☰ 메뉴 + 서비스 이름 */}
            <div className="flex h-14 shrink-0 items-center gap-2 border-b border-web-header-line bg-white px-3 font-pretendard">
              <Dialog.Trigger aria-label="메뉴 열기" className="flex size-10 items-center justify-center rounded-lg text-ink-2 hover:bg-web-chip">
                <MenuIcon />
              </Dialog.Trigger>
              <span className="text-base font-semibold text-ink-2">A11y Translator</span>
            </div>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
              <Dialog.Content
                aria-describedby={undefined}
                className="fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] shadow-[4px_0_24px_rgba(0,0,0,0.18)] outline-none"
              >
                <Dialog.Title className="sr-only">주 메뉴</Dialog.Title>
                <Navbar onClose={() => setDrawerOpen(false)} />
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
        {/* relative: 화면낭독기용 숨김 글자(sr-only, position:absolute)가 본문 밖 페이지 기준으로 자리 잡아
            페이지 전체에 스크롤이 하나 더 생기던 문제(이중 스크롤)를 막아요 */}
        {/* overflow-x-hidden: 말줄임된 글자 뒤의 숨김 글자 같은 1px 요소 때문에 가로 스크롤이 생기지 않게 (넓은 표는 표 안에서 스크롤) */}
        <main id="main" className="@container relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
