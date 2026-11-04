import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import Fuse from 'fuse.js'
import type { City, Country, Destination } from '../domain/types'
import type { WorldData } from '../services/data-service'

export type SelectionPanel =
  | { kind: 'none' }
  | { kind: 'country'; countryId: string }
  | { kind: 'destination'; destinationId: string }

export interface SearchHit {
  id: string
  kind: 'country' | 'destination' | 'city'
  name: string
  nameEn: string
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
    panel: { kind: 'none' } as SelectionPanel,
    /** 选中流的镜头意图:面板打开前引擎先飞往该目标 */
    pendingFlight: null as { longitude: number; latitude: number; height: number } | null,
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
      this.loaded = true
    },

    /** 选中国家:飞往国家中心(由城市均值估算),打开国家面板 */
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
        lon = samples.reduce((s, [x]) => s + x, 0) / samples.length
        lat = samples.reduce((s, [, y]) => s + y, 0) / samples.length
      }
      this.panel = { kind: 'country', countryId }
      this.pendingFlight = { longitude: lon, latitude: lat, height: 9_500_000 }
    },

    /** 选中目的地:飞往目的地(近距离),打开档案面板 */
    selectDestination(destinationId: string) {
      const d = this.destinationById.get(destinationId)
      if (!d) return
      this.panel = { kind: 'destination', destinationId }
      this.pendingFlight = { longitude: d.longitude, latitude: d.latitude, height: 450_000 }
    },

    /** 仅飞行至城市上空(城市暂无独立档案,详见 ROADMAP V1.5) */
    flyToCity(cityId: string) {
      const c = this.cities.find((x) => x.id === cityId)
      if (!c) return
      this.panel = { kind: 'none' }
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

/** 全局搜索(Fuse.js 模糊匹配,中/英/别名) */
export function useSearchIndex(getSrc: () => {
  countries: Country[]
  cities: City[]
  destinations: Destination[]
}) {
  const items = computed<SearchHit[]>(() => {
    const { countries, cities, destinations } = getSrc()
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
        detail: d.tags.slice(0, 2).join(' · '),
      })),
      ...cities.map((c) => ({
        id: `city:${c.id}`,
        kind: 'city' as const,
        name: c.name,
        nameEn: c.nameEn,
        detail: c.isCapital ? '首都' : '城市',
      })),
    ]
  })
  const fuse = new Fuse(items.value, {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'nameEn', weight: 0.35 },
      { name: 'detail', weight: 0.15 },
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
