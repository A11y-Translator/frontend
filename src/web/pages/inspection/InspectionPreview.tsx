// Figma: project/inspection 오른쪽 "Preview" (562:2390) — 검사 화면 · 문제 위치
// 페이지 탭(/main /pricing /contact +3) · 오버레이 켜고 끄기 · 선택한 이슈 요약 · 이슈 상세 보기 →
import { useState } from 'react'
import { Link } from 'react-router-dom'
import * as Tabs from '@radix-ui/react-tabs'
import type { Issue } from '@/shared/api/types'
import { MORE_PAGES, PAGES, type OverlayBox } from '@/shared/mocks/scan'
import { contrastSummary, tagKindOf } from '@/web/common/issueHelpers'
import { SiteCapture } from '@/web/common/SiteCapture'
import { StatusTag } from '@/web/common/StatusTag'

interface Props {
  issue: Issue
  page: string
  onPageChange: (page: string) => void
  /** 새 프로젝트: 검사한 페이지 목록 (있으면 +3 접기 없이 이것만 탭으로) */
  pages?: string[]
  overlays?: OverlayBox[]
  /** 실제 페이지 검사의 화면 캡처 (미리보기에 실제 화면) */
  screenshotUrl?: string
}

export function InspectionPreview({ issue, page, onPageChange, pages, overlays, screenshotUrl }: Props) {
  const [overlay, setOverlay] = useState(true)
  // "+3" 을 누르면 나머지 페이지 탭을 펼칩니다
  const [showMore, setShowMore] = useState<boolean>((MORE_PAGES as readonly string[]).includes(page))
  const tabs: string[] = pages ?? (showMore ? [...PAGES, ...MORE_PAGES] : [...PAGES])
  const onIssuePage = issue.page === page

  return (
    <section aria-labelledby="preview-title" className="flex w-[372px] shrink-0 flex-col gap-3 rounded-[10px] border border-[#d9d9d9] bg-white p-[18px]">
      <div className="flex items-center leading-[1.45]">
        <h2 id="preview-title" className="flex-1 text-sm font-bold text-ink-2">
          검사 화면 · 문제 위치
        </h2>
        <button
          type="button"
          aria-pressed={overlay}
          onClick={() => setOverlay((v) => !v)}
          className="rounded px-1 text-xs font-medium text-[#175fc2] hover:underline"
        >
          오버레이 {overlay ? '켜짐' : '꺼짐'}
        </button>
      </div>

      <Tabs.Root value={page} onValueChange={onPageChange} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Tabs.List aria-label="검사한 페이지" className="flex flex-wrap gap-1.5">
            {tabs.map((p) => (
              <Tabs.Trigger
                key={p}
                value={p}
                className="rounded-full border border-[#d9d9d9] bg-white px-3 py-[5px] text-[13px] leading-[1.45] font-medium text-ink-2 hover:bg-web-chip data-[state=active]:border-ink-2 data-[state=active]:bg-ink-2 data-[state=active]:font-bold data-[state=active]:text-white"
              >
                {p}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {!pages && (
          <button
            type="button"
            aria-expanded={showMore}
            onClick={() => {
              // 접을 때 숨겨지는 탭을 보고 있었다면 첫 탭으로
              if (showMore && (MORE_PAGES as readonly string[]).includes(page)) onPageChange(PAGES[0])
              setShowMore(!showMore)
            }}
            className="rounded-full border border-[#d9d9d9] bg-white px-3 py-[5px] text-[13px] leading-[1.45] font-medium text-ink-2 hover:bg-web-chip"
          >
            {showMore ? '접기' : `+${MORE_PAGES.length}`}
            <span className="sr-only">{showMore ? ' 나머지 페이지 숨기기' : ' 페이지 더 보기'}</span>
          </button>
          )}
        </div>
        {tabs.map((p) => (
          <Tabs.Content key={p} value={p} className="overflow-hidden rounded-lg border border-[#ececec] bg-[#f3f4f6]">
            {/* 디자인: 캡처 위쪽 196px 만 보여줌 */}
            <div className="h-[196px] overflow-hidden">
              <SiteCapture
                page={p}
                label={`${p} 페이지 검사 화면${overlay ? ', 문제 위치 오버레이 표시' : ''}`}
                showOverlay={overlay}
                activeIssueId={issue.id}
                overlays={overlays}
                screenshotUrl={screenshotUrl}
              />
            </div>
          </Tabs.Content>
        ))}
      </Tabs.Root>

      {/* 선택한 이슈 요약 */}
      <div className="flex flex-col gap-1.5 rounded-lg bg-web-chip px-3.5 py-3" aria-live="polite">
        <div className="flex items-center gap-2">
          <StatusTag kind={tagKindOf(issue)} />
          <p className="text-xs leading-[1.45] font-medium text-muted-2">
            #{issue.no} · {contrastSummary(issue)}
          </p>
        </div>
        <p className="text-sm leading-[1.45] font-bold text-ink-2">{issue.title}</p>
        {!onIssuePage && (
          <p className="text-xs text-muted-2">
            이 이슈는 {issue.page} 페이지에 있어요.{' '}
            <button type="button" onClick={() => onPageChange(issue.page)} className="font-medium text-[#175fc2] underline">
              {issue.page} 보기
            </button>
          </p>
        )}
      </div>
      <div className="flex justify-end">
        <Link to={`/issues/${issue.id}`} className="text-[13px] leading-[1.45] font-bold text-[#175fc2] hover:underline">
          이슈 상세 보기 →
        </Link>
      </div>
    </section>
  )
}
