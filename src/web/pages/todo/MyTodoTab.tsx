// Figma: todo/mine · 내 할 일 (556:1817)
// 상태별(진행 중 / 할 일 / 완료·자동 해결)로 묶은 내 할 일 + 오른쪽 진행률·멘션 카드.
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CURRENT_USER_ID, memberById } from '@/shared/mocks'
import type { Comment, Issue } from '@/shared/api/types'
import { Avatar, SeverityChip } from './TodoBits'
import { TodoHandoffModal } from './TodoHandoffModal'
import { byNo, bySeverity, hasFix, mentionsOf, TEAM_SHORT } from './todoUtils'

export type MineSort = 'severity' | 'no'

interface Props {
  /** 나에게 배정된 이슈 (모든 상태) */
  issues: Issue[]
  comments: Comment[]
  allIssues: Issue[]
  sort: MineSort
  announce: (m: string) => void
}

const GROUPS = [
  { key: 'doing', title: '진행 중', empty: '진행 중인 할 일이 없어요', match: (i: Issue) => i.status === 'in_progress' || i.status === 'review' },
  { key: 'todo', title: '할 일', empty: '남은 할 일이 없어요', match: (i: Issue) => i.status === 'todo' },
  { key: 'done', title: '완료 · 자동 해결', empty: '아직 완료한 할 일이 없어요', match: (i: Issue) => i.status === 'resolved' },
] as const

