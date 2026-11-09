import { expect, test, type Page } from '@playwright/test'
import { readAltKm, waitForAppReady } from './helpers'

/** 读取航线层实体数:全程虚线 1 + 已飞段(index>0 时 1)+ 当前段(index<末站时 1) */
async function routeEntityCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const v = (window as unknown as Record<string, any>).__WE_VIEWER__
    if (!v) return 0
    const layers = v.dataSources
    let count = 0
    for (let i = 0; i < layers.length; i++) {
      const ds = layers.get(i)
      if (ds.name === 'route') count = ds.entities.values.length
    }
    return count
  })
}

/**
 * 用例 J — 合集镜头巡游(V4.5 雏形):
 * 启动 → 面板切至第一站 → 航段打断自动暂停 → 恢复 → 自动推进 → 手动暂停 → 结束。
 *
 * 打断采用引擎 cancelFlight 注入而非物理拖拽:与用户打断同走
 * flyTo promise → 'interrupted' → pauseTour 代码路径,且不受软件渲染
 * (SwiftShader)下输入事件延迟数秒的影响——物理中断已由用例 C(滚轮)覆盖。
 */
test('J. 合集镜头巡游:启动/打断暂停/恢复/自动推进/结束', async ({ page }) => {
  await waitForAppReady(page)

  // 打开合集面板(经 store 直开,等同 DiscoverBar 入口)
  await page.evaluate(() => {
    const app = (document.getElementById('app') as any).__vue_app__
    const explore = app.config.globalProperties.$pinia._s.get('explore')
    explore.openCollection('ancient-echoes')
  })
  await expect(page.locator('.detail-panel .name')).toHaveText('古文明的回声')

  // 启动巡游 → HUD 出现,面板切到第一站(吉萨金字塔群)
  await page.locator('.detail-panel').getByRole('button', { name: '✈ 镜头巡游' }).click()
  await expect(page.locator('.tour-hud')).toBeVisible()
  await expect(page.locator('.tour-hud .counter')).toHaveText('第 1 / 14 站')
  await expect(page.locator('.detail-panel .name')).toHaveText('吉萨金字塔群')
  // 航线挂载:全程虚线 + 当前段发光(第 1 站无已飞段)= 2 实体
  await expect.poll(() => routeEntityCount(page), { timeout: 10_000, intervals: [500] }).toBe(2)

  // 巡游音频:默认静音,点击后开启(程序合成,无外部素材)
  const soundOff = page.locator('.tour-hud').getByRole('button', { name: '开启巡游环境音' })
  await expect(soundOff).toBeVisible()
  await soundOff.click()
  await expect(
    page.locator('.tour-hud').getByRole('button', { name: '关闭巡游环境音' }),
  ).toBeVisible()

  // 航段中打断飞行 → 巡游自动暂停(出现「继续」)。
  // 负载抖动下注入可能落在航段已正常落地之后(取消成空操作),故轮询重试至多 3 轮:
  // 每轮先确认 isFlying 再注入;若处于停留期(下一航段未起飞),waitForFunction 会等到起飞。
  const resumeBtn = page.getByRole('button', { name: '继续' })
  for (let i = 0; i < 3 && !(await resumeBtn.isVisible()); i++) {
    await page
      .waitForFunction(
        () => (window as unknown as Record<string, any>).__WE_ENGINE__?.isFlying() === true,
        { timeout: 15_000 },
      )
      .catch(() => {})
    await page.evaluate(() => {
      ;(window as unknown as Record<string, any>).__WE_ENGINE__.cancelFlight()
    })
    await page.waitForTimeout(800)
  }
  await expect(resumeBtn).toBeVisible({ timeout: 10_000 })

  // 恢复 → 重飞当前站并抵达(巡游航段固定 6s 电影感节奏)
  await page.getByRole('button', { name: '继续' }).click()
  await expect(page.getByRole('button', { name: '暂停' })).toBeVisible()
  await expect
    .poll(() => readAltKm(page), { timeout: 30_000, intervals: [500] })
    .toBeLessThan(1_000)

  // 停留 8s 后自动推进到第 2 站
  await expect(page.locator('.tour-hud .counter')).toHaveText('第 2 / 14 站', {
    timeout: 20_000,
  })
  await expect(page.locator('.detail-panel .name')).toHaveText('萨卡拉墓地')
  // 进度反映到航线:已飞段实线出现(全程 + 已飞 + 当前 = 3 实体)
  await expect.poll(() => routeEntityCount(page), { timeout: 10_000, intervals: [500] }).toBe(3)

  // 手动暂停 → 结束:HUD 消失,航线摘除
  await page.getByRole('button', { name: '暂停' }).click()
  await expect(page.getByRole('button', { name: '继续' })).toBeVisible()
  await page.getByRole('button', { name: '结束巡游' }).click()
  await expect(page.locator('.tour-hud')).toHaveCount(0)
  await expect.poll(() => routeEntityCount(page), { timeout: 10_000, intervals: [500] }).toBe(0)
})
