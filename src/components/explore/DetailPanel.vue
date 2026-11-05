<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { useExploreStore } from '../../stores/explore-store'
import { useMyWorldStore } from '../../stores/my-world-store'
import { DESTINATION_TYPE_LABELS } from '../../domain/types'
import type { Destination } from '../../domain/types'
import GlassPanel from '../../design-system/GlassPanel.vue'
import WeTag from '../../design-system/WeTag.vue'
import WeButton from '../../design-system/WeButton.vue'
import WeEmpty from '../../design-system/WeEmpty.vue'
import DestinationMedia from '../../design-system/DestinationMedia.vue'

const explore = useExploreStore()
const myWorld = useMyWorldStore()

const destination = computed(() => explore.selectedDestination)
const country = computed(() => explore.selectedCountry)
const city = computed(() => explore.selectedCity)
const cityDestinations = computed(() =>
  city.value ? explore.destinationsOfCity(city.value.id) : [],
)
const collection = computed(() => explore.selectedCollection)
const collectionDests = computed(() =>
  collection.value ? explore.collectionDestinations(collection.value) : [],
)
/** 合集头图:优先取收录中已有已核验照片的目的地 */
const collectionHero = computed(() => {
  if (!collection.value) return null
  return collectionDests.value.find((d) => d.media?.status === 'verified') ?? null
})

/**
 * 内容交错入场(V0.3-D):档案内容切换时,子块依次浮现。
 * 尊重 prefers-reduced-motion;timeline 在切换/卸载时 kill,不留悬挂动画。
 */
const prefersReducedMotion =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
let contentTimeline: gsap.core.Timeline | null = null

watch(
  () => explore.panel,
  async (panel) => {
    if (panel.kind === 'none' || prefersReducedMotion) return
    await nextTick()
    contentTimeline?.kill()
    const el = document.querySelector('.detail-panel .scroll-area')
    if (!el) return
    contentTimeline = gsap.timeline()
    contentTimeline.fromTo(
      el.children,
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.42,
        ease: 'power2.out',
        stagger: 0.045,
        clearProps: 'transform',
      },
    )
  },
)

onUnmounted(() => {
  contentTimeline?.kill()
  contentTimeline = null
})

const typeColorMap: Record<string, string> = {
  heritage: 'var(--we-type-heritage)',
  natural: 'var(--we-type-natural)',
  landmark: 'var(--we-type-landmark)',
  museum: 'var(--we-text-dim)',
  city: 'var(--we-type-city)',
  island: 'var(--we-type-island)',
  geology: 'var(--we-type-geology)',
  observatory: 'var(--we-warning)',
}

function typeColor(d: Destination): string {
  return typeColorMap[d.type] ?? 'var(--we-type-landmark)'
}

/** ISO2 → 旗帜 Emoji(仅展示用途) */
function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)))
}

function fmtCoord(v: number, pos: string, neg: string): string {
  return `${Math.abs(v).toFixed(2)}°${v >= 0 ? pos : neg}`
}

/** 国情速览:任一事实字段存在即渲染区块 */
const hasCountryFacts = computed(
  () =>
    !!country.value &&
    (!!country.value.areaKm2 ||
      !!country.value.population ||
      !!country.value.languages?.length ||
      !!country.value.currency),
)

/** 面积:万 km² 表述(中文语境习惯) */
function fmtArea(km2: number): string {
  if (km2 >= 10000) return `约 ${(km2 / 10000).toFixed(km2 % 10000 === 0 ? 0 : 1)} 万 km²`
  return `约 ${km2.toLocaleString('zh-Hans-CN')} km²`
}

/**
 * 我的笔记:草稿跟随选中目的地切换;失焦时落盘(V0.3 已有 store 能力,本版补 UI)。
 */
const noteDraft = ref('')
const noteSaved = ref(false)
let noteSavedTimer: number | null = null

watch(
  () => explore.panel,
  () => {
    noteDraft.value =
      explore.panel.kind === 'destination'
        ? (myWorld.notes[explore.panel.destinationId] ?? '')
        : ''
    noteSaved.value = false
  },
  { immediate: true },
)

function saveNote(): void {
  if (explore.panel.kind !== 'destination') return
  myWorld.setNote(explore.panel.destinationId, noteDraft.value)
  noteSaved.value = true
  if (noteSavedTimer !== null) window.clearTimeout(noteSavedTimer)
  noteSavedTimer = window.setTimeout(() => {
    noteSaved.value = false
  }, 1600)
}

