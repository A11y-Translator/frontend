// Figma: report (533:7224) — 참고: 08 · web/report (547:1272)
// 제목(현재 작업 중인 버전) · 버전 요약 숫자 · 상태별 개수 · 버전 관리 목록 · 오른쪽 이슈/코멘트
// 재검사(확장)로 자동 해결된 이슈가 생기면 해결됨/미해결 숫자가 바로 바뀝니다.
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/web/layout/Header'
import { useAppState } from '@/shared/store'
import { versions } from '@/shared/mocks'
import reportIssues from '@/web/assets/report-issues.png'
import reportComments from '@/web/assets/report-comments.png'
import { PROJECT_NAME, SCAN } from '@/shared/mocks/scan'
import { deriveStats, isResolved } from '@/web/common/issueHelpers'
import { StatusTag } from '@/web/common/StatusTag'
import { VersionRow } from './VersionRow'
import { useVersionMenu } from '@/web/common/useVersionMenu'
import { VersionIssues } from './VersionIssues'
import { ReportDrillDialog, type DrillKind } from './ReportDrillDialog'

export default function VersionReportPage() {
  const state = useAppState()
  const { issues, comments, currentVersion } = state
  const versionMenu = useVersionMenu()
  const [drill, setDrill] = useState<DrillKind | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const stats = deriveStats(state)
  const autoResolved = issues.filter((i) => i.autoResolved && isResolved(i)).length
  const inProgress = issues.filter((i) => i.status === 'in_progress' || i.status === 'review').length

  // 버전 관리 목록: 현재 버전부터 1까지. mocks 에 없는 버전은 디자인 값(남은 코멘트 0, 2026.10.31)
  const versionList = Array.from({ length: currentVersion }, (_, k) => {
    const no = currentVersion - k
    const v = versions.find((x) => x.no === no)
    if (v) return { no, date: v.date, remainingComments: no === currentVersion ? stats.unresolved : v.remainingComments }
    // 재검사로 새로 생긴 버전
    if (no > (versions[0]?.no ?? 0)) return { no, date: '오늘', remainingComments: stats.unresolved }
    return { no, date: '2026.10.31', remainingComments: 0 }
  })

  return (
    <>
      <Header version={`버전 ${currentVersion}`} project={PROJECT_NAME} versionMenu={versionMenu} viewingVersion={currentVersion} />
      <div className="flex flex-1 flex-col gap-6 bg-white page-x pt-12 pb-10">
        <div className="flex flex-col gap-[3px]">
          <h1 className="text-[32px] leading-[1.6] font-bold text-black">버전 {currentVersion}</h1>
          <p className="text-xl leading-[1.45] text-muted">현재 작업 중인 버전</p>
        </div>

        <div className="flex items-start gap-5">
          <div className="flex min-w-0 flex-1 flex-col gap-8 px-2.5">
            {/* Version summary */}
            <section aria-label="버전 요약" className="flex flex-col gap-3.5">
              <ul className="grid grid-cols-2 gap-3">
                <SummaryCard label="전체 이슈" value={stats.total} image={reportIssues} onOpen={() => setDrill('issues')}>
                  이전 버전 대비 <span className="text-[#175fc2]">{stats.delta > 0 ? `+${stats.delta}` : stats.delta}</span>
                </SummaryCard>
                <SummaryCard label="남은 코멘트" value={stats.remainingComments} image={reportComments} onOpen={() => setDrill('comments')}>
                  멘션 {SCAN.mentions}개 포함
                </SummaryCard>
                <SummaryCard label="해결됨" value={stats.resolved} onOpen={() => setDrill('resolved')}>
                  이번 버전에서 해결{autoResolved > 0 ? ` · 재검사 자동 해결 ${autoResolved}개 포함` : ''}
                </SummaryCard>
                <SummaryCard label="검사 페이지" value={SCAN.pages} onOpen={() => setDrill('pages')}>
                  {SCAN.pagesNote}
                </SummaryCard>
              </ul>
              <p id="summary-hint" className="-mt-1.5 px-1 text-xs text-muted-2">
                카드를 더블클릭(키보드는 Enter)하면 중요한 순서대로 자세히 볼 수 있어요.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <ul aria-label="상태별 이슈 수" className="flex flex-wrap items-center gap-2">
                  <TagCount kind="important" count={SCAN.important} />
                  <TagCount kind="progress" count={inProgress || SCAN.inProgress} />
                  <TagCount kind="done" count={stats.resolved} />
                </ul>
                <div className="flex-1" />
                <Link to="/extension" className="rounded-full bg-black px-4 py-2.5 font-noto text-sm leading-[1.4] font-bold text-white hover:bg-ink-3">
                  확장 프로그램에서 열기
                </Link>
              </div>
            </section>

            {/* 버전 관리 */}
            <section aria-labelledby="versions-title" className="flex flex-col gap-3">
              <div className="flex items-baseline gap-3 px-4">
                <h2 id="versions-title" className="text-base leading-[1.45] font-semibold text-black">
                  버전 관리
                </h2>
                <p id="versions-hint" className="text-xs text-muted-2">
                  더블클릭(키보드는 선택 후 Enter 한 번 더)하면 그 버전을 볼 수 있어요.
                </p>
              </div>
              <ul className="flex flex-col gap-1.5 rounded-[10px] border border-[#d9d9d9] py-2">
                {versionList.map((v) => (
                  <VersionRow
                    key={v.no}
                    {...v}
                    current={v.no === currentVersion}
                    selected={selectedVersion === v.no}
                    onSelect={() => setSelectedVersion(v.no)}
                    hintId="versions-hint"
                  />
                ))}
              </ul>
            </section>
          </div>

          <VersionIssues version={currentVersion} issues={issues} comments={comments} unresolvedTotal={stats.unresolved} resolvedTotal={stats.resolved} />
        </div>
      </div>
      <ReportDrillDialog
        kind={drill}
        onClose={() => setDrill(null)}
        issues={issues}
        comments={comments}
        totals={{ issues: stats.total, comments: stats.remainingComments, resolved: stats.resolved, pages: SCAN.pages }}
      />
    </>
  )
}

/** 요약 카드 — 더블클릭(키보드는 Enter/Space)하면 자세히 보기 창 */
function SummaryCard({ label, value, image, children, onOpen }: { label: string; value: number; image?: string; children: ReactNode; onOpen: () => void }) {
  return (
    <li className="min-w-0">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-describedby="summary-hint"
        // 마우스는 더블클릭, 키보드(e.detail 0)는 Enter/Space 한 번으로 열기
        onClick={(e) => e.detail === 0 && onOpen()}
        onDoubleClick={onOpen}
        title="더블클릭해서 자세히 보기"
        className="flex h-[99px] w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-[10px] border border-[#b5b5b5] bg-white px-4 text-left transition-colors select-none hover:border-ink-2 hover:bg-web-chip/50"
      >
        <span className="flex min-w-0 flex-col gap-0.5 leading-[1.5]">
          <span className="text-xs font-medium text-ink-2">{label}</span>
          <span className="text-2xl font-bold text-black">{value}</span>
          <span className="truncate text-[11px] text-muted">{children}</span>
        </span>
        {image && <img src={image} alt="" width={80} height={80} className="size-20 shrink-0 object-contain" />}
      </button>
    </li>
  )
}

function TagCount({ kind, count }: { kind: 'important' | 'progress' | 'done'; count: number }) {
  return (
    <li className="flex items-center gap-1">
      <StatusTag kind={kind} />
      <span className="text-[13px] leading-[1.5] font-semibold text-muted">{count}</span>
    </li>
  )
}
