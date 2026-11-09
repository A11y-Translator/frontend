// 확장 사이드 패널 앱. 실제 크롬 사이드 패널에는 주소창이 없으므로 화면 전환은 URL 이 아니라 상태로 합니다.
// 흐름: 01 로그인 → 02 검사 결과 → 03 이슈 상세·미리 고쳐보기 → 04 결과 저장·웹으로 전송 → (수정 후 새로고침) 07 재검사
//       02 검사 결과 → 내 체크리스트 (v1/v2 임시)
//
// screen / overlay 는 "제어·비제어" 둘 다 지원합니다.
//  - /extension/panel (단독): props 없이 쓰면 패널이 스스로 상태를 가짐
//  - /extension (데모): 데모가 screen 을 쥐고 있어야 브라우저 ↻ 로 재검사 화면을 띄우고, 오버레이 배지로 상세를 열 수 있음
import { useEffect, useRef, useState } from 'react'
import { useAppState } from '@/shared/store'
import { PanelContext, startRecheck, type PanelNav, type PanelScreen } from './panelNav'
import LoginScreen from './screens/LoginScreen'
import ScanResultScreen from './screens/ScanResultScreen'
import IssueFixPreviewScreen from './screens/IssueFixPreviewScreen'
import SaveAndSendScreen from './screens/SaveAndSendScreen'
import RecheckAutoResolveScreen from './screens/RecheckAutoResolveScreen'
import ChecklistScreen from './screens/checklist'

interface PanelAppProps {
  /** 비제어 모드의 첫 화면 */
  initial?: PanelScreen
  /** 제어 모드: 현재 화면 (onScreenChange 와 함께 사용) */
  screen?: PanelScreen
  onScreenChange?: (s: PanelScreen) => void
  /** 데모에서 카드 hover/선택 시 페이지 요소를 강조하기 위해 사용 */
  onHighlight?: (issueId: string | null) => void
  /** 제어 모드: 오버레이 표시 여부 */
  overlay?: boolean
  onOverlayChange?: (on: boolean) => void
}

export default function PanelApp({
  initial = { name: 'login' },
  screen: screenProp,
  onScreenChange,
  onHighlight,
  overlay: overlayProp,
  onOverlayChange,
}: PanelAppProps) {
  const { issues } = useAppState()
  const [innerScreen, setInnerScreen] = useState<PanelScreen>(initial)
  const [innerOverlay, setInnerOverlay] = useState(true)
  const screen = screenProp ?? innerScreen
  const overlay = overlayProp ?? innerOverlay

  // 첫 렌더 이후의 화면은 "이동해서 온 화면" → 제목으로 포커스 이동 (panelNav.useScreenFocus)
  // 자식 effect 가 부모보다 먼저 돌기 때문에 첫 화면에서는 false 로 읽힘
  const navigatedRef = useRef(false)
  useEffect(() => {
    navigatedRef.current = true
  }, [])

  const go = (s: PanelScreen) => {
    // 카드가 사라지면 mouseleave 가 오지 않으므로 강조를 먼저 해제
    onHighlight?.(null)
    if (screenProp === undefined) setInnerScreen(s)
    onScreenChange?.(s)
  }

  const value: PanelNav = {
    screen,
    go,
    recheck: (auto = false) => go(startRecheck(issues, auto)),
    highlight: (id) => onHighlight?.(id),
    overlay,
    setOverlay: (on) => {
      if (overlayProp === undefined) setInnerOverlay(on)
      onOverlayChange?.(on)
    },
    navigatedRef,
  }

  return (
    <PanelContext.Provider value={value}>
      {screen.name === 'login' && <LoginScreen />}
      {screen.name === 'result' && <ScanResultScreen selectedId={screen.selectedId} />}
      {screen.name === 'fix' && <IssueFixPreviewScreen issueId={screen.issueId} />}
      {screen.name === 'save' && <SaveAndSendScreen />}
      {screen.name === 'checklist' && <ChecklistScreen />}
      {screen.name === 'recheck' && (
        <RecheckAutoResolveScreen prevResolved={screen.prevResolved} auto={screen.auto} />
      )}
    </PanelContext.Provider>
  )
}
