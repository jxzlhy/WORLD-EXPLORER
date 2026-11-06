import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import Fuse from 'fuse.js'
import type { City, Collection, Country, Destination, Person } from '../domain/types'
import type { WorldData } from '../services/data-service'
import { loadJson, saveJson } from '../services/storage-service.ts'

export type SelectionPanel =
  | { kind: 'none' }
  | { kind: 'country'; countryId: string }
  | { kind: 'city'; cityId: string }
  | { kind: 'destination'; destinationId: string }
  | { kind: 'collection'; collectionId: string }
  | { kind: 'person'; personId: string }

export interface SearchHit {
  id: string
  kind: 'country' | 'destination' | 'city' | 'person'
  name: string
  nameEn: string
  /** 目的地别名(供 Fuse 匹配,不直接展示) */
  aliases?: string[]
  detail: string
}

/**
 * 探索状态中枢:世界数据 + 选中流(国家/目的地)+ 搜索索引。
 * 组件只读状态、调用 action,不直接触碰引擎。
 */
export const useExploreStore = defineStore('explore', {
  state: () => ({
    loaded: false,
    countries: [] as Country[],
    cities: [] as City[],
    destinations: [] as Destination[],
    collections: [] as Collection[],
    people: [] as Person[],
    panel: { kind: 'none' } as SelectionPanel,
    /** 选中流的镜头意图:面板打开前引擎先飞往该目标 */
    pendingFlight: null as { longitude: number; latitude: number; height: number } | null,
    /** 探索历史(最近 12 个目的地,本地持久化) */
    recentIds: sanitizeList(loadJson<unknown>('recent', [])),
  }),

  getters: {
    countryById(state): Record<string, Country> {
      return Object.fromEntries(state.countries.map((c) => [c.id, c]))
    },
    destinationById(state): Map<string, Destination> {
      return new Map(state.destinations.map((d) => [d.id, d]))
    },
    selectedCountry(state): Country | null {
      return state.panel.kind === 'country'
        ? (this.countryById[state.panel.countryId] ?? null)
        : null
    },
    selectedDestination(state): Destination | null {
      return state.panel.kind === 'destination'
        ? (this.destinationById.get(state.panel.destinationId) ?? null)
        : null
    },
    cityById(state): Map<string, City> {
      return new Map(state.cities.map((c) => [c.id, c]))
    },
    selectedCity(state): City | null {
      return state.panel.kind === 'city'
        ? (this.cityById.get(state.panel.cityId) ?? null)
        : null
    },
    destinationsOfCity(state): (cityId: string) => Destination[] {
      return (cityId: string) =>
        state.destinations
          .filter((d) => d.cityId === cityId)
          .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
    },
    collectionById(state): Map<string, Collection> {
      return new Map(state.collections.map((c) => [c.id, c]))
    },
    selectedCollection(state): Collection | null {
      return state.panel.kind === 'collection'
        ? (this.collectionById.get(state.panel.collectionId) ?? null)
        : null
    },
    personById(state): Map<string, Person> {
      return new Map(state.people.map((p) => [p.id, p]))
    },
    selectedPerson(state): Person | null {
      return state.panel.kind === 'person'
        ? (this.personById.get(state.panel.personId) ?? null)
        : null
    },
    /** 目的地相关人物 */
    peopleOfDestination(state): (destinationId: string) => Person[] {
      return (destinationId: string) =>
        state.people.filter((p) => p.relatedDestinationIds.includes(destinationId))
    },
    /** 人物关联目的地(剔除失效引用) */
    destinationsOfPerson(): (person: Person) => Destination[] {
      return (person: Person) =>
        person.relatedDestinationIds
          .map((id) => this.destinationById.get(id))
          .filter((d): d is Destination => !!d)
    },
    /** 合集目的地(按数据顺序,剔除失效引用) */
    collectionDestinations(): (collection: Collection) => Destination[] {
      return (collection: Collection) =>
        collection.destinationIds
          .map((id) => this.destinationById.get(id))
          .filter((d): d is Destination => !!d)
    },
    destinationsOfCountry(state): (countryId: string) => Destination[] {
      return (countryId: string) =>
        state.destinations
          .filter((d) => d.countryId === countryId)
          .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'))
    },
    citiesOfCountry(state): (countryId: string) => City[] {
      return (countryId: string) => state.cities.filter((c) => c.countryId === countryId)
    },
  },

  actions: {
    async loadData(data: WorldData) {
      this.countries = data.countries
      this.cities = data.cities
      this.destinations = data.destinations
      this.collections = data.collections ?? []
      this.people = data.people ?? []
      this.loaded = true
    },

    /** 打开合集面板(不飞行,由用户从列表选择目的地) */
    openCollection(collectionId: string) {
      if (!this.collectionById.has(collectionId)) return
      this.panel = { kind: 'collection', collectionId }
    },

    /** 打开人物档案(不飞行;关联目的地由面板内跳转) */
    openPerson(personId: string) {
      if (!this.personById.has(personId)) return
      this.panel = { kind: 'person', personId }
    },

    /** 选中国家:飞往国家中心(环绕校正的地理均值),打开国家面板 */
    selectCountry(countryId: string) {
      const country = this.countryById[countryId]
      if (!country) return
      const dests = this.destinationsOfCountry(countryId)
      const cities = this.citiesOfCountry(countryId)
      const samples = dests.length
        ? dests.map((d) => [d.longitude, d.latitude] as const)
        : cities.map((c) => [c.longitude, c.latitude] as const)
      let lon = 0
      let lat = 0
      if (samples.length) {
        // 跨日期变更线校正:以首个经度为参考归一到 ±180 连续区间再平均(I-07)
        const refLon = samples[0]![0]
        const normalized = samples.map(([x, y]) => {
          let l = x
          while (l - refLon > 180) l -= 360
          while (l - refLon < -180) l += 360
          return [l, y] as const
        })
        lon = normalized.reduce((s, [x]) => s + x, 0) / normalized.length
        lat = normalized.reduce((s, [, y]) => s + y, 0) / normalized.length
        if (lon > 180) lon -= 360
        if (lon < -180) lon += 360
      }
      this.panel = { kind: 'country', countryId }
      this.pendingFlight = { longitude: lon, latitude: lat, height: 9_500_000 }
    },

    /** 选中目的地:飞往目的地(近距离),打开档案面板,记录探索历史 */
    selectDestination(destinationId: string) {
      const d = this.destinationById.get(destinationId)
      if (!d) return
      this.panel = { kind: 'destination', destinationId }
      this.pendingFlight = { longitude: d.longitude, latitude: d.latitude, height: 450_000 }
      this.recentIds = [destinationId, ...this.recentIds.filter((x) => x !== destinationId)].slice(0, 12)
      saveJson('recent', this.recentIds)
    },

    /** 回到全球视角(探索快捷操作) */
    goHome() {
      this.panel = { kind: 'none' }
      this.pendingFlight = { longitude: 105, latitude: 30, height: 20_800_000 }
    },

    /** 选中城市:飞往城市上空并打开城市档案(V1.5 前置) */
    flyToCity(cityId: string) {
      const c = this.cityById.get(cityId)
      if (!c) return
      this.panel = { kind: 'city', cityId }
      this.pendingFlight = { longitude: c.longitude, latitude: c.latitude, height: 1_200_000 }
    },

    closePanel() {
      this.panel = { kind: 'none' }
      this.pendingFlight = null
    },

    /** 随机发现一个目的地 */
    randomDestination(): Destination | null {
      if (!this.destinations.length) return null
      const pick = this.destinations[Math.floor(Math.random() * this.destinations.length)]
      if (pick) this.selectDestination(pick.id)
      return pick ?? null
    },

    /** 今日精选:按日期确定性选取,每天同一地点 */
    todayFeatured(): Destination | null {
      if (!this.destinations.length) return null
      const day = Math.floor(Date.now() / 86_400_000)
      const pick = this.destinations[day % this.destinations.length]
      return pick ?? null
    },
  },
})

