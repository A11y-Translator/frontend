// 피그마 "11 전체 방" — 세 방의 소식이 한곳에 모이는 방 + 오른쪽 "방별 상황" · 오른쪽 위 방 바로가기(전체 · 디자인 · 프론트 · 백).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROLE } from '@/data/mock'
import titleDots from '@/assets/rooms/title-dots-all.svg'
import { RoomFeed, RoomShell } from './RoomShell'
import { NoteCard, SidePanel } from './RoomSidePanel'
import { isOpen, useRequests } from '@/data/requestStore'
import { ALL_ROOM } from './roomData'
import { roomSummary } from './roomFlows'
import { useRoomFeed } from './useRoomFeed'

type Target = (typeof ALL_ROOM.targets)[number]['value']


export function AllRoomPage() {
  const feed = useRoomFeed(ALL_ROOM.feed, 'all')
  // 방별 요약은 넘겨주기 카드에서 (막힘 → 마감 임박 → 확인 대기 순 · 기획안 §7-2)
  const requests = useRequests()
  const [target, setTarget] = useState<Target>('all')
  const targetLabel = ALL_ROOM.targets.find((t) => t.value === target)?.label ?? '전체'

  // "보낼 곳: 전체 ▾" 칩 — 보이는 칩 위에 투명한 select 를 겹쳐 실제로 고를 수 있게
  const targetChip = (
    <span className="relative flex shrink-0 items-center rounded-[11px] bg-fill-2 px-2 py-1 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-summit hover:bg-fill-3">
      <span aria-hidden className="text-xs leading-normal font-semibold whitespace-nowrap text-ink">
        보낼 곳: {targetLabel} ▾
      </span>
      <select
        aria-label="보낼 곳"
        value={target}
        onChange={(e) => setTarget(e.target.value as Target)}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      >
        {ALL_ROOM.targets.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </span>
  )

  return (
    <RoomShell
      title={ALL_ROOM.title}
      count={ALL_ROOM.count}
      gap="tight"
      icon={<img src={titleDots} alt="" className="h-[7px] w-[27px] shrink-0" />}
      headerExtra={
        <nav aria-label="방 바로가기" className="ml-auto flex items-center gap-0.5 rounded-[14px] bg-fill-2 p-[3px]">
          <span aria-current="page" className="rounded-[11px] bg-surface px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
            전체
          </span>
          {(['design', 'front', 'back'] as const).map((r) => (
            <Link key={r} to={ROLE[r].path} className="rounded-[11px] px-2.5 py-1 text-xs font-medium text-muted hover:text-ink">
              {ROLE[r].label}
            </Link>
          ))}
        </nav>
      }
      feed={
        <RoomFeed
          label="전체 원정대 대화"
          items={feed.items}
          live={feed.live}
          density="compact"
          showRoomChip
          composer={{
            placeholder: ALL_ROOM.placeholder,
            leading: targetChip,
            // 고른 곳에 저장 — 전체면 세 방 모두에, 방을 고르면 그 방(과 여기)에만 보여요
            onSend: (text) => feed.send(text, target === 'all' ? '세 방 모두에' : `${targetLabel} 방에`, target),
          }}
        />
      }
      side={
        <SidePanel title={ALL_ROOM.sideTitle} gapClass="gap-5" footer={<NoteCard {...ALL_ROOM.note} />}>
          <ul className="flex w-full flex-col gap-3">
            {ALL_ROOM.rooms.map((room) => {
              const role = ROLE[room.role]
              const open = requests.filter(isOpen)
              const sent = open.filter((c) => c.fromRole === room.role).length
              const recv = open.filter((c) => c.toRole === room.role).length
              return (
                <li key={room.role}>
                  <Link to={role.path} className="flex w-full flex-col gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3.5 leading-normal transition hover:border-ink/25">
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <span aria-hidden className="size-[9px] rounded-full" style={{ background: role.color }} />
                        <span className="text-[15px] font-bold text-ink">
                          {role.label} 방<span className="sr-only">으로 이동</span>
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-canvas">{room.newLabel}</span>
                        <span aria-hidden className="text-lg font-medium text-muted">
                          ›
                        </span>
                      </span>
                    </span>
                    <span className="flex w-full items-center gap-2 rounded-[14px] px-3 py-2.5" style={{ background: role.bg }}>
                      <span className="shrink-0 rounded-lg bg-surface px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.4px]" style={{ color: role.color }}>
                        AI<span className="sr-only"> 진행 요약</span>
                      </span>
                      <span className="min-w-0 flex-1 text-[13px] font-medium text-ink">{roomSummary(requests, room.role)}</span>
                    </span>
                    <span className="text-xs text-muted">
                      보낼 것 {sent} · 받을 것 {recv}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </SidePanel>
      }
    />
  )
}
