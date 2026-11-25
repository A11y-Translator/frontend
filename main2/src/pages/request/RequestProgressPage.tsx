// 피그마 "08 진행 · 완료 알리기 · 내추럴" — 보내는 쪽 방 위에 "다 했어요" 모달이 열린 상태 (/requests/:id/progress).
// 피그마는 디자인 방 위에 그려져 있고, 여기서는 그 카드를 보내는 역할의 방 위에 엽니다.
import { useState, type ComponentType } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ROLE, type RoleId } from '@/data/mock'
import { deliverRequest, statusText, useRequest } from '@/data/requestStore'
import { BackRoomPage } from '@/pages/rooms/BackRoomPage'
import { DesignRoomPage } from '@/pages/rooms/DesignRoomPage'
import { FrontRoomPage } from '@/pages/rooms/FrontRoomPage'
import { REQUEST_ENTRY } from '@/pages/rooms/RoomShell'
import { useToast } from '@/ui/toast'
import { RequestProgressDialog, type Delivery } from './RequestProgressDialog'
import { RequestDialog } from './requestParts'
import { requestPath } from './requestData'

const ROOM_PAGE: Record<RoleId, ComponentType> = { design: DesignRoomPage, front: FrontRoomPage, back: BackRoomPage }

export function RequestProgressPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const live = useRequest(id)
  // 열었을 때의 카드로 그림 (전달 직후 상태가 바뀌어도 이동하기 전까지 모달이 흔들리지 않게)
  const [card] = useState(live)
  const Room = ROOM_PAGE[card?.fromRole ?? 'design']

  // 닫기 · 취소 → 요청 상세로 (없는 요청이면 방으로)
  const close = (open: boolean) => {
    if (!open) navigate(card ? requestPath(card.id) : ROLE.design.path)
  }

  // 전달한 뒤 → 확인 요청을 보냈으면 받는 쪽 화면(09 확인 · 수정 요청), 아니면 요청 상세
  const delivered = ({ note, askConfirm }: Delivery) => {
    if (!card) return
    const next = deliverRequest(card.id, note)
    const again = next?.history[next.history.length - 1]?.kind === 'redeliver'
    toast(`결과물을 ${again ? '다시 ' : ''}전달했어요${askConfirm ? ` · ${card.requester}님에게 확인 요청을 보냈어요` : ''}`)
    navigate(askConfirm ? `${requestPath(card.id)}/review` : requestPath(card.id))
  }

  // 전달할 수 있는 건 요청됨 · 진행 중인 카드뿐 (기획안 §7-5 보내는 쪽 '전달')
  const ready = card && (card.status === 'requested' || card.status === 'accepted')

  return (
    <>
      <Room />
      {ready ? (
        <RequestProgressDialog card={card} open onOpenChange={close} onDelivered={delivered} />
      ) : (
        <RequestDialog
          open
          onOpenChange={close}
          title={card ? '지금은 전달할 수 없어요' : '요청을 찾을 수 없어요'}
          description={card ? `${card.title} · ${statusText(card)}` : '주소를 다시 확인해 주세요.'}
        >
          <p className="text-sm leading-normal text-ink">
            {card ? (card.status === 'delivered' ? '이미 전달했어요. 받는 쪽 확인을 기다리는 중이에요.' : '확인까지 끝난 요청이에요.') : '예시 데이터로 되돌리면서 지워진 요청일 수 있어요.'}
          </p>
          <Link to={card ? requestPath(card.id) : '/rooms/all'} className={`self-start ${REQUEST_ENTRY}`}>
            {card ? '요청 상세 보기' : '전체 원정대 방으로'}
          </Link>
        </RequestDialog>
      )}
    </>
  )
}
