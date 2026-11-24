// 피그마 "09 확인 · 수정 요청 · 내추럴" — 프론트 방 대화에 전달 카드가 올라온 화면 (/requests/:id/review).
// 방 틀 · 오른쪽 "현재 흐름" 은 프론트 방과 같고, 대화 칸에 확인 카드가 들어갑니다.
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import titleDots from '@/assets/rooms/title-dots-all.svg'
import { confirmRequest, requestFix, useRequest } from '@/data/requestStore'
import { FrontRoomHeaderExtra } from '@/pages/rooms/FrontRoomPage'
import { EventRow, MessageRow, REQUEST_ENTRY, RoomFeed, RoomShell } from '@/pages/rooms/RoomShell'
import { FlowGroup, NoteCard, SidePanel } from '@/pages/rooms/RoomSidePanel'
import { FRONT_ROOM, type FeedItem } from '@/pages/rooms/roomData'
import { useRoomFlows } from '@/pages/rooms/roomFlows'
import { useRoomFeed } from '@/pages/rooms/useRoomFeed'
import { useToast } from '@/ui/toast'
import { RequestReviewCard } from './RequestReviewCard'
import { requestPath } from './requestData'
import { stepsOf } from './requestView'

// 카드 아래에 붙는 대화 (처음에는 비어 있음 — 보낸 메시지 · 수정 요청이 여기에 쌓임)
const NO_ITEMS: FeedItem[] = []

export function RequestReviewPage() {
  const { id = '' } = useParams()
  // 카드 아래에는 이 화면을 연 뒤에 오간 것만 (프론트 방 대화 · 이벤트는 저장소에서 옴)
  const [since] = useState(() => Date.now())
  const feed = useRoomFeed(NO_ITEMS, 'front', { since })
  const navigate = useNavigate()
  const toast = useToast()
  const flows = useRoomFlows('front')
  const live = useRequest(id)
  // 카드 내용은 열었을 때의 값으로 (확인 · 수정 요청 직후에도 카드가 흔들리지 않게), 진행 단계만 지금 값으로
  const [card] = useState(live)

  // 확인했어요 → 확인 완료로 바꾸고 요청 상세(전체 흐름)로. 흐름에서 빠져요 (기획안 §6-① · §8-4)
  const confirm = () => {
    if (!card) return
    confirmRequest(card.id)
    toast(`확인했어요 · ${card.maker}님에게 알렸어요`)
    navigate(requestPath(card.id))
  }

  // 수정 요청 → 다시 진행으로 돌림. 이 방 · 보낸 방 · 전체 방 대화에 한 줄 남아요
  const fix = (text: string) => {
    if (!card) return
    requestFix(card.id, text)
    // 대화의 '수정 요청' 줄은 카드 기록에서 만들어져요 (보낸 방 · 전체 방에도 같이 보임 — roomEvents)
    feed.announce(`수정 요청을 보냈어요: ${text}`)
    toast('수정 요청을 보냈어요')
  }

  return (
    <RoomShell
      title={FRONT_ROOM.title}
      count={FRONT_ROOM.count}
      icon={<img src={titleDots} alt="" className="h-[7px] w-[27px] shrink-0" />}
      headerExtra={<FrontRoomHeaderExtra />}
      feed={
        <RoomFeed
          label="프론트 방 대화"
          items={feed.items}
          live={feed.live}
          composer={{ placeholder: FRONT_ROOM.placeholder, onSend: (text) => feed.send(text) }}
        >
          {/* RoomFeed 의 가운데 정렬 칸을 위에서부터 꽉 채워 씀 */}
          <ol className="-my-4 flex w-full flex-col items-start gap-[22px] self-start">
            <li className="w-full text-center text-xs leading-normal font-medium text-muted">오늘</li>
            <li className="w-full">
              {card ? (
                <RequestReviewCard card={card} steps={stepsOf(live ?? card)} onConfirm={confirm} onFix={fix} />
              ) : (
                // 없는 요청 (주소가 틀렸거나 예시 데이터로 되돌려 지워짐)
                <div className="flex w-full flex-col items-start gap-3 rounded-[20px] border border-white/[0.06] bg-white/[0.03] px-4 py-[18px] @2xl:px-5">
                  <h2 className="text-sm leading-normal font-semibold text-ink">요청을 찾을 수 없어요</h2>
                  <p className="text-[13px] leading-normal text-muted">주소를 다시 확인해 주세요. 지금 확인할 것은 오른쪽 “받을 것”에 있어요.</p>
                  <Link to="/rooms/front" className={REQUEST_ENTRY}>
                    프론트 방으로
                  </Link>
                </div>
              )}
            </li>
            {feed.items.map((item) => (item.kind === 'message' ? <MessageRow key={item.id} item={item} /> : item.kind === 'event' ? <EventRow key={item.id} item={item} /> : null))}
          </ol>
        </RoomFeed>
      }
      side={
        <SidePanel title={FRONT_ROOM.sideTitle} footer={<NoteCard {...FRONT_ROOM.note} />}>
          {flows.map((group) => (
            <FlowGroup key={group.title} group={group} compact />
          ))}
        </SidePanel>
      }
    />
  )
}
