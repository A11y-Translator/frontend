// 검사할 주소 규칙 — mock / 실제 서버 모드 모두 이 규칙으로 먼저 거릅니다.
// (서버가 더 엄격한 규칙을 돌려주면 http.ts 가 그 오류 메시지를 그대로 보여줍니다)

export type UrlCheck = { ok: true; url: string; hostname: string } | { ok: false; message: string }

/**
 * 1) 앞뒤 공백 제거
 * 2) 주소 형식(scheme)이 없으면 https:// 를 붙임 (예: example.com → https://example.com)
 * 3) http / https 만 허용
 * 4) 도메인에 점(.)이 있거나 localhost 여야 함
 * 5) 끝의 / 와 #해시는 지워서 같은 주소를 같은 값으로 만듦
 */
export function normalizeUrl(input: string): UrlCheck {
  const raw = input.trim()
  if (!raw) return { ok: false, message: '검사할 페이지 주소를 입력해 주세요.' }

  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`
  let u: URL
  try {
    u = new URL(withScheme)
  } catch {
    return { ok: false, message: '주소 형식이 올바르지 않아요. 예: https://example.com' }
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, message: 'http 또는 https 로 시작하는 주소만 검사할 수 있어요.' }
  }
  if (!u.hostname.includes('.') && u.hostname !== 'localhost') {
    return { ok: false, message: '도메인을 확인해 주세요. 예: example.com' }
  }
  u.hash = ''
  const url = u.toString().replace(/\/$/, '')
  return { ok: true, url, hostname: u.hostname }
}

/**
 * 여러 페이지 검사: 한 줄에 하나씩 넣은 추가 페이지를 첫 주소 기준으로 정리합니다.
 *  - "/pricing", "pricing" → 첫 주소의 사이트 안 경로
 *  - "example.com/pricing", "https://…" → 그대로 (같은 사이트여야 함)
 *  - 빈 줄·중복·첫 주소와 같은 주소는 빼요
 */
export function parseExtraPages(text: string, mainUrl: string, max: number): { ok: true; urls: string[] } | { ok: false; message: string } {
  const main = new URL(mainUrl)
  const seen = new Set([main.origin + (main.pathname.replace(/\/$/, '') || '/') + main.search])
  const urls: string[] = []
  for (const line of text.split('\n').map((l) => l.trim()).filter(Boolean)) {
    // 점이 들어간 도메인으로 시작하면 전체 주소, 아니면 경로로 봅니다
    const looksAbsolute = /^[a-z][a-z\d+.-]*:\/\//i.test(line) || /^[^/\s]+\.[^/\s]+(\/|$)/.test(line)
    let u: URL
    if (looksAbsolute) {
      const checked = normalizeUrl(line)
      if (!checked.ok) return { ok: false, message: `"${line}" — ${checked.message}` }
      u = new URL(checked.url)
    } else {
      try {
        u = new URL(line.startsWith('/') ? line : `/${line}`, main.origin)
      } catch {
        return { ok: false, message: `"${line}" — 주소 형식이 올바르지 않아요.` }
      }
    }
    if (u.origin !== main.origin) return { ok: false, message: `"${line}" — 첫 주소(${main.host})와 같은 사이트의 페이지만 함께 검사할 수 있어요.` }
    u.hash = ''
    const key = u.origin + (u.pathname.replace(/\/$/, '') || '/') + u.search
    if (seen.has(key)) continue
    seen.add(key)
    urls.push(u.toString().replace(/\/$/, ''))
  }
  if (urls.length > max) return { ok: false, message: `함께 검사할 페이지는 ${max}개까지 넣을 수 있어요. (지금 ${urls.length}개)` }
  return { ok: true, urls }
}

/** 이름을 비워 두거나 기본값 그대로 두면 도메인을 프로젝트 이름으로 씁니다 */
export function projectNameFor(name: string, hostname: string, defaultName: string) {
  const n = name.trim()
  return !n || n === defaultName ? hostname.replace(/^www\./, '') : n
}
