// 서버 모드(http) 전용 문지기: 이 브라우저에 없는 검사 결과를 서버에서 받아 온 뒤에 검사 화면(children)을 보여줍니다.
// 다른 모드이거나 이미 결과가 있으면 그대로 통과시켜요.
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { actions, SERVER_MODE, useAppState } from '@/shared/store'

const messageOf = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback)

export function ServerInspectionGate({ projectId, children }: { projectId: string; children: ReactNode }) {
  const { inspections, projects } = useAppState()
  /** 서버에 물어본 결과: projectId → '' (끝남) | 오류 메시지 */
  const [asked, setAsked] = useState<Record<string, string>>({})
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')

  useEffect(() => {
    if (!SERVER_MODE) return
    let cancelled = false
    actions
      .loadInspection(projectId)
      .then(
        () => '',
        (e) => messageOf(e, '검사 결과를 불러오지 못했어요.'),
      )
      .then((result) => {
        if (!cancelled) setAsked((a) => ({ ...a, [projectId]: result }))
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (!SERVER_MODE || inspections[projectId]) return children

  const loadError = asked[projectId]
  if (loadError === undefined) {
    return (
      <p role="status" className="page-x pt-10 font-noto text-[15px] text-muted-2">
        검사 결과를 불러오는 중이에요…
      </p>
    )
  }

  const project = projects.find((p) => p.id === projectId)
  // 서버 프로젝트가 아닌 주소(예: 데모 프로젝트B)는 기존 데모 화면 그대로
  if (!project && !loadError) return children

  const scan = async () => {
    if (scanning) return
    setScanning(true)
    setScanError('')
    try {
      await actions.reinspect(projectId)
    } catch (e) {
      setScanError(messageOf(e, '검사하지 못했어요.'))
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="page-x flex flex-col items-start gap-4 pt-10 font-noto">
      <h1 className="text-[30px] leading-[1.45] font-bold text-ink-2">{project?.name ?? '접근성 검사'}</h1>
      {loadError || scanError ? (
        <p role="alert" className="text-[15px] text-[#b3261e]">
          {loadError || scanError}
        </p>
      ) : (
        <p className="text-[15px] text-muted-2">아직 끝난 검사가 없어요. 검사를 시작해 보세요.</p>
      )}
      <div className="flex items-center gap-3">
        {project && (
          <button
            type="button"
            onClick={scan}
            aria-disabled={scanning || undefined}
            className="rounded-full bg-black px-4 py-2.5 text-sm leading-[1.4] font-bold text-white hover:bg-ink-3 aria-disabled:cursor-wait aria-disabled:bg-muted-2"
          >
            {scanning ? '검사 중…' : '검사하기'}
          </button>
        )}
        <Link to="/" className="text-sm font-bold text-[#175fc2] underline">
          프로젝트 목록으로
        </Link>
      </div>
    </div>
  )
}
