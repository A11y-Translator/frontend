// 서버와 주고받는 모든 것이 지나가는 한 곳.  화면 · 저장소는 `api.영역.함수()` 만 부릅니다.
//
//   .env 의 VITE_API_URL 이 비어 있으면  → mock : 브라우저 localStorage 와 예시 데이터로 동작 (서버 없음)
//   VITE_API_URL=http://…/api 를 적으면 → http : 아래 주석의 주소로 요청
//
// 백엔드 연결 = .env 에 주소를 적고, 아래 `httpApi` 의 주소대로 서버를 만들면 끝. 화면 코드는 고칠 필요가 없어요.
// (주소 · 요청/응답 모양 표는 main2/README.md, 타입은 ./types.ts)
import { MOCK_USER, WORKSPACES } from '@/data/mock'
import { deriveNotifications, NOTIFICATION_READ_KEY, readLocalReadIds } from '@/data/notificationStore'
import { DEFAULT_PLAN, PLAN_KEY, readLocalPlan } from '@/data/planStore'
import { readLocalRequests, REQUESTS_KEY, seedRequests } from '@/data/requestStore'
import { readLocalMessages, ROOM_MESSAGES_KEY } from '@/data/roomStore'
import { getAuthor } from '@/data/sessionStore'
import { isMock } from './config'
import { http } from './http'
import { writeJSON } from './storage'
import type {
  GoogleLoginInput,
  HandoffCard,
  LoginInput,
  MarkReadInput,
  Notification,
  Plan,
  PlanFile,
  RequestUpdate,
  RoomId,
  RoomMessage,
  RouteRecommendation,
  RouteRecommendInput,
  Session,
  User,
  Workspace,
} from './types'

export interface Api {
  auth: {
    login(input: LoginInput): Promise<Session>
    loginWithGoogle(input: GoogleLoginInput): Promise<Session>
    logout(): Promise<void>
    me(): Promise<User>
  }
  workspaces: {
    list(): Promise<Workspace[]>
  }
  plan: {
    get(): Promise<Plan>
    save(plan: Plan): Promise<Plan>
  }
  route: {
    /** AI 추천 루트 만들기 */
    recommend(input: RouteRecommendInput): Promise<RouteRecommendation>
  }
  files: {
    /** 기획안 파일 올리기 */
    uploadPlan(file: File): Promise<PlanFile>
  }
  requests: {
    list(): Promise<HandoffCard[]>
    /** 새 카드. id 는 프론트가 만들어 보냄 (보낸 직후 /requests/:id 로 이동하기 때문) */
    create(card: HandoffCard): Promise<HandoffCard>
    /** 수락 · 날짜 제안 · 전달 · 확인 · 수정 요청 · 막힘 · 코멘트 */
    update(id: string, update: RequestUpdate): Promise<HandoffCard>
    /** (데모용) 예시 데이터로 되돌리기 */
    reset(): Promise<HandoffCard[]>
  }
  rooms: {
    list(room: RoomId): Promise<RoomMessage[]>
    send(room: RoomId, message: RoomMessage): Promise<RoomMessage>
  }
  notifications: {
    list(): Promise<Notification[]>
    markRead(ids: string[]): Promise<void>
  }
}

/* ───────── mock: 서버 없이 localStorage 로 ───────── */

const ok = <T>(value: T) => Promise.resolve(value)
const mockSession = (user: User): Session => ({ token: `mock-${user.id}`, user })

