// 프로젝트 폴더 카드 오른쪽 위 ⋮ 메뉴 → 삭제 (확인창을 한 번 더 거칩니다)
// 카드 자체가 링크라서 메뉴 버튼은 링크 "밖"(형제 요소)에 겹쳐 둡니다 — 링크 안에 버튼을 넣으면 접근성 오류.
import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'
import { actions } from '@/shared/store'
import type { Project } from '@/shared/api/types'

interface Props {
  project: Project
  /** 검사 기록 버전 수 (확인창 안내용) */
  versions: number
  /** 카드가 파란(진행 중) 배경이면 흰 아이콘 */
  onDark?: boolean
  announce: (message: string) => void
}

export function ProjectCardMenu({ project, versions, onDark = false, announce }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const remove = async () => {
    setBusy(true)
    setError('')
    try {
      await actions.deleteProject(project.id)
      setConfirmOpen(false)
      announce(`‘${project.name}’ 프로젝트를 삭제했어요`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제하지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          aria-label={`${project.name} 더보기`}
          className={`flex size-8 items-center justify-center rounded-full transition-colors ${
            onDark ? 'text-white hover:bg-white/20 data-[state=open]:bg-white/20' : 'text-ink-3 hover:bg-black/5 data-[state=open]:bg-black/5'
          }`}
        >
          {/* ⋮ (세로 점 세 개) */}
          <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-[160px] rounded-xl border border-web-line bg-white p-1.5 font-noto shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          >
            <DropdownMenu.Item
              onSelect={() => setConfirmOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-danger outline-none data-[highlighted]:bg-[#fdecec]"
            >
              <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
              </svg>
              프로젝트 삭제
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <Dialog.Root open={confirmOpen} onOpenChange={(o) => !busy && setConfirmOpen(o)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex w-[420px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-[20px] bg-white px-7 pt-7 pb-6 font-noto leading-[1.45] shadow-[0_16px_48px_rgba(0,0,0,0.2)] outline-none">
            <Dialog.Title className="text-[20px] font-bold text-ink-2">프로젝트를 삭제할까요?</Dialog.Title>
            <Dialog.Description className="text-sm text-muted-2">
              <strong className="font-bold text-ink-2">‘{project.name}’</strong>
              {versions > 0 ? `과 검사 기록 ${versions}개 버전이` : '이'} 모두 지워져요. 삭제하면 되돌릴 수 없어요.
            </Dialog.Description>
            {error && (
              <p role="alert" className="text-sm font-medium text-danger">
                {error}
              </p>
            )}
            <div className="mt-2 flex justify-end gap-2">
              <Dialog.Close
                disabled={busy}
                className="rounded-full border border-ext-line bg-white px-4 py-2.5 text-sm font-bold text-black hover:bg-web-chip disabled:opacity-50"
              >
                취소
              </Dialog.Close>
              <button
                type="button"
                onClick={remove}
                aria-disabled={busy || undefined}
                className="rounded-full bg-danger px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 aria-disabled:cursor-wait aria-disabled:opacity-60"
              >
                {busy ? '삭제 중…' : '삭제'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
