// API 가 주고받는 값의 모양(DTO). 화면과 저장소가 쓰는 타입을 그대로 내보내서, 서버 응답도 같은 모양이면 바로 붙습니다.
// (저장소 타입을 다시 적지 않고 가져다 씀 — 한 곳만 고치면 돼요)
import type { PlanCheckpoint, PlanRole } from '@/data/planStore'
import type { HandoffCard, RequestAction } from '@/data/requestStore'

export type { RoleId } from '@/data/mock'
/** 로그인한 사용자 · 세션 · 팀 스페이스 */
export type { Session, User, Workspace } from '@/data/sessionStore'
/** 시작하기에서 정한 일정 (마감일 · 역할 · 체크포인트) */
export type { Plan, PlanCheckpoint, PlanRole } from '@/data/planStore'
/** 넘겨주기 카드 + 주고받은 기록 */
export type { HandoffCard, HistoryKind, HistoryRecord, NewRequest, RequestAction, RequestStatus } from '@/data/requestStore'
/** 방 대화 메시지 */
export type { RoomId, RoomMessage } from '@/data/roomStore'
/** 메시지 첨부 (Figma 미리보기 · PR 카드 · 링크 칩 · 넘겨주기 배지) */
export type { Attachment } from '@/pages/rooms/roomData'
/** 알림 */
export type { Notification } from '@/data/notificationStore'

/** 체크포인트(구간) = 프로젝트의 단계. Plan.checkpoints 의 한 칸 */
export type Checkpoint = PlanCheckpoint

/* ───────── 로그인 ───────── */

export interface LoginInput {
  email: string
  password: string
}

/** 구글 로그인: 구글이 준 ID 토큰(credential). 목업에서는 비어 있음 */
export interface GoogleLoginInput {
  credential?: string
}

/* ───────── 기획안 · 추천 루트 ───────── */

/** 올린 기획안 파일 정보 */
export interface PlanFile {
  id: string
  name: string
  /** 바이트 */
  size: number
  /** MIME (application/pdf …) */
  type: string
  /** 쪽수 (모르면 null) */
  pages: number | null
  /** 서버에 올라간 파일 주소 (있으면) */
  url?: string
}

/** 기획안을 넣은 방법: 파일(올린 뒤 fileId) · 링크 · 직접 입력 */
export type PlanSource = { type: 'file'; name: string; fileId?: string } | { type: 'link'; url: string } | { type: 'text'; text: string }

/** AI 추천 루트 만들기에 보내는 값 */
export interface RouteRecommendInput {
  deadline: { date: string; time: string; unit: 'day' | 'hour' }
  roles: PlanRole[]
  source: PlanSource
}

/** AI 추천 루트: 산 위 체크포인트 (베이스 캠프 · 정상 제외, 최대 8개) */
export interface RouteRecommendation {
  checkpoints: PlanCheckpoint[]
}

/* ───────── 넘겨주기 카드 ───────── */

/** PATCH /requests/:id — 한 일(action)과 그 결과로 프론트가 계산한 카드(card)를 함께 보냄 */
export interface RequestUpdate {
  action: RequestAction
  card: HandoffCard
}

/* ───────── 알림 ───────── */

export interface MarkReadInput {
  ids: string[]
}

/** 오류 응답 본문: { "message": "보여 줄 문구", "code": "선택" } */
export interface ApiErrorBody {
  message: string
  code?: string
}
