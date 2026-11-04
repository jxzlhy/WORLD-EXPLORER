import { expect, type Page } from '@playwright/test'

/**
 * 等待应用完成初始化(引擎 ready:状态栏出现真实 FPS 与 DESTINATIONS 计数)。
 * dev 模式下应用暴露 __WE_VIEWER__ / __WE_ENGINE__ 调试钩子。
 */
export async function waitForAppReady(page: Page): Promise<void> {
  await page.goto('/')
  await page.waitForFunction(
    () => {
      const t = document.querySelector('.status-bar')?.textContent ?? ''
      return /\d+ DESTINATIONS/.test(t) && /\d+ FPS/.test(t)
    },
    { timeout: 45_000 },
  )
}

/** 从引擎直接读取相机海拔(km) */
export async function readAltKm(page: Page): Promise<number> {
  return page.evaluate(() => {
    const v = (window as unknown as Record<string, any>).__WE_VIEWER__
    if (!v) return Number.NaN
    return v.camera.positionCartographic.height / 1000
  })
}

export async function expectNoErrorVeil(page: Page): Promise<void> {
  await expect(page.locator('.error-veil')).toHaveCount(0)
}
