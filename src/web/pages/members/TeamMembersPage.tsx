// Figma: member · 팀원 (564:2202)
// 제목 줄 · 탭(팀원 / 활동 피드) · 직군 필터 · 정렬 · 팀원 카드 그리드 + 오른쪽 상세 패널.
// 숫자(담당/해결)와 활동은 공유 스토어에서 계산 → 넘기기·분배·재검사 결과가 바로 반영돼요.
import { useState, type ReactNode } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Header } from '@/web/layout/Header'
import { useAppState } from '@/shared/store'
import { CURRENT_USER_ID, memberById, members } from '@/shared/mocks'
import { TEAM_LABEL, type Member, type Team } from '@/shared/api/types'
import { MemberCard } from './MemberCard'
import { MemberDetail } from './MemberDetail'
import { buildActivities, memberLoad, mentionHandle, TEAM_ORDER, useAnnouncer } from './membersUtils'

type Sort = 'assigned' | 'resolved' | 'name'
const SORT_LABEL: Record<Sort, string> = { assigned: '담당 이슈순', resolved: '해결순', name: '이름순' }

const tabTrigger =
  'rounded-pill border px-3 py-[5px] text-[13px] leading-[1.45] whitespace-nowrap ' +
  'data-[state=inactive]:border-[#d9d9d9] data-[state=inactive]:bg-white data-[state=inactive]:font-medium data-[state=inactive]:text-ink-2 data-[state=inactive]:hover:bg-web-chip ' +
  'data-[state=active]:border-ink-2 data-[state=active]:bg-ink-2 data-[state=active]:font-bold data-[state=active]:text-white'

