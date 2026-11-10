/**
 * 数据覆盖统计单元测试 — buildCoverageStats 纯函数(V5.0 数据质量监控雏形)
 * 覆盖:分级计数、照片/时间轴/人物关联口径、按国矩阵排序、合集成员实时统计(剔除失效引用)、空输入。
 */
import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { buildCoverageStats } from '../../src/services/coverage-stats.ts'
import type { Collection, Destination, Person } from '../../src/domain/types.ts'

const DEST = (
  id: string,
  countryId: string,
  quality: 'S' | 'A',
  opts: { photo?: boolean; timeline?: boolean } = {},
): Destination => ({
  id,
  name: id,
  nameEn: id,
  type: 'heritage',
  countryId,
  longitude: 0,
  latitude: 0,
  summary: 's',
  story: ['a'],
  tags: ['t'],
  sources: [],
  quality,
  updatedAt: '2026-11-11',
  ...(opts.photo ? { media: { status: 'verified', file: `/media/${id}.jpg` } } : {}),
  ...(opts.timeline ? { timeline: [{ year: 1900, text: 'x' }] } : {}),
})

const PERSON = (id: string, related: string[]): Person => ({
  id,
  name: id,
  nameEn: id,
  roles: ['r'],
  summary: 's',
  story: ['a'],
  relatedDestinationIds: related,
  sources: [],
  quality: 'A',
})

const COLL = (id: string, ids: string[]): Collection => ({
  id,
  name: `合集${id}`,
  nameEn: id,
  curatorNote: '',
  destinationIds: ids,
})

describe('buildCoverageStats — 数据覆盖统计', () => {
  const dests = [
    DEST('eg-giza', 'EG', 'S', { photo: true, timeline: true }),
    DEST('eg-abu', 'EG', 'A', { photo: true }),
    DEST('cn-wall', 'CN', 'S', { timeline: true }),
    DEST('fr-x', 'FR', 'A'),
  ]
  const people = [PERSON('p1', ['eg-giza']), PERSON('p2', ['eg-giza', 'missing-id'])]
  const colls = [COLL('c1', ['eg-giza', 'cn-wall', 'ghost-id'])]

  it('总数 / 分级计数', () => {
    const s = buildCoverageStats(dests, people, colls)
    assert.equal(s.total, 4)
    assert.deepEqual(s.byQuality, { S: 2, A: 2, B: 0 })
  })

  it('照片/时间轴/人物关联口径', () => {
    const s = buildCoverageStats(dests, people, colls)
    assert.equal(s.verifiedPhotos, 2)
    assert.equal(s.timelineCount, 2)
    assert.equal(s.photoPct, 50)
    // p2 的 missing-id 是失效引用,关联目的地仍只计 eg-giza 一处
    assert.equal(s.peopleLinked, 1)
    assert.equal(s.peopleCount, 2)
  })

  it('按国矩阵:按目的地数降序', () => {
    const s = buildCoverageStats(dests, people, colls)
    assert.deepEqual(
      s.byCountry.map((r) => [r.countryId, r.total, r.verified, r.timeline]),
      [
        ['EG', 2, 2, 1],
        ['CN', 1, 0, 1],
        ['FR', 1, 0, 0],
      ],
    )
  })

  it('合集成员实时统计并剔除失效引用', () => {
    const s = buildCoverageStats(dests, people, colls)
    assert.equal(s.collections.length, 1)
    assert.deepEqual(
      { members: s.collections[0]!.members, verified: s.collections[0]!.verified, timeline: s.collections[0]!.timeline },
      { members: 2, verified: 1, timeline: 2 },
    )
  })

  it('空输入 → 全零,photoPct 不产生 NaN', () => {
    const s = buildCoverageStats([], [], [])
    assert.equal(s.total, 0)
    assert.equal(s.photoPct, 0)
    assert.deepEqual(s.byCountry, [])
  })
})
