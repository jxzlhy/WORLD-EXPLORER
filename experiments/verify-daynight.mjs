// 一次性视觉验证:昼夜逐像素合成(夜侧城市灯光 + 晨昏线过渡)
// 用法:node experiments/verify-daynight.mjs [devServerUrl]
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = process.argv[2] ?? 'http://localhost:5188'
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

// 计算当前日下点(与应用内相同算法)
const sub = await page.evaluate(() => {
  const now = new Date()
  const jd = now.getTime() / 86_400_000 + 2440587.5
  const n = jd - 2451545.0
  const L = (280.46 + 0.9856474 * n) % 360
  const g = ((357.528 + 0.9856003 * n) % 360) * (Math.PI / 180)
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * (Math.PI / 180)
  const eps = (23.439 - 0.0000004 * n) * (Math.PI / 180)
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda))
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda))
  const gmst = (280.46061837 + 360.98564736629 * n) % 360
  let subLon = ((ra * 180) / Math.PI - gmst) % 360
  if (subLon > 180) subLon -= 360
  if (subLon < -180) subLon += 360
  return { subLon, subLat: (dec * 180) / Math.PI }
})

const nightLon = ((sub.subLon + 180 + 540) % 360) - 180
const terminatorLon = ((sub.subLon - 90 + 540) % 360) - 180

// 夜侧机位
await page.evaluate(
  ({ lon, lat }) =>
    window.__WE_ENGINE__.flyTo({
      longitude: lon,
      latitude: lat,
      height: 14_000_000,
      duration: 4,
    }),
  { lon: nightLon, lat: sub.subLat },
)
await page.waitForTimeout(6_000)
await page.screenshot({ path: `${OUT}/night-side.png` })

// 晨昏线机位(日下点以西 90° = 黄昏线)
await page.evaluate(
  ({ lon, lat }) =>
    window.__WE_ENGINE__.flyTo({
      longitude: lon,
      latitude: lat,
      height: 22_000_000,
      duration: 4,
    }),
  { lon: terminatorLon, lat: 15 },
)
await page.waitForTimeout(6_000)
await page.screenshot({ path: `${OUT}/terminator.png` })

console.log('night cam:', nightLon.toFixed(1), sub.subLat.toFixed(1))
console.log('saved:', `${OUT}/night-side.png`, `${OUT}/terminator.png`)
await browser.close()
