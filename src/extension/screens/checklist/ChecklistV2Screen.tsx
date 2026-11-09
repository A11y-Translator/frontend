// 임시: 팀이 v1/v2 결정 후 하나만 남기고 삭제
//
// sidebar/checklist v2 (Figma 566:2480 · 펼침 566:2564 수정 추천 · 566:2833 담당자 변경)
// v2 의 특징 (v1 과 다른 점)
//  - 요약: 가운데 정렬 큰 카드 (체크 아이콘 배지 + 은은한 빛 배경), "내 체크리스트 1 / 3", 검은 진행 막대. "재검사" 링크 없음
//  - 탭: 알약(pill) 세그먼트
//  - 항목: 테두리 없는 둥근 카드 + 그림자, 앞에 원형 아이콘 배지(✕ 치명·심각 / 시계 보통·경미 / ✓ 해결),
//          심각도는 칩 대신 색 글자("치명 · 색 대비 · 요소 3개"), 해결되면 심각도 자리에 "해결됨"
//  - 펼침(내 업무): "✧ 추천 수정 · 배경 유지" + 추천 색 + 코드 + [다음 이슈 | 수정안 저장] + 아래 "내 업무가 아닌가요? 담당자 변경 →"
//  - 펼침(내 업무 아님): 가운데 ! 아이콘 + "내 업무가 아니에요" 제목 + 설명 문장 + 한 줄 추천 수정(보기) + 담당자 변경 패널
//  - 하단: 결과 저장(회색 알약) / 팀에 공유(검정 알약) — 반반 꽉 채움
import { useState } from 'react'
import { memberById } from '@/shared/mocks'
import { SEVERITY_LABEL, TEAM_LABEL, type Issue, type Severity } from '@/shared/api/types'
import { PanelFrame, PanelHeader, PanelBody } from '@/extension/ui'
import { usePanel, useScreenFocus } from '@/extension/panelNav'
import iconCheck from '@/extension/assets/checklist-icon-check.svg'
import iconX from '@/extension/assets/checklist-icon-x.svg'
import iconClock from '@/extension/assets/checklist-icon-clock.svg'
import ChecklistProgressBar from './parts/ChecklistProgressBar'
import ChecklistTabs from './parts/ChecklistTabs'
import ChecklistItemCard from './parts/ChecklistItemCard'
import FixSuggestionPanel from './parts/FixSuggestionPanel'
import AssigneeChangePanel from './parts/AssigneeChangePanel'
import { isDone, isMine, suggestionText, useChecklistData, type ChecklistTab } from './parts/checklistModel'

// v2 심각도 글자색 (Figma 값). ⚠ 치명 #E5566A·보통 #7B61E8 은 흰 배경 11px 기준 4.5:1 미달 — 결정 시 조정 필요
const SEV_TEXT: Record<Severity, string> = {
  critical: 'text-[#e5566a]',
  serious: 'text-[#e5566a]',
  moderate: 'text-[#7b61e8]',
  minor: 'text-[#7b61e8]',
}
const CARD = 'rounded-[20px] bg-white p-3.5 shadow-[0_8px_24px_rgba(26,26,38,0.06)]'
const PILL = 'flex-1 rounded-full px-[18px] py-[11px] text-[13px] leading-[1.5] font-bold'

export default function ChecklistV2Screen() {
  const { go } = usePanel()
  const data = useChecklistData()
  const titleRef = useScreenFocus<HTMLHeadingElement>()
  const [tab, setTab] = useState<ChecklistTab>('mine')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <PanelFrame>
      <PanelHeader />
      <PanelBody className="gap-2.5 bg-[#f1f2f4] p-3.5">
        <button type="button" onClick={() => go({ name: 'result' })} className="self-start rounded text-xs text-muted hover:text-ink-2">
          <span aria-hidden>← </span>검사 결과
        </button>

        {/* 진행 헤더 (v2 배치) */}
        <section
          aria-labelledby="checklist-title"
          className="relative flex w-full shrink-0 flex-col items-center gap-1.5 overflow-hidden rounded-[22px] bg-white px-4 pt-[22px] pb-[18px] shadow-[0_8px_24px_rgba(26,26,38,0.06)]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 100px 55px at 25% 0%, rgb(155 227 181 / 0.35), transparent), radial-gradient(ellipse 100px 55px at 75% 0%, rgb(191 216 255 / 0.35), transparent)',
          }}
        >
          <span aria-hidden className="flex size-11 items-center justify-center rounded-full border border-[#f0f1f3] bg-white shadow-[0_4px_16px_rgba(26,26,38,0.08)]">
            <img src={iconCheck} alt="" width={24} height={24} />
          </span>
          <h2 id="checklist-title" ref={titleRef} tabIndex={-1} className="text-base leading-[1.5] font-bold text-ink-2">
            내 체크리스트 <span className="sr-only">완료 </span>
            {data.mineDone} / {data.counts.mine}
          </h2>
          <p className="text-center text-xs leading-[1.5] text-muted">고친 항목은 다시 검사하면 자동으로 체크돼요</p>
          <ChecklistProgressBar done={data.mineDone} total={data.counts.mine} barClassName="bg-ink-2" trackClassName="bg-[#eef0f2]" />
        </section>

        <ChecklistTabs
          value={tab}
          onChange={(t) => { setTab(t); setExpandedId(null) }}
          counts={data.counts}
          listClassName="gap-1 rounded-full bg-[#e6e7ea] p-1"
          triggerClassName="rounded-full py-[7px] font-medium text-muted data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-ink-2 data-[state=active]:shadow-[0_2px_8px_rgba(26,26,38,0.06)]"
        >
          {(t) => {
            const list = data.lists[t]
            return (
              <ul className="flex flex-col gap-2.5">
                {list.map((issue, idx) => {
                  const next = list.slice(idx + 1).find((i) => !isDone(i))
                  return (
                    <ChecklistItemCard
                      key={issue.id}
                      issue={issue}
                      expanded={expandedId === issue.id}
                      onToggle={() => setExpandedId((id) => (id === issue.id ? null : issue.id))}
                      showDoneLine={false}
                      className={CARD}
                      expandedClassName={isMine(issue) ? 'bg-linear-to-b from-[#f3f0ff] to-white to-30%' : 'bg-linear-to-b from-[#fff4e8] to-white to-30%'}
                      leading={<IconBadge issue={issue} />}
                      meta={
                        <>
                          <span className={`font-bold ${isDone(issue) ? 'text-success' : SEV_TEXT[issue.severity]}`}>
                            {isDone(issue) ? '해결됨' : SEVERITY_LABEL[issue.severity]}
                          </span>
                          <span className="text-muted">
                            · {issue.category} · 요소 {issue.elements}개
                          </span>
                        </>
                      }
                    >
                      <ExpandedBodyV2 issue={issue} onNext={next ? () => setExpandedId(next.id) : undefined} />
                    </ChecklistItemCard>
                  )
                })}
              </ul>
            )
          }}
        </ChecklistTabs>
      </PanelBody>
      <div className="flex shrink-0 gap-2 bg-white px-3.5 pt-3 pb-4">
        <button type="button" onClick={() => go({ name: 'save' })} className={`${PILL} bg-[#f1f2f4] text-ink-2 hover:bg-ext-line`}>결과 저장</button>
        <button type="button" onClick={() => go({ name: 'save' })} className={`${PILL} bg-ink-2 text-white`}>팀에 공유</button>
      </div>
    </PanelFrame>
  )
}

