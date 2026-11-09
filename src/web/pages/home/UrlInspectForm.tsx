// 프로젝트 홈 / 빈 홈 공통: URL 입력 pill + 검사하기 버튼 (Figma 533:7100, 533:7211)
// 디자인(높이 80px, 글자 24px)이 실제 화면에서 너무 커 보여서 높이 56px · 글자 16px 로 줄였습니다.
import { useId, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

/** 프로토타입: 어떤 URL 이든 진행 중인 프로젝트B 의 검사 화면으로 이동 */
const INSPECTION_PATH = '/projects/b/inspection'

interface UrlInspectFormProps {
  /** 입력칸을 설명하는 다른 요소의 id (예: 빈 홈 안내 문구) */
  describedBy?: string
  className?: string
}

export function UrlInspectForm({ describedBy, className = '' }: UrlInspectFormProps) {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const errorId = useId()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const value = url.trim()
    if (!value) {
      setError(true)
      inputRef.current?.focus()
      return
    }
    navigate(INSPECTION_PATH, { state: { url: value } })
  }

  const describedByIds = [error ? errorId : null, describedBy].filter(Boolean).join(' ') || undefined

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
            if (error) setError(false)
          }}
          aria-invalid={error || undefined}
          aria-describedby={describedByIds}
          className="min-w-0 flex-1 bg-transparent font-noto text-base leading-[1.45] text-ink outline-none placeholder:text-placeholder"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-full bg-black px-7 font-noto text-[15px] leading-[1.45] font-medium text-white hover:bg-ink-3"
        >
          검사하기
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 px-6 text-sm font-medium text-danger">
          검사할 페이지 주소를 입력해 주세요.
        </p>
      )}
    </form>
  )
}
