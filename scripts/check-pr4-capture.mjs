import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import ts from 'typescript'
const root = 'artifacts.local/pr4-capture-check'
mkdirSync(`${root}/src/shared/api`, { recursive: true })
writeFileSync(
  `${root}/src/shared/api/http.ts`,
  process.env.PR4_CAPTURE_SOURCE ? readFileSync(process.env.PR4_CAPTURE_SOURCE) : execFileSync('git', ['show', '498f72a6cd432fd7c87b6e4cfd40e71a93c30633:src/shared/api/http.ts']),
)
execFileSync('git', ['apply', '--check', `--directory=${root}`, 'patches/pr-4-full-capture.patch'])
execFileSync('git', ['apply', `--directory=${root}`, 'patches/pr-4-full-capture.patch'])
const source = readFileSync(`${root}/src/shared/api/http.ts`, 'utf8')
const start = source.indexOf('function toInspection(')
const end = source.indexOf('/* ── 검사', start)
assert.ok(start >= 0 && end > start)
const js = ts.transpileModule(source.slice(start, end), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText
const toInspection = new Function(
  'CAPTURE_W',
  'BASE',
  'CATEGORY',
  'pathOf',
  'standardLabel',
  `${js}; return toInspection`,
)(
  734,
  '/api',
  {},
  () => '/long',
  () => 'WCAG 2.2 AA',
)
const elements = [
  { css_selector: '#below', bbox_x: 30, bbox_y: 4000, bbox_width: 100, bbox_height: 24 },
  { css_selector: '#no-position', bbox_x: null, bbox_y: null, bbox_width: null, bbox_height: null },
]
const result = toInspection(
  { id: '42', url: 'https://example.test' },
  1,
  {
    scan_id: 1,
    target_url: 'https://example.test/long',
    viewport_width: 1440,
    wcag_standard: 'wcag_2_2_aa',
    scanned_at: '2026-11-19',
  },
  [
    {
      issue_id: 1,
      rule_id: 'color-contrast',
      issue_no: 1,
      title: '아래쪽 문제',
      severity: 'serious',
      category: 'color_contrast',
      element_count: 2,
      elements,
      suggestions: [],
    },
  ],
)
assert.equal(result.overlays.length, 1, 'only elements without coordinates excluded')
assert.equal(
  result.overlays[0].y,
  Math.round((4000 * 734) / 1440),
  'below-fold page coordinates preserved',
)
assert.ok(result.overlays[0].y > 557)
console.log(
  'PASS: PR #4 companion patch applies to recorded head and preserves below-fold server coordinates',
)
