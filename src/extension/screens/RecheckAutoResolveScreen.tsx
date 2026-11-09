// 07 · chrome/recheck-auto-resolve (Figma 550:1562)
// 새로고침(또는 재검사) → actions.recheck() 결과로 "이슈 24 → 21", 내 체크리스트의 자동 해결/남음 표시
import { useAppState } from '@/shared/store'
import { PanelFrame, PanelHeader, PanelBody, PanelFooter, PanelCard, ExtButton, Notice } from '@/extension/ui'
import { usePanel, useScreenFocus } from '@/extension/panelNav'
import { myIssues, remainingCount } from '@/extension/scanStats'

interface Props {
  /** 재검사 직전에 이미 해결돼 있던 이슈 */
  prevResolved: string[]
  auto: boolean
}

export default function RecheckAutoResolveScreen({ prevResolved, auto }: Props) {
  const { issues, currentVersion } = useAppState()
  const { go, recheck } = usePanel()
  const titleRef = useScreenFocus<HTMLHeadingElement>(prevResolved.join(','))

  const prev = new Set(prevResolved)
  const before = remainingCount(issues, prev)
  const after = remainingCount(issues)
  const newlyResolved = issues.filter((i) => i.status === 'resolved' && !prev.has(i.id)).length
  const mine = myIssues(issues)
  const mineDone = mine.filter((i) => i.status === 'resolved').length

  return (
    <PanelFrame>
      <PanelHeader />
      <PanelBody>
        <Notice tone="success">
          {auto ? '페이지가 바뀌어서 자동으로 다시 검사했어요' : '다시 검사했어요'} · 방금
        </Notice>

        <PanelCard aria-labelledby="recheck-title">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="recheck-title" ref={titleRef} tabIndex={-1} className="text-[22px] leading-[1.5] font-bold text-ink-2">
              <span aria-hidden>
                이슈 {before} → {after}
              </span>
              <span className="sr-only">
                이슈가 {before}개에서 {after}개가 됐어요
              </span>
            </h2>
            <span
              className={`rounded-full px-2.5 py-[3px] text-xs leading-[1.5] font-bold ${
                newlyResolved > 0 ? 'bg-success text-white' : 'bg-ext-soft text-muted'
              }`}
            >
              {newlyResolved > 0 ? `${newlyResolved}개 해결` : '새로 해결된 이슈 없음'}
            </span>
          </div>
          <p className="text-xs leading-[1.5] text-muted">버전 {currentVersion - 1} 대비 · 새로 생긴 이슈 0개</p>
        </PanelCard>

        <PanelCard aria-labelledby="my-checklist-title">
          <div className="flex items-center leading-[1.5]">
            <h3 id="my-checklist-title" className="flex-1 text-sm font-bold text-ink-2">내 체크리스트</h3>
            <p className="text-xs font-medium text-muted">
              <span className="sr-only">완료 </span>
              {mineDone} / {mine.length}
            </p>
          </div>
          <ul className="flex flex-col">
            {mine.map((i) => {
              const done = i.status === 'resolved'
              return (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => go({ name: 'fix', issueId: i.id })}
                    className="flex w-full items-center gap-2.5 rounded py-1.5 text-left hover:bg-ext-bg"
                  >
                    <span
                      aria-hidden
                      className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                        done ? 'border-success bg-success text-white' : 'border-ext-frame bg-white'
                      }`}
                    >
                      {done && '✓'}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col leading-[1.5]">
                      <span className={`text-[13px] ${done ? 'text-muted line-through' : 'font-medium text-ink-2'}`}>{i.title}</span>
                      {/* 상태를 글자로도 표시 (색·취소선만으로 구분하지 않기) */}
                      <span className={`text-[11px] ${done ? 'text-success' : 'text-muted'}`}>
                        {i.category} · {done ? (i.autoResolved ? '자동 해결됨' : '해결됨') : '남음'}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </PanelCard>

        <Notice>해결 표시는 직접 하지 않아도 돼요. 다시 검사한 결과로 웹 리포트도 함께 바뀌어요.</Notice>
      </PanelBody>

      <PanelFooter variant="actions">
        <ExtButton variant="secondary" className="mr-auto" onClick={() => go({ name: 'result' })}>목록</ExtButton>
        <ExtButton variant="secondary" onClick={() => recheck(false)}>다시 검사</ExtButton>
        <ExtButton onClick={() => go({ name: 'save' })}>버전 {currentVersion}로 저장</ExtButton>
      </PanelFooter>
    </PanelFrame>
  )
}
