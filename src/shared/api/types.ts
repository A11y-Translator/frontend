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
  /**
   * 어느 스레드의 코멘트인지 — 캡처 위 위치 하나 = 스레드 하나.
   * 파란 번호(문제 위치)는 markerThreadKey(page, label), 직접 꽂은 핀은 'pin:…' (첫 코멘트 때 만듦)
   */
  threadKey?: string
}

export interface Project {
  id: string
  name: string
  url: string
  status: 'active' | 'done'
  updatedAt: string
  currentVersion: number
  /**
   * 여러 페이지 검사: 함께 검사할 페이지 주소 (첫 번째 = url).
   * 자동 찾기로 고른 페이지도 첫 검사 뒤 여기에 고정돼서, 재검사 때 같은 페이지끼리 비교돼요.
   */
  pageUrls?: string[]
  /** 첫 검사 때 첫 페이지의 같은 사이트 링크에서 페이지를 이만큼 더 찾아 검사 (0/없음 = 안 찾음) */
  discover?: number
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

/** 파란 번호(문제 위치) 스레드 키 — 예: 'marker:/main:1' */
export const markerThreadKey = (page: string, label: number) => `marker:${page}:${label}`

/** 코멘트가 속한 스레드 키 (예전 데이터처럼 없으면 이슈 단위 'issue:i1') */
export const threadKeyOf = (c: Pick<Comment, 'threadKey' | 'issueId'>) => c.threadKey ?? `issue:${c.issueId}`

export interface PageCapture {
  url: string
  title?: string
  screenshotUrl?: string
}

/** 이 페이지의 검사 화면 캡처 주소 (여러 페이지 검사면 페이지별, 아니면 첫 페이지) */
export function screenshotFor(inspection: Inspection | undefined, page: string): string | undefined {
  if (!inspection) return undefined
  return inspection.captures?.[page]?.screenshotUrl ?? (inspection.pages[0] === page ? inspection.capture?.screenshotUrl : undefined)
}

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
  /** 여러 페이지 검사: url 과 같은 사이트의 추가 페이지 주소 (url 은 빼고) */
  extraUrls?: string[]
  /** 첫 페이지의 링크에서 페이지를 이만큼 자동으로 더 찾아 검사 */
  discover?: number
}

/** 여러 페이지 검사 진행 상황 (검사 중 화면에 "페이지 2/5" 로 보여줌) */
export interface InspectProgress {
  done: number
  total: number
  /** 지금 검사 중이거나 방금 끝난 페이지 경로 */
  page: string
}

/** 한 번에 검사할 수 있는 최대 페이지 수 (개발 서버가 페이지마다 크롬 탭을 열어서 너무 많으면 오래 걸려요) */
export const MAX_PAGES = 10

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
  /** live 검사: 실제로 연 주소(리다이렉트 반영), 페이지 제목, 검사 화면 캡처(1440×1093) 주소 — 첫 페이지 */
  capture?: PageCapture
  /** 여러 페이지 검사: 페이지 경로 → 그 페이지의 캡처 */
  captures?: Record<string, PageCapture>
  /** 여러 페이지 검사: 열지 못한 페이지와 이유 */
  failedPages?: { url: string; reason: string }[]
  /** live 검사: 통과한 검사 규칙 수 (이슈 0개일 때 "정말 검사했는지" 보여주는 근거) */
  passedRules?: number
  /** live 검사: 사람이 직접 확인해야 하는 항목 수 (axe incomplete) */
  needsReview?: number
  /** 결과를 믿기 어려울 때 안내 (예: 페이지 내용이 거의 안 그려짐) */
  warning?: string
}
