import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import Fuse from 'fuse.js'
import type { City, Collection, Country, Destination, Person } from '../domain/types'
import { DESTINATION_TYPE_LABELS } from '../domain/types.ts'
import type { WorldData } from '../services/data-service'
import { loadJson, saveJson } from '../services/storage-service.ts'

export type SelectionPanel =
  | { kind: 'none' }
  | { kind: 'country'; countryId: string }
  | { kind: 'city'; cityId: string }
  | { kind: 'destination'; destinationId: string }
  | { kind: 'collection'; collectionId: string }
  | { kind: 'person'; personId: string }

/** 合集镜头巡游状态(V4.5):沿收录顺序逐站飞行;定时推进由 TourHud 负责。
 *  V5.0 支持自定义巡游:stops 为目的地 id 序列(如「生成我的巡游」),title 为航线名 */
export interface TourState {
  collectionId: string
  /** 当前站(0 起) */
  index: number
  /** 暂停:飞行被打断或用户手动暂停时置真,恢复时重飞当前航段 */
  paused: boolean
  /** 每站停留时长(ms),可调并持久化 */
  dwellMs: number
  /** 自定义巡游的目的地 id 序列(存在时 tourCollection 为合成合集) */
  stops?: string[]
  /** 自定义巡游航线名 */
  title?: string
}

/** 巡游航段固定时长(秒):电影感匀速节奏,不随距离跳动 */
const TOUR_LEG_DURATION = 6

/** 停留时长默认值(每站落地后的阅读时间) */
export const TOUR_DWELL_DEFAULT = 8_000

/** 镜头意图(引擎 FlyTarget 的 store 侧形态) */
export interface PendingFlight {
  longitude: number
  latitude: number
  height: number
  /** 航段时长(秒),缺省由引擎按距离决定 */
  duration?: number
}

