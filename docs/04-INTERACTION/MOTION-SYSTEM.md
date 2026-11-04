# 动效系统

> 原则:一个状态只有一个动画所有者(指令 7.1)。

## 职责划分(实际实现)

| 系统 | 负责域 | 禁区 |
| --- | --- | --- |
| Cesium Camera | 地理镜头(flyTo/自动旋转) | UI 元素 |
| GSAP | 开场序列(intro-item 交错入场) | 相机、面板状态 |
| Vue Transition | 面板/遮罩进出场(CSS) | 相机 |
| CSS tokens 动效 | 微交互(hover/active/开关) | 相机 |

## 核心编排(选中目的地)

1. 点击标记/搜索 → panel 状态即变(面板 260ms 滑入)
2. pendingFlight → flyTo(CUBIC_IN_OUT,3–6s)
3. 内容分级揭示:媒体→标题→导语→故事(CSS 顺序,无 JS 交错)
4. 用户输入随时中断飞行,面板不回弹(内容先行,镜头随后到)

## 微交互曲线

- 入场 `--we-ease-out`(power3 类);退场更快(dur-2 vs dur-3)。
- 悬停位移 ≤2px,按压 scale 0.97。
- `prefers-reduced-motion`:dur 全归零(tokens media query),自动旋转与开场关闭(ExploreView 判定)。

## 待办(V0.2)

- 档案内容 JS 分级交错(GSAP stagger)——现为 CSS 顺序,效果达标但可更细腻。
- 目的地抵达时的标记脉冲(ShaderMaterial 或 CSS overlay)。
