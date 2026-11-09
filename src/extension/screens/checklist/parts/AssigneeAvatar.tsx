// 담당자 아바타 (v1·v2 공통) — 내 담당은 진한 원, 다른 사람은 회색 원, 미배정은 점선 원
import { CURRENT_USER_ID } from '@/shared/mocks'
import { TEAM_LABEL, type Member } from '@/shared/api/types'

export default function AssigneeAvatar({ member, size = 22 }: { member?: Member; size?: number }) {
  const mine = member?.id === CURRENT_USER_ID
  const label = member ? `담당: ${member.name} (${TEAM_LABEL[member.team]})${mine ? ', 나' : ''}` : '담당자 없음'
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full text-[10px] leading-none font-bold ${
        !member ? 'border border-dashed border-muted text-muted' : mine ? 'bg-ink-2 text-white' : 'bg-ext-frame text-ink-2'
      }`}
    >
      <span aria-hidden>{member ? member.initial : '?'}</span>
    </span>
  )
}