/** 近期探索列表消毒 */
function sanitizeList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

/** 全局搜索(Fuse.js 模糊匹配,中/英/别名) */
export function useSearchIndex(getSrc: () => {
  countries: Country[]
  cities: City[]
  destinations: Destination[]
  people?: Person[]
}) {
  const items = computed<SearchHit[]>(() => {
    const { countries, cities, destinations, people = [] } = getSrc()
    return [
      ...countries.map((c) => ({
        id: `country:${c.id}`,
        kind: 'country' as const,
        name: c.name,
        nameEn: c.nameEn,
        detail: c.continent,
      })),
      ...destinations.map((d) => ({
        id: `dest:${d.id}`,
        kind: 'destination' as const,
        name: d.name,
        nameEn: d.nameEn,
        aliases: d.aliases ?? [],
        detail: d.tags.slice(0, 2).join(' · '),
      })),
      ...cities.map((c) => ({
        id: `city:${c.id}`,
        kind: 'city' as const,
        name: c.name,
        nameEn: c.nameEn,
        detail: c.isCapital ? '首都' : '城市',
      })),
      ...people.map((p) => ({
        id: `person:${p.id}`,
        kind: 'person' as const,
        name: p.name,
        nameEn: p.nameEn,
        detail: p.roles[0] ?? '人物',
      })),
    ]
  })
  const fuse = new Fuse(items.value, {
    keys: [
      { name: 'name', weight: 0.42 },
      { name: 'nameEn', weight: 0.3 },
      { name: 'aliases', weight: 0.23 },
      { name: 'detail', weight: 0.05 },
    ],
    threshold: 0.38,
    ignoreLocation: true,
  })
  const query = ref('')
  const results = computed<SearchHit[]>(() => {
    const q = query.value.trim()
    if (!q) return items.value.slice(0, 8)
    return fuse.search(q).map((r) => r.item)
  })
  return { query, results }
}
