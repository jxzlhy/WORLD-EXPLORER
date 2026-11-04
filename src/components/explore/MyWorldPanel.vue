<script setup lang="ts">
import { computed, ref } from 'vue'
import { useExploreStore } from '../../stores/explore-store'
import { useMyWorldStore } from '../../stores/my-world-store'
import { useUiStore } from '../../stores/ui-store'
import { exportAll } from '../../services/storage-service'
import { parseMyWorldImport, type MyWorldData } from '../../services/data-validator'
import GlassPanel from '../../design-system/GlassPanel.vue'
import WeButton from '../../design-system/WeButton.vue'
import WeEmpty from '../../design-system/WeEmpty.vue'

const ui = useUiStore()
const explore = useExploreStore()
const myWorld = useMyWorldStore()

type Tab = 'favorites' | 'wantToGo' | 'visited' | 'recent'
const tab = ref<Tab>('favorites')

const tabs: Array<{ id: Tab; label: string }> = [
  { id: 'favorites', label: '收藏' },
  { id: 'wantToGo', label: '想去' },
  { id: 'visited', label: '去过' },
  { id: 'recent', label: '最近探索' },
]

const list = computed(() => {
  const ids =
    tab.value === 'favorites'
      ? myWorld.favorites
      : tab.value === 'wantToGo'
        ? myWorld.wantToGo
        : tab.value === 'recent'
          ? explore.recentIds
          : myWorld.visited
  return ids
    .map((id) => explore.destinationById.get(id))
    .filter((d): d is NonNullable<typeof d> => !!d)
})

