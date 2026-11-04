<script setup lang="ts">
/**
 * GlassPanel — SPATIAL UI 的玻璃面板基元。
 * 玻璃参数一律取自 tokens(--we-glass*),组件不私调。
 */
defineProps<{
  /** strong: 更实的背景,用于可滚动内容面板 */
  strong?: boolean
}>()
</script>

<template>
  <div class="glass-panel" :class="{ strong }">
    <slot />
  </div>
</template>

<style scoped>
.glass-panel {
  background: var(--we-glass);
  backdrop-filter: blur(var(--we-blur)) saturate(1.35);
  -webkit-backdrop-filter: blur(var(--we-blur)) saturate(1.35);
  border: 1px solid var(--we-glass-border);
  box-shadow: var(--we-shadow-panel), var(--we-inner-highlight);
  border-radius: var(--we-r-lg);
}

.glass-panel.strong {
  background: var(--we-glass-strong);
}
</style>
