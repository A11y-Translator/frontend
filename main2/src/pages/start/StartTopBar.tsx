// 시작하기 · 프로젝트 루트 화면 오른쪽 위: (루트가 생긴 뒤) "정상까지 D-14" 칩 + 내 아바타
// Figma R00 기획 · 루트 만들기 — 두 화면 모두 오른쪽 위에 아바타, 루트 화면에는 D-day 칩이 더 있어요.
import { deadlineText, usePlan } from '@/data/planStore'
import { useSession } from '@/data/sessionStore'

export function StartTopBar({ showDday = false }: { showDday?: boolean }) {
  const plan = usePlan()
  const me = useSession()?.user
  const left = deadlineText(plan).daysLeft
  return (
    <div className="flex items-center justify-end gap-2.5">
      {showDday && left !== null && (
        <span className="rounded-full bg-summit px-2.5 py-1 font-mono text-[11px] font-semibold text-on-summit">
          {left > 0 ? `정상까지 D-${left}` : left === 0 ? '오늘 정상 도착' : `정상 D+${-left}`}
        </span>
      )}
      {/* 아바타 글자: 이름 가운데 글자(김혜승 → 혜) — 피그마와 같게 */}
      {me && (
        <span className="flex size-7 items-center justify-center rounded-full bg-ink text-[12px] font-semibold text-canvas">
          <span aria-hidden>{me.name.slice(-2, -1) || me.name.slice(0, 1)}</span>
          <span className="sr-only">{me.name}</span>
        </span>
      )}
    </div>
  )
}
