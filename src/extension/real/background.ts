// 설치형 확장 · 백그라운드(서비스 워커)
// 툴바 아이콘은 manifest의 팝업을 연다. 기존 검사 패널은 팝업 메뉴에서 연다.
const openOnClick = () => chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => undefined)

chrome.runtime.onInstalled.addListener(openOnClick)
chrome.runtime.onStartup.addListener(openOnClick)
