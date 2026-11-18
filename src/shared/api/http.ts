// 실제 서버(A11y Translator backend · Django + DRF) 구현.
// 화면이 아는 모양(Project · Inspection)과 서버 모양(팀 → 프로젝트 → 버전·페이지 → 검사 → 이슈)을 이 파일에서 맞춥니다.
//
//   로그인    POST {BASE}/auth/login/  (없는 계정이면 /auth/register/)  → token   ← .env.local 의 개발 계정
//   팀        GET  {BASE}/teams/       (없으면 POST 로 하나 만듦)
//   프로젝트  GET · POST {BASE}/teams/{team_id}/projects/   body: { name, base_url }
//             GET · DELETE {BASE}/projects/{id}/   → 페이지 · 버전 · 최신 버전의 검사 / 삭제(204)
//   검사      POST {BASE}/projects/{id}/versions/ → POST {BASE}/projects/{id}/pages/ → POST {BASE}/scans/
//             → GET {BASE}/scans/{scan_id}/ 를 status 가 done / failed 가 될 때까지 (서버의 검사 worker 가 처리)
//   결과      GET  {BASE}/scans/{scan_id}/issues/ · /issues/{issue_id}/ · /screenshot/
//   실패 시 { detail: string } 또는 { 필드: [메시지] } 와 4xx/5xx 상태 코드
import type { ApiClient, ServerReads } from './client'
import type { Category, Inspection, Issue, IssueOverlay, Project, Severity } from './types'
import { CAPTURE_H, CAPTURE_W } from '@/shared/mocks/scan'

export const BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')
const TOKEN_KEY = 'a11y-translator:token'
const POLL_MS = 1500
const SCAN_TIMEOUT_MS = 60_000

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/* ── 서버 응답 모양 (쓰는 필드만) ─────────────────────────────────── */

interface ServerProject {
  project_id: number
  team_id: number
  name: string
  base_url: string
  updated_at: string
}
interface ServerPage {
  page_id: number
}
interface ServerVersion {
  version_id: number
  version_no: number
}
/** GET /projects/{id}/ — 버전은 최신이 앞, latest_scans 는 최신 버전의 검사 */
interface ServerProjectDetail extends ServerProject {
  pages: ServerPage[]
  versions: ServerVersion[]
  latest_scans: ServerScan[]
}
interface ServerScan {
  scan_id: number
  target_url: string
  status: 'queued' | 'running' | 'done' | 'failed'
  wcag_standard: string
  viewport_width: number
  error_message: string | null
  scanned_at: string
}
interface ServerIssue {
  issue_id: number
  issue_no: number
  rule_id: string
  category: string
  wcag_criterion: string | null
  severity: Severity
  title: string
  description: string | null
  element_count: number
}
interface ServerIssueDetail extends ServerIssue {
  elements: {
    css_selector: string
    html_snippet: string | null
    bbox_x: number | null
    bbox_y: number | null
    bbox_width: number | null
    bbox_height: number | null
  }[]
  suggestions: { content: string }[]
}

/* ── 요청 ─────────────────────────────────────────────────────────── */

/** DRF 오류 응답({ detail } 또는 { 필드: [메시지] })에서 화면에 보여줄 한 줄 */
function messageOf(data: unknown): string {
  const fallback = '요청을 처리하지 못했어요.'
  if (!data || typeof data !== 'object') return fallback
  const { detail } = data as { detail?: unknown }
  if (typeof detail === 'string') return detail
  const first = Object.values(data).flat()[0]
  return typeof first === 'string' ? first : fallback
}

async function send(method: string, path: string, body?: unknown, token?: string): Promise<Response> {
  try {
    return await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, '서버에 연결하지 못했어요. 백엔드 서버가 켜져 있는지 확인해 주세요.')
  }
}

// 개발 계정은 개발 서버(npm run dev)에서만 읽습니다. VITE_ 값은 빌드할 때 코드에 그대로 박히므로,
// 빌드에서는 이 식이 통째로 undefined 가 되어 비밀번호가 배포 파일에 들어가지 않아요.
const DEV_ACCOUNT = import.meta.env.DEV
  ? { email: import.meta.env.VITE_DEV_EMAIL, password: import.meta.env.VITE_DEV_PASSWORD, name: import.meta.env.VITE_DEV_NAME }
  : undefined

let signingIn: Promise<string> | null = null

/** 개발 계정으로 로그인해서 토큰을 받습니다. 처음이면 가입부터 (Google 로그인이 붙기 전까지의 임시 방법) */
async function signIn(): Promise<string> {
  if (!DEV_ACCOUNT) throw new ApiError(401, '로그인이 필요해요. (로그인 화면은 아직 서버와 연결되지 않았어요)')
  const { email, password, name } = DEV_ACCOUNT
  if (!email || !password) {
    throw new ApiError(401, '.env.local 에 VITE_DEV_EMAIL 과 VITE_DEV_PASSWORD 를 넣고 개발 서버를 다시 켜 주세요.')
  }
  let res = await send('POST', '/auth/login/', { email, password })
  if (res.status === 400) {
    res = await send('POST', '/auth/register/', { email, password, name: name || email.split('@')[0] })
  }
  if (!res.ok) throw new ApiError(res.status, messageOf(await res.json().catch(() => null)))
  const { token } = (await res.json()) as { token: string }
  localStorage.setItem(TOKEN_KEY, token)
  return token
}

