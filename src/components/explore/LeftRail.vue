<script setup lang="ts">
import { useUiStore } from '../../stores/ui-store'
import type { DayNightMode, QualityMode } from '../../engine/types'
import WeSwitch from '../../design-system/WeSwitch.vue'

const ui = useUiStore()

const dayNightOptions: Array<{ value: DayNightMode; label: string; icon: string }> = [
  { value: 'realtime', label: '实时', icon: '◐' },
  { value: 'always-day', label: '永昼', icon: '☀' },
  { value: 'always-night', label: '永夜', icon: '☾' },
]

const qualityOptions: Array<{ value: QualityMode; label: string; hint: string }> = [
  { value: 'high', label: '高', hint: '原生分辨率 + FXAA' },
  { value: 'balanced', label: '均衡', hint: '0.85x 渲染分辨率 + FXAA' },
  { value: 'low', label: '低', hint: '0.7x 分辨率,关闭 FXAA(弱设备)' },
]
</script>

<template>
  <!-- 移动端抽屉开关(仅 ≤768px 显示) -->
  <button
    class="rail-toggle glass-btn"
    aria-label="地球控制"
    :aria-expanded="ui.mobileControlsOpen"
    @click="ui.toggleMobileControls()"
  >
    {{ ui.mobileControlsOpen ? '✕' : '⚙' }}
  </button>

  <aside
    class="left-rail glass-panel intro-item"
    :class="{ open: ui.mobileControlsOpen }"
    aria-label="地球控制"
  >
    <div class="section">
      <p class="we-caps-label">
        图层
      </p>
      <label class="row">
        <span>国家边界</span>
        <WeSwitch v-model="ui.layers.countries" />
      </label>
      <label class="row">
        <span>地点标记</span>
        <WeSwitch v-model="ui.layers.markers" />
      </label>
      <label class="row">
        <span>地点标签</span>
        <WeSwitch v-model="ui.layers.labels" />
      </label>
    </div>

    <div class="divider" />

    <div class="section">
      <p class="we-caps-label">
        昼夜模式
      </p>
      <div
        class="segmented"
        role="radiogroup"
        aria-label="昼夜模式"
      >
        <button
          v-for="opt in dayNightOptions"
          :key="opt.value"
          class="seg"
          :class="{ active: ui.dayNightMode === opt.value }"
          :title="opt.label"
          @click="ui.setDayNightMode(opt.value)"
        >
          <span aria-hidden="true">{{ opt.icon }}</span>{{ opt.label }}
        </button>
      </div>
    </div>

    <div class="divider" />

    <div class="section">
      <p class="we-caps-label">画质</p>
      <div class="segmented" role="radiogroup" aria-label="渲染画质">
        <button
          v-for="opt in qualityOptions"
          :key="opt.value"
          class="seg"
          :class="{ active: ui.quality === opt.value }"
          :title="opt.hint"
          @click="ui.setQuality(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
      <label class="row">
        <span>自动旋转</span>
        <WeSwitch v-model="ui.autoRotate" />
      </label>
      <label class="row">
        <span>性能面板</span>
        <WeSwitch v-model="ui.showStats" />
      </label>
    </div>
  </aside>
</template>

<style scoped>
.rail-toggle {
  display: none;
  position: fixed;
  right: var(--we-sp-2);
  bottom: 56px;
  z-index: var(--we-z-panel);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--we-glass-border);
  background: var(--we-glass-strong);
  backdrop-filter: blur(var(--we-blur-soft));
  -webkit-backdrop-filter: blur(var(--we-blur-soft));
  color: var(--we-text);
  font-size: 16px;
  cursor: pointer;
  box-shadow: var(--we-shadow-pop);
}

.left-rail {
  position: fixed;
  left: var(--we-sp-4);
  top: 50%;
  transform: translateY(-50%);
  z-index: var(--we-z-panel);
  width: 196px;
  padding: var(--we-sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--we-sp-3);
}
.section {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.section p {
  margin: 0;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--we-fs-small);
  color: var(--we-text);
  cursor: pointer;
  gap: var(--we-sp-2);
}
.divider {
  height: 1px;
  background: var(--we-glass-border);
  margin: 2px 0;
}
.segmented {
  display: flex;
  gap: 4px;
  background: var(--we-well);
  border: 1px solid var(--we-glass-border);
  border-radius: var(--we-r-full);
  padding: 3px;
}
.seg {
  flex: 1;
  appearance: none;
  border: none;
  background: none;
  color: var(--we-text-dim);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 5px 4px;
  border-radius: var(--we-r-full);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all var(--we-dur-1) var(--we-ease-out);
}
.seg:hover {
  color: var(--we-text-hi);
}
.seg.active {
  background: rgba(111, 195, 255, 0.2);
  color: var(--we-cyan);
}

@media (max-width: 768px) {
  .rail-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .left-rail {
    left: var(--we-sp-2);
    right: var(--we-sp-2);
    top: auto;
    bottom: 104px;
    transform: none;
    width: auto;
    max-height: 46vh;
    overflow-y: auto;
    padding: var(--we-sp-3);
    opacity: 0;
    pointer-events: none;
    transform: translateY(10px);
    transition:
      opacity var(--we-dur-2) var(--we-ease-out),
      transform var(--we-dur-2) var(--we-ease-out);
  }
  .left-rail.open {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
}
</style>
