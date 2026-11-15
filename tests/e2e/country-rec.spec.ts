import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 — 国家粒度推荐(迭代二十二):
 * 播种埃及足迹 → MyWorld「下一站国度」区块 → 首条 reason 含埃及动量 → 点击进国家面板。
 */
test('下一站国度:播种足迹 → 渲染 → 点击进国家面板', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'world-explorer:v1:explored',
      JSON.stringify(['eg-giza-pyramids', 'eg-saqqara', 'eg-abu-simbel']),
    )
  })
  await waitForAppReady(page)

  await page.getByRole('button', { name: 'MY WORLD' }).click()
  await expect(page.locator('.my-world')).toBeVisible()

  // 「下一站国度」区块:埃及动量最强居首
  const block = page.locator('.my-world .country-rec')
  await expect(block).toBeVisible()
  await expect(block.locator('.rec-item').first()).toContainText('埃及')
  await expect(block.locator('.rec-item').first().locator('.why')).toContainText('已探索过 3 处')

  // 点击 → 国家面板打开,MyWorld 关闭
  await block.locator('.rec-item').first().click()
  await expect(page.locator('.my-world')).toHaveCount(0)
  await expect(page.locator('.detail-panel .name')).toHaveText('埃及')
})
