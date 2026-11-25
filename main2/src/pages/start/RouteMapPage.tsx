// Figma: R00 기획 · 루트 만들기 (루트 화면) — 시작하기와 같은 "프로젝트 시작하기" 제목 아래에서 루트를 미리 보고 출발합니다.
//  - 왼쪽: 어두운 "프로젝트 루트" 패널 (3D 산 · 끌어서 회전) + 아래 체크포인트 칩(이름 · 기간)
//  - 오른쪽: 흰 "루트 상세 내용" (체크포인트 목록 · 수정) / 맨 아래: 루트 수정하기 · 이 루트로 출발하기
//  - 오른쪽 위: "정상까지 D-14" 칩 + 아바타
//  - 목록의 체크포인트와 산 위 핀이 서로 연결돼요 (하나를 고르면 다른 쪽도 강조)
//  - "수정하기": 체크포인트 이름 바꾸기 · 순서 바꾸기 · 추가 · 삭제 → 산 위 루트와 핀이 바로 따라 바뀜
//    (체크포인트는 planStore 에 저장 — AI 추천 결과가 달라져도 같은 방식으로 산에 반영됩니다)
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SUMMIT } from '@/data/mock'
import { errorMessage } from '@/api/http'
import { checkpointRanges, deadlineText, MAX_CHECKPOINTS, recommendRoute, updatePlan, usePlan, type PlanCheckpoint } from '@/data/planStore'
import { Page } from '@/layout/Page'
import { AiChip, GhostButton, GlassPanel, Mono, PageHeader, PrimaryButton } from '@/ui'
import { useToast } from '@/ui/toast'
import { makeRouteStops, Mountain3D, type PinInfo } from './Mountain3D'
import { StartTopBar } from './StartTopBar'

const ROW = 'flex w-full flex-col items-start gap-1 border px-[15px] py-[11.5px] text-left transition-colors'
const rowClass = (on: boolean) => `${ROW} ${on ? 'border-ink/40 bg-fill-3' : 'border-line bg-fill hover:bg-fill-3'}`
const ICON_BTN = 'flex size-7 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-fill-3 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent'

