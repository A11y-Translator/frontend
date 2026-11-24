// 요청 화면(06 · 08 · 09 · 10)의 타입과 고정 문구. 요청 내용 자체는 @/data/requestStore 에 있어요.
import type { RoleId } from '@/data/mock'
import { demoNow } from '@/data/requestStore'

/* ───────── 타입 ───────── */

export type StepState = 'done' | 'current' | 'todo'
export interface Step {
  label: string
  state: StepState
  /** 그 단계가 끝난 때 (요청 상세에서만 보임) */
  at?: string
}

export type RecordTone = 'plain' | 'accept' | 'deliver' | 'fix' | 'confirm' | 'blocked'
export interface RecordItem {
  id: string
  chip: string
  tone: RecordTone
  author: string
  role: RoleId
  at: string
  text: string
}

export type DueMode = 'today' | 'tomorrow' | 'custom'

/* ───────── 진행 단계 ───────── */

const STEP_LABELS = ['요청', '수락', '진행', '전달', '확인']
/** current 번째 단계가 "지금" (5 = 모두 끝남) */
export const stepsAt = (current: number): Step[] =>
  STEP_LABELS.map((label, i) => ({ label, state: i < current ? 'done' : i === current ? 'current' : 'todo' }))

export const requestPath = (id: string) => `/requests/${id}`

/** 피그마 08 · 09 화면에 적힌 예시 문구 — 같은 이름의 요청이면 입력칸에 미리 채워 둠 */
export const EXAMPLE = {
  title: '회원 정보 수정 화면 시안',
  progressNote: '보기 화면과 같은 구조 · 저장 버튼 상단 고정',
  fixText: '프로필 사진 영역이 보기 화면보다 커요. 같은 크기로 맞춰주세요',
}

/* ───────── 06 요청 보내기 ───────── */

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']
/** 오늘에서 days 일 뒤 18:00 → '11/18 (수) 18:00' (목업의 "오늘"은 예시 화면의 11/18, 서버가 붙으면 진짜 오늘) */
function dueAfter(days: number) {
  const d = demoNow()
  d.setDate(d.getDate() + days)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} (${WEEKDAY[d.getDay()]}) 18:00`
}

export const SEND = {
  title: '요청하기',
  sub: '역할별 방과 알림에 요청해요.',
  // 예시 화면의 "오늘"은 11/18 (요청 상세의 요청 시각 기준)
  dueOptions: [
    { value: 'today', label: '오늘', text: dueAfter(0) },
    { value: 'tomorrow', label: '내일', text: dueAfter(1) },
    { value: 'custom', label: '직접 입력', text: '' },
  ] satisfies { value: DueMode; label: string; text: string }[],
  /** 프론트 방에서 열었을 때 채워져 있는 값 (피그마 그대로) */
  filled: {
    need: '회원 정보 수정 화면 시안',
    dueMode: 'custom' as DueMode,
    due: '11/21 (금) 18:00',
    desc: 'PR #25에 보기 화면은 붙였어요. 수정 화면 시안만 필요해요',
    links: ['GitHub  PR #25'],
  },
}

/** 붙여 넣은 주소를 칩 글자로 (GitHub PR 주소 → "GitHub  PR #25") */
export function linkLabel(url: string) {
  const pr = url.match(/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/i)
  if (pr) return `GitHub  PR #${pr[1]}`
  try {
    const u = new URL(url)
    if (/figma\.com$/i.test(u.hostname)) return 'Figma  링크'
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
