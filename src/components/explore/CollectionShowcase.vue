<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useExploreStore } from '../../stores/explore-store'
import { useUiStore } from '../../stores/ui-store'
import { TourAudio } from '../../services/tour-audio'

/**
 * CollectionShowcase — 合集沉浸巡展(V2.5)。
 * 已核验照片全屏轮播:自动 8s 推进(可暂停)、←/→ 手动翻页、进度点直达;
 * Esc 退出由 ExploreView 全局键位处理。无照片或仅 1 张时入口按钮禁用,不会挂载。
 */
const explore = useExploreStore()
const ui = useUiStore()

const AUTO_MS = 8_000

const collection = computed(() => explore.selectedCollection)
const photos = computed(() =>
  (collection.value ? explore.collectionDestinations(collection.value) : []).filter(
    (d) => d.media?.status === 'verified' && !!d.media?.file,
  ),
)

const idx = ref(0)
const paused = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

const current = computed(() => photos.value[idx.value] ?? null)

/** 策展语片头:打开时短暂展示后淡出(3.5s);paused 不影响 */
const introVisible = ref(false)
let introTimer: ReturnType<typeof setTimeout> | null = null

function clearIntro(): void {
  if (introTimer) {
    clearTimeout(introTimer)
    introTimer = null
  }
}

/** 当前站故事摘要(首段,截断 110 字) */
const storyExcerpt = computed(() => {
  const first = current.value?.story?.[0] ?? ''
  return first.length > 110 ? `${first.slice(0, 110)}…` : first
})

function viewDest(): void {
  const id = current.value?.id
  if (!id) return
  ui.toggleShowcase(false)
  explore.selectDestination(id)
}

function resetTimer(): void {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (paused.value) return
  timer = setTimeout(() => next(1), AUTO_MS)
}

function next(step: number): void {
  const n = photos.value.length
  if (!n) return
  idx.value = (idx.value + step + n) % n
  resetTimer()
}

function jump(i: number): void {
  idx.value = i
  resetTimer()
}

// —— 巡展音频(复用 TourAudio;默认静音,手势解锁,翻页钟声) ——
let audio: TourAudio | null = null
const audioOn = ref(false)

async function toggleSound(): Promise<void> {
  if (!audio) audio = new TourAudio()
  if (audioOn.value) {
    audio.disable()
    audioOn.value = false
  } else {
    await audio.enable()
    audioOn.value = audio.enabled
  }
}

/** 打开期间监听 ←/→ 翻页 */
function onKey(e: KeyboardEvent): void {
  if (e.key === 'ArrowLeft') next(-1)
  else if (e.key === 'ArrowRight') next(1)
}

watch(
  () => ui.showcaseOpen,
  (open) => {
    resetTimer() // open:启动自动轮播;close:清理
    if (open) {
      idx.value = 0
      paused.value = false
      // 策展语片头:3.5s 后淡出
      introVisible.value = true
      clearIntro()
      introTimer = setTimeout(() => (introVisible.value = false), 3_500)
      window.addEventListener('keydown', onKey)
    } else {
      clearIntro()
      introVisible.value = false
      window.removeEventListener('keydown', onKey)
    }
  },
  { immediate: true },
)

/** 翻页钟声(开启音频时) */
watch(idx, () => {
  if (audioOn.value) audio?.chime()
})

onUnmounted(() => {
  resetTimer()
  clearIntro()
  window.removeEventListener('keydown', onKey)
  audio?.dispose()
  audio = null
})
</script>

