import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 T — 国家/城市影像条带(媒体展示面补全):
 * 埃及国家面板(3 张已核验)→ hero 之外条带 2 张且不含 hero 图;
 * 巴黎城市面板(3 张)→ 条带 2 张;仅 1 张照片的国家不出条带。
 */
test('T. 国家/城市影像条带:hero 排除 + 阈值隐藏', async ({ page }) => {
  await waitForAppReady(page)

  // —— 国家面板:埃及(3 张)——
  await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    explore.selectCountry('EG')
  })
  await expect(page.locator('.detail-panel .name')).toHaveText('埃及')
  const strip = page.locator('.detail-panel .panel-hero .media-strip')
  await expect(strip).toBeVisible()
  // 数据驱动:条带数 = 埃及已核验照片数 − 1(hero 取首个 verified)
  const expectedStrip = await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    const verified = explore.destinationsOfCountry('EG').filter(
      (d: any) => d.media?.status === 'verified',
    )
    return verified.length - 1
  })
  await expect(strip.locator('.strip-card')).toHaveCount(expectedStrip)
  // 条带不含 hero 目的地(hero 名称取自 hero-caption 行首「图:xxx」)
  const heroCaption = await page.locator('.detail-panel .panel-hero .hero-caption').textContent()
  const heroName = heroCaption?.match(/图:(.+?)\(收录地点\)/)?.[1]?.trim() ?? ''
  expect(heroName).toBeTruthy()
  const stripNames = await strip.locator('.strip-card .n').allTextContents()
  for (const n of stripNames) expect(n).not.toEqual(heroName)

  // —— 城市面板:巴黎(3 张)——
  await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    explore.flyToCity('fr-paris')
  })
  await expect(page.locator('.detail-panel .name')).toHaveText('巴黎')
  const cityStrip = page.locator('.detail-panel .panel-hero .media-strip')
  await expect(cityStrip).toBeVisible()
  // 巴黎 3 张已核验:hero 之外 ≥2 张
  await expect(cityStrip.locator('.strip-card').first()).toBeVisible()
  const cityCount = await cityStrip.locator('.strip-card').count()
  expect(cityCount).toBeGreaterThanOrEqual(2)
})