export interface SearchHit {
  id: string
  kind: 'country' | 'destination' | 'city' | 'person' | 'collection'
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
    /** 进行中的镜头巡游(null = 未在巡游) */
    tour: null as TourState | null,
    /** 选中流的镜头意图:面板打开前引擎先飞往该目标 */
    pendingFlight: null as PendingFlight | null,
    /** 探索历史(最近 12 个目的地,本地持久化) */
    recentIds: sanitizeList(loadJson<unknown>('recent', [])),
    /** 已探索足迹(单调累计的去重目的地,本地持久化;V4.5 探索进度) */
    exploredIds: sanitizeList(loadJson<unknown>('explored', [])),
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
    /** 巡游合集 */
    tourCollection(): Collection | null {
      const t = this.tour
      if (!t) return null
      // 自定义巡游(「生成我的巡游」):由 stops 合成临时合集,复用巡游全套管线
      if (t.stops) {
        return {
          id: t.collectionId,
          name: t.title ?? '我的巡游',
          nameEn: 'My Tour',
          curatorNote: '',
          destinationIds: t.stops,
        }
      }
      return this.collectionById.get(t.collectionId) ?? null
    },
    /** 巡游站点序列 */
    tourStops(): Destination[] {
      const c = this.tourCollection
      return c ? this.collectionDestinations(c) : []
    },
    /** 巡游当前站 */
    tourCurrent(): Destination | null {
      return this.tour ? (this.tourStops[this.tour.index] ?? null) : null
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

    // ---- 合集镜头巡游(V4.5 雏形) ----

    /** 开始巡游:从第一站起飞(复用 selectDestination 的飞行/面板/历史管线) */
    startTour(collectionId: string) {
      if (this.tour?.collectionId === collectionId) return
      const collection = this.collectionById.get(collectionId)
      if (!collection) return
      const stops = this.collectionDestinations(collection)
      if (stops.length < 2) return
      this.tour = {
        collectionId,
        index: 0,
        paused: false,
        dwellMs: loadJson<number>('tour-dwell', TOUR_DWELL_DEFAULT),
      }
      const first = stops[0]
      if (first) this.flyToTourStop(first)
    },

    /** 调整每站停留时长并持久化(立即生效于下一站) */
    setTourDwell(ms: number) {
      if (!this.tour) return
      this.tour.dwellMs = ms
      saveJson('tour-dwell', ms)
    },

    /** 跳转指定站(显式导航会解除暂停) */
    goToTourStop(index: number) {
      const tour = this.tour
      if (!tour) return
      const stops = this.tourStops
      const i = Math.max(0, Math.min(index, stops.length - 1))
      const dest = stops[i]
      if (!dest) return
      tour.index = i
      tour.paused = false
      this.flyToTourStop(dest)
    },

    /** 下一站;末站之后自动结束巡游 */
    nextTourStop() {
      if (!this.tour) return
      const next = this.tour.index + 1
      if (next >= this.tourStops.length) {
        this.stopTour()
      } else {
        this.goToTourStop(next)
      }
    },

    /** 上一站(首站无动作) */
    prevTourStop() {
      if (!this.tour || this.tour.index <= 0) return
      this.goToTourStop(this.tour.index - 1)
    },

    /** 暂停(用户打断飞行时由接线层调用) */
    pauseTour() {
      if (this.tour) this.tour.paused = true
    },

    /** 恢复:重飞当前航段,继续由 TourHud 倒计时推进 */
    resumeTour() {
      const tour = this.tour
      if (!tour || !tour.paused) return
      tour.paused = false
      const dest = this.tourStops[tour.index]
      if (dest) this.flyToTourStop(dest)
    },

    /** 结束巡游(航线由接线层随 tour 清空而移除) */
    stopTour() {
      this.tour = null
    },

    /** 生成我的巡游(V5.0):从推荐目的地构造自定义巡游(与合集巡游共用全套管线) */
    startCustomTour(title: string, destIds: string[]) {
      const stops = destIds
        .map((id) => this.destinationById.get(id))
        .filter((d): d is Destination => !!d)
        .map((d) => d.id)
      if (stops.length < 2) return
      this.tour = {
        collectionId: 'my-tour',
        index: 0,
        paused: false,
        dwellMs: loadJson<number>('tour-dwell', TOUR_DWELL_DEFAULT),
        stops,
        title,
      }
      const first = this.destinationById.get(stops[0]!)
      if (first) this.flyToTourStop(first)
    },

    /** 巡游航段起飞:与手动选中同管线,仅采用固定电影感时长 */
    flyToTourStop(dest: Destination) {
      this.selectDestination(dest.id, { duration: TOUR_LEG_DURATION })
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
    selectDestination(destinationId: string, options?: { duration?: number }) {
      const d = this.destinationById.get(destinationId)
      if (!d) return
      this.panel = { kind: 'destination', destinationId }
      this.pendingFlight = {
        longitude: d.longitude,
        latitude: d.latitude,
        height: 450_000,
        ...options,
      }
      this.recentIds = [destinationId, ...this.recentIds.filter((x) => x !== destinationId)].slice(0, 12)
      saveJson('recent', this.recentIds)
      this.exploredIds = addExplored(this.exploredIds, destinationId)
      saveJson('explored', this.exploredIds)
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

    /** 从 localStorage 重读本地态(MY WORLD 导入覆盖存储后同步内存,不整页重载) */
    reloadLocal() {
      this.recentIds = sanitizeList(loadJson<unknown>('recent', []))
      this.exploredIds = sanitizeList(loadJson<unknown>('explored', []))
    },

    /** 清空探索足迹与历史(重置数据批;MyWorld 列表由 my-world-store.resetAll 负责) */
    resetExploration() {
      this.recentIds = []
      this.exploredIds = []
      saveJson('recent', this.recentIds)
      saveJson('explored', this.exploredIds)
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

/** 已探索足迹追加(去重、单调不减;纯函数便于单测) */
export function addExplored(list: string[], id: string): string[] {
  return list.includes(id) ? list : [...list, id]
}

/** 推荐评分的质量基分(S2/A1/B0.5;buildRecommendations/buildSimilarDestinations 共用) */
function qualityBase(d: Destination): number {
  return d.quality === 'S' ? 2 : d.quality === 'A' ? 1 : 0.5
}

export interface Recommendation {
  dest: Destination
  reason: string
}

export interface CountryRecommendation {
  country: Country
  exploredCount: number
  reason: string
}

export interface CityRecommendation {
  city: City
  exploredCount: number
  unexploredCount: number
  reason: string
}

/**
 * 城市粒度推荐(V5.0 迭代二十三)— 「延伸的城」。
 * 信号:同城已探索数(动量 ×2)+ 同城剩余可看(×1.2)+ 同国探索动量(×0.6);
 * 只推荐「还有剩余可看」的城市;同城/同国均无探索信号的城市不计分;
 * reason:同城动量 > 同国延伸。
 */
export function buildCityRecommendations(
  cities: City[],
  destinations: Destination[],
  exploredIds: string[],
  excludeCityIds: string[] = [],
  limit = 3,
): CityRecommendation[] {
  if (!exploredIds.length) return []
  const exploredSet = new Set(exploredIds)
  const exclude = new Set(excludeCityIds)

  const byCity = new Map<string, Destination[]>()
  for (const d of destinations) {
    if (!d.cityId) continue
    if (!byCity.has(d.cityId)) byCity.set(d.cityId, [])
    byCity.get(d.cityId)!.push(d)
  }
  const countryExplored = new Map<string, number>()
  for (const d of destinations) {
    if (exploredSet.has(d.id)) {
      countryExplored.set(d.countryId, (countryExplored.get(d.countryId) ?? 0) + 1)
    }
  }

  const scored = cities
    .filter((c) => !exclude.has(c.id))
    .map((c) => {
      const dests = byCity.get(c.id) ?? []
      const exploredLocal = dests.filter((d) => exploredSet.has(d.id)).length
      const unexploredLocal = dests.length - exploredLocal
      const countryCount = countryExplored.get(c.countryId) ?? 0
      const score =
        exploredLocal * 2 + unexploredLocal * 1.2 + (countryCount > 0 ? 0.6 : 0)
      let reason = ''
      if (exploredLocal > 0) {
        reason = `你已逛过此城 ${exploredLocal} 处,还有 ${unexploredLocal} 处`
      } else if (countryCount > 0 && unexploredLocal > 0) {
        reason = `同国之旅的延伸`
      }
      return { city: c, exploredLocal, unexploredLocal, reason, score }
    })
    .filter((r) => r.score > 0 && r.reason !== '' && r.unexploredLocal > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ city, exploredLocal, unexploredLocal, reason }) => ({
      city,
      exploredCount: exploredLocal,
      unexploredCount: unexploredLocal,
      reason,
    }))

  return scored
}

/**
 * 国家粒度推荐(V5.0 迭代二十二)— 「下一站国度」。
 * 动量评分:同国已探索数 ×1.2(你对哪国投入多,就推荐哪国的更多目的地)
 * × 剩余可探索数 ×0.5(还有货可看);已探索完的国家排除,显式 exclude 国家也排除;
 * 足迹为空返回 [](无信号不推荐)。
 */
export function buildCountryRecommendations(
  countries: Country[],
  destinations: Destination[],
  exploredIds: string[],
  excludeCountryIds: string[] = [],
  limit = 3,
): CountryRecommendation[] {
  if (!exploredIds.length) return []
  const exploredSet = new Set(exploredIds)
  const byCountry = new Map<string, number>()
  const totals = new Map<string, number>()
  for (const d of destinations) {
    totals.set(d.countryId, (totals.get(d.countryId) ?? 0) + 1)
    if (exploredSet.has(d.id)) {
      byCountry.set(d.countryId, (byCountry.get(d.countryId) ?? 0) + 1)
    }
  }
  const excluded = new Set(excludeCountryIds)

  const scored = countries
    .filter((c) => !excluded.has(c.id))
    .map((c) => {
      const exploredCount = byCountry.get(c.id) ?? 0
      const unexplored = (totals.get(c.id) ?? 0) - exploredCount
      // 动量 × 剩余供给;探索完(或无档案)的国家 score ≤ 0 被自然过滤
      const score = unexplored > 0 && totals.get(c.id) ? exploredCount * 1.2 + unexplored * 0.5 : -1
      const reason =
        exploredCount > 0
          ? `你已探索过 ${exploredCount} 处${c.name}目的地`
          : '尚未探索的新国度'
      return { country: c, exploredCount, unexplored, reason, score }
    })
    .filter((r) => r.score > 0 && r.unexplored > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ country, exploredCount, reason }) => ({ country, exploredCount, reason }))

  return scored
}

/**
 * 相似目的地(V5.0 雏形)— 「看过这处的人也看」。
 * 以当前目的地为锚的可解释评分:质量基分(S2/A1/B0.5)+ 同合集 ×2 > 同国 ×1.5 > 同类型 ×0.8;
 * 排除当前目的地;reason 取最强信号:同合集 > 同国(带国名)> 同类型。
 * 与 buildRecommendations(足迹驱动)不同:这是内容关联,不读用户状态。
 */
export function buildSimilarDestinations(
  destinations: Destination[],
  currentId: string,
  collections: Collection[],
  countryNames: Record<string, string> = {},
  limit = 3,
): Recommendation[] {
  const current = destinations.find((d) => d.id === currentId)
  if (!current) return []
  const currentCollections = new Set(
    collections.filter((c) => c.destinationIds.includes(currentId)).map((c) => c.id),
  )

  const scored = destinations
    .filter((d) => d.id !== currentId)
    .map((d) => {
      const shared = collections.filter(
        (c) => currentCollections.has(c.id) && c.destinationIds.includes(d.id),
      )
      const score =
        qualityBase(d) +
        shared.length * 2 +
        (d.countryId === current.countryId ? 1.5 : 0) +
        (d.type === current.type ? 0.8 : 0)
      const countryName = countryNames[d.countryId]
      const reason =
        shared.length >= 1
          ? `同属合集《${shared[0]!.name}》`
          : d.countryId === current.countryId && countryName
            ? `同在${countryName}`
            : `同为${DESTINATION_TYPE_LABELS[d.type]}`
      return { dest: d, reason, score }
    })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ dest, reason }) => ({ dest, reason }))
}

