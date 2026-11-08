import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 N — 全屏沉浸阅读(V2.5 雏形):
 * 目的面板入口 → 全屏覆盖层(标题/逐段故事/时间轴)→ Esc 退出 → 回到面板。
 */
test('N. 沉浸阅读:入口/全屏呈现/Esc 退出', async ({ page }) => {
  await waitForAppReady(page)

  // 打开吉萨金字塔群档案(S 级,含时间轴)
  await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    explore.selectDestination('eg-giza-pyramids')
  })
  await expect(page.locator('.detail-panel .name')).toHaveText('吉萨金字塔群')

  // 沉浸入口 → 覆盖层出现,标题与档案一致
  await page.getByRole('button', { name: '⛶ 沉浸阅读' }).click()
  const reader = page.locator('.immersive')
  await expect(reader).toBeVisible()
  await expect(reader.locator('.name')).toHaveText('吉萨金字塔群')
  await expect(reader.locator('.story p').first()).toBeVisible()
  // S 级标注与来源仍在
  await expect(reader.locator('.we-caps-label').first()).toContainText('S 级档案')
  await expect(reader.locator('.sources li').first()).toBeVisible()

  // Esc 退出 → 覆盖层消失,目的地面板仍在
  await page.keyboard.press('Escape')
  await expect(reader).toHaveCount(0)
  await expect(page.locator('.detail-panel .name')).toHaveText('吉萨金字塔群')

  // 再开一次,按钮退出
  await page.getByRole('button', { name: '⛶ 沉浸阅读' }).click()
  await expect(page.locator('.immersive')).toBeVisible()
  await page.getByRole('button', { name: '退出沉浸阅读' }).click()
  await expect(page.locator('.immersive')).toHaveCount(0)
})
