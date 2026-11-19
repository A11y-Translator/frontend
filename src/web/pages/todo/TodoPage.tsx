import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { actions, findIssueContext, useAppState, workspaceIssues } from '@/shared/store'
import { CURRENT_USER_ID, memberById } from '@/shared/mocks'
import { IssueCompletion } from './IssueCompletion'
import { MentionNotice } from '@/web/common/MentionNotice'
import { mentionsOf, isTodoTab } from './todoUtils'
import folderIcon from '@/web/assets/icon-folder.svg'
import searchIcon from '@/web/assets/icon-search.svg'

export default function TodoPage() {
  const { tab } = useParams()
  const state = useAppState()
  const [projectId, setProjectId] = useState('all')
  const [sort, setSort] = useState('latest')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('open')
  const [lastCompleted, setLastCompleted] = useState<string | null>(null)
  if (!isTodoTab(tab)) return <Navigate to="/todo/mine" replace />
  const all = workspaceIssues(state)
  const mine = all.filter((i) =>
    tab === 'team'
      ? !!i.team
      : tab === 'unassigned'
        ? !i.assigneeId
        : i.assigneeId === CURRENT_USER_ID,
  )
  const projectOf = (id: string) =>
    findIssueContext(state, id).project ??
    state.projects.find((p) => p.currentVersion === all.find((i) => i.id === id)?.version)
  const rows = mine
    .filter(
      (i) =>
        (status === 'all' || (i.status === 'resolved') === (status === 'resolved')) &&
        (projectId === 'all' || projectOf(i.id)?.id === projectId) &&
        i.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    )
    .sort((a, b) =>
      sort === 'important'
        ? Number(b.priority === 'high') - Number(a.priority === 'high') || a.no - b.no
        : b.version - a.version || a.no - b.no,
    )
  return (
    <div className="prototype-page">
      <header className="prototype-summary">
        <div>
          <h1>할일</h1>
          <p>
            {tab === 'mine'
              ? '나에게 배정된 접근성 이슈 확인·해결'
              : tab === 'team'
                ? '우리 팀에 배정된 접근성 이슈 확인·해결'
                : '담당자 없는 접근성 이슈 확인·배정'}
          </p>
        </div>
        <dl>
          <div>
            <dt>전체 할일</dt>
            <dd>{mine.filter((i) => i.status !== 'resolved').length}</dd>
          </div>
          <div>
            <dt>중요</dt>
            <dd>{mine.filter((i) => i.priority === 'high' && i.status !== 'resolved').length}</dd>
          </div>
          <div>
            <dt>새 멘션</dt>
            <dd>{mentionsOf(state.comments, memberById(CURRENT_USER_ID)!).length}</dd>
          </div>
        </dl>
      </header>
      <div className="prototype-toolbar">
        <label className="prototype-select">
          <img src={folderIcon} alt="" />
          <span className="sr-only">프로젝트로 거르기</span>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="all">모든 프로젝트</option>
            {state.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="prototype-toolbar-end">
          <label className="prototype-select">
            <span className="sr-only">할 일 상태</span>
            <select
              aria-label="할 일 상태"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="open">해결 전</option>
              <option value="resolved">완료</option>
              <option value="all">전체</option>
            </select>
          </label>
          <label className="prototype-select">
            <span className="sr-only">정렬</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="latest">최신순</option>
              <option value="important">중요도순</option>
            </select>
          </label>
          <label className="prototype-search">
            <img src={searchIcon} alt="" />
            <span className="sr-only">이슈 이름 검색</span>
            <input
              placeholder="이슈 이름 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
      </div>
      <MentionNotice />
      <div className="prototype-table-wrap">
        <table className="prototype-table prototype-todo-table">
          <thead>
            <tr>
              <th>문제</th>
              <th>종류</th>
              <th>페이지</th>
              <th>요소</th>
              <th>발견</th>
              <th>
                <span className="sr-only">상세</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id}>
                <td>
                  <div className="prototype-todo-problem">
                    <IssueCompletion
                      issue={i}
                      onChange={(resolved) => setLastCompleted(resolved ? i.id : null)}
                    />
                    <Link
                      to={`/issues/${i.id}`}
                      className={i.status === 'resolved' ? 'is-complete' : ''}
                    >
                      <b className="prototype-tag">{projectOf(i.id)?.name ?? '프로젝트'}</b>
                      <span>{i.title}</span>
                      {i.priority === 'high' && <b className="inspection-important">중요</b>}
                    </Link>
                  </div>
                </td>
                <td>{i.category}</td>
                <td>{i.page}</td>
                <td>{i.elements}개</td>
                <td>버전 {i.version}</td>
                <td>
                  <Link to={`/issues/${i.id}`} aria-label={`${i.title} 상세 보기`}>
                    ›
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="prototype-empty">조건에 맞는 할 일이 없어요.</p>}
      </div>
      {lastCompleted && all.find((i) => i.id === lastCompleted)?.status === 'resolved' && (
        <div role="status" className="prototype-completion-notice">
          <span>할 일을 완료로 표시했어요.</span>
          <button
            type="button"
            onClick={() => {
              actions.setResolved(lastCompleted, false)
              setLastCompleted(null)
            }}
          >
            되돌리기
          </button>
        </div>
      )}
    </div>
  )
}
