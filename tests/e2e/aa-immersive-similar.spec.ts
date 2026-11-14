import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 — 沉浸内连续浏览(V5.0 迭代十九):
 * 沉浸阅读底部「看过这处的人也看」→ 点击相似目的地 → 保持沉浸、内容切换、进度归零。
 */
test('沉浸内连续浏览:相似 chips → 点击切换保持沉浸', async ({ page }) => {
  await waitForAppReady(page)

  await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    explore.selectDestination('eg-giza-pyramids')
  })
  await expect(page.locator('.detail-panel .name')).toHaveText('吉萨金字塔群')
  await page.getByRole('button', { name: '⛶ 沉浸阅读' }).click()
  await expect(page.locator('.immersive')).toBeVisible()

  // 相似 chips 渲染(吉萨:同合集/同国 Top3)
  const chips = page.locator('.immersive .sim-chip')
  await expect(chips).toHaveCount(3)

  // 点击首条 → 保持沉浸,内容切换到新目的地,进度归零
  const target = await chips.first().locator('.n').textContent()
  await chips.first().click()
  await expect(page.locator('.immersive')).toBeVisible()
  await expect(page.locator('.immersive .name')).not.toHaveText('吉萨金字塔群')
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const pct = document.querySelector<HTMLElement>('.immersive .progress-pct')?.textContent
          return Number(pct?.replace('%', '') ?? -1)
        }),
      { timeout: 5_000, intervals: [300] },
    )
    .toBeLessThan(20)

  // 退出沉浸 → 档案面板即该目的地
  await page.keyboard.press('Escape')
  await expect(page.locator('.immersive')).toHaveCount(0)
  await expect(page.locator('.detail-panel .name')).toHaveText(target!)
})
