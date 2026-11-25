// 본문 한 화면의 바깥 여백: 좌우 --gutter, 위 --page-top (styles/index.css 에서 모든 화면 공통으로 정함).
import type { ReactNode } from 'react'

export function Page({ children, className = '' }: { children: ReactNode; className?: string; /** (예전 옵션 · 이제 모든 화면이 같은 위 여백) */ top?: 'header' | 'tight' }) {
  return (
    <div
      className={`flex min-h-full w-full flex-col px-(--gutter) pb-6 pt-(--page-top) ${className}`}
    >
      {children}
    </div>
  )
}
