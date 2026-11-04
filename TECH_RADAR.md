# TECH RADAR

> 持续记录候选技术。状态:📜 研究 / 🧪 已实验 / ✅ 已引入 / ⛔ 不采用。更新:2026-11-05。

| 技术 | 官方 | 版本 | 许可 | 维护 | 适用场景 | 潜在价值 | 状态 | 已验证 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CesiumJS | cesium.com/platform/cesiumjs | 1.147 | Apache-2.0 | 活跃 | 地球引擎 | 核心 | ✅ | V |
| Vue 3 | vuejs.org | 3.5 | MIT | 活跃 | UI | 核心 | ✅ | V |
| Vite | vite.dev | 7.3 | MIT | 活跃 | 构建 | 核心 | ✅ | V |
| GSAP | gsap.com | 3.13 | 免费标准许可 | 活跃 | UI 动画 | 高 | ✅ | V |
| Fuse.js | fusejs.io | 7.1 | Apache-2.0 | 稳定 | 本地搜索 | 高 | ✅ | V |
| NASA GIBS WMTS | nasa-gibs.github.io | — | NASA 开放数据 | 官方 | 影像瓦片 | 高(免 key) | ✅ | R(渲染复验中) |
| AWS Terrain Tiles | registry.opendata.aws/terrain-tiles | — | 开放数据 | 稳定 | 3D 地形 | 高(替代 ion 地形) | 📜 | U |
| MapLibre GL | maplibre.org | 5.x | BSD-3 | 活跃 | 2.5D 地图 | 备胎 | ⛔(相机叙事弱) | O |
| three.js | threejs.org | r18x | MIT | 活跃 | 独立 3D 场景 | 中(按需) | 📜 | O |
| deck.gl | deck.gl | 9.x | MIT | 活跃 | 数据图层 | 中 | 📜 | U |
| Dexie | dexie.org | 4.x | Apache-2.0 | 活跃 | IndexedDB | 中(笔记/路线扩容时) | 📜 | O |
| vue-i18n | vue-i18n.intlify.dev | 11 | MIT | 活跃 | 多语言 | V2.0 再引 | 📜 | O |
| turf.js | turfjs.org | 7.x | MIT | 活跃 | 几何计算(国家中心) | 中 | 📜 | U |
| playwright | playwright.dev | 1.5x | Apache-2.0 | 活跃 | 自动化测试 | 高(V0.2) | 📜 | U |
| 3D Tiles / glTF 管线 | ogc.org / khronos.org | — | 开放标准 | — | 建筑/复原 | V2.5 再评估 | 📜 | U |

## 观察结论

- 「零 key、零付费」组合(NASA GIBS + Natural Earth + Commons)已被证实可行,是本项目最关键的技术路线。
- 地形是当前最大体验缺口;AWS Terrain Tiles 是首选免费方案,需在 V0.2 做 terrarium 解码原型。
- 测试三角:vue-tsc(类型)→ 构建(集成)→ Playwright(交互),V0.2 补齐最后一只脚。
