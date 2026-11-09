// Figma: 할 일 탭 · 세부 화면 (556:1816)
//  - todo/mine 내 할 일 (556:1817) · todo/team 우리 팀 할 일 (556:1992) · todo/unassigned 미배정 분배 (557:1717)
//  - todo/handoff 할 일 넘기기 모달 (557:1839 / 557:1948) → TodoHandoffModal.tsx
// 탭은 주소(/todo/:tab)와 맞춰 둡니다. 탭을 바꾸면 주소가 바뀌고, 주소로 들어오면 그 탭이 열려요.
import { useState, type ReactNode } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Header } from '@/web/layout/Header'
import { useAppState } from '@/shared/store'
import { CURRENT_USER_ID } from '@/shared/mocks'
import { TEAM_LABEL, type Team } from '@/shared/api/types'
import { MyTodoTab, type MineSort } from './MyTodoTab'
import { TeamTodoTab } from './TeamTodoTab'
import { UnassignedTodoTab } from './UnassignedTodoTab'
import { LiveToast, SelectMenu } from './TodoBits'
import { isTodoTab, TEAM_ORDER, useAnnouncer, type TodoTab } from './todoUtils'

const DESCRIPTION: Record<TodoTab, string> = {
  mine: '내 할 일을 먼저 보여줘요. 고친 이슈는 다시 검사하면 자동으로 완료돼요.',
  team: '팀 전체 할 일이에요. AI가 나눈 담당이 틀렸다면 칸을 눌러 직접 고칠 수 있어요.',
  unassigned: 'AI가 검사 결과를 직군별로 나눴어요. 잘못 나뉜 할 일은 직접 바꿀 수 있어요.',
}

const tabTrigger =
  'rounded-pill border px-3 py-1.5 text-[13px] leading-[1.45] whitespace-nowrap ' +
  'data-[state=inactive]:border-[#d5d9e0] data-[state=inactive]:bg-white data-[state=inactive]:font-medium data-[state=inactive]:text-ink-2 data-[state=inactive]:hover:bg-web-chip ' +
  'data-[state=active]:border-ink-2 data-[state=active]:bg-ink-2 data-[state=active]:font-bold data-[state=active]:text-white'

export default function TodoPage() {
  const { tab } = useParams()
  const navigate = useNavigate()
  const { issues, comments, currentVersion } = useAppState()
  const [message, announce] = useAnnouncer()
  const [mineSort, setMineSort] = useState<MineSort>('severity')
  const [teamFilter, setTeamFilter] = useState<Team | 'all'>('all')
  const [unassignedFilter, setUnassignedFilter] = useState<Team | 'all'>('all')

  if (!isTodoTab(tab)) return <Navigate to="/todo/mine" replace />

  // 탭 숫자는 스토어에서 바로 계산 → 확장에서 보낸 것·재검사 자동 해결·분배 결과가 즉시 반영
  const mine = issues.filter((i) => i.assigneeId === CURRENT_USER_ID)
  const team = issues.filter((i) => i.status !== 'unassigned' && i.team)
  const unassigned = issues.filter((i) => i.status === 'unassigned')

  const teamCounts = TEAM_ORDER.map((t) => ({ team: t, count: team.filter((i) => i.team === t).length })).filter((c) => c.count > 0)

  return (
    <>
      <Header version={`버전 ${currentVersion}`} />
      <div className="flex flex-col gap-5 page-x pt-10 pb-8 font-noto">
        <div className="flex flex-col gap-1.5 leading-[1.45]">
          <h1 className="text-[30px] font-bold text-ink-2">할 일</h1>
          <p className="text-[15px] text-[#626873]">{DESCRIPTION[tab]}</p>
        </div>

        <Tabs.Root value={tab} onValueChange={(v) => navigate(`/todo/${v}`)} className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Tabs.List aria-label="할 일 보기" className="flex items-center gap-2">
              <Tabs.Trigger value="mine" className={tabTrigger}>
                내 할 일 {mine.length}
              </Tabs.Trigger>
              <Tabs.Trigger value="team" className={tabTrigger}>
                우리 팀 할 일 {team.length}
              </Tabs.Trigger>
              <Tabs.Trigger value="unassigned" className={tabTrigger}>
                미배정 {unassigned.length}
              </Tabs.Trigger>
            </Tabs.List>
            <div className="flex-1" />

            {/* 탭마다 오른쪽 도구가 달라요 */}
            {tab === 'mine' && (
              <SelectMenu<MineSort>
                prefix="정렬"
                value={mineSort}
                onChange={setMineSort}
                options={[
                  { value: 'severity', label: '심각도순' },
                  { value: 'no', label: '번호순' },
                ]}
              />
            )}
            {tab === 'team' && (
              <div role="group" aria-label="직군으로 거르기" className="flex flex-wrap items-center gap-2">
                <FilterChip pressed={teamFilter === 'all'} onClick={() => setTeamFilter('all')}>
                  전체
                </FilterChip>
                {teamCounts.map((c) => (
                  <FilterChip key={c.team} pressed={teamFilter === c.team} onClick={() => setTeamFilter(c.team)}>
                    {TEAM_LABEL[c.team]} {c.count}
                  </FilterChip>
                ))}
              </div>
            )}
            {tab === 'unassigned' && (
              <SelectMenu<Team | 'all'>
                prefix="직군"
                value={unassignedFilter}
                onChange={setUnassignedFilter}
                options={[{ value: 'all', label: '전체' }, ...TEAM_ORDER.map((t) => ({ value: t, label: TEAM_LABEL[t] }))]}
              />
            )}
          </div>

          <Tabs.Content value="mine" className="rounded-xl outline-offset-4">
            <MyTodoTab issues={mine} comments={comments} allIssues={issues} sort={mineSort} announce={announce} />
          </Tabs.Content>
          <Tabs.Content value="team" className="rounded-xl outline-offset-4">
            <TeamTodoTab issues={team} allIssues={issues} filter={teamFilter} announce={announce} />
          </Tabs.Content>
          <Tabs.Content value="unassigned" className="rounded-xl outline-offset-4">
            <UnassignedTodoTab issues={unassigned} allIssues={issues} filter={unassignedFilter} announce={announce} />
          </Tabs.Content>
        </Tabs.Root>
      </div>
      <LiveToast message={message} />
    </>
  )
}

function FilterChip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-pill border px-2.5 py-[3px] text-xs leading-[1.45] whitespace-nowrap ${
        pressed ? 'border-ink-2 bg-ink-2 font-bold text-white' : 'border-[#d5d9e0] bg-white font-medium text-ink-2 hover:bg-web-chip'
      }`}
    >
      {children}
    </button>
  )
}