/** 人口:亿/万 两级表述 */
function fmtPopulation(p: number): string {
  if (p >= 100_000_000) return `约 ${(p / 100_000_000).toFixed(1)} 亿`
  if (p >= 10_000) return `约 ${(p / 10_000).toFixed(0)} 万`
  return `约 ${p.toLocaleString('zh-Hans-CN')}`
}
</script>

<template>
  <Transition name="panel-slide">
    <GlassPanel
      v-if="destination || country || city || collection"
      strong
      class="detail-panel"
    >
      <button
        class="close"
        aria-label="关闭面板"
        @click="explore.closePanel()"
      >
        ✕
      </button>

      <!-- ==================== 目的地档案 ==================== -->
      <template v-if="destination">
        <div
          :key="destination.id"
          class="scroll-area"
        >
          <DestinationMedia
            :id="destination.id"
            :name="destination.name"
            :type-color="typeColor(destination)"
            :media="destination.media"
          />

          <header class="head">
            <p class="we-caps-label gold">
              {{ DESTINATION_TYPE_LABELS[destination.type] }}
              <template v-if="destination.quality === 'S'">
                · S 级档案
              </template>
            </p>
            <h1 class="name">
              {{ destination.name }}
            </h1>
            <p class="en">
              {{ destination.nameEn }}
            </p>
            <div class="meta">
              <span class="mono">
                {{ fmtCoord(destination.latitude, 'N', 'S') }}
                {{ fmtCoord(destination.longitude, 'E', 'W') }}
              </span>
              <span
                v-if="explore.countryById[destination.countryId]"
                class="country-link"
                @click="explore.selectCountry(destination.countryId)"
              >
                {{ flagEmoji(destination.countryId) }}
                {{ explore.countryById[destination.countryId]!.name }}
              </span>
            </div>
          </header>

          <p class="lead">
            {{ destination.summary }}
          </p>

          <div
            class="ornament"
            aria-hidden="true"
          >
            <i /><span>✦</span><i />
          </div>

          <section class="story">
            <p
              v-for="(para, i) in destination.story"
              :key="i"
            >
              {{ para }}
            </p>
          </section>

          <div
            v-if="destination.bestSeason"
            class="season"
          >
            <span class="we-caps-label">推荐探索时间</span>
            <p>{{ destination.bestSeason }}</p>
          </div>

          <!-- 我的笔记(本地,自动保存) -->
          <div class="my-note">
            <span class="we-caps-label">我的笔记</span>
            <textarea
              v-model="noteDraft"
              class="note-input"
              rows="3"
              maxlength="500"
              placeholder="写下你的旅行计划、回忆或心愿…(自动保存,仅存本地)"
              @blur="saveNote"
            />
            <span v-if="noteSaved" class="note-saved">已保存 ✓</span>
          </div>

          <div
            v-if="destination.tags.length"
            class="tags"
          >
            <WeTag
              v-for="t in destination.tags"
              :key="t"
            >
              {{ t }}
            </WeTag>
          </div>

          <div class="actions">
            <WeButton
              variant="glass"
              size="sm"
              :class="{ 'is-on': myWorld.isFavorite(destination.id) }"
              @click="myWorld.toggleFavorite(destination.id)"
            >
              {{ myWorld.isFavorite(destination.id) ? '♥ 已收藏' : '♡ 收藏' }}
            </WeButton>
            <WeButton
              variant="glass"
              size="sm"
              :class="{ 'is-on': myWorld.isVisited(destination.id) }"
              @click="myWorld.toggleVisited(destination.id)"
            >
              ✓ 去过
            </WeButton>
            <WeButton
              variant="glass"
              size="sm"
              :class="{ 'is-on': myWorld.isWantToGo(destination.id) }"
              @click="myWorld.toggleWantToGo(destination.id)"
            >
              ⛳ 想去
            </WeButton>
          </div>

          <footer class="sources">
            <p class="we-caps-label">
              资料来源
            </p>
            <ul>
              <li
                v-for="s in destination.sources"
                :key="s.url"
              >
                <a
                  :href="s.url"
                  target="_blank"
                  rel="noopener noreferrer"
                >{{ s.name }}</a>
                <span class="license">{{ s.license }}</span>
              </li>
            </ul>
          </footer>
        </div>
      </template>

      <!-- ==================== 城市档案(V1.5 前置) ==================== -->
      <template v-else-if="city">
        <div class="scroll-area" :key="city.id">
          <header class="head">
            <p class="we-caps-label gold">
              城市
              <template v-if="city.isCapital"> · 首都</template>
            </p>
            <h1 class="name">{{ city.name }}</h1>
            <p class="en">{{ city.nameEn }}</p>
            <div class="meta">
              <span class="mono">
                {{ fmtCoord(city.latitude, 'N', 'S') }}
                {{ fmtCoord(city.longitude, 'E', 'W') }}
              </span>
              <span
                v-if="explore.countryById[city.countryId]"
                class="country-link"
                @click="explore.selectCountry(city.countryId)"
              >
                {{ flagEmoji(city.countryId) }}
                {{ explore.countryById[city.countryId]!.name }}
              </span>
            </div>
          </header>

          <p class="lead">{{ city.summary }}</p>

          <div class="ornament" aria-hidden="true"><i /><span>✦</span><i /></div>

          <section v-if="cityDestinations.length">
            <p class="we-caps-label">此地目的地 · {{ cityDestinations.length }}</p>
            <ul class="dest-list">
              <li v-for="d in cityDestinations" :key="d.id">
                <button class="dest-item" @click="explore.selectDestination(d.id)">
                  <i :style="{ background: typeColor(d) }" />
                  <span class="n">{{ d.name }}</span>
                  <span class="t">{{ DESTINATION_TYPE_LABELS[d.type] }}</span>
                </button>
              </li>
            </ul>
          </section>

          <WeEmpty
            v-else
            title="此地档案建设中"
            hint="周边目的地正在扩充,详见 ROADMAP"
          />
        </div>
      </template>

      <!-- ==================== 主题合集(V1.5) ==================== -->
      <template v-else-if="collection">
        <div class="scroll-area" :key="collection.id">
          <div v-if="collectionHero" class="collection-hero">
            <DestinationMedia
              :id="collection.id"
              :name="collectionHero.name"
              :type-color="'var(--we-type-landmark)'"
              :media="collectionHero.media"
            />
            <figcaption class="hero-caption">
              图:{{ collectionHero.name }}(收录地点)·
              {{ collectionHero.media?.author }}
            </figcaption>
          </div>
          <header class="head">
            <p class="we-caps-label gold">主题合集</p>
            <h1 class="name">{{ collection.name }}</h1>
            <p class="en">{{ collection.nameEn }}</p>
          </header>

          <p class="lead">{{ collection.curatorNote }}</p>

          <div class="ornament" aria-hidden="true"><i /><span>✦</span><i /></div>

          <section>
            <p class="we-caps-label">收录地点 · {{ collectionDests.length }}</p>
            <ul class="dest-list">
              <li v-for="d in collectionDests" :key="d.id">
                <button class="dest-item" @click="explore.selectDestination(d.id)">
                  <i :style="{ background: typeColor(d) }" />
                  <span class="n">{{ d.name }}</span>
                  <span class="t">{{ DESTINATION_TYPE_LABELS[d.type] }}</span>
                </button>
              </li>
            </ul>
          </section>
        </div>
      </template>

      <!-- ==================== 国家概览 ==================== -->
      <template v-else-if="country">
        <div
          :key="country.id"
          class="scroll-area"
        >
          <header class="head">
            <p
              class="flag"
              aria-hidden="true"
            >
              {{ flagEmoji(country.id) }}
            </p>
            <p class="we-caps-label gold">
              {{ country.continent }}
            </p>
            <h1 class="name">
              {{ country.name }}
            </h1>
            <p class="en">
              {{ country.nameEn }}
            </p>
          </header>

          <p class="lead">
            {{ country.summary }}
          </p>

          <!-- 国情速览(V1.0 国家档案充实) -->
          <dl v-if="hasCountryFacts" class="country-facts">
            <div v-if="country!.capital" class="fact">
              <dt>首都</dt>
              <dd>{{ country!.capital }}</dd>
            </div>
            <div v-if="country!.areaKm2" class="fact">
              <dt>面积</dt>
              <dd>{{ fmtArea(country!.areaKm2) }}</dd>
            </div>
            <div v-if="country!.population" class="fact">
              <dt>人口</dt>
              <dd>{{ fmtPopulation(country!.population) }}</dd>
            </div>
            <div v-if="country!.languages?.length" class="fact">
              <dt>语言</dt>
              <dd>{{ country!.languages!.join(' · ') }}</dd>
            </div>
            <div v-if="country!.currency" class="fact">
              <dt>货币</dt>
              <dd>{{ country!.currency }}</dd>
            </div>
          </dl>

          <div
            class="ornament"
            aria-hidden="true"
          >
            <i /><span>✦</span><i />
          </div>

          <section v-if="explore.citiesOfCountry(country.id).length">
            <p class="we-caps-label">
              城市
            </p>
            <div class="chips">
              <button
                v-for="c in explore.citiesOfCountry(country.id)"
                :key="c.id"
                class="chip"
                @click="explore.flyToCity(c.id)"
              >
                {{ c.name }}<em v-if="c.isCapital">首都</em>
              </button>
            </div>
          </section>

          <section v-if="explore.destinationsOfCountry(country.id).length">
            <p class="we-caps-label">
              目的地 · {{ explore.destinationsOfCountry(country.id).length }}
            </p>
            <ul class="dest-list">
              <li
                v-for="d in explore.destinationsOfCountry(country.id)"
                :key="d.id"
              >
                <button
                  class="dest-item"
                  @click="explore.selectDestination(d.id)"
                >
                  <i :style="{ background: typeColor(d) }" />
                  <span class="n">{{ d.name }}</span>
                  <span class="t">{{ DESTINATION_TYPE_LABELS[d.type] }}</span>
                </button>
              </li>
            </ul>
          </section>

          <WeEmpty
            v-if="!explore.destinationsOfCountry(country.id).length"
            title="该国档案建设中"
            hint="数据管线正在逐国扩展,详见 ROADMAP"
          />
        </div>
      </template>
    </GlassPanel>
  </Transition>
