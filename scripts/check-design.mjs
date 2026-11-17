import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const base = process.env.CHECK_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
await mkdir('artifacts.local', { recursive: true })
try {
  for (const screen of ['login', 'ready', 'scanning', 'result', 'empty', 'unsupported']) {
    await page.goto(`${base}/extension/popup?screen=${screen}`)
    const popup = page.locator('.inspection-popup')
    await popup.waitFor()
    await page.evaluate(() => document.fonts.ready)
    const rect = await popup.boundingBox()
    assert.equal(rect.width, 400, `${screen}: popup width`)
    assert.equal(rect.height, 600, `${screen}: popup height`)
    assert.equal(await popup.locator('h1').count(), 1, `${screen}: one heading`)
    const footer = await popup.locator('footer').boundingBox()
    assert.ok(
      footer.y + footer.height <= rect.y + rect.height + 1,
      `${screen}: footer remains visible`,
    )
    assert.equal(
      await popup
        .locator('img')
        .evaluateAll(
          (images) => images.filter((image) => !image.complete || !image.naturalWidth).length,
        ),
      0,
      `${screen}: assets loaded`,
    )
    await popup.screenshot({ path: `artifacts.local/popup-${screen}.png` })
  }
  await page.goto(`${base}/extension/popup`)
  await page.getByRole('button', { name: 'Google 계정으로 계속하기' }).click()
  await page.getByRole('button', { name: '이 페이지 검사하기' }).click()
  await page.getByRole('heading', { name: '검사 중이에요' }).waitFor()
  await page.getByRole('button', { name: '검사 취소' }).click()
  await page.getByRole('button', { name: '이 페이지 검사하기' }).waitFor()

  await page.goto(`${base}/projects/b/inspection`)
  await page.locator('.inspection-list').waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'artifacts.local/web-list.png', fullPage: true })
  await page.locator('.inspection-list>ul>li>button').first().click()
  await page.locator('.inspection-detail').waitFor()
  const input = page.locator('.inspection-comments input')
  await input.fill('디자인 회귀 확인')
  await page.locator('.inspection-comments button[type=submit]').click()
  await page.getByText('디자인 회귀 확인', { exact: true }).waitFor()
  await page.getByRole('button', { name: '해결로 표시', exact: true }).click()
  await page.getByRole('button', { name: '해결됨 · 되돌리기' }).waitFor()
  await page.getByRole('button', { name: '해결됨 · 되돌리기' }).click()
  await page.getByRole('button', { name: '담당자 변경' }).click()
  await page.getByRole('button', { name: /박서연/ }).click()
  assert.match(await page.getByRole('button', { name: '담당자 변경' }).innerText(), /박서연/)
  await page.screenshot({ path: 'artifacts.local/web-detail.png', fullPage: true })
  await page.getByRole('button', { name: '이슈 목록', exact: true }).click()
  await page.getByRole('switch', { name: '문제 위치 표시' }).click()
  assert.equal(
    await page.getByRole('switch', { name: '문제 위치 표시' }).getAttribute('aria-checked'),
    'false',
  )
  await page.getByLabel('검사 페이지').selectOption('/contact')
  assert.ok((await page.locator('.inspection-list>ul>li').count()) > 0)
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
    'mobile: no horizontal overflow',
  )
  await page.screenshot({ path: 'artifacts.local/web-mobile.png', fullPage: true })

  // 실제 검사 형태에서도 담당자 변경이 최신 검사와 기록에 반영되고 과거 버전은 유지되는지 확인한다.
  await page.evaluate(() => {
    const key = 'a11y-translator:prototype-state:v1'
    const state = JSON.parse(localStorage.getItem(key))
    const issue = {
      ...state.issues[0],
      id: 'live-check-image-alt',
      page: '/',
      version: 2,
      status: 'unassigned',
      assigneeId: undefined,
      fixOptions: undefined,
      savedFix: undefined,
      fixCode: '<img src="sample.png">',
    }
    const inspection = {
      id: 'live-check-v2',
      projectId: 'live-check',
      url: 'https://example.com',
      version: 2,
      scannedAt: new Date().toISOString(),
      standard: 'WCAG 2.2 AA',
      pages: ['/'],
      passRate: 50,
      issues: [issue],
      overlays: [],
      source: 'live',
    }
    state.projects.push({
      id: 'live-check',
      name: '실제 검사 형태 검증',
      url: 'https://example.com',
      currentVersion: 2,
      status: 'active',
      updatedAt: '',
    })
    state.inspections['live-check'] = inspection
    state.inspectionHistory['live-check'] = [
      { ...inspection, id: 'live-check-v1', version: 1, issues: [{ ...issue, version: 1 }] },
      inspection,
    ]
    localStorage.setItem(key, JSON.stringify(state))
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${base}/projects/live-check/inspection`)
  await page.getByRole('heading', { name: '검사 시점 캡처가 없어요' }).waitFor()
  await page.locator('.inspection-list>ul>li>button').first().click()
  await page.getByRole('button', { name: '내가 맡기' }).click()
  assert.match(await page.getByRole('button', { name: '담당자 변경' }).innerText(), /김혜승/)
  assert.equal(
    await page.locator('.inspection-suggestion').count(),
    0,
    'original HTML is not presented as a fix',
  )
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('a11y-translator:prototype-state:v1')),
  )
  assert.equal(saved.inspections['live-check'].issues[0].assigneeId, 'hyeseung')
  assert.equal(saved.inspectionHistory['live-check'][1].issues[0].assigneeId, 'hyeseung')
  assert.equal(
    saved.inspectionHistory['live-check'][0].issues[0].assigneeId,
    undefined,
    'past version remains unchanged',
  )
  assert.deepEqual(errors, [], 'no browser runtime errors')
  console.log(
    'PASS: 6 popup states, dimensions/assets/footer, cancel, web issue/detail, comment, resolve/reopen, assignee, overlay, page selection, mobile layout',
  )
} finally {
  await browser.close()
}
