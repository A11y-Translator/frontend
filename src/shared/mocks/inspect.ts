// [임시 검사 규칙] 서버가 없을 때 URL 만으로 검사 결과를 만들어 냅니다. (mock 모드 전용)
// 실제로 페이지를 열어 보지는 않아요. 대신 아래 규칙으로 "그럴듯하고, 같은 주소면 항상 같은" 결과를 냅니다.
//
//  1) 주소 문자열로 시드(seed)를 만들고, 그 시드로만 난수를 뽑음 → 같은 URL = 같은 결과
//  2) 검사 페이지: /main 은 항상, /pricing · /contact 는 각각 60% 확률
//  3) 규칙(RULES)마다 페이지 안 "검사 지점(spot)"이 있고, 지점별로 chance 확률로 문제를 발견
//     · 공공기관 도메인(.go.kr / .gov)은 관리가 잘 돼 있다고 보고 확률 × 0.5
//     · http(보안 연결 아님)는 오래된 사이트로 보고 확률 × 1.3
//  4) 같은 규칙 + 같은 페이지에서 발견한 지점은 이슈 하나로 묶음 (지점 = 해당 요소)
//  5) 기준 통과율 = 100 − 심각도 점수 합(치명 8 · 심각 5 · 보통 3 · 경미 1), 35~98 사이로 자름
//  6) 새 이슈는 모두 '미배정' 상태 + AI 추천 직군(aiTeam)
//
// 캡처(SiteCapture)의 가짜 사이트 레이아웃이 /main · /pricing · /contact 세 장이라
// 오버레이 좌표(box)도 그 레이아웃 기준(734×557)입니다.
import type { Category, Inspection, Issue, IssueOverlay, Severity, Team } from '@/shared/api/types'

type Box = { x: number; y: number; w: number; h: number }
type Page = '/main' | '/pricing' | '/contact'

interface Rule {
  id: string
  title: string
  impact: string
  category: Category
  severity: Severity
  wcag: string
  team: Team
  fixCode?: string
  spots: { page: Page; selector: string; chance: number; box?: Box }[]
}

const RULES: Rule[] = [
  {
    id: 'contrast',
    title: '글자와 배경의 색 대비가 부족해요',
    impact: '저시력 사용자는 글자를 읽기 어려워요',
    category: '색 대비',
    severity: 'critical',
    wcag: 'WCAG 1.4.3',
    team: 'design',
    fixCode: '.cta-secondary { color: #616161; }',
    spots: [
      { page: '/main', selector: 'button.cta-secondary', chance: 0.7, box: { x: 156, y: 220, w: 110, h: 41 } },
      { page: '/main', selector: 'p.hero-sub', chance: 0.5, box: { x: 50, y: 174, w: 251, h: 24 } },
    ],
  },
  {
    id: 'img-alt',
    title: '이미지에 설명이 없어요',
    impact: '화면낭독기 사용자는 이미지 내용을 알 수 없어요',
    category: '대체 텍스트',
    severity: 'critical',
    wcag: 'WCAG 1.1.1',
    team: 'frontend',
    fixCode: 'alt="서비스 소개 일러스트"',
    spots: [{ page: '/main', selector: 'img.hero', chance: 0.65, box: { x: 404, y: 71, w: 280, h: 226 } }],
  },
  {
    id: 'keyboard-menu',
    title: '키보드로 메뉴를 열 수 없어요',
    impact: '마우스를 쓰지 않는 사용자는 메뉴에 갈 수 없어요',
    category: '키보드',
    severity: 'serious',
    wcag: 'WCAG 2.1.1',
    team: 'frontend',
    spots: [{ page: '/main', selector: 'nav .menu-toggle', chance: 0.45, box: { x: 472, y: 10, w: 158, h: 24 } }],
  },
  {
    id: 'focus-visible',
    title: '포커스 표시가 보이지 않아요',
    impact: '키보드 사용자는 지금 위치를 알 수 없어요',
    category: '키보드',
    severity: 'serious',
    wcag: 'WCAG 2.4.7',
    team: 'design',
    fixCode: ':focus-visible { outline: 2px solid #3086ff; }',
    spots: [{ page: '/main', selector: 'a, button', chance: 0.4 }],
  },
  {
    id: 'form-label',
    title: '입력칸에 이름표가 없어요',
    impact: '화면낭독기가 "편집창"이라고만 읽어요',
    category: '폼 레이블',
    severity: 'moderate',
    wcag: 'WCAG 1.3.1',
    team: 'frontend',
    fixCode: '<label for="email">이메일</label>',
    spots: [
      { page: '/main', selector: 'input.subscribe', chance: 0.5, box: { x: 50, y: 374, w: 253, h: 41 } },
      { page: '/contact', selector: 'input#email', chance: 0.6, box: { x: 50, y: 160, w: 360, h: 44 } },
      { page: '/contact', selector: 'input#name', chance: 0.5, box: { x: 50, y: 224, w: 360, h: 44 } },
    ],
  },
  {
    id: 'error-message',
    title: '오류 메시지가 화면낭독기에 안 읽혀요',
    impact: '입력이 틀려도 화면낭독기 사용자는 알 수 없어요',
    category: '폼 레이블',
    severity: 'serious',
    wcag: 'WCAG 4.1.3',
    team: 'backend',
    fixCode: '<p role="alert" class="form-error">…</p>',
    spots: [{ page: '/contact', selector: '.form-error', chance: 0.45, box: { x: 50, y: 400, w: 260, h: 26 } }],
  },
  {
    id: 'link-text',
    title: '링크 텍스트가 모호해요',
    impact: '"자세히"만 읽혀서 어디로 가는지 알 수 없어요',
    category: '링크',
    severity: 'moderate',
    wcag: 'WCAG 2.4.4',
    team: 'design',
    spots: [{ page: '/pricing', selector: 'a.more', chance: 0.6, box: { x: 60, y: 420, w: 190, h: 30 } }],
  },
  {
    id: 'page-title',
    title: '페이지 제목이 중복돼요',
    impact: '여러 탭을 열면 어느 페이지인지 구분하기 어려워요',
    category: '문서 구조',
    severity: 'minor',
    wcag: 'WCAG 2.4.2',
    team: 'frontend',
    spots: [{ page: '/pricing', selector: 'title', chance: 0.5, box: { x: 50, y: 70, w: 240, h: 50 } }],
  },
  {
    id: 'html-lang',
    title: '페이지 언어가 지정되지 않았어요',
    impact: '화면낭독기가 한국어를 영어 발음으로 읽을 수 있어요',
    category: '문서 구조',
    severity: 'minor',
    wcag: 'WCAG 3.1.1',
    team: 'frontend',
    fixCode: '<html lang="ko">',
    spots: [{ page: '/main', selector: 'html', chance: 0.35 }],
  },
]

