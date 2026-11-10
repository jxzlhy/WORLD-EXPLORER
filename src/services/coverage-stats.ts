import type { Collection, Destination, Person } from '../domain/types'

/**
 * 数据覆盖统计(V5.0 数据质量监控雏形)— 纯函数,node 可测。
 * 输入全部数据集,输出:质量分级、照片/时间轴/人物关联覆盖、合集覆盖、按国矩阵。
 * 事实口径:
 * - 照片覆盖 = media.status === 'verified' 的目的地数;
 * - 时间轴覆盖 = timeline?.length > 0 的目的地数;
 * - 人物关联覆盖 = 至少关联一位人物的目的地数;
 * - 合集成员的 verified/timeline 按成员目的地实时口径统计(剔除失效引用)。
 */

export interface CountryCoverage {
  countryId: string
  total: number
  verified: number
  timeline: number
}

export interface CollectionCoverage {
  id: string
  name: string
  members: number
  verified: number
  timeline: number
}

export interface CoverageStats {
  total: number
  byQuality: { S: number; A: number; B: number }
  verifiedPhotos: number
  timelineCount: number
  peopleCount: number
  peopleLinked: number
  collections: CollectionCoverage[]
  byCountry: CountryCoverage[]
  /** 照片覆盖率(0-100 整数) */
  photoPct: number
}

export function buildCoverageStats(
  destinations: Destination[],
  people: Person[],
  collections: Collection[],
): CoverageStats {
  const byQuality: CoverageStats['byQuality'] = { S: 0, A: 0, B: 0 }
  let verifiedPhotos = 0
  let timelineCount = 0
  const countryMap = new Map<string, CountryCoverage>()

  for (const d of destinations) {
    const q = d.quality === 'S' ? 'S' : d.quality === 'A' ? 'A' : 'B'
    byQuality[q]++
    const hasPhoto = d.media?.status === 'verified'
    const hasTimeline = (d.timeline?.length ?? 0) > 0
    if (hasPhoto) verifiedPhotos++
    if (hasTimeline) timelineCount++

    let row = countryMap.get(d.countryId)
    if (!row) {
      row = { countryId: d.countryId, total: 0, verified: 0, timeline: 0 }
      countryMap.set(d.countryId, row)
    }
    row.total++
    if (hasPhoto) row.verified++
    if (hasTimeline) row.timeline++
  }

  const linkedIds = new Set<string>()
  for (const p of people) {
    for (const id of p.relatedDestinationIds) linkedIds.add(id)
  }
  const peopleLinked = destinations.filter((d) => linkedIds.has(d.id)).length

  const collectionRows = collections.map((c) => {
    const members = c.destinationIds
      .map((id) => destinations.find((d) => d.id === id))
      .filter((d): d is Destination => !!d)
    return {
      id: c.id,
      name: c.name,
      members: members.length,
      verified: members.filter((d) => d.media?.status === 'verified').length,
      timeline: members.filter((d) => (d.timeline?.length ?? 0) > 0).length,
    }
  })

  return {
    total: destinations.length,
    byQuality,
    verifiedPhotos,
    timelineCount,
    peopleCount: people.length,
    peopleLinked,
    collections: collectionRows,
    byCountry: [...countryMap.values()].sort((a, b) => b.total - a.total),
    photoPct: destinations.length
      ? Math.round((verifiedPhotos / destinations.length) * 100)
      : 0,
  }
}
