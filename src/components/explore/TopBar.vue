<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useUiStore } from '../../stores/ui-store'

const ui = useUiStore()

const plannedModules = ['DESTINATIONS', 'STORIES', 'JOURNEYS', 'CINEMA', 'WONDERS']
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <span class="glyph" aria-hidden="true">◉</span>
      <div class="names">
        <strong>WORLD EXPLORER</strong>
        <span>世界探索计划</span>
      </div>
    </div>

    <nav class="nav" aria-label="主导航">
      <button class="nav-item active">WORLD</button>
      <button
        v-for="m in plannedModules"
        :key="m"
        class="nav-item planned"
        :title="`${m} 模块规划中(见 ROADMAP)`"
        disabled
      >
        {{ m }}
      </button>
      <button class="nav-item" :class="{ active: ui.myWorldOpen }" @click="ui.toggleMyWorld()">
        MY WORLD
      </button>
    </nav>

    <div class="actions">
      <button class="search-btn" aria-label="搜索世界" @click="ui.toggleSearch(true)">
        <span aria-hidden="true">⌕</span>
        <span class="search-label">搜索世界</span>
        <kbd>⌘K</kbd>
      </button>
      <RouterLink class="design-link" to="/design" title="设计系统实验页">Aa</RouterLink>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: fixed;
  top: var(--we-sp-4);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--we-z-topbar);
  display: flex;
  align-items: center;
  gap: var(--we-sp-6);
  padding: 8px 16px;
  background: var(--we-glass);
  backdrop-filter: blur(var(--we-blur)) saturate(1.35);
  -webkit-backdrop-filter: blur(var(--we-blur)) saturate(1.35);
  border: 1px solid var(--we-glass-border);
  border-radius: var(--we-r-full);
  box-shadow: var(--we-shadow-panel), var(--we-inner-highlight);
  max-width: calc(100vw - 32px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}
.glyph {
  color: var(--we-gold);
  font-size: 18px;
  text-shadow: 0 0 14px rgba(232, 200, 150, 0.6);
}
.names {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}
.names strong {
  color: var(--we-text-hi);
  font-size: 13px;
  letter-spacing: 0.14em;
  font-weight: 700;
}
.names span {
  color: var(--we-text-dim);
  font-size: 10px;
  letter-spacing: 0.34em;
}

.nav {
  display: flex;
  align-items: center;
  gap: 2px;
  border-left: 1px solid var(--we-glass-border);
  padding-left: var(--we-sp-4);
}
.nav-item {
  appearance: none;
  border: none;
  background: none;
  color: var(--we-text-dim);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  padding: 6px 10px;
  border-radius: var(--we-r-full);
  cursor: pointer;
  transition:
    color var(--we-dur-1) var(--we-ease-out),
    background var(--we-dur-1) var(--we-ease-out);
}
.nav-item:hover:not(:disabled) {
  color: var(--we-text-hi);
  background: rgba(148, 180, 226, 0.1);
}
.nav-item.active {
  color: var(--we-gold-strong);
  background: rgba(232, 200, 150, 0.12);
}
.nav-item.planned {
  opacity: 0.4;
  cursor: not-allowed;
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--we-sp-2);
}
.search-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  appearance: none;
  border: 1px solid var(--we-glass-border);
  background: rgba(6, 11, 20, 0.5);
  color: var(--we-text-dim);
  border-radius: var(--we-r-full);
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition:
    border-color var(--we-dur-1) var(--we-ease-out),
    color var(--we-dur-1) var(--we-ease-out);
}
.search-btn:hover {
  border-color: rgba(111, 195, 255, 0.5);
  color: var(--we-text-hi);
}
.search-btn kbd {
  font-family: var(--we-mono);
  font-size: 10px;
  color: var(--we-text-faint);
  border: 1px solid var(--we-glass-border);
  border-radius: 4px;
  padding: 1px 5px;
}
.design-link {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--we-glass-border);
  color: var(--we-text-dim);
  font-family: var(--we-serif);
  font-size: 14px;
  transition: all var(--we-dur-1) var(--we-ease-out);
}
.design-link:hover {
  color: var(--we-gold-strong);
  border-color: rgba(232, 200, 150, 0.5);
  text-decoration: none;
}

@media (max-width: 1024px) {
  .nav-item.planned {
    display: none;
  }
}
@media (max-width: 768px) {
  .topbar {
    gap: var(--we-sp-3);
    padding: 6px 12px;
  }
  .names span {
    display: none;
  }
  .search-label {
    display: none;
  }
  .nav {
    padding-left: var(--we-sp-2);
  }
}
@media (max-width: 480px) {
  .topbar {
    gap: var(--we-sp-2);
    padding: 5px 10px;
  }
  .names {
    display: none; /* 仅保留 ◉ 品牌符号 */
  }
  .design-link {
    display: none; /* 设计实验页从状态栏仍可达 */
  }
  .search-btn kbd {
    display: none;
  }
  .nav-item {
    padding: 6px 8px;
    font-size: 10px;
  }
}
</style>
