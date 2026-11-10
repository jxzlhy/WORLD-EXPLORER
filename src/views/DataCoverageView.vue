<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { buildCoverageStats, type CoverageStats } from '../services/coverage-stats'
import { loadWorldData } from '../services/data-service'
import WeSpinner from '../design-system/WeSpinner.vue'
import WeEmpty from '../design-system/WeEmpty.vue'

/**
 * DataCoverageView — 数据覆盖统计(V5.0 数据质量监控雏形)。
 * 只读面板:质量分级 / 照片·时间轴·人物覆盖 / 合集与按国矩阵。独立路由 /stats。
 */
const stats = ref<CoverageStats | null>(null)
const error = ref('')
const loading = ref(true)

const summaryCards = computed(() => {
  const s = stats.value
  if (!s) return []
  return [
    { label: '目的地总数', value: s.total, sub: `S ${s.byQuality.S} · A ${s.byQuality.A} · B ${s.byQuality.B}` },
    { label: '已核验照片', value: s.verifiedPhotos, sub: `覆盖率 ${s.photoPct}%` },
    { label: '时间轴', value: s.timelineCount, sub: `${Math.round((s.timelineCount / s.total) * 100)}% 覆盖` },
    { label: '人物档案', value: s.peopleCount, sub: `关联 ${s.peopleLinked} 处目的地` },
    { label: '主题合集', value: s.collections.length, sub: `${s.collections.reduce((sum, c) => sum + c.members, 0)} 个收录位` },
  ]
})

onMounted(async () => {
  try {
    const data = await loadWorldData()
    stats.value = buildCoverageStats(data.destinations, data.people ?? [], data.collections ?? [])
  } catch (err) {
    error.value = String(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="stats-page">
    <header class="head">
      <p class="we-caps-label gold">V5.0 · LIVING WORLD</p>
      <h1>数据覆盖统计</h1>
      <p class="sub">
        数据质量监控雏形 · 只读 ·
        <router-link
          to="/"
          class="back"
        >← 返回探索</router-link>
      </p>
    </header>

    <WeSpinner
      v-if="loading"
      :size="30"
      label="统计中"
    />
    <WeEmpty
      v-else-if="error"
      title="统计失败"
      :hint="error"
    />

    <template v-else-if="stats">
      <section class="cards">
        <div
          v-for="c in summaryCards"
          :key="c.label"
          class="card"
        >
          <p class="value mono">{{ c.value }}</p>
          <p class="label">{{ c.label }}</p>
          <p class="sub">{{ c.sub }}</p>
        </div>
      </section>

      <section class="block">
        <p class="we-caps-label">按国矩阵(目的地数 · 照片 · 时间轴)</p>
        <table class="matrix">
          <thead>
            <tr>
              <th>国家</th>
              <th>目的地</th>
              <th>照片</th>
              <th>时间轴</th>
              <th>照片覆盖</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in stats.byCountry"
              :key="row.countryId"
            >
              <td class="mono">{{ row.countryId }}</td>
              <td class="mono">{{ row.total }}</td>
              <td class="mono">{{ row.verified }}</td>
              <td class="mono">{{ row.timeline }}</td>
              <td class="bar-cell">
                <span class="bar"><i :style="{ width: `${row.total ? (row.verified / row.total) * 100 : 0}%` }" /></span>
                <span class="mono pct">{{ row.total ? Math.round((row.verified / row.total) * 100) : 0 }}%</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="block">
        <p class="we-caps-label">合集覆盖(收录位 · 照片 · 时间轴)</p>
        <table class="matrix">
          <thead>
            <tr>
              <th>合集</th>
              <th>收录位</th>
              <th>照片</th>
              <th>时间轴</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in stats.collections"
              :key="c.id"
            >
              <td>{{ c.name }}</td>
              <td class="mono">{{ c.members }}</td>
              <td class="mono">{{ c.verified }}</td>
              <td class="mono">{{ c.timeline }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

<style scoped>
.stats-page {
  min-height: 100vh;
  background: var(--we-void);
  color: var(--we-text);
  padding: var(--we-sp-8) var(--we-sp-6) 20vh;
  max-width: 860px;
  margin: 0 auto;
}
.head h1 {
  margin: var(--we-sp-2) 0 0;
  font-family: var(--we-serif);
  font-size: var(--we-fs-display);
  color: var(--we-text-hi);
}
.head .sub {
  color: var(--we-text-faint);
  font-size: var(--we-fs-small);
}
.back {
  color: var(--we-gold);
  text-decoration: none;
  border-bottom: 1px dotted rgba(232, 200, 150, 0.4);
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--we-sp-3);
  margin: var(--we-sp-6) 0;
}
.card {
  border: 1px solid var(--we-glass-border);
  background: var(--we-glass);
  border-radius: var(--we-r-md);
  padding: var(--we-sp-4);
}
.card .value {
  margin: 0;
  font-size: 28px;
  color: var(--we-gold);
}
.card .label {
  margin: 4px 0 0;
  font-size: var(--we-fs-small);
  color: var(--we-text-hi);
}
.card .sub {
  margin: 2px 0 0;
  font-size: var(--we-fs-micro);
  color: var(--we-text-faint);
}

.block {
  margin: var(--we-sp-6) 0;
}
.block .we-caps-label {
  margin: 0 0 var(--we-sp-2);
}
.matrix {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--we-fs-small);
}
.matrix th {
  text-align: left;
  color: var(--we-text-faint);
  font-weight: 600;
  padding: 6px 10px;
  border-bottom: 1px solid var(--we-glass-border);
}
.matrix td {
  padding: 7px 10px;
  border-bottom: 1px solid rgba(148, 180, 226, 0.08);
  color: var(--we-text);
}
.bar-cell {
  display: flex;
  align-items: center;
  gap: var(--we-sp-2);
}
.bar {
  flex: 1;
  height: 4px;
  border-radius: var(--we-r-full);
  background: var(--we-glass-tint);
  overflow: hidden;
  display: inline-block;
}
.bar i {
  display: block;
  height: 100%;
  background: var(--we-gold);
  border-radius: inherit;
}
.pct {
  flex: none;
  width: 4ch;
  text-align: right;
  color: var(--we-text-dim);
}
</style>
