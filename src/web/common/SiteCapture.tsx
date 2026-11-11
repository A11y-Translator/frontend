// 검사 시점 캡처 — 실제 스크린샷 대신 HTML/CSS 로 그린 가짜 사이트 + 문제 위치 오버레이.
// Figma: project/inspection 의 "Capture"(562:2403), project/issue-detail 의 "검사 시점 캡처"(554:12286)
// 기준 크기(734×557)로 그린 뒤 컨테이너 너비에 맞춰 scale 합니다. (스크린샷처럼 동작해야 해서 내부는 절대 위치)
// 핀·코멘트 같은 조작 요소는 children 으로 받아 확대/축소되지 않는 위 레이어에 % 좌표로 올립니다.
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import iconImage from '@/web/assets/icon-image.svg'
import { CAPTURE_H, CAPTURE_W, OVERLAYS, type OverlayBox } from '@/shared/mocks/scan'

interface SiteCaptureProps {
  page: string
  /** 화면낭독기용 설명 */
  label: string
  showOverlay?: boolean
  /** 강조할 이슈 (선택된 행) */
  activeIssueId?: string
  /** "위치 보기"로 잠깐 깜빡일 요소 */
  flashSelector?: string
  className?: string
  children?: ReactNode
  /** 문제 위치 박스 (기본: 데모 프로젝트B). 새 프로젝트는 검사 결과의 overlays */
  overlays?: OverlayBox[]
  /** 실제 페이지 검사(live)의 화면 캡처 주소 → 가짜 사이트 대신 실제 화면을 보여줍니다 */
  screenshotUrl?: string
}

export function SiteCapture({ page, label, showOverlay = true, activeIssueId, flashSelector, className = '', children, overlays = OVERLAYS, screenshotUrl }: SiteCaptureProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(CAPTURE_W)

  // 컨테이너 너비가 바뀌면 캡처 배율도 바꿉니다
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setWidth(el.clientWidth || CAPTURE_W)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scale = width / CAPTURE_W
  const boxes = overlays.filter((o) => o.page === page)

  return (
    <div ref={ref} className={`relative w-full overflow-hidden bg-white ${className}`} style={{ height: CAPTURE_H * scale }}>
      <div
        role="img"
        aria-label={label}
        className="absolute top-0 left-0 origin-top-left font-noto"
        style={{ width: CAPTURE_W, height: CAPTURE_H, transform: `scale(${scale})` }}
      >
        {screenshotUrl ? (
          // 검사 화면 캡처(1440×1093)를 기준 크기(734×557)에 맞춰 그립니다. 설명은 바깥 role="img" 의 label 이 함
          <img src={screenshotUrl} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
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
                className={`absolute rounded-[3px] border-[#3086ff] ${active ? 'border-2 bg-[rgb(48_134_255/0.12)] shadow-[0_0_0_3px_rgb(48_134_255/0.35)]' : 'border bg-[rgb(48_134_255/0.08)]'} ${flash ? 'animate-pulse outline-4 outline-offset-2 outline-[#3086ff]' : ''}`}
                style={{ left: o.x, top: o.y, width: o.w, height: o.h }}
              >
                <span className="absolute -top-[9px] -left-[9px] flex size-[15px] items-center justify-center rounded-full border border-white bg-[#3086ff] text-[8px] leading-none font-bold text-white">
                  {o.label}
                </span>
              </div>
            )
          })}
      </div>
      {children}
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
        <p className="absolute top-[13px] left-[475px] text-[9.5px] leading-[1.5] font-medium whitespace-pre">{'서비스 소개      요금      고객 문의'}</p>
      </div>
      {page === '/main' && <MainPage />}
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

