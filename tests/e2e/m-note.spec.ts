import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 M — 旅行笔记(V4.5,补已实现功能的验收缺口):
 * 失焦自动保存 → localStorage 持久化 → 刷新后回显 → 导出 JSON 包含 notes。
 */
test('M. 旅行笔记:自动保存/刷新持久化/导出包含', async ({ page }) => {
  await waitForAppReady(page)

  // 打开吉萨金字塔群档案
  await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    explore.selectDestination('eg-giza-pyramids')
  })
  await expect(page.locator('.detail-panel .name')).toHaveText('吉萨金字塔群')

  // 输入笔记并失焦 → 「已保存 ✓」出现
  const note = page.locator('.detail-panel .note-input')
  await expect(note).toBeVisible()
  await note.fill('明年春天再来,想看日落时分的金字塔与骆驼剪影。')
  await note.blur()
  await expect(page.locator('.detail-panel .note-saved')).toBeVisible()

  // localStorage 直接断言
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('world-explorer:v1:notes') ?? '{}'),
  )
  expect(stored['eg-giza-pyramids']).toContain('日落时分')

  // 刷新后回显同一内容
  await page.reload()
  await waitForAppReady(page)
  await page.evaluate(() => {
    const explore = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('explore')
    explore.selectDestination('eg-giza-pyramids')
  })
  await expect(page.locator('.detail-panel .note-input')).toHaveValue(/日落时分/)

  // 导出 JSON 包含 notes 键(页内 blob 拦截,同 F 用例手法)
  await page.evaluate(() => {
    ;(window as unknown as Record<string, unknown>).__exportedBlob__ = null
    const orig = URL.createObjectURL.bind(URL)
    URL.createObjectURL = (blob: Blob) => {
      ;(window as unknown as Record<string, unknown>).__exportedBlob__ = blob
      return orig(blob)
    }
  })
  await page.getByRole('button', { name: 'MY WORLD' }).click()
  await expect(page.locator('.my-world')).toBeVisible()
  await page.getByRole('button', { name: '导出 JSON' }).click()
  const exported = await page.evaluate(async () => {
    const blob = (window as unknown as Record<string, Blob>).__exportedBlob__
    return JSON.parse(await blob.text()) as { data: { notes: Record<string, string> } }
  })
  expect(exported.data?.notes?.['eg-giza-pyramids']).toContain('日落时分')
})
