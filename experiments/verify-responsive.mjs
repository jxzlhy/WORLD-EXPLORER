// 一次性视觉验证:响应式五档 + 移动端抽屉打开态(V0.2 Phase 08)
// 用法:node experiments/verify-responsive.mjs [devServerUrl]
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:5199'
const OUT = 'test-results/verify'
mkdirSync(OUT, { recursive: true })

const VIEWPORTS = [
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'laptop-1440', width: 1440, height: 900 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
]

const browser = await chromium.launch()
for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
  await page.goto(BASE)
  await page.waitForFunction(
    () => {
      const t = document.querySelector('.status-bar')?.textContent ?? ''
      return /\d+ DESTINATIONS/.test(t) && /\d+ FPS/.test(t)
    },
    { timeout: 60_000 },
  )
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/v02-${vp.name}.png` })

  if (vp.width <= 768) {
    // 移动端:打开控制抽屉再截一张
    await page.evaluate(() => {
      const app = document.getElementById('app')?.__vue_app__
      app?.config.globalProperties.$pinia._s.get('ui')?.toggleMobileControls(true)
    })
    await page.waitForTimeout(500)
    await page.screenshot({ path: `${OUT}/v02-${vp.name}-drawer.png` })
  }
  await page.close()
  console.log('done', vp.name)
}
await browser.close()
console.log('saved to', OUT)
