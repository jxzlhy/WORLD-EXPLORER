# 组件规格

> 位置:`src/design-system/`。Headless 思路 + 自有皮肤;不照搬任何组件库外观。

## 基元清单(V0.1 已实现并用于主界面)

| 组件 | 职责 | 关键变体 |
| --- | --- | --- |
| `GlassPanel` | 玻璃容器基元 | `strong`(可滚动内容面板加重底) |
| `WeButton` | 唯一按钮 | variant: primary/spatial/glass/ghost/danger · size: sm/md/lg |
| `WeTag` | 分类标签(圆点+文本) | `type`(8 类地点色)或自定义文本 |
| `WeSwitch` | 开关 | v-model 布尔;role=switch |
| `WeSpinner` | 轨道加载 | size/label |
| `WeEmpty` | 空状态 | icon/title/hint |
| `DestinationMedia` | 目的地视觉 | verified 真图(带署名)/ placeholder 程序星图卡 |

## 新组件准入流程

1. 先查本表——能组合就不新建。
2. 新组件必须只用 tokens;新增 token 须先改 tokens.css 并同步 DESIGN-TOKENS.md。
3. 必须在 `/design` 实验页添加演示后,才允许在业务页使用。

## 业务组件(Experience Layer)

| 组件 | 职责 | 状态 |
| --- | --- | --- |
| TopBar | 品牌/导航/搜索入口 | 建设中模块以 disabled+title 诚实标注 |
| SearchOverlay | 全局搜索(键盘优先) | Teleport + Transition |
| LeftRail | 图层/昼夜/自动旋转/性能开关 | WeSwitch + segmented |
| DetailPanel | 国家/目的地档案(Editorial) | 双模式;内容分级揭示 |
| DiscoverBar | 今日精选/随机探索 | deterministic by date |
| StatusBar | 坐标/海拔/FPS/数据量 | 4Hz 更新 |
| MyWorldPanel | 收藏/想去/去过 + 导入导出 | localStorage v1 |
