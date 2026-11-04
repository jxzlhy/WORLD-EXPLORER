# 性能规则与预算表

> 指令 PART 6.4。所有数字为实测(V),环境:macOS arm64 / Node 25.9 / Vite 7.3。
> FPS 数据区分:真实 GPU(用户屏)与 Playwright headless(SwiftShader 软渲染,数值仅供参考下限)。

## 构建产物(V0.1 → V0.2 对照)

| 指标 | V0.1 | V0.2 | 变化 |
| --- | --- | --- | --- |
| 应用代码 chunk | 4.37MB(gzip 1.18MB,与 Cesium 混杂) | **143KB(gzip 53KB)** | 拆分 |
| Cesium chunk | 混入应用 | 4.25MB(gzip 1.13MB)独立缓存块 | 跨版本缓存友好 |
| vue 核心 chunk | 混入应用 | 108KB(gzip 42KB) | 拆分 |
| DesignLab(懒加载) | 4.6KB | 4.6KB(独立) | — |
| 构建耗时 | ~6s | ~5.5s | — |

## 运行时

| 指标 | 数值 | 环境 |
| --- | --- | --- |
| FPS(全球视角,自动旋转) | 107–120 | 真机 GPU,1440×900 |
| FPS(headless SwiftShader) | 2–7 | 软渲染,仅作冒烟基线 |
| 冷启→可交互(dev) | <5s | 5199 本地 |
| 昼夜合成(4096×2048 per-pixel) | ~200ms/次 | 5 分钟一次,不阻塞渲染线程关键帧 |
| Heap | 未纳入自动采集 | 列入 V0.3(Playwright CDP 可采) |

## 渲染质量策略(三档的实际语义)

| 档位 | 行为 |
| --- | --- |
| High(默认) | resolutionScale 1.0 + FXAA + 呼吸脉冲 |
| Low(左轨开关) | resolutionScale 0.7 + FXAA 关 + 脉冲保留(可后续降级) |
| Balanced | 未单列——当前 Low 已覆盖低端设备主诉求;若需要,在 uiStore 增加中间档(列入 V0.3) |

## 规则

1. 禁止通过放大 `chunkSizeWarningLimit` 解决体积问题——必须走 manualChunks 分包。
2. 新增持续动画必须在 reduced-motion 下有静态回退(参照选中脉冲实现)。
3. 高频 per-pixel 计算必须预计算行/列常量(参照 DayNightCompositor 的 cosH/sinLat 表)。
4. 每阶段报告必须附带本表更新;FPS 结论必须注明渲染环境。
