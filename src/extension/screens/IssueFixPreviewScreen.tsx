// 03 · chrome/issue-fix-preview (Figma 550:1425)
// 이슈 상세 → 페이지에서 미리 고쳐보기(추천 색 선택 = 실제 페이지에 임시 적용) → 수정값 전달(디자이너용/개발자용) → 수정안 저장
import { useAppState, actions } from '@/shared/store'
import { PanelFrame, PanelHeader, PanelBody, PanelFooter, PanelCard, Severity, ExtButton, Notice, ContrastOptionGroup } from '@/extension/ui'
import { usePanel, useScreenFocus } from '@/extension/panelNav'
import { scanStats } from '@/extension/scanStats'
import FixHandoff from './fix/FixHandoff'
import { buildFix } from '@/extension/buildFix'

export default function IssueFixPreviewScreen({ issueId }: { issueId: string }) {
  const state = useAppState()
  const { go } = usePanel()
  const titleRef = useScreenFocus<HTMLHeadingElement>(issueId)

  const { open } = scanStats(state.issues)
  const issue = state.issues.find((i) => i.id === issueId)
  if (!issue) {
    return (
      <PanelFrame>
        <PanelHeader />
        <PanelBody>
          <p className="text-sm">이슈를 찾을 수 없어요.</p>
          <ExtButton variant="secondary" onClick={() => go({ name: 'result' })}>목록으로</ExtButton>
        </PanelBody>
      </PanelFrame>
    )
  }

  // 이전/다음은 목록(남은 이슈) 순서 기준. 이미 해결된 이슈를 보고 있으면 목록 맨 앞 기준
  const idx = open.findIndex((i) => i.id === issueId)
  const prev = idx > 0 ? open[idx - 1] : undefined
  const next = idx >= 0 ? open[idx + 1] : open[0]

  const previewColor = state.previewFix[issue.id]
  const fix = buildFix(issue, previewColor)
  const saved = !!issue.savedFix && issue.savedFix === fix.code
  const backToList = () => go({ name: 'result', selectedId: issue.id })

  return (
    <PanelFrame>
      <PanelHeader />
      <PanelBody>
        <nav aria-label="이슈 이동" className="flex w-full items-center gap-1 text-[13px] leading-[1.5] text-muted">
          <button type="button" onClick={backToList} className="flex-1 rounded text-left font-medium hover:text-ink-2">
            <span aria-hidden>← </span>목록으로
          </button>
          <button
            type="button"
            disabled={!prev}
            onClick={() => prev && go({ name: 'fix', issueId: prev.id })}
            aria-label="이전 이슈"
            className="flex size-6 items-center justify-center rounded hover:bg-ext-soft disabled:opacity-40"
          >
            <span aria-hidden>‹</span>
          </button>
          <span>
            <span className="sr-only">현재 </span>
            {idx >= 0 ? idx + 1 : '–'} / {open.length}
          </span>
          <button
            type="button"
            disabled={!next}
            onClick={() => next && go({ name: 'fix', issueId: next.id })}
            aria-label="다음 이슈"
            className="flex size-6 items-center justify-center rounded hover:bg-ext-soft disabled:opacity-40"
          >
            <span aria-hidden>›</span>
          </button>
        </nav>

        {/* 이슈 설명 */}
        <PanelCard as="div">
          <div className="flex items-center gap-2">
            <Severity level={issue.severity} />
            <span className="text-xs leading-[1.5] text-muted">
              {issue.category} · {issue.wcag}
            </span>
          </div>
          <h2 ref={titleRef} tabIndex={-1} className="text-[17px] leading-[1.5] font-bold text-ink-2">
            {issue.title}
            {issue.status === 'resolved' && <span className="ml-1 text-[13px] text-success">(해결됨)</span>}
          </h2>
          <p className="text-[13px] leading-[1.5] text-muted">{issue.detail ?? issue.impact}</p>
        </PanelCard>

        {/* 페이지에서 미리 고쳐보기 — 색 대비 이슈만 */}
        {issue.fixOptions && (
          <PanelCard as="div">
            <ContrastOptionGroup
              legend="페이지에서 미리 고쳐보기"
              options={issue.fixOptions}
              value={previewColor}
              onChange={(c) => actions.previewFix(issue.id, c)}
              aside={
                previewColor && (
                  <span className="rounded-full bg-[#edf4ff] px-2.5 py-[3px] text-xs leading-[1.5] font-bold whitespace-nowrap text-[#175fc2]">
                    <span aria-hidden>● </span>적용 중
                  </span>
                )
              }
            />
            <div aria-live="polite">
              {previewColor && fix.ratioChange && (
                <Notice tone="success">{fix.ratioChange} 기준 통과 · 페이지에 임시로 적용됐어요</Notice>
              )}
            </div>
          </PanelCard>
        )}

        {/* 수정값 전달 */}
        <PanelCard aria-labelledby="handoff-title">
          <h3 id="handoff-title" className="text-sm leading-[1.5] font-bold text-ink-2">수정값 전달</h3>
          <FixHandoff designer={fix.designer} developer={fix.code} />
        </PanelCard>
      </PanelBody>

      <PanelFooter variant="actions">
        <p aria-live="polite" className="mr-auto self-center text-xs text-success">
          {saved ? '수정안을 저장했어요' : ''}
        </p>
        <ExtButton variant="secondary" disabled={!next} onClick={() => next && go({ name: 'fix', issueId: next.id })}>
          다음 이슈
        </ExtButton>
        <ExtButton disabled={!fix.ready || saved} onClick={() => actions.saveFix(issue.id, fix.code)}>
          {saved ? '저장됨' : '수정안 저장'}
        </ExtButton>
      </PanelFooter>
    </PanelFrame>
  )
}
