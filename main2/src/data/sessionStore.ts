// 로그인 상태(세션)와 팀 스페이스 선택. 새로고침해도 남도록 브라우저(localStorage)에 저장합니다.
// 목업 모드에서는 아무 이메일 · 비밀번호로나 들어갈 수 있고, 서버가 붙으면 api.auth.* 가 진짜 인증을 합니다.
import { useSyncExternalStore } from 'react'
import { api } from '@/api'
import { setAuthToken, setUnauthorizedHandler } from '@/api/http'
import { readJSON, removeKey, writeJSON } from '@/api/storage'
import { pull } from '@/api/sync'
import { ME, WORKSPACES, type RoleId } from './mock'

/* ───────── 타입 ───────── */

export interface User {
  id: string
  name: string
  email: string
  role: RoleId
}
export interface Session {
  /** Authorization: Bearer <token> 으로 보내는 값 (쿠키 세션 서버라면 빈 글자여도 됨) */
  token: string
  user: User
}
export interface Workspace {
  id: string
  name: string
}

interface State {
  session: Session | null
  workspaces: Workspace[]
  workspaceId: string
}

/* ───────── 저장 ───────── */

const SESSION_KEY = 'oreum:session:v1'
const WORKSPACE_KEY = 'oreum:workspace:v1'

function loadSession(): Session | null {
  const s = readJSON(SESSION_KEY) as Partial<Session> | null
  const u = s?.user
  // 저장된 값이 이상하면 로그아웃 상태로
  if (!s || typeof s.token !== 'string' || !u || typeof u.name !== 'string' || !(u.role === 'design' || u.role === 'front' || u.role === 'back')) return null
  return { token: s.token, user: { id: String(u.id ?? ''), name: u.name, email: String(u.email ?? ''), role: u.role } }
}

function loadWorkspaceId() {
  const id = readJSON(WORKSPACE_KEY)
  return typeof id === 'string' ? id : WORKSPACES[0].id
}

let state: State = { session: loadSession(), workspaces: WORKSPACES, workspaceId: loadWorkspaceId() }
setAuthToken(state.session?.token ?? null)

const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

function set(next: Partial<State>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

function setSession(session: Session | null) {
  setAuthToken(session?.token ?? null)
  if (session) writeJSON(SESSION_KEY, session)
  else removeKey(SESSION_KEY)
  set({ session })
}

/* ───────── 읽기 ───────── */

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, () => state.session)
}

/** 화면 밖(이벤트 처리 · 저장소)에서 지금 값 읽기 */
export const getSession = () => state.session
export const subscribeSession = subscribe

/** 글을 남길 때 쓰는 "나". 로그인 전이면 예시 사용자 */
export function getAuthor(): { name: string; role: RoleId } {
  return state.session?.user ?? ME
}

/** 지금 팀 스페이스와 고를 수 있는 목록 */
export function useWorkspace(): { current: Workspace; list: Workspace[] } {
  const s = useSyncExternalStore(subscribe, () => state)
  return { current: s.workspaces.find((w) => w.id === s.workspaceId) ?? s.workspaces[0] ?? WORKSPACES[0], list: s.workspaces }
}

/* ───────── 바꾸기 ───────── */

/** 이메일 로그인. 실패하면 ApiError 를 던져요 (화면에서 문구로 보여 줌) */
export async function signIn(email: string, password: string) {
  setSession(await api.auth.login({ email, password }))
}

/** 구글 로그인. 목업에서는 예시 사용자로 바로 들어가요 */
export async function signInWithGoogle() {
  setSession(await api.auth.loginWithGoogle({}))
}

export function signOut() {
  if (!state.session) return
  // 서버에 알리는 건 실패해도 괜찮음 — 이 브라우저에서는 바로 로그아웃
  void api.auth.logout().catch(() => undefined)
  setSession(null)
}

/** 보여 줄 팀 스페이스 바꾸기 (이름만 바뀌어요 — 스페이스별 데이터는 서버가 붙은 뒤) */
export function selectWorkspace(id: string) {
  if (!state.workspaces.some((w) => w.id === id)) return
  writeJSON(WORKSPACE_KEY, id)
  set({ workspaceId: id })
}

// 토큰이 만료되면(401) 로그아웃 → 라우터가 로그인 화면으로 보냄
setUnauthorizedHandler(() => setSession(null))

/* ───────── 서버에서 불러오기 (http 모드) ───────── */

export function hydrateSession() {
  return Promise.all([
    pull('내 정보 불러오기', () => api.auth.me(), (user) => {
      if (state.session) setSession({ ...state.session, user })
    }),
    pull('팀 스페이스 불러오기', () => api.workspaces.list(), (workspaces) => {
      if (workspaces.length > 0) set({ workspaces })
    }),
  ])
}
