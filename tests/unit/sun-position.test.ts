/**
 * 太阳位置算法单元测试 — 用天文历表已知时刻做真值校验。
 * 真值来源:NASA授时/天文年历公开常识数据(分至时刻的太阳赤纬)。
 */
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { sunSubPoint } from '../../src/engine/sun-position.ts'

const closeTo = (actual: number, expected: number, tolDeg: number, label: string) => {
  assert.ok(
    Math.abs(actual - expected) <= tolDeg,
    `${label}: 期望 ${expected}±${tolDeg}°,实际 ${actual.toFixed(3)}°`,
  )
}

describe('sunSubPoint — 天文真值校验', () => {
  it('2024 春分(03-20 03:06 UTC)太阳直射赤道', () => {
    const { subLat } = sunSubPoint(new Date('2024-03-20T03:06:00Z'))
    closeTo(subLat, 0, 0.3, '春分赤纬')
  })

  it('2024 夏至(06-20 20:51 UTC)赤纬 ≈ +23.44°', () => {
    const { subLat } = sunSubPoint(new Date('2024-06-20T20:51:00Z'))
    closeTo(subLat, 23.44, 0.3, '夏至赤纬')
  })

  it('2024 冬至(12-21 09:20 UTC)赤纬 ≈ -23.44°', () => {
    const { subLat } = sunSubPoint(new Date('2024-12-21T09:20:00Z'))
    closeTo(subLat, -23.44, 0.3, '冬至赤纬')
  })

  it('2024 秋分(09-22 18:44 UTC)太阳直射赤道', () => {
    const { subLat } = sunSubPoint(new Date('2024-09-22T18:44:00Z'))
    closeTo(subLat, 0, 0.3, '秋分赤纬')
  })

  it('UTC 正午日下点经度在 [-4°, +1°](均时差范围)', () => {
    for (const month of ['2024-01-01', '2024-04-01', '2024-07-01', '2024-10-01']) {
      const { subLon } = sunSubPoint(new Date(`${month}T12:00:00Z`))
      assert.ok(
        subLon >= -4 && subLon <= 1,
        `${month} 12:00 UTC 日下点经度 ${subLon.toFixed(2)}° 超出均时差范围`,
      )
    }
  })

  it('日下点 23 小时西移 345°(归一化后等价于 +15°)', () => {
    const t0 = sunSubPoint(new Date('2024-06-01T00:00:00Z')).subLon
    const t1 = sunSubPoint(new Date('2024-06-01T23:00:00Z')).subLon
    let delta = t1 - t0
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    // 西移 345° 与东移 +15° 是同一个位置(回绕等价)
    closeTo(delta, 15, 2, '23h 位移(归一化)')
  })

  it('经度归一化:结果始终在 [-180,180]', () => {
    for (let day = 0; day < 365; day += 11) {
      const { subLon } = sunSubPoint(new Date(2024, 0, 1 + day, 13))
      assert.ok(subLon >= -180 && subLon <= 180, `越界: ${subLon}`)
    }
  })
})
