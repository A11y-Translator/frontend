import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Link, useNavigate } from 'react-router-dom'
import { actions, findIssueContext, useAppState, workspaceIssues } from '@/shared/store'
import { CURRENT_USER_ID } from '@/shared/mocks'
import { MentionNotice } from '@/web/common/MentionNotice'
import { useAnnouncer } from '@/web/common/useAnnouncer'
import { LiveToast } from '@/web/common/LiveToast'
import { ProjectFolderCard } from './ProjectFolderCard'
import { sortProjects } from '@/web/common/projectSort'
import { UrlInspectForm } from './UrlInspectForm'
import { useCreateAndInspect } from './useCreateAndInspect'
import folderIcon from '@/web/assets/icon-folder.svg'

export default function ProjectHomePage() {
  const state = useAppState()
  const { projects } = state
  const [projectId, setProjectId] = useState('')
  const [query, setQuery] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [message, announce] = useAnnouncer()
  const createAndInspect = useCreateAndInspect()
  const navigate = useNavigate()
  const selected = projects.find((p) => p.id === projectId)
  // 내 할 일 진행률: 나에게 배정된 이슈 중 해결한 비율
  const assigned = workspaceIssues(state).filter((i) => i.assigneeId === CURRENT_USER_ID)
  const myDone = assigned.filter((i) => i.status === 'resolved').length
  const myPercent = assigned.length ? Math.round((myDone / assigned.length) * 100) : 0
  const mine = workspaceIssues(state).filter(
    (i) => i.assigneeId === CURRENT_USER_ID && i.status !== 'resolved',
  )
  return (
    <div className="prototype-page prototype-home">
      <section className="prototype-hero" aria-labelledby="home-title">
        <h1 id="home-title">링크 하나로 시작하는 접근성 점검</h1>
        <p>색 대비, 대체 텍스트, 키보드 접근까지 한 번에 확인</p>
        <UrlInspectForm
          className="prototype-hero-form"
          projectPicker={
            <Popover.Root open={pickerOpen} onOpenChange={setPickerOpen}>
              <Popover.Trigger className="prototype-project-trigger">
                <img src={folderIcon} alt="" />
                {selected?.name ?? '프로젝트 선택'} <span aria-hidden>⌄</span>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content sideOffset={8} align="start" className="prototype-project-picker">
                  <label>
                    <span className="sr-only">프로젝트 검색</span>
                    <input
                      placeholder="프로젝트 검색"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setProjectId('')
                      setPickerOpen(false)
                    }}
                  >
                    ＋ 새 프로젝트로 검사
                  </button>
                  {projects
                    .filter((p) => p.name.includes(query))
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={p.id === projectId}
                        onClick={() => {
                          setProjectId(p.id)
                          setPickerOpen(false)
                        }}
                      >
                        <img src={folderIcon} alt="" />
                        {p.name}
                        {p.id === projectId && <span>✓</span>}
                      </button>
                    ))}
                  {!projects.some((p) => p.name.includes(query)) && <p>검색 결과가 없어요.</p>}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          }
          onInspect={async (url, multi, onProgress) => {
            if (!selected) return createAndInspect(url, undefined, multi, onProgress)
            const result = await actions.reinspect(selected.id, onProgress, {
              url,
              extraUrls: multi?.extraUrls,
              discover: multi?.discover,
            })
            if (!result) throw new Error('프로젝트를 찾을 수 없어요. 다시 선택해 주세요.')
            navigate(`/projects/${selected.id}/inspection`)
          }}
        />
      </section>
      <div className="prototype-home-columns">
        <section className="prototype-projects" aria-labelledby="home-projects">
          <div className="prototype-section-heading">
            <h2 id="home-projects">
              프로젝트 <span>{projects.length}</span>
            </h2>
            {/* 4개를 넘을 때만 펼치기 버튼 — 펼침 상태를 화면낭독기에도 알려 줍니다 */}
            {projects.length > 4 && (
              <button type="button" aria-expanded={showAll} aria-controls="home-project-grid" onClick={() => setShowAll(!showAll)}>
                {showAll ? '접기' : '전체보기'}
                <span className="sr-only"> (프로젝트 {projects.length}개{showAll ? ' 중 4개만 보기' : ' 모두 보기'})</span>
              </button>
            )}
          </div>
          <ul id="home-project-grid" className="prototype-project-grid">
            {sortProjects(projects, 'recent').slice(0, showAll ? undefined : 4).map((p, index) => (
              <ProjectFolderCard key={p.id} project={p} index={index} announce={announce} />
            ))}
          </ul>
          {!projects.length && (
            <Link className="prototype-empty" to="/projects/new">
              ＋ 새 프로젝트 만들기
            </Link>
          )}
        </section>
        <section aria-labelledby="home-todos">
          <div className="prototype-section-heading">
            <h2 id="home-todos">
              할일 <span>{mine.length}</span>
            </h2>
            <Link to="/todo/mine">전체보기</Link>
          </div>
          <div className="mb-3 flex flex-col gap-2 rounded-2xl bg-white px-6 py-4 shadow-[0_8px_20px_#00000005]">
            <p className="flex items-baseline gap-1.5">
              <span className="text-sm font-medium text-[#626873]">내 할 일</span>
              <span className="text-2xl font-bold text-black">{mine.length}</span>
              <span className="text-sm text-[#626873]">개 남았어요</span>
              <span className="ml-auto text-sm font-semibold text-black">{myPercent}%</span>
            </p>
            {/* 막대는 장식 — 아래 글자로 같은 내용을 알려 줘요 */}
            <span aria-hidden className="h-2 overflow-hidden rounded-full bg-[#dfe2e6]">
              <span className="block h-full rounded-full bg-black" style={{ width: `${myPercent}%` }} />
            </span>
            <p className="text-[13px] text-[#626873]">
              나에게 배정된 이슈 {assigned.length}개 중 {myDone}개 해결
            </p>
          </div>
          <MentionNotice />
          <ul className="prototype-home-todos">
            {mine.slice(0, 3).map((i) => (
              <li key={i.id}>
                <Link to={`/issues/${i.id}`}>
                  <b className="prototype-tag">
                    {findIssueContext(state, i.id).project?.name ??
                      projects.find((p) => p.currentVersion === i.version)?.name ??
                      '프로젝트'}
                  </b>
                  <span>{i.title}</span>
                  {i.priority === 'high' && <b className="inspection-important">중요</b>}
                  <small>›</small>
                </Link>
              </li>
            ))}
            {!mine.length && <li className="prototype-empty">남은 할 일이 없어요.</li>}
          </ul>
        </section>
      </div>
      <LiveToast message={message} />
    </div>
  )
}
