// Figma: Member detail (564:2457) — 선택한 팀원의 정보·담당 이슈·최근 활동
import { Link } from 'react-router-dom'
import type { Issue, Member } from '@/shared/api/types'
import tagWarning from '@/web/assets/tag-warning.svg'
import tagProgress from '@/web/assets/tag-progress.svg'
import tagCircle from '@/web/assets/tag-circle.svg'
import activityBullet from '@/web/assets/activity-bullet.svg'
import type { Activity } from './membersUtils'

interface Props {
  member: Member
  assignedCount: number
  issues: Issue[]
  activities: Activity[]
  onMention: () => void
}

export function MemberDetail({ member: m, assignedCount, issues, activities, onMention }: Props) {
  return (
    <section
      id="member-detail"
      aria-labelledby="member-detail-name"
      className="flex flex-col gap-4 rounded-[10px] border border-[#d9d9d9] bg-white p-5 font-noto leading-[1.45]"
    >
      <div className="flex items-center gap-3.5">
        <span aria-hidden className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-[#e9eaec] text-xl font-bold text-ink-3">
          {m.initial}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 id="member-detail-name" className="text-lg font-bold text-ink-2">
            <span className="sr-only">선택한 팀원: </span>
            {m.name}
          </h2>
          <p className="truncate text-xs text-muted-2">
            {m.role}
            {m.lead ? ' · 팀장' : ''} ·{' '}
            <a href={`mailto:${m.email}`} className="rounded hover:underline">
              {m.email}
            </a>
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onMention}
          className="flex-1 rounded-pill border border-ext-line bg-white px-4 py-2.5 text-sm leading-[1.4] font-bold text-black hover:bg-web-chip"
        >
          @ 멘션하기
        </button>
        <Link to="/todo/unassigned" className="flex-1 rounded-pill bg-black px-4 py-2.5 text-center text-sm leading-[1.4] font-bold text-white hover:bg-ink-2">
          할 일 배정
        </Link>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center">
          <h3 className="flex-1 text-sm font-bold text-ink-2">담당 이슈 {assignedCount}</h3>
          <Link to="/todo/team" className="rounded text-xs font-medium text-muted-2 hover:text-ink-2 hover:underline">
            모두 보기<span className="sr-only"> (우리 팀 할 일)</span> <span aria-hidden>→</span>
          </Link>
        </div>
        {issues.length === 0 ? (
          <p className="py-2.5 text-[13px] text-muted-2">지금 맡은 이슈가 없어요.</p>
        ) : (
          <ul className="mt-1">
            {issues.map((i, idx) => (
              <li key={i.id} className={`flex items-center gap-2.5 py-[9px] ${idx > 0 ? 'border-t border-[#ececec]' : ''}`}>
                <span className="flex w-[66px] shrink-0">
                  <IssueTag issue={i} />
                </span>
                <Link to={`/issues/${i.id}`} className="min-w-0 flex-1 truncate rounded text-[13px] font-medium text-ink-2 hover:underline">
                  {i.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-ink-2">최근 활동</h3>
        {activities.length === 0 ? (
          <p className="text-[13px] text-muted-2">최근 활동이 없어요.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {activities.map((a) => (
              <li key={a.id} className="flex items-center gap-2.5">
                <img src={activityBullet} alt="" width={6} height={6} />
                <span className="min-w-0 flex-1 text-[13px] text-ink-3">{a.text}</span>
                <span className="text-xs whitespace-nowrap text-muted-2">{a.time}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

// Figma: 웹 상태 태그 (Component 1) — 아이콘 + 글자로 의미 전달 (색만으로 구분하지 않음)
function IssueTag({ issue }: { issue: Issue }) {
  const tag =
    issue.priority === 'high'
      ? { label: '중요', icon: tagWarning, cls: 'w-[50px] border-tag-danger-line bg-tag-danger-bg text-tag-danger-text' }
      : issue.status === 'in_progress' || issue.status === 'review'
        ? // 디자인의 글자색(#e77200)은 배경 대비 2.6:1이라 AA(4.5:1)를 넘도록 진하게 조정
          { label: '진행중', icon: tagProgress, cls: 'w-[65px] border-[#ff8c18] bg-[rgb(255_141_27/0.3)] text-[#8f4700]' }
        : { label: '보통', icon: tagCircle, cls: 'w-[50px] border-tag-info-line bg-tag-info-bg text-tag-info-text' }
  return (
    <span className={`flex h-[25px] items-center justify-center gap-1 rounded-[19px] border font-pretendard text-[11px] leading-[1.45] font-medium ${tag.cls}`}>
      <img src={tag.icon} alt="" width={14} height={14} />
      {tag.label}
    </span>
  )
}
