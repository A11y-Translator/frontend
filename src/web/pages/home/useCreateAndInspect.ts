// 홈 · 새 프로젝트 화면 공통: URL 로 프로젝트를 만들고 바로 검사 → 검사 결과 화면으로 이동.
// 실제 생성/검사는 actions.createProjectAndInspect (shared/store.ts) → api (live·mock·서버).
import { useNavigate } from 'react-router-dom'
import { actions } from '@/shared/store'
import { normalizeUrl, projectNameFor } from '@/shared/api/url'

export const DEFAULT_PROJECT_NAME = '새 프로젝트'

/** UrlInspectForm 의 onInspect 로 넘길 함수. name 을 안 바꿨으면(비었거나 기본값) 도메인을 이름으로 */
export function useCreateAndInspect() {
  const navigate = useNavigate()
  return async (url: string, name = DEFAULT_PROJECT_NAME) => {
    const checked = normalizeUrl(url)
    if (!checked.ok) throw new Error(checked.message)
    const project = await actions.createProjectAndInspect({
      name: projectNameFor(name, checked.hostname, DEFAULT_PROJECT_NAME),
      url: checked.url,
    })
    navigate(`/projects/${project.id}/inspection`)
  }
}
