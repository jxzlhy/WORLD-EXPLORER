<script setup lang="ts">
import { computed, ref } from 'vue'
import { useExploreStore, buildRecommendations } from '../../stores/explore-store'
import { useMyWorldStore } from '../../stores/my-world-store'
import WeButton from '../../design-system/WeButton.vue'

const explore = useExploreStore()
const myWorld = useMyWorldStore()
const featured = computed(() => explore.todayFeatured())
const collectionsOpen = ref(false)

// —— 为你推荐(V5.0):足迹驱动 Top5,↻ 逐个轮换(足迹为空则不显示) ——
const recs = computed(() =>
  buildRecommendations(
    explore.destinations,
    explore.exploredIds,
    explore.collections,
    Object.fromEntries(explore.countries.map((c) => [c.id, c.name])),
    [...myWorld.favorites, ...myWorld.wantToGo, ...myWorld.visited],
    5,
  ),
)
const recOffset = ref(0)
const currentRec = computed(() => recs.value[recOffset.value % Math.max(recs.value.length, 1)] ?? null)

function cycleRec(): void {
  if (recs.value.length) recOffset.value = (recOffset.value + 1) % recs.value.length
}

function goRec(): void {
  if (currentRec.value) explore.selectDestination(currentRec.value.dest.id)
}
</script>

<template>
  <div class="discover-bar intro-item">
    <button
      v-if="featured"
      class="featured"
      title="今日精选"
      @click="explore.selectDestination(featured.id)"
    >
      <span class="we-caps-label gold">今日精选</span>
      <span class="name">{{ featured.name }}</span>
    </button>

    <!-- 为你推荐(V5.0 雏形):足迹驱动,点击直达,↻ 轮换 -->
    <button
      v-if="currentRec"
      class="featured rec-chip"
      :title="`为你推荐 · ${currentRec.reason}`"
      @click="goRec"
    >
      <span class="we-caps-label gold">为你推荐</span>
      <span class="name">{{ currentRec.dest.name }}</span>
      <span class="why">{{ currentRec.reason }}</span>
      <span
        class="swap"
        role="button"
        aria-label="换一个推荐"
        title="换一个推荐"
        @click.stop="cycleRec"
      >↻</span>
    </button>

    <!-- 主题合集(V1.5) -->
    <div class="collections-wrap">
      <WeButton variant="glass" @click="collectionsOpen = !collectionsOpen">
        ✦ 合集
      </WeButton>
      <Transition name="collections-pop">
        <div v-if="collectionsOpen" class="collections-menu glass-panel strong">
          <button
            v-for="c in explore.collections"
            :key="c.id"
            class="collection-item"
            @click="explore.openCollection(c.id); collectionsOpen = false"
          >
            <span class="n">{{ c.name }}</span>
            <span class="count">{{ c.destinationIds.length }}</span>
          </button>
        </div>
      </Transition>
    </div>

    <WeButton
      variant="glass"
      title="回到全球视角"
      @click="explore.goHome()"
    >
      ◍ 全球视角
    </WeButton>
    <WeButton
      variant="spatial"
      @click="explore.randomDestination()"
    >
      ✦ 随机探索
    </WeButton>
  </div>
</template>

<style scoped>
/* —— 为你推荐(V5.0)—— */
.rec-chip .why {
  font-size: var(--we-fs-micro);
  color: var(--we-gold-strong);
  letter-spacing: 0.04em;
}
.rec-chip .swap {
  margin-left: 4px;
  font-size: var(--we-fs-small);
  color: var(--we-text-faint);
  padding: 2px 6px;
  border-radius: var(--we-r-full);
  transition: all var(--we-dur-1) var(--we-ease-out);
}
.rec-chip .swap:hover {
  color: var(--we-gold-strong);
  background: rgba(232, 200, 150, 0.12);
}

/* —— 合集菜单(V1.5)—— */
.collections-wrap {
  position: relative;
}
.collections-menu {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 0;
  min-width: 210px;
  padding: var(--we-sp-2);
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: var(--we-z-panel);
}
.collection-item {
  appearance: none;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  gap: var(--we-sp-2);
  width: 100%;
  padding: 9px 12px;
  border-radius: var(--we-r-sm);
  cursor: pointer;
  text-align: left;
  transition: background var(--we-dur-1) var(--we-ease-out);
}
.collection-item:hover {
  background: rgba(111, 195, 255, 0.1);
}
.collection-item .n {
  font-weight: 600;
  color: var(--we-text-hi);
  font-size: var(--we-fs-body);
}
.collection-item .count {
  margin-left: auto;
  font-family: var(--we-mono);
  font-size: var(--we-fs-micro);
  color: var(--we-text-faint);
}
.collections-pop-enter-active,
.collections-pop-leave-active {
  transition:
    opacity var(--we-dur-2) var(--we-ease-out),
    transform var(--we-dur-2) var(--we-ease-out);
}
.collections-pop-enter-from,
.collections-pop-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.discover-bar {
  position: fixed;
  left: var(--we-sp-4);
  bottom: var(--we-sp-4);
  z-index: var(--we-z-panel);
  display: flex;
  align-items: stretch;
  gap: var(--we-sp-2);
}
.featured {
  appearance: none;
  border: 1px solid var(--we-glass-border);
  background: var(--we-glass);
  backdrop-filter: blur(var(--we-blur-soft));
  -webkit-backdrop-filter: blur(var(--we-blur-soft));
  border-radius: var(--we-r-md);
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  transition: all var(--we-dur-2) var(--we-ease-out);
  box-shadow: var(--we-shadow-pop);
}
.featured:hover {
  border-color: rgba(232, 200, 150, 0.5);
  transform: translateY(-2px);
}
.featured .name {
  font-family: var(--we-serif);
  font-size: 16px;
  color: var(--we-text-hi);
  font-weight: 600;
}

@media (max-width: 768px) {
  .discover-bar {
    left: var(--we-sp-2);
    bottom: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--we-sp-2);
  }
  /* 小屏收纳:今日精选折叠进「随机探索」,降低底部拥挤度 */
  .featured {
    display: none;
  }
}
</style>
