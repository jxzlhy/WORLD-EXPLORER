<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useUiStore } from '../../stores/ui-store'
import { useExploreStore } from '../../stores/explore-store'

const ui = useUiStore()
const explore = useExploreStore()

const lonLat = computed(() => {
  const info = ui.cameraInfo
  if (!info) return '—'
  const lat = `${Math.abs(info.latitude).toFixed(1)}°${info.latitude >= 0 ? 'N' : 'S'}`
  const lon = `${Math.abs(info.longitude).toFixed(1)}°${info.longitude >= 0 ? 'E' : 'W'}`
  return `${lat} ${lon}`
})

const heightKm = computed(() => {
  const info = ui.cameraInfo
  if (!info) return '—'
  return `${(info.height / 1000).toFixed(0)} km`
})
</script>

<template>
  <footer class="status-bar intro-item">
    <RouterLink class="lab" to="/design" title="设计系统">DESIGN LAB</RouterLink>
    <span class="mono">{{ lonLat }}</span>
    <span class="sep hide-mobile" aria-hidden="true">·</span>
    <span class="mono hide-mobile">ALT {{ heightKm }}</span>
    <span class="sep hide-mobile" aria-hidden="true">·</span>
    <span class="mono" :class="{ warn: ui.fps < 30 }">{{ ui.fps }} FPS</span>
    <span class="sep hide-mobile" aria-hidden="true">·</span>
    <span class="mono hide-mobile">{{ explore.destinations.length }} DESTINATIONS</span>
  </footer>
</template>

<style scoped>
.status-bar {
  position: fixed;
  right: var(--we-sp-4);
  bottom: var(--we-sp-4);
  z-index: var(--we-z-panel);
  display: flex;
  align-items: center;
  gap: var(--we-sp-2);
  padding: 6px 14px;
  background: var(--we-glass);
  backdrop-filter: blur(var(--we-blur-soft));
  -webkit-backdrop-filter: blur(var(--we-blur-soft));
  border: 1px solid var(--we-glass-border);
  border-radius: var(--we-r-full);
  box-shadow: var(--we-shadow-pop);
}
.lab {
  color: var(--we-text-faint);
  font-size: 9px;
  letter-spacing: 0.16em;
  margin-right: 4px;
}
.lab:hover {
  color: var(--we-gold);
  text-decoration: none;
}
.sep {
  color: var(--we-text-faint);
  font-size: 10px;
}
.mono {
  font-family: var(--we-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--we-text-dim);
}
.mono.warn {
  color: var(--we-warning);
}

@media (max-width: 768px) {
  .status-bar {
    right: var(--we-sp-2);
    bottom: 12px;
    gap: 6px;
  }
  .hide-mobile {
    display: none;
  }
}
</style>
