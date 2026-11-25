// 웹 ↔ 확장이 같이 보는 상태 (프로토타입용).
// 확장에서 "웹으로 전송"하면 웹의 할 일에 나타나고, 재검사하면 웹 리포트도 바뀌는 흐름을 보여주기 위한 것.
// 같은 브라우저 안에서 localStorage 로 공유합니다. 백엔드가 붙으면 이 파일의 액션을 API 호출로 바꾸면 됩니다.
import { useSyncExternalStore } from 'react'
import {
  issues as initialIssues,
  comments as initialComments,
  projects as initialProjects,
} from './mocks'
import {
  threadKeyOf,
  type Comment,
  type CreateProjectInput,
  type Inspection,
  type InspectProgress,
  type Issue,
  type IssueOverlay,
  type IssueStatus,
  type Project,
  type Team,
} from '@/shared/api/types'
import { api } from '@/shared/api/client'

const KEY = 'a11y-translator:prototype-state:v1'

export interface AppState {
  issues: Issue[]
  comments: Comment[]
  /** 확장 → 웹 전송 기록 */
  lastSent?: { projectName: string; version: number; at: string; withFixes: boolean }
  /** 확장 "페이지에서 미리 고쳐보기"로 적용 중인 색 (issueId → color) */
  previewFix: Record<string, string>
  currentVersion: number
  /** 프로젝트 목록 (최근 것이 앞) */
  projects: Project[]
  /** 새로 만든 프로젝트의 최신 검사 결과 (projectId → 검사). 기존 데모 프로젝트B 는 issues 를 그대로 씀 */
  inspections: Record<string, Inspection>
  /** 새 프로젝트의 검사 기록 (projectId → 버전 오름차순). 버전 드롭다운에서 지난 버전을 볼 때 씀 */
  inspectionHistory: Record<string, Inspection[]>
  /** 이슈 상세 · 코멘트 스레드 "해결" (스레드 키 → true, 예: 'marker:/main:1'). 이슈 자체의 해결과는 별개 — 그 위치의 논의가 끝났다는 표시 */
  resolvedThreads: Record<string, boolean>
}

const initial = (): AppState => ({
  issues: initialIssues,
  comments: initialComments,
  previewFix: {},
  currentVersion: 11,
  projects: initialProjects,
  inspections: {},
  inspectionHistory: {},
  resolvedThreads: {},
})

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = { ...initial(), ...JSON.parse(raw) } as AppState
      // 기록 기능 이전에 저장된 상태: 최신 검사만 있으면 그것을 기록으로
      for (const [id, insp] of Object.entries(saved.inspections)) {
        if (!saved.inspectionHistory[id])
          saved.inspectionHistory = { ...saved.inspectionHistory, [id]: [insp] }
      }
      // 위치별 스레드 이전에 저장된 코멘트: 기본 코멘트는 정해진 위치로, 직접 꽂은 핀은 그 핀만의 스레드로
      const seedKey = new Map(initialComments.map((c) => [c.id, c.threadKey]))
      saved.comments = saved.comments.map((c) =>
        c.threadKey
          ? c
          : { ...c, threadKey: seedKey.get(c.id) ?? (c.pin ? `pin:${c.id}` : undefined) },
      )
      return saved
    }
  } catch {
    /* 저장소를 못 쓰는 환경이면 초기값 사용 */
  }
  return initial()
}

let state: AppState = load()
const listeners = new Set<() => void>()

function set(next: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const patch = typeof next === 'function' ? next(state) : next
  state = { ...state, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

// 다른 탭(예: 웹 탭 ↔ 확장 데모 탭)에서 바뀐 내용도 반영
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load()
      listeners.forEach((l) => l())
    }
  })
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/**
 * 전체 상태를 구독합니다. 필터링·계산은 컴포넌트에서 하세요.
 * (예: const { issues } = useAppState(); const mine = issues.filter(...))
 */
export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, () => state)
}

/** 최신 검사 결과를 우선해 홈·할 일에도 실제 검사 이슈를 보여줍니다. */
export function workspaceIssues(s: AppState): Issue[] {
  return [
    ...new Map(
      [...s.issues, ...Object.values(s.inspections).flatMap((i) => i.issues)].map((i) => [i.id, i]),
    ).values(),
  ]
}