function exportData(): void {
  const payload = {
    app: 'WORLD EXPLORER',
    schema: 'my-world/v1',
    exportedAt: new Date().toISOString(),
    data: exportAll(),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `world-explorer-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const fileInput = ref<HTMLInputElement | null>(null)
const importError = ref('')
const importPreview = ref<{
  data: MyWorldData
  stats: { favorites: number; visited: number; wantToGo: number; notes: number; droppedIds: number }
  warnings: string[]
} | null>(null)

async function onImportFile(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  importError.value = ''
  importPreview.value = null
  const knownIds = new Set(explore.destinations.map((d) => d.id))
  const result = parseMyWorldImport(await file.text(), knownIds)
  if (!result.ok) {
    importError.value = result.error
    return
  }
  importPreview.value = { data: result.data, stats: result.stats, warnings: result.warnings }
}

/** 确认应用导入(校验已通过,写入后原地刷新 store,不整页重载) */
function confirmImport(): void {
  if (!importPreview.value) return
  myWorld.applyImport(importPreview.value.data)
  importPreview.value = null
}

function cancelImport(): void {
  importPreview.value = null
  importError.value = ''
}
</script>

<template>
  <Teleport to="body">
    <Transition name="myworld-slide">
      <GlassPanel
        v-if="ui.myWorldOpen"
        strong
        class="my-world"
      >
        <header class="head">
          <div>
            <p class="we-caps-label gold">
              MY WORLD
            </p>
            <h2>我的世界</h2>
          </div>
          <button
            class="close"
            aria-label="关闭"
            @click="ui.toggleMyWorld(false)"
          >
            ✕
          </button>
        </header>

        <div
          class="tabs"
          role="tablist"
        >
          <button
            v-for="t in tabs"
            :key="t.id"
            role="tab"
            :aria-selected="tab === t.id"
            class="tab"
            :class="{ active: tab === t.id }"
            @click="tab = t.id"
          >
            {{ t.label }}
          </button>
        </div>

        <div class="list">
          <WeEmpty
            v-if="!list.length"
            :title="`${tabs.find((t) => t.id === tab)!.label}列表还是空的`"
            hint="在任意目的地面板中点亮 ♡,它就会出现在这里"
          />
          <ul v-else>
            <li
              v-for="d in list"
              :key="d.id"
            >
              <button
                class="item"
                @click="explore.selectDestination(d.id); ui.toggleMyWorld(false)"
              >
                <span class="name">{{ d.name }}</span>
                <span class="country">{{ explore.countryById[d.countryId]?.name }}</span>
              </button>
            </li>
          </ul>
        </div>

        <footer class="data-ops">
          <WeButton
            variant="ghost"
            size="sm"
            @click="exportData"
          >
            导出 JSON
          </WeButton>
          <WeButton
            variant="ghost"
            size="sm"
            @click="fileInput?.click()"
          >
            导入 JSON
          </WeButton>
          <input
            ref="fileInput"
            type="file"
            accept="application/json"
            hidden
            @change="onImportFile"
          >
        </footer>

        <!-- 导入预览 / 错误 -->
        <div
          v-if="importError"
          class="import-msg error"
          role="alert"
        >
          ✕ {{ importError }}
        </div>
        <div
          v-if="importPreview"
          class="import-msg preview"
        >
          <p class="we-caps-label">
            导入预览
          </p>
          <ul class="preview-list">
            <li>收藏 {{ importPreview.stats.favorites }} · 想去 {{ importPreview.stats.wantToGo }} · 去过 {{ importPreview.stats.visited }} · 笔记 {{ importPreview.stats.notes }}</li>
            <li
              v-for="w in importPreview.warnings"
              :key="w"
              class="warn"
            >
              {{ w }}
            </li>
          </ul>
          <div class="preview-actions">
            <WeButton
              variant="primary"
              size="sm"
              @click="confirmImport"
            >
              确认导入
            </WeButton>
            <WeButton
              variant="ghost"
              size="sm"
              @click="cancelImport"
            >
              取消
            </WeButton>
          </div>
        </div>
      </GlassPanel>
    </Transition>
  </Teleport>
</template>

<style scoped>
.my-world {
  position: fixed;
  left: var(--we-sp-4);
  top: 84px;
  width: 320px;
  max-height: calc(100vh - 108px);
  z-index: var(--we-z-overlay);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--we-sp-4) var(--we-sp-4) 0;
}
.head p {
  margin: 0;
}
.head h2 {
  margin: 2px 0 0;
  font-family: var(--we-serif);
  font-size: var(--we-fs-title);
  color: var(--we-text-hi);
}
.close {
  appearance: none;
  border: 1px solid var(--we-glass-border);
  background: rgba(6, 11, 20, 0.6);
  color: var(--we-text-dim);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 11px;
}
.close:hover {
  color: var(--we-text-hi);
}

.tabs {
  display: flex;
  gap: 4px;
  margin: var(--we-sp-3) var(--we-sp-4) 0;
  background: rgba(6, 11, 20, 0.5);
  border: 1px solid var(--we-glass-border);
  border-radius: var(--we-r-full);
  padding: 3px;
}
.tab {
  flex: 1;
  appearance: none;
  border: none;
  background: none;
  color: var(--we-text-dim);
  font-size: var(--we-fs-small);
  font-weight: 600;
  padding: 6px 0;
  border-radius: var(--we-r-full);
  cursor: pointer;
  transition: all var(--we-dur-1) var(--we-ease-out);
}
.tab.active {
  background: rgba(232, 200, 150, 0.15);
  color: var(--we-gold-strong);
}

.list {
  flex: 1;
  overflow-y: auto;
  padding: var(--we-sp-3);
}
.list ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.item {
  width: 100%;
  appearance: none;
  border: none;
  background: none;
  display: flex;
  align-items: baseline;
  gap: var(--we-sp-2);
  padding: 9px 12px;
  border-radius: var(--we-r-sm);
  cursor: pointer;
  text-align: left;
  transition: background var(--we-dur-1) var(--we-ease-out);
}
.item:hover {
  background: rgba(111, 195, 255, 0.08);
}
.item .name {
  font-weight: 600;
  color: var(--we-text-hi);
  font-size: var(--we-fs-body);
}
.item .country {
  margin-left: auto;
  color: var(--we-text-faint);
  font-size: var(--we-fs-micro);
}

.data-ops {
  display: flex;
  gap: var(--we-sp-2);
  padding: var(--we-sp-3) var(--we-sp-4);
  border-top: 1px solid var(--we-glass-border);
}

.import-msg {
  margin: 0 var(--we-sp-4) var(--we-sp-3);
  padding: var(--we-sp-3);
  border-radius: var(--we-r-sm);
  font-size: var(--we-fs-small);
}
.import-msg.error {
  border: 1px solid rgba(232, 106, 106, 0.4);
  background: rgba(232, 106, 106, 0.1);
  color: var(--we-danger);
}
.import-msg.preview {
  border: 1px solid rgba(111, 195, 255, 0.35);
  background: rgba(111, 195, 255, 0.08);
}
.preview-list {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  color: var(--we-text);
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.preview-list .warn {
  color: var(--we-warning);
  font-size: var(--we-fs-micro);
}
.preview-actions {
  display: flex;
  gap: var(--we-sp-2);
  margin-top: var(--we-sp-3);
}

.myworld-slide-enter-active,
.myworld-slide-leave-active {
  transition:
    transform var(--we-dur-3) var(--we-ease-out),
    opacity var(--we-dur-2) var(--we-ease-out);
}
.myworld-slide-enter-from,
.myworld-slide-leave-to {
  transform: translateX(-28px);
  opacity: 0;
}

@media (max-width: 768px) {
  .my-world {
    left: var(--we-sp-2);
    right: var(--we-sp-2);
    width: auto;
    top: 72px;
  }
}
</style>
