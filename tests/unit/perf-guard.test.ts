/**
 * FPS 自动降档决策单元测试 — nextQualityOnFps 纯函数(V5.0 迭代十四)
 * 覆盖:三档阈值边界、low 终点、正常帧率不动作、仅降不升语义。
 */
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { nextQualityOnFps, FPS_DEGRADE_THRESHOLDS, LOW_FPS_STREAK } from '../../src/services/performance-guard.ts'

describe('nextQualityOnFps — 自动降档决策', () => {
  it('high:低于 24 → balanced;边界值不动', () => {
    assert.equal(nextQualityOnFps('high', 10), 'balanced')
    assert.equal(nextQualityOnFps('high', 23.9), 'balanced')
    assert.equal(nextQualityOnFps('high', 24), null)
    assert.equal(nextQualityOnFps('high', 60), null)
  })

  it('balanced:低于 18 → low;边界值不动', () => {
    assert.equal(nextQualityOnFps('balanced', 5), 'low')
    assert.equal(nextQualityOnFps('balanced', 18), null)
    assert.equal(nextQualityOnFps('balanced', 30), null)
  })

  it('low 为终点,不再动作(仅降不升)', () => {
    assert.equal(nextQualityOnFps('low', 3), null)
    assert.equal(nextQualityOnFps('low', 60), null)
  })

  it('阈值常量与持续采样窗口合理', () => {
    assert.ok(FPS_DEGRADE_THRESHOLDS.balanced < FPS_DEGRADE_THRESHOLDS.high)
    assert.ok(LOW_FPS_STREAK >= 3, '瞬时掉帧不应触发,连续窗口 ≥3')
  })
})
