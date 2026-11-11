// 개발 서버의 검사 서버(dev/inspectProxy.ts)에 실제 페이지 검사를 맡깁니다.
// 개발 서버가 크롬을 화면 없이 띄워 페이지를 열고 axe-core 로 검사한 뒤, 결과와 화면 캡처를 돌려줘요.
const CONFIG_URL = '/__inspect/config'
const NOT_DEV = '실제 페이지 검사는 개발 서버(npm run dev)에서만 할 수 있어요. 백엔드가 연결되면 서버가 검사해요.'

let devCheck: Promise<void> | null = null

/** 개발 서버(검사 서버가 있는 곳)인지 확인. 아니면 오류 */
export function ensureDevProxy(): Promise<void> {
  devCheck ??= fetch(CONFIG_URL)
    .then((r) => (r.ok ? undefined : Promise.reject(new Error())))
    .catch(() => {
      devCheck = null
      throw new Error(NOT_DEV)
    })
  return devCheck
}

export interface AxeNode {
  target: unknown[]
  html: string
  failureSummary: string
  rect: { x: number; y: number; w: number; h: number } | null
}
export interface AxeViolation {
  id: string
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null
  help: string
  description: string
  helpUrl: string
  tags: string[]
  nodes: AxeNode[]
  nodeCount: number
}
export interface ScanResult {
  /** 리다이렉트까지 반영한 최종 주소 */
  url: string
  title: string
  passes: number
  incomplete: number
  /** 보이는 글자 수 · 요소 수 — 페이지가 제대로 그려졌는지 판단 */
  textLength: number
  elementCount: number
  /** 검사한 화면 크기 */
  viewport?: { w: number; h: number }
  /** 검사 화면 캡처 (1440×1093 jpg) */
  screenshotUrl?: string
  violations: AxeViolation[]
}

/** 개발 서버에 실제 페이지 검사를 요청합니다 (보통 5~15초) */
export async function scanPage(url: string): Promise<ScanResult> {
  await ensureDevProxy()
  let r: Response
  try {
    r = await fetch(`/__inspect/scan?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(60_000) })
  } catch {
    throw new Error('페이지 검사가 60초 안에 끝나지 않았어요. 잠시 후 다시 시도해 주세요.')
  }
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.error || '검사하지 못했어요.')
  return data as ScanResult
}
