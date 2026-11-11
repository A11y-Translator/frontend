// Figma: project/inspection · 접근성 검사 (562:2136)
// 제목 · 요약 숫자 · 카테고리/페이지 필터 · 이슈 목록 · 오른쪽 "검사 화면 · 문제 위치" 미리보기.
// 목록에서 행을 고르면 미리보기(페이지 탭, 오버레이 강조, 요약)가 따라 바뀝니다.
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Header } from '@/web/layout/Header'
import { actions, useAppState } from '@/shared/store'
import { memberById, versions as mockVersions } from '@/shared/mocks'
import type { Issue } from '@/shared/api/types'
import { DEFAULT_PROJECT_ID, PROJECT_NAME, SCAN } from '@/shared/mocks/scan'
import { CATEGORY_FILTERS, commentCount, deriveStats, formatScannedAt, isResolved, tagKindOf } from '@/web/common/issueHelpers'
import { StatusTag } from '@/web/common/StatusTag'
import { OpenInChromeLink } from '@/web/common/OpenInChromeLink'
import { InspectionPreview } from './InspectionPreview'
import { useVersionMenu } from '@/web/common/useVersionMenu'

export default function InspectionResultPage() {
  const { projectId = DEFAULT_PROJECT_ID } = useParams()
  const [params] = useSearchParams()
  const v = Number(params.get('v')) || undefined
  // ?page=/main → 그 페이지로 거른 상태로 시작 (리포트 "검사 페이지"에서 넘어올 때)
  const initialPage = params.get('page') ?? undefined
  // 프로젝트·버전·페이지가 바뀌면 선택·필터 상태를 새로 시작
  return (
    <InspectionResult key={`${projectId}-${v ?? 'latest'}-${initialPage ?? ''}`} projectId={projectId} requestedVersion={v} initialPage={initialPage} />
  )
}

type StatusFilter = 'all' | 'open' | 'resolved'
const STATUS_FILTERS: { id: StatusFilter; label: string; match: (i: Issue) => boolean }[] = [
  { id: 'all', label: '전체', match: () => true },
  { id: 'open', label: '미해결', match: (i) => !isResolved(i) },
  { id: 'resolved', label: '해결됨', match: isResolved },
]

