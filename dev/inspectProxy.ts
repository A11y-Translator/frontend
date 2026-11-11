/// <reference lib="dom" />
// ↑ page.evaluate 안의 코드는 브라우저에서 돌아서 window·document 타입이 필요해요
// [개발 서버 전용] 실제 URL 접근성 검사 서버.
// 개발 서버가 이 컴퓨터의 크롬을 화면 없이(headless) 띄워 페이지를 열고, axe-core 로 WCAG 2.2 AA 검사를 합니다.
// 백엔드가 할 일을 개발 중에 대신 하는 것이라, 백엔드도 같은 방식(Playwright + axe-core)으로 만들면 됩니다.
//
//  - 진짜 브라우저에서 열기 때문에 React/Vite 같은 SPA, 지연 로딩, CORS 문제 없이 그대로 그려집니다.
//  - 검사 화면(1440×1093)을 찍어 node_modules/.a11y-shots/ 에 저장 → 미리보기·이슈 상세 캡처로 씁니다.
//  - 크롬이 없으면 오류 메시지로 알려 줍니다. (playwright-core 는 브라우저를 내려받지 않음)
//
// 앱이 쓰는 주소
//   GET  /__inspect/config         → { ok: true }   개발 서버인지 확인
//   GET  /__inspect/scan?url=…     → 검사 결과 JSON (shared/api/liveProxy.ts 의 ScanResult) 또는 { error }
//   GET  /__inspect/shot/<파일>.jpg → 검사 화면 캡처
//
// 백엔드가 붙으면(VITE_API_MODE=http) 이 서버는 쓰이지 않습니다.
import { mkdirSync, readFileSync, existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import type { Browser } from 'playwright-core'

const require = createRequire(import.meta.url)
/** 캡처 크기: 화면 속 가짜 사이트와 같은 비율(734×557)을 데스크톱 폭 1440 으로 */
const VIEWPORT = { width: 1440, height: 1093 }
const GOTO_TIMEOUT_MS = 25_000
const SHOT_DIR = join(process.cwd(), 'node_modules', '.a11y-shots')

function friendlyError(err: unknown) {
  const text = err instanceof Error ? err.message : String(err)
  if (/ERR_NAME_NOT_RESOLVED/.test(text)) return '사이트를 찾지 못했어요. 주소를 확인해 주세요.'
  if (/ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET|ERR_ADDRESS_UNREACHABLE/.test(text)) return '사이트에 연결하지 못했어요. 주소를 확인해 주세요.'
  if (/ERR_CERT|SSL/.test(text)) return '사이트 보안 인증서에 문제가 있어 열 수 없어요.'
  if (/Timeout/i.test(text)) return '페이지가 25초 안에 열리지 않았어요. 잠시 후 다시 시도해 주세요.'
  if (/Executable doesn't exist|Chromium distribution 'chrome' is not found|Failed to launch/i.test(text))
    return '실제 검사를 하려면 이 컴퓨터에 Google Chrome 이 설치돼 있어야 해요.'
  return text.split('\n')[0] || '검사하지 못했어요.'
}

export function inspectProxy(): Plugin {
  return {
    name: 'a11y-inspect-server',
    apply: 'serve',
    configureServer(server) {
      const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
      mkdirSync(SHOT_DIR, { recursive: true })

      let browserPromise: Promise<Browser> | null = null
      const getBrowser = () => {
        browserPromise ??= import('playwright-core')
          .then(({ chromium }) => chromium.launch({ channel: 'chrome', headless: true }))
          .catch((e) => {
            browserPromise = null
            throw e
          })
        return browserPromise
      }
      server.httpServer?.once('close', () => {
        browserPromise?.then((b) => b.close()).catch(() => {})
      })

      server.middlewares.use('/__inspect/config', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: true }))
      })

      server.middlewares.use('/__inspect/shot/', (req, res) => {
        const name = (req.url ?? '').replace(/^\//, '').split('?')[0]
        const file = join(SHOT_DIR, name)
        if (!/^[\w-]+\.jpg$/.test(name) || !existsSync(file)) return void res.writeHead(404).end()
        res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'max-age=31536000, immutable' })
        res.end(readFileSync(file))
      })

      server.middlewares.use('/__inspect/scan', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        const target = new URL(req.url ?? '/', 'http://localhost').searchParams.get('url') ?? ''
        let context: Awaited<ReturnType<Browser['newContext']>> | undefined
        try {
          const u = new URL(target)
          if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('http/https 주소만 검사할 수 있어요.')

          const browser = await getBrowser()
          // 화면 없는 크롬이라고 밝히면 막는 사이트가 있어 일반 크롬처럼 보이게 합니다
          const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browser.version()} Safari/537.36`
          context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'ko-KR', userAgent })
          const page = await context.newPage()

          const response = await page.goto(u.href, { waitUntil: 'load', timeout: GOTO_TIMEOUT_MS })
          if (response && response.status() >= 400) {
            throw new Error(`페이지를 불러오지 못했어요. (응답 코드 ${response.status()}${response.status() === 403 ? ' · 봇 접근을 막는 사이트일 수 있어요' : ''})`)
          }
          // SPA 가 데이터를 받아 다 그릴 때까지 조금 더 (최대 5초)
          await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {})
          await page.waitForTimeout(500)

          await page.addScriptTag({ content: axeSource })
          const result = await page.evaluate(async () => {
            const w = window as unknown as { axe: { run: (ctx: Document, opts: unknown) => Promise<any> } } // eslint-disable-line @typescript-eslint/no-explicit-any
            window.scrollTo(0, 0)
            const r = await w.axe.run(document, {
              runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
              resultTypes: ['violations'],
            })
            const rectOf = (target: unknown[]) => {
              try {
                const sel = target[0]
                if (typeof sel !== 'string') return null
                const el = document.querySelector(sel)
                if (!el) return null
                const b = el.getBoundingClientRect()
                if (!b.width && !b.height) return null
                return { x: b.left + window.scrollX, y: b.top + window.scrollY, w: b.width, h: b.height }
              } catch {
                return null
              }
            }
            return {
              title: document.title,
              passes: r.passes.length,
              incomplete: r.incomplete.length,
              textLength: document.body ? document.body.innerText.trim().length : 0,
              elementCount: document.body ? document.body.querySelectorAll('*').length : 0,
              viewport: { w: window.innerWidth, h: window.innerHeight },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              violations: r.violations.map((v: any) => ({
                id: v.id,
                impact: v.impact,
                help: v.help,
                description: v.description,
                helpUrl: v.helpUrl,
                tags: v.tags,
                nodeCount: v.nodes.length,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                nodes: v.nodes.slice(0, 30).map((n: any) => ({
                  target: n.target,
                  html: String(n.html || '').slice(0, 300),
                  failureSummary: String(n.failureSummary || '').slice(0, 500),
                  rect: rectOf(n.target),
                })),
              })),
            }
          })

          const shotName = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`
          const shot = await page.screenshot({ type: 'jpeg', quality: 70, clip: { x: 0, y: 0, ...VIEWPORT } })
          await writeFile(join(SHOT_DIR, shotName), shot)

          res.end(JSON.stringify({ ...result, url: page.url(), screenshotUrl: `/__inspect/shot/${shotName}` }))
        } catch (err) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: friendlyError(err) }))
        } finally {
          await context?.close().catch(() => {})
        }
      })
    },
  }
}
