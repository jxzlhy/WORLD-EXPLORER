# CHANGELOG

All notable changes to WORLD EXPLORER are documented here.

## [0.1.0] — 2026-11-05(通宵自主执行首夜)

### Added
- CesiumJS 无 ion 地球引擎(WorldEngine 接口 + 相机控制器 + 昼夜混合 + 边界层 + 标记层)
- Vue 3 + Pinia + Router + GSAP 应用骨架;六层架构目录
- Design System:tokens.css 单一事实来源 + 7 个基元组件 + `/design` 实验页
- 主界面:TopBar / SearchOverlay(⌘K)/ LeftRail / DetailPanel(Editorial)/ DiscoverBar / StatusBar / MyWorldPanel
- 数据管线:manifest + 10 国 + 28 城 + 67 目的地(原创中文内容,含故事与来源)
- 媒体管线:Wikimedia Commons 10 张真实照片(逐张许可核验 + 自动署名)
- MY WORLD:收藏/想去/去过 + 笔记存储接口 + JSON 导入导出
- 文档体系:架构/设计/交互/工程/数据/许可/研究/交接 8 大类
- 相机飞行中断(用户输入优先)、自动旋转、FPS 与坐标状态栏
- NASA GIBS 瓦片层(中低空清晰度,失败降级)

### Fixed
- cities.json 六处 JSON 键序错误(构建期发现并修复)
- 数据文本混排英文残留 9 处(自动扫描 + 修复)
- TypeScript 严格模式 5 组错误(类型检查零错误通过)

### Known Issues
- 中低空贴图在 GIBS 不可达时仍为单张贴图(降级路径,精度受限)
- 标签在密集区域可能重叠(防碰撞列入 V0.2)
- 昼夜混合为整层近似(逐像素混合列入 V0.2)
- 宿主窗口完全遮挡时 requestAnimationFrame 暂停(WebKit 行为,恢复可见即续)
