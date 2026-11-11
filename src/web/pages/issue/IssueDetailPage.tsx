// Figma: project/issue-detail (554:12276)
// 왼쪽: URL 바 · 검사 시점 캡처(코멘트 핀 + 스레드) / 오른쪽: 이슈 정보 패널
// 캡처를 클릭(또는 키보드로 선택 후 Enter)하면 그 자리에 새 핀이 꽂히고 답글 입력칸으로 포커스가 갑니다.
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Header } from '@/web/layout/Header'
import { actions, findIssueContext, useAppState } from '@/shared/store'
import { CURRENT_USER_ID, memberById } from '@/shared/mocks'
import type { Comment, Inspection, Issue, Project } from '@/shared/api/types'
import { DEFAULT_PROJECT_ID, PROJECT_NAME, SCAN, SITE_URL } from '@/shared/mocks/scan'
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
          comments={comments.filter((c) => c.issueId === issue.id)}
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
  comments: Comment[]
  /** 새로 만든 프로젝트의 이슈일 때만 있음 */
  project?: Project
  inspection?: Inspection
}

function IssueDetail({ issue, issues, comments, project, inspection }: IssueDetailProps) {
  const [overlay, setOverlay] = useState(true)
  const [pendingPin, setPendingPin] = useState<Pin | null>(null)
  const [activePinId, setActivePinId] = useState<string | null>(null)
  // 코멘트 창 열림 — 바깥 클릭 · Esc · ✕ 로 닫고, 핀을 누르거나 새 핀을 꽂으면 열림
  const [threadOpen, setThreadOpen] = useState(true)
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
  const pinned = comments.filter((c): c is Comment & { pin: Pin } => !!c.pin)
  const resolved = issue.status === 'resolved'

  // 스레드는 지금 보고 있는 핀 옆에 붙습니다 (새 핀 > 고른 핀 > 마지막 핀 > 기본 위치)
  const anchor: Pin = pendingPin ?? pinned.find((c) => c.id === activePinId)?.pin ?? pinned[pinned.length - 1]?.pin ?? { x: 37, y: 37 }

  const closeThread = (returnFocus = false) => {
    setThreadOpen(false)
    // 입력 없이 꽂아 둔 새 핀은 같이 취소
    setPendingPin(null)
    if (returnFocus) requestAnimationFrame(() => captureRef.current?.querySelector<HTMLButtonElement>('button')?.focus())
  }

  // 코멘트 창 바깥을 누르면 닫기 (핀 버튼은 창을 여는 쪽이라 제외)
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

  const openPin = (id: string) => {
    setActivePinId(id)
    setThreadOpen(true)
  }

  const addPin = (e: MouseEvent<HTMLButtonElement>) => {
    if (closedByOutsideClick.current) {
      closedByOutsideClick.current = false
      return
    }
    setThreadOpen(true)
    let pin: Pin = { x: 50, y: 50 }
    // 키보드(Enter/Space)로 누르면 detail 이 0 → 가운데에 꽂고 방향키로 옮기게 합니다
    if (e.detail > 0) {
      const r = e.currentTarget.getBoundingClientRect()
      pin = { x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) }
      setPendingPin(pin)
      // 스레드가 접혀 있었다면 펼쳐진 뒤에 입력칸이 생기므로 다음 프레임에 포커스
      requestAnimationFrame(() => inputRef.current?.focus())
    } else {
      setPendingPin(pin)
      // 핀으로 포커스를 옮겨 방향키로 위치를 조정할 수 있게
      requestAnimationFrame(() => pendingRef.current?.focus())
    }
    setNotice('새 코멘트 핀을 꽂았어요. 답글 입력칸에 코멘트를 남겨 주세요.')
  }

  const movePin = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!pendingPin) return
    const step = e.shiftKey ? 10 : 2
    const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (d[e.key]) {
      e.preventDefault()
      setPendingPin({ x: clamp(pendingPin.x + d[e.key][0]), y: clamp(pendingPin.y + d[e.key][1]) })
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
    actions.addComment({ issueId: issue.id, authorId: CURRENT_USER_ID, body, time: '방금', ...(pendingPin ? { pin: pendingPin } : {}) })
    setPendingPin(null)
    setActivePinId(null)
    setNotice('코멘트를 남겼어요.')
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

  const threadStyle: CSSProperties = {
    top: `max(8px, min(${anchor.y}%, calc(100% - 300px)))`,
    ...(anchor.x < 58 ? { left: `calc(${anchor.x}% + 10px)` } : { right: `calc(${100 - anchor.x}% + 38px)` }),
  }

  return (
    <div className="flex flex-1 page-x">
      <div className="flex min-w-0 flex-1 flex-col gap-3.5 py-5 pr-5">
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
              activeIssueId={issue.id}
              flashSelector={flash}
              overlays={inspection?.overlays}
              screenshotUrl={inspection?.capture?.screenshotUrl}
            >
              <button
                type="button"
                onClick={addPin}
                aria-label="캡처에 코멘트 핀 꽂기 — 키보드로 누르면 가운데에 꽂히고, 방향키로 위치를 옮길 수 있어요"
                className="absolute inset-0 cursor-crosshair -outline-offset-4"
              />
              {pinned.map((c, n) => {
                const author = memberById(c.authorId)
                return (
                  <button
                    key={c.id}
                    type="button"
                    data-comment-pin
                    onClick={() => openPin(c.id)}
                    aria-label={`코멘트 핀 ${n + 1}: ${author?.name ?? ''} — ${c.body}`}
                    aria-pressed={anchor === c.pin}
                    className="absolute flex size-7 -translate-x-full items-center justify-center rounded-full rounded-tr-none border-2 border-white bg-black font-noto text-xs leading-[1.5] font-bold text-white shadow"
                    style={{ left: `${c.pin.x}%`, top: `${c.pin.y}%` }}
                  >
                    {n + 1}
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
          {threadOpen && (
            <CommentThread
              ref={threadRef}
              issue={issue}
              comments={comments}
              pendingPin={!!pendingPin}
              inputRef={inputRef}
              onSubmit={submit}
              onClose={() => closeThread(true)}
              style={threadStyle}
            />
          )}
        </div>

        <div className="flex flex-col font-noto text-xs leading-[1.5] text-muted">
          <p>검사 시점 캡처 · {inspection ? formatScannedAt(inspection.scannedAt) : SCAN.scannedAt} · 데스크톱 1440px</p>
          <p>캡처 위 아무 곳이나 클릭하면 코멘트 핀을 꽂을 수 있어요 (키보드: 캡처를 선택해 Enter → 방향키로 이동)</p>
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
