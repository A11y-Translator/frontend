// 프로젝트 홈 / 빈 홈 공통: URL 입력 pill + 검사하기 버튼 (Figma 533:7100, 533:7211)
// 디자인(높이 80px, 글자 24px)이 실제 화면에서 너무 커 보여서 높이 56px · 글자 16px 로 줄였습니다.
// "여러 페이지 함께 검사"(디자인에 없는 옵션): 같은 사이트의 다른 페이지를 직접 넣거나, 첫 페이지 링크에서 자동으로 찾아요.
import { useId, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { normalizeUrl, parseExtraPages } from '@/shared/api/url'
import { MAX_PAGES, type InspectProgress } from '@/shared/api/types'
import type { MultiPageOptions } from './useCreateAndInspect'

/** onInspect 를 안 넘겼을 때만: 데모용으로 프로젝트B 검사 화면으로 이동 (홈·새 프로젝트 화면은 onInspect 로 실제 검사) */
const INSPECTION_PATH = '/projects/b/inspection'
const DISCOVER_OPTIONS = [3, 5, MAX_PAGES - 1]

interface UrlInspectFormProps {
  /** 입력칸을 설명하는 다른 요소의 id (예: 빈 홈 안내 문구) */
  describedBy?: string
  className?: string
  /**
   * 있으면 정리된 주소(https://…)로 이 함수를 부르고, 끝날 때까지 "검사 중" 상태를 보여줍니다.
   * 예외를 던지면 그 메시지를 오류로 표시합니다. (새 프로젝트 화면: 프로젝트 생성 + 검사)
   * multi: "여러 페이지 함께 검사"를 켰을 때만. onProgress 로 알려 준 진행 상황을 폼이 보여줘요.
   */
  onInspect?: (url: string, multi?: MultiPageOptions, onProgress?: (p: InspectProgress) => void) => Promise<void>
}

export function UrlInspectForm({ describedBy, className = '', onInspect }: UrlInspectFormProps) {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<InspectProgress | null>(null)
  const [multiOpen, setMultiOpen] = useState(false)
  const [extraText, setExtraText] = useState('')
  const [discoverOn, setDiscoverOn] = useState(false)
  const [discoverCount, setDiscoverCount] = useState(DISCOVER_OPTIONS[1])
  const inputRef = useRef<HTMLInputElement>(null)
  const extraRef = useRef<HTMLTextAreaElement>(null)
  const inputId = useId()
  const errorId = useId()
  const panelId = useId()
  const extraId = useId()
  const extraHintId = useId()
  const countId = useId()

  const fail = (message: string, focus: HTMLElement | null = inputRef.current) => {
    setError(message)
    focus?.focus()
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    const checked = normalizeUrl(url)
    if (!checked.ok) return fail(checked.message)
    if (!onInspect) {
      navigate(INSPECTION_PATH, { state: { url: checked.url } })
      return
    }
    let multi: MultiPageOptions | undefined
    if (multiOpen) {
      const extra = parseExtraPages(extraText, checked.url, MAX_PAGES - 1)
      if (!extra.ok) return fail(extra.message, extraRef.current)
      const discover = discoverOn ? discoverCount : 0
      if (extra.urls.length || discover) multi = { extraUrls: extra.urls, discover }
    }
    setBusy(true)
    setProgress(null)
    try {
      await onInspect(checked.url, multi, setProgress)
    } catch (err) {
      fail(err instanceof Error && err.message ? err.message : '검사하지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const describedByIds = [error ? errorId : null, describedBy].filter(Boolean).join(' ') || undefined
  const progressText =
    busy && progress && progress.total > 1
      ? `페이지 ${Math.min(progress.done + (progress.done < progress.total ? 1 : 0), progress.total)}/${progress.total} 검사 중 · ${progress.page}`
      : ''

  return (
    <form onSubmit={onSubmit} noValidate aria-label="페이지 검사" className={className}>
      {/* 입력칸 자체 테두리 대신 pill 전체에 포커스 링을 그립니다 */}
      <div className="flex items-center gap-3 rounded-full border border-web-line bg-white py-1.5 pr-1.5 pl-6 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent">
        <label htmlFor={inputId} className="sr-only">
          검사할 페이지 주소
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          placeholder="http://"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            if (error) setError('')
          }}
          aria-invalid={!!error || undefined}
          readOnly={busy}
          aria-describedby={describedByIds}
          className="min-w-0 flex-1 bg-transparent font-noto text-base leading-[1.45] text-ink outline-none placeholder:text-placeholder"
        />
        <button
          type="submit"
          aria-disabled={busy || undefined}
          className="h-11 shrink-0 rounded-full bg-black px-7 font-noto text-[15px] leading-[1.45] font-medium text-white hover:bg-ink-3 aria-disabled:cursor-wait aria-disabled:bg-muted-2"
        >
          {busy ? '검사 중…' : '검사하기'}
        </button>
      </div>

      {onInspect && (
        <div className="mt-2 px-6">
          <button
            type="button"
            aria-expanded={multiOpen}
            aria-controls={panelId}
            onClick={() => setMultiOpen((v) => !v)}
            className="rounded font-noto text-[13px] leading-[1.45] font-medium text-[#175fc2] hover:underline"
          >
            여러 페이지 함께 검사 <span aria-hidden>{multiOpen ? '▴' : '▾'}</span>
          </button>
          {multiOpen && (
            <div id={panelId} className="mt-2 flex flex-col gap-3 rounded-xl border border-web-line bg-white p-4 font-noto">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={extraId} className="text-sm leading-[1.45] font-medium text-ink-2">
                  함께 검사할 페이지
                </label>
                <textarea
                  ref={extraRef}
                  id={extraId}
                  rows={3}
                  spellCheck={false}
                  value={extraText}
                  readOnly={busy}
                  onChange={(e) => {
                    setExtraText(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder={'/pricing\n/contact'}
                  aria-describedby={extraHintId}
                  className="resize-y rounded-lg border border-web-line px-3 py-2 text-sm leading-[1.5] text-ink placeholder:text-placeholder"
                />
                <p id={extraHintId} className="text-xs leading-[1.45] text-muted-2">
                  한 줄에 하나씩, 위 주소와 같은 사이트의 경로나 주소를 넣어 주세요. 첫 페이지까지 합쳐 최대 {MAX_PAGES}개를 검사해요.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <label className="flex cursor-pointer items-center gap-2 text-sm leading-[1.45] text-ink-2">
                  <input
                    type="checkbox"
                    checked={discoverOn}
                    disabled={busy}
                    onChange={(e) => setDiscoverOn(e.target.checked)}
                    className="size-4 accent-ink-2"
                  />
                  첫 페이지의 링크에서 페이지 자동으로 찾기
                </label>
                <label htmlFor={countId} className="sr-only">
                  자동으로 찾을 페이지 수
                </label>
                <select
                  id={countId}
                  value={discoverCount}
                  disabled={!discoverOn || busy}
                  onChange={(e) => setDiscoverCount(Number(e.target.value))}
                  className="rounded-md border border-web-line bg-white px-2 py-1 text-sm text-ink-2 disabled:text-muted-2"
                >
                  {DISCOVER_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      최대 {n}개
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs leading-[1.45] text-muted-2">
                페이지마다 5~15초쯤 걸려요. 로그인 없이 열리는 페이지만 검사할 수 있어요.
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-2 px-6 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <p role="status" className={progressText ? 'mt-2 px-6 font-noto text-sm font-medium text-ink-2' : 'sr-only'}>
        {progressText || (busy ? '페이지를 검사하고 있어요. 잠시만 기다려 주세요.' : '')}
      </p>
    </form>
  )
}
