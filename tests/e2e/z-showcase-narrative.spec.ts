import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 Z — 巡展叙事升级(迭代十八):
 * 打开巡展 → 策展语片头出现且 ~3.5s 后淡出 → caption 含故事摘要 → 「查看完整档案」直达。
 */
test('Z. 巡展叙事:策展语片头 → 故事摘要 → 直达档案', async ({ page }) => {
  await waitForAppReady(page)

  await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    explore.openCollection('ancient-echoes')
  })
  await expect(page.locator('.detail-panel .name')).toHaveText('古文明的回声')
  await page.locator('.detail-panel').getByRole('button', { name: '⛶ 沉浸巡展' }).click()
  await expect(page.locator('.showcase')).toBeVisible()

  // 片头:策展语出现(开头为策展语正文),~3.5s 后淡出消失
  const intro = page.locator('.showcase .curator-intro')
  await expect(intro).toBeVisible()
  const note = await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    return explore.selectedCollection?.curatorNote?.slice(0, 8) ?? ''
  })
  await expect(intro.locator('.intro-text')).toContainText(note)
  await expect(intro).not.toBeVisible({ timeout: 6_000 })

  // caption:故事摘要(首段截断)+ 站名
  const caption = page.locator('.showcase .caption')
  await expect(caption.locator('.story-excerpt')).toBeVisible()
  const excerpt = await caption.locator('.story-excerpt').textContent()
  expect(excerpt!.length).toBeLessThanOrEqual(111)

  // 「查看完整档案」→ 退出巡展 + 打开当前站目的地面板
  await caption.getByRole('button', { name: '查看完整档案 →' }).click()
  await expect(page.locator('.showcase')).toHaveCount(0)
  await expect(page.locator('.detail-panel .name')).toBeVisible()
})
