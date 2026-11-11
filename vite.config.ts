import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { inspectProxy } from './dev/inspectProxy'

// https://vite.dev/config/
export default defineConfig({
  // inspectProxy: 개발 서버에서 실제 URL 을 검사하기 위한 프록시 (dev/inspectProxy.ts)
  plugins: [react(), tailwindcss(), inspectProxy()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
