// 임시: 팀이 v1/v2 결정 후 하나만 남기고 삭제
//
// sidebar/checklist v1 (Figma 565:2375 · 펼침 565:2460 수정 추천 · 565:2693 담당자 변경)
// v1 의 특징 (v2 와 다른 점)
//  - 요약: 왼쪽 정렬 카드 한 줄 "내 체크리스트 1 / 3" + 오른쪽 "재검사" 링크, 초록 진행 막대, "이슈 24개 · 오늘 10:42 검사 · …" 메타
//  - 탭: 네모난 세그먼트 (rounded 10/8)
//  - 항목: 테두리 카드, 앞에 체크 원(빈 원/초록 ✓), 심각도는 ext/Severity 칩, 해결되면 제목 아래 "재검사에서 자동 해결됨"
//  - 펼침(내 업무): 회색 박스 안에 추천 색 + 코드 + [담당자 변경 링크 | 수정안 저장]
//  - 펼침(내 업무 아님): 빨간 안내 "내 업무가 아니에요 · 지금 담당: …" + 추천 수정 문구 박스 + "담당자 변경" 제목 + 담당자 변경 패널
//  - 하단: 결과 저장(테두리) / 팀에 공유(검정) — 왼쪽 정렬, 내용 너비
import { useState } from 'react'
import { memberById } from '@/shared/mocks'
import { TEAM_LABEL, type Issue } from '@/shared/api/types'
import { PanelFrame, PanelHeader, PanelBody, ExtButton, Severity } from '@/extension/ui'
import { usePanel, useScreenFocus } from '@/extension/panelNav'
import ChecklistProgressBar from './parts/ChecklistProgressBar'
import ChecklistTabs from './parts/ChecklistTabs'
import ChecklistItemCard from './parts/ChecklistItemCard'
import FixSuggestionPanel from './parts/FixSuggestionPanel'
import AssigneeChangePanel from './parts/AssigneeChangePanel'
import { isDone, isMine, suggestionText, useChecklistData, type ChecklistTab } from './parts/checklistModel'

export default function ChecklistV1Screen() {
  const { go, recheck } = usePanel()
  const data = useChecklistData()
  const titleRef = useScreenFocus<HTMLHeadingElement>()
  const [tab, setTab] = useState<ChecklistTab>('mine')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <PanelFrame>
      <PanelHeader />
      <PanelBody className="gap-2.5 bg-web-chip px-4 py-3.5">
        <button type="button" onClick={() => go({ name: 'result' })} className="self-start rounded text-xs text-muted hover:text-ink-2">
          <span aria-hidden>← </span>검사 결과
        </button>

        {/* 진행 헤더 (v1 배치) */}
        <section aria-labelledby="checklist-title" className="flex w-full shrink-0 flex-col gap-2 rounded-xl border border-ext-frame bg-white px-3.5 py-3">
          <div className="flex items-center gap-1.5 leading-[1.45] font-bold">
            <h2 id="checklist-title" ref={titleRef} tabIndex={-1} className="flex flex-1 items-center gap-1.5 text-sm">
              <span className="text-ink-2">내 체크리스트</span>
              <span className="text-muted">
                <span className="sr-only">완료 </span>
                {data.mineDone} / {data.counts.mine}
              </span>
            </h2>
            <button type="button" onClick={() => recheck(false)} className="rounded text-xs text-[#175fc2] hover:underline">
              재검사
            </button>
          </div>
          <ChecklistProgressBar done={data.mineDone} total={data.counts.mine} barClassName="bg-success" />
          <p className="text-[11px] leading-[1.45] text-muted">
            이슈 {data.total}개 · {data.scannedAt} 검사 · 고친 항목은 재검사로 자동 체크돼요
          </p>
        </section>

        <ChecklistTabs
          value={tab}
          onChange={(t) => { setTab(t); setExpandedId(null) }}
          counts={data.counts}
          listClassName="gap-0.5 rounded-[10px] bg-[#eceef2] p-[3px]"
          triggerClassName="rounded-lg py-1.5 font-medium text-muted data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-ink-2"
        >
          {(t) => (
            <ul className="flex flex-col gap-2.5">
              {data.lists[t].map((issue) => (
                <ChecklistItemCard
                  key={issue.id}
                  issue={issue}
                  expanded={expandedId === issue.id}
                  onToggle={() => setExpandedId((id) => (id === issue.id ? null : issue.id))}
                  className="rounded-xl border border-ext-frame bg-white p-3"
                  expandedClassName="border-[1.5px] border-accent p-[11.5px]"
                  leading={<CheckCircle done={isDone(issue)} />}
                  meta={
                    <>
                      <Severity level={issue.severity} />
                      <span className="text-muted">
                        {issue.category} · 요소 {issue.elements}개
                      </span>
                    </>
                  }
                >
                  <ExpandedBodyV1 issue={issue} />
                </ChecklistItemCard>
              ))}
            </ul>
          )}
        </ChecklistTabs>
      </PanelBody>
      <div className="flex shrink-0 gap-2 bg-white px-4 pt-3 pb-4">
        <ExtButton variant="secondary" onClick={() => go({ name: 'save' })}>결과 저장</ExtButton>
        <ExtButton onClick={() => go({ name: 'save' })}>팀에 공유</ExtButton>
      </div>
    </PanelFrame>
  )
}

/** v1 앞쪽 체크 원 (장식 — 상태는 카드의 글자로 전달) */
function CheckCircle({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[11px] font-bold ${
        done ? 'border-success bg-success text-white' : 'border-ext-frame bg-white'
      }`}
    >
      {done && '✓'}
    </span>
  )
}

/** v1 펼침 내용: 내 업무면 추천 수정, 아니면 담당자 변경 */
function ExpandedBodyV1({ issue }: { issue: Issue }) {
  const [mode, setMode] = useState<'fix' | 'assignee'>(isMine(issue) ? 'fix' : 'assignee')
  const owner = memberById(issue.assigneeId)

  if (mode === 'fix') {
    return (
      <FixSuggestionPanel
        issue={issue}
        className="rounded-[10px] bg-web-chip p-2.5"
        actionsStart={
          <button type="button" onClick={() => setMode('assignee')} className="mr-auto rounded text-[11px] font-medium text-muted hover:text-ink-2 hover:underline">
            내 업무가 아닌가요? 담당자 변경
          </button>
        }
      />
    )
  }

  return (
    <>
      <p className="rounded-lg bg-[#fff1f0] px-2.5 py-2 text-xs leading-[1.45] font-medium text-danger">
        {isMine(issue) ? '담당자를 바꿀까요?' : '내 업무가 아니에요'}
        {' · '}
        {owner ? `지금 담당: ${owner.name} (${TEAM_LABEL[owner.team]})` : '아직 담당자가 없어요'}
      </p>
      <div className="flex flex-col gap-1 rounded-[10px] bg-web-chip p-2.5 text-xs leading-[1.45]">
        <p className="font-bold text-ink-2">추천 수정</p>
        <p className="text-muted">{suggestionText(issue)}</p>
      </div>
      <h3 className="text-xs leading-[1.45] font-bold text-ink-2">담당자 변경</h3>
      <AssigneeChangePanel issue={issue} />
      {isMine(issue) && (
        <button type="button" onClick={() => setMode('fix')} className="self-start rounded text-[11px] text-muted hover:underline">
          <span aria-hidden>← </span>추천 수정으로 돌아가기
        </button>
      )}
    </>
  )
}
