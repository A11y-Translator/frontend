// 사용자가 열어둔 가짜 사이트 "Web A 메인" (Figma 533:7124)
// 일부러 접근성 문제를 넣은 화면: 회색 글자(#9E9E9E, 2.7:1), 설명 없는 히어로 이미지, 이름표 없는 이메일 입력칸.
// (데모 페이지 자체를 쓰는 화면낭독기 사용자를 위해 시각적으로만 문제를 재현하고, 필요한 이름은 숨김 텍스트로 붙였습니다)
import type { FormEvent } from 'react'
import type { Issue } from '@/shared/api/types'
import heroPlaceholder from '@/extension/assets/hero-image-placeholder.svg'
import OverlayMarker from './OverlayMarker'

/** 원래 '자세히 보기' 글자색 — 03 미리 고쳐보기에서 고른 색이 있으면 그걸로 바뀜 */
const ORIGINAL_CTA_COLOR = '#9e9e9e'

interface Props {
  issues: Issue[]
  overlay: boolean
  emphasizedId: string | null
  /** store.previewFix['i1'] */
  ctaColor?: string
  onHover: (issueId: string | null) => void
  onOpen: (issueId: string) => void
}

export default function DemoSite({ issues, overlay, emphasizedId, ctaColor, onHover, onOpen }: Props) {
  // 이슈 id → 마커 공통 props. 해결된 이슈는 오버레이에서 사라짐
  const mark = (id: string, primary = true) => {
    const issue = issues.find((i) => i.id === id)
    return {
      issue,
      primary,
      show: overlay && !!issue && issue.status !== 'resolved',
      emphasized: emphasizedId === id,
      onHover: (on: boolean) => onHover(on ? id : null),
      onOpen: () => onOpen(id),
    }
  }
  const noop = (e: FormEvent) => e.preventDefault()

  return (
    // 임시 예시 사이트: 실제로는 사용자가 열어 둔 아무 웹사이트 위에서 확장이 동작합니다.
    // 보통 웹사이트 크기감에 맞게 85% 로 보여주고, 내용은 최대 1280px 가운데 정렬.
    <div className="mx-auto max-w-[1280px] min-w-[760px] bg-white font-noto text-black" style={{ zoom: 0.85 }}>
      {/* 사이트 내비 */}
      <header className="flex h-16 items-center justify-between border-b border-ext-line px-10">
        <span aria-hidden className="h-6 w-24 rounded bg-[#333]" />
        <span className="sr-only">Web A</span>
        {/* #3 키보드로 메뉴를 열 수 없어요 */}
        <OverlayMarker {...mark('i3')}>
          <nav aria-label="Web A 메뉴" className="flex gap-8 text-sm leading-[1.5] font-medium">
            <span>서비스 소개</span>
            <span>요금</span>
            <span>고객 문의</span>
          </nav>
        </OverlayMarker>
      </header>

      {/* 히어로 */}
      <section className="grid grid-cols-[1fr_auto] items-center gap-10 bg-ext-bg px-20 py-11">
        <div className="flex flex-col">
          <h2 className="text-[40px] leading-[1.5] font-bold">
            모두를 위한
            <br />
            더 쉬운 서비스
          </h2>
          {/* #1 색 대비 (p.hero-sub) — 같은 이슈의 보조 표시라 툴팁은 버튼 쪽에만 */}
          <OverlayMarker {...mark('i1', false)} className="mt-3 self-start">
            <p className="text-base leading-[1.5] text-[#9e9e9e]">누구나 편하게 사용할 수 있는 화면을 만들어요.</p>
          </OverlayMarker>
          <div className="mt-11 flex gap-4">
            <button type="button" className="h-12 w-[140px] rounded-full bg-black text-[15px] font-bold text-white">
              시작하기
            </button>
            {/* #1 색 대비 (button.cta-secondary) — 미리 고쳐보기 색이 여기에 실시간으로 반영 */}
            <OverlayMarker {...mark('i1')}>
              <button
                type="button"
                className="h-12 w-[150px] rounded-full border border-ext-line bg-white text-[15px] font-medium transition-colors"
                style={{ color: ctaColor ?? ORIGINAL_CTA_COLOR }}
              >
                자세히 보기
              </button>
            </OverlayMarker>
          </div>
        </div>
        {/* #2 이미지에 설명이 없어요 */}
        <OverlayMarker {...mark('i2')}>
          <div className="flex h-80 w-[400px] items-center justify-center rounded-2xl bg-[#d9d9d9]">
            <img src={heroPlaceholder} alt="" width={48} height={48} />
          </div>
        </OverlayMarker>
      </section>

      {/* 뉴스레터 */}
      <section className="flex flex-col gap-3 px-20 pt-9">
        <h2 className="text-base leading-[1.5] font-bold">뉴스레터 구독</h2>
        <form onSubmit={noop} className="flex gap-3">
          {/* #4 입력칸에 이름표가 없어요 — 화면에는 이름표가 없는 상태를 재현 */}
          <OverlayMarker {...mark('i4')}>
            <input
              type="email"
              aria-label="이메일"
              placeholder="이메일을 입력하세요"
              className="h-12 w-[360px] rounded-lg border border-ext-line px-4 text-sm placeholder:text-placeholder"
            />
          </OverlayMarker>
          <button type="submit" className="h-12 w-[100px] rounded-lg bg-black text-sm font-bold text-white">
            구독
          </button>
        </form>
      </section>

      {/* 카드 3개 */}
      <ul className="grid grid-cols-3 gap-4 px-20 pt-11 pb-16">
        {[1, 2, 3].map((n) => (
          <li key={n} className="flex flex-col rounded-xl bg-ext-bg p-4">
            <span aria-hidden className="h-[72px] rounded-lg bg-ext-line" />
            <h3 className="mt-2.5 text-sm leading-[1.5] font-bold">카드 제목 {n}</h3>
            <p className="text-xs leading-[1.5] text-[#9e9e9e]">설명 텍스트가 들어가요</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
