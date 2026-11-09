import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, jsxA11y.flatConfigs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // 웹과 확장은 서로 import 하지 않는다 (확장은 나중에 extension/ + shared/ 만 떼어 감)
  {
    files: ['src/web/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: ['@/extension/*', '**/extension/*'], message: 'web → extension import 금지. 공통 코드는 shared/ 로.' }] }],
    },
  },
  {
    files: ['src/extension/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: ['@/web/*', '**/web/*'], message: 'extension → web import 금지. 공통 코드는 shared/ 로.' }] }],
    },
  },
)
