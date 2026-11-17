import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const extension = resolve(process.env.CHECK_EXTENSION ?? 'artifacts.local/extension')
const manifest = JSON.parse(await readFile(resolve(extension, 'manifest.json'), 'utf8'))
assert.equal(manifest.action.default_popup, 'popup.html')
assert.ok(
  manifest.host_permissions?.includes('http://localhost/*'),
  'use an EXT_TEST=1 build for this check',
)
const server = createServer((_, response) => {
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.end(
    '<!doctype html><html lang="ko"><title>확장 검사 테스트</title><body><main><h1>접근성 검사 테스트</h1><p>실제 DOM 검사를 위한 충분한 길이의 테스트 문장입니다. 이미지와 입력칸에 의도적인 접근성 문제를 넣었습니다.</p><img src="data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\"/%3E"><input><button></button></main></body></html>',
  )
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = `http://localhost:${server.address().port}`
let context
try {
  context = await chromium.launchPersistentContext('', {
    executablePath:
      process.env.EDGE_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true,
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  })
  const worker =
    context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker', { timeout: 15000 }))
  const extensionId = new URL(worker.url()).hostname
  const target = await context.newPage()
  await target.goto(address)
  const tabId = await worker.evaluate(
    async (url) => (await chrome.tabs.query({})).find((t) => t.url === url + '/')?.id,
    address,
  )
  assert.ok(tabId, 'target tab found')
  const popup = await context.newPage()
  const errors = []
  popup.on('pageerror', (error) => errors.push(error.message))
  const popupUrl = `chrome-extension://${extensionId}/popup.html?tabId=${tabId}`
  await popup.goto(popupUrl)
  await popup.getByRole('button', { name: '이 페이지 검사하기' }).click()
  await popup.locator('.inspection-popup__total').waitFor({ timeout: 20000 })
  const stored = await worker.evaluate(
    async (id) => (await chrome.storage.session.get(`scan:${id}`))[`scan:${id}`],
    tabId,
  )
  assert.ok(
    stored.scan.violations.some((v) => v.id === 'image-alt'),
    'real axe image-alt violation',
  )
  assert.equal(
    Number(await popup.locator('.inspection-popup__total strong').innerText()),
    stored.scan.violations.length,
  )
  assert.ok(
    await target.evaluate(
      () =>
        document.getElementById('a11y-translator-overlay')?.shadowRoot?.querySelectorAll('.box')
          .length > 0,
    ),
    'real page overlay rendered',
  )
  assert.equal(
    await popup.getByRole('button', { name: '웹에서 확인하고 고치기' }).isDisabled(),
    true,
    'unconnected web save is not advertised as working',
  )
  assert.equal(
    await popup.locator('.inspection-popup').evaluate((el) => el.getBoundingClientRect().width),
    400,
  )
  await popup.screenshot({ path: 'artifacts.local/extension-result.png' })
  await popup.reload()
  await popup.locator('.inspection-popup__total').waitFor()
  assert.equal(
    Number(await popup.locator('.inspection-popup__total strong').innerText()),
    stored.scan.violations.length,
    'saved result restored',
  )
  const blockedId = await worker.evaluate(
    async () => (await chrome.tabs.create({ url: 'edge://version' })).id,
  )
  assert.ok(blockedId)
  await popup.goto(`chrome-extension://${extensionId}/popup.html?tabId=${blockedId}`)
  await popup.getByRole('heading', { name: '이 페이지는 검사할 수 없어요' }).waitFor()
  assert.deepEqual(errors, [])
  console.log(
    'PASS: installed MV3 popup, actual axe scan, real overlay, result count, local restore, disabled web upload, restricted URL',
  )
} finally {
  await context?.close()
  await new Promise((resolve) => server.close(resolve))
}