<template>
  <Teleport to="body">
    <Transition name="showcase-fade">
      <div
        v-if="ui.showcaseOpen && collection && photos.length"
        class="showcase"
        role="dialog"
        aria-modal="true"
        :aria-label="`${collection.name} 沉浸巡展`"
      >
        <!-- 显式时长:元素自带 9.2s Ken Burns 动画,Vue 端点嗅探会误读离开时长 -->
        <Transition
          name="photo-fade"
          :duration="300"
        >
          <img
            :key="current?.id"
            class="photo"
            :class="{ 'kb-paused': paused }"
            :style="{ animationDuration: `${AUTO_MS + 1200}ms`, animationName: idx % 2 ? 'kb-out' : 'kb-in' }"
            :src="current?.media?.file"
            :alt="current?.name ?? ''"
          >
        </Transition>

        <div class="scrim" />

        <button
          class="close"
          aria-label="退出巡展"
          @click="ui.toggleShowcase(false)"
        >
          ✕ 退出
        </button>

        <button
          class="arrow prev"
          aria-label="上一张"
          @click="next(-1)"
        >
          ‹
        </button>
        <button
          class="arrow next"
          aria-label="下一张"
          @click="next(1)"
        >
          ›
        </button>

        <!-- 策展语片头 -->
        <Transition name="intro-fade">
          <div
            v-if="introVisible"
            class="curator-intro"
            role="status"
          >
            <p class="we-caps-label gold">
              {{ collection.name }}
            </p>
            <p class="intro-text">
              {{ collection.curatorNote }}
            </p>
          </div>
        </Transition>

        <div class="caption">
          <p class="we-caps-label gold">
            {{ collection.name }} · 沉浸巡展
          </p>
          <p class="dest-name">
            {{ current?.name }}
          </p>
          <p
            v-if="storyExcerpt"
            class="story-excerpt"
          >
            {{ storyExcerpt }}
          </p>
          <div class="caption-ops">
            <button
              class="view-dest"
              @click="viewDest"
            >
              查看完整档案 →
            </button>
            <p class="credit">
              © {{ current?.media?.author }} · {{ current?.media?.license }}
            </p>
          </div>
        </div>

        <div
          class="dots"
          role="group"
          aria-label="巡展页码"
        >
          <button
            v-for="(p, i) in photos"
            :key="p.id"
            class="dot"
            :class="{ active: i === idx }"
            :aria-label="`第 ${i + 1} 张:${p.name}`"
            @click="jump(i)"
          />
        </div>

        <button
          class="pause"
          @click="paused = !paused; resetTimer()"
        >
          {{ paused ? '▶ 自动播放' : '‖ 暂停播放' }}
        </button>
        <button
          class="sound"
          :class="{ on: audioOn }"
          :aria-label="audioOn ? '关闭巡展环境音' : '开启巡展环境音'"
          :title="audioOn ? '关闭环境音' : '开启环境音(程序合成,默认静音)'"
          @click="toggleSound"
        >
          {{ audioOn ? '🔊' : '🔇' }}
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.showcase {
  position: fixed;
  inset: 0;
  z-index: var(--we-z-modal);
  background: var(--we-void);
  overflow: hidden;
}
.photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation-timing-function: linear;
  animation-fill-mode: both;
  will-change: transform;
}
/* Ken Burns 缓动:奇偶交替推近/拉远(时长 = 停留时长 + 1.2s,全周期覆盖) */
@keyframes kb-in {
  from {
    transform: scale(1) translate(0, 0);
  }
  to {
    transform: scale(1.1) translate(-1.8%, 1.2%);
  }
}
@keyframes kb-out {
  from {
    transform: scale(1.12) translate(1.5%, -1%);
  }
  to {
    transform: scale(1) translate(0, 0);
  }
}
.kb-paused {
  animation-play-state: paused !important;
}
@media (prefers-reduced-motion: reduce) {
  .photo {
    animation: none !important;
  }
}
.photo-fade-enter-active {
  transition: opacity var(--we-dur-3) var(--we-ease-out);
}
.photo-fade-leave-active {
  transition: opacity var(--we-dur-3) var(--we-ease-out);
}
.photo-fade-enter-from,
.photo-fade-leave-to {
  opacity: 0;
}
.scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(3, 6, 9, 0.35) 0%, transparent 30%, rgba(3, 6, 9, 0.86) 100%);
  pointer-events: none;
}

.close {
  position: absolute;
  top: var(--we-sp-4);
  right: var(--we-sp-4);
  appearance: none;
  border: 1px solid var(--we-glass-border);
  background: var(--we-glass);
  color: var(--we-text-dim);
  font-size: var(--we-fs-small);
  padding: 8px 16px;
  border-radius: var(--we-r-full);
  cursor: pointer;
}
.close:hover {
  color: var(--we-text-hi);
}

.arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  appearance: none;
  border: none;
  background: rgba(3, 6, 9, 0.35);
  color: rgba(239, 244, 252, 0.8);
  width: 52px;
  height: 84px;
  font-size: 34px;
  line-height: 1;
  cursor: pointer;
  border-radius: var(--we-r-md);
  transition: background var(--we-dur-1) var(--we-ease-out);
}
.arrow:hover {
  background: rgba(3, 6, 9, 0.6);
}
.arrow.prev {
  left: var(--we-sp-4);
}
.arrow.next {
  right: var(--we-sp-4);
}

