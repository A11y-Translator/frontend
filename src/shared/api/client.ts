// 화면이 쓰는 API 입구. 모드 스위치 하나로 검사 방식을 바꿉니다. (.env.local 의 VITE_API_MODE)
//   live (개발 서버 기본) : 실제 URL 을 개발 서버 프록시로 열어 axe-core 로 검사 — dev/inspectProxy.ts
//   http                  : 백엔드 서버 (VITE_API_BASE_URL)
//   mock                  : 임시 규칙으로 만든 결과 (shared/mocks/inspect.ts) — 오프라인 시연용
import type { CreateProjectInput, Inspection, Project, TeamSpace } from './types'
import { httpApi } from './http'
import { liveApi } from './live'
import { mockApi } from './mock'

export interface ApiClient {
  /** 새 프로젝트 만들기 (teamId: 지금 보고 있는 팀 스페이스) */
  createProject(input: CreateProjectInput, teamId: string): Promise<Project>
  /** 프로젝트 주소를 검사 (previousVersion 이 있으면 그다음 버전으로) */
  runInspection(project: Project, previousVersion?: number): Promise<Inspection>
  /** 프로젝트 삭제 (검사 기록 포함) */
  deleteProject(projectId: string): Promise<void>
  /** 서버에 저장하는 모드(http)에만 있어요. 없는 모드는 브라우저에 저장된 팀·프로젝트·검사 기록을 그대로 씁니다 */
  server?: ServerReads
}

export interface ServerReads {
  /** 내가 속한 팀 스페이스 (하나도 없으면 하나 만들어서 돌려줌) */
  listTeams(): Promise<TeamSpace[]>
  /** 팀의 프로젝트 목록 (최근에 바뀐 것이 앞) */
  listProjects(teamId: string): Promise<Project[]>
  /** 프로젝트 하나와 가장 최근 검사 결과(끝난 검사가 없으면 inspection 없음). 서버 프로젝트 주소가 아니면(데모) undefined */
  openProject(projectId: string): Promise<{ project: Project; inspection?: Inspection } | undefined>
}

const requested = import.meta.env.VITE_API_MODE
export const API_MODE: 'live' | 'http' | 'mock' =
  requested === 'http' || requested === 'mock' || requested === 'live' ? requested : import.meta.env.DEV ? 'live' : 'mock'

export const api: ApiClient = API_MODE === 'http' ? httpApi : API_MODE === 'live' ? liveApi : mockApi
