// Figma: todo/team · 우리 팀 할 일 (556:1992) + Assignee dropdown (556:2243)
// 직군별로 묶은 진짜 <table>. 담당자 칸을 누르면 (노션처럼) 같은 직군 팀원 중에서 바로 바꿀 수 있어요.
import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Link } from 'react-router-dom'
import { actions } from '@/shared/store'
import { memberById } from '@/shared/mocks'
import { TEAM_LABEL, type Issue, type Team } from '@/shared/api/types'
import { Avatar, SeverityChip, StatusBadge } from './TodoBits'
import { bySeverity, memberLoad, TEAM_ALL, TEAM_ORDER, targetVersion, teamMembers } from './todoUtils'

interface Props {
  /** 직군이 정해진(미배정이 아닌) 이슈 */
  issues: Issue[]
  allIssues: Issue[]
  filter: Team | 'all'
  announce: (m: string) => void
}

export function TeamTodoTab({ issues, allIssues, filter, announce }: Props) {
  const [collapsed, setCollapsed] = useState<Set<Team>>(new Set())
  const [openId, setOpenId] = useState<string | null>(null)

  const groups = TEAM_ORDER.filter((t) => filter === 'all' || filter === t)
    .map((t) => ({ team: t, items: issues.filter((i) => i.team === t).sort(bySeverity) }))
    .filter((g) => g.items.length > 0)

  const toggle = (t: Team) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })

  return (
    <div className="overflow-hidden rounded-xl border border-web-header-line bg-white">
      <table className="w-full table-fixed border-collapse text-left leading-[1.45]">
        <caption className="sr-only">우리 팀 할 일. 직군별로 묶여 있고, 담당자 칸의 버튼으로 담당자를 바꿀 수 있어요.</caption>
        <colgroup>
          <col />
          <col className="w-[136px]" />
          <col className="w-[166px]" />
          <col className="w-[136px]" />
          <col className="w-[110px]" />
        </colgroup>
        <thead className="bg-web-chip">
          <tr>
            {['이슈', '직군', '담당자', '상태', '버전'].map((h, idx) => (
              <th key={h} scope="col" className={`py-3 text-xs font-bold text-[#626873] ${idx === 0 ? 'pr-2 pl-5' : 'px-2'} ${idx === 4 ? 'pr-5' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>

        {groups.length === 0 && (
          <tbody>
            <tr>
              <td colSpan={5} className="border-t border-web-line-2 px-5 py-6 text-[13px] text-muted-2">
                이 직군에 배정된 할 일이 없어요.
              </td>
            </tr>
          </tbody>
        )}

        {groups.map((g) => {
          const open = !collapsed.has(g.team)
          return (
            <tbody key={g.team}>
              <tr className="border-t border-web-line-2">
                <th scope="colgroup" colSpan={5} className="px-5 py-2.5 text-left">
                  <button type="button" aria-expanded={open} onClick={() => toggle(g.team)} className="flex items-center gap-2 rounded text-[13px] font-bold text-ink-2">
                    <span aria-hidden className="inline-block w-2.5">
                      {open ? '▾' : '▸'}
                    </span>
                    {TEAM_LABEL[g.team]}
                    <span className="text-xs font-normal text-muted-2">{g.items.length}개</span>
                  </button>
                </th>
              </tr>
              {open &&
                g.items.map((i) => (
                  <tr key={i.id} className={`border-t border-web-line-2 ${openId === i.id ? 'bg-[#edf4ff]' : 'bg-white'}`}>
                    <th scope="row" className="py-2.5 pr-2 pl-5 font-normal">
                      <span className="flex min-w-0 items-center gap-2">
                        <SeverityChip severity={i.severity} />
                        <Link to={`/issues/${i.id}`} className="truncate rounded text-sm font-medium text-ink-2 hover:underline">
                          {i.title}
                        </Link>
                      </span>
                    </th>
                    <td className="px-2 py-2.5">
                      <span className="rounded-md bg-web-chip px-2 py-0.5 text-xs font-medium whitespace-nowrap text-ink-3">{TEAM_LABEL[g.team]}</span>
                    </td>
                    <td className="px-2 py-2.5">
                      <AssigneeCell
                        issue={i}
                        team={g.team}
                        allIssues={allIssues}
                        open={openId === i.id}
                        onOpenChange={(o) => setOpenId(o ? i.id : null)}
                        announce={announce}
                      />
                    </td>
                    <td className="px-2 py-2.5">
                      <StatusBadge issue={i} />
                    </td>
                    <td className="py-2.5 pr-5 pl-2 text-[13px] whitespace-nowrap text-[#626873]">버전 {targetVersion(i)}</td>
                  </tr>
                ))}
            </tbody>
          )
        })}

        <tfoot>
          <tr className="border-t border-web-line-2">
            <td colSpan={5} className="px-5 py-3">
              {/* TODO: 직접 추가 폼 — 스토어에 addIssue 액션이 생기면 연결 */}
              <button
                type="button"
                onClick={() => announce('할 일 직접 추가는 준비 중이에요')}
                className="rounded text-[13px] font-medium text-muted-2 hover:text-ink-2"
              >
                + 할 일 직접 추가
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function AssigneeCell({
  issue,
  team,
  allIssues,
  open,
  onOpenChange,
  announce,
}: {
  issue: Issue
  team: Team
  allIssues: Issue[]
  open: boolean
  onOpenChange: (o: boolean) => void
  announce: (m: string) => void
}) {
  const assignee = memberById(issue.assigneeId)
  const currentName = assignee ? assignee.name : `${TEAM_LABEL[team]} 팀 전체`

  const change = (value: string) => {
    if (value === (issue.assigneeId ?? TEAM_ALL)) return
    if (value === TEAM_ALL) {
      actions.changeAssignee(issue.id, undefined)
      announce(`‘${issue.title}’ 담당을 ${TEAM_LABEL[team]} 팀 전체로 바꿨어요`)
    } else {
      actions.changeAssignee(issue.id, value)
      announce(`‘${issue.title}’ 담당자를 ${memberById(value)?.name}님으로 바꿨어요`)
    }
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger
        aria-label={`${currentName}, ${issue.title} 담당자 바꾸기`}
        className="-my-1 flex h-7 w-full max-w-[150px] items-center gap-2 rounded-md border-[1.5px] border-transparent px-1.5 text-left hover:border-web-line hover:bg-white data-[state=open]:border-accent data-[state=open]:bg-white"
      >
        <Avatar initial={assignee ? assignee.initial : '팀'} />
        <span className="truncate text-[13px] font-medium text-ink-2">{currentName}</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 flex w-[230px] flex-col gap-0.5 rounded-[10px] border border-web-header-line bg-white p-1.5 font-noto leading-[1.45] shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        >
          <DropdownMenu.Label className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium text-muted-2">{TEAM_LABEL[team]} 팀 안에서 바꾸기</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={issue.assigneeId ?? TEAM_ALL} onValueChange={change} className="flex flex-col gap-0.5">
            {teamMembers(team).map((m) => (
              <DropdownMenu.RadioItem key={m.id} value={m.id} className={itemCls}>
                <Avatar initial={m.initial} />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-2">{m.name}</span>
                {m.id === issue.assigneeId ? (
                  <DropdownMenu.ItemIndicator aria-hidden className="text-xs font-bold text-[#175fc2]">
                    ✓
                  </DropdownMenu.ItemIndicator>
                ) : (
                  <span className="text-xs whitespace-nowrap text-muted-2">담당 {memberLoad(m, allIssues).assigned}개</span>
                )}
              </DropdownMenu.RadioItem>
            ))}
            <DropdownMenu.RadioItem value={TEAM_ALL} className={itemCls}>
              <Avatar initial="팀" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-medium text-ink-2">{TEAM_LABEL[team]} 팀 전체</span>
                <span className="text-[11px] text-muted-2">누구나 가져갈 수 있어요</span>
              </span>
              {issue.assigneeId ? (
                <span className="text-xs whitespace-nowrap text-muted-2">미지정</span>
              ) : (
                <DropdownMenu.ItemIndicator aria-hidden className="text-xs font-bold text-[#175fc2]">
                  ✓
                </DropdownMenu.ItemIndicator>
              )}
            </DropdownMenu.RadioItem>
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

const itemCls =
  'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-[7px] outline-none data-[highlighted]:bg-web-chip data-[state=checked]:bg-[#edf4ff]'
