// 주소(URL) ↔ 화면 연결표. 피그마 "최종 3 · 다듬음" 의 프레임 이름을 옆에 적어 둡니다.
import { useState, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useSession } from '@/data/sessionStore'
import { AppLayout } from '@/layout/AppLayout'
import { LoginPage } from '@/pages/start/LoginPage'
import { StartPage } from '@/pages/start/StartPage'
import { RouteMapPage } from '@/pages/start/RouteMapPage'
import { MainBoardPage } from '@/pages/board/MainBoardPage'
import { RouteDetailPage } from '@/pages/board/RouteDetailPage'
import { FlowPage } from '@/pages/flow/FlowPage'
import { AllRoomPage } from '@/pages/rooms/AllRoomPage'
import { DesignRoomPage } from '@/pages/rooms/DesignRoomPage'
import { FrontRoomPage } from '@/pages/rooms/FrontRoomPage'
import { BackRoomPage } from '@/pages/rooms/BackRoomPage'
import { VersionComparePage } from '@/pages/compare/VersionComparePage'
import { VersionCompareSimplePage } from '@/pages/compare/VersionCompareSimplePage'
import { RequestSendPage } from '@/pages/request/RequestSendPage'
import { RequestDetailPage } from '@/pages/request/RequestDetailPage'
import { RequestProgressPage } from '@/pages/request/RequestProgressPage'
import { RequestReviewPage } from '@/pages/request/RequestReviewPage'
import { A11yPage } from '@/pages/a11y/A11yPage'
import { ComingSoon } from '@/pages/misc/ComingSoonPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'

/* ───────── 로그인 확인 (data/sessionStore) ───────── */

/** 로그인해야 볼 수 있는 화면: 로그아웃 상태면(또는 로그아웃하는 순간) 로그인으로 */
function RequireAuth({ children }: { children: ReactNode }) {
  return useSession() ? children : <Navigate to="/login" replace />
}

/** 로그인 화면: 이미 로그인한 채로 들어오면 메인보드로, 여기서 방금 로그인했으면 시작하기로 */
function GuestOnly({ children }: { children: ReactNode }) {
  const session = useSession()
  const [wasSignedIn] = useState(() => session !== null)
  if (!session) return children
  return <Navigate to={wasSignedIn ? '/board' : '/start'} replace />
}

/** 첫 주소(/): 로그인했으면 메인보드, 아니면 로그인 */
function Home() {
  return <Navigate to={useSession() ? '/board' : '/login'} replace />
}

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  {
    // 로그인 전: 배경 사진이 밝게 보이고, 사이드바 이름은 "오름"
    element: (
      <GuestOnly>
        <AppLayout dim={0.3} workspaceName="오름" />
      </GuestOnly>
    ),
    children: [{ path: '/login', element: <LoginPage /> }], // 시작하기/login
  },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { path: '/start', element: <StartPage /> }, // 시작하기/default
      { path: '/start/route', element: <RouteMapPage /> }, // 시작하기/map (추천 루트 · 3D 산)
      { path: '/board', element: <MainBoardPage /> }, // 01 메인 (+ Sheet · 2구간 할 일 추천)
      { path: '/flow', element: <FlowPage /> }, // 01-2 흐름 · 노드 보기 (흐름 전체 보기)
      { path: '/route', element: <RouteDetailPage /> }, // (예전 01-2) 원정대 흐름 · 산길 보기
      { path: '/rooms/all', element: <AllRoomPage /> }, // 11 전체 방
      { path: '/rooms/design', element: <DesignRoomPage /> }, // 03 디자인 방
      { path: '/rooms/front', element: <FrontRoomPage /> }, // 05 프론트 방 · GitHub 연결
      { path: '/rooms/front/compare', element: <VersionComparePage /> }, // 07 프론트 방 · 버전 비교
      { path: '/rooms/front/compare-simple', element: <VersionCompareSimplePage /> }, // 07-2 버전 비교 (심플)
      { path: '/rooms/back', element: <BackRoomPage /> }, // (디자인 없음 → 07-2 상태 화면 활용)
      { path: '/requests/new', element: <RequestSendPage /> }, // 06 요청 보내기
      { path: '/requests/:id', element: <RequestDetailPage /> }, // 10 요청 상세 · 전체 흐름
      { path: '/requests/:id/progress', element: <RequestProgressPage /> }, // 08 진행 · 완료 알리기
      { path: '/requests/:id/review', element: <RequestReviewPage /> }, // 09 확인 · 수정 요청
      { path: '/notifications', element: <NotificationsPage /> }, // (디자인 없음) 알림 — 넘겨주기 카드 기록에서 만든 목록
      { path: '/a11y', element: <A11yPage /> }, // (디자인 없음) 전에 만든 A11y Translator(main1)를 끼워 넣어 연결
      { path: '*', element: <ComingSoon title="페이지를 찾을 수 없어요" note="주소를 다시 확인해 주세요." /> },
    ],
  },
])
