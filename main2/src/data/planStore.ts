// "시작하기"에서 정한 내용(마감일 · 역할 · 체크포인트)을 화면끼리 함께 쓰는 저장소.
// 화면은 usePlan() 으로 바로(동기) 읽고, 저장은 api.plan 을 거칩니다 (@/api):
//   목업 모드 = 브라우저 localStorage · http 모드 = GET/PUT /plan
import { useSyncExternalStore } from 'react'
import { api } from '@/api'
import { isMock } from '@/api/config'
import { readJSON } from '@/api/storage'
import { pull, push } from '@/api/sync'
import type { PlanSource } from '@/api/types'
import { CHECKPOINTS, PROJECT, ROLE, type RoleId } from './mock'

export interface PlanRole {
  id: string
  label: string
  people: number
  /** 기본 역할(디자인/프론트/백)이면 그 색을 씀. 직접 추가한 역할은 없음 */
  role?: RoleId
}
export interface PlanCheckpoint {
  id: string
  name: string
}
export interface Plan {
  unit: 'day' | 'hour'
  /** YYYY-MM-DD */
  date: string
  /** HH:MM */
  time: string
  roles: PlanRole[]
  /** 산 위 체크포인트 (베이스 캠프와 정상은 빼고) */
  checkpoints: PlanCheckpoint[]
  /** 지금 루트를 만든 기획안의 표시(sourceSignature). 같은 기획안이면 고쳐 둔 루트를 다시 만들지 않아요 */
  generatedFrom?: string
}

/** 체크포인트는 최대 8개 (피그마 메모: "체크포인트는 최대 8개 까지만") */
export const MAX_CHECKPOINTS = 8

export const PLAN_KEY = 'oreum:plan:v1'

export const DEFAULT_PLAN: Plan = {
  unit: 'day',
  date: '2026-12-03',
  time: PROJECT.deadlineTime,
  roles: PROJECT.roles.map((r) => ({ id: r.role, label: ROLE[r.role].label, people: r.people, role: r.role })),
  checkpoints: CHECKPOINTS.filter((c) => c.no > 0).map((c) => ({ id: `c${c.no}`, name: c.name })),
}

/** 예시 기획안 파일 (처음 화면에 들어 있는 것) */
export const DEFAULT_SOURCE: PlanSource = { type: 'file', name: PROJECT.planFile.name }

/** 기획안이 같은지 견줄 짧은 표시 (파일 이름 · 링크 · 글 내용) */
export function sourceSignature(source: PlanSource) {
  if (source.type === 'file') return `file:${source.fileId ?? ''}:${source.name}`
  if (source.type === 'link') return `link:${source.url.trim()}`
  // 긴 글은 짧은 숫자로 줄임
  let hash = 5381
  for (let i = 0; i < source.text.length; i++) hash = ((hash << 5) + hash + source.text.charCodeAt(i)) | 0
  return `text:${source.text.length}:${hash}`
}

/** 브라우저에 저장된 값 읽기 (목업 모드의 "서버 값"). 없거나 이상하면 기본값 */
export function readLocalPlan(): Plan {
  const p = readJSON(PLAN_KEY) as Partial<Plan> | null
  if (!p || !Array.isArray(p.roles) || !Array.isArray(p.checkpoints) || typeof p.date !== 'string') return DEFAULT_PLAN
  // 예전에 저장한 루트는 예시 기획안으로 만든 것으로 봄 (다시 만들면서 지워지지 않게)
  return { ...DEFAULT_PLAN, generatedFrom: sourceSignature(DEFAULT_SOURCE), ...p } as Plan
}

let plan = isMock ? readLocalPlan() : DEFAULT_PLAN
const listeners = new Set<() => void>()

function set(next: Plan) {
  plan = next
  listeners.forEach((l) => l())
}

/* ───────── 저장 (api 를 거쳐서) ───────── */

// http 모드에서는 글자를 칠 때마다 보내지 않도록 잠깐 모았다가 한 번에 보냄. 실패하면 모으기 전 값으로 되돌림
const SAVE_DELAY = 500
let timer: ReturnType<typeof setTimeout> | undefined
let beforeUnsaved: Plan | null = null

function flush() {
  timer = undefined
  const prev = beforeUnsaved
  const next = plan
  beforeUnsaved = null
  if (!prev) return
  push('일정 저장', () => api.plan.save(next), {
    rollback: () => {
      // 그 사이에 또 고쳤으면 그 값은 지키고, 아니면 되돌림
      if (plan === next) set(prev)
    },
  })
}

function save(next: Plan) {
  beforeUnsaved ??= plan
  set(next)
  if (isMock) return flush()
  clearTimeout(timer)
  timer = setTimeout(flush, SAVE_DELAY)
}

export function updatePlan(change: Partial<Plan> | ((p: Plan) => Partial<Plan>)) {
  save({ ...plan, ...(typeof change === 'function' ? change(plan) : change) })
}

