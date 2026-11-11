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

/** 이름을 비워 두거나 기본값 그대로 두면 도메인을 프로젝트 이름으로 씁니다 */
export function projectNameFor(name: string, hostname: string, defaultName: string) {
  const n = name.trim()
  return !n || n === defaultName ? hostname.replace(/^www\./, '') : n
}
