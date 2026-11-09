// 펼친 카드의 "추천 수정" (v1·v2 공통)
// - 색 대비 이슈: 추천 색 radio group → actions.previewFix (페이지에 바로 적용) + 코드 복사 + 수정안 저장
// - 그 외: 수정 안내 문구 + 코드 복사 + 수정안 저장
// 저장 버튼 옆/아래에 붙는 버튼·링크는 버전마다 달라서 slot 으로 받음
import type { ReactNode } from 'react'
import { useAppState, actions } from '@/shared/store'
import type { Issue } from '@/shared/api/types'
import { ContrastOptionGroup, CodeCopy, ExtButton } from '@/extension/ui'
import { buildFix } from '@/extension/buildFix'

interface Props {
  issue: Issue
  /** 제목 앞 장식 (v2: ✧) */
  legendPrefix?: ReactNode
  /** 저장 버튼 왼쪽 (v1: 담당자 변경 링크 / v2: 다음 이슈 버튼) */
  actionsStart?: ReactNode
  /** 버튼 줄 아래 (v2: 담당자 변경 링크) */
  below?: ReactNode
  className?: string
}

export default function FixSuggestionPanel({ issue, legendPrefix, actionsStart, below, className = '' }: Props) {
  const { previewFix } = useAppState()
  const color = previewFix[issue.id]
  const fix = buildFix(issue, color)
  const saved = !!issue.savedFix && issue.savedFix === fix.code
  const legend = (
    <>
      {legendPrefix}
      {issue.fixOptions ? '추천 수정 · 배경 유지' : '추천 수정'}
    </>
  )

  return (
    <div className="flex w-full flex-col gap-2.5">
      <div className={`flex w-full flex-col gap-1.5 ${className}`}>
        {issue.fixOptions ? (
          <ContrastOptionGroup
            compact
            legend={legend}
            options={issue.fixOptions}
            value={color}
            onChange={(c) => actions.previewFix(issue.id, c)}
            aside={color && <span className="text-[11px] leading-[1.45] font-bold whitespace-nowrap text-[#175fc2]">페이지에 적용 중</span>}
          />
        ) : (
          <>
            <p className="text-xs leading-[1.45] font-bold text-ink-2">{legend}</p>
            <p className="text-xs leading-[1.45] text-muted">{fix.designer}</p>
          </>
        )}
      </div>
      <CodeCopy text={fix.code} label="수정 코드" />
      <div className="flex w-full flex-wrap items-center justify-end gap-2">
        {actionsStart}
        <ExtButton disabled={!fix.ready || saved} onClick={() => actions.saveFix(issue.id, fix.code)}>
          {saved ? '저장됨' : '수정안 저장'}
        </ExtButton>
      </div>
      <p aria-live="polite" className={saved ? 'text-right text-[11px] text-success' : 'sr-only'}>
        {saved ? '수정안을 저장했어요. 다시 검사하면 자동으로 체크돼요.' : ''}
      </p>
      {below}
    </div>
  )
}
