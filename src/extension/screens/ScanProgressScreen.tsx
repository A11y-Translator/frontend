// 크롬 팝업 · 검사 진행 (Figma 758:3527 — 크롬 섹션 확정안, 400×600)
// "검사하기"를 누르면 퍼센트가 0 → 100% 로 차오르고(디자인 코멘트: "퍼센테이지 차오르는 애니메이션"), 끝나면 결과 요약으로 이동.
// 움직임 줄이기 설정이면 애니메이션 없이 바로 100%.
import { useEffect, useRef, useState } from 'react'
import { usePanel, useScreenFocus } from '@/extension/panelNav'
import { PopupFrame, PopupButton } from '@/extension/ui'

const DURATION = 1800 // ms
const AFTER_DONE = 400 // 100% 를 잠깐 보여 준 뒤 이동

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

export default function ScanProgressScreen() {
  const { go } = usePanel()
  const titleRef = useScreenFocus<HTMLHeadingElement>()
  const [percent, setPercent] = useState(0)
  const [running, setRunning] = useState(false)
  const frame = useRef(0)
  const timer = useRef(0)

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current)
      window.clearTimeout(timer.current)
    },
    [],
  )

  const finish = () => {
    setPercent(100)
    timer.current = window.setTimeout(() => go({ name: 'summary' }), AFTER_DONE)
  }

  const start = () => {
    if (running) return
    setRunning(true)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish()
      return
    }
    const t0 = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / DURATION)
      setPercent(Math.round(easeOut(t) * 100))
      if (t < 1) frame.current = requestAnimationFrame(tick)
      else finish()
    }
    frame.current = requestAnimationFrame(tick)
  }

  const done = percent === 100

  return (
    <PopupFrame className="items-center justify-center pt-[55px]">
      <h1 ref={titleRef} tabIndex={-1} className="sr-only">
        접근성 검사
      </h1>

      <div
        role="progressbar"
        aria-label="검사 진행률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="font-semibold text-black tabular-nums"
      >
        <span className="text-[48px] leading-[1.45]">{percent}</span>
        <span className="text-[24px] leading-[1.45]">%</span>
      </div>

      <PopupButton
        onClick={start}
        aria-disabled={running || undefined}
        className="mt-[53px] w-[226px]"
      >
        {running ? '검사 중…' : '검사하기'}
      </PopupButton>

      {/* 숫자가 바뀔 때마다 읽지 않고 시작·끝만 알려 줌 */}
      <p role="status" className="sr-only">
        {done ? '검사가 끝났어요. 결과 화면으로 이동해요.' : running ? '검사를 시작했어요.' : ''}
      </p>
    </PopupFrame>
  )
}
