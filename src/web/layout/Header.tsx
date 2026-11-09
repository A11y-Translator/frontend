// Figma: 컴포넌트 / Header (280:1682)
// "웹 상단 컨텍스트 바: 프로젝트·버전 전환, 검사 상태, 크롬에서 열기. 홈/설정에서는 Show context 끄기."
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import iconBack from '@/web/assets/icon-back.svg'
import statusDot from '@/web/assets/status-dot.svg'

interface HeaderProps {
  title?: string
  showContext?: boolean
  project?: string
  version?: string
  status?: string
  /** 오른쪽 끝 영역 (예: 크롬에서 열기 버튼) */
  right?: ReactNode
}

export function Header({
  title = '프로젝트',
  showContext = true,
  project = 'Web A 메인',
  version = '버전 11',
  status = '마지막 검사 10:42 · 이슈 21개',
  right,
}: HeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-web-header-line bg-white px-8 font-pretendard">
      <button type="button" onClick={() => navigate(-1)} aria-label="뒤로 가기" className="flex size-6 items-center justify-center rounded">
        <img src={iconBack} alt="" width={24} height={24} />
      </button>
      <span className="text-base font-medium text-black">{title}</span>
      {showContext && (
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <nav aria-label="현재 위치" className="flex items-center gap-2">
            <span className="rounded-lg bg-web-chip py-[5px] pr-2 pl-2.5 text-sm font-semibold text-ink-2">{project}</span>
            <span aria-hidden className="text-sm text-[#a3a8b0]">›</span>
            <button type="button" className="flex items-center gap-1.5 rounded-lg bg-web-chip py-[5px] pr-2 pl-2.5 text-sm font-semibold text-ink-2">
              {version}
              <span aria-hidden className="text-[11px] font-normal text-[#626873]">▾</span>
              <span className="sr-only">버전 바꾸기</span>
            </button>
          </nav>
          <p className="flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-2 text-xs font-medium text-success">
            <img src={statusDot} alt="" width={6} height={6} />
            {status}
          </p>
        </div>
      )}
      {!showContext && <div className="flex-1" />}
      {right}
    </header>
  )
}
