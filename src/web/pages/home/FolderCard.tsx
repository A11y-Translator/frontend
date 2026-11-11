// Figma: 컴포넌트 / Folder Card (555:1576) — State=Default(회색) / Active(파랑, 종이 미리보기 표시)
// Figma 는 270×275 고정 크기지만, 다른 웹 화면과 크기감을 맞추려고 높이 188px 로 비율대로 줄이고, 그리드 폭에 맞게 가로로 늘어나도록 좌우 inset 으로 바꿨습니다.
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import pocket from '@/web/assets/folder-pocket.svg'
import pocketActive from '@/web/assets/folder-pocket-active.svg'
import { EditableTitle } from './EditableTitle'

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
  /** 있으면 제목을 눌러 이름을 바꿀 수 있음 (새 프로젝트 화면) */
  onTitleChange?: (title: string) => void
  className?: string
}

export function FolderCard({ title, status, meta, active = false, preview, to, onTitleChange, className = '' }: FolderCardProps) {
  const frame = `relative block h-[188px] overflow-hidden rounded-[20px] border bg-linear-to-b shadow-[0_6px_18px_rgba(0,0,0,0.06)] ${
    active ? 'border-[#8eb1f5] from-[#5f8fee] to-[#7ba4f2]' : 'border-web-line from-[#f1f2f4] to-[#e8eaed]'
  }`

  const body = (
    <>
      {/* 뒤쪽 종이 */}
      <span
        aria-hidden
        className={`absolute top-3 right-6 left-7 h-[84px] rounded-[10px] ${active ? 'bg-[rgba(159,190,246,0.9)]' : 'bg-[#f7f8f9]'}`}
      />
      {/* 앞쪽 종이 (Active 면 미리보기 글) */}
      <span aria-hidden className="absolute top-5 right-4 left-4 h-[84px] overflow-hidden rounded-lg bg-white">
        {active && preview && (
          <span className="absolute top-2.5 right-3 left-3 text-xs leading-5 whitespace-pre-line text-[#6b6f76]">{preview}</span>
        )}
      </span>
      {/* 앞주머니 */}
      <img src={active ? pocketActive : pocket} alt="" className="absolute top-[40px] right-0 left-[-2px] h-[148px] w-[calc(100%+2px)]" />

      {onTitleChange ? (
        <span className="absolute top-[96px] right-4 left-5 flex">
          <EditableTitle
            value={title}
            onChange={onTitleChange}
            label="프로젝트 이름"
            className={`max-w-full min-w-0 truncate text-lg font-semibold ${active ? 'text-white' : 'text-[#16181c]'}`}
          />
        </span>
      ) : (
        <span
          className={`absolute top-[98px] right-12 left-5 truncate text-lg font-semibold ${active ? 'text-white' : 'text-[#16181c]'}`}
        >
          {title}
        </span>
      )}
      <span className={`absolute top-[126px] right-4 left-5 truncate text-sm font-medium ${active ? 'text-white/90' : 'text-muted-3'}`}>
        {status}
      </span>
      <span className={`absolute top-[152px] right-4 left-5 truncate text-xs ${active ? 'text-white/75' : 'text-muted-2'}`}>
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
    // 이름 편집이 없으면 순수 장식이라 화면낭독기에서 숨깁니다
    <div aria-hidden={onTitleChange ? undefined : true} className={`${frame} ${className}`}>
      {body}
    </div>
  )
}
