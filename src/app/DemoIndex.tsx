// 개발·시연용 화면 목록. 팀 회의에서 화면을 빠르게 넘겨볼 때 사용합니다.
import { Link } from 'react-router-dom'
import { actions } from '@/shared/store'

const WEB = [
  ['/login', '로그인'],
  ['/', '프로젝트 홈 (W1)'],
  ['/projects/new', '프로젝트 없음 · 첫 검사'],
  ['/projects/b/inspection', '접근성 검사'],
  ['/issues/i1', '이슈 상세 · 코멘트 (05)'],
  ['/todo/mine', '할 일 · 내 할 일'],
  ['/todo/team', '할 일 · 우리 팀 할 일'],
  ['/todo/unassigned', '할 일 · 미배정 분배 (06)'],
  ['/report', '리포트 · 버전 관리 (08)'],
  ['/members', '팀원'],
  ['/settings', '설정'],
]

export function DemoIndex() {
  return (
    <main className="mx-auto max-w-2xl p-10 font-pretendard">
      <h1 className="mb-2 text-2xl font-bold">A11y Translator · 화면 목록</h1>
      <p className="mb-8 text-muted">
        확장에서 저장·재검사한 결과는 같은 브라우저의 웹 화면에 그대로 반영돼요.
      </p>
      <h2 className="mb-3 text-lg font-semibold">① 크롬 확장</h2>
      <ul className="mb-8 list-disc pl-5">
        <li><Link className="text-accent underline" to="/extension">확장 데모 (사이트 + 오버레이 + 사이드 패널)</Link></li>
        <li><Link className="text-accent underline" to="/extension/panel">사이드 패널만</Link></li>
      </ul>
      <h2 className="mb-3 text-lg font-semibold">② 협업 웹사이트</h2>
      <ul className="mb-8 list-disc pl-5">
        {WEB.map(([to, label]) => (
          <li key={to}><Link className="text-accent underline" to={to}>{label}</Link></li>
        ))}
      </ul>
      <button type="button" onClick={() => actions.reset()} className="rounded-full border border-web-line bg-white px-4 py-2 text-sm">
        데모 데이터 초기화
      </button>
    </main>
  )
}
