import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'
const base = process.env.CHECK_URL ?? 'http://127.0.0.1:5175'
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const key = 'a11y-translator:prototype-state:v1'
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await mkdir('artifacts.local', { recursive: true })
const saved = () => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key)
const scroll = () => page.locator('.site-capture-viewport').evaluate((el) => el.scrollTop)
try {
  await page.route('**/long-capture.svg', (route) =>
    route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="5364"><rect width="1440" height="5364" fill="white"/><text x="40" y="60" font-size="36">FIRST SCREEN</text><rect x="30" y="3700" width="600" height="80" fill="#fed7aa"/><text x="40" y="3750" font-size="36">BELOW FIRST SCREEN</text><rect x="30" y="4900" width="600" height="80" fill="#bae6fd"/><text x="40" y="4950" font-size="36">BOTTOM OF PAGE</text></svg>',
    }),
  )
  await page.goto(base)
  await page.locator('.prototype-project-grid li').first().waitFor()
  await page.evaluate(async () => {
    const { actions } = await import('/src/shared/store.ts')
    actions.reset()
  })
  await page.evaluate((key) => {
    const s = JSON.parse(localStorage.getItem(key))
    s.projects.push(
      { ...s.projects[0], id: 'fifth', name: '다섯 번째 프로젝트' },
      { ...s.projects[0], id: 'sixth', name: '여섯 번째 프로젝트' },
    )
    localStorage.setItem(key, JSON.stringify(s))
  }, key)
  await page.reload()
  assert.equal(await page.locator('.prototype-project-grid>li').count(), 4)
  await page.getByRole('button', { name: '전체보기', exact: true }).click()
  assert.equal(await page.locator('.prototype-project-grid>li').count(), 6)
  await page.locator('.prototype-project-grid a[href="/projects/sixth/inspection"]').click()
  assert.ok(page.url().endsWith('/projects/sixth/inspection'))
  await page.goto(base)
  await page.getByRole('button', { name: '전체보기', exact: true }).click()
  await page.getByRole('button', { name: '접기', exact: true }).click()
  assert.equal(await page.locator('.prototype-project-grid>li').count(), 4)
  await page.goto(`${base}/todo/mine`)
  const row = page.locator('.prototype-todo-table tbody tr').first()
  const issueId = (await row.locator('a').first().getAttribute('href')).split('/').at(-1)
  const before = (await saved()).issues.find((i) => i.id === issueId).status
  const originalLabel = await row.getByRole('checkbox').getAttribute('aria-label')
  await row.getByRole('checkbox').focus()
  await page.keyboard.press('Space')
  await page.getByRole('button', { name: '되돌리기', exact: true }).waitFor()
  assert.equal((await saved()).issues.find((i) => i.id === issueId).status, 'resolved')
  await page.getByRole('button', { name: '되돌리기', exact: true }).click()
  assert.equal((await saved()).issues.find((i) => i.id === issueId).status, before)
  await page.getByLabel('할 일 상태', { exact: true }).selectOption('all')
  await page.getByRole('checkbox', { name: originalLabel, exact: true }).check()
  const completed = page.getByRole('checkbox', {
    name: originalLabel.replace('완료로 표시', '완료 취소'),
    exact: true,
  })
  assert.equal(await completed.isChecked(), true)
  await page.reload()
  await page.getByLabel('할 일 상태', { exact: true }).selectOption('resolved')
  const restored = page.getByRole('checkbox', {
    name: originalLabel.replace('완료로 표시', '완료 취소'),
    exact: true,
  })
  await restored.focus()
  await page.keyboard.press('Space')
  assert.equal((await saved()).issues.find((i) => i.id === issueId).status, before)
  await page.evaluate(
    ({ key, base }) => {
      const s = JSON.parse(localStorage.getItem(key))
      const issue = {
        ...s.issues[0],
        id: 'long-issue',
        title: '긴 페이지 아래쪽 문제',
        page: '/long',
        version: 1,
        selectors: ['#below', '#bottom'],
        elements: 2,
        assigneeId: 'hyeseung',
        status: 'todo',
      }
      const other = {
        ...issue,
        id: 'top-issue',
        no: 2,
        title: '맨 위 문제',
        selectors: ['#top'],
        elements: 1,
      }
      const inspection = {
        id: 'long-v1',
        projectId: 'long-project',
        url: 'https://example.test/long',
        version: 1,
        scannedAt: new Date().toISOString(),
        standard: 'WCAG 2.2 AA',
        pages: ['/long'],
        passRate: 50,
        issues: [issue, other],
        source: 'server',
        capture: { url: 'https://example.test/long', screenshotUrl: `${base}/long-capture.svg` },
        overlays: [
          {
            label: 1,
            issueId: issue.id,
            selector: '#below',
            page: '/long',
            x: 20,
            y: 1900,
            w: 300,
            h: 40,
          },
          {
            label: 2,
            issueId: issue.id,
            selector: '#bottom',
            page: '/long',
            x: 20,
            y: 2500,
            w: 300,
            h: 40,
          },
          {
            label: 3,
            issueId: other.id,
            selector: '#top',
            page: '/long',
            x: 20,
            y: 40,
            w: 300,
            h: 30,
          },
        ],
      }
      s.projects.push({
        id: 'long-project',
        name: '긴 페이지',
        url: inspection.url,
        currentVersion: 1,
        status: 'active',
        updatedAt: '',
      })
      s.inspections['long-project'] = inspection
      s.inspectionHistory['long-project'] = [inspection]
      s.comments.push({
        id: 'legacy-pin',
        issueId: issue.id,
        authorId: 'hyeseung',
        body: '기존 좌표 핀',
        time: '어제',
        threadKey: 'pin:legacy',
        pin: { x: 60, y: 30 },
      })
      localStorage.setItem(key, JSON.stringify(s))
    },
    { key, base },
  )
  await page.goto(`${base}/projects/long-project/inspection`)
  await page.locator('[data-capture-selector="#below"]').waitFor()
  assert.ok((await scroll()) > 0, 'result automatically scrolls to first issue below fold')
  const image = page.locator('.site-capture-content img').first()
  const natural = await image.evaluate((el) => ({
    width: el.naturalWidth,
    height: el.naturalHeight,
  }))
  assert.equal(natural.height, 5364)
  const content = await page.locator('.site-capture-content').boundingBox()
  const viewport = await page.locator('.site-capture-viewport').boundingBox()
  assert.ok(content.height > viewport.height * 4, 'full capture rendered beyond fixed viewport')
  await page.locator('.inspection-list>ul>li>button').nth(1).click()
  assert.equal(await scroll(), 0, 'selecting another issue scrolls to its first element')
  await page.getByRole('button', { name: '이슈 목록', exact: true }).click()
  await page.locator('.inspection-list>ul>li>button').first().click()
  await page.locator('.inspection-evidence summary').click()
  const locateBottom = page.getByRole('button', { name: /위치 보기.*#bottom/ })
  await locateBottom.click()
  const bottomScroll = await scroll()
  assert.ok(bottomScroll > 1500, 'locate scrolls to later matching element')
  await page.locator('.site-capture-viewport').evaluate((el) => {
    el.scrollTop = 0
  })
  await locateBottom.click()
  assert.ok((await scroll()) > 1500, 'repeated locate works after manual scrolling')
  await page.goto(`${base}/issues/long-issue`)
  await page.locator('[data-capture-selector="#below"]').waitFor()
  await page.locator('.site-capture-viewport').scrollIntoViewIfNeeded()
  assert.ok((await scroll()) > 0, 'issue detail starts at first problem below fold')
  await page.getByRole('button', { name: '코멘트 창 닫기', exact: true }).click()
  await page.locator('.prototype-location-elements button').nth(1).click()
  assert.ok((await scroll()) > 1500, 'detail selector scrolls to bottom element')
  await page.getByRole('button', { name: '코멘트 창 닫기', exact: true }).click()
  // Existing pins keep their original 557px coordinate basis when the image grows.
  const legacy = page.getByRole('button', { name: /코멘트 핀:.*기존 좌표 핀/ })
  const legacyY = await legacy.evaluate((el) => parseFloat(el.style.top))
  assert.ok(
    Math.abs(legacyY - (30 * 557) / ((734 * 5364) / 1440)) < 0.01,
    'legacy pins stay at original page position',
  )
  const view = await page.locator('.site-capture-viewport').boundingBox()
  await page.mouse.click(view.x + view.width * 0.65, view.y + 140)
  const thread = page.locator('.site-capture-content').getByRole('region')
  await thread.getByRole('combobox').fill('아래쪽 페이지 핀')
  await thread.locator('button[type=submit]').click()
  const pin = (await saved()).comments.find((c) => c.body === '아래쪽 페이지 핀').pin
  assert.ok(pin.height > 2500, 'new pin records full-page basis')
  assert.ok(pin.y > 60, 'new pin y is normalized to full screenshot')
  await page.reload()
  await page.locator('[data-capture-selector="#below"]').waitFor()
  const savedPin = page.getByRole('button', { name: /코멘트 핀:.*아래쪽 페이지 핀/ })
  assert.ok(
    Math.abs((await savedPin.evaluate((el) => parseFloat(el.style.top))) - pin.y) < 0.01,
    'new pin survives reload at same page coordinate',
  )
  await page.setViewportSize({ width: 1024, height: 900 })
  assert.ok(
    Math.abs((await savedPin.evaluate((el) => parseFloat(el.style.top))) - pin.y) < 0.01,
    'pin survives responsive resize',
  )
  await page.screenshot({ path: 'artifacts.local/issues-full-capture.png', fullPage: true })
  assert.deepEqual(errors, [])
  console.log(
    'PASS: #5 full 5364px capture, auto/explicit/repeated location scroll, legacy/full-page pins; #6 six projects, expand/collapse/open; #7 keyboard complete, undo, reload and reopen',
  )
} catch (error) {
  await page.screenshot({ path: 'artifacts.local/issues-failure.png', fullPage: true })
  console.log(await page.locator('main').innerText())
  throw error
} finally {
  await browser.close()
}
