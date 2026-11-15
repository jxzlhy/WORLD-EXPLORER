import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 P — 探索推荐(V5.0 雏形):
 * addInitScript 播种足迹(埃及 2 处 + 长城)→ MyWorld 出现「你可能想去」
 * → 首条 reason 为同国信号 → 点击直达目的地面板(并关闭 MyWorld)。
 */
test('P. 探索推荐:播种足迹 → 渲染推荐 → 点击直达', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'world-explorer:v1:explored',
      JSON.stringify(['eg-giza-pyramids', 'eg-saqqara', 'cn-great-wall']),
    )
  })
  await waitForAppReady(page)

  // 打开 My World
  await page.getByRole('button', { name: 'MY WORLD' }).click()
  await expect(page.locator('.my-world')).toBeVisible()

  // 推荐区:足迹含埃及 2 处 → 同国信号最强,首条 reason 为「同在埃及」
  // (迭代二十二新增「下一站国度」国家推荐区块,.recommend 匹配两块,故用 .first())
  const rec = page.locator('.my-world .recommend').first()
  await expect(rec).toBeVisible()
  await expect(rec.locator('.we-caps-label')).toHaveText('你可能想去')
  const items = rec.locator('.rec-item')
  await expect(items).toHaveCount(3)
  await expect(items.first().locator('.why')).toHaveText('同在埃及')
  // 已探索目的地不进入推荐
  const names = await items.allTextContents()
  for (const name of names) {
    expect(name).not.toContain('吉萨金字塔群')
    expect(name).not.toContain('万里长城')
  }

  // 点击首条 → 直达目的地面板,MyWorld 关闭
  await items.first().click()
  await expect(page.locator('.my-world')).toHaveCount(0)
  await expect(page.locator('.detail-panel .name')).toBeVisible()
  const recId = await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    return explore.selectedDestination?.id ?? ''
  })
  // 首条必为埃及地点(同国信号),且非已探索项
  expect(recId).toMatch(/^eg-/)
  expect(['eg-giza-pyramids', 'eg-saqqara']).not.toContain(recId)
})
