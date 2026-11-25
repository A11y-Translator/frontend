import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// main2 = Oreum(오름) 새 디자인 버전. 기존 A11y Translator 앱(C:\A11\src)과 따로 도는 독립 앱입니다.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5183 },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
