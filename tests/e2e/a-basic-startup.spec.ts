import { expect, test } from '@playwright/test'
import { expectNoErrorVeil, waitForAppReady } from './helpers'

/**
 * 用例 A — 基础启动(PART 10.2)
 * 数据加载、地球初始化、核心 UI 出现、无严重错误。
 */
test.describe('A. 基础启动', () => {
  test('首页完成初始化并渲染核心 UI', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => consoleErrors.push(String(err)))

    await waitForAppReady(page)

    await expect(page.locator('canvas')).toHaveCount(1)
    await expect(page.locator('.topbar')).toBeVisible()
    await expect(page.locator('.left-rail')).toBeVisible()
    await expect(page.locator('.discover-bar')).toBeVisible()
    await expect(page.locator('.status-bar')).toContainText('67 DESTINATIONS')
    await expectNoErrorVeil(page)

    // 过滤掉外部资源类噪声(GIBS 离线等),不允许应用自身的严重错误
    const appErrors = consoleErrors.filter(
      (t) => !/gibs\.earthdata|net::|Failed to load resource/i.test(t),
    )
    expect(appErrors, `控制台严重错误: ${appErrors.join('\n')}`).toHaveLength(0)
  })
})
