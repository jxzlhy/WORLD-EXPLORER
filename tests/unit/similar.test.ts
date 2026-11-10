/**
 * 相似目的地单元测试 — buildSimilarDestinations 纯函数(V5.0 雏形)
 * 覆盖:同合集优先与 reason、排除自身、同国/同类型回退、limit、锚点不存在。
 */
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { buildSimilarDestinations } from '../../src/stores/explore-store.ts'
import type { Collection, Destination } from '../../src/domain/types.ts'

const DEST = (id: string, countryId: string, quality: 'S' | 'A', type = 'heritage'): Destination => ({
  id,
  name: id,
  nameEn: id,
  type: type as Destination['type'],
  countryId,
  longitude: 0,
  latitude: 0,
  summary: 's',
  story: ['a'],
  tags: ['t'],
  sources: [],
  quality,
  updatedAt: '2026-11-11',
})

const COLL = (id: string, ids: string[]): Collection => ({
  id,
  name: `合集${id}`,
  nameEn: id,
  curatorNote: '',
  destinationIds: ids,
})

describe('buildSimilarDestinations — 相似目的地', () => {
  const dests = [
    DEST('eg-giza', 'EG', 'S'),
    DEST('eg-abu', 'EG', 'A'),
    DEST('cn-wall', 'CN', 'S'),
    DEST('jp-fuji', 'JP', 'A', 'natural'),
    DEST('it-colosseum', 'IT', 'S'),
  ]
  const countries = { EG: '埃及', CN: '中国', JP: '日本', IT: '意大利' }

  it('锚点不存在 → 空数组', () => {
    assert.deepEqual(buildSimilarDestinations(dests, 'ghost', [], countries), [])
  })

  it('同合集 ×2 压过同国 ×1.5,reason 取「同属合集」', () => {
    const colls = [COLL('ancient', ['eg-giza', 'cn-wall', 'it-colosseum'])]
    const rec = buildSimilarDestinations(dests, 'eg-giza', colls, countries)
    // cn-wall:合集2+S2 = 4 > eg-abu:同国1.5+A1 = 2.5 > it-colosseum 4 同分(数据序)
    assert.equal(rec[0]!.dest.id, 'cn-wall')
    assert.equal(rec[0]!.reason, '同属合集《合集ancient》')
    assert.equal(rec.length, 3)
    assert.ok(!rec.some((r) => r.dest.id === 'eg-giza'), '排除锚点自身')
  })

  it('无合集时回退同国(带国名)', () => {
    const rec = buildSimilarDestinations(dests, 'eg-giza', [], countries)
    assert.equal(rec[0]!.dest.id, 'eg-abu')
    assert.equal(rec[0]!.reason, '同在埃及')
  })

  it('同类型回退 reason(无合集无同国)', () => {
    // 锚 jp-fuji(heritage,A):同类型候选 eg-giza/cn-wall/it-colosseum 各 S2+0.8=2.8,
    // 平分按数据序,eg-giza 居首;reason 回退为「同为世界遗产」
    const rec = buildSimilarDestinations(dests, 'jp-fuji', [], countries)
    assert.equal(rec[0]!.dest.id, 'eg-giza')
    assert.equal(rec[0]!.reason, '同为世界遗产')
  })

  it('limit 生效', () => {
    const rec = buildSimilarDestinations(dests, 'eg-giza', [], countries, 2)
    assert.equal(rec.length, 2)
  })
})
