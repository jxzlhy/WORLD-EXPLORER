import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 — 时间机器(V3.0 雏形):
 * 滑杆设为公元 1000 → 长城(前 700 建成)显示、埃菲尔(1889 建成)隐藏、富士山(无时间轴)始终显示
 * → 滑杆设为 2030 → 全部显示 → 关闭时间机器恢复。
 */
const countHidden = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const v = (window as unknown as Record<string, any>).__WE_VIEWER__
    if (!v) return null
    const ds = v.dataSources
    for (let i = 0; i < ds.length; i++) {
      const d = ds.get(i)
      if (d.name !== 'destinations') continue
      let hidden = 0
      let total = 0
      for (const e of d.entities.values) {
        total++
        if (e.show === false) hidden++
      }
      return { hidden, total }
    }
    return null
  })

const setYear = (page: import('@playwright/test').Page, year: number | null) =>
  page.evaluate((y) => {
    const ui = (document.getElementById('app') as any).__vue_app__.config.globalProperties.$pinia._s.get('ui')
    ui.setTimeMachineYear(y)
  }, year)

test('时间机器:1000 年 → 长城显示/埃菲尔隐藏;2030 年 → 全显;关闭恢复', async ({ page }) => {
  await waitForAppReady(page)

  // 基线:过滤关闭,全部显示(无隐藏)
  await expect
    .poll(() => countHidden(page), { timeout: 10_000, intervals: [300] })
    .toEqual({ hidden: 0, total: 200 })

  // 时间机器 year=1000:长城(前 700)显示;埃菲尔(1889)隐藏;富士山(无时间轴)显示
  await setYear(page, 1000)
  await expect
    .poll(() => countHidden(page), { timeout: 10_000, intervals: [300] })
    .toEqual({ hidden: expect.any(Number), total: 200 })
  const state1000 = await page.evaluate(() => {
    const v = (window as unknown as Record<string, any>).__WE_VIEWER__
    const ds = v.dataSources
    const showOf = (id: string) => {
      for (let i = 0; i < ds.length; i++) {
        const d = ds.get(i)
        if (d.name !== 'destinations') continue
        const e = d.entities.getById(`dest:${id}`)
        if (e) return e.show
      }
      return null
    }
    return {
      wall: showOf('cn-great-wall'), // 前 700 建成 → 显示
      eiffel: showOf('fr-eiffel-tower'), // 1889 建成 → 隐藏
      fuji: showOf('jp-mount-fuji'), // 无时间轴 → 显示
    }
  })
  expect(state1000).toEqual({ wall: true, eiffel: false, fuji: true })

  // 滑到 2030 → 全显
  await setYear(page, 2030)
  await expect
    .poll(() => countHidden(page), { timeout: 10_000, intervals: [300] })
    .toEqual({ hidden: 0, total: 200 })

  // 关闭时间机器 → 恢复
  await setYear(page, null)
  await expect
    .poll(() => countHidden(page), { timeout: 10_000, intervals: [300] })
    .toEqual({ hidden: 0, total: 200 })
})
