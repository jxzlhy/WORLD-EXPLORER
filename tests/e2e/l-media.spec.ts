import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 L — 照片展示面(媒体丰富度):
 * 国家面板 hero(埃及,3 张已核验照片之一)、合集「收录影像」条带、列表行缩略图。
 */
test('L. 国家 hero / 合集影像条带 / 列表缩略图', async ({ page }) => {
  await waitForAppReady(page)

  // 国家面板:埃及有 3 张已核验照片 → hero 为真实照片
  await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    explore.selectCountry('EG')
  })
  await expect(page.locator('.detail-panel .name')).toHaveText('埃及')
  // hero 的 DestinationMedia(限定 .dest-media,避免与迭代十一新增的影像条带 img 混淆)
  await expect(page.locator('.detail-panel .panel-hero .dest-media img')).toBeVisible()
  await expect(page.locator('.detail-panel .panel-hero .dest-media .credit')).toContainText('©')

  // 列表行缩略图:埃及目的地列表中应有已核验照片的圆形 thumb
  await expect(page.locator('.detail-panel .dest-item .thumb').first()).toBeVisible()

  // 合集面板:「古文明的回声」含多张已核验照片 → 收录影像条带可见
  await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    explore.openCollection('ancient-echoes')
  })
  await expect(page.locator('.detail-panel .name')).toHaveText('古文明的回声')
  const stripCount = await page.locator('.media-strip .strip-card').count()
  expect(stripCount).toBeGreaterThanOrEqual(5)

  // 条带点击直达目的地档案(条带按收录顺序,首张即吉萨金字塔群)
  await page.locator('.media-strip .strip-card').first().click()
  await expect(page.locator('.detail-panel .name')).toHaveText('吉萨金字塔群')
})
