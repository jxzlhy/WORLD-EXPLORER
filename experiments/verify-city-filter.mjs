// 一次性视觉验证:城市档案面板 + 类型筛选(V1.5 批次)
// 用法:node experiments/verify-city-filter.mjs [devServerUrl]
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:5199'
const OUT = 'test-results/verify'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.goto(BASE)
await page.waitForFunction(
  () => {
    const t = document.querySelector('.status-bar')?.textContent ?? ''
    return /\d+ DESTINATIONS/.test(t) && /\d+ FPS/.test(t)
  },
  { timeout: 60_000 },
)

// 1. 打开城市面板:搜索「京都」→ 城市档案
await page.getByRole('button', { name: '搜索世界' }).click()
const input = page.getByPlaceholder('搜索国家、城市、地点…(中英文均可)')
await input.fill('京都')
await page.waitForTimeout(500)
await input.press('Enter')
await page.waitForTimeout(9_000)
const panelType = await page.evaluate(() => {
  const app = document.getElementById('app').__vue_app__
  return app.config.globalProperties.$pinia._s.get('explore').panel.kind
})
await page.screenshot({ path: `${OUT}/v15-city-panel.png` })

// 2. 类型筛选:只保留 遗产+自然,其余关闭
await page.evaluate(() => {
  const app = document.getElementById('app').__vue_app__
  const ui = app.config.globalProperties.$pinia._s.get('ui')
  ui.setAllTypes(false)
  ui.toggleType('heritage')
  ui.toggleType('natural')
})
await page.waitForTimeout(1_000)
const markerStats = await page.evaluate(() => {
  const v = window.__WE_VIEWER__
  let ds = null
  for (let i = 0; i < v.dataSources.length; i++) {
    const d = v.dataSources.get(i)
    if (d.name === 'destinations') ds = d
  }
  if (!ds) return { error: 'destinations dataSource 未找到' }
  let shown = 0
  let hidden = 0
  for (const e of ds.entities.values) {
    if (e.show === false) hidden++
    else shown++
  }
  return { shown, hidden }
})
await page.screenshot({ path: `${OUT}/v15-type-filter.png` })
console.log({ panelType, ...markerStats })
await browser.close()
