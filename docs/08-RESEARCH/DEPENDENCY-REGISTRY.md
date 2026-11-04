# 依赖登记

> 规则:引入任何依赖前,核实版本与许可,记录理由。核验日期 2026-11-05。

## 运行时依赖

| 包 | 版本 | 许可 | 理由 |
| --- | --- | --- | --- |
| cesium | 1.147.0 | Apache-2.0 | 地球引擎核心(自含 TS 类型) |
| vue | 3.5.44 | MIT | UI 框架 |
| vue-router | 4.5.x | MIT | 路由(/ 与 /design) |
| pinia | 3.x | MIT | 状态管理 |
| gsap | 3.13.x | 标准许可(免费) | UI 动画编排 |
| fuse.js | 7.1.x | Apache-2.0 | 本地模糊搜索 |

## 开发依赖

| 包 | 版本 | 许可 | 理由 |
| --- | --- | --- | --- |
| vite | 7.3.7 | MIT | 构建工具 |
| @vitejs/plugin-vue | 6.x | MIT | Vue SFC 支持 |
| typescript / vue-tsc | 5.9.3 | Apache-2.0 | 类型检查 |
| vite-plugin-static-copy | 3.x | MIT | 复制 Cesium 静态资源 |
| eslint / typescript-eslint / eslint-plugin-vue | 9/8/10 | MIT | 代码规范 |
| prettier | 3.6.2 | MIT | 格式化 |
| @types/node | 24.x | MIT | Node 类型 |

## 运行时外部服务(非 npm 依赖,单独登记)

| 服务 | 协议 | key | 说明 |
| --- | --- | --- | --- |
| NASA GIBS WMTS | 免费公共服务 | 无 | 中低空影像瓦片,L8 封顶;失败自动降级本地贴图 |

## 明确不引入

- Cesium ion 相关服务(需 token/计费)。
- Google Photorealistic 3D Tiles(成本与服务条款约束)。
- OSM 公共瓦片作为常规底图(被指令点名不可当免费 CDN)。
