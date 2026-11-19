import type { Issue } from '@/shared/api/types'
import { actions } from '@/shared/store'

export function IssueCompletion({
  issue,
  onChange,
}: {
  issue: Issue
  onChange?: (resolved: boolean) => void
}) {
  return (
    <input
      type="checkbox"
      className="todo-completion"
      checked={issue.status === 'resolved'}
      aria-label={`${issue.status === 'resolved' ? '완료 취소' : '완료로 표시'}: ${issue.title}`}
      onChange={(e) => {
        actions.setResolved(issue.id, e.target.checked)
        onChange?.(e.target.checked)
      }}
    />
  )
}
