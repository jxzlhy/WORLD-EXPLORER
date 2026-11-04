<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { WorldEngine } from '../engine/world-engine'
import { setEngine, getEngine } from '../engine/engine-holder'
import { loadWorldData } from '../services/data-service'
import { useExploreStore } from '../stores/explore-store'
import { useUiStore } from '../stores/ui-store'
import TopBar from '../components/explore/TopBar.vue'
import SearchOverlay from '../components/explore/SearchOverlay.vue'
import LeftRail from '../components/explore/LeftRail.vue'
import DetailPanel from '../components/explore/DetailPanel.vue'
import DiscoverBar from '../components/explore/DiscoverBar.vue'
import StatusBar from '../components/explore/StatusBar.vue'
import MyWorldPanel from '../components/explore/MyWorldPanel.vue'
import WeSpinner from '../design-system/WeSpinner.vue'

const ui = useUiStore()
const explore = useExploreStore()
const globeEl = ref<HTMLDivElement | null>(null)
const loading = ref(true)

const prefersReducedMotion =
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

let engine: WorldEngine | null = null
const unsubs: Array<() => void> = []

onMounted(async () => {
  // 1. 加载世界数据
  try {
    const data = await loadWorldData()
    explore.loadData(data)
  } catch (err) {
    ui.setEngineError(`世界数据加载失败:${String(err)}`)
    loading.value = false
    return
  }

  // 2. 创建并初始化引擎
  if (!globeEl.value) return
  engine = new WorldEngine({
    countriesUrl: '/data/ne_110m_countries.geojson',
    destinations: explore.destinations,
  })
  try {
    await engine.initialize(globeEl.value)
  } catch (err) {
    ui.setEngineError(`3D 引擎初始化失败:${String(err)}`)
    loading.value = false
    return
  }
  setEngine(engine)
  ui.setEngineReady()
  loading.value = false

  if (prefersReducedMotion) ui.setAutoRotate(false)

  // 3. 引擎 → Store 事件接线
  unsubs.push(
    engine.onStats((s) => ui.setFps(s.fps)),
    engine.onCameraChange((info) => ui.setCameraInfo(info)),
    engine.onPick((payload) => {
      if (payload.kind === 'destination') {
        explore.selectDestination(payload.destinationId)
      } else if (payload.kind === 'country') {
        explore.selectCountry(payload.countryId)
      } else {
        explore.closePanel()
      }
    }),
    engine.onUserInteract(() => {
      if (ui.autoRotate) ui.setAutoRotate(false)
    }),
  )

  // 4. Store → 引擎 响应式接线
  watch(
    () => explore.panel,
    (panel) => {
      const eng = getEngine()
      if (!eng) return
      if (panel.kind === 'destination') eng.highlightMarker(panel.destinationId)
      else eng.highlightMarker(null)
      if (panel.kind === 'country') eng.highlightCountry(panel.countryId)
      else eng.highlightCountry(null)
    },
  )

  watch(
    () => explore.pendingFlight,
    async (target) => {
      const eng = getEngine()
      if (!eng || !target) return
      await eng.flyTo(target)
      if (explore.pendingFlight === target) explore.pendingFlight = null
    },
  )

  // 图层/模式 → 引擎
  watch(
    () => ({ ...ui.layers }),
    (layers) => {
      const eng = getEngine()
      if (!eng) return
      eng.setLayerVisible('countries', layers.countries)
      eng.setLayerVisible('markers', layers.markers)
      eng.setLayerVisible('labels', layers.labels)
    },
    { immediate: true },
  )
  watch(
    () => ui.dayNightMode,
    (mode) => getEngine()?.setDayNightMode(mode),
  )
  watch(
    () => ui.autoRotate,
    (on) => getEngine()?.setAutoRotate(on),
  )
  watch(
    () => ui.lowPerf,
    (on) => getEngine()?.setQuality(on ? 'low' : 'high'),
  )

  // 5. 开场序列(GSAP)——尊重 prefers-reduced-motion
  if (!prefersReducedMotion) {
    gsap.from('.intro-item', {
      opacity: 0,
      y: 14,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.12,
      delay: 0.35,
    })
  }
})

// —— 全局键盘:⌘K/Ctrl+K 搜索,Esc 关闭 ——
function onKeydown(e: KeyboardEvent): void {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    ui.toggleSearch(true)
  } else if (e.key === 'Escape') {
    if (ui.searchOpen) ui.toggleSearch(false)
    else if (ui.myWorldOpen) ui.toggleMyWorld(false)
    else explore.closePanel()
  }
}
window.addEventListener('keydown', onKeydown)

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  for (const unsub of unsubs) unsub()
  engine?.destroy()
  engine = null
  setEngine(null)
})
</script>

<template>
  <div class="explore">
    <div ref="globeEl" class="globe-canvas" aria-label="3D 地球" />

    <!-- 引擎/数据加载态 -->
    <Transition name="fade">
      <div v-if="loading" class="loading-veil">
        <WeSpinner :size="36" label="正在唤醒地球" />
      </div>
    </Transition>

    <!-- 引擎错误态 -->
    <div v-if="ui.engineError" class="error-veil" role="alert">
      <p class="title">启动遇到问题</p>
      <p class="msg">{{ ui.engineError }}</p>
      <p class="hint">请刷新重试;若持续出现,请检查 WebGL 是否可用。</p>
    </div>

    <template v-if="ui.engineReady">
      <TopBar class="intro-item" />
      <LeftRail />
      <DetailPanel />
      <DiscoverBar />
      <StatusBar />
      <MyWorldPanel />
      <SearchOverlay />
    </template>
  </div>
</template>

<style scoped>
.explore {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--we-void);
  overflow: hidden;
}
.globe-canvas {
  position: absolute;
  inset: 0;
  z-index: var(--we-z-globe);
}

.loading-veil {
  position: absolute;
  inset: 0;
  z-index: var(--we-z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, rgba(6, 11, 20, 0.6), var(--we-void));
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--we-dur-3) var(--we-ease-out);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.error-veil {
  position: absolute;
  inset: 0;
  z-index: var(--we-z-modal);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--we-sp-2);
  background: var(--we-void);
  text-align: center;
  padding: var(--we-sp-6);
}
.error-veil .title {
  font-family: var(--we-serif);
  font-size: var(--we-fs-title);
  color: var(--we-text-hi);
  margin: 0;
}
.error-veil .msg {
  color: var(--we-danger);
  font-size: var(--we-fs-small);
  max-width: 560px;
  word-break: break-all;
}
.error-veil .hint {
  color: var(--we-text-faint);
  font-size: var(--we-fs-small);
}
</style>
