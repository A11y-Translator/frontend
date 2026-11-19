/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- 스크롤 영역은 키보드로도 진입할 수 있어야 합니다. */
// 캡처 전체를 같은 좌표계(기준 너비 734px)로 표시하고, 창 안에서 세로로 스크롤합니다.
import {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react'
import { FigmaMainCapture } from './FigmaMainCapture'
import { CAPTURE_H, CAPTURE_W, OVERLAYS, type OverlayBox } from '@/shared/mocks/scan'

export interface SiteCaptureHandle {
  scrollToIssue: (issueId: string, selector?: string) => boolean
}

interface SiteCaptureProps {
  page: string
  label: string
  showOverlay?: boolean
  activeIssueId?: string
  flashSelector?: string
  className?: string
  children?: ReactNode
  overlays?: OverlayBox[]
  screenshotUrl?: string
  onIssueSelect?: (issueId: string) => void
  issueNumbers?: Record<string, number>
  ref?: Ref<SiteCaptureHandle>
  contentRef?: Ref<HTMLDivElement>
  onHeightChange?: (height: number) => void
}

export function SiteCapture({
  page,
  label,
  showOverlay = true,
  activeIssueId,
  flashSelector,
  className = '',
  children,
  overlays = OVERLAYS,
  screenshotUrl,
  onIssueSelect,
  issueNumbers,
  ref,
  contentRef,
  onHeightChange,
}: SiteCaptureProps) {
  const viewport = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(CAPTURE_W)
  const [imageSize, setImageSize] = useState({ src: '', height: CAPTURE_H })
  const height = screenshotUrl && imageSize.src === screenshotUrl ? imageSize.height : CAPTURE_H
  const scale = width / CAPTURE_W
  const boxes = useMemo(
    () => overlays.filter((o) => o.page === page && o.y < height && o.y + o.h > 0),
    [overlays, page, height],
  )

  useLayoutEffect(() => {
    const el = viewport.current
    if (!el) return
    const update = () => setWidth(el.clientWidth || CAPTURE_W)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scrollToIssue = useCallback(
    (issueId: string, selector?: string) => {
      const box = boxes.find((o) => o.issueId === issueId && (!selector || o.selector === selector))
      const el = viewport.current
      if (!box || !el) return false
      el.scrollTop = Math.max(0, box.y * scale - Math.min(48, el.clientHeight / 4))
      return true
    },
    [boxes, scale],
  )

  useImperativeHandle(ref, () => ({ scrollToIssue }), [scrollToIssue])
  useLayoutEffect(() => {
    onHeightChange?.(height)
  }, [height, onHeightChange])
  useLayoutEffect(() => {
    if (activeIssueId) scrollToIssue(activeIssueId)
    else if (viewport.current) viewport.current.scrollTop = 0
  }, [activeIssueId, scrollToIssue])

  return (
    <div
      ref={viewport}
      role="region"
      aria-label={`${label} 스크롤 영역`}
      tabIndex={0}
      className={`site-capture-viewport relative w-full overflow-x-hidden overflow-y-auto bg-white ${className}`}
      style={{ height: CAPTURE_H * scale }}
    >
      <div
        ref={contentRef}
        className="site-capture-content relative w-full"
        style={{ height: height * scale }}
      >
        <div
          role={onIssueSelect ? 'group' : 'img'}
          aria-label={label}
          className="absolute top-0 left-0 origin-top-left font-noto"
          style={{ width: CAPTURE_W, height, transform: `scale(${scale})` }}
        >
          {screenshotUrl ? (
            <img
              key={screenshotUrl}
              src={screenshotUrl}
              alt=""
              className="absolute top-0 left-0 block h-auto w-full"
              onLoad={(e) => {
                const img = e.currentTarget
                if (img.naturalWidth && img.naturalHeight)
                  setImageSize({
                    src: screenshotUrl,
                    height: (CAPTURE_W * img.naturalHeight) / img.naturalWidth,
                  })
              }}
            />
          ) : (
            <FakeSite page={page} />
          )}
          {showOverlay &&
            boxes.map((o) => {
              const active = o.issueId === activeIssueId
              const flash = flashSelector === o.selector && active
              return (
                <div
                  key={`${o.issueId}-${o.label}-${o.selector}`}
                  data-capture-selector={o.selector}
                  className={`absolute rounded-[6px] ${active ? 'border-2 border-[#1d4ed8] bg-[rgb(29_78_216/0.08)]' : 'border border-transparent'} ${flash ? 'motion-safe:animate-pulse outline-4 outline-offset-2 outline-[#1d4ed8]' : ''}`}
                  style={{ left: o.x, top: o.y, width: o.w, height: o.h }}
                >
                  {onIssueSelect ? (
                    <button
                      type="button"
                      aria-label={`이슈 ${issueNumbers?.[o.issueId] ?? o.label} 보기: ${o.selector}`}
                      onClick={() => onIssueSelect(o.issueId)}
                      className={`absolute -top-[9px] -right-[9px] grid min-h-6 min-w-6 place-items-center rounded-[5px] border border-white text-[10px] leading-none font-bold text-white ${active ? 'bg-[#1d4ed8]' : 'bg-[#8a8f98]'}`}
                    >
                      {issueNumbers?.[o.issueId] ?? o.label}
                    </button>
                  ) : (
                    <span
                      className={`absolute -top-[9px] -right-[9px] grid size-[15px] place-items-center rounded-[4px] text-[8px] leading-none font-bold text-white ${active ? 'bg-[#1d4ed8]' : 'bg-[#8a8f98]'}`}
                    >
                      {o.label}
                    </span>
                  )}
                </div>
              )
            })}
        </div>
        {children}
      </div>
    </div>
  )
}

/* 가짜 사이트 — Figma 의 캡처 이미지(사이트 nav, 히어로, 구독, 카드)를 그대로 옮김 */
function FakeSite({ page }: { page: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-white text-black">
      {/* Site nav */}
      <div className="absolute top-0 left-0 h-[43.5px] w-full border-[0.68px] border-[#e0e0e0] bg-white">
        <div className="absolute top-[13px] left-[26.5px] h-[16.3px] w-[65px] rounded-[2.7px] bg-[#333]" />
        <p className="absolute top-[13px] left-[475px] text-[9.5px] leading-[1.5] font-medium whitespace-pre">
          {'서비스 소개      요금      고객 문의'}
        </p>
      </div>
      {page === '/main' && <FigmaMainCapture />}
      {page === '/pricing' && <PricingPage />}
      {page === '/contact' && <ContactPage />}
      {page !== '/main' && page !== '/pricing' && page !== '/contact' && (
        <div className="absolute top-[43.5px] left-0 flex h-[513px] w-full flex-col items-center justify-center gap-2 bg-[#f7f7f7]">
          <p className="text-[27px] leading-[1.5] font-bold">{page}</p>
          <p className="text-[11px] text-[#6f6f6f]">이 페이지에서는 문제가 발견되지 않았어요</p>
        </div>
      )}
    </div>
  )
}

function PricingPage() {
  return (
    <>
      <div className="absolute top-[43.5px] left-0 h-[513px] w-full bg-[#f7f7f7]" />
      <p className="absolute top-[76px] left-[54px] text-[27px] leading-[1.5] font-bold">
        요금 안내
      </p>
      {[54, 266, 478].map((left, i) => (
        <div
          key={left}
          className="absolute top-[160px] h-[300px] w-[201px] rounded-[8px] border-[0.68px] border-[#e0e0e0] bg-white p-[14px]"
          style={{ left }}
        >
          <p className="text-[11px] font-bold">{['베이직', '프로', '팀'][i]}</p>
          <p className="mt-2 text-[20px] font-bold">{['무료', '₩9,900', '₩29,000'][i]}</p>
          <div className="mt-4 flex flex-col gap-2">
            {[0, 1, 2, 3].map((k) => (
              <div key={k} className="h-[8px] w-[150px] rounded bg-[#ececec]" />
            ))}
          </div>
          <p className="absolute bottom-[50px] left-[14px] text-[9.5px] text-[#3086ff] underline">
            여기
          </p>
        </div>
      ))}
    </>
  )
}

function ContactPage() {
  return (
    <>
      <p className="absolute top-[76px] left-[54px] text-[27px] leading-[1.5] font-bold">
        고객 문의
      </p>
      {[164, 228, 292].map((top, i) => (
        <div
          key={top}
          className="absolute left-[54px] flex h-[36px] w-[352px] items-center rounded-[5px] border-[0.68px] border-[#e0e0e0] bg-white px-[10px] text-[9.5px] text-[#b5b5b5]"
          style={{ top }}
        >
          {['이메일', '이름', '연락처'][i]}
        </div>
      ))}
      <div className="absolute top-[352px] left-[54px] h-[40px] w-[352px] rounded-[5px] border-[0.68px] border-[#e0e0e0] bg-white" />
      <p className="absolute top-[404px] left-[54px] text-[9.5px] text-[#d32f2f]">
        입력 형식이 올바르지 않아요
      </p>
      <div className="absolute top-[440px] left-[54px] flex h-[32px] w-[90px] items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
        보내기
      </div>
    </>
  )
}
