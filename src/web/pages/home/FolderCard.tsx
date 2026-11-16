// Figma: 컴포넌트 / Folder Card (555:1576) — State=Default(회색) / Active(파랑, 종이 미리보기 표시)
// 피그마 비율(270×275)을 그대로 지키고, 칸 폭에 따라 카드 전체가 같은 비율로 커지고 작아져요 (안쪽 위치는 %, 글자는 카드 폭 기준 cqw).
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
  // @container/folder: 안쪽 글자·위치를 카드 폭 기준(cqw)으로 맞춰, 카드가 커지고 작아져도 피그마 비율이 그대로 유지돼요
  const frame = `@container/folder relative block aspect-[270/275] overflow-hidden rounded-[min(32px,12cqw)] border bg-linear-to-b shadow-[0_6px_18px_rgba(0,0,0,0.06)] ${
    active ? 'border-[#8eb1f5] from-[#5f8fee] to-[#7ba4f2]' : 'border-web-line from-[#f1f2f4] to-[#e8eaed]'
  }`
  const titleLook = `max-w-full min-w-0 truncate text-[clamp(15px,8.9cqw,24px)] leading-[1.2] font-semibold ${active ? 'text-white' : 'text-[#16181c]'}`

  const body = (
    <>
      {/* 뒤쪽 종이 (피그마 37,19 · 200×120) */}
      <span
        aria-hidden
        className={`absolute top-[6.9%] left-[13.7%] h-[43.6%] w-[74.1%] rounded-[min(14px,5cqw)] ${active ? 'bg-[rgba(159,190,246,0.9)]' : 'bg-[#f7f8f9]'}`}
      />
      {/* 앞쪽 종이 (피그마 23,31 · 226×120) — Active 면 미리보기 글 */}
      <span aria-hidden className="absolute top-[11.3%] left-[8.5%] h-[43.6%] w-[83.7%] overflow-hidden rounded-[min(10px,3.7cqw)] bg-white">
        {active && preview && (
          <span className="absolute top-[5.2cqw] right-[5.2cqw] left-[5.2cqw] text-[clamp(11px,5.2cqw,14px)] leading-[1.55] whitespace-pre-line text-[#6b6f76]">
            {preview}
          </span>
        )}
      </span>
      {/* 앞주머니 (피그마 -1,74 · 270×200) */}
      <img src={active ? pocketActive : pocket} alt="" className="absolute top-[26.9%] left-[-1px] h-[72.7%] w-[calc(100%+2px)] max-w-none" />

      {/* 이름 (24px · 위에서 165) · 상태 (17px · 203) · 날짜 (14px · 241) */}
      {onTitleChange ? (
        <span className="absolute top-[58.5%] right-[8%] left-[10%] flex">
          <EditableTitle value={title} onChange={onTitleChange} label="프로젝트 이름" className={titleLook} />
        </span>
      ) : (
        <span className={`absolute top-[60%] right-[18%] left-[10%] block ${titleLook}`}>{title}</span>
      )}
      <span className={`absolute top-[73.8%] right-[8%] left-[10%] truncate text-[clamp(13px,6.3cqw,17px)] leading-[1.2] font-medium ${active ? 'text-white/90' : 'text-muted-3'}`}>
        {status}
      </span>
      <span className={`absolute top-[87.6%] right-[8%] left-[10%] truncate text-[clamp(11px,5.2cqw,14px)] leading-[1.2] ${active ? 'text-white/80' : 'text-muted-2'}`}>
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
