<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import GlassPanel from '../design-system/GlassPanel.vue'
import WeButton from '../design-system/WeButton.vue'
import WeTag from '../design-system/WeTag.vue'
import WeSwitch from '../design-system/WeSwitch.vue'
import WeSpinner from '../design-system/WeSpinner.vue'
import WeEmpty from '../design-system/WeEmpty.vue'
import DestinationMedia from '../design-system/DestinationMedia.vue'

const switchDemo = ref(true)
const switchDemo2 = ref(false)
</script>

<template>
  <div class="design-lab">
    <header class="lab-head">
      <div>
        <p class="we-caps-label gold">
          WORLD EXPLORER · DESIGN LAB
        </p>
        <h1>设计系统实验页</h1>
        <p class="sub">
          Tokens 单一事实来源:<code>src/styles/tokens.css</code> · 本页验证组件与规范的真实渲染效果
        </p>
      </div>
      <RouterLink
        class="back"
        to="/"
      >← 返回地球</RouterLink>
    </header>

    <main class="lab-body">
      <!-- 色彩 -->
      <section>
        <h2>01 · 色彩系统</h2>
        <div class="swatches">
          <div
            v-for="c in [
              ['--we-void', '虚空'], ['--we-bg', '底色'], ['--we-bg-raised', '浮层'],
              ['--we-gold', '探索金'], ['--we-gold-deep', '深金'], ['--we-cyan', '空间青'],
              ['--we-type-natural', '自然绿'], ['--we-type-island', '海岛青'],
              ['--we-type-geology', '地质赭'], ['--we-success', '成功'], ['--we-warning', '警示'], ['--we-danger', '危险'],
            ] as const"
            :key="c[0]"
            class="swatch"
          >
            <i :style="{ background: `var(${c[0]})` }" />
            <span>{{ c[1] }}</span>
            <code>{{ c[0] }}</code>
          </div>
        </div>
      </section>

      <!-- 字体 -->
      <section>
        <h2>02 · 字体与排版</h2>
        <GlassPanel class="specimen">
          <p class="display">
            五洲四海,皆可抵达
          </p>
          <p class="en-display">
            EXPLORE THE WORLD · DISCOVER ITS STORIES
          </p>
          <p class="body-text">
            正文使用系统无衬线(PingFang SC / SF Pro)。大标题使用宋体衬线,营造数字博物馆的编辑气质;
            坐标与数据使用等宽字体,强调地理与仪器感。
          </p>
          <p class="mono-line mono">
            31.2304° N · 121.4737° E · ALT 408 KM
          </p>
        </GlassPanel>
      </section>

      <!-- 按钮 -->
      <section>
        <h2>03 · 按钮(WeButton)</h2>
        <GlassPanel class="row-panel">
          <div class="row">
            <WeButton variant="primary">
              主行动
            </WeButton>
            <WeButton variant="spatial">
              空间行动
            </WeButton>
            <WeButton variant="glass">
              玻璃
            </WeButton>
            <WeButton variant="ghost">
              幽灵
            </WeButton>
            <WeButton variant="danger">
              危险
            </WeButton>
            <WeButton
              variant="primary"
              disabled
            >
              禁用
            </WeButton>
          </div>
          <div class="row">
            <WeButton
              size="sm"
              variant="glass"
            >
              Small
            </WeButton>
            <WeButton
              size="md"
              variant="glass"
            >
              Medium
            </WeButton>
            <WeButton
              size="lg"
              variant="primary"
            >
              Large
            </WeButton>
          </div>
        </GlassPanel>
      </section>

      <!-- 玻璃与标签 -->
      <section>
        <h2>04 · 玻璃面板 / 标签 / 开关</h2>
        <div class="grid-2">
          <GlassPanel class="row-panel">
            <div class="row wrap">
              <WeTag type="heritage" />
              <WeTag type="natural" />
              <WeTag type="landmark" />
              <WeTag type="geology" />
              <WeTag type="island" />
              <WeTag>自定义标签</WeTag>
            </div>
            <div class="row">
              <label class="switch-row">
                <span>图层开关演示</span>
                <WeSwitch v-model="switchDemo" />
              </label>
              <label class="switch-row">
                <span>关闭态</span>
                <WeSwitch v-model="switchDemo2" />
              </label>
            </div>
          </GlassPanel>
          <div class="glass-compare">
            <GlassPanel class="mini">
              标准玻璃(glass)
            </GlassPanel>
            <GlassPanel
              strong
              class="mini"
            >
              强化玻璃(strong)
            </GlassPanel>
          </div>
        </div>
      </section>

      <!-- 状态组件 -->
      <section>
        <h2>05 · 加载 / 空状态 / 媒体卡</h2>
        <div class="grid-3">
          <GlassPanel class="center-panel">
            <WeSpinner label="轨道加载" />
          </GlassPanel>
          <GlassPanel class="center-panel">
            <WeEmpty
              title="暂无收藏"
              hint="去地球各处点亮 ♡"
            />
          </GlassPanel>
          <GlassPanel class="center-panel pad">
            <DestinationMedia
              id="demo-great-wall"
              name="万里长城"
              type-color="var(--we-type-heritage)"
            />
          </GlassPanel>
        </div>
      </section>

      <footer class="lab-foot">
        <p>规范文档:docs/03-DESIGN-SYSTEM/ · 变更须经 Design System 治理流程</p>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.design-lab {
  height: 100%;
  overflow-y: auto;
  background:
    radial-gradient(1200px 600px at 80% -10%, rgba(62, 143, 214, 0.08), transparent),
    radial-gradient(900px 500px at 10% 110%, rgba(232, 200, 150, 0.06), transparent),
    var(--we-void);
  padding: var(--we-sp-8) var(--we-sp-6);
  overflow-x: hidden;
}
.lab-head {
  max-width: 1080px;
  margin: 0 auto var(--we-sp-8);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--we-sp-4);
}
.lab-head p {
  margin: 0;
}
.lab-head h1 {
  font-family: var(--we-serif);
  font-size: 34px;
  color: var(--we-text-hi);
  margin: 6px 0;
}
.sub {
  color: var(--we-text-faint);
  font-size: var(--we-fs-small);
}
.sub code {
  color: var(--we-text-dim);
}
.back {
  color: var(--we-text-dim);
  font-size: var(--we-fs-small);
  border: 1px solid var(--we-glass-border);
  border-radius: var(--we-r-full);
  padding: 8px 16px;
  white-space: nowrap;
}
.back:hover {
  color: var(--we-text-hi);
  text-decoration: none;
  border-color: rgba(111, 195, 255, 0.4);
}

