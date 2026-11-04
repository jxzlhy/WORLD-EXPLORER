import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

/** 浏览器 + Node 运行时全局量(零依赖声明) */
const RUNTIME_GLOBALS = {
  console: 'readonly',
  document: 'readonly',
  window: 'readonly',
  navigator: 'readonly',
  location: 'readonly',
  history: 'readonly',
  localStorage: 'readonly',
  performance: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  matchMedia: 'readonly',
  fetch: 'readonly',
  Image: 'readonly',
  Blob: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  Event: 'readonly',
  KeyboardEvent: 'readonly',
  MouseEvent: 'readonly',
  HTMLElement: 'readonly',
  HTMLInputElement: 'readonly',
  HTMLDivElement: 'readonly',
  HTMLCanvasElement: 'readonly',
  HTMLImageElement: 'readonly',
  CanvasRenderingContext2D: 'readonly',
  File: 'readonly',
  FileReader: 'readonly',
  alert: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  process: 'readonly',
  Buffer: 'readonly',
}

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'downloads/', 'test-results/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  {
    languageOptions: {
      globals: RUNTIME_GLOBALS,
    },
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { varsIgnorePattern: '^_', argsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
  {
    // 测试代码与调试钩子交互,允许 any(业务源码仍严格禁止)
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
)
