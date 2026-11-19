import { useState, type FormEvent } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Link } from 'react-router-dom'
import { useAppState, workspaceIssues } from '@/shared/store'
import { CURRENT_USER_ID, members } from '@/shared/mocks'
import { buildActivities, ONLINE } from './membersUtils'
import searchIcon from '@/web/assets/icon-search.svg'

// shortcut: 팀원·권한은 기존 데모 데이터이며, 팀 API 연결 시 실제 응답으로 교체합니다.
export default function TeamMembersPage() {
  const state = useAppState()
  const issues = workspaceIssues(state)
  const [filter, setFilter] = useState('전체')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [emails, setEmails] = useState<string[]>([])
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [permission, setPermission] = useState('편집')
  const [projectId, setProjectId] = useState('')
  const selected = members.find((m) => m.id === selectedId)
  const activities = buildActivities(issues, state.comments)
  const groups = ['전체', '디자이너', '개발자', '기획자']
  const groupOf = (team: string) =>
    team === 'design' ? '디자이너' : team === 'pm' ? '기획자' : '개발자'
  const visible = members.filter(
    (m) =>
      (filter === '전체' || groupOf(m.team) === filter) &&
      `${m.name} ${m.email}`.toLowerCase().includes(query.toLowerCase()),
  )
  const projectsOf = (id: string) =>
    state.projects.filter((p) =>
      (
        state.inspections[p.id]?.issues ??
        state.issues.filter((i) => i.version === p.currentVersion)
      ).some((i) => i.assigneeId === id),
    )
  const addEmail = (e?: FormEvent) => {
    e?.preventDefault()
    const address = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError('올바른 이메일을 입력해 주세요.')
      return
    }
    if (members.some((m) => m.email.toLowerCase() === address.toLowerCase())) {
      setError('이미 참여 중인 팀원이에요.')
      return
    }
    setEmails([...new Set([...emails, address.toLowerCase()])])
    setEmail('')
    setError('')
  }
  return (
    <div className="prototype-page">
      <header className="prototype-summary">
        <div>
          <h1>A11y Team</h1>
          <p>팀원별 담당 프로젝트를 한눈에 확인</p>
        </div>
        <dl>
          <div>
            <dt>전체 팀원</dt>
            <dd>{members.length}</dd>
          </div>
          <div>
            <dt>지금 활동 중</dt>
            <dd>{members.filter((m) => ONLINE.has(m.id)).length}</dd>
          </div>
          <div>
            <dt>초대 대기</dt>
            <dd>0</dd>
          </div>
        </dl>
      </header>
      <div className="prototype-toolbar">
        <div className="prototype-role-filters" role="group" aria-label="역할 필터">
          {groups.map((g) => (
            <button key={g} type="button" aria-pressed={filter === g} onClick={() => setFilter(g)}>
              {g}{' '}
              <span>
                {g === '전체'
                  ? members.length
                  : members.filter((m) => groupOf(m.team) === g).length}
              </span>
            </button>
          ))}
        </div>
        <div className="prototype-toolbar-end">
          <label className="prototype-search">
            <img src={searchIcon} alt="" />
            <span className="sr-only">이름, 이메일 검색</span>
            <input
              placeholder="이름, 이메일 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button type="button" className="prototype-primary" onClick={() => setInviteOpen(true)}>
            ＋ 팀원 초대
          </button>
        </div>
      </div>
      <div className="prototype-table-wrap">
        <table className="prototype-table prototype-member-table">
          <thead>
            <tr>
              <th>팀원</th>
              <th>역할</th>
              <th>권한</th>
              <th>담당 프로젝트</th>
              <th>최근 활동</th>
              <th>
                <span className="sr-only">팀원 정보</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((m, index) => (
              <tr key={m.id}>
                <td>
                  <button
                    type="button"
                    className="prototype-member-name"
                    onClick={() => setSelectedId(m.id)}
                  >
                    <span
                      className="prototype-avatar"
                      style={{
                        background: ['#d2dfff', '#dcd6ff', '#c6edf0', '#d7d7ff'][index % 4],
                      }}
                    >
                      {m.initial}
                    </span>
                    <span>
                      <b>
                        {m.name}{' '}
                        {m.id === CURRENT_USER_ID && <small className="prototype-tag">나</small>}
                      </b>
                      <small>{m.email}</small>
                    </span>
                  </button>
                </td>
                <td>{m.role}</td>
                <td>{m.id === CURRENT_USER_ID ? '관리자' : '편집'}</td>
                <td>
                  <div className="prototype-member-projects">
                    {projectsOf(m.id)
                      .slice(0, 2)
                      .map((p) => (
                        <Link
                          key={p.id}
                          className="prototype-tag"
                          to={`/projects/${p.id}/inspection`}
                        >
                          {p.name}
                        </Link>
                      ))}
                    {projectsOf(m.id).length > 2 && <span>+{projectsOf(m.id).length - 2}</span>}
                    {!projectsOf(m.id).length && <span>—</span>}
                  </div>
                </td>
                <td className={ONLINE.has(m.id) ? 'prototype-online' : 'prototype-offline'}>
                  ●{' '}
                  {ONLINE.has(m.id)
                    ? '지금 활동 중'
                    : (activities.find((a) => a.memberId === m.id)?.time ?? '활동 없음')}
                </td>
                <td>
                  <a
                    className="prototype-secondary"
                    href={`mailto:${m.email}`}
                    aria-label={`${m.name}에게 메시지`}
                  >
                    메시지
                  </a>{' '}
                  <button
                    type="button"
                    className="prototype-secondary"
                    aria-label={`${m.name} 정보 보기`}
                    onClick={() => setSelectedId(m.id)}
                  >
                    •••
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && <p className="prototype-empty">검색 결과가 없어요.</p>}
      </div>
      <Dialog.Root
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="prototype-dialog-overlay" />
          <Dialog.Content className="prototype-member-drawer" aria-describedby={undefined}>
            <div className="prototype-dialog-heading">
              <Dialog.Title>팀원 정보</Dialog.Title>
              <Dialog.Close aria-label="팀원 정보 닫기" className="prototype-secondary">
                ×
              </Dialog.Close>
            </div>
            {selected && (
              <>
                <div className="prototype-member-profile">
                  <span className="prototype-avatar">{selected.initial}</span>
                  <div>
                    <h2>{selected.name}</h2>
                    <p>
                      {selected.role} ·{' '}
                      {ONLINE.has(selected.id) ? '지금 활동 중' : '최근 활동 없음'}
                    </p>
                  </div>
                </div>
                <a href={`mailto:${selected.email}`} className="prototype-primary">
                  메시지 보내기
                </a>
                <section>
                  <h3>기본 정보</h3>
                  <dl className="prototype-member-info">
                    <div>
                      <dt>이메일</dt>
                      <dd>{selected.email}</dd>
                    </div>
                    <div>
                      <dt>역할</dt>
                      <dd>{selected.role}</dd>
                    </div>
                    <div>
                      <dt>권한</dt>
                      <dd>{selected.id === CURRENT_USER_ID ? '관리자' : '편집'}</dd>
                    </div>
                  </dl>
                </section>
                <section>
                  <h3>담당 프로젝트</h3>
                  <ul>
                    {projectsOf(selected.id).map((p) => (
                      <li key={p.id}>
                        <Link
                          to={`/projects/${p.id}/inspection`}
                          className="prototype-member-project-row"
                        >
                          <b className="prototype-tag">{p.name}</b>
                          <small>{p.status === 'active' ? '진행중' : '완료됨'}</small>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {!projectsOf(selected.id).length && <p>담당 프로젝트가 없어요.</p>}
                  <Link
                    className="prototype-text-link"
                    to="/todo/unassigned"
                    onClick={() => setSelectedId(null)}
                  >
                    ＋ 할 일 배정
                  </Link>
                </section>
                <section>
                  <h3>최근 활동</h3>
                  <ul className="prototype-activity">
                    {activities
                      .filter((a) => a.memberId === selected.id)
                      .slice(0, 5)
                      .map((a) => (
                        <li key={a.id}>
                          <span>{a.text}</span>
                          <small>{a.time}</small>
                        </li>
                      ))}
                  </ul>
                  {!activities.some((a) => a.memberId === selected.id) && (
                    <p>최근 활동이 없어요.</p>
                  )}
                </section>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={inviteOpen} onOpenChange={setInviteOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="prototype-dialog-overlay" />
          <Dialog.Content className="prototype-invite-dialog" aria-describedby="invite-note">
            <div className="prototype-dialog-heading">
              <Dialog.Title>팀원 초대</Dialog.Title>
              <Dialog.Close aria-label="초대 창 닫기" className="prototype-secondary">
                ×
              </Dialog.Close>
            </div>
            <form onSubmit={addEmail}>
              <label htmlFor="invite-email">이메일</label>
              <div className="prototype-email-input">
                {emails.map((address) => (
                  <span className="prototype-tag" key={address}>
                    {address}
                    <button
                      type="button"
                      aria-label={`${address} 제거`}
                      onClick={() => setEmails(emails.filter((e) => e !== address))}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  id="invite-email"
                  type="email"
                  placeholder="이메일 입력 후 Enter"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                />
              </div>
              {error && (
                <p role="alert" className="text-danger">
                  {error}
                </p>
              )}
              <div className="prototype-invite-options">
                <label>
                  권한
                  <select value={permission} onChange={(e) => setPermission(e.target.value)}>
                    <option>편집</option>
                    <option>보기</option>
                  </select>
                </label>
                <label>
                  담당 프로젝트 (선택)
                  <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                    <option value="">선택 안 함</option>
                    {state.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="prototype-invite-link-label">초대 링크로 공유</p>
              <div className="prototype-invite-link">
                <span>초대 링크 발급 준비 중</span>
                <button type="button" className="prototype-secondary" disabled>
                  복사
                </button>
              </div>
              <p id="invite-note" className="prototype-backend-note">
                초대 발송·링크 발급은 백엔드 연결 후 사용할 수 있어요.
              </p>
              <div className="prototype-dialog-footer">
                <Dialog.Close className="prototype-secondary">취소</Dialog.Close>
                <button type="button" disabled className="prototype-primary">
                  초대 보내기{emails.length > 0 && ` (${emails.length}명)`}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
