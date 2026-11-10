import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 S — 相似目的地(V5.0 雏形):
 * 吉萨面板 → 「看过这处的人也看」Top3(首条 reason 为同合集信号)→ 点击切换面板。
 */
test('S. 相似目的地:渲染 Top3 + 点击切换', async ({ page }) => {
  await waitForAppReady(page)

  await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    explore.selectDestination('eg-giza-pyramids')
  })
  await expect(page.locator('.detail-panel .name')).toHaveText('吉萨金字塔群')

  // 相似区块:3 行,首条 reason 为同合集信号(吉萨同属「古文明的回声」)
  const block = page.locator('.detail-panel .similar')
  await expect(block).toBeVisible()
  await expect(block.locator('.we-caps-label')).toHaveText('看过这处的人也看')
  const items = block.locator('.dest-item')
  await expect(items).toHaveCount(3)
  await expect(items.first().locator('.t')).toContainText('同属合集')
  // 不含自身
  await expect(block).not.toContainText('吉萨金字塔群')

  // 点击首条 → 面板切换为该目的地
  const target = await items.first().locator('.n').textContent()
  await items.first().click()
  await expect(page.locator('.detail-panel .name')).toHaveText(target!)
})
