// 피그마 "06 요청 보내기 · 내추럴" — 방 화면 위에 "요청하기" 모달이 열린 상태 (/requests/new?room=front|design).
// 피그마는 프론트 방 위에 그려져 있어 기본은 프론트 방, ?room=design 이면 디자인 방 위에 엽니다.
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ROLE, type RoleId } from '@/data/mock'
import { createRequest } from '@/data/requestStore'
import { DesignRoomPage } from '@/pages/rooms/DesignRoomPage'
import { FrontRoomPage } from '@/pages/rooms/FrontRoomPage'
import { useToast } from '@/ui/toast'
import { RequestSendDialog, type SentRequest } from './RequestSendDialog'
import { requestPath } from './requestData'

export function RequestSendPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const from: RoleId = params.get('room') === 'design' ? 'design' : 'front'

  // 닫기 · 취소 → 원래 방으로
  const close = (open: boolean) => {
    if (!open) navigate(ROLE[from].path)
  }

  // 보낸 뒤 → 카드를 만들고 그 요청 상세로. 이 방(from)이 받는 쪽, 고른 역할이 만들어 보내는 쪽 (기획안 §8-2)
  const sent = (request: SentRequest) => {
    const card = createRequest({ title: request.need, fromRole: request.to, toRole: from, due: request.due, description: request.desc, links: request.links })
    toast(`${ROLE[request.to].label} 방에 요청을 보냈어요 · ${request.due}까지`)
    navigate(requestPath(card.id))
  }

  return (
    <>
      {from === 'design' ? <DesignRoomPage /> : <FrontRoomPage />}
      {/* key: 방이 바뀌면 입력값을 새로 시작 */}
      <RequestSendDialog key={from} open onOpenChange={close} from={from} onSent={sent} />
    </>
  )
}
