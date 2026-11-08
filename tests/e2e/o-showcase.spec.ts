import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 O — 沉浸体系增强(V2.5 迭代四):
 * O1 合集沉浸巡展:入口 → 全屏照片轮播 → ←/→ 翻页 → Esc 退出;
 * O2 沉浸阅读内笔记只读回显。
 */
test.describe('O. 沉浸体系增强', () => {
  test('O1 合集沉浸巡展:打开/翻页/退出', async ({ page }) => {
    await waitForAppReady(page)

    // 打开「古文明的回声」(9 张已核验照片,入口可用)
    await page.evaluate(() => {
      const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
      explore.openCollection('ancient-echoes')
    })
    await expect(page.locator('.detail-panel .name')).toHaveText('古文明的回声')

    const showcaseBtn = page.locator('.detail-panel').getByRole('button', { name: '⛶ 沉浸巡展' })
    await expect(showcaseBtn).toBeEnabled()
    await showcaseBtn.click()

    const showcase = page.locator('.showcase')
    await expect(showcase).toBeVisible()
    // 第一张按收录顺序应为吉萨金字塔群
    await expect(showcase.locator('.dest-name')).toHaveText('吉萨金字塔群')
    await expect(showcase.locator('.credit')).toContainText('©')
    // 进度点数量 = 已核验照片数(≥9)
    const dots = await showcase.locator('.dot').count()
    expect(dots).toBeGreaterThanOrEqual(9)

    // → 翻到下一张,‹ › 按钮与键盘均可
    await page.keyboard.press('ArrowRight')
    await expect(showcase.locator('.dest-name')).not.toHaveText('吉萨金字塔群')
    await page.locator('.arrow.prev').click()
    await expect(showcase.locator('.dest-name')).toHaveText('吉萨金字塔群')

    // 进度点直达
    await showcase.locator('.dot').nth(3).click()
    await expect(showcase.locator('.dot').nth(3)).toHaveClass(/active/)

    // Esc 退出 → 合集面板仍在
    await page.keyboard.press('Escape')
    await expect(showcase).toHaveCount(0)
    await expect(page.locator('.detail-panel .name')).toHaveText('古文明的回声')
  })

  test('O2 沉浸阅读内笔记只读回显', async ({ page }) => {
    await waitForAppReady(page)

    // 预置一条笔记(经 store 写入并持久化)
    await page.evaluate(() => {
      const app = (document.getElementById('app') as any).__vue_app__
      const pinia = app.config.globalProperties.$pinia
      const myWorld = pinia._s.get('my-world')
      myWorld.setNote('eg-giza-pyramids', '黄昏时分的光线最美,记得带长焦。')
    })

    // 打开吉萨档案 → 沉浸阅读
    await page.evaluate(() => {
      const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
      explore.selectDestination('eg-giza-pyramids')
    })
    await expect(page.locator('.detail-panel .name')).toHaveText('吉萨金字塔群')
    await page.getByRole('button', { name: '⛶ 沉浸阅读' }).click()

    // 笔记只读回显
    const note = page.locator('.immersive .my-note-ro')
    await expect(note).toBeVisible()
    await expect(note).toContainText('黄昏时分的光线最美')
    // 无笔记的目的地不显示该块(对照:合集面板任一地点)——直接退出即可
    await page.keyboard.press('Escape')
    await expect(page.locator('.immersive')).toHaveCount(0)
  })
})
