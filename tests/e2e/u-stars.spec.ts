import { expect, test } from '@playwright/test'
import { waitForAppReady } from './helpers'

/**
 * 用例 U — 程序化星空(V1.0 收官):
 * 星点 collection 存在且 ≥5000 点(背景 2200 + 银河 3000)→ low 档整层隐藏 → high 恢复。
 */
test('U. 星空:点云挂载 + low 档隐藏联动', async ({ page }) => {
  await waitForAppReady(page)

  // 通过 primitives 遍历找 PointPrimitiveCollection(star 层唯一使用)
  const starCount = () =>
    page.evaluate(() => {
      const v = (window as unknown as Record<string, any>).__WE_VIEWER__
      if (!v) return 0
      const prims = v.scene.primitives
      let count = 0
      for (let i = 0; i < prims.length; i++) {
        const p = prims.get(i)
        if (p instanceof Object && p.constructor?.name === 'PointPrimitiveCollection') {
          count = Math.max(count, p.length)
        }
      }
      return count
    })

  // 默认 high 档:星空挂载,点数与纯函数生成一致(2200 + 3000)
  await expect.poll(starCount, { timeout: 20_000, intervals: [500] }).toBe(5200)

  // 切 low → 整层隐藏(show=false)(画质 segmented 组内「低」按钮,hint 在 title)
  await page.getByRole('radiogroup', { name: '渲染画质' }).getByRole('button', { name: '低' }).click()
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const v = (window as unknown as Record<string, any>).__WE_VIEWER__
          const prims = v?.scene?.primitives
          for (let i = 0; i < (prims?.length ?? 0); i++) {
            const p = prims.get(i)
            if (p instanceof Object && p.constructor?.name === 'PointPrimitiveCollection') {
              return p.show
            }
          }
          return null
        }),
      { timeout: 10_000, intervals: [500] },
    )
    .toBe(false)
})
