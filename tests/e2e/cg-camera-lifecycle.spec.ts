import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 C — 飞行中断:飞行中用户滚轮,飞被打断,控制权回到用户。
 */
test('C. 用户滚轮中断飞行', async ({ page }) => {
  await waitForAppReady(page)

  // 启动一次长飞行(北京 → 悉尼,10s),拿到 Promise 观测结果
  const flight = page.evaluate(() => {
    const eng = (window as unknown as Record<string, any>).__WE_ENGINE__
    return eng.flyTo({ longitude: 151.2, latitude: -33.86, height: 2_000_000, duration: 10 })
  })

  await page.waitForTimeout(1_500) // 让飞行进行一会儿
  expect(await page.evaluate(() => (window as any).__WE_ENGINE__.isFlying())).toBe(true)

  // 用户在地球上滚动滚轮
  await page.mouse.move(640, 450)
  await page.mouse.wheel(0, -240)
  await page.waitForTimeout(500)

  const result = await Promise.race([
    flight,
    page.waitForTimeout(3_000).then(() => 'STILL_FLYING'),
  ])
  expect(result).toBe('interrupted')
  expect(await page.evaluate(() => (window as any).__WE_ENGINE__.isFlying())).toBe(false)
})

/**
 * 用例 G — 生命周期:反复进入/刷新,不出现重复 Viewer 或错误遮罩。
 */
test('G. 重复加载不产生重复 Viewer', async ({ page }) => {
  for (let round = 0; round < 2; round++) {
    await waitForAppReady(page)
    expect(await page.locator('canvas').count()).toBe(1)
    expect(await page.locator('.error-veil').count()).toBe(0)
    // 引擎生命周确处于 ready
    expect(
      await page.evaluate(() => {
        const v = (window as unknown as Record<string, any>).__WE_VIEWER__
        return v && !v.isDestroyed()
      }),
    ).toBeTruthy()
    if (round === 0) await page.reload()
  }
})
