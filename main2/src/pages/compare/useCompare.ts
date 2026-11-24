// 버전 비교 두 화면(기본 · 심플)이 함께 쓰는 상태: 코멘트 · 선택 · 표시 토글 · 새 핀 위치.
// 백엔드가 붙기 전이라 화면 안에서만 기억합니다.
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { ME } from '@/data/mock'
import { COMMENTS, VERSIONS, type CompareComment, type VersionId } from './compareData'

export interface DraftPin {
  version: VersionId
  x: number
  y: number
}

export interface ShowState {
  /** 바뀐 곳 점선 */
  changes: boolean
  /** 디자인 코멘트 핀 */
  design: boolean
  /** 프론트(·백) 코멘트 핀 */
  front: boolean
  /** 해결된 코멘트 핀 */
  resolved: boolean
}

const PREVIEW = { w: 240, h: 500, pin: 22 }
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export function useCompare(initialShow?: Partial<ShowState>) {
  const [comments, setComments] = useState<CompareComment[]>(COMMENTS)
  const [selectedId, setSelectedId] = useState<number | null>(1)
  const [draft, setDraft] = useState<DraftPin | null>(null)
  const [show, setShow] = useState<ShowState>({ changes: true, design: true, front: true, resolved: true, ...initialShow })

  const openCount = useMemo(() => comments.filter((c) => !c.resolved).length, [comments])
  const resolvedCount = comments.length - openCount

  const toggleShow = useCallback((key: keyof ShowState) => setShow((s) => ({ ...s, [key]: !s[key] })), [])

  const toggleResolved = useCallback((id: number) => {
    setComments((list) => list.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c)))
  }, [])

  const addReply = useCallback((id: number, text: string) => {
    setComments((list) =>
      list.map((c) => (c.id === id ? { ...c, replies: [...c.replies, { author: ME.name, role: ME.role, time: '방금', text }] } : c)),
    )
  }, [])

  /** 새 코멘트: 찍어 둔 자리가 있으면 그 자리, 없으면 개발 서버 화면 가운데 */
  const addComment = useCallback(
    (text: string) => {
      const at = draft ?? { version: 'dev' as VersionId, x: (PREVIEW.w - PREVIEW.pin) / 2, y: (PREVIEW.h - PREVIEW.pin) / 2 }
      const id = Math.max(0, ...comments.map((c) => c.id)) + 1
      setComments((list) => [
        ...list,
        {
          id,
          author: ME.name,
          role: ME.role,
          time: '방금',
          resolved: false,
          version: at.version,
          place: `${VERSIONS[at.version].paneName} · 메인 피드`,
          text,
          simpleText: text,
          pin: { x: at.x, y: at.y },
          replies: [],
        },
      ])
      setDraft(null)
      setSelectedId(id)
      return id
    },
    [comments, draft],
  )

  /** 미리보기를 눌러 새 핀 자리를 찍기 (키보드로 누르면 화면 가운데) */
  const placeAt = useCallback((version: VersionId, e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const byKeyboard = e.detail === 0
    const px = byKeyboard ? rect.width / 2 : e.clientX - rect.left
    const py = byKeyboard ? rect.height / 2 : e.clientY - rect.top
    // 핀의 뾰족한 왼쪽 아래 끝이 누른 자리에 오도록
    setDraft({ version, x: clamp(px, 0, PREVIEW.w - PREVIEW.pin - 2), y: clamp(py - PREVIEW.pin, 0, PREVIEW.h - PREVIEW.pin - 2) })
  }, [])

  // 선택한 코멘트가 목록에서 보이도록 스크롤
  const items = useRef(new Map<number, HTMLElement>())
  const itemRef = useCallback(
    (id: number) => (el: HTMLElement | null) => {
      if (el) items.current.set(id, el)
      else items.current.delete(id)
    },
    [],
  )
  useEffect(() => {
    if (selectedId == null) return
    items.current.get(selectedId)?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  return {
    comments,
    selectedId,
    select: setSelectedId,
    draft,
    setDraft,
    show,
    toggleShow,
    setShow,
    openCount,
    resolvedCount,
    toggleResolved,
    addReply,
    addComment,
    placeAt,
    itemRef,
  }
}

export type CompareState = ReturnType<typeof useCompare>
