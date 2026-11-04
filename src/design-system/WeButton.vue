<script setup lang="ts">
import { computed } from 'vue'

/**
 * WeButton — 唯一按钮组件。
 * variant: primary(金)/ spatial(青)/ glass / ghost / danger
 */
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'spatial' | 'glass' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
  }>(),
  { variant: 'glass', size: 'md' },
)

const cls = computed(() => [`v-${props.variant}`, `s-${props.size}`])
</script>

<template>
  <button class="we-btn" :class="cls" :disabled="disabled">
    <slot />
  </button>
</template>

<style scoped>
.we-btn {
  appearance: none;
  border: 1px solid transparent;
  background: none;
  color: var(--we-text);
  font-family: var(--we-sans);
  font-size: var(--we-fs-small);
  font-weight: 600;
  letter-spacing: 0.04em;
  border-radius: var(--we-r-full);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--we-sp-2);
  transition:
    transform var(--we-dur-1) var(--we-ease-out),
    background var(--we-dur-1) var(--we-ease-out),
    border-color var(--we-dur-1) var(--we-ease-out),
    box-shadow var(--we-dur-2) var(--we-ease-out),
    color var(--we-dur-1) var(--we-ease-out);
  white-space: nowrap;
}
.we-btn:active {
  transform: scale(0.97);
}
.we-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.s-sm {
  padding: 5px 12px;
  font-size: var(--we-fs-micro);
}
.s-md {
  padding: 8px 18px;
}
.s-lg {
  padding: 12px 26px;
  font-size: var(--we-fs-body);
}

.v-primary {
  background: linear-gradient(135deg, var(--we-gold-strong), var(--we-gold-deep));
  color: #1c1509;
  box-shadow: 0 4px 18px rgba(232, 200, 150, 0.25);
}
.v-primary:hover:not(:disabled) {
  box-shadow: 0 6px 26px rgba(232, 200, 150, 0.4);
}

.v-spatial {
  background: rgba(111, 195, 255, 0.14);
  border-color: rgba(111, 195, 255, 0.35);
  color: var(--we-cyan);
}
.v-spatial:hover:not(:disabled) {
  background: rgba(111, 195, 255, 0.22);
}

.v-glass {
  background: rgba(148, 180, 226, 0.09);
  border-color: var(--we-glass-border);
  backdrop-filter: blur(var(--we-blur-soft));
  -webkit-backdrop-filter: blur(var(--we-blur-soft));
}
.v-glass:hover:not(:disabled) {
  background: rgba(148, 180, 226, 0.16);
}

.v-ghost {
  color: var(--we-text-dim);
}
.v-ghost:hover:not(:disabled) {
  color: var(--we-text-hi);
  background: rgba(148, 180, 226, 0.08);
}

.v-danger {
  background: rgba(232, 106, 106, 0.12);
  border-color: rgba(232, 106, 106, 0.35);
  color: var(--we-danger);
}
</style>
