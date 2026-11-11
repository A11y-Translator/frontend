// Figma: 컴포넌트 / Header (280:1682)
// "웹 상단 컨텍스트 바: 프로젝트·버전 전환, 검사 상태, 크롬에서 열기. 홈/설정에서는 Show context 끄기."
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { VersionMenuItem } from '@/web/common/useVersionMenu'
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
  /** 있으면 "버전 N ▾" 를 눌러 다른 버전으로 이동 (useVersionMenu) */
  versionMenu?: VersionMenuItem[]
  /** 지금 보고 있는 버전 번호 (메뉴에서 표시) */
  viewingVersion?: number
}

export function Header({
  title = '프로젝트',
  showContext = true,
  project = 'Web A 메인',
  version = '버전 11',
  status = '마지막 검사 10:42 · 이슈 21개',
  right,
  versionMenu,
  viewingVersion,
}: HeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-web-header-line bg-white page-x font-pretendard">
      <button type="button" onClick={() => navigate(-1)} aria-label="뒤로 가기" className="flex size-6 items-center justify-center rounded">
        <img src={iconBack} alt="" width={24} height={24} />
      </button>
      <span className="text-base font-medium text-black">{title}</span>
      {showContext && (
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <nav aria-label="현재 위치" className="flex items-center gap-2">
            <span className="rounded-lg bg-web-chip py-[5px] pr-2 pl-2.5 text-sm font-semibold text-ink-2">{project}</span>
            <span aria-hidden className="text-sm text-[#a3a8b0]">›</span>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger className="flex items-center gap-1.5 rounded-lg bg-web-chip py-[5px] pr-2 pl-2.5 text-sm font-semibold text-ink-2 hover:bg-web-line-2 data-[state=open]:bg-web-line-2">
                {version}
                <span aria-hidden className="text-[11px] font-normal text-[#626873]">▾</span>
                <span className="sr-only">, 버전 바꾸기</span>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="start"
                  sideOffset={6}
                  className="z-50 max-h-[320px] min-w-[240px] overflow-y-auto rounded-xl border border-web-line bg-white p-1.5 font-pretendard shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                >
                  <DropdownMenu.Label className="px-2.5 pt-1.5 pb-1 text-xs font-medium text-muted-2">버전 기록</DropdownMenu.Label>
                  {versionMenu?.length ? (
                    versionMenu.map((v) => {
                      const viewing = v.no === viewingVersion
                      return (
                        <DropdownMenu.Item key={v.no} asChild>
                          <Link
                            to={v.to}
                            aria-current={viewing ? 'page' : undefined}
                            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-ink-2 outline-none data-[highlighted]:bg-web-chip aria-[current=page]:bg-web-chip"
                          >
                            <span className="font-semibold">버전 {v.no}</span>
                            {v.latest && <span className="rounded-full bg-success-bg px-1.5 py-px text-[11px] font-medium text-success">최신</span>}
                            <span className="ml-auto text-xs text-muted-2">
                              {v.date} · 이슈 {v.issues}
                            </span>
                            {viewing && <span className="sr-only">(보는 중)</span>}
                          </Link>
                        </DropdownMenu.Item>
                      )
                    })
                  ) : (
                    <p className="px-2.5 py-2 text-sm text-muted-2">아직 검사 기록이 없어요.</p>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
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
