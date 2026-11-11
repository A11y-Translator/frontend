// 실제 서버 구현. 아래 엔드포인트·응답 형태는 백엔드와 합의 전 "가정"입니다.
// 백엔드 명세가 나오면 이 파일(경로·필드 매핑)만 고치면 화면은 그대로 동작합니다.
//
//   POST {BASE}/projects                    body: { name, url }  → Project
//   POST {BASE}/projects/{id}/inspections   body: { url }        → Inspection
//   DELETE {BASE}/projects/{id}                                  → 204
//   실패 시 { message: string } 와 4xx/5xx 상태 코드
import type { ApiClient } from './client'
import type { Inspection, Project } from './types'

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, '서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(res.status, data.message ?? '요청을 처리하지 못했어요.')
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

const post = <T>(path: string, body: unknown) => request<T>('POST', path, body)

export const httpApi: ApiClient = {
  createProject: (input) => post<Project>('/projects', input),
  deleteProject: (projectId) => request<void>('DELETE', `/projects/${encodeURIComponent(projectId)}`),
  runInspection: (project) => post<Inspection>(`/projects/${encodeURIComponent(project.id)}/inspections`, { url: project.url }),
}
