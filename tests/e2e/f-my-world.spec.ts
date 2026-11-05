import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 F — MY WORLD:收藏持久化、导出、导入校验(非法数据被拒绝)。
 */
test.describe('F. MY WORLD', () => {
  // 本用例含两次完整 app-ready(首载+刷新)。SwiftShader 软渲染下套件负载时单轮可达 90s+,预算 300s。
  test.setTimeout(300_000)
  test('收藏 → 刷新仍在 → 导出 → 非法导入被拒绝', async ({ page }) => {
    await waitForAppReady(page)

    // 收藏今日精选(利用 DiscoverBar 打开一个目的地)
    await page.getByRole('button', { name: '随机探索' }).click()
    await expect(page.locator('.detail-panel .actions')).toBeVisible()
    await page.getByRole('button', { name: /收藏/ }).first().click()
    const favs = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('world-explorer:v1:favorites') ?? '[]'),
    )
    expect(favs.length).toBe(1)

    // 刷新后仍在
    await page.reload()
    await waitForAppReady(page)
    await page.getByRole('button', { name: 'MY WORLD' }).click()
    await expect(page.locator('.my-world .item')).toHaveCount(1)

    // 导出 JSON(下载事件;套件负载下 blob 导出可能延迟,放宽到 30s)
    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 })
    await page.getByRole('button', { name: '导出 JSON' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^world-explorer-\d{4}-\d{2}-\d{2}\.json$/)

    // 非法导入:结构错误的文件 → 内联报错,数据不被覆盖,不重载页面
    await page.getByRole('button', { name: '导入 JSON' }).click()
    await page.setInputFiles('input[type=file]', {
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"schema": "unknown/v9", "data": {"favorites": "not-an-array"}}'),
    })
    await expect(page.locator('.import-msg.error')).toBeVisible()
    await expect(page.locator('.import-msg.error')).toContainText('不支持的导出版本')
    // 收藏未被覆盖
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem('world-explorer:v1:favorites') ?? '[]').length,
      ),
    ).toBe(1)

    // 非数组字段:类型错误也被拒绝
    await page.getByRole('button', { name: '导入 JSON' }).click()
    await page.setInputFiles('input[type=file]', {
      name: 'bad2.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"favorites": "not-an-array"}'),
    })
    await expect(page.locator('.import-msg.error')).toBeVisible()
    await expect(page.locator('.import-msg.error')).toContainText('字符串数组')
  })
})
