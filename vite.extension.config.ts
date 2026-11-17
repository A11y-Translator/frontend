// 설치형 크롬 확장 빌드 → dist-extension/ (chrome://extensions → 개발자 모드 → "압축해제된 확장 프로그램 로드")
//   npm run build:ext          배포용 (권한: activeTab · scripting · sidePanel · storage, 사이트는 사용자가 허용할 때만)
//   EXT_TEST=1 npm run build:ext  자동 테스트용 (localhost 에 미리 접근 권한 — 테스트 브라우저는 허용 창을 누를 수 없어서)
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const src = (p: string) => fileURLToPath(new URL(p, import.meta.url))
const pkg = JSON.parse(readFileSync(src('./package.json'), 'utf8')) as { version: string }
const TEST = process.env.EXT_TEST === '1'

/** manifest.json · axe-core · 아이콘을 빌드 결과에 넣어요 */
function extensionFiles(): Plugin {
  return {
    name: 'a11y-extension-files',
    generateBundle() {
      const icon = readFileSync(src('./src/extension/assets/logo-11.png'))
      const sizes = [16, 32, 48, 128]
      for (const s of sizes) this.emitFile({ type: 'asset', fileName: `icons/icon-${s}.png`, source: icon })
      const icons = Object.fromEntries(sizes.map((s) => [String(s), `icons/icon-${s}.png`]))
      const manifest = {
        manifest_version: 3,
        name: 'A11y Translator',
        // 크롬 버전 형식(숫자.숫자.숫자)이라 0.0.0 이면 0.1.0 으로
        version: pkg.version === '0.0.0' ? '0.1.0' : pkg.version,
        description: '지금 보고 있는 페이지의 웹 접근성(WCAG 2.2 AA)을 검사하고, 문제 위치를 페이지 위에 표시해요.',
        minimum_chrome_version: '116',
        icons,
        action: { default_title: 'A11y · 접근성 검사', default_icon: icons, default_popup: 'popup.html' },
        side_panel: { default_path: 'sidepanel.html' },
        background: { service_worker: 'background.js', type: 'module' },
        // 최소 권한: 아이콘을 누른 탭만 잠깐(activeTab) · 검사 스크립트 넣기 · 사이드 패널 · 결과 임시 저장
        permissions: ['activeTab', 'scripting', 'sidePanel', 'storage'],
        // 다른 사이트는 사용자가 사이드 패널에서 "검사 허용"을 눌렀을 때만 그 사이트에 한해 요청
        optional_host_permissions: ['http://*/*', 'https://*/*'],
        ...(TEST ? { host_permissions: ['http://localhost/*'] } : {}),
      }
      this.emitFile({ type: 'asset', fileName: 'manifest.json', source: JSON.stringify(manifest, null, 2) })
      // 검사 도구를 확장 안에 같이 넣어요 (크롬 확장은 바깥에서 코드를 받아 실행할 수 없음)
      this.emitFile({ type: 'asset', fileName: 'axe.min.js', source: readFileSync(src('./node_modules/axe-core/axe.min.js'), 'utf8') })
    },
  }
}

export default defineConfig({
  root: src('./src/extension/real'),
  base: './',
  publicDir: false,
  plugins: [react(), tailwindcss(), extensionFiles()],
  resolve: { alias: { '@': src('./src') } },
  build: {
    outDir: src('./dist-extension'),
    emptyOutDir: true,
    // 확장은 로컬 파일이라 나눠 받을 이유가 없고, 확장 페이지 규칙(CSP)상 인라인 스크립트도 쓰지 않아요
    modulePreload: false,
    rollupOptions: {
      input: {
        popup: src('./src/extension/real/popup.html'),
        sidepanel: src('./src/extension/real/sidepanel.html'),
        background: src('./src/extension/real/background.ts'),
      },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
})