function getToken(): Promise<string> {
  const saved = localStorage.getItem(TOKEN_KEY)
  if (saved) return Promise.resolve(saved)
  signingIn ??= signIn().finally(() => {
    signingIn = null
  })
  return signingIn
}

/** 토큰을 붙여 보냅니다. 토큰이 더는 안 통하면(401, 예: 서버 DB 초기화) 한 번만 다시 로그인해요 */
async function authed(method: string, path: string, body?: unknown): Promise<Response> {
  const res = await send(method, path, body, await getToken())
  if (res.status !== 401) return res
  localStorage.removeItem(TOKEN_KEY)
  return send(method, path, body, await getToken())
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await authed(method, path, body)
  if (!res.ok) throw new ApiError(res.status, messageOf(await res.json().catch(() => null)))
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

const get = <T>(path: string) => request<T>('GET', path)
const post = <T>(path: string, body?: unknown) => request<T>('POST', path, body)

/** <img> 는 Authorization 헤더를 보낼 수 없어서, 서버 이미지는 이 함수로 받아 씁니다 (useImageSrc) */
export async function fetchImage(url: string): Promise<Blob> {
  const res = await authed('GET', url.slice(BASE.length))
  if (!res.ok) throw new ApiError(res.status, '이미지를 불러오지 못했어요.')
  return res.blob()
}

/* ── 서버 모양 → 화면 모양 ────────────────────────────────────────── */

const CATEGORY: Record<string, Category> = {
  color_contrast: '색 대비',
  alt_text: '대체 텍스트',
  keyboard: '키보드',
  form_label: '폼 레이블',
  other: '문서 구조',
}

/** 2026-11-18T… → 26.11.18 (프로젝트 카드 날짜) */
const shortDate = (iso: string) => iso.slice(2, 10).replace(/-/g, '.')

/** wcag_2_1_aa → WCAG 2.1 AA */
const standardLabel = (code: string) => code.replace(/^wcag_(\d)_(\d)_(a+)$/, (_, major, minor, level) => `WCAG ${major}.${minor} ${level.toUpperCase()}`)

function pathOf(url: string) {
  return new URL(url).pathname.replace(/\/$/, '') || '/'
}

function toProject(p: ServerProject, currentVersion = 0): Project {
  return {
    id: String(p.project_id),
    teamId: String(p.team_id),
    name: p.name,
    url: p.base_url,
    status: 'active',
    updatedAt: shortDate(p.updated_at),
    currentVersion,
  }
}

function toInspection(project: Project, version: number, scan: ServerScan, details: ServerIssueDetail[]): Inspection {
  const page = pathOf(scan.target_url)
  const standard = standardLabel(scan.wcag_standard)
  const scale = CAPTURE_W / scan.viewport_width // 검사 화면 폭 → 캡처(734px) 좌표
  const overlays: IssueOverlay[] = []
  let label = 0

  const issues: Issue[] = details.map((d) => {
    // 같은 규칙은 버전이 바뀌어도 같은 id (재검사 때 "해결됨" 상태를 이어받는 기준 — store.reinspect)
    const id = `${project.id}-${d.rule_id}`
    const category = CATEGORY[d.category] ?? '문서 구조'
    for (const e of d.elements) {
      // 캡처에 보이는 첫 화면 안에 있는 요소만 박스로 표시 (화면 밖 요소는 서버가 좌표를 null 로 줌)
      if (e.bbox_x === null || e.bbox_y === null || e.bbox_y * scale > CAPTURE_H) continue
      label += 1
      overlays.push({
        label,
        issueId: id,
        selector: e.css_selector,
        page,
        x: Math.round(e.bbox_x * scale),
        y: Math.round(e.bbox_y * scale),
        w: Math.max(6, Math.round((e.bbox_width ?? 0) * scale)),
        h: Math.max(6, Math.round((e.bbox_height ?? 0) * scale)),
      })
    }
    return {
      id,
      no: d.issue_no,
      title: d.title,
      impact: d.description ?? '',
      category,
      severity: d.severity,
      priority: d.severity === 'critical' ? 'high' : 'normal',
      wcag: d.wcag_criterion ? `WCAG ${d.wcag_criterion}` : standard,
      elements: d.element_count,
      selectors: d.elements.slice(0, 10).map((e) => e.css_selector),
      page,
      comments: 0,
      // 서버의 할 일(task)·담당자는 아직 화면과 연결 전이라, 화면에서는 미배정으로 시작합니다
      status: 'unassigned',
      aiTeam: category === '색 대비' ? 'design' : 'frontend',
      version,
      detail: d.suggestions[0]?.content,
      fixCode: d.elements[0]?.html_snippet ?? undefined,
    }
  })

  return {
    id: `scan-${scan.scan_id}`,
    projectId: project.id,
    url: project.url,
    version,
    scannedAt: scan.scanned_at,
    standard,
    pages: [page],
    // passRate 없음: 서버는 통과한 규칙 수를 저장하지 않아요
    issues,
    overlays,
    source: 'server',
    capture: { url: scan.target_url, screenshotUrl: `${BASE}/scans/${scan.scan_id}/screenshot/` },
  }
}

/* ── 검사 ─────────────────────────────────────────────────────────── */

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 검사는 서버의 worker 가 따로 처리하므로 끝날 때까지 상태를 물어봅니다 */
async function waitForScan(scanId: number): Promise<ServerScan> {
  const deadline = Date.now() + SCAN_TIMEOUT_MS
  for (;;) {
    const scan = await get<ServerScan>(`/scans/${scanId}/`)
    if (scan.status === 'done') return scan
    if (scan.status === 'failed') throw new ApiError(422, scan.error_message ?? '검사하지 못했어요.')
    if (Date.now() > deadline) {
      throw new ApiError(
        504,
        scan.status === 'queued'
          ? '검사가 시작되지 않았어요. 서버에서 검사 worker(python manage.py run_scan_worker)가 실행 중인지 확인해 주세요.'
          : '검사가 60초 안에 끝나지 않았어요. 잠시 후 다시 시도해 주세요.',
      )
    }
    await wait(POLL_MS)
  }
}

async function issueDetails(scanId: number): Promise<ServerIssueDetail[]> {
  const list = await get<ServerIssue[]>(`/scans/${scanId}/issues/`)
  return Promise.all(list.map((i) => get<ServerIssueDetail>(`/scans/${scanId}/issues/${i.issue_id}/`)))
}

const projectPath = (projectId: string) => `/projects/${encodeURIComponent(projectId)}`

const server: ServerReads = {
  async listTeams() {
    type ServerTeam = { team_id: number; name: string }
    const teams = await get<ServerTeam[]>('/teams/')
    // 팀이 있어야 프로젝트를 만들 수 있어서, 하나도 없으면 하나 만듭니다 (팀 만들기 화면이 붙기 전까지)
    const list = teams.length ? teams : [await post<ServerTeam>('/teams/', { name: '내 팀' })]
    return list.map((t) => ({ id: String(t.team_id), name: t.name }))
  },
  async listProjects(teamId) {
    const list = await get<ServerProject[]>(`/teams/${encodeURIComponent(teamId)}/projects/`)
    // 목록 응답에는 버전 번호가 없어서 프로젝트마다 상세를 한 번씩 더 부릅니다
    const details = await Promise.all(list.map((p) => get<ServerProjectDetail>(`/projects/${p.project_id}/`)))
    return details.map((d) => toProject(d, d.versions[0]?.version_no ?? 0))
  },
  async openProject(projectId) {
    if (!/^\d+$/.test(projectId)) return undefined // 서버 프로젝트 id 는 숫자 (데모 프로젝트 주소는 서버에 묻지 않음)
    let detail: ServerProjectDetail
    try {
      detail = await get<ServerProjectDetail>(`${projectPath(projectId)}/`)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) throw new ApiError(404, '프로젝트를 찾을 수 없어요. 지워졌거나 볼 수 있는 권한이 없을 수 있어요.')
      throw e
    }
    const version = detail.versions[0]?.version_no ?? 0
    const project = toProject(detail, version)
    const scan = detail.latest_scans.filter((s) => s.status === 'done').pop()
    return { project, inspection: scan && toInspection(project, version, scan, await issueDetails(scan.scan_id)) }
  },
}

