<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { useExploreStore } from '../../stores/explore-store'
import { buildSimilarDestinations } from '../../stores/explore-store'
import { useMyWorldStore } from '../../stores/my-world-store'
import { useUiStore } from '../../stores/ui-store'
import { DESTINATION_TYPE_LABELS } from '../../domain/types'

/**
 * ImmersiveReader — 全屏沉浸阅读(V2.5)。
 * 目的地档案的全屏呈现:暗化照片背景 + 逐段交错浮现(GSAP,尊重 prefers-reduced-motion)。
 * 退出:右上角按钮或 Esc(ExploreView 全局键位)。
 */
const explore = useExploreStore()
const myWorld = useMyWorldStore()
const ui = useUiStore()

const dest = computed(() => explore.selectedDestination)
const verifiedBg = computed(() =>
  dest.value?.media?.status === 'verified' ? (dest.value.media.file ?? '') : '',
)

/** 相似目的地(V5.0):沉浸内连续浏览——点击后保持沉浸,内容切换 */
const similarDests = computed(() =>
  dest.value
    ? buildSimilarDestinations(
        explore.destinations,
        dest.value.id,
        explore.collections,
        Object.fromEntries(explore.countries.map((c) => [c.id, c.name])),
        3,
      )
    : [],
)

const prefersReducedMotion =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** 阅读进度(0-100):沉浸容器滚动比例;打开/内容切换时归零 */
const progress = ref(0)

let lastMeasure = 0

function updateProgress(): void {
  const el = rootEl.value
  if (!el) return
  const denom = Math.max(1, el.scrollHeight - el.clientHeight)
  progress.value = Math.min(100, Math.round((el.scrollTop / denom) * 100))
  // 内容尺寸随图片/字体可能变化:滚动时节流重测章节锚点(150ms)
  const now = performance.now()
  if (now - lastMeasure > 150) {
    lastMeasure = now
    measureSections()
  } else {
    deriveActive()
  }
}

const rootEl = ref<HTMLElement | null>(null)

/** 章节锚点(渲染自 data-section 块;pct = 该块顶部在滚动行程中的百分比位置) */
export interface SectionMarker {
  key: string
  name: string
  pct: number
}
const SECTION_NAMES: Record<string, string> = {
  lead: '导语',
  story: '正文',
  timeline: '时间轴',
  note: '我的笔记',
  sources: '资料来源',
}
const markers = ref<SectionMarker[]>([])
const activeKey = ref('')

function measureSections(): void {
  const root = rootEl.value
  if (!root) return
  const denom = Math.max(1, root.scrollHeight - root.clientHeight)
  // 可滚行程 < 视口 60% 时章节锚点无区分度(所有块几乎同时可见)→ 隐藏 markers,进度条保留
  if (denom < root.clientHeight * 0.6) {
    markers.value = []
    return
  }
  const blocks = root.querySelectorAll<HTMLElement>('[data-section]')
  const next: SectionMarker[] = []
  blocks.forEach((b) => {
    const key = b.dataset.section!
    if (!SECTION_NAMES[key]) return
    next.push({
      key,
      name: SECTION_NAMES[key]!,
      pct: Math.min(100, Math.round((b.offsetTop / denom) * 100)),
    })
  })
  markers.value = next
  deriveActive()
}

/** 当前章节 = 最后一个 pct ≤ 阅读进度的锚点 */
function deriveActive(): void {
  let key = markers.value[0]?.key ?? ''
  for (const m of markers.value) {
    if (m.pct <= progress.value + 2) key = m.key
  }
  activeKey.value = key
}

function jumpTo(key: string): void {
  const root = rootEl.value
  const block = root?.querySelector<HTMLElement>(`[data-section="${key}"]`)
  if (!root || !block) return
  const denom = Math.max(1, root.scrollHeight - root.clientHeight)
  root.scrollTo({
    top: Math.min(block.offsetTop - 48, denom),
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
  })
}

/** PgDn/PgUp:按章节顺序键盘导航 */
function jumpBySection(step: number): void {
  const keys = markers.value.map((m) => m.key)
  const at = keys.indexOf(activeKey.value)
  const target = keys[Math.max(0, Math.min(keys.length - 1, (at === -1 ? 0 : at) + step))]
  if (target) jumpTo(target)
}

function onReaderKey(e: KeyboardEvent): void {
  if (e.key === 'PageDown') {
    e.preventDefault()
    jumpBySection(1)
  } else if (e.key === 'PageUp') {
    e.preventDefault()
    jumpBySection(-1)
  }
}

