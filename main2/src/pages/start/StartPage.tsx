// Figma: 시작하기/default (1094:5810) — 마감일·역할·기획안을 넣고 "루트 생성하기".
//  - 왼쪽: 일정(마감일, 역할) + 기획안(파일/링크/직접 입력) + 루트 생성하기
//  - 오른쪽: 기획 문서 미리보기 (제목과 같은 높이에서 시작해 화면 아래까지)
//  - 마감일·역할은 planStore 에 저장돼서 추천 루트 화면의 "정상" 날짜에도 그대로 쓰이고, 새로고침해도 남아요.
//  - "루트 생성하기": 기획안 파일을 올리고(api.files.uploadPlan) AI 추천 루트를 받아(api.route.recommend) 추천 루트로 이동.
//    목업 모드에서는 서버 없이 기본 체크포인트가 바로 나오고, 같은 기획안으로 이미 만든 루트(고쳐 둔 것 포함)는 다시 만들지 않아요.
import * as Popover from '@radix-ui/react-popover'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api'
import { errorMessage } from '@/api/http'
import type { PlanFile, PlanSource } from '@/api/types'
import planDoc from '@/assets/plan-doc.png'
import { PROJECT } from '@/data/mock'
import { deadlineText, isRouteFor, recommendRoute, updatePlan, usePlan, type PlanRole } from '@/data/planStore'
import { Card, GlassPanel, PageHeader, PrimaryButton, RoleChip, RoleDot, Segmented } from '@/ui'
import { StartTopBar } from './StartTopBar'
import { useToast } from '@/ui/toast'

const UNITS = [
  { value: 'day', label: '일 단위' },
  { value: 'hour', label: '시간 단위' },
] as const
const SOURCES = [
  { value: 'file', label: '파일' },
  { value: 'link', label: '링크' },
  { value: 'text', label: '직접 입력' },
] as const
const MODES = [
  { value: 'view', label: '보기' },
  { value: 'edit', label: '편집' },
] as const
type Source = (typeof SOURCES)[number]['value']

const FIELD = 'rounded-[10px] border border-line bg-transparent px-3.5 py-[11px] text-ink outline-none focus-visible:border-summit'
const POP = 'z-50 rounded-2xl border border-line bg-surface p-3 shadow-[0_16px_40px_rgba(0,0,0,0.5)] outline-none'
const STEP_BTN = 'flex size-8 items-center justify-center rounded-lg border border-line text-base text-ink hover:bg-fill-3 disabled:opacity-30'

/** 고른 기획안 파일 (미리보기용 주소 포함) */
interface PickedFile {
  name: string
  pages: number | null
  /** 브라우저 안에서만 쓰는 임시 주소 — 파일은 어디에도 올라가지 않아요 */
  url?: string
  kind?: 'pdf' | 'image' | 'text' | 'other'
  text?: string
}

