// Figma: todo/unassigned · 미배정 분배 (557:1717) — Workflow 06 · web/todo-assign 과 같은 화면
// 미배정 이슈 목록 + "분배" 팝오버(어느 팀으로 분배할까요?) + AI 추천대로 모두 분배.
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { actions } from '@/shared/store'
import { memberById } from '@/shared/mocks'
import { TEAM_LABEL, type Issue, type Team } from '@/shared/api/types'
import { Avatar, SeverityChip } from './TodoBits'
import { bySeverity, memberLoad, TEAM_ALL, TEAM_ORDER, teamMembers } from './todoUtils'

interface Props {
  /** status === 'unassigned' 인 이슈 */
  issues: Issue[]
  allIssues: Issue[]
  /** AI 추천 직군으로 거르기 */
  filter: Team | 'all'
  announce: (m: string) => void
}

export function UnassignedTodoTab({ issues, allIssues, filter, announce }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const list = issues.filter((i) => filter === 'all' || i.aiTeam === filter).sort(bySeverity)
  const aiCount = issues.filter((i) => i.aiTeam).length

  const assignAll = () => {
    actions.assignAllByAi()
    announce(`AI 추천대로 ${aiCount}개를 분배했어요`)
    headingRef.current?.focus()
  }

  return (
    <section aria-labelledby="unassigned-heading" className="overflow-hidden rounded-xl border border-web-header-line bg-white leading-[1.45]">
      <div className="flex items-center gap-3 bg-web-chip px-5 py-3.5 font-bold">
        <h2 id="unassigned-heading" ref={headingRef} tabIndex={-1} className="flex-1 rounded text-sm text-ink-2">
          미배정 할 일 {list.length}개
        </h2>
        <button
          type="button"
          onClick={assignAll}
          disabled={aiCount === 0}
          className="rounded text-[13px] text-[#175fc2] hover:underline disabled:cursor-not-allowed disabled:text-muted-2 disabled:no-underline"
        >
          AI 추천대로 모두 분배
          {aiCount > 0 && <span className="sr-only"> ({aiCount}개)</span>}
        </button>
      </div>

      {list.length === 0 ? (
        <p className="border-t border-web-line-2 px-5 py-6 text-[13px] text-muted-2">
          {issues.length === 0 ? '미배정 할 일이 없어요. 모두 분배했어요!' : '이 직군으로 추천된 미배정 할 일이 없어요.'}
        </p>
      ) : (
        <ul>
          {list.map((i) => {
            const active = openId === i.id
            return (
              <li
                key={i.id}
                className={`flex items-center gap-3.5 border-t border-web-line-2 py-3.5 pr-5 ${
                  active ? 'border-l-[3px] border-l-accent bg-[#edf4ff] pl-[17px]' : 'bg-white pl-5'
                }`}
              >
                <SeverityChip severity={i.severity} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate text-[15px] font-bold text-ink-2">{i.title}</p>
                  <p className="truncate text-xs text-[#626873]">
                    {i.category} · 요소 {i.elements}개
                  </p>
                </div>
                <span className="shrink-0 rounded-pill border border-web-header-line bg-web-chip px-2.5 py-1 text-xs font-medium whitespace-nowrap text-[#626873]">
                  {i.aiTeam ? `AI 추천 · ${TEAM_LABEL[i.aiTeam]}` : 'AI 추천 없음'}
                </span>
                <Popover.Root open={active} onOpenChange={(o) => setOpenId(o ? i.id : null)}>
                  <Popover.Trigger
                    className={`shrink-0 rounded-pill border px-3.5 py-[7px] text-[13px] font-bold ${
                      active ? 'border-ink-2 bg-ink-2 text-white' : 'border-[#d5d9e0] bg-white text-ink-2 hover:bg-web-chip'
                    }`}
                  >
                    분배<span className="sr-only">: {i.title}</span>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      side="left"
                      align="start"
                      sideOffset={12}
                      collisionPadding={16}
                      aria-labelledby={`assign-title-${i.id}`}
                      className="z-50 w-[340px] rounded-2xl border border-web-header-line bg-white p-5 font-noto leading-[1.45] shadow-[0_8px_24px_rgba(0,0,0,0.08)] outline-none"
                    >
                      <AssignForm
                        issue={i}
                        allIssues={allIssues}
                        onCancel={() => setOpenId(null)}
                        onAssigned={(msg) => {
                          announce(msg)
                          setOpenId(null)
                          // 분배하면 행(과 팝오버 트리거)이 사라지므로 포커스를 목록 제목으로 옮김
                          window.setTimeout(() => headingRef.current?.focus(), 0)
                        }}
                      />
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function AssignForm({
  issue,
  allIssues,
  onCancel,
  onAssigned,
}: {
  issue: Issue
  allIssues: Issue[]
  onCancel: () => void
  onAssigned: (message: string) => void
}) {
  const [team, setTeam] = useState<Team>(issue.aiTeam ?? 'design')
  // 기본값은 "팀 전체" — AI는 직군만 추천하므로 특정 사람을 미리 고르지 않음
  const [assignee, setAssignee] = useState<string>(TEAM_ALL)
  const people = teamMembers(team)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const personId = assignee === TEAM_ALL ? undefined : assignee
    actions.assignTeam(issue.id, team, personId)
    const person = memberById(personId)
    onAssigned(`${TEAM_LABEL[team]} 팀에 분배했어요${person ? ` · 담당 ${person.name}` : ''}`)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 id={`assign-title-${issue.id}`} className="text-lg font-bold text-ink-2">
          어느 팀으로 분배할까요?
        </h3>
        <p className="text-[13px] text-[#626873]">{issue.title}</p>
      </div>

      <fieldset>
        <legend className="sr-only">직군</legend>
        <div className="flex flex-wrap gap-1.5">
          {TEAM_ORDER.map((t) => (
            <label
              key={t}
              className="cursor-pointer rounded-pill border border-[#d5d9e0] bg-white px-3 py-1.5 text-[13px] font-medium text-ink-2 has-checked:border-ink-2 has-checked:bg-ink-2 has-checked:font-bold has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
            >
              <input
                type="radio"
                name={`assign-team-${issue.id}`}
                value={t}
                checked={team === t}
                onChange={() => {
                  setTeam(t)
                  setAssignee(TEAM_ALL)
                }}
                className="sr-only"
              />
              {TEAM_LABEL[t]}
              {issue.aiTeam === t && <span className="sr-only"> (AI 추천)</span>}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-2.5 text-xs font-medium text-[#626873]">담당자</legend>
        {people.map((m) => (
          <PersonOption
            key={m.id}
            name={`assign-person-${issue.id}`}
            value={m.id}
            checked={assignee === m.id}
            onChange={setAssignee}
            initial={m.initial}
            trailing={`담당 ${memberLoad(m, allIssues).assigned}개`}
          >
            <span className="text-sm font-bold text-ink-2">{m.name}</span>
            <span className="text-xs text-[#626873]">{m.role}</span>
          </PersonOption>
        ))}
        <PersonOption name={`assign-person-${issue.id}`} value={TEAM_ALL} checked={assignee === TEAM_ALL} onChange={setAssignee} initial="팀">
          <span className="text-sm font-bold text-ink-2">{TEAM_LABEL[team]} 팀 전체</span>
          <span className="text-xs text-[#626873]">누구나 가져갈 수 있어요</span>
        </PersonOption>
      </fieldset>

      <p className="rounded-lg bg-web-chip px-3 py-2.5 text-xs text-[#626873]">같은 직군 안에서는 나중에 ‘할 일 넘기기’로 담당자를 바꿀 수 있어요.</p>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-pill bg-ext-soft px-4 py-2.5 text-sm leading-[1.4] font-bold text-black hover:bg-web-line">
          취소
        </button>
        <button type="submit" className="rounded-pill bg-black px-4 py-2.5 text-sm leading-[1.4] font-bold text-white">
          분배하기
        </button>
      </div>
    </form>
  )
}

/** 담당자 카드형 라디오 */
function PersonOption({
  name,
  value,
  checked,
  onChange,
  initial,
  trailing,
  children,
}: {
  name: string
  value: string
  checked: boolean
  onChange: (v: string) => void
  initial: string
  trailing?: string
  children: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-web-header-line bg-white px-3 py-2.5 has-checked:border-accent has-checked:bg-[#edf4ff] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent">
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" />
      <Avatar initial={initial} size={30} />
      <span className="flex min-w-0 flex-1 flex-col">{children}</span>
      {trailing && <span className="text-xs font-medium whitespace-nowrap text-[#626873]">{trailing}</span>}
    </label>
  )
}
