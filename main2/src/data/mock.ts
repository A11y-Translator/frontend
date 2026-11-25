// 화면에 보여 줄 예시 데이터 (피그마 "최종 3 · 다듬음" 의 글자 그대로).
// 나중에 백엔드가 붙으면 이 파일의 값만 API 응답으로 바꾸면 됩니다.

export type RoleId = 'design' | 'front' | 'back'

export const ROLE: Record<RoleId, { label: string; color: string; bg: string; path: string }> = {
  // 색은 CSS 변수라 밝은 화면 / 어두운 곳(.theme-dark)에서 알맞은 값으로 바뀌어요 (styles/index.css)
  design: { label: '디자인', color: 'var(--color-role-design)', bg: 'var(--color-role-design-bg)', path: '/rooms/design' },
  front: { label: '프론트', color: 'var(--color-role-front)', bg: 'var(--color-role-front-bg)', path: '/rooms/front' },
  back: { label: '백', color: 'var(--color-role-back)', bg: 'var(--color-role-back-bg)', path: '/rooms/back' },
}

export const WORKSPACE = { name: 'A11y Team' }
export const ME = { name: '김혜승', role: 'design' as RoleId }

/** 사이드바 방(원정대) 목록과 새 소식 개수 */
export const ROOMS: { id: 'all' | RoleId; label: string; count: number; path: string }[] = [
  { id: 'all', label: '전체 원정대', count: 9, path: '/rooms/all' },
  { id: 'design', label: '디자인', count: 3, path: '/rooms/design' },
  { id: 'front', label: '프론트', count: 5, path: '/rooms/front' },
  { id: 'back', label: '백', count: 1, path: '/rooms/back' },
]

export const PROJECT = {
  name: '캠퍼스 앱',
  deadlineDate: '2026. 12. 03 (목)',
  deadlineTime: '18:00',
  deadlineShort: '12/03 18:00',
  daysLeft: 15,
  planFile: { name: '캠퍼스앱_기획안_v3.pdf', pages: 12 },
  roles: [
    { role: 'design' as RoleId, people: 2 },
    { role: 'front' as RoleId, people: 2 },
    { role: 'back' as RoleId, people: 2 },
  ],
}

/**
 * 루트의 체크포인트 (0 = 베이스 캠프, 그 뒤 = 산 위 체크포인트). AI 추천 결과가 들어올 자리.
 * 개수를 늘리거나 줄이면 추천 루트 화면의 산 위 핀·점선이 자동으로 바뀝니다.
 * 선택: weight (그 구간의 길이, 예: 예상 일수) 를 주면 그만큼 높이 간격이 벌어져요. 예) { no: 2, name: '메인 피드', weight: 2 }
 */
export const CHECKPOINTS = [
  { no: 0, name: '베이스 캠프' },
  { no: 1, name: '로그인' },
  { no: 2, name: '메인 피드' },
  { no: 3, name: '마이페이지' },
  { no: 4, name: '알림' },
] as const

export const SUMMIT = { name: '완주 성공', when: '12/3 18:00' }

/** 팀 스페이스 목록 (사이드바 맨 위 드롭다운). 서버가 붙으면 api.workspaces.list() 응답으로 바뀝니다 */
export const WORKSPACES: { id: string; name: string }[] = [
  { id: 'a11y-team', name: WORKSPACE.name },
  { id: 'campus-app', name: '캠퍼스 앱 팀' },
  { id: 'personal', name: '개인 스페이스' },
]

/** 목업 로그인에서 들어오는 사용자 (피그마 화면의 "나") */
export const MOCK_USER = { id: 'u-hyeseung', name: ME.name, email: 'hyeseung@example.com', role: ME.role }
