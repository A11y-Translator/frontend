// 03 · 수정값 전달 — 디자이너용 / 개발자용 전환 (Radix Tabs: 방향키로 탭 이동, role=tablist/tab/tabpanel 자동)
import { useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { CodeCopy } from '@/extension/ui'

const TAB = 'flex-1 rounded-md py-1.5 text-xs leading-[1.5] text-muted data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-ink-2 data-[state=active]:shadow-sm'

export default function FixHandoff({ designer, developer }: { designer: string; developer: string }) {
  const [tab, setTab] = useState('dev')
  return (
    <Tabs.Root value={tab} onValueChange={setTab} className="flex w-full flex-col gap-2.5">
      <Tabs.List aria-label="수정값 받는 사람" className="flex gap-1 rounded-lg bg-web-chip p-1">
        <Tabs.Trigger value="design" className={TAB}>디자이너용</Tabs.Trigger>
        <Tabs.Trigger value="dev" className={TAB}>개발자용</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="design">
        <CodeCopy text={designer} label="디자이너용 수정값" />
      </Tabs.Content>
      <Tabs.Content value="dev">
        <CodeCopy text={developer} label="개발자용 코드" />
      </Tabs.Content>
    </Tabs.Root>
  )
}