</template>

<style scoped>
.detail-panel {
  position: fixed;
  right: var(--we-sp-4);
  top: 84px;
  bottom: var(--we-sp-4);
  width: 400px;
  z-index: var(--we-z-panel);
  overflow: hidden;
}
.close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 5;
  appearance: none;
  border: 1px solid var(--we-glass-border);
  background: var(--we-well-strong);
  color: var(--we-text-dim);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  transition: all var(--we-dur-1) var(--we-ease-out);
}
.close:hover {
  color: var(--we-text-hi);
  border-color: rgba(232, 200, 150, 0.5);
}

.scroll-area {
  height: 100%;
  overflow-y: auto;
  padding: var(--we-sp-5);
  display: flex;
  flex-direction: column;
  gap: var(--we-sp-4);
  scrollbar-width: thin;
}

.head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.we-caps-label.gold {
  color: var(--we-gold);
}
.flag {
  font-size: 40px;
  margin: 0;
  line-height: 1;
}
.name {
  margin: 0;
  font-family: var(--we-serif);
  font-size: var(--we-fs-display);
  font-weight: 600;
  color: var(--we-text-hi);
  line-height: var(--we-lh-tight);
}
.en {
  margin: 0;
  color: var(--we-text-faint);
  font-size: var(--we-fs-small);
  letter-spacing: var(--we-ls-caps);
  text-transform: uppercase;
}
.meta {
  display: flex;
  align-items: center;
  gap: var(--we-sp-3);
  flex-wrap: wrap;
}
.mono {
  font-family: var(--we-mono);
  font-size: var(--we-fs-small);
  color: var(--we-cyan);
}
.country-link {
  color: var(--we-text-dim);
  font-size: var(--we-fs-small);
  cursor: pointer;
  border-bottom: 1px dashed var(--we-glass-border);
}
.country-link:hover {
  color: var(--we-text-hi);
}

