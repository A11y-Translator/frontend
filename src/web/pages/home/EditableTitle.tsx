// 폴더 카드 제목을 눌러서 바로 이름을 바꾸는 입력칸 (새 프로젝트 화면)
// 클릭/Enter → 입력 모드, Enter·포커스 이동 → 저장, Esc → 취소
import { useEffect, useRef, useState } from 'react'

interface EditableTitleProps {
  value: string
  onChange: (value: string) => void
  /** 화면낭독기용 이름 (예: 프로젝트 이름) */
  label: string
  maxLength?: number
  className?: string
}

export function EditableTitle({ value, onChange, label, maxLength = 40, className = '' }: EditableTitleProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const skipCommit = useRef(false)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const start = () => {
    setDraft(value)
    setEditing(true)
  }
  const finish = (save: boolean) => {
    if (save) {
      const next = draft.trim()
      // 비우면 원래 이름 유지
      if (next) onChange(next)
    }
    setEditing(false)
    // 입력칸이 사라진 뒤 버튼으로 포커스를 돌려 키보드 위치를 잃지 않게
    requestAnimationFrame(() => buttonRef.current?.focus())
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        aria-label={label}
        value={draft}
        maxLength={maxLength}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          // 한글 조합 중 Enter 는 글자 확정용이라 무시 (안 그러면 마지막 글자가 잘림)
          if (e.nativeEvent.isComposing) return
          if (e.key === 'Enter') {
            e.preventDefault()
            skipCommit.current = true
            finish(true)
          } else if (e.key === 'Escape') {
            e.preventDefault()
            skipCommit.current = true
            finish(false)
          }
        }}
        onBlur={() => {
          if (skipCommit.current) {
            skipCommit.current = false
            return
          }
          finish(true)
        }}
        className={`rounded-md bg-white/90 px-1.5 -mx-1.5 outline-2 outline-accent ${className}`}
      />
    )
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={start}
      title="눌러서 이름 바꾸기"
      className={`group -mx-1.5 rounded-md px-1.5 text-left hover:bg-black/5 ${className}`}
    >
      <span className="sr-only">{label}: </span>
      {value}
      <span aria-hidden className="ml-1.5 text-sm font-normal text-muted-2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
        ✎
      </span>
      <span className="sr-only">, 눌러서 이름 바꾸기</span>
    </button>
  )
}
