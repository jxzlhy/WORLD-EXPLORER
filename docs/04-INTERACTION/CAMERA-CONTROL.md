# 相机控制规范

> 实现在 `src/engine/camera-controller.ts`。这是「谁在什么时候拥有相机」的唯一权威文档。

## 控制权矩阵

| 场景 | 相机所有权 | 行为 |
| --- | --- | --- |
| 用户拖动/滚轮/捏合 | 用户 | 立即 `cancelFlight()`;自动旋转永久关闭(直到 UI 重开) |
| 程序飞行(flyTo) | 程序 | CUBIC_IN_OUT;用户输入即被中断,promise → `'interrupted'` |
| 自动旋转 | 程序(弱) | 仅:未交互 ∧ 未飞行 ∧ 高度>12,000km;0.008 rad/s 绕 Z |
| 面板滚动 | 无关 | 面板 DOM 在 canvas 之上,滚轮不穿透 |

## flyTo 语义

- `FlyTarget { longitude, latitude, height, duration? }`;duration 缺省由 Cesium 按距离决定。
- Promise 只 resolve 不 reject:`'arrived' | 'interrupted'`。
- 连续调用:内部 `flightSeq` 递增,旧飞行的回调放弃状态写入权;镜头一定以最后一次目标为准。
- 面板展开与飞行**并行**(面板 slide 260ms,飞行 3–6s),不打架:面板动画只做透明度+位移,不碰相机。

## 高度语义(V0.1 约定)

| 层级 | 高度 | 用途 |
| --- | --- | --- |
| 全球 | 20,800km | 初始/自动旋转 |
| 国家 | 9,500km | 国家面板飞行 |
| 城市 | 1,200km | 城市 chip 飞行 |
| 目的地 | 450km | 档案飞行 |
| 最小 | 50km | minimumZoomDistance(低于此无意义,贴图精度不足) |

## 已验证(真实浏览器)

- 随机探索 → 飞行 → ALT 450km ✓(截图)
- 搜索「长城」→ 飞行 → 面板 ✓
- 国家中枢面板打开 ✓(飞行复验待 RAF 恢复,见 SESSION-LOG)

## 已知环境注意事项

- WebKit 宿主窗口完全被遮挡时 RAF 暂停 → 渲染/飞行冻结,恢复可见后继续。属宿主行为;真机浏览器无此问题。
