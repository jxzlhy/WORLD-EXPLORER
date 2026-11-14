import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 Y — 沉浸阅读章节跳转(迭代十七):
 * ①真实内容(~1.3 屏)→ markers 退化隐藏;②注入 5000px 长内容 → markers 出现
 * → 点「跳转到导语」回到顶部 → 当前章高亮。
 */
test('Y. 章节跳转:短内容隐藏 → 长内容出现并跳转', async ({ page }) => {
  await waitForAppReady(page)

  await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    explore.selectDestination('gb-tower-of-london')
  })
  await expect(page.locator('.detail-panel .name')).toHaveText('伦敦塔')
  await page.getByRole('button', { name: '⛶ 沉浸阅读' }).click()
  await expect(page.locator('.immersive')).toBeVisible()

  // 真实内容 ~1.3 屏:锚点无区分度 → markers 隐藏
  await expect(page.locator('.immersive .marker')).toHaveCount(0)

  // 注入 5000px 长内容(模拟未来深度档案)→ 滚动触发重测 → markers 出现
  await page.evaluate(() => {
    const spacer = document.createElement('div')
    spacer.style.height = '5000px'
    const sources = document.querySelector('.immersive [data-section="sources"]')
    sources?.parentNode?.insertBefore(spacer, sources)
    const el = document.querySelector<HTMLElement>('.immersive')!
    el.scrollTop = el.scrollHeight // 触发滚动 → 重测
  })
  await expect.poll(
    () => page.locator('.immersive .marker').count(),
    { timeout: 5_000, intervals: [300] },
  ).toBe(4)

  // 点「跳转到导语」→ 平滑滚动回顶部,当前章 = 导语
  await page.locator('.immersive .progress-rail').getByRole('button', { name: '跳转到导语' }).click()
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const el = document.querySelector<HTMLElement>('.immersive')
          const denom = Math.max(1, el!.scrollHeight - el!.clientHeight)
          return Math.round((el!.scrollTop / denom) * 100)
        }),
      { timeout: 5_000, intervals: [300] },
    )
    .toBeLessThan(15)
  await expect(page.locator('.immersive .marker.active')).toHaveAttribute('title', '导语')

  // Esc 退出仍正常
  await page.keyboard.press('Escape')
  await expect(page.locator('.immersive')).toHaveCount(0)
})
