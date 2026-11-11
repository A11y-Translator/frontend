// Figma: project/issue-detail 오른쪽 "Right panel" (554:12347)
// ← 목록으로 · ‹ 1 / N › · 이슈 머리 · 추천 색상 · 해당 요소 · 개발자에게 전달할 코드 · 담당자 지정 / 해결됨으로 표시
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as Popover from '@radix-ui/react-popover'
import { actions } from '@/shared/store'
import { memberById, members } from '@/shared/mocks'
import type { Issue } from '@/shared/api/types'
import { TEAM_LABEL } from '@/shared/api/types'
import iconChevronLeft from '@/web/assets/icon-chevron-left.svg'
import tagSuccess from '@/web/assets/tag-success.svg'
import { DEFAULT_PROJECT_ID, OVERLAYS, type OverlayBox } from '@/shared/mocks/scan'
import { CopyButton } from './CopyButton'
import { SeverityChip } from '@/shared/ui/SeverityChip'

interface Props {
  issue: Issue
  /** 이전/다음 이동용 (번호순) */
  order: Issue[]
  resolved: boolean
  onResolve: () => void
  /** "해결됨" 되돌리기 */
  onReopen: () => void
  /** "위치 보기": 캡처에서 해당 요소를 강조 */
  onLocate: (selector: string) => void
  /** 새 프로젝트 이슈면 그 검사 결과의 박스 */
  overlays?: OverlayBox[]
  /** "목록으로" 링크가 갈 프로젝트 */
  projectId?: string
}

const card = 'flex w-full flex-col rounded-xl border border-ext-line bg-white p-4'

