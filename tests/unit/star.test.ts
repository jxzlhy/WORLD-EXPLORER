/**
 * 星空生成单元测试 — generateStarDirections 纯函数(V1.0 星空增强)
 * 覆盖:总数、单位向量、银带高斯约束(银纬 |β|<45°)、确定性(同种子同结果)。
 */
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { generateStarDirections } from '../../src/engine/star-layer.ts'

describe('generateStarDirections — 星空方向纯函数', () => {
  const stars = generateStarDirections(100, 200, 42)
  const tilt = (60 * Math.PI) / 180

  it('总数 = 背景 + 银带', () => {
    assert.equal(stars.length, 300)
  })

  it('全部为单位向量', () => {
    for (const s of stars) {
      const len = Math.hypot(s.x, s.y, s.z)
      assert.ok(Math.abs(len - 1) < 1e-9, `长度 ${len} 偏离 1`)
    }
  })

  it('背景星全向分布(±z 覆盖)', () => {
    const bg = stars.slice(0, 100)
    const zPos = bg.filter((s) => s.z > 0).length
    assert.ok(zPos > 20 && zPos < 80, `z>0 比例异常:${zPos}/100`)
  })

  it('银带星受银纬约束(|β| < 45°,高斯 σ=11° 实际远小于此)', () => {
    const mw = stars.slice(100)
    let maxAbsBeta = 0
    for (const s of mw) {
      // 逆旋转回大圆坐标系:β = asin(z·sinTilt + y·cosTilt) 的逆——直接用旋转前的 y' 分量近似:
      // 由生成式 y = z0·sinT + sinβ·cosT,z = z0·cosT − sinβ·sinT → sinβ = y·cosT − z·sinT
      const sinBeta = s.y * Math.cos(tilt) - s.z * Math.sin(tilt)
      const beta = Math.abs(Math.asin(Math.max(-1, Math.min(1, sinBeta))))
      maxAbsBeta = Math.max(maxAbsBeta, beta)
    }
    assert.ok(maxAbsBeta < (45 * Math.PI) / 180, `银纬超界:${(maxAbsBeta * 180) / Math.PI}°`)
    // 高斯 σ=11°,200 样本 P(|β|>35°)≈0.1%——用 40° 作稳健上界
    assert.ok(maxAbsBeta < (40 * Math.PI) / 180)
  })

  it('银心增密:λ≈0 方向(±40°)密度显著高于均匀', () => {
    const mw = stars.slice(100)
    // 银心团占 30%,σ=40°→ ±40° 窗口内应至少 25% 的银带星
    let nearCore = 0
    for (const s of mw) {
      // 大圆经度 λ = atan2(z·cosT? ...) 简化:用 x0=cosλ,即 x 分量占比
      const lambda = Math.atan2(s.z * Math.cos(tilt) + s.y * Math.sin(tilt), s.x)
      if (Math.abs(lambda) < (40 * Math.PI) / 180) nearCore++
    }
    assert.ok(nearCore > mw.length * 0.25, `银心增密不足:${nearCore}/${mw.length}`)
  })

  it('确定性:同种子同结果', () => {
    const a = generateStarDirections(10, 20, 7)
    const b = generateStarDirections(10, 20, 7)
    assert.deepEqual(a, b)
  })
})
