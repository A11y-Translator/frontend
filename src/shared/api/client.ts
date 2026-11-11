// 화면이 쓰는 API 입구. 모드 스위치 하나로 검사 방식을 바꿉니다. (.env.local 의 VITE_API_MODE)
//   live (개발 서버 기본) : 실제 URL 을 개발 서버 프록시로 열어 axe-core 로 검사 — dev/inspectProxy.ts
//   http                  : 백엔드 서버 (VITE_API_BASE_URL)
//   mock                  : 임시 규칙으로 만든 결과 (shared/mocks/inspect.ts) — 오프라인 시연용
import type { CreateProjectInput, Inspection, Project } from './types'
import { httpApi } from './http'
import { liveApi } from './live'
import { mockApi } from './mock'

export interface ApiClient {
  /** 새 프로젝트 만들기 */
  createProject(input: CreateProjectInput): Promise<Project>
  /** 프로젝트 주소를 검사 (previousVersion 이 있으면 그다음 버전으로) */
  runInspection(project: Project, previousVersion?: number): Promise<Inspection>
  /** 프로젝트 삭제 (검사 기록 포함) */
  deleteProject(projectId: string): Promise<void>
}

const requested = import.meta.env.VITE_API_MODE
export const API_MODE: 'live' | 'http' | 'mock' =
  requested === 'http' || requested === 'mock' || requested === 'live' ? requested : import.meta.env.DEV ? 'live' : 'mock'

export const api: ApiClient = API_MODE === 'http' ? httpApi : API_MODE === 'live' ? liveApi : mockApi
