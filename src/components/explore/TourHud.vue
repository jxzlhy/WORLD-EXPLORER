<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue'
import { useExploreStore } from '../../stores/explore-store'
import WeButton from '../../design-system/WeButton.vue'

/**
 * TourHud — 合集镜头巡游控制条(V4.5 雏形)。
 * 仅在 explore.tour 非空时挂载(由 ExploreView v-if 控制),
 * 因此停留倒计时定时器随组件卸载而释放,不留在 store 层。
 */
const explore = useExploreStore()

/** 每站停留时长:飞行落地后留给面板阅读的时间 */
const DWELL_MS = 8_000

let dwellTimer: ReturnType<typeof setTimeout> | null = null

function clearDwell(): void {
  if (dwellTimer) {
    clearTimeout(dwellTimer)
    dwellTimer = null
  }
}

/** 飞行落地(pendingFlight 清空)且未暂停 → 开始本站倒计时 */
watch(
  () => [explore.pendingFlight, explore.tour?.paused, explore.tour?.index] as const,
  () => {
    clearDwell()
    if (!explore.tour || explore.tour.paused) return
    if (explore.pendingFlight) return // 仍在航段中
    dwellTimer = setTimeout(() => explore.nextTourStop(), DWELL_MS)
  },
  { immediate: true },
)

onUnmounted(clearDwell)

const collectionName = computed(() => explore.tourCollection?.name ?? '')
const current = computed(() => explore.tourCurrent)
const index = computed(() => explore.tour?.index ?? 0)
const total = computed(() => explore.tourStops.length)
const paused = computed(() => explore.tour?.paused ?? false)
/** 进度:已飞过的航段占比(到站即计入) */
const progress = computed(() => (total.value ? ((index.value + 1) / total.value) * 100 : 0))
</script>

<template>
  <div
    class="tour-hud"
    role="region"
    aria-label="镜头巡游控制"
  >
    <div class="info">
      <p class="we-caps-label gold">
        {{ collectionName }}
      </p>
      <p class="stop-name">
        <span class="counter mono">第 {{ index + 1 }} / {{ total }} 站</span>
        <span class="n">{{ current?.name }}</span>
      </p>
    </div>

    <div
      class="progress"
      aria-hidden="true"
    >
      <i :style="{ width: `${progress}%` }" />
    </div>

    <div class="controls">
      <WeButton
        variant="ghost"
        size="sm"
        :disabled="index <= 0"
        aria-label="上一站"
        @click="explore.prevTourStop()"
      >
        ◀ 上一站
      </WeButton>
      <WeButton
        v-if="!paused"
        variant="glass"
        size="sm"
        aria-label="暂停巡游"
        @click="explore.pauseTour()"
      >
        ‖ 暂停
      </WeButton>
      <WeButton
        v-else
        variant="spatial"
        size="sm"
        aria-label="继续巡游"
        @click="explore.resumeTour()"
      >
        ▶ 继续
      </WeButton>
      <WeButton
        variant="ghost"
        size="sm"
        :disabled="index >= total - 1"
        aria-label="下一站"
        @click="explore.nextTourStop()"
      >
        下一站 ▶
      </WeButton>
      <WeButton
        variant="ghost"
        size="sm"
        aria-label="结束巡游"
        @click="explore.stopTour()"
      >
        ✕
      </WeButton>
    </div>
  </div>
</template>

<style scoped>
.tour-hud {
  position: fixed;
  left: 50%;
  bottom: var(--we-sp-4);
  transform: translateX(-50%);
  z-index: var(--we-z-panel);
  display: flex;
  flex-direction: column;
  gap: var(--we-sp-2);
  width: min(420px, calc(100vw - var(--we-sp-8)));
  padding: var(--we-sp-3) var(--we-sp-4);
  background: var(--we-glass-strong);
  backdrop-filter: blur(var(--we-blur-soft));
  -webkit-backdrop-filter: blur(var(--we-blur-soft));
  border: 1px solid var(--we-glass-border);
  border-radius: var(--we-r-lg);
  box-shadow: var(--we-shadow-pop);
}
/* 窄屏:上移避开 DiscoverBar / StatusBar */
@media (max-width: 720px) {
  .tour-hud {
    bottom: calc(var(--we-sp-4) + 56px);
  }
}

.info {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--we-sp-3);
}
.info .we-caps-label {
  margin: 0;
}
.stop-name {
  display: flex;
  align-items: baseline;
  gap: var(--we-sp-2);
  margin: 0;
  min-width: 0;
}
.counter {
  color: var(--we-text-faint);
  font-size: var(--we-fs-micro);
  white-space: nowrap;
}
.stop-name .n {
  color: var(--we-text-hi);
  font-family: var(--we-serif);
  font-size: var(--we-fs-body);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress {
  height: 3px;
  border-radius: var(--we-r-full);
  background: var(--we-glass-tint);
  overflow: hidden;
}
.progress i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--we-gold);
  transition: width var(--we-dur-3) var(--we-ease-out);
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--we-sp-2);
}
</style>
