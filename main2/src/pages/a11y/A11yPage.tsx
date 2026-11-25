// 도구 › 웹 접근성 검사 — 피그마에 아직 디자인이 없어서("접근성 검사 페이지 필요" 메모만 있음),
// 전에 만든 A11y Translator 웹(main1 · C:\A11\src)을 이 화면 안에 그대로 끼워 넣어 연결합니다.
//  - main1 은 끼워졌을 때(iframe) 자기 사이드바를 숨기므로, 메뉴는 Oreum 사이드바 + 아래 탭이 대신해요.
//  - main1 주소는 .env 의 VITE_A11Y_URL 로 바꿀 수 있어요 (기본: http://localhost:5173 = main1 의 npm run dev).
//  - 디자인이 정해지면 이 파일만 새 화면으로 바꾸면 됩니다.
import { useEffect, useState } from 'react'
import { GlassPanel, PageHeader, Segmented } from '@/ui'

const A11Y_URL = (import.meta.env.VITE_A11Y_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:5173'

const TABS = [
  { value: '/', label: '검사하기' },
  { value: '/todo/mine', label: '고칠 일' },
  { value: '/report', label: '리포트' },
] as const
type Tab = (typeof TABS)[number]['value']

type Status = 'checking' | 'online' | 'offline'

export function A11yPage() {
  const [tab, setTab] = useState<Tab>('/')
  const [status, setStatus] = useState<Status>('checking')
  const [attempt, setAttempt] = useState(0)

  // 검사 앱(main1)이 켜져 있는지 확인 — 꺼져 있으면 빈 화면 대신 안내를 보여 줘요
  useEffect(() => {
    let alive = true
    setStatus('checking')
    fetch(A11Y_URL, { mode: 'no-cors', cache: 'no-store' })
      .then(() => alive && setStatus('online'))
      .catch(() => alive && setStatus('offline'))
    return () => {
      alive = false
    }
  }, [attempt])

  return (
    <div className="flex h-full min-h-[560px] w-full flex-col px-(--gutter) pt-(--page-top) pb-(--gutter)">
      <PageHeader
        title="웹 접근성 검사"
        sub="만든 화면의 주소를 넣으면 접근성 문제를 찾아 주고, 고칠 일을 나눠 줘요."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented label="접근성 검사 메뉴" options={TABS} value={tab} onChange={setTab} />
            <a
              href={`${A11Y_URL}${tab}`}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
            >
              새 창으로 열기 ↗
            </a>
          </div>
        }
      />

      {/* 밝은 "종이" 한 장처럼: 시작하기 화면의 기획 문서와 같은 느낌 (바탕 #f3f2ee = 끼워진 앱의 바탕색) */}
      <GlassPanel className="mt-[clamp(12px,2vh,18px)] flex min-h-0 flex-1 flex-col overflow-hidden !bg-[#f3f2ee]">
        {status === 'online' && (
          <iframe key={tab} src={`${A11Y_URL}${tab}`} title="웹 접근성 검사 (A11y Translator)" className="min-h-0 w-full flex-1 bg-[#f3f2ee]" />
        )}
        {status === 'checking' && (
          <p role="status" className="m-auto text-sm text-muted">
            접근성 검사 화면을 불러오는 중…
          </p>
        )}
        {status === 'offline' && (
          <div role="alert" className="m-auto flex max-w-[440px] flex-col items-center gap-3 p-6 text-center">
            <p className="text-base font-bold text-ink">접근성 검사 앱이 꺼져 있어요</p>
            <p className="text-sm leading-relaxed text-muted">
              검사 화면은 전에 만든 A11y Translator 앱을 불러와서 보여 줘요.
              <br />
              <code className="font-mono text-ink">C:\A11</code> 폴더에서 <code className="font-mono text-ink">npm run dev</code> 를 켠 뒤 다시 시도해 주세요.
            </p>
            <p className="font-mono text-xs text-muted">{A11Y_URL}</p>
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:brightness-125">
              다시 불러오기
            </button>
          </div>
        )}
      </GlassPanel>
    </div>
  )
}
