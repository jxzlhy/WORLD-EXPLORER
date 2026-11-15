/**
 * 国家推荐单元测试 — buildCountryRecommendations 纯函数(V5.0 迭代二十二)
 * 覆盖:动量排序、探索完的国家排除、空足迹、显式排除、limit。
 */
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { buildCountryRecommendations } from '../../src/stores/explore-store.ts'
import type { Country, Destination } from '../../src/domain/types.ts'

const COUNTRY = (id: string, name: string): Country => ({
  id, name, nameEn: id, continent: 'X', capital: '', summary: '',
})
const DEST = (id: string, countryId: string, quality: 'S' | 'A' = 'S'): Destination => ({
  id, name: id, nameEn: id, type: 'heritage', countryId, longitude: 0, latitude: 0,
  summary: 's', story: ['a'], tags: ['t'], sources: [], quality, updatedAt: '2026-11-15',
})

describe('buildCountryRecommendations — 下一站国度', () => {
  const countries = [COUNTRY('EG', '埃及'), COUNTRY('CN', '中国'), COUNTRY('FR', '法国')]
  const dests = [
    DEST('eg1', 'EG'), DEST('eg2', 'EG'), DEST('eg3', 'EG'),
    DEST('cn1', 'CN'), DEST('cn2', 'CN'),
    DEST('fr1', 'FR'),
  ]

  it('空足迹 → 空数组(无信号不推荐)', () => {
    assert.deepEqual(buildCountryRecommendations(countries, dests, []), [])
  })

  it('动量排序:已探索多的国家居首,reason 含计数', () => {
    // EG 已探索 2 → EG 动量 2.4+剩余1×0.5;CN 已探索 1 → 1.2+1
    const rec = buildCountryRecommendations(countries, dests, ['eg1', 'eg2'])
    assert.equal(rec[0]!.country.id, 'EG')
    assert.equal(rec[0]!.reason, '你已探索过 2 处埃及目的地')
    assert.equal(rec.length, 3)
  })

  it('探索完的国家被排除(EG 3 处全部探索 → 不出现)', () => {
    const rec = buildCountryRecommendations(countries, dests, ['eg1', 'eg2', 'eg3'])
    const ids = rec.map((r) => r.country.id)
    assert.ok(!ids.includes('EG'), '探索完的国家不应推荐')
    assert.ok(ids.includes('CN'), '有剩余的 CN 应推荐')
  })

  it('显式 exclude 排除', () => {
    const rec = buildCountryRecommendations(countries, dests, ['eg1'], ['CN'])
    const ids = rec.map((r) => r.country.id)
    assert.ok(!ids.includes('CN'))
    assert.ok(ids.includes('FR') || ids.includes('EG'))
  })

  it('limit 生效', () => {
    const rec = buildCountryRecommendations(countries, dests, ['eg1'], [], 1)
    assert.equal(rec.length, 1)
  })
})
