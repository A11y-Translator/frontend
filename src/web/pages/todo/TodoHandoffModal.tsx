// Figma: todo/handoff · 할 일 넘기기 (557:1839) / Handoff modal (557:1948)
// 같은 직군 안에서만 담당자를 바꿀 수 있어요. Radix Dialog 로 포커스 가두기·Esc 닫기·제목 연결을 처리합니다.
import { useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { actions, useAppState } from '@/shared/store'
import { CURRENT_USER_ID } from '@/shared/mocks'
import { TEAM_LABEL, type Issue } from '@/shared/api/types'
import { Avatar, SeverityChip } from './TodoBits'
import { memberLoad, ROOM_LIMIT, teamMembers } from './todoUtils'

interface Props {
  issue?: Issue
  open: boolean
  onOpenChange: (open: boolean) => void
  announce: (m: string) => void
  onCloseAutoFocus?: (e: Event) => void
}

export function TodoHandoffModal({ issue, open, onOpenChange, announce, onCloseAutoFocus }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-32px)] w-[480px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-[18px] overflow-y-auto rounded-[20px] bg-white px-7 pt-7 pb-6 font-noto shadow-[0_16px_48px_rgba(0,0,0,0.2)] outline-none"
        >
          {/* issue 가 바뀌면 폼 상태를 새로 시작 */}
          {issue && <HandoffForm key={issue.id} issue={issue} onDone={() => onOpenChange(false)} announce={announce} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function HandoffForm({ issue, onDone, announce }: { issue: Issue; onDone: () => void; announce: (m: string) => void }) {
  const { issues } = useAppState()
  const team = issue.team ?? 'design'
  // 같은 직군 팀원만, 지금 담당자(=나)는 빼고
  const candidates = teamMembers(team).filter((m) => m.id !== (issue.assigneeId ?? CURRENT_USER_ID))
  const [targetId, setTargetId] = useState(candidates[0]?.id ?? '')
  const [message, setMessage] = useState('')
  const [withFixes, setWithFixes] = useState(true)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const target = candidates.find((m) => m.id === targetId)
    if (!target) return
    actions.changeAssignee(issue.id, target.id)
    if (message.trim()) {
      actions.addComment({ issueId: issue.id, authorId: CURRENT_USER_ID, body: `@${target.name} ${message.trim()}`, time: '방금' })
    }
    // TODO: withFixes=false 일 때 저장한 수정안·코멘트를 빼고 넘기는 건 백엔드 API가 생기면 처리
    announce(`‘${issue.title}’을 ${target.name}님에게 넘겼어요`)
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-[18px] leading-[1.45]">
      <Dialog.Title className="text-[22px] font-bold text-ink-2">할 일 넘기기</Dialog.Title>
      <Dialog.Description asChild>
        <div className="flex items-center gap-2.5 rounded-[10px] bg-web-chip px-3.5 py-3">
          <SeverityChip severity={issue.severity} />
          <p className="min-w-0 flex-1 text-sm font-bold text-ink-2">
            <span className="sr-only">넘길 할 일: </span>
            {issue.title}
          </p>
        </div>
      </Dialog.Description>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-[18px] text-xs font-medium text-[#626873]">
          누구에게 넘길까요? · 같은 직군({TEAM_LABEL[team]}) 안에서만 넘길 수 있어요
        </legend>
        {candidates.length === 0 && <p className="rounded-xl bg-web-chip px-3.5 py-3 text-[13px] text-[#626873]">같은 직군에 넘길 수 있는 팀원이 없어요.</p>}
        {candidates.map((m) => {
          const load = memberLoad(m, issues).assigned
          return (
            <label
              key={m.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-web-header-line bg-white px-3.5 py-3 has-checked:border-accent has-checked:bg-[#edf4ff] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
            >
              <Avatar initial={m.initial} size={30} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-bold text-ink-2">
                  {m.name} · {m.role}
                </span>
                <span className="text-xs text-[#626873]">
                  담당 {load}개{load < ROOM_LIMIT ? ' · 이번 주 여유 있음' : ''}
                </span>
              </span>
              <input
                type="radio"
                name="handoff-target"
                value={m.id}
                checked={targetId === m.id}
                onChange={() => setTargetId(m.id)}
                className="peer sr-only"
              />
              {/* 라디오 모양 (장식) */}
              <span
                aria-hidden
                className="size-[18px] shrink-0 rounded-full border-[1.5px] border-[#c4c9d1] bg-white peer-checked:border-ink-2 peer-checked:bg-ink-2 peer-checked:shadow-[inset_0_0_0_3px_white]"
              />
            </label>
          )
        })}
      </fieldset>

      <div className="flex flex-col gap-[18px]">
        <label htmlFor="handoff-message" className="text-xs font-medium text-[#626873]">
          함께 남길 메시지 (선택)
        </label>
        <textarea
          id="handoff-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder="레이블 문구만 정해주시면 돼요. 수정안 첨부했어요!"
          className="-mt-2.5 h-[76px] resize-none rounded-[10px] border border-[#d5d9e0] bg-white px-3.5 py-3 text-sm text-ink-3 placeholder:text-muted-2"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-2">
        <input type="checkbox" checked={withFixes} onChange={(e) => setWithFixes(e.target.checked)} className="size-[18px] accent-ink-2" />
        저장한 수정안과 코멘트도 함께 넘기기
      </label>

      <div className="flex justify-end gap-2">
        <Dialog.Close className="rounded-pill bg-ext-soft px-4 py-2.5 text-sm leading-[1.4] font-bold text-black hover:bg-web-line">취소</Dialog.Close>
        <button
          type="submit"
          disabled={!targetId}
          className="rounded-pill bg-black px-4 py-2.5 text-sm leading-[1.4] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          넘기기
        </button>
      </div>
    </form>
  )
}
