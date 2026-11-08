<script setup lang="ts">
import { computed, nextTick, onUnmounted, watch } from 'vue'
import gsap from 'gsap'
import { useExploreStore } from '../../stores/explore-store'
import { useUiStore } from '../../stores/ui-store'
import { DESTINATION_TYPE_LABELS } from '../../domain/types'

/**
 * ImmersiveReader — 全屏沉浸阅读(V2.5)。
 * 目的地档案的全屏呈现:暗化照片背景 + 逐段交错浮现(GSAP,尊重 prefers-reduced-motion)。
 * 退出:右上角按钮或 Esc(ExploreView 全局键位)。
 */
const explore = useExploreStore()
const ui = useUiStore()

const dest = computed(() => explore.selectedDestination)
const verifiedBg = computed(() =>
  dest.value?.media?.status === 'verified' ? (dest.value.media.file ?? '') : '',
)

const prefersReducedMotion =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

let introTimeline: gsap.core.Timeline | null = null

watch(
  () => ui.immersiveOpen,
  async (open) => {
    introTimeline?.kill()
    introTimeline = null
    if (!open || prefersReducedMotion) return
    await nextTick()
    const el = document.querySelector('.immersive .content')
    if (!el) return
    introTimeline = gsap.timeline()
    introTimeline.fromTo(
      el.children,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.08,
        clearProps: 'transform',
      },
    )
  },
)

onUnmounted(() => {
  introTimeline?.kill()
  introTimeline = null
})

function fmtCoord(v: number, pos: string, neg: string): string {
  return `${Math.abs(v).toFixed(2)}°${v >= 0 ? pos : neg}`
}
</script>

<template>
  <Teleport to="body">
    <Transition name="immersive-fade">
      <div
        v-if="ui.immersiveOpen && dest"
        class="immersive"
        role="dialog"
        aria-modal="true"
        :aria-label="`${dest.name} 沉浸阅读`"
      >
        <!-- 背景:已核验照片暗化;否则同色系程序渐变(诚实降级) -->
        <div
          class="backdrop"
          :style="verifiedBg ? { backgroundImage: `url(${verifiedBg})` } : {}"
        />

        <button
          class="close"
          aria-label="退出沉浸阅读"
          @click="ui.toggleImmersive(false)"
        >
          ✕ 退出
        </button>

        <div class="content">
          <p class="we-caps-label gold">
            {{ DESTINATION_TYPE_LABELS[dest.type] }}
            <template v-if="dest.quality === 'S'"> · S 级档案</template>
          </p>
          <h1 class="name">
            {{ dest.name }}
          </h1>
          <p class="en">
            {{ dest.nameEn }}
          </p>
          <p class="meta mono">
            {{ fmtCoord(dest.latitude, 'N', 'S') }} {{ fmtCoord(dest.longitude, 'E', 'W') }}
            <span
              v-if="explore.countryById[dest.countryId]"
              class="country"
              @click="ui.toggleImmersive(false)"
            >
              {{ explore.countryById[dest.countryId]!.name }}
            </span>
          </p>

          <p class="lead">
            {{ dest.summary }}
          </p>

          <div
            class="ornament"
            aria-hidden="true"
          >
            <i /><span>✦</span><i />
          </div>

          <section class="story">
            <p
              v-for="(para, i) in dest.story"
              :key="i"
            >
              {{ para }}
            </p>
          </section>

          <div
            v-if="dest.timeline?.length"
            class="timeline"
          >
            <span class="we-caps-label">时间轴</span>
            <ul>
              <li
                v-for="(t, i) in dest.timeline"
                :key="i"
              >
                <span class="year mono">{{ t.year }}</span>
                <span class="text">{{ t.text }}</span>
              </li>
            </ul>
          </div>

          <footer class="sources">
            <p class="we-caps-label">
              资料来源
            </p>
            <ul>
              <li
                v-for="s in dest.sources"
                :key="s.url"
              >
                <a
                  :href="s.url"
                  target="_blank"
                  rel="noopener noreferrer"
                >{{ s.name }}</a>
                <span class="license">{{ s.license }}</span>
              </li>
            </ul>
            <p
              v-if="verifiedBg"
              class="credit"
            >
              背景:{{ dest.name }} · © {{ dest.media?.author }} · {{ dest.media?.license }}
            </p>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.immersive {
  position: fixed;
  inset: 0;
  z-index: var(--we-z-modal);
  overflow-y: auto;
  background: var(--we-void);
}
.backdrop {
  position: fixed;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: brightness(0.24) saturate(0.85);
  background-color: var(--we-void);
}
.immersive::after {
  content: '';
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(3, 6, 9, 0.88));
  pointer-events: none;
}

