import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 — 城市粒度推荐(迭代二十三):
 * 播种京都足迹(2/3)→ MyWorld「延伸的城」→ 京都居首(还有 1 处)→ 点击 flyToCity。
 */
test('延伸的城:播种京都足迹 → 京都居首 → 点击进城市面板', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'world-explorer:v1:explored',
      JSON.stringify(['jp-kinkaku-ji', 'jp-fushimi-inari']),
    )
  })
  await waitForAppReady(page)

  await page.getByRole('button', { name: 'MY WORLD' }).click()
  await expect(page.locator('.my-world')).toBeVisible()

  const block = page.locator('.my-world .city-rec')
  await expect(block).toBeVisible()
  await expect(block.locator('.rec-item').first()).toContainText('京都')
  await expect(block.locator('.rec-item').first().locator('.why')).toContainText('还有 2 处')

  // 点击 → flyToCity:城市面板打开,MyWorld 关闭
  await block.locator('.rec-item').first().click()
  await expect(page.locator('.my-world')).toHaveCount(0)
  await expect(page.locator('.detail-panel .name')).toHaveText('京都')
})
