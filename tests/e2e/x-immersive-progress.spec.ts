import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 X — 沉浸阅读进度(迭代十六):
 * 打开 → 顶部进度 ≈0 → 滚到底 → ≈100 → 回顶 → ≈0 → Esc 退出仍正常。
 */
const readProgress = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const pct = document.querySelector<HTMLElement>('.immersive .progress-pct')?.textContent
    const width = document.querySelector<HTMLElement>('.immersive .progress-rail i')?.style.width
    return { pct: Number(pct?.replace('%', '') ?? -1), width }
  })

test('X. 沉浸阅读进度:顶部 → 滚底 → 回顶', async ({ page }) => {
  await waitForAppReady(page)

  await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    explore.selectDestination('eg-giza-pyramids')
  })
  await expect(page.locator('.detail-panel .name')).toHaveText('吉萨金字塔群')
  await page.getByRole('button', { name: '⛶ 沉浸阅读' }).click()
  await expect(page.locator('.immersive')).toBeVisible()

  // 顶部:进度 ≈0
  await expect.poll(() => readProgress(page), { timeout: 5_000, intervals: [300] }).toEqual({
    pct: 0,
    width: '0%',
  })

  // 滚到底 → ≈100
  await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('.immersive')
    if (el) el.scrollTop = el.scrollHeight
  })
  await expect
    .poll(() => readProgress(page), { timeout: 5_000, intervals: [300] })
    .toEqual({ pct: 100, width: '100%' })

  // 回顶 → ≈0
  await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('.immersive')
    if (el) el.scrollTop = 0
  })
  await expect.poll(() => readProgress(page), { timeout: 5_000, intervals: [300] }).toEqual({
    pct: 0,
    width: '0%',
  })

  // Esc 退出仍然正常
  await page.keyboard.press('Escape')
  await expect(page.locator('.immersive')).toHaveCount(0)
})
