import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 Y — 沉浸阅读章节跳转(迭代十七):
 * 吉萨(有时间轴)→ markers ≥4(导语/正文/时间轴/来源)→ 点「资料来源」→ 滚到底部
 * → 当前章节点高亮 → Esc 退出。
 */
test('Y. 章节跳转:markers 渲染 → 跳转来源 → 高亮', async ({ page }) => {
  await waitForAppReady(page)

  await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    explore.selectDestination('eg-giza-pyramids')
  })
  await expect(page.locator('.detail-panel .name')).toHaveText('吉萨金字塔群')
  await page.getByRole('button', { name: '⛶ 沉浸阅读' }).click()
  await expect(page.locator('.immersive')).toBeVisible()

  // markers:导语/正文/时间轴/资料来源(无笔记 → 无 note)
  const markers = page.locator('.immersive .marker')
  await expect(markers).toHaveCount(4)
  await expect(markers.nth(0)).toHaveAttribute('title', '导语')
  await expect(markers.nth(2)).toHaveAttribute('title', '时间轴')

  // 点「资料来源」→ 滚动到底部区域,进度 ≥85%
  await page.locator('.immersive .progress-rail').getByRole('button', { name: '跳转到资料来源' }).click()
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
    .toBeGreaterThanOrEqual(85)

  // 当前章节点 = sources(高亮)
  await expect(page.locator('.immersive .marker.active')).toHaveAttribute('title', '资料来源')
})
