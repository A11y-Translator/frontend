// 크롬 팝업 · 검사 결과 요약 + 저장 (Figma 758:3491 — 크롬 섹션 확정안, 400×600)
// "N가지 문제가 발견되었습니다" + 분류별 개수 칩 + 재검사 → 프로젝트·버전 고르고 "A11y 웹으로 전송하기"
// 분류 칩을 누르면 그 분류의 이슈 목록(02)이 사이드 패널로 열려요.
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAppState, actions } from '@/shared/store'
import type { Category } from '@/shared/api/types'
import { usePanel, useScreenFocus } from '@/extension/panelNav'
import { PopupButton, SelectField } from '@/extension/ui'
import { PROJECT_OPTIONS, scanStats } from '@/extension/scanStats'

const CARD = 'flex w-full shrink-0 flex-col rounded-xl border bg-white p-4'

export default function ScanSummaryScreen() {
  const state = useAppState()
  const { go, recheck } = usePanel()
  const stats = scanStats(state.issues)
  const titleRef = useScreenFocus<HTMLHeadingElement>()

  const cv = state.currentVersion
  const [project, setProject] = useState(PROJECT_OPTIONS[0])
  const [version, setVersion] = useState(cv)
  const [sent, setSent] = useState(false)
  const sentRef = useRef<HTMLDivElement>(null)

  // 저장 폼이 사라지므로 포커스를 완료 안내로 옮김
  useEffect(() => {
    if (sent) sentRef.current?.focus()
  }, [sent])

  const send = (e: FormEvent) => {
    e.preventDefault()
    actions.sendToWeb(project, version, stats.savedFixes > 0)
    setSent(true)
  }

  return (
    <form onSubmit={send} className="flex h-full w-full flex-col items-center justify-center gap-3 overflow-y-auto bg-[#f6f7f9] p-4 font-pretendard">
      <section aria-labelledby="summary-title" className={`${CARD} min-h-[249px] justify-between gap-4 border-ext-line`}>
        <h1 id="summary-title" ref={titleRef} tabIndex={-1} className="flex items-baseline gap-1.5 leading-[1.5] font-bold text-black">
          <span className="text-[28px]">{stats.total}가지</span>
          <span className="text-[15px]">문제가 발견되었습니다.</span>
        </h1>

        <ul aria-label="분류별 문제 수 · 누르면 이슈 목록이 열려요" className="flex flex-wrap gap-x-1 gap-y-[9px]">
          {stats.byCategory.map((c) => (
            <li key={c.label}>
              <button
                type="button"
                onClick={() => go({ name: 'result', filter: c.label as Category })}
                className="flex items-start gap-2 rounded-[11px] border border-[#adadad] bg-white px-1 py-0.5 text-xs leading-[1.45] font-medium text-[#2a2a2a] hover:border-black"
              >
                {c.label}
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] bg-[#6a6a6a] px-1.5 text-white">
                  {c.count}
                  <span className="sr-only">개 · 이슈 목록 보기</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5 text-xs leading-[1.5]">
          <p className="min-w-0 flex-1 text-[#6f6f6f]">{stats.scannedAt} 검사 · 수정사항이 생기면 다시 검사해주세요</p>
          <button
            type="button"
            onClick={() => recheck(false)}
            className="shrink-0 rounded-full bg-[#121212] px-2.5 py-[5px] font-bold text-white hover:bg-[#333]"
          >
            재검사
          </button>
        </div>
      </section>

      {sent ? (
        <div ref={sentRef} tabIndex={-1} role="status" className={`${CARD} gap-2.5 border-ext-frame`}>
          <p className="text-sm leading-[1.5] font-bold text-success">
            <span aria-hidden>✓ </span>웹으로 보냈어요
          </p>
          <p className="text-[13px] leading-[1.5] text-muted">
            {project} · 버전 {version}에 저장했어요. AI가 나눈 할 일은 웹의 ‘할 일 › 미배정’에서 볼 수 있어요.
          </p>
          {/* 웹 화면은 다른 앱이므로 import 하지 않고 주소로만 연결 */}
          <a
            href="/todo/unassigned"
            target="_blank"
            rel="noreferrer"
            className="self-start rounded-full bg-black px-4 py-2.5 text-sm leading-[1.4] font-bold text-white"
          >
            웹에서 할 일 보기<span className="sr-only"> (새 탭에서 열림)</span>
          </a>
        </div>
      ) : (
        <section aria-labelledby="summary-save-title" className={`${CARD} gap-2.5 border-ext-frame`}>
          <h2 id="summary-save-title" className="text-sm leading-[1.5] font-bold text-[#191b20]">검사 결과 저장</h2>
          <SelectField label="프로젝트" value={project} onChange={setProject}>
            {PROJECT_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </SelectField>
          <SelectField label="버전" value={String(version)} onChange={(v) => setVersion(Number(v))}>
            <option value={cv}>버전 {cv} · 새 버전으로 저장</option>
            {cv > 1 && <option value={cv - 1}>버전 {cv - 1} · 덮어쓰기</option>}
          </SelectField>
        </section>
      )}

      {sent ? (
        <PopupButton onClick={() => go({ name: 'result' })} className="-mx-2 w-[calc(100%+16px)] shrink-0">
          이슈 목록 보기
        </PopupButton>
      ) : (
        <PopupButton type="submit" className="-mx-2 w-[calc(100%+16px)] shrink-0">
          A11y 웹으로 전송하기
        </PopupButton>
      )}
    </form>
  )
}