function InspectionResult({ projectId, requestedVersion, initialPage }: { projectId: string; requestedVersion?: number; initialPage?: string }) {
  const state = useAppState()
  const { comments } = state
  const versionMenu = useVersionMenu(projectId)
  const project = state.projects.find((p) => p.id === projectId)

  // 새로 만든 프로젝트면 검사 기록에서 요청한 버전(없으면 최신), 아니면 기존 데모(프로젝트B) 데이터
  const history = state.inspectionHistory[projectId] ?? (state.inspections[projectId] ? [state.inspections[projectId]] : [])
  const latestInspection = history[history.length - 1]
  const inspection = (requestedVersion && history.find((h) => h.version === requestedVersion)) || latestInspection
  const latestVersion = latestInspection?.version ?? state.currentVersion
  const viewingVersion = inspection ? inspection.version : (requestedVersion ?? state.currentVersion)
  const isPast = viewingVersion !== latestVersion
  // 데모 프로젝트B 의 지난 버전: 이슈 목록은 데모 데이터에 없고 요약 숫자만 있어요
  const demoPast = !inspection && isPast ? mockVersions.find((m) => m.no === viewingVersion) : undefined
  const demoOlder = demoPast ? mockVersions.find((m) => m.no < demoPast.no) : undefined

  const issues = inspection ? inspection.issues : isPast ? state.issues.filter((i) => i.version === viewingVersion) : state.issues
  const prevInspection = inspection ? history.find((h) => h.version === inspection.version - 1) : undefined
  const stats = inspection
    ? {
        total: issues.length,
        delta: prevInspection ? issues.length - prevInspection.issues.length : 0,
        remainingComments: comments.filter((c) => issues.some((i) => i.id === c.issueId)).length,
      }
    : demoPast
      ? { total: demoPast.issues, delta: demoPast.issues - (demoOlder?.issues ?? demoPast.issues), remainingComments: demoPast.remainingComments }
      : deriveStats(state)
  const scan = inspection
    ? {
        scannedAt: formatScannedAt(inspection.scannedAt),
        pages: inspection.pages.length,
        pagesNote: inspection.pages.join(' · '),
        standard: inspection.standard,
        passRate: inspection.passRate,
        mentions: 0,
      }
    : demoPast
      ? { ...SCAN, scannedAt: demoPast.date }
      : SCAN
  const [rechecking, setRechecking] = useState(false)

  const [category, setCategory] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(initialPage ?? 'all')
  const firstInPage = initialPage ? issues.find((i) => i.page === initialPage) : undefined
  const [selectedId, setSelectedId] = useState<string>((firstInPage ?? issues[0])?.id ?? '')
  const [previewPage, setPreviewPage] = useState(initialPage ?? issues[0]?.page ?? '/main')
  const [notice, setNotice] = useState('')

  const pageOptions = useMemo(
    () => [...new Set([...issues.map((i) => i.page), ...(initialPage ? [initialPage] : [])])],
    [issues, initialPage],
  )

  // 칩 숫자는 store 이슈 기준 (페이지 필터가 걸려 있으면 그 페이지 안에서 셉니다)
  const inPage = issues.filter((i) => page === 'all' || i.page === page)
  const status = STATUS_FILTERS.find((f) => f.id === statusFilter) ?? STATUS_FILTERS[0]
  const inStatus = inPage.filter(status.match)
  const filter = CATEGORY_FILTERS.find((f) => f.id === category) ?? CATEGORY_FILTERS[0]
  const visible = inStatus.filter((i) => filter.match(i.category))
  const selected = issues.find((i) => i.id === selectedId) ?? visible[0] ?? issues[0]

  const select = (i: Issue) => {
    setSelectedId(i.id)
    setPreviewPage(i.page)
  }

  const recheck = async () => {
    if (inspection) {
      if (rechecking) return
      setRechecking(true)
      setNotice('')
      try {
        const next = await actions.reinspect(projectId)
        setNotice(`재검사를 마쳤어요. 버전 ${next?.version ?? ''} · 이슈 ${next?.issues.length ?? 0}개`)
      } catch (err) {
        setNotice(err instanceof Error ? err.message : '재검사하지 못했어요.')
      } finally {
        setRechecking(false)
      }
      return
    }
    actions.recheck()
    setNotice('재검사를 마쳤어요. 수정안을 적용한 이슈는 자동으로 해결돼요.')
  }

  return (
    <>
      <Header
        version={`버전 ${viewingVersion}`}
        project={project?.name ?? PROJECT_NAME}
        status={latestInspection ? `마지막 검사 ${formatScannedAt(latestInspection.scannedAt).slice(-5)} · 이슈 ${latestInspection.issues.length}개` : undefined}
        right={<OpenInChromeLink />}
        versionMenu={versionMenu}
        viewingVersion={viewingVersion}
      />
      <div className="flex flex-1 flex-col gap-8 bg-white page-x pt-8 pb-12">
        {/* Title row */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.45]">
            <h1 className="text-[30px] font-bold text-ink-2">접근성 검사</h1>
            <p className="text-[15px] text-muted-2">
              버전 {viewingVersion} · {scan.scannedAt} 검사 · 페이지 {scan.pages}개 · {scan.standard} 기준
              {inspection?.source === 'live' && ` · 실제 페이지 검사(axe-core)${inspection.needsReview ? ` · 직접 확인 필요 ${inspection.needsReview}개` : ''}`}
              {inspection?.source === 'mock' && ' · 임시 규칙 결과'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/report"
              className="rounded-full border border-ext-line bg-white px-4 py-2.5 font-noto text-sm leading-[1.4] font-bold text-black hover:bg-web-chip"
            >
              결과 내보내기
            </Link>
            {!isPast && (
            <button
              type="button"
              onClick={recheck}
              aria-disabled={rechecking || undefined}
              className="rounded-full bg-black px-4 py-2.5 font-noto text-sm leading-[1.4] font-bold text-white hover:bg-ink-3 aria-disabled:cursor-wait aria-disabled:bg-muted-2"
            >
              {rechecking ? '재검사 중…' : '재검사'}
            </button>
            )}
          </div>
        </div>
        {inspection?.warning && (
          <p role="note" className="-mt-4 rounded-[10px] border border-[#f5c26b] bg-[#fff8e6] px-4 py-3 text-sm text-[#7a4d00]">
            <strong className="font-bold">결과를 확인해 주세요 · </strong>
            {inspection.warning}
          </p>
        )}
        {isPast && (
          <div role="note" className="-mt-4 flex flex-wrap items-center gap-3 rounded-[10px] border border-tag-info-line bg-[rgb(48_134_255/0.06)] px-4 py-3 text-sm text-ink-2">
            <span>
              지난 버전(버전 {viewingVersion})을 보고 있어요.
              {demoPast && ' 데모 데이터에는 이 버전의 요약 숫자만 남아 있어요.'}
            </span>
            <Link to={`/projects/${projectId}/inspection`} className="font-bold text-[#175fc2] underline">
              최신 버전 {latestVersion} 보기
            </Link>
          </div>
        )}
        <p role="status" className="-mt-4 text-sm font-medium text-success empty:hidden">
          {notice}
        </p>

        {/* Stats */}
        <section aria-label="검사 요약">
          <ul className="grid grid-cols-4 gap-4">
            <StatCard label="전체 이슈" value={String(stats.total)}>
              {inspection && !prevInspection ? (
                '첫 검사'
              ) : (
                <>
                  이전 버전 대비 <span className="font-medium text-[#175fc2]">{stats.delta > 0 ? `+${stats.delta}` : stats.delta}</span>
                </>
              )}
            </StatCard>
            <StatCard label="기준 통과율" value={`${scan.passRate}%`}>
              <span
                role="progressbar"
                aria-label="기준 통과율"
                aria-valuenow={scan.passRate}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-2 block h-1.5 w-full overflow-hidden rounded-[3px] bg-web-line-2"
              >
                <span className="block h-full rounded-[3px] bg-ink-2" style={{ width: `${scan.passRate}%` }} />
              </span>
            </StatCard>
            <StatCard label="검사 페이지" value={String(scan.pages)}>
              {scan.pagesNote}
            </StatCard>
            <StatCard label="남은 코멘트" value={String(stats.remainingComments)}>
              멘션 {scan.mentions}개 포함
            </StatCard>
          </ul>
        </section>

        <div className="flex items-start gap-5">
          {/* Issue list */}
          <section aria-labelledby="issue-list-title" className="flex min-w-0 flex-1 flex-col gap-3">
            <h2 id="issue-list-title" className="sr-only">
              이슈 목록
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <div role="group" aria-label="해결 여부로 거르기" className="mr-2 flex rounded-full bg-web-chip p-0.5">
                {STATUS_FILTERS.map((f) => {
                  const on = f.id === statusFilter
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setStatusFilter(f.id)}
                      className={`rounded-full px-3 py-1 text-[13px] leading-[1.45] whitespace-nowrap ${on ? 'bg-white font-bold text-ink-2 shadow-[0_1px_2px_rgba(0,0,0,0.12)]' : 'font-medium text-muted-2 hover:text-ink-2'}`}
                    >
                      {f.label} {inPage.filter(f.match).length}
                    </button>
                  )
                })}
              </div>
              <div role="group" aria-label="카테고리로 거르기" className="flex flex-wrap gap-1.5">
                {CATEGORY_FILTERS.map((f) => {
                  const on = f.id === category
                  const n = inStatus.filter((i) => f.match(i.category)).length
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setCategory(f.id)}
                      className={`rounded-full border px-3 py-[5px] text-[13px] leading-[1.45] whitespace-nowrap ${on ? 'border-ink-2 bg-ink-2 font-bold text-white' : 'border-[#d9d9d9] bg-white font-medium text-ink-2 hover:bg-web-chip'}`}
                    >
                      {f.label} {n}
                    </button>
                  )
                })}
              </div>
              <div className="flex-1" />
              <label className="flex items-center gap-1 text-[13px] leading-[1.45] font-medium text-muted-2">
                페이지:
                <select
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  className="cursor-pointer rounded-md bg-transparent py-0.5 pr-1 font-medium text-muted-2 hover:bg-web-chip"
                >
                  <option value="all">전체</option>
                  {pageOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p role="status" className="sr-only">
              이슈 {visible.length}개 표시 중
            </p>

            {visible.length === 0 ? (
              <p className="rounded-[10px] border border-[#d9d9d9] bg-white px-4 py-10 text-center text-sm text-muted-2">
                {demoPast
                  ? '데모 데이터에는 이 버전의 이슈 목록이 없어요.'
                  : issues.length === 0
                    ? inspection?.passedRules
                      ? `발견된 이슈가 없어요. 이 페이지에 해당하는 검사 규칙 ${inspection.passedRules}개를 모두 통과했어요!${inspection.needsReview ? ` (자동으로 판단하기 어려운 ${inspection.needsReview}개는 직접 확인해 주세요)` : ''}`
                      : '발견된 이슈가 없어요. 기준을 모두 통과했어요!'
                    : statusFilter === 'resolved'
                      ? '아직 해결된 이슈가 없어요.'
                      : '조건에 맞는 이슈가 없어요.'}
              </p>
            ) : (
              <ul className="overflow-hidden rounded-[10px] border border-[#d9d9d9] bg-white">
                {visible.map((i, idx) => (
                  <IssueRow key={i.id} issue={i} first={idx === 0} selected={i.id === selected?.id} count={commentCount(i, comments)} onSelect={() => select(i)} />
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-2">
              <span id="issue-row-hint">행을 선택하면 오른쪽 미리보기에서 문제 위치를 보여줘요. 더블클릭(키보드는 선택한 행에서 Enter 한 번 더)하면 이슈 상세로 가요.</span> {project?.name ?? `프로젝트 ${projectId.toUpperCase()}`} · 전체 {stats.total}개 중 {visible.length}개 표시
            </p>
          </section>

          {/* Preview */}
          {selected && (
            <InspectionPreview
              issue={selected}
              page={previewPage}
              onPageChange={setPreviewPage}
              pages={inspection?.pages}
              overlays={inspection?.overlays}
              screenshotUrl={inspection?.capture?.screenshotUrl}
            />
          )}
        </div>
      </div>
    </>
  )
}

function StatCard({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <li className="flex h-[99px] min-w-0 flex-col gap-0.5 rounded-[10px] border border-[#d9d9d9] bg-white p-[13px] leading-[1.45]">
      <span className="text-xs font-medium text-ink-2">{label}</span>
      <span className="text-2xl font-bold text-black">{value}</span>
      <span className="text-[11px] text-muted-2">{children}</span>
    </li>
  )
}

interface IssueRowProps {
  issue: Issue
  first: boolean
  selected: boolean
  count: number
  onSelect: () => void
}

function IssueRow({ issue, first, selected, count, onSelect }: IssueRowProps) {
  const navigate = useNavigate()
  const openDetail = () => navigate(`/issues/${issue.id}`)
  const done = isResolved(issue)
  const assignee = memberById(issue.assigneeId)
  const meta = done
    ? `${issue.category} · 버전 ${issue.version}에서 해결${issue.autoResolved ? ' · 재검사로 자동 해결' : ''}`
    : `${issue.category} · 요소 ${issue.elements}개 · ${issue.page}`

  return (
    <li className={first ? '' : 'border-t border-[#ececec]'}>
      <button
        type="button"
        aria-pressed={selected}
        // 한 번 클릭 = 선택(오른쪽 미리보기), 더블클릭 = 이슈 상세로.
        // 키보드: Enter/Space 로 선택 → 이미 선택된 행에서 한 번 더 누르면 상세로 (e.detail 0 = 키보드로 누름)
        onClick={(e) => {
          if (e.detail === 0 && selected) return openDetail()
          onSelect()
        }}
        onDoubleClick={openDetail}
        aria-describedby="issue-row-hint"
        className={`flex w-full items-center gap-3.5 border-l-3 px-4 py-[11px] text-left -outline-offset-2 ${selected ? 'border-ink-2 bg-web-chip' : 'border-transparent bg-white hover:bg-web-chip/60'}`}
      >
        <span className="flex w-[66px] shrink-0">
          <StatusTag kind={tagKindOf(issue)} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-px leading-[1.45]">
          <span className={`truncate text-sm font-medium ${done ? 'text-muted-2' : 'text-ink-2'}`}>{issue.title}</span>
          <span className="truncate text-xs text-muted-2">{meta}</span>
        </span>
        {count > 0 && <span className="shrink-0 text-xs text-muted-2">코멘트 {count}</span>}
        {assignee ? (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e9eaec] text-[10px] font-bold text-ink-3">
            <span aria-hidden>{assignee.initial}</span>
            <span className="sr-only">담당 {assignee.name}</span>
          </span>
        ) : (
          <span className="shrink-0 text-xs font-medium text-danger">미배정</span>
        )}
      </button>
    </li>
  )
}
