// 수정값(코드/문구) + 복사 버튼 (03 · 체크리스트 공통)
import { useEffect, useState } from 'react'

export function CodeCopy({ text, label = '수정값' }: { text: string; label?: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  // 내용이 바뀌면 "복사됨" 표시 초기화
  useEffect(() => setStatus('idle'), [text])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch {
      // http 환경 등에서 clipboard API 를 못 쓰는 경우
      setStatus('failed')
    }
  }

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex w-full items-center gap-2 rounded-lg bg-ink-2 px-3 py-2.5 text-xs leading-[1.5] text-white">
        <code className="min-w-0 flex-1 font-noto break-all whitespace-pre-wrap">{text}</code>
        <button
          type="button"
          onClick={copy}
          aria-label={`${label} 복사`}
          className="shrink-0 rounded px-1 font-bold hover:underline focus-visible:outline-white"
        >
          {status === 'copied' ? '복사됨' : '복사'}
        </button>
      </div>
      <p aria-live="polite" className={status === 'idle' ? 'sr-only' : 'text-[11px] text-muted'}>
        {status === 'copied' && '클립보드에 복사했어요.'}
        {status === 'failed' && '복사하지 못했어요. 글자를 직접 선택해 복사해 주세요.'}
      </p>
    </div>
  )
}