export function resetPlan() {
  save(DEFAULT_PLAN)
}

/** 서버에서 불러오기 (http 모드에서 시작할 때 · 로그인 직후) */
export function hydratePlan() {
  return pull('일정 불러오기', () => api.plan.get(), (p) => set({ ...DEFAULT_PLAN, ...p }))
}

/* ───────── AI 추천 루트 ───────── */

// 마지막으로 루트를 만든 기획안 ("추천으로 되돌리기"가 같은 기획안으로 다시 물어봄)
let lastSource: PlanSource = DEFAULT_SOURCE

/** 지금 저장된 루트가 이 기획안으로 만든 것인지 */
export const isRouteFor = (source: PlanSource) => plan.checkpoints.length > 0 && plan.generatedFrom === sourceSignature(source)

/**
 * 기획안으로 추천 루트(체크포인트)를 받아 저장합니다 — api.route.recommend.
 * 목업은 기본 체크포인트를 바로 돌려주고, 서버가 붙으면 AI 가 만들어 줘요. 실패하면 오류를 던집니다.
 */
export async function recommendRoute(source: PlanSource = lastSource): Promise<PlanCheckpoint[]> {
  const { checkpoints } = await api.route.recommend({
    deadline: { date: plan.date, time: plan.time, unit: plan.unit },
    roles: plan.roles,
    source,
  })
  lastSource = source
  const next = checkpoints.slice(0, MAX_CHECKPOINTS)
  updatePlan({ checkpoints: next, generatedFrom: sourceSignature(source) })
  return next
}

/** const plan = usePlan() — 값이 바뀌면 화면이 다시 그려져요 */
export function usePlan(): Plan {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => plan,
  )
}

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토']

/** 마감일을 화면용 글자로: { long: '2026. 12. 03 (목)', short: '12/03 18:00', daysLeft: 9 } */
export function deadlineText(p: Pick<Plan, 'date' | 'time' | 'unit'>) {
  const d = new Date(`${p.date}T00:00:00`)
  const valid = !Number.isNaN(d.getTime())
  const [, m = '', day = ''] = p.date.split('-')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return {
    weekday: valid ? WEEKDAY[d.getDay()] : '',
    long: valid ? `${p.date.split('-').join('. ')} (${WEEKDAY[d.getDay()]})` : '날짜 없음',
    short: valid ? `${m}/${day} ${p.time}` : '미정',
    daysLeft: valid ? Math.round((d.getTime() - today.getTime()) / 86_400_000) : null,
  }
}

/** 메인보드 칩: '최종 마감 12/03 (목) 18:00 · 9일 남음' */
export function deadlineChip(p: Pick<Plan, 'date' | 'time' | 'unit'>) {
  const d = deadlineText(p)
  if (d.daysLeft === null) return '최종 마감 미정'
  const [date, time] = d.short.split(' ')
  const left = d.daysLeft > 0 ? `${d.daysLeft}일 남음` : d.daysLeft === 0 ? '오늘 마감' : `${-d.daysLeft}일 지남`
  return `최종 마감 ${date} (${d.weekday}) ${time} · ${left}`
}

const md = (d: Date) => `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`

/**
 * 체크포인트마다 대략의 기간 (루트 화면 아래 칩: '1 · 로그인  11/19 – 11/24').
 * 오늘 ~ 마감일을 체크포인트 수로 나누되, 구간끼리 조금씩 겹치게(디자인·프론트·백이 앞뒤로 이어 받도록) 잡아요.
 *   길이 = 전체 기간의 약 36% · 시작 간격 = (전체 − 길이) ÷ (개수 − 1) · 마지막 구간은 마감일에 끝남
 *   예) 11/19 시작 · 12/03 마감 · 4개 → 11/19–11/24, 11/22–11/27, 11/25–11/30, 11/28–12/03 (피그마 R00 과 같음)
 * 서버가 체크포인트별 날짜를 주면 그 값을 쓰면 돼요.
 */
export function checkpointRanges(p: Pick<Plan, 'date' | 'checkpoints'>, start = new Date()): string[] {
  const end = new Date(`${p.date}T00:00:00`)
  const n = p.checkpoints.length
  if (Number.isNaN(end.getTime()) || n === 0) return p.checkpoints.map(() => '')
  const s = new Date(start)
  s.setHours(0, 0, 0, 0)
  const span = Math.max(0, Math.round((end.getTime() - s.getTime()) / 86_400_000))
  const len = Math.max(1, Math.round(span * 0.36))
  const step = n > 1 ? (span - len) / (n - 1) : 0
  const day = (k: number) => new Date(s.getTime() + Math.round(k) * 86_400_000)
  return p.checkpoints.map((_, i) => {
    const from = day(i * step)
    const to = i === n - 1 ? end : day(i * step + len)
    return `${md(from)} – ${md(to)}`
  })
}
