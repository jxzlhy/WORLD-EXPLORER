import type { City, Collection, Country, DataManifest, Destination, Person } from '../domain/types'
import { isStringArray } from './data-validator'

/**
 * 数据服务 — 从本地静态 JSON 加载领域数据。
 * 原则:前端永远不直接请求外部 API,一切数据已在构建前本地化。
 * 运行时校验:不符合结构的记录被剔除并明确报告(I-09),不静默展示坏数据。
 */
export interface WorldData {
  countries: Country[]
  cities: City[]
  destinations: Destination[]
  collections?: Collection[]
  people?: Person[]
  /** 校验报告(开发态 console.warn + 调试钩子可见) */
  issues: string[]
}

let cachedData: WorldData | null = null

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`数据加载失败 ${res.status}: ${url}`)
  }
  return (await res.json()) as T
}

function validCountry(c: unknown, i: number, issues: string[]): c is Country {
  const r = c as Country
  if (typeof r?.id !== 'string' || r.id.length !== 2) {
    issues.push(`countries[${i}]:id 缺失或非 ISO2`)
    return false
  }
  if (typeof r?.name !== 'string' || typeof r?.nameEn !== 'string') {
    issues.push(`countries[${i}](${r.id}):名称字段缺失`)
    return false
  }
  return true
}

function validCity(c: unknown, i: number, issues: string[]): c is City {
  const r = c as City
  if (typeof r?.id !== 'string') {
    issues.push(`cities[${i}]:id 缺失`)
    return false
  }
  if (
    typeof r?.longitude !== 'number' ||
    typeof r?.latitude !== 'number' ||
    Math.abs(r.latitude) > 90 ||
    Math.abs(r.longitude) > 180
  ) {
    issues.push(`cities[${i}](${r.id}):坐标非法`)
    return false
  }
  return true
}

function validDestination(d: unknown, i: number, issues: string[]): d is Destination {
  const r = d as Destination
  if (typeof r?.id !== 'string' || !r.id) {
    issues.push(`destinations[${i}]:id 缺失`)
    return false
  }
  if (
    typeof r?.longitude !== 'number' ||
    typeof r?.latitude !== 'number' ||
    Number.isNaN(r.longitude) ||
    Number.isNaN(r.latitude) ||
    Math.abs(r.latitude) > 90 ||
    Math.abs(r.longitude) > 180
  ) {
    issues.push(`destinations[${i}](${r.id}):坐标非法`)
    return false
  }
  if (typeof r?.countryId !== 'string' || r.countryId.length !== 2) {
    issues.push(`destinations[${i}](${r.id}):countryId 非法`)
    return false
  }
  if (typeof r?.summary !== 'string' || !isStringArray(r?.story)) {
    issues.push(`destinations[${i}](${r.id}):内容字段缺失`)
    return false
  }
  if (r.media && r.media.status === 'verified' && !r.media.file) {
    issues.push(`destinations[${i}](${r.id}):verified 媒体缺少文件路径,已降级为示意图`)
    r.media = { status: 'placeholder' }
  }
  return true
}

function dedupeById<T extends { id: string }>(items: T[], issues: string[], kind: string): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of items) {
    if (seen.has(item.id)) {
      issues.push(`${kind}:重复 id「${item.id}」已忽略`)
      continue
    }
    seen.add(item.id)
    out.push(item)
  }
  return out
}

export async function loadWorldData(): Promise<WorldData> {
  if (cachedData) return cachedData

  const manifest = await fetchJson<DataManifest>('/data/manifest.json')
  const issues: string[] = []
  const [countriesRaw, ...cityAndDestLists] = await Promise.all([
    fetchJson<unknown[]>(manifest.countriesFile),
    ...[...manifest.citiesFiles, ...manifest.destinationFiles].map((f) =>
      fetchJson<unknown[]>(f),
    ),
  ])

  const countryList = (Array.isArray(countriesRaw) ? countriesRaw : [])
    .filter((c, i) => validCountry(c, i, issues))
  const cityFileCount = manifest.citiesFiles.length
  const cities = dedupeById(
    cityAndDestLists
      .slice(0, cityFileCount)
      .flat()
      .filter((c, i) => validCity(c, i, issues)),
    issues,
    'cities',
  )
  const destinations = dedupeById(
    cityAndDestLists
      .slice(cityFileCount)
      .flat()
      .filter((d, i) => validDestination(d, i, issues)),
    issues,
    'destinations',
  )

  // 关联完整性:目的地引用的国家/城市必须存在
  const countryIds = new Set(countryList.map((c) => c.id))
  const cityIds = new Set(cities.map((c) => c.id))
  for (const d of destinations) {
    if (!countryIds.has(d.countryId)) {
      issues.push(`destinations(${d.id}):引用了不存在的国家 ${d.countryId}`)
    }
    if (d.cityId && !cityIds.has(d.cityId)) {
      issues.push(`destinations(${d.id}):引用了不存在的城市 ${d.cityId}`)
    }
  }

  // 主题合集(可选文件):剔除失效引用并报告
  let collections: Collection[] | undefined
  if (manifest.collectionsFile) {
    try {
      const raw = await fetchJson<Collection[]>(manifest.collectionsFile)
      const destIds = new Set(destinations.map((d) => d.id))
      collections = (Array.isArray(raw) ? raw : []).filter((c) => {
        if (typeof c?.id !== 'string' || !Array.isArray(c?.destinationIds)) {
          issues.push(`collections:结构不合法被跳过`)
          return false
        }
        const before = c.destinationIds.length
        c.destinationIds = c.destinationIds.filter((id) => destIds.has(id))
        if (c.destinationIds.length < before) {
          issues.push(`collections(${c.id}):剔除 ${before - c.destinationIds.length} 个未知目的地`)
        }
        return c.destinationIds.length > 0
      })
    } catch (err) {
      issues.push(`collections 加载失败:${String(err)}`)
    }
  }

  // 人物档案(可选文件):剔除失效关联并报告
  let people: Person[] | undefined
  if (manifest.peopleFile) {
    try {
      const raw = await fetchJson<Person[]>(manifest.peopleFile)
      const destIds = new Set(destinations.map((d) => d.id))
      people = (Array.isArray(raw) ? raw : []).filter((p) => {
        if (typeof p?.id !== 'string' || !Array.isArray(p?.story)) {
          issues.push(`people:结构不合法被跳过`)
          return false
        }
        p.relatedDestinationIds = (p.relatedDestinationIds ?? []).filter((id) => destIds.has(id))
        return true
      })
    } catch (err) {
      issues.push(`people 加载失败:${String(err)}`)
    }
  }

  if (issues.length) {
    console.warn(`[WorldExplorer] 数据校验发现 ${issues.length} 个问题:`, issues)
  }
  if (import.meta.env.DEV) {
    ;(window as unknown as Record<string, unknown>).__WE_DATA_ISSUES__ = issues
  }

  cachedData = { countries: countryList, cities, destinations, collections, people, issues }
  return cachedData
}
