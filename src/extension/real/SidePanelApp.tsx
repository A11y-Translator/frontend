// 설치형 크롬 확장 · 사이드 패널 (최소 버전, 백엔드 없이 동작)
// 흐름: 이 탭 검사하기 → 결과 요약 · 분류 · 이슈 카드 (+ 페이지 위 오버레이) → 카드 선택 시 상세 · 위치 보기
//  - 카드에 마우스/포커스 → 페이지의 그 요소 강조, "위치 보기" → 그 요소로 스크롤
//  - 탭을 새로고침하면 자동으로 다시 검사, 다른 탭으로 옮기면 그 탭의 결과(있으면)를 보여줌
//  - 결과는 이 브라우저에만 저장(chrome.storage.session) · JSON 으로 내보내기
// 검사 규칙·문구는 웹 검사와 같은 toInspection(shared/api/live.ts)을 써서 웹과 결과가 똑같아요.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ScanResult } from '@/shared/api/liveProxy'
import { toInspection } from '@/shared/api/live'
import { SEVERITY_LABEL, type Category, type Issue, type Severity as SeverityLevel } from '@/shared/api/types'
import { IssueCard, Severity } from '@/extension/ui'
import logo from '@/extension/assets/logo-11.png'
import {
  canScan,
  clearOverlay,
  forgetResult,
  getTargetTab,
  highlight,
  isAccessError,
  isPinnedTab,
  loadResult,
  requestSiteAccess,
  saveResult,
  scanTab,
  showOverlay,
  type TabInfo,
} from './chromeApi'

type Status = 'idle' | 'scanning' | 'done' | 'error' | 'needAccess' | 'unsupported'
const SEVERITIES: SeverityLevel[] = ['critical', 'serious', 'moderate', 'minor']
const BTN = 'inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm leading-[1.4] font-bold whitespace-nowrap'
const CARD = 'flex flex-col gap-2.5 rounded-xl border border-ext-line bg-white p-4'

