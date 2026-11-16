// 검사하는 페이지 안에서 실행되는 함수들 (chrome.scripting.executeScript 의 func 로 넘김).
// 크롬이 함수 "본문만" 복사해서 페이지에 넣기 때문에, 바깥 변수·import 를 쓰면 안 되고 필요한 값은 인자로만 받아요.
// 확장 전용 공간(isolated world)에서 돌아서 페이지의 스크립트·CSP 와 섞이지 않고, 화면(DOM)만 같이 봐요.
// 페이지를 바꾸는 건 오버레이(그림) 하나뿐이고, 그것도 shadow DOM 안에 그려서 사이트 스타일에 영향을 주지 않아요.

/** axe-core 로 WCAG 2.0·2.1 A/AA + 2.2 AA 검사 → 웹 검사(dev/inspectProxy.ts)와 같은 모양의 결과 */
export async function runAxeInPage(tags: string[]) {
  const w = window as unknown as { axe?: { run: (ctx: Document, opts: unknown) => Promise<any> } } // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!w.axe) throw new Error('검사 도구(axe-core)를 불러오지 못했어요.')
  const r = await w.axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] })
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
    url: location.href,
    title: document.title,
    passes: r.passes.length as number,
    incomplete: r.incomplete.length as number,
    textLength: document.body ? document.body.innerText.trim().length : 0,
    elementCount: document.body ? document.body.querySelectorAll('*').length : 0,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    violations: r.violations.map((v: any) => ({
      id: v.id as string,
      impact: v.impact,
      help: v.help as string,
      description: v.description as string,
      helpUrl: v.helpUrl as string,
      tags: v.tags as string[],
      nodeCount: v.nodes.length as number,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nodes: v.nodes.slice(0, 30).map((n: any) => ({
        target: n.target,
        html: String(n.html || '').slice(0, 300),
        failureSummary: String(n.failureSummary || '').slice(0, 500),
        rect: rectOf(n.target),
      })),
    })),
  }
}

export interface OverlayItem {
  id: string
  label: number
  selectors: string[]
}

/** 문제 요소마다 테두리 + 번호. 창 크기가 바뀌면 다시 그려요 */
export function drawOverlayInPage(items: OverlayItem[]) {
  const ID = 'a11y-translator-overlay'
  const g = window as unknown as { __a11yOverlayDraw?: () => void }
  if (g.__a11yOverlayDraw) window.removeEventListener('resize', g.__a11yOverlayDraw)
  document.getElementById(ID)?.remove()

  const host = document.createElement('div')
  host.id = ID
  host.setAttribute('aria-hidden', 'true') // 화면낭독기에는 사이드 패널이 같은 정보를 알려 줌
  host.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;z-index:2147483646;pointer-events:none;'
  const root = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = `
    .box{position:absolute;box-sizing:border-box;border:2px solid #3086ff;background:rgba(48,134,255,.08);border-radius:3px;transition:box-shadow .15s}
    .box.on{border-width:3px;background:rgba(48,134,255,.16);box-shadow:0 0 0 4px rgba(48,134,255,.35)}
    .box.flash{animation:f 1s ease-in-out 2}
    @keyframes f{50%{box-shadow:0 0 0 8px rgba(48,134,255,.55)}}
    .num{position:absolute;left:-11px;top:-11px;min-width:20px;height:20px;padding:0 5px;box-sizing:border-box;border-radius:10px;border:2px solid #fff;
      background:#1e5fd8;color:#fff;font:700 11px/16px system-ui,sans-serif;text-align:center}
    @media (prefers-reduced-motion: reduce){.box,.box.flash{transition:none;animation:none}}
  `
  root.appendChild(style)
  document.documentElement.appendChild(host)

  const draw = () => {
    root.querySelectorAll('.box').forEach((n) => n.remove())
    for (const item of items) {
      for (const sel of item.selectors) {
        let el: Element | null = null
        try {
          el = document.querySelector(sel)
        } catch {
          el = null
        }
        if (!el) continue
        const b = el.getBoundingClientRect()
        if (!b.width && !b.height) continue
        const box = document.createElement('div')
        box.className = 'box'
        box.dataset.id = item.id
        box.dataset.sel = sel
        box.style.cssText = `left:${b.left + window.scrollX}px;top:${b.top + window.scrollY}px;width:${Math.max(6, b.width)}px;height:${Math.max(6, b.height)}px`
        const num = document.createElement('span')
        num.className = 'num'
        num.textContent = String(item.label)
        box.appendChild(num)
        root.appendChild(box)
      }
    }
  }
  draw()
  g.__a11yOverlayDraw = draw
  window.addEventListener('resize', draw)
  return true
}

/** 카드 hover/선택 → 그 이슈의 테두리 강조. scrollTo 가 있으면 그 요소로 스크롤 + 깜빡임 */
export function highlightInPage(issueId: string | null, scrollTo: string | null) {
  const root = document.getElementById('a11y-translator-overlay')?.shadowRoot
  if (!root) return false
  root.querySelectorAll<HTMLElement>('.box').forEach((b) => {
    b.classList.toggle('on', !!issueId && b.dataset.id === issueId)
    b.classList.remove('flash')
  })
  if (scrollTo) {
    let el: Element | null = null
    try {
      el = document.querySelector(scrollTo)
    } catch {
      el = null
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
    root.querySelectorAll<HTMLElement>('.box').forEach((b) => {
      if (b.dataset.sel === scrollTo) {
        void b.offsetWidth // 애니메이션을 처음부터 다시
        b.classList.add('flash')
      }
    })
  }
  return true
}

/** 오버레이 지우기 */
export function clearOverlayInPage() {
  const g = window as unknown as { __a11yOverlayDraw?: () => void }
  if (g.__a11yOverlayDraw) window.removeEventListener('resize', g.__a11yOverlayDraw)
  g.__a11yOverlayDraw = undefined
  document.getElementById('a11y-translator-overlay')?.remove()
  return true
}
