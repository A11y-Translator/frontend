// API 모드: .env 의 VITE_API_URL 이 비어 있으면 목업(mock), 있으면 그 서버(http)로 붙습니다.
// 앱이 시작할 때 한 번만 정해져요.

/** 백엔드 주소 (끝의 / 는 뺌). 예: http://localhost:8080/api */
export const API_URL = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')

/** true = 목업 모드 (서버 없이 localStorage 로만 동작) */
export const isMock = API_URL === ''

export const API_MODE: 'mock' | 'http' = isMock ? 'mock' : 'http'
