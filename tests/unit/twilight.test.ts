/**
 * 晨昏带暖色单元测试 — twilightWarmth 纯函数(大气散射调优)
 * 覆盖:边缘为 0、中心峰值、对称性、越界钳制(全部使用浮点容差)。
 */
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { twilightWarmth } from '../../src/engine/day-night-composite.ts'

const EPS = 1e-9

describe('twilightWarmth — 晨昏带暖色权重', () => {
  it('边缘(夜缘/日缘)≈ 0(sin(π) 浮点残差以内)', () => {
    assert.ok(Math.abs(twilightWarmth(0)) < EPS)
    assert.ok(Math.abs(twilightWarmth(1)) < EPS)
  })

  it('带中心最强(≈1)', () => {
    assert.ok(Math.abs(twilightWarmth(0.5) - 1) < 1e-6)
    assert.ok(twilightWarmth(0.45) > 0.98)
    assert.ok(twilightWarmth(0.55) > 0.98)
  })

  it('钟形对称(0.4 与 0.6 相等)且爬升段单调', () => {
    assert.ok(Math.abs(twilightWarmth(0.6) - twilightWarmth(0.4)) < 1e-9)
    assert.ok(twilightWarmth(0.2) < twilightWarmth(0.4))
  })

  it('越界钳制(负值/超 1 不产生负权重或爆表)', () => {
    assert.ok(twilightWarmth(-0.5) >= 0)
    assert.ok(Math.abs(twilightWarmth(1.5)) < EPS)
    assert.ok(twilightWarmth(1.5) >= 0)
  })
})
