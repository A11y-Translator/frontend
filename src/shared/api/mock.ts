// mock 구현 — 서버 없이 브라우저 안에서 "검사한 척" 합니다.
// 검사 규칙은 shared/mocks/inspect.ts 에 있습니다.
import type { ApiClient } from './client'
import type { Project } from './types'
import { inspectUrl } from '@/shared/mocks/inspect'

/** 실제 검사처럼 잠깐 기다리기 (ms) */
const LATENCY = { create: 300, inspect: 1200 }
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const today = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${String(d.getFullYear()).slice(2)}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

export const mockApi: ApiClient = {
  async createProject({ name, url }) {
    await wait(LATENCY.create)
    const project: Project = {
      id: `p${Date.now().toString(36)}`,
      name,
      url,
      status: 'active',
      updatedAt: today(),
      currentVersion: 0,
    }
    return project
  },
  async deleteProject() {
    // 브라우저 저장소에서 지우는 건 store 가 합니다
    await wait(LATENCY.create)
  },
  async runInspection(project, previousVersion = 0) {
    await wait(LATENCY.inspect)
    return inspectUrl(project.id, project.url, previousVersion + 1)
  },
}
