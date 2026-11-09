// Figma: project/inspection · 접근성 검사 (562:2136)
// 제목 · 요약 숫자 · 카테고리/페이지 필터 · 이슈 목록 · 오른쪽 "검사 화면 · 문제 위치" 미리보기.
// 목록에서 행을 고르면 미리보기(페이지 탭, 오버레이 강조, 요약)가 따라 바뀝니다.
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Header } from '@/web/layout/Header'
import { actions, useAppState } from '@/shared/store'
import { memberById } from '@/shared/mocks'
import type { Issue } from '@/shared/api/types'
import { DEFAULT_PROJECT_ID, PROJECT_NAME, SCAN } from '@/shared/mocks/scan'
import { CATEGORY_FILTERS, commentCount, deriveStats, isResolved, tagKindOf } from '@/web/common/issueHelpers'
import { StatusTag } from '@/web/common/StatusTag'
import { OpenInChromeLink } from '@/web/common/OpenInChromeLink'
import { InspectionPreview } from './InspectionPreview'

export default function InspectionResultPage() {
  const { projectId = DEFAULT_PROJECT_ID } = useParams()
  const state = useAppState()
  const { issues, comments, currentVersion } = state
  const stats = deriveStats(state)

  const [category, setCategory] = useState('all')
  const [page, setPage] = useState('all')
  const [selectedId, setSelectedId] = useState<string>(issues[0]?.id ?? '')
  const [previewPage, setPreviewPage] = useState('/main')
  const [notice, setNotice] = useState('')

  const pageOptions = useMemo(() => [...new Set(issues.map((i) => i.page))], [issues])

  // 칩 숫자는 store 이슈 기준 (페이지 필터가 걸려 있으면 그 페이지 안에서 셉니다)
  const inPage = issues.filter((i) => page === 'all' || i.page === page)
  const filter = CATEGORY_FILTERS.find((f) => f.id === category) ?? CATEGORY_FILTERS[0]
  const visible = inPage.filter((i) => filter.match(i.category))
  const selected = issues.find((i) => i.id === selectedId) ?? visible[0] ?? issues[0]

  const select = (i: Issue) => {
    setSelectedId(i.id)
    setPreviewPage(i.page)
  }

  const recheck = () => {
    actions.recheck()
    setNotice('재검사를 마쳤어요. 수정안을 적용한 이슈는 자동으로 해결돼요.')
  }

  return (
    <>
      <Header version={`버전 ${currentVersion}`} project={PROJECT_NAME} right={<OpenInChromeLink />} />
      <div className="flex flex-1 flex-col gap-8 bg-white page-x pt-8 pb-12">
        {/* Title row */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.45]">
            <h1 className="text-[30px] font-bold text-ink-2">접근성 검사</h1>
            <p className="text-[15px] text-muted-2">
              버전 {currentVersion} · {SCAN.scannedAt} 검사 · 페이지 {SCAN.pages}개 · {SCAN.standard} 기준
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/report"
              className="rounded-full border border-ext-line bg-white px-4 py-2.5 font-noto text-sm leading-[1.4] font-bold text-black hover:bg-web-chip"
            >
              결과 내보내기
            </Link>
            <button type="button" onClick={recheck} className="rounded-full bg-black px-4 py-2.5 font-noto text-sm leading-[1.4] font-bold text-white hover:bg-ink-3">
              재검사
            </button>
          </div>
        </div>
        <p role="status" className="-mt-4 text-sm font-medium text-success empty:hidden">
          {notice}
        </p>

        {/* Stats */}
        <section aria-label="검사 요약">
          <ul className="grid grid-cols-4 gap-4">
            <StatCard label="전체 이슈" value={String(stats.total)}>
              이전 버전 대비 <span className="font-medium text-[#175fc2]">{stats.delta > 0 ? `+${stats.delta}` : stats.delta}</span>
            </StatCard>
            <StatCard label="기준 통과율" value={`${SCAN.passRate}%`}>
              <span
                role="progressbar"
                aria-label="기준 통과율"
                aria-valuenow={SCAN.passRate}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-2 block h-1.5 w-full overflow-hidden rounded-[3px] bg-web-line-2"
              >
                <span className="block h-full rounded-[3px] bg-ink-2" style={{ width: `${SCAN.passRate}%` }} />
              </span>
            </StatCard>
            <StatCard label="검사 페이지" value={String(SCAN.pages)}>
              {SCAN.pagesNote}
            </StatCard>
            <StatCard label="남은 코멘트" value={String(stats.remainingComments)}>
              멘션 {SCAN.mentions}개 포함
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
              <div role="group" aria-label="카테고리로 거르기" className="flex flex-wrap gap-1.5">
                {CATEGORY_FILTERS.map((f) => {
                  const on = f.id === category
                  const n = inPage.filter((i) => f.match(i.category)).length
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
              <p className="rounded-[10px] border border-[#d9d9d9] bg-white px-4 py-10 text-center text-sm text-muted-2">조건에 맞는 이슈가 없어요.</p>
            ) : (
              <ul className="overflow-hidden rounded-[10px] border border-[#d9d9d9] bg-white">
                {visible.map((i, idx) => (
                  <IssueRow key={i.id} issue={i} first={idx === 0} selected={i.id === selected?.id} count={commentCount(i, comments)} onSelect={() => select(i)} />
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-2">
              행을 선택하면 오른쪽 미리보기에서 문제 위치를 보여줘요. 프로젝트 {projectId.toUpperCase()} · 전체 {stats.total}개 중 {issues.length}개 표시
            </p>
          </section>

          {/* Preview */}
          {selected && <InspectionPreview issue={selected} page={previewPage} onPageChange={setPreviewPage} />}
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
        onClick={onSelect}
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
