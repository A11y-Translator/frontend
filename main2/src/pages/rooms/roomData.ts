// 방(원정대) 화면 예시 데이터 — 피그마 "11 전체 방 / 03 디자인 방 / 05 프론트 방" 의 글자 그대로.
// 백엔드가 붙으면 이 파일의 값만 API 응답으로 바꾸면 됩니다.
// 오른쪽 "현재 흐름"(넘겨줄 것 · 받을 것)은 여기 없고, 넘겨주기 카드 저장소에서 만들어져요 (./roomFlows).
import type { RoleId } from '@/data/mock'

/* ───────── 타입 ───────── */

export type StageState = 'done' | 'current' | 'todo'
export interface PrStage {
  label: string
  state: StageState
}

/** 한 줄짜리 링크 칩 (전체 방: GITHUB #24 … / FIGMA 로그인 화면 v2 ↗) */
export interface LinkAttachment {
  type: 'link'
  source: 'GITHUB' | 'FIGMA'
  title: string
  /** 모두 끝난 PR 단계 이름 (작업 · 리뷰 · 병합 · 배포) */
  stages?: string[]
  /** 앱 안에서 이동할 주소. 없으면 바깥 링크(↗)로 보고 "준비 중" 알림 */
  to?: string
}

/** Figma 미리보기 카드 (디자인 방) */
export interface FigmaAttachment {
  type: 'figma'
  thumb: 'login' | 'mypage'
  /** 바뀐 곳 설명 칩 */
  note: string
  version: string
  title: string
  path: string
  /** 오른쪽 ↗ (Figma 에서 열기) 표시 여부 */
  external: boolean
}

/** GitHub PR 카드 (프론트 방) */
export interface PrAttachment {
  type: 'pr'
  title: string
  branch: string
  stages: PrStage[]
  /** requestId 가 있으면 그 넘겨주기 카드의 지금 상태를 보여 줌 (text 는 카드가 없을 때만) */
  badge: { tone: 'auto' | 'blocked'; label: string; text: string; to: string; requestId?: string }
}

/** "프론트에 넘겨줌 · 마감 11/19 · 확인 대기" 배지 */
export interface HandoffAttachment {
  type: 'handoff'
  strong: string
  rest: string
  to: string
  /** 있으면 그 넘겨주기 카드의 지금 상태(마감 · 확인 대기 …)를 보여 줌 */
  requestId?: string
}

export type Attachment = LinkAttachment | FigmaAttachment | PrAttachment | HandoffAttachment

export interface DateItem {
  kind: 'date'
  id: string
  label: string
}
export interface MessageItem {
  kind: 'message'
  id: string
  author: string
  role: RoleId
  time: string
  /** 'clock' = 09:40 (고정폭) · 'relative' = 10분 전 */
  timeStyle: 'clock' | 'relative'
  text: string
  attachments?: Attachment[]
}
export interface EventItem {
  kind: 'event'
  id: string
  tone: 'handoff' | 'request' | 'github'
  chip: string
  text: string
  /** 누르면 이동할 주소 (없으면 글자만) */
  to?: string
}
export type FeedItem = DateItem | MessageItem | EventItem

export type FlowTone = 'due' | 'muted' | 'action' | 'blocked' | 'date'
export interface FlowItem {
  /** 넘겨주기 카드 id */
  id?: string
  title: string
  /** out = 넘겨줄 것(→) · in = 받을 것(←) */
  dir: 'out' | 'in'
  role: RoleId
  /** PR #24 같은 작은 칩 */
  tag?: string
  status: string
  tone: FlowTone
  to: string
}
export interface FlowGroupData {
  title: string
  count: number
  items: FlowItem[]
}

/* ───────── 공통 ───────── */

