import { useEffect, useState } from 'react'
import { useAppState } from '@/shared/store'
import { CURRENT_USER_ID, memberById } from '@/shared/mocks'
import { POPUP_PREVIEW } from '@/shared/mocks/popup'
import { InspectionPopup, type PopupScreen } from '@/extension/ui/InspectionPopup'

const screens = [
  { id: 'login', label: '로그인' },
  { id: 'ready', label: '검사 준비' },
  { id: 'scanning', label: '검사 진행' },
  { id: 'result', label: '검사 결과' },
  { id: 'empty', label: '이슈 없음' },
  { id: 'unsupported', label: '검사 불가' },
] as const

export function PopupDemo({
  initial = 'login',
  onViewResults,
  preview = false,
}: {
  initial?: PopupScreen
  onViewResults?: () => void
  preview?: boolean
}) {
  const state = useAppState()
  const [screen, setScreen] = useState<PopupScreen>(initial)
  const [projectId, setProjectId] = useState(state.projects[0]?.id ?? '')
  const [progress, setProgress] = useState(
    preview && initial === 'scanning' ? POPUP_PREVIEW.progress : 0,
  )
  const project = state.projects.find((p) => p.id === projectId)
  useEffect(() => {
    if (screen !== 'scanning' || (preview && initial === 'scanning')) return
    // shortcut: 디자인 시연용 진행률이며 실제 확장에서는 표시하지 않는다.
    const timer = window.setInterval(() => setProgress((p) => Math.min(100, p + 10)), 180)
    return () => window.clearInterval(timer)
  }, [screen, preview, initial])
  useEffect(() => {
    if (screen !== 'scanning' || progress !== 100) return
    const timer = window.setTimeout(() => setScreen('result'), 250)
    return () => window.clearTimeout(timer)
  }, [progress, screen])
  const categories = [...new Set(state.issues.map((i) => i.category))].map((label) => ({
    label,
    count: state.issues.filter((i) => i.category === label).length,
    important: state.issues.some((i) => i.category === label && i.priority === 'high'),
  }))
  const start = () => {
    setProgress(0)
    setScreen('scanning')
  }
  return (
    <InspectionPopup
      screen={screen}
      title={POPUP_PREVIEW.title}
      url={POPUP_PREVIEW.url}
      account={memberById(CURRENT_USER_ID)?.name}
      projects={state.projects}
      projectId={projectId}
      onProjectChange={setProjectId}
      version={(project?.currentVersion ?? state.currentVersion) + 1}
      lastScan={POPUP_PREVIEW.lastScan}
      scannedAt={POPUP_PREVIEW.scannedAt}
      total={state.issues.length}
      important={state.issues.filter((i) => i.priority === 'high').length}
      categories={categories}
      progress={progress}
      currentStep={
        preview && initial === 'scanning' ? 2 : Math.min(5, Math.floor((progress / 100) * 6))
      }
      onRescan={start}
      menu={
        <>
          <button type="button" onClick={() => setScreen('ready')}>
            검사 준비로
          </button>
          <button type="button" onClick={() => setScreen('login')}>
            로그인 화면 보기
          </button>
        </>
      }
      onPrimary={() => {
        if (screen === 'login' || screen === 'scanning') setScreen('ready')
        else if (screen === 'ready') start()
        else if (onViewResults) onViewResults()
        else
          window.open(`/projects/${projectId || 'b'}/inspection`, '_blank', 'noopener,noreferrer')
      }}
    />
  )
}

export default function PopupPreviewPage() {
  const requested = new URLSearchParams(location.search).get('screen')
  const [screen, setScreen] = useState<PopupScreen>(
    screens.find((s) => s.id === requested)?.id ?? 'login',
  )
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-[#e4e6ea] p-5 font-pretendard">
      <p className="text-sm text-muted-2">
        팝업 디자인 미리보기 · 로그인과 검사는 시연 데이터입니다
      </p>
      <nav aria-label="팝업 상태 미리보기" className="flex flex-wrap justify-center gap-2">
        {screens.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={screen === s.id}
            onClick={() => setScreen(s.id)}
            className="rounded-lg bg-white px-3 py-2 text-sm aria-pressed:bg-[#1d4ed8] aria-pressed:text-white"
          >
            {s.label}
          </button>
        ))}
      </nav>
      <div className="h-[600px] w-[400px] max-w-full overflow-hidden rounded-xl shadow-[0_12px_32px_#0003]">
        <PopupDemo key={screen} initial={screen} preview />
      </div>
      <a href="/extension" className="text-sm text-[#1d4ed8] underline">
        사이트와 함께 보기
      </a>
    </main>
  )
}
