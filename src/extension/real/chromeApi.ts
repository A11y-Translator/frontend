// 사이드 패널 ↔ 크롬 API. 화면(SidePanel.tsx)은 이 파일만 부르고 chrome.* 를 직접 만지지 않아요.
//  - 권한: activeTab(아이콘을 누른 탭만 잠깐 접근) + 사이트별로 사용자가 허용한 곳(optional_host_permissions)
//  - 검사: axe.min.js 를 그 탭에 넣고 runAxeInPage 실행 → 웹 검사와 같은 모양(ScanResult)
import type { ScanResult } from '@/shared/api/liveProxy'
import { clearOverlayInPage, drawOverlayInPage, highlightInPage, runAxeInPage, type OverlayItem } from './pageScripts'

/** 웹 검사(dev/inspectProxy.ts)와 같은 기준 — WCAG 2.0·2.1 A/AA + 2.2 AA */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

export interface TabInfo {
  id: number
  url: string
  title: string
}

/**
 * 검사할 탭: 사이드 패널이 붙은 창의 지금 탭.
 * 자동 테스트에서는 sidepanel.html?tabId=123 처럼 탭을 지정할 수 있어요.
 */
export async function getTargetTab(): Promise<TabInfo | null> {
  const fixed = Number(new URLSearchParams(location.search).get('tabId'))
  const tab = fixed ? await chrome.tabs.get(fixed) : (await chrome.tabs.query({ active: true, currentWindow: true }))[0]
  if (!tab?.id) return null
  return { id: tab.id, url: tab.url ?? '', title: tab.title ?? '' }
}

/** 테스트용으로 탭을 고정했는지 (고정했으면 탭 전환을 따라가지 않음) */
export const isPinnedTab = () => !!Number(new URLSearchParams(location.search).get('tabId'))

/** 콘텐츠를 넣을 수 있는 페이지인지 — chrome://, 새 탭, 웹 스토어, 파일 등은 크롬이 막아요 */
export function canScan(url: string) {
  if (!/^https?:\/\//i.test(url)) return false
  return !/^https:\/\/(chromewebstore\.google\.com|chrome\.google\.com\/webstore)/i.test(url)
}

const originPattern = (url: string) => `${new URL(url).origin}/*`

/** 크롬이 "이 페이지에 접근할 권한이 없음"으로 막았는지 */
export function isAccessError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err)
  return /Cannot access|permission|must request permission|host permission/i.test(msg)
}

/** 이 사이트를 계속 검사할 수 있게 사용자에게 허용 요청 (버튼 클릭 안에서만 동작) */
export function requestSiteAccess(url: string) {
  return chrome.permissions.request({ origins: [originPattern(url)] })
}

export async function scanTab(tabId: number): Promise<ScanResult> {
  await chrome.scripting.executeScript({ target: { tabId }, files: ['axe.min.js'] })
  const [res] = await chrome.scripting.executeScript({ target: { tabId }, func: runAxeInPage, args: [WCAG_TAGS] })
  if (!res?.result) throw new Error('검사 결과를 받지 못했어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.')
  return res.result as ScanResult
}

// 오버레이는 실패해도 검사 결과에는 영향이 없어서 오류를 조용히 무시해요 (예: 그사이 다른 페이지로 이동)
export async function showOverlay(tabId: number, items: OverlayItem[]) {
  await chrome.scripting.executeScript({ target: { tabId }, func: drawOverlayInPage, args: [items] }).catch(() => undefined)
}
export async function highlight(tabId: number, issueId: string | null, scrollTo: string | null = null) {
  await chrome.scripting.executeScript({ target: { tabId }, func: highlightInPage, args: [issueId, scrollTo] }).catch(() => undefined)
}
export async function clearOverlay(tabId: number) {
  await chrome.scripting.executeScript({ target: { tabId }, func: clearOverlayInPage }).catch(() => undefined)
}

/* 탭별 마지막 결과 — 사이드 패널을 닫았다 열어도 이어서 보이게 (브라우저를 끄면 지워지는 session 저장소) */
const key = (tabId: number) => `scan:${tabId}`
export async function saveResult(tabId: number, scan: ScanResult, scannedAt: string) {
  await chrome.storage.session.set({ [key(tabId)]: { scan, scannedAt } })
}
export async function loadResult(tabId: number): Promise<{ scan: ScanResult; scannedAt: string } | null> {
  const got = await chrome.storage.session.get(key(tabId))
  return (got[key(tabId)] as { scan: ScanResult; scannedAt: string } | undefined) ?? null
}
export async function forgetResult(tabId: number) {
  await chrome.storage.session.remove(key(tabId))
}
