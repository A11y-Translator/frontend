import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as Popover from '@radix-ui/react-popover'
import { actions, useAppState, workspaceIssues } from '@/shared/store'
import { CURRENT_USER_ID, memberById, members } from '@/shared/mocks'
import type { Issue } from '@/shared/api/types'
import { DEFAULT_PROJECT_ID, OVERLAYS, type OverlayBox } from '@/shared/mocks/scan'
import { CopyButton } from './CopyButton'
import back from '@/shared/assets/figma/chevron-left.svg'
import check from '@/shared/assets/figma/check.svg'
import '../inspection/inspection-result.css'

interface Props {
  issue: Issue
  order: Issue[]
  resolved: boolean
  onResolve: () => void
  onReopen: () => void
  onLocate: (selector: string) => void
  overlays?: OverlayBox[]
  projectId?: string
  onBack?: () => void
  readOnly?: boolean
  codeIsEvidence?: boolean
  children?: ReactNode
}

export function IssueSidePanel({
  issue,
  order,
  resolved,
  onResolve,
  onReopen,
  onLocate,
  overlays = OVERLAYS,
  projectId = DEFAULT_PROJECT_ID,
  onBack,
  readOnly = false,
  codeIsEvidence = false,
  children,
}: Props) {
  const navigate = useNavigate()
  const state = useAppState()
  const [memberQuery, setMemberQuery] = useState('')
  const assignee = memberById(issue.assigneeId)
  const index = order.findIndex((i) => i.id === issue.id)
  const [assignOpen, setAssignOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [issue.id])
  const assign = (memberId: string) => {
    const member = memberById(memberId)
    if (!member || readOnly) return
    if (issue.status === 'unassigned') actions.assignTeam(issue.id, member.team, member.id)
    else actions.changeAssignee(issue.id, member.id, member.team)
    setAssignOpen(false)
    setNotice(`${member.name}님에게 배정했어요.`)
  }
  return (
    <aside
      className={`inspection-detail ${onBack ? '' : 'inspection-detail--standalone'}`}
      aria-label="이슈 정보"
    >
      <div className="inspection-detail__scroll">
        <nav className="inspection-detail__nav" aria-label="이슈 이동">
          {onBack ? (
            <button type="button" onClick={onBack}>
              <img src={back} alt="" width="16" height="16" />
              이슈 목록
            </button>
          ) : (
            <Link to={`/projects/${projectId}/inspection`}>
              <img src={back} alt="" width="16" height="16" />
              이슈 목록
            </Link>
          )}
          {!onBack && (
            <div>
              <button
                type="button"
                disabled={!order[index - 1]}
                onClick={() => navigate(`/issues/${order[index - 1].id}`)}
                aria-label="이전 이슈"
              >
                ‹
              </button>
              <span>
                {index + 1} / {order.length}
              </span>
              <button
                type="button"
                disabled={!order[index + 1]}
                onClick={() => navigate(`/issues/${order[index + 1].id}`)}
                aria-label="다음 이슈"
              >
                ›
              </button>
            </div>
          )}
        </nav>
        <section className="inspection-detail__head">
          <div>
            <span className="inspection-issue-number is-active">{issue.no}</span>
            <h2 ref={heading} tabIndex={-1}>
              {issue.title}
            </h2>
            {issue.priority === 'high' && <span className="inspection-important">중요</span>}
          </div>
          <p className="inspection-detail__meta">
            {issue.category} · 요소 {issue.elements}개 · {issue.wcag}
          </p>
          <p>{issue.impact}</p>
          <div className="inspection-detail__actions">
            <Popover.Root open={assignOpen} onOpenChange={setAssignOpen}>
              <Popover.Trigger
                disabled={readOnly}
                className="inspection-assignee"
                aria-label="담당자 변경"
              >
                {assignee ? (
                  <>
                    <span>담당</span>
                    <b className="inspection-avatar">{assignee.initial}</b>
                    {assignee.name}
                    {assignee.id === CURRENT_USER_ID && <small>나</small>}
                  </>
                ) : (
                  '◌ 담당자 없음'
                )}
                <span aria-hidden>⌄</span>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  className="z-50 w-[240px] rounded-xl border border-ext-line bg-white p-2 font-pretendard shadow-lg"
                  sideOffset={8}
                  align="start"
                >
                  <p className="p-2 text-xs text-muted-2">담당자 고르기</p>
                  <input
                    aria-label="담당자 검색"
                    placeholder="이름, 이메일 검색"
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    className="mb-2 w-full rounded-lg bg-web-chip p-2 text-sm"
                  />
                  <ul>
                    {members
                      .filter((m) =>
                        `${m.name} ${m.email}`.toLowerCase().includes(memberQuery.toLowerCase()),
                      )
                      .map((m) => (
                        <li key={m.id}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-[#eef3ff]"
                            aria-pressed={m.id === issue.assigneeId}
                            onClick={() => assign(m.id)}
                          >
                            <span className="inspection-avatar">{m.initial}</span>
                            {m.name}
                            <small className="ml-auto text-muted-2">
                              할일{' '}
                              {
                                workspaceIssues(state).filter(
                                  (i) => i.assigneeId === m.id && i.status !== 'resolved',
                                ).length
                              }
                            </small>
                            {m.id === issue.assigneeId && (
                              <span className="ml-auto text-xs">현재</span>
                            )}
                          </button>
                        </li>
                      ))}
                  </ul>
                  {issue.assigneeId && (
                    <button
                      type="button"
                      className="mt-2 w-full border-t border-ext-line p-2 text-left text-sm"
                      onClick={() => {
                        if (readOnly) return
                        actions.changeAssignee(issue.id, undefined)
                        setAssignOpen(false)
                        setNotice('담당자 배정을 해제했어요.')
                      }}
                    >
                      담당자 해제
                    </button>
                  )}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
            {!assignee && !resolved ? (
              <button
                type="button"
                disabled={readOnly}
                className="inspection-action"
                onClick={() => assign(CURRENT_USER_ID)}
              >
                내가 맡기
              </button>
            ) : (
              <button
                type="button"
                disabled={readOnly}
                className={`inspection-action ${resolved ? 'is-resolved' : ''}`}
                onClick={resolved ? onReopen : onResolve}
              >
                <img src={check} alt="" width="16" height="16" />
                {resolved ? '해결됨 · 되돌리기' : '해결로 표시'}
              </button>
            )}
          </div>
          {!assignee && !resolved && (
            <button
              type="button"
              disabled={readOnly}
              className="inspection-resolve-unassigned"
              onClick={onResolve}
            >
              해결로 표시
            </button>
          )}
        </section>
        <section className="inspection-detail__section" aria-label="수정 제안">
          <h3>수정 제안</h3>
          {issue.fixOptions?.map((option) => (
            <div key={option.color} className="inspection-suggestion">
              <span>{option.label}</span>
              <div>
                <span className="inspection-swatch" style={{ background: option.color }} />
                <strong>{option.color}</strong>
                <span className="text-success">{option.ratio}</span>
                <CopyButton text={option.color} what={option.color} />
              </div>
            </div>
          ))}
          {issue.savedFix && (
            <div className="inspection-suggestion">
              <span>저장한 수정안</span>
              <div>
                <code>{issue.savedFix}</code>
                <CopyButton text={issue.savedFix} what="저장한 수정안" />
              </div>
            </div>
          )}
          {issue.fixCode && !codeIsEvidence && (
            <div className="inspection-suggestion">
              <span>개발자에게 전달할 코드</span>
              <div>
                <code>{issue.fixCode}</code>
                <CopyButton text={issue.fixCode} what="개발자용 코드" />
              </div>
            </div>
          )}
          {!issue.fixOptions?.length && !issue.savedFix && (!issue.fixCode || codeIsEvidence) && (
            <p className="inspection-detail__meta">
              아직 등록된 수정안이 없어요. 검출 내용을 확인하고 코멘트로 제안해 주세요.
            </p>
          )}
        </section>
        <details className="inspection-detail__section inspection-evidence" open={codeIsEvidence}>
          <summary>해당 요소 {issue.elements}개 · 검출 내용</summary>
          {issue.detail && <p>{issue.detail}</p>}
          <ul>
            {issue.selectors.map((selector) => (
              <li key={selector}>
                <code>{selector}</code>
                {overlays.some((o) => o.selector === selector && o.issueId === issue.id) ? (
                  <button type="button" onClick={() => onLocate(selector)}>
                    위치 보기<span className="sr-only">: {selector}</span>
                  </button>
                ) : (
                  <span>캡처 영역 밖 · 위치 정보 없음</span>
                )}
              </li>
            ))}
          </ul>
          {issue.selectors.length < issue.elements && (
            <p className="inspection-detail__meta">
              앞의 {issue.selectors.length}개 요소만 표시해요.
            </p>
          )}
          {codeIsEvidence && issue.fixCode && (
            <pre>
              <code>{issue.fixCode}</code>
            </pre>
          )}
        </details>
        <p role="status" className="inspection-detail__notice">
          {notice}
        </p>
      </div>
      {children}
    </aside>
  )
}
