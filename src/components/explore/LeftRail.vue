<script setup lang="ts">
import { useUiStore } from '../../stores/ui-store'
import type { DayNightMode } from '../../engine/types'
import WeSwitch from '../../design-system/WeSwitch.vue'

const ui = useUiStore()

const dayNightOptions: Array<{ value: DayNightMode; label: string; icon: string }> = [
  { value: 'realtime', label: '实时', icon: '◐' },
  { value: 'always-day', label: '永昼', icon: '☀' },
  { value: 'always-night', label: '永夜', icon: '☾' },
]
</script>

<template>
  <aside class="left-rail glass-panel intro-item" aria-label="地球控制">
    <div class="section">
      <p class="we-caps-label">图层</p>
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
      <p class="we-caps-label">昼夜模式</p>
      <div class="segmented" role="radiogroup" aria-label="昼夜模式">
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
      <label class="row">
        <span>自动旋转</span>
        <WeSwitch v-model="ui.autoRotate" />
      </label>
      <label class="row">
        <span>低性能模式</span>
        <WeSwitch v-model="ui.lowPerf" />
      </label>
      <label class="row">
        <span>性能面板</span>
        <WeSwitch v-model="ui.showStats" />
      </label>
    </div>
  </aside>
</template>

<style scoped>
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
  background: rgba(6, 11, 20, 0.5);
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
  .left-rail {
    left: var(--we-sp-2);
    top: auto;
    bottom: 64px;
    transform: none;
    width: 176px;
    padding: var(--we-sp-3);
  }
}
</style>
