// Figma: project /home › Todo summary (559:2124) — 내 할 일 개수, 진행률, 할 일 3개, 최근 멘션
import { Link } from 'react-router-dom'
import { CURRENT_USER_ID, memberById, projects } from '@/shared/mocks'
import { useAppState } from '@/shared/store'
import type { Issue } from '@/shared/api/types'
import { StatusTag } from '@/web/common/StatusTag'

const ROW_LIMIT = 3

/** 이슈에 프로젝트 id 가 아직 없어서, 버전으로 프로젝트를 찾습니다 (프로토타입) */
const projectNameOf = (issue: Issue) =>
  (projects.find((p) => p.currentVersion === issue.version) ?? projects[0]).name

const dueOf = (issue: Issue) => issue.due ?? `버전 ${issue.version + 1}까지`

export function TodoSummaryCard() {
  const { issues, comments } = useAppState()
  const me = memberById(CURRENT_USER_ID)!

  const mine = issues.filter((i) => i.assigneeId === CURRENT_USER_ID)
  const done = mine.filter((i) => i.status === 'resolved')
  const autoResolved = done.filter((i) => i.autoResolved).length
  const remaining = mine.filter((i) => i.status !== 'resolved')
  // 중요 → 보통 순서로 위에서 3개
  const rows = [...remaining].sort((a, b) => Number(b.priority === 'high') - Number(a.priority === 'high')).slice(0, ROW_LIMIT)
  const percent = mine.length ? Math.round((done.length / mine.length) * 100) : 0

  // 나를 @멘션한 가장 최근 코멘트 (예: "@혜승")
  const mention = [...comments]
    .reverse()
    .find((c) => c.authorId !== CURRENT_USER_ID && c.body.includes(`@${me.name.slice(1)}`))
  const mentionAuthor = memberById(mention?.authorId)

  return (
    <div className="flex min-h-[475px] w-full flex-col rounded-[32px] border border-web-line bg-white px-7 pt-6 pb-5 font-noto shadow-[0_6px_18px_rgba(0,0,0,0.05)]">
      <p className="flex flex-col gap-1 leading-[1.4]">
        <span className="text-sm font-medium text-muted-2">내 할 일</span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-[44px] font-bold text-ink">{remaining.length}</span>
          <span className="text-lg font-medium text-muted-3">개 남았어요</span>
        </span>
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {/* 진행률은 아래 글자로도 같이 알려 주므로 막대는 장식 */}
        <div aria-hidden className="h-1.5 w-full overflow-hidden rounded-[3px] bg-web-line-2">
          <div className="h-full rounded-[3px] bg-ink" style={{ width: `${percent}%` }} />
        </div>
        <p className="flex items-start text-[13px] leading-[1.4]">
          <span className="flex-1 text-muted-2">
            이번 버전 {done.length} / {mine.length} 완료
          </span>
          {autoResolved > 0 && <span className="font-medium text-success">자동 해결 {autoResolved}</span>}
        </p>
      </div>

      <ul className="mt-3 flex flex-col">
        {rows.map((issue) => {
          const due = dueOf(issue)
          return (
            <li key={issue.id} className="border-t border-web-line-2">
              <Link to={`/issues/${issue.id}`} className="flex items-center gap-3.5 rounded-lg py-[13px] hover:bg-web-chip">
                <StatusTag kind={issue.priority === 'high' ? 'important' : 'normal'} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[1.4]">
                  <span className="truncate text-[15px] font-medium text-ink">{issue.title}</span>
                  <span className={`truncate text-xs ${due === '오늘까지' ? 'text-danger' : 'text-subtle'}`}>
                    {projectNameOf(issue)} · {due}
                  </span>
                </span>
                <span aria-hidden className="text-xl leading-[1.4] text-faint">
                  ›
                </span>
              </Link>
            </li>
          )
        })}
        {rows.length === 0 && (
          <li className="border-t border-web-line-2 py-[13px] text-sm text-muted-2">남은 할 일이 없어요. 수고했어요!</li>
        )}
      </ul>

      {mention && mentionAuthor && (
        <div className="mt-auto pt-4">
          <Link
            to={`/issues/${mention.issueId}`}
            className="flex items-center gap-2.5 rounded-2xl bg-web-chip px-4 py-3 hover:bg-web-line-2"
          >
            <span aria-hidden className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-web-header-line text-[11px] leading-[1.4] font-bold text-ink">
              {mentionAuthor.initial}
            </span>
            <span className="min-w-0 flex-1 text-[13px] leading-[1.4] text-ink-3">
              {mentionAuthor.name}님이 나를 멘션했어요 · {mention.time}
            </span>
            <span aria-hidden className="text-lg leading-[1.4] text-faint">
              ›
            </span>
          </Link>
        </div>
      )}
    </div>
  )
}