function MainPage() {
  return (
    <>
      <div className="absolute top-[43.5px] left-0 h-[285.4px] w-full bg-[#f7f7f7]" />
      <p className="absolute top-[88px] left-[54.4px] text-[27.2px] leading-[1.5] font-bold whitespace-nowrap">
        모두를 위한
        <br />더 쉬운 서비스
      </p>
      <p className="absolute top-[178px] left-[54.4px] text-[10.9px] leading-[1.5] whitespace-nowrap text-[#9e9e9e]">누구나 편하게 사용할 수 있는 화면을 만들어요.</p>
      <div className="absolute top-[224.3px] left-[54.4px] flex h-[32.6px] w-[95px] items-center justify-center rounded-full bg-black text-[10.2px] font-bold text-white">시작하기</div>
      <div className="absolute top-[224.3px] left-[160.4px] flex h-[32.6px] w-[102px] items-center justify-center rounded-full border-[0.68px] border-[#e0e0e0] bg-white text-[10.2px] font-medium text-[#9e9e9e]">
        자세히 보기
      </div>
      <div className="absolute top-[74.8px] left-[407.8px] flex h-[217.5px] w-[271.9px] items-center justify-center rounded-[10.9px] bg-[#d9d9d9]">
        <img src={iconImage} alt="" width={33} height={33} />
      </div>
      <p className="absolute top-[353.4px] left-[54.4px] text-[10.9px] leading-[1.5] font-bold">뉴스레터 구독</p>
      <div className="absolute top-[377.9px] left-[54.4px] flex h-[32.6px] w-[244.7px] items-center rounded-[5.4px] border-[0.68px] border-[#e0e0e0] bg-white px-[10px] text-[9.5px] text-[#b5b5b5]">
        이메일을 입력하세요
      </div>
      <div className="absolute top-[377.9px] left-[307.2px] flex h-[32.6px] w-[68px] items-center justify-center rounded-[5.4px] bg-black text-[9.5px] font-bold text-white">구독</div>
      {[54.4, 266.4, 478.5].map((left, i) => (
        <div key={left} className="absolute top-[441.8px] h-[102px] w-[201.2px] rounded-[8.2px] bg-[#f7f7f7]" style={{ left }}>
          <div className="absolute top-[10.9px] left-[10.9px] h-[48.9px] w-[179.4px] rounded-[5.4px] bg-[#e0e0e0]" />
          <p className="absolute top-[66.6px] left-[10.9px] text-[9.5px] leading-[1.5] font-bold">카드 제목 {i + 1}</p>
          <p className="absolute top-[81.6px] left-[10.9px] text-[8.2px] leading-[1.5] text-[#9e9e9e]">설명 텍스트가 들어가요</p>
        </div>
      ))}
    </>
  )
}

function PricingPage() {
  return (
    <>
      <div className="absolute top-[43.5px] left-0 h-[513px] w-full bg-[#f7f7f7]" />
      <p className="absolute top-[76px] left-[54px] text-[27px] leading-[1.5] font-bold">요금 안내</p>
      {[54, 266, 478].map((left, i) => (
        <div key={left} className="absolute top-[160px] h-[300px] w-[201px] rounded-[8px] border-[0.68px] border-[#e0e0e0] bg-white p-[14px]" style={{ left }}>
          <p className="text-[11px] font-bold">{['베이직', '프로', '팀'][i]}</p>
          <p className="mt-2 text-[20px] font-bold">{['무료', '₩9,900', '₩29,000'][i]}</p>
          <div className="mt-4 flex flex-col gap-2">
            {[0, 1, 2, 3].map((k) => (
              <div key={k} className="h-[8px] w-[150px] rounded bg-[#ececec]" />
            ))}
          </div>
          <p className="absolute bottom-[50px] left-[14px] text-[9.5px] text-[#3086ff] underline">여기</p>
        </div>
      ))}
    </>
  )
}

function ContactPage() {
  return (
    <>
      <p className="absolute top-[76px] left-[54px] text-[27px] leading-[1.5] font-bold">고객 문의</p>
      {[164, 228, 292].map((top, i) => (
        <div key={top} className="absolute left-[54px] flex h-[36px] w-[352px] items-center rounded-[5px] border-[0.68px] border-[#e0e0e0] bg-white px-[10px] text-[9.5px] text-[#b5b5b5]" style={{ top }}>
          {['이메일', '이름', '연락처'][i]}
        </div>
      ))}
      <div className="absolute top-[352px] left-[54px] h-[40px] w-[352px] rounded-[5px] border-[0.68px] border-[#e0e0e0] bg-white" />
      <p className="absolute top-[404px] left-[54px] text-[9.5px] text-[#d32f2f]">입력 형식이 올바르지 않아요</p>
      <div className="absolute top-[440px] left-[54px] flex h-[32px] w-[90px] items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">보내기</div>
    </>
  )
}
