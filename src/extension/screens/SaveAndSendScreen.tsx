// 04 · chrome/save-and-send (Figma 550:1501)
// 프로젝트·버전 고르고 옵션 체크 → "저장하고 웹에서 보기" = actions.sendToWeb → 전송 완료 안내 + 웹 할 일 링크
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useAppState, actions } from '@/shared/store'
import { projects } from '@/shared/mocks'
import { PanelFrame, PanelHeader, PanelBody, PanelFooter, PanelCard, ExtButton, Notice } from '@/extension/ui'
import { usePanel, useScreenFocus } from '@/extension/panelNav'
import { scanStats } from '@/extension/scanStats'

const DOMAIN = 'webA.github.io/A11y'
// 확장이 연 사이트 이름 + 웹에 있는 프로젝트들
const PROJECT_OPTIONS = ['Web A 메인', ...new Set(projects.map((p) => p.name))]

const FIELD = 'w-full appearance-none rounded-lg border border-ext-frame bg-white px-3 py-2.5 pr-8 text-sm leading-[1.5] font-medium text-ink-2'

export default function SaveAndSendScreen() {
  const state = useAppState()
  const { go } = usePanel()
  const stats = scanStats(state.issues)
  const titleRef = useScreenFocus<HTMLHeadingElement>()
  const formId = useId()

  const cv = state.currentVersion
  const [project, setProject] = useState(PROJECT_OPTIONS[0])
  const [version, setVersion] = useState(cv)
  const [withFixes, setWithFixes] = useState(true)
  const [withCapture, setWithCapture] = useState(true)
  const [notify, setNotify] = useState(true)
  const [sent, setSent] = useState(false)
  const sentRef = useRef<HTMLDivElement>(null)

  // 전송 버튼이 사라지므로 포커스를 완료 안내로 옮김
  useEffect(() => {
    if (sent) sentRef.current?.focus()
  }, [sent])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    actions.sendToWeb(project, version, withFixes && stats.savedFixes > 0)
    setSent(true)
  }

  return (
    <PanelFrame>
      <PanelHeader />
      <PanelBody>
        <PanelCard aria-labelledby="save-summary">
          <h2 id="save-summary" ref={titleRef} tabIndex={-1} className="flex items-center gap-1.5 text-sm leading-[1.5] font-bold text-ink-2">
            이슈 <span className="text-[28px]">{stats.total}</span> 개 · 수정안 {stats.savedFixes}개
          </h2>
          <p className="text-xs leading-[1.5] text-muted">
            {stats.scannedAt} 검사 · {DOMAIN}
          </p>
        </PanelCard>

        {sent ? (
          <div ref={sentRef} tabIndex={-1} role="status" className="flex w-full flex-col gap-2.5 rounded-xl border border-ext-frame bg-white p-4">
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
          <form id={formId} onSubmit={submit} className="w-full">
            <PanelCard aria-labelledby="save-form-title">
              <h3 id="save-form-title" className="text-sm leading-[1.5] font-bold text-ink-2">검사 결과 저장</h3>

              <SelectField label="프로젝트" value={project} onChange={setProject}>
                {PROJECT_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </SelectField>

              <SelectField label="버전" value={String(version)} onChange={(v) => setVersion(Number(v))}>
                <option value={cv}>버전 {cv} · 새 버전으로 저장</option>
                {cv > 1 && <option value={cv - 1}>버전 {cv - 1} · 덮어쓰기</option>}
              </SelectField>

              <fieldset className="flex flex-col gap-2.5">
                <legend className="sr-only">함께 보낼 항목</legend>
                <Check checked={withFixes} onChange={setWithFixes} disabled={stats.savedFixes === 0}>
                  수정안 {stats.savedFixes}개 함께 보내기
                </Check>
                <Check checked={withCapture} onChange={setWithCapture}>검사 시점 화면 캡처 포함</Check>
                <Check checked={notify} onChange={setNotify}>담당자에게 알림 보내기</Check>
              </fieldset>
            </PanelCard>
          </form>
        )}

        <Notice>저장하면 AI가 이슈를 디자인 · 개발 할 일로 나눠 웹의 ‘할 일’에 올려요.</Notice>
      </PanelBody>

      <PanelFooter variant="actions">
        {sent ? (
          <ExtButton variant="secondary" onClick={() => go({ name: 'result' })}>목록으로</ExtButton>
        ) : (
          <>
            <ExtButton variant="ghost" onClick={() => go({ name: 'result' })}>취소</ExtButton>
            <ExtButton type="submit" form={formId}>저장하고 웹에서 보기</ExtButton>
          </>
        )}
      </PanelFooter>
    </PanelFrame>
  )
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs leading-[1.5] font-medium text-muted">{label}</label>
      <div className="relative">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={FIELD}>
          {children}
        </select>
        <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted">▾</span>
      </div>
    </div>
  )
}

function Check({ checked, onChange, disabled, children }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; children: ReactNode }) {
  return (
    <label className={`flex items-center gap-2 text-[13px] leading-[1.5] text-ink-2 ${disabled ? 'text-muted' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked && !disabled}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-[18px] shrink-0 accent-ink-2"
      />
      {children}
    </label>
  )
}
