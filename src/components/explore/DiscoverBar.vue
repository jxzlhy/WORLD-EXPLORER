<script setup lang="ts">
import { computed } from 'vue'
import { useExploreStore } from '../../stores/explore-store'
import WeButton from '../../design-system/WeButton.vue'

const explore = useExploreStore()
const featured = computed(() => explore.todayFeatured())
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
    <WeButton variant="glass" @click="explore.goHome()" title="回到全球视角">◍ 全球视角</WeButton>
    <WeButton variant="spatial" @click="explore.randomDestination()">
      ✦ 随机探索
    </WeButton>
  </div>
</template>

<style scoped>
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
  }
  /* 小屏收纳:今日精选折叠进「随机探索」,降低底部拥挤度 */
  .featured {
    display: none;
  }
}
</style>
