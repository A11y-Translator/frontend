// Figma: project /home (533:7094)
// 변형 554:11755 / 554:11230 은 팀 스페이스 드롭다운이 열린 상태 → Navbar.tsx 에 이미 구현됨.
// 상단 "Browser chrome" 과 왼쪽 Navbar 는 WebLayout 이 담당하므로 여기서는 본문만 그립니다.
import { Link } from 'react-router-dom'
import { projects } from '@/shared/mocks'
import { FolderCard } from './FolderCard'
import { TodoSummaryCard } from './TodoSummaryCard'
import { UrlInspectForm } from './UrlInspectForm'

const RECENT_LIMIT = 4

export default function ProjectHomePage() {
  const recent = projects.slice(0, RECENT_LIMIT)

  return (
    <div className="mx-auto flex w-full max-w-[1160px] flex-col px-5 pt-8 pb-6 font-pretendard">
      {/* 컴포넌트 title (554:9315) */}
      <div className="flex flex-col gap-[3px]">
        <h1 className="text-[32px] leading-[1.6] font-bold text-black">모두가 쓰기 편한 화면, 오늘도 같이 만들어 봐요</h1>
        <p className="text-xl leading-[1.45] text-muted">색 대비, 대체 텍스트, 키보드 접근까지 한 번에 확인해요</p>
      </div>

      <UrlInspectForm className="mx-1 mt-6" />

      <div className="mt-4 grid grid-cols-[minmax(0,568fr)_minmax(0,501fr)] items-start gap-8 px-2">
        <section aria-labelledby="home-recent" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 id="home-recent" className="text-base leading-[1.45] font-semibold text-black">
              최근 프로젝트
            </h2>
            {/* 디자인에 없는 진입점: 첫 검사(빈 프로젝트) 화면으로 */}
            <Link to="/projects/new" className="rounded text-sm leading-[1.4] font-medium text-muted-2 hover:text-black">
              + 새 프로젝트
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-x-[26px] gap-y-3">
            {recent.map((p) => {
              const active = p.status === 'active'
              return (
                <li key={p.id}>
                  <FolderCard
                    to={`/projects/${p.id}/inspection`}
                    active={active}
                    title={p.name}
                    status={active ? '진행중' : '완료됨'}
                    preview={`${p.url}\n버전 ${p.currentVersion} 검사 중`}
                    meta={
                      <>
                        최근 수정일<span aria-hidden> | </span>
                        <span className="sr-only">, </span>
                        {p.updatedAt}
                      </>
                    }
                  />
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="home-todo" className="flex flex-col gap-[25px]">
          <div className="flex items-center justify-between px-2">
            <h2 id="home-todo" className="text-base leading-[1.45] font-semibold text-black">
              할 일
            </h2>
            <Link to="/todo/mine" className="rounded font-noto text-sm leading-[1.4] font-medium text-muted-2 hover:text-ink">
              <span className="sr-only">할 일 </span>전체 보기 <span aria-hidden>→</span>
            </Link>
          </div>
          <TodoSummaryCard />
        </section>
      </div>
    </div>
  )
}
