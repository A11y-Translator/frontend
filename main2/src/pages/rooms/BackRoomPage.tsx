// 백 방 — 피그마에 따로 그린 화면이 없어, 같은 방 틀에 "07-2 상태" 카드(비어 있음 · 불러오는 중 · 불러오기 실패)를 보여 줍니다.
// 오른쪽 아래 "상태 미리보기" 는 개발용 전환 스위치예요.
import { useEffect, useRef, useState } from 'react'
import dotBack from '@/assets/dot-back.svg'
import { Segmented } from '@/ui'
import { RoomFeed, RoomShell } from './RoomShell'
import { FlowGroup, SidePanel } from './RoomSidePanel'
import { EmptyState, ErrorState, LoadingState } from './RoomStates'
import { BACK_ROOM, type FeedItem } from './roomData'
import { useRoomFeed } from './useRoomFeed'
import { useRoomFlows } from './roomFlows'

// 예시 대화가 없는 방 (보낸 메시지와 넘겨주기 이벤트만 쌓임)
const NO_ITEMS: FeedItem[] = []

type State = (typeof BACK_ROOM.states)[number]['value']

export function BackRoomPage() {
  const feed = useRoomFeed(NO_ITEMS, 'back')
  // 현재 흐름: 넘겨주기 카드 저장소에서 (기획안 §7-3)
  const flows = useRoomFlows('back')
  const [state, setState] = useState<State>('empty')
  const input = useRef<HTMLInputElement>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const preview = (next: State) => {
    window.clearTimeout(timer.current)
    setState(next)
  }

  // 다시 불러오기: 불러오는 중 → 잠시 뒤 비어 있음
  const retry = () => {
    preview('loading')
    timer.current = window.setTimeout(() => setState('empty'), 1400)
  }

  // 메시지나 넘겨주기 이벤트가 하나라도 있으면 비어 있음 대신 대화 목록을 보여 줌
  const hasMessages = feed.items.length > 0
  const stateView =
    state === 'loading' ? (
      <LoadingState bare text={BACK_ROOM.loading.text} />
    ) : state === 'error' ? (
      <ErrorState bare title={BACK_ROOM.error.title} lines={BACK_ROOM.error.lines} actionLabel={BACK_ROOM.error.action} onRetry={retry} />
    ) : hasMessages ? undefined : (
      <EmptyState bare title={BACK_ROOM.empty.title} lines={BACK_ROOM.empty.lines} actionLabel={BACK_ROOM.empty.action} onAction={() => input.current?.focus()} />
    )

  return (
    <RoomShell
      title={BACK_ROOM.title}
      count={BACK_ROOM.count}
      icon={<img src={dotBack} alt="" className="size-[7px] shrink-0" />}
      feed={
        <RoomFeed
          label="백 방 대화"
          items={feed.items}
          live={feed.live}
          composer={{ placeholder: BACK_ROOM.placeholder, onSend: (text) => feed.send(text), inputRef: input, disabled: state !== 'empty' }}
        >
          {stateView}
        </RoomFeed>
      }
      side={
        <SidePanel
          title={BACK_ROOM.sideTitle}
          footer={
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-muted">상태 미리보기</span>
              <Segmented label="상태 미리보기" options={BACK_ROOM.states} value={state} onChange={preview} />
            </div>
          }
        >
          {flows.map((group) => (
            <FlowGroup key={group.title} group={group} />
          ))}
        </SidePanel>
      }
    />
  )
}