export function IssueSidePanel({ issue, order, resolved, onResolve, onReopen, onLocate, overlays = OVERLAYS, projectId = DEFAULT_PROJECT_ID }: Props) {
  const navigate = useNavigate()
  const idx = order.findIndex((i) => i.id === issue.id)
  const prev = order[idx - 1]
  const next = order[idx + 1]
  const assignee = memberById(issue.assigneeId)
  const [openHtml, setOpenHtml] = useState<string | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [notice, setNotice] = useState('')

  const assign = (memberId: string) => {
    const m = memberById(memberId)
    if (!m) return
    // 미배정 이슈는 팀 분배(상태 todo 로), 이미 배정된 이슈는 담당자만 변경
    if (issue.status === 'unassigned') actions.assignTeam(issue.id, m.team, m.id)
    else actions.changeAssignee(issue.id, m.id, m.team)
    setAssignOpen(false)
    setNotice(`${m.name}님에게 배정했어요.`)
  }

  return (
    <aside aria-label="이슈 정보" className="flex w-[386px] shrink-0 flex-col gap-3 self-stretch bg-[#f5f5f5] p-6 font-noto">
      {/* 목록으로 · 이전/다음 */}
      <div className="flex items-center gap-1.5 text-[13px] leading-[1.5] font-medium">
        <Link to={`/projects/${projectId}/inspection`} className="flex flex-1 items-center gap-1.5 rounded text-black hover:underline">
          <img src={iconChevronLeft} alt="" width={18} height={18} />
          목록으로
        </Link>
        <nav aria-label="이슈 이동" className="flex items-center gap-1 text-muted">
          <button
            type="button"
            aria-label={prev ? `이전 이슈: ${prev.title}` : '이전 이슈 없음'}
            disabled={!prev}
            onClick={() => prev && navigate(`/issues/${prev.id}`)}
            className="flex size-6 items-center justify-center rounded text-base hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            ‹
          </button>
          <span>
            <span className="sr-only">현재 </span>
            {idx + 1} / {order.length}
          </span>
          <button
            type="button"
            aria-label={next ? `다음 이슈: ${next.title}` : '다음 이슈 없음'}
            disabled={!next}
            onClick={() => next && navigate(`/issues/${next.id}`)}
            className="flex size-6 items-center justify-center rounded text-base hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            ›
          </button>
        </nav>
      </div>

      {/* Issue head */}
      <section className={`${card} gap-1.5`} aria-labelledby="issue-title">
        <div className="flex items-center gap-2">
          <SeverityChip severity={issue.severity} />
          <p className="text-xs leading-[1.5] font-medium text-muted">
            {issue.category} · {issue.wcag}
          </p>
        </div>
        <h2 id="issue-title" className="text-[17px] leading-[1.5] font-bold text-black">
          {issue.title}
        </h2>
        <p className="text-xs leading-[1.5] text-muted">{issue.detail ?? issue.impact}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs leading-[1.5] text-muted">
          <span>
            담당{' '}
            {assignee ? (
              <b className="font-medium text-black">
                {assignee.name} ({TEAM_LABEL[assignee.team]})
              </b>
            ) : (
              <b className="font-medium text-danger">담당자 없음</b>
            )}
          </span>
          {resolved && (
            <span className="flex items-center gap-1 font-medium text-success">
              <img src={tagSuccess} alt="" width={14} height={14} />
              해결됨{issue.autoResolved ? ' · 재검사로 자동 해결' : ''}
            </span>
          )}
        </p>
      </section>

      {/* 추천 색상 */}
      {issue.fixOptions && (
        <section className={`${card} gap-2`} aria-labelledby="fix-colors-title">
          <h3 id="fix-colors-title" className="text-[13px] leading-[1.5] font-bold text-black">
            추천 색상 (배경 유지)
          </h3>
          <ul className="flex flex-col gap-2">
            {issue.fixOptions.map((o) => (
              <li key={o.color} className="flex items-center gap-2.5 rounded-lg bg-[#f5f5f5] px-2.5 py-1.5">
                <span aria-hidden className="size-6 shrink-0 rounded-md" style={{ background: o.color }} />
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 leading-[1.5]">
                  <b className="text-[13px] font-bold text-black">{o.color}</b>
                  <span className="text-xs text-muted">
                    {o.ratio} · {o.label}
                  </span>
                </span>
                <CopyButton text={o.color} what={o.color} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 해당 요소 */}
      <section className={`${card} gap-1 leading-[1.5]`} aria-labelledby="elements-title">
        <h3 id="elements-title" className="text-[13px] font-bold text-black">
          해당 요소 {issue.selectors.length}개
        </h3>
        <ul className="flex flex-col">
          {issue.selectors.map((sel) => {
            const inCapture = overlays.some((o) => o.selector === sel && o.issueId === issue.id)
            const open = openHtml === sel
            return (
              <li key={sel} className="flex flex-col py-[3px] text-xs">
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate font-noto font-medium text-black">{sel}</code>
                  {inCapture ? (
                    <button type="button" onClick={() => onLocate(sel)} className="shrink-0 rounded px-1 text-[#175fc2] hover:underline">
                      위치 보기<span className="sr-only"> ({sel})</span>
                    </button>
                  ) : (
                    <span className="flex shrink-0 items-center gap-1 text-muted">
                      캡처 영역 밖 ·
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpenHtml(open ? null : sel)}
                        className="rounded px-0.5 text-muted underline hover:text-black"
                      >
                        HTML 보기<span className="sr-only"> ({sel})</span>
                      </button>
                    </span>
                  )}
                </div>
                {open && (
                  <pre className="mt-1 overflow-x-auto rounded-md bg-[#1f1f1f] px-2.5 py-1.5 text-[11px] text-[#d9d9d9]">
                    <code>{selectorToHtml(sel)}</code>
                  </pre>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {/* 개발자에게 전달할 코드 */}
      {issue.fixCode && (
        <section className={`${card} gap-2`} aria-labelledby="dev-code-title">
          <div className="flex items-center leading-[1.5]">
            <h3 id="dev-code-title" className="flex-1 text-[13px] font-bold text-black">
              개발자에게 전달할 코드
            </h3>
            <CopyButton text={issue.fixCode} what="개발자용 코드" />
          </div>
          <pre className="overflow-x-auto rounded-lg bg-[#1f1f1f] px-3 py-2 text-xs leading-[1.5] whitespace-pre-wrap text-[#d9d9d9]">
            <code>{issue.fixCode}</code>
          </pre>
        </section>
      )}

      <div className="min-h-4 flex-1" />

      <p role="status" className="text-xs font-medium text-success empty:hidden">
        {notice}
      </p>
      <div className="flex flex-wrap gap-2">
        <Popover.Root open={assignOpen} onOpenChange={setAssignOpen}>
          <Popover.Trigger className="rounded-full border border-ext-line bg-white px-4 py-2.5 text-sm leading-[1.4] font-bold text-black hover:bg-web-chip">
            담당자 지정
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content side="top" align="start" sideOffset={8} className="z-50 w-[240px] rounded-xl border border-ext-line bg-white p-2 font-noto shadow-[0_6px_18px_rgba(0,0,0,0.12)]">
              <p id="assign-title" className="px-2 py-1.5 text-xs font-bold text-muted">
                담당자 고르기
              </p>
              <ul aria-labelledby="assign-title" className="flex max-h-[260px] flex-col overflow-y-auto">
                {members.map((m) => {
                  const current = m.id === issue.assigneeId
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        aria-pressed={current}
                        onClick={() => assign(m.id)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-web-chip aria-pressed:bg-web-chip"
                      >
                        <span aria-hidden className="flex size-6 items-center justify-center rounded-full bg-avatar text-[11px] font-bold text-muted">
                          {m.initial}
                        </span>
                        <span className="flex-1">{m.name}</span>
                        <span className="text-xs text-muted">{TEAM_LABEL[m.team]}</span>
                        {current && <span className="text-xs font-medium text-success">현재</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        {resolved ? (
          <>
            <span className="flex items-center gap-1.5 rounded-full bg-success-bg px-3.5 py-2.5 text-sm leading-[1.4] font-bold text-success">
              <img src={tagSuccess} alt="" width={14} height={14} />
              해결됨
            </span>
            <button
              type="button"
              onClick={onReopen}
              className="rounded-full border border-ext-line bg-white px-4 py-2.5 text-sm leading-[1.4] font-bold text-black hover:bg-web-chip"
            >
              되돌리기<span className="sr-only"> — 해결되지 않은 상태로</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onResolve}
            className="rounded-full bg-black px-4 py-2.5 text-sm leading-[1.4] font-bold text-white hover:bg-ink-3"
          >
            해결됨으로 표시
          </button>
        )}
      </div>
    </aside>
  )
}

/** "span.footer-note" → <span class="footer-note">…</span> (캡처 밖 요소 미리보기용) */
function selectorToHtml(sel: string) {
  const m = sel.match(/^([a-z0-9]+)?(?:#([\w-]+))?(?:\.([\w-]+))?/i)
  const tag = m?.[1] || 'div'
  const id = m?.[2] ? ` id="${m[2]}"` : ''
  const cls = m?.[3] ? ` class="${m[3]}"` : ''
  return `<${tag}${id}${cls}>…</${tag}>`
}
