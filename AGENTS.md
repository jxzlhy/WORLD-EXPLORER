# AGENTS.md — AI 开发代理规范

> 所有 AI 工具(ZCode、Claude Code、Cursor 等)在本仓库工作的最高行为规范。
> 参考:AUTOVERSE TECH LAB 工程体系(借鉴治理方法,不复制业务与视觉)。

## 0. 项目身份

WORLD EXPLORER —— 3D 交互式全球探索平台(Vue3 + CesiumJS,无 ion token 方案)。
产品总纲:docs/00-OVERVIEW/OVERNIGHT-AUTONOMOUS-DEVELOPMENT-DIRECTIVE.md。

## 1. 硬性禁令

1. **不得让业务代码直接操作 Cesium Viewer**。必须经 `IWorldEngine` 接口(engine/types.ts)。
2. **不得绕过 Design System**:颜色/字号/圆角/动效只能来自 `src/styles/tokens.css`;UI 不引入外部组件库整体皮肤。
3. **不得擅自引入依赖**:先核实版本/许可 → 更新 docs/08-RESEARCH/DEPENDENCY-REGISTRY.md。
4. **不得使用许可不明资源**(贴图/照片/模型/字体)。来源与许可必须登记 docs/07-DATA-AND-ASSETS/。
5. **不得编造**:版本号、API、性能数据、验证结果。没运行过的写「未验证」。
6. **不得提交**:`.env`、密钥、node_modules、构建产物、downloads/。
7. **不得付费/授权绕过**:遇到记录到待办,转做其他工作。
8. **不得 `git push --force`**;不得删除历史文档。

## 2. 必做流程

```
读规范 → 研究(记来源与日期)→ 小步实施 → 真实验证(浏览器/构建)
→ 更新文档(实现/未实现/已知问题)→ git diff 自查 → 规范 commit → 阶段交接
```

## 3. 证据分级(沿用 AUTOVERSE 体系)

| 等级 | 含义 |
| --- | --- |
| V | 真实运行验证(附环境说明) |
| R | 基于官方资料研究核实 |
| O | 经验判断 |
| U | 未核实 |

文档中所有结论必须可归属到其中一级。

## 4. 工程约定

- TypeScript strict;新代码零 `any`(ESLint 强制)。
- 文件 kebab-case;组件 PascalCase 单文件。
- 3D Runtime 与业务 UI 解耦;通信只走接口与 store。
- 资源生命周期:引擎/事件/GSAP timeline 在 onUnmounted 释放(见 docs/05-ENGINEERING/RESOURCE-LIFECYCLE.md)。
- commit 格式:`feat|fix|perf|docs|test|refactor|chore: 一句话说明`。

## 5. 阻塞与上报

需要登录/付费/法律判断/与规范冲突且无先例 → 停该项、记入当前阶段报告「待项目所有者处理」,继续其他工作。

## 6. 快速自检

```
[ ] 我改的范围在授权内吗?
[ ] 新依赖有登记吗?
[ ] 「已验证」是真运行过吗?(附 FPS/控制台/截图证据)
[ ] git diff 无敏感信息/产物吗?
[ ] 文档(实现/未实现/问题/下一步)更新了吗?
```