.lab-body {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--we-sp-8);
  padding-bottom: 80px;
}
section h2 {
  font-size: var(--we-fs-h2);
  color: var(--we-text-hi);
  margin: 0 0 var(--we-sp-4);
  font-weight: 600;
}
section h2::before {
  content: '· ';
  color: var(--we-gold);
}

.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--we-sp-3);
}
.swatch {
  display: flex;
  flex-direction: column;
  gap: 3px;
  border: 1px solid var(--we-glass-border);
  border-radius: var(--we-r-sm);
  overflow: hidden;
  background: var(--we-well);
}
.swatch i {
  height: 44px;
  display: block;
  border-bottom: 1px solid var(--we-glass-border);
}
.swatch span {
  font-size: var(--we-fs-small);
  color: var(--we-text);
  padding: 6px 10px 0;
}
.swatch code {
  font-size: 9px;
  color: var(--we-text-faint);
  padding: 0 10px 8px;
}

.specimen {
  padding: var(--we-sp-6);
  display: flex;
  flex-direction: column;
  gap: var(--we-sp-3);
}
.display {
  margin: 0;
  font-family: var(--we-serif);
  font-size: 36px;
  color: var(--we-text-hi);
}
.en-display {
  margin: 0;
  letter-spacing: var(--we-ls-caps);
  font-size: 11px;
  color: var(--we-gold);
}
.body-text {
  margin: 0;
  color: var(--we-text);
  line-height: var(--we-lh-loose);
  max-width: 640px;
}
.mono-line {
  margin: 0;
  color: var(--we-cyan);
}

.row-panel {
  padding: var(--we-sp-5);
  display: flex;
  flex-direction: column;
  gap: var(--we-sp-4);
}
.row {
  display: flex;
  align-items: center;
  gap: var(--we-sp-3);
}
.row.wrap {
  flex-wrap: wrap;
}
.switch-row {
  display: flex;
  align-items: center;
  gap: var(--we-sp-3);
  color: var(--we-text);
  font-size: var(--we-fs-small);
}

.grid-2 {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: var(--we-sp-4);
}
.glass-compare {
  display: flex;
  flex-direction: column;
  gap: var(--we-sp-3);
}
.mini {
  padding: var(--we-sp-4);
  color: var(--we-text-dim);
  font-size: var(--we-fs-small);
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--we-sp-4);
}
.center-panel {
  padding: var(--we-sp-5);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
}
.center-panel.pad {
  padding: var(--we-sp-4);
}

.lab-foot {
  text-align: center;
  color: var(--we-text-faint);
  font-size: var(--we-fs-micro);
  letter-spacing: 0.1em;
}

@media (max-width: 900px) {
  .grid-2,
  .grid-3 {
    grid-template-columns: 1fr;
  }
}
</style>
