import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 K — 昼夜模式切换真实生效(回归:曾因 setMode 仅存储不重应用,切换无任何变化)。
 * 断言底层影像 provider 随模式切换:永夜=Black Marble 本地贴图,永昼=Blue Marble,实时=逐像素合成(blob)。
 */
test('K. 昼夜模式:永夜/永昼/实时 三档影像层真实切换', async ({ page }) => {
  await waitForAppReady(page)

  const baseProviderUrl = () =>
    page.evaluate(() => {
      const v = (window as unknown as Record<string, any>).__WE_VIEWER__
      const layer = v?.imageryLayers?.get(0)
      return layer?.imageryProvider?.url ?? 'none'
    })

  // 启动默认实时:合成结果为 blob URL
  await expect.poll(baseProviderUrl, { timeout: 20_000, intervals: [500] }).toMatch(/^blob:/)

  // 永夜 → 本地 Black Marble 贴图
  await page.getByRole('button', { name: '永夜' }).click()
  await expect.poll(baseProviderUrl, { timeout: 20_000, intervals: [500] }).toContain('earth-night')

  // 永昼 → 本地 Blue Marble 贴图
  await page.getByRole('button', { name: '永昼' }).click()
  await expect
    .poll(baseProviderUrl, { timeout: 20_000, intervals: [500] })
    .toContain('earth-blue-marble')

  // 实时 → 重新合成为 blob URL
  await page.getByRole('button', { name: '实时' }).click()
  await expect.poll(baseProviderUrl, { timeout: 20_000, intervals: [500] }).toMatch(/^blob:/)
})
