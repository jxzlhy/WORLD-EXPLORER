# 系统架构

> 六层架构(指令 PART 5.4),职责边界由目录结构物理隔离。

```
┌─────────────────────────────────────────────────────┐
│ 1 Experience Layer  views/ + components/explore/    │  页面、面板、搜索、导航
├─────────────────────────────────────────────────────┤
│ 2 Design System      styles/tokens.css + design-system/ │ Tokens + 基元组件
├─────────────────────────────────────────────────────┤
│ 3 Domain Layer       domain/types.ts + stores/      │ 国家/城市/目的地/收藏模型
├─────────────────────────────────────────────────────┤
│ 4 3D Runtime         engine/                        │ WorldEngine + 各图层控制器
├─────────────────────────────────────────────────────┤
│ 5 Data & Assets      public/data + public/textures + services/ │ 静态 JSON/影像/媒体
├─────────────────────────────────────────────────────┤
│ 6 Dev Infrastructure vite.config + eslint + docs + experiments │ 构建/规范/测试/文档
└─────────────────────────────────────────────────────┘
```

## 核心规则

1. **业务层不触碰 Viewer**:组件/Store 只调用 `IWorldEngine` 接口(`src/engine/types.ts`)。`engine-holder.ts` 是唯一实例出入口。
2. **单一动画所有权**:地理镜头动画只由 `CameraController` 驱动(Cesium 原生 flyTo);GSAP 只做 UI 编排;CSS 做 Transition。禁止多系统争抢同一状态。
3. **数据单向流**:用户输入 → Pinia action → 引擎命令 / 面板状态;引擎事件(pick/camera/stats)→ Store → 响应式 UI。
4. **外部服务零依赖起步**:所有数据静态化在 `public/data/`;运行时仅 NASA GIBS 一个免 key 公共服务(可降级)。

## 目录结构(实际)

```
src/
├── main.ts / App.vue / router/
├── views/            ExploreView(编排)· DesignLabView(设计实验页)
├── components/explore/ TopBar·SearchOverlay·LeftRail·DetailPanel·DiscoverBar·StatusBar·MyWorldPanel
├── design-system/    GlassPanel·WeButton·WeTag·WeSwitch·WeSpinner·WeEmpty·DestinationMedia
├── stores/           ui·explore·my-world
├── services/         data-service·storage-service
├── engine/           world-engine·camera-controller·imagery-layers·countries-layer·markers-layer·types·engine-holder
├── domain/           types.ts
└── styles/           tokens.css(单一事实来源)·base.css
public/
├── data/             manifest·countries·cities·destinations/*.json·media-samples
├── textures/         earth-blue-marble·earth-night·earth-topology
└── media/destinations/  已核验许可的真实照片
experiments/          一次性数据管线脚本(不入浏览器包)
docs/                 本文档体系
```

## 数据流(选中链路为例)

```
点击标记/搜索回车
  → engine.onPick / SearchOverlay
  → exploreStore.selectDestination(id)
      ├─ panel 状态 → DetailPanel 响应式展开
      └─ pendingFlight → ExploreView watcher → engine.flyTo()
            ├─ 用户拖动 → CameraController.handleUserInput → cancelFlight → 'interrupted'
            └─ 到达 → pendingFlight 清空
```

## 生命周期与销毁

- ExploreView `onUnmounted`:解绑全部事件 → `engine.destroy()`(dataSources 移除、viewer.destroy、handler.destroy)→ `setEngine(null)`。
- HMR 注意:引擎模块热更与页面 reload 撞车可能产生双挂载(开发态伪故障),QA 必须基于干净加载。
