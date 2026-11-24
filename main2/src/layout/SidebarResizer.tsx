// 사이드바 경계 끌기 손잡이 — 마우스로 끌어 폭 조절, 아주 좁게 끌면 접힘, 다시 끌면 펼침.
// 키보드: 포커스 후 ←/→ 로 16px씩, Enter 로 접기/펼치기, Home 접기, End 최대. 두 번 클릭하면 기본 폭으로.
// role="separator" (ARIA 창 분할 막대 패턴)
import { useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import { COLLAPSE_AT, SIDEBAR_MAX, SIDEBAR_MIN, SIDEBAR_RAIL } from './useSidebar'

interface Props {
  navRef: RefObject<HTMLElement | null>
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  setWidth: (w: number | null) => void
  onResizingChange: (resizing: boolean) => void
}

const STEP = 16

export function SidebarResizer({ navRef, collapsed, setCollapsed, setWidth, onResizingChange }: Props) {
  const [dragging, setDragging] = useState(false)
  const currentW = () => navRef.current?.getBoundingClientRect().width ?? SIDEBAR_RAIL
  const left = () => navRef.current?.getBoundingClientRect().left ?? 0

  const apply = (w: number) => {
    if (w < COLLAPSE_AT) {
      setCollapsed(true)
    } else {
      setCollapsed(false)
      setWidth(w)
    }
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    onResizingChange(true)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    apply(e.clientX - left())
  }
  const end = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
    onResizingChange(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const w = currentW()
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (!collapsed) apply(w - STEP < SIDEBAR_MIN ? 0 : w - STEP)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      if (collapsed) setCollapsed(false)
      else setWidth(w + STEP)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setCollapsed(!collapsed)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setCollapsed(true)
    } else if (e.key === 'End') {
      e.preventDefault()
      setCollapsed(false)
      setWidth(SIDEBAR_MAX)
    }
  }

  const now = Math.round(collapsed ? SIDEBAR_RAIL : currentW())

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="사이드바 폭 조절 (←/→ 로 조절, Enter 로 접기·펼치기)"
      aria-valuemin={SIDEBAR_RAIL}
      aria-valuemax={SIDEBAR_MAX}
      aria-valuenow={now}
      aria-valuetext={collapsed ? '접힘' : `${now}px`}
      tabIndex={0}
      title="끌어서 폭 조절 · 두 번 클릭하면 기본 폭"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onDoubleClick={() => {
        setCollapsed(false)
        setWidth(null)
      }}
      onKeyDown={onKeyDown}
      className="group absolute inset-y-0 -right-1.5 z-20 w-3 cursor-col-resize touch-none outline-none"
    >
      {/* 보이는 선: 평소에는 안 보이고, 마우스를 올리거나 끄는 중·포커스일 때 연두 선 */}
      <span
        aria-hidden
        className={`absolute inset-y-0 left-1/2 -translate-x-1/2 transition-colors ${
          dragging ? 'w-0.5 bg-summit' : 'w-px bg-transparent group-hover:w-0.5 group-hover:bg-summit/70 group-focus-visible:w-0.5 group-focus-visible:bg-summit'
        }`}
      />
    </div>
  )
}
