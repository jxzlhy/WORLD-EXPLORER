import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 — 生成我的巡游(V5.0 数据地球 · 步骤 1):
 * 播种埃及足迹 → MyWorld 推荐 Top3 → 「✈ 生成我的巡游」→ 合成巡游启动
 * (TourHud 显示航线名/第 1/3 站,面板切至推荐首站)→ 结束巡游。
 */
test('生成我的巡游:推荐 → 一键生成 → 合成巡游运行', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'world-explorer:v1:explored',
      JSON.stringify(['eg-giza-pyramids', 'eg-saqqara', 'eg-abu-simbel']),
    )
  })
  await waitForAppReady(page)

  await page.getByRole('button', { name: 'MY WORLD' }).click()
  await expect(page.locator('.my-world')).toBeVisible()

  // 推荐区块(Top3)→ 生成按钮出现(≥2 条)
  const rec = page.locator('.my-world .recommend').first()
  await expect(rec.locator('.rec-item')).toHaveCount(3)
  const genBtn = rec.getByRole('button', { name: '✈ 生成我的巡游' })
  await expect(genBtn).toBeVisible()

  // 一键生成 → MyWorld 关闭,合成巡游启动:HUD 显示航线名与第 1/3 站
  await genBtn.click()
  await expect(page.locator('.my-world')).toHaveCount(0)
  await expect(page.locator('.tour-hud')).toBeVisible()
  await expect(page.locator('.tour-hud .we-caps-label')).toContainText('我的巡游')
  await expect(page.locator('.tour-hud .counter')).toHaveText('第 1 / 3 站')

  // 面板切至推荐首站(EG 剩余的 S 级目的地)
  await expect(page.locator('.detail-panel .name')).not.toHaveText('古文明的回声')

  // 结束巡游
  await page.getByRole('button', { name: '结束巡游' }).click()
  await expect(page.locator('.tour-hud')).toHaveCount(0)
})
