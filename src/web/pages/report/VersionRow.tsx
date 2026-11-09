// Figma: 컴포넌트 Frame 7282 (315:6689) — 버전 관리 목록 한 줄: 버전 N · 남은 코멘트 · 날짜
interface VersionRowProps {
  no: number
  remainingComments: number
  date: string
  current?: boolean
}

export function VersionRow({ no, remainingComments, date, current }: VersionRowProps) {
  return (
    <li className="flex items-center justify-between gap-4 border-b border-[#dadada] px-4 py-2.5 leading-[1.45] whitespace-nowrap last:border-b-0">
      <div className="flex items-center gap-4 font-medium">
        <span className="text-base text-black">버전 {no}</span>
        <span className="text-xs text-muted">남은 코멘트 {remainingComments}개</span>
        {current && <span className="rounded-full bg-success-bg px-2 py-0.5 text-[11px] font-semibold text-success">현재 작업 중</span>}
      </div>
      <span className="text-xs text-black">{date}</span>
    </li>
  )
}