export function StartPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const plan = usePlan()
  const deadline = deadlineText(plan)
  const fileRef = useRef<HTMLInputElement>(null)

  const [source, setSource] = useState<Source>('file')
  const [file, setFile] = useState<PickedFile>(PROJECT.planFile)
  const [link, setLink] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // 고른 파일 원본(올릴 때 씀)과 올린 결과. 예시 파일은 원본이 없어 이름만 보냄
  const rawFile = useRef<File | null>(null)
  const uploaded = useRef<PlanFile | null>(null)

  // 임시 주소는 다 쓰면 정리
  useEffect(() => () => void (file.url && URL.revokeObjectURL(file.url)), [file.url])

  const left = deadline.daysLeft
  const ext = (file.name.split('.').pop() ?? 'FILE').toUpperCase().slice(0, 4)
  const totalPeople = plan.roles.reduce((n, r) => n + r.people, 0)

  const pickFile = async (f: File) => {
    const kind: PickedFile['kind'] = f.type === 'application/pdf' ? 'pdf' : f.type.startsWith('image/') ? 'image' : f.type.startsWith('text/') || /\.(md|txt)$/i.test(f.name) ? 'text' : 'other'
    const next: PickedFile = { name: f.name, pages: null, kind }
    if (kind === 'text') next.text = (await f.text()).slice(0, 20000)
    else if (kind !== 'other') next.url = URL.createObjectURL(f)
    rawFile.current = f
    uploaded.current = null
    setFile(next)
    toast(`${f.name} 으로 바꿨어요`)
  }

  /** 지금 넣은 기획안을 서버에 보낼 모양으로. 새로 고른 파일은 먼저 올림 */
  const planSource = async (): Promise<PlanSource> => {
    if (source === 'link') return { type: 'link', url: link.trim() }
    if (source === 'text') return { type: 'text', text: text.trim() }
    if (rawFile.current && !uploaded.current) {
      const saved = await api.files.uploadPlan(rawFile.current)
      uploaded.current = saved
      if (saved.pages !== null) setFile((cur) => ({ ...cur, pages: saved.pages }))
    }
    return { type: 'file', name: file.name, ...(uploaded.current ? { fileId: uploaded.current.id } : {}) }
  }

  const submit = async () => {
    if (busy) return
    // 간단한 확인: 날짜가 지났거나 기획안이 비어 있으면 알려 줌
    if (left === null) return setError('마감 날짜를 골라 주세요.')
    if (left < 0) return setError('마감일이 이미 지났어요. 오늘 이후 날짜로 골라 주세요.')
    if (totalPeople === 0) return setError('역할에 사람이 한 명 이상 있어야 해요.')
    if (source === 'link' && !/^https?:\/\/\S+\.\S+/.test(link.trim())) return setError('기획안 링크를 https:// 로 시작하는 주소로 넣어 주세요.')
    if (source === 'text' && text.trim().length < 10) return setError('기획 내용을 10자 이상 적어 주세요.')
    setError('')
    setBusy(true)
    try {
      const from = await planSource()
      // 같은 기획안으로 이미 만든 루트가 있으면(직접 고친 것 포함) 그대로 두고, 아니면 새로 추천받음
      if (!isRouteFor(from)) {
        const checkpoints = await recommendRoute(from)
        toast(`기획안으로 체크포인트 ${checkpoints.length}개짜리 루트를 만들었어요`)
      }
      navigate('/start/route')
    } catch (e) {
      setError(`루트를 만들지 못했어요. ${errorMessage(e)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-full w-full grid-cols-1 gap-6 px-(--gutter) pt-(--page-top) pb-[26px] @4xl:grid-cols-[minmax(0,500px)_minmax(0,644px)] @4xl:gap-6">
      {/* 오른쪽 위: 내 아바타 (Figma R00) */}
      <div className="@4xl:col-span-2">
        <StartTopBar />
      </div>

      {/* 왼쪽 */}
      <div className="flex min-w-0 flex-col">
        <PageHeader title="프로젝트 시작하기" sub="기획안을 기반으로 프로젝트 완주길을 생성합니다." />

        <form
          noValidate
          className="mt-[clamp(20px,4.3vh,38px)] flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          {/* 프로젝트 설정: 최종 마감 · 역할 */}
          <GlassPanel className="flex flex-col gap-4 p-[22px]">
            <h2 className="text-base font-bold text-ink">프로젝트 설정</h2>

            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[13px] font-semibold text-ink">최종 마감</h3>
              <Segmented label="마감 단위" options={UNITS} value={plan.unit} onChange={(unit) => updatePlan({ unit })} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* 피그마처럼 "2026. 12. 03 (목)" 으로 보여 주고, 누르면 브라우저 날짜 고르기가 열려요 */}
              <PickerField label="마감 날짜" type="date" value={plan.date} onChange={(date) => updatePlan({ date })} display={deadline.long} className="text-sm font-medium" />
              <PickerField
                label="마감 시각"
                type="time"
                value={plan.time}
                onChange={(time) => updatePlan({ time })}
                display={plan.time}
                disabled={plan.unit === 'day'}
                hint={plan.unit === 'day' ? '시간 단위를 고르면 시각을 바꿀 수 있어요' : undefined}
                className={`font-mono text-[13px] font-medium ${plan.unit === 'day' ? 'text-muted' : ''}`}
              />
              <p className={`text-[13px] font-semibold ${left !== null && left < 0 ? 'text-blocked' : 'text-role-front'}`} aria-live="polite">
                {left === null ? '날짜를 골라 주세요' : left > 0 ? `${left}일 남음` : left === 0 ? '오늘 마감' : `${-left}일 지남`}
              </p>
            </div>

            <h3 className="text-[13px] font-semibold text-ink">
              역할 <span className="sr-only">(모두 {totalPeople}명)</span>
            </h3>
            <ul className="flex flex-wrap items-center gap-2">
              {plan.roles.map((r) => (
                <li key={r.id}>
                  <RoleEditor role={r} />
                </li>
              ))}
              <li>
                <AddRole />
              </li>
            </ul>
          </GlassPanel>

          {/* 기획안 */}
          <Card className="flex flex-col gap-3.5 p-[22px]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-ink">기획안</h2>
              <Segmented label="기획안 넣는 방법" options={SOURCES} value={source} onChange={setSource} />
            </div>

            {source === 'file' && (
              <div className="flex items-center justify-between gap-3 rounded-[10px] border border-line px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="shrink-0 rounded-md bg-ink px-1.5 py-[3px] font-mono text-[10px] leading-none font-semibold tracking-[0.4px] text-canvas">{ext}</span>
                  <span className="truncate text-sm font-medium text-ink">{file.name}</span>
                  {file.pages !== null && <span className="shrink-0 text-xs text-muted">{file.pages}쪽</span>}
                </div>
                <button type="button" onClick={() => fileRef.current?.click()} className="shrink-0 text-xs font-medium text-muted hover:text-ink">
                  바꾸기
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.md,.txt,image/*"
                  className="sr-only"
                  tabIndex={-1}
                  aria-label="기획안 파일 고르기"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void pickFile(f)
                    e.target.value = ''
                  }}
                />
              </div>
            )}
            {source === 'link' && (
              <label>
                <span className="sr-only">기획안 링크</span>
                <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://  노션 · 구글 문서 링크를 붙여 넣어 주세요" className={`${FIELD} w-full text-sm placeholder:text-muted`} />
              </label>
            )}
            {source === 'text' && (
              <label>
                <span className="sr-only">기획안 직접 입력</span>
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="기획 내용을 적어 주세요" className={`${FIELD} w-full resize-y text-sm leading-relaxed placeholder:text-muted`} />
                <span className="mt-1 block text-right font-mono text-[11px] text-muted">{text.length}자</span>
              </label>
            )}
          </Card>

          {/* 참여 오름 사람 — 역할별 인원 (Figma R00). 초대는 서버 연결 후 */}
          <Card className="flex flex-col gap-3 p-[22px]">
            <h2 className="text-base font-bold text-ink">
              참여 오름 사람 <span className="font-medium text-muted">· {totalPeople}명</span>
            </h2>
            <ul className="flex flex-wrap items-center gap-2">
              {plan.roles
                .filter((r) => r.people > 0)
                .map((r) => (
                  <li key={r.id}>
                    {r.role ? (
                      <RoleChip role={r.role}>
                        {r.label} {r.people}
                      </RoleChip>
                    ) : (
                      <span className="inline-flex items-center rounded-[14px] bg-fill-2 px-2.5 py-1.5 text-[13px] font-semibold text-ink">
                        {r.label} {r.people}
                      </span>
                    )}
                  </li>
                ))}
              <li>
                <button
                  type="button"
                  onClick={() => toast('초대 링크 보내기는 서버가 연결되면 쓸 수 있어요')}
                  className="rounded-[14px] border border-line px-2.5 py-1.5 text-[13px] font-medium text-muted hover:text-ink"
                >
                  + 초대
                </button>
              </li>
            </ul>
          </Card>

          <div className="mt-[14px] flex flex-wrap items-center justify-end gap-3">
            <p role="alert" className="text-[13px] font-medium text-blocked">
              {error}
            </p>
            <PrimaryButton type="submit" disabled={busy} aria-busy={busy || undefined}>
              {busy ? '루트 만드는 중…' : '루트 생성하기'}
            </PrimaryButton>
          </div>
        </form>
      </div>

      {/* 오른쪽: 기획 문서 */}
      <PlanDocument source={source} file={file} link={link} text={text} onText={setText} />
    </div>
  )
}

/** 역할 칩: 누르면 인원을 − / + 로 바꾸거나 역할을 뺄 수 있어요 */
function RoleEditor({ role }: { role: PlanRole }) {
  const setPeople = (people: number) => updatePlan((p) => ({ roles: p.roles.map((r) => (r.id === role.id ? { ...r, people: Math.min(20, Math.max(0, people)) } : r)) }))
  const builtIn = role.role
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`${role.label} ${role.people}명, 인원 바꾸기`}
        className={`inline-flex items-center gap-1.5 rounded-[14px] px-2.5 py-1.5 text-[13px] font-semibold whitespace-nowrap hover:brightness-125 ${
          builtIn === 'design' ? 'bg-role-design-bg text-role-design' : builtIn === 'front' ? 'bg-role-front-bg text-role-front' : builtIn === 'back' ? 'bg-role-back-bg text-role-back' : 'bg-fill-3 text-ink'
        }`}
      >
        {builtIn ? <RoleDot role={builtIn} /> : <span aria-hidden className="size-2 rounded-full bg-muted" />}
        {role.label} {role.people}명
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={8} className={`${POP} flex flex-col gap-3`}>
          <p className="text-[13px] font-semibold text-ink">{role.label} 인원</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPeople(role.people - 1)} disabled={role.people <= 0} aria-label="한 명 줄이기" className={STEP_BTN}>
              −
            </button>
            <output aria-live="polite" className="w-12 text-center font-mono text-sm font-medium text-ink">
              {role.people}명
            </output>
            <button type="button" onClick={() => setPeople(role.people + 1)} disabled={role.people >= 20} aria-label="한 명 늘리기" className={STEP_BTN}>
              +
            </button>
          </div>
          {!builtIn && (
            <button type="button" onClick={() => updatePlan((p) => ({ roles: p.roles.filter((r) => r.id !== role.id) }))} className="self-start text-xs font-medium text-blocked hover:underline">
              이 역할 빼기
            </button>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

/** + 역할 추가: 이름을 적어 새 역할(예: 기획, QA) 만들기 */
function AddRole() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const add = () => {
    const label = name.trim()
    if (!label) return
    updatePlan((p) => (p.roles.some((r) => r.label === label) ? {} : { roles: [...p.roles, { id: `r${Date.now().toString(36)}`, label, people: 1 }] }))
    setName('')
    setOpen(false)
  }
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="rounded-[15px] border border-line bg-fill-3 px-2.5 py-1.5 text-[13px] font-medium text-muted hover:text-ink">+ 역할 추가</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={8} className={POP}>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              add()
            }}
          >
            <label>
              <span className="sr-only">새 역할 이름</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={10} placeholder="예: 기획, QA" className={`${FIELD} w-36 py-2 text-[13px] placeholder:text-muted`} />
            </label>
            <button type="submit" disabled={!name.trim()} className="rounded-full bg-summit px-3.5 py-2 text-[13px] font-semibold text-on-summit disabled:opacity-40">
              추가
            </button>
          </form>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

/** 날짜·시각 칸: 보이는 글자는 피그마 형식, 실제 입력은 브라우저 기본 고르기(input type=date/time) */
function PickerField({
  label,
  type,
  value,
  onChange,
  display,
  disabled,
  hint,
  className = '',
}: {
  label: string
  type: 'date' | 'time'
  value: string
  onChange: (v: string) => void
  display: string
  disabled?: boolean
  hint?: string
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <span className={`relative inline-flex rounded-[10px] border border-line text-ink focus-within:border-summit ${className}`} title={hint}>
      <span aria-hidden className="px-3.5 py-[11px] leading-none whitespace-nowrap">
        {display}
      </span>
      <input
        ref={ref}
        type={type}
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        onClick={() => {
          try {
            ref.current?.showPicker()
          } catch {
            /* showPicker 를 지원하지 않는 브라우저는 기본 동작 그대로 */
          }
        }}
        className="absolute inset-0 size-full cursor-pointer rounded-[10px] opacity-0 [color-scheme:dark] disabled:cursor-default"
      />
    </span>
  )
}

/** 오른쪽 문서 패널: 고른 기획안(파일·링크·직접 입력)에 따라 미리보기가 바뀌어요 */
function PlanDocument({ source, file, link, text, onText }: { source: Source; file: PickedFile; link: string; text: string; onText: (t: string) => void }) {
  const [mode, setMode] = useState<(typeof MODES)[number]['value']>('view')
  const toast = useToast()
  const editable = source === 'text'

  return (
    <GlassPanel className="flex h-[clamp(480px,calc(100dvh-108px),792px)] min-w-0 flex-col items-center gap-3.5 overflow-hidden px-[22px] pt-[22px]">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-base font-bold text-ink">기획 문서</h2>
      </div>
      <div className="flex w-full items-center justify-between">
        <Segmented
          label="문서 보기 방식"
          options={MODES}
          value={editable ? mode : 'view'}
          onChange={(v) => {
            if (v === 'edit' && !editable) toast("편집은 기획안을 '직접 입력'으로 넣었을 때 할 수 있어요")
            else setMode(v)
          }}
        />
      </div>

      {/* 문서는 패널 안에서만 스크롤 */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- 스크롤 영역은 키보드로 스크롤할 수 있어야 해요 */}
      <div className="min-h-0 w-full flex-1 overflow-y-auto pb-[18px]" tabIndex={0} role="region" aria-label="기획 문서 미리보기">
        {source === 'text' ? (
          mode === 'edit' ? (
            <label className="block h-full">
              <span className="sr-only">기획 문서 편집</span>
              <textarea value={text} onChange={(e) => onText(e.target.value)} placeholder="기획 내용을 적어 주세요" className="size-full min-h-[320px] resize-none rounded-[10px] bg-white p-6 text-sm leading-relaxed text-[#17181a] outline-none" />
            </label>
          ) : (
            <Paper>{text.trim() || '왼쪽 "직접 입력" 칸이나 위의 "편집"에서 기획 내용을 적으면 여기에 보여요.'}</Paper>
          )
        ) : source === 'link' ? (
          <Paper>
            {link.trim() ? (
              <>
                링크로 연결한 기획안이에요.{'\n\n'}
                <a href={link} target="_blank" rel="noreferrer noopener" className="font-semibold break-all text-[#2f5fd0] underline">
                  {link}
                </a>
                {'\n\n'}새 창에서 열어 볼 수 있어요. (문서 내용 불러오기는 서버 연결 뒤에 가능)
              </>
            ) : (
              '왼쪽에 기획안 링크를 붙여 넣어 주세요.'
            )}
          </Paper>
        ) : file.kind === 'pdf' && file.url ? (
          <iframe src={file.url} title={`${file.name} 미리보기`} className="h-full min-h-[480px] w-full rounded-[10px] bg-white" />
        ) : file.kind === 'image' && file.url ? (
          <img src={file.url} alt={`${file.name} 미리보기`} className="mx-auto h-auto w-full max-w-[539px] rounded-[10px]" />
        ) : file.kind === 'text' ? (
          <Paper>{file.text}</Paper>
        ) : file.kind === 'other' ? (
          <Paper>{`${file.name}\n\n이 형식은 미리보기를 지원하지 않아요. (PDF · 이미지 · 텍스트 파일은 바로 볼 수 있어요)`}</Paper>
        ) : (
          <img
            src={planDoc}
            alt="역할별 협업 웹 기획안 (서비스명 미정) 문서. 1. 한 줄 정의, 2. 문제, 3. 대상 사용자, 4. 핵심 개념 순서로 이어집니다."
            width={539}
            height={909}
            className="mx-auto h-auto w-full max-w-[539px] rounded-[10px]"
          />
        )}
      </div>
    </GlassPanel>
  )
}

/** 흰 종이 모양 (글자 기획안 미리보기) */
function Paper({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-h-full w-full max-w-[539px] rounded-[10px] bg-white p-6 text-sm leading-relaxed whitespace-pre-wrap text-[#17181a]">{children}</div>
}
