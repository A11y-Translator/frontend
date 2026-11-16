// 설치형 확장 · 사이드 패널 진입점 (sidepanel.html 이 불러옴 · Windows 는 파일 이름 대소문자를 구분하지 않아서 화면은 SidePanelApp.tsx)
// 확장 페이지는 외부 글꼴(CDN)을 쓰지 않고 시스템 글꼴로 대신해요 (확장 보안 정책상 바깥 리소스를 줄이려고)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './panel.css'
import SidePanel from './SidePanelApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SidePanel />
  </StrictMode>,
)