const SEVERITY_SCORE: Record<Severity, number> = { critical: 8, serious: 5, moderate: 3, minor: 1 }
const SEVERITY_ORDER: Severity[] = ['critical', 'serious', 'moderate', 'minor']

/** 문자열 → 32bit 시드 (FNV-1a) */
function hash(s: string) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** 시드 고정 난수 (mulberry32) */
function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function inspectUrl(projectId: string, url: string, version: number): Inspection {
  const rand = seeded(hash(url))
  const { hostname, protocol } = new URL(url)

  let factor = 1
  if (/\.go\.kr$|\.gov$/.test(hostname)) factor *= 0.5
  if (protocol === 'http:') factor *= 1.3

  const pages: Page[] = ['/main', ...(['/pricing', '/contact'] as const).filter(() => rand() < 0.6)]

  const found: { rule: Rule; page: Page; spots: Rule['spots'] }[] = []
  for (const rule of RULES) {
    for (const page of pages) {
      const spots = rule.spots.filter((s) => s.page === page && rand() < Math.min(0.95, s.chance * factor))
      if (spots.length) found.push({ rule, page, spots })
    }
  }

  // 심각도 → 페이지 순으로 번호 매기기
  found.sort((a, b) => SEVERITY_ORDER.indexOf(a.rule.severity) - SEVERITY_ORDER.indexOf(b.rule.severity) || pages.indexOf(a.page) - pages.indexOf(b.page))

  const issues: Issue[] = []
  const overlays: IssueOverlay[] = []
  const labelByPage: Record<string, number> = {}

  found.forEach(({ rule, page, spots }, idx) => {
    const id = `${projectId}-${rule.id}-${page.slice(1)}`
    issues.push({
      id,
      no: idx + 1,
      title: rule.title,
      impact: rule.impact,
      category: rule.category,
      severity: rule.severity,
      priority: rule.severity === 'critical' ? 'high' : 'normal',
      wcag: rule.wcag,
      // 같은 문제가 화면 다른 곳에도 있다고 보고 요소 수를 조금 늘립니다
      elements: spots.length + Math.floor(rand() * 3),
      selectors: spots.map((s) => s.selector),
      page,
      comments: 0,
      status: 'unassigned',
      aiTeam: rule.team,
      version,
      fixCode: rule.fixCode,
    })
    for (const s of spots) {
      if (!s.box) continue
      labelByPage[page] = (labelByPage[page] ?? 0) + 1
      overlays.push({ label: labelByPage[page], issueId: id, selector: s.selector, page, ...s.box })
    }
  })

  const score = issues.reduce((sum, i) => sum + SEVERITY_SCORE[i.severity], 0)
  const passRate = Math.max(35, Math.min(98, 100 - score))

  return {
    id: `${projectId}-v${version}`,
    projectId,
    url,
    version,
    scannedAt: new Date().toISOString(),
    standard: 'WCAG 2.2 AA',
    pages,
    passRate,
    issues,
    overlays,
    source: 'mock',
  }
}
