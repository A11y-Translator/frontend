// 메인보드 · 2구간 할 일 추천 시트 · 루트 상세 화면에 보여 줄 예시 데이터 (피그마 글자 그대로).
// 나중에 백엔드가 붙으면 이 파일의 값만 API 응답으로 바꾸면 됩니다.
import type { RoleId } from '@/data/mock'

/** 세부 할 일의 출처: 기획안에 근거가 있으면 plan, AI가 추론하면 ai */
export type TodoSource = 'plan' | 'ai'

export interface Todo {
  id: string
  label: string
  source: TodoSource
  /** 처음부터 담겨 있는지 (담음 / 제안) */
  added: boolean
}

export const SOURCE_LABEL: Record<TodoSource, string> = { plan: '기획안', ai: 'AI 추천' }

/* ───────── 01 메인 ───────── */

// 최종 마감 칩은 시작하기에서 정한 마감일로 만들어요 (@/data/planStore 의 deadlineChip)

/**
 * 원정대 흐름 작은 지도의 핀 자리. x·y 는 피그마 좌표(408.919 × 168.223 상자 안, 핀 왼쪽 위).
 * 이름 · 개수는 planStore 의 체크포인트에서 오고, 여기 값은 "자리"로만 써요 (MainBoardPage 의 flowPins).
 */
export const FLOW_MAP = { width: 408.919, height: 168.223 }
export const FLOW_PINS: { no: number | 'summit'; label: string; x: number; y: number }[] = [
  { no: 1, label: '로그인', x: 1.63, y: 107.81 },
  { no: 2, label: '메인보드', x: 97.47, y: 85.05 },
  { no: 3, label: '마이페이지', x: 193.3, y: 58.7 },
  { no: 4, label: '알림', x: 289.13, y: 29.95 },
  { no: 'summit', label: '완주', x: 390.95, y: 0 },
]

/** 원정대 흐름 아래 요청 줄은 넘겨주기 카드 저장소(@/data/requestStore)에서 만들어요. 한 번에 보여 줄 줄 수 (피그마: 2줄) */
export const FLOW_ROWS = 2

/** 역할(방) 카드 — 피그마에는 세 카드의 글자가 모두 같아요 */
export interface RoomCardData {
  role: RoleId
  aiSummary: string
  latestLink: { kind: string; title: string }
  lastMessage: { title: string; when: string; lines: string[] }
}

const ROOM_CARD_BODY = {
  aiSummary: '로그인 화면 v2 넘김 완료 · 마이페이지 시안 오늘 마감 예정',
  latestLink: { kind: 'FIGMA', title: '로그인 화면 v2' },
  lastMessage: {
    title: '작업 진행 상황',
    when: '10분 전',
    lines: ['오늘 마이페이지 전부 작업 완료했고, 사용성테스트 진행 후 추후 수정하겠습니다.', '더 필요한거 있으면 코멘트 남겨주세요.'],
  },
}

/** 화면에 놓이는 순서: 디자인 · 백 · 프론트 */
export const ROOM_CARDS: RoomCardData[] = [
  { role: 'design', ...ROOM_CARD_BODY },
  { role: 'back', ...ROOM_CARD_BODY },
  { role: 'front', ...ROOM_CARD_BODY },
]

/* ───────── Sheet · 2구간 할 일 추천 ───────── */

export const SECTION_SHEET = {
  chip: '2구간 도착',
  meta: '11/22 (토) · 메인 피드 11/22 – 11/27',
  title: '메인 피드 구간에 들어섰어요',
  desc: ['1구간 진행 상황을 반영해서 이번 구간 할 일을 추천해요.', '필요한 것만 골라 담아 주세요.'],
  carryTitle: '1구간에서 이어지는 일',
  carry: [{ id: 'login-api', title: '로그인 API 연결', flow: '백 → 프론트', status: '2일째 막힘', path: '/requests/login-api' }],
  recommendTitle: '이번 구간 추천 할 일',
  parts: [
    {
      role: 'design',
      label: '디자인',
      todos: [
        { id: 's2-d1', label: '피드 카드 시안', source: 'plan', added: true },
        { id: 's2-d2', label: '피드가 비어 있을 때 화면', source: 'ai', added: true },
      ],
    },
    {
      role: 'front',
      label: '프론트',
      todos: [
        { id: 's2-f1', label: '피드 목록 화면 만들기', source: 'plan', added: true },
        { id: 's2-f2', label: '로그인 API 대기 중 목업 데이터로 연결', source: 'ai', added: true },
      ],
    },
    {
      role: 'back',
      label: '백',
      todos: [
        { id: 's2-b1', label: '피드 조회 API 명세', source: 'plan', added: true },
        { id: 's2-b2', label: '피드 정렬 기준 정하기', source: 'ai', added: false },
      ],
    },
  ] satisfies { role: RoleId; label: string; todos: Todo[] }[],
  nextNote: '다음 구간 할 일은 11/25에 추천해요',
  later: '나중에 고를게요',
}

