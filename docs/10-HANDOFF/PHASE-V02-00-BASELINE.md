# V0.2 基线审查报告(Phase 00)

> 时间:2026-11-05 02:35+ · 方式:代码重读 + 实测复核(不信任 V0.1 报告声明)

## 复核结论(V,实测)

| 项 | 结果 |
| --- | --- |
| 代码完整性 | 33 源文件在位,git 工作树干净(main = origin/main) |
| typecheck / build | 零错误 / 5.8–6.4s 成功 |
| dev server | 200(5188) |
| 运行时 | 数据 67 条加载,canvas ×1,无错误遮罩 |
| 宿主 RAF | 再次暂停(窗口遮挡)→ 确认「无头 Playwright」为本阶段测试基建的必要性 |

## 问题清单(编号制,贯穿 V0.2)

| # | 位置 | 问题 | 风险 | 状态 |
| --- | --- | --- | --- | --- |
| I-01 | world-engine.ts | initialize 无生命周期状态机;初始化中途 destroy 会留下半初始化 Viewer/图层;失败后不可重试 | P0 高 | 修复中(P2-01) |
| I-02 | ExploreView.vue | onMounted 异步续体中创建 watcher/引擎;卸载竞态可产生孤儿监听 | P0 高 | 修复中(P2-01) |
| I-03 | base.css | 全局隐藏 .cesium-widget-credits,违背数据源署名义务 | P0 高 | 修复中(P2-01) |
| I-04 | ExploreView.vue | 引擎初始化失败后无重试入口 | P0 中 | 修复中(P2-01) |
| I-05 | imagery-layers.ts | 昼夜整层近似,晨昏线非逐像素 | P1 | P2-03 实现合成器 |
| I-06 | markers-layer | 无屏幕空间标签防碰撞;无 hover;无选中脉冲 | P1 | P2-04 |
| I-07 | explore-store | 国家中心=经纬度算术平均,跨日期变更线国家会出错 | P1 中 | P2-04 |
| I-08 | camera-controller | 单击(LEFT_DOWN)即关闭自动旋转,体验过激 | P1 中 | P2-04 |
| I-09 | data-service | 运行时 JSON 无结构校验(仅 TS 断言) | P1 高 | P2-05 |
| I-10 | my-world-store | 导入无校验/预览/回滚,可能破坏本地数据 | P1 高 | P2-05 |
| I-11 | vite.config | Cesium 未分包,主 chunk 4.37MB | P1 中 | P2-06 |
| I-12 | TopBar | 5 个 disabled 导航按钮易被误认为失效 | P2 | P2-07 |
| I-13 | SearchOverlay | results 变化时 activeIndex 不重置(空结果回车越界);无焦点陷阱 | P2 | P2-07 |
| I-14 | 移动端 | LeftRail 固定占位,与 DiscoverBar 可能重叠;无折叠 | P2 | P2-08 |
| I-15 | tokens | 组件内存在绕过 tokens 的 rgba 硬编码(玻璃深色/悬停底) | P2 | P2-07 收敛 |
| I-16 | 全局 | 无自动化 E2E(宿主 RAF 限制下人工验证不可复现) | P1 高 | P2-02 |

## 性能基线(V0.1 → V0.2 对照用)

| 指标 | V0.1 基线 |
| --- | --- |
| 主 chunk | 4.37MB(gzip 1.18MB) |
| build | ~6s |
| FPS @1440×900 | 107–120(可见时) |
| 冷启→可交互 | <5s(dev) |
| Heap | 未记录(V0.2 Playwright 补) |

## 执行顺序

P0( I-01~04 )→ 测试基建(I-16)→ 视觉(I-05)→ 交互(I-06~08)→ 数据(I-09~10)→ 性能(I-11)→ UX(I-12~15)→ 响应式 → QA。
