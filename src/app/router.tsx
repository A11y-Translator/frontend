// 전체 주소 목록. 웹 화면은 WebLayout(네비) 안에, 로그인·확장 데모는 바깥에 둡니다.
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { WebLayout } from '@/web/layout/WebLayout'
import LoginPage from '@/web/pages/auth/LoginPage'
import ProjectHomePage from '@/web/pages/home/ProjectHomePage'
import ProjectEmptyPage from '@/web/pages/home/ProjectEmptyPage'
import InspectionResultPage from '@/web/pages/inspection/InspectionResultPage'
import IssueDetailPage from '@/web/pages/issue/IssueDetailPage'
import TodoPage from '@/web/pages/todo/TodoPage'
import VersionReportPage from '@/web/pages/report/VersionReportPage'
import TeamMembersPage from '@/web/pages/members/TeamMembersPage'
import SettingsPage from '@/web/pages/settings/SettingsPage'
import ExtensionDemoPage from '@/extension/demo/ExtensionDemoPage'
import PanelApp from '@/extension/PanelApp'
import { DemoIndex } from './DemoIndex'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <WebLayout />,
    children: [
      { path: '/', element: <ProjectHomePage /> },
      { path: '/projects/new', element: <ProjectEmptyPage /> },
      { path: '/projects/:projectId/inspection', element: <InspectionResultPage /> },
      { path: '/issues/:issueId', element: <IssueDetailPage /> },
      { path: '/todo', element: <Navigate to="/todo/mine" replace /> },
      { path: '/todo/:tab', element: <TodoPage /> },
      { path: '/report', element: <VersionReportPage /> },
      { path: '/members', element: <TeamMembersPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  // ① 크롬 확장: 가짜 브라우저 + 사이트 + 사이드 패널 데모
  { path: '/extension', element: <ExtensionDemoPage /> },
  // 실제 사이드 패널이 보여줄 화면만 단독으로 (나중에 확장 sidepanel.html 이 이걸 렌더)
  { path: '/extension/panel', element: <div className="h-screen w-[360px]"><PanelApp /></div> },
  // 화면 목록 (개발·시연용)
  { path: '/demo', element: <DemoIndex /> },
])
