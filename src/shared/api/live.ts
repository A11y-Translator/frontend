// live 모드 — 개발 서버가 크롬(headless)으로 실제 URL 을 열어 axe-core(WCAG 2.2 AA)로 검사합니다.
// axe 결과(규칙 위반) 하나 = 이슈 하나. 문제 요소들은 selectors / 캡처 오버레이가 됩니다.
import type { ApiClient } from './client'
import type { Category, Inspection, Issue, IssueOverlay, Severity, Team } from './types'
import { mockApi } from './mock'
import { scanPage, type AxeViolation, type ScanResult } from './liveProxy'
import { CAPTURE_H, CAPTURE_W } from '@/shared/mocks/scan'

/** 검사 화면 폭(1440) → 캡처(734px) 좌표로 줄이는 비율 */
const VIEWPORT_W = 1440
const SCALE = CAPTURE_W / VIEWPORT_W

/** 자주 나오는 axe 규칙의 한국어 문구. 없으면 axe 의 영어 설명을 그대로 씁니다 */
const KO: Record<string, { title: string; impact: string; team?: Team }> = {
  'color-contrast': { title: '글자와 배경의 색 대비가 부족해요', impact: '저시력 사용자는 글자를 읽기 어려워요', team: 'design' },
  'color-contrast-enhanced': { title: '글자 색 대비가 강화 기준에 못 미쳐요', impact: '저시력 사용자는 글자를 읽기 어려워요', team: 'design' },
  'link-in-text-block': { title: '본문 속 링크가 색으로만 구분돼요', impact: '색을 구분하기 어려운 사용자는 링크를 찾기 어려워요', team: 'design' },
  'image-alt': { title: '이미지에 설명이 없어요', impact: '화면낭독기 사용자는 이미지 내용을 알 수 없어요' },
  'input-image-alt': { title: '이미지 버튼에 설명이 없어요', impact: '화면낭독기 사용자는 버튼이 무엇인지 알 수 없어요' },
  'svg-img-alt': { title: 'SVG 그림에 설명이 없어요', impact: '화면낭독기 사용자는 그림 내용을 알 수 없어요' },
  'role-img-alt': { title: '그림 역할 요소에 설명이 없어요', impact: '화면낭독기 사용자는 그림 내용을 알 수 없어요' },
  'area-alt': { title: '이미지 맵 영역에 설명이 없어요', impact: '화면낭독기 사용자는 링크가 어디로 가는지 알 수 없어요' },
  'object-alt': { title: '삽입된 콘텐츠에 설명이 없어요', impact: '화면낭독기 사용자는 내용을 알 수 없어요' },
  'button-name': { title: '버튼에 이름이 없어요', impact: '화면낭독기가 "버튼"이라고만 읽어요' },
  'link-name': { title: '링크에 이름이 없어요', impact: '화면낭독기 사용자는 링크가 어디로 가는지 알 수 없어요' },
  label: { title: '입력칸에 이름표가 없어요', impact: '화면낭독기가 "편집창"이라고만 읽어요' },
  'select-name': { title: '선택 상자에 이름표가 없어요', impact: '화면낭독기 사용자는 무엇을 고르는지 알 수 없어요' },
  'aria-input-field-name': { title: 'ARIA 입력칸에 이름이 없어요', impact: '화면낭독기 사용자는 무엇을 입력하는지 알 수 없어요' },
  'autocomplete-valid': { title: '자동 완성 속성이 올바르지 않아요', impact: '보조 기술이 입력값을 채워 줄 수 없어요' },
  'html-has-lang': { title: '페이지 언어가 지정되지 않았어요', impact: '화면낭독기가 한국어를 다른 언어 발음으로 읽을 수 있어요' },
  'html-lang-valid': { title: '페이지 언어 값이 올바르지 않아요', impact: '화면낭독기가 엉뚱한 발음으로 읽을 수 있어요' },
  'document-title': { title: '페이지 제목이 없어요', impact: '여러 탭을 열면 어느 페이지인지 알 수 없어요' },
  'frame-title': { title: '프레임에 제목이 없어요', impact: '화면낭독기 사용자는 프레임 내용을 짐작할 수 없어요' },
  'meta-viewport': { title: '확대가 막혀 있어요', impact: '저시력 사용자가 화면을 키워 볼 수 없어요', team: 'frontend' },
  'aria-allowed-attr': { title: '허용되지 않은 ARIA 속성을 썼어요', impact: '보조 기술이 요소를 잘못 읽을 수 있어요' },
  'aria-required-attr': { title: '필수 ARIA 속성이 빠졌어요', impact: '보조 기술이 요소 상태를 알 수 없어요' },
  'aria-valid-attr-value': { title: 'ARIA 속성 값이 올바르지 않아요', impact: '보조 기술이 요소를 잘못 읽을 수 있어요' },
  'aria-hidden-focus': { title: '숨긴 요소에 포커스가 가요', impact: '키보드 사용자가 보이지 않는 곳으로 이동해요' },
  'nested-interactive': { title: '누를 수 있는 요소가 겹쳐 있어요', impact: '화면낭독기·키보드 사용자가 안쪽 요소에 갈 수 없어요' },
  'scrollable-region-focusable': { title: '스크롤 영역에 키보드로 갈 수 없어요', impact: '키보드 사용자는 안의 내용을 볼 수 없어요' },
  list: { title: '목록 구조가 올바르지 않아요', impact: '화면낭독기가 항목 수를 잘못 알려 줘요' },
  listitem: { title: '목록 항목이 목록 밖에 있어요', impact: '화면낭독기가 목록으로 읽지 못해요' },
  'definition-list': { title: '정의 목록 구조가 올바르지 않아요', impact: '화면낭독기가 내용을 잘못 묶어 읽어요' },
  'duplicate-id-aria': { title: 'ARIA 가 가리키는 id 가 중복돼요', impact: '보조 기술이 엉뚱한 요소를 연결해 읽어요' },
  'target-size': { title: '누르는 영역이 너무 작아요', impact: '손 떨림이 있거나 터치하는 사용자가 누르기 어려워요', team: 'design' },
}

