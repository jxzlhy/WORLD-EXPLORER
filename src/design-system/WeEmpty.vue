<script setup lang="ts">
/** WeEmpty — 空状态 */
withDefaults(
  defineProps<{
    icon?: string
    title: string
    hint?: string
  }>(),
  { icon: '◍' },
)
</script>

<template>
  <div class="we-empty">
    <div
      class="icon"
      aria-hidden="true"
    >
      {{ icon }}
    </div>
    <p class="title">
      {{ title }}
    </p>
    <p
      v-if="hint"
      class="hint"
    >
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.we-empty {
  text-align: center;
  padding: var(--we-sp-8) var(--we-sp-5);
}
.icon {
  font-size: 30px;
  color: var(--we-text-faint);
  margin-bottom: var(--we-sp-3);
}
.title {
  color: var(--we-text-dim);
  font-size: var(--we-fs-body);
  margin: 0 0 var(--we-sp-1);
}
.hint {
  color: var(--we-text-faint);
  font-size: var(--we-fs-small);
  margin: 0;
}
</style>
