# CHANGELOG

All notable changes to WORLD EXPLORER are documented here.

## [Unreleased] — V1.5 前置批次(2026-11-05/06)

### Added
- **城市档案面板**:搜索/点击城市 → 名称+坐标+首都徽标+摘要+此地目的地列表(京都→伏见稻荷/清水寺),补全「国家→城市→目的地」链路中间层
- **类型筛选**:LeftRail 8 类彩色芯片 + 全选/清空;引擎层过滤(选中豁免、标签碰撞跳过隐藏实体);实测 67 显/33 隐
- **搜索别名**:20 条异译/通称(艾菲尔铁塔/金字塔/紫禁城/大本钟/兵马俑/艾尔斯岩…),Fuse 键权重重分配;5 断言单测
- 国家档案充实(面积/人口/语言/货币)+ 国情速览网格
- sunSubPoint 纯函数抽取 + 天文真值单测(分至点赤纬 ±0.3° 级)
- 单测扩至 27 个(数据校验器 15/太阳位置 7/搜索别名 5)

- **主题合集**:4 个策展合集(古文明的回声 14/地球的极限 10/冰与火之地 10/现代奇迹 10)+ 面板与发现栏入口

- **云层(V0.3-E 闭环)**:CC0 云图(Commons/GabrielGGD)+ 独立球壳 Primitive(+12km,西向缓移,懒加载默认关);NASA 直连与 turban 中转链均不可用,按红线改走 Commons CC0

- 目的地扩容 **100 → 112**:补齐博物馆薄弱类型(埃及博物馆/大都会/伦敦自然史/东京国立)+ 自然与岛屿(羚羊峡谷/鲨鱼湾/黄山/颐和园/巴列斯塔斯/恶魔岛/道顿堀/红海)

- 目的地 **112 → 130**(文化遗产密度批:丽江/土楼/金阁寺/镰仓大佛/加尔桥/马泰拉/哈德良长城/铁桥峡谷/圣凯瑟琳/高野山 + 拱门/布鲁克林桥/莫奈花园/汗哈利利/利马历史中心/宁格罗/教会山/皮拉沙丘)

### Fixed
- E2E 套件根因修复:多 worker 并发 SwiftShader WebGL 导致负载超时轮转失败——`workers: 1` 串行后 12/12 稳定;F 导出改页面内 blob 拦截校验(比下载事件更严格)

### Changed
- storage-service 导入补 .ts 扩展名(allowImportingTsExtensions,Node ESM 兼容)
- 全量验证:E2E 12/12 · 单测 27/27 · lint 0 错误 · build ✓

## [0.3.0] — 2026-11-05(V0.3 DEPTH PASS)

### Added
- 目的地扩容 **67 → 100**(原创中文内容 33 篇:西湖/武陵源/都江堰/首里城/库拉普/巨人之路/萨卡拉/白沙漠/邦格尔邦格尔/兰德曼纳劳卡…),城市底座 47 个
- Heap 内存回归 E2E 用例 I(CDP 强制 GC,5 轮引擎生命周期增长 <1.8x)
- 数据校验器单元测试(node:test 零依赖,15/15,P0 导入安全回归位)
- 渲染质量三档(高/均衡/低):高=原生+FXAA,均衡=0.85x+FXAA,低=0.7x
- DetailPanel 档案内容 GSAP 交错入场(reduced-motion 跳过,timeline 及时释放)
- tokens 新增交互玻璃/暗井四族,14 处硬编码 rgba 收敛归零

### Changed
- 测试超时按 SwiftShader 实测成本调整(全局 180s,F 用例 300s,下载等待 30s)
- E2E 套件 12/12 全绿;单测 15/15;vue-tsc/ESLint/build 全绿

## [0.2.0] — 2026-11-05(V0.2 QUALITY · IMMERSION · EXPERIENCE)

### Added
- 逐像素昼夜合成器:真实晨昏线(-12°~+3° smoothstep)+ 夜侧城市灯光,5 分钟自动重合成,失败回退
- Playwright E2E 体系:11 用例(启动/飞行/中断/连续目标/滚动隔离/MY WORLD/生命周期/响应式)全绿
- 数据运行时校验(零依赖):结构/坐标/关联/重复 ID/媒体降级,坏数据剔除并报告
- MY WORLD 导入安全:校验→预览→确认,拒绝未知 schema/类型错误/未知 ID(含回滚语义)
- 标签屏幕空间网格防碰撞(优先级:选中>S 级>遗产/地标>普通)
- 标记悬停放大 + pointer 光标;选中呼吸脉冲(reduced-motion 静态回退)
- 探索历史(最近 12)+ MY WORLD「最近探索」标签页;全球视角一键返回
- 移动端抽屉式控制面板;小屏底部重排(状态栏上移/按钮纵排)
- 引擎生命周期状态机(idle→initializing→ready→destroyed)+ 初始化失败重试
- 性能预算表(docs/05-ENGINEERING/PERFORMANCE-RULES.md)

### Changed
- Cesium 独立分包:应用代码 4.48MB→143KB(gzip 53KB)
- 相机交互:单击不再打断自动旋转,拖动阈值 6px;程序飞行抵达后停止自动旋转
- 国家中心跨日期变更线校正;TopBar 规划模块收纳为 PLANNED 单项
- 搜索键盘索引随结果集重置;ESLint 全仓 0 error

### Fixed
- Cesium credit 署名恢复展示(NASA/Natural Earth/GIBS 署名义务,P0)
- 初始化中途销毁的资源竞态;异步续体孤儿监听
- MY WORLD 导入可被脏数据覆盖的 P0 缺陷(E2E 捕获后修复)

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
