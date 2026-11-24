// 아주 작은 fetch 도우미 — 주소 앞에 VITE_API_URL 을 붙이고, JSON · 로그인 토큰 · 시간 제한 · 오류를 한곳에서 처리합니다.
//   http.get<Plan>('/plan')   http.post<Session>('/auth/login', { email, password })
import { API_URL } from './config'

/** 서버가 알려 준 오류. status 0 = 서버에 닿지 못함(네트워크 · 시간 초과) */
export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/** 오류를 사람에게 보여 줄 글자로 */
export function errorMessage(e: unknown) {
  return e instanceof Error && e.message ? e.message : '알 수 없는 오류가 났어요'
}

/* ───────── 로그인 토큰 (sessionStore 가 넣어 줌) ───────── */

let token: string | null = null
let onUnauthorized: (() => void) | null = null

export function setAuthToken(next: string | null) {
  token = next
}

/** 토큰이 만료돼 401 이 오면 부를 함수 (로그아웃 → 로그인 화면) */
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn
}

/* ───────── 요청 ───────── */

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestOptions {
  /** 기다릴 시간(ms). 기본 15초 — AI 루트 생성처럼 오래 걸리는 것은 길게 */
  timeout?: number
}

const DEFAULT_TIMEOUT = 15_000

/** 오류 응답에서 문구 꺼내기: { message } 또는 { error } */
async function readError(res: Response): Promise<{ message: string; code?: string }> {
  const fallback = `서버 오류 (${res.status})`
  try {
    const body = (await res.json()) as { message?: unknown; error?: unknown; code?: unknown }
    const message = typeof body.message === 'string' ? body.message : typeof body.error === 'string' ? body.error : fallback
    return { message, code: typeof body.code === 'string' ? body.code : undefined }
  } catch {
    return { message: fallback }
  }
}

export async function request<T>(method: Method, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeout ?? DEFAULT_TIMEOUT)
  // 파일(FormData)은 브라우저가 Content-Type 을 정하게 그대로 보냄
  const form = body instanceof FormData
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined && !form) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      // 쿠키 세션을 쓰는 서버도 되도록 (서버 CORS 에서 credentials 허용 필요)
      credentials: 'include',
      body: body === undefined ? undefined : form ? body : JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      if (res.status === 401 && token) onUnauthorized?.()
      const { message, code } = await readError(res)
      throw new ApiError(message, res.status, code)
    }
    // 204 나 빈 응답은 값 없음
    const text = res.status === 204 ? '' : await res.text()
    return (text ? JSON.parse(text) : undefined) as T
  } catch (e) {
    if (e instanceof ApiError) throw e
    if (e instanceof DOMException && e.name === 'AbortError') throw new ApiError('서버 응답이 너무 늦어요. 잠시 후 다시 해 주세요', 0, 'timeout')
    if (e instanceof SyntaxError) throw new ApiError('서버 응답을 읽지 못했어요', 0, 'parse')
    throw new ApiError('서버에 연결하지 못했어요', 0, 'network')
  } finally {
    clearTimeout(timer)
  }
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
}