export function MyTodoTab({ issues, comments, allIssues, sort, announce }: Props) {
  const me = memberById(CURRENT_USER_ID)!
  const [handoffId, setHandoffId] = useState<string | null>(null)
  // 넘기기 후 행이 사라지면 포커스를 둘 곳
  const listHeadingRef = useRef<HTMLHeadingElement>(null)
  const lastTrigger = useRef<HTMLButtonElement | null>(null)

  const sorter = sort === 'severity' ? bySeverity : byNo
  const done = issues.filter((i) => i.status === 'resolved').length
  const doing = issues.filter((i) => i.status === 'in_progress' || i.status === 'review').length
  const pct = issues.length ? Math.round((done / issues.length) * 100) : 0
  const mentions = mentionsOf(comments, me)
  const handoffIssue = allIssues.find((i) => i.id === handoffId)

  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-4">
        <h2 ref={listHeadingRef} tabIndex={-1} className="sr-only">
          내 할 일 목록
        </h2>
        {GROUPS.map((g) => {
          const items = issues.filter(g.match).sort(sorter)
          const headingId = `mine-group-${g.key}`
          return (
            <section key={g.key} aria-labelledby={headingId} className="overflow-hidden rounded-xl border border-web-header-line bg-white">
              <h3 id={headingId} className="bg-web-chip px-5 py-3.5 text-sm leading-[1.45] font-bold text-ink-2">
                {g.title} {items.length}
              </h3>
              {items.length === 0 ? (
                <p className="border-t border-web-line-2 px-5 py-4 text-[13px] text-muted-2">{g.empty}</p>
              ) : (
                <ul>
                  {items.map((i) => (
                    <MineRow
                      key={i.id}
                      issue={i}
                      commentCount={comments.filter((c) => c.issueId === i.id).length}
                      onHandoff={(btn) => {
                        lastTrigger.current = btn
                        setHandoffId(i.id)
                      }}
                    />
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      <aside aria-label="내 진행 상황" className="flex flex-col gap-4">
        <section aria-labelledby="mine-progress" className="flex flex-col gap-2.5 rounded-xl border border-web-header-line bg-white px-5 py-[18px] leading-[1.45]">
          <h2 id="mine-progress" className="text-[13px] font-medium text-[#626873]">
            이번 버전 내 진행률
          </h2>
          <p className="flex items-center gap-1.5">
            <span className="text-[28px] font-bold text-ink-2">
              {done} / {issues.length}
            </span>
            <span className="text-sm font-medium text-[#626873]">완료</span>
          </p>
          <div
            role="progressbar"
            aria-labelledby="mine-progress"
            aria-valuemin={0}
            aria-valuemax={issues.length}
            aria-valuenow={done}
            aria-valuetext={`${issues.length}개 중 ${done}개 완료 (${pct}%)`}
            className="h-2 w-full overflow-hidden rounded bg-web-line-2"
          >
            <div className="h-full rounded bg-ink-2 transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-[#626873]">
            {doing > 0 ? `다음 재검사 때 진행 중 ${doing}개가 자동으로 확인돼요` : '진행 중인 할 일이 없어요'}
          </p>
        </section>

        <section aria-labelledby="mine-mentions" className="overflow-hidden rounded-xl border border-web-header-line bg-white">
          <div className="flex items-center bg-web-chip px-5 py-3.5 leading-[1.45] font-bold">
            <h2 id="mine-mentions" className="flex-1 text-sm text-ink-2">
              나를 멘션한 코멘트
            </h2>
            {mentions.length > 0 && (
              <Link to={`/issues/${mentions[0].issueId}`} className="rounded text-xs text-[#175fc2] hover:underline">
                모두 보기
              </Link>
            )}
          </div>
          {mentions.length === 0 ? (
            <p className="border-t border-web-line-2 px-5 py-4 text-xs text-muted-2">아직 나를 멘션한 코멘트가 없어요</p>
          ) : (
            <ul>
              {mentions.map((c) => {
                const author = memberById(c.authorId)
                return (
                  <li key={c.id} className="flex items-start gap-2.5 border-t border-web-line-2 px-5 py-3 leading-[1.45]">
                    <Avatar initial={author?.initial ?? '?'} size={26} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="flex items-start">
                        <span className="flex-1 text-xs font-bold text-ink-2">
                          {author?.name} · {author ? TEAM_SHORT[author.team] : ''}
                        </span>
                        <span className="text-[11px] whitespace-nowrap text-muted-2">{c.time}</span>
                      </p>
                      <Link to={`/issues/${c.issueId}`} className="rounded text-xs text-ink-3 hover:underline">
                        {c.body}
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <p className="rounded-[10px] bg-[#edf4ff] px-4 py-3 text-xs leading-[1.45] text-[#175fc2]">
          ‘크롬에서 열기’를 누르면 확장 프로그램이 해당 요소 위치로 바로 이동해요.
        </p>
      </aside>

      <TodoHandoffModal
        issue={handoffIssue}
        open={Boolean(handoffIssue)}
        onOpenChange={(o) => !o && setHandoffId(null)}
        announce={announce}
        onCloseAutoFocus={(e) => {
          // 넘긴 뒤엔 행이 목록에서 사라지므로, 남아 있으면 버튼으로, 아니면 목록 제목으로 포커스
          e.preventDefault()
          if (lastTrigger.current?.isConnected) lastTrigger.current.focus()
          else listHeadingRef.current?.focus()
        }}
      />
    </div>
  )
}

function MineRow({ issue: i, commentCount, onHandoff }: { issue: Issue; commentCount: number; onHandoff: (btn: HTMLButtonElement) => void }) {
  const resolved = i.status === 'resolved'
  const urgent = i.due?.includes('오늘')
  const meta = resolved
    ? `${i.category} · ${i.autoResolved ? `버전 ${i.version} 재검사에서 해결` : '완료'}`
    : `${i.category} · 요소 ${i.elements}개${hasFix(i) ? ' · 수정안 있음' : ''}`

  return (
    <li className="flex items-center gap-3.5 border-t border-web-line-2 px-5 py-3 leading-[1.45]">
      {/* 상태 동그라미는 장식 — 상태는 그룹 제목(진행 중/할 일/완료)으로 전달 */}
      {resolved ? (
        <span aria-hidden className="flex size-[18px] shrink-0 items-center justify-center rounded-full border border-success bg-success text-[10px] font-bold text-white">
          ✓
        </span>
      ) : (
        <span aria-hidden className="size-[18px] shrink-0 rounded-full border border-[#c4c9d1] bg-white" />
      )}
      <SeverityChip severity={i.severity} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link
          to={`/issues/${i.id}`}
          className={`truncate rounded text-[15px] font-bold hover:underline ${resolved ? 'text-muted-2 line-through' : 'text-ink-2'}`}
        >
          {resolved && <span className="sr-only">완료됨: </span>}
          {i.title}
        </Link>
        <p className="truncate text-xs text-[#626873]">{meta}</p>
      </div>

      {!resolved && (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-3.5 gap-y-1 text-xs">
          {i.savedFix ? (
            <span className="rounded-md bg-[#edf4ff] px-2 py-0.5 font-medium text-[#175fc2]">수정안 저장됨</span>
          ) : (
            commentCount > 0 && <span className="rounded-md bg-web-chip px-2 py-0.5 font-medium text-[#626873]">코멘트 {commentCount}</span>
          )}
          {i.due && (
            <span className={`font-medium ${urgent ? 'text-danger' : 'text-[#626873]'}`}>
              <span className="sr-only">마감 </span>
              {i.due}
            </span>
          )}
          {/* URL 이동만 — 실제 확장 연동은 나중에 */}
          <Link to="/extension" className="rounded font-bold text-[#175fc2] hover:underline">
            크롬에서 열기<span className="sr-only">: {i.title}</span>
          </Link>
          <button type="button" onClick={(e) => onHandoff(e.currentTarget)} className="rounded font-bold text-[#626873] hover:text-ink-2 hover:underline">
            넘기기<span className="sr-only">: {i.title}</span>
          </button>
        </div>
      )}
    </li>
  )
}