.close {
  position: fixed;
  top: var(--we-sp-4);
  right: var(--we-sp-4);
  z-index: 2;
  appearance: none;
  border: 1px solid var(--we-glass-border);
  background: var(--we-glass);
  backdrop-filter: blur(var(--we-blur-soft));
  color: var(--we-text-dim);
  font-size: var(--we-fs-small);
  padding: 8px 16px;
  border-radius: var(--we-r-full);
  cursor: pointer;
  transition: color var(--we-dur-1) var(--we-ease-out);
}
.close:hover {
  color: var(--we-text-hi);
}

.content {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
  padding: 12vh var(--we-sp-6) 16vh;
  display: flex;
  flex-direction: column;
  gap: var(--we-sp-4);
}
.content .we-caps-label {
  margin: 0;
}
.name {
  margin: 0;
  font-family: var(--we-serif);
  font-size: var(--we-fs-display);
  line-height: 1.15;
  color: var(--we-text-hi);
}
.en {
  margin: 0;
  font-size: var(--we-fs-h2);
  color: var(--we-text-faint);
  letter-spacing: 0.06em;
}
.meta {
  margin: 0;
  color: var(--we-text-faint);
  font-size: var(--we-fs-small);
}
.meta .country {
  margin-left: var(--we-sp-3);
  color: var(--we-gold);
  cursor: pointer;
}
.lead {
  margin: 0;
  font-size: var(--we-fs-h2);
  line-height: 1.7;
  color: var(--we-text);
}
.story p {
  margin: 0 0 var(--we-sp-4);
  font-size: var(--we-fs-body);
  line-height: 2;
  color: var(--we-text);
  max-width: 62ch;
}
.ornament {
  display: flex;
  align-items: center;
  gap: var(--we-sp-3);
  color: var(--we-gold);
  margin: var(--we-sp-2) 0;
}
.ornament i {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(232, 200, 150, 0.4));
}
.ornament i:last-child {
  background: linear-gradient(90deg, rgba(232, 200, 150, 0.4), transparent);
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: var(--we-sp-2);
}
.timeline ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--we-sp-2);
}
.timeline li {
  display: flex;
  gap: var(--we-sp-3);
  font-size: var(--we-fs-body);
  line-height: 1.7;
}
.timeline .year {
  color: var(--we-gold);
  flex: none;
  width: 5.5ch;
}
.timeline .text {
  color: var(--we-text);
}

.sources {
  margin-top: var(--we-sp-6);
  padding-top: var(--we-sp-4);
  border-top: 1px solid var(--we-glass-border);
}
.sources ul {
  list-style: none;
  margin: var(--we-sp-2) 0 0;
  padding: 0;
  font-size: var(--we-fs-micro);
  color: var(--we-text-faint);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sources a {
  color: var(--we-text-dim);
  text-decoration: none;
  border-bottom: 1px dotted var(--we-glass-border);
}
.sources .credit {
  margin: var(--we-sp-3) 0 0;
  font-size: var(--we-fs-micro);
  color: var(--we-text-faint);
}

.immersive-fade-enter-active {
  transition: opacity var(--we-dur-3) var(--we-ease-out);
}
.immersive-fade-leave-active {
  transition: opacity var(--we-dur-2) var(--we-ease-out);
}
.immersive-fade-enter-from,
.immersive-fade-leave-to {
  opacity: 0;
}
</style>
