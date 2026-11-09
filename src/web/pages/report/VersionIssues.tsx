// Figma: report 오른쪽 열 (533:7227) — 버전 N 이슈 · 코멘트
// 탭(미해결 / 해결됨 / 내 멘션) · 이슈 카드(코멘트 미리보기 또는 "담당자 없음 · 배정하기 →") · 모두 보기
import { Link } from 'react-router-dom'
import * as Tabs from '@radix-ui/react-tabs'
import { CURRENT_USER_ID, memberById } from '@/shared/mocks'
import type { Comment, Issue } from '@/shared/api/types'
import { DEFAULT_PROJECT_ID } from '@/shared/mocks/scan'
import { bySeverity, commentCount, isResolved, shortName, tagKindOf } from '@/web/common/issueHelpers'
import { StatusTag } from '@/web/common/StatusTag'

interface Props {
  version: number
  issues: Issue[]
  comments: Comment[]
  /** 이번 버전 전체 기준 (디자인 숫자 + 재검사 반영) */
  unresolvedTotal: number
  resolvedTotal: number
}

const me = memberById(CURRENT_USER_ID)
const mentionTag = me ? `@${shortName(me.name)}` : '@'

export function VersionIssues({ version, issues, comments, unresolvedTotal, resolvedTotal }: Props) {
  const open = issues.filter((i) => !isResolved(i)).sort(bySeverity).slice(0, 4)
  const done = issues.filter(isResolved)
  // 내 멘션: 코멘트 본문에 "@혜승"이 들어간 이슈
  const mentionedIds = new Set(comments.filter((c) => c.body.includes(mentionTag)).map((c) => c.issueId))
  const mentioned = issues.filter((i) => mentionedIds.has(i.id))

  const tabs = [
    { id: 'open', label: '미해결', count: unresolvedTotal, list: open },
    { id: 'done', label: '해결됨', count: resolvedTotal, list: done },
    { id: 'mention', label: '내 멘션', count: mentioned.length, list: mentioned },
  ]

  return (
    <aside aria-labelledby="version-issues-title" className="flex w-[386px] shrink-0 flex-col gap-4 rounded-[10px] border-l border-[#ececec] bg-web-nav px-6 pt-8 pb-6">
      <div className="flex items-center leading-[1.45] font-bold">
        <h2 id="version-issues-title" className="flex-1 text-lg text-ink-2">
          버전 {version} 이슈 · 코멘트
        </h2>
        <p className="text-sm text-muted-2">총 {unresolvedTotal + resolvedTotal + mentioned.length}개</p>
      </div>

      <Tabs.Root defaultValue="open" className="flex flex-col gap-4">
        <Tabs.List aria-label="이슈 구분" className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <Tabs.Trigger
              key={t.id}
              value={t.id}
              className="rounded-full border border-[#d9d9d9] bg-white px-3 py-[5px] text-[13px] leading-[1.45] font-medium text-ink-2 hover:bg-web-chip data-[state=active]:border-ink-2 data-[state=active]:bg-ink-2 data-[state=active]:font-bold data-[state=active]:text-white"
            >
              {t.label} {t.count}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {tabs.map((t) => (
          <Tabs.Content key={t.id} value={t.id}>
            {t.list.length === 0 ? (
              <p className="rounded-[10px] border border-[#d9d9d9] bg-white px-4 py-8 text-center text-sm text-muted-2">아직 없어요.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {t.list.map((i) => (
                  <IssueCard key={i.id} issue={i} comments={comments} />
                ))}
              </ul>
            )}
          </Tabs.Content>
        ))}
      </Tabs.Root>

      <Link to={`/projects/${DEFAULT_PROJECT_ID}/inspection`} className="self-start text-[13px] leading-[1.45] font-bold text-muted hover:underline">
        이슈 {unresolvedTotal}개 모두 보기 →
      </Link>
    </aside>
  )
}

function IssueCard({ issue, comments }: { issue: Issue; comments: Comment[] }) {
  const thread = comments.filter((c) => c.issueId === issue.id)
  const latest = thread[0]
  const author = memberById(latest?.authorId)
  const assignee = memberById(issue.assigneeId)
  const count = commentCount(issue, comments)

  return (
    <li className="flex flex-col gap-2 rounded-[10px] border border-[#d9d9d9] bg-white px-4 py-3.5 leading-[1.45]">
      <div className="flex items-center gap-2 text-xs">
        <StatusTag kind={tagKindOf(issue)} />
        <span className="min-w-0 flex-1 text-muted-2">{issue.category}</span>
        <span className="text-muted-2">요소 {issue.elements}개</span>
      </div>
      <h3 className="text-[15px] font-bold text-ink-2">
        <Link to={`/issues/${issue.id}`} className="hover:underline">
          {issue.title}
        </Link>
      </h3>
      {!assignee && !isResolved(issue) ? (
        <div className="flex items-center gap-2 text-xs">
          <span className="flex-1 font-medium text-danger">담당자 없음</span>
          <Link to="/todo/unassigned" className="font-bold text-[#175fc2] hover:underline">
            배정하기 →<span className="sr-only"> ({issue.title})</span>
          </Link>
        </div>
      ) : latest && author ? (
        <div className="flex items-center gap-2 text-xs">
          <span aria-hidden className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#e9eaec] text-[10px] font-bold text-ink-3">
            {author.initial}
          </span>
          <p className="min-w-0 flex-1 truncate text-muted-3">
            {shortName(author.name)} · {latest.body}
          </p>
          <span className="shrink-0 font-medium text-muted-2">코멘트 {count}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-2">
          <span className="flex-1">
            {isResolved(issue) ? `해결됨${issue.autoResolved ? ' · 재검사로 자동 해결' : ''}` : `${assignee?.name} 담당`}
          </span>
          {count > 0 && <span className="shrink-0 font-medium">코멘트 {count}</span>}
        </div>
      )}
    </li>
  )
}
