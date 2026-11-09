// Figma: 컴포넌트 / Folder Card (555:1576) — State=Default(회색) / Active(파랑, 종이 미리보기 표시)
// Figma 는 270×275 고정 크기지만, 홈이 한 화면(820px)에 들어오도록 높이를 255로 줄이고, 그리드 폭에 맞게 가로로 늘어나도록 좌우 inset 으로 바꿨습니다.
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import pocket from '@/web/assets/folder-pocket.svg'
import pocketActive from '@/web/assets/folder-pocket-active.svg'

interface FolderCardProps {
  title: string
  /** 두 번째 줄 (예: 진행중 / 완료됨) */
  status: string
  /** 세 번째 줄 (예: 최근 수정일 | 26.11.11) */
  meta: ReactNode
  /** Active = 진행 중인 프로젝트 */
  active?: boolean
  /** Active 일 때 종이에 보이는 미리보기 글 */
  preview?: string
  /** 있으면 링크, 없으면 장식용 카드(빈 홈) */
  to?: string
  className?: string
}

export function FolderCard({ title, status, meta, active = false, preview, to, className = '' }: FolderCardProps) {
  const frame = `relative block h-[255px] overflow-hidden rounded-[32px] border bg-linear-to-b shadow-[0_6px_18px_rgba(0,0,0,0.06)] ${
    active ? 'border-[#8eb1f5] from-[#5f8fee] to-[#7ba4f2]' : 'border-web-line from-[#f1f2f4] to-[#e8eaed]'
  }`

  const body = (
    <>
      {/* 뒤쪽 종이 */}
      <span
        aria-hidden
        className={`absolute top-[18px] right-8 left-9 h-[120px] rounded-[14px] ${active ? 'bg-[rgba(159,190,246,0.9)]' : 'bg-[#f7f8f9]'}`}
      />
      {/* 앞쪽 종이 (Active 면 미리보기 글) */}
      <span aria-hidden className="absolute top-[30px] right-5 left-[22px] h-[120px] overflow-hidden rounded-[10px] bg-white">
        {active && preview && (
          <span className="absolute top-3.5 right-4 left-3.5 text-sm leading-[22px] whitespace-pre-line text-[#6b6f76]">{preview}</span>
        )}
      </span>
      {/* 앞주머니 */}
      <img src={active ? pocketActive : pocket} alt="" className="absolute top-[55px] right-0 left-[-2px] h-[200px] w-[calc(100%+2px)]" />

      <span
        className={`absolute top-[146px] right-4 left-[26px] truncate text-2xl font-semibold ${active ? 'text-white' : 'text-[#16181c]'}`}
      >
        {title}
      </span>
      <span className={`absolute top-[184px] right-4 left-[26px] truncate text-[17px] font-medium ${active ? 'text-white/90' : 'text-muted-3'}`}>
        {status}
      </span>
      <span className={`absolute top-[221px] right-4 left-[26px] truncate text-sm ${active ? 'text-white/75' : 'text-muted-2'}`}>
        {meta}
      </span>
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className={`${frame} transition-transform motion-safe:hover:-translate-y-0.5 ${className}`}
      >
        {body}
      </Link>
    )
  }
  return (
    <div aria-hidden className={`${frame} ${className}`}>
      {body}
    </div>
  )
}