/* ───────── 01-2 루트 ───────── */

export const ROUTE_HEADER = { title: '원정대 흐름' }

/**
 * 루트 캔버스 크기(피그마)와 핀 위치. x·y 는 핀 발(산길에 닿는 점)의 가운데.
 * 1~4번의 이름과 정상의 날짜는 planStore 에서 와요 (RouteDetailPage). 여기 이름은 피그마 예시.
 */
export const ROUTE_CANVAS_W = 1232
export const ROUTE_PINS: { no: number | 'summit'; name: string; state: 'done' | 'planned' | 'summit'; x: number; y: number }[] = [
  { no: 0, name: '베이스캠프', state: 'done', x: 90, y: 460.5 },
  { no: 1, name: '로그인', state: 'done', x: 410, y: 380.5 },
  { no: 2, name: '메인 피드', state: 'planned', x: 650, y: 340.5 },
  { no: 3, name: '마이페이지', state: 'planned', x: 790, y: 275.5 },
  { no: 4, name: '알림', state: 'planned', x: 910, y: 215.5 },
  { no: 'summit', name: '정상', state: 'summit', x: 1010, y: 160.5 },
]

/** 정상 카드 이름. 날짜는 시작하기에서 정한 마감일 (planStore 의 deadlineText().short) */
export const ROUTE_SUMMIT = { name: '정상' }

/** 예정 구간 카드 (도착하면 할 일을 추천) */
export const ROUTE_NEXT = { no: 2, title: '2 · 메인 피드', name: '메인 피드', dates: '11/22 – 11/27', note: '도착하면 추천' }

export interface RouteSection {
  no: number
  name: string
  dates: string
  status: string
  note?: string
  parts: { label: string; todos: Todo[] }[]
}

/** 펼친 구간 (세부 할 일을 보여 주는 구간) */
export const ROUTE_SECTIONS: RouteSection[] = [
  {
    no: 0,
    name: '베이스캠프',
    dates: '11/19 – 11/21',
    status: '진행 준비',
    note: '모든 화면의 공통 기반',
    parts: [
      { label: '디자인', todos: [{ id: 'r0-d1', label: '컬러·타이포 기초 세팅', source: 'plan', added: true }] },
      { label: '프론트', todos: [{ id: 'r0-f1', label: '프로젝트·라우팅 세팅', source: 'plan', added: true }] },
      { label: '백엔드', todos: [{ id: 'r0-b1', label: 'DB 구조 설계', source: 'plan', added: true }] },
    ],
  },
  {
    no: 1,
    name: '로그인',
    dates: '11/19 – 11/24',
    status: '진행 준비',
    parts: [
      {
        label: '디자인',
        todos: [
          { id: 'r1-d1', label: '로그인 화면 와이어프레임', source: 'plan', added: true },
          { id: 'r1-d2', label: '소셜 로그인 버튼 정하기', source: 'ai', added: false },
        ],
      },
      {
        label: '프론트',
        todos: [
          { id: 'r1-f1', label: '로그인 폼 화면 만들기', source: 'plan', added: true },
          { id: 'r1-f2', label: '입력 오류 메시지 처리', source: 'ai', added: false },
        ],
      },
      {
        label: '백엔드',
        todos: [
          { id: 'r1-b1', label: '로그인 API 명세 작성', source: 'plan', added: true },
          { id: 'r1-b2', label: '토큰 만료 처리 방식 정하기', source: 'ai', added: false },
        ],
      },
    ],
  },
]

/** 목록 보기에서 보여 줄 나머지 구간 (피그마에 날짜가 있는 것만 날짜 표시) */
export const ROUTE_UPCOMING: { no: number; name: string; dates?: string }[] = [
  { no: 2, name: '메인 피드', dates: '11/22 – 11/27' },
  { no: 3, name: '마이페이지' },
  { no: 4, name: '알림' },
]

/** 보기 전환 */
export const ROUTE_VIEWS = [
  { value: 'map', label: '체크포인트 보기' },
  { value: 'list', label: '목록 보기' },
] as const
export type RouteView = (typeof ROUTE_VIEWS)[number]['value']