const ALL_DONE = ['작업', '리뷰', '병합', '배포']
/** 대화에 나오는 넘겨주기 카드의 요청 상세 (@/data/requestStore 의 예시 카드 id) */
const LOGIN_V2 = '/requests/login-v2'
const LOGIN_API = '/requests/login-api'
const MEMBER_EDIT = '/requests/1'
const COMPARE = '/rooms/front/compare'

/* ───────── 11 전체 방 ───────── */

export const ALL_ROOM = {
  title: '전체 원정대',
  count: '6명',
  placeholder: '모두에게 메시지 · @디자인 처럼 방을 골라 보낼 수 있어요',
  targets: [
    { value: 'all', label: '전체' },
    { value: 'design', label: '디자인' },
    { value: 'front', label: '프론트' },
    { value: 'back', label: '백' },
  ] as const,
  feed: [
    { kind: 'date', id: 'd0', label: '오늘' },
    { kind: 'message', id: 'm1', author: '정하윤', role: 'back', time: '08:50', timeStyle: 'clock', text: '로그인 API 토큰 처리 문제로 하루 더 필요해요' },
    {
      kind: 'message', id: 'm2', author: '최지우', role: 'front', time: '09:10', timeStyle: 'clock', text: '메인 화면 PR 올렸어요. 리뷰 부탁해요',
      attachments: [{ type: 'link', source: 'GITHUB', title: '#24 메인 화면 레이아웃', stages: ALL_DONE, to: '/rooms/front' }],
    },
    {
      kind: 'message', id: 'm3', author: '김혜승', role: 'design', time: '09:40', timeStyle: 'clock', text: '로그인 화면 v2 올렸어요',
      attachments: [{ type: 'link', source: 'FIGMA', title: '로그인 화면 v2' }],
    },
    { kind: 'event', id: 'e1', tone: 'handoff', chip: '넘겨주기', text: '디자인 → 프론트 · 로그인 화면 v2 전달됨 · 확인 대기', to: LOGIN_V2 },
    { kind: 'message', id: 'm4', author: '이민준', role: 'front', time: '10:20', timeStyle: 'clock', text: '로그인 화면은 API 나오면 마저 붙일게요' },
    { kind: 'event', id: 'e2', tone: 'request', chip: '요청', text: '프론트 → 디자인 · 회원 정보 수정 화면 시안 · 11/21까지', to: MEMBER_EDIT },
    { kind: 'message', id: 'm5', author: '박서연', role: 'design', time: '10분 전', timeStyle: 'relative', text: '마이페이지 시안 오늘 6시까지 마무리할게요' },
  ] satisfies FeedItem[],
  sideTitle: '원정대 상황',
  // 피그마 순서 그대로. 요약 문구는 넘겨주기 카드에서 만들어요 (./roomFlows 의 roomSummary)
  rooms: [
    { role: 'front', newLabel: '새 메시지 5' },
    { role: 'back', newLabel: '새 메시지 3' },
    { role: 'design', newLabel: '새 메시지 1' },
  ] satisfies { role: RoleId; newLabel: string }[],
  note: { title: '전체 방에 쓴 메시지', text: '세 방 모두에 공지로 올라가요. 방을 골라 보내면 그 방에만 올라가요' },
}

/* ───────── 03 디자인 방 ───────── */

