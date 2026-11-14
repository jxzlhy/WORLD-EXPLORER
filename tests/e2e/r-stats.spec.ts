import { expect, test } from '@playwright/test'

/**
 * 用例 R — 数据覆盖统计面板(V5.0 数据质量监控雏形):
 * /stats 渲染摘要卡(150 目的地 / 29 张已核验照片)+ 按国矩阵 10 行 + 合集表 4 行 → 返回探索。
 */
test('R. 数据覆盖统计:/stats 渲染矩阵并返回', async ({ page }) => {
  await page.goto('/stats')

  // 摘要卡:总数与照片数来自真实数据(150 目的地 / 150 张已核验 = 100% 覆盖)
  await expect(page.locator('.stats-page .head h1')).toHaveText('数据覆盖统计')
  const cards = page.locator('.stats-page .card')
  await expect(cards).toHaveCount(5)
  await expect(cards.first()).toContainText('150')
  await expect(cards.nth(1)).toContainText('150')
  await expect(cards.nth(1)).toContainText('100%')

  // 按国矩阵 10 行(当前 10 国)
  await expect(page.locator('.stats-page .matrix').first().locator('tbody tr')).toHaveCount(10)
  // 合集表 4 行
  await expect(page.locator('.stats-page .matrix').nth(1).locator('tbody tr')).toHaveCount(4)

  // 返回探索 → 主体验就绪(状态栏出现 DESTINATIONS 计数)
  await page.locator('.stats-page .back').click()
  await expect(page).toHaveURL(/\/$/)
  await page.waitForFunction(
    () => /\d+ DESTINATIONS/.test(document.querySelector('.status-bar')?.textContent ?? ''),
    { timeout: 45_000 },
  )
})
