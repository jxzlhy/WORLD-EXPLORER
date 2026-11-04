<script setup lang="ts">
import { computed } from 'vue'
import type { DestinationType } from '../domain/types'
import { DESTINATION_TYPE_LABELS } from '../domain/types'

/**
 * WeTag — 分类/状态标签。
 * 传 type 时显示目的地类型并使用分类色;否则为中性文本标签。
 */
const props = defineProps<{
  type?: DestinationType
  color?: string
}>()

const label = computed(() =>
  props.type ? DESTINATION_TYPE_LABELS[props.type] : undefined,
)
const dotColor = computed(() => {
  if (props.color) return props.color
  if (props.type) {
    const map: Record<DestinationType, string> = {
      heritage: 'var(--we-type-heritage)',
      natural: 'var(--we-type-natural)',
      landmark: 'var(--we-type-landmark)',
      museum: 'var(--we-text-dim)',
      city: 'var(--we-type-city)',
      island: 'var(--we-type-island)',
      geology: 'var(--we-type-geology)',
      observatory: 'var(--we-warning)',
    }
    return map[props.type]
  }
  return 'var(--we-text-faint)'
})
</script>

<template>
  <span class="we-tag">
    <i :style="{ background: dotColor }" aria-hidden="true" />
    <template v-if="label">{{ label }}</template>
    <slot v-else />
  </span>
</template>

<style scoped>
.we-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--we-fs-micro);
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--we-text-dim);
  padding: 3px 10px;
  border: 1px solid var(--we-glass-border);
  border-radius: var(--we-r-full);
  background: rgba(6, 11, 20, 0.4);
  white-space: nowrap;
}
.we-tag i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
}
</style>
