// Figma: project/none (533:7209) — 새 프로젝트 만들기 (첫 검사)
// 폴더 카드 제목을 눌러 이름을 정하고, URL 을 넣고 "검사하기" → 프로젝트 생성 + 검사 → 검사 결과 화면으로 이동.
// 실제 생성/검사는 actions.createProjectAndInspect (shared/store.ts) → api (mock 또는 서버).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { actions } from '@/shared/store'
import { normalizeUrl, projectNameFor } from '@/shared/api/url'
import { FolderCard } from './FolderCard'
import { UrlInspectForm } from './UrlInspectForm'

const DEFAULT_NAME = '새 프로젝트'

export default function ProjectEmptyPage() {
  const navigate = useNavigate()
  const [name, setName] = useState(DEFAULT_NAME)
  const [inspecting, setInspecting] = useState(false)

  const inspect = async (url: string) => {
    const checked = normalizeUrl(url)
    if (!checked.ok) throw new Error(checked.message)
    setInspecting(true)
    try {
      // 이름을 안 바꿨으면 도메인을 이름으로 씁니다 (예: example.com)
      const project = await actions.createProjectAndInspect({
        name: projectNameFor(name, checked.hostname, DEFAULT_NAME),
        url: checked.url,
      })
      navigate(`/projects/${project.id}/inspection`)
    } finally {
      setInspecting(false)
    }
  }

  return (
    <div className="flex w-full flex-col items-center page-x pt-[162px] pb-12 font-pretendard">
      {/* 디자인에는 제목이 없어서 화면낭독기용 제목만 둡니다 */}
      <h1 className="sr-only">새 프로젝트 만들기</h1>

      <UrlInspectForm className="w-full px-1" describedBy="empty-home-hint" onInspect={inspect} />

      <FolderCard
        className="mt-[105px] w-[270px]"
        title={name}
        onTitleChange={setName}
        status={inspecting ? '검사 중…' : '검사 전'}
        meta="최근 수정일 | -"
      />

      <p id="empty-home-hint" className="mt-6 text-center text-2xl leading-[1.6] font-medium text-muted">
        아직 검사한 페이지가 없어요. 위에 URL을 넣고 첫 검사를 시작해 보세요.
      </p>
    </div>
  )
}
