<script setup lang="ts">
import { computed } from 'vue'
import type { MediaRef } from '../domain/types'

/**
 * DestinationMedia — 目的地视觉。
 * - status=verified: 展示已核验许可的真实照片;
 * - status=placeholder: 程序化生成的「星图卡」——诚实标注为示意图,不用假照片充数。
 */
const props = defineProps<{
  id: string
  name: string
  typeColor: string
  media?: MediaRef
}>()

const verified = computed(
  () => props.media?.status === 'verified' && !!props.media?.file,
)

/** 由 id 确定性派生的视觉参数(同一地点永远同一张卡) */
const seed = computed(() => {
  let h = 0
  for (const ch of props.id) h = (h * 31 + ch.charCodeAt(0)) % 997
  return {
    orbX: 30 + (h % 40),
    orbY: 22 + (h % 26),
    orbR: 16 + (h % 14),
    drift: (h % 13) - 6,
  }
})
</script>

<template>
  <figure class="dest-media">
    <img
      v-if="verified"
      :src="media!.file"
      :alt="name"
      loading="lazy"
    />
    <svg
      v-else
      viewBox="0 0 400 250"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      :aria-label="`${name} — 程序生成示意图`"
    >
      <defs>
        <radialGradient :id="`g-${id}`" cx="70%" cy="20%" r="90%">
          <stop offset="0%" stop-color="#14243d" />
          <stop offset="55%" stop-color="#0a1424" />
          <stop offset="100%" stop-color="#050a13" />
        </radialGradient>
        <radialGradient :id="`o-${id}`" cx="50%" cy="50%" r="50%">
          <stop offset="0%" :stop-color="typeColor" stop-opacity="0.5" />
          <stop offset="100%" :stop-color="typeColor" stop-opacity="0" />
          <stop offset="100%" :stop-color="typeColor" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="250" :fill="`url(#g-${id})`" />
      <!-- 经纬弧线 -->
      <path
        d="M -40 190 Q 200 130 440 190"
        stroke="rgba(148,180,226,0.16)"
        stroke-width="1"
        fill="none"
      />
      <path
        d="M -40 215 Q 200 165 440 215"
        stroke="rgba(148,180,226,0.1)"
        stroke-width="1"
        fill="none"
      />
      <!-- 天体 -->
      <circle :cx="seed.orbX * 4" :cy="seed.orbY * 2.4" :r="seed.orbR * 2.2" :fill="`url(#o-${id})`" />
      <circle
        :cx="seed.orbX * 4"
        :cy="seed.orbY * 2.4"
        :r="seed.orbR * 0.9"
        :fill="typeColor"
        opacity="0.85"
      />
      <!-- 星点 -->
      <circle :cx="320 + seed.drift * 3" cy="40" r="1.4" fill="rgba(239,244,252,0.8)" />
      <circle :cx="80 + seed.drift * 2" cy="60" r="1" fill="rgba(239,244,252,0.55)" />
      <circle :cx="200" :cy="30 + seed.drift" r="1.1" fill="rgba(239,244,252,0.4)" />
      <circle :cx="355 - seed.drift" cy="90" r="0.8" fill="rgba(239,244,252,0.5)" />
      <!-- 名称 -->
      <text
        x="24"
        y="222"
        fill="rgba(239,244,252,0.9)"
        font-family="Songti SC, Georgia, serif"
        font-size="26"
      >
        {{ name }}
      </text>
      <text
        x="24"
        y="240"
        fill="rgba(139,151,171,0.85)"
        font-family="SF Mono, Menlo, monospace"
        font-size="10"
        letter-spacing="2"
      >
        ILLUSTRATIVE · NON-PHOTO
      </text>
    </svg>
    <figcaption v-if="verified && media?.author" class="credit">
      © {{ media.author }} · {{ media.license }}
    </figcaption>
    <figcaption v-else class="credit dim">示意图 · 待收录真实影像</figcaption>
    <span class="scrim" aria-hidden="true" />
  </figure>
</template>

<style scoped>
.dest-media {
  position: relative;
  margin: 0;
  border-radius: var(--we-r-md);
  overflow: hidden;
  aspect-ratio: 16 / 10;
  border: 1px solid var(--we-glass-border);
  background: var(--we-bg-raised);
}
.dest-media img,
.dest-media svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.credit {
  position: absolute;
  left: 10px;
  bottom: 8px;
  z-index: 2;
  font-size: 9px;
  letter-spacing: 0.06em;
  color: rgba(239, 244, 252, 0.75);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
  max-width: 85%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.credit.dim {
  color: rgba(139, 151, 171, 0.7);
}
.scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 55%, rgba(3, 6, 9, 0.55));
  pointer-events: none;
}
</style>