export default function TeamMembersPage() {
  const { issues, comments, currentVersion } = useAppState()
  const [tab, setTab] = useState<'members' | 'feed'>('members')
  const [filter, setFilter] = useState<Team | 'all'>('all')
  const [sort, setSort] = useState<Sort>('assigned')
  const [selectedId, setSelectedId] = useState(CURRENT_USER_ID)
  const [message, announce] = useAnnouncer()

  const loads = new Map(members.map((m) => [m.id, memberLoad(m, issues)]))
  const visible = members
    .filter((m) => filter === 'all' || m.team === filter)
    .map((m, idx) => ({ m, idx, load: loads.get(m.id)! }))
    .sort((a, b) =>
      sort === 'name'
        ? a.m.name.localeCompare(b.m.name, 'ko')
        : sort === 'resolved'
          ? b.load.resolved - a.load.resolved || a.idx - b.idx
          : b.load.assigned - a.load.assigned || a.idx - b.idx,
    )
  const teamCounts = TEAM_ORDER.map((t) => ({ team: t, count: members.filter((m) => m.team === t).length })).filter((c) => c.count > 0)

  const selected = memberById(selectedId) ?? members[0]
  const activities = buildActivities(issues, comments)
  const selectedIssues = issues.filter((i) => i.assigneeId === selected.id && i.status !== 'resolved').slice(0, 5)

  // TODO: 실제 멘션 입력창이 생기면 그쪽으로 연결. 지금은 "@이름"을 복사해 코멘트에 붙여넣도록
  const mention = (m: Member) => {
    const handle = mentionHandle(m)
    navigator.clipboard?.writeText(handle).catch(() => {})
    announce(`‘${handle}’을 복사했어요. 코멘트에 붙여넣으면 멘션돼요`)
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <Header version={`버전 ${currentVersion}`} />
      <div className="flex flex-col gap-8 page-x pt-10 pb-8 font-noto">
        {/* 제목 줄 */}
        <div className="flex items-end gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1 leading-[1.45]">
            <h1 className="text-[30px] font-bold text-ink-2">팀원</h1>
            <p className="text-[15px] text-muted-2">누가 어떤 이슈를 맡고 있는지 한눈에 봐요</p>
          </div>
          <button
            type="button"
            onClick={() => announce('팀원 초대는 준비 중이에요')}
            className="shrink-0 rounded-pill bg-black px-4 py-2.5 text-sm leading-[1.4] font-bold text-white hover:bg-ink-2"
          >
            + 팀원 초대
          </button>
        </div>

        <Tabs.Root value={tab} onValueChange={(v) => setTab(v as 'members' | 'feed')} className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-1.5">
            <Tabs.List aria-label="팀원 보기" className="flex items-center gap-1.5">
              <Tabs.Trigger value="members" className={tabTrigger}>
                팀원 {members.length}
              </Tabs.Trigger>
              <Tabs.Trigger value="feed" className={tabTrigger}>
                활동 피드
              </Tabs.Trigger>
            </Tabs.List>
            {tab === 'members' && (
              <>
                <span aria-hidden className="mx-1 h-[18px] w-px bg-[#d9d9d9]" />
                <div role="group" aria-label="직군으로 거르기" className="flex flex-wrap items-center gap-1.5">
                  <Chip pressed={filter === 'all'} onClick={() => setFilter('all')}>
                    전체
                  </Chip>
                  {teamCounts.map((c) => (
                    <Chip key={c.team} pressed={filter === c.team} onClick={() => setFilter(c.team)}>
                      {TEAM_LABEL[c.team]} {c.count}
                    </Chip>
                  ))}
                </div>
                <div className="flex-1" />
                <SortMenu value={sort} onChange={setSort} />
              </>
            )}
          </div>

          <Tabs.Content value="members" className="rounded-[10px] outline-offset-4">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(320px,372px)] items-start gap-5">
              <div className="min-w-0">
                <h2 className="sr-only">팀원 목록</h2>
                {visible.length === 0 ? (
                  <p className="text-[13px] text-muted-2">이 직군에 팀원이 없어요.</p>
                ) : (
                  <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                    {visible.map(({ m, load }) => (
                      <MemberCard
                        key={m.id}
                        member={m}
                        load={load}
                        selected={m.id === selected.id}
                        onSelect={() => setSelectedId(m.id)}
                        onMention={() => mention(m)}
                      />
                    ))}
                  </ul>
                )}
              </div>
              <MemberDetail
                member={selected}
                assignedCount={loads.get(selected.id)!.assigned}
                issues={selectedIssues}
                activities={activities.filter((a) => a.memberId === selected.id).slice(0, 5)}
                onMention={() => mention(selected)}
              />
            </div>
          </Tabs.Content>

          <Tabs.Content value="feed" className="rounded-[10px] outline-offset-4">
            <h2 className="sr-only">활동 피드</h2>
            {activities.length === 0 ? (
              <p className="text-[13px] text-muted-2">최근 활동이 없어요.</p>
            ) : (
              <ul className="max-w-[720px] overflow-hidden rounded-[10px] border border-[#d9d9d9] leading-[1.45]">
                {activities.map((a, idx) => {
                  const who = memberById(a.memberId)
                  return (
                    <li key={a.id} className={`flex items-center gap-3 px-4 py-3 ${idx > 0 ? 'border-t border-[#ececec]' : ''}`}>
                      <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e9eaec] text-[13px] font-bold text-ink-3">
                        {who?.initial}
                      </span>
                      <p className="min-w-0 flex-1 text-[13px] text-ink-3">
                        <span className="font-bold text-ink-2">{who?.name}</span> · {a.text}
                      </p>
                      <span className="text-xs whitespace-nowrap text-muted-2">{a.time}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>

      <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-8 left-[calc(50%+140px)] z-[60] -translate-x-1/2 font-noto">
        {message && (
          <span className="block rounded-pill bg-ink-2 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
            {message}
          </span>
        )}
      </div>
    </div>
  )
}

function Chip({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-pill border bg-white px-3 py-[5px] text-[13px] leading-[1.45] whitespace-nowrap text-ink-2 hover:bg-web-chip ${
        pressed ? 'border-ink-2 font-bold' : 'border-[#d9d9d9] font-medium'
      }`}
    >
      {children}
    </button>
  )
}

function SortMenu({ value, onChange }: { value: Sort; onChange: (s: Sort) => void }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="rounded-md px-1 text-[13px] leading-[1.45] font-medium whitespace-nowrap text-muted-2 hover:text-ink-2">
        정렬: {SORT_LABEL[value]} <span aria-hidden>▾</span>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[160px] rounded-[10px] border border-web-header-line bg-white p-1.5 font-noto shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        >
          <DropdownMenu.Label className="px-2.5 pt-1 pb-1 text-[11px] font-medium text-muted-2">정렬</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={value} onValueChange={(v) => onChange(v as Sort)}>
            {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
              <DropdownMenu.RadioItem
                key={s}
                value={s}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-[7px] text-[13px] text-ink-2 outline-none data-[highlighted]:bg-web-chip data-[state=checked]:font-bold"
              >
                {SORT_LABEL[s]}
                <DropdownMenu.ItemIndicator aria-hidden className="text-xs font-bold text-[#175fc2]">
                  ✓
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
