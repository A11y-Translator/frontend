// "복사" 텍스트 버튼 — 누르면 클립보드에 복사하고 "복사됨"을 화면낭독기에도 알려줍니다(aria-live).
import { useEffect, useRef, useState } from 'react'
import copyIcon from '@/shared/assets/figma/copy.svg'

interface CopyButtonProps {
  text: string
  /** 화면낭독기용: 무엇을 복사하는지 (예: "#616161") */
  what: string
}

export function CopyButton({ text, what }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      setFailed(true)
      return
    }
    setFailed(false)
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
        className="inline-flex min-h-6 min-w-6 shrink-0 items-center justify-center rounded px-1 text-xs leading-[1.5] font-medium whitespace-nowrap text-[#175fc2] hover:underline"
      >
        {copied ? '복사됨' : <img src={copyIcon} alt="" width="16" height="16" />}
      </button>
      <span role="status" className="sr-only">
        {failed ? '클립보드에 복사하지 못했어요.' : copied ? `${what} 복사됨` : ''}
      </span>
    </>
  )
}
