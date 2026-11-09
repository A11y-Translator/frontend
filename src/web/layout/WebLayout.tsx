// 웹 공통 틀: 왼쪽 네비(280px) + 본문. 헤더는 페이지마다 내용이 달라서 각 페이지에서 <Header /> 를 넣습니다.
// FitStage: 디자인 기준(1440 × 820)보다 창이 작으면 같은 비율로 줄여 한 화면에 보이게 하고,
// 큰 화면에서도 최대 85% 로 보여 일반 웹 크기감에 맞춥니다. 내용은 page-x 로 최대 1100px, 화면 가운데 정렬.
import { Outlet } from 'react-router-dom'
import { FitStage } from '@/shared/ui/FitStage'
import { Navbar } from './Navbar'

const WEB_DESIGN = { width: 1440, height: 820 }

export function WebLayout() {
  return (
    <FitStage designWidth={WEB_DESIGN.width} designHeight={WEB_DESIGN.height} maxScale={0.85} className="flex bg-web-bg">
      <a href="#main" className="sr-only-focusable rounded bg-black px-3 py-2 text-white">
        본문으로 건너뛰기
      </a>
      <Navbar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main id="main" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </FitStage>
  )
}
