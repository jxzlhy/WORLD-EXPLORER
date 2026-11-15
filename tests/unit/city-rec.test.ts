/**
 * 城市推荐单元测试 — buildCityRecommendations 纯函数(V5.0 迭代二十三)
 * 覆盖:同城动量 reason、同国延伸回退、探索完的城市排除、空足迹、limit。
 */
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { buildCityRecommendations } from '../../src/stores/explore-store.ts'
import type { City, Destination } from '../../src/domain/types.ts'

const CITY = (id: string, countryId: string): City => ({
  id, name: id, nameEn: id, countryId, longitude: 0, latitude: 0, summary: '',
})
const DEST = (id: string, cityId: string | null, countryId: string): Destination => ({
  id, name: id, nameEn: id, type: 'heritage', countryId, longitude: 0, latitude: 0,
  summary: 's', story: ['a'], tags: ['t'], sources: [], quality: 'S', updatedAt: '2026-11-15',
  ...(cityId ? { cityId } : {}),
})

describe('buildCityRecommendations — 延伸的城', () => {
  const cities = [CITY('jp-kyoto', 'JP'), CITY('jp-osaka', 'JP'), CITY('fr-paris', 'FR')]
  const dests = [
    DEST('k1', 'jp-kyoto', 'JP'),
    DEST('k2', 'jp-kyoto', 'JP'),
    DEST('k3', 'jp-kyoto', 'JP'),
    DEST('o1', 'jp-osaka', 'JP'),
    DEST('p1', 'fr-paris', 'FR'),
  ]

  it('空足迹 → 空数组', () => {
    assert.deepEqual(buildCityRecommendations(cities, dests, []), [])
  })

  it('同城动量居首:逛 2 剩 1 → reason 含计数;无信号的巴黎被过滤', () => {
    // 京都逛 2 剩 1:动量 4 + 剩余 1.2 = 5.2;大阪 0 动量 → 剩余 1.2 + 同国 0.6 = 1.8;巴黎 0 分被滤
    const rec = buildCityRecommendations(cities, dests, ['k1', 'k2'])
    assert.equal(rec[0]!.city.id, 'jp-kyoto')
    assert.ok(rec[0]!.reason.includes('你已逛过此城 2 处,还有 1 处'))
    assert.equal(rec.length, 2)
    const ids = rec.map((r) => r.city.id)
    assert.ok(!ids.includes('fr-paris'), '无信号城市不推荐')
  })

  it('探索完的城市被排除(京都 3 处全逛 → 不出现)', () => {
    const rec = buildCityRecommendations(cities, dests, ['k1', 'k2', 'k3'])
    const ids = rec.map((r) => r.city.id)
    assert.ok(!ids.includes('jp-kyoto'), '全逛完的城市不应推荐')
    assert.ok(ids.includes('jp-osaka'), '同国延伸的大阪应出现')
    assert.ok(rec.find((r) => r.city.id === 'jp-osaka')!.reason.includes('同国之旅的延伸'))
  })

  it('无信号城市不计分(巴黎无足迹无同国动量 → 不出现)', () => {
    const rec = buildCityRecommendations(cities, dests, ['k1'])
    const ids = rec.map((r) => r.city.id)
    assert.ok(!ids.includes('fr-paris'), '无信号城市不推荐')
  })

  it('limit 生效', () => {
    const rec = buildCityRecommendations(cities, dests, ['k1'], [], 1)
    assert.equal(rec.length, 1)
  })
})
