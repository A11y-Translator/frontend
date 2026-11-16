// Figma: project/issue-detail (554:12276)
// 왼쪽: URL 바 · 검사 시점 캡처(코멘트 핀 + 스레드) / 오른쪽: 이슈 정보 패널
// 캡처를 클릭(또는 키보드로 선택 후 Enter)하면 그 자리에 새 핀이 꽂히고 답글 입력칸으로 포커스가 갑니다.
// 캡처 위 파란 번호(문제 위치)를 누르면 그 번호에 해당하는 이슈의 코멘트 스레드가 그 자리에 열려요.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Header } from '@/web/layout/Header'
import { actions, findIssueContext, useAppState } from '@/shared/store'
import { CURRENT_USER_ID, memberById } from '@/shared/mocks'
import { markerThreadKey, screenshotFor, threadKeyOf, type Comment, type Inspection, type Issue, type IssueOverlay, type Project } from '@/shared/api/types'
import { CAPTURE_H, CAPTURE_W, DEFAULT_PROJECT_ID, OVERLAYS, PROJECT_NAME, SCAN, SITE_URL } from '@/shared/mocks/scan'
import { formatScannedAt } from '@/web/common/issueHelpers'
import { useVersionMenu } from '@/web/common/useVersionMenu'
import { SiteCapture } from '@/web/common/SiteCapture'
import { OpenInChromeLink } from '@/web/common/OpenInChromeLink'
import { CommentThread } from './CommentThread'
import { IssueSidePanel } from './IssueSidePanel'

type Pin = { x: number; y: number }

export default function IssueDetailPage() {
  const { issueId } = useParams()
  const state = useAppState()
  const { comments, currentVersion } = state
  // 새로 만든 프로젝트의 이슈면 그 검사 결과에서, 아니면 데모 데이터에서 찾습니다
  const { issue, issues, project, inspection } = findIssueContext(state, issueId)
  const versionMenu = useVersionMenu(inspection?.projectId ?? DEFAULT_PROJECT_ID)

  return (
    <>
      <Header
        version={`버전 ${inspection?.version ?? currentVersion}`}
        project={project?.name ?? PROJECT_NAME}
        status={inspection ? `마지막 검사 ${formatScannedAt(inspection.scannedAt).slice(-5)} · 이슈 ${inspection.issues.length}개` : undefined}
        right={<OpenInChromeLink />}
        versionMenu={versionMenu}
        viewingVersion={inspection?.version ?? currentVersion}
      />
      {issue ? (
        // 이슈가 바뀌면 핀·입력 상태를 새로 시작하도록 key 사용
        <IssueDetail
          key={issue.id}
          issue={issue}
          issues={issues}
          allComments={comments}
          resolvedThreads={state.resolvedThreads}
          project={project}
          inspection={inspection}
        />
      ) : (
        <div className="flex flex-1 flex-col items-start gap-3 p-8">
          <h1 className="text-2xl font-bold">이슈를 찾을 수 없어요</h1>
          <Link to={`/projects/${DEFAULT_PROJECT_ID}/inspection`} className="text-sm font-bold text-[#175fc2] underline">
            접근성 검사 목록으로
          </Link>
        </div>
      )}
    </>
  )
}

const clamp = (n: number) => Math.min(97, Math.max(3, n))

interface IssueDetailProps {
  issue: Issue
  issues: Issue[]
  /** 모든 이슈의 코멘트 — 캡처 위 위치(번호·핀)마다 스레드를 나눠 보여주기 위해 */
  allComments: Comment[]
  /** 스레드(위치)별 "해결" 여부 (store 에 저장) */
  resolvedThreads: Record<string, boolean>
  /** 새로 만든 프로젝트의 이슈일 때만 있음 */
  project?: Project
  inspection?: Inspection
}

type Marker = IssueOverlay & { key: string }

/**
 * 코멘트 = 캡처 위 위치 하나에 붙는 스레드 (피그마 이슈 상세: 핀에 코멘트 수, 옆에 "#1 색 대비 · 코멘트 2 · 해결")
 *  - 파란 번호(문제 위치)마다 스레드 하나 → 번호를 누르면 그 번호의 코멘트
 *  - 캡처 빈 곳을 누르면 그 자리에 새 핀 → 첫 코멘트를 남기면 그 핀만의 스레드가 생김
 *  - "해결"은 그 위치 스레드만 해결로 바꿈 (번호·핀에 ✓, 남은 코멘트에서 빠짐). 새 코멘트를 남기면 다시 열림
 */
