import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 — MyWorld 数据重置(迭代二十一):
 * 预置收藏/笔记/足迹 → 两步确认重置 → 全部清空 + localStorage 清理 + 取消路径不破坏。
 */
test('MyWorld 重置数据:两步确认 → 全清;取消路径不破坏', async ({ page }) => {
  await waitForAppReady(page)

  // 预置数据(经 store 写入)
  await page.evaluate(() => {
    const pinia = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia
    const explore = pinia._s.get('explore')
    const myWorld = pinia._s.get('my-world')
    explore.selectDestination('eg-giza-pyramids')
    myWorld.toggleFavorite('eg-giza-pyramids')
    myWorld.setNote('eg-giza-pyramids', '想看日落')
  })
  const stored = await page.evaluate(() => ({
    fav: JSON.parse(localStorage.getItem('world-explorer:v1:favorites') ?? '[]').length,
    notes: Object.keys(JSON.parse(localStorage.getItem('world-explorer:v1:notes') ?? '{}')).length,
    explored: JSON.parse(localStorage.getItem('world-explorer:v1:explored') ?? '[]').length,
  }))
  expect(stored.fav).toBe(1)
  expect(stored.notes).toBe(1)
  expect(stored.explored).toBeGreaterThan(0)

  await page.getByRole('button', { name: 'MY WORLD' }).click()
  await expect(page.locator('.my-world')).toBeVisible()

  // 第一步:点「重置数据」→ 变为「⚠ 确认重置」;取消 → 不清空
  await page.getByRole('button', { name: '重置数据' }).click()
  const armed = page.getByRole('button', { name: '⚠ 确认重置' })
  await expect(armed).toBeVisible()
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await expect(page.getByRole('button', { name: '重置数据' })).toBeVisible()
  const stillThere = await page.evaluate(
    () => JSON.parse(localStorage.getItem('world-explorer:v1:favorites') ?? '[]').length,
  )
  expect(stillThere).toBe(1)

  // 第二步:确认 → 全部清空(localStorage + 列表)
  await page.getByRole('button', { name: '重置数据' }).click()
  await page.getByRole('button', { name: '⚠ 确认重置' }).click()
  await expect(page.getByRole('button', { name: '重置数据' })).toBeVisible()
  const cleared = await page.evaluate(() => ({
    fav: JSON.parse(localStorage.getItem('world-explorer:v1:favorites') ?? '[]').length,
    notes: Object.keys(JSON.parse(localStorage.getItem('world-explorer:v1:notes') ?? '{}')).length,
    explored: JSON.parse(localStorage.getItem('world-explorer:v1:explored') ?? '[]').length,
  }))
  expect(cleared.fav).toBe(0)
  expect(cleared.notes).toBe(0)
  expect(cleared.explored).toBe(0)
  await expect(page.locator('.my-world .item')).toHaveCount(0)
})
