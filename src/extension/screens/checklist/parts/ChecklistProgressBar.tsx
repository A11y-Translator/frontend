// 체크리스트 진행 막대 (v1·v2 공통). 색은 버전마다 달라서 className 으로 받음
interface Props {
  done: number
  total: number
  /** 채워진 막대 색 (예: bg-success / bg-ink-2) */
  barClassName: string
  trackClassName?: string
}

export default function ChecklistProgressBar({ done, total, barClassName, trackClassName = 'bg-[#eceef2]' }: Props) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div
      role="progressbar"
      aria-label="내 체크리스트 진행"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={`${total}개 중 ${done}개 완료`}
      className={`h-1.5 w-full overflow-hidden rounded-[3px] ${trackClassName}`}
    >
      <div className={`h-full rounded-[3px] transition-[width] ${barClassName}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
