import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Link, useNavigate } from 'react-router-dom'
import { actions, findIssueContext, useAppState, workspaceIssues } from '@/shared/store'
import { CURRENT_USER_ID, memberById } from '@/shared/mocks'
import { MentionNotice } from '@/web/common/MentionNotice'
import { useAnnouncer } from '@/web/common/useAnnouncer'
import { LiveToast } from '@/web/common/LiveToast'
import { ProjectCardMenu } from './ProjectCardMenu'
import { UrlInspectForm } from './UrlInspectForm'
import { useCreateAndInspect } from './useCreateAndInspect'
import folderBack from '@/web/assets/prototype-folder-back.svg'
import folderGlass from '@/web/assets/prototype-folder-glass.svg'
import folderGrayBack from '@/web/assets/prototype-folder-gray-back.svg'
import folderGrayGlass from '@/web/assets/prototype-folder-gray-glass.svg'
import folderHighlight from '@/web/assets/prototype-folder-highlight.svg'
import folderIcon from '@/web/assets/icon-folder.svg'

export default function ProjectHomePage() {
  const state = useAppState()
  const { projects, inspectionHistory } = state
  const [projectId, setProjectId] = useState('')
  const [query, setQuery] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [message, announce] = useAnnouncer()
  const createAndInspect = useCreateAndInspect()
  const navigate = useNavigate()
  const selected = projects.find((p) => p.id === projectId)
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
            <button type="button" onClick={() => setShowAll(!showAll)}>
              {showAll ? '접기' : '전체보기'}
            </button>
          </div>
          <ul className="prototype-project-grid">
            {projects.slice(0, showAll ? undefined : 4).map((p, index) => {
              const people = [
                ...new Set(
                  (
                    state.inspections[p.id]?.issues ??
                    state.issues.filter((i) => i.version === p.currentVersion)
                  ).flatMap((i) => (i.assigneeId ? [i.assigneeId] : [])),
                ),
              ].slice(0, 2)
              return (
                <li key={p.id}>
                  <Link to={`/projects/${p.id}/inspection`} className="prototype-folder-link">
                    <div className="prototype-folder" aria-hidden="true">
                      <img
                        className="prototype-folder-back"
                        src={index % 2 === 0 ? folderBack : folderGrayBack}
                        alt=""
                      />
                      <span className="prototype-folder-paper" />
                      <img
                        className="prototype-folder-front"
                        src={index % 2 === 0 ? folderGlass : folderGrayGlass}
                        alt=""
                      />
                      <img className="prototype-folder-front" src={folderHighlight} alt="" />
                      <span className="prototype-folder-avatars">
                        {people.map((id) => (
                          <span key={id}>{memberById(id)?.initial}</span>
                        ))}
                      </span>
                      <span className="prototype-folder-date">{p.updatedAt} 수정</span>
                    </div>
                    <span className="prototype-folder-label">
                      <b>{p.name}</b>
                      <small>{p.status === 'active' ? '진행중' : '완료됨'}</small>
                    </span>
                  </Link>
                  <div className="prototype-folder-menu">
                    <ProjectCardMenu
                      project={p}
                      versions={inspectionHistory[p.id]?.length ?? 0}
                      announce={announce}
                    />
                  </div>
                </li>
              )
            })}
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
