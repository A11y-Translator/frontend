import { useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { actions, useAppState } from '@/shared/store'
import { CURRENT_USER_ID, memberById } from '@/shared/mocks'
import {
  DEFAULT_PROJECT_ID,
  OVERLAYS,
  PAGES,
  MORE_PAGES,
  SCAN,
  SITE_URL,
} from '@/shared/mocks/scan'
import { screenshotFor, type Issue } from '@/shared/api/types'
import { CATEGORY_FILTERS, formatScannedAt, isResolved } from '@/web/common/issueHelpers'
import { SiteCapture, type SiteCaptureHandle } from '@/web/common/SiteCapture'
import { IssueSidePanel } from '@/web/pages/issue/IssueSidePanel'
import { CommentThread } from '@/web/pages/issue/CommentThread'
import { ProgressMountain3D } from '@/web/common/ProgressMountain3D'
import back from '@/shared/assets/figma/chevron-left.svg'
import refresh from '@/shared/assets/figma/refresh-white.svg'
import pageIcon from '@/shared/assets/figma/page.svg'
import './inspection-result.css'

export default function InspectionResultPage() {
  const { projectId = DEFAULT_PROJECT_ID } = useParams()
  const [params] = useSearchParams()
  return (
    <InspectionResult
      key={`${projectId}-${params.get('v') ?? 'latest'}`}
      projectId={projectId}
      requestedVersion={Number(params.get('v')) || undefined}
      initialPage={params.get('page') ?? undefined}
      initialIssue={params.get('issue') ?? undefined}
    />
  )
}

function InspectionResult({
  projectId,
  requestedVersion,
  initialPage,
  initialIssue,
}: {
  projectId: string
  requestedVersion?: number
  initialPage?: string
  initialIssue?: string
}) {
  const state = useAppState()
  const project = state.projects.find((p) => p.id === projectId)
  const history =
    state.inspectionHistory[projectId] ??
    (state.inspections[projectId] ? [state.inspections[projectId]] : [])
  const latest = history[history.length - 1]
  const inspection = requestedVersion ? history.find((h) => h.version === requestedVersion) : latest
  const isPast =
    !!requestedVersion && requestedVersion !== (latest?.version ?? state.currentVersion)
  const issues =
    inspection?.issues ??
    (isPast ? state.issues.filter((i) => i.version === requestedVersion) : state.issues)
  const pages = inspection?.pages ?? [...PAGES, ...MORE_PAGES]
  const [page, setPage] = useState(
    initialPage && pages.includes(initialPage)
      ? initialPage
      : (issues.find((i) => i.id === initialIssue)?.page ?? pages[0] ?? '/'),
  )
  const [selectedId, setSelectedId] = useState<string | null>(initialIssue ?? null)
  const [activeId, setActiveId] = useState(issues.find((i) => i.page === page)?.id ?? '')
  const [status, setStatus] = useState<'open' | 'resolved'>('open')
  const [category, setCategory] = useState('all')
  const [overlay, setOverlay] = useState(true)
  const [rechecking, setRechecking] = useState(false)
  const [notice, setNotice] = useState('')
  const [flash, setFlash] = useState<string>()
  const inputRef = useRef<HTMLInputElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const siteCaptureRef = useRef<SiteCaptureHandle>(null)
  const listHeadingRef = useRef<HTMLHeadingElement>(null)
  const inPage = issues.filter((i) => i.page === page)
  const filter = CATEGORY_FILTERS.find((f) => f.id === category) ?? CATEGORY_FILTERS[0]
  const visible = inPage.filter(
    (i) => isResolved(i) === (status === 'resolved') && filter.match(i.category),
  )
  const selected = inPage.find((i) => i.id === selectedId)
  const active = selected ?? visible.find((i) => i.id === activeId) ?? visible[0]
  const boxes = inspection?.overlays ?? OVERLAYS
  const image = screenshotFor(inspection, page)
  const select = (issue: Issue) => {
    setSelectedId(issue.id)
    setActiveId(issue.id)
    setFlash(undefined)
  }
  const recheck = async () => {
    if (rechecking) return
    setRechecking(true)
    setNotice('')
    try {
      if (inspection) {
        const next = await actions.reinspect(projectId)
        setNotice(`재검사를 마쳤어요. 이슈 ${next?.issues.length ?? 0}개`)
      } else {
        actions.recheck()
        setNotice('데모 재검사를 마쳤어요. 실제 사이트를 검사한 결과는 아니에요.')
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : '재검사하지 못했어요.')
    } finally {
      setRechecking(false)
    }
  }
  // 프로젝트 진행도 (3D 산): 이 버전의 모든 페이지 이슈 중 해결한 비율 + 지난 버전들의 해결률
  const [showProgress, setShowProgress] = useState(true)
  const solvedCount = issues.filter(isResolved).length
  const progress = issues.length ? Math.round((solvedCount / issues.length) * 100) : 0
  const importantLeft = issues.filter((i) => !isResolved(i) && i.priority === 'high').length
  const milestones = history
    .filter((h) => h !== inspection && h.issues.length > 0 && (!inspection || h.version < inspection.version))
    .slice(-5)
    .map((h) => ({ label: `v${h.version}`, percent: Math.round((h.issues.filter(isResolved).length / h.issues.length) * 100) }))
  const comments = state.comments.filter((c) => c.issueId === selected?.id)
  return (
    <div className="inspection-result">
      <section className="inspection-result__main" aria-label="검사 결과 화면">
        <Link to="/" className="inspection-result__back">
          <img src={back} alt="" width="16" height="16" />홈
        </Link>
        <header className="inspection-result__header">
          <div>
            <div>
              <h1>{project?.name ?? '프로젝트'}</h1>
              <span className="inspection-project-status">
                {project?.status === 'done' ? '완료' : '진행중'}
              </span>
            </div>
            <p>
              {(inspection?.url ?? project?.url ?? SITE_URL).replace(/^https?:\/\//, '')} ·{' '}
              {inspection ? formatScannedAt(inspection.scannedAt) : SCAN.scannedAt} 검사
            </p>
          </div>
          <button
            type="button"
            className="inspection-action"
            disabled={isPast || rechecking}
            onClick={() => void recheck()}
          >
            <img src={refresh} alt="" width="16" height="16" />
            {rechecking ? '검사 중…' : '재검사'}
          </button>
        </header>
        <section aria-labelledby="project-progress-title" className="rounded-2xl bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="project-progress-title" className="text-base font-semibold">
              프로젝트 진행도 <span className="ml-1 text-[#1d4ed8]">{progress}%</span>
            </h2>
            <button
              type="button"
              aria-expanded={showProgress}
              aria-controls="project-progress-body"
              onClick={() => setShowProgress((v) => !v)}
              className="rounded-lg px-2 py-1 text-sm text-[#5c6068] hover:bg-[#f4f5f7]"
            >
              {showProgress ? '접기' : '펼치기'}
            </button>
          </div>
          {showProgress && (
            <div id="project-progress-body" className="mt-2 grid grid-cols-1 items-center gap-4 @3xl:grid-cols-[minmax(0,1fr)_200px]">
              <ProgressMountain3D
                percent={progress}
                milestones={milestones}
                seedKey={projectId}
                label={`프로젝트 진행도 산: 이슈 ${issues.length}개 중 ${solvedCount}개 해결, 정상까지 ${progress}% 올라왔어요.${
                  milestones.length ? ` 지난 버전 ${milestones.map((m) => `${m.label} ${m.percent}%`).join(', ')}.` : ''
                }`}
                className="h-[240px] w-full"
              />
              <dl className="grid grid-cols-3 gap-3 text-sm @3xl:grid-cols-1">
                <div>
                  <dt className="text-[#5c6068]">해결한 이슈</dt>
                  <dd className="text-xl font-bold">
                    {solvedCount}
                    <span className="text-sm font-medium text-[#5c6068]"> / {issues.length}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[#5c6068]">남은 중요 이슈</dt>
                  <dd className="text-xl font-bold text-[#d93636]">{importantLeft}</dd>
                </div>
                <div>
                  <dt className="text-[#5c6068]">검사 버전</dt>
                  <dd className="text-xl font-bold">{inspection ? `v${inspection.version}` : `v${state.currentVersion}`}</dd>
                </div>
                <p className="col-span-3 text-xs text-[#8a8f98] @3xl:col-span-1">끌어서 산을 돌려 볼 수 있어요</p>
              </dl>
            </div>
          )}
        </section>
        <div className="inspection-result__toolbar">
          <label className="inspection-page-select">
            <img src={pageIcon} alt="" width="16" height="16" />
            <span className="sr-only">검사 페이지</span>
            <select
              value={page}
              onChange={(e) => {
                setPage(e.target.value)
                setSelectedId(null)
                setFlash(undefined)
              }}
            >
              {pages.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <span>
              페이지 {pages.indexOf(page) + 1} / {pages.length}
            </span>
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={overlay}
            className="inspection-overlay-toggle"
            onClick={() => setOverlay(!overlay)}
          >
            문제 위치 표시
            <span aria-hidden className={overlay ? 'is-on' : ''}>
              <i />
            </span>
          </button>
        </div>
        {(notice || inspection?.warning || isPast) && (
          <p role="status" className="inspection-result__notice">
            {notice ||
              inspection?.warning ||
              `버전 ${requestedVersion}의 지난 검사 결과예요. 담당자와 해결 상태는 최신 버전에서 변경할 수 있어요.`}
          </p>
        )}
        <div className="inspection-result__capture" ref={captureRef}>
          {inspection && !image ? (
            <div className="inspection-result__no-capture">
              <h2>검사 시점 캡처가 없어요</h2>
              <p>이슈 목록과 검출 내용은 오른쪽에서 확인할 수 있어요.</p>
            </div>
          ) : (
            <SiteCapture
              ref={siteCaptureRef}
              page={page}
              label={`${page} 검사 시점 화면`}
              overlays={boxes}
              screenshotUrl={image}
              activeIssueId={active?.id}
              flashSelector={flash}
              showOverlay={overlay}
              onIssueSelect={(id) => {
                const issue = issues.find((i) => i.id === id)
                if (issue) select(issue)
              }}
              issueNumbers={Object.fromEntries(issues.map((i) => [i.id, i.no]))}
            />
          )}
        </div>
        <footer className="inspection-result__footer">
          <span>
            버전 {inspection?.version ?? requestedVersion ?? state.currentVersion} ·{' '}
            {inspection?.standard ?? 'WCAG 2.2 AA'} 관련 자동 검사
          </span>
          <div>
            {history.length > 1 && (
              <label>
                검사 버전{' '}
                <select
                  aria-label="검사 버전"
                  value={inspection?.version}
                  onChange={(e) => {
                    location.href = `/projects/${encodeURIComponent(projectId)}/inspection?v=${e.target.value}`
                  }}
                >
                  {history.map((h) => (
                    <option key={h.id} value={h.version}>
                      버전 {h.version}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Link to="/report">결과 내보내기</Link>
          </div>
        </footer>
      </section>
      <div className="inspection-result__panel">
        {selected ? (
          <IssueSidePanel
            key={selected.id}
            issue={selected}
            order={inPage}
            resolved={isResolved(selected)}
            projectId={projectId}
            overlays={boxes}
            onBack={() => {
              setSelectedId(null)
              requestAnimationFrame(() => listHeadingRef.current?.focus())
            }}
            readOnly={isPast}
            codeIsEvidence={inspection?.source === 'live'}
            onResolve={() => actions.setResolved(selected.id, true)}
            onReopen={() => actions.setResolved(selected.id, false)}
            onLocate={(selector) => {
              setOverlay(true)
              setFlash(selector)
              siteCaptureRef.current?.scrollToIssue(selected.id, selector)
              captureRef.current?.scrollIntoView({
                block: 'nearest',
                behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
                  ? 'instant'
                  : 'smooth',
              })
            }}
          >
            {!isPast && (
              <CommentThread
                embedded
                title={`코멘트 ${comments.length}`}
                subtitle={selected.title}
                comments={comments}
                pendingPin={false}
                inputRef={inputRef}
                resolved={false}
                onClose={() => setSelectedId(null)}
                onSubmit={(body) =>
                  actions.addComment({
                    issueId: selected.id,
                    authorId: CURRENT_USER_ID,
                    body,
                    time: '방금',
                  })
                }
              />
            )}
          </IssueSidePanel>
        ) : (
          <aside className="inspection-list" aria-labelledby="inspection-list-title">
            <h2 id="inspection-list-title" ref={listHeadingRef} tabIndex={-1}>
              이 페이지의 이슈 <span>{inPage.length}</span>
            </h2>
            <div className="inspection-list__filters">
              <div role="group" aria-label="해결 여부">
                {(['open', 'resolved'] as const).map((value) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={status === value}
                    onClick={() => setStatus(value)}
                  >
                    {value === 'open' ? '해결 전' : '해결됨'}{' '}
                    {inPage.filter((i) => isResolved(i) === (value === 'resolved')).length}
                  </button>
                ))}
              </div>
              <select
                aria-label="이슈 유형"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORY_FILTERS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <ul>
              {visible.map((issue) => {
                const assignee = memberById(issue.assigneeId)
                return (
                  <li key={issue.id}>
                    <button
                      type="button"
                      className={active?.id === issue.id ? 'is-active' : ''}
                      onClick={() => select(issue)}
                      onMouseEnter={() => setActiveId(issue.id)}
                      onFocus={() => setActiveId(issue.id)}
                    >
                      <span
                        className={`inspection-issue-number ${active?.id === issue.id ? 'is-active' : ''}`}
                      >
                        {issue.no}
                      </span>
                      <span className="inspection-list__text">
                        <span>
                          {issue.title}
                          {issue.priority === 'high' && (
                            <b className="inspection-important">중요</b>
                          )}
                        </span>
                        <small>
                          {issue.category} · 요소 {issue.elements}개
                        </small>
                      </span>
                      {assignee ? (
                        <span className="inspection-avatar" aria-label={`담당 ${assignee.name}`}>
                          {assignee.initial}
                        </span>
                      ) : (
                        <span className="inspection-list__unassigned">미배정</span>
                      )}
                      <span aria-hidden className="inspection-list__chevron">
                        ›
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            {!visible.length && (
              <p className="inspection-list__empty">
                {inPage.length
                  ? '조건에 맞는 이슈가 없어요.'
                  : '자동 검사에서 이슈를 찾지 못했어요. 수동 점검도 필요해요.'}
              </p>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
