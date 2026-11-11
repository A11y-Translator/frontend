// Figma: 컴포넌트 Frame 7282 (315:6689) — 버전 관리 목록 한 줄: 버전 N · 남은 코멘트 · 날짜
// 한 번 클릭 = 선택, 더블클릭 = 그 버전의 접근성 검사 화면으로.
// 키보드: Enter/Space 로 선택 → 선택된 행에서 한 번 더 누르면 이동 (e.detail 0 = 키보드)
import { useNavigate } from 'react-router-dom'
import { DEFAULT_PROJECT_ID } from '@/shared/mocks/scan'

interface VersionRowProps {
  no: number
  remainingComments: number
  date: string
  current?: boolean
  selected?: boolean
  onSelect?: () => void
  /** 도움말 문구 id (aria-describedby) */
  hintId?: string
}

export function VersionRow({ no, remainingComments, date, current, selected = false, onSelect, hintId }: VersionRowProps) {
  const navigate = useNavigate()
  const open = () => navigate(`/projects/${DEFAULT_PROJECT_ID}/inspection${current ? '' : `?v=${no}`}`)
  return (
    <li className="border-b border-[#dadada] last:border-b-0">
      <button
        type="button"
        aria-pressed={selected}
        aria-describedby={hintId}
        onClick={(e) => {
          if (e.detail === 0 && selected) return open()
          onSelect?.()
        }}
        onDoubleClick={open}
        className={`flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left leading-[1.45] whitespace-nowrap -outline-offset-2 ${
          selected ? 'bg-web-chip' : 'hover:bg-web-chip/60'
        }`}
      >
        <span className="flex items-center gap-4 font-medium">
          <span className="text-base text-black">버전 {no}</span>
          <span className="text-xs text-muted">남은 코멘트 {remainingComments}개</span>
          {current && <span className="rounded-full bg-success-bg px-2 py-0.5 text-[11px] font-semibold text-success">현재 작업 중</span>}
        </span>
        <span className="text-xs text-black">{date}</span>
      </button>
    </li>
  )
}
