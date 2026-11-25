// 피그마 "Sheet · 2구간 할 일 추천" — 새 구간에 도착했을 때 뜨는 시트.
// 추천 할 일을 체크로 고르고 "할 일 N개 담기" 를 누르면 닫힙니다. (Esc · 바깥 클릭으로도 닫힘)
import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import dotBack from '@/assets/board/sheet-dot-back.svg'
import dotBlocked from '@/assets/board/sheet-dot-blocked.svg'
import dotDesign from '@/assets/board/sheet-dot-design.svg'
import dotFront from '@/assets/board/sheet-dot-front.svg'
import type { RoleId } from '@/data/mock'
import { useToast } from '@/ui/toast'
import { SECTION_SHEET } from './boardData'
import { TodoRow } from './TodoRow'

const PART_DOT: Record<RoleId, string> = { design: dotDesign, front: dotFront, back: dotBack }

/** 처음 체크 상태 (피그마: 6개 중 5개 담음) */
const INITIAL: Record<string, boolean> = Object.fromEntries(SECTION_SHEET.parts.flatMap((p) => p.todos.map((t) => [t.id, t.added])))

export function SectionTodoSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const toast = useToast()
  const [picked, setPicked] = useState(INITIAL)
  const count = Object.values(picked).filter(Boolean).length

  const add = () => {
    toast(`할 일 ${count}개를 2구간에 담았어요`)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[480px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 overflow-y-auto rounded-[28px] border border-line bg-surface p-[clamp(20px,5vw,28px)] shadow-[inset_0_1px_0_0_rgb(255_255_255/0.06),0_30px_60px_0_rgb(0_0_0/0.45)] backdrop-blur-[20px] outline-none">
          {/* 머리: 구간 칩 · 날짜 · 제목 · 설명 */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-[9.5px] border border-role-back/25 bg-role-back-bg px-2 py-[3px] text-[11px] leading-none font-bold whitespace-nowrap text-ink">
                {SECTION_SHEET.chip}
              </span>
              <span className="text-xs font-medium text-muted">{SECTION_SHEET.meta}</span>
            </div>
            <Dialog.Title className="text-[22px] leading-[1.35] font-bold tracking-[-0.02em] text-ink">{SECTION_SHEET.title}</Dialog.Title>
            <Dialog.Description className="text-sm leading-[1.45] text-muted">
              {SECTION_SHEET.desc.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </Dialog.Description>
          </div>

          {/* 1구간에서 이어지는 일 (막힌 요청) */}
          <section aria-labelledby="sheet-carry" className="flex flex-col gap-2">
            <h3 id="sheet-carry" className="text-xs font-bold text-muted">
              {SECTION_SHEET.carryTitle}
            </h3>
            <ul className="flex flex-col gap-2">
              {SECTION_SHEET.carry.map((c) => (
                <li key={c.id}>
                  <Link
                    to={c.path}
                    onClick={() => onOpenChange(false)}
                    className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-fill px-3 py-2.5 hover:border-ink/20"
                  >
                    <img src={dotBlocked} alt="" className="size-[7px] shrink-0" />
                    <span className="text-[13px] font-bold text-ink">{c.title}</span>
                    <span className="min-w-0 flex-1 text-xs text-muted">{c.flow}</span>
                    <span className="text-xs font-bold whitespace-nowrap text-danger">{c.status}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* 이번 구간 추천 할 일 — 파트별로 체크해서 고르기 */}
          <section aria-labelledby="sheet-recommend" className="flex flex-col gap-3">
            <h3 id="sheet-recommend" className="text-xs font-bold text-muted">
              {SECTION_SHEET.recommendTitle}
            </h3>
            {SECTION_SHEET.parts.map((part) => (
              <fieldset key={part.role} className="m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0">
                <legend className="mb-1.5 flex items-center gap-1.5 p-0 text-[11px] font-bold text-muted">
                  <img src={PART_DOT[part.role]} alt="" className="size-1.5" />
                  {part.label}
                </legend>
                {part.todos.map((t) => (
                  <TodoRow
                    key={t.id}
                    tone="sheet"
                    label={t.label}
                    source={t.source}
                    checked={picked[t.id]}
                    onChange={(v) => setPicked((p) => ({ ...p, [t.id]: v }))}
                  />
                ))}
              </fieldset>
            ))}
          </section>

          <p className="text-right text-xs leading-[1.45] text-muted">{SECTION_SHEET.nextNote}</p>

          {/* 아래 버튼: 나중에 / 담기 */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Dialog.Close className="rounded-full border border-line px-[18px] py-[11px] text-[13px] leading-none font-bold whitespace-nowrap text-ink hover:bg-fill-2">
              {SECTION_SHEET.later}
            </Dialog.Close>
            <button
              type="button"
              onClick={add}
              disabled={count === 0}
              className="rounded-[19px] bg-primary px-5 py-[11px] text-[13px] leading-none font-bold whitespace-nowrap text-on-primary hover:brightness-105 active:brightness-95 disabled:opacity-50"
            >
              할 일 {count}개 담기
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
