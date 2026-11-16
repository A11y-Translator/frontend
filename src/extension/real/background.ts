// 설치형 확장 · 백그라운드(서비스 워커)
// 툴바 아이콘을 누르면 사이드 패널이 열리게만 설정해요. 아이콘을 누르는 순간 그 탭에 activeTab 권한이 생겨서
// 따로 허용하지 않아도 사이드 패널에서 바로 검사할 수 있어요.
const openOnClick = () => chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined)

chrome.runtime.onInstalled.addListener(openOnClick)
chrome.runtime.onStartup.addListener(openOnClick)
