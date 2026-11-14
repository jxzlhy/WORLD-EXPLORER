import { expect, test, type Page } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 W — 沉浸巡展 Ken Burns(迭代十五):
 * 动画挂载(奇偶交替名)→ 暂停=play-state paused → ‹›导航交替 → 无障碍(reduced-motion 禁用)。
 * 先暂停再导航,消除 8s 自动轮播与断言的竞态。
 */
const photoStyle = (page: Page) =>
  page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('.showcase .photo')
    if (!el) return null
    const cs = getComputedStyle(el)
    return { name: cs.animationName, state: cs.animationPlayState }
  })

async function openShowcase(page: Page): Promise<void> {
  await waitForAppReady(page)
  await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    explore.openCollection('ancient-echoes')
  })
  await expect(page.locator('.detail-panel .name')).toHaveText('古文明的回声')
  await page.locator('.detail-panel').getByRole('button', { name: '⛶ 沉浸巡展' }).click()
  await expect(page.locator('.showcase')).toBeVisible()
}

test('W. 巡展 Ken Burns:动画/交替/暂停', async ({ page }) => {
  await openShowcase(page)

  // 第一张(idx 0):kb-in 动画,运行中
  await expect.poll(() => photoStyle(page), { timeout: 10_000, intervals: [300] }).toEqual({
    name: 'kb-in',
    state: 'running',
  })

  // 暂停自动轮播 → 动画 play-state paused(消除与断言的竞态)
  await page.locator('.showcase').getByRole('button', { name: '暂停播放' }).click()
  await expect.poll(() => photoStyle(page), { timeout: 5_000, intervals: [300] }).toEqual({
    name: 'kb-in',
    state: 'paused',
  })

  // → 下一张(idx 1):交替为 kb-out(仍 paused)
  await page.locator('.showcase .arrow.next').click()
  await expect.poll(() => photoStyle(page), { timeout: 5_000, intervals: [300] }).toEqual({
    name: 'kb-out',
    state: 'paused',
  })

  // 键盘 ‹ 返回(idx 0):kb-in
  await page.keyboard.press('ArrowLeft')
  await expect.poll(() => photoStyle(page), { timeout: 5_000, intervals: [300] }).toEqual({
    name: 'kb-in',
    state: 'paused',
  })

  // 恢复自动播放 → running
  await page.locator('.showcase').getByRole('button', { name: '自动播放' }).click()
  await expect.poll(() => photoStyle(page), { timeout: 5_000, intervals: [300] }).toEqual({
    name: 'kb-in',
    state: 'running',
  })

  await page.keyboard.press('Escape')
})

test('W2. prefers-reduced-motion 下 Ken Burns 禁用', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openShowcase(page)

  const style = await photoStyle(page)
  expect(style).toBeTruthy()
  expect(style!.name === 'none' || style!.name === '').toBe(true)
})