/** v2 앞쪽 원형 아이콘 배지 (장식 — 상태는 meta 글자로 전달) */
function IconBadge({ issue }: { issue: Issue }) {
  const icon = isDone(issue) ? iconCheck : issue.severity === 'critical' || issue.severity === 'serious' ? iconX : iconClock
  return (
    <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#f0f1f3] bg-white shadow-[0_4px_16px_rgba(26,26,38,0.08)]">
      <img src={icon} alt="" width={20} height={20} />
    </span>
  )
}

/** v2 펼침 내용: 내 업무면 추천 수정, 아니면 "내 업무가 아니에요" + 담당자 변경 */
function ExpandedBodyV2({ issue, onNext }: { issue: Issue; onNext?: () => void }) {
  const [mode, setMode] = useState<'fix' | 'assignee'>(isMine(issue) ? 'fix' : 'assignee')
  const [showFix, setShowFix] = useState(false)
  const owner = memberById(issue.assigneeId)

  if (mode === 'fix') {
    return (
      <FixSuggestionPanel
        issue={issue}
        legendPrefix={<span aria-hidden className="mr-1 text-[#7b61e8]">✧</span>}
        actionsStart={
          onNext && (
            <button type="button" onClick={onNext} className={`${PILL} bg-[#f1f2f4] text-ink-2 hover:bg-ext-line`}>
              다음 이슈
            </button>
          )
        }
        below={
          <button type="button" onClick={() => setMode('assignee')} className="self-center rounded text-xs text-muted hover:text-ink-2 hover:underline">
            내 업무가 아닌가요? 담당자 변경 <span aria-hidden>→</span>
          </button>
        }
      />
    )
  }

  return (
    <>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-white text-base font-bold text-[#e8833a] shadow-[0_4px_16px_rgba(26,26,38,0.08)]">!</span>
        <h3 className="text-base leading-[1.5] font-bold text-ink-2">{isMine(issue) ? '담당자를 바꿀까요?' : '내 업무가 아니에요'}</h3>
        <p className="text-xs leading-[1.5] text-muted">
          ‘{issue.title}’는{' '}
          {owner ? (
            <>
              지금 <strong className="font-bold text-[#b45309]">{owner.name} ({TEAM_LABEL[owner.team]})</strong> 담당이에요.
            </>
          ) : (
            '아직 담당자가 없어요.'
          )}{' '}
          담당자를 바꿀까요?
        </p>
      </div>
      <div className="flex flex-col gap-1.5 rounded-xl bg-[#f6f7f9] px-3 py-2.5 text-xs leading-[1.5]">
        <div className="flex items-start gap-2">
          <span aria-hidden className="text-[#7b61e8]">✧</span>
          <p className={`min-w-0 flex-1 text-ink-2 ${showFix ? '' : 'truncate'}`}>추천 수정: {suggestionText(issue)}</p>
          <button type="button" aria-expanded={showFix} onClick={() => setShowFix((v) => !v)} className="shrink-0 rounded font-medium text-[#5b43c9] hover:underline">
            {showFix ? '접기' : '보기'}
          </button>
        </div>
      </div>
      <AssigneeChangePanel issue={issue} />
      {isMine(issue) && (
        <button type="button" onClick={() => setMode('fix')} className="self-center rounded text-xs text-muted hover:underline">
          <span aria-hidden>← </span>추천 수정으로 돌아가기
        </button>
      )}
    </>
  )
}
