/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** live(개발 서버 기본) · http(백엔드) · mock(임시 규칙) */
  readonly VITE_API_MODE?: string
  /** 실제 서버 주소 (예: https://api.example.com). 기본값 /api */
  readonly VITE_API_BASE_URL?: string
}
