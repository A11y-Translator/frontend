// 리포트 요약 카드(전체 이슈 · 남은 코멘트 · 해결됨 · 검사 페이지)를 더블클릭하면 여는 창.
// 해당 항목을 중요도·시급한 순서로 정렬한 블록 목록으로 보여주고, 블록을 누르면 그 항목으로 이동합니다.
//   이슈·코멘트·해결됨 → 이슈 상세 / 검사 페이지 → 그 페이지로 거른 접근성 검사 목록
import { Link } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { CURRENT_USER_ID, memberById } from '@/shared/mocks'
import { DEFAULT_PROJECT_ID, MORE_PAGES, PAGES } from '@/shared/mocks/scan'
import type { Comment, Issue } from '@/shared/api/types'
import { SEVERITY_RANK } from '@/shared/selectors'
import { SeverityChip } from '@/shared/ui/SeverityChip'
import { StatusTag } from '@/web/common/StatusTag'
import { commentCount, isResolved, shortName, tagKindOf } from '@/web/common/issueHelpers'

export type DrillKind = 'issues' | 'comments' | 'resolved' | 'pages'

interface Props {
  kind: DrillKind | null
  onClose: () => void
  issues: Issue[]
  comments: Comment[]
  /** 카드에 보이는 숫자 (데모 데이터 개수와 다르면 안내) */
  totals: Record<DrillKind, number>
}

const TITLE: Record<DrillKind, { title: string; desc: string }> = {
  issues: { title: '전체 이슈', desc: '안 끝난 것 → 심각도 → 마감이 가까운 순서예요.' },
  comments: { title: '남은 코멘트', desc: '나를 멘션한 것 → 이슈 심각도 → 코멘트가 많은 순서예요.' },
  resolved: { title: '해결된 이슈', desc: '심각도 순서예요. 이슈를 열어 "되돌리기"도 할 수 있어요.' },
  pages: { title: '검사 페이지', desc: '치명·심각 이슈가 많은 페이지 → 남은 이슈가 많은 순서예요.' },
}

const me = memberById(CURRENT_USER_ID)
const myMention = me ? `@${shortName(me.name)}` : '@'

/** 마감 시급도: 오늘까지 0 · 버전 N까지 1 · 없음 2 */
const dueRank = (i: Issue) => (!i.due ? 2 : i.due.includes('오늘') ? 0 : 1)
const byUrgency = (a: Issue, b: Issue) =>
  Number(isResolved(a)) - Number(isResolved(b)) || SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || dueRank(a) - dueRank(b) || a.no - b.no

const block =
  'flex w-full items-center gap-3 rounded-xl border border-[#e2e4e8] bg-white px-4 py-3 text-left leading-[1.45] transition-colors hover:border-ink-2 hover:bg-web-chip'