.lead {
  margin: 0;
  font-size: 15px;
  line-height: var(--we-lh-loose);
  color: var(--we-text);
}

.ornament {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--we-gold-deep);
  font-size: 10px;
}
.ornament i {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(232, 200, 150, 0.35), transparent);
}

.story {
  display: flex;
  flex-direction: column;
  gap: var(--we-sp-3);
}
.story p {
  margin: 0;
  color: var(--we-text);
  line-height: var(--we-lh-loose);
  font-size: var(--we-fs-body);
  text-align: justify;
}

.season {
  border-left: 2px solid rgba(232, 200, 150, 0.4);
  padding-left: var(--we-sp-3);
}
.season p {
  margin: 4px 0 0;
  color: var(--we-text);
  font-size: var(--we-fs-body);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--we-sp-2);
}

.actions {
  display: flex;
  gap: var(--we-sp-2);
  flex-wrap: wrap;
}
.is-on {
  background: rgba(232, 200, 150, 0.18) !important;
  border-color: rgba(232, 200, 150, 0.45) !important;
  color: var(--we-gold-strong) !important;
}

.sources {
  border-top: 1px solid var(--we-glass-border);
  padding-top: var(--we-sp-3);
}
.sources p {
  margin: 0 0 6px;
}
.sources ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sources li {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: var(--we-fs-micro);
}
.sources a {
  color: var(--we-text-dim);
}
.sources a:hover {
  color: var(--we-cyan);
}
.license {
  color: var(--we-text-faint);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--we-sp-2);
  margin-top: 8px;
}
.chip {
  appearance: none;
  border: 1px solid var(--we-glass-border);
  background: var(--we-well);
  color: var(--we-text);
  border-radius: var(--we-r-full);
  padding: 5px 12px;
  font-size: var(--we-fs-small);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all var(--we-dur-1) var(--we-ease-out);
}
.chip:hover {
  border-color: rgba(111, 195, 255, 0.5);
  color: var(--we-text-hi);
}
.chip em {
  font-style: normal;
  font-size: 9px;
  color: var(--we-gold);
  border: 1px solid rgba(232, 200, 150, 0.35);
  border-radius: var(--we-r-full);
  padding: 1px 5px;
}

