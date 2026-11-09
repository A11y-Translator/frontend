// 체크 항목 카드 (v1·v2 공통 동작)
// - 제목 영역 버튼으로 펼치고 접기 (aria-expanded / aria-controls)
// - 카테고리·요소 수·제목·담당자 아바타·상태(글자) 표시
// - hover/focus 시 페이지의 해당 요소 강조 (데모 오버레이)
// 앞쪽 상태 표시(원/아이콘)와 심각도 표시 방식, 카드 겉모양은 버전마다 달라서 slot/className 으로 받음
import { useId, type ReactNode } from 'react'
import { memberById } from '@/shared/mocks'
import type { Issue } from '@/shared/api/types'
import { usePanel } from '@/extension/panelNav'
import AssigneeAvatar from './AssigneeAvatar'
import { isDone, statusLabel } from './checklistModel'

interface Props {
  issue: Issue
  expanded: boolean
  onToggle: () => void
  /** 앞쪽 상태 표시 (장식 — 상태는 글자로도 전달됨) */
  leading: ReactNode
  /** 제목 위 한 줄 (심각도 · 카테고리 · 요소 수) */
  meta: ReactNode
  /** 해결됐을 때 제목 아래에 상태 문구를 보일지 (v1: 보임 / v2: meta 에 "해결됨"으로 표시) */
  showDoneLine?: boolean
  className: string
  expandedClassName?: string
  /** 펼쳤을 때 내용 */
  children?: ReactNode
}

export default function ChecklistItemCard({
  issue,
  expanded,
  onToggle,
  leading,
  meta,
  showDoneLine = true,
  className,
  expandedClassName = '',
  children,
}: Props) {
  const { highlight } = usePanel()
  const bodyId = useId()
  const done = isDone(issue)

  return (
    <li
      className={`w-full ${className} ${expanded ? expandedClassName : ''}`}
      onMouseEnter={() => highlight(issue.id)}
      onMouseLeave={() => highlight(null)}
    >
      <div className="flex w-full items-start gap-2.5">
        {leading}
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={expanded ? bodyId : undefined}
          onClick={onToggle}
          onFocus={() => highlight(issue.id)}
          onBlur={() => highlight(null)}
          className="flex min-w-0 flex-1 flex-col items-start gap-1 rounded text-left"
        >
          <span className="flex flex-wrap items-center gap-1.5 text-[11px] leading-[1.45]">{meta}</span>
          <span className={`text-sm leading-[1.45] font-bold ${done ? 'text-muted line-through' : 'text-ink-2'}`}>{issue.title}</span>
          {done && showDoneLine ? (
            <span className="text-[11px] leading-[1.45] font-medium text-success">{statusLabel(issue)}</span>
          ) : (
            <span className="sr-only">{statusLabel(issue)}</span>
          )}
        </button>
        <AssigneeAvatar member={memberById(issue.assigneeId)} />
      </div>
      {expanded && (
        <div id={bodyId} className="mt-2.5 flex w-full flex-col gap-2.5">
          {children}
        </div>
      )}
    </li>
  )
}
