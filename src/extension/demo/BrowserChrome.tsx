// 가짜 브라우저 상단 (Figma 533:7114 "Browser chrome")
// ↻ = 페이지 새로고침 → 확장이 자동으로 다시 검사 / A 아이콘 = 사이드 패널 열기·닫기
interface Props {
  url: string
  tabTitle: string
  panelOpen: boolean
  onTogglePanel: () => void
  onReload: () => void
  reloading: boolean
}

const NAV_BTN = 'flex size-7 items-center justify-center rounded-full text-sm font-medium text-muted hover:bg-black/5 disabled:opacity-50 disabled:hover:bg-transparent'

export default function BrowserChrome({ url, tabTitle, panelOpen, onTogglePanel, onReload, reloading }: Props) {
  return (
    <div className="flex shrink-0 flex-col gap-1 bg-[#e6e6e6] px-3 pt-2 pb-1.5 font-noto">
      <div className="flex">
        <p className="w-60 truncate rounded-lg bg-white px-4 py-1.5 text-[13px] leading-[1.5] font-medium text-black">{tabTitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" disabled aria-label="뒤로" className={NAV_BTN}><span aria-hidden>←</span></button>
        <button type="button" disabled aria-label="앞으로" className={NAV_BTN}><span aria-hidden>→</span></button>
        <button
          type="button"
          onClick={onReload}
          aria-label="새로고침 (확장이 자동으로 다시 검사)"
          title="새로고침 — 확장이 자동으로 다시 검사해요"
          className={NAV_BTN}
        >
          <span aria-hidden className={reloading ? 'inline-block animate-spin' : ''}>↻</span>
        </button>
        <p className="ml-1 min-w-0 flex-1 truncate rounded-full bg-white px-4 py-1 text-[13px] leading-[1.5] text-black">
          <span className="sr-only">주소: </span>
          {url}
        </p>
        {/* Extension icon (active) + active ring */}
        <button
          type="button"
          onClick={onTogglePanel}
          aria-pressed={panelOpen}
          aria-label="A11y Translator 사이드 패널"
          className={`ml-3 flex size-[38px] items-center justify-center rounded-[10px] border-2 ${panelOpen ? 'border-accent' : 'border-transparent'}`}
        >
          <span aria-hidden className="flex size-[30px] items-center justify-center rounded-lg bg-black text-sm font-bold text-white">A</span>
        </button>
        <button type="button" disabled aria-label="브라우저 메뉴" className={`${NAV_BTN} ml-auto font-bold`}>
          <span aria-hidden>⋮</span>
        </button>
      </div>
    </div>
  )
}
