# Design Tokens 规范

> 单一事实来源:`src/styles/tokens.css`。组件内禁止私写颜色/字号/圆角/时长。
> 本文件是 tokens 的「目录与用法」;具体值以 CSS 文件为准(避免双源)。

## Token 分组

| 组 | 变量前缀 | 示例 |
| --- | --- | --- |
| 底色 | `--we-void/-bg/-bg-raised` | `--we-void: #030609` |
| 玻璃 | `--we-glass/-strong/-border/-highlight` | `--we-glass: rgba(10,17,31,.55)` |
| 文字阶 | `--we-text-hi/-text/-dim/-faint` | 四阶透明白灰 |
| 强调 | `--we-gold*`(Editorial)· `--we-cyan*`(Spatial) | 双强调色体系 |
| 语义 | `--we-success/-warning/-danger` | 状态专用 |
| 类型色 | `--we-type-*`(8 类) | 标记/标签圆点 |
| 字体 | `--we-serif/-sans/-mono` | 系统栈 |
| 字号/行高 | `--we-fs-*` / `--we-lh-*` | display 44 → micro 10 |
| 间距 | `--we-sp-1..10` | 4px 网格 |
| 圆角 | `--we-r-xs..full` | 6/10/14/20/胶囊 |
| 阴影/模糊 | `--we-shadow-panel/-pop` · `--we-blur*` | 玻璃质感 |
| 动效 | `--we-dur-1..4` · `--we-ease-out/-in-out` | 150/280/520/900ms |
| 层级 | `--we-z-globe..modal` | 0/10/20/30/40 |

## 用法规则

1. **玻璃面板**一律 `GlassPanel.vue`,不手写 backdrop-filter。
2. **圆点+标签**一律 `WeTag.vue`;分类色由 type 映射,不允许自定义随机色。
3. **caps 标签**(大写字距小标)用 `.we-caps-label` 工具类。
4. **动效时长**:微交互 dur-1,进出场 dur-2/3,开场 dur-4;禁止自造 300ms/700ms 之类散值。
5. `prefers-reduced-motion` 时 dur-1..4 全部归零(tokens 内置 media query)——组件无需单独处理。

## 验证

- `/design` 路由为设计实验页,包含全部 token 分组的真实渲染(色彩/字体/按钮/玻璃/状态组件)。
- 视觉走查清单:`docs/09-QUALITY/UI-REVIEW-CHECKLIST.md`
