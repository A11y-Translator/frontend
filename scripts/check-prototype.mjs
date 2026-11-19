import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'node:http'
import { chromium } from 'playwright-core'
const fixture = createServer((request, response) => {
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.end(
    '<!doctype html><html lang="ko"><head><title>검사 연결 확인</title></head><body><main><h1>접근성 검사 테스트</h1><p>실제 axe-core 결과를 확인하는 페이지입니다.</p><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="><a href="/second">다음 페이지</a><button>확인</button><p>마지막 문단</p></main></body></html>',
  )
})
await new Promise((resolve) => fixture.listen(0, '127.0.0.1', resolve))
const fixtureUrl = `http://127.0.0.1:${fixture.address().port}`
const base = process.env.CHECK_URL ?? 'http://127.0.0.1:5175'
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 1440, height: 820 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await mkdir('artifacts.local', { recursive: true })
try {
  await page.goto(base)
  await page.getByRole('heading', { name: '링크 하나로 시작하는 접근성 점검' }).waitFor()
  await page.evaluate(() => document.fonts.ready)
  assert.equal(
    Math.round((await page.getByRole('navigation', { name: '주 메뉴' }).boundingBox()).width),
    280,
  )
  await page.screenshot({ path: 'artifacts.local/prototype-home.png', fullPage: true })
  await page.getByRole('button', { name: '프로젝트 선택' }).click()
  await page.getByRole('textbox', { name: '프로젝트 검색' }).fill('프로젝트B')
  await page.locator('.prototype-project-picker').getByRole('button', { name: '프로젝트B' }).click()
  await page.getByRole('button', { name: '검사하기', exact: true }).click()
  await page.getByRole('alert').waitFor()
  assert.match(await page.getByRole('alert').innerText(), /주소/)
  await page.locator('.prototype-home-columns .prototype-mentions>button').click()
  await page.locator('.prototype-mentions li a').first().waitFor()
  await page.getByRole('textbox', { name: '검사할 페이지 주소' }).fill(fixtureUrl)
  await page.getByRole('button', { name: /여러 페이지 함께 검사/ }).click()
  await page.getByRole('checkbox', { name: /첫 페이지의 링크에서/ }).check()
  await page.getByRole('button', { name: '검사하기', exact: true }).click()
  await page.waitForURL('**/projects/b/inspection', { timeout: 60000 })
  await page.locator('.inspection-list>ul>li>button').first().waitFor()
  const scanned = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('a11y-translator:prototype-state:v1')),
  )
  assert.equal(scanned.projects.length, 4, 'selected project reused')
  assert.equal(scanned.inspections.b.source, 'live', 'real axe result stored')
  assert.equal(scanned.inspections.b.version, 12, 'existing project version incremented')
  assert.equal(
    scanned.inspections.b.pages.length,
    2,
    'discovery also works for selected existing project',
  )
  assert.equal(
    scanned.projects.find((p) => p.id === 'b').discover,
    undefined,
    'discovery resets after scan',
  )
  assert.ok(scanned.inspections.b.issues.length > 0)
  const liveIssueId = scanned.inspections.b.issues[0].id
  await page.locator('.inspection-list>ul>li>button').first().click()
  await page.getByRole('button', { name: '내가 맡기', exact: true }).click()
  await page.goto(`${base}/todo/mine`)
  await page.locator(`a[href="/issues/${liveIssueId}"]`).first().waitFor()
  await page.goto(`${base}/issues/${liveIssueId}`)
  await page.getByText('검사한 요소 HTML', { exact: true }).waitFor()
  assert.equal(
    await page.locator('.prototype-proposed').count(),
    0,
    'evidence is not offered as a fix',
  )
  await page.evaluate(() => localStorage.removeItem('a11y-translator:prototype-state:v1'))
  await page.goto(`${base}/todo/mine`)
  await page.locator('.prototype-todo-table tbody tr').first().waitFor()
  const count = await page.locator('.prototype-todo-table tbody tr').count()
  await page.getByRole('textbox', { name: '이슈 이름 검색' }).fill('없는 항목 1234')
  assert.equal(await page.locator('.prototype-todo-table tbody tr').count(), 0)
  await page.getByRole('textbox', { name: '이슈 이름 검색' }).fill('')
  assert.equal(await page.locator('.prototype-todo-table tbody tr').count(), count)
  await page.screenshot({ path: 'artifacts.local/prototype-todo.png', fullPage: true })
  await page.locator('.prototype-todo-table tbody tr td:first-child a').first().click()
  await page.getByRole('heading', { name: '수정 제안', exact: true }).waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: 'artifacts.local/prototype-issue.png', fullPage: true })
  await page.getByRole('button', { name: '✓ 해결로 표시', exact: true }).click()
  await page.getByRole('button', { name: '↶ 해결 표시 되돌리기' }).click()
  const comment = page.locator('.prototype-issue-bottom .inspection-comments input')
  await comment.fill('프로토타입 댓글 확인')
  await page.locator('.prototype-issue-bottom .inspection-comments button[type=submit]').click()
  await page
    .locator('.prototype-issue-bottom')
    .getByText('프로토타입 댓글 확인', { exact: true })
    .waitFor()
  await page.goto(`${base}/members`)
  await page.locator('.prototype-member-table tbody tr').first().waitFor()
  await page.screenshot({ path: 'artifacts.local/prototype-members.png', fullPage: true })
  await page.getByRole('textbox', { name: '이름, 이메일 검색' }).fill('박서연')
  assert.equal(await page.locator('.prototype-member-table tbody tr').count(), 1)
  await page.getByRole('button', { name: '박서연 정보 보기' }).click()
  await page.getByRole('dialog').waitFor()
  await page.screenshot({ path: 'artifacts.local/prototype-member-detail.png' })
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '＋ 팀원 초대', exact: true }).click()
  await page.getByRole('textbox', { name: '이메일', exact: true }).fill('new@example.com')
  await page.getByRole('textbox', { name: '이메일', exact: true }).press('Enter')
  await page.getByRole('button', { name: 'new@example.com 제거' }).waitFor()
  assert.equal(await page.getByRole('button', { name: '초대 보내기 (1명)' }).isDisabled(), true)
  await page.screenshot({ path: 'artifacts.local/prototype-invite.png' })
  await page.keyboard.press('Escape')
  for (const width of [390, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['/', '/todo/mine', '/members', '/issues/i1', '/projects/b/inspection']) {
      await page.goto(base + route)
      await page.locator('#main').waitFor()
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${width} ${route}: no page overflow`,
      )
      assert.equal(
        await page
          .locator('img')
          .evaluateAll((images) => images.filter((i) => i.complete && !i.naturalWidth).length),
        0,
        `${route}: assets`,
      )
    }
  }
  assert.deepEqual(errors, [])
  console.log(
    'PASS: real axe scan into selected project → assign → todo → issue evidence; prototype navigation, selection, search, resolve/reopen, comments, member dialogs, email chips, responsive layouts',
  )
} finally {
  await browser.close()
  await new Promise((resolve) => fixture.close(resolve))
}
