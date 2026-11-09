// 02 · chrome/result (Figma 547:1088)
// 요약(이슈 수·심각도별 개수) → 카테고리 필터 칩 → 이슈 카드 목록 → 하단 "결과 저장 / 팀에 공유"
import { useEffect, useRef, useState } from 'react'
import { useAppState } from '@/shared/store'
import type { Category, Severity as SeverityLevel } from '@/shared/api/types'
import { SEVERITY_LABEL } from '@/shared/api/types'
import { PanelFrame, PanelHeader, PanelBody, PanelFooter, Severity, ExtButton, IssueCard } from '@/extension/ui'
import { usePanel, useScreenFocus } from '@/extension/panelNav'
import { myIssues, scanStats } from '@/extension/scanStats'
import CategoryChips from './result/CategoryChips'

const SEVERITIES: SeverityLevel[] = ['critical', 'serious', 'moderate', 'minor']

export default function ScanResultScreen({ selectedId }: { selectedId?: string }) {
  const { issues } = useAppState()
  const { go, highlight, recheck } = usePanel()
  const stats = scanStats(issues)
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const titleRef = useScreenFocus<HTMLHeadingElement>()
  const selectedRef = useRef<HTMLButtonElement>(null)

  // 상세에서 "목록으로" 돌아오면 방금 본 카드로 포커스 (제목 포커스보다 나중에 실행되도록 이 컴포넌트에서 처리)
  useEffect(() => {
    if (selectedId) selectedRef.current?.focus()
  }, [selectedId])

  const mine = myIssues(issues)
  const mineDone = mine.filter((i) => i.status === 'resolved').length
  const list = filter === 'all' ? stats.open : stats.open.filter((i) => i.category === filter)

  return (
    <PanelFrame>
      <PanelHeader />
      <PanelBody>
        <section aria-labelledby="scan-summary-title" className="flex w-full shrink-0 flex-col gap-3 rounded-xl border border-ext-line bg-white p-4">
          <h2 id="scan-summary-title" ref={titleRef} tabIndex={-1} className="flex items-baseline gap-1.5 text-[15px] leading-[1.5] font-bold">
            이슈 <span className="text-[28px]">{stats.total}</span> 개 발견
          </h2>
          <ul aria-label="심각도별 이슈 수" className="grid grid-cols-4 gap-1.5">
            {SEVERITIES.map((s) => (
              <li key={s} className="flex min-w-0 flex-col items-center gap-1 rounded-lg bg-ext-bg py-2">
                <Severity level={s} />
                <span className="text-[15px] leading-[1.5] font-bold">
                  {stats.bySeverity[s]}
                  <span className="sr-only">개 ({SEVERITY_LABEL[s]})</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1.5 text-xs leading-[1.5]">
            <p className="min-w-0 flex-1 text-muted">{stats.scannedAt} 검사 · 페이지가 바뀌었다면 다시 검사해 주세요</p>
            {/* 디자인 색(#3086FF)은 흰 배경 3.4:1 — 굵은 글자로 유지, 토큰 조정은 팀 확인 필요 */}
            <button type="button" onClick={() => recheck(false)} className="shrink-0 rounded font-bold text-accent hover:underline">
              재검사
            </button>
          </div>
        </section>

        {/* 내 체크리스트 진입점 (sidebar/checklist v1/v2 — 디자인 미정이라 요약 바로 아래 한 줄로 둠) */}
        <button
          type="button"
          onClick={() => go({ name: 'checklist' })}
          className="flex w-full shrink-0 items-center gap-2 rounded-xl border border-ext-line bg-white px-4 py-3 text-left hover:border-accent"
        >
          <span className="text-sm leading-[1.4] font-bold">내 체크리스트</span>
          <span className="text-sm leading-[1.4] font-bold text-muted">
            <span className="sr-only">완료 </span>
            {mineDone} / {mine.length}
          </span>
          <span className="flex-1" />
          <span className="text-xs font-bold text-[#175fc2]">
            보기 <span aria-hidden>→</span>
          </span>
        </button>

        <CategoryChips
          total={stats.total}
          categories={stats.byCategory}
          value={filter}
          onChange={setFilter}
        />

        <section aria-label="이슈 목록" className="w-full">
          {list.length === 0 ? (
            <p className="rounded-xl border border-ext-line bg-white p-4 text-[13px] text-muted">
              이 분류에 남은 이슈가 없어요.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {list.map((issue) => (
                <li key={issue.id}>
                  <IssueCard
                    ref={issue.id === selectedId ? selectedRef : undefined}
                    issue={issue}
                    selected={issue.id === selectedId}
                    onHover={(on) => highlight(on ? issue.id : null)}
                    onSelect={() => go({ name: 'fix', issueId: issue.id })}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </PanelBody>
      <PanelFooter>
        <ExtButton variant="secondary" onClick={() => go({ name: 'save' })}>결과 저장</ExtButton>
        <ExtButton onClick={() => go({ name: 'save' })}>팀에 공유</ExtButton>
      </PanelFooter>
    </PanelFrame>
  )
}
