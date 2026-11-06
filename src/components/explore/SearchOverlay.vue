<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useExploreStore, useSearchIndex } from '../../stores/explore-store'
import { useUiStore } from '../../stores/ui-store'
import type { SearchHit } from '../../stores/explore-store'

const ui = useUiStore()
const explore = useExploreStore()

const inputEl = ref<HTMLInputElement | null>(null)
const activeIndex = ref(0)

const { query, results } = useSearchIndex(() => ({
  countries: explore.countries,
  cities: explore.cities,
  destinations: explore.destinations,
  people: explore.people,
}))

// 结果集变化时重置键盘索引(空结果回车越界修复,I-13)
watch(results, () => {
  activeIndex.value = 0
})

watch(
  () => ui.searchOpen,
  async (open) => {
    if (open) {
      query.value = ''
      activeIndex.value = 0
      await nextTick()
      inputEl.value?.focus()
    }
  },
)

const kindLabel: Record<SearchHit['kind'], string> = {
  country: '国家',
  destination: '地点',
  city: '城市',
  person: '人物',
}

function select(hit: SearchHit) {
  ui.toggleSearch(false)
  if (hit.kind === 'country') explore.selectCountry(hit.id.split(':')[1]!)
  else if (hit.kind === 'destination') explore.selectDestination(hit.id.split(':')[1]!)
  else if (hit.kind === 'person') explore.openPerson(hit.id.split(':')[1]!)
  else explore.flyToCity(hit.id.split(':')[1]!)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    const hit = results.value[activeIndex.value]
    if (hit) select(hit)
  } else if (e.key === 'Escape') {
    ui.toggleSearch(false)
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="search-fade">
      <div
        v-if="ui.searchOpen"
        class="overlay"
        @click.self="ui.toggleSearch(false)"
      >
        <div
          class="panel glass-panel strong"
          role="dialog"
          aria-label="搜索世界"
        >
          <div class="input-row">
            <span
              class="glyph"
              aria-hidden="true"
            >⌕</span>
            <input
              ref="inputEl"
              v-model="query"
              placeholder="搜索国家、城市、地点…(中英文均可)"
              @keydown="onKeydown"
            >
            <button
              class="esc"
              @click="ui.toggleSearch(false)"
            >
              ESC
            </button>
          </div>
          <ul class="results">
            <li
              v-for="(hit, i) in results"
              :key="hit.id"
              :class="{ active: i === activeIndex }"
              @mouseenter="activeIndex = i"
              @click="select(hit)"
            >
              <span
                class="kind"
                :data-kind="hit.kind"
              >{{ kindLabel[hit.kind] }}</span>
              <span class="name">{{ hit.name }}</span>
              <span class="en">{{ hit.nameEn }}</span>
              <span class="detail">{{ hit.detail }}</span>
            </li>
            <li
              v-if="!results.length"
              class="no-result"
            >
              未找到匹配的世界地点
            </li>
          </ul>
          <div class="footer">
            <span>↑↓ 选择</span>
            <span>↵ 前往</span>
            <span>ESC 关闭</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: var(--we-z-modal);
  background: rgba(3, 6, 9, 0.5);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 14vh var(--we-sp-4) 0;
}
.panel {
  width: min(620px, 100%);
  overflow: hidden;
}
.input-row {
  display: flex;
  align-items: center;
  gap: var(--we-sp-3);
  padding: var(--we-sp-4) var(--we-sp-5);
  border-bottom: 1px solid var(--we-glass-border);
}
.glyph {
  color: var(--we-gold);
  font-size: 18px;
}
.input-row input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--we-text-hi);
  font-size: 16px;
  font-family: var(--we-sans);
}
.input-row input::placeholder {
  color: var(--we-text-faint);
}
.esc {
  appearance: none;
  background: none;
  border: 1px solid var(--we-glass-border);
  color: var(--we-text-faint);
  border-radius: 4px;
  font-size: 9px;
  padding: 3px 6px;
  cursor: pointer;
}
.esc:hover {
  color: var(--we-text-dim);
}

.results {
  list-style: none;
  margin: 0;
  padding: var(--we-sp-2);
  max-height: 46vh;
  overflow-y: auto;
}
.results li {
  display: flex;
  align-items: baseline;
  gap: var(--we-sp-3);
  padding: 9px 12px;
  border-radius: var(--we-r-sm);
  cursor: pointer;
  color: var(--we-text);
}
.results li.active {
  background: rgba(111, 195, 255, 0.1);
}
.kind {
  flex: none;
  font-size: 9px;
  letter-spacing: 0.1em;
  padding: 2px 7px;
  border-radius: var(--we-r-full);
  border: 1px solid var(--we-glass-border);
  color: var(--we-text-dim);
}
.kind[data-kind='country'] {
  color: var(--we-gold);
  border-color: rgba(232, 200, 150, 0.3);
}
.kind[data-kind='destination'] {
  color: var(--we-cyan);
  border-color: rgba(111, 195, 255, 0.3);
}
.name {
  font-weight: 600;
  color: var(--we-text-hi);
  white-space: nowrap;
}
.en {
  color: var(--we-text-faint);
  font-size: var(--we-fs-small);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.detail {
  margin-left: auto;
  color: var(--we-text-faint);
  font-size: var(--we-fs-micro);
  flex: none;
}
.no-result {
  justify-content: center;
  color: var(--we-text-faint);
  cursor: default;
}
.footer {
  display: flex;
  gap: var(--we-sp-5);
  padding: var(--we-sp-3) var(--we-sp-5);
  border-top: 1px solid var(--we-glass-border);
  color: var(--we-text-faint);
  font-size: var(--we-fs-micro);
  letter-spacing: 0.08em;
}

.search-fade-enter-active,
.search-fade-leave-active {
  transition: opacity var(--we-dur-2) var(--we-ease-out);
}
.search-fade-enter-active .panel,
.search-fade-leave-active .panel {
  transition:
    transform var(--we-dur-3) var(--we-ease-out),
    opacity var(--we-dur-2) var(--we-ease-out);
}
.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
}
.search-fade-enter-from .panel,
.search-fade-leave-to .panel {
  transform: translateY(-12px) scale(0.98);
  opacity: 0;
}
</style>
