import { useState } from 'react'
import { Link, Navigate, NavLink, useParams } from 'react-router-dom'
import { findIssueContext, useAppState, workspaceIssues } from '@/shared/store'
import { CURRENT_USER_ID, memberById } from '@/shared/mocks'
import { IssueCompletion } from './IssueCompletion'
import { MentionNotice } from '@/web/common/MentionNotice'
import { mentionsOf, isTodoTab } from './todoUtils'
import folderIcon from '@/web/assets/icon-folder.svg'
import searchIcon from '@/web/assets/icon-search.svg'

// 내 할 일 · 우리 팀 할 일 · 미배정 — 탭은 주소(/todo/:tab)와 맞춰 둡니다
const TABS = [
  { id: 'mine', label: '내 할 일' },
  { id: 'team', label: '우리 팀 할 일' },
  { id: 'unassigned', label: '미배정' },
] as const

export default function TodoPage() {
  const { tab } = useParams()
  const state = useAppState()
  const [projectId, setProjectId] = useState('all')
  const [sort, setSort] = useState('latest')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('open')
  // 이번에 체크한 할 일은 목록에서 바로 사라지지 않고 체크된 채로 남아요 → '완료한 할 일 지우기'로 정리
  const [kept, setKept] = useState<Set<string>>(() => new Set())
  const [notice, setNotice] = useState('')
  if (!isTodoTab(tab)) return <Navigate to="/todo/mine" replace />
  const all = workspaceIssues(state)
  const inTab = (t: string) =>
    all.filter((i) => (t === 'team' ? !!i.team : t === 'unassigned' ? !i.assigneeId : i.assigneeId === CURRENT_USER_ID))
  const mine = inTab(tab)
  const openCount = (t: string) => inTab(t).filter((i) => i.status !== 'resolved').length
  // 진행률: 이 탭 이슈 중 해결된 비율
  const doneCount = mine.filter((i) => i.status === 'resolved').length
  const percent = mine.length ? Math.round((doneCount / mine.length) * 100) : 0
  const projectOf = (id: string) =>
    findIssueContext(state, id).project ??
    state.projects.find((p) => p.currentVersion === all.find((i) => i.id === id)?.version)
  const rows = mine
    .filter(
      (i) =>
        (status === 'all' ||
          (status === 'open' ? i.status !== 'resolved' || kept.has(i.id) : i.status === 'resolved')) &&
        (projectId === 'all' || projectOf(i.id)?.id === projectId) &&
        i.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
    )
    .sort((a, b) =>
      sort === 'important'
        ? Number(b.priority === 'high') - Number(a.priority === 'high') || a.no - b.no
        : b.version - a.version || a.no - b.no,
    )
  // 목록에 체크된 채로 남아 있는 완료 할 일
  const clearable = rows.filter((i) => i.status === 'resolved')
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
            <dt>진행률</dt>
            <dd>{percent}%</dd>
          </div>
          <div>
            <dt>새 멘션</dt>
            <dd>{mentionsOf(state.comments, memberById(CURRENT_USER_ID)!).length}</dd>
          </div>
        </dl>
      </header>
      <nav aria-label="할 일 보기" className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <NavLink
            key={t.id}
            to={`/todo/${t.id}`}
            className={({ isActive }) =>
              `rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap ${
                isActive ? 'border-black bg-black text-white' : 'border-[#e3e5e8] bg-white text-[#3b3f46] hover:bg-[#f4f5f7]'
              }`
            }
          >
            {t.label} {openCount(t.id)}
            <span className="sr-only">개 남음</span>
          </NavLink>
        ))}
      </nav>
      <div
        role="progressbar"
        aria-label={`${TABS.find((t) => t.id === tab)!.label} 진행률`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${mine.length}개 중 ${doneCount}개 해결 (${percent}%)`}
        className="flex items-center gap-3 text-sm text-[#626873]"
      >
        <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#dfe2e6]">
          <span className="block h-full rounded-full bg-black transition-[width]" style={{ width: `${percent}%` }} />
        </span>
        <span className="shrink-0 font-semibold whitespace-nowrap text-black">
          {doneCount} / {mine.length} 해결
        </span>
      </div>
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
                      onChange={(resolved) => {
                        if (resolved) setKept((k) => new Set(k).add(i.id))
                        setNotice(resolved ? `${i.title} 완료` : `${i.title} 완료 취소`)
                      }}
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
      {status === 'open' && clearable.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setKept(new Set())
              setNotice(`완료한 할 일 ${clearable.length}개를 목록에서 지웠어요. 완료 보기에서 다시 볼 수 있어요.`)
            }}
            className="rounded-full border border-[#d5d9df] bg-white px-4 py-2 text-sm font-semibold text-[#3b3f46] hover:bg-[#f4f5f7]"
          >
            완료한 할 일 지우기 {clearable.length}
          </button>
        </div>
      )}
      <p role="status" className="sr-only">
        {notice}
      </p>
    </div>
  )
}
