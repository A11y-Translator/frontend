// 웹·확장 공통 데이터 타입. 백엔드 API가 정해지면 여기를 기준으로 맞춥니다.

/** 확장(ext/Severity) 심각도 — axe impact: critical / serious / moderate / minor */
export type Severity = 'critical' | 'serious' | 'moderate' | 'minor'

/** 웹(Component 1) 상태 태그 */
export type Priority = 'high' | 'normal'

export type Category = '색 대비' | '대체 텍스트' | '키보드' | '폼 레이블' | '링크' | '문서 구조'

export type Team = 'design' | 'frontend' | 'backend' | 'pm'

export type IssueStatus = 'unassigned' | 'todo' | 'in_progress' | 'review' | 'resolved'

export interface Member {
  id: string
  name: string
  /** 아바타에 쓰는 한 글자 */
  initial: string
  team: Team
  role: string
  email: string
  lead?: boolean
  assigned: number
  resolved: number
}

export interface ContrastOption {
  color: string
  ratio: string
  label: string
}

export interface Issue {
  id: string
  /** 목록 번호 (오버레이 배지 #1, #2 …) */
  no: number
  title: string
  /** 사용자 관점 설명 (확장 카드 두 번째 줄) */
  impact: string
  category: Category
  severity: Severity
  priority: Priority
  wcag: string
  elements: number
  selectors: string[]
  page: string
  comments: number
  status: IssueStatus
  team?: Team
  assigneeId?: string
  /** AI 추천 직군 (미배정일 때) */
  aiTeam?: Team
  due?: string
  version: number
  /** 색 대비 이슈의 상세 설명 */
  detail?: string
  fixOptions?: ContrastOption[]
  fixCode?: string
  /** 확장에서 저장한 수정안 */
  savedFix?: string
  /** 재검사로 자동 해결됐는지 */
  autoResolved?: boolean
}

export interface Comment {
  id: string
  issueId: string
  authorId: string
  body: string
  time: string
  pin?: { x: number; y: number }
}

export interface Project {
  id: string
  name: string
  url: string
  status: 'active' | 'done'
  updatedAt: string
  currentVersion: number
}

export interface Version {
  no: number
  date: string
  remainingComments: number
  issues: number
  resolved: number
}

export const TEAM_LABEL: Record<Team, string> = {
  design: '디자인',
  frontend: '프론트엔드',
  backend: '백엔드',
  pm: 'PM',
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: '치명',
  serious: '심각',
  moderate: '보통',
  minor: '경미',
}