function IssueDetail({ issue, issues, allComments, resolvedThreads, project, inspection }: IssueDetailProps) {
  const [overlay, setOverlay] = useState(true)
  const [pendingPin, setPendingPin] = useState<Pin | null>(null)
  const allMarkers: Marker[] = (inspection?.overlays ?? OVERLAYS)
    .filter((o) => o.page === issue.page)
    .map((o) => ({ ...o, key: markerThreadKey(o.page, o.label) }))
  // 처음에는 이 이슈의 첫 번째 번호 스레드를 열어 둬요 (피그마처럼). 이 이슈의 번호가 캡처에 없으면 닫아 둠
  const firstMarker = allMarkers.find((o) => o.issueId === issue.id)
  const [threadKey, setThreadKey] = useState<string | null>(firstMarker?.key ?? null)
  /** 코멘트 창 위치 (캡처 기준 px) — 번호·핀 바로 옆에서 다른 번호를 가리지 않는 자리로 고름 */
  const [threadPos, setThreadPos] = useState<{ left: number; top: number } | null>(null)
  // 코멘트 창 열림 — 바깥 클릭 · Esc · ✕ 로 닫고, 번호·핀을 누르거나 새 핀을 꽂으면 열림
  const [threadOpen, setThreadOpen] = useState(!!firstMarker)
  const threadRef = useRef<HTMLElement>(null)
  /** 창을 닫은 바로 그 클릭이 캡처에 새 핀까지 꽂지 않도록 */
  const closedByOutsideClick = useRef(false)
  const [flash, setFlash] = useState<string | undefined>()
  const [notice, setNotice] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingRef = useRef<HTMLButtonElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const flashTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(flashTimer.current), [])

  const order = [...issues].sort((a, b) => a.no - b.no)
  const resolved = issue.status === 'resolved'
  const issueOf = (id: string) => issues.find((i) => i.id === id)
  // 캡처 위 파란 번호는 오버레이를 켰을 때만 보이고 누를 수 있어요
  const markers = overlay ? allMarkers : []

  /** 번호 스레드의 코멘트. 예전 이슈 단위 코멘트('issue:i1')는 그 이슈의 첫 번째 번호에 모아 보여줘요 */
  const markerComments = (m: Marker) => {
    const legacy = allMarkers.find((o) => o.issueId === m.issueId)?.key === m.key ? `issue:${m.issueId}` : null
    return allComments.filter((c) => threadKeyOf(c) === m.key || threadKeyOf(c) === legacy)
  }
  const keysOf = (m: Marker) => {
    const first = allMarkers.find((o) => o.issueId === m.issueId)?.key === m.key
    return first ? [m.key, `issue:${m.issueId}`] : [m.key]
  }

  // 직접 꽂은 핀 스레드 (이 페이지의 것만)
  const pinGroups = new Map<string, Comment[]>()
  for (const c of allComments) {
    const k = threadKeyOf(c)
    if (!k.startsWith('pin:') || issueOf(c.issueId)?.page !== issue.page) continue
    pinGroups.set(k, [...(pinGroups.get(k) ?? []), c])
  }
  const pins = [...pinGroups].flatMap(([key, cs]) => {
    const pin = cs.find((c) => c.pin)?.pin
    return pin ? [{ key, pin, comments: cs }] : []
  })

  // 지금 열려 있는 스레드
  const currentMarker = threadKey ? allMarkers.find((m) => m.key === threadKey) : undefined
  const currentPin = threadKey ? pins.find((p) => p.key === threadKey) : undefined
  const threadIssue = (currentMarker && issueOf(currentMarker.issueId)) || (currentPin && issueOf(currentPin.comments[0].issueId)) || issue
  const threadComments = pendingPin ? [] : currentMarker ? markerComments(currentMarker) : (currentPin?.comments ?? [])
  const threadResolved = !pendingPin && !!threadKey && !!resolvedThreads[threadKey]
  const threadTitle = pendingPin
    ? `새 코멘트 · ${issue.category}`
    : currentMarker
      ? `#${currentMarker.label} ${threadIssue.category} · 코멘트 ${threadComments.length}`
      : `코멘트 핀 · 코멘트 ${threadComments.length}`
  const showThread = threadOpen && (!!pendingPin || !!currentMarker || !!currentPin)

  // 핀 스레드 · 새 핀은 핀 옆에 붙어요 (번호 스레드는 threadPos)
  const anchor: Pin = pendingPin ?? currentPin?.pin ?? { x: 37, y: 37 }

  const closeThread = (returnFocus = false) => {
    setThreadOpen(false)
    // 입력 없이 꽂아 둔 새 핀은 같이 취소
    setPendingPin(null)
    if (returnFocus) requestAnimationFrame(() => captureRef.current?.querySelector<HTMLButtonElement>('button')?.focus())
  }

  // 코멘트 창 바깥을 누르면 닫기 (번호·핀 버튼은 창을 여는 쪽이라 제외)
  useEffect(() => {
    if (!threadOpen) return
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement
      if (threadRef.current?.contains(t) || t.closest('[data-comment-pin]')) return
      closedByOutsideClick.current = true
      closeThread()
      // 다른 곳 클릭이라 캡처 click 이 안 오면 다음 클릭에 영향 없게 초기화
      window.setTimeout(() => (closedByOutsideClick.current = false), 400)
    }
    // Esc: 포커스가 코멘트 창 안(또는 아무 데도 없을 때)이면 닫기. 멘션 목록·새 핀이 먼저 처리한 Esc 는 무시
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing) return
      const active = document.activeElement
      if (active && active !== document.body && !threadRef.current?.contains(active)) return
      e.preventDefault()
      closeThread(true)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [threadOpen])

  /**
   * 파란 번호로 연 코멘트 창 자리 고르기: 번호 박스의 오른쪽 → 왼쪽 → 아래 → 위 중에서
   * 다른 번호(배지)를 가장 적게 가리고, 고른 박스도 덜 가리는 자리. 캡처 밖으로는 나가지 않게.
   */
  const placeThread = (o: { x: number; y: number; w: number; h: number }) => {
    const el = captureRef.current
    const W = el?.clientWidth || CAPTURE_W
    const H = el?.clientHeight || CAPTURE_H
    const k = W / CAPTURE_W
    const tw = Math.min(280, W - 16)
    const th = Math.min(threadRef.current?.offsetHeight || 260, H - 16)
    const box = { x: o.x * k, y: o.y * k, w: o.w * k, h: o.h * k }
    const badges = markers.map((m) => ({ x: (m.x - 1.5) * k, y: (m.y - 1.5) * k }))
    const fit = (left: number, top: number) => ({
      left: Math.max(8, Math.min(left, W - tw - 8)),
      top: Math.max(8, Math.min(top, H - th - 8)),
    })
    const candidates = [
      fit(box.x + box.w + 12, box.y),
      fit(box.x - tw - 12, box.y),
      fit(box.x, box.y + box.h + 12),
      fit(box.x, box.y - th - 12),
    ]
    const overlap = (a0: number, a1: number, b0: number, b1: number) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0))
    const score = (c: { left: number; top: number }) => {
      // 배지 하나 가리면 1점, 고른 박스를 가린 비율은 0.5점까지
      const covered = badges.filter((b) => b.x + 16 > c.left && b.x - 16 < c.left + tw && b.y + 16 > c.top && b.y - 16 < c.top + th).length
      const boxArea = Math.max(1, box.w * box.h)
      const boxCovered = (overlap(c.left, c.left + tw, box.x, box.x + box.w) * overlap(c.top, c.top + th, box.y, box.y + box.h)) / boxArea
      return covered + boxCovered * 0.5
    }
    return candidates.reduce((best, c) => (score(c) < score(best) ? c : best))
  }

  /** 핀(28px, 꽂은 점의 왼쪽에 그려짐)을 박스로 보고 그 옆 자리 고르기 */
  const placeAtPin = (pin: Pin) => {
    const k = (captureRef.current?.clientWidth || CAPTURE_W) / CAPTURE_W
    const size = 28 / k
    return placeThread({ x: (pin.x / 100) * CAPTURE_W - size, y: (pin.y / 100) * CAPTURE_H, w: size, h: size })
  }

  // 처음 열어 둔 번호 스레드도 다른 번호를 가리지 않는 자리에
  useLayoutEffect(() => {
    if (firstMarker) setThreadPos(placeThread(firstMarker))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** 파란 번호 → 그 번호(위치)의 코멘트 스레드를 번호 옆에 열기 */
  const openMarker = (m: Marker) => {
    const target = issueOf(m.issueId)
    setThreadKey(m.key)
    setThreadPos(placeThread(m))
    setPendingPin(null)
    setThreadOpen(true)
    setNotice(`${m.label}번 위치${target ? ` (#${target.no} ${target.title})` : ''} 코멘트 ${markerComments(m).length}개를 열었어요.`)
  }

  const openPin = (key: string) => {
    const p = pins.find((x) => x.key === key)
    setThreadKey(key)
    setThreadPos(p ? placeAtPin(p.pin) : null)
    setPendingPin(null)
    setThreadOpen(true)
  }

  const addPin = (e: MouseEvent<HTMLButtonElement>) => {
    if (closedByOutsideClick.current) {
      closedByOutsideClick.current = false
      return
    }
    setThreadOpen(true)
    setThreadPos(null)
    let pin: Pin = { x: 50, y: 50 }
    // 키보드(Enter/Space)로 누르면 detail 이 0 → 가운데에 꽂고 방향키로 옮기게 합니다
    if (e.detail > 0) {
      const r = e.currentTarget.getBoundingClientRect()
      pin = { x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) }
      setPendingPin(pin)
      setThreadPos(placeAtPin(pin))
      // 스레드가 접혀 있었다면 펼쳐진 뒤에 입력칸이 생기므로 다음 프레임에 포커스
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      setPendingPin(pin)
      setThreadPos(placeAtPin(pin))
      // 핀으로 포커스를 옮겨 방향키로 위치를 조정할 수 있게
      requestAnimationFrame(() => pendingRef.current?.focus())
    }
    setNotice('새 코멘트 핀을 꽂았어요. 입력칸에 코멘트를 남기면 이 위치의 스레드가 생겨요.')
  }

  const movePin = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!pendingPin) return
    const step = e.shiftKey ? 10 : 2
    const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (d[e.key]) {
      e.preventDefault()
      const next = { x: clamp(pendingPin.x + d[e.key][0]), y: clamp(pendingPin.y + d[e.key][1]) }
      setPendingPin(next)
      setThreadPos(placeAtPin(next))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.focus()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setPendingPin(null)
      setNotice('새 핀을 취소했어요.')
    }
  }

  const submit = (body: string) => {
    if (pendingPin) {
      // 새 핀의 첫 코멘트 → 이 핀만의 스레드
      const key = `pin:${Date.now().toString(36)}`
      actions.addComment({ issueId: issue.id, authorId: CURRENT_USER_ID, body, time: '방금', pin: pendingPin, threadKey: key })
      setPendingPin(null)
      setThreadKey(key)
      setNotice('이 위치에 코멘트를 남겼어요.')
      return
    }
    if (!threadKey) return
    actions.addComment({ issueId: threadIssue.id, authorId: CURRENT_USER_ID, body, time: '방금', threadKey })
    setNotice(threadResolved ? '코멘트를 남겨서 이 위치의 스레드를 다시 열었어요.' : '코멘트를 남겼어요.')
  }

  const setThreadResolved = (resolvedNow: boolean) => {
    if (!threadKey) return
    actions.setThreadResolved(currentMarker ? keysOf(currentMarker) : threadKey, resolvedNow)
    const where = currentMarker ? `${currentMarker.label}번 위치` : '이 핀'
    setNotice(resolvedNow ? `${where}의 코멘트를 해결로 표시했어요. 남은 코멘트에서 빠져요.` : `${where}의 코멘트를 다시 열었어요.`)
  }

  const locate = (selector: string) => {
    setOverlay(true)
    setFlash(selector)
    captureRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(undefined), 2400)
    setNotice(`캡처에서 ${selector} 위치를 표시했어요.`)
  }

  const recheck = async () => {
    if (inspection) {
      setNotice('재검사 중이에요…')
      await actions.reinspect(inspection.projectId)
      setNotice('재검사를 마쳤어요.')
      return
    }
    actions.recheck()
    setNotice('재검사를 마쳤어요. 수정안을 적용한 이슈는 자동으로 해결돼요.')
  }

  const threadStyle: CSSProperties = threadPos
      ? { left: threadPos.left, top: threadPos.top }
      : {
          top: `max(8px, min(${anchor.y}%, calc(100% - 300px)))`,
          // 좁은 화면에서도 말풍선(최대 280px)이 캡처 밖으로 나가지 않도록 좌우 8px 안쪽으로 가둬요
          ...(anchor.x < 58
            ? { left: `max(8px, min(calc(${anchor.x}% + 10px), calc(100% - min(280px, 100% - 16px) - 8px)))` }
            : { right: `max(8px, min(calc(${100 - anchor.x}% + 38px), calc(100% - min(280px, 100% - 16px) - 8px)))` }),
        }

  return (
    <div className="flex flex-1 flex-col page-x @4xl:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-3.5 py-5 @4xl:pr-5">
        <h1 className="sr-only">이슈 상세: {issue.title}</h1>

        {/* URL bar */}
        <div className="flex h-14 items-center gap-3 rounded-[40px] bg-white py-2 pr-2 pl-6 font-noto">
          <p className="min-w-0 flex-1 truncate text-base leading-[1.5] font-medium text-black">
            <span className="sr-only">검사한 주소: </span>
            {project?.url ?? SITE_URL}
            {issue.page === '/main' ? '' : issue.page}
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={overlay}
            onClick={() => setOverlay((v) => !v)}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-1 text-[13px] leading-[1.5] font-medium text-muted"
          >
            오버레이
            <span aria-hidden className={`relative h-[18px] w-8 rounded-full transition-colors ${overlay ? 'bg-accent' : 'bg-[#8a8f98]'}`}>
              <span className={`absolute top-0.5 size-3.5 rounded-full bg-white transition-all ${overlay ? 'left-4' : 'left-0.5'}`} />
            </span>
          </button>
          <button type="button" onClick={recheck} className="shrink-0 rounded-full bg-ext-soft px-4 py-2.5 text-sm leading-[1.4] font-bold text-black hover:bg-ext-line">
            재검사
          </button>
        </div>

        {/* 검사 시점 캡처 */}
        <div ref={captureRef} className="relative">
          <div className="overflow-hidden rounded-2xl border border-ext-line bg-white">
            <SiteCapture
              page={issue.page}
              label={`${issue.page} 페이지 검사 시점 캡처${overlay ? ', 문제 위치 오버레이 표시' : ''}`}
              showOverlay={overlay}
              activeIssueId={currentMarker?.issueId ?? issue.id}
              flashSelector={flash}
              overlays={inspection?.overlays}
              screenshotUrl={screenshotFor(inspection, issue.page)}
            >
              <button
                type="button"
                onClick={addPin}
                aria-label="캡처에 코멘트 핀 꽂기 — 키보드로 누르면 가운데에 꽂히고, 방향키로 위치를 옮길 수 있어요"
                className="absolute inset-0 cursor-crosshair -outline-offset-4"
              />
              {/* 파란 번호(문제 위치) — 캡처에 그려진 번호 위에 누를 수 있는 버튼을 겹쳐요 (누르는 영역 28px).
                  코멘트가 있으면 오른쪽 위에 개수, 해결했으면 ✓ */}
              {markers.map((m) => {
                const target = issueOf(m.issueId)
                const count = markerComments(m).length
                const done = !!resolvedThreads[m.key]
                const active = showThread && !pendingPin && m.key === threadKey
                return (
                  <button
                    key={m.key}
                    type="button"
                    data-comment-pin
                    onClick={() => openMarker(m)}
                    aria-label={`문제 위치 ${m.label}번${target ? `: #${target.no} ${target.title}` : ''} — 코멘트 ${count}개${done ? ', 해결됨' : ''}`}
                    aria-pressed={active}
                    title={`${m.label}번${target ? ` · ${target.title}` : ''} · 코멘트 ${count}개${done ? ' · 해결됨' : ''}`}
                    className={`absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full hover:bg-[rgb(48_134_255/0.25)] ${active ? 'ring-2 ring-[#3086ff] ring-offset-1' : ''}`}
                    // 캡처의 번호 배지 가운데 (박스 왼쪽 위 모서리에서 1.5px 바깥)
                    style={{ left: `${((m.x - 1.5) / CAPTURE_W) * 100}%`, top: `${((m.y - 1.5) / CAPTURE_H) * 100}%` }}
                  >
                    {(done || count > 0) && (
                      <span
                        aria-hidden
                        className={`absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-white px-1 font-noto text-[10px] leading-none font-bold text-white shadow ${done ? 'bg-success' : 'bg-black'}`}
                      >
                        {done ? '✓' : count}
                      </span>
                    )}
                  </button>
                )
              })}
              {/* 직접 꽂은 핀 — 피그마처럼 핀 안에 코멘트 수. 해결하면 회색 + 모서리 ✓ */}
              {pins.map((p) => {
                const done = !!resolvedThreads[p.key]
                const first = p.comments[0]
                const author = memberById(first.authorId)
                return (
                  <button
                    key={p.key}
                    type="button"
                    data-comment-pin
                    onClick={() => openPin(p.key)}
                    aria-label={`코멘트 핀: 코멘트 ${p.comments.length}개${done ? ', 해결됨' : ''} — ${author?.name ?? ''}: ${first.body}`}
                    aria-pressed={showThread && !pendingPin && p.key === threadKey}
                    className={`absolute flex size-7 -translate-x-full items-center justify-center rounded-full rounded-tr-none border-2 border-white font-noto text-xs leading-[1.5] font-bold text-white shadow ${done ? 'bg-[#6f737a]' : 'bg-black'}`}
                    style={{ left: `${p.pin.x}%`, top: `${p.pin.y}%` }}
                  >
                    {p.comments.length}
                    {done && (
                      <span aria-hidden className="absolute -right-1.5 -bottom-1.5 flex size-4 items-center justify-center rounded-full border-2 border-white bg-success text-[9px] leading-none">
                        ✓
                      </span>
                    )}
                  </button>
                )
              })}
              {pendingPin && (
                <button
                  ref={pendingRef}
                  data-comment-pin
                  type="button"
                  onKeyDown={movePin}
                  onClick={() => inputRef.current?.focus()}
                  aria-label={`새 코멘트 핀 (가로 ${Math.round(pendingPin.x)}%, 세로 ${Math.round(pendingPin.y)}%). 방향키로 옮기고 Enter 로 코멘트 입력, Esc 로 취소`}
                  className="absolute flex size-7 -translate-x-full items-center justify-center rounded-full rounded-tr-none border-2 border-dashed border-white bg-accent font-noto text-xs font-bold text-white shadow"
                  style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
                >
                  +
                </button>
              )}
            </SiteCapture>
          </div>
          {showThread && (
            <CommentThread
              ref={threadRef}
              title={threadTitle}
              subtitle={threadIssue.title}
              comments={threadComments}
              detailTo={threadIssue.id !== issue.id ? `/issues/${threadIssue.id}` : undefined}
              pendingPin={!!pendingPin}
              inputRef={inputRef}
              onSubmit={submit}
              onClose={() => closeThread(true)}
              resolved={threadResolved}
              onResolvedChange={pendingPin ? undefined : setThreadResolved}
              style={threadStyle}
            />
          )}
        </div>

        <div className="flex flex-col font-noto text-xs leading-[1.5] text-muted">
          <p>검사 시점 캡처 · {inspection ? formatScannedAt(inspection.scannedAt) : SCAN.scannedAt} · 데스크톱 1440px</p>
          <p>캡처 위 아무 곳이나 클릭하면 코멘트 핀을 꽂을 수 있어요 (키보드: 캡처를 선택해 Enter → 방향키로 이동)</p>
          <p>파란 번호를 누르면 그 위치의 코멘트를 보고 해결할 수 있어요 (번호 옆 숫자 = 코멘트 수, ✓ = 해결됨)</p>
        </div>
        <p role="status" className="sr-only">
          {notice}
        </p>
      </div>

      <IssueSidePanel
        issue={issue}
        order={order}
        resolved={resolved}
        onResolve={() => {
          actions.setResolved(issue.id, true)
          setNotice('해결됨으로 표시했어요. 잘못 눌렀다면 되돌리기를 누르세요.')
        }}
        onReopen={() => {
          actions.setResolved(issue.id, false)
          setNotice('해결 표시를 되돌렸어요. 다시 할 일로 돌아갔어요.')
        }}
        onLocate={locate}
        overlays={inspection?.overlays}
        projectId={inspection?.projectId}
      />
    </div>
  )
}