export const httpApi: ApiClient = {
  server,
  async createProject(input, teamId) {
    // 팀 목록을 받기 전에 눌렀으면 첫 번째 팀에 만듭니다
    const team = teamId || (await server.listTeams())[0].id
    return toProject(await post<ServerProject>(`/teams/${encodeURIComponent(team)}/projects/`, { name: input.name, base_url: input.url }))
  },
  // 팀 관리자나 프로젝트를 만든 사람만 지울 수 있어요 (아니면 서버가 403 과 안내 문구를 줌)
  deleteProject: (projectId) => request<void>('DELETE', `${projectPath(projectId)}/`),
  // 버전 번호는 서버가 정합니다 (version_no = 지금까지 + 1)
  async runInspection(project) {
    const root = projectPath(project.id)
    const { pages } = await get<ServerProjectDetail>(`${root}/`)
    // 지금은 프로젝트 = 주소 하나라 페이지도 하나 (같은 주소를 두 번 등록하면 서버가 409)
    const page = pages[0] ?? (await post<ServerPage>(`${root}/pages/`, { url: project.url }))
    const version = await post<ServerVersion>(`${root}/versions/`)
    const queued = await post<ServerScan>('/scans/', { target_url: project.url, version_id: version.version_id, page_id: page.page_id })
    const scan = await waitForScan(queued.scan_id)
    return toInspection(project, version.version_no, scan, await issueDetails(scan.scan_id))
  },
}