.my-note {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.my-note .we-caps-label {
  margin: 0;
}
.note-input {
  width: 100%;
  resize: vertical;
  min-height: 60px;
  background: var(--we-well);
  border: 1px solid var(--we-glass-border);
  border-radius: var(--we-r-sm);
  color: var(--we-text);
  font-family: var(--we-sans);
  font-size: var(--we-fs-small);
  line-height: var(--we-lh-normal);
  padding: var(--we-sp-2) var(--we-sp-3);
  outline: none;
  transition: border-color var(--we-dur-1) var(--we-ease-out);
}
.note-input:focus {
  border-color: rgba(111, 195, 255, 0.45);
}
.note-input::placeholder {
  color: var(--we-text-faint);
}
.note-saved {
  font-size: var(--we-fs-micro);
  color: var(--we-success);
  letter-spacing: 0.08em;
}

.country-facts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px var(--we-sp-4);
  margin: 0;
  padding: var(--we-sp-3) var(--we-sp-4);
  border: 1px solid var(--we-glass-border);
  border-radius: var(--we-r-md);
  background: var(--we-well);
}
.country-facts .fact dt {
  font-size: var(--we-fs-micro);
  letter-spacing: 0.14em;
  color: var(--we-text-dim);
  margin-bottom: 2px;
}
.country-facts .fact dd {
  margin: 0;
  font-size: var(--we-fs-small);
  color: var(--we-text-hi);
  font-weight: 600;
}

.collection-hero {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.hero-caption {
  font-size: var(--we-fs-micro);
  color: var(--we-text-faint);
  letter-spacing: 0.04em;
}

.dest-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dest-item {
  width: 100%;
  appearance: none;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--we-r-sm);
  cursor: pointer;
  color: var(--we-text);
  transition: background var(--we-dur-1) var(--we-ease-out);
  text-align: left;
}
.dest-item:hover {
  background: rgba(111, 195, 255, 0.08);
}
.dest-item i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: none;
}
.dest-item .n {
  font-weight: 600;
  color: var(--we-text-hi);
  font-size: var(--we-fs-body);
}
.dest-item .t {
  margin-left: auto;
  color: var(--we-text-faint);
  font-size: var(--we-fs-micro);
  letter-spacing: 0.08em;
}

.panel-slide-enter-active {
  transition:
    transform var(--we-dur-3) var(--we-ease-out),
    opacity var(--we-dur-2) var(--we-ease-out);
}
.panel-slide-leave-active {
  transition:
    transform var(--we-dur-2) var(--we-ease-in-out),
    opacity var(--we-dur-1) var(--we-ease-out);
}
.panel-slide-enter-from,
.panel-slide-leave-to {
  transform: translateX(36px);
  opacity: 0;
}

@media (max-width: 1024px) {
  .detail-panel {
    width: 360px;
  }
}
@media (max-width: 768px) {
  .detail-panel {
    top: auto;
    left: var(--we-sp-2);
    right: var(--we-sp-2);
    bottom: var(--we-sp-2);
    width: auto;
    max-height: 52vh;
  }
}
</style>
