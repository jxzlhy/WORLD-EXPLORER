<script setup lang="ts">
import { computed } from 'vue'
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
</script>

<template>
  <Transition name="panel-slide">
    <GlassPanel
      v-if="destination || country"
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
  background: rgba(6, 11, 20, 0.6);
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
  background: rgba(6, 11, 20, 0.4);
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
