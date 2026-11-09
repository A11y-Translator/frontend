// ext/Overlay Marker (335:7588) · ext/Overlay Marker (Selected) (335:7585) · ext/Overlay Tooltip (335:7608)
// 실제 확장의 content script 가 페이지 위에 그리는 것을 흉내 냄: 대상 요소를 감싸서 테두리 + 번호 배지.
// 크기는 감싼 요소에 맞춰 자동으로 맞춰짐 (Figma 의 절대 좌표 대신)
import type { ReactNode } from 'react'
import type { Issue } from '@/shared/api/types'
import { Severity } from '@/extension/ui'

interface Props {
  issue?: Issue
  /** 오버레이 표시 (패널 헤더 스위치 · 해결된 이슈는 숨김) */
  show: boolean
  /** 패널에서 hover/선택된 이슈 */
  emphasized: boolean
  /** 툴팁을 띄울 대표 표시인지 (같은 이슈가 여러 요소에 있을 때 하나만) */
  primary?: boolean
  onHover: (on: boolean) => void
  onOpen: () => void
  className?: string
  children: ReactNode
}

export default function OverlayMarker({ issue, show, emphasized, primary = true, onHover, onOpen, className = '', children }: Props) {
  const visible = show && !!issue
  return (
    <div className={`relative ${className}`} data-issue-marker={visible && primary ? issue?.id : undefined}>
      {children}
      {visible && issue && (
        <>
          <span
            aria-hidden
            className={`pointer-events-none absolute -inset-1.5 z-10 rounded ${
              emphasized
                ? 'border-[3px] border-accent bg-accent/12 shadow-[0_0_0_4px_rgb(48_134_255/0.35)]'
                : 'border-2 border-accent bg-accent/8'
            }`}
          />
          <button
            type="button"
            onClick={onOpen}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
            onFocus={() => onHover(true)}
            onBlur={() => onHover(false)}
            aria-label={`이슈 ${issue.no}: ${issue.title} — 패널에서 자세히 보기`}
            className="absolute -top-[18px] -left-[18px] z-20 flex size-[22px] items-center justify-center rounded-full border-2 border-white bg-accent font-noto text-[11px] leading-none font-bold text-white"
          >
            {issue.no}
          </button>
          {emphasized && primary && (
            <div
              aria-hidden
              className="pointer-events-none absolute top-full left-0 z-30 mt-2.5 flex w-60 flex-col gap-1.5 rounded-lg bg-[#1a1a1a] px-3 py-2.5 font-noto drop-shadow-[0_4px_6px_rgba(0,0,0,0.18)]"
            >
              <span className="flex items-center gap-1.5">
                <Severity level={issue.severity} />
                <span className="text-xs leading-[1.4] font-medium text-placeholder">#{issue.no}</span>
              </span>
              <span className="text-[13px] leading-[1.4] font-bold text-white">{issue.title}</span>
              <span className="text-xs leading-[1.4] font-medium text-[#8cbfff]">패널에서 자세히 보기 →</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
