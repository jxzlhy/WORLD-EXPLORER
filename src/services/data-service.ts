import type { City, Country, DataManifest, Destination } from '../domain/types'

/**
 * 数据服务 — 从本地静态 JSON 加载领域数据。
 * 原则:前端永远不直接请求外部 API,一切数据已在构建前本地化。
 */
export interface WorldData {
  countries: Country[]
  cities: City[]
  destinations: Destination[]
}

let cachedData: WorldData | null = null

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`数据加载失败 ${res.status}: ${url}`)
  }
  return (await res.json()) as T
}

export async function loadWorldData(): Promise<WorldData> {
  if (cachedData) return cachedData

  const manifest = await fetchJson<DataManifest>('/data/manifest.json')
  const [countries, ...cityAndDestLists] = await Promise.all([
    fetchJson<Country[]>(manifest.countriesFile),
    ...[...manifest.citiesFiles, ...manifest.destinationFiles].map((f) => fetchJson<unknown[]>(f)),
  ])

  const cityFileCount = manifest.citiesFiles.length
  const cities = cityAndDestLists.slice(0, cityFileCount).flat() as City[]
  const destinations = cityAndDestLists.slice(cityFileCount).flat() as Destination[]

  cachedData = { countries, cities, destinations }
  return cachedData
}