.caption {
  position: absolute;
  left: var(--we-sp-8);
  bottom: var(--we-sp-8);
  max-width: 62%;
}
.caption p {
  margin: 0;
}
.dest-name {
  font-family: var(--we-serif);
  font-size: var(--we-fs-display);
  color: var(--we-text-hi);
  margin: var(--we-sp-2) 0 var(--we-sp-1);
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.8);
}
.story-excerpt {
  font-size: var(--we-fs-small);
  line-height: 1.8;
  color: rgba(239, 244, 252, 0.82);
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.8);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.caption-ops {
  display: flex;
  align-items: center;
  gap: var(--we-sp-3);
  margin-top: var(--we-sp-2);
}
.view-dest {
  appearance: none;
  border: 1px solid rgba(232, 200, 150, 0.4);
  background: rgba(3, 6, 9, 0.45);
  color: var(--we-gold);
  font-size: var(--we-fs-small);
  padding: 6px 14px;
  border-radius: var(--we-r-full);
  cursor: pointer;
  transition: all var(--we-dur-1) var(--we-ease-out);
}
.view-dest:hover {
  background: rgba(232, 200, 150, 0.12);
}
.credit {
  font-size: var(--we-fs-small);
  color: rgba(239, 244, 252, 0.72);
}

/* —— 策展语片头 —— */
.curator-intro {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--we-sp-4);
  background: rgba(3, 6, 9, 0.72);
  padding: var(--we-sp-8);
  text-align: center;
  pointer-events: none;
}
.curator-intro .we-caps-label {
  margin: 0;
}
.intro-text {
  max-width: 640px;
  font-family: var(--we-serif);
  font-size: var(--we-fs-h2);
  line-height: 2;
  color: var(--we-text-hi);
  margin: 0;
}
.intro-fade-enter-active,
.intro-fade-leave-active {
  transition: opacity 900ms var(--we-ease-out);
}
.intro-fade-enter-from,
.intro-fade-leave-to {
  opacity: 0;
}

.dots {
  position: absolute;
  left: 50%;
  bottom: var(--we-sp-5);
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}
.dot {
  appearance: none;
  border: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(239, 244, 252, 0.35);
  cursor: pointer;
  padding: 0;
  transition: all var(--we-dur-1) var(--we-ease-out);
}
.dot.active {
  background: var(--we-gold);
  transform: scale(1.25);
}

.pause {
  position: absolute;
  right: calc(var(--we-sp-8) + 52px);
  bottom: var(--we-sp-8);
  appearance: none;
  border: 1px solid var(--we-glass-border);
  background: var(--we-glass);
  color: var(--we-text-dim);
  font-size: var(--we-fs-small);
  padding: 7px 14px;
  border-radius: var(--we-r-full);
  cursor: pointer;
}
.pause:hover {
  color: var(--we-text-hi);
}
.sound {
  position: absolute;
  right: var(--we-sp-8);
  bottom: var(--we-sp-8);
  appearance: none;
  border: 1px solid var(--we-glass-border);
  background: var(--we-glass);
  color: var(--we-text-dim);
  font-size: var(--we-fs-body);
  width: 36px;
  height: 34px;
  border-radius: var(--we-r-full);
  cursor: pointer;
}
.sound:hover {
  color: var(--we-text-hi);
}
.sound.on {
  color: var(--we-gold-strong);
  border-color: rgba(232, 200, 150, 0.35);
}

.showcase-fade-enter-active,
.showcase-fade-leave-active {
  transition: opacity var(--we-dur-3) var(--we-ease-out);
}
.showcase-fade-enter-from,
.showcase-fade-leave-to {
  opacity: 0;
}

@media (max-width: 720px) {
  .caption {
    left: var(--we-sp-4);
    bottom: 96px;
    max-width: calc(100vw - var(--we-sp-8));
  }
  .dest-name {
    font-size: var(--we-fs-title);
  }
  .pause {
    right: var(--we-sp-4);
    bottom: var(--we-sp-4);
  }
  .dots {
    bottom: 56px;
  }
}
</style>
