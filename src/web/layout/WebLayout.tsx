// 웹 공통 틀: 왼쪽 네비(280px) + 본문. 헤더는 페이지마다 내용이 달라서 각 페이지에서 <Header /> 를 넣습니다.
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function WebLayout() {
  return (
    <div className="flex h-screen min-w-[1200px] bg-web-bg">
      <a href="#main" className="sr-only-focusable rounded bg-black px-3 py-2 text-white">
        본문으로 건너뛰기
      </a>
      <Navbar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main id="main" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
