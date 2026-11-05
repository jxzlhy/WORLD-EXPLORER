// 一次性视觉验证:主题合集(V1.5)
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

// 打开合集菜单
await page.getByRole('button', { name: '✦ 合集' }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/v15-collections-menu.png` })

// 打开「古文明的回声」
await page.getByRole('button', { name: /古文明的回声/ }).click()
await page.waitForTimeout(1_000)
const st = await page.evaluate(() => {
  const app = document.getElementById('app').__vue_app__
  const explore = app.config.globalProperties.$pinia._s.get('explore')
  return {
    panel: explore.panel,
    itemCount: document.querySelectorAll('.detail-panel .dest-item').length,
  }
})
await page.screenshot({ path: `${OUT}/v15-collection-panel.png` })
console.log(JSON.stringify(st))
await browser.close()
