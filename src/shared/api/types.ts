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
  /** "해결됨으로 표시" 전 상태 — 되돌리기 하면 이 상태로 돌아감 */
  reopenStatus?: IssueStatus
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

/* ── 프로젝트 생성 · 검사 (새 프로젝트 화면) ─────────────────────────── */

/** 캡처(734×557 기준 px) 위 문제 위치 박스 */
export interface IssueOverlay {
  /** 화면에 보이는 배지 숫자 (페이지 안 순서) */
  label: number
  issueId: string
  selector: string
  page: string
  x: number
  y: number
  w: number
  h: number
}

/** POST /projects 요청 */
export interface CreateProjectInput {
  name: string
  /** normalizeUrl() 을 거친 주소 (https://…) */
  url: string
}

/** 한 번의 검사 결과 (POST /projects/:id/inspections 응답) */
export interface Inspection {
  id: string
  projectId: string
  url: string
  version: number
  /** ISO 8601 */
  scannedAt: string
  standard: string
  /** 검사한 페이지 경로 (예: ['/main', '/contact']) */
  pages: string[]
  /** 기준 통과율 0~100 */
  passRate: number
  issues: Issue[]
  overlays: IssueOverlay[]
  /** 어떻게 검사했는지: live = 실제 페이지(axe-core), mock = 임시 규칙, server = 백엔드 */
  source?: 'live' | 'mock' | 'server'
  /** live 검사: 실제로 연 주소(리다이렉트 반영), 페이지 제목, 검사 화면 캡처(1440×1093) 주소 */
  capture?: { url: string; title?: string; screenshotUrl?: string }
  /** live 검사: 통과한 검사 규칙 수 (이슈 0개일 때 "정말 검사했는지" 보여주는 근거) */
  passedRules?: number
  /** live 검사: 사람이 직접 확인해야 하는 항목 수 (axe incomplete) */
  needsReview?: number
  /** 결과를 믿기 어려울 때 안내 (예: 페이지 내용이 거의 안 그려짐) */
  warning?: string
}