const now = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function SidePanelApp() {
  const [tab, setTab] = useState<TabInfo | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [scannedAt, setScannedAt] = useState('')
  const [overlay, setOverlay] = useState(true)
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const tabRef = useRef<TabInfo | null>(null)
  useEffect(() => {
    tabRef.current = tab
  }, [tab])

  const inspection = useMemo(() => (scan ? toInspection('ext', scan.url, 1, scan) : null), [scan])
  const helpUrlOf = useMemo(() => new Map((scan?.violations ?? []).map((v) => [`ext-${v.id}`, v.helpUrl])), [scan])
  const issues = useMemo(() => inspection?.issues ?? [], [inspection])
  const selected = issues.find((i) => i.id === selectedId) ?? null

  /** 오버레이를 켜 둔 상태면 페이지에 다시 그림 */
  const paint = useCallback(async (t: TabInfo, list: Issue[], on: boolean) => {
    if (on && list.length) await showOverlay(t.id, list.map((i) => ({ id: i.id, label: i.no, selectors: i.selectors })))
    else await clearOverlay(t.id)
  }, [])

  const run = useCallback(
    async (t: TabInfo, auto = false) => {
      if (!canScan(t.url)) {
        setStatus('unsupported')
        return
      }
      setStatus('scanning')
      setError('')
      setSelectedId(null)
      setNotice(auto ? '페이지가 새로 열려서 다시 검사하고 있어요.' : '이 탭을 검사하고 있어요.')
      try {
        const result = await scanTab(t.id)
        const at = now()
        setScan(result)
        setScannedAt(at)
        setStatus('done')
        await saveResult(t.id, result, at)
        const found = toInspection('ext', result.url, 1, result).issues
        await paint(t, found, overlay)
        setNotice(`검사를 마쳤어요. 이슈 ${found.length}개를 찾았어요.`)
        requestAnimationFrame(() => headingRef.current?.focus())
      } catch (err) {
        if (isAccessError(err)) {
          setStatus('needAccess')
          setNotice('이 사이트에 접근하려면 허용이 필요해요.')
        } else {
          setStatus('error')
          setError(err instanceof Error ? err.message : '검사하지 못했어요.')
        }
      }
    },
    [overlay, paint],
  )

  /** 지금 탭 정보와 (있으면) 저장된 결과 불러오기 */
  const syncTab = useCallback(async () => {
    const t = await getTargetTab()
    setTab(t)
    setSelectedId(null)
    setFilter('all')
    if (!t) return
    if (!canScan(t.url)) {
      setScan(null)
      setStatus('unsupported')
      return
    }
    const saved = await loadResult(t.id)
    if (saved && saved.scan.url === t.url) {
      setScan(saved.scan)
      setScannedAt(saved.scannedAt)
      setStatus('done')
    } else {
      setScan(null)
      setStatus('idle')
    }
  }, [])

  useEffect(() => {
    void syncTab()
    const onActivated = () => {
      if (!isPinnedTab()) void syncTab()
    }
    // 검사한 탭이 새로 열리면(새로고침 · 이동) 자동 재검사
    const onUpdated = (tabId: number, change: { status?: string }, t: chrome.tabs.Tab) => {
      const cur = tabRef.current
      if (!cur || tabId !== cur.id || change.status !== 'complete') return
      const next = { id: tabId, url: t.url ?? '', title: t.title ?? '' }
      setTab(next)
      void loadResult(tabId).then((saved) => {
        if (saved) void run(next, true)
        else void syncTab()
      })
    }
    chrome.tabs.onActivated.addListener(onActivated)
    chrome.tabs.onUpdated.addListener(onUpdated)
    return () => {
      chrome.tabs.onActivated.removeListener(onActivated)
      chrome.tabs.onUpdated.removeListener(onUpdated)
    }
  }, [syncTab, run])

  const allowAndScan = async () => {
    if (!tab) return
    const ok = await requestSiteAccess(tab.url)
    if (ok) void run(tab)
    else setNotice('허용하지 않아서 검사할 수 없어요. 툴바의 A11y Translator 아이콘을 눌러 열면 이 탭은 바로 검사할 수 있어요.')
  }

  const toggleOverlay = async () => {
    if (!tab) return
    const next = !overlay
    setOverlay(next)
    await paint(tab, issues, next)
  }

  const exportJson = () => {
    if (!inspection || !tab) return
    const data = { tool: 'A11y Translator (axe-core)', tabUrl: tab.url, tabTitle: tab.title, ...inspection }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `a11y-${new URL(tab.url).hostname}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setNotice('결과를 JSON 파일로 내보냈어요.')
  }

  const resetAll = async () => {
    if (!tab) return
    await clearOverlay(tab.id)
    await forgetResult(tab.id)
    setScan(null)
    setStatus('idle')
    setNotice('결과를 지웠어요.')
  }

  const counts = useMemo(() => {
    const bySeverity = Object.fromEntries(SEVERITIES.map((s) => [s, issues.filter((i) => i.severity === s).length])) as Record<SeverityLevel, number>
    const byCategory = [...new Set(issues.map((i) => i.category))].map((c) => ({ label: c, count: issues.filter((i) => i.category === c).length }))
    return { bySeverity, byCategory }
  }, [issues])
  const list = filter === 'all' ? issues : issues.filter((i) => i.category === filter)
  const chips: { key: Category | 'all'; label: string; count: number }[] = [
    { key: 'all', label: '전체', count: issues.length },
    ...counts.byCategory.map((c) => ({ key: c.label, label: c.label, count: c.count })),
  ]

  return (
    <div className="flex h-dvh flex-col bg-ext-bg font-noto text-black">
      {/* 헤더: 서비스 이름 + 검사할 탭 */}
      <header className="flex shrink-0 flex-col gap-2.5 border-b border-ext-line bg-white px-4 pt-3.5 pb-3">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" width={24} height={24} className="size-6" />
          <span className="text-[15px] leading-[1.4] font-bold">A11y Translator</span>
          {status === 'done' && (
            <button
              type="button"
              role="switch"
              aria-checked={overlay}
              onClick={toggleOverlay}
              className="ml-auto flex items-center gap-1.5 rounded text-xs font-medium text-muted"
            >
              페이지에 표시
              <span aria-hidden className={`relative h-[18px] w-8 rounded-full transition-colors ${overlay ? 'bg-accent' : 'bg-[#8a8f98]'}`}>
                <span className={`absolute top-0.5 size-3.5 rounded-full bg-white transition-all ${overlay ? 'left-4' : 'left-0.5'}`} />
              </span>
            </button>
          )}
        </div>
        <p className="min-w-0 truncate rounded-lg bg-ext-soft px-2.5 py-1.5 text-[13px] leading-[1.4] font-medium" title={tab?.url}>
          <span className="sr-only">검사할 탭: </span>
          {tab ? tab.title || tab.url : '탭을 찾는 중…'}
        </p>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        <p role="status" className="sr-only">
          {notice}
        </p>

        {status === 'unsupported' && (
          <section className={CARD}>
            <h1 className="text-[15px] leading-[1.5] font-bold">이 페이지는 검사할 수 없어요</h1>
            <p className="text-[13px] leading-[1.5] text-muted">
              새 탭, 크롬 설정, 웹 스토어처럼 브라우저 페이지에는 크롬이 확장을 들여보내지 않아요. 검사할 사이트를 연 뒤 다시 시도해 주세요.
            </p>
          </section>
        )}

        {status === 'idle' && tab && (
          <section className={CARD}>
            <h1 className="text-[15px] leading-[1.5] font-bold">이 탭의 접근성을 검사해 볼까요?</h1>
            <p className="text-[13px] leading-[1.5] text-muted">
              WCAG 2.2 AA 기준으로 지금 보이는 화면을 검사하고, 문제 위치를 페이지 위에 표시해요. 로그인한 화면도 그대로 검사할 수 있어요.
            </p>
            <button type="button" onClick={() => run(tab)} className={`${BTN} bg-black text-white hover:bg-ink-3`}>
              이 탭 검사하기
            </button>
          </section>
        )}

        {status === 'needAccess' && tab && (
          <section className={CARD}>
            <h1 className="text-[15px] leading-[1.5] font-bold">이 사이트에 접근 허용이 필요해요</h1>
            <p className="text-[13px] leading-[1.5] text-muted">
              확장은 허용한 사이트만 읽을 수 있어요. 한 번 허용하면 {new URL(tab.url).host} 에서는 새로고침해도 계속 검사할 수 있어요.
            </p>
            <button type="button" onClick={allowAndScan} className={`${BTN} bg-black text-white hover:bg-ink-3`}>
              {new URL(tab.url).host} 검사 허용
            </button>
          </section>
        )}

        {status === 'scanning' && (
          <section className={`${CARD} items-center py-8`} aria-busy="true">
            <span aria-hidden className="size-6 animate-spin rounded-full border-2 border-ext-line border-t-black motion-reduce:animate-none" />
            <h1 className="text-[15px] font-bold">검사 중이에요…</h1>
            <p className="text-[13px] text-muted">페이지를 그대로 두세요.</p>
          </section>
        )}

        {status === 'error' && tab && (
          <section className={CARD}>
            <h1 className="text-[15px] leading-[1.5] font-bold text-danger">검사하지 못했어요</h1>
            <p className="text-[13px] leading-[1.5] text-muted">{error}</p>
            <button type="button" onClick={() => run(tab)} className={`${BTN} border border-ext-line bg-white hover:bg-ext-soft`}>
              다시 시도
            </button>
          </section>
        )}

        {status === 'done' && inspection && tab && !selected && (
          <>
            <section aria-labelledby="sum-title" className={CARD}>
              <h1 id="sum-title" ref={headingRef} tabIndex={-1} className="flex items-baseline gap-1.5 text-[15px] leading-[1.5] font-bold">
                이슈 <span className="text-[28px]">{issues.length}</span>개
              </h1>
              <ul aria-label="심각도별 이슈 수" className="grid grid-cols-4 gap-1.5">
                {SEVERITIES.map((s) => (
                  <li key={s} className="flex min-w-0 flex-col items-center gap-1 rounded-lg bg-ext-bg py-2">
                    <Severity level={s} />
                    <span className="text-[15px] font-bold">
                      {counts.bySeverity[s]}
                      <span className="sr-only">개 ({SEVERITY_LABEL[s]})</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs leading-[1.5] text-muted">
                오늘 {scannedAt} 검사 · 통과한 규칙 {inspection.passedRules ?? 0}개
                {inspection.needsReview ? ` · 직접 확인 필요 ${inspection.needsReview}개` : ''}
              </p>
              {inspection.warning && <p className="rounded-lg bg-[#fff8e6] px-3 py-2 text-xs leading-[1.5] text-[#7a4d00]">{inspection.warning}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => run(tab)} className={`${BTN} bg-black text-white hover:bg-ink-3`}>
                  다시 검사
                </button>
                <button type="button" onClick={exportJson} className={`${BTN} border border-ext-line bg-white hover:bg-ext-soft`}>
                  JSON 내보내기
                </button>
                <button type="button" onClick={resetAll} className={`${BTN} px-3 text-muted hover:text-black`}>
                  지우기
                </button>
              </div>
            </section>

            {issues.length === 0 ? (
              <p className={`${CARD} text-[13px] leading-[1.5] text-muted`}>
                자동 검사에서 이슈를 찾지 못했어요. 키보드 이동 순서나 화면낭독기로 읽는 흐름처럼 자동으로 확인할 수 없는 항목은 직접 점검해 주세요.
              </p>
            ) : (
              <>
                <div role="group" aria-label="분류별로 보기" className="flex flex-wrap gap-1.5">
                  {chips.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      aria-pressed={filter === c.key}
                      onClick={() => setFilter(c.key)}
                      className={`rounded-full border px-2.5 py-[5px] text-xs leading-[1.5] font-medium ${
                        filter === c.key ? 'border-black bg-black text-white' : 'border-ext-line bg-white hover:bg-ext-soft'
                      }`}
                    >
                      {c.label} {c.count}
                    </button>
                  ))}
                </div>
                <ul aria-label="이슈 목록" className="flex flex-col gap-2">
                  {list.map((i) => (
                    <li key={i.id}>
                      <IssueCard issue={i} onHover={(on) => highlight(tab.id, on ? i.id : null)} onSelect={() => setSelectedId(i.id)} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}

        {status === 'done' && tab && selected && (
          <IssueDetail
            issue={selected}
            helpUrl={helpUrlOf.get(selected.id)}
            onBack={() => {
              void highlight(tab.id, null)
              setSelectedId(null)
            }}
            onLocate={(sel) => {
              void highlight(tab.id, selected.id, sel)
              setNotice(`페이지에서 ${sel} 위치를 표시했어요.`)
            }}
          />
        )}
      </main>
    </div>
  )
}

function IssueDetail({ issue, helpUrl, onBack, onLocate }: { issue: Issue; helpUrl?: string; onBack: () => void; onLocate: (selector: string) => void }) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => ref.current?.focus(), [issue.id])
  return (
    <>
      <button type="button" onClick={onBack} className="self-start rounded text-xs font-medium text-muted hover:text-black">
        <span aria-hidden>‹ </span>목록으로
      </button>
      <section aria-labelledby="detail-title" className={CARD}>
        <div className="flex items-center gap-2 text-xs text-muted">
          <Severity level={issue.severity} />
          {issue.category} · {issue.wcag}
        </div>
        <h1 id="detail-title" ref={ref} tabIndex={-1} className="text-[17px] leading-[1.4] font-bold">
          {issue.title}
        </h1>
        <p className="text-[13px] leading-[1.5] text-muted">{issue.impact}</p>
        {issue.detail && <p className="rounded-lg bg-ext-bg px-3 py-2 text-xs leading-[1.6] whitespace-pre-line text-ink-2">{issue.detail}</p>}
      </section>
      <section aria-labelledby="el-title" className={CARD}>
        <h2 id="el-title" className="text-sm font-bold">
          해당 요소 {issue.elements}개{issue.selectors.length < issue.elements ? ` (앞의 ${issue.selectors.length}개 표시)` : ''}
        </h2>
        <ul className="flex flex-col gap-1.5">
          {issue.selectors.map((s) => (
            <li key={s} className="flex items-center gap-2 text-xs">
              <code className="min-w-0 flex-1 truncate font-mono text-ink-2" title={s}>
                {s}
              </code>
              <button type="button" onClick={() => onLocate(s)} className="shrink-0 rounded font-bold text-[#175fc2] hover:underline">
                위치 보기<span className="sr-only">: {s}</span>
              </button>
            </li>
          ))}
        </ul>
        {issue.fixCode && (
          <pre className="overflow-x-auto rounded-lg bg-[#1e1f22] p-3 text-[11px] leading-[1.6] text-[#e8e8e8]">
            <code>{issue.fixCode}</code>
          </pre>
        )}
        {helpUrl && (
          <a href={helpUrl} target="_blank" rel="noreferrer" className="self-start text-xs font-bold text-[#175fc2] hover:underline">
            고치는 방법 자세히 (Deque, 영어)<span className="sr-only"> — 새 탭에서 열림</span>
          </a>
        )}
      </section>
    </>
  )
}
