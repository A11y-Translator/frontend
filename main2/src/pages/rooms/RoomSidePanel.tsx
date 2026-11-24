// 방 오른쪽 패널과 그 안의 부품: 흐름 묶음(넘겨줄 것 · 받을 것) · 안내 카드 · 보기 전환.
//
// SidePanel   title: string · children · footer?: ReactNode(패널 맨 아래 고정) · gapClass?: string
// FlowGroup   group: FlowGroupData · compact?: boolean(행 위아래 11px — 프론트 방)
// FlowRow     item: FlowItem · compact?: boolean        (li · 행 전체가 링크)
// RoleTag     role: RoleId                              (작은 역할 칩)
// NoteCard    title: string · text: string
// PanelToggle label · options · value · onChange        (목록 보기 / 링크·파일 보기)
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ROLE, type RoleId } from '@/data/mock'
import { ROOM_PANEL } from './RoomShell'
import type { FlowGroupData, FlowItem, FlowTone } from './roomData'

export function SidePanel({ title, children, footer, gapClass = 'gap-4' }: { title: string; children: ReactNode; footer?: ReactNode; gapClass?: string }) {
  return (
    <section aria-label={title} className={`${ROOM_PANEL} flex min-h-0 min-w-0 flex-col overflow-y-auto p-[22px] ${gapClass}`}>
      <h2 className="text-base leading-normal font-bold text-ink">{title}</h2>
      {children}
      {footer && <div className="mt-auto flex w-full flex-col items-start pt-2">{footer}</div>}
    </section>
  )
}

/** 작은 역할 칩 (→ 프론트) */
export function RoleTag({ role }: { role: RoleId }) {
  return (
    <span className="rounded-[7.5px] px-1.5 py-px text-[11px] leading-normal font-semibold whitespace-nowrap" style={{ background: ROLE[role].bg, color: ROLE[role].color }}>
      {ROLE[role].label}
    </span>
  )
}

const TONE: Record<FlowTone, string> = {
  due: 'text-xs font-semibold text-[#f1c28d]',
  muted: 'text-xs font-semibold text-muted',
  action: 'text-xs font-semibold text-checkpoint-text',
  blocked: 'text-xs font-semibold text-blocked',
  date: 'font-mono text-[11px] font-medium text-muted',
}

export function FlowRow({ item, compact = false }: { item: FlowItem; compact?: boolean }) {
  return (
    <li>
      <Link
        to={item.to}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-fill px-3 leading-normal transition hover:bg-fill-3 ${compact ? 'py-[11px]' : 'py-3'}`}
      >
        <span className="flex min-w-0 flex-col items-start gap-1">
          <span className="text-sm font-semibold text-ink">{item.title}</span>
          <span className="flex flex-wrap items-center gap-1">
            <span aria-hidden className="text-xs font-medium text-muted">
              {item.dir === 'out' ? '→' : '←'}
            </span>
            <span className="sr-only">{item.dir === 'out' ? '받는 곳' : '보내는 곳'}</span>
            <RoleTag role={item.role} />
            {item.tag && <span className="rounded-lg border border-line bg-fill-3 px-[5px] py-px font-mono text-[10px] font-medium whitespace-nowrap text-muted">{item.tag}</span>}
          </span>
        </span>
        <span className={`shrink-0 whitespace-nowrap ${TONE[item.tone]}`}>{item.status}</span>
      </Link>
    </li>
  )
}

export function FlowGroup({ group, compact = false }: { group: FlowGroupData; compact?: boolean }) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <h3 className="flex items-center gap-1.5 py-1 leading-normal">
        <span className="text-[13px] font-semibold text-ink">{group.title}</span>
        <span className="font-mono text-xs font-medium text-muted">
          {group.count}
          <span className="sr-only">개</span>
        </span>
      </h3>
      {group.items.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {group.items.map((item) => (
            <FlowRow key={item.id ?? item.title} item={item} compact={compact} />
          ))}
        </ul>
      ) : (
        // 확인이 끝나면 흐름에서 빠져요 (기획안 §8-4)
        <p className="text-xs leading-normal text-muted">지금은 없어요</p>
      )}
    </div>
  )
}

/** 패널 아래 안내 카드 (전체 방에 쓴 메시지 · GitHub 자동 연결) */
export function NoteCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex w-full flex-col gap-1 rounded-2xl border border-line bg-fill p-3 text-xs leading-normal">
      <p className="font-semibold text-ink">{title}</p>
      <p className="text-muted">{text}</p>
    </div>
  )
}

/** 보기 전환 (피그마 View toggle: 둥근 16 · 12px Regular) */
export function PanelToggle<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-start gap-0.5 rounded-2xl bg-fill-2 p-[3px]">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 text-xs leading-normal whitespace-nowrap ${on ? 'rounded-[13px] bg-fill-3 text-ink' : 'rounded-md text-muted hover:text-ink'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
