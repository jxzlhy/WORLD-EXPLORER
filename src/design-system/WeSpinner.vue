<script setup lang="ts">
/** WeSpinner — 轨道式加载指示 */
defineProps<{
  size?: number
  label?: string
}>()
</script>

<template>
  <div class="we-spinner" role="status" :aria-label="label ?? '加载中'">
    <svg :width="size ?? 28" :height="size ?? 28" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="15" stroke="rgba(148,180,226,0.18)" stroke-width="2.5" />
      <path
        d="M33 18a15 15 0 0 0-15-15"
        stroke="var(--we-cyan)"
        stroke-width="2.5"
        stroke-linecap="round"
      />
      <circle cx="18" cy="3" r="2.4" fill="var(--we-gold)" />
    </svg>
    <span v-if="label" class="label">{{ label }}</span>
  </div>
</template>

<style scoped>
.we-spinner {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: var(--we-sp-3);
}
.we-spinner svg {
  animation: we-spin 1.1s linear infinite;
}
@keyframes we-spin {
  to {
    transform: rotate(360deg);
  }
}
.label {
  font-size: var(--we-fs-micro);
  letter-spacing: var(--we-ls-caps);
  text-transform: uppercase;
  color: var(--we-text-dim);
}
</style>
