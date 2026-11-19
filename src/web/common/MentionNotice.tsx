import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppState } from '@/shared/store'
import { CURRENT_USER_ID, memberById } from '@/shared/mocks'
import { mentionsOf } from '@/web/pages/todo/todoUtils'

export function MentionNotice() {
  const { comments } = useAppState()
  const [open, setOpen] = useState(false)
  const mentions = mentionsOf(comments, memberById(CURRENT_USER_ID)!).reverse()
  if (!mentions.length) return null
  const latest = mentions[0]
  return (
    <div className="prototype-mentions">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="prototype-avatar">{memberById(latest.authorId)?.initial}</span>
        <span>
          {memberById(latest.authorId)?.name}님이 나를 멘션함 · {latest.time}
          {mentions.length > 1 && ` · +${mentions.length - 1}`}
        </span>
        <span aria-hidden>›</span>
      </button>
      {open && (
        <ul>
          {mentions.map((c) => (
            <li key={c.id}>
              <Link to={`/issues/${c.issueId}`}>
                <b>{memberById(c.authorId)?.name}</b> {c.body}
                <small>{c.time} ›</small>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