export function ReportDrillDialog({ kind, onClose, issues, comments, totals }: Props) {
  return (
    <Dialog.Root open={!!kind} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[min(720px,calc(100vh-48px))] w-[560px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-[20px] bg-web-nav px-6 pt-6 pb-5 font-noto shadow-[0_16px_48px_rgba(0,0,0,0.2)] outline-none">
          {kind && <DrillBody kind={kind} issues={issues} comments={comments} totals={totals} />}
          <Dialog.Close
            aria-label="닫기"
            className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-full text-muted hover:bg-white hover:text-black"
          >
            <svg aria-hidden width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M2 2l8 8M10 2l-8 8" />
            </svg>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DrillBody({ kind, issues, comments, totals }: { kind: DrillKind; issues: Issue[]; comments: Comment[]; totals: Record<DrillKind, number> }) {
  const items = buildItems(kind, issues, comments)
  const shown = items.length
  return (
    <>
      <div className="flex flex-col gap-1 pr-10 leading-[1.45]">
        <Dialog.Title className="text-[22px] font-bold text-ink-2">
          {TITLE[kind].title} <span className="text-base font-semibold text-muted-2">{shown}개</span>
        </Dialog.Title>
        <Dialog.Description className="text-[13px] text-muted-2">{TITLE[kind].desc}</Dialog.Description>
        {totals[kind] !== shown && (
          <p className="text-xs text-muted-2">
            요약 숫자는 {totals[kind]}개지만 데모 데이터에는 대표 항목 {shown}개만 들어 있어요. 서버가 연결되면 전부 보여요.
          </p>
        )}
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-[#e2e4e8] bg-white px-4 py-10 text-center text-sm text-muted-2">아직 없어요.</p>
      ) : (
        <ol className="-mx-1 flex min-h-0 flex-col gap-2 overflow-y-auto px-1 pb-1">
          {items}
        </ol>
      )}
    </>
  )
}

function buildItems(kind: DrillKind, issues: Issue[], comments: Comment[]) {
  if (kind === 'issues' || kind === 'resolved') {
    const list = (kind === 'resolved' ? issues.filter(isResolved) : issues).slice().sort(byUrgency)
    return list.map((i, n) => (
      <li key={i.id}>
        <IssueBlock issue={i} rank={n + 1} comments={comments} />
      </li>
    ))
  }

  if (kind === 'comments') {
    const byIssue = new Map<string, Comment[]>()
    for (const c of comments) byIssue.set(c.issueId, [...(byIssue.get(c.issueId) ?? []), c])
    const threads = [...byIssue.entries()]
      .map(([issueId, list]) => ({ issue: issues.find((i) => i.id === issueId), list, mentionsMe: list.some((c) => c.body.includes(myMention)) }))
      .filter((t): t is { issue: Issue; list: Comment[]; mentionsMe: boolean } => !!t.issue)
      .sort(
        (a, b) =>
          Number(b.mentionsMe) - Number(a.mentionsMe) ||
          SEVERITY_RANK[a.issue.severity] - SEVERITY_RANK[b.issue.severity] ||
          b.list.length - a.list.length,
      )
    return threads.map(({ issue, list, mentionsMe }, n) => {
      const last = list[list.length - 1]
      const author = memberById(last.authorId)
      return (
        <li key={issue.id}>
          <Link to={`/issues/${issue.id}`} className={`${block} items-start`}>
            <Rank n={n + 1} />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <SeverityChip severity={issue.severity} />
                {mentionsMe && <span className="rounded-full bg-[#e7f0ff] px-2 py-0.5 text-[11px] font-bold text-[#175fc2]">나를 멘션</span>}
                <span className="truncate text-sm font-bold text-ink-2">{issue.title}</span>
              </span>
              <span className="line-clamp-2 text-[13px] text-ink-3">
                <span className="font-bold">{author ? shortName(author.name) : '알 수 없음'}</span> · {last.body}
              </span>
              <span className="text-xs text-muted-2">
                코멘트 {list.length}개 · {last.time}
              </span>
            </span>
          </Link>
        </li>
      )
    })
  }

  // pages: 페이지별 남은 이슈 · 치명/심각 수
  const pageNames = [...new Set<string>([...PAGES, ...MORE_PAGES, ...issues.map((i) => i.page)])]
  const pages = pageNames
    .map((p) => {
      const open = issues.filter((i) => i.page === p && !isResolved(i))
      return { page: p, open: open.length, urgent: open.filter((i) => i.severity === 'critical' || i.severity === 'serious').length }
    })
    .sort((a, b) => b.urgent - a.urgent || b.open - a.open || a.page.localeCompare(b.page))
  return pages.map((p, n) => (
    <li key={p.page}>
      <Link to={`/projects/${DEFAULT_PROJECT_ID}/inspection?page=${encodeURIComponent(p.page)}`} className={block}>
        <Rank n={n + 1} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-bold text-ink-2">{p.page}</span>
          <span className="text-xs text-muted-2">{p.open === 0 ? '남은 이슈 없음' : `남은 이슈 ${p.open}개 · 치명·심각 ${p.urgent}개`}</span>
        </span>
        <span aria-hidden className="text-sm text-muted-2">
          →
        </span>
      </Link>
    </li>
  ))
}

function IssueBlock({ issue, rank, comments }: { issue: Issue; rank: number; comments: Comment[] }) {
  const done = isResolved(issue)
  const assignee = memberById(issue.assigneeId)
  const n = commentCount(issue, comments)
  const meta = [
    issue.category,
    issue.page,
    done ? (issue.autoResolved ? '재검사로 자동 해결' : '해결됨') : assignee ? `${assignee.name} 담당` : '미배정',
    !done && issue.due ? issue.due : null,
    n > 0 ? `코멘트 ${n}` : null,
  ].filter(Boolean)
  return (
    <Link to={`/issues/${issue.id}`} className={block}>
      <Rank n={rank} />
      <span className="flex w-[66px] shrink-0">
        <StatusTag kind={tagKindOf(issue)} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1.5">
          <SeverityChip severity={issue.severity} />
          <span className={`truncate text-sm font-bold ${done ? 'text-muted-2' : 'text-ink-2'}`}>{issue.title}</span>
        </span>
        <span className="truncate text-xs text-muted-2">{meta.join(' · ')}</span>
      </span>
    </Link>
  )
}

function Rank({ n }: { n: number }) {
  return (
    <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-full bg-web-chip text-[11px] font-bold text-muted-2">
      {n}
    </span>
  )
}