const mockApi: Api = {
  auth: {
    // 아무 이메일 · 비밀번호나 통과 — 예시 사용자로 들어가고 이메일만 적은 값으로
    login: ({ email }) => ok(mockSession({ ...MOCK_USER, email: email.trim() || MOCK_USER.email })),
    loginWithGoogle: () => ok(mockSession(MOCK_USER)),
    logout: () => ok(undefined),
    me: () => ok({ ...MOCK_USER, ...getAuthor() }),
  },
  workspaces: {
    list: () => ok(WORKSPACES),
  },
  plan: {
    get: () => ok(readLocalPlan()),
    save: (plan) => {
      writeJSON(PLAN_KEY, plan)
      return ok(plan)
    },
  },
  route: {
    // AI 가 없으니 기본 체크포인트(로그인 · 메인 피드 · 마이페이지 · 알림)를 바로 돌려줌
    recommend: () => ok({ checkpoints: DEFAULT_PLAN.checkpoints }),
  },
  files: {
    // 파일은 어디에도 올라가지 않고 이름 · 크기만 돌려줌
    uploadPlan: (file) => ok({ id: `local-${Date.now().toString(36)}`, name: file.name, size: file.size, type: file.type, pages: null }),
  },
  requests: {
    list: () => ok(readLocalRequests()),
    create: (card) => {
      writeJSON(REQUESTS_KEY, [...readLocalRequests().filter((c) => c.id !== card.id), card])
      return ok(card)
    },
    update: (id, { card }) => {
      writeJSON(REQUESTS_KEY, readLocalRequests().map((c) => (c.id === id ? card : c)))
      return ok(card)
    },
    reset: () => {
      const cards = seedRequests()
      writeJSON(REQUESTS_KEY, cards)
      return ok(cards)
    },
  },
  rooms: {
    list: (room) => ok(readLocalMessages().filter((m) => m.room === room)),
    send: (_room, message) => {
      writeJSON(ROOM_MESSAGES_KEY, [...readLocalMessages(), message])
      return ok(message)
    },
  },
  notifications: {
    list: () => ok(deriveNotifications(readLocalRequests(), getAuthor().name, new Set(readLocalReadIds()))),
    markRead: (ids) => {
      writeJSON(NOTIFICATION_READ_KEY, [...new Set([...readLocalReadIds(), ...ids])])
      return ok(undefined)
    },
  },
}

/* ───────── http: 진짜 서버로 (주소는 VITE_API_URL 뒤에 붙음) ───────── */

const room = (id: RoomId) => `/rooms/${encodeURIComponent(id)}/messages`

const httpApi: Api = {
  auth: {
    login: (input) => http.post<Session>('/auth/login', input), // POST /auth/login
    loginWithGoogle: (input) => http.post<Session>('/auth/google', input), // POST /auth/google
    logout: () => http.post<void>('/auth/logout'), // POST /auth/logout
    me: () => http.get<User>('/auth/me'), // GET /auth/me
  },
  workspaces: {
    list: () => http.get<Workspace[]>('/workspaces'), // GET /workspaces
  },
  plan: {
    get: () => http.get<Plan>('/plan'), // GET /plan
    save: (plan) => http.put<Plan>('/plan', plan), // PUT /plan
  },
  route: {
    // POST /route/recommend — AI 가 만드는 동안 기다릴 수 있게 시간 제한을 넉넉히 (60초)
    recommend: (input) => http.post<RouteRecommendation>('/route/recommend', input, { timeout: 60_000 }),
  },
  files: {
    // POST /files/plan — multipart/form-data, 칸 이름 "file"
    uploadPlan: (file) => {
      const form = new FormData()
      form.append('file', file)
      return http.post<PlanFile>('/files/plan', form, { timeout: 60_000 })
    },
  },
  requests: {
    list: () => http.get<HandoffCard[]>('/requests'), // GET /requests
    create: (card) => http.post<HandoffCard>('/requests', card), // POST /requests
    update: (id, update) => http.patch<HandoffCard>(`/requests/${encodeURIComponent(id)}`, update), // PATCH /requests/:id
    reset: () => http.post<HandoffCard[]>('/requests/reset'), // POST /requests/reset (데모용 · 없어도 됨)
  },
  rooms: {
    list: (id) => http.get<RoomMessage[]>(room(id)), // GET /rooms/:room/messages
    send: (id, message) => http.post<RoomMessage>(room(id), message), // POST /rooms/:room/messages
  },
  notifications: {
    list: () => http.get<Notification[]>('/notifications'), // GET /notifications
    markRead: (ids) => http.post<void>('/notifications/read', { ids } satisfies MarkReadInput), // POST /notifications/read
  },
}

/** 앱이 시작할 때 한 번 정해지는 구현 (mock / http) */
export const api: Api = isMock ? mockApi : httpApi

export { API_MODE, API_URL, isMock } from './config'
export { ApiError, errorMessage } from './http'
export type * from './types'
