// 화면 아래 토스트 + 화면낭독기 알림 (useAnnouncer 와 같이 씀) — 할 일 · 홈 공통
export function LiveToast({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-8 left-[calc(50%+140px)] z-[60] -translate-x-1/2 font-noto">
      {message && (
        <span className="block rounded-pill bg-ink-2 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
          {message}
        </span>
      )}
    </div>
  )
}