function categoryOf(id: string): Category {
  if (/contrast|link-in-text-block/.test(id)) return '색 대비'
  if (/alt$|^button-name$|^svg-img|^role-img|^frame-title/.test(id)) return '대체 텍스트'
  if (/^label|select-name|input-field-name|autocomplete|form-field/.test(id)) return '폼 레이블'
  if (/^link-name|identical-links/.test(id)) return '링크'
  if (/focus|tabindex|scrollable|nested-interactive|accesskeys|target-size/.test(id)) return '키보드'
  return '문서 구조'
}

/** axe 태그 wcag143 → 'WCAG 1.4.3' */
function wcagOf(tags: string[]) {
  for (const t of tags) {
    const m = t.match(/^wcag(\d)(\d)(\d+)$/)
    if (m) return `WCAG ${m[1]}.${m[2]}.${m[3]}`
  }
  return 'WCAG 2.2 AA'
}

const selectorOf = (target: unknown[]) => target.map((t) => (Array.isArray(t) ? t.join(' ') : String(t))).join(' ')

function pathOf(url: string) {
  const p = new URL(url).pathname.replace(/\/$/, '')
  return p || '/'
}

export function toInspection(projectId: string, requestedUrl: string, version: number, scan: ScanResult): Inspection {
  const page = pathOf(scan.url || requestedUrl)
  const order: Severity[] = ['critical', 'serious', 'moderate', 'minor']
  const sorted = [...scan.violations].sort((a, b) => order.indexOf(a.impact ?? 'moderate') - order.indexOf(b.impact ?? 'moderate'))

  const overlays: IssueOverlay[] = []
  let label = 0
  const issues: Issue[] = sorted.map((v: AxeViolation, idx) => {
    const id = `${projectId}-${v.id}`
    const severity: Severity = v.impact ?? 'moderate'
    const ko = KO[v.id]
    const category = categoryOf(v.id)
    for (const n of v.nodes) {
      const r = n.rect
      // 캡처에 보이는 첫 화면(위쪽) 안에 있는 요소만 박스로 표시
      if (!r || r.y * SCALE > CAPTURE_H) continue
      label += 1
      overlays.push({
        label,
        issueId: id,
        selector: selectorOf(n.target),
        page,
        x: Math.round(r.x * SCALE),
        y: Math.round(r.y * SCALE),
        w: Math.max(6, Math.round(r.w * SCALE)),
        h: Math.max(6, Math.round(r.h * SCALE)),
      })
    }
    return {
      id,
      no: idx + 1,
      title: ko?.title ?? v.help,
      impact: ko?.impact ?? v.description,
      category,
      severity,
      priority: severity === 'critical' ? 'high' : 'normal',
      wcag: wcagOf(v.tags),
      elements: v.nodeCount,
      selectors: v.nodes.slice(0, 10).map((n) => selectorOf(n.target)),
      page,
      comments: 0,
      status: 'unassigned',
      aiTeam: ko?.team ?? (category === '색 대비' ? 'design' : 'frontend'),
      version,
      // 첫 번째 문제 요소의 실제 HTML 과 axe 의 고치는 방법 안내
      detail: v.nodes[0]?.failureSummary || undefined,
      fixCode: v.nodes[0]?.html || undefined,
    }
  })

  // 화면이 거의 비어 있으면(로그인 필요·스크립트 오류 등) "이슈 0개"를 믿으면 안 돼요
  const warning =
    scan.textLength < 40 || scan.elementCount < 25
      ? `페이지 내용이 거의 보이지 않아요(글자 ${scan.textLength}자 · 요소 ${scan.elementCount}개). 로그인이 필요하거나 페이지가 제대로 열리지 않았을 수 있어서 결과가 정확하지 않을 수 있어요.`
      : undefined

  // 통과율 = 통과한 규칙 / (통과 + 위반 규칙)
  const ruleTotal = scan.passes + scan.violations.length
  const passRate = ruleTotal ? Math.round((scan.passes / ruleTotal) * 100) : 100

  return {
    id: `${projectId}-v${version}`,
    projectId,
    url: requestedUrl,
    version,
    scannedAt: new Date().toISOString(),
    standard: 'WCAG 2.2 AA',
    pages: [page],
    passRate,
    issues,
    overlays,
    source: 'live',
    capture: { url: scan.url || requestedUrl, title: scan.title, screenshotUrl: scan.screenshotUrl },
    needsReview: scan.incomplete,
    passedRules: scan.passes,
    warning,
  }
}

export const liveApi: ApiClient = {
  // 프로젝트 저장은 아직 서버가 없어 브라우저에 (mock 과 같음)
  createProject: mockApi.createProject,
  deleteProject: mockApi.deleteProject,
  async runInspection(project, previousVersion = 0) {
    const scan = await scanPage(project.url)
    // 요소가 거의 없으면 빈 화면 — 결과를 만들지 않고 이유를 알려 줍니다
    if (scan.elementCount < 5) {
      throw new Error('페이지가 빈 화면으로 열려서 검사할 수 없었어요. 로그인이 필요한 페이지이거나 사이트가 외부 접근을 막고 있을 수 있어요.')
    }
    return toInspection(project.id, project.url, previousVersion + 1, scan)
  },
}