const updateIssue = (id: string, patch: Partial<Issue>) =>
  set((s) => {
    const inspections = { ...s.inspections }
    const inspectionHistory = { ...s.inspectionHistory }
    for (const [pid, inspection] of Object.entries(inspections)) {
      if (!inspection.issues.some((i) => i.id === id)) continue
      const next = {
        ...inspection,
        issues: inspection.issues.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      }
      inspections[pid] = next
      inspectionHistory[pid] = (inspectionHistory[pid] ?? [inspection]).map((h) =>
        h.version === next.version ? next : h,
      )
    }
    return {
      issues: s.issues.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      inspections,
      inspectionHistory,
    }
  })

export const actions = {
  /** 확장 03 · 미리 고쳐보기: 추천 색 선택 */
  previewFix(issueId: string, color: string) {
    set((s) => ({ previewFix: { ...s.previewFix, [issueId]: color } }))
  },
  /** 확장 03 · 수정안 저장 */
  saveFix(issueId: string, fix: string) {
    updateIssue(issueId, { savedFix: fix })
  },
  /** 확장 04 · 결과 저장 → 웹으로 전송 */
  sendToWeb(projectName: string, version: number, withFixes: boolean) {
    set({ lastSent: { projectName, version, at: '방금', withFixes }, currentVersion: version })
  },
  /** 확장 07 · 재검사: 수정안을 적용한 이슈는 자동 해결 */
  recheck() {
    set((s) => ({
      issues: s.issues.map((i) =>
        (i.savedFix || s.previewFix[i.id]) && i.status !== 'resolved'
          ? { ...i, status: 'resolved', autoResolved: true }
          : i,
      ),
      currentVersion: s.currentVersion + 1,
    }))
  },
  /** 웹 06 · 미배정 → 팀 분배 */
  assignTeam(issueId: string, team: Team, assigneeId?: string) {
    updateIssue(issueId, { team, assigneeId, status: 'todo' })
  },
  /** AI 추천대로 모두 분배 */
  assignAllByAi() {
    set((s) => ({
      issues: s.issues.map((i) =>
        i.status === 'unassigned' && i.aiTeam ? { ...i, team: i.aiTeam, status: 'todo' } : i,
      ),
    }))
  },
  /** 할 일 넘기기 / 담당자 변경 */
  changeAssignee(issueId: string, assigneeId: string | undefined, team?: Team) {
    updateIssue(issueId, { assigneeId, ...(team ? { team } : {}) })
  },
  addComment(c: Omit<Comment, 'id'>) {
    set((s) => ({
      comments: [...s.comments, { ...c, id: `c${Date.now()}` }],
      // 해결한 스레드에 새 코멘트를 남기면 논의가 다시 시작된 것이므로 스레드를 다시 열어요
      resolvedThreads: s.resolvedThreads[threadKeyOf(c)]
        ? { ...s.resolvedThreads, [threadKeyOf(c)]: false }
        : s.resolvedThreads,
    }))
  },
  /** 이슈 상세 · 코멘트 스레드 "해결" / "다시 열기" (스레드 키 — 예전 이슈 단위 키도 같이 넘길 수 있게 여러 개) */
  setThreadResolved(keys: string | string[], resolved: boolean) {
    set((s) => ({
      resolvedThreads: {
        ...s.resolvedThreads,
        ...Object.fromEntries([keys].flat().map((k) => [k, resolved])),
      },
    }))
  },
  /**
   * 새 프로젝트 화면: 프로젝트 만들기 → 바로 검사 → 결과 저장.
   * mock / 실제 서버 중 어느 쪽으로 갈지는 shared/api/client.ts 가 정합니다.
   * 실패하면 예외를 그대로 던지니 화면에서 메시지를 보여주세요.
   */
  async createProjectAndInspect(
    input: CreateProjectInput,
    onProgress?: (p: InspectProgress) => void,
  ): Promise<Project> {
    const created = await api.createProject(input)
    const inspection = await api.runInspection(created, 0, onProgress)
    const project: Project = {
      ...created,
      createdAt: created.createdAt ?? new Date().toISOString(),
      currentVersion: inspection.version,
      status: 'active',
      discover: undefined,
      // 여러 페이지 검사: 실제로 검사한 페이지를 고정 → 재검사 때 같은 페이지끼리 비교 (자동 찾기는 첫 검사 한 번만)
      ...(inspection.captures && Object.keys(inspection.captures).length > 1
        ? { pageUrls: Object.values(inspection.captures).map((c) => c.url), discover: undefined }
        : {}),
    }
    set((s) => ({
      projects: [project, ...s.projects.filter((p) => p.id !== project.id)],
      inspections: { ...s.inspections, [project.id]: inspection },
      inspectionHistory: { ...s.inspectionHistory, [project.id]: [inspection] },
    }))
    return project
  },
  /** 새로 만든 프로젝트 재검사 → 다음 버전 */
  async reinspect(
    projectId: string,
    onProgress?: (p: InspectProgress) => void,
    input?: Pick<CreateProjectInput, 'url' | 'extraUrls' | 'discover'>,
  ): Promise<Inspection | undefined> {
    const project = state.projects.find((p) => p.id === projectId)
    if (!project) return undefined
    const prev = state.inspections[projectId]
    const target = input
      ? {
          ...project,
          url: input.url,
          pageUrls: [input.url, ...(input.extraUrls ?? [])],
          discover: input.discover,
        }
      : project
    const fresh = await api.runInspection(
      target,
      prev?.version ?? project.currentVersion,
      onProgress,
    )
    // 지난 버전에서 직접 "해결됨" 처리한 이슈가 다시 발견되면 해결 상태를 이어받습니다
    const inspection: Inspection = {
      ...fresh,
      issues: fresh.issues.map((i) => {
        const before = prev?.issues.find((p) => p.id === i.id)
        return before?.status === 'resolved'
          ? { ...i, status: 'resolved', reopenStatus: before.reopenStatus }
          : i
      }),
    }
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? {
              ...target,
              currentVersion: inspection.version,
              status: 'active',
              discover: undefined,
              ...(inspection.captures
                ? {
                    pageUrls: Object.values(inspection.captures).map((c) => c.url),
                    discover: undefined,
                  }
                : {}),
            }
          : p,
      ),
      inspections: { ...s.inspections, [projectId]: inspection },
      inspectionHistory: {
        ...s.inspectionHistory,
        [projectId]: [...(s.inspectionHistory[projectId] ?? []), inspection],
      },
    }))
    return inspection
  },
  /** 홈 · 프로젝트 카드 ⋮ 메뉴 → 삭제. 서버(또는 mock)에서 지운 뒤 목록·검사 기록에서도 지웁니다 */
  async deleteProject(projectId: string) {
    await api.deleteProject(projectId)
    set((s) => {
      const inspections = { ...s.inspections }
      const inspectionHistory = { ...s.inspectionHistory }
      delete inspections[projectId]
      delete inspectionHistory[projectId]
      return {
        projects: s.projects.filter((p) => p.id !== projectId),
        inspections,
        inspectionHistory,
      }
    })
  },
  /**
   * 이슈 상세 · "해결됨으로 표시" / "되돌리기".
   * 해결 전 상태를 reopenStatus 에 기억했다가 되돌리면 그 상태로 돌아갑니다.
   * 데모 데이터(issues)와 새 프로젝트 검사 결과(최신 버전) 모두에서 찾아 바꿉니다.
   */
  setResolved(issueId: string, resolved: boolean) {
    const patch = (i: Issue): Issue => {
      if (i.id !== issueId) return i
      if (resolved) {
        if (i.status === 'resolved') return i
        return { ...i, status: 'resolved', reopenStatus: i.status }
      }
      if (i.status !== 'resolved') return i
      const back: IssueStatus = i.reopenStatus ?? (i.assigneeId ? 'todo' : 'unassigned')
      return { ...i, status: back, reopenStatus: undefined, autoResolved: false }
    }
    set((s) => {
      const inspections = { ...s.inspections }
      const inspectionHistory = { ...s.inspectionHistory }
      for (const [pid, insp] of Object.entries(s.inspections)) {
        if (!insp.issues.some((i) => i.id === issueId)) continue
        const next = { ...insp, issues: insp.issues.map(patch) }
        inspections[pid] = next
        inspectionHistory[pid] = (s.inspectionHistory[pid] ?? [insp]).map((h) =>
          h.version === next.version ? next : h,
        )
      }
      return { issues: s.issues.map(patch), inspections, inspectionHistory }
    })
  },
  /** 데모 초기화 */
  reset() {
    set(initial())
  },
}

/** 이슈 id 로 그 이슈가 속한 검사(새 프로젝트)를 찾습니다. 없으면 기존 데모 데이터(issues) 쪽 이슈 */
export function findIssueContext(
  s: AppState,
  issueId: string | undefined,
): {
  issue?: Issue
  issues: Issue[]
  overlays?: IssueOverlay[]
  project?: Project
  inspection?: Inspection
} {
  for (const inspection of Object.values(s.inspections)) {
    const issue = inspection.issues.find((i) => i.id === issueId)
    if (issue) {
      return {
        issue,
        issues: inspection.issues,
        overlays: inspection.overlays,
        inspection,
        project: s.projects.find((p) => p.id === inspection.projectId),
      }
    }
  }
  return { issue: s.issues.find((i) => i.id === issueId), issues: s.issues }
}
