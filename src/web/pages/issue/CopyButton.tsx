// "복사" 텍스트 버튼 — 누르면 클립보드에 복사하고 "복사됨"을 화면낭독기에도 알려줍니다(aria-live).
import { useEffect, useRef, useState } from 'react'

interface CopyButtonProps {
  text: string
  /** 화면낭독기용: 무엇을 복사하는지 (예: "#616161") */
  what: string
}

export function CopyButton({ text, what }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* 클립보드 권한이 없는 환경(프로토타입)에서도 흐름은 보여줍니다 */
    }
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={`${what} 복사`}
        className="shrink-0 rounded px-1 text-xs leading-[1.5] font-medium whitespace-nowrap text-[#175fc2] hover:underline"
      >
        {copied ? '복사됨' : '복사'}
      </button>
      <span role="status" className="sr-only">
        {copied ? `${what} 복사됨` : ''}
      </span>
    </>
  )
}
