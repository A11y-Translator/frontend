// Figma: project/none (533:7209) — 아직 검사한 페이지가 없을 때의 홈 (첫 검사)
import { FolderCard } from './FolderCard'
import { UrlInspectForm } from './UrlInspectForm'

export default function ProjectEmptyPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1160px] flex-col items-center px-5 pt-[162px] pb-12 font-pretendard">
      {/* 디자인에는 제목이 없어서 화면낭독기용 제목만 둡니다 */}
      <h1 className="sr-only">첫 검사 시작하기</h1>

      <UrlInspectForm className="w-full px-1" describedBy="empty-home-hint" />

      {/* 빈 폴더 그림 (장식) */}
      <FolderCard className="mt-[105px] w-[270px]" title="새 프로젝트" status="검사 전" meta="최근 수정일 | -" />

      <p id="empty-home-hint" className="mt-6 text-center text-2xl leading-[1.6] font-medium text-muted">
        아직 검사한 페이지가 없어요. 위에 URL을 넣고 첫 검사를 시작해 보세요.
      </p>
    </div>
  )
}
