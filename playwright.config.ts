import { defineConfig } from '@playwright/test'

/**
 * WORLD EXPLORER E2E 测试配置
 * 独立端口 5199,避免与开发中服务器(5188)冲突。
 * dev 模式下应用暴露 __WE_VIEWER__ / __WE_ENGINE__ 调试钩子,供用例直接观测引擎状态。
 */
export default defineConfig({
  testDir: 'tests/e2e',
  // SwiftShader 软渲染下单用例可达 50s(如内存用例),整页链路在负载下更长
  timeout: 180_000,
  // 负载类偶发(隔离复跑必绿)给一次重试;断言失败重跑同样失败,不掩盖问题
  retries: 1,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  // 关键:多 worker 会让多个 SwiftShader WebGL 页面并发争抢 CPU,负载型超时轮转失败——必须串行
  workers: 1,
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
