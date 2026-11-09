// Figma: setting (533:7306) — 계정 / 확장 프로그램 검사 / 팀 · 알림
// 프로토타입이라 값은 화면 안에서만 바뀝니다. 백엔드가 붙으면 사용자 설정 API 로 저장하세요.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CURRENT_USER_ID, memberById, projects } from '@/shared/mocks'
import { Select, SettingRow, SettingSection, Switch } from './SettingControls'

const STANDARDS = ['WCAG 2.1 AA', 'WCAG 2.1 A', 'WCAG 2.2 AA', 'KWCAG 2.2']
const EXPLAIN_MODES = ['디자이너용 쉬운 말', '개발자용 기술 설명', 'PM용 요약']
const SITE_ACCESS = ['아이콘을 클릭할 때만', '특정 사이트에서만', '모든 사이트에서']
const DEFAULT_PROJECTS = ['GDGoC A11y', ...new Set(projects.map((p) => p.name))]

export default function SettingsPage() {
  const navigate = useNavigate()
  const me = memberById(CURRENT_USER_ID)!

  const [standard, setStandard] = useState(STANDARDS[0])
  const [explain, setExplain] = useState(EXPLAIN_MODES[0])
  const [siteAccess, setSiteAccess] = useState(SITE_ACCESS[0])
  const [defaultProject, setDefaultProject] = useState(DEFAULT_PROJECTS[0])
  const [overlay, setOverlay] = useState(true)
  const [recheckNotice, setRecheckNotice] = useState(true)
  const [mentionNotice, setMentionNotice] = useState(true)
  const [resolvedNotice, setResolvedNotice] = useState(false)

  return (
    <div className="min-h-full flex-1 bg-white">
      <div className="flex w-full flex-col gap-3.5 px-5 pt-[30px] pb-12 font-noto">
        <div className="flex flex-col gap-1 leading-[1.5]">
          <h1 className="text-[32px] font-bold text-black">설정</h1>
          <p className="text-lg text-muted">계정, 확장 프로그램 검사 방식, 알림을 관리해요.</p>
        </div>

        <SettingSection title="계정">
          <SettingRow label="Google 계정 연결됨" description={`${me.email} · 크롬 로그인 계정으로 자동 로그인`} labelled={false}>
            {({ desc }) => (
              <button
                type="button"
                onClick={() => navigate('/login')}
                aria-describedby={desc}
                className="shrink-0 rounded-full border border-ext-line bg-white px-4 py-2.5 text-sm leading-[1.4] font-bold text-black hover:bg-ext-bg"
              >
                로그아웃
              </button>
            )}
          </SettingRow>
        </SettingSection>

        <SettingSection title="확장 프로그램 검사">
          <SettingRow label="검사 기준" description="적용할 접근성 가이드라인">
            {({ control, desc }) => <Select id={control} describedBy={desc} value={standard} onChange={setStandard} options={STANDARDS} />}
          </SettingRow>
          <SettingRow label="결과 설명 방식" description="이슈 설명을 누구 기준으로 쓸지">
            {({ control, desc }) => <Select id={control} describedBy={desc} value={explain} onChange={setExplain} options={EXPLAIN_MODES} />}
          </SettingRow>
          <SettingRow label="오버레이 기본으로 켜기" description="검사 후 페이지 위에 테두리와 번호 배지를 바로 표시">
            {({ control, desc }) => <Switch id={control} describedBy={desc} checked={overlay} onChange={setOverlay} />}
          </SettingRow>
          <SettingRow label="페이지가 바뀌면 재검사 알림" description="SPA처럼 화면이 바뀌는 사이트에서 다시 검사하도록 안내">
            {({ control, desc }) => <Switch id={control} describedBy={desc} checked={recheckNotice} onChange={setRecheckNotice} />}
          </SettingRow>
          <SettingRow label="사이트 접근 권한" description="확장 프로그램이 페이지를 읽는 시점">
            {({ control, desc }) => <Select id={control} describedBy={desc} value={siteAccess} onChange={setSiteAccess} options={SITE_ACCESS} />}
          </SettingRow>
        </SettingSection>

        <SettingSection title="팀 · 알림">
          <SettingRow label="기본 프로젝트" description="검사 결과를 저장할 팀 프로젝트">
            {({ control, desc }) => (
              <Select id={control} describedBy={desc} value={defaultProject} onChange={setDefaultProject} options={DEFAULT_PROJECTS} />
            )}
          </SettingRow>
          <SettingRow label="멘션 알림" description="코멘트에서 나를 @멘션하면 알림">
            {({ control, desc }) => <Switch id={control} describedBy={desc} checked={mentionNotice} onChange={setMentionNotice} />}
          </SettingRow>
          <SettingRow label="이슈 해결 알림" description="내가 남긴 이슈가 해결되면 알림">
            {({ control, desc }) => <Switch id={control} describedBy={desc} checked={resolvedNotice} onChange={setResolvedNotice} />}
          </SettingRow>
        </SettingSection>
      </div>
    </div>
  )
}
