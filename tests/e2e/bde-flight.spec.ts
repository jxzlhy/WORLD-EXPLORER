import { expect, test } from '@playwright/test'
import { readAltKm, waitForAppReady } from './helpers'

async function openSearch(page: import('@playwright/test').Page): Promise<void> {
  await page.getByRole('button', { name: '搜索世界' }).click()
  const input = page.getByPlaceholder('搜索国家、城市、地点…(中英文均可)')
  await expect(input).toBeVisible()
  return void (await input.waitFor())
}

/**
 * 用例 B — 相机飞行:搜索长城 → 飞行 → 面板出现,坐标与内容正确。
 */
test('B. 搜索飞往万里长城', async ({ page }) => {
  await waitForAppReady(page)
  await openSearch(page)
  const input = page.getByPlaceholder('搜索国家、城市、地点…(中英文均可)')
  await input.fill('长城')
  await input.press('Enter')

  await expect(page.locator('.detail-panel .name')).toHaveText('万里长城')
  // 飞行抵达:海拔降至目的地层(<1000km)
  await expect
    .poll(() => readAltKm(page), { timeout: 30_000, intervals: [500] })
    .toBeLessThan(1_000)
  await expect(page.locator('.detail-panel .mono')).toContainText('40.43')
})

/**
 * 用例 D — 连续切换目标:旧目标不覆盖新目标,最终停留在最后一个。
 */
test('D. 连续选择两个目的地,停留在最后一个', async ({ page }) => {
  await waitForAppReady(page)

  await page.evaluate(() => {
    const app = (document.getElementById('app') as any).__vue_app__
    const explore = app.config.globalProperties.$pinia._s.get('explore')
    explore.selectDestination('cn-great-wall')
    explore.selectDestination('eg-giza-pyramids')
  })

  await expect(page.locator('.detail-panel .name')).toHaveText('吉萨金字塔群')
  // 相机最终位于吉萨(29.98N, 31.13E)附近,而非长城(40.43N, 116.57E)
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const v = (window as unknown as Record<string, any>).__WE_VIEWER__
          const c = v.camera.positionCartographic
          return {
            lat: +(c.latitude * 180) / Math.PI,
            lon: +(c.longitude * 180) / Math.PI,
            km: c.height / 1000,
          }
        }),
      { timeout: 30_000, intervals: [500] },
    )
    .toEqual(expect.objectContaining({ lat: expect.closeTo(29.98, 1.5) }))
})

/**
 * 用例 E — 面板滚动隔离:在档案面板内滚动,不得误触发地球缩放。
 */
test('E. 面板滚动不缩放地球', async ({ page }) => {
  await waitForAppReady(page)
  await openSearch(page)
  const input = page.getByPlaceholder('搜索国家、城市、地点…(中英文均可)')
  await input.fill('长城')
  await input.press('Enter')
  await expect(page.locator('.detail-panel .name')).toHaveText('万里长城')
  await expect
    .poll(() => readAltKm(page), { timeout: 30_000, intervals: [500] })
    .toBeLessThan(1_000)

  const altBefore = await readAltKm(page)
  const panel = page.locator('.detail-panel .scroll-area')
  await panel.hover()
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel(0, 400)
    await page.waitForTimeout(150)
  }
  await page.waitForTimeout(600)
  const altAfter = await readAltKm(page)
  expect(Math.abs(altAfter - altBefore)).toBeLessThan(1) // 1km 容差
})
