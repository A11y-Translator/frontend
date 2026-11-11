// [임시 데이터] 검사 요약 숫자와 캡처 위 오버레이 좌표.
// 백엔드가 붙으면 검사 결과 API 응답으로 바뀝니다. (mocks/index.ts 의 issues 는 그중 대표 이슈 목록)
import { versions } from './index'
import type { IssueOverlay } from '@/shared/api/types'

/** 프로토타입에서 기본으로 여는 프로젝트 (프로젝트B = Web A 메인) */
export const DEFAULT_PROJECT_ID = 'b'
export const PROJECT_NAME = 'Web A 메인'
export const SITE_URL = 'https://webA.github.io/A11y'

/** 검사 전체 요약 — 이슈 목록(mocks)은 일부만 들어 있어서 전체 합계는 디자인 값을 씁니다 */
export const SCAN = {
  scannedAt: '2026.11.02 10:42',
  scannedTime: '10:42',
  pages: 6,
  pagesNote: '메인 외 5개',
  standard: 'WCAG 2.2 AA',
  totalIssues: versions[0]?.issues ?? 54,
  /** 이전 버전 전체 이슈 */
  prevIssues: versions[1]?.issues ?? 66,
  /** 이번 버전에서 해결된 이슈 (디자인 값, mocks 의 해결 이슈 포함) */
  baseResolved: versions[0]?.resolved ?? 12,
  passRate: 72,
  remainingComments: 128,
  mentions: 3,
  /** 리포트 상단 상태 태그 (중요 / 진행중) */
  important: 15,
  inProgress: 3,
}

/** 미리보기 탭에 보이는 페이지들 (앞의 3개 + 나머지 3개는 "+3" 로 접힘) */
export const PAGES = ['/main', '/pricing', '/contact'] as const
export const MORE_PAGES = ['/about', '/faq', '/signup'] as const


/* ── 검사 시점 캡처(가짜 사이트) 위 오버레이 ─────────────────────────────
 * 좌표는 캡처 기준 크기(CAPTURE_W × CAPTURE_H, 이슈 상세 디자인 기준 px)입니다.
 * label 은 화면에 보이는 배지 숫자(디자인 그대로), issueId 는 연결된 이슈.
 */
export const CAPTURE_W = 734
export const CAPTURE_H = 557

/** 타입은 shared/api/types 의 IssueOverlay 와 같습니다 */
export type OverlayBox = IssueOverlay

export const OVERLAYS: OverlayBox[] = [
  // /main
  { label: 1, issueId: 'i1', selector: 'button.cta-secondary', page: '/main', x: 156, y: 220, w: 110, h: 41 },
  { label: 2, issueId: 'i2', selector: 'img.hero', page: '/main', x: 404, y: 71, w: 280, h: 226 },
  { label: 3, issueId: 'i3', selector: 'nav .menu-toggle', page: '/main', x: 472, y: 10, w: 158, h: 24 },
  { label: 4, issueId: 'u4', selector: 'input.subscribe', page: '/main', x: 50, y: 374, w: 253, h: 41 },
  { label: 5, issueId: 'i1', selector: 'p.hero-sub', page: '/main', x: 50, y: 174, w: 251, h: 24 },
  // /pricing
  { label: 1, issueId: 'i5', selector: 'a.more', page: '/pricing', x: 60, y: 420, w: 190, h: 30 },
  { label: 2, issueId: 'i8', selector: 'title', page: '/pricing', x: 50, y: 70, w: 240, h: 50 },
  // /contact
  { label: 1, issueId: 'i4', selector: 'input#email', page: '/contact', x: 50, y: 160, w: 360, h: 44 },
  { label: 2, issueId: 'i4', selector: 'input#name', page: '/contact', x: 50, y: 224, w: 360, h: 44 },
  { label: 3, issueId: 'i9', selector: '.form-error', page: '/contact', x: 50, y: 400, w: 260, h: 26 },
]
