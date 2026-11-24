// 버전 비교 두 화면(기본 07 · 심플 07-2)이 함께 쓰는 부품:
// 머리줄(방 이름 · 대화/버전 비교 탭 · 기본/심플 전환 · GitHub 상태), 휴대폰 미리보기, 바뀐 곳 점선 · 코멘트 핀.
import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import dotGithub from '@/assets/compare/dot-github.svg'
import dotRoom from '@/assets/compare/dot-room.svg'
import wfBell from '@/assets/compare/wf-bell.svg'
import wfBellSimple from '@/assets/compare/wf-bell-simple.svg'
import { ROLE, type RoleId } from '@/data/mock'
import { useSoon } from '@/ui/toast'
import { CHANGES, GITHUB_STATUS, ROOM, VERSIONS, type CompareComment, type VersionId } from './compareData'
import type { DraftPin } from './useCompare'

export type Tone = 'basic' | 'simple'

/* ───────────── 머리줄 + 바깥 여백 ───────────── */

const VARIANTS = [
  { id: 'basic', label: '기본', to: '/rooms/front/compare' },
  { id: 'simple', label: '심플', to: '/rooms/front/compare-simple' },
] as const

export function CompareShell({ variant, children }: { variant: Tone; children: ReactNode }) {
  const soon = useSoon()
  const simple = variant === 'simple'
  return (
    <div className="flex min-h-full w-full flex-col px-(--gutter) pt-(--page-top) pb-6">
      <header className="flex min-h-[31px] flex-wrap items-center gap-x-2.5 gap-y-3">
        <div className="flex items-center gap-2.5 @5xl:min-w-[228px]">
          {simple && <img src={dotRoom} alt="" className="size-2.5 shrink-0" />}
          <h1 className="text-[clamp(22px,1rem+1.2vw,28px)] leading-[1.2] font-bold tracking-[-0.02em] whitespace-nowrap text-ink">
            {/* 방 이름을 누르면 프론트 방(대화)으로 돌아가요 */}
            <Link to="/rooms/front" className="rounded hover:underline" aria-label={`${ROOM.name} 방으로 돌아가기`}>
              {simple ? `${ROOM.name} 방` : ROOM.name}
            </Link>
            <span className="sr-only"> · 버전 비교</span>
          </h1>
          <span className="text-[13px] whitespace-nowrap text-muted">{ROOM.people}</span>
          {simple && (
            <button
              type="button"
              onClick={soon('기획 문서')}
              className="rounded-[13px] border border-line bg-fill-3 px-2.5 py-[5px] text-xs leading-none font-medium whitespace-nowrap text-ink hover:bg-white/[0.14]"
            >
              기획 문서 ↗
            </button>
          )}
        </div>

        <nav aria-label="방 보기" className={`flex items-center gap-0.5 bg-fill-2 p-[3px] ${simple ? 'rounded-2xl' : 'rounded-[15px]'}`}>
          <Link
            to="/rooms/front"
            className={`rounded-md text-[13px] font-medium whitespace-nowrap text-muted hover:text-ink ${simple ? 'px-3 py-[5px]' : 'px-2.5 py-1'}`}
          >
            대화
          </Link>
          <Link
            to={simple ? VARIANTS[1].to : VARIANTS[0].to}
            aria-current="page"
            className={`bg-fill-3 text-[13px] font-bold whitespace-nowrap text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)] ${simple ? 'rounded-[13px] px-3 py-[5px]' : 'rounded-xl px-2.5 py-1'}`}
          >
            버전 비교
          </Link>
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {/* 디자인이 두 가지라 서로 오갈 수 있게 (어느 쪽을 쓸지 정해지면 지워요) */}
          <nav aria-label="버전 비교 시안" className="flex items-center gap-0.5 rounded-[14px] border border-dashed border-white/20 p-0.5">
            {VARIANTS.map((v) => {
              const on = v.id === variant
              return (
                <Link
                  key={v.id}
                  to={v.to}
                  aria-current={on ? 'page' : undefined}
                  className={`rounded-[11px] px-2.5 py-1 text-xs whitespace-nowrap ${on ? 'bg-fill-3 font-bold text-ink' : 'font-medium text-muted hover:text-ink'}`}
                >
                  {v.label}
                </Link>
              )
            })}
          </nav>
          <p className="flex items-center gap-1.5 rounded-[14px] border border-line bg-fill-3 px-2.5 py-1.5 text-xs leading-none font-medium whitespace-nowrap text-ink">
            <img src={dotGithub} alt="" className="size-[7px]" />
            {GITHUB_STATUS}
          </p>
        </div>
      </header>

      <div className="mt-[clamp(14px,3.1vh,28px)] flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

/* ───────────── 작은 표시들 ───────────── */

/** 역할 칩 (디자인 · 프론트) — 코멘트 작성자 옆 */
export function RoleTag({ role }: { role: RoleId }) {
  return (
    <span className="rounded-lg px-1.5 py-0.5 text-[10px] leading-normal font-bold whitespace-nowrap" style={{ background: ROLE[role].bg, color: ROLE[role].color }}>
      {ROLE[role].label}
    </span>
  )
}

/** 핀 모양: 왼쪽 아래만 뾰족한 22px 물방울 */
const PIN_SHAPE = 'flex size-[22px] shrink-0 items-center justify-center rounded-[11px] rounded-bl-[2px] border-2 font-mono text-[10px] leading-none font-medium drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.18)]'

/** 코멘트 목록 안의 번호 핀 (누르면 그 코멘트를 선택) */
export function PinBadge({ comment, tone, selected, onSelect }: { comment: CompareComment; tone: Tone; selected: boolean; onSelect: () => void }) {
  const bg = comment.resolved
    ? 'rgb(255 255 255 / 0.1)'
    : tone === 'basic' && comment.role === 'design'
      ? 'rgb(52 62 43 / 0.95)'
      : 'rgb(40 60 67 / 0.95)'
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${comment.id}번 코멘트 선택 — 화면에서 위치 보기`}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      className={`${PIN_SHAPE} border-line text-ink`}
      style={{ background: bg }}
    >
      {comment.id}
    </button>
  )
}

/* ───────────── 휴대폰 미리보기 (캠퍼스 앱 와이어프레임) ───────────── */

const TONE = {
  basic: { border: '#e0e0e0', sub: '#8e9196', skeleton: '#dadada', divider: '#ededed', bannerBg: '#e3ecfd', bannerText: '#1f3f8f', bell: wfBell, battery: true, changed: '#ece8fd' },
  simple: { border: '#e7e7e7', sub: '#6f6f6f', skeleton: '#e4e4e7', divider: '#e7e7e7', bannerBg: '#e8effd', bannerText: '#1d4ed8', bell: wfBellSimple, battery: false, changed: '#1d4ed8' },
} as const

function FeedCard({ top }: { top: number }) {
  return (
    <div className="absolute left-[15px] flex h-[76px] w-[208px] items-center gap-2.5 rounded-[10px] border border-[#ededed] bg-white p-2.5" style={{ top }}>
      <div className="size-14 shrink-0 rounded-lg bg-[#f1f1f3]" />
      <div className="flex flex-col gap-[7px]">
        <div className="h-2.5 w-[100px] rounded-[3px] bg-[#dadada]" />
        <div className="h-2 w-[128px] rounded-[3px] bg-[#ededed]" />
        <div className="h-2 w-[72px] rounded-[3px] bg-[#ededed]" />
      </div>
    </div>
  )
}

/** 한 버전의 메인 피드 그림. 현재 버전과 개발 서버는 공지 배너 · 카드 간격 · 탭바 아이콘 크기가 달라요. */
function Wireframe({ version, tone }: { version: VersionId; tone: Tone }) {
  const t = TONE[tone]
  const dev = version === 'dev'
  const cardTops = dev ? [185, 273, 361] : [133, 225, 317]
  const icon = dev ? { size: 18, top: 464, lefts: [20, 80, 140, 200] } : { size: 22, top: 462, lefts: [18, 78, 138, 198] }
  return (
    <>
      <p className="absolute top-[7px] left-[19px] font-mono text-[10px] leading-normal font-medium text-[#111]">9:41</p>
      {t.battery && <div className="absolute top-2.5 left-[197px] h-[9px] w-[22px] rounded-sm bg-[#111]" />}
      <p className="absolute top-[29px] left-[15px] text-base leading-normal font-bold text-[#111]">캠퍼스</p>
      <img src={t.bell} alt="" className="absolute top-[29px] left-[199px] size-6" />
      <div className="absolute top-[65px] left-[15px] h-8 w-[208px] rounded-lg bg-[#f4f4f5]" />
      <p className="absolute top-[72px] left-[27px] text-[11px] leading-normal font-medium whitespace-nowrap" style={{ color: t.sub }}>
        검색어를 입력하세요
      </p>
      {dev && (
        <>
          <div className="absolute top-[109px] left-[15px] h-10 w-[208px] rounded-[10px]" style={{ background: t.bannerBg }} />
          <p className="absolute top-[120px] left-[27px] text-[11px] leading-normal font-bold whitespace-nowrap" style={{ color: t.bannerText }}>
            공지 · 기말 기간 열람실 24시간 운영
          </p>
        </>
      )}
      <p className="absolute left-[15px] text-xs leading-normal font-bold text-[#111]" style={{ top: dev ? 161 : 109 }}>
        오늘의 글
      </p>
      {cardTops.map((top) => (
        <FeedCard key={top} top={top} />
      ))}
      <div className="absolute inset-x-0 top-[447px] h-[52px] bg-white" />
      <div className="absolute inset-x-0 top-[447px] h-px" style={{ background: t.divider }} />
      {icon.lefts.map((left, i) => (
        <div key={left} className="absolute rounded-[5px]" style={{ left, top: icon.top, width: icon.size, height: icon.size, background: i === 0 ? '#111' : t.skeleton }} />
      ))}
    </>
  )
}

/**
 * 휴대폰 미리보기 틀 (240×500). layers 가 둘이면 겹쳐 보기(위 그림을 반투명하게).
 * children 은 그림 위에 올리는 것(바뀐 곳 점선 · 핀).
 */
export function PhonePreview({ layers, tone, children }: { layers: { version: VersionId; opacity?: number }[]; tone: Tone; children?: ReactNode }) {
  return (
    <div className="relative h-[500px] w-[240px] shrink-0 overflow-clip rounded-[22px] border bg-white font-sans" style={{ borderColor: TONE[tone].border }}>
      {layers.map((l, i) => (
        <div key={`${l.version}-${i}`} role="img" aria-label={VERSIONS[l.version].alt} className="absolute inset-0 bg-white" style={{ opacity: l.opacity ?? 1 }}>
          <Wireframe version={l.version} tone={tone} />
        </div>
      ))}
      {children}
    </div>
  )
}

/** 화면 위 핀 색: 기본 = 역할 색(디자인 연두 · 프론트 연보라), 심플 = 파랑 하나. 해결됨은 회색. */
function pinColors(c: CompareComment, tone: Tone) {
  // 밝은 핀 위 숫자는 어두운 글자로 (피그마는 밝은 글자라 읽기 어려워 대비를 맞춤)
  if (c.resolved) return { background: '#a3a3a3', color: '#17181a' }
  if (tone === 'simple') return { background: '#1d4ed8', color: '#eeeeec' }
  return { background: c.role === 'design' ? '#f2ff9b' : c.role === 'front' ? '#ece8fd' : ROLE[c.role].color, color: '#17181a' }
}

/** 미리보기 위에 올리는 것: 자리 찍기 버튼 · 바뀐 곳 점선 · 코멘트 핀 · 새로 찍은 자리 */
export function PreviewMarks({
  version,
  tone,
  pins,
  selectedId,
  onSelect,
  showChanges,
  draft,
  onPlace,
}: {
  version: VersionId
  tone: Tone
  /** 이 화면에 보여 줄 코멘트 */
  pins: CompareComment[]
  selectedId: number | null
  onSelect: (id: number) => void
  showChanges: boolean
  draft: DraftPin | null
  onPlace: (version: VersionId, e: MouseEvent<HTMLElement>) => void
}) {
  return (
    <>
      <button
        type="button"
        onClick={(e) => onPlace(version, e)}
        aria-label={`${VERSIONS[version].paneName} 화면에 새 코멘트 자리 찍기`}
        className="absolute inset-0 cursor-crosshair rounded-[21px] focus-visible:-outline-offset-4 focus-visible:outline-[#1d4ed8]"
      />
      {showChanges &&
        CHANGES.map((r) => (
          <div
            key={r.id}
            aria-hidden
            className="pointer-events-none absolute rounded-lg border-[1.5px] border-dashed bg-[rgb(29_78_216/0.06)]"
            style={{ left: r.x, top: r.y, width: r.w, height: r.h, borderColor: TONE[tone].changed }}
          />
        ))}
      {pins.map((c) => {
        const on = c.id === selectedId
        return (
          <button
            key={c.id}
            type="button"
            aria-pressed={on}
            aria-label={`${c.id}번 코멘트 · ${c.author} (${ROLE[c.role].label})${c.resolved ? ' · 해결됨' : ''}`}
            onClick={() => onSelect(c.id)}
            className={`${PIN_SHAPE} absolute border-white transition-transform before:absolute before:-inset-1.5 hover:scale-110 focus-visible:outline-[#111] ${on ? 'z-10 scale-110 ring-2 ring-[#111]' : ''}`}
            style={{ left: c.pin.x, top: c.pin.y, ...pinColors(c, tone) }}
          >
            {c.id}
          </button>
        )
      })}
      {draft?.version === version && (
        <span
          aria-hidden
          className={`${PIN_SHAPE} pointer-events-none absolute z-10 border-dashed border-[#111] bg-white text-[13px] text-[#111]`}
          style={{ left: draft.x, top: draft.y }}
        >
          +
        </span>
      )}
    </>
  )
}
