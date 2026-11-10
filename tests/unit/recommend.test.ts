/**
 * 探索推荐单元测试 — buildRecommendations 纯函数(V5.0 雏形)
 * 覆盖:同国优先与 reason、排除已探索/收藏/想去、空足迹、limit、同合集 reason。
 */
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { buildRecommendations } from '../../src/stores/explore-store.ts'
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
  updatedAt: '2026-11-09',
})

const COLL = (id: string, ids: string[]): Collection => ({
  id,
  name: `合集${id}`,
  nameEn: id,
  curatorNote: '',
  destinationIds: ids,
})

describe('buildRecommendations — 探索推荐', () => {
  const dests = [
    DEST('eg-luxor', 'EG', 'S'),
    DEST('eg-abu', 'EG', 'A'),
    DEST('cn-wall', 'CN', 'S'),
    DEST('fr-eiffel', 'FR', 'A'),
    DEST('jp-fuji', 'JP', 'A', 'natural'),
  ]
  const countries = { EG: '埃及', CN: '中国', FR: '法国', JP: '日本' }

  it('足迹空 → 空数组', () => {
    assert.deepEqual(buildRecommendations(dests, [], [], countries), [])
  })

  it('同国已探索 ×1.5 压过 S 级基础分,reason 为「同在埃及」', () => {
    // 足迹:eg-abu(埃及,A)→ eg-luxor(埃及,S)获同国 1.5 + S 2 = 3.5 居首
    const rec = buildRecommendations(dests, ['eg-abu'], [], countries)
    assert.equal(rec[0]!.dest.id, 'eg-luxor')
    assert.equal(rec[0]!.reason, '同在埃及')
    assert.equal(rec.length, 3)
    assert.ok(!rec.some((r) => r.dest.id === 'eg-abu'), '已探索不出现在推荐')
  })

  it('已探索/收藏/想去/去过全部排除', () => {
    const rec = buildRecommendations(dests, ['eg-x', 'eg-luxor'], [], countries, ['eg-abu'])
    const ids = rec.map((r) => r.dest.id)
    assert.ok(!ids.includes('eg-luxor'), '已探索不应出现')
    assert.ok(!ids.includes('eg-abu'), 'excludeIds 不应出现')
    assert.ok(ids.includes('cn-wall'))
  })

  it('同合集 reason(足迹仅含合集成员,无同国信号)', () => {
    const colls = [COLL('ancient', ['eg-x', 'jp-fuji'])]
    const rec = buildRecommendations(dests, ['eg-x'], colls, countries)
    const fuji = rec.find((r) => r.dest.id === 'jp-fuji')
    assert.ok(fuji, 'jp-fuji 应入榜(同合集 +1.2)')
    assert.equal(fuji.reason, '同属合集《合集ancient》')
  })

  it('limit 生效', () => {
    const rec = buildRecommendations(dests, ['eg-x'], [], countries, [], 2)
    assert.equal(rec.length, 2)
  })

  it('全部排除后返回空', () => {
    const rec = buildRecommendations(
      dests,
      ['eg-x'],
      [],
      countries,
      dests.map((d) => d.id),
    )
    assert.deepEqual(rec, [])
  })
})
