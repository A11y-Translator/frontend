// 브라우저 저장소(localStorage) 읽기 · 쓰기. 목업 모드의 "서버" 역할을 합니다.

export function readJSON(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? null : (JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 저장소를 못 쓰면 이번 방문 동안만 기억 */
  }
}

export function removeKey(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* 저장소를 못 쓰면 그대로 둠 */
  }
}