export const DESIGN_ROOM = {
  title: '디자인',
  count: '2명',
  placeholder: '메시지 입력',
  feed: [
    { kind: 'date', id: 'd0', label: '오늘' },
    {
      kind: 'message', id: 'm1', author: '김혜승', role: 'design', time: '09:40', timeStyle: 'clock', text: '로그인 화면 v2 올렸어요',
      attachments: [
        { type: 'figma', thumb: 'login', note: '버튼 높이 48로 수정', version: 'v2 · 1시간 전 수정', title: '로그인 화면 v2', path: '캠퍼스 앱 › 로그인 › 로그인 화면 v2', external: true },
        { type: 'handoff', strong: '프론트에 넘겨줌', rest: '· 마감 11/19 · 확인 대기', to: LOGIN_V2, requestId: 'login-v2' },
      ],
    },
    {
      kind: 'message', id: 'm2', author: '박서연', role: 'design', time: '10분 전', timeStyle: 'relative', text: '마이페이지 시안 오늘 6시까지 마무리할게요',
      attachments: [
        { type: 'figma', thumb: 'mypage', note: '프로필 영역 작업 중', version: 'v1 · 10분 전 수정', title: '마이페이지 시안', path: '캠퍼스 앱 › 마이페이지 › 시안', external: false },
      ],
    },
  ] satisfies FeedItem[],
  sideTitle: '현재 흐름',
  views: [
    { value: 'list', label: '목록 보기' },
    { value: 'files', label: '링크/파일 보기' },
  ] as const,
}

/* ───────── 05 프론트 방 · GitHub 연결 ───────── */

export const FRONT_ROOM = {
  title: '프론트',
  count: '4명',
  github: 'GitHub 연결됨 · campus-app',
  placeholder: '메시지 입력 · PR 링크를 붙이면 진행 상황이 보여요',
  feed: [
    { kind: 'date', id: 'd0', label: '오늘' },
    {
      kind: 'message', id: 'm1', author: '최지우', role: 'front', time: '09:10', timeStyle: 'clock', text: '메인 화면 PR 올렸어요. 리뷰 부탁해요',
      attachments: [
        {
          type: 'pr', title: '#24 메인 화면 레이아웃', branch: 'feature/main-layout → dev  ·  파일 12개 변경',
          stages: ALL_DONE.map((label) => ({ label, state: 'done' as const })),
          badge: { tone: 'auto', label: '자동', text: '배포 완료 → 디자인에 검토 요청 보냄', to: COMPARE },
        },
      ],
    },
    { kind: 'event', id: 'e1', tone: 'github', chip: 'GITHUB', text: '#25 회원 정보 화면 · dev에 병합됨 · 리뷰 최지우' },
    {
      kind: 'message', id: 'm2', author: '이민준', role: 'front', time: '10:20', timeStyle: 'clock', text: '로그인 화면은 API 나오면 마저 붙일게요',
      attachments: [
        {
          type: 'pr', title: '#27 로그인 화면', branch: 'feature/login → dev  ·  작업 중',
          stages: [
            { label: '작업', state: 'current' },
            { label: '리뷰', state: 'todo' },
            { label: '병합', state: 'todo' },
            { label: '배포', state: 'todo' },
          ],
          badge: { tone: 'blocked', label: '연결된 넘겨주기', text: '로그인 API (백 → 프론트) 2일째 막힘', to: LOGIN_API, requestId: 'login-api' },
        },
      ],
    },
  ] satisfies FeedItem[],
  sideTitle: '현재 흐름',
  note: { title: 'GitHub 자동 연결', text: 'PR이 병합·배포되면 연결된 넘겨주기가 자동으로 전달됨으로 바뀌어요' },
}

/* ───────── 백 방 (피그마 디자인 없음 — 다른 방 데이터에서 백과 관련된 것만 옮김) ───────── */

export const BACK_ROOM = {
  title: '백',
  count: '2명',
  placeholder: '메시지 입력',
  sideTitle: '현재 흐름',
  states: [
    { value: 'empty', label: '비어 있음' },
    { value: 'loading', label: '불러오는 중' },
    { value: 'error', label: '불러오기 실패' },
  ] as const,
  empty: { title: '아직 메시지가 없어요', lines: ['백 방에 첫 메시지를 남겨 보세요.'], action: '메시지 남기기' },
  loading: { text: '백 방을 불러오는 중이에요…' },
  error: { title: '백 방을 불러오지 못했어요', lines: ['서버가 꺼져 있거나 연결이 끊겼을 수 있어요.', '잠시 후 다시 불러와 주세요.'], action: '다시 불러오기' },
}
