import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 — 探索密度 choropleth(V1.5 步骤 2):
 * 播种埃及足迹 → 开启「数据填色」→ 埃及 polygon 填充变为金色调 → 关闭 → 恢复基底蓝。
 */
const egFillCss = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const v = (window as unknown as Record<string, any>).__WE_VIEWER__
    if (!v) return null
    const ds = v.dataSources
    for (let i = 0; i < ds.length; i++) {
      const d = ds.get(i)
      if (d.name !== 'countries') continue
      for (const entity of d.entities.values) {
        const iso = entity.properties?.getValue(undefined)?.['ISO_A2_EH']
        if (iso === 'EG' && entity.polygon?.material?.color) {
          const c = entity.polygon.material.color.getValue(undefined)
          return `${c.red.toFixed(2)},${c.green.toFixed(2)},${c.blue.toFixed(2)},${c.alpha.toFixed(2)}`
        }
      }
    }
    return null
  })

test('数据填色:开启 → 埃及金色调;关闭 → 恢复基底', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'world-explorer:v1:explored',
      JSON.stringify(['eg-giza-pyramids', 'eg-saqqara', 'eg-abu-simbel']),
    )
  })
  await waitForAppReady(page)

  const colorSwitch = page.getByRole('switch', { name: '数据填色' })
  await expect(colorSwitch).toBeVisible()

  // 基底:蓝色系(61,110,168 @ 0.05)
  expect(await egFillCss(page)).toMatch(/^0\.24,0\.43/)

  // 开启数据填色 → 埃及变为金色调(232,200,150)
  await colorSwitch.click()
  await expect
    .poll(() => egFillCss(page), { timeout: 10_000, intervals: [300] })
    .toMatch(/^0\.91,0\.78/)

  // 关闭 → 恢复基底
  await colorSwitch.click()
  await expect
    .poll(() => egFillCss(page), { timeout: 10_000, intervals: [300] })
    .toMatch(/^0\.24,0\.43/)
})
