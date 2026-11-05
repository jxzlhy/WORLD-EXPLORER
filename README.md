# WORLD EXPLORER · 世界探索计划

> **Explore the World. Discover Its Stories.**
> 3D 交互式全球探索平台 — 从太空到国家、城市、景点,再到地点背后的故事。

![status](https://img.shields.io/badge/version-0.1.0-blue) ![engine](https://img.shields.io/badge/globe-CesiumJS%201.147-informational) ![license-mixed](https://img.shields.io/badge/assets-license--audited-success)

## 这是什么

一个运行在浏览器里的数字地球:

- 真实 NASA 贴图 + 实时昼夜晨昏线 + 城市灯光(无需任何 API key)
- 177 国边界点选 + **100 个精选目的地档案**(10 国,原创中文故事/历史背景/推荐季节,零许可风险图片策略)
- 镜头飞行叙事:点击地点 → 相机电影式抵达 → 编辑部级档案面板展开
- 全局搜索(中英文)、收藏/想去/去过、数据导入导出
- 设计系统实验页(`/design`)

## 快速开始

```bash
pnpm install
pnpm dev        # http://localhost:5188
pnpm build      # 类型检查 + 生产构建
```

## 技术栈

Vue 3.5 · TypeScript strict · Vite 7 · CesiumJS 1.147(无 ion token 方案)· GSAP · Pinia · Fuse.js

## 核心体验链路

**打开 → 看到地球 → 选择国家 → 进入城市 → 点击景点 → 镜头飞行 → 阅读地点故事 → 收藏地点**

## 文档

| 主题 | 入口 |
| --- | --- |
| 总任务书(本次执行原文) | [docs/00-OVERVIEW/OVERNIGHT-AUTONOMOUS-DEVELOPMENT-DIRECTIVE.md](docs/00-OVERVIEW/OVERNIGHT-AUTONOMOUS-DEVELOPMENT-DIRECTIVE.md) |
| 系统架构 / WorldEngine | docs/02-ARCHITECTURE/ |
| 设计系统 | docs/03-DESIGN-SYSTEM/(实验页:`/design`) |
| 相机与交互 | docs/04-INTERACTION/CAMERA-CONTROL.md |
| 数据与许可 | docs/07-DATA-AND-ASSETS/(逐张媒体核验记录) |
| 技术研究与依赖登记 | docs/08-RESEARCH/ |
| 交接与阶段报告 | docs/10-HANDOFF/ |

## 数据与许可声明

- 全球贴图/边界:NASA(Public Domain)、Natural Earth(Public Domain)
- 运行时瓦片:NASA GIBS 免费公共服务(离线自动降级)
- 照片:Wikimedia Commons,逐张核验许可(CC0/PD/CC BY/CC BY-SA),应用内自动署名,权威记录见 `public/data/media-samples.json`
- 文本:原创撰写,事实参考来源标注于每条档案 `sources[]`

## 当前状态

见 [docs/10-HANDOFF/OVERNIGHT-FINAL-REPORT.md](docs/10-HANDOFF/OVERNIGHT-FINAL-REPORT.md) 与 [ROADMAP.md](ROADMAP.md)。V0.1 为通宵自主执行的首个可运行里程碑。
