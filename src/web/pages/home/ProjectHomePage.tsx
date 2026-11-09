// Figma: project /home (533:7094)
// 변형 554:11755 / 554:11230 은 팀 스페이스 드롭다운이 열린 상태 → Navbar.tsx 에 이미 구현됨.
// 상단 "Browser chrome" 과 왼쪽 Navbar 는 WebLayout 이 담당하므로 여기서는 본문만 그립니다.
// 글자·카드 크기는 할 일 등 다른 웹 화면과 맞췄습니다 (제목 30px, 설명 15px, 카드 모서리 12~16px).
import { Link } from 'react-router-dom'
import { projects } from '@/shared/mocks'
import { FolderCard } from './FolderCard'
import { TodoSummaryCard } from './TodoSummaryCard'
import { UrlInspectForm } from './UrlInspectForm'

const RECENT_LIMIT = 4

export default function ProjectHomePage() {
  const recent = projects.slice(0, RECENT_LIMIT)

  return (
    <div className="flex w-full flex-col page-x pt-10 pb-8 font-noto">
      {/* 컴포넌트 title (554:9315) */}
      <div className="flex flex-col gap-1.5 leading-[1.45]">
        <h1 className="text-[30px] font-bold text-ink-2">모두가 쓰기 편한 화면, 오늘도 같이 만들어 봐요</h1>
        <p className="text-[15px] text-muted-2">색 대비, 대체 텍스트, 키보드 접근까지 한 번에 확인해요</p>
      </div>

      <UrlInspectForm className="mt-6" />

      <div className="mt-8 grid grid-cols-2 items-start gap-6">
        <section aria-labelledby="home-recent" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 id="home-recent" className="text-base leading-[1.45] font-semibold text-black">
              최근 프로젝트
            </h2>
            {/* 디자인에 없는 진입점: 첫 검사(빈 프로젝트) 화면으로 */}
            <Link to="/projects/new" className="rounded text-sm leading-[1.4] font-medium text-muted-2 hover:text-black">
              + 새 프로젝트
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-4">
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

        <section aria-labelledby="home-todo" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
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
