import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 U — 程序化星空(V1.0 收官 + 迭代十三三档联动):
 * 两 collection(背景 2200 / 银河 3000)→ high 全显 → balanced 银河减负 → low 全隐。
 */
test('U. 星空:两 collection 挂载 + 三档联动', async ({ page }) => {
  await waitForAppReady(page)

  const read = () =>
    page.evaluate(() => {
      const v = (window as unknown as Record<string, any>).__WE_VIEWER__
      if (!v) return [] as Array<{ count: number; show: boolean }>
      const prims = v.scene.primitives
      const out: Array<{ count: number; show: boolean }> = []
      for (let i = 0; i < prims.length; i++) {
        const p = prims.get(i)
        if (p instanceof Object && p.constructor?.name === 'PointPrimitiveCollection') {
          out.push({ count: p.length, show: p.show })
        }
      }
      return out
    })

  const qualityButtons = page.getByRole('radiogroup', { name: '渲染画质' }).getByRole('button')

  // high:两 collection(背景 2200 / 银河 3000),均显示
  await expect
    .poll(read, { timeout: 20_000, intervals: [500] })
    .toEqual([
      { count: 2200, show: true },
      { count: 3000, show: true },
    ])

  // balanced:银河隐藏,背景保留
  await qualityButtons.filter({ hasText: '均衡' }).click()
  await expect
    .poll(read, { timeout: 10_000, intervals: [500] })
    .toEqual([
      { count: 2200, show: true },
      { count: 3000, show: false },
    ])

  // low:全隐
  await qualityButtons.filter({ hasText: '低' }).click()
  await expect
    .poll(read, { timeout: 10_000, intervals: [500] })
    .toEqual([
      { count: 2200, show: false },
      { count: 3000, show: false },
    ])

  // 回 high 恢复
  await qualityButtons.filter({ hasText: '高' }).click()
  await expect
    .poll(read, { timeout: 10_000, intervals: [500] })
    .toEqual([
      { count: 2200, show: true },
      { count: 3000, show: true },
    ])
})