watch(
  () => [ui.immersiveOpen, dest.value?.id] as const,
  async ([open]) => {
    progress.value = 0
    markers.value = []
    activeKey.value = ''
    if (!open) {
      window.removeEventListener('keydown', onReaderKey)
      return
    }
    window.addEventListener('keydown', onReaderKey)
    await nextTick()
    // 切换目的地/打开:滚动归零(新档案从顶部开始)
    if (rootEl.value) rootEl.value.scrollTop = 0
    // GSAP 交错入场不改布局,offsetTop 稳定;等待一轮渲染后测量
    await nextTick()
    updateProgress()
    measureSections()
  },
)

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
  window.removeEventListener('keydown', onReaderKey)
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
        ref="rootEl"
        class="immersive"
        role="dialog"
        aria-modal="true"
        :aria-label="`${dest.name} 沉浸阅读`"
        @scroll.passive="updateProgress"
      >
        <!-- 阅读进度(顶部细线)+ 章节锚点(可交互,不设 aria-hidden) -->
        <div class="progress-rail">
          <i
            aria-hidden="true"
            :style="{ width: `${progress}%` }"
          />
          <button
            v-for="m in markers"
            :key="m.key"
            class="marker"
            :class="{ active: activeKey === m.key }"
            :style="{ left: `${m.pct}%` }"
            :title="m.name"
            :aria-label="`跳转到${m.name}`"
            @click="jumpTo(m.key)"
          />
        </div>
        <span
          class="progress-pct mono"
          aria-label="阅读进度"
        >{{ progress }}%</span>

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

          <p
            class="lead"
            data-section="lead"
          >
            {{ dest.summary }}
          </p>

          <div
            class="ornament"
            aria-hidden="true"
          >
            <i /><span>✦</span><i />
          </div>

          <section
            class="story"
            data-section="story"
          >
            <p
              v-for="(para, i) in dest.story"
              :key="i"
            >
              {{ para }}
            </p>
          </section>

          <!-- 我的笔记(只读回显;编辑请在档案面板) -->
          <section
            v-if="myWorld.notes[dest.id]"
            class="my-note-ro"
            data-section="note"
          >
            <p class="we-caps-label gold">✎ 我的笔记</p>
            <p class="note-text">
              {{ myWorld.notes[dest.id] }}
            </p>
          </section>

          <!-- 相似目的地(V5.0):沉浸内连续浏览 -->
          <section
            v-if="similarDests.length"
            class="imm-similar"
            data-section="similar"
          >
            <p class="we-caps-label">看过这处的人也看</p>
            <div class="sim-chips">
              <button
                v-for="r in similarDests"
                :key="r.dest.id"
                class="sim-chip"
                :title="r.reason"
                @click="explore.selectDestination(r.dest.id)"
              >
                <span class="n">{{ r.dest.name }}</span>
                <span class="why">{{ r.reason }}</span>
              </button>
            </div>
          </section>

          <div
            v-if="dest.timeline?.length"
            class="timeline"
            data-section="timeline"
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

          <footer
            class="sources"
            data-section="sources"
          >
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

.progress-rail {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 3;
  background: var(--we-glass-tint);
}
.progress-rail i {
  display: block;
  height: 100%;
  background: var(--we-gold);
  transition: width var(--we-dur-1) var(--we-ease-out);
}
.marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid rgba(232, 200, 150, 0.55);
  background: var(--we-void);
  cursor: pointer;
  padding: 0;
  transition: all var(--we-dur-1) var(--we-ease-out);
}
.marker:hover {
  transform: translate(-50%, -50%) scale(1.35);
}
.marker.active {
  background: var(--we-gold);
  border-color: var(--we-gold);
}
.progress-pct {
  position: fixed;
  top: var(--we-sp-4);
  left: var(--we-sp-5);
  z-index: 3;
  font-size: var(--we-fs-micro);
  color: var(--we-text-faint);
  letter-spacing: 0.08em;
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

.my-note-ro {
  border-left: 2px solid rgba(232, 200, 150, 0.5);
  padding: var(--we-sp-2) var(--we-sp-4);
  background: rgba(232, 200, 150, 0.06);
  border-radius: 0 var(--we-r-sm) var(--we-r-sm) 0;
}
.my-note-ro .we-caps-label {
  margin: 0;
}
.my-note-ro .note-text {
  margin: var(--we-sp-2) 0 0;
  font-size: var(--we-fs-body);
  line-height: 1.8;
  color: var(--we-text);
  white-space: pre-wrap;
}

.imm-similar {
  border-top: 1px solid var(--we-glass-border);
  padding-top: var(--we-sp-4);
}
.imm-similar .we-caps-label {
  margin: 0;
}
.sim-chips {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: var(--we-sp-2);
}
.sim-chip {
  appearance: none;
  border: none;
  background: none;
  display: flex;
  align-items: baseline;
  gap: var(--we-sp-2);
  padding: 6px 8px;
  border-radius: var(--we-r-sm);
  cursor: pointer;
  text-align: left;
  transition: background var(--we-dur-1) var(--we-ease-out);
}
.sim-chip:hover {
  background: rgba(232, 200, 150, 0.09);
}
.sim-chip .n {
  font-size: var(--we-fs-small);
  font-weight: 600;
  color: var(--we-text-hi);
}
.sim-chip .why {
  margin-left: auto;
  font-size: var(--we-fs-micro);
  color: var(--we-gold-strong);
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
