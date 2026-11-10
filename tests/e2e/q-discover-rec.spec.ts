import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 Q — DiscoverBar 为你推荐(V5.0 迭代七):
 * 播种足迹 → 推荐芯片出现 → ↻ 轮换 → 点击直达目的地面板。
 */
test('Q. DiscoverBar 推荐:播种足迹 → 芯片渲染 → ↻ 轮换 → 点击直达', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'world-explorer:v1:explored',
      JSON.stringify(['eg-giza-pyramids', 'eg-saqqara', 'cn-great-wall', 'cn-mogao-caves']),
    )
  })
  await waitForAppReady(page)

  // 推荐芯片出现,reason 为同国信号(EG/CN 各 2 处并列,具体国名取决于数据序)
  const chip = page.locator('.discover-bar .rec-chip')
  await expect(chip).toBeVisible()
  await expect(chip.locator('.we-caps-label')).toHaveText('为你推荐')
  await expect(chip.locator('.why')).toContainText('同在')

  // ↻ 轮换:推荐对象变化(足迹足够,Top5 内至少两类信号)
  const firstName = await chip.locator('.name').textContent()
  await chip.locator('.swap').click()
  const secondName = await chip.locator('.name').textContent()
  expect(secondName).toBeTruthy()
  expect(secondName).not.toEqual(firstName)

  // 点击芯片 → 直达目的地面板
  await chip.click()
  await expect(page.locator('.detail-panel .name')).toHaveText(secondName!)
})
