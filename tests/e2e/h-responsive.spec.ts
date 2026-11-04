import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 H — 响应式:桌面/平板/手机关键视口无横向溢出,关键操作可用。
 * 截图存档供视觉走查(test-results/)。
 */
const VIEWPORTS = [
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
]

for (const vp of VIEWPORTS) {
  test(`H. ${vp.name} 无横向溢出`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await waitForAppReady(page)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, `横向溢出 ${overflow}px`).toBeLessThanOrEqual(0)

    // 关键控件在视口内且可点
    const search = page.getByRole('button', { name: '搜索世界' })
    await expect(search).toBeVisible()
    const box = await search.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width)

    await page.screenshot({ path: `test-results/responsive/${vp.name}.png` })
  })
}
