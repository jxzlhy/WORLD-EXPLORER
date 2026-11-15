/**
 * 内容新鲜度单元测试 — buildFreshness 纯函数(V1.5 步骤 3)
 * 覆盖:分桶(≤14/15-60/>60)、平均天数、最老 Top 排序、空输入、缺 updatedAt 处理。
 */
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { buildFreshness } from '../../src/services/coverage-stats.ts'

const NOW = new Date('2026-11-15T12:00:00Z')
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString().slice(0, 10)

describe('buildFreshness — 内容新鲜度', () => {
  const dests = [
    { id: 'a', name: 'A', updatedAt: daysAgo(3) },   // fresh
    { id: 'b', name: 'B', updatedAt: daysAgo(30) },  // recent
    { id: 'c', name: 'C', updatedAt: daysAgo(90) },  // stale
    { id: 'd', name: 'D' },                           // 缺 updatedAt → 过滤
  ]

  it('分桶:fresh/recent/stale(缺 updatedAt 过滤)', () => {
    const f = buildFreshness(dests, NOW)
    assert.equal(f.freshCount, 1)
    assert.equal(f.recentCount, 1)
    assert.equal(f.staleCount, 1)
    // d 被过滤,平均只算 3 条
    assert.equal(f.avgDays, Math.round((3 + 30 + 90) / 3))
  })

  it('最老 Top:按天数降序', () => {
    const f = buildFreshness(dests, NOW, 2)
    assert.equal(f.oldest.length, 2)
    assert.equal(f.oldest[0]!.id, 'c')
    assert.equal(f.oldest[1]!.id, 'b')
  })

  it('边界:14 天 fresh / 15 天 recent / 60 天 recent / 61 天 stale', () => {
    const dests4 = [
      { id: 'a', name: 'A', updatedAt: daysAgo(14) },
      { id: 'b', name: 'B', updatedAt: daysAgo(15) },
      { id: 'c', name: 'C', updatedAt: daysAgo(60) },
      { id: 'd', name: 'D', updatedAt: daysAgo(61) },
    ]
    const f = buildFreshness(dests4, NOW)
    assert.equal(f.freshCount, 1)
    assert.equal(f.recentCount, 2)
    assert.equal(f.staleCount, 1)
  })

  it('空输入 → 全零', () => {
    const f = buildFreshness([], NOW)
    assert.deepEqual(f, { freshCount: 0, recentCount: 0, staleCount: 0, avgDays: 0, oldest: [] })
  })
})
