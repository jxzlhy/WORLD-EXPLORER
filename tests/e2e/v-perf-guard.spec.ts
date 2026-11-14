import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 V — FPS 自动降档守门(V5.0 迭代十四):
 * stub 引擎 FPS=5 → 开启「自动降档」→ 持续低帧触发 high→balanced→low 两级降档
 * → StatusBar 提示出现 → 关闭开关停止守门。
 */
test('V. FPS 自动降档:stub 低帧 → 两级降档 + 提示', async ({ page }) => {
  await waitForAppReady(page)

  // stub:所有 FPS 采样固定为 5(远低于两级阈值)
  await page.evaluate(() => {
    const ui = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('ui')
    const orig = ui.setFps.bind(ui)
    ui.setFps = (_fps: number) => orig(5)
  })

  // 开启自动降档
  await page.evaluate(() => {
    const ui = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('ui')
    ui.setAutoDegrade(true)
  })

  const quality = () =>
    page.evaluate(() => {
      const ui = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('ui')
      return ui.quality
    })

  // 持续 6s 低帧 → 第一次降档(high→balanced)
  await expect.poll(quality, { timeout: 20_000, intervals: [500] }).toBe('balanced')
  await expect(page.locator('.status-bar .degrade-note')).toContainText('帧率偏低')
  await expect(page.locator('.status-bar .degrade-note')).toContainText('均衡')

  // 继续低帧 → 第二次降档(balanced→low),提示更新
  await expect.poll(quality, { timeout: 20_000, intervals: [500] }).toBe('low')
  await expect(page.locator('.status-bar .degrade-note')).toContainText('低')

  // 关闭开关 → 守门停止(不再变化,提示清除)
  await page.evaluate(() => {
    const ui = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('ui')
    ui.setAutoDegrade(false)
  })
  await expect(page.locator('.status-bar .degrade-note')).toHaveCount(0)
})
