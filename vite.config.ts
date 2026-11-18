import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { inspectProxy } from './dev/inspectProxy'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // inspectProxy: 개발 서버에서 실제 URL 을 검사하기 위한 프록시 (dev/inspectProxy.ts)
  plugins: [react(), tailwindcss(), inspectProxy()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // http 모드: 브라우저는 같은 주소의 /api 로 부르고, 개발 서버가 백엔드로 넘겨줍니다 (백엔드에 CORS 설정이 필요 없음)
    proxy: {
      '/api': { target: loadEnv(mode, process.cwd(), '').BACKEND_ORIGIN || 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
}))
