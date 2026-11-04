# 资源生命周期规范

> 指令 PART 10.2。目标:反复进出 3D 场景内存不增长。

## 必须释放的资源 → 释放位置

| 资源 | 创建处 | 释放 |
| --- | --- | --- |
| Cesium Viewer | WorldEngine.doInitialize | `destroy()` → `viewer.destroy()` |
| GeoJson/CustomDataSource | CountriesLayer/MarkersLayer | `dataSources.remove(ds, true)` |
| ScreenSpaceEventHandler(×2) | CameraController / world-engine | `handler.destroy()` |
| preRender 监听 | CameraController | 保存 remove 回调并调用 |
| 事件订阅(pick/camera/stats) | world-engine | unsubs 数组统一退订 |
| GSAP timeline | ExploreView 开场 | 一次性自毁(无持久句柄);新增 timeline 需 kill() |
| RAF/定时器 | 无常驻 | — |
| localStorage | storage-service | 命名空间 `world-explorer:v1:*` |

## 验证要求

- 进入 ExploreView → 返回 → 再进入(开发态路由切换)后,`viewer` 不残留:`window.__WE_VIEWER__` 为 null。
- Chrome DevTools Memory:两次进出场景 heap 不阶梯上升(列入 V0.2 Playwright 用例)。

## 现状声明

V0.1 单页常驻场景(无路由级反复挂载),生命周期路径已实现并有 destroy 全链;反复进出测试在路由多页化后执行。
