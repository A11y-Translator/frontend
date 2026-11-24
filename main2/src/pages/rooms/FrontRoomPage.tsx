// 피그마 "05 프론트 방 · GitHub 연결 · 내추럴" — PR 카드(진행 단계)가 붙는 대화 + 오른쪽 "현재 흐름".
import dotStage from '@/assets/rooms/dot-stage-summit.svg'
import titleDots from '@/assets/rooms/title-dots-all.svg'
import { Link } from 'react-router-dom'
import { REQUEST_ENTRY, RoomFeed, RoomShell } from './RoomShell'
import { FlowGroup, NoteCard, SidePanel } from './RoomSidePanel'
import { FRONT_ROOM } from './roomData'
import { useRoomFeed } from './useRoomFeed'
import { useRoomFlows } from './roomFlows'
import { useRoomHandoff } from './useRoomHandoff'

// GitHub 연결 칩: 제목 줄 오른쪽에 둠 (위 여백을 모든 화면과 맞추면서 제목 위에 띄우던 배치는 뺌)
const GITHUB_CHIP_POS =
  'ml-auto'

/** 제목 줄 오른쪽: GitHub 연결 칩 + "요청 보내기" (요청 확인 화면 /requests/:id/review 도 같이 씀) */
export function FrontRoomHeaderExtra() {
  return (
    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
      <p className={`flex items-center gap-1.5 rounded-[14px] border border-line bg-fill-3 px-2.5 py-1.5 text-xs leading-normal font-medium whitespace-nowrap text-ink ${GITHUB_CHIP_POS}`}>
        <img src={dotStage} alt="" className="size-[7px]" />
        {FRONT_ROOM.github}
      </p>
      {/* 피그마 방 화면에는 없는 버튼 — 06 요청 보내기 모달로 들어가는 길 */}
      <Link to="/requests/new?room=front" className={REQUEST_ENTRY}>
        요청 보내기
      </Link>
    </div>
  )
}

export function FrontRoomPage() {
  const feed = useRoomFeed(FRONT_ROOM.feed, 'front')
  // 현재 흐름: 넘겨주기 카드 저장소에서 (기획안 §7-3)
  const flows = useRoomFlows('front')
  const handoff = useRoomHandoff('front', feed)

  return (
    <RoomShell
      title={FRONT_ROOM.title}
      count={FRONT_ROOM.count}
      // 피그마 그대로 세 점 아이콘 (프론트 방 제목도 같은 그림을 씀)
      icon={<img src={titleDots} alt="" className="h-[7px] w-[27px] shrink-0" />}
      headerExtra={<FrontRoomHeaderExtra />}
      feed={
        <RoomFeed
          label="프론트 방 대화"
          items={feed.items}
          live={feed.live}
          handoff={handoff.feed}
          composer={{ placeholder: FRONT_ROOM.placeholder, onSend: (text) => feed.send(text) }}
        />
      }
      side={
        <SidePanel title={FRONT_ROOM.sideTitle} footer={<NoteCard {...FRONT_ROOM.note} />}>
          {flows.map((group) => (
            <FlowGroup key={group.title} group={group} compact />
          ))}
        </SidePanel>
      }
    >
      {handoff.dialog}
    </RoomShell>
  )
}
