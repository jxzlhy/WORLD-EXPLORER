import { defineConfig } from '@playwright/test'

/**
 * WORLD EXPLORER E2E 测试配置
 * 独立端口 5199,避免与开发中服务器(5188)冲突。
 * dev 模式下应用暴露 __WE_VIEWER__ / __WE_ENGINE__ 调试钩子,供用例直接观测引擎状态。
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5199',
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'pnpm dev --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
})