export function RouteMapPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const plan = usePlan()
  const deadline = deadlineText(plan)
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const toggle = (id: string) => setSelected((cur) => (cur === id ? null : id))
  const cps = plan.checkpoints
  const ranges = useMemo(() => checkpointRanges(plan), [plan])

  // 체크포인트 목록 → 산 위 위치(stops)와 핀. 목록이 바뀌면 자동으로 다시 계산돼요.
  const stops = useMemo(() => makeRouteStops(cps.map((c) => ({ id: c.id }))), [cps])
  const pins = useMemo<PinInfo[]>(
    () => [
      { id: 'start', label: 'S', name: '출발 · 베이스 캠프 (오늘)', callout: { strong: '출발', text: '오늘' } },
      ...cps.map((c, i) => ({ id: c.id, label: String(i + 1), name: `체크포인트 ${i + 1} · ${c.name || '이름 없음'}` })),
      { id: 'summit', label: '정상', name: `정상 · ${SUMMIT.name} (${deadline.short})`, callout: { strong: '정상', text: deadline.short } },
    ],
    [cps, deadline.short],
  )

  const setCps = (next: PlanCheckpoint[]) => updatePlan({ checkpoints: next })
  const rename = (id: string, name: string) => setCps(cps.map((c) => (c.id === id ? { ...c, name } : c)))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= cps.length) return
    const next = [...cps]
    ;[next[i], next[j]] = [next[j], next[i]]
    setCps(next)
    toast(`${next[j].name || '체크포인트'} — ${j + 1}번째로 옮겼어요`)
  }
  const remove = (id: string) => {
    setCps(cps.filter((c) => c.id !== id))
    if (selected === id) setSelected(null)
  }
  const add = () => {
    if (cps.length >= MAX_CHECKPOINTS) return
    const id = `c${Date.now().toString(36)}`
    setCps([...cps, { id, name: '새 체크포인트' }])
    setSelected(id)
  }
  const finishEdit = () => {
    // 빈 이름은 저장하지 않음
    setCps(cps.map((c, i) => ({ ...c, name: c.name.trim() || `체크포인트 ${i + 1}` })))
    setEditing(false)
    toast('루트를 고쳤어요')
  }
  // 추천으로 되돌리기: 같은 기획안으로 추천 루트를 다시 받아 옴 (api.route.recommend — 목업은 기본 체크포인트)
  const restore = async () => {
    setRestoring(true)
    try {
      await recommendRoute()
      setSelected(null)
      toast('AI 추천 루트로 되돌렸어요')
    } catch (e) {
      toast(`추천 루트를 불러오지 못했어요 — ${errorMessage(e)}`)
    } finally {
      setRestoring(false)
    }
  }

  return (
    <Page>
      <StartTopBar showDday />
      <PageHeader title="프로젝트 시작하기" sub="기획안을 기반으로 프로젝트 완주길을 생성합니다." />

      <div className="mt-[clamp(16px,3vh,24px)] grid min-h-0 flex-1 grid-cols-1 items-stretch gap-[19px] @4xl:grid-cols-[minmax(0,1fr)_316px]">
        {/* 프로젝트 루트 (3D 산) — Figma 에서도 이 패널만 어두워요 */}
        <section
          aria-labelledby="route-preview-title"
          className="theme-dark relative flex h-[clamp(420px,70vh,640px)] flex-col overflow-hidden rounded-[27px]"
          style={{ backgroundImage: 'linear-gradient(141.6deg, rgb(42 44 48) 0%, rgb(22 23 26) 71.4%)' }}
        >
          <div className="pointer-events-none relative z-10 flex items-start justify-between gap-3 px-7 pt-6">
            <h2 id="route-preview-title" className="text-lg leading-tight font-bold tracking-[-0.02em] text-ink">
              프로젝트 루트
            </h2>
            <p aria-live="polite" className="flex items-center gap-1.5 rounded-full bg-fill-3 px-2.5 py-1 text-[11px] font-medium text-ink">
              <span aria-hidden className="size-1.5 rounded-full bg-summit" />
              {cps.length > 0 ? `기획안에서 자동으로 찾았어요 · 체크포인트 ${cps.length}개` : '체크포인트가 아직 없어요'}
            </p>
          </div>
          <Mountain3D stops={stops} pins={pins} selected={selected} onSelect={toggle} className="-mt-4 min-h-0 flex-1" />

          {/* 체크포인트 칩: 이름 · 기간 (누르면 산 위 핀도 강조) */}
          <ol aria-label="체크포인트 기간" className="relative z-10 flex flex-wrap gap-2 px-5 pb-5">
            {cps.map((c, i) => {
              const on = selected === c.id
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(c.id)}
                    className={`flex flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left transition-colors ${on ? 'bg-fill-3 ring-1 ring-summit/70' : 'bg-fill-2 hover:bg-fill-3'}`}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-bold text-ink">
                      <span aria-hidden className="size-1.5 rounded-full bg-checkpoint" />
                      {i + 1} · {c.name || '이름 없음'}
                    </span>
                    <Mono className="text-[11px] text-muted">{ranges[i]}</Mono>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>

        {/* 오른쪽: 루트 상세 내용 + 버튼 */}
        <div className="flex min-w-0 flex-col gap-4">
          <GlassPanel className="flex min-h-0 flex-1 flex-col gap-4 px-5 pt-6 pb-[18px]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-ink">루트 상세 내용</h2>
                <AiChip />
              </div>
              <p className="text-xs text-muted">
                {editing ? `이름·순서를 고치면 산 위 루트가 바로 바뀌어요. (최대 ${MAX_CHECKPOINTS}개)` : '각 체크포인트에 도달하면 세부 일정을 추천합니다.'}
              </p>
            </div>

            <ol className="flex flex-col gap-[9.6px] overflow-y-auto">
              {/* 0 · 베이스 캠프 (출발) — 고정 */}
              <li>
                <button type="button" aria-pressed={selected === 'start'} onClick={() => toggle('start')} className={`${rowClass(selected === 'start')} rounded-xl`}>
                  <span className="flex items-center gap-1.5 leading-none">
                    <Mono className="text-[11.5px] text-muted">S</Mono>
                    <span className="text-[12.5px] font-bold text-ink">출발 · 베이스 캠프</span>
                  </span>
                  <Mono className="text-[10.5px] text-muted">오늘</Mono>
                </button>
              </li>

              {cps.map((c, i) => {
                const on = selected === c.id
                if (!editing)
                  return (
                    <li key={c.id}>
                      <button type="button" aria-pressed={on} onClick={() => toggle(c.id)} className={`${rowClass(on)} rounded-xl`}>
                        <span className="flex items-center gap-1.5 leading-none">
                          <Mono className="text-[11.5px] text-checkpoint-text">{i + 1}</Mono>
                          <span className="text-[12.5px] font-bold text-ink">{c.name}</span>
                        </span>
                        <Mono className="text-[10.5px] text-muted">{ranges[i]}</Mono>
                      </button>
                    </li>
                  )
                // 수정 중: 이름 입력 + 위/아래 + 삭제
                return (
                  <li key={c.id} className={`flex items-center gap-1 rounded-xl border py-1 pr-1 pl-[15px] ${on ? 'border-ink/40 bg-fill-3' : 'border-line bg-fill'}`}>
                    <Mono className="text-[11.5px] text-checkpoint-text">{i + 1}</Mono>
                    <input
                      value={c.name}
                      onChange={(e) => rename(c.id, e.target.value)}
                      onFocus={() => setSelected(c.id)}
                      maxLength={20}
                      aria-label={`체크포인트 ${i + 1} 이름`}
                      className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-1.5 text-[12.5px] font-bold text-ink outline-none focus-visible:bg-fill-3"
                    />
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`${c.name} 위로 옮기기`} className={ICON_BTN}>
                      <Arrow up />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === cps.length - 1} aria-label={`${c.name} 아래로 옮기기`} className={ICON_BTN}>
                      <Arrow />
                    </button>
                    <button type="button" onClick={() => remove(c.id)} aria-label={`${c.name} 삭제`} className={`${ICON_BTN} hover:text-blocked`}>
                      <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
                      </svg>
                    </button>
                  </li>
                )
              })}

              {editing && (
                <li>
                  <button
                    type="button"
                    onClick={add}
                    disabled={cps.length >= MAX_CHECKPOINTS}
                    className="w-full rounded-xl border border-dashed border-line px-[15px] py-[11.5px] text-left text-[12.5px] font-medium text-muted hover:text-ink disabled:opacity-40"
                  >
                    {cps.length >= MAX_CHECKPOINTS ? `최대 ${MAX_CHECKPOINTS}개까지 넣을 수 있어요` : '+ 체크포인트 추가'}
                  </button>
                </li>
              )}

              {/* 정상 — 고정 (마감일은 시작하기에서 정한 값) */}
              <li>
                <button type="button" aria-pressed={selected === 'summit'} onClick={() => toggle('summit')} className={`${rowClass(selected === 'summit')} rounded-2xl`}>
                  <span className="flex items-center gap-1.5 text-[12.5px] leading-none font-bold">
                    <span aria-hidden className="size-2 rounded-full bg-summit" />
                    <span className="text-ink">정상 · {SUMMIT.name}</span>
                  </span>
                  <Mono className="text-[10.5px] text-muted">{deadline.short}</Mono>
                </button>
              </li>
            </ol>
          </GlassPanel>

          {editing ? (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <GhostButton onClick={() => void restore()} disabled={restoring} aria-busy={restoring || undefined} className="disabled:opacity-50">
                {restoring ? '불러오는 중…' : '추천으로 되돌리기'}
              </GhostButton>
              <PrimaryButton onClick={finishEdit}>수정 완료</PrimaryButton>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <GhostButton onClick={() => setEditing(true)} className="bg-surface">
                루트 수정하기
              </GhostButton>
              <PrimaryButton onClick={() => navigate('/board')}>
                이 루트로 출발하기 <span aria-hidden className="ml-1.5">→</span>
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </Page>
  )
}

function Arrow({ up = false }: { up?: boolean }) {
  return (
    <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={up ? '' : 'rotate-180'}>
      <path d="M6 9.5v-7M3 5l3-3 3 3" />
    </svg>
  )
}
