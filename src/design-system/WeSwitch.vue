<script setup lang="ts">
/** WeSwitch — 开关(图层/模式控制) */
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <button
    class="we-switch"
    :class="{ on: model }"
    role="switch"
    :aria-checked="model"
    @click="model = !model"
  >
    <span class="knob" />
  </button>
</template>

<style scoped>
.we-switch {
  width: 34px;
  height: 20px;
  border-radius: var(--we-r-full);
  border: 1px solid var(--we-glass-border);
  background: var(--we-well-strong);
  position: relative;
  cursor: pointer;
  padding: 0;
  transition:
    background var(--we-dur-2) var(--we-ease-out),
    border-color var(--we-dur-2) var(--we-ease-out);
  flex: none;
}
.we-switch .knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--we-text-dim);
  transition:
    left var(--we-dur-2) var(--we-ease-out),
    background var(--we-dur-2) var(--we-ease-out);
}
.we-switch.on {
  background: rgba(111, 195, 255, 0.22);
  border-color: rgba(111, 195, 255, 0.45);
}
.we-switch.on .knob {
  left: 16px;
  background: var(--we-cyan);
}
</style>
