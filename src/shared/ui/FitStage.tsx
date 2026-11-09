// 화면 크기에 맞춰 디자인 비율 그대로 축소해 "한 화면에" 보이게 하는 틀.
// Figma 프레임 크기(designWidth × designHeight)를 기준으로, 창이 그보다 작으면 같은 비율로 줄입니다.
// 창이 더 크면 확대하지 않고(최대 1배) 남는 공간은 레이아웃이 늘어나서 채웁니다.
//
// CSS zoom 을 쓰는 이유: transform: scale 과 달리 글자가 흐려지지 않고, 레이아웃 크기도 함께 줄어 스크롤이 생기지 않아요.
// 안쪽에서는 100vh 대신 h-full 을 쓰세요 (안쪽 높이 = 창 높이 ÷ 배율).
import { useEffect, useState, type ReactNode } from 'react'

interface FitStageProps {
  designWidth: number
  designHeight: number
  children: ReactNode
  className?: string
}

function useViewport() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

export function FitStage({ designWidth, designHeight, children, className = '' }: FitStageProps) {
  const { w, h } = useViewport()
  const scale = Math.min(1, w / designWidth, h / designHeight)
  return (
    <div className="h-screen w-screen overflow-hidden">
      <div
        className={className}
        style={{ zoom: scale, width: w / scale, height: h / scale }}
      >
        {children}
      </div>
    </div>
  )
}
