<script setup lang="ts">
import { computed } from 'vue'
import type { Destination } from '../../domain/types'

/**
 * MediaStrip — 已核验照片横向条带(合集/国家/城市面板共用)。
 * 只展示 status=verified 的真实影像;excludeId 用于排除面板 hero 已展示的首图;点击直达目的地档案。
 */
const props = defineProps<{
  items: Destination[]
  excludeId?: string
}>()

const emit = defineEmits<{ select: [destinationId: string] }>()

const verified = computed(() =>
  props.items.filter(
    (d) =>
      d.media?.status === 'verified' &&
      !!d.media?.file &&
      (props.excludeId ? d.id !== props.excludeId : true),
  ),
)
</script>

<template>
  <div
    class="media-strip"
    role="list"
    aria-label="收录影像"
  >
    <button
      v-for="d in verified"
      :key="d.id"
      class="strip-card"
      role="listitem"
      :aria-label="`查看 ${d.name}`"
      @click="emit('select', d.id)"
    >
      <img
        :src="d.media!.file"
        :alt="d.name"
        loading="lazy"
      >
      <span class="label">
        <span class="n">{{ d.name }}</span>
        <span class="c">© {{ d.media?.author }} · {{ d.media?.license }}</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.media-strip {
  display: flex;
  gap: var(--we-sp-2);
  overflow-x: auto;
  padding: 2px 2px var(--we-sp-2);
  scroll-snap-type: x proximity;
}
.strip-card {
  position: relative;
  flex: none;
  width: 136px;
  aspect-ratio: 4 / 3;
  border: 1px solid var(--we-glass-border);
  border-radius: var(--we-r-sm);
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  background: var(--we-bg-raised);
  scroll-snap-align: start;
  transition: border-color var(--we-dur-1) var(--we-ease-out);
}
.strip-card:hover {
  border-color: rgba(232, 200, 150, 0.45);
}
.strip-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.label {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 14px 8px 6px;
  background: linear-gradient(180deg, transparent, rgba(3, 6, 9, 0.82));
  text-align: left;
}
.label .n {
  font-size: var(--we-fs-micro);
  font-weight: 600;
  color: var(--we-text-hi);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.label .c {
  font-size: 8px;
  letter-spacing: 0.04em;
  color: rgba(239, 244, 252, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