/**
 * 探索推荐(V5.0 雏形)— 足迹驱动的「你可能想去」。
 * 可解释评分:基础质量(S2/A1/B0.5)+ 同国已探索 ×1.5 + 同类型 ×0.8 + 含已探索成员的合集 ×1.2;
 * 排除已探索/收藏/想去/去过;足迹为空或池空返回 []。
 * reason 取最强信号:同国(带国名)> 同合集 > 同类型。
 */
export function buildRecommendations(
  destinations: Destination[],
  exploredIds: string[],
  collections: Collection[],
  countryNames: Record<string, string> = {},
  excludeIds: string[] = [],
  limit = 3,
): Recommendation[] {
  const exclude = new Set([...exploredIds, ...excludeIds])
  const pool = destinations.filter((d) => !exclude.has(d.id))
  const exploredSet = new Set(exploredIds)
  if (!exploredSet.size || !pool.length) return []

  const countryCount = new Map<string, number>()
  const typeCount = new Map<string, number>()
  for (const id of exploredIds) {
    const d = destinations.find((x) => x.id === id)
    if (!d) continue
    countryCount.set(d.countryId, (countryCount.get(d.countryId) ?? 0) + 1)
    typeCount.set(d.type, (typeCount.get(d.type) ?? 0) + 1)
  }

  // destId → 含已探索成员的合集
  const collectionOf = new Map<string, Collection[]>()
  for (const c of collections) {
    if (!c.destinationIds.some((id) => exploredSet.has(id))) continue
    for (const id of c.destinationIds) {
      collectionOf.set(id, [...(collectionOf.get(id) ?? []), c])
    }
  }

  const scored = pool.map((d) => {
    const sameCountry = countryCount.get(d.countryId) ?? 0
    const sameType = typeCount.get(d.type) ?? 0
    const shared = (collectionOf.get(d.id) ?? []).length
    const score =
      qualityBase(d) +
      sameCountry * 1.5 +
      sameType * 0.8 +
      shared * 1.2
    const countryName = countryNames[d.countryId]
    const reason =
      sameCountry >= 1 && countryName
        ? `同在${countryName}`
        : shared >= 1
          ? `同属合集《${collectionOf.get(d.id)![0]!.name}》`
          : `同为${DESTINATION_TYPE_LABELS[d.type]}`
    return { dest: d, reason, score }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ dest, reason }) => ({ dest, reason }))
}

/** 全局搜索(Fuse.js 模糊匹配,中/英/别名) */
export function useSearchIndex(getSrc: () => {
  countries: Country[]
  cities: City[]
  destinations: Destination[]
  people?: Person[]
  collections?: Collection[]
}) {
  const items = computed<SearchHit[]>(() => {
    const { countries, cities, destinations, people = [], collections = [] } = getSrc()
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
      ...collections.map((c) => ({
        id: `collection:${c.id}`,
        kind: 'collection' as const,
        name: c.name,
        nameEn: c.nameEn,
        detail: `主题合集 · ${c.destinationIds.length} 站`,
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
