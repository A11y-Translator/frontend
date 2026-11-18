/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** live(개발 서버 기본) · http(백엔드) · mock(임시 규칙) */
  readonly VITE_API_MODE?: string
  /** 실제 서버 주소 (예: https://api.example.com). 기본값 /api — 개발 서버가 백엔드로 넘겨줌 (vite.config.ts) */
  readonly VITE_API_BASE_URL?: string
  /** http 모드에서 쓰는 개발 계정 (Google 로그인이 붙기 전까지). 없는 계정이면 처음에 자동으로 가입 */
  readonly VITE_DEV_EMAIL?: string
  readonly VITE_DEV_PASSWORD?: string
  readonly VITE_DEV_NAME?: string
}
