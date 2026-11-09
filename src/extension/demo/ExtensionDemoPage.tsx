// project/overlayed (확장 프로그램 사용 화면) — Figma 533:7113
// 가짜 브라우저 + 사용자 사이트(왼쪽, 오버레이) + 오른쪽에 붙은 사이드 패널(360px)
//
// 데모 흐름
//  1) 패널 로그인 → 검사 결과. 사이트 위에 문제 요소마다 테두리 + 번호 배지 (패널 헤더 "오버레이" 스위치로 끄고 켬)
//  2) 패널 카드 hover/선택 ↔ 사이트 요소 강조·스크롤 / 사이트 배지 클릭 → 패널이 그 이슈 상세로 이동
//  3) 03 에서 추천 색을 고르면 사이트의 '자세히 보기' 글자색이 바로 바뀜 (store.previewFix.i1)
//  4) 브라우저 ↻ = 새로고침 → actions.recheck() → 패널이 07 재검사 화면으로. 고친 이슈는 자동 해결 + 오버레이에서 사라짐
import { useEffect, useRef, useState } from 'react'
import { useAppState } from '@/shared/store'
import PanelApp from '@/extension/PanelApp'
import { startRecheck, type PanelScreen } from '@/extension/panelNav'
import BrowserChrome from './BrowserChrome'
import DemoSite from './DemoSite'

const SITE_URL = 'webA.github.io/A11y'

export default function ExtensionDemoPage() {
  const state = useAppState()
  const [screen, setScreen] = useState<PanelScreen>({ name: 'login' })
  const [overlay, setOverlay] = useState(true)
  const [panelOpen, setPanelOpen] = useState(true)
  const [hovered, setHovered] = useState<string | null>(null)
  const [reloading, setReloading] = useState(false)
  const siteRef = useRef<HTMLDivElement>(null)

  const loggedIn = screen.name !== 'login'
  // 지금 상세로 보고 있는 이슈 → 없으면 목록에서 방금 본 이슈
  const selectedId = screen.name === 'fix' ? screen.issueId : screen.name === 'result' ? screen.selectedId ?? null : null
  const emphasizedId = hovered ?? selectedId

  // 패널에서 이슈를 선택하면 페이지의 해당 요소로 스크롤 (hover 때는 화면이 흔들리지 않도록 스크롤 안 함)
  useEffect(() => {
    if (!selectedId || !siteRef.current) return
    siteRef.current
      .querySelector(`[data-issue-marker="${selectedId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  }, [selectedId])

  const reload = () => {
    setReloading(true)
    window.setTimeout(() => setReloading(false), 600)
    // 로그인 전에는 그냥 새로고침만
    if (loggedIn) {
      setHovered(null)
      setScreen(startRecheck(state.issues, true))
      setPanelOpen(true)
    }
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-white">
      <h1 className="sr-only">A11y Translator 확장 프로그램 데모</h1>
      {/* 데모용: 협업 웹사이트로 돌아가는 링크 (확장 → 웹은 URL 로만 이동) */}
      <a
        href="/"
        className="absolute bottom-4 left-4 z-50 rounded-full bg-black px-4 py-2 font-pretendard text-sm font-semibold text-white shadow-lg hover:bg-[#333]"
      >
        ← 협업 웹으로
      </a>
      <BrowserChrome
        url={SITE_URL}
        tabTitle="Web A 메인"
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((v) => !v)}
        onReload={reload}
        reloading={reloading}
      />
      <div className="flex min-h-0 flex-1">
        <main
          ref={siteRef}
          aria-label="열어둔 사이트: Web A 메인 (데모용, 일부러 접근성 문제를 넣음)"
          className={`relative min-w-0 flex-1 overflow-auto transition-opacity ${reloading ? 'opacity-40' : ''}`}
        >
          <DemoSite
            issues={state.issues}
            overlay={overlay && loggedIn && panelOpen}
            emphasizedId={emphasizedId}
            ctaColor={state.previewFix['i1']}
            onHover={setHovered}
            onOpen={(id) => {
              setPanelOpen(true)
              setScreen({ name: 'fix', issueId: id })
            }}
          />
        </main>
        {/* 실제 크롬 확장처럼: 로그인 전에는 아이콘 아래 작은 팝업(폭 360px, 높이는 내용만큼), 검사를 시작하면 오른쪽 사이드 패널(폭 360px, 브라우저 높이)로 열림 */}
        {panelOpen && screen.name !== 'login' && (
          <aside aria-label="A11y Translator 사이드 패널" className="h-full w-[360px] shrink-0 border-l border-[#ccc]">
            <PanelApp
              screen={screen}
              onScreenChange={setScreen}
              onHighlight={setHovered}
              overlay={overlay}
              onOverlayChange={setOverlay}
            />
          </aside>
        )}
        {panelOpen && screen.name === 'login' && (
          <div
            role="dialog"
            aria-label="A11y Translator 확장 프로그램"
            className="absolute top-[76px] right-3 z-40 max-h-[calc(100%-88px)] w-[360px] overflow-hidden rounded-xl border border-[#ccc] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.18)]"
          >
            <PanelApp
              screen={screen}
              onScreenChange={setScreen}
              onHighlight={setHovered}
              overlay={overlay}
              onOverlayChange={setOverlay}
            />
          </div>
        )}
      </div>
    </div>
  )
}
