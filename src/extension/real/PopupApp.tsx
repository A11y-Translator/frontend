import { useEffect, useRef, useState } from 'react'
import { InspectionPopup, type PopupScreen } from '@/extension/ui/InspectionPopup'
import { toInspection } from '@/shared/api/live'
import type { ScanResult } from '@/shared/api/liveProxy'
import {
  canScan,
  getTargetTab,
  isAccessError,
  loadResult,
  requestSiteAccess,
  saveResult,
  scanTab,
  showOverlay,
  type TabInfo,
} from './chromeApi'

export default function PopupApp() {
  const [screen, setScreen] = useState<PopupScreen>('ready')
  const [tab, setTab] = useState<TabInfo | null>(null)
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [scannedAt, setScannedAt] = useState('')
  const [message, setMessage] = useState('')
  const request = useRef(0)
  // shortcut: 팝업을 닫으면 진행 중 결과는 버린다. 검사 지속 기능을 추가할 때 작업 수명을 분리한다.
  useEffect(() => {
    let active = true
    const initialRequest = request.current
    void getTargetTab()
      .then(async (target) => {
        if (!active) return
        setTab(target)
        if (!target || !canScan(target.url)) {
          setScreen('unsupported')
          return
        }
        const saved = await loadResult(target.id)
        if (active && initialRequest === request.current && saved?.scan.url === target.url) {
          setScan(saved.scan)
          setScannedAt(saved.scannedAt)
          setScreen(saved.scan.violations.length ? 'result' : 'empty')
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setMessage(err instanceof Error ? err.message : '현재 탭을 읽지 못했어요.')
          setScreen('error')
        }
      })
    return () => {
      active = false
      request.current += 1
    }
  }, [])

  const run = async () => {
    if (!tab) return
    const current = ++request.current
    setScreen('scanning')
    setMessage('')
    try {
      const result = await scanTab(tab.id)
      if (current !== request.current) return
      const target = await chrome.tabs.get(tab.id)
      if (current !== request.current) return
      if (target.url !== result.url)
        throw new Error('검사 중 페이지가 바뀌었어요. 팝업을 다시 열고 검사해 주세요.')
      const at = new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      await saveResult(tab.id, result, at)
      if (current !== request.current) return
      setScan(result)
      setScannedAt(at)
      const inspection = toInspection('ext', result.url, 1, result)
      await showOverlay(
        tab.id,
        inspection.issues.map((i) => ({ id: i.id, label: i.no, selectors: i.selectors })),
      )
      if (current === request.current) setScreen(result.violations.length ? 'result' : 'empty')
    } catch (err) {
      if (current !== request.current) return
      setMessage(err instanceof Error ? err.message : '검사하지 못했어요.')
      setScreen(isAccessError(err) ? 'needAccess' : 'error')
    }
  }
  const openPanel = () => {
    if (!tab) return
    void chrome.sidePanel
      .open({ tabId: tab.id })
      .then(() => window.close())
      .catch((err: unknown) =>
        setMessage(err instanceof Error ? err.message : '검사 패널을 열지 못했어요.'),
      )
  }
  const exportJson = () => {
    if (!scan) return
    const href = URL.createObjectURL(
      new Blob([JSON.stringify(toInspection('ext', scan.url, 1, scan), null, 2)], {
        type: 'application/json',
      }),
    )
    const link = document.createElement('a')
    link.href = href
    link.download = `a11y-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(href)
  }
  const inspection = scan ? toInspection('ext', scan.url, 1, scan) : null
  const categories = [...new Set(inspection?.issues.map((i) => i.category))].map((label) => ({
    label,
    count: inspection!.issues.filter((i) => i.category === label).length,
    important: inspection!.issues.some((i) => i.category === label && i.priority === 'high'),
  }))
  const result = screen === 'result' || screen === 'empty'
  return (
    <InspectionPopup
      screen={screen}
      title={tab?.title}
      url={tab?.url}
      scannedAt={scannedAt && `오늘 ${scannedAt}`}
      total={inspection?.issues.length}
      important={inspection?.issues.filter((i) => i.priority === 'high').length}
      categories={categories}
      message={message}
      notice={
        screen === 'error' || screen === 'needAccess' ? undefined : message || inspection?.warning
      }
      primaryDisabled={result || !tab}
      primaryHint={
        result ? '웹 저장은 연결 전이에요. 메뉴에서 검사 패널·JSON 결과를 확인하세요.' : undefined
      }
      primaryLabel={screen === 'unsupported' ? '검사 패널 열기' : undefined}
      onRescan={() => void run()}
      menu={
        <>
          <button type="button" onClick={openPanel}>
            검사 패널 열기
          </button>
          {scan && (
            <button type="button" onClick={exportJson}>
              JSON 내보내기
            </button>
          )}
        </>
      }
      onPrimary={() => {
        if (screen === 'scanning') {
          request.current += 1
          setScreen('ready')
          return
        }
        if (screen === 'unsupported') {
          openPanel()
          return
        }
        if (screen === 'needAccess' && tab) {
          void requestSiteAccess(tab.url)
            .then((allowed) => {
              if (allowed) void run()
              else setMessage('접근을 허용하지 않아 검사할 수 없어요.')
            })
            .catch((err: unknown) =>
              setMessage(err instanceof Error ? err.message : '권한을 요청하지 못했어요.'),
            )
          return
        }
        void run()
      }}
    />
  )
}
