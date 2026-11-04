# 技术研究报告(PHASE 01)

> 证据等级标注:V=实测验证 / R=研究核实 / O=经验判断 / U=未核实
> 核验日期:2026-11-05

## 1. CesiumJS 1.147.0 — 核心地球引擎 [V]

- 许可:Apache-2.0(开源,免费商用)。npm 包内置 TS 类型(`Source/Cesium.d.ts`)。
- **无 ion 方案(本项目关键决策)**:`new Viewer(el, { baseLayer: false })` 可完全脱离 Cesium ion 运行 [V]。影像栈:
  - NASA Blue Marble 单张贴图(本地,4096×2048,Public Domain)
  - NASA GIBS `BlueMarble_ShadedRelief_Bathymetry` WMTS 瓦片(500m,免 key,L8 封顶)[V 已接入,渲染待复验]
  - NASA Black Marble 夜间灯光单张贴图(本地)
- 地形:V0.1 使用椭球(不接地形)。理由:Cesium World Terrain 依赖 ion token(违反成本红线);免费替代(AWS Terrain Tiles terrarium)登记为后续选项。
- 静态资源:经 `vite-plugin-static-copy` 复制 Workers/Assets/Widgets/ThirdParty 到 `/cesium/`,`CESIUM_BASE_URL` 双通道注入(Vite `define` + index.html 全局)[V]。
- 已知问题:
  - WebKit 宿主窗口被遮挡时 requestAnimationFrame 暂停,飞行/渲染随之暂停(环境行为,非引擎缺陷)[V]
  - `SingleTileImageryProvider` 需用 `fromUrl()` 异步构造(1.104+ 变更)[V]

## 2. Vue 3.5 + Vite 7 + TS strict [V]

- `vue-tsc --noEmit` 全仓零错误(67 条数据 + 引擎 + UI 全量)[V]。
- Cesium 体积:主 chunk 4.37MB(gzip 1.18MB)[V]。定位为「引擎成本」,后续可研究 CDN 外置或按需切分。
- Pinia 3 store 通信 + 引擎接口隔离,无直接 Viewer 访问 [V]。

## 3. GSAP 与 Cesium 相机协作 [V]

- 决策:地理镜头动画只走 Cesium 原生 `camera.flyTo`(complete/cancel 回调),GSAP 仅用于 UI 编排。单一动画所有权,符合指令 7.1。
- 中断:自管 ScreenSpaceEventHandler(LEFT_DOWN/MIDDLE_DOWN/RIGHT_DOWN/WHEEL/PINCH_START)→ `camera.cancelFlight()` [V 设计,待复验]。

## 4. 昼夜系统 [V 设计]

- `globe.enableLighting = true` + Simon1994PlanetaryPositions 日下点计算 → 夜灯层 alpha 按视点角距渐变。
- **近似实现声明**:晨昏线附近为整层渐变,非逐像素混合;逐像素需自定义 Globe Surface Shader,登记为 V0.2 优化。

## 5. 影像与数据来源 [R]

| 来源 | 许可 | 用途 | 核验 |
| --- | --- | --- | --- |
| NASA Earth Observatory(Blue/Black Marble,经 three-globe 打包分发) | Public Domain | 全球贴图 | 2026-11-05 |
| NASA EOSDIS GIBS | 免费公共服务(使用政策见 DATA-SOURCES) | 中低空瓦片 | 2026-11-05 |
| Natural Earth 110m | Public Domain | 国界 GeoJSON(177 国) | 2026-11-05 |
| Wikimedia Commons | 逐张核验(CC0/PD/CC BY/CC BY-SA) | 首批 10 张真实照片 | 2026-11-05 |

## 6. 替代方案备忘 [O]

- **MapLibre GL + 自绘**:更轻,但 3D 相机/地形生态弱于 Cesium,放弃。
- **Three.js 自研地球**:可控性强,但地理投影/瓦片/相机全部自研成本过高;保留 Three.js 仅用于未来独立装饰场景。
- **DECK.GL**:地理可视化强,但相机叙事体验不如 Cesium camera 系统。

## 7. 结论

技术基线(Vue3+Vite+TS+Cesium+GSAP+Pinia)经实测成立;无 ion 方案使项目零密钥、零付费、可离线演示。
