// "내 업무가 아닌가요? 담당자 변경" (v1·v2 공통)
// 직군 탭(Radix Tabs) → 팀원 목록(radio group) → 나에게 가져오기 / 담당자 변경
// 위쪽 안내(지금 담당 표시 방식)는 버전마다 달라서 각 버전 화면에서 그림
import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { actions } from '@/shared/store'
import { members, CURRENT_USER_ID, memberById } from '@/shared/mocks'
import { TEAM_LABEL, type Issue, type Team } from '@/shared/api/types'
import { ExtButton } from '@/extension/ui'
import AssigneeAvatar from './AssigneeAvatar'

const TEAMS: Team[] = ['design', 'frontend', 'backend']
/** 담당 수가 이 이하면 "여유 있음" */
const LIGHT_LOAD = 3

export default function AssigneeChangePanel({ issue }: { issue: Issue }) {
  const current = memberById(issue.assigneeId)
  const [team, setTeam] = useState<Team>(current?.team ?? issue.team ?? issue.aiTeam ?? 'frontend')
  const [selected, setSelected] = useState<string | undefined>()
  const [done, setDone] = useState<string>('')

  const assign = (memberId: string) => {
    const m = memberById(memberId)
    if (!m) return
    // 미배정 이슈는 상태도 "할 일"로 바뀌어야 하므로 assignTeam 사용
    if (issue.status === 'unassigned') actions.assignTeam(issue.id, m.team, m.id)
    else actions.changeAssignee(issue.id, m.id, m.team)
    setSelected(undefined)
    setDone(m.id === CURRENT_USER_ID ? '내 할 일로 가져왔어요.' : `담당자를 ${m.name}(으)로 바꿨어요.`)
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Tabs.Root value={team} onValueChange={(v) => { setTeam(v as Team); setSelected(undefined) }} className="flex flex-col gap-2">
        <Tabs.List aria-label="직군" className="flex flex-wrap gap-1">
          {TEAMS.map((t) => (
            <Tabs.Trigger
              key={t}
              value={t}
              className="rounded-full border border-ext-frame bg-white px-2.5 py-1 text-[11px] leading-[1.45] font-medium text-ink-2 data-[state=active]:border-ink-2 data-[state=active]:bg-ink-2 data-[state=active]:font-bold data-[state=active]:text-white"
            >
              {TEAM_LABEL[t]}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {TEAMS.map((t) => (
          <Tabs.Content key={t} value={t}>
            <fieldset className="flex flex-col gap-1.5">
              <legend className="sr-only">{TEAM_LABEL[t]} 팀원 중 새 담당자 선택</legend>
              {members
                .filter((m) => m.team === t)
                .map((m) => {
                  const isCurrent = m.id === current?.id
                  const checked = selected === m.id
                  return (
                    <label
                      key={m.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent ${
                        checked ? 'border-accent bg-[#edf4ff]' : 'border-ext-frame bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`assignee-${issue.id}`}
                        value={m.id}
                        checked={checked}
                        onChange={() => setSelected(m.id)}
                        className="sr-only"
                      />
                      <AssigneeAvatar member={m} />
                      <span className="flex min-w-0 flex-1 flex-col leading-[1.45]">
                        <span className="text-xs font-medium text-ink-2">
                          {m.name}
                          {isCurrent && ' · 현재 담당'}
                          {m.id === CURRENT_USER_ID && ' (나)'}
                        </span>
                        <span className="text-[11px] text-muted">
                          담당 {m.assigned}
                          {m.assigned <= LIGHT_LOAD && ' · 여유 있음'}
                        </span>
                      </span>
                      <span aria-hidden className="shrink-0 text-[11px] font-bold text-[#175fc2]">{checked ? '✓ 선택' : ''}</span>
                    </label>
                  )
                })}
            </fieldset>
          </Tabs.Content>
        ))}
      </Tabs.Root>

      <div className="flex flex-wrap justify-end gap-2">
        {issue.assigneeId !== CURRENT_USER_ID && (
          <ExtButton variant="ghost" onClick={() => assign(CURRENT_USER_ID)}>나에게 가져오기</ExtButton>
        )}
        <ExtButton disabled={!selected || selected === current?.id} onClick={() => selected && assign(selected)}>
          담당자 변경
        </ExtButton>
      </div>
      <p aria-live="polite" className={done ? 'text-right text-[11px] text-success' : 'sr-only'}>{done}</p>
    </div>
  )
}
