// 버전 비교 화면 예시 데이터 (피그마 "07 버전 비교" · "07-2 버전 비교 (심플)" 의 글자 그대로).
import type { RoleId } from '@/data/mock'

export type VersionId = 'current' | 'dev'

export const GITHUB_STATUS = 'GitHub 연결됨 · campus-app'
export const ROOM = { name: '프론트', people: '2명' }
export const SCREEN_NAME = '메인 피드'
export const PR_CHIP = 'dev 반영 · PR #25, #26'

/** 비교하는 두 버전. basic = 07, simple = 07-2 의 문구 */
export const VERSIONS: Record<
  VersionId,
  {
    barLabel: string
    barLine: string
    paneName: string
    chip: string
    url: string
    caption: string
    simpleName: string
    simpleLine: string
    /** 화면낭독기용 미리보기 설명 */
    alt: string
  }
> = {
  current: {
    barLabel: '현재 버전 · 운영',
    barLine: 'v1.3.0 · main · 11/17 배포',
    paneName: '현재 버전',
    chip: 'v1.3.0 · 운영',
    url: 'campus-app.kr',
    caption: '11/17 배포 · main 기준',
    simpleName: '지금 서비스 중',
    simpleLine: 'v1.3.0 · 11/17 배포',
    alt: '현재 버전 v1.3.0 메인 피드 화면. 검색창 아래에 ‘오늘의 글’ 카드 3개가 있고, 하단 탭바에 아이콘 4개가 있어요.',
  },
  dev: {
    barLabel: '개발 서버',
    barLine: 'v1.4.0-dev · dev · 오늘 10:20',
    paneName: '개발 서버',
    chip: 'v1.4.0-dev',
    url: 'dev.campus-app.kr',
    caption: '오늘 10:20 · #25 병합 후 자동 갱신',
    simpleName: '개발 서버 (dev)',
    simpleLine: 'v1.4.0 · 10:20에 마지막으로 갱신',
    alt: '개발 서버 v1.4.0-dev 메인 피드 화면. 검색창 아래에 공지 배너 ‘공지 · 기말 기간 열람실 24시간 운영’이 새로 생겼고, ‘오늘의 글’ 카드 3개의 간격이 좁아졌고, 하단 탭바 아이콘 4개가 작아졌어요.',
  },
}

/** 개발 서버에서 바뀐 곳 (미리보기 240×500 안의 위치, px) */
export const CHANGES = [
  { id: 'banner', name: '공지 배너', x: 9, y: 103, w: 220, h: 52 },
  { id: 'cards', name: '카드 간격', x: 9, y: 180, w: 220, h: 262 },
  { id: 'tabbar', name: '탭바 아이콘', x: 5, y: 451, w: 228, h: 44 },
] as const

export interface CompareReply {
  author: string
  role: RoleId
  time: string
  text: string
}

export interface CompareComment {
  id: number
  author: string
  role: RoleId
  time: string
  /** 시간을 고정폭 글꼴로 (10:24) */
  timeMono?: boolean
  /** 미해결 표시 대신 "메모" 로 보이는 코멘트 */
  memo?: boolean
  resolved: boolean
  /** 어느 버전 화면 위에 찍혔는지 */
  version: VersionId
  place: string
  /** 07 문구 */
  text: string
  /** 07-2(심플) 문구 */
  simpleText: string
  /** 미리보기(240×500) 안에서 핀의 왼쪽 위 위치 */
  pin: { x: number; y: number }
  replies: CompareReply[]
}

export const COMMENTS: CompareComment[] = [
  {
    id: 1,
    author: '김혜승',
    role: 'design',
    time: '10분 전',
    resolved: false,
    version: 'dev',
    place: '개발 서버 · 피드 카드',
    text: '카드 사이 간격이 시안(16)보다 좁아요. 12로 들어간 것 같은데 확인 부탁해요.',
    simpleText: '카드 간격이 시안보다 좁아요. 16px로 맞춰 주세요.',
    pin: { x: 207, y: 209 },
    replies: [{ author: '최지우', role: 'front', time: '5분 전', text: '토큰을 잘못 물렸네요. 오늘 안에 고쳐서 dev에 다시 올릴게요.' }],
  },
  {
    id: 2,
    author: '박서연',
    role: 'design',
    time: '8분 전',
    resolved: false,
    version: 'dev',
    place: '개발 서버 · 하단 탭바',
    text: '탭바 아이콘이 시안보다 작아졌어요 (24 → 20). 현재 버전에서는 맞게 나와요.',
    simpleText: '탭바 아이콘이 24px에서 20px로 작아졌어요.',
    pin: { x: 207, y: 429 },
    replies: [],
  },
  {
    id: 3,
    author: '이민준',
    role: 'front',
    time: '10:24',
    timeMono: true,
    memo: true,
    resolved: false,
    version: 'dev',
    place: '개발 서버 · 공지 배너',
    text: '공지 배너는 API 연결 전이라 더미 문구예요. 문구는 신경 안 쓰셔도 돼요.',
    simpleText: '공지 배너 문구는 임시예요. API 연결 후 바뀌어요.',
    pin: { x: 207, y: 91 },
    replies: [],
  },
  {
    // 피그마에는 "해결됨 1" 과 회색 핀(4) 위치만 있고 내용이 없어요 — 아래 글자는 임시 문구.
    id: 4,
    author: '박서연',
    role: 'design',
    time: '어제',
    resolved: true,
    version: 'dev',
    place: '개발 서버 · 상단 제목',
    text: '상단 제목 왼쪽 여백이 시안과 달랐는데, 다시 보니 맞게 고쳐졌어요.',
    simpleText: '상단 제목 왼쪽 여백이 시안과 같아졌어요.',
    pin: { x: 71, y: 27 },
    replies: [],
  },
]
