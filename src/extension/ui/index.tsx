// 확장 공통 부품 — Figma ext/ 컴포넌트 (모든 패널 화면에서 반복되는 것만 여기에 둡니다)
//  ext/Panel Header (335:7614) · ext/Severity (335:7591) · ext/Button (335:7648) · ext/Issue Card (335:7635)
import { useContext, type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react'
import { PanelContext } from '@/extension/panelNav'
import type { Issue, Severity as SeverityLevel } from '@/shared/api/types'
import { SeverityChip } from '@/shared/ui/SeverityChip'
import iconComment from '@/extension/assets/icon-comment.svg'
import iconSettings from '@/extension/assets/icon-settings.svg'
import iconGlobe from '@/extension/assets/icon-globe.svg'

export { ContrastOptionGroup } from './ContrastOptionGroup'
export { CodeCopy } from './CodeCopy'

/* ───────── 패널 틀 ───────── */

/** 사이드 패널 바깥 틀. 실제 확장에서는 너비가 바뀔 수 있으므로 w-full 로 두고 데모에서만 360px 로 감쌉니다. */
export function PanelFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex h-full w-full flex-col overflow-hidden bg-ext-bg font-noto text-black ${className}`}>
      {children}
    </div>
  )
}

export function PanelBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 ${className}`}>{children}</div>
}

/**
 * 하단 버튼 영역.
 *  - bar: 02 결과 화면처럼 위쪽 구분선 + 왼쪽 정렬
 *  - actions: 03·04·07 처럼 구분선 없이 오른쪽 정렬
 */
export function PanelFooter({ children, variant = 'bar' }: { children: ReactNode; variant?: 'bar' | 'actions' }) {
  const look = variant === 'bar' ? 'border-t border-ext-line py-3' : 'justify-end pt-3 pb-4'
  return <div className={`flex shrink-0 flex-wrap gap-2 bg-white px-4 ${look}`}>{children}</div>
}

/** 패널 본문의 흰 카드 (03·04·07 공통) */
export function PanelCard({ children, className = '', as: Tag = 'section', ...rest }: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div'
  'aria-labelledby'?: string
}) {
  return (
    <Tag className={`flex w-full shrink-0 flex-col gap-2.5 rounded-xl border border-ext-frame bg-white p-4 ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

/** 안내 박스 — info(파랑) / success(초록) */
export function Notice({ children, tone = 'info', className = '' }: { children: ReactNode; tone?: 'info' | 'success'; className?: string }) {
  const look = tone === 'info' ? 'bg-[#edf4ff] text-[#175fc2]' : 'bg-success-bg text-success font-medium'
  return <p className={`w-full shrink-0 rounded-lg px-3 py-2.5 text-xs leading-[1.5] ${look} ${className}`}>{children}</p>
}

/* ───────── ext/Panel Header ───────── */

interface PanelHeaderProps {
  domain?: string
  showSiteRow?: boolean
  overlay?: boolean
  onOverlayChange?: (on: boolean) => void
}

export function PanelHeader({ domain = 'webA.github.io/A11y', showSiteRow = true, overlay, onOverlayChange }: PanelHeaderProps) {
  // props 를 안 넘기면 PanelApp 의 오버레이 상태를 그대로 사용
  const nav = useContext(PanelContext)
  const overlayOn = overlay ?? nav?.overlay ?? true
  const setOverlay = onOverlayChange ?? nav?.setOverlay
  return (
    <header className="flex shrink-0 flex-col gap-3 border-b border-ext-line bg-white px-4 pt-3.5 pb-3">
      <div className="flex items-center gap-2">
        <span aria-hidden className="flex size-6 items-center justify-center rounded-md bg-black text-[13px] font-bold text-white">A</span>
        <h1 className="text-[15px] leading-[1.4] font-bold">A11y Translator</h1>
        <div className="flex-1" />
        <button type="button" aria-label="설정" className="flex size-5 items-center justify-center rounded">
          <img src={iconSettings} alt="" width={20} height={20} />
        </button>
        <span role="img" aria-label="김혜승 계정" className="flex size-6 items-center justify-center rounded-full bg-ext-line text-[11px] font-medium">
          <span aria-hidden>혜</span>
        </span>
      </div>
      {showSiteRow && (
        <div className="flex items-center gap-2">
          <p className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-ext-soft px-2.5 py-1.5 text-[13px] leading-[1.4] font-medium">
            <img src={iconGlobe} alt="" width={14} height={14} />
            <span className="sr-only">검사 중인 페이지: </span>
            <span className="truncate">{domain}</span>
          </p>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <span aria-hidden>오버레이</span>
            <Switch checked={overlayOn} onChange={setOverlay} label="페이지에 오버레이 표시" />
          </div>
        </div>
      )}
    </header>
  )
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange?: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
      className={`relative h-[18px] w-8 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-[#c4c4c4]'}`}
    >
      <span className={`absolute top-0.5 size-3.5 rounded-full bg-white transition-all ${checked ? 'left-4' : 'left-0.5'}`} />
    </button>
  )
}

/* ───────── ext/Severity ───────── */
// "색만으로 구분하지 않도록 아이콘 모양+텍스트를 함께 사용"

export function Severity({ level }: { level: SeverityLevel }) {
  return <SeverityChip severity={level} />
}

/* ───────── ext/Button ───────── */

interface ExtButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  block?: boolean
}

const BUTTON_LOOK = {
  // 비활성 회색(#757575)도 흰 글자 4.5:1 이상 유지
  primary: 'bg-black text-white disabled:cursor-not-allowed disabled:bg-[#757575]',
  secondary: 'border border-ext-line bg-white text-black hover:bg-ext-soft disabled:cursor-not-allowed disabled:text-muted',
  ghost: 'bg-ext-soft text-black hover:bg-ext-line',
}

export function ExtButton({ variant = 'primary', block, className = '', ...rest }: ExtButtonProps) {
  const look = BUTTON_LOOK[variant]
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm leading-[1.4] font-bold whitespace-nowrap ${look} ${block ? 'flex-1' : ''} ${className}`}
      {...rest}
    />
  )
}

/* ───────── ext/Issue Card ───────── */
// "클릭 시 상세 화면으로 이동 + 페이지의 해당 요소로 스크롤/강조"

interface IssueCardProps {
  issue: Issue
  ref?: Ref<HTMLButtonElement>
  selected?: boolean
  onSelect?: () => void
  onHover?: (hovering: boolean) => void
}

export function IssueCard({ issue, ref, selected, onSelect, onHover }: IssueCardProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onSelect}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onFocus={() => onHover?.(true)}
      onBlur={() => onHover?.(false)}
      aria-current={selected ? 'true' : undefined}
      className={`flex w-full flex-col items-start gap-2 rounded-xl bg-white text-left hover:border-accent ${selected ? 'border-2 border-accent px-[15px] py-[13px]' : 'border border-ext-line px-4 py-3.5'}`}
    >
      <span className="flex w-full items-center gap-2">
        <Severity level={issue.severity} />
        <span className="text-xs leading-[1.4] font-medium text-muted">{issue.category}</span>
        <span className="flex-1" />
        <span className="text-xs leading-[1.4] text-muted">요소 {issue.elements}개</span>
      </span>
      <span className="text-[15px] leading-[1.4] font-bold">{issue.title}</span>
      <span className="text-[13px] leading-[1.4] text-muted">{issue.impact}</span>
      {issue.comments > 0 && (
        <span className="flex items-center gap-1 text-xs leading-[1.4] text-muted">
          <img src={iconComment} alt="" width={14} height={14} />
          코멘트 {issue.comments}
        </span>
      )}
    </button>
  )
}
