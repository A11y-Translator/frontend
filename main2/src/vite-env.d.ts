/// <reference types="vite/client" />

// .env 에 적는 값 (예시는 main2/.env.example)
interface ImportMetaEnv {
  /** 백엔드 주소. 비워 두면 목업 모드(브라우저 localStorage 만 사용) */
  readonly VITE_API_URL?: string
  /** 접근성 검사 앱(main1) 주소. 기본 http://localhost:5173 */
  readonly VITE_A11Y_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
