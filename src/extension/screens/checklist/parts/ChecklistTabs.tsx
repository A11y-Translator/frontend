// 내 할 일 · 전체 · 미배정 탭 (v1·v2 공통). Radix Tabs → 방향키 이동, tablist/tab/tabpanel 역할 자동
// 탭 모양(네모/알약)은 버전마다 달라서 className 으로 받음
import type { ReactNode } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { CHECKLIST_TABS, type ChecklistTab } from './checklistModel'

interface Props {
  value: ChecklistTab
  onChange: (t: ChecklistTab) => void
  counts: Record<ChecklistTab, number>
  listClassName: string
  triggerClassName: string
  /** 탭별 내용 */
  children: (tab: ChecklistTab) => ReactNode
}

export default function ChecklistTabs({ value, onChange, counts, listClassName, triggerClassName, children }: Props) {
  return (
    <Tabs.Root value={value} onValueChange={(v) => onChange(v as ChecklistTab)} className="flex w-full flex-col gap-2.5">
      <Tabs.List aria-label="체크리스트 보기" className={`flex w-full ${listClassName}`}>
        {CHECKLIST_TABS.map((t) => (
          <Tabs.Trigger key={t.key} value={t.key} className={`min-w-0 flex-1 text-xs leading-[1.5] whitespace-nowrap ${triggerClassName}`}>
            {t.label} {counts[t.key]}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {CHECKLIST_TABS.map((t) => (
        <Tabs.Content key={t.key} value={t.key} className="w-full">
          {children(t.key)}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  )
}
